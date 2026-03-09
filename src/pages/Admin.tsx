import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { motion } from "motion/react";
import { ShieldCheck, Users, Activity, DollarSign, Database, Search } from "lucide-react";

const Admin: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({ totalUsers: 0, activeToday: 0, revenue: 0 });

  useEffect(() => {
    if (user?.email !== "marrioairocastro@gmail.com") return;

    const fetchAdminData = async () => {
      // Mocking admin data for demo purposes
      setMetrics({ totalUsers: 1240, activeToday: 450, revenue: 12450 });
      setUsers([
        { id: 1, name: "John Doe", email: "john@example.com", plan: "Pro", status: "Active" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", plan: "Free", status: "Active" },
        { id: 3, name: "Bob Johnson", email: "bob@example.com", plan: "Pro", status: "Inactive" },
      ]);
    };

    fetchAdminData();
  }, [user]);

  if (user?.email !== "marrioairocastro@gmail.com") {
    return <div className="flex h-screen items-center justify-center text-red-600 font-bold">Access Denied</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 flex items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-indigo-600" />
            Admin Control Panel
          </h1>
          <p className="mt-2 text-neutral-600">Monitor system health, user activity, and financial metrics.</p>
        </div>
        <div className="flex gap-3">
          <button className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-all">
            Export Data
          </button>
          <button className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-all">
            System Status
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Users", value: metrics.totalUsers, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Active Today", value: metrics.activeToday, icon: Activity, color: "text-green-600", bg: "bg-green-50" },
          { label: "Monthly Revenue", value: `$${metrics.revenue}`, icon: DollarSign, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "API Latency", value: "124ms", icon: Database, color: "text-orange-600", bg: "bg-orange-50" },
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

      <div className="mt-10 rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-neutral-200 bg-neutral-50 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-neutral-900">User Management</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search users..."
              className="rounded-lg border border-neutral-200 bg-white pl-10 pr-4 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Plan</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-neutral-200" />
                      <div>
                        <p className="font-medium text-neutral-900">{u.name}</p>
                        <p className="text-xs text-neutral-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      u.plan === "Pro" ? "bg-indigo-100 text-indigo-700" : "bg-neutral-100 text-neutral-700"
                    }`}>
                      {u.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      u.status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-indigo-600 hover:text-indigo-500 font-medium">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Admin;
