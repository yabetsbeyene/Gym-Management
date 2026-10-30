"use client";
import { FormEvent, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

const nameOf = (p: any) => p?.fullName ?? [p?.firstName, p?.lastName].filter(Boolean).join(" ");

export default function CheckInPage() {
  const [id, setId] = useState("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [today, setToday] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadToday = () => api("check-ins/today").then(setToday).catch(() => {});

  useEffect(() => {
    loadToday();
    inputRef.current?.focus();
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!id.trim()) return;
    setLoading(true);
    setError("");
    try {
      setResult(await api("check-ins", { method: "POST", body: JSON.stringify({ personIdentifier: id.trim() }) }));
      setId("");
      loadToday();
    } catch (err: any) {
      setResult(null);
      setError(err.message);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="space-y-4">
        <h1 className="text-2xl font-bold">Reception check-in</h1>
        <form onSubmit={submit} className="flex gap-2">
          <input
            ref={inputRef}
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="Phone, GYM-0001, or day pass code"
            className="flex-1 rounded-md border bg-white p-3 text-lg"
          />
          <button disabled={loading} className="rounded-md bg-indigo-600 px-5 font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
            Check in
          </button>
        </form>

        {error && <div className="rounded bg-red-50 p-3 text-red-700">{error}</div>}

        {result && (
          <div className={`rounded-xl p-6 text-white ${result.allowed ? "bg-green-600" : "bg-red-600"}`}>
            <div className="text-4xl font-extrabold">{result.allowed ? "ALLOWED" : "DENIED"}</div>
            <div className="mt-1 text-lg">{result.reason}</div>
            {result.person && (
              <div className="mt-4 border-t border-white/30 pt-3">
                <div className="text-xl font-semibold">{nameOf(result.person)}</div>
                <div className="text-sm opacity-90">
                  {result.person.kind === "MEMBER" ? `GYM-${String(result.person.memberNumber).padStart(4, "0")}` : "Day pass"}
                  {result.person.phone ? ` · ${result.person.phone}` : ""}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Today&apos;s check-ins ({today.length})</h2>
        <div className="divide-y rounded-xl border bg-white">
          {today.length === 0 && <div className="p-4 text-slate-500">No check-ins yet today.</div>}
          {today.map((c) => (
            <div key={c.id} className="flex items-center justify-between p-3">
              <div>
                <div className="font-medium">{c.member ? nameOf(c.member) : c.dayPass?.visitor?.fullName ?? "Member day pass"}</div>
                <div className="text-xs text-slate-500">{c.type === "MEMBER" ? "Member" : "Day pass"}</div>
              </div>
              <div className="text-sm text-slate-600">
                {new Date(c.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}