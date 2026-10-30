"use client";
import { FormEvent, useState } from "react";
import { api } from "@/lib/api";

export default function DayPassesPage() {
  const [form, setForm] = useState({ fullName: "", phone: "", price: "200", paid: true, waiver: true });
  const [created, setCreated] = useState<any>(null);
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setCreated(null);
    try {
      setCreated(
        await api("day-passes", {
          method: "POST",
          body: JSON.stringify({
            visitor: { fullName: form.fullName, phone: form.phone || undefined },
            price: Number(form.price),
            paymentStatus: form.paid ? "PAID" : "PENDING",
            waiverSigned: form.waiver,
          }),
        }),
      );
      setForm({ ...form, fullName: "", phone: "" });
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-2xl font-bold">Sell a day pass</h1>
      {error && <div className="rounded bg-red-50 p-3 text-red-700">{error}</div>}

      <form onSubmit={submit} className="space-y-3 rounded-xl border bg-white p-5">
        <input className="w-full rounded-md border p-2" placeholder="Visitor full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
        <input className="w-full rounded-md border p-2" placeholder="Phone (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input className="w-full rounded-md border p-2" type="number" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.paid} onChange={(e) => setForm({ ...form, paid: e.target.checked })} /> Payment received
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.waiver} onChange={(e) => setForm({ ...form, waiver: e.target.checked })} /> Waiver signed
        </label>
        <button className="w-full rounded-md bg-indigo-600 p-2 font-medium text-white hover:bg-indigo-700">Create day pass</button>
      </form>

      {created && (
        <div className="rounded-xl bg-green-50 p-5 text-center">
          <div className="text-sm text-green-700">Day pass code (valid today)</div>
          <div className="my-2 font-mono text-4xl font-extrabold tracking-widest text-green-800">{created.code}</div>
          <div className="text-sm text-slate-600">
            {created.paymentStatus === "PAID" && created.waiverSigned
              ? "Ready: enter this code on the Check-in screen."
              : "Not ready: payment or waiver is still missing, so check-in will be denied."}
          </div>
        </div>
      )}
    </div>
  );
}