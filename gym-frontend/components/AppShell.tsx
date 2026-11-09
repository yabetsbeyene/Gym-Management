"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, LogOut, Package, QrCode, ScanLine, Ticket, Users, type LucideIcon } from "lucide-react";
import Logo from "./Logo";

type Item = { href: string; label: string; icon: LucideIcon; adminOnly?: boolean };

const ITEMS: Item[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, adminOnly: true },
  { href: "/check-in", label: "Check-in", icon: ScanLine },
  { href: "/members", label: "Members", icon: Users },
  { href: "/plans", label: "Packages", icon: Package },
  { href: "/day-passes", label: "Day passes", icon: Ticket },
];

export default function AppShell({ role, name, children }: { role: string; name: string; children: React.ReactNode }) {
  const path = usePathname();
  const items = ITEMS.filter((i) => !i.adminOnly || role === "ADMIN");
  const isActive = (href: string) => path.startsWith(href);
  const logout = () => signOut({ callbackUrl: "/login" });

  return (
    <div className="flex min-h-screen flex-col bg-[#070b14] text-slate-100 antialiased selection:bg-cyan-500 selection:text-black md:flex-row print:bg-white print:text-black">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col justify-between border-r border-slate-800/80 bg-[#0d1322]/90 p-5 backdrop-blur-xl md:sticky md:top-0 md:flex md:h-screen print:hidden">
        <div>
          <div className="flex items-center gap-3 border-b border-slate-800/60 px-1 pb-7 pt-2">
            <Logo />
            <div>
              <div className="text-xl font-extrabold tracking-wider text-white">
                POWER<span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">GYM</span>
              </div>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">{role === "ADMIN" ? "Admin hub" : "Front desk"}</span>
              </div>
            </div>
          </div>

          <nav className="mt-8 space-y-2">
            {items.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`group relative flex items-center gap-3 rounded-xl border px-4 py-3 font-medium transition-all duration-200 ${
                    active
                      ? "border-cyan-500/30 bg-cyan-950/40 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.15)]"
                      : "border-transparent text-slate-400 hover:bg-slate-800/40 hover:text-slate-100"
                  }`}
                >
                  {active && <span className="absolute bottom-2 left-0 top-2 w-1 rounded-r-full bg-gradient-to-b from-cyan-400 to-blue-500" />}
                  <Icon className={`h-5 w-5 ${active ? "text-cyan-400" : "text-slate-400"}`} />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="space-y-3 border-t border-slate-800/80 pt-6">
          <Link
            href="/check-in"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:from-cyan-400 hover:to-blue-500 active:scale-95"
          >
            <QrCode className="h-4 w-4" /> Scan check-in
          </Link>
          <div className="flex items-center justify-between px-1 pt-1 text-xs text-slate-400">
            <span className="truncate">{name}</span>
            <button onClick={logout} className="flex items-center gap-1.5 hover:text-rose-400">
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="border-b border-slate-800/80 bg-[#0d1322] px-3 py-2 md:hidden print:hidden">
        <div className="flex items-center justify-between">
          <span className="font-extrabold tracking-wider text-white">
            POWER<span className="text-cyan-400">GYM</span>
          </span>
          <button onClick={logout} className="p-2 text-slate-400" aria-label="Logout">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
        <nav className="mt-2 flex gap-1 overflow-x-auto">
          {items.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm ${
                isActive(href) ? "bg-cyan-950/60 text-cyan-300" : "text-slate-400"
              }`}
            >
              <Icon className="h-4 w-4" /> {label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="pg-main min-w-0 flex-1 bg-gradient-to-b from-[#0b101d] via-[#070b14] to-[#04060b] p-4 md:p-8 print:bg-white">
        {children}
      </main>
    </div>
  );
}