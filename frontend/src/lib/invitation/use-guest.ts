"use client";

import { useEffect, useState } from "react";

export function useGuestName(): string | null {
  const [guest, setGuest] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("guest");
    setGuest(raw && raw.trim() ? raw.trim() : null);
  }, []);

  return guest;
}
