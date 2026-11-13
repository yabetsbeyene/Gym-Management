"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { BTN, BTN_DANGER, BTN_PRIMARY, PANEL, TH } from "@/lib/ui";
import type { StaffList } from "@/lib/types";
import Avatar from "@/components/Avatar";

export default function StaffPage() {
  const [data, setData] = useState<StaffList | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(() => api<StaffList>("staff").then(setData).catch((e) => setError(e.message)), []);
  useEffect(() => {
    load();
  }, [load]);

  async function run(action: () => Promise<unknown>, success: string) {
    setError("");
    setNotice("");
    try {
      await action();
      setNotice(success);
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const full = !!data && data.used >= data.max;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Staff</h1>
          <p className="text-sm text-slate-400">Receptionist accounts. Every action they take is recorded in the audit log.</p>
        </div>
        {data && (
          <span className={`rounded-full border px-3 py-1 font-mono text-xs ${full ? "border-amber-500/40 bg-amber-950/40 text-amber-300" : "border-cyan-500/30 bg-cyan-950/40 text-cyan-300"}`}>
            {data.used} / {data.max} receptionists
          </span>
        )}
        {full ? (
          <span title="Delete a receptionist to free a slot" className={`${BTN_PRIMARY} ml-auto cursor-not-allowed opacity-40`}>+ Add receptionist</span>
        ) : (
          <Link href="/staff/new" className={`${BTN_PRIMARY} ml-auto`}>+ Add receptionist</Link>
        )}
      </header>

      {error && <div className="rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-rose-300">{error}</div>}
      {notice && <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-3 text-emerald-300">{notice}</div>}

      <div className={`${PANEL} overflow-x-auto p-5`}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800/80">
              <th className={TH}>Receptionist</th>
              <th className={TH}>Phone</th>
              <th className={TH}>Status</th>
              <th className={TH}>Last sign-in</th>
              <th className={TH}>Created</th>
              <th className={TH}>Activity</th>
              <th className={TH}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50 text-slate-300">
            {data?.items.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-slate-500">No receptionists yet.</td></tr>}
            {data?.items.map((s) => (
              <tr key={s.id} className="align-middle">
                <td className="py-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar name={s.name} src={s.photoUrl} size={38} />
                    <div>
                      <div className="font-semibold text-slate-100">{s.name}</div>
                      <div className="text-xs text-slate-400">{s.email}</div>
                    </div>
                  </div>
                </td>
                <td>{s.phone ?? "-"}</td>
                <td>
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${s.isActive ? "border-emerald-500/30 bg-emerald-950/50 text-emerald-300" : "border-slate-600 bg-slate-800 text-slate-300"}`}>
                    {s.isActive ? "Active" : "Deactivated"}
                  </span>
                </td>
                <td className="text-xs">{s.lastLoginAt ? fmtDateTime(s.lastLoginAt) : "Never"}</td>
                <td className="text-xs">
                  {fmtDate(s.createdAt)}
                  <div className="text-slate-500">by {s.createdBy?.name ?? "system"}</div>
                </td>
                <td className="text-xs">
                  {s._count?.checkIns ?? 0} check-ins
                  <div className="text-slate-500">{s._count?.dayPassesCreated ?? 0} day passes</div>
                </td>
                <td>
                  <div className="flex flex-wrap gap-1.5">
                    <Link href={`/staff/${s.id}`} className={BTN}>Edit</Link>
                    <Link href={`/audit?actor=${s.id}`} className={BTN}>Activity</Link>
                    <button
                      className={BTN}
                      onClick={() => {
                        const password = window.prompt(`New password for ${s.name} (at least 8 characters):`);
                        if (password) run(() => api(`staff/${s.id}/reset-password`, { method: "POST", body: JSON.stringify({ password }) }), `Password updated for ${s.name}. Give it to them privately.`);
                      }}
                    >
                      Reset password
                    </button>
                    <button className={BTN} onClick={() => run(() => api(`staff/${s.id}/${s.isActive ? "deactivate" : "activate"}`, { method: "POST" }), `${s.name} ${s.isActive ? "deactivated" : "activated"}.`)}>
                      {s.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      className={BTN_DANGER}
                      onClick={() => {
                        if (window.confirm(`Delete ${s.name}?\n\nThey will no longer be able to sign in. Their name stays in the history of check-ins and the audit log. This cannot be undone.`)) {
                          run(() => api(`staff/${s.id}`, { method: "DELETE" }), `${s.name} was deleted.`);
                        }
                      }}
                    >
                      Delete
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