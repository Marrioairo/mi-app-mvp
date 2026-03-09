import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { motion } from "motion/react";
import { LayoutDashboard, MessageSquare, CreditCard, Settings, TrendingUp, Clock, Zap, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getPriceUSD } from "../lib/pricing";

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState({ totalMatches: 0, totalEvents: 0, plan: "Free" });
  const [recentMatches, setRecentMatches] = useState<any[]>([]);
  const [regionPrice, setRegionPrice] = useState(15);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      const q = query(collection(db, "matches"), where("userId", "==", user.uid));
      const snapshot = await getDocs(q);
      setStats(prev => ({ ...prev, totalMatches: snapshot.size }));

      const recentQ = query(q, orderBy("createdAt", "desc"), limit(5));
      const recentSnapshot = await getDocs(recentQ);
      setRecentMatches(recentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    fetchStats();

    // Detect region for pricing display
    const countryCode = navigator.language.toUpperCase().split('-')[1] || 'US';
    setRegionPrice(getPriceUSD(countryCode));
  }, [user]);

  const handleUpgrade = async () => {
    try {
      const countryCode = navigator.language.toUpperCase().split('-')[1] || 'US';
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ countryCode }),
      });
      const { url } = await response.json();
      if (url) window.location.href = url;
    } catch (error) {
      console.error("Stripe error:", error);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-neutral-900">{t('dashboard')}</h1>
        <p className="mt-2 text-neutral-600">Welcome back, {user?.displayName}. Here's your team's performance overview.</p>
      </header>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Matches Recorded", value: stats.totalMatches, icon: LayoutDashboard, color: "text-orange-600", bg: "bg-orange-50" },
          { label: "Win Prediction Accuracy", value: "84.2%", icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Current Plan", value: stats.plan, icon: CreditCard, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "AI Insights Generated", value: "342", icon: Zap, color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
          >
            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg} ${stat.color} mb-4`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-neutral-500">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-neutral-900">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-neutral-900 mb-4">Recent Matches</h2>
            <div className="divide-y divide-neutral-100">
              {recentMatches.length > 0 ? (
                recentMatches.map((match) => (
                  <div key={match.id} className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-500">
                        <LayoutDashboard className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-900">{match.homeTeam} vs {match.awayTeam}</p>
                        <p className="text-xs text-neutral-500">{new Date(match.createdAt?.toDate()).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <button className="text-sm font-medium text-orange-600 hover:text-orange-500">View Stats</button>
                  </div>
                ))
              ) : (
                <p className="py-4 text-sm text-neutral-500">No recent matches found.</p>
              )}
            </div>
          </div>
        </div>

        {/* Subscription / Upgrade */}
        <div className="space-y-6">
          <div className="rounded-2xl bg-orange-600 p-6 text-white shadow-lg">
            <h2 className="text-lg font-bold">HoopsAI Pro</h2>
            <p className="mt-2 text-sm text-orange-100">Get advanced tactical insights, unlimited match recording, and regional pricing.</p>
            <div className="mt-4 flex items-center gap-2 text-xs font-bold bg-orange-700/50 w-fit px-2 py-1 rounded">
              <Globe className="h-3 w-3" />
              Regional Price: ${regionPrice}/mo
            </div>
            <ul className="mt-4 space-y-2 text-sm text-orange-100">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-orange-300" />
                DeepSeek AI Tactical Analysis
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-orange-300" />
                CSV/JSON Data Export
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-orange-300" />
                1 Month Free Trial
              </li>
            </ul>
            <button 
              onClick={handleUpgrade}
              className="mt-6 w-full rounded-xl bg-white py-2.5 text-sm font-bold text-orange-600 hover:bg-orange-50 transition-all"
            >
              Upgrade Now
            </button>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-neutral-900 mb-4">Quick Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Language</span>
                <span className="text-xs font-bold text-neutral-400 uppercase">EN / ES</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Email Notifications</span>
                <div className="h-5 w-10 rounded-full bg-orange-600 p-1 flex justify-end">
                  <div className="h-3 w-3 rounded-full bg-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
