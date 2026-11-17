"use client";
import { signOut } from "next-auth/react";
import { BTN, PANEL } from "@/lib/ui";
import type { Me } from "@/lib/types";
import ChangePasswordForm from "./ChangePasswordForm";

/** Shown instead of the app while the account's password is a default or too weak. */
export default function PasswordGate({ me, onRefresh }: { me: Me; onRefresh: () => void }) {
  if (me.role === "ADMIN") {
    return (
      <div className="mx-auto max-w-lg space-y-5 pt-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Set a new password</h1>
          <p className="mt-1 text-sm text-slate-400">
            Your current password is a default or does not meet the security rules. Choose a strong one to continue. Nothing else is
            available until you do.
          </p>
        </div>
        <div className={`${PANEL} p-5`}>
          <ChangePasswordForm ctx={{ email: me.email, name: me.name }} onDone={onRefresh} />
        </div>
      </div>
    );
  }

  return (
    <div className={`${PANEL} mx-auto mt-10 max-w-md space-y-4 p-8 text-center`}>
      <h1 className="text-xl font-extrabold text-white">Your account is locked</h1>
      <p className="text-sm text-slate-400">
        Your password does not meet the security rules. Ask your administrator to set a new password for you, then check again.
      </p>
      <div className="flex justify-center gap-2">
        <button onClick={onRefresh} className={BTN}>Check again</button>
        <button onClick={() => signOut({ callbackUrl: "/login" })} className={BTN}>Sign out</button>
      </div>
    </div>
  );
}