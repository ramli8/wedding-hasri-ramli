import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DEFAULT_THANKS_TEMPLATE,
  giftPhrase,
  type ReceivedGift,
  renderTemplate,
  THANKS_TEMPLATE_VARIABLES,
  whatsappUrl,
} from "@wedding/shared";
import { useState } from "react";
import { Alert } from "@/components/kit/alert";
import { Button } from "@/components/kit/button";
import { Dialog } from "@/components/kit/dialog";
import { Textarea } from "@/components/ui/textarea";
import { adminApi } from "../lib/admin-api.js";
import { formatRupiah } from "../lib/format.js";
import { receivedGiftsQuery, settingsQuery } from "../lib/queries.js";

const STORAGE_KEY = "thanks-template";

function loadTemplate() {
  try {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_THANKS_TEMPLATE;
  } catch {
    return DEFAULT_THANKS_TEMPLATE;
  }
}

/**
 * Ucapan terima kasih lewat WhatsApp untuk pemberi yang belum dibalas. Admin menekan kirim
 * sendiri di WhatsApp; membukanya di sini sekaligus menandai "sudah dibalas".
 */
export function ThanksDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const settings = useQuery(settingsQuery);
  // Semua catatan, tidak terpengaruh filter di halaman Hadiah.
  const all = useQuery({ ...receivedGiftsQuery({}), enabled: open });
  const gifts = all.data?.items ?? [];
  const [template, setTemplate] = useState(loadTemplate);

  const pending = gifts.filter((gift) => !gift.thankedAt);
  const withPhone = pending.filter((gift) => gift.phone);
  const noPhone = pending.length - withPhone.length;
  const couple = settings.data ? `${settings.data.brideName} & ${settings.data.groomName}` : "";

  const thank = useMutation({
    mutationFn: (id: string) => adminApi.receivedGifts.thank(id, true),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["received-gifts"] }),
  });

  const textFor = (gift: ReceivedGift) =>
    renderTemplate(template, {
      panggilan: gift.giverName,
      hadiah: giftPhrase(gift),
      mempelai: couple,
    });

  function changeTemplate(value: string) {
    setTemplate(value);
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // Tanpa penyimpanan peramban, isi template hanya berlaku selama dialog terbuka.
    }
  }

  function send(gift: ReceivedGift) {
    if (!gift.phone) return;
    // window.open harus dipanggil langsung dari klik agar tidak diblokir pop-up blocker.
    window.open(whatsappUrl(gift.phone, textFor(gift)), "_blank", "noopener");
    thank.mutate(gift.id);
  }

  const first = withPhone[0];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      wide
      title="Kirim ucapan terima kasih"
      description={`${withPhone.length} pemberi belum dibalas dan punya nomor HP.`}
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="thanks-template" className="text-xs font-medium text-foreground">
          Isi pesan
        </label>
        <Textarea
          id="thanks-template"
          spellCheck={false}
          className="min-h-36"
          value={template}
          onChange={(e) => changeTemplate(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Variabel: {THANKS_TEMPLATE_VARIABLES.map((v) => v.name).join(" ")}.{" "}
          <button
            type="button"
            className="underline"
            onClick={() => changeTemplate(DEFAULT_THANKS_TEMPLATE)}
          >
            Kembalikan bawaan
          </button>
        </p>
        {first && (
          <details className="text-sm">
            <summary className="cursor-pointer font-semibold">
              Contoh untuk {first.giverName}
            </summary>
            <pre className="mt-2 border bg-background p-3 break-words whitespace-pre-wrap">
              {textFor(first)}
            </pre>
          </details>
        )}
      </div>

      {noPhone > 0 && (
        <p className="text-sm text-muted-foreground">
          {noPhone} pemberi lain belum dibalas tetapi tidak punya nomor HP (bukan tamu terdaftar
          atau hanya Instagram); balas manual lalu tandai "Sudah dibalas" di daftar.
        </p>
      )}
      {thank.error && <Alert tone="error">{thank.error.message}</Alert>}

      {withPhone.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {pending.length === 0
            ? "Semua pemberi sudah dibalas."
            : "Tidak ada pemberi yang bisa dikirimi lewat WhatsApp."}
        </p>
      ) : (
        <ul className="flex max-h-80 flex-col overflow-y-auto border">
          {withPhone.map((gift) => (
            <li
              key={gift.id}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-3 last:border-b-0"
            >
              <div className="min-w-0">
                <p className="font-semibold break-words">{gift.giverName}</p>
                <p className="text-xs text-muted-foreground">
                  {gift.kind === "barang"
                    ? gift.itemDescription
                    : gift.amount !== null && formatRupiah(gift.amount)}
                </p>
              </div>
              <Button size="sm" onClick={() => send(gift)} disabled={thank.isPending}>
                Buka WhatsApp
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}
