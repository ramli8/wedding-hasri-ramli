"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Inbox, Layers, Loader2, Plus, X } from "lucide-react";
import { toast } from "react-toastify";
import { Input } from "@/src/presentation/components/ui/input";
import { Label } from "@/src/presentation/components/ui/label";
import { Switch } from "@/src/presentation/components/ui/switch";
import {
  useSections,
  useCreateSection,
  useUpdateSection,
} from "@/src/application/hooks/use-wedding-query";
import type { SectionResponse } from "@/src/domain/services/wedding.service";
import { TabLoading } from "./tab-loading";

const SECTION_KEY_OPTIONS: { key: string; label: string }[] = [
  { key: "cover", label: "Cover" },
  { key: "mempelai", label: "Mempelai" },
  { key: "acara", label: "Acara" },
  { key: "galeri", label: "Galeri" },
  { key: "rsvp", label: "RSVP" },
  { key: "ucapan", label: "Ucapan & Doa" },
  { key: "hadiah", label: "Hadiah" },
  { key: "qr", label: "QR" },
  { key: "info", label: "Info" },
  { key: "penutup", label: "Penutup" },
];

function keyLabel(key: string): string {
  return SECTION_KEY_OPTIONS.find((opt) => opt.key === key)?.label ?? key;
}

export function SectionsTab() {
  const { data, isLoading } = useSections();
  const createSection = useCreateSection();
  const updateSection = useUpdateSection();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [orderIndex, setOrderIndex] = useState(0);
  const [movingId, setMovingId] = useState<string | null>(null);

  const sections = [...(data ?? [])].sort((a, b) =>
    a.order_index === b.order_index
      ? a.created_at.localeCompare(b.created_at)
      : a.order_index - b.order_index
  );

  const openCreate = () => {
    setSelectedKey(null);
    setOrderIndex(sections.length);
    setSheetOpen(true);
  };

  const handleCreate = () => {
    if (!selectedKey) {
      toast.error("Pilih section terlebih dahulu");
      return;
    }
    createSection.mutate(
      {
        section_key: selectedKey,
        is_enabled: true,
        order_index: Number.isNaN(orderIndex) ? sections.length : orderIndex,
      },
      {
        onSuccess: () => {
          toast.success("Section ditambahkan");
          setSheetOpen(false);
        },
        onError: () => toast.error("Gagal menambah section"),
      }
    );
  };

  const handleToggle = (section: SectionResponse, checked: boolean) => {
    updateSection.mutate(
      { id: section.id, req: { is_enabled: checked } },
      { onError: () => toast.error("Gagal mengubah status section") }
    );
  };

  const handleMove = async (section: SectionResponse, dir: -1 | 1) => {
    const idx = sections.findIndex((s) => s.id === section.id);
    const neighbor = sections[idx + dir];
    if (!neighbor) return;
    setMovingId(section.id);
    try {
      await updateSection.mutateAsync({
        id: section.id,
        req: { order_index: neighbor.order_index },
      });
      await updateSection.mutateAsync({
        id: neighbor.id,
        req: { order_index: section.order_index },
      });
    } catch {
      toast.error("Gagal mengubah urutan");
    } finally {
      setMovingId(null);
    }
  };

  if (isLoading) return <TabLoading />;

  const registeredKeys = new Set(sections.map((s) => s.section_key));
  const availableKeys = SECTION_KEY_OPTIONS.filter((opt) => !registeredKeys.has(opt.key));

  return (
    <div className="space-y-4">
      <p className="text-[12px] leading-relaxed text-muted-foreground">
        Atur section mana yang tampil di undangan dan urutannya. Section nonaktif
        tidak dirender di halaman publik.
      </p>

      {sections.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Inbox className="h-16 w-16 opacity-20" />
          <p className="text-[13px] text-muted-foreground">
            Belum ada section terdaftar. Daftarkan section pertama.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sections.map((section, idx) => (
            <div key={section.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Layers className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold">{keyLabel(section.section_key)}</p>
                    <p className="truncate text-[11px] uppercase tracking-wider text-muted-foreground">
                      {section.section_key} · urutan {section.order_index}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={section.is_enabled}
                  onCheckedChange={(checked) => handleToggle(section, checked)}
                  aria-label={`Aktifkan section ${keyLabel(section.section_key)}`}
                />
              </div>

              {/* Reorder Footer */}
              <div className="grid grid-cols-2 mt-4 pt-3 border-t border-border/40 divide-x divide-border/40">
                <button
                  onClick={() => void handleMove(section, -1)}
                  disabled={idx === 0 || movingId !== null}
                  className="flex items-center justify-center gap-1.5 py-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-primary active:bg-muted/30 rounded-l-md disabled:pointer-events-none disabled:opacity-40"
                >
                  <ArrowUp className="w-3.5 h-3.5" /> Naik
                </button>
                <button
                  onClick={() => void handleMove(section, 1)}
                  disabled={idx === sections.length - 1 || movingId !== null}
                  className="flex items-center justify-center gap-1.5 py-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-primary active:bg-muted/30 rounded-r-md disabled:pointer-events-none disabled:opacity-40"
                >
                  <ArrowDown className="w-3.5 h-3.5" /> Turun
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={openCreate}
        aria-label="Daftarkan section"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all active:scale-95"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Bottom sheet register */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setSheetOpen(false)}
          ></div>
          <div className="relative bg-background rounded-[2rem] w-full max-w-[400px] p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300 shadow-[0_10px_40px_rgba(0,0,0,0.2)] max-h-[85dvh] flex flex-col">
            <div className="flex items-center justify-between mb-5 shrink-0 relative">
              <h2 className="text-[15px] font-bold w-full text-center">Daftar Section</h2>
              <button
                onClick={() => setSheetOpen(false)}
                className="absolute right-0 p-2 bg-muted/50 rounded-full hover:bg-muted text-muted-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pb-4 pt-1 px-1 -mx-1 space-y-4 no-scrollbar">
              <div className="space-y-2.5">
                <Label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">Pilih Section</Label>
                {availableKeys.length === 0 ? (
                  <p className="rounded-xl bg-muted/20 p-3 text-[12px] text-muted-foreground">
                    Semua section sudah terdaftar.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2.5">
                    {availableKeys.map((opt) => {
                      const isSelected = selectedKey === opt.key;
                      return (
                        <button
                          key={opt.key}
                          onClick={() => setSelectedKey(opt.key)}
                          className={`px-4 py-2 rounded-full text-[13px] font-medium transition-colors border ${
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-transparent text-muted-foreground border-border hover:bg-muted/50"
                          } flex items-center gap-1.5`}
                        >
                          {opt.label}
                          {isSelected && <span className="text-[11px]">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="section-order" className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">Urutan</Label>
                <Input
                  id="section-order"
                  type="number"
                  value={orderIndex}
                  onChange={(e) => setOrderIndex(parseInt(e.target.value, 10))}
                  className="h-11 rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
                />
              </div>
            </div>

            <div className="pt-3 shrink-0 mt-3 flex flex-col gap-2.5 border-t border-border/40">
              <button
                onClick={handleCreate}
                disabled={createSection.isPending || availableKeys.length === 0}
                className="w-full flex items-center justify-center h-12 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer active:scale-95"
              >
                {createSection.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Daftarkan"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
