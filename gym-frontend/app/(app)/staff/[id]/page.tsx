"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { PANEL } from "@/lib/ui";
import type { AuditList, Staff } from "@/lib/types";
import StaffForm, { fromStaff, staffPayload, type StaffFormValues } from "@/components/StaffForm";

export default function EditStaffPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [staff, setStaff] = useState<Staff | null>(null);
  const [activity, setActivity] = useState<AuditList | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Staff>(`staff/${id}`).then(setStaff).catch((e) => setError(e.message));
    api<AuditList>(`audit?actorId=${id}&limit=15`).then(setActivity).catch(() => {});
  }, [id]);

  async function save(values: StaffFormValues) {
    await api(`staff/${id}`, { method: "PATCH", body: JSON.stringify(staffPayload(values, false)) });
    router.push("/staff");
  }

  if (!staff) return error ? <div className="rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-rose-300">{error}</div> : <p className="text-slate-400">Loading…</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-extrabold text-white">Edit {staff.name}</h1>
      <StaffForm initial={fromStaff(staff)} withPassword={false} submitLabel="Save changes" onSubmit={save} onCancel={() => router.push("/staff")} />

      <section className={`${PANEL} p-5 text-sm text-slate-300`}>
        <h2 className="mb-2 font-semibold text-white">Account</h2>
        <p>Created {fmtDate(staff.createdAt)} by {staff.createdBy?.name ?? "system"}</p>
        <p>Last sign-in: {staff.lastLoginAt ? fmtDateTime(staff.lastLoginAt) : "Never"}</p>
      </section>

      <section className={`${PANEL} p-5`}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-white">Recent activity</h2>
          <Link href={`/audit?actor=${id}`} className="text-xs text-cyan-400 hover:underline">View full log →</Link>
        </div>
        {activity?.items.length ? (
          <ul className="divide-y divide-slate-800/60 text-sm">
            {activity.items.map((a) => (
              <li key={a.id} className="flex justify-between gap-4 py-2 text-slate-300">
                <span>{a.summary}</span>
                <span className="shrink-0 text-xs text-slate-500">{fmtDateTime(a.createdAt)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No recorded activity yet.</p>
        )}
      </section>
    </div>
  );
}