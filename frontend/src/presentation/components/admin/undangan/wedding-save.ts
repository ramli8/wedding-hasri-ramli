import type { WeddingResponse, WeddingContent, UpdateWeddingRequest } from "@/src/domain/services/wedding.service";
import { DEFAULT_WEDDING_CONTENT } from "@/src/domain/services/wedding.service";

interface SavePatch {
  wedding_date?: string | null;
  gift_shipping_address?: string | null;
  content?: Partial<WeddingContent>;
}

export function buildSaveRequest(
  data: WeddingResponse | undefined,
  patch: SavePatch
): UpdateWeddingRequest {
  return {
    groom_name: data?.groom_name ?? "",
    bride_name: data?.bride_name ?? "",
    wedding_date: patch.wedding_date !== undefined ? patch.wedding_date : data?.wedding_date ?? null,
    gift_shipping_address:
      patch.gift_shipping_address !== undefined
        ? patch.gift_shipping_address
        : data?.gift_shipping_address ?? null,
    content: {
      ...DEFAULT_WEDDING_CONTENT,
      ...(data?.content ?? {}),
      ...(patch.content ?? {}),
    },
  };
}
