import { useMutation } from "@tanstack/react-query";
import { MIN_PASSWORD_LENGTH, type Settings } from "@wedding/shared";
import { Download, Eye, EyeOff } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Alert } from "@/components/kit/alert";
import { Button, buttonVariants } from "@/components/kit/button";
import { Field } from "@/components/kit/field";
import { Input } from "@/components/ui/input";
import { adminApi, downloads } from "../../lib/admin-api.js";
import { api } from "../../lib/api.js";
import { isoToWibInput, wibInputToIso } from "../../lib/datetime.js";
import { useRefresh } from "../../lib/queries.js";

export function WeddingForm({ initial }: { initial: Settings | null }) {
  const refresh = useRefresh();
  const [groomName, setGroomName] = useState(initial?.groomName ?? "");
  const [brideName, setBrideName] = useState(initial?.brideName ?? "");
  const [publicBaseUrl, setPublicBaseUrl] = useState(initial?.publicBaseUrl ?? "");
  // Tujuan hitung mundur di undangan (WIB). Kosong: tanggal acara pertama.
  const [countdownAt, setCountdownAt] = useState(isoToWibInput(initial?.countdownAt));

  // "Tersimpan" ditampilkan toast global (MutationCache di main.tsx).
  const save = useMutation({
    mutationFn: adminApi.settings.save,
    onSuccess: () => refresh("settings"),
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    save.mutate({ groomName, brideName, publicBaseUrl, countdownAt: wibInputToIso(countdownAt) });
  }

  return (
    <div>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {!initial && (
          <Alert>
            Isi dulu data ini. Alamat situs dipakai untuk membuat link undangan tiap tamu.
          </Alert>
        )}
        <Field label="Mempelai pria">
          {(id) => (
            <Input
              id={id}
              required
              value={groomName}
              onChange={(e) => setGroomName(e.target.value)}
            />
          )}
        </Field>
        <Field label="Mempelai wanita">
          {(id) => (
            <Input
              id={id}
              required
              value={brideName}
              onChange={(e) => setBrideName(e.target.value)}
            />
          )}
        </Field>
        <Field
          label="Alamat situs"
          hint="Contoh: https://hasriramli.com. Link tamu menjadi alamat ini + /u/KODE."
        >
          {(id) => (
            <Input
              id={id}
              type="url"
              required
              placeholder="https://"
              value={publicBaseUrl}
              onChange={(e) => setPublicBaseUrl(e.target.value)}
            />
          )}
        </Field>
        <Field label="Hitung mundur ke (WIB)">
          {(id) => (
            <Input
              id={id}
              type="datetime-local"
              value={countdownAt}
              onChange={(e) => setCountdownAt(e.target.value)}
            />
          )}
        </Field>
        {save.error && <Alert tone="error">{save.error.message}</Alert>}
        <div>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? "Menyimpan…" : "Simpan"}
          </Button>
        </div>
      </form>
    </div>
  );
}

/** Kolom kata sandi dengan tombol mata 44px, sama seperti halaman masuk. */
function PasswordInput({
  id,
  value,
  onChange,
  autoComplete,
  minLength,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  minLength?: number;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        autoComplete={autoComplete}
        required
        minLength={minLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pe-11"
      />
      <button
        type="button"
        onClick={() => setShow((current) => !current)}
        aria-label={show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
        aria-pressed={show}
        className="absolute end-0 top-0 grid size-11 place-items-center rounded-e-md text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none md:size-9"
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

export function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const change = useMutation({
    mutationFn: api.changePassword,
    meta: { toast: "Kata sandi diganti" },
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
  });

  const mismatch = confirmPassword !== "" && confirmPassword !== newPassword;

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (newPassword !== confirmPassword) return;
    change.mutate({ currentPassword, newPassword });
  }

  return (
    <div>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Perangkat lain yang sedang masuk akan dikeluarkan.
        </p>
        <Field label="Kata sandi saat ini">
          {(id) => (
            <PasswordInput
              id={id}
              autoComplete="current-password"
              value={currentPassword}
              onChange={setCurrentPassword}
            />
          )}
        </Field>
        <Field label="Kata sandi baru" hint={`Minimal ${MIN_PASSWORD_LENGTH} karakter.`}>
          {(id) => (
            <PasswordInput
              id={id}
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
              value={newPassword}
              onChange={setNewPassword}
            />
          )}
        </Field>
        <Field
          label="Ulangi kata sandi baru"
          error={mismatch ? "Belum sama dengan kata sandi baru." : null}
        >
          {(id) => (
            <PasswordInput
              id={id}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={setConfirmPassword}
            />
          )}
        </Field>
        {change.error && <Alert tone="error">{change.error.message}</Alert>}
        <div>
          <Button
            type="submit"
            disabled={change.isPending || !confirmPassword || confirmPassword !== newPassword}
          >
            {change.isPending ? "Menyimpan…" : "Ganti kata sandi"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export function ExportCard() {
  return (
    <div>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Unduh salinan data Anda kapan saja untuk arsip pribadi. Server juga mencadangkan data dan
          foto secara otomatis ke penyimpanan awan secara berkala (bila sudah disiapkan pengelola
          server); unduhan ini pelengkapnya, bukan penggantinya.
        </p>
        <div className="flex flex-wrap gap-3">
          <a href={downloads.dataJson} className={buttonVariants({ variant: "outline" })}>
            <Download className="size-4" aria-hidden />
            Semua data (JSON)
          </a>
          <a href={downloads.mediaZip} className={buttonVariants({ variant: "outline" })}>
            <Download className="size-4" aria-hidden />
            Semua foto (ZIP)
          </a>
          <a href={downloads.guestsCsv} className={buttonVariants({ variant: "outline" })}>
            <Download className="size-4" aria-hidden />
            Daftar tamu (CSV)
          </a>
        </div>
        <p className="text-xs text-muted-foreground">
          Data JSON memuat semua tabel (tamu, undangan, check-in, hadiah, vendor, dan lainnya) tanpa
          akun admin dan token perangkat. ZIP foto bisa besar bila fotonya banyak; berkasnya disusun
          sambil diunduh.
        </p>
      </div>
    </div>
  );
}
