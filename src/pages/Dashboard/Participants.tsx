import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import { useEffect, useState } from "react";
import type { Participant } from "../../types";

interface ParticipantsProps {
  currentWeek: string;
  currentUserId?: string;
}

export default function Participants({
  currentWeek,
  currentUserId,
}: ParticipantsProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);

  useEffect(() => {
    // Subscribe to all users
    const unsubUsers = onSnapshot(collection(db, "users"), (userSnap) => {
      const users: Record<string, Participant> = {};
      userSnap.forEach((doc) => {
        const data = doc.data();
        users[doc.id] = {
          uid: doc.id,
          displayName: data.displayName || data.email,
          eliminated: data.eliminated || false,
        };
      });

      // Subscribe to picks for current week
      const picksQuery = query(
        collection(db, "picks"),
        where("week", "==", currentWeek)
      );
      const unsubPicks = onSnapshot(picksQuery, (picksSnap) => {
        const updatedParticipants = Object.values(users).map((p) => {
          const pickDoc = picksSnap.docs.find((d) => d.data().userId === p.uid);
          return {
            ...p,
            pick: pickDoc ? pickDoc.data().pick : undefined,
          };
        });
        setParticipants(updatedParticipants);
      });

      // Cleanup nested listener
      return () => unsubPicks();
    });

    return () => unsubUsers();
  }, [currentWeek]);

  return (
    <div className="bg-white p-6 rounded-xl shadow flex-1">
      <h2 className="text-xl font-semibold mb-4">Participants</h2>
      <ul className="space-y-2">
        {participants.map((p) => (
          <li
            key={p.uid}
            className={`flex justify-between items-center p-2 rounded ${
              p.eliminated ? "text-gray-400" : ""
            }`}
          >
            <span>{p.displayName}</span>
            <span>
              {p.eliminated
                ? "Eliminated"
                : p.pick
                ? p.pick
                : p.uid === currentUserId
                ? "(no pick yet)"
                : "-"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
