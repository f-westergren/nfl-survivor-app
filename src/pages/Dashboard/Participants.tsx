/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAuth } from "../../auth/useAuth";
import type { Participant } from "./Dashboard";

export default function Participants({
  currentWeek,
  deadline,
  participants,
  userPicks: picks,
}: {
  currentWeek: string;
  deadline: Date | null;
  participants: Participant[];
  userPicks: Record<string, any>;
}) {
  const { user } = useAuth();

  const now = new Date();

  return (
    <div className="border rounded p-4 shadow">
      <h3 className="text-lg font-semibold mb-2">Participants</h3>
      <ul className="space-y-2">
        {participants.map((p) => {
          const userPick = picks[p.uid]?.[currentWeek];
          const isCurrentUser = p.uid === user?.uid;
          const shouldReveal = isCurrentUser || now > (deadline || now);

          return (
            <li
              key={p.uid}
              className={`flex justify-between items-center ${
                p.eliminated ? "text-gray-400 line-through" : ""
              }`}
            >
              <span>{p.displayName}</span>
              {userPick ? (
                <span className={!shouldReveal ? "blur-sm" : ""}>
                  {userPick}
                </span>
              ) : (
                <span className="italic text-gray-500">No pick</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
