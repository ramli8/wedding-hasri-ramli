import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { type Event, type Group, type Guest, guestInputSchema } from "@wedding/shared";
import { CalendarDays, TriangleAlert } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { Alert } from "@/components/kit/alert";
import { Dialog } from "@/components/kit/dialog";
import { Field } from "@/components/kit/field";
import { FormSection, SwitchRow } from "@/components/kit/form-rows";
import { FormFooter } from "@/components/kit/invitation-kit";
import { Select } from "@/components/kit/select";
import { Input } from "@/components/ui/input";
import { adminApi } from "../../lib/admin-api.js";
import { useRefresh } from "../../lib/queries.js";

export type GuestEditing = { kind: "new" } | { kind: "edit"; guest: Guest } | null;

type Props = {
  editing: GuestEditing;
  groups: Group[];
  events: Event[];
  onClose: () => void;
};

export function GuestFormDialog({ editing, groups, events, onClose }: Props) {
  return (
    <Dialog
      open={editing !== null}
      onClose={onClose}
      wide
      title={editing?.kind === "edit" ? "Ubah tamu" : "Tambah tamu"}
    >
      {editing && (
        <GuestForm
          guest={editing.kind === "edit" ? editing.guest : null}
          groups={groups}
          events={events}
          onDone={onClose}
        />
      )}
    </Dialog>
  );
}

type FieldName = "displayName" | "phone" | "instagram" | "groupId";
type FieldErrors = Partial<Record<FieldName, string>>;

/** Aturan dari server ("Isi nomor HP atau Instagram") ditulis lebih jelas untuk admin. */
const EITHER_CONTACT = "Isi salah satu: nomor HP atau Instagram.";

/** Pesan galat server yang dikenali dipetakan ke kolomnya, supaya tampil tepat di bawah isian. */
function fieldOfMessage(message: string): FieldName | null {
  if (message.startsWith("Nama undangan")) return "displayName";
  if (message === "Pilih kelompok" || message === "Kelompok tidak ditemukan") return "groupId";
  if (message.startsWith("Username Instagram")) return "instagram";
  if (message.startsWith("Nomor HP") || message === "Isi nomor HP atau Instagram") return "phone";
  return null;
}

function friendly(message: string) {
  if (message === "Isi nomor HP atau Instagram") return EITHER_CONTACT;
  // Bedakan dari teks "Pilih kelompok" di dalam kolomnya sendiri.
  if (message === "Pilih kelompok") return "Kelompok wajib dipilih.";
  return message;
}

function useDebounced<T>(value: T, ms: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return debounced;
}

/** Tamu lain yang memakai HP/Instagram yang sama. Hanya peringatan; menyimpan tetap boleh. */
function useDuplicates(kind: "phone" | "instagram", raw: string, excludeId: string | undefined) {
  const value = useDebounced(raw.trim(), 400);
  const query = useQuery({
    queryKey: ["guests", "duplicates", kind, value, excludeId ?? null],
    queryFn: () => adminApi.guests.duplicates({ [kind]: value, excludeId }),
    enabled: value.length >= 3,
    staleTime: 10_000,
  });
  // Hasil lama tidak ditampilkan selagi admin masih mengetik nilai lain.
  if (value !== raw.trim() || value.length < 3) return [];
  return query.data?.guests ?? [];
}

function DuplicateWarning({ label, names }: { label: string; names: string[] }) {
  if (names.length === 0) return null;
  return (
    <p className="flex items-start gap-1.5 text-sm text-amber-700 dark:text-amber-400">
      <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>
        {label} sudah dipakai: {names.join(", ")}
      </span>
    </p>
  );
}

