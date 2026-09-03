import { FEATURE_ITEMS } from "@/components/app/nav";
import { EmptyState } from "@/components/app/states";
import { ResponsibleAINotice } from "@/components/ResponsibleAINotice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { listActivity } from "@/lib/activity.functions";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Clock, History, Sparkles, TrendingUp, Zap } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard | AI Workplace Productivity Assistant" },
      {
        name: "description",
        content:
          "Your AI productivity overview: quick actions, recent activity and time saved across email, meetings, planning and research.",
      },
      { property: "og:title", content: "Dashboard | AI Workplace Productivity Assistant" },
      {
        property: "og:description",
        content: "Quick actions, recent AI activity and productivity statistics in one place.",
      },
    ],
  }),
  component: Dashboard,
});

const FEATURE_LABELS: Record<string, string> = {
  email: "Email draft",
  meeting: "Meeting summary",
  planner: "Task plan",
  research: "Research brief",
  chat: "Assistant chat",
};

const MINUTES_SAVED: Record<string, number> = {
  email: 12,
  meeting: 25,
  planner: 18,
  research: 20,
  chat: 6,
};

function Dashboard() {
  const { user } = useAuth();
  const fetchActivity = useServerFn(listActivity);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["activity"],
    queryFn: () => fetchActivity(),
  });

  const activity = data ?? [];
  const minutesSaved = activity.reduce((sum, a) => sum + (MINUTES_SAVED[a.feature] ?? 8), 0);
  const featuresUsed = new Set(activity.map((a) => a.feature)).size;
  const firstName = (user?.user_metadata?.["full_name"] as string | undefined)?.split(" ")[0];

  const stats = [
    { label: "AI tasks completed", value: activity.length, icon: Zap },
    {
      label: "Estimated time saved",
      value: minutesSaved >= 60 ? `${(minutesSaved / 60).toFixed(1)} h` : `${minutesSaved} min`,
      icon: Clock,
    },
    { label: "Tools used", value: `${featuresUsed} / 5`, icon: TrendingUp },
    { label: "Outputs you reviewed", value: activity.length, icon: History },
  ];

  return (
    <div className="space-y-8">
      <section className="bg-brand animate-fade-up relative overflow-hidden rounded-3xl p-6 text-primary-foreground shadow-lift sm:p-8">
        <span className="animate-float absolute -right-10 -top-10 size-40 rounded-full bg-primary-foreground/10" />
        <span className="animate-float absolute -bottom-12 right-24 size-24 rounded-full bg-primary-foreground/10 [animation-delay:1.5s]" />
        <div className="relative max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-medium">
            <Sparkles aria-hidden="true" className="size-3.5" /> Your AI workspace
          </span>
          <h1 className="mt-4 text-2xl font-semibold sm:text-3xl">
            Welcome back{firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-primary-foreground/85">
            Pick a tool below to draft, summarise, plan or research. Every result is a draft you can
            edit, regenerate and approve before it leaves this workspace.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild variant="secondary" className="gap-2">
              <Link to="/email">
                Draft an email <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Link to="/chat">Ask the assistant</Link>
            </Button>
          </div>
        </div>
      </section>

      <section aria-label="Productivity statistics" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            style={{ animationDelay: `${i * 60}ms` }}
            className="animate-fade-up rounded-2xl border border-border bg-card p-5 shadow-card"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {stat.label}
              </p>
              <stat.icon aria-hidden="true" className="size-4 text-primary" />
            </div>
            {isLoading ? (
              <Skeleton className="mt-3 h-8 w-16" />
            ) : (
              <p className="mt-2 font-display text-2xl font-semibold">{stat.value}</p>
            )}
          </div>
        ))}
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold">Quick actions</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURE_ITEMS.map((item, i) => (
            <Link
              key={item.to}
              to={item.to}
              style={{ animationDelay: `${i * 50}ms` }}
              className="animate-fade-up group rounded-2xl border border-border bg-card p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lift"
            >
              <span className="bg-brand grid size-10 place-items-center rounded-xl text-primary-foreground transition-transform duration-300 group-hover:scale-110">
                <item.icon aria-hidden="true" className="size-5" />
              </span>
              <h3 className="mt-4 font-display text-sm font-semibold">{item.label}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.blurb}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                Open <ArrowRight aria-hidden="true" className="size-3.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Recent activity</h2>
            <Badge variant="secondary">Last 20</Badge>
          </div>
          <div className="mt-4 rounded-2xl border border-border bg-card p-2 shadow-card">
            {isLoading ? (
              <div className="space-y-3 p-4">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : isError ? (
              <p className="p-6 text-sm text-muted-foreground">
                Your activity history couldn't be loaded right now.
              </p>
            ) : activity.length === 0 ? (
              <EmptyState
                icon={<History aria-hidden="true" className="size-6" />}
                title="No AI activity yet"
                description="Generate your first email, summary or plan and it will appear here for quick reference."
              >
                <Button asChild size="sm">
                  <Link to="/email">Start with an email</Link>
                </Button>
              </EmptyState>
            ) : (
              <ul className="divide-y divide-border">
                {activity.map((item) => (
                  <li key={item.id} className="flex items-start gap-3 p-4">
                    <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {FEATURE_LABELS[item.feature] ?? item.feature} ·{" "}
                        {new Date(item.created_at).toLocaleString()}
                      </p>
                      {item.preview ? (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {item.preview}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h2 className="font-display text-sm font-semibold">Shortcuts</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {[
                { to: "/meetings", label: "Summarise yesterday's notes" },
                { to: "/planner", label: "Plan today's priorities" },
                { to: "/research", label: "Brief me on a topic" },
                { to: "/settings", label: "Review security settings" },
              ].map((s) => (
                <li key={s.to}>
                  <Link
                    to={s.to}
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    {s.label}
                    <ArrowRight aria-hidden="true" className="size-3.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <ResponsibleAINotice />
        </div>
      </section>
    </div>
  );
}
