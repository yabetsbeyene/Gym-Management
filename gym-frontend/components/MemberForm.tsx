"use client";
import { FormEvent, ReactNode, useState } from "react";
import PhotoPicker from "./PhotoPicker";
import PlanPicker from "./PlanPicker";
import type { Member, Plan } from "@/lib/types";

export type MemberFormValues = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  gender: string;
  dateOfBirth: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  notes: string;
  photoUrl: string | null;
  planId: string;
  startDate: string;
};
type TextKey = Exclude<keyof MemberFormValues, "photoUrl">;

export const emptyMember: MemberFormValues = {
  firstName: "", lastName: "", phone: "", email: "", gender: "", dateOfBirth: "",
  address: "", emergencyContactName: "", emergencyContactPhone: "", notes: "",
  photoUrl: null, planId: "", startDate: "",
};

export const fromMember = (m: Member): MemberFormValues => ({
  firstName: m.firstName,
  lastName: m.lastName,
  phone: m.phone,
  email: m.email ?? "",
  gender: m.gender ?? "",
  dateOfBirth: m.dateOfBirth?.slice(0, 10) ?? "",
  address: m.address ?? "",
  emergencyContactName: m.emergencyContactName ?? "",
  emergencyContactPhone: m.emergencyContactPhone ?? "",
  notes: m.notes ?? "",
  photoUrl: m.photoUrl ?? null,
  planId: "",
  startDate: "",
});

/** Empty optional fields become null so the server can clear them. */
export function toPayload(v: MemberFormValues, includePlan: boolean) {
  const opt = (s: string) => (s.trim() ? s.trim() : null);
  return {
    firstName: v.firstName.trim(),
    lastName: v.lastName.trim(),
    phone: v.phone.trim(),
    email: opt(v.email),
    gender: opt(v.gender),
    dateOfBirth: opt(v.dateOfBirth),
    address: opt(v.address),
    emergencyContactName: opt(v.emergencyContactName),
    emergencyContactPhone: opt(v.emergencyContactPhone),
    notes: opt(v.notes),
    photoUrl: v.photoUrl,
    ...(includePlan && v.planId ? { planId: v.planId, startDate: v.startDate || undefined } : {}),
  };
}

const todayStr = () => new Date().toLocaleDateString("en-CA");
function endOf(start: string, days: number) {
  const d = new Date(`${start || todayStr()}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days - 1);
  return d.toISOString().slice(0, 10);
}

const box = "w-full rounded-md border bg-white p-2";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-xl border bg-white p-5">
      <h2 className="font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default function MemberForm({
  initial,
  plans,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: MemberFormValues;
  /** Pass plans to show the "Package" section (creating). Omit when editing. */
  plans?: Plan[];
  submitLabel: string;
  onSubmit: (values: MemberFormValues) => Promise<void>;
  onCancel?: () => void;
}) {
  const [v, setV] = useState(initial);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof MemberFormValues>(key: K, value: MemberFormValues[K]) =>
    setV((prev) => ({ ...prev, [key]: value }));
  const bind = (key: TextKey) => ({
    value: v[key],
    onChange: (e: { target: { value: string } }) => set(key, e.target.value),
  });

  const selectedPlan = plans?.find((p) => p.id === v.planId);

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
      {error && <div className="rounded bg-red-50 p-3 text-red-700">{error}</div>}

      <Section title="Photo">
        <PhotoPicker name={`${v.firstName} ${v.lastName}`.trim()} value={v.photoUrl} onChange={(d) => set("photoUrl", d)} />
      </Section>

      <Section title="Personal information">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name *"><input className={box} required {...bind("firstName")} /></Field>
          <Field label="Last name *"><input className={box} required {...bind("lastName")} /></Field>
          <Field label="Phone *"><input className={box} required placeholder="0911000001" {...bind("phone")} /></Field>
          <Field label="Email"><input className={box} type="email" {...bind("email")} /></Field>
          <Field label="Gender">
            <select className={box} {...bind("gender")}>
              <option value="">Not set</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </Field>
          <Field label="Date of birth"><input className={box} type="date" {...bind("dateOfBirth")} /></Field>
        </div>
        <Field label="Address"><input className={box} {...bind("address")} /></Field>
      </Section>

      <Section title="Emergency contact">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name"><input className={box} {...bind("emergencyContactName")} /></Field>
          <Field label="Phone"><input className={box} {...bind("emergencyContactPhone")} /></Field>
        </div>
      </Section>

      {plans && (
        <Section title="Package">
          <PlanPicker plans={plans} value={v.planId} onChange={(id) => set("planId", id)} allowNone />
          {selectedPlan && (
            <div className="flex flex-wrap items-end gap-4">
              <Field label="Start date">
                <input className={box} type="date" min={todayStr()} {...bind("startDate")} />
              </Field>
              <p className="pb-2 text-sm text-slate-600">
                Runs until <b>{endOf(v.startDate, selectedPlan.durationDays)}</b>
              </p>
            </div>
          )}
        </Section>
      )}

      <Section title="Notes">
        <textarea className={box} rows={3} placeholder="Injuries, preferences, anything staff should know…" {...bind("notes")} />
      </Section>

      <div className="flex gap-2">
        <button disabled={saving} className="rounded-md bg-indigo-600 px-5 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
          {saving ? "Saving…" : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded-md border bg-white px-5 py-2 hover:bg-slate-50">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}