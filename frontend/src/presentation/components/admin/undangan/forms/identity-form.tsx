"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { Card, CardContent } from "@/src/presentation/components/ui/card";
import { Input } from "@/src/presentation/components/ui/input";
import { Label } from "@/src/presentation/components/ui/label";
import { Textarea } from "@/src/presentation/components/ui/textarea";
import {
  useUpdateWedding,
} from "@/src/application/hooks/use-wedding-query";
import type { WeddingResponse } from "@/src/domain/services/wedding.service";
import { buildSaveRequest } from "../wedding-save";

function toDisplayDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function formatDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  let out = digits.slice(0, 2);
  if (digits.length > 2) out += `/${digits.slice(2, 4)}`;
  if (digits.length > 4) out += `/${digits.slice(4, 8)}`;
  return out;
}

function parseDisplayDate(value: string): string | null | "invalid" {
  if (!value.trim()) return null;
  const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return "invalid";
  const day = parseInt(m[1], 10);
  const month = parseInt(m[2], 10);
  const year = parseInt(m[3], 10);
  const d = new Date(year, month - 1, day);
  if (
    d.getFullYear() !== year ||
    d.getMonth() !== month - 1 ||
    d.getDate() !== day
  ) {
    return "invalid";
  }
  return d.toISOString();
}

export function IdentityForm({ data }: { data?: WeddingResponse }) {
  const updateWedding = useUpdateWedding();
  const [weddingDate, setWeddingDate] = useState("");
  const [address, setAddress] = useState("");
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (data && !initialized) {
      setWeddingDate(toDisplayDate(data.wedding_date));
      setAddress(data.gift_shipping_address ?? "");
      setInitialized(true);
    }
  }, [data, initialized]);

  const handleSave = () => {
    const parsed = parseDisplayDate(weddingDate);
    if (parsed === "invalid") {
      toast.error("Tanggal tidak valid (format: dd/mm/yyyy)");
      return;
    }
    updateWedding.mutate(
      buildSaveRequest(data, {
        wedding_date: parsed,
        gift_shipping_address: address.trim() || null,
      }),
      {
        onSuccess: () => toast.success("Identitas tersimpan"),
        onError: () => toast.error("Gagal menyimpan identitas"),
      }
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Identitas Undangan
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="wedding-date" className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">
              Tanggal Pernikahan
            </Label>
            <Input
              id="wedding-date"
              inputMode="numeric"
              value={weddingDate}
              onChange={(e) => setWeddingDate(formatDateInput(e.target.value))}
              placeholder="dd/mm/yyyy"
              className="h-11 rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="shipping" className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">
              Alamat Pengiriman Kado (opsional)
            </Label>
            <Textarea
              id="shipping"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Alamat tujuan pengiriman kado fisik"
              rows={3}
              className="h-11 rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
            />
          </div>
        </CardContent>
      </Card>

      <button
        onClick={handleSave}
        disabled={updateWedding.isPending}
        className="w-full flex items-center justify-center h-12 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer active:scale-95"
      >
        {updateWedding.isPending ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          "Simpan"
        )}
      </button>
    </div>
  );
}
