import { PageHeader } from "@/components/app/PageHeader";
import { CopyButton, EmptyState, ErrorState, GeneratingState } from "@/components/app/states";
import { ResponsibleAINotice } from "@/components/ResponsibleAINotice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { logActivity } from "@/lib/activity.functions";
import { generatePlan, type PlanResult } from "@/lib/ai.functions";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  CalendarClock,
  Clock,
  Plus,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/planner")({
  head: () => ({
    meta: [
      { title: "AI Task Planner | Workplace AI" },
      {
        name: "description",
        content:
          "Enter your tasks with priority, deadline and estimated duration, and get a realistic daily or weekly schedule with prioritisation reasoning.",
      },
      { property: "og:title", content: "AI Task Planner | Workplace AI" },
      {
        property: "og:description",
        content: "Turn a messy task list into a realistic, capacity-aware schedule.",
      },
    ],
  }),
  component: PlannerPage,
});

type Priority = "High" | "Medium" | "Low";

type TaskDraft = {
  id: string;
  description: string;
  priority: Priority;
  deadline: string;
  durationHours: string;
};

function newTask(): TaskDraft {
  return {
    id: crypto.randomUUID(),
    description: "",
    priority: "Medium",
    deadline: "",
    durationHours: "1",
  };
}

const PRIORITY_STYLES: Record<string, string> = {
  High: "bg-destructive/10 text-destructive border-destructive/30",
  Medium: "bg-primary-soft text-primary border-primary/30",
  Low: "bg-secondary text-muted-foreground border-border",
};

function toPlainText(r: PlanResult): string {
  return [
    "PRIORITISATION STRATEGY",
    r.strategy,
    "",
    "URGENT",
    ...r.urgent.map((u) => `- ${u}`),
    "",
    "SCHEDULE",
    ...r.blocks.map(
      (b) => `- ${b.slot} | ${b.task} (${b.priority}, ${b.durationHours}h) — ${b.reason}`,
    ),
    "",
    "DEFERRED",
    ...r.deferred.map((d) => `- ${d}`),
    "",
    "RISKS",
    ...r.risks.map((d) => `- ${d}`),
  ].join("\n");
}

