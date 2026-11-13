import { IconThemeDark } from "@/assets/custom/icon-theme-dark";
import { IconThemeLight } from "@/assets/custom/icon-theme-light";
import { IconThemeSystem } from "@/assets/custom/icon-theme-system";
import { useTheme } from "@/context/theme-provider";
import { cn } from "@/lib/utils";
import { ExportCard, PasswordForm } from "./forms.js";
import { ContentSection } from "./settings-layout.js";

export function AccountSettings() {
  return (
    <ContentSection title="Akun" desc="Kata sandi dan tema panel admin.">
      <div className="flex flex-col gap-10">
        <section className="grid gap-4">
          <h4 className="text-sm font-semibold">Kata sandi</h4>
          <PasswordForm />
        </section>
        <section className="grid gap-4">
          <h4 className="text-sm font-semibold">Tema</h4>
          <ThemePicker />
        </section>
      </div>
    </ContentSection>
  );
}

export function BackupSettings() {
  return (
    <ContentSection title="Cadangan" desc="Unduh salinan data dan foto.">
      <ExportCard />
    </ContentSection>
  );
}

const THEMES = [
  { value: "light", label: "Terang", Icon: IconThemeLight },
  { value: "dark", label: "Gelap", Icon: IconThemeDark },
  { value: "system", label: "Sistem", Icon: IconThemeSystem },
] as const;

/** Kartu pratinjau tema (Appearance shadcn-admin); tersimpan di peramban ini. */
function ThemePicker() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="flex flex-wrap gap-4">
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
              "w-28 items-center overflow-hidden rounded-md border-2 p-1 hover:border-accent sm:w-36",
              theme === value ? "border-primary" : "border-muted",
            )}
          >
            <Icon />
          </div>
          <span className="mt-2 block text-sm font-normal">{label}</span>
        </button>
      ))}
    </div>
  );
}
