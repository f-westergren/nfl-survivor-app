import { useState, useEffect } from "react";
import { useAuth } from "../../auth/useAuth";
import { db } from "../../firebase";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  setDoc,
} from "firebase/firestore";
import Matchups from "./Matchups";
import Participants from "./Participants";
import type { Week, Game, Participant } from "../../types";

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
  const [currentWeek, setCurrentWeek] = useState<Week | null>(null);
  const [matchups, setMatchups] = useState<Game[]>([]);
  const [weekPicks, setWeekPicks] = useState<Record<string, string>>({}); // userID => pick
  const [selectedTeam, setSelectedTeam] = useState("");
  const [saving, setSaving] = useState(false);
  const [isDeadlinePassed, setIsDeadlinePassed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date();

    const fetchData = async () => {
      setLoading(true);

      // 1. Get all weeks and determine current week
      const weeksSnap = await getDocs(collection(db, "weeks"));
      const weeks: Week[] = weeksSnap.docs
        .map((doc) => doc.data() as Week)
        .sort(
          (a, b) =>
            new Date(a.firstGameStartTime).getTime() -
            new Date(b.firstGameStartTime).getTime()
        );

      let selectedWeek = weeks[0];
      for (const week of weeks) {
        if (new Date(week.firstGameStartTime) <= today) selectedWeek = week;
        else break;
      }
      setCurrentWeek(selectedWeek);
      setMatchups(selectedWeek.games || []);

      // 2. Fetch all participants
      const usersSnap = await getDocs(collection(db, "users"));
      const participantsData: Participant[] = [];
      usersSnap.forEach((doc) => {
        const data = doc.data();
        participantsData.push({
          uid: doc.id,
          displayName: data.displayName || data.email,
          eliminated: !(data.active ?? true),
        });
      });

      // 3. Fetch all picks for this week
      const picksSnap = await getDocs(
        query(
          collection(db, "picks"),
          where("week", "==", parseInt(selectedWeek.week))
        )
      );

      const picksMap: Record<string, string> = {};
      picksSnap.forEach((doc) => {
        const data = doc.data();
        picksMap[data.userId] = data.pick;
        if (user?.uid === data.userId) {
          setSelectedTeam(data.pick);
        }
      });
      setWeekPicks(picksMap);

      // 4. Deadline
      const kickoff = new Date(selectedWeek.firstGameStartTime);
      const deadline = new Date(kickoff.getTime() - 10 * 60 * 1000);
      setIsDeadlinePassed(today >= deadline);
      setLoading(false);
    };

    fetchData();
  }, [user]);

  const handleSavePick = async () => {
    if (!user || !selectedTeam || !currentWeek) return;

    // Calculate kickoff and deadline
    const kickoff = new Date(currentWeek.firstGameStartTime);
    const deadline = new Date(kickoff.getTime() - 10 * 60 * 1000);

    if (new Date() >= deadline) {
      alert("Deadline has passed for this week. You cannot change your pick.");
      return;
    }

    setSaving(true);

    try {
      const pickId = `${user.uid}_week${currentWeek.week}`;
      const pickRef = doc(db, "picks", pickId);

      await setDoc(
        pickRef,
        {
          userId: user.uid,
          week: currentWeek.week,
          pick: selectedTeam,
          status: "pending",
        },
        { merge: true }
      );

      alert(`✅ Pick saved: ${selectedTeam} for week ${currentWeek.week}`);
    } catch (err) {
      console.error("Error saving pick", err);
      alert("❌ Failed to save pick, try again");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !currentWeek) return <div>Loading...</div>;

  // Disable already-picked teams by current user
  // Teams the current user has picked in *previous* weeks
  const userPastPicks = Object.entries(weekPicks)
    .filter(([uid]) => uid === user?.uid) // only current user
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(([_, team]) => team);

  // Disable if team was picked before this week
  const disableTeam = (team: string) => {
    return userPastPicks.includes(team);
  };

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">NFL Survivor Pool</h1>
        <p className="text-gray-600">Welcome, {user?.email}</p>
      </header>

      <div className="flex flex-col md:flex-row md:space-x-6 space-y-6 md:space-y-0">
        {/* Pick dropdown */}
        <section className="flex-1 bg-white p-6 rounded-xl shadow space-y-3">
          <h2 className="text-xl font-semibold">
            Pick your team for {currentWeek.week}
          </h2>
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="w-full border rounded p-2 mb-2 pr-8"
          >
            <option value="">Select a team</option>
            {allTeams.map((team) => (
              <option key={team} value={team} disabled={disableTeam(team)}>
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

        {/* Matchups */}
        <Matchups games={matchups} weekName={currentWeek.week} />

        {/* Participants */}
        <Participants
          currentWeek={currentWeek.week}
          currentUserId={user?.uid}
        />
      </div>
    </div>
  );
}
