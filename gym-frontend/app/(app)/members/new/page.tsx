"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Member, Plan } from "@/lib/types";
import MemberForm, { emptyMember, toPayload, type MemberFormValues } from "@/components/MemberForm";

export default function NewMemberPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[] | null>(null);

  useEffect(() => {
    api<Plan[]>("plans").then(setPlans).catch(() => setPlans([]));
  }, []);

  async function create(values: MemberFormValues) {
    const member = await api<Member>("members", { method: "POST", body: JSON.stringify(toPayload(values, true)) });
    router.push(`/members/${member.id}`); // the profile shows the QR card right away
  }

  if (!plans) return <p className="text-slate-500">Loading…</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold">New member</h1>
      <MemberForm initial={emptyMember} plans={plans} submitLabel="Create member" onSubmit={create} onCancel={() => router.push("/members")} />
    </div>
  );
}