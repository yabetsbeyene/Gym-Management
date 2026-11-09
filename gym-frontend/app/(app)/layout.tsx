import { ReactNode, Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AppShell from "@/components/AppShell";

async function Shell({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  return (
    <AppShell role={(session as any).role as string} name={session.user?.name ?? ""}>
      {children}
    </AppShell>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070b14]" />}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}