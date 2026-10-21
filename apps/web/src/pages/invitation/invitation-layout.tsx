import { Link, Outlet } from "@tanstack/react-router";
import { PageHeader } from "../../components/page-header.js";

const tabs = [
  { to: "/admin/undangan/mempelai", label: "Mempelai" },
  { to: "/admin/undangan/cerita", label: "Cerita" },
  { to: "/admin/undangan/ucapan", label: "Ucapan" },
] as const;

// TanStack Router memberi data-status="active" pada tautan yang sedang aktif.
const tab =
  "border-2 border-ink px-4 py-2 font-display text-sm font-bold tracking-button whitespace-nowrap uppercase hover:bg-bone-2 data-[status=active]:bg-acid data-[status=active]:shadow-hard-sm";

/** Kerangka bagian Undangan di admin: isi yang tampil di halaman /u/KODE milik tamu. */
export function InvitationLayout() {
  return (
    <>
      <PageHeader
        tag="Undangan"
        title="Isi undangan"
        description="Yang Anda isi di sini tampil di halaman undangan tamu (/u/KODE). Bagian lain menyusul."
      />
      <nav aria-label="Bagian undangan" className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <Link key={item.to} to={item.to} className={tab}>
            {item.label}
          </Link>
        ))}
      </nav>
      <Outlet />
    </>
  );
}
