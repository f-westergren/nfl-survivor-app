import { db } from "../firebase";
import {
  collection,
  addDoc,
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";

// Create a new league and add creator as participant
export async function createLeague(userId: string, name: string) {
  const leagueRef = await addDoc(collection(db, "leagues"), {
    name,
    ownerId: userId,
    createdAt: new Date(),
    participants: [userId],
    currentWeek: 1,
  });

  // Add participant doc for creator
  await setDoc(doc(db, "leagues", leagueRef.id, "participants", userId), {
    status: "active",
    eliminatedWeek: null,
    picks: {},
  });

  // Add league to user's profile
  await updateDoc(doc(db, "users", userId), {
    leagues: arrayUnion(leagueRef.id),
  });

  return leagueRef.id;
}

// Join an existing league
export async function joinLeague(userId: string, leagueId: string) {
  await setDoc(doc(db, "leagues", leagueId, "participants", userId), {
    status: "active",
    eliminatedWeek: null,
    picks: {},
  });

  await updateDoc(doc(db, "leagues", leagueId), {
    participants: arrayUnion(userId),
  });

  await updateDoc(doc(db, "users", userId), {
    leagues: arrayUnion(leagueId),
  });
}

// Make a pick for a given week
export async function makePick(
  userId: string,
  leagueId: string,
  week: number,
  team: string
) {
  const participantRef = doc(db, "leagues", leagueId, "participants", userId);

  await updateDoc(participantRef, {
    [`picks.${week}`]: team,
  });
}
