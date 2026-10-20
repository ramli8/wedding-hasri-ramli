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
import { EventsPage } from "./pages/events-page.js";
import { GroupsPage } from "./pages/groups-page.js";
import { GuestsPage } from "./pages/guests/guests-page.js";
import { ImportPage } from "./pages/guests/import-page.js";
import { LoginPage } from "./pages/login.js";
import { SettingsPage } from "./pages/settings-page.js";

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

const settingsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/admin/pengaturan",
  component: SettingsPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  appRoute.addChildren([
    adminIndexRoute,
    guestsRoute,
    importRoute,
    groupsRoute,
    eventsRoute,
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
