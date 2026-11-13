import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import { AppLayout } from "./components/app-layout.js";
import { getBoothMeta } from "./lib/booth/db.js";
import { meQuery } from "./lib/queries.js";
import { getMeta } from "./lib/scan/db.js";
import { BoothAdminPage } from "./pages/booth/booth-admin-page.js";
import { BoothPage } from "./pages/booth/booth-page.js";
import { BoothPairPage } from "./pages/booth/booth-pair-page.js";
import { BoothPhotosPage } from "./pages/booth/booth-photos-page.js";
import { GuestPhotoPage } from "./pages/booth/guest-photo-page.js";
import { CheckinPage } from "./pages/checkin-page.js";
import { DevicesPage } from "./pages/devices-page.js";
import {
  CrashPage,
  ForbiddenPage,
  MaintenancePage,
  NotFoundPage,
  UnauthorizedPage,
} from "./pages/error-page.js";
import { EventsPage } from "./pages/events-page.js";
import { GroupsPage } from "./pages/groups-page.js";
import { GuestbookPage } from "./pages/guestbook-page.js";
import { GuestsPage } from "./pages/guests/guests-page.js";
import { ImportPage } from "./pages/guests/import-page.js";
import { PrintPage } from "./pages/guests/print-page.js";
import { GuidePage } from "./pages/guide-page.js";
import { HomePage } from "./pages/home-page.js";
import { CouplePage } from "./pages/invitation/couple-page.js";
import { FaqPage } from "./pages/invitation/faq-page.js";
import { GalleryPage } from "./pages/invitation/gallery-page.js";
import { GiftsPage } from "./pages/invitation/gifts-page.js";
import { InvitationLayout } from "./pages/invitation/invitation-layout.js";
import { LayoutPage } from "./pages/invitation/layout-page.js";
import { StoryPage } from "./pages/invitation/story-page.js";
import { WishlistPage } from "./pages/invitation/wishlist-page.js";
import { LoginPage } from "./pages/login.js";
import { ReceivedGiftsPage } from "./pages/received-gifts-page.js";
import { RsvpPage } from "./pages/rsvp-page.js";
import { PairPage } from "./pages/scan/pair-page.js";
import { ReadinessPage } from "./pages/scan/readiness-page.js";
import { ScannerPage } from "./pages/scan/scanner-page.js";
import { MessageSettings } from "./pages/settings/message-settings.js";
import { SettingsLayout } from "./pages/settings/settings-layout.js";
import { AccountSettings, BackupSettings } from "./pages/settings/settings-pages.js";
import { SiteSettings } from "./pages/settings/site-settings.js";
import { InvitationPage } from "./pages/ticket/invitation-page.js";
import { VendorsPage } from "./pages/vendors-page.js";

type RouterContext = { queryClient: QueryClient };

const rootRoute = createRootRouteWithContext<RouterContext>()({ component: Outlet });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/admin" });
  },
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/masuk",
  beforeLoad: async ({ context }) => {
    const me = await context.queryClient.fetchQuery(meQuery);
    if (me) throw redirect({ to: "/admin" });
  },
  component: LoginPage,
});

// Layout tanpa path: semua halaman admin di bawahnya memerlukan login.
const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "app",
  beforeLoad: async ({ context }) => {
    const me = await context.queryClient.ensureQueryData(meQuery);
    if (!me) throw redirect({ to: "/admin/masuk" });
  },
  component: AppLayout,
});

const adminIndexRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/admin",
  component: HomePage,
});

const guideRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/admin/panduan",
  component: GuidePage,
});

const guestsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/admin/tamu",
  // ?acara=<id> dan ?kelompok=<id> membuka daftar tamu yang sudah disaring (dari kartu Acara /
  // halaman Kelompok); ?kirim=antre membuka antrean kirim undangan (dari Beranda).
  validateSearch: (
    search: Record<string, unknown>,
  ): { acara?: string; kelompok?: string; kirim?: "antre" } => ({
    acara: typeof search.acara === "string" && search.acara ? search.acara : undefined,
    kelompok: typeof search.kelompok === "string" && search.kelompok ? search.kelompok : undefined,
    kirim: search.kirim === "antre" ? "antre" : undefined,
  }),
  component: GuestsPage,
});

const importRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/admin/tamu/impor",
  component: ImportPage,
});

const printRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/admin/tamu/cetak",
  component: PrintPage,
});

const groupsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/admin/kelompok",
  component: GroupsPage,
});

const eventsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/admin/acara",
  component: EventsPage,
});

const vendorsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/admin/vendor",
  component: VendorsPage,
});

const receivedGiftsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/admin/hadiah",
  component: ReceivedGiftsPage,
});

const rsvpRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/admin/rsvp",
  component: RsvpPage,
});

// Isi undangan: satu kerangka dengan tab (mempelai, cerita, ucapan; bagian lain menyusul).
const invitationRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/admin/undangan",
  component: InvitationLayout,
});

const invitationIndexRoute = createRoute({
  getParentRoute: () => invitationRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/admin/undangan/mempelai" });
  },
});

const coupleRoute = createRoute({
  getParentRoute: () => invitationRoute,
  path: "mempelai",
  component: CouplePage,
});

const storyRoute = createRoute({
  getParentRoute: () => invitationRoute,
  path: "cerita",
  component: StoryPage,
});

const galleryRoute = createRoute({
  getParentRoute: () => invitationRoute,
  path: "galeri",
  component: GalleryPage,
});

