"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { fmtDate, memberCode } from "@/lib/format";
import { BTN, BTN_DANGER, BTN_PRIMARY, PANEL, TH } from "@/lib/ui";
import type { PendingDeletion, RetentionSettings } from "@/lib/types";
import Avatar from "@/components/Avatar";

const badge = (left: number) =>
  left <= 0
    ? "border-rose-500/40 bg-rose-950/50 text-rose-300"
    : left <= 2
      ? "border-amber-500/40 bg-amber-950/50 text-amber-300"
      : "border-slate-600 bg-slate-800 text-slate-300";

export default function CleanupPage() {
  const [settings, setSettings] = useState<RetentionSettings | null>(null);
  const [rows, setRows] = useState<PendingDeletion[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    try {
      const [s, p] = await Promise.all([api<RetentionSettings>("retention"), api<PendingDeletion[]>("retention/pending")]);
      setSettings(s);
      setRows(p);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function run(action: () => Promise<unknown>, success: (r: any) => string) {
    setError("");
    setNotice("");
    try {
      setNotice(success(await action()));
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const due = rows.filter((r) => r.daysLeft <= 0).length;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Automatic cleanup</h1>
          {settings && (
            <p className="mt-1 max-w-2xl text-sm text-slate-400">
              {settings.enabled
                ? `Members whose membership ended more than ${settings.days} days ago and was not renewed are permanently deleted automatically (checked every hour). Frozen, suspended and protected members are never deleted.`
                : "Automatic deletion is switched off (AUTO_DELETE_ENABLED=false in the backend .env)."}
            </p>
          )}
        </div>
        <button
          disabled={!settings?.enabled || due === 0}
          onClick={() => {
            if (window.confirm(`Delete the ${due} member(s) who are past the deadline now? This cannot be undone.`)) {
              run(() => api("retention/run", { method: "POST" }), (r) => `Cleanup finished: ${r.deleted} member(s) deleted.`);
            }
          }}
          className={`${BTN_PRIMARY} ml-auto`}
        >
          Run cleanup now{due ? ` (${due})` : ""}
        </button>
      </header>

      {error && <div className="rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-rose-300">{error}</div>}
      {notice && <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-3 text-emerald-300">{notice}</div>}

      <div className={`${PANEL} overflow-x-auto p-5`}>
        <h2 className="mb-3 font-semibold text-white">Scheduled for deletion ({rows.length})</h2>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800/80">
              <th className={TH}>Member</th>
              <th className={TH}>Package</th>
              <th className={TH}>Ended on</th>
              <th className={TH}>Deleted on</th>
              <th className={TH}>Time left</th>
              <th className={TH}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50 text-slate-300">
            {rows.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-slate-500">Nobody is waiting for deletion.</td></tr>}
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="py-3.5">
                  <Link href={`/members/${r.id}`} className="flex items-center gap-3 hover:text-cyan-300">
                    <Avatar name={r.name} src={r.photoUrl} size={36} />
                    <div>
                      <div className="font-semibold text-slate-100">{r.name}</div>
                      <div className="font-mono text-xs text-slate-500">{memberCode(r.memberNumber)} · {r.phone}</div>
                    </div>
                  </Link>
                </td>
                <td>{r.plan}</td>
                <td className="text-xs">{fmtDate(r.endedOn)}</td>
                <td className="text-xs">{fmtDate(r.deleteOn)}</td>
                <td>
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${badge(r.daysLeft)}`}>
                    {r.daysLeft <= 0 ? "Due now" : `${r.daysLeft} day${r.daysLeft === 1 ? "" : "s"}`}
                  </span>
                </td>
                <td>
                  <div className="flex flex-wrap gap-1.5">
                    <Link href={`/members/${r.id}`} className={BTN}>Renew</Link>
                    <button className={BTN} onClick={() => run(() => api(`members/${r.id}/protect`, { method: "POST" }), () => `${r.name} is protected from automatic deletion.`)}>
                      Protect
                    </button>
                    <button
                      className={BTN_DANGER}
                      onClick={() => {
                        if (window.prompt(`Permanently erase ${r.name}?\nType DELETE to confirm:`) === "DELETE") {
                          run(() => api(`members/${r.id}`, { method: "DELETE" }), () => `${r.name} was deleted.`);
                        }
                      }}
                    >
                      Delete now
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}