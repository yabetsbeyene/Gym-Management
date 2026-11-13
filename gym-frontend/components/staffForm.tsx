"use client";
import { FormEvent, ReactNode, useState } from "react";
import PhotoPicker from "./PhotoPicker";
import { BTN, BTN_PRIMARY, INPUT, PANEL } from "@/lib/ui";
import type { Staff } from "@/lib/types";

export type StaffFormValues = {
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  notes: string;
  photoUrl: string | null;
};

export const emptyStaff: StaffFormValues = { name: "", email: "", password: "", phone: "", address: "", notes: "", photoUrl: null };

export const fromStaff = (s: Staff): StaffFormValues => ({
  name: s.name,
  email: s.email,
  password: "",
  phone: s.phone ?? "",
  address: s.address ?? "",
  notes: s.notes ?? "",
  photoUrl: s.photoUrl,
});

/** Empty optional fields become null so the server can clear them. */
export function staffPayload(v: StaffFormValues, withPassword: boolean) {
  const opt = (s: string) => (s.trim() ? s.trim() : null);
  return {
    name: v.name.trim(),
    email: v.email.trim(),
    phone: opt(v.phone),
    address: opt(v.address),
    notes: opt(v.notes),
    photoUrl: v.photoUrl,
    ...(withPassword ? { password: v.password } : {}),
  };
}

function randomPassword() {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => chars[b % chars.length]).join("");
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-slate-300">{label}</span>
      {children}
      {hint && <span className="block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export default function StaffForm({
  initial,
  withPassword,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: StaffFormValues;
  withPassword: boolean;
  submitLabel: string;
  onSubmit: (values: StaffFormValues) => Promise<void>;
  onCancel: () => void;
}) {
  const [v, setV] = useState(initial);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const bind = (key: Exclude<keyof StaffFormValues, "photoUrl">) => ({
    value: v[key],
    onChange: (e: { target: { value: string } }) => setV((prev) => ({ ...prev, [key]: e.target.value })),
  });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await onSubmit(v);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {error && <div className="rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-rose-300">{error}</div>}

      <section className={`${PANEL} p-5`}>
        <h2 className="mb-4 font-semibold text-white">Profile</h2>
        <div className="space-y-4">
          <PhotoPicker name={v.name} value={v.photoUrl} onChange={(d) => setV((p) => ({ ...p, photoUrl: d }))} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name *"><input className={INPUT} required {...bind("name")} /></Field>
            <Field label="Email (used to sign in) *"><input className={INPUT} type="email" required {...bind("email")} /></Field>
            <Field label="Phone"><input className={INPUT} placeholder="0911000001" {...bind("phone")} /></Field>
            <Field label="Address"><input className={INPUT} {...bind("address")} /></Field>
          </div>
          <Field label="Internal notes" hint="Only admins can see this.">
            <textarea className={INPUT} rows={3} {...bind("notes")} />
          </Field>
        </div>
      </section>

      {withPassword && (
        <section className={`${PANEL} p-5`}>
          <h2 className="mb-4 font-semibold text-white">Starting password</h2>
          <div className="flex gap-2">
            <input
              className={INPUT}
              type={showPassword ? "text" : "password"}
              minLength={8}
              required
              placeholder="At least 8 characters"
              autoComplete="new-password"
              {...bind("password")}
            />
            <button type="button" className={BTN} onClick={() => setShowPassword((s) => !s)}>{showPassword ? "Hide" : "Show"}</button>
            <button
              type="button"
              className={BTN}
              onClick={() => {
                setV((p) => ({ ...p, password: randomPassword() }));
                setShowPassword(true);
              }}
            >
              Generate
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">Give this password to the receptionist privately. You can reset it any time.</p>
        </section>
      )}

      <div className="flex gap-2">
        <button disabled={saving} className={BTN_PRIMARY}>{saving ? "Saving…" : submitLabel}</button>
        <button type="button" onClick={onCancel} className={BTN}>Cancel</button>
      </div>
    </form>
  );
}