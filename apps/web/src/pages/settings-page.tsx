import { useMutation, useQuery } from "@tanstack/react-query";
import { MIN_PASSWORD_LENGTH, type Settings } from "@wedding/shared";
import { type FormEvent, useState } from "react";
import { PageHeader } from "../components/page-header.js";
import { Alert } from "../components/ui/alert.js";
import { Button } from "../components/ui/button.js";
import { Card } from "../components/ui/card.js";
import { Field } from "../components/ui/field.js";
import { Input } from "../components/ui/input.js";
import { adminApi } from "../lib/admin-api.js";
import { api } from "../lib/api.js";
import { settingsQuery, useRefresh } from "../lib/queries.js";

export function SettingsPage() {
  const settings = useQuery(settingsQuery);

  return (
    <>
      <PageHeader
        tag="Akun"
        title="Pengaturan"
        description="Data dasar pernikahan dan akun Anda."
      />
      {settings.isPending ? (
        <p className="text-ink-soft">Memuat…</p>
      ) : settings.isError ? (
        <Alert tone="error">{settings.error.message}</Alert>
      ) : (
        <WeddingForm initial={settings.data} />
      )}
      <PasswordForm />
    </>
  );
}

function WeddingForm({ initial }: { initial: Settings | null }) {
  const refresh = useRefresh();
  const [groomName, setGroomName] = useState(initial?.groomName ?? "");
  const [brideName, setBrideName] = useState(initial?.brideName ?? "");
  const [publicBaseUrl, setPublicBaseUrl] = useState(initial?.publicBaseUrl ?? "");
  const [saved, setSaved] = useState(false);

  const save = useMutation({
    mutationFn: adminApi.settings.save,
    onSuccess: async () => {
      setSaved(true);
      await refresh("settings");
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaved(false);
    save.mutate({ groomName, brideName, publicBaseUrl });
  }

  return (
    <Card>
      <form onSubmit={onSubmit} className="flex max-w-lg flex-col gap-4">
        <h2 className="font-display text-lg font-bold tracking-h3 uppercase">Pernikahan</h2>
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
        {save.error && <Alert tone="error">{save.error.message}</Alert>}
        {saved && <Alert>Tersimpan.</Alert>}
        <div>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? "Menyimpan…" : "Simpan"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [done, setDone] = useState(false);

  const change = useMutation({
    mutationFn: api.changePassword,
    onSuccess: () => {
      setDone(true);
      setCurrentPassword("");
      setNewPassword("");
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setDone(false);
    change.mutate({ currentPassword, newPassword });
  }

  return (
    <Card>
      <form onSubmit={onSubmit} className="flex max-w-lg flex-col gap-4">
        <h2 className="font-display text-lg font-bold tracking-h3 uppercase">Ganti kata sandi</h2>
        <p className="text-ink-soft">Perangkat lain yang sedang masuk akan dikeluarkan.</p>
        <Field label="Kata sandi saat ini">
          {(id) => (
            <Input
              id={id}
              type="password"
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          )}
        </Field>
        <Field label="Kata sandi baru" hint={`Minimal ${MIN_PASSWORD_LENGTH} karakter.`}>
          {(id) => (
            <Input
              id={id}
              type="password"
              autoComplete="new-password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          )}
        </Field>
        {change.error && <Alert tone="error">{change.error.message}</Alert>}
        {done && <Alert>Kata sandi diganti.</Alert>}
        <div>
          <Button type="submit" disabled={change.isPending}>
            {change.isPending ? "Menyimpan…" : "Ganti kata sandi"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
