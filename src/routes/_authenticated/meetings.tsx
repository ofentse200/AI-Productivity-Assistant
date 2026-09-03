import { PageHeader } from "@/components/app/PageHeader";
import { CopyButton, EmptyState, ErrorState, GeneratingState } from "@/components/app/states";
import { ResponsibleAINotice } from "@/components/ResponsibleAINotice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { logActivity } from "@/lib/activity.functions";
import { summarizeMeeting, type MeetingResult } from "@/lib/ai.functions";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { NotebookPen, RefreshCw, RotateCcw, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/meetings")({
  head: () => ({
    meta: [
      { title: "Meeting Notes Summarizer | Workplace AI" },
      {
        name: "description",
        content:
          "Paste raw meeting notes and get an executive summary, key points, decisions, action items, owners and deadlines you can edit and copy.",
      },
      { property: "og:title", content: "Meeting Notes Summarizer | Workplace AI" },
      {
        property: "og:description",
        content: "Turn messy meeting notes into structured, editable minutes in seconds.",
      },
    ],
  }),
  component: MeetingsPage,
});

function toPlainText(title: string, r: MeetingResult): string {
  return [
    title ? `MEETING: ${title}` : "",
    "EXECUTIVE SUMMARY",
    r.executiveSummary,
    "",
    "KEY DISCUSSION POINTS",
    ...r.keyPoints.map((p) => `- ${p}`),
    "",
    "DECISIONS MADE",
    ...r.decisions.map((p) => `- ${p}`),
    "",
    "ACTION ITEMS",
    ...r.actionItems.map((a) => `- ${a.action} (owner: ${a.owner}, deadline: ${a.deadline})`),
    "",
    "OPEN QUESTIONS",
    ...r.openQuestions.map((p) => `- ${p}`),
  ]
    .filter(Boolean)
    .join("\n");
}

