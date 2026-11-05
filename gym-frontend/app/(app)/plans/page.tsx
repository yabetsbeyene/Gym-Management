"use client";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useRole } from "@/lib/useRole";
import type { Plan } from "@/lib/types";

const blank = { name: "", description: "", durationDays: "30", price: "" };
const box = "w-full rounded-md border bg-white p-2";

export default function PlansPage() {
  const role = useRole();
  const isAdmin = role === "ADMIN";
  const [plans, setPlans] = useState<Plan[]>([]);
  const [form, setForm] = useState(blank);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(
    () => api<Plan[]>(isAdmin ? "plans?all=true" : "plans").then(setPlans).catch((e) => setError(e.message)),
    [isAdmin],
  );

  useEffect(() => {
    if (role) load();
  }, [role, load]);

  async function save(e: FormEvent) {
    e.preventDefault();
    setError("");
    const body = JSON.stringify({
      name: form.name,
      description: form.description,
      durationDays: Number(form.durationDays),
      price: Number(form.price),
    });
    try {
      await api(editId ? `plans/${editId}` : "plans", { method: editId ? "PATCH" : "POST", body });
      setForm(blank);
      setEditId(null);
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function toggle(p: Plan) {
    try {
      await api(`plans/${p.id}`, { method: "PATCH", body: JSON.stringify({ isActive: !p.isActive }) });
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const edit = (p: Plan) => {
    setEditId(p.id);
    setForm({ name: p.name, description: p.description ?? "", durationDays: String(p.durationDays), price: String(Number(p.price)) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Packages</h1>
      {error && <div className="rounded bg-red-50 p-3 text-red-700">{error}</div>}

      {isAdmin && (
        <form onSubmit={save} className="grid gap-3 rounded-xl border bg-white p-5 md:grid-cols-5">
          <input className={box} placeholder="Name (e.g. Monthly)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className={`${box} md:col-span-2`} placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <input className={box} type="number" min={1} placeholder="Days" value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: e.target.value })} required />
          <input className={box} type="number" min={0} placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
          <div className="flex gap-2 md:col-span-5">
            <button className="rounded-md bg-indigo-600 px-5 py-2 font-medium text-white hover:bg-indigo-700">
              {editId ? "Save package" : "+ Add package"}
            </button>
            {editId && (
              <button type="button" onClick={() => { setEditId(null); setForm(blank); }} className="rounded-md border bg-white px-5 py-2 hover:bg-slate-50">
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="p-3">Package</th>
              <th className="p-3">Duration</th>
              <th className="p-3">Price</th>
              <th className="p-3">Status</th>
              {isAdmin && <th className="p-3">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {plans.length === 0 && <tr><td colSpan={5} className="p-4 text-slate-500">No packages yet.</td></tr>}
            {plans.map((p) => (
              <tr key={p.id} className={p.isActive ? "" : "text-slate-400"}>
                <td className="p-3">
                  <div className="font-medium">{p.name}</div>
                  {p.description && <div className="text-xs text-slate-500">{p.description}</div>}
                </td>
                <td className="p-3">{p.durationDays} days</td>
                <td className="p-3">{Number(p.price)}</td>
                <td className="p-3">{p.isActive ? "Active" : "Deactivated"}</td>
                {isAdmin && (
                  <td className="flex gap-1 p-3">
                    <button onClick={() => edit(p)} className="rounded border px-2 py-1 text-xs hover:bg-slate-50">Edit</button>
                    <button onClick={() => toggle(p)} className="rounded border px-2 py-1 text-xs hover:bg-slate-50">
                      {p.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!isAdmin && role && <p className="text-xs text-slate-500">Only admins can add or change packages.</p>}
    </div>
  );
}