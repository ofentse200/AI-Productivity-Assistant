import { PageHeader } from "@/components/app/PageHeader";
import { CopyButton, EmptyState, ErrorState, GeneratingState } from "@/components/app/states";
import { ResponsibleAINotice } from "@/components/ResponsibleAINotice";
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
import { generateEmail, type EmailResult } from "@/lib/ai.functions";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Mail, RefreshCw, RotateCcw, Send, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/email")({
  head: () => ({
    meta: [
      { title: "Smart Email Generator | Workplace AI" },
      {
        name: "description",
        content:
          "Generate a professional email subject and body from your recipient context, purpose and key points, with tone and length control.",
      },
      { property: "og:title", content: "Smart Email Generator | Workplace AI" },
      {
        property: "og:description",
        content: "Draft editable, professional email from your own key points — never invented facts.",
      },
    ],
  }),
  component: EmailPage,
});

const TONES = ["Formal", "Friendly", "Persuasive"] as const;
const LENGTHS = ["Short", "Medium", "Detailed"] as const;

function EmailPage() {
  const run = useServerFn(generateEmail);
  const log = useServerFn(logActivity);
  const queryClient = useQueryClient();

  const [recipient, setRecipient] = useState("");
  const [purpose, setPurpose] = useState("");
  const [keyPoints, setKeyPoints] = useState("");
  const [tone, setTone] = useState<(typeof TONES)[number]>("Formal");
  const [length, setLength] = useState<(typeof LENGTHS)[number]>("Medium");

  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<EmailResult | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  async function generate() {
    if (!recipient.trim() || !purpose.trim() || !keyPoints.trim()) {
      toast.error("Add the recipient, purpose and key points first.");
      return;
    }
    setStatus("loading");
    setError("");
    try {
      const data = await run({ data: { recipient, purpose, keyPoints, tone, length } });
      setResult(data);
      setSubject(data.subject);
      setBody(data.body);
      setStatus("done");
      await log({
        data: {
          feature: "email",
          title: data.subject || "Email draft",
          preview: data.body.slice(0, 200),
        },
      }).catch(() => undefined);
      queryClient.invalidateQueries({ queryKey: ["activity"] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "The email could not be generated.");
      setStatus("error");
    }
  }

  function startOver() {
    setRecipient("");
    setPurpose("");
    setKeyPoints("");
    setTone("Formal");
    setLength("Medium");
    setResult(null);
    setSubject("");
    setBody("");
    setStatus("idle");
    setError("");
  }

  const fullEmail = `Subject: ${subject}\n\n${body}`;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Feature 1"
        title="Smart Email Generator"
        description="Give the assistant your recipient context, purpose and key points. It drafts a subject line and body in your chosen tone — using only what you provided."
        icon={<Mail aria-hidden="true" className="size-5" />}
        actions={
          <Button variant="ghost" onClick={startOver} className="gap-2">
            <RotateCcw aria-hidden="true" className="size-4" /> Start over
          </Button>
        }
      />

      <ResponsibleAINotice compact />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <section className="animate-fade-up space-y-5 rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-base font-semibold">Your input</h2>

          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient / context</Label>
            <Input
              id="recipient"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Head of Finance, external supplier, first contact"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose of the email</Label>
            <Input
              id="purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Request approval for the Q3 training budget"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="points">Key points (one per line)</Label>
            <Textarea
              id="points"
              rows={7}
              value={keyPoints}
              onChange={(e) => setKeyPoints(e.target.value)}
              placeholder={"Budget requested: R120 000\nCovers 14 staff\nDecision needed by 30 June"}
            />
            <p className="text-xs text-muted-foreground">
              Only these facts will be used. Anything missing becomes a bracketed placeholder.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tone">Tone</Label>
              <Select value={tone} onValueChange={(v) => setTone(v as (typeof TONES)[number])}>
                <SelectTrigger id="tone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TONES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="length">Desired length</Label>
              <Select value={length} onValueChange={(v) => setLength(v as (typeof LENGTHS)[number])}>
                <SelectTrigger id="length">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LENGTHS.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={generate}
            disabled={status === "loading"}
            className="h-11 w-full gap-2"
          >
            <Sparkles aria-hidden="true" className="size-4" />
            {status === "loading" ? "Generating…" : "Generate email"}
          </Button>
        </section>

        <section className="space-y-4">
          {status === "loading" ? <GeneratingState label="Drafting your email" /> : null}
          {status === "error" ? <ErrorState message={error} onRetry={generate} /> : null}
          {status === "idle" ? (
            <EmptyState
              icon={<Send aria-hidden="true" className="size-6" />}
              title="Your draft appears here"
              description="Fill in the form and generate. You can then edit every word, copy it, or regenerate with the same input."
            />
          ) : null}

          {status === "done" && result ? (
            <div className="animate-fade-up space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-base font-semibold">Editable draft</h2>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="gap-2" onClick={generate}>
                    <RefreshCw aria-hidden="true" className="size-4" /> Regenerate
                  </Button>
                  <CopyButton value={fullEmail} label="Copy all" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="out-subject">Subject</Label>
                <Input id="out-subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="out-body">Email body</Label>
                <Textarea
                  id="out-body"
                  rows={16}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="leading-relaxed"
                />
              </div>

              {result.notes.length > 0 ? (
                <div className="rounded-xl bg-accent p-4">
                  <p className="font-display text-sm font-semibold text-accent-foreground">
                    Check before sending
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-accent-foreground/90">
                    {result.notes.map((n, i) => (
                      <li key={i} className="flex gap-2">
                        <span aria-hidden="true">•</span> {n}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <CopyButton value={body} label="Copy body only" variant="secondary" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSubject(result.subject);
                    setBody(result.body);
                    toast.success("Reverted to the generated draft");
                  }}
                >
                  Undo my edits
                </Button>
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
