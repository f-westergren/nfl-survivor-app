/* eslint-disable @typescript-eslint/no-explicit-any */
import fetch from "node-fetch";
import { readFile } from "fs/promises";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

const YEAR = 2025;

// Load the service account JSON dynamically
const serviceAccount = JSON.parse(
  await readFile(new URL("./serviceAccount.json", import.meta.url), "utf-8")
);

// Initialize Firebase
initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

// We only include Sunday and Monday games for each week
async function populateWeeksFromESPN(weekNum: number) {
  const url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?seasontype=2&week=${weekNum}&dates=${YEAR}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ESPN API failed: ${res.statusText}`);
  const data = await res.json();

  const games = data.events
    .map((event: any) => {
      const competitors = event.competitions[0].competitors;
      return {
        id: event.id,
        home: competitors.find((c: any) => c.homeAway === "home")?.team
          .shortDisplayName,
        away: competitors.find((c: any) => c.homeAway === "away")?.team
          .shortDisplayName,
        startTime: event.competitions[0].date,
      };
    })
    .filter((game: any) => {
      const day = new Date(game.startTime).getDay();
      return day >= 0 && day <= 2; // Sunday (0), Monday (1), and Tuesday (2) only
    });

  const firstSundayGame = games
    .filter((game: any) => new Date(game.startTime).getDay() === 0) // Sunday = 0
    .reduce((a: any, b: any) =>
      new Date(a.startTime) < new Date(b.startTime) ? a : b
    );

  await db
    .collection("weeks")
    .doc(`week_${weekNum}`)
    .set(
      {
        week: weekNum,
        firstGameStartTime: Timestamp.fromDate(
          new Date(firstSundayGame.startTime)
        ),
        games,
      },
      { merge: true }
    );

  console.log(`✅ Week ${weekNum} saved with ${games.length} games`);
}

(async () => {
  for (let w = 1; w <= 18; w++) {
    try {
      await populateWeeksFromESPN(w);
    } catch (err) {
      console.error(`❌ Failed to populate week ${w}:`, err);
    }
    await new Promise((r) => setTimeout(r, 500)); // small delay to be polite
  }
})();
