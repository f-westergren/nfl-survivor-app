import { readFile } from "fs/promises";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import admin from "firebase-admin";

// Load the service account JSON dynamically
const serviceAccount = JSON.parse(
	await readFile(new URL("./serviceAccount.json", import.meta.url), "utf-8")
);

// Initialize Firebase
initializeApp({
	credential: cert(serviceAccount),
});

const db = getFirestore();

async function main() {
	const weeksSnap = await db.collection("weeks").get();
	const batch = db.batch();

	weeksSnap.forEach((weekDoc) => {
		const data = weekDoc.data();
		const games = data.games;
		if (!Array.isArray(games) || games.length === 0) return;

		// Convert startTime to Date
		const startTimes = games
			.map((g) =>
				g.startTime instanceof admin.firestore.Timestamp
					? g.startTime.toDate()
					: new Date(g.startTime)
			)
			.filter((d) => !isNaN(d.getTime()));

		if (startTimes.length === 0) return;

		// Find the latest start time
		const latestStart = new Date(
			Math.max(...startTimes.map((d) => d.getTime()))
		);

		// Add 4 hours
		const endTime = new Date(latestStart.getTime() + 4 * 60 * 60 * 1000);

		batch.update(weekDoc.ref, {
			lastGameEndTime: admin.firestore.Timestamp.fromDate(endTime),
		});

		console.log(
			`Week ${data.week}: lastGameEndTime -> ${endTime.toISOString()}`
		);
	});

	await batch.commit();
	console.log("All week documents updated with lastGameEndTime.");
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
