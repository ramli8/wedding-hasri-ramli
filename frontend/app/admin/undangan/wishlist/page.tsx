"use client";

import { UndanganSubPage } from "@/src/presentation/components/admin/undangan/undangan-sub-page";
import { WishlistTab } from "@/src/presentation/components/admin/undangan/wishlist-tab";

export default function WishlistUndanganPage() {
  return (
    <UndanganSubPage title="Wishlist">
      {() => <WishlistTab />}
    </UndanganSubPage>
  );
}