const giftsRoute = createRoute({
  getParentRoute: () => invitationRoute,
  path: "amplop",
  component: GiftsPage,
});

const faqRoute = createRoute({
  getParentRoute: () => invitationRoute,
  path: "faq",
  component: FaqPage,
});

const wishlistRoute = createRoute({
  getParentRoute: () => invitationRoute,
  path: "wishlist",
  component: WishlistPage,
});

const layoutRoute = createRoute({
  getParentRoute: () => invitationRoute,
  path: "susunan",
  component: LayoutPage,
});

const guestbookRoute = createRoute({
  getParentRoute: () => invitationRoute,
  path: "ucapan",
  component: GuestbookPage,
});

const checkinRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/admin/checkin",
  component: CheckinPage,
});

const devicesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/admin/perangkat",
  component: DevicesPage,
});

const settingsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/admin/pengaturan",
  component: SettingsLayout,
});
const settingsChildren = [
  createRoute({ getParentRoute: () => settingsRoute, path: "/", component: SiteSettings }),
  createRoute({
    getParentRoute: () => settingsRoute,
    path: "pesan",
    validateSearch: (
      search: Record<string, unknown>,
    ): { acara?: string; jenis?: "pengingat" | "terima-kasih" } => ({
      acara: typeof search.acara === "string" && search.acara ? search.acara : undefined,
      jenis:
        search.jenis === "pengingat" || search.jenis === "terima-kasih" ? search.jenis : undefined,
    }),
    component: MessageSettings,
  }),
  createRoute({ getParentRoute: () => settingsRoute, path: "akun", component: AccountSettings }),
  createRoute({ getParentRoute: () => settingsRoute, path: "cadangan", component: BackupSettings }),
  // Alamat lama (sebelum menu digabung) tetap berfungsi.
  createRoute({
    getParentRoute: () => settingsRoute,
    path: "pratinjau",
    beforeLoad: () => {
      throw redirect({ to: "/admin/pengaturan" });
    },
  }),
  ...["sandi", "tampilan"].map((path) =>
    createRoute({
      getParentRoute: () => settingsRoute,
      path,
      beforeLoad: () => {
        throw redirect({ to: "/admin/pengaturan/akun" });
      },
    }),
  ),
];

const errorRoutes = [
  ["/401", UnauthorizedPage],
  ["/403", ForbiddenPage],
  ["/404", NotFoundPage],
  ["/500", CrashPage],
  ["/503", MaintenancePage],
].map(([path, component]) =>
  createRoute({
    getParentRoute: () => rootRoute,
    path: path as string,
    component: component as () => React.JSX.Element,
  }),
);

// Halaman pribadi tamu: terbuka tanpa login, dikenali dari kode di URL. Tiket QR dan RSVP kini
// menjadi bagian dari satu halaman undangan penuh, jadi alamat tanpa akhiran dialihkan ke sana.
const ticketRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/u/$code",
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/u/$code/undangan", params });
  },
});

const guestInvitationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/u/$code/undangan",
  component: InvitationPage,
});

// Foto photobooth tamu: dibuka dari QR unik di cetakan 4R, tanpa login.
const guestPhotoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/foto/$id",
  component: GuestPhotoPage,
});

// Aplikasi penjaga pintu: tidak memakai login admin, melainkan token perangkat (lihat /scan/pasang).
const requirePairedDevice = async () => {
  if (!(await getMeta("auth"))) throw redirect({ to: "/scan/pasang" });
};

const scanRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/scan",
  beforeLoad: requirePairedDevice,
  component: ScannerPage,
});

const pairRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/scan/pasang",
  component: PairPage,
});

const readinessRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/scan/siap",
  beforeLoad: requirePairedDevice,
  component: ReadinessPage,
});

// Photobooth (laptop di hari-H): token perangkat sendiri, terpisah dari scanner.
const boothRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/booth",
  beforeLoad: async () => {
    if (!(await getBoothMeta("auth"))) throw redirect({ to: "/booth/pasang" });
  },
  component: BoothPage,
});

const boothPairRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/booth/pasang",
  component: BoothPairPage,
});

const boothPhotosRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/admin/photobooth/foto",
  component: BoothPhotosPage,
});

const boothAdminRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/admin/photobooth",
  component: BoothAdminPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  ticketRoute,
  guestInvitationRoute,
  guestPhotoRoute,
  scanRoute,
  pairRoute,
  readinessRoute,
  boothRoute,
  boothPairRoute,
  appRoute.addChildren([
    adminIndexRoute,
    guideRoute,
    guestsRoute,
    importRoute,
    printRoute,
    groupsRoute,
    eventsRoute,
    rsvpRoute,
    receivedGiftsRoute,
    vendorsRoute,
    invitationRoute.addChildren([
      invitationIndexRoute,
      coupleRoute,
      storyRoute,
      galleryRoute,
      giftsRoute,
      faqRoute,
      wishlistRoute,
      layoutRoute,
      guestbookRoute,
    ]),
    checkinRoute,
    devicesRoute,
    boothAdminRoute,
    boothPhotosRoute,
    settingsRoute.addChildren(settingsChildren),
    ...errorRoutes,
  ]),
]);

export const router = createRouter({
  routeTree,
  context: { queryClient: undefined as unknown as QueryClient },
  defaultNotFoundComponent: NotFoundPage,
  defaultErrorComponent: CrashPage,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
