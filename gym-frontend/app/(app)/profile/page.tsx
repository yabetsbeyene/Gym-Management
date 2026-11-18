"use client";
import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useRole } from "@/lib/useRole";
import { BTN_PRIMARY, INPUT, PANEL } from "@/lib/ui";
import type { Me } from "@/lib/types";
import ChangePasswordForm from "@/components/ChangePasswordForm";
import PhotoPicker from "@/components/PhotoPicker";

export default function ProfilePage() {
  const role = useRole();
  const [me, setMe] = useState<Me | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", photoUrl: null as string | null, currentPassword: "" });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  function fill(m: Me) {
    setMe(m);
    setForm({ name: m.name, email: m.email, phone: m.phone ?? "", address: m.address ?? "", photoUrl: m.photoUrl, currentPassword: "" });
  }

  useEffect(() => {
    api<Me>("auth/me").then(fill).catch((e) => setError(e.message));
  }, []);

  if (role && role !== "ADMIN") {
    return <p className="text-slate-400">Only an administrator can change account details and passwords. Ask your administrator.</p>;
  }
  if (!me) return error ? <div className="rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-rose-300">{error}</div> : <p className="text-slate-400">Loading…</p>;

  const usernameChanged = form.email.trim().toLowerCase() !== me.email;

  async function save(e: FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    setSaving(true);
    const opt = (s: string) => (s.trim() ? s.trim() : null);
    try {
      const updated = await api<Me>("auth/profile", {
        method: "PATCH",
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: opt(form.phone),
          address: opt(form.address),
          photoUrl: form.photoUrl,
          ...(usernameChanged ? { currentPassword: form.currentPassword } : {}),
        }),
      });
      fill(updated);
      setNotice("Profile saved. Your new name shows in the menu the next time you sign in.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold text-white">My profile</h1>
        <p className="text-sm text-slate-400">Your account details and password. Only administrators can change these.</p>
      </header>

      {error && <div className="rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-rose-300">{error}</div>}
      {notice && <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-3 text-emerald-300">{notice}</div>}

      <form onSubmit={save} className={`${PANEL} space-y-4 p-5`}>
        <h2 className="font-semibold text-white">Profile</h2>
        <PhotoPicker name={form.name} value={form.photoUrl} onChange={(d) => setForm((f) => ({ ...f, photoUrl: d }))} />
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-300">Full name</span>
            <input className={INPUT} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-300">Username (email you sign in with)</span>
            <input className={INPUT} type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-300">Phone</span>
            <input className={INPUT} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-300">Address</span>
            <input className={INPUT} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </label>
        </div>

        {usernameChanged && (
          <label className="block space-y-1 rounded-xl border border-amber-500/30 bg-amber-950/20 p-3">
            <span className="text-sm font-medium text-amber-200">Changing your username needs your current password</span>
            <input
              className={INPUT}
              type="password"
              required
              autoComplete="current-password"
              value={form.currentPassword}
              onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
            />
          </label>
        )}

        <button disabled={saving} className={BTN_PRIMARY}>{saving ? "Saving…" : "Save profile"}</button>
      </form>

      <section className={`${PANEL} space-y-4 p-5`}>
        <h2 className="font-semibold text-white">Change password</h2>
        <ChangePasswordForm ctx={{ email: me.email, name: me.name }} onDone={() => {}} />
      </section>
    </div>
  );
}