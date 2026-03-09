import React, { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { motion } from "motion/react";
import { BarChart2, Download, Filter, Search, TrendingUp, Users, Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";

interface MatchStats {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  timestamp: any;
  events: any[];
}

const Stats: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [matches, setMatches] = useState<MatchStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchMatches = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, "matches"),
          where("userId", "==", user.uid),
          orderBy("timestamp", "desc")
        );
        const snapshot = await getDocs(q);
        setMatches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MatchStats)));
      } catch (error) {
        console.error("Error fetching matches:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, [user]);

  const exportData = (match: MatchStats) => {
    const data = JSON.stringify(match, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `match-${match.id}.json`;
    a.click();
  };

  const filteredMatches = matches.filter(m => 
    m.homeTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.awayTeam.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-neutral-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">{t('advanced_stats')}</h1>
            <p className="text-neutral-500">Analyze your team's performance and export data.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-xl border border-neutral-200 bg-white pl-10 pr-4 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
            <button className="flex items-center gap-2 rounded-xl bg-white border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-all">
              <Filter className="h-4 w-4" />
              {t('filter')}
            </button>
          </div>
        </header>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-t-transparent"></div>
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-neutral-200">
            <BarChart2 className="h-12 w-12 text-neutral-300 mb-4" />
            <h3 className="text-lg font-bold text-neutral-900">No matches found</h3>
            <p className="text-neutral-500">Start recording matches in the Scorekeeper to see stats here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredMatches.map((match) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group relative overflow-hidden rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm hover:shadow-md transition-all"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 uppercase tracking-wider">
                    <Calendar className="h-3 w-3" />
                    {new Date(match.timestamp?.seconds * 1000).toLocaleDateString()}
                  </div>
                  <button 
                    onClick={() => exportData(match)}
                    className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-50 hover:text-orange-600 transition-all"
                    title="Export Data"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between mb-6">
                  <div className="text-center flex-1">
                    <div className="h-12 w-12 rounded-full bg-neutral-100 mx-auto mb-2 flex items-center justify-center text-xl font-bold text-neutral-600">
                      {match.homeTeam[0]}
                    </div>
                    <div className="text-sm font-bold text-neutral-900 truncate">{match.homeTeam}</div>
                  </div>
                  <div className="px-4 text-2xl font-black text-neutral-900">
                    {match.homeScore} - {match.awayScore}
                  </div>
                  <div className="text-center flex-1">
                    <div className="h-12 w-12 rounded-full bg-neutral-100 mx-auto mb-2 flex items-center justify-center text-xl font-bold text-neutral-600">
                      {match.awayTeam[0]}
                    </div>
                    <div className="text-sm font-bold text-neutral-900 truncate">{match.awayTeam}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-orange-50 p-3 border border-orange-100">
                    <div className="text-[10px] font-bold text-orange-600 uppercase">Events</div>
                    <div className="text-lg font-black text-neutral-800">{match.events?.length || 0}</div>
                  </div>
                  <div className="rounded-2xl bg-blue-50 p-3 border border-blue-100">
                    <div className="text-[10px] font-bold text-blue-600 uppercase">Efficiency</div>
                    <div className="text-lg font-black text-neutral-800">
                      {Math.round((match.homeScore / (match.events?.length || 1)) * 100)}%
                    </div>
                  </div>
                </div>

                <button className="mt-6 w-full rounded-xl bg-neutral-900 py-2.5 text-sm font-bold text-white hover:bg-neutral-800 transition-all flex items-center justify-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  View Full Analysis
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Stats;
