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
  const [weekPicks, setWeekPicks] = useState<Record<string, string>>({});
  const [selectedTeam, setSelectedTeam] = useState("");
  const [saving, setSaving] = useState(false);
  const [isDeadlinePassed, setIsDeadlinePassed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date();

    const fetchData = async () => {
      setLoading(true);

      const weeksSnap = await getDocs(collection(db, "weeks"));
      const weeks: Week[] = weeksSnap.docs
        .map((doc) => doc.data() as Week)
        // Sort weeks chronologically by firstGameStartTime
        .sort(
          (a, b) =>
            a.firstGameStartTime.toDate().getTime() -
            b.firstGameStartTime.toDate().getTime()
        );

      const now = today.getTime();

      // Find the current week: now <= lastGameEndTime
      const selectedWeek =
        weeks.find((w) => now <= w.lastGameEndTime.toDate().getTime()) ??
        weeks[weeks.length - 1];

      setCurrentWeek(selectedWeek);
      setMatchups(selectedWeek.games || []);

      // --- Users ---
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

      // --- Picks ---
      const allPicksSnap = await getDocs(
        query(collection(db, "picks"), where("userId", "==", user?.uid || ""))
      );

      const pastPicks: string[] = [];
      let currentPick = "";
      allPicksSnap.forEach((doc) => {
        const data = doc.data();
        if (data.week !== parseInt(selectedWeek.week))
          pastPicks.push(data.pick);
        else currentPick = data.pick;
      });

      setWeekPicks(
        pastPicks.reduce((acc, pick) => ({ ...acc, [pick]: true }), {})
      );
      setSelectedTeam(currentPick);

      // --- Deadline calculation ---
      const kickoff = selectedWeek.firstGameStartTime.toDate();
      const deadline = new Date(kickoff.getTime() - 10 * 60 * 1000);
      setIsDeadlinePassed(today >= deadline);

      setLoading(false);
    };

    fetchData();
  }, [user]);

  const disableTeam = (team: string) => !!weekPicks[team];

  const handleSavePick = async () => {
    if (!user || !selectedTeam || !currentWeek) return;

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

  return (
    <div className="relative min-h-screen">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/images/football-field.jpg')",
        }}
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Foreground content */}
      <div className="relative z-10 p-6">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">NFL Survivor Pool</h1>
          <p className="text-gray-200">Welcome, {user?.email}</p>
        </header>

        <div className="flex flex-col md:flex-row md:space-x-6 space-y-6 md:space-y-0">
          <section className="flex-1 bg-white p-6 rounded-xl shadow space-y-3">
            <h2 className="text-xl font-semibold">
              Pick your team for week {currentWeek.week}
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

          <Matchups games={matchups} weekName={currentWeek.week} />

          <Participants
            currentWeek={currentWeek.week}
            currentUserId={user?.uid}
            isDeadlinePassed={isDeadlinePassed}
          />
        </div>
      </div>
    </div>
  );
}
