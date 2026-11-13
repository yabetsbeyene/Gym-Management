"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { fmtDateTime } from "@/lib/format";
import { BTN, INPUT, PANEL, TH } from "@/lib/ui";
import type { AuditActor, AuditList } from "@/lib/types";

const ROLE_STYLE: Record<string, string> = {
  ADMIN: "border-cyan-500/30 bg-cyan-950/50 text-cyan-300",
  RECEPTIONIST: "border-emerald-500/30 bg-emerald-950/50 text-emerald-300",
};

export default function AuditPage() {
  const [actors, setActors] = useState<AuditActor[]>([]);
  const [actorId, setActorId] = useState("");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AuditList | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<AuditActor[]>("audit/actors").then(setActors).catch(() => {});
    const actor = new URLSearchParams(window.location.search).get("actor"); // from the Staff page
    if (actor) setActorId(actor);
  }, []);

  useEffect(() => {
    const qs = new URLSearchParams({ page: String(page), limit: "30" });
    if (actorId) qs.set("actorId", actorId);
    if (search) qs.set("search", search);
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    const t = setTimeout(() => {
      api<AuditList>(`audit?${qs}`).then((d) => { setData(d); setError(""); }).catch((e) => setError(e.message));
    }, 250);
    return () => clearTimeout(t);
  }, [actorId, search, from, to, page]);

  const filter = <T,>(set: (v: T) => void) => (v: T) => { set(v); setPage(1); };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold text-white">Audit log</h1>
        <p className="text-sm text-slate-400">Who did what, and when. Entries cannot be edited or deleted.</p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <select value={actorId} onChange={(e) => filter(setActorId)(e.target.value)} className={`${INPUT} w-56`}>
          <option value="">Everyone</option>
          {actors.filter((a) => a.actorId).map((a) => (
            <option key={a.actorId} value={a.actorId!}>{a.actorName} ({a.count})</option>
          ))}
        </select>
        <input value={search} onChange={(e) => filter(setSearch)(e.target.value)} placeholder="Search actions…" className={`${INPUT} w-64`} />
        <label className="flex items-center gap-2 text-xs text-slate-400">From <input type="date" value={from} onChange={(e) => filter(setFrom)(e.target.value)} className={`${INPUT} w-auto`} /></label>
        <label className="flex items-center gap-2 text-xs text-slate-400">To <input type="date" value={to} onChange={(e) => filter(setTo)(e.target.value)} className={`${INPUT} w-auto`} /></label>
      </div>

      {error && <div className="rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-rose-300">{error}</div>}

      <div className={`${PANEL} overflow-x-auto p-5`}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800/80">
              <th className={TH}>When</th>
              <th className={TH}>Who</th>
              <th className={TH}>What happened</th>
              <th className={TH}>Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50 text-slate-300">
            {data?.items.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-slate-500">No entries found.</td></tr>}
            {data?.items.map((a) => (
              <tr key={a.id} className="align-top">
                <td className="whitespace-nowrap py-3 pr-4 text-xs">{fmtDateTime(a.createdAt)}</td>
                <td className="py-3 pr-4">
                  <div className="font-medium text-slate-100">{a.actorName}</div>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${ROLE_STYLE[a.actorRole] ?? "border-slate-600 bg-slate-800 text-slate-300"}`}>{a.actorRole}</span>
                </td>
                <td className="py-3 pr-4">
                  {a.summary}
                  {a.entityType === "Member" && a.entityId && <Link href={`/members/${a.entityId}`} className="ml-2 text-xs text-cyan-400 hover:underline">View member</Link>}
                  <div className="font-mono text-[11px] text-slate-500">{a.action}</div>
                </td>
                <td className="py-3">
                  {a.details ? (
                    <details>
                      <summary className="cursor-pointer text-xs text-cyan-400">Show</summary>
                      <pre className="mt-1 max-w-xs overflow-x-auto whitespace-pre-wrap text-[11px] text-slate-400">{JSON.stringify(a.details, null, 2)}</pre>
                    </details>
                  ) : <span className="text-slate-600">-</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.pages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm text-slate-400">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className={BTN}>Previous</button>
          <span>Page {data.page} of {data.pages} · {data.total} entries</span>
          <button disabled={page >= data.pages} onClick={() => setPage(page + 1)} className={BTN}>Next</button>
        </div>
      )}
    </div>
  );
}