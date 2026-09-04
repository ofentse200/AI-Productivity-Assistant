import { PageHeader } from "@/components/app/PageHeader";
import { CopyButton, ErrorState } from "@/components/app/states";
import { ResponsibleAINotice } from "@/components/ResponsibleAINotice";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { logActivity } from "@/lib/activity.functions";
import { chatWithAssistant } from "@/lib/ai.functions";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Bot, Loader2, SendHorizonal, Sparkles, Trash2, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({
    meta: [
      { title: "AI Workplace Chatbot | Workplace AI" },
      {
        name: "description",
        content:
          "Ask the workplace assistant to prepare meetings, draft emails, turn notes into action plans and prioritise your day.",
      },
      { property: "og:title", content: "AI Workplace Chatbot | Workplace AI" },
      {
        property: "og:description",
        content: "A conversational assistant for everyday workplace productivity tasks.",
      },
    ],
  }),
  component: ChatPage,
});

type Message = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Help me prepare for a meeting.",
  "Turn these notes into an action plan.",
  "Help me write a professional email.",
  "Help me prioritize my tasks.",
];

function renderContent(content: string) {
  return content.split("\n").map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return <span key={i} className="block h-2" />;
    const bulleted = /^([-*•])\s+/.test(trimmed);
    const text = bulleted ? trimmed.replace(/^([-*•])\s+/, "") : trimmed;
    const parts = text.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={j} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      ) : (
        <span key={j}>{part}</span>
      ),
    );
    return bulleted ? (
      <span key={i} className="flex gap-2">
        <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
        <span>{parts}</span>
      </span>
    ) : (
      <span key={i} className="block">
        {parts}
      </span>
    );
  });
}

function ChatPage() {
  const run = useServerFn(chatWithAssistant);
  const log = useServerFn(logActivity);
  const queryClient = useQueryClient();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  async function send(raw: string) {
    const content = raw.trim();
    if (!content) return;
    if (loading) return;

    const history = [...messages, { role: "user" as const, content }].slice(-40);
    setMessages(history);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const { reply } = await run({ data: { messages: history } });
      setMessages([...history, { role: "assistant", content: reply }]);
      if (history.filter((m) => m.role === "user").length === 1) {
        await log({
          data: { feature: "chat", title: content.slice(0, 150), preview: reply.slice(0, 200) },
        }).catch(() => undefined);
        queryClient.invalidateQueries({ queryKey: ["activity"] });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "The assistant could not reply.");
    } finally {
      setLoading(false);
    }
  }

  function clearConversation() {
    setMessages([]);
    setError("");
    setInput("");
    toast.success("Conversation cleared");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Feature 5"
        title="AI Workplace Chatbot"
        description="Your day-to-day assistant for drafting, planning and preparing. History stays in this session only."
        icon={<Bot aria-hidden="true" className="size-5" />}
        actions={
          <Button
            variant="ghost"
            onClick={clearConversation}
            disabled={messages.length === 0}
            className="gap-2"
          >
            <Trash2 aria-hidden="true" className="size-4" /> Clear conversation
          </Button>
        }
      />

      <ResponsibleAINotice compact />

      <div className="animate-fade-up flex min-h-[26rem] flex-col rounded-2xl border border-border bg-card shadow-card">
        <div
          role="log"
          aria-live="polite"
          className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6"
          style={{ maxHeight: "58vh" }}
        >
          {messages.length === 0 && !loading ? (
            <div className="animate-fade-in py-8 text-center">
              <span className="bg-brand mx-auto grid size-12 place-items-center rounded-2xl text-primary-foreground shadow-lift">
                <Sparkles aria-hidden="true" className="size-5" />
              </span>
              <h2 className="mt-4 font-display text-base font-semibold">
                What are you working on?
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                Pick a starting point or type your own request.
              </p>
              <div className="mx-auto mt-5 grid max-w-xl gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-xl border border-border bg-secondary/50 px-4 py-3 text-left text-sm text-foreground transition hover:border-primary/40 hover:bg-primary-soft"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {messages.map((m, i) => (
            <div
              key={i}
              className={`animate-fade-up flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}
            >
              {m.role === "assistant" ? (
                <span className="bg-brand grid size-8 shrink-0 place-items-center rounded-lg text-primary-foreground">
                  <Bot aria-hidden="true" className="size-4" />
                </span>
              ) : null}
              <div
                className={`max-w-[85%] space-y-1 rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-secondary/50 text-foreground"
                }`}
              >
                {renderContent(m.content)}
                {m.role === "assistant" ? (
                  <div className="pt-1">
                    <CopyButton value={m.content} label="Copy" variant="ghost" />
                  </div>
                ) : null}
              </div>
              {m.role === "user" ? (
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-secondary text-muted-foreground">
                  <User aria-hidden="true" className="size-4" />
                </span>
              ) : null}
            </div>
          ))}

          {loading ? (
            <div className="animate-fade-in flex gap-3">
              <span className="bg-brand grid size-8 shrink-0 place-items-center rounded-lg text-primary-foreground">
                <Bot aria-hidden="true" className="size-4" />
              </span>
              <div className="flex items-center gap-2 rounded-2xl border border-border bg-secondary/50 px-4 py-3 text-sm text-muted-foreground">
                <Loader2 aria-hidden="true" className="size-4 animate-spin text-primary" />
                Thinking…
              </div>
            </div>
          ) : null}

          <div ref={endRef} />
        </div>

        {error ? (
          <div className="px-4 pb-2 sm:px-6">
            <ErrorState message={error} />
          </div>
        ) : null}

        <form
          className="flex items-end gap-2 border-t border-border p-4 sm:p-5"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <Textarea
            aria-label="Message the workplace assistant"
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="Ask anything about your working day…"
            className="min-h-0 resize-none"
          />
          <Button
            type="submit"
            disabled={loading || input.trim().length === 0}
            className="h-11 gap-2"
          >
            <SendHorizonal aria-hidden="true" className="size-4" />
            <span className="hidden sm:inline">Send</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
