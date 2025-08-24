import { db } from "../firebase";
import { doc, setDoc, updateDoc, arrayUnion } from "firebase/firestore";

export async function createUser(
  userId: string,
  email: string,
  displayName: string
) {
  await setDoc(doc(db, "users", userId), {
    email,
    displayName,
    leagues: [],
  });
}

export async function addUserToLeague(userId: string, leagueId: string) {
  await updateDoc(doc(db, "users", userId), {
    leagues: arrayUnion(leagueId),
  });
}
