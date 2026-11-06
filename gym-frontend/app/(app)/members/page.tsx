"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useRole } from "@/lib/useRole";
import { displayStatus, fmtDate, fullName, memberCode, statusStyle } from "@/lib/format";
import type { MemberList } from "@/lib/types";
import Avatar from "@/components/Avatar";

const FILTERS = [
  ["", "All statuses"],
  ["ACTIVE", "Active"],
  ["EXPIRED", "Expired"],
  ["FROZEN", "Frozen"],
  ["SUSPENDED", "Suspended"],
  ["NO_PLAN", "No package"],
];

export default function MembersPage() {
  const role = useRole();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [archived, setArchived] = useState(false);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<MemberList | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const qs = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) qs.set("search", search);
    if (status) qs.set("status", status);
    if (archived) qs.set("archived", "true");
    const t = setTimeout(() => {
      api<MemberList>(`members?${qs}`)
        .then((d) => {
          setData(d);
          setError("");
        })
        .catch((e) => setError(e.message));
    }, 250);
    return () => clearTimeout(t);
  }, [search, status, archived, page]);

  const reset = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">
          Members <span className="text-base font-normal text-slate-500">({data?.total ?? 0})</span>
        </h1>
        <Link href="/members/new" className="ml-auto rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700">
          + Add member
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => reset(setSearch)(e.target.value)}
          placeholder="Search name, phone or GYM-0001"
          className="w-72 rounded-md border bg-white p-2"
        />
        <select value={status} onChange={(e) => reset(setStatus)(e.target.value)} className="rounded-md border bg-white p-2">
          {FILTERS.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        {role === "ADMIN" && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={archived} onChange={(e) => reset(setArchived)(e.target.checked)} />
            Show archived
          </label>
        )}
      </div>

      {error && <div className="rounded bg-red-50 p-3 text-red-700">{error}</div>}

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="p-3">Member</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Package</th>
              <th className="p-3">Expires</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data?.items.length === 0 && (
              <tr><td colSpan={5} className="p-4 text-slate-500">No members found.</td></tr>
            )}
            {data?.items.map((m) => {
              const ms = m.memberships[0];
              const st = displayStatus(ms);
              return (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="p-3">
                    <Link href={`/members/${m.id}`} className="flex items-center gap-3">
                      <Avatar name={fullName(m)} src={m.photoUrl} size={36} />
                      <div>
                        <div className="font-medium text-indigo-700">{fullName(m)}</div>
                        <div className="font-mono text-xs text-slate-500">{memberCode(m.memberNumber)}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="p-3">{m.phone}</td>
                  <td className="p-3">{ms?.plan?.name ?? "-"}</td>
                  <td className="p-3">{ms ? fmtDate(ms.endDate) : "-"}</td>
                  <td className="p-3">
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${statusStyle[st]}`}>{st}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {data && data.pages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded border bg-white px-3 py-1 disabled:opacity-40">Previous</button>
          <span>Page {data.page} of {data.pages}</span>
          <button disabled={page >= data.pages} onClick={() => setPage(page + 1)} className="rounded border bg-white px-3 py-1 disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}