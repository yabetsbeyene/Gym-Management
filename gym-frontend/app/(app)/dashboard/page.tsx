"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { fmtDateTime, fullName, memberCode } from "@/lib/format";
import type { AttemptRow } from "@/lib/types";

const CARDS: [string, string][] = [
  ["totalMembers", "Total members"],
  ["activeMembers", "Active memberships"],
  ["checkInsToday", "Check-ins today"],
  ["dayPassesToday", "Day passes today"],
  ["deniedToday", "Denied today"],
  ["expiringIn7Days", "Expiring in 7 days"],
  ["frozen", "Frozen"],
  ["suspended", "Suspended"],
];

export default function DashboardPage() {
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [denied, setDenied] = useState<AttemptRow[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api("dashboard/stats").then(setStats).catch((e) => setError(e.message));
    api<AttemptRow[]>("check-ins/attempts?allowed=false&limit=20").then(setDenied).catch(() => {});
  }, []);

  const who = (a: AttemptRow) =>
    a.member ? `${fullName(a.member)} (${memberCode(a.member.memberNumber)})` : (a.dayPass?.visitor?.fullName ?? "Unknown");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      {error && <div className="rounded bg-red-50 p-3 text-red-700">{error} (the dashboard is admin-only)</div>}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats &&
          CARDS.map(([key, label]) => (
            <div key={key} className="rounded-xl border bg-white p-5">
              <div className={`text-3xl font-bold ${key === "deniedToday" ? "text-red-600" : "text-indigo-600"}`}>{stats[key]}</div>
              <div className="text-sm text-slate-500">{label}</div>
            </div>
          ))}
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Recent denied attempts</h2>
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="p-3">When</th>
                <th className="p-3">Who</th>
                <th className="p-3">Scanned / typed</th>
                <th className="p-3">Reason</th>
                <th className="p-3">Staff</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {denied.length === 0 && (
                <tr><td colSpan={5} className="p-4 text-slate-500">No denied attempts.</td></tr>
              )}
              {denied.map((a) => (
                <tr key={a.id}>
                  <td className="p-3">{fmtDateTime(a.createdAt)}</td>
                  <td className="p-3 font-medium">{who(a)}</td>
                  <td className="max-w-40 truncate p-3 font-mono text-xs">{a.identifier}</td>
                  <td className="p-3 text-red-700">{a.reason}</td>
                  <td className="p-3">{a.createdBy.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}