import { Link } from "@tanstack/react-router";
import { buttonVariants } from "@/components/kit/button";

/** Halaman galat satu layar (404, 500), seperti halaman Errors di shadcn-admin. */
export function ErrorPage({
  code,
  title,
  description,
}: {
  code: string;
  title: string;
  description: string;
}) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-2 px-4 text-center">
      <h1 className="text-[7rem] leading-tight font-bold">{code}</h1>
      <p className="font-medium">{title}</p>
      <p className="text-muted-foreground">{description}</p>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={() => window.history.back()}
          className={buttonVariants({ variant: "outline" })}
        >
          Kembali
        </button>
        <Link to="/admin" className={buttonVariants()}>
          Ke beranda
        </Link>
      </div>
    </main>
  );
}

export function NotFoundPage() {
  return (
    <ErrorPage
      code="404"
      title="Halaman tidak ditemukan"
      description="Halaman yang Anda cari tidak ada atau sudah dipindahkan."
    />
  );
}

export function CrashPage() {
  return (
    <ErrorPage
      code="500"
      title="Terjadi kesalahan"
      description="Mohon maaf atas ketidaknyamanannya. Coba lagi sebentar lagi."
    />
  );
}

export function UnauthorizedPage() {
  return (
    <ErrorPage
      code="401"
      title="Belum masuk"
      description="Silakan masuk dengan akun admin untuk membuka halaman ini."
    />
  );
}

export function ForbiddenPage() {
  return (
    <ErrorPage
      code="403"
      title="Akses ditolak"
      description="Anda tidak memiliki izin untuk membuka halaman ini."
    />
  );
}

export function MaintenancePage() {
  return (
    <ErrorPage
      code="503"
      title="Sedang dalam pemeliharaan"
      description="Situs sedang tidak tersedia. Silakan coba lagi nanti."
    />
  );
}
