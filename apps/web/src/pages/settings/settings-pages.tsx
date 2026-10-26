import { useQuery } from "@tanstack/react-query";
import { IconThemeDark } from "@/assets/custom/icon-theme-dark";
import { IconThemeLight } from "@/assets/custom/icon-theme-light";
import { IconThemeSystem } from "@/assets/custom/icon-theme-system";
import { Alert } from "@/components/kit/alert";
import { useTheme } from "@/context/theme-provider";
import { cn } from "@/lib/utils";
import { settingsQuery } from "../../lib/queries.js";
import { ExportCard, PasswordForm, WeddingForm } from "./forms.js";
import { ContentSection } from "./settings-layout.js";

export function WeddingSettings() {
  const settings = useQuery(settingsQuery);
  return (
    <ContentSection title="Pernikahan" desc="Nama mempelai dan alamat situs untuk link undangan.">
      {settings.isPending ? (
        <p className="text-muted-foreground">Memuat…</p>
      ) : settings.isError ? (
        <Alert tone="error">{settings.error.message}</Alert>
      ) : (
        <WeddingForm initial={settings.data} />
      )}
    </ContentSection>
  );
}

export function PasswordSettings() {
  return (
    <ContentSection title="Kata sandi" desc="Ganti kata sandi akun admin Anda.">
      <PasswordForm />
    </ContentSection>
  );
}

export function BackupSettings() {
  return (
    <ContentSection title="Cadangan & ekspor" desc="Unduh salinan data untuk arsip pribadi.">
      <ExportCard />
    </ContentSection>
  );
}

const THEMES = [
  { value: "light", label: "Terang", Icon: IconThemeLight },
  { value: "dark", label: "Gelap", Icon: IconThemeDark },
  { value: "system", label: "Sistem", Icon: IconThemeSystem },
] as const;

/** Halaman Appearance shadcn-admin: kartu pratinjau tema. */
export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  return (
    <ContentSection
      title="Tampilan"
      desc="Atur tampilan panel. Bisa otomatis mengikuti siang dan malam."
    >
      <div className="space-y-2">
        <p className="text-sm leading-none font-medium">Tema</p>
        <p className="text-sm text-muted-foreground">Pilih tema untuk panel admin.</p>
        <div className="flex flex-wrap gap-6 pt-2">
          {THEMES.map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              aria-pressed={theme === value}
              className="text-center"
            >
              <div
                className={cn(
                  "w-36 items-center overflow-hidden rounded-md border-2 p-1 hover:border-accent",
                  theme === value ? "border-primary" : "border-muted",
                )}
              >
                <Icon />
              </div>
              <span className="mt-2 block text-sm font-normal">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </ContentSection>
  );
}
