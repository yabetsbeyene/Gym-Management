"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, ReactNode, useCallback, useEffect, useState } from "react";
import {
  Activity, ChevronRight, Clock, CreditCard, Package, Plus, RefreshCw, Search, Sparkles,
  TrendingDown, TrendingUp, UserCheck, Users, type LucideIcon,
} from "lucide-react";
import { api } from "@/lib/api";
import { hourLabel, money, timeAgo } from "@/lib/format";
import type { DashboardOverview, DashboardRange } from "@/lib/types";
import Avatar from "@/components/Avatar";

const RANGES: { value: DashboardRange; label: string; versus: string }[] = [
  { value: "today", label: "Today", versus: "vs yesterday" },
  { value: "week", label: "This week", versus: "vs previous 7 days" },
  { value: "month", label: "This month", versus: "vs previous 30 days" },
];

const PANEL = "rounded-2xl border border-slate-800/80 bg-slate-900/60 shadow-xl backdrop-blur-xl";
const TIER_COLORS = ["bg-blue-400", "bg-amber-400", "bg-purple-400", "bg-emerald-400", "bg-cyan-400"];
const TIER_GRADIENTS = ["from-blue-600/20 to-cyan-500/10", "from-cyan-500/30 to-blue-600/20", "from-purple-600/20 to-cyan-500/20"];
const TONE_DOT = { good: "bg-emerald-400", warn: "bg-amber-400", info: "bg-cyan-400" } as const;

function StatCard({ title, icon: Icon, glow, iconBox, children }: {
  title: string; icon: LucideIcon; glow: string; iconBox: string; children: ReactNode;
}) {
  return (
    <div className={`${PANEL} group relative overflow-hidden p-5 transition duration-300 hover:-translate-y-1 hover:border-cyan-500/50`}>
      <div className={`absolute -right-8 -top-8 h-28 w-28 rounded-full blur-2xl ${glow}`} />
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">{title}</span>
        <div className={`rounded-lg border p-2 ${iconBox}`}><Icon className="h-4 w-4" /></div>
      </div>
      {children}
    </div>
  );
}

const Foot = ({ children }: { children: ReactNode }) => (
  <div className="mt-3 flex items-center justify-between border-t border-slate-800/60 pt-3 text-xs">{children}</div>
);

