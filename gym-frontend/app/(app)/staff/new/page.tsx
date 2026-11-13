"use client";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import StaffForm, { emptyStaff, staffPayload, type StaffFormValues } from "@/components/StaffForm";

export default function NewStaffPage() {
  const router = useRouter();

  async function create(values: StaffFormValues) {
    await api("staff", { method: "POST", body: JSON.stringify(staffPayload(values, true)) });
    router.push("/staff");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-extrabold text-white">New receptionist</h1>
      <StaffForm initial={emptyStaff} withPassword submitLabel="Create account" onSubmit={create} onCancel={() => router.push("/staff")} />
    </div>
  );
}