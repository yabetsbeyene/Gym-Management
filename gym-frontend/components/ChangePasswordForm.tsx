"use client";
import { FormEvent, useState } from "react";
import { api } from "@/lib/api";
import { passwordProblems, type PasswordContext } from "@/lib/password";
import { BTN_PRIMARY, INPUT } from "@/lib/ui";
import PasswordField from "./PasswordField";

export default function ChangePasswordForm({ ctx, onDone }: { ctx: PasswordContext; onDone: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const strong = passwordProblems(next, ctx).length === 0;
  const mismatch = !!confirm && confirm !== next;
  const ready = !!current && strong && next === confirm && next !== current;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaved(false);
    setSaving(true);
    try {
      await api("auth/change-password", { method: "POST", body: JSON.stringify({ currentPassword: current, newPassword: next }) });
      setCurrent("");
      setNext("");
      setConfirm("");
      setSaved(true);
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <div className="rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-sm text-rose-300">{error}</div>}
      {saved && <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-3 text-sm text-emerald-300">Password changed.</div>}

      <label className="block space-y-1">
        <span className="text-sm font-medium text-slate-300">Current password</span>
        <input className={INPUT} type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required />
      </label>

      <div className="space-y-1">
        <span className="text-sm font-medium text-slate-300">New password</span>
        <PasswordField value={next} onChange={setNext} ctx={ctx} allowGenerate />
        {!!next && next === current && <p className="text-xs text-rose-400">The new password must be different from the current one.</p>}
      </div>

      <label className="block space-y-1">
        <span className="text-sm font-medium text-slate-300">Confirm new password</span>
        <input className={INPUT} type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required />
        {mismatch && <span className="text-xs text-rose-400">Passwords do not match.</span>}
      </label>

      <button disabled={!ready || saving} className={BTN_PRIMARY}>{saving ? "Saving…" : "Change password"}</button>
    </form>
  );
}