function PeakHours({ hourly, peak }: { hourly: DashboardOverview["hourly"]; peak: number | null }) {
  const active = hourly.filter((h) => h.count > 0).map((h) => h.hour);
  const from = Math.min(6, ...active);
  const to = Math.max(21, ...active);
  const bars = hourly.filter((h) => h.hour >= from && h.hour <= to);
  const max = Math.max(1, ...bars.map((b) => b.count));

  return (
    <div>
      <div className="flex h-32 gap-1">
        {bars.map((b) => (
          <div key={b.hour} className="flex flex-1 flex-col justify-end" title={`${hourLabel(b.hour)}: ${b.count} check-ins`}>
            <div
              className={`w-full rounded-t ${b.hour === peak ? "bg-cyan-400" : "bg-cyan-500/30"}`}
              style={{ height: `${Math.max(4, (b.count / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-slate-500">
        <span>{hourLabel(from)}</span>
        <span>{hourLabel(to)}</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [range, setRange] = useState<DashboardRange>("week");
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api<DashboardOverview>(`dashboard/overview?range=${range}`));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 30_000); // keeps the numbers "live"
    return () => clearInterval(timer);
  }, [load]);

  function search(e: FormEvent) {
    e.preventDefault();
    router.push(query.trim() ? `/members?q=${encodeURIComponent(query.trim())}` : "/members");
  }

  const versus = RANGES.find((r) => r.value === range)!.versus;

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col items-start justify-between gap-4 border-b border-slate-800/60 pb-6 md:flex-row md:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">Dashboard Overview</h1>
            <span className="rounded-full border border-cyan-500/30 bg-cyan-950/80 px-2.5 py-1 font-mono text-xs text-cyan-400">LIVE</span>
          </div>
          <p className="mt-1 text-sm text-slate-400">Real-time gym performance and member metrics.</p>
        </div>

        <div className="flex w-full items-center gap-3 md:w-auto">
          <form onSubmit={search} className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search member, phone, ID..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-2 pl-9 pr-4 text-sm text-white placeholder-slate-500 transition focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </form>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as DashboardRange)}
            className="cursor-pointer rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-sm text-slate-300 focus:border-cyan-500 focus:outline-none"
          >
            {RANGES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <button onClick={load} aria-label="Refresh" className="rounded-xl border border-slate-800 bg-slate-900/80 p-2.5 text-slate-300 hover:text-cyan-400">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/40 p-4 text-rose-300">
          {error} <span className="text-rose-400/70">(the dashboard is admin-only)</span>
        </div>
      )}
      {!data && !error && <p className="text-slate-400">Loading…</p>}

      {data && (() => {
        const { revenue, checkIns, members, packages } = data;
        const up = (revenue.changePct ?? 0) >= 0;
        const sold = revenue.memberships + revenue.dayPasses;
        const memberShare = sold ? (revenue.memberships / sold) * 100 : 0;
        const fill = Math.min(100, Math.round((checkIns.today / checkIns.capacity) * 100));
        const peakLabel = checkIns.peakHour === null ? "No data yet" : `${hourLabel(checkIns.peakHour)} - ${hourLabel((checkIns.peakHour + 1) % 24)}`;

        return (
          <>
            {/* Hero cards */}
            <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard title="Est. revenue" icon={CreditCard} glow="bg-cyan-500/10" iconBox="border-cyan-500/20 bg-cyan-500/10 text-cyan-400">
                <div className="mt-2 text-3xl font-black tracking-tight text-white">{money(revenue.amount)}</div>
                <Foot>
                  {revenue.changePct === null ? (
                    <span className="text-slate-500">No earlier data</span>
                  ) : (
                    <span className={`flex items-center gap-1 rounded border px-2 py-0.5 font-medium ${up ? "border-emerald-500/30 bg-emerald-950/50 text-emerald-400" : "border-rose-500/30 bg-rose-950/50 text-rose-400"}`}>
                      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />} {up ? "+" : ""}{revenue.changePct}%
                    </span>
                  )}
                  <span className="text-slate-400">{versus}</span>
                </Foot>
                <div className="mt-3 flex h-1.5 w-full gap-1 overflow-hidden rounded-full bg-slate-800" title="Memberships vs day passes">
                  <div className="h-full bg-cyan-500" style={{ width: `${memberShare}%` }} />
                  <div className="h-full bg-blue-500" style={{ width: `${sold ? 100 - memberShare : 0}%` }} />
                </div>
              </StatCard>

              <StatCard title="Check-ins today" icon={UserCheck} glow="bg-emerald-500/10" iconBox="border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-3xl font-black tracking-tight text-white">{checkIns.today}</span>
                  <span className="font-mono text-xs text-slate-400">/ {checkIns.capacity} max</span>
                </div>
                <Foot>
                  <span className="flex items-center gap-1 text-slate-300"><Clock className="h-3 w-3 text-cyan-400" /> Peak: <b className="text-white">{peakLabel}</b></span>
                  <span className={fill >= 70 ? "font-medium text-amber-400" : "font-medium text-emerald-400"}>{fill >= 70 ? "Busy" : "Normal"}</span>
                </Foot>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400" style={{ width: `${fill}%` }} />
                </div>
              </StatCard>

              <StatCard title="Total members" icon={Users} glow="bg-blue-500/10" iconBox="border-blue-500/20 bg-blue-500/10 text-blue-400">
                <div className="mt-2 text-3xl font-black tracking-tight text-white">{members.total.toLocaleString()}</div>
                <Foot>
                  <span className="flex items-center gap-1 font-medium text-cyan-400"><Plus className="h-3 w-3" /> {members.newInRange} new</span>
                  <span className="text-slate-400">{versus.replace("vs ", "in ").replace("previous ", "last ")}</span>
                </Foot>
                <div className="mt-3 flex justify-between text-[11px] text-slate-400">
                  <span>{members.activePct}% active</span>
                  <span>{members.expiringSoon} renewal due</span>
                </div>
              </StatCard>

              <StatCard title="Active packages" icon={Package} glow="bg-purple-500/10" iconBox="border-purple-500/20 bg-purple-500/10 text-purple-400">
                <div className="mt-2 text-3xl font-black tracking-tight text-white">{packages.activePlans} {packages.activePlans === 1 ? "tier" : "tiers"}</div>
                <Foot>
                  {packages.top ? (
                    <>
                      <span className="text-slate-300">Top: <b className="text-amber-400">{packages.top.name}</b></span>
                      <span className="text-slate-400">{packages.top.share}% share</span>
                    </>
                  ) : (
                    <span className="text-slate-500">No subscribers yet</span>
                  )}
                </Foot>
                <div className="mt-3 flex h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                  {packages.breakdown.map((p, i) => (
                    <div key={p.id} className={`h-full ${TIER_COLORS[i % TIER_COLORS.length]}`} style={{ width: `${p.share}%` }} title={p.name} />
                  ))}
                </div>
              </StatCard>
            </section>

            {/* Insights */}
            <section className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-slate-900/90 via-cyan-950/30 to-slate-900/90 p-5 shadow-lg backdrop-blur-xl">
              <div className="flex items-start gap-3.5">
                <div className="mt-0.5 shrink-0 rounded-xl border border-cyan-500/40 bg-cyan-500/20 p-2.5 text-cyan-400">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">Gym Insights</h3>
                    <span className="rounded bg-cyan-500 px-2 py-0.5 text-[10px] font-black uppercase text-slate-950">Smart</span>
                  </div>
                  <ul className="mt-2 space-y-1.5">
                    {data.insights.map((i, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm leading-relaxed text-slate-300">
                        <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${TONE_DOT[i.tone]}`} />
                        {i.text}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* Feed + side panels */}
            <section className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className={`${PANEL} flex flex-col justify-between p-6 lg:col-span-2`}>
                <div>
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h3 className="flex items-center gap-2 text-lg font-bold text-white"><Activity className="h-5 w-5 text-cyan-400" /> Live check-ins</h3>
                      <p className="mt-0.5 text-xs text-slate-400">Most recent entries at the front desk</p>
                    </div>
                    <Link href="/check-in" className="flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-950/50 px-3 py-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300">
                      <Plus className="h-3.5 w-3.5" /> Quick check-in
                    </Link>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-800/80 text-xs font-semibold uppercase tracking-wider text-slate-400">
                          <th className="pb-3 pl-2">Member</th>
                          <th className="pb-3">ID</th>
                          <th className="pb-3">Package</th>
                          <th className="pb-3">Time</th>
                          <th className="pb-3 pr-2 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {data.recent.length === 0 && (
                          <tr><td colSpan={5} className="py-8 text-center text-slate-500">No check-ins yet.</td></tr>
                        )}
                        {data.recent.map((r) => {
                          const who = (
                            <div className="flex items-center gap-3">
                              <Avatar name={r.name} src={r.photoUrl} size={36} />
                              <span className="font-semibold text-slate-200">{r.name}</span>
                            </div>
                          );
                          return (
                            <tr key={r.id} className="transition-colors hover:bg-slate-800/40">
                              <td className="py-3.5 pl-2">{r.memberId ? <Link href={`/members/${r.memberId}`} className="hover:text-cyan-300">{who}</Link> : who}</td>
                              <td className="py-3.5 font-mono text-xs text-slate-400">{r.code}</td>
                              <td className="py-3.5">
                                <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${r.type === "DAY_PASS" ? "border-amber-500/30 bg-amber-950/60 text-amber-300" : "border-blue-500/30 bg-blue-950/60 text-blue-300"}`}>
                                  {r.plan}
                                </span>
                              </td>
                              <td className="py-3.5 text-xs text-slate-400">{timeAgo(r.time)}</td>
                              <td className="py-3.5 pr-2 text-right">
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/50 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                                  {r.type === "DAY_PASS" ? "Day pass" : "Active"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-slate-800/80 pt-4 text-xs text-slate-400">
                  <span>Showing {data.recent.length} of {checkIns.today} entries today</span>
                  <Link href="/check-in" className="flex items-center gap-1 font-medium text-cyan-400 hover:underline">
                    Open check-in <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              <div className="space-y-6">
                <div className={`${PANEL} p-6`}>
                  <div className="mb-5 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-base font-bold text-white"><Package className="h-4 w-4 text-cyan-400" /> Membership tiers</h3>
                    <Link href="/plans" className="font-mono text-xs text-slate-400 hover:text-cyan-400">{packages.activePlans} active</Link>
                  </div>
                  <div className="space-y-3.5">
                    {packages.breakdown.length === 0 && <p className="text-sm text-slate-500">No packages yet.</p>}
                    {packages.breakdown.map((p, i) => (
                      <div key={p.id} className={`relative rounded-xl border border-slate-800 bg-gradient-to-r p-4 transition hover:border-cyan-500/40 ${TIER_GRADIENTS[i % TIER_GRADIENTS.length]}`}>
                        {packages.top?.name === p.name && (
                          <span className="absolute -top-2.5 right-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 px-2 py-0.5 text-[10px] font-black text-slate-950">MOST POPULAR</span>
                        )}
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-bold text-slate-100">{p.name}</h4>
                            <p className="mt-0.5 text-xs text-slate-400">{p.subscribers} active subscriber{p.subscribers === 1 ? "" : "s"}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-extrabold text-white">{money(p.price)}</span>
                            <span className="block text-[10px] text-slate-400">{p.durationDays} days</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`${PANEL} p-6`}>
                  <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-white"><Clock className="h-4 w-4 text-cyan-400" /> Peak hours</h3>
                  <PeakHours hourly={data.hourly} peak={checkIns.peakHour} />
                </div>
              </div>
            </section>
          </>
        );
      })()}
    </div>
  );
}