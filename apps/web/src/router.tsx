import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import { meQuery } from "./lib/queries.js";
import { AdminHomePage } from "./pages/admin-home.js";
import { LoginPage } from "./pages/login.js";

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

const adminHomeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  beforeLoad: async ({ context }) => {
    const me = await context.queryClient.ensureQueryData(meQuery);
    if (!me) throw redirect({ to: "/admin/masuk" });
  },
  component: AdminHomePage,
});

const routeTree = rootRoute.addChildren([indexRoute, loginRoute, adminHomeRoute]);

export const router = createRouter({
  routeTree,
  context: { queryClient: undefined as unknown as QueryClient },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
