import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import { AppLayout } from "./components/app-layout.js";
import { meQuery } from "./lib/queries.js";
import { getMeta } from "./lib/scan/db.js";
import { CheckinPage } from "./pages/checkin-page.js";
import { DevicesPage } from "./pages/devices-page.js";
import { EventsPage } from "./pages/events-page.js";
import { GroupsPage } from "./pages/groups-page.js";
import { GuestbookPage } from "./pages/guestbook-page.js";
import { GuestsPage } from "./pages/guests/guests-page.js";
import { ImportPage } from "./pages/guests/import-page.js";
import { PrintPage } from "./pages/guests/print-page.js";
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
import { SettingsPage } from "./pages/settings-page.js";
import { InvitationPage } from "./pages/ticket/invitation-page.js";
import { TicketPage } from "./pages/ticket/ticket-page.js";
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
  beforeLoad: () => {
    throw redirect({ to: "/admin/tamu" });
  },
});

const guestsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/admin/tamu",
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
  component: SettingsPage,
});

// Halaman pribadi tamu (tiket QR, RSVP): terbuka tanpa login, dikenali dari kode di URL.
const ticketRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/u/$code",
  component: TicketPage,
});

const guestInvitationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/u/$code/undangan",
  component: InvitationPage,
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

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  ticketRoute,
  guestInvitationRoute,
  scanRoute,
  pairRoute,
  readinessRoute,
  appRoute.addChildren([
    adminIndexRoute,
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
    settingsRoute,
  ]),
]);

export const router = createRouter({
  routeTree,
  context: { queryClient: undefined as unknown as QueryClient },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
