/**
 * migrate-users.js
 * Removes `leagues` field and adds `eliminatedWeek: null` to every user doc.
 */

import { readFile } from "node:fs/promises";
import admin from "firebase-admin";

// Replace with the path to your service account key
const serviceAccount = JSON.parse(
  await readFile(new URL("./serviceAccount.json", import.meta.url), "utf-8")
);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function migrate() {
  const usersRef = db.collection("users");
  const snapshot = await usersRef.get();

  const batchSize = 500; // Firestore batch limit
  let batch = db.batch();
  let count = 0;

  for (const doc of snapshot.docs) {
    const ref = doc.ref;
    batch.update(ref, {
      eliminatedWeek: 0,
    });

    count++;
    // Commit every 500 writes
    if (count % batchSize === 0) {
      await batch.commit();
      console.log(`Committed ${count} updates so far...`);
      batch = db.batch();
    }
  }

  // Commit any remaining updates
  if (count % batchSize !== 0) {
    await batch.commit();
  }

  console.log(`Migration complete. Updated ${count} user documents.`);
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
