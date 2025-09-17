/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { setGlobalOptions } from "firebase-functions";
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as dotenv from "dotenv";
import fetch from "node-fetch";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

dotenv.config();

admin.initializeApp();
const db = admin.firestore();

export const updateWeekResults = functions.https.onRequest(async (req, res) => {
	try {
		// ---- Security check ----
		const key = req.query.key || req.headers["x-scheduler-key"];
		if (key !== process.env.SCHEDULER_KEY) {
			res.status(403).send("Forbidden: Invalid key");
		}

		console.log("Authorized scheduler request");

		const now = admin.firestore.Timestamp.now();

		const weeksSnap = await db
			.collection("weeks")
			.where("lastGameEndTime", "<=", now)
			.where("resultsUpdated", "==", false)
			.get();

		if (weeksSnap.empty) {
			console.log("No weeks to process.");
			res.status(200).send("No weeks to process.");
			return; // stop execution
		}

		for (const weekDoc of weeksSnap.docs) {
			const weekData = weekDoc.data();
			const weekNumber = weekData.week;

			console.log(`Processing week ${weekNumber}...`);

			const espnUrl = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?week=${weekNumber}`;
			const resp = await fetch(espnUrl);
			const data = await resp.json();

			const winningTeams = data.events
				.map((event: any) => {
					const comp = event.competitions[0].competitors.find(
						(c: any) => c.winner
					);
					return comp ? comp.team.shortDisplayName : null;
				})
				.filter(Boolean);

			await weekDoc.ref.update({
				winningTeams,
				resultsUpdated: true,
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			});

			const picksSnap = await db
				.collection("picks")
				.where("week", "==", weekNumber)
				.get();

			const batch = db.batch();
			picksSnap.forEach((pickDoc) => {
				const pickData = pickDoc.data();
				const status = winningTeams.includes(pickData.pick)
					? "win"
					: "loss";
				batch.update(pickDoc.ref, { status });
			});

			await batch.commit();
			console.log(`Week ${weekNumber} picks updated.`);
		}

		res.status(200).send("Week results updated successfully.");
		return; // <-- ensures the async function resolves to void
	} catch (err) {
		console.error("Error updating week results:", err);
		res.status(500).send("Error updating week results");
		return; // <-- ensures the async function resolves to void
	}
});
