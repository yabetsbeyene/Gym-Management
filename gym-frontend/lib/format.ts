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
export const CURRENCY = "ETB"; // change to your currency
export const money = (n: number) => `${Math.round(n).toLocaleString()} ${CURRENCY}`;

export const hourLabel = (h: number) => `${h % 12 || 12} ${h < 12 ? "AM" : "PM"}`;

export function timeAgo(iso: string) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}