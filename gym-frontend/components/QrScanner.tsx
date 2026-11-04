"use client";
import dynamic from "next/dynamic";
import { useRef } from "react";

// The scanner touches browser-only APIs, so it must not render on the server.
const Scanner = dynamic(() => import("@yudiel/react-qr-scanner").then((m) => m.Scanner), { ssr: false });

const REPEAT_IGNORE_MS = 4000; // a camera reads the same QR many times per second

export default function QrScanner({ onCode, paused = false }: { onCode: (code: string) => void; paused?: boolean }) {
  const last = useRef({ value: "", at: 0 });

  return (
    <div className="overflow-hidden rounded-xl border bg-black">
      <Scanner
        paused={paused}
        formats={["qr_code"]}
        constraints={{ facingMode: "environment" }}
        onError={(e) => console.error(e)}
        onScan={(codes) => {
          const value = codes[0]?.rawValue;
          const now = Date.now();
          if (!value) return;
          if (value === last.current.value && now - last.current.at < REPEAT_IGNORE_MS) return;
          last.current = { value, at: now };
          onCode(value);
        }}
      />
    </div>
  );
}