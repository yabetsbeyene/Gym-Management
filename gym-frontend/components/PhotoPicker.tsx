"use client";
import { useRef, useState } from "react";
import Avatar from "./Avatar";
import { imageToDataUrl } from "@/lib/image";

export default function PhotoPicker({
  name,
  value,
  onChange,
}: {
  name: string;
  value: string | null;
  onChange: (dataUrl: string | null) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");

  async function pick(file?: File) {
    if (!file) return;
    setError("");
    try {
      onChange(await imageToDataUrl(file));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar name={name} src={value} size={80} />
      <div className="space-y-1">
        <div className="flex gap-2">
          <button type="button" onClick={() => input.current?.click()} className="rounded-md border bg-white px-3 py-1.5 text-sm hover:bg-slate-50">
            {value ? "Change photo" : "Add photo"}
          </button>
          {value && (
            <button type="button" onClick={() => onChange(null)} className="rounded-md border px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">
              Remove
            </button>
          )}
        </div>
        <input ref={input} type="file" accept="image/*" capture="user" hidden onChange={(e) => pick(e.target.files?.[0])} />
        {error && <div className="text-xs text-red-600">{error}</div>}
        <div className="text-xs text-slate-500">On a phone this opens the camera.</div>
      </div>
    </div>
  );
}