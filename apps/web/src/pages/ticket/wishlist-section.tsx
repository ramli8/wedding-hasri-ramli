import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { InvitationResponse, Wish } from "@wedding/shared";
import { ExternalLink } from "lucide-react";
import { Alert } from "../../components/guest-ui/alert.js";
import { Badge } from "../../components/guest-ui/badge.js";
import { Button } from "../../components/guest-ui/button.js";
import { Select } from "../../components/guest-ui/select.js";
import { publicApi } from "../../lib/public-api.js";
import { BODY_COL, HEAD_COL, MagHead } from "./mag.js";

/** Wishlist hadiah: tamu memilih hadiah agar tidak ada yang memberi hal yang sama. */
export function WishlistSection({
  wishes,
  code,
  folio,
}: {
  wishes: Wish[];
  code: string;
  folio: string;
}) {
  const queryClient = useQueryClient();
  const mine = useQuery({
    queryKey: ["public", "claims", code],
    queryFn: () => publicApi.claims(code),
    retry: false,
  });
  const mineBy = new Map((mine.data?.claims ?? []).map((c) => [c.wishId, c.quantity]));

  const claim = useMutation({
    mutationFn: (input: { wishId: string; quantity: number }) =>
      publicApi.claim({ code, ...input }),
    onSuccess: ({ wish }) => {
      queryClient.setQueryData<InvitationResponse>(
        ["public", "invitation"],
        (old) => old && { ...old, wishes: old.wishes.map((w) => (w.id === wish.id ? wish : w)) },
      );
      void queryClient.invalidateQueries({ queryKey: ["public", "claims", code] });
    },
    onError: async () => {
      // Biasanya hadiah sudah diambil tamu lain: tampilkan sisa yang terbaru.
      const fresh = await publicApi.invitation(true).catch(() => null);
      if (fresh) queryClient.setQueryData(["public", "invitation"], fresh);
    },
  });

  return (
    <section
      id="wishlist"
      aria-label="Wishlist hadiah"
      className="flex scroll-mt-16 flex-col gap-8"
    >
      <div className={`flex flex-col gap-4 ${HEAD_COL}`}>
        <MagHead
          folio={folio}
          title="Wishlist hadiah"
          kicker="Pilih satu hadiah agar tidak ada yang memberi hal yang sama. Pilihan bisa dibatalkan kapan saja."
        />
        {claim.error && <Alert tone="error">{claim.error.message}</Alert>}
      </div>
      <ul className={`grid gap-x-10 md:grid-cols-2 ${BODY_COL}`}>
        {wishes.map((wish) => {
          const picked = mineBy.get(wish.id) ?? 0;
          const remaining = wish.quantity - wish.claimed;
          const canChoose = mine.isSuccess && (remaining > 0 || picked > 0);
          const max = remaining + picked;
          const busy = claim.isPending && claim.variables?.wishId === wish.id;
          const set = (quantity: number) => claim.mutate({ wishId: wish.id, quantity });
          const dimmed = wish.isFulfilled && picked === 0;

          return (
            <li
              key={wish.id}
              className={`flex gap-4 border-t border-ink/30 py-5 ${dimmed ? "opacity-60" : ""}`}
            >
              {wish.photo && (
                <img
                  src={wish.photo.thumb}
                  alt=""
                  width={wish.photo.width}
                  height={wish.photo.height}
                  loading="lazy"
                  decoding="async"
                  className="size-24 shrink-0 object-cover grayscale"
                />
              )}
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <p className={`font-display font-bold ${dimmed ? "line-through" : ""}`}>
                  {wish.name}
                </p>
                {wish.note && <p className="text-sm break-words text-ink-soft">{wish.note}</p>}
                {wish.quantity > 1 && !wish.isFulfilled && (
                  <p className="text-sm font-semibold">
                    Masih dibutuhkan {remaining} dari {wish.quantity}
                  </p>
                )}
                {dimmed && (
                  <Badge variant="pill" className="w-fit">
                    Sudah dipilih / terpenuhi
                  </Badge>
                )}
                {picked > 0 && (
                  <Badge variant="pill" className="w-fit">
                    Pilihan Anda{wish.quantity > 1 ? `: ${picked}` : ""}
                  </Badge>
                )}
                {wish.url && !dimmed && (
                  <a
                    href={wish.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-fit items-center gap-1 text-sm font-semibold underline"
                  >
                    Lihat di toko <ExternalLink className="size-3.5" aria-hidden />
                  </a>
                )}
                {canChoose &&
                  (max <= 1 ? (
                    <Button
                      size="sm"
                      variant={picked > 0 ? "secondary" : "primary"}
                      className="w-fit"
                      disabled={busy}
                      onClick={() => set(picked > 0 ? 0 : 1)}
                    >
                      {picked > 0 ? "Batalkan pilihan" : "Saya yang berikan"}
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2 text-sm">
                      <span>Saya berikan</span>
                      <Select
                        aria-label={`Jumlah ${wish.name} yang Anda berikan`}
                        className="w-auto"
                        value={picked}
                        disabled={busy}
                        onChange={(e) => set(Number(e.target.value))}
                      >
                        <option value={0}>Belum memilih</option>
                        {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </Select>
                    </div>
                  ))}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
