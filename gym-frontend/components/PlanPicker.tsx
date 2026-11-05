import type { Plan } from "@/lib/types";

const card = (on: boolean) =>
  `rounded-xl border-2 p-3 text-left transition ${
    on ? "border-indigo-600 bg-indigo-50" : "border-slate-200 bg-white hover:border-slate-300"
  }`;

export default function PlanPicker({
  plans,
  value,
  onChange,
  allowNone = false,
}: {
  plans: Plan[];
  value: string;
  onChange: (planId: string) => void;
  allowNone?: boolean;
}) {
  if (plans.length === 0) {
    return <div className="rounded bg-amber-50 p-3 text-sm text-amber-800">No packages yet. An admin can create them on the Packages page.</div>;
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {allowNone && (
        <button type="button" onClick={() => onChange("")} className={card(value === "")}>
          <div className="font-semibold">No package yet</div>
          <div className="text-sm text-slate-500">Add one later</div>
        </button>
      )}
      {plans.map((p) => (
        <button type="button" key={p.id} onClick={() => onChange(p.id)} className={card(value === p.id)}>
          <div className="font-semibold">{p.name}</div>
          <div className="text-sm text-slate-500">{p.durationDays} days</div>
          <div className="mt-1 text-lg font-bold text-indigo-600">{Number(p.price)}</div>
        </button>
      ))}
    </div>
  );
}