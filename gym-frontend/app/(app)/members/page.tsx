"use client";
import { QRCodeSVG } from "qrcode.react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useRole } from "@/lib/useRole";
import { displayStatus, fmtDate, fmtDateTime, fullName, memberCode, statusStyle } from "@/lib/format";
import type { CheckResult, Member, MembershipStatus, Plan } from "@/lib/types";
import Avatar from "@/components/Avatar";
import MemberForm, { fromMember, toPayload, type MemberFormValues } from "@/components/MemberForm";
import PlanPicker from "@/components/PlanPicker";

const btn = "rounded-md border bg-white px-3 py-1.5 text-sm hover:bg-slate-50";

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium">{value || "-"}</dd>
    </div>
  );
}

export default function MemberProfilePage() {
  const { id } = useParams<{ id: string }>();
  const isAdmin = useRole() === "ADMIN";
  const [member, setMember] = useState<Member | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [planId, setPlanId] = useState("");
  const [editing, setEditing] = useState(false);
  const [sms, setSms] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(() => api<Member>(`members/${id}`).then(setMember).catch((e) => setError(e.message)), [id]);

  useEffect(() => {
    load();
    api<Plan[]>("plans").then(setPlans).catch(() => {});
  }, [load]);

  /** Runs an action, shows success/error, then refreshes the profile. */
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

  async function saveProfile(values: MemberFormValues) {
    await api(`members/${id}`, { method: "PATCH", body: JSON.stringify(toPayload(values, false)) });
    setEditing(false);
    setNotice("Profile saved.");
    await load();
  }

  function changeStatus(status: MembershipStatus, askReason = false) {
    const reason = askReason ? window.prompt("Reason (optional):") : undefined;
    if (reason === null) return; // cancelled
    run(() => api(`members/${id}/status`, { method: "PATCH", body: JSON.stringify({ status, reason: reason || undefined }) }), `Status set to ${status}.`);
  }

  const renew = () =>
    run(async () => {
      await api(`members/${id}/renew`, { method: "POST", body: JSON.stringify({ planId }) });
      setPlanId("");
    }, "Membership added.");

  const sendSms = () =>
    run(async () => {
      await api("sms/send", { method: "POST", body: JSON.stringify({ memberId: id, message: sms }) });
      setSms("");
    }, "SMS sent.");

  const archive = (archived: boolean) => {
    if (archived && !window.confirm("Archive this member? They will be blocked from checking in.")) return;
    run(() => api(`members/${id}/${archived ? "archive" : "restore"}`, { method: "POST" }), archived ? "Member archived." : "Member restored.");
  };

  async function checkInNow() {
    setError("");
    setNotice("");
    try {
      const r = await api<CheckResult>("check-ins", { method: "POST", body: JSON.stringify({ personIdentifier: id }) });
      if (!r.allowed) setError(`Denied: ${r.reason}`);
      else setNotice(r.duplicate ? "Already checked in recently." : "Checked in.");
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (!member) return error ? <div className="rounded bg-red-50 p-3 text-red-700">{error}</div> : <p className="text-slate-500">Loading…</p>;

  const latest = member.memberships[0];
  const status = displayStatus(latest);
  const name = fullName(member);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
      <div className="space-y-6 print:hidden">
        <header className="flex flex-wrap items-center gap-4">
          <Avatar name={name} src={member.photoUrl} size={64} />
          <div>
            <h1 className="text-2xl font-bold">{name}</h1>
            <div className="text-sm text-slate-500">{memberCode(member.memberNumber)} · {member.phone}</div>
          </div>
          <span className={`rounded px-2 py-1 text-xs font-medium ${statusStyle[status]}`}>{status}</span>
          {member.archivedAt && <span className="rounded bg-slate-800 px-2 py-1 text-xs text-white">ARCHIVED</span>}
          <button onClick={checkInNow} className="ml-auto rounded-md bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700">
            Check in now
          </button>
        </header>

        {error && <div className="rounded bg-red-50 p-3 text-red-700">{error}</div>}
        {notice && <div className="rounded bg-green-50 p-3 text-green-700">{notice}</div>}

        {/* Details */}
        {editing ? (
          <MemberForm initial={fromMember(member)} submitLabel="Save changes" onSubmit={saveProfile} onCancel={() => setEditing(false)} />
        ) : (
          <section className="rounded-xl border bg-white p-5">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-semibold">Profile</h2>
              <button onClick={() => setEditing(true)} className={btn}>Edit profile</button>
            </div>
            <dl className="divide-y">
              <Row label="Email" value={member.email} />
              <Row label="Gender" value={member.gender} />
              <Row label="Date of birth" value={member.dateOfBirth && fmtDate(member.dateOfBirth)} />
              <Row label="Address" value={member.address} />
              <Row label="Emergency contact" value={[member.emergencyContactName, member.emergencyContactPhone].filter(Boolean).join(" · ")} />
              <Row label="Joined" value={fmtDate(member.joinedAt)} />
              <Row label="Notes" value={member.notes} />
            </dl>
          </section>
        )}

        {/* Membership */}
        <section className="space-y-4 rounded-xl border bg-white p-5">
          <h2 className="font-semibold">Membership</h2>
          {latest ? (
            <div className="text-sm text-slate-600">
              {latest.plan?.name} · {fmtDate(latest.startDate)} → {fmtDate(latest.endDate)}
              {latest.statusReason && <span className="ml-2 text-slate-500">({latest.statusReason})</span>}
            </div>
          ) : (
            <div className="text-sm text-slate-500">No package yet. Choose one below.</div>
          )}

          {latest && (
            <div className="flex flex-wrap gap-2">
              {latest.status === "ACTIVE" && <button onClick={() => changeStatus("FROZEN", true)} className={btn}>Freeze</button>}
              {latest.status !== "SUSPENDED" && <button onClick={() => changeStatus("SUSPENDED", true)} className={btn}>Suspend</button>}
              {(latest.status === "FROZEN" || latest.status === "SUSPENDED") && (
                <button onClick={() => changeStatus("ACTIVE")} className={`${btn} border-green-600 text-green-700`}>Activate</button>
              )}
            </div>
          )}

          <div className="space-y-3 border-t pt-4">
            <h3 className="text-sm font-medium">{latest ? "Renew or add a package" : "Choose a package"}</h3>
            <PlanPicker plans={plans} value={planId} onChange={setPlanId} />
            <div className="flex items-center gap-3">
              <button disabled={!planId} onClick={renew} className="rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-40">
                {latest ? "Renew" : "Assign package"}
              </button>
              <span className="text-xs text-slate-500">If the current one is still running, the new one starts the day after it ends.</span>
            </div>
          </div>

          {member.memberships.length > 0 && (
            <ul className="divide-y border-t pt-2 text-sm">
              {member.memberships.map((m) => (
                <li key={m.id} className="flex justify-between py-2">
                  <span>{m.plan?.name} · {fmtDate(m.startDate)} → {fmtDate(m.endDate)}</span>
                  <span className={`rounded px-2 text-xs ${statusStyle[displayStatus(m)]}`}>{displayStatus(m)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* SMS */}
        <section className="space-y-3 rounded-xl border bg-white p-5">
          <h2 className="font-semibold">SMS to {member.phone}</h2>
          <textarea value={sms} onChange={(e) => setSms(e.target.value)} rows={2} maxLength={480} placeholder="Type a message…" className="w-full rounded-md border bg-white p-2" />
          <button disabled={!sms.trim()} onClick={sendSms} className="rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-40">
            Send SMS
          </button>
          {member.notifications && member.notifications.length > 0 && (
            <ul className="divide-y border-t text-sm">
              {member.notifications.map((n) => (
                <li key={n.id} className="flex justify-between gap-3 py-2">
                  <span className="truncate">{n.message}</span>
                  <span className="shrink-0 text-xs text-slate-500">{n.status} · {fmtDateTime(n.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Check-ins */}
        <section className="rounded-xl border bg-white p-5">
          <h2 className="mb-2 font-semibold">Recent check-ins</h2>
          {member.checkIns?.length ? (
            <ul className="divide-y text-sm">
              {member.checkIns.map((c) => <li key={c.id} className="py-2">{fmtDateTime(c.checkInTime)}</li>)}
            </ul>
          ) : (
            <div className="text-sm text-slate-500">No check-ins yet.</div>
          )}
        </section>

        {isAdmin && (
          <section className="rounded-xl border border-red-200 bg-white p-5">
            <h2 className="mb-2 font-semibold text-red-700">Admin</h2>
            {member.archivedAt ? (
              <button onClick={() => archive(false)} className={btn}>Restore member</button>
            ) : (
              <button onClick={() => archive(true)} className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50">
                Archive member
              </button>
            )}
          </section>
        )}
      </div>

      {/* QR card */}
      <aside className="space-y-3">
        <div className="w-72 rounded-2xl border-2 border-indigo-600 bg-white p-5 text-center">
          <div className="text-xs font-semibold tracking-widest text-indigo-600">GYMMANAGER MEMBER</div>
          <div className="mt-3 flex justify-center"><Avatar name={name} src={member.photoUrl} size={72} /></div>
          <div className="mt-2 text-lg font-bold">{name}</div>
          <div className="font-mono text-sm text-slate-600">{memberCode(member.memberNumber)}</div>
          <div className="mt-3 flex justify-center"><QRCodeSVG value={member.id} size={176} /></div>
        </div>
        <div className="flex gap-2 print:hidden">
          <button onClick={() => window.print()} className={`${btn} flex-1`}>Print card</button>
          <button onClick={() => navigator.clipboard.writeText(member.id).then(() => setNotice("Member ID copied."))} className={`${btn} flex-1`}>
            Copy ID
          </button>
        </div>
      </aside>
    </div>
  );
}