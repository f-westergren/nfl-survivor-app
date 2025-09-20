import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import { useEffect, useState } from "react";
import type { Participant } from "../../types";

interface ParticipantsProps {
  currentWeek: string;
  currentUserId?: string;
  isDeadlinePassed: boolean;
}

export default function Participants({
  currentWeek,
  currentUserId,
  isDeadlinePassed,
}: ParticipantsProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, "users"), (userSnap) => {
      const users: Record<string, Participant> = {};

      userSnap.forEach((doc) => {
        const data = doc.data();
        const eliminatedWeek = data.eliminatedWeek ?? null;

        users[doc.id] = {
          uid: doc.id,
          displayName: data.displayName || data.email,
          eliminated: eliminatedWeek !== 0,
          eliminatedWeek,
        };
      });

      const picksQuery = query(
        collection(db, "picks"),
        where("week", "==", currentWeek)
      );

      const unsubPicks = onSnapshot(picksQuery, (picksSnap) => {
        const merged = Object.values(users).map((u) => {
          const pickDoc = picksSnap.docs.find((d) => d.data().userId === u.uid);
          return {
            ...u,
            pick: pickDoc ? pickDoc.data().pick : undefined,
          };
        });
        setParticipants(merged);
      });

      return () => unsubPicks();
    });

    return () => unsubUsers();
  }, [currentWeek]);

  return (
    <div className="bg-white p-6 rounded-xl shadow flex-1">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-semibold mb-4">Participant</h2>
        <h2 className="text-xl font-semibold mb-4">
          {`Week ${currentWeek} Pick`}
        </h2>
      </div>
      <ul className="space-y-2">
        {participants.map((p) => (
          <li
            key={p.uid}
            className={`flex justify-between items-center p-1 rounded ${
              p.eliminated ? "text-gray-400" : ""
            }`}
          >
            <span>
              {p.displayName}
              {p.eliminatedWeek !== 0 && (
                <span className="ml-2 text-sm text-gray-400"></span>
              )}
            </span>

            {isDeadlinePassed ? (
              <span>
                {p.eliminated
                  ? `Eliminated (W${p.eliminatedWeek})`
                  : p.pick || "(no pick)"}
              </span>
            ) : (
              <span>
                {p.eliminated
                  ? `Eliminated (W${p.eliminatedWeek})`
                  : p.uid === currentUserId
                  ? p.pick || "(no pick yet)"
                  : p.pick
                  ? "✔️"
                  : "⏳"}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
