"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

export default function Nav({ role, name }: { role: string; name: string }) {
  const path = usePathname();
  const links = [
    { href: "/check-in", label: "Check-in" },
    { href: "/members", label: "Members" },
    { href: "/day-passes", label: "Day passes" },
    ...(role === "ADMIN" ? [{ href: "/dashboard", label: "Dashboard" }] : []),
  ];
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-3">
        <span className="font-bold text-indigo-600">GymManager</span>
        <nav className="flex gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                path.startsWith(l.href) ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm text-slate-600">
          <span>
            {name} <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">{role}</span>
          </span>
          <button onClick={() => signOut({ callbackUrl: "/login" })} className="rounded-md border px-3 py-1.5 hover:bg-slate-50">
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}