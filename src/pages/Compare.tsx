import React, { useState } from "react";
import { motion } from "motion/react";
import { Search, TrendingUp, Users, Zap, Shield, AlertTriangle } from "lucide-react";

const Compare: React.FC = () => {
  const [teamA, setTeamA] = useState("Real Madrid");
  const [teamB, setTeamB] = useState("FC Barcelona");

  const stats = [
    { label: "Goals Scored", a: 72, b: 68 },
    { label: "Possession %", a: 58, b: 62 },
    { label: "Shots on Target", a: 12.4, b: 11.8 },
    { label: "Clean Sheets", a: 14, b: 12 },
    { label: "Pass Accuracy %", a: 89, b: 91 },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-neutral-900">Team Comparison</h1>
        <p className="mt-2 text-neutral-600">Compare head-to-head statistics and AI-generated tactical insights.</p>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Comparison Inputs */}
        <div className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex-1">
            <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Team A</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={teamA}
                onChange={(e) => setTeamA(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 pl-10 pr-4 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="text-xl font-black text-neutral-300">VS</div>
          <div className="flex-1">
            <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Team B</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={teamB}
                onChange={(e) => setTeamB(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 pl-10 pr-4 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* AI Tactical Summary */}
        <div className="rounded-2xl bg-emerald-600 p-6 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-5 w-5" />
            <h2 className="text-lg font-bold">AI Tactical Insight</h2>
          </div>
          <p className="text-sm text-emerald-50 leading-relaxed">
            Based on recent form, {teamA} shows a high efficiency in counter-attacks (82% success rate). 
            However, {teamB}'s high-press system (PPDA of 8.4) might disrupt {teamA}'s build-up play. 
            Key battle: Midfield control will likely decide the outcome.
          </p>
        </div>
      </div>

      {/* Stats Comparison Table */}
      <div className="mt-10 rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="grid grid-cols-3 bg-neutral-50 px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">
          <div className="text-left">{teamA}</div>
          <div className="text-center">Metric</div>
          <div className="text-right">{teamB}</div>
        </div>
        <div className="divide-y divide-neutral-100">
          {stats.map((stat) => (
            <div key={stat.label} className="grid grid-cols-3 px-6 py-4 items-center">
              <div className="text-left font-bold text-neutral-900">
                <div className="flex items-center gap-2">
                  <div className={`h-2 rounded-full bg-emerald-500 transition-all`} style={{ width: `${(stat.a / (stat.a + stat.b)) * 100}%` }} />
                  {stat.a}
                </div>
              </div>
              <div className="text-center text-sm text-neutral-600">{stat.label}</div>
              <div className="text-right font-bold text-neutral-900">
                <div className="flex items-center justify-end gap-2">
                  {stat.b}
                  <div className={`h-2 rounded-full bg-blue-500 transition-all`} style={{ width: `${(stat.b / (stat.a + stat.b)) * 100}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-600" />
            {teamA} Analysis
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Strong aerial presence in set pieces
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Fast transition from defense to attack
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
              Vulnerable to long balls behind the defense
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            {teamB} Analysis
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Excellent ball retention in final third
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              High success rate in 1v1 dribbling
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
              Low conversion rate from outside the box
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Compare;
