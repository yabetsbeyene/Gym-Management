"use client";
import { useEffect, useState } from "react";

/** Returns "ADMIN" | "RECEPTIONIST", or null while loading. */
export function useRole() {
  const [role, setRole] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((s) => setRole(s?.role ?? null))
      .catch(() => {});
  }, []);
  return role;
}