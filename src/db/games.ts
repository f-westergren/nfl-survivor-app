import { db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

type Game = {
  home: string;
  away: string;
  winner: string | null;
};

// Save weekly games
export async function setWeeklyGames(
  season: number,
  week: number,
  games: Game[]
) {
  await setDoc(doc(db, "games", `season-${season}-week-${week}`), {
    season,
    week,
    games,
  });
}

// Fetch games for a specific week
export async function getWeeklyGames(season: number, week: number) {
  const docRef = doc(db, "games", `season-${season}-week-${week}`);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) return docSnap.data();
  return null;
}
