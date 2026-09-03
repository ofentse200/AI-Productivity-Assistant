import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertTriangle, Check, Copy, Loader2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

export function GeneratingState({ label = "Generating with AI" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="animate-fade-in space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card"
    >
      <div className="flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-full bg-primary-soft animate-pulse-ring">
          <Loader2 aria-hidden="true" className="size-4 animate-spin text-primary" />
        </span>
        <div>
          <p className="font-display text-sm font-semibold text-foreground">{label}…</p>
          <p className="text-xs text-muted-foreground">
            Structuring your input — this usually takes a few seconds.
          </p>
        </div>
      </div>
      <div className="space-y-2.5">
        {[100, 92, 78, 86, 64].map((w, i) => (
          <div key={i} className="shimmer-line h-3 rounded-full" style={{ width: `${w}%` }} />
        ))}
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="animate-fade-in flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/60 px-6 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary">
        {icon}
      </span>
      <h3 className="mt-4 font-display text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      {children ? <div className="mt-5">{children}</div> : null}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="animate-fade-in flex flex-col gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-5 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex gap-3">
        <AlertTriangle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-destructive" />
        <div>
          <p className="font-display text-sm font-semibold text-destructive">
            Generation didn't finish
          </p>
          <p className="mt-1 text-sm text-foreground/80">{message}</p>
        </div>
      </div>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

export function CopyButton({
  value,
  label = "Copy",
  className,
  size = "sm",
  variant = "outline",
}: {
  value: string;
  label?: string;
  className?: string;
  size?: "sm" | "default" | "icon";
  variant?: "outline" | "ghost" | "secondary" | "default";
}) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      className={cn("gap-2", className)}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          toast.success("Copied to clipboard");
          window.setTimeout(() => setCopied(false), 1800);
        } catch {
          toast.error("Your browser blocked clipboard access");
        }
      }}
    >
      {copied ? (
        <Check aria-hidden="true" className="size-4" />
      ) : (
        <Copy aria-hidden="true" className="size-4" />
      )}
      {label}
    </Button>
  );
}
