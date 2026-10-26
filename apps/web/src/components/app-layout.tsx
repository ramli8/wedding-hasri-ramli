import { useSuspenseQuery } from "@tanstack/react-query";
import { Outlet } from "@tanstack/react-router";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { DirectionProvider } from "@/context/direction-provider";
import { LayoutProvider } from "@/context/layout-provider";
import { SearchProvider } from "@/context/search-provider";
import { ThemeProvider } from "@/context/theme-provider";
import { getCookie } from "@/lib/cookies";
import { meQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { ConfigDrawer } from "./config-drawer";
import { AppSidebar } from "./layout/app-sidebar";
import { Header } from "./layout/header";
import { Main } from "./layout/main";
import { ProfileDropdown } from "./profile-dropdown";
import { Search } from "./search";
import { ThemeSwitch } from "./theme-switch";

/** Kerangka AuthenticatedLayout shadcn-admin: providers + SidebarProvider + AppSidebar + SidebarInset (Header, Main). */
export function AppLayout() {
  const { data } = useSuspenseQuery(meQuery);
  const user = { name: data?.admin.name ?? "?", email: data?.admin.email ?? "" };
  const defaultOpen = getCookie("sidebar_state") !== "false";

  return (
    <DirectionProvider>
      <ThemeProvider>
        <LayoutProvider>
          <SearchProvider>
            <SidebarProvider defaultOpen={defaultOpen}>
              <AppSidebar user={user} />
              <SidebarInset
                className={cn(
                  "@container/content",
                  "print:m-0 print:rounded-none print:shadow-none",
                )}
              >
                <Header fixed className="print:hidden">
                  <Search className="me-auto" />
                  <ThemeSwitch />
                  <ConfigDrawer />
                  <ProfileDropdown user={user} />
                </Header>
                <Main className="flex flex-1 flex-col gap-4 sm:gap-6 print:p-0">
                  <Outlet />
                </Main>
              </SidebarInset>
            </SidebarProvider>
          </SearchProvider>
        </LayoutProvider>
      </ThemeProvider>
    </DirectionProvider>
  );
}
