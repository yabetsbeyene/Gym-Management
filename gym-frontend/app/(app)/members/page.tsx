"use client";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

const badge: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  EXPIRED: "bg-slate-200 text-slate-700",
  FROZEN: "bg-blue-100 text-blue-700",
  SUSPENDED: "bg-red-100 text-red-700",
  "NO PLAN": "bg-amber-100 text-amber-700",
};

function displayStatus(m: any) {
  const ms = m.memberships?.[0];
  if (!ms) return "NO PLAN";
  const today = new Date().toISOString().slice(0, 10);
  if (ms.status === "ACTIVE" && ms.endDate.slice(0, 10) < today) return "EXPIRED";
  return ms.status as string;
}

export default function MembersPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [plans, setPlans] = useState<any[]>([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", planId: "" });
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api(`members?search=${encodeURIComponent(search)}&limit=50`)
      .then((d) => {
        setMembers(d.items);
        setTotal(d.total);
      })
      .catch((e) => setError(e.message));
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    api("plans").then(setPlans).catch(() => {});
  }, []);

  async function addMember(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api("members", {
        method: "POST",
        body: JSON.stringify({ ...form, planId: form.planId || undefined }),
      });
      setForm({ firstName: "", lastName: "", phone: "", planId: "" });
      setShow(false);
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function setStatus(id: string, status: string) {
    setError("");
    try {
      await api(`members/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function sendSms(m: any) {
    const message = window.prompt(`SMS to ${m.firstName} ${m.lastName} (${m.phone}):`);
    if (!message) return;
    try {
      const r = await api("sms/send", { method: "POST", body: JSON.stringify({ memberId: m.id, message }) });
      window.alert(`SMS status: ${r.status}`);
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Members <span className="text-base font-normal text-slate-500">({total})</span></h1>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or phone"
          className="ml-auto w-64 rounded-md border bg-white p-2"
        />
        <button onClick={() => setShow(!show)} className="rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700">
          {show ? "Cancel" : "+ Add member"}
        </button>
      </div>

      {error && <div className="rounded bg-red-50 p-3 text-red-700">{error}</div>}

      {show && (
        <form onSubmit={addMember} className="grid gap-3 rounded-xl border bg-white p-4 md:grid-cols-5">
          <input className="rounded-md border p-2" placeholder="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
          <input className="rounded-md border p-2" placeholder="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
          <input className="rounded-md border p-2" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          <select className="rounded-md border bg-white p-2" value={form.planId} onChange={(e) => setForm({ ...form, planId: e.target.value })}>
            <option value="">No plan yet</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.durationDays}d, {Number(p.price)})</option>
            ))}
          </select>
          <button className="rounded-md bg-green-600 p-2 font-medium text-white hover:bg-green-700">Save</button>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="p-3">#</th>
              <th className="p-3">Name</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Plan</th>
              <th className="p-3">Expires</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {members.length === 0 && (
              <tr><td colSpan={7} className="p-4 text-slate-500">No members found.</td></tr>
            )}
            {members.map((m) => {
              const ms = m.memberships?.[0];
              const st = displayStatus(m);
              return (
                <tr key={m.id}>
                  <td className="p-3 font-mono text-xs">GYM-{String(m.memberNumber).padStart(4, "0")}</td>
                  <td className="p-3 font-medium">{m.firstName} {m.lastName}</td>
                  <td className="p-3">{m.phone}</td>
                  <td className="p-3">{ms?.plan?.name ?? "-"}</td>
                  <td className="p-3">{ms ? ms.endDate.slice(0, 10) : "-"}</td>
                  <td className="p-3"><span className={`rounded px-2 py-0.5 text-xs font-medium ${badge[st]}`}>{st}</span></td>
                  <td className="flex flex-wrap gap-1 p-3">
                    {ms && ms.status !== "FROZEN" && <button onClick={() => setStatus(m.id, "FROZEN")} className="rounded border px-2 py-1 text-xs hover:bg-slate-50">Freeze</button>}
                    {ms && ms.status !== "SUSPENDED" && <button onClick={() => setStatus(m.id, "SUSPENDED")} className="rounded border px-2 py-1 text-xs hover:bg-slate-50">Suspend</button>}
                    {ms && ms.status !== "ACTIVE" && <button onClick={() => setStatus(m.id, "ACTIVE")} className="rounded border px-2 py-1 text-xs hover:bg-slate-50">Activate</button>}
                    <button onClick={() => sendSms(m)} className="rounded border px-2 py-1 text-xs hover:bg-slate-50">SMS</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}