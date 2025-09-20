import React from "react";
import { type Game } from "../../types";

interface MatchupsProps {
  games: Game[];
  weekName: string;
}

const options: Intl.DateTimeFormatOptions = {
  weekday: "long",
  timeZone: "America/New_York",
};

const Matchups: React.FC<MatchupsProps> = ({ games, weekName }) => {
  if (!games || games.length === 0) return <p>No matchups available.</p>;

  return (
    <section className="flex-1 bg-white p-6 rounded-xl shadow space-y-2">
      <h2 className="text-xl font-semibold">Week {weekName} Matchups</h2>
      <ul className="list-disc list-inside space-y-1">
        {games.map((game, idx) => (
          <li key={idx}>
            {game.away} @ {game.home} —{" "}
            {new Date(game.startTime).toLocaleString("en-US", options)}
          </li>
        ))}
      </ul>
    </section>
  );
};

export default Matchups;
