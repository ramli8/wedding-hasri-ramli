import { useMutation, useQuery } from "@tanstack/react-query";
import {
  COUPLE_ROLE_LABEL,
  COUPLE_ROLES,
  type CoupleProfile,
  type CoupleRole,
  type MediaRef,
} from "@wedding/shared";
import { type FormEvent, useState } from "react";
import { ImageField } from "@/components/image-field";
import { Alert } from "@/components/kit/alert";
import { Button } from "@/components/kit/button";
import { Field } from "@/components/kit/field";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { adminApi } from "../../lib/admin-api.js";
import { coupleQuery, useRefresh } from "../../lib/queries.js";

export function CouplePage() {
  const couple = useQuery(coupleQuery);

  if (couple.isError) return <Alert tone="error">{couple.error.message}</Alert>;
  if (!couple.data) return <p className="text-muted-foreground">Memuat…</p>;

  return (
    <div className="grid items-start gap-4 lg:grid-cols-2">
      {COUPLE_ROLES.map((role) => (
        <ProfileCard key={role} role={role} initial={couple.data[role]} />
      ))}
    </div>
  );
}

function ProfileCard({ role, initial }: { role: CoupleRole; initial: CoupleProfile | null }) {
  const refresh = useRefresh();
  const [fullName, setFullName] = useState(initial?.fullName ?? "");
  const [nickname, setNickname] = useState(initial?.nickname ?? "");
  const [parents, setParents] = useState(initial?.parents ?? "");
  const [bio, setBio] = useState(initial?.bio ?? "");
  const [instagram, setInstagram] = useState(initial?.instagram ?? "");
  const [photo, setPhoto] = useState<MediaRef | null>(initial?.photo ?? null);
  const [saved, setSaved] = useState(false);

  const save = useMutation({
    mutationFn: () =>
      adminApi.invitation.saveCouple(role, {
        fullName,
        nickname,
        parents,
        bio,
        instagram,
        photoMediaId: photo?.id ?? null,
      }),
    onSuccess: async ({ profile }) => {
      setPhoto(profile.photo);
      setSaved(true);
      await refresh("invitation");
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaved(false);
    save.mutate();
  }

  const touch =
    <T,>(set: (value: T) => void) =>
    (value: T) => {
      setSaved(false);
      set(value);
    };

  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle>{COUPLE_ROLE_LABEL[role]}</CardTitle>
      </CardHeader>
      <form onSubmit={onSubmit} className="flex flex-col gap-4 px-6">
        <ImageField
          label="Foto"
          value={photo}
          onChange={touch(setPhoto)}
          recommendation="potret 4:5, 1600 × 2000 px (minimal 1200 px lebar). Foto tampil utuh selebar kartu tanpa dipotong; wajah di tengah atas paling aman."
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama lengkap">
            {(id) => (
              <Input
                id={id}
                required
                value={fullName}
                onChange={(e) => touch(setFullName)(e.target.value)}
              />
            )}
          </Field>
          <Field label="Nama panggilan">
            {(id) => (
              <Input
                id={id}
                value={nickname}
                onChange={(e) => touch(setNickname)(e.target.value)}
              />
            )}
          </Field>
        </div>
        <Field label="Orang tua" hint='Mis. "Putra dari Bpk. A & Ibu B".'>
          {(id) => (
            <Input id={id} value={parents} onChange={(e) => touch(setParents)(e.target.value)} />
          )}
        </Field>
        <Field label="Perkenalan singkat" hint="Maksimal 600 karakter.">
          {(id) => (
            <Textarea
              id={id}
              maxLength={600}
              value={bio}
              onChange={(e) => touch(setBio)(e.target.value)}
            />
          )}
        </Field>
        <Field label="Instagram" hint="Tanpa @. Tampil sebagai tautan di undangan.">
          {(id) => (
            <Input
              id={id}
              value={instagram}
              onChange={(e) => touch(setInstagram)(e.target.value)}
            />
          )}
        </Field>

        {save.error && <Alert tone="error">{save.error.message}</Alert>}
        {saved && !save.error && <Alert>Tersimpan.</Alert>}
        <div className="flex justify-end pb-6">
          <Button type="submit" disabled={save.isPending || !fullName.trim()}>
            {save.isPending ? "Menyimpan…" : "Simpan"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
