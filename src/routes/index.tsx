import heroImage from "@/assets/hero-workspace.jpg";
import logoMark from "@/assets/logo-mark.png";
import { FEATURE_ITEMS } from "@/components/app/nav";
import { ResponsibleAINotice } from "@/components/ResponsibleAINotice";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Lock, ShieldCheck, Sparkles, Zap } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Workplace Productivity Assistant" },
      {
        name: "description",
        content:
          "Draft email, summarise meetings, plan tasks and research topics in one secure AI workspace where you review and edit every output.",
      },
      { property: "og:title", content: "AI Workplace Productivity Assistant" },
      {
        property: "og:description",
        content:
          "One secure platform for AI-assisted email, meeting notes, task planning, research and workplace chat.",
      },
    ],
  }),
  component: Landing,
});

const SECURITY_POINTS = [
  {
    icon: Lock,
    title: "Token-secured sessions",
    body: "Every request carries a signed JSON Web Token, verified server-side before any data is touched.",
  },
  {
    icon: ShieldCheck,
    title: "Row-level isolation",
    body: "Your drafts, plans and history are readable only by your own account — enforced in the database.",
  },
  {
    icon: Zap,
    title: "Grounded prompting",
    body: "Structured prompts instruct the AI to use only your input and never invent facts or sources.",
  },
];

function Landing() {
  const { session } = useAuth();
  const primaryTo = session ? "/dashboard" : "/auth";

  return (
    <div className="min-h-screen bg-background">
      <header className="surface-glass sticky top-0 z-30">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <img
              src={logoMark}
              alt=""
              width={512}
              height={512}
              className="size-9 rounded-lg bg-primary-soft p-1"
            />
            <span className="font-display text-sm font-semibold sm:text-base">Workplace AI</span>
          </div>
          <Button asChild size="sm">
            <Link to={primaryTo} search={session ? undefined : { redirect: "/dashboard" }}>
              {session ? "Open dashboard" : "Sign in"}
            </Link>
          </Button>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <img
          src={heroImage}
          alt="Abstract dashboard visualisation of AI-assisted workplace analytics"
          width={1920}
          height={1088}
          className="absolute inset-0 size-full object-cover"
        />
        <div className="bg-brand absolute inset-0 opacity-80 mix-blend-multiply" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="animate-fade-up max-w-2xl text-primary-foreground">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 bg-primary-foreground/10 px-3 py-1 text-xs font-medium">
              <Sparkles aria-hidden="true" className="size-3.5" /> Responsible AI for everyday work
            </span>
            <h1 className="mt-6 text-3xl font-semibold leading-tight sm:text-5xl">
              Automate workplace busywork — without losing control
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-primary-foreground/85">
              Five AI tools in one secure dashboard: email drafting, meeting minutes, task planning,
              research briefings and a workplace chatbot. Every output is editable before you use it.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="secondary" className="gap-2">
                <Link to={primaryTo} search={session ? undefined : { redirect: "/dashboard" }}>
                  {session ? "Go to dashboard" : "Get started"}
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
              >
                <a href="#features">See the tools</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-semibold sm:text-3xl">One platform, five assistants</h2>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Purpose-built tools with structured prompts, predictable output and editable results.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURE_ITEMS.map((item, i) => (
            <article
              key={item.to}
              style={{ animationDelay: `${i * 60}ms` }}
              className="animate-fade-up group rounded-2xl border border-border bg-card p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
            >
              <span className="bg-brand grid size-11 place-items-center rounded-xl text-primary-foreground transition-transform duration-300 group-hover:scale-110">
                <item.icon aria-hidden="true" className="size-5" />
              </span>
              <h3 className="mt-4 font-display text-base font-semibold">{item.label}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.blurb}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-secondary/60 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-2xl font-semibold sm:text-3xl">Security built in, not bolted on</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {SECURITY_POINTS.map((point, i) => (
              <div
                key={point.title}
                style={{ animationDelay: `${i * 70}ms` }}
                className="animate-fade-up rounded-2xl border border-border bg-card p-6 shadow-card"
              >
                <point.icon aria-hidden="true" className="size-5 text-primary" />
                <h3 className="mt-3 font-display text-base font-semibold">{point.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{point.body}</p>
              </div>
            ))}
          </div>
          <ResponsibleAINotice className="mt-8" />
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-6xl px-4 text-xs text-muted-foreground sm:px-6">
          AI Workplace Productivity Assistant — review AI output before acting on it.
        </div>
      </footer>
    </div>
  );
}
