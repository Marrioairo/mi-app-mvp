import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";
import { collection, addDoc, query, where, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import { Timer, Users, UserPlus, Play, Pause, RotateCcw, ChevronRight, Save, FileJson, FileText, AlertCircle, Download } from "lucide-react";

interface Player {
  id: string;
  name: string;
  number: string;
  position: string;
}

interface MatchEvent {
  id?: string;
  type: "1PT" | "2PT" | "3PT" | "REB_OFF" | "REB_DEF" | "AST" | "STL" | "BLK" | "TO" | "FOUL" | "SUB";
  playerId: string;
  playerName?: string;
  team: "home" | "away";
  quarter: number;
  time: string;
  timestamp: any;
}

const Scorekeeper: React.FC = () => {
  const { user } = useAuth();
  const [matchId, setMatchId] = useState<string | null>(null);
  const [quarter, setQuarter] = useState(1);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [homePlayers, setHomePlayers] = useState<Player[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<"home" | "away" | null>(null);
  const [homeTeamName, setHomeTeamName] = useState("Home Team");
  const [awayTeamName, setAwayTeamName] = useState("Away Team");
  const [isEditingTeams, setIsEditingTeams] = useState(false);

  const timerRef = useRef<any>(null);

  // Error fix: Missing getDocs import in original, but here we'll use onSnapshot or import it
  useEffect(() => {
    if (!user) return;

    // Fetch User's Roster for Home Team
    const fetchRoster = async () => {
      const { getDocs } = await import("firebase/firestore");
      const q = query(collection(db, "players"), where("userId", "==", user.uid));
      const snapshot = await getDocs(q);
      const players = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Player));
      setHomePlayers(players.filter(p => (p as any).isActive));
    };

    fetchRoster();

    // SSE Listener for remote updates
    const eventSource = new EventSource("/api/events/sse");
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Remote Event Received:", data);
    };
    return () => eventSource.close();
  }, [user]);

  // Timer Logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleEvent = async (type: MatchEvent["type"]) => {
    if (!selectedPlayer || !selectedTeam || !user) return;

    const newEvent: MatchEvent = {
      type,
      playerId: selectedPlayer.id,
      playerName: selectedPlayer.name,
      team: selectedTeam,
      quarter,
      time: formatTime(timeLeft),
      timestamp: Timestamp.now(),
    };

    setEvents((prev) => [newEvent, ...prev]);

    // Save to Local API
    try {
      await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newEvent, matchId }),
      });
    } catch (e) {
      console.error("Failed to sync event:", e);
    }

    // Save to Firestore
    if (matchId) {
      await addDoc(collection(db, "matches", matchId, "events"), newEvent);
    }

    setSelectedPlayer(null);
    setSelectedTeam(null);
  };

  const exportCSV = () => {
    const headers = ["Time", "Quarter", "Team", "Player", "Type"];
    const rows = events.map(e => [e.time, e.quarter, e.team, e.playerName, e.type]);
    const csvContent = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `match-stats-${matchId || "live"}.csv`;
    a.click();
  };

  const startNewMatch = async () => {
    if (!user) return;
    const docRef = await addDoc(collection(db, "matches"), {
      userId: user.uid,
      homeTeam: homeTeamName,
      awayTeam: awayTeamName,
      status: "live",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    setMatchId(docRef.id);
  };

  const calculateScore = (team: "home" | "away") => {
    return events
      .filter((e) => e.team === team)
      .reduce((acc, e) => {
        if (e.type === "1PT") return acc + 1;
        if (e.type === "2PT") return acc + 2;
        if (e.type === "3PT") return acc + 3;
        return acc;
      }, 0);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-neutral-100">
      <aside className="w-80 flex-col border-r border-neutral-200 bg-white p-4 hidden lg:flex">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-neutral-400 uppercase tracking-wider">{homeTeamName}</h2>
            <button onClick={() => setIsEditingTeams(true)} className="p-1 hover:bg-neutral-100 rounded text-neutral-400">Settings</button>
          </div>
          <div className="space-y-2">
            {homePlayers.length > 0 ? homePlayers.map((p) => (
              <button
                key={p.id}
                onClick={() => { setSelectedPlayer(p); setSelectedTeam("home"); }}
                className={`flex w-full items-center justify-between rounded-xl border p-3 transition-all ${selectedPlayer?.id === p.id ? "border-orange-500 bg-orange-50 ring-1 ring-orange-500" : "border-neutral-100 hover:border-neutral-300"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 text-xs font-bold text-neutral-600">
                    {p.number}
                  </span>
                  <span className="text-sm font-medium text-neutral-800">{p.name}</span>
                </div>
                <span className="text-[10px] font-bold text-neutral-400">{p.position}</span>
              </button>
            )) : (
              <p className="text-xs text-neutral-400 italic">No players found.</p>
            )}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-neutral-400 uppercase tracking-wider">{awayTeamName}</h2>
            <button className="p-1 hover:bg-neutral-100 rounded text-neutral-400">Add</button>
          </div>
          <div className="space-y-2">
            {awayPlayers.map((p) => (
              <button
                key={p.id}
                onClick={() => { setSelectedPlayer(p); setSelectedTeam("away"); }}
                className={`flex w-full items-center justify-between rounded-xl border p-3 transition-all ${selectedPlayer?.id === p.id ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500" : "border-neutral-100 hover:border-neutral-300"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 text-xs font-bold text-neutral-600">
                    {p.number}
                  </span>
                  <span className="text-sm font-medium text-neutral-800">{p.name}</span>
                </div>
                <span className="text-[10px] font-bold text-neutral-400">{p.position}</span>
              </button>
            ))}
            {awayPlayers.length === 0 && (
              <button onClick={() => {
                const genericAway = [
                  { id: "a1", name: "Guest 1", number: "1", position: "G" },
                  { id: "a2", name: "Guest 2", number: "2", position: "F" },
                  { id: "a3", name: "Guest 3", number: "3", position: "C" },
                ];
                setAwayPlayers(genericAway);
              }} className="w-full py-2 border-2 border-dashed border-neutral-100 rounded-xl text-xs font-bold text-neutral-400 hover:bg-neutral-50">
                + Quick Add Away
              </button>
            )}
          </div>
        </div>
      </aside>

      <main className="flex flex-1 flex-col overflow-hidden">
        <div className="bg-neutral-900 px-8 py-6 text-white shadow-xl">
          <div className="mx-auto max-w-4xl items-center justify-between flex">
            <div className="text-center">
              <div className="text-xs font-bold text-neutral-400 uppercase mb-1">{homeTeamName}</div>
              <div className="text-5xl font-black tabular-nums">{calculateScore("home")}</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-6xl font-black tracking-tighter tabular-nums mb-4">{formatTime(timeLeft)}</div>
              <div className="flex gap-2">
                <button onClick={() => setIsRunning(!isRunning)} className={`h-10 w-10 flex items-center justify-center rounded-full ${isRunning ? "bg-neutral-700" : "bg-orange-600"}`}>
                  {isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-1" />}
                </button>
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs font-bold text-neutral-400 uppercase mb-1">{awayTeamName}</div>
              <div className="text-5xl font-black tabular-nums">{calculateScore("away")}</div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-4xl">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
              {["1PT", "2PT", "3PT", "REB_OFF", "REB_DEF", "AST", "STL", "BLK", "TO", "FOUL"].map((type) => (
                <button
                  key={type}
                  disabled={!selectedPlayer}
                  onClick={() => handleEvent(type as any)}
                  className="p-6 bg-neutral-800 text-white rounded-2xl font-black disabled:opacity-30 active:scale-95 transition-all"
                >
                  {type}
                </button>
              ))}
            </div>
            <div className="bg-white rounded-2xl border p-4">
              <h3 className="text-xs font-black uppercase text-neutral-400 mb-4 tracking-widest">Feed</h3>
              {events.map((e, i) => (
                <div key={i} className="py-2 border-b text-sm flex gap-4">
                  <span className="text-neutral-400">{e.time}</span>
                  <span className="font-bold">{e.playerName}</span>
                  <span className="text-orange-600 font-bold">{e.type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {isEditingTeams && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white p-8 rounded-3xl max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Edit Teams</h3>
            <input type="text" value={homeTeamName} onChange={e => setHomeTeamName(e.target.value)} className="w-full mb-2 p-2 border rounded" placeholder="Home" />
            <input type="text" value={awayTeamName} onChange={e => setAwayTeamName(e.target.value)} className="w-full mb-4 p-2 border rounded" placeholder="Away" />
            <button onClick={() => setIsEditingTeams(false)} className="w-full py-2 bg-neutral-900 text-white rounded-xl font-bold">Save</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Scorekeeper;
