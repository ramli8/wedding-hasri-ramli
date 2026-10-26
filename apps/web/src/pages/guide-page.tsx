import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, Lightbulb } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { type GuideStep, useGuideSteps } from "../lib/guide.js";

const PHASES = ["Persiapan", "Undangan", "Hari-H", "Setelah acara"] as const;

const GLOSSARY = [
  [
    "Kode tamu",
    "6 huruf unik per tamu. QR di tiket hanyalah kode ini; penjaga juga bisa mengetiknya.",
  ],
  [
    "Rombongan",
    "Satu undangan untuk beberapa orang. Penjaga mengisi jumlahnya saat check-in; tamu lain otomatis 1 orang.",
  ],
  ["Sesi", "Jam kedatangan per kelompok. Hanya penanda di riwayat; penjaga tidak diperingatkan."],
  [
    "Perangkat",
    "HP atau laptop penjaga. Dipasangkan dengan kode sekali pakai, tanpa akun, dan bisa dicabut.",
  ],
  [
    "Tempat sampah",
    "Tamu yang dihapus bisa dipulihkan kapan saja dari filter “Lainnya” di daftar tamu.",
  ],
] as const;

function StepItem({ step, index }: { step: GuideStep; index: number }) {
  return (
    <li className="flex gap-4">
      <div className="flex flex-col items-center">
        <span
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-full border text-sm font-medium",
            step.done && "border-primary bg-primary text-primary-foreground",
          )}
        >
          {step.done ? <Check className="size-4" aria-label="Selesai" /> : index}
        </span>
        <span className="mt-2 w-px flex-1 bg-border" aria-hidden />
      </div>
      <div className="grid flex-1 gap-3 pb-8">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{step.title}</h3>
            {step.optional && <Badge variant="outline">Opsional</Badge>}
            {step.done && <Badge variant="secondary">Selesai</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">{step.why}</p>
        </div>
        <ul className="grid list-disc gap-1 ps-5 text-sm marker:text-muted-foreground">
          {step.todo.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <div>
          <Link
            to={step.to as "/admin"}
            className={buttonVariants({ variant: step.done ? "outline" : "default", size: "sm" })}
          >
            {step.cta}
            <ArrowRight aria-hidden />
          </Link>
        </div>
      </div>
    </li>
  );
}

/** Panduan pemakaian: urutan kerja dari nol sampai hari-H, dengan status dari data yang sudah terisi. */
export function GuidePage() {
  const { steps, doneCount, total, next, ready } = useGuideSteps();
  const percent = total === 0 ? 0 : Math.round((doneCount / total) * 100);
  let counter = 0;

  return (
    <>
      <PageHeader
        title="Panduan"
        description="Urutan kerja dari nol sampai hari-H. Centang terisi otomatis dari data Anda."
      />

      <Card className="gap-4">
        <CardHeader>
          <CardTitle>
            {ready ? `${doneCount} dari ${total} langkah selesai` : "Memuat progres…"}
          </CardTitle>
          <CardDescription>
            {next
              ? `Berikutnya: ${next.title}.`
              : ready
                ? "Semua langkah wajib sudah selesai."
                : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-2 overflow-hidden rounded-full bg-muted"
          >
            <div className="h-full bg-primary transition-all" style={{ width: `${percent}%` }} />
          </div>
          {next && (
            <div>
              <Link to={next.to as "/admin"} className={buttonVariants()}>
                {next.cta}
                <ArrowRight aria-hidden />
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {PHASES.map((phase) => {
        const items = steps.filter((step) => step.phase === phase);
        return (
          <section key={phase} className="grid gap-4">
            <h2 className="text-lg font-semibold">{phase}</h2>
            <ol>
              {items.map((step) => {
                counter += 1;
                return <StepItem key={step.id} step={step} index={counter} />;
              })}
            </ol>
          </section>
        );
      })}

      <Card className="gap-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="size-4" aria-hidden />
            Istilah dan tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            {GLOSSARY.map(([term, text]) => (
              <div key={term}>
                <dt className="text-sm font-medium">{term}</dt>
                <dd className="text-sm text-muted-foreground">{text}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </>
  );
}
