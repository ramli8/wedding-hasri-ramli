import { useMutation } from "@tanstack/react-query";
import { MIN_PASSWORD_LENGTH } from "@wedding/shared";
import { Download, Eye, EyeOff } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Alert } from "@/components/kit/alert";
import { Button, buttonVariants } from "@/components/kit/button";
import { Field } from "@/components/kit/field";
import { Input } from "@/components/ui/input";
import { downloads } from "../../lib/admin-api.js";
import { api } from "../../lib/api.js";

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
        className="h-11 pe-11 text-base md:h-9 md:text-sm"
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
  const [submitted, setSubmitted] = useState(false);

  const change = useMutation({
    mutationFn: api.changePassword,
    meta: { toast: "Kata sandi diganti; perangkat lain dikeluarkan" },
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSubmitted(false);
    },
  });

  const errors = {
    current: !currentPassword ? "Isi kata sandi saat ini" : null,
    next:
      newPassword.length < MIN_PASSWORD_LENGTH ? `Minimal ${MIN_PASSWORD_LENGTH} karakter` : null,
    confirm: confirmPassword !== newPassword ? "Belum sama dengan kata sandi baru" : null,
  };
  const valid = !errors.current && !errors.next && !errors.confirm;
  const shown = (error: string | null) => (submitted ? error : null);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (valid) change.mutate({ currentPassword, newPassword });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <Field label="Kata sandi saat ini" error={shown(errors.current)}>
        {(id) => (
          <PasswordInput
            id={id}
            autoComplete="current-password"
            value={currentPassword}
            onChange={setCurrentPassword}
          />
        )}
      </Field>
      <Field label="Kata sandi baru" error={shown(errors.next)}>
        {(id) => (
          <PasswordInput
            id={id}
            autoComplete="new-password"
            value={newPassword}
            onChange={setNewPassword}
          />
        )}
      </Field>
      <Field label="Ulangi kata sandi baru" error={shown(errors.confirm)}>
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
        <Button type="submit" disabled={change.isPending} className="h-11 md:h-9">
          {change.isPending ? "Menyimpan…" : "Ganti kata sandi"}
        </Button>
      </div>
    </form>
  );
}

export function ExportCard() {
  const links = [
    { href: downloads.dataJson, label: "Semua data (JSON)" },
    { href: downloads.mediaZip, label: "Semua foto (ZIP)" },
    { href: downloads.guestsXlsx, label: "Daftar tamu (Excel)" },
  ];
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Salinan untuk arsip pribadi, melengkapi cadangan otomatis server.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className={buttonVariants({ variant: "outline", className: "h-11 md:h-9" })}
          >
            <Download className="size-4" aria-hidden />
            {link.label}
          </a>
        ))}
      </div>
    </div>
  );
}