function PlannerPage() {
  const run = useServerFn(generatePlan);
  const log = useServerFn(logActivity);
  const queryClient = useQueryClient();

  const [horizon, setHorizon] = useState<"Daily" | "Weekly">("Daily");
  const [hoursPerDay, setHoursPerDay] = useState("6");
  const [workingHours, setWorkingHours] = useState("");
  const [tasks, setTasks] = useState<TaskDraft[]>([newTask()]);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<PlanResult | null>(null);

  function update(id: string, patch: Partial<TaskDraft>) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  const totalHours = tasks.reduce((sum, t) => sum + (Number(t.durationHours) || 0), 0);

  async function generate() {
    const filled = tasks.filter((t) => t.description.trim().length > 0);
    if (filled.length === 0) {
      toast.error("Add at least one task description.");
      return;
    }
    const capacity = Number(hoursPerDay);
    if (!capacity || capacity < 1 || capacity > 16) {
      toast.error("Focused hours per day must be between 1 and 16.");
      return;
    }
    setStatus("loading");
    setError("");
    try {
      const data = await run({
        data: {
          horizon,
          hoursPerDay: capacity,
          workingHours: workingHours || undefined,
          tasks: filled.map((t) => ({
            description: t.description,
            priority: t.priority,
            deadline: t.deadline || undefined,
            durationHours: Math.min(40, Math.max(0.25, Number(t.durationHours) || 1)),
          })),
        },
      });
      setResult(data);
      setStatus("done");
      await log({
        data: {
          feature: "planner",
          title: `${horizon} plan for ${filled.length} task${filled.length === 1 ? "" : "s"}`,
          preview: data.strategy.slice(0, 200),
        },
      }).catch(() => undefined);
      queryClient.invalidateQueries({ queryKey: ["activity"] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "The plan could not be generated.");
      setStatus("error");
    }
  }

  function startOver() {
    setTasks([newTask()]);
    setWorkingHours("");
    setResult(null);
    setStatus("idle");
    setError("");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Feature 3"
        title="AI Task Planner"
        description="List what you need to get done. The planner prioritises deadline-first, respects your real capacity and explains every decision."
        icon={<CalendarClock aria-hidden="true" className="size-5" />}
        actions={
          <Button variant="ghost" onClick={startOver} className="gap-2">
            <RotateCcw aria-hidden="true" className="size-4" /> Start over
          </Button>
        }
      />

      <ResponsibleAINotice compact />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <section className="animate-fade-up space-y-5 rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-base font-semibold">Your workload</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="horizon">Planning horizon</Label>
              <Select value={horizon} onValueChange={(v) => setHorizon(v as "Daily" | "Weekly")}>
                <SelectTrigger id="horizon">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Daily">Daily schedule</SelectItem>
                  <SelectItem value="Weekly">Weekly schedule</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Focused hours per day</Label>
              <Input
                id="capacity"
                type="number"
                min={1}
                max={16}
                step={0.5}
                value={hoursPerDay}
                onChange={(e) => setHoursPerDay(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="working-hours">Working hours (optional)</Label>
            <Input
              id="working-hours"
              value={workingHours}
              onChange={(e) => setWorkingHours(e.target.value)}
              placeholder="08:30–17:00, no meetings before 09:00"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold">Tasks</h3>
              <Badge variant="secondary" className="gap-1">
                <Clock aria-hidden="true" className="size-3" /> {totalHours}h estimated
              </Badge>
            </div>

            {tasks.map((task, i) => (
              <div
                key={task.id}
                className="animate-fade-in space-y-3 rounded-xl border border-border bg-secondary/40 p-3"
              >
                <div className="flex items-start gap-2">
                  <Textarea
                    aria-label={`Task ${i + 1} description`}
                    rows={2}
                    value={task.description}
                    onChange={(e) => update(task.id, { description: e.target.value })}
                    placeholder="Draft the Q3 supplier review deck"
                    className="bg-card text-sm"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove task ${i + 1}`}
                    onClick={() =>
                      setTasks((prev) =>
                        prev.length === 1 ? [newTask()] : prev.filter((t) => t.id !== task.id),
                      )
                    }
                  >
                    <Trash2 aria-hidden="true" className="size-4" />
                  </Button>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <Select
                    value={task.priority}
                    onValueChange={(v) => update(task.id, { priority: v as Priority })}
                  >
                    <SelectTrigger aria-label={`Priority for task ${i + 1}`} className="bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">High priority</SelectItem>
                      <SelectItem value="Medium">Medium priority</SelectItem>
                      <SelectItem value="Low">Low priority</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    aria-label={`Deadline for task ${i + 1}`}
                    value={task.deadline}
                    onChange={(e) => update(task.id, { deadline: e.target.value })}
                    placeholder="Deadline (e.g. Thu)"
                    className="bg-card"
                  />
                  <Input
                    aria-label={`Estimated hours for task ${i + 1}`}
                    type="number"
                    min={0.25}
                    max={40}
                    step={0.25}
                    value={task.durationHours}
                    onChange={(e) => update(task.id, { durationHours: e.target.value })}
                    className="bg-card"
                  />
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              onClick={() => setTasks((prev) => [...prev, newTask()])}
              disabled={tasks.length >= 25}
            >
              <Plus aria-hidden="true" className="size-4" /> Add task
            </Button>
          </div>

          <Button onClick={generate} disabled={status === "loading"} className="h-11 w-full gap-2">
            <Sparkles aria-hidden="true" className="size-4" />
            {status === "loading" ? "Planning…" : "Build my schedule"}
          </Button>
        </section>

        <section className="space-y-4">
          {status === "loading" ? <GeneratingState label="Prioritising your tasks" /> : null}
          {status === "error" ? <ErrorState message={error} onRetry={generate} /> : null}
          {status === "idle" ? (
            <EmptyState
              icon={<CalendarClock aria-hidden="true" className="size-6" />}
              title="Your schedule appears here"
              description="A prioritised timeline with reasoning, urgent flags, deferred overflow and delivery risks."
            />
          ) : null}

          {status === "done" && result ? (
            <div className="animate-fade-up space-y-6">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-display text-base font-semibold">Prioritisation strategy</h2>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2" onClick={generate}>
                      <RefreshCw aria-hidden="true" className="size-4" /> Regenerate
                    </Button>
                    <CopyButton value={toPlainText(result)} label="Copy plan" />
                  </div>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {result.strategy}
                </p>

                {result.urgent.length > 0 ? (
                  <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-4">
                    <p className="flex items-center gap-2 font-display text-sm font-semibold text-destructive">
                      <AlertTriangle aria-hidden="true" className="size-4" /> Urgent — handle first
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-foreground/80">
                      {result.urgent.map((u, i) => (
                        <li key={i}>• {u}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <h2 className="font-display text-base font-semibold">Timeline</h2>
                <ol className="mt-4 space-y-3 border-l border-border pl-5">
                  {result.blocks.map((b, i) => (
                    <li key={i} className="animate-fade-up relative">
                      <span
                        aria-hidden="true"
                        className="bg-brand absolute -left-[1.42rem] top-3 size-3 rounded-full ring-4 ring-card"
                      />
                      <div className="rounded-xl border border-border bg-secondary/40 p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-display text-sm font-semibold">{b.slot}</span>
                          <Badge
                            variant="outline"
                            className={PRIORITY_STYLES[b.priority] ?? PRIORITY_STYLES["Low"]}
                          >
                            {b.priority}
                          </Badge>
                          <Badge variant="secondary">{b.durationHours}h</Badge>
                        </div>
                        <p className="mt-2 text-sm font-medium text-foreground">{b.task}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{b.reason}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {(result.deferred.length > 0 || result.risks.length > 0) && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
                    <h3 className="font-display text-sm font-semibold">Deferred / overflow</h3>
                    {result.deferred.length === 0 ? (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Everything fits inside your capacity.
                      </p>
                    ) : (
                      <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                        {result.deferred.map((d, i) => (
                          <li key={i}>• {d}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
                    <h3 className="font-display text-sm font-semibold">Risks to watch</h3>
                    {result.risks.length === 0 ? (
                      <p className="mt-2 text-sm text-muted-foreground">No risks flagged.</p>
                    ) : (
                      <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                        {result.risks.map((d, i) => (
                          <li key={i}>• {d}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
