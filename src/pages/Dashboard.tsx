import { useState, useEffect } from "react";
import { useAuth } from "../auth/useAuth";
import { db } from "../firebase";
import { doc, getDoc, collection, getDocs, setDoc } from "firebase/firestore";

interface Game {
  home: string;
  away: string;
  winner: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  startTime: any; // Firestore Timestamp
}

interface Participant {
  uid: string;
  displayName: string;
  eliminated: boolean;
  picks: Record<string, string>;
}

const allTeams = [
  "Cardinals",
  "Falcons",
  "Ravens",
  "Bills",
  "Panthers",
  "Bears",
  "Bengals",
  "Browns",
  "Cowboys",
  "Broncos",
  "Lions",
  "Packers",
  "Texans",
  "Colts",
  "Jaguars",
  "Chiefs",
  "Raiders",
  "Chargers",
  "Rams",
  "Dolphins",
  "Vikings",
  "Patriots",
  "Saints",
  "Giants",
  "Jets",
  "Eagles",
  "Steelers",
  "Seahawks",
  "Buccaneers",
  "Titans",
  "Commanders",
];

export default function Dashboard() {
  const { user } = useAuth();
  const [userPicks, setUserPicks] = useState<Record<string, string>>({});
  const [matchups, setMatchups] = useState<Game[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [saving, setSaving] = useState(false);
  const [isDeadlinePassed, setIsDeadlinePassed] = useState(false);

  // Adjust NFL season start
  const seasonStart = new Date("2025-09-04");
  const today = new Date();
  const diffWeeks = Math.floor(
    (today.getTime() - seasonStart.getTime()) / (7 * 24 * 60 * 60 * 1000)
  );
  const currentWeek = `week${diffWeeks < 0 ? 1 : diffWeeks + 1}`;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // Fetch matchups for current week
      const weekDoc = doc(db, "matchups", currentWeek);
      const snap = await getDoc(weekDoc);
      if (snap.exists()) {
        setMatchups(snap.data().games || []);
      }

      // Fetch current user's picks
      if (user) {
        const userDoc = doc(db, "users", user.uid);
        const userSnap = await getDoc(userDoc);
        if (userSnap.exists()) {
          setUserPicks(userSnap.data()?.picks || {});
        }
      }

      // Fetch league participants
      const usersSnap = await getDocs(collection(db, "users"));
      const participantsData: Participant[] = [];
      usersSnap.forEach((doc) => {
        const data = doc.data();
        participantsData.push({
          uid: doc.id,
          displayName: data.displayName || data.email,
          eliminated: data.eliminated || false,
          picks: data.picks || {},
        });
      });
      setParticipants(participantsData);

      setLoading(false);
    };

    fetchData();
  }, [user, currentWeek]);

  // Exclude current week pick from disabled teams
  const pickedTeams = Object.entries(userPicks)
    .filter(([week]) => week !== currentWeek)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(([_, team]) => team);

  const alreadyPickedThisWeek = userPicks[currentWeek];

  const handleSavePick = async () => {
    if (!user || !selectedTeam) return;
    setSaving(true);

    try {
      const pickRef = doc(db, "picks", user.uid);
      const snap = await getDoc(pickRef);

      if (snap.exists()) {
        // Merge with existing picks
        await setDoc(pickRef, { [currentWeek]: selectedTeam }, { merge: true });
      } else {
        // Create new doc if none exists
        await setDoc(pickRef, { [currentWeek]: selectedTeam });
      }

      alert(`Pick saved: ${selectedTeam} for ${currentWeek}`);
    } catch (err) {
      console.error("Error saving pick", err);
      alert("Failed to save pick. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const firstGameStartTime = matchups.length
    ? matchups.reduce(
        (earliest, g) =>
          g.startTime.toDate() < earliest ? g.startTime.toDate() : earliest,
        matchups[0].startTime.toDate()
      )
    : new Date();

  useEffect(() => {
    const fetchMatchups = async () => {
      const weekDoc = doc(db, "matchups", currentWeek);
      const snap = await getDoc(weekDoc);
      if (snap.exists()) {
        const data = snap.data();
        setMatchups(data.games || []);

        if (data.deadline) {
          const dl = new Date(data.deadline);
          setIsDeadlinePassed(new Date() >= dl);
        }
      }
      setLoading(false);
    };

    fetchMatchups();
  }, [currentWeek]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">NFL Survivor Pool</h1>
        <p className="text-gray-600">Welcome, {user?.email}</p>
      </header>

      {/* Three boxes side by side on desktop */}
      <div className="flex flex-col md:flex-row md:space-x-6 space-y-6 md:space-y-0">
        {/* Pick dropdown */}
        <section className="flex-1 bg-white p-6 rounded-xl shadow space-y-3">
          <h2 className="text-xl font-semibold">
            Pick your team for {currentWeek}
          </h2>
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="w-full border rounded p-2 mb-2 pr-8"
          >
            <option value="">Select a team</option>
            {allTeams.map((team) => (
              <option
                key={team}
                value={team}
                disabled={Object.values(userPicks).includes(team)} // already used
              >
                {team}
              </option>
            ))}
          </select>

          <button
            onClick={handleSavePick}
            disabled={!selectedTeam || saving || isDeadlinePassed}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
          >
            {isDeadlinePassed
              ? "Deadline Passed"
              : saving
              ? "Saving..."
              : "Save Pick"}
          </button>
        </section>

        {/* Matchups reference */}
        <section className="flex-1 bg-white p-6 rounded-xl shadow space-y-2">
          <h2 className="text-xl font-semibold">{currentWeek} Matchups</h2>
          <ul className="list-disc list-inside space-y-1">
            {matchups.map((game, idx) => (
              <li key={idx}>
                {game.away} @ {game.home} —{" "}
                {game.startTime.toDate().toLocaleString()}
              </li>
            ))}
          </ul>
        </section>

        {/* Participants */}
        <section className="flex-1 bg-white p-6 rounded-xl shadow space-y-2">
          <h2 className="text-xl font-semibold">League Participants</h2>
          <ul className="space-y-1">
            {participants.map((p) => {
              const pick = p.picks[currentWeek];
              const showPick = pick && today >= firstGameStartTime;
              return (
                <li
                  key={p.uid}
                  className={`${
                    p.eliminated ? "text-gray-400" : ""
                  } flex justify-between`}
                >
                  <span>
                    {p.displayName} —{" "}
                    {p.eliminated ? "Eliminated ❌" : "Active ✅"}
                  </span>
                  <span
                    className={`${
                      pick && !showPick ? "blur-sm select-none" : ""
                    }`}
                  >
                    {pick || "—"}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