function GuestForm({
  guest,
  groups,
  events,
  onDone,
}: {
  guest: Guest | null;
  groups: Group[];
  events: Event[];
  onDone: () => void;
}) {
  const refresh = useRefresh();
  const nameRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState(guest?.displayName ?? "");
  const [phone, setPhone] = useState(guest?.phone ? `+${guest.phone}` : "");
  const [instagram, setInstagram] = useState(guest?.instagram ?? "");
  const [groupId, setGroupId] = useState(guest?.groupId ?? "");
  const [isRombongan, setIsRombongan] = useState(guest?.isRombongan ?? false);
  const [usherNote, setUsherNote] = useState(guest?.usherNote ?? "");
  const [errors, setErrors] = useState<FieldErrors>({});
  // Acara yang diundang selalu mengikuti kelompok; di sini hanya ditampilkan.
  const chosenGroup = groups.find((g) => g.id === groupId);
  const invitedNames = events
    .filter((e) => chosenGroup?.eventIds.includes(e.id))
    .map((e) => e.name);

  const phoneDuplicates = useDuplicates("phone", phone, guest?.id);
  const instagramDuplicates = useDuplicates("instagram", instagram, guest?.id);

  const input = () => ({
    displayName,
    phone,
    instagram,
    groupId,
    isRombongan,
    usherNote,
  });

  const save = useMutation({
    mutationFn: () => {
      const body = input();
      return guest ? adminApi.guests.update(guest.id, body) : adminApi.guests.create(body);
    },
    onSuccess: async () => {
      await refresh("guests", "groups", "events");
      onDone();
    },
    onError: (error) => {
      const field = fieldOfMessage(error.message);
      if (field) setErrors({ [field]: friendly(error.message) });
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    // Aturan yang sama dengan server, dicek dulu di sini agar pesannya tampil di kolom yang tepat.
    const parsed = guestInputSchema.safeParse(input());
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (
          (field === "displayName" ||
            field === "phone" ||
            field === "instagram" ||
            field === "groupId") &&
          !next[field]
        )
          next[field] = friendly(issue.message);
      }
      setErrors(next);
      if (next.displayName) nameRef.current?.focus();
      return;
    }
    setErrors({});
    save.mutate();
  }

  const clearError = (field: FieldName) =>
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));

  const serverError = save.error && !fieldOfMessage(save.error.message) ? save.error.message : null;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <FormSection
        title="Identitas"
        description="Nama seperti yang akan tertulis di pesan undangan. Isi salah satu: nomor HP atau Instagram."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field
              label="Nama undangan"
              required
              hint='Mis. "Bpk. Budi & Keluarga".'
              error={errors.displayName}
            >
              {(id) => (
                <Input
                  id={id}
                  ref={nameRef}
                  autoFocus
                  aria-invalid={!!errors.displayName}
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value);
                    clearError("displayName");
                  }}
                />
              )}
            </Field>
          </div>
          <div className="grid content-start gap-2">
            <Field
              label="Nomor HP / WhatsApp"
              hint="Boleh 0812-… atau +62 812-…"
              error={errors.phone}
            >
              {(id) => (
                <Input
                  id={id}
                  type="tel"
                  inputMode="tel"
                  autoComplete="off"
                  aria-invalid={!!errors.phone}
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    clearError("phone");
                  }}
                />
              )}
            </Field>
            <DuplicateWarning label="Nomor ini" names={phoneDuplicates.map((g) => g.displayName)} />
          </div>
          <div className="grid content-start gap-2">
            <Field
              label="Instagram"
              hint="Isi bila tidak ada nomor HP. Tanpa @."
              error={errors.instagram}
            >
              {(id) => (
                <Input
                  id={id}
                  autoCapitalize="none"
                  autoComplete="off"
                  aria-invalid={!!errors.instagram}
                  value={instagram}
                  onChange={(e) => {
                    setInstagram(e.target.value);
                    clearError("instagram");
                    // Aturan "salah satu" juga terpenuhi dari kolom ini.
                    if (errors.phone === EITHER_CONTACT) clearError("phone");
                  }}
                />
              )}
            </Field>
            <DuplicateWarning
              label="Instagram ini"
              names={instagramDuplicates.map((g) => g.displayName)}
            />
          </div>
        </div>
      </FormSection>

      <FormSection title="Pengelompokan">
        {groups.length === 0 ? (
          <Alert tone="error">
            Belum ada kelompok. Buat dulu di menu{" "}
            <Link to="/admin/kelompok" className="font-medium underline underline-offset-4">
              Kelompok
            </Link>
            ; setiap tamu wajib masuk satu kelompok.
          </Alert>
        ) : (
          <Field label="Kelompok" required error={errors.groupId}>
            {(id) => (
              <Select
                id={id}
                value={groupId}
                aria-invalid={!!errors.groupId}
                onChange={(e) => {
                  setGroupId(e.target.value);
                  clearError("groupId");
                }}
              >
                <option value="" disabled>
                  Pilih kelompok
                </option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        )}
        {chosenGroup && (
          <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
            <CalendarDays className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              {invitedNames.length
                ? `Diundang ke ${invitedNames.join(", ")} (mengikuti kelompok).`
                : "Kelompok ini belum diundang ke acara apa pun. Atur di menu Kelompok."}
            </span>
          </p>
        )}
        <SwitchRow
          title="Rombongan"
          description="Penjaga mengisi jumlah orang saat check-in. Selain itu otomatis 1 orang."
          checked={isRombongan}
          onCheckedChange={setIsRombongan}
        />
      </FormSection>

      <Field label="Catatan untuk penjaga" hint="Tampil di layar scanner, mis. 'Pemain inti klub'.">
        {(id) => <Input id={id} value={usherNote} onChange={(e) => setUsherNote(e.target.value)} />}
      </Field>

      {guest?.code && <p className="text-xs text-muted-foreground">Kode tamu: {guest.code}</p>}
      {serverError && <Alert tone="error">{serverError}</Alert>}
      <FormFooter onCancel={onDone} pending={save.isPending} disabled={groups.length === 0} />
    </form>
  );
}
