import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import type { MyTasksResponse } from "@wedding/shared";
import { CheckCircle2, Circle, ClipboardList, Loader2 } from "lucide-react";
import { Alert } from "@/components/kit/alert";
import { ThemeProvider } from "@/context/theme-provider";
import { useDocumentTitle } from "@/lib/document-title";
import { cn } from "@/lib/utils";
import { publicApi } from "../lib/public-api.js";

const WIB_OFFSET_MS = 7 * 3600_000;
const todayWib = () => new Date(Date.now() + WIB_OFFSET_MS).toISOString().slice(0, 10);
const dateFmt = new Intl.DateTimeFormat("id-ID", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

type Task = MyTasksResponse["tasks"][number];

/**
 * Halaman tugas satu anggota panitia, dibuka dari tautan WhatsApp tanpa login. Ketuk tugas untuk
 * menandai selesai (atau membatalkannya).
 */
export function MyTasksPage() {
  useDocumentTitle("Tugas panitia");
  const { token } = useParams({ from: "/tugas/$token" });
  const queryClient = useQueryClient();
  const key = ["my-tasks", token];
  const query = useQuery({
    queryKey: key,
    queryFn: () => publicApi.myTasks(token),
    retry: false,
    refetchOnWindowFocus: true,
  });

  const toggle = useMutation({
    mutationFn: (task: Task) => publicApi.setMyTaskDone(token, task.id, !task.doneAt),
    onSuccess: ({ task }) => {
      queryClient.setQueryData<MyTasksResponse>(key, (old) =>
        old
          ? { ...old, tasks: old.tasks.map((t) => (t.id === task.id ? { ...t, ...task } : t)) }
          : old,
      );
    },
  });

  const data = query.data;
  const open = data?.tasks.filter((t) => !t.doneAt) ?? [];
  const done = data?.tasks.filter((t) => t.doneAt) ?? [];
  const today = todayWib();

  return (
    <ThemeProvider>
      <main className="min-h-svh bg-muted/40 px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-10">
        <div className="mx-auto flex max-w-lg flex-col gap-4">
          {query.isPending && (
            <p className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden /> Memuat…
            </p>
          )}
          {query.isError && <Alert tone="error">{query.error.message}</Alert>}
          {data && (
            <>
              <header className="flex items-start gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-background">
                  <ClipboardList className="size-5" aria-hidden />
                </span>
                <div>
                  <h1 className="text-xl font-bold tracking-tight">Tugas {data.name}</h1>
                  <p className="text-sm text-muted-foreground">
                    {data.couple ? `Pernikahan ${data.couple} · ` : ""}
                    {done.length} dari {data.tasks.length} selesai
                  </p>
                </div>
              </header>

              {data.tasks.length === 0 && (
                <p className="rounded-xl bg-background p-4 text-sm text-muted-foreground">
                  Belum ada tugas untuk Anda.
                </p>
              )}

              {open.length > 0 && (
                <TaskList tasks={open} today={today} onToggle={toggle.mutate} busy={toggle} />
              )}
              {done.length > 0 && (
                <section className="flex flex-col gap-2">
                  <h2 className="text-sm font-semibold text-muted-foreground">Sudah selesai</h2>
                  <TaskList tasks={done} today={today} onToggle={toggle.mutate} busy={toggle} />
                </section>
              )}
              {toggle.error && <Alert tone="error">{toggle.error.message}</Alert>}
            </>
          )}
        </div>
      </main>
    </ThemeProvider>
  );
}

function TaskList({
  tasks,
  today,
  onToggle,
  busy,
}: {
  tasks: Task[];
  today: string;
  onToggle: (task: Task) => void;
  busy: { isPending: boolean; variables?: Task };
}) {
  return (
    <ul className="flex flex-col overflow-hidden rounded-xl border bg-background">
      {tasks.map((task) => {
        const late = !task.doneAt && !!task.dueOn && task.dueOn < today;
        const pending = busy.isPending && busy.variables?.id === task.id;
        return (
          <li key={task.id} className="border-b last:border-b-0">
            <button
              type="button"
              onClick={() => onToggle(task)}
              disabled={pending}
              aria-pressed={!!task.doneAt}
              className="flex min-h-16 w-full items-start gap-3 px-4 py-3 text-start hover:bg-muted/60"
            >
              {pending ? (
                <Loader2 className="mt-0.5 size-6 shrink-0 animate-spin" aria-hidden />
              ) : task.doneAt ? (
                <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-success" aria-hidden />
              ) : (
                <Circle className="mt-0.5 size-6 shrink-0 text-muted-foreground" aria-hidden />
              )}
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span
                  className={cn(
                    "text-base",
                    task.doneAt ? "text-muted-foreground line-through" : "font-medium",
                  )}
                >
                  {task.title}
                </span>
                {task.note && <span className="text-sm text-muted-foreground">{task.note}</span>}
                {task.dueOn && (
                  <span
                    className={cn(
                      "text-xs",
                      late ? "font-semibold text-destructive" : "text-muted-foreground",
                    )}
                  >
                    {late ? "Terlambat · " : "Tenggat "}
                    {dateFmt.format(new Date(`${task.dueOn}T00:00:00Z`))}
                  </span>
                )}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
