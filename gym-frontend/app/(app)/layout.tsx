import { ReactNode, Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Nav from "@/components/Nav";

async function Shell({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  const role = (session as any).role as string;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Nav role={role} name={session.user?.name ?? ""} />
      <main className="mx-auto max-w-6xl p-6">{children}</main>
    </div>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="p-6 text-slate-500">Loading...</div>}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}