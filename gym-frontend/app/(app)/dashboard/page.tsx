"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const cards: [string, string][] = [
  ["totalMembers", "Total members"],
  ["activeMembers", "Active memberships"],
  ["checkInsToday", "Check-ins today"],
  ["dayPassesToday", "Day passes today"],
  ["expiringIn7Days", "Expiring in 7 days"],
  ["frozen", "Frozen"],
  ["suspended", "Suspended"],
];

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("dashboard/stats").then(setStats).catch((e) => setError(e.message));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      {error && <div className="rounded bg-red-50 p-3 text-red-700">{error} (the dashboard is admin-only)</div>}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats &&
          cards.map(([key, label]) => (
            <div key={key} className="rounded-xl border bg-white p-5">
              <div className="text-3xl font-bold text-indigo-600">{stats[key]}</div>
              <div className="text-sm text-slate-500">{label}</div>
            </div>
          ))}
      </div>
    </div>
  );
}