import authSide from "@/assets/auth-side.jpg";
import logoMark from "@/assets/logo-mark.png";
import { ResponsibleAINotice } from "@/components/ResponsibleAINotice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { KeyRound, Loader2, Lock, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in | AI Workplace Productivity Assistant" },
      {
        name: "description",
        content:
          "Sign in securely with email and password or Google to access your AI workplace productivity tools.",
      },
      { property: "og:title", content: "Sign in | AI Workplace Productivity Assistant" },
      {
        property: "og:description",
        content: "Secure, token-based access to your AI workplace productivity workspace.",
      },
    ],
  }),
  component: AuthPage,
});

function safePath(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [busy, setBusy] = useState<"none" | "signin" | "signup" | "google">("none");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const target = safePath(redirect);

  useEffect(() => {
    if (!loading && session) navigate({ to: target, replace: true });
  }, [loading, session, navigate, target]);

  async function handleSignIn(event: React.FormEvent) {
    event.preventDefault();
    setBusy("signin");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy("none");
    if (error) {
      toast.error(
        error.message.toLowerCase().includes("invalid")
          ? "Those credentials don't match an account."
          : error.message,
      );
      return;
    }
    toast.success("Welcome back");
    navigate({ to: target, replace: true });
  }

  async function handleSignUp(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 8) {
      toast.error("Use at least 8 characters for your password.");
      return;
    }
    setBusy("signup");
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: fullName },
      },
    });
    setBusy("none");
    if (error) {
      toast.error(
        error.message.toLowerCase().includes("already")
          ? "That email already has an account — sign in instead."
          : error.message,
      );
      return;
    }
    toast.success("Account created — you're signed in");
    navigate({ to: target, replace: true });
  }

  async function handleGoogle() {
    setBusy("google");
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setBusy("none");
      toast.error("Google sign-in could not be completed.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: target, replace: true });
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-sidebar lg:block">
        <img
          src={authSide}
          alt="Professionals collaborating in a modern office"
          width={1280}
          height={1600}
          className="absolute inset-0 size-full object-cover opacity-60"
        />
        <div className="bg-brand absolute inset-0 opacity-60 mix-blend-multiply" />
        <div className="relative flex h-full flex-col justify-between p-10 text-primary-foreground">
          <div className="flex items-center gap-3">
            <img
              src={logoMark}
              alt=""
              width={512}
              height={512}
              loading="lazy"
              className="size-10 rounded-xl bg-primary-foreground/90 p-1"
            />
            <span className="font-display text-lg font-semibold">Workplace AI</span>
          </div>
          <div className="animate-fade-up max-w-md space-y-5">
            <h2 className="text-3xl font-semibold leading-tight">
              Automate the busywork. Keep the judgement.
            </h2>
            <p className="text-sm leading-relaxed text-primary-foreground/85">
              Draft email, summarise meetings, plan your week and research topics — with every AI
              output editable before you use it.
            </p>
            <ul className="space-y-2 text-sm text-primary-foreground/90">
              {[
                "Signed JSON Web Token sessions on every request",
                "Row-level database isolation per user",
                "Structured prompts that refuse to invent facts",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <ShieldCheck aria-hidden="true" className="size-4" /> {item}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-primary-foreground/70">
            Review AI output before acting on it. You stay accountable for final decisions.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="animate-fade-up w-full max-w-md space-y-6">
          <div className="flex items-center gap-3 lg:hidden">
            <img
              src={logoMark}
              alt=""
              width={512}
              height={512}
              loading="lazy"
              className="size-9 rounded-lg bg-primary-soft p-1"
            />
            <span className="font-display text-base font-semibold">Workplace AI</span>
          </div>

          <div>
            <h1 className="text-2xl font-semibold text-foreground">Sign in to your workspace</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Access your AI productivity tools with a secure, token-based session.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            className="h-11 w-full gap-2"
            onClick={handleGoogle}
            disabled={busy !== "none"}
          >
            {busy === "google" ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <KeyRound aria-hidden="true" className="size-4" />
            )}
            Continue with Google
          </Button>

          <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>

          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-5">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Work email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="h-11 w-full" disabled={busy !== "none"}>
                  {busy === "signin" ? (
                    <Loader2 aria-hidden="true" className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Lock aria-hidden="true" className="mr-2 size-4" />
                  )}
                  Sign in securely
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-5">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full name</Label>
                  <Input
                    id="signup-name"
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alex Morgan"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Work email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum 8 characters. Passwords are checked against known breach lists.
                  </p>
                </div>
                <Button type="submit" className="h-11 w-full" disabled={busy !== "none"}>
                  {busy === "signup" ? (
                    <Loader2 aria-hidden="true" className="mr-2 size-4 animate-spin" />
                  ) : null}
                  Create secure account
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <ResponsibleAINotice compact />
        </div>
      </div>
    </div>
  );
}
