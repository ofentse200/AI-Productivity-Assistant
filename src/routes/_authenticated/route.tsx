import logoMark from "@/assets/logo-mark.png";
import { NAV_ITEMS } from "@/components/app/nav";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Link, Outlet, createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { LogOut, Menu, ShieldCheck, Sparkles, User } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav aria-label="Main navigation" className="flex flex-1 flex-col gap-1 px-3 py-4">
      {NAV_ITEMS.map((item, index) => {
        const active = pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            style={{ animationDelay: `${index * 35}ms` }}
            className={cn(
              "animate-fade-up group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lift"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <item.icon
              aria-hidden="true"
              className={cn(
                "size-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
                active ? "" : "text-sidebar-foreground/70",
              )}
            />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarBrand() {
  return (
    <Link to="/dashboard" className="flex items-center gap-3 border-b border-sidebar-border px-5 py-4">
      <img
        src={logoMark}
        alt=""
        width={512}
        height={512}
        loading="lazy"
        className="size-9 rounded-lg bg-sidebar-accent p-1"
      />
      <span className="leading-tight">
        <span className="block font-display text-sm font-semibold text-sidebar-foreground">
          Workplace AI
        </span>
        <span className="block text-xs text-sidebar-foreground/60">Productivity Assistant</span>
      </span>
    </Link>
  );
}

function AuthenticatedLayout() {
  const { session, loading, user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !session) {
      navigate({ to: "/auth", search: { redirect: window.location.pathname }, replace: true });
    }
  }, [loading, session, navigate]);

  if (loading || !session) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="animate-fade-in flex flex-col items-center gap-3">
          <span className="bg-brand grid size-12 place-items-center rounded-2xl animate-pulse-ring">
            <Sparkles aria-hidden="true" className="size-5 text-primary-foreground" />
          </span>
          <p className="text-sm text-muted-foreground">Securing your session…</p>
        </div>
      </div>
    );
  }

  const email = user?.email ?? "";
  const initials = email.slice(0, 2).toUpperCase() || "AI";

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col bg-sidebar lg:flex">
        <SidebarBrand />
        <SidebarNav />
        <div className="border-t border-sidebar-border p-4">
          <div className="rounded-xl bg-sidebar-accent p-3">
            <p className="flex items-center gap-2 font-display text-xs font-semibold text-sidebar-accent-foreground">
              <ShieldCheck aria-hidden="true" className="size-4" /> Human in the loop
            </p>
            <p className="mt-1 text-xs leading-relaxed text-sidebar-foreground/70">
              Every AI draft is editable. You approve before anything leaves this workspace.
            </p>
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="surface-glass sticky top-0 z-30 flex h-16 items-center gap-3 px-4 sm:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu aria-hidden="true" className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 border-0 bg-sidebar p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SidebarBrand />
              <SidebarNav onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-sm font-semibold text-foreground">
              AI Workplace Productivity Assistant
            </p>
            <p className="hidden truncate text-xs text-muted-foreground sm:block">
              Secure, reviewable AI for everyday work
            </p>
          </div>

          <span className="hidden items-center gap-1.5 rounded-full border border-success/40 bg-success/10 px-3 py-1 text-xs font-medium text-success sm:inline-flex">
            <ShieldCheck aria-hidden="true" className="size-3.5" /> Session secured
          </span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full" aria-label="Account menu">
                <Avatar className="size-9">
                  <AvatarFallback className="bg-primary-soft text-xs font-semibold text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="truncate text-xs font-normal text-muted-foreground">
                {email}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/settings" className="flex items-center gap-2">
                  <User aria-hidden="true" className="size-4" /> Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={async () => {
                  await signOut();
                  navigate({ to: "/auth", search: { redirect: "/dashboard" }, replace: true });
                }}
                className="flex items-center gap-2 text-destructive focus:text-destructive"
              >
                <LogOut aria-hidden="true" className="size-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
