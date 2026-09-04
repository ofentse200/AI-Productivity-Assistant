import { PageHeader } from "@/components/app/PageHeader";
import { CopyButton, EmptyState, ErrorState, GeneratingState } from "@/components/app/states";
import { ResponsibleAINotice } from "@/components/ResponsibleAINotice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { runResearch, type ResearchResult } from "@/lib/ai.functions";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  BadgeCheck,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/research")({
  head: () => ({
    meta: [
      { title: "AI Research Assistant | Workplace AI" },
      {
        name: "description",
        content:
          "Get a structured briefing with key insights, considerations, recommendations and follow-up questions — with clear guidance on what to verify.",
      },
      { property: "og:title", content: "AI Research Assistant | Workplace AI" },
      {
        property: "og:description",
        content: "Structured briefings that separate general knowledge from verified fact.",
      },
    ],
  }),
  component: ResearchPage,
});

function toPlainText(topic: string, r: ResearchResult): string {
  return [
    `TOPIC: ${topic}`,
    `CONFIDENCE: ${r.confidence}`,
    "",
    "SUMMARY",
    r.summary,
    "",
    "KEY INSIGHTS",
    ...r.insights.map((x) => `- ${x}`),
    "",
    "IMPORTANT CONSIDERATIONS",
    ...r.considerations.map((x) => `- ${x}`),
    "",
    "RECOMMENDATIONS",
    ...r.recommendations.map((x) => `- ${x}`),
    "",
    "FOLLOW-UP QUESTIONS",
    ...r.followUpQuestions.map((x) => `- ${x}`),
    "",
    "VERIFY INDEPENDENTLY",
    ...r.verifyBecause.map((x) => `- ${x}`),
  ].join("\n");
}

function Section({
  heading,
  items,
  emptyLabel,
}: {
  heading: string;
  items: string[];
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
            <li key={i} className="flex gap-2 text-sm leading-relaxed text-foreground/85">
              <span
                aria-hidden="true"
                className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ResearchPage() {
  const run = useServerFn(runResearch);
  const log = useServerFn(logActivity);
  const queryClient = useQueryClient();

  const [topic, setTopic] = useState("");
  const [context, setContext] = useState("");
  const [depth, setDepth] = useState<"Overview" | "Balanced" | "In-depth">("Balanced");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<ResearchResult | null>(null);

  async function generate() {
    if (topic.trim().length < 3) {
      toast.error("Describe the topic or question you want researched.");
      return;
    }
    setStatus("loading");
    setError("");
    try {
      const data = await run({ data: { topic, context: context || undefined, depth } });
      setResult(data);
      setStatus("done");
      await log({
        data: {
          feature: "research",
          title: topic.slice(0, 150),
          preview: data.summary.slice(0, 200),
        },
      }).catch(() => undefined);
      queryClient.invalidateQueries({ queryKey: ["activity"] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "The briefing could not be generated.");
      setStatus("error");
    }
  }

  function startOver() {
    setTopic("");
    setContext("");
    setResult(null);
    setStatus("idle");
    setError("");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Feature 4"
        title="AI Research Assistant"
        description="Structured briefings from the model's general knowledge. No live sources, no invented citations — and a clear list of what you must verify yourself."
        icon={<Search aria-hidden="true" className="size-5" />}
        actions={
          <Button variant="ghost" onClick={startOver} className="gap-2">
            <RotateCcw aria-hidden="true" className="size-4" /> Start over
          </Button>
        }
      />

      <div
        role="note"
        className="animate-fade-in flex gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4"
      >
        <ShieldAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-amber-600" />
        <p className="text-sm leading-relaxed text-foreground/85">
          <strong className="font-semibold">Verify before you rely on this.</strong> This assistant
          has no access to live sources or databases and will not produce citations. Confirm every
          important finding, figure or claim against authoritative sources before making decisions.
        </p>
      </div>

      <ResponsibleAINotice compact />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <section className="animate-fade-up space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-base font-semibold">Research brief</h2>
          <div className="space-y-2">
            <Label htmlFor="topic">Topic or question</Label>
            <Textarea
              id="topic"
              rows={4}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What should we consider before moving our support team to a four-day week?"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="context">Business context (optional)</Label>
            <Textarea
              id="context"
              rows={5}
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Team of 12, B2B SaaS, EU customers, SLA of 4 hours…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="depth">Depth</Label>
            <Select value={depth} onValueChange={(v) => setDepth(v as typeof depth)}>
              <SelectTrigger id="depth">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Overview">Overview — quick orientation</SelectItem>
                <SelectItem value="Balanced">Balanced — standard briefing</SelectItem>
                <SelectItem value="In-depth">In-depth — thorough analysis</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={generate} disabled={status === "loading"} className="h-11 w-full gap-2">
            <Sparkles aria-hidden="true" className="size-4" />
            {status === "loading" ? "Researching…" : "Generate briefing"}
          </Button>
        </section>

        <section className="space-y-4">
          {status === "loading" ? <GeneratingState label="Building your briefing" /> : null}
          {status === "error" ? <ErrorState message={error} onRetry={generate} /> : null}
          {status === "idle" ? (
            <EmptyState
              icon={<Search aria-hidden="true" className="size-6" />}
              title="Your briefing appears here"
              description="Summary, key insights, considerations, recommendations, follow-up questions and a verification checklist."
            />
          ) : null}

          {status === "done" && result ? (
            <div className="animate-fade-up space-y-6 rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-base font-semibold">Briefing</h2>
                  <Badge variant="outline" className="gap-1 border-primary/30 text-primary">
                    <BadgeCheck aria-hidden="true" className="size-3" /> {result.confidence}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-2" onClick={generate}>
                    <RefreshCw aria-hidden="true" className="size-4" /> Regenerate
                  </Button>
                  <CopyButton value={toPlainText(topic, result)} label="Copy all" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-display text-sm font-semibold">Topic summary</h3>
                <Textarea
                  aria-label="Topic summary"
                  rows={5}
                  value={result.summary}
                  onChange={(e) => setResult({ ...result, summary: e.target.value })}
                />
              </div>

              <Section
                heading="Key insights"
                items={result.insights}
                emptyLabel="No distinct insights were produced."
              />
              <Section
                heading="Important considerations"
                items={result.considerations}
                emptyLabel="No considerations were flagged."
              />
              <Section
                heading="Recommendations"
                items={result.recommendations}
                emptyLabel="No recommendations were produced."
              />
              <Section
                heading="Follow-up questions"
                items={result.followUpQuestions}
                emptyLabel="No follow-up questions were suggested."
              />

              <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
                <h3 className="font-display text-sm font-semibold">Verify independently</h3>
                {result.verifyBecause.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Still confirm anything you intend to act on.
                  </p>
                ) : (
                  <ul className="mt-2 space-y-1 text-sm text-foreground/85">
                    {result.verifyBecause.map((v, i) => (
                      <li key={i}>• {v}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <CopyButton
                  value={result.recommendations.map((r) => `- ${r}`).join("\n")}
                  label="Copy recommendations"
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
