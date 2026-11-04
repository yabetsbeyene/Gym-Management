"use client";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { fmtTime, fullName, memberCode } from "@/lib/format";
import type { CheckInRow, CheckResult } from "@/lib/types";
import QrScanner from "@/components/QrScanner";

type Tone = "ok" | "duplicate" | "denied";

const toneOf = (r: CheckResult): Tone => (!r.allowed ? "denied" : r.duplicate ? "duplicate" : "ok");

const TONES: Record<Tone, { bg: string; title: string }> = {
  ok: { bg: "bg-green-600", title: "ALLOWED" },
  duplicate: { bg: "bg-amber-500", title: "ALREADY CHECKED IN" },
  denied: { bg: "bg-red-600", title: "DENIED" },
};

export default function CheckInPage() {
  const [identifier, setIdentifier] = useState("");
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState("");
  const [today, setToday] = useState<CheckInRow[]>([]);
  const [camera, setCamera] = useState(false);
  const busy = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadToday = useCallback(() => api<CheckInRow[]>("check-ins/today").then(setToday).catch(() => {}), []);

  useEffect(() => {
    loadToday();
    inputRef.current?.focus();
  }, [loadToday]);

  const checkIn = useCallback(
    async (raw: string) => {
      const value = raw.trim();
      if (!value || busy.current) return;
      busy.current = true;
      setError("");
      try {
        setResult(await api<CheckResult>("check-ins", { method: "POST", body: JSON.stringify({ personIdentifier: value }) }));
        loadToday();
      } catch (e) {
        setResult(null);
        setError((e as Error).message);
      } finally {
        busy.current = false;
        setIdentifier("");
        inputRef.current?.focus();
      }
    },
    [loadToday],
  );

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    checkIn(identifier);
  };

  const tone = result ? TONES[toneOf(result)] : null;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Reception check-in</h1>
          <button onClick={() => setCamera((c) => !c)} className="rounded-md border bg-white px-3 py-1.5 text-sm hover:bg-slate-50">
            {camera ? "Hide camera" : "Scan with camera"}
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="Scan QR, or type phone / GYM-0001 / pass code"
            className="flex-1 rounded-md border bg-white p-3 text-lg"
            autoComplete="off"
          />
          <button className="rounded-md bg-indigo-600 px-5 font-medium text-white hover:bg-indigo-700">Check in</button>
        </form>

        {camera && <QrScanner onCode={checkIn} />}

        {error && <div className="rounded bg-red-50 p-3 text-red-700">{error}</div>}

        {result && tone && (
          <div className={`rounded-xl p-6 text-white ${tone.bg}`}>
            <div className="text-4xl font-extrabold">{tone.title}</div>
            <div className="mt-1 text-lg">
              {result.duplicate && result.checkIn ? `First scanned at ${fmtTime(result.checkIn.checkInTime)}` : result.reason}
            </div>

            {result.person && (
              <div className="mt-4 border-t border-white/30 pt-3">
                <div className="text-xl font-semibold">{fullName(result.person)}</div>
                <div className="text-sm opacity-90">
                  {result.person.kind === "MEMBER" && result.person.memberNumber
                    ? memberCode(result.person.memberNumber)
                    : "Day pass"}
                  {result.person.phone ? ` · ${result.person.phone}` : ""}
                </div>
              </div>
            )}

            {!result.allowed && result.person?.kind === "MEMBER" && (
              <Link
                href={`/members/${result.person.id}`}
                className="mt-4 inline-block rounded-md bg-white px-4 py-2 font-medium text-red-700 hover:bg-red-50"
              >
                Fix membership →
              </Link>
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
                <div className="font-medium">{c.member ? fullName(c.member) : (c.dayPass?.visitor?.fullName ?? "Member day pass")}</div>
                <div className="text-xs text-slate-500">{c.type === "MEMBER" ? "Member" : "Day pass"}</div>
              </div>
              <div className="text-sm text-slate-600">{fmtTime(c.checkInTime)}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}