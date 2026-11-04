import type { Membership } from "./types";

export const memberCode = (n: number) => `GYM-${String(n).padStart(4, "0")}`;

export const fullName = (p?: { firstName?: string; lastName?: string; fullName?: string } | null) =>
  p?.fullName ?? [p?.firstName, p?.lastName].filter(Boolean).join(" ");

export const fmtDate = (iso: string) => iso.slice(0, 10);
export const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
export const fmtDateTime = (iso: string) => new Date(iso).toLocaleString([], { dateStyle: "short", timeStyle: "short" });

export type StatusLabel = Membership["status"] | "NO PLAN";

/** A membership still marked ACTIVE after its end date is shown as EXPIRED. */
export function displayStatus(ms?: Membership): StatusLabel {
  if (!ms) return "NO PLAN";
  const todayLocal = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
  return ms.status === "ACTIVE" && fmtDate(ms.endDate) < todayLocal ? "EXPIRED" : ms.status;
}

export const statusStyle: Record<StatusLabel, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  EXPIRED: "bg-slate-200 text-slate-700",
  FROZEN: "bg-blue-100 text-blue-700",
  SUSPENDED: "bg-red-100 text-red-700",
  "NO PLAN": "bg-amber-100 text-amber-700",
};