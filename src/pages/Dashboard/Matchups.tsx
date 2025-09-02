// components/Matchups.tsx
import React from "react";
import { type Game } from "../../types";

interface MatchupsProps {
  games: Game[];
  weekName: string; // e.g., "week1"
}

const Matchups: React.FC<MatchupsProps> = ({ games, weekName }) => {
  if (!games || games.length === 0) return <p>No matchups available.</p>;

  return (
    <section className="flex-1 bg-white p-6 rounded-xl shadow space-y-2">
      <h2 className="text-xl font-semibold">Week {weekName} Matchups</h2>
      <ul className="list-disc list-inside space-y-1">
        {games.map((game, idx) => (
          <li key={idx}>
            {game.away} @ {game.home} —{" "}
            {game.startTime.toDate
              ? game.startTime.toDate().toLocaleString()
              : new Date(game.startTime).toLocaleString()}
          </li>
        ))}
      </ul>
    </section>
  );
};

export default Matchups;
