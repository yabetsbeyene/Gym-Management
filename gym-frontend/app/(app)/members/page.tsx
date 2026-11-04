"use client";
import { QRCodeSVG } from "qrcode.react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { displayStatus, fmtDate, fmtDateTime, fullName, memberCode, statusStyle } from "@/lib/format";
import type { Member, MembershipStatus, Plan } from "@/lib/types";

export default function MemberProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [member, setMember] = useState<Member | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [planId, setPlanId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(() => api<Member>(`members/${id}`).then(setMember).catch((e) => setError(e.message)), [id]);

  useEffect(() => {
    load();
    api<Plan[]>("plans").then(setPlans).catch(() => {});
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

  const renew = () =>
    run(() => api(`members/${id}/renew`, { method: "POST", body: JSON.stringify({ planId }) }), "Membership renewed.");
  const setStatus = (status: MembershipStatus) =>
    run(() => api(`members/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }), `Status set to ${status}.`);

  if (!member) return error ? <div className="rounded bg-red-50 p-3 text-red-700">{error}</div> : <p className="text-slate-500">Loading…</p>;

  const latest = member.memberships[0];
  const status = displayStatus(latest);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
      <div className="space-y-6 print:hidden">
        <header className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold">{fullName(member)}</h1>
            <div className="text-sm text-slate-500">
              {memberCode(member.memberNumber)} · {member.phone}
            </div>
          </div>
          <span className={`ml-auto rounded px-2 py-1 text-xs font-medium ${statusStyle[status]}`}>{status}</span>
        </header>

        {error && <div className="rounded bg-red-50 p-3 text-red-700">{error}</div>}
        {notice && <div className="rounded bg-green-50 p-3 text-green-700">{notice}</div>}

        <section className="space-y-4 rounded-xl border bg-white p-5">
          <h2 className="font-semibold">Current membership</h2>
          {latest ? (
            <div className="text-sm text-slate-600">
              {latest.plan?.name} · {fmtDate(latest.startDate)} → {fmtDate(latest.endDate)}
            </div>
          ) : (
            <div className="text-sm text-slate-500">No membership yet.</div>
          )}
          {latest && (
            <div className="flex gap-2">
              {latest.status !== "FROZEN" && <button onClick={() => setStatus("FROZEN")} className="rounded border px-3 py-1 text-sm hover:bg-slate-50">Freeze</button>}
              {latest.status !== "SUSPENDED" && <button onClick={() => setStatus("SUSPENDED")} className="rounded border px-3 py-1 text-sm hover:bg-slate-50">Suspend</button>}
              {latest.status !== "ACTIVE" && <button onClick={() => setStatus("ACTIVE")} className="rounded border px-3 py-1 text-sm hover:bg-slate-50">Activate</button>}
            </div>
          )}
        </section>

        <section className="space-y-3 rounded-xl border bg-white p-5">
          <h2 className="font-semibold">Renew membership</h2>
          <div className="flex gap-2">
            <select value={planId} onChange={(e) => setPlanId(e.target.value)} className="flex-1 rounded-md border bg-white p-2">
              <option value="">Choose a plan…</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.durationDays} days, {Number(p.price)})
                </option>
              ))}
            </select>
            <button disabled={!planId} onClick={renew} className="rounded-md bg-indigo-600 px-4 font-medium text-white hover:bg-indigo-700 disabled:opacity-40">
              Renew
            </button>
          </div>
          <p className="text-xs text-slate-500">If the current membership is still running, the new one starts the day after it ends.</p>
        </section>

        <section className="rounded-xl border bg-white p-5">
          <h2 className="mb-2 font-semibold">History</h2>
          <ul className="divide-y text-sm">
            {member.memberships.map((m) => (
              <li key={m.id} className="flex justify-between py-2">
                <span>{m.plan?.name} · {fmtDate(m.startDate)} → {fmtDate(m.endDate)}</span>
                <span className={`rounded px-2 text-xs ${statusStyle[displayStatus(m)]}`}>{displayStatus(m)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border bg-white p-5">
          <h2 className="mb-2 font-semibold">Recent check-ins</h2>
          {member.checkIns?.length ? (
            <ul className="divide-y text-sm">
              {member.checkIns.map((c) => (
                <li key={c.id} className="py-2">{fmtDateTime(c.checkInTime)}</li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-slate-500">No check-ins yet.</div>
          )}
        </section>
      </div>

      <aside className="space-y-3">
        <div className="w-72 rounded-2xl border-2 border-indigo-600 bg-white p-5 text-center">
          <div className="text-xs font-semibold tracking-widest text-indigo-600">GYMMANAGER MEMBER</div>
          <div className="mt-2 text-lg font-bold">{fullName(member)}</div>
          <div className="font-mono text-sm text-slate-600">{memberCode(member.memberNumber)}</div>
          <div className="mt-3 flex justify-center">
            <QRCodeSVG value={member.id} size={176} />
          </div>
        </div>
        <button onClick={() => window.print()} className="w-full rounded-md border bg-white p-2 text-sm hover:bg-slate-50 print:hidden">
          Print card
        </button>
      </aside>
    </div>
  );
}