function ListBlock({
  heading,
  items,
  onChange,
  emptyLabel,
}: {
  heading: string;
  items: string[];
  onChange: (items: string[]) => void;
  emptyLabel: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold">{heading}</h3>
        <Badge variant="secondary">{items.length}</Badge>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={i} className="flex gap-2">
              <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary" />
              <Textarea
                aria-label={`${heading} item ${i + 1}`}
                rows={2}
                value={item}
                onChange={(e) => {
                  const next = [...items];
                  next[i] = e.target.value;
                  onChange(next);
                }}
                className="min-h-0 resize-y text-sm"
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MeetingsPage() {
  const run = useServerFn(summarizeMeeting);
  const log = useServerFn(logActivity);
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<MeetingResult | null>(null);

  async function generate() {
    if (notes.trim().length < 20) {
      toast.error("Paste at least a few lines of meeting notes.");
      return;
    }
    setStatus("loading");
    setError("");
    try {
      const data = await run({ data: { notes, meetingTitle: title || undefined } });
      setResult(data);
      setStatus("done");
      await log({
        data: {
          feature: "meeting",
          title: title || "Meeting summary",
          preview: data.executiveSummary.slice(0, 200),
        },
      }).catch(() => undefined);
      queryClient.invalidateQueries({ queryKey: ["activity"] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "The summary could not be generated.");
      setStatus("error");
    }
  }

  function startOver() {
    setTitle("");
    setNotes("");
    setResult(null);
    setStatus("idle");
    setError("");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Feature 2"
        title="Meeting Notes Summarizer"
        description="Paste raw notes or a transcript. The assistant extracts a summary, decisions, action items, owners and deadlines — only what is actually in your notes."
        icon={<NotebookPen aria-hidden="true" className="size-5" />}
        actions={
          <Button variant="ghost" onClick={startOver} className="gap-2">
            <RotateCcw aria-hidden="true" className="size-4" /> Start over
          </Button>
        }
      />

      <ResponsibleAINotice compact />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <section className="animate-fade-up space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-base font-semibold">Raw notes</h2>
          <div className="space-y-2">
            <Label htmlFor="meeting-title">Meeting title (optional)</Label>
            <Input
              id="meeting-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Weekly operations review — 12 March"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="meeting-notes">Notes or transcript</Label>
            <Textarea
              id="meeting-notes"
              rows={16}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Paste bullet notes, chat logs or a transcript…"
            />
            <p className="text-xs text-muted-foreground">
              {notes.trim().length} characters. Owners and deadlines are marked "Not specified" when
              the notes don't say.
            </p>
          </div>
          <Button onClick={generate} disabled={status === "loading"} className="h-11 w-full gap-2">
            <Sparkles aria-hidden="true" className="size-4" />
            {status === "loading" ? "Summarising…" : "Summarise notes"}
          </Button>
        </section>

        <section className="space-y-4">
          {status === "loading" ? <GeneratingState label="Structuring your minutes" /> : null}
          {status === "error" ? <ErrorState message={error} onRetry={generate} /> : null}
          {status === "idle" ? (
            <EmptyState
              icon={<NotebookPen aria-hidden="true" className="size-6" />}
              title="Structured minutes appear here"
              description="Executive summary, key points, decisions, action items with owners and deadlines — all editable."
            />
          ) : null}

          {status === "done" && result ? (
            <div className="animate-fade-up space-y-6 rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-base font-semibold">Editable minutes</h2>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="gap-2" onClick={generate}>
                    <RefreshCw aria-hidden="true" className="size-4" /> Regenerate
                  </Button>
                  <CopyButton value={toPlainText(title, result)} label="Copy all" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-display text-sm font-semibold">Executive summary</h3>
                <Textarea
                  aria-label="Executive summary"
                  rows={4}
                  value={result.executiveSummary}
                  onChange={(e) => setResult({ ...result, executiveSummary: e.target.value })}
                />
              </div>

              <ListBlock
                heading="Key discussion points"
                items={result.keyPoints}
                onChange={(keyPoints) => setResult({ ...result, keyPoints })}
                emptyLabel="No distinct discussion points were found in these notes."
              />

              <ListBlock
                heading="Decisions made"
                items={result.decisions}
                onChange={(decisions) => setResult({ ...result, decisions })}
                emptyLabel="No decisions were recorded in these notes."
              />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-sm font-semibold">
                    Action items, owners &amp; deadlines
                  </h3>
                  <Badge variant="secondary">{result.actionItems.length}</Badge>
                </div>
                {result.actionItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No action items were identified.</p>
                ) : (
                  <ul className="space-y-3">
                    {result.actionItems.map((item, i) => (
                      <li key={i} className="rounded-xl border border-border bg-secondary/50 p-3">
                        <Textarea
                          aria-label={`Action ${i + 1}`}
                          rows={2}
                          value={item.action}
                          onChange={(e) => {
                            const next = [...result.actionItems];
                            next[i] = { ...item, action: e.target.value };
                            setResult({ ...result, actionItems: next });
                          }}
                          className="bg-card text-sm"
                        />
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          <Input
                            aria-label={`Owner for action ${i + 1}`}
                            value={item.owner}
                            onChange={(e) => {
                              const next = [...result.actionItems];
                              next[i] = { ...item, owner: e.target.value };
                              setResult({ ...result, actionItems: next });
                            }}
                            className="bg-card"
                          />
                          <Input
                            aria-label={`Deadline for action ${i + 1}`}
                            value={item.deadline}
                            onChange={(e) => {
                              const next = [...result.actionItems];
                              next[i] = { ...item, deadline: e.target.value };
                              setResult({ ...result, actionItems: next });
                            }}
                            className="bg-card"
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <ListBlock
                heading="Open questions"
                items={result.openQuestions}
                onChange={(openQuestions) => setResult({ ...result, openQuestions })}
                emptyLabel="No open questions were left unresolved."
              />

              <div className="flex flex-wrap gap-2">
                <CopyButton
                  value={result.actionItems
                    .map((a) => `- ${a.action} (${a.owner}, ${a.deadline})`)
                    .join("\n")}
                  label="Copy action items"
                  variant="secondary"
                />
                <Button variant="ghost" size="sm" onClick={startOver}>
                  Clear
                </Button>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
