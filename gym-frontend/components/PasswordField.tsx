"use client";
import { useState } from "react";
import { BTN, INPUT } from "@/lib/ui";
import { PASSWORD_RULES, generatePassword, type PasswordContext } from "@/lib/password";

export default function PasswordField({
  value,
  onChange,
  ctx = {},
  allowGenerate = false,
  placeholder = "New password",
}: {
  value: string;
  onChange: (v: string) => void;
  ctx?: PasswordContext;
  allowGenerate?: boolean;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  const checks = PASSWORD_RULES.map((r) => ({ label: r.label, ok: !!value && r.ok(value, ctx) }));
  const passed = checks.filter((c) => c.ok).length;
  const all = passed === checks.length;
  const level = !value ? "" : all ? "Strong" : passed >= checks.length - 2 ? "Almost there" : "Weak";
  const color = all ? "bg-emerald-400" : passed >= checks.length - 2 ? "bg-amber-400" : "bg-rose-500";

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          className={INPUT}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="new-password"
          maxLength={128}
        />
        <button type="button" className={BTN} onClick={() => setShow((s) => !s)}>{show ? "Hide" : "Show"}</button>
        {allowGenerate && (
          <button
            type="button"
            className={BTN}
            onClick={() => {
              onChange(generatePassword());
              setShow(true);
            }}
          >
            Generate
          </button>
        )}
      </div>

      <div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
          <div className={`h-full transition-all ${color}`} style={{ width: `${(passed / checks.length) * 100}%` }} />
        </div>
        {level && <div className="mt-1 text-right text-[11px] text-slate-400">{level}</div>}
      </div>

      <ul className="grid gap-1 text-xs sm:grid-cols-2">
        {checks.map((c) => (
          <li key={c.label} className={c.ok ? "text-emerald-400" : "text-slate-500"}>
            {c.ok ? "✓" : "○"} {c.label}
          </li>
        ))}
      </ul>
    </div>
  );
}