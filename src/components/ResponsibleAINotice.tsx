import { cn } from "@/lib/utils";
import { ShieldCheck } from "lucide-react";

export const RESPONSIBLE_AI_TEXT =
  "AI-generated content may contain errors or omissions. Review and verify important information before sending emails, making decisions, or acting on recommendations. Do not enter confidential or sensitive information unless permitted by your organization's policies.";

export function ResponsibleAINotice({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <aside
      role="note"
      aria-label="Responsible AI notice"
      className={cn(
        "flex gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4",
        compact && "p-3",
        className,
      )}
    >
      <ShieldCheck
        aria-hidden="true"
        className={cn("mt-0.5 size-5 shrink-0 text-warning-foreground", compact && "size-4")}
      />
      <div>
        <p
          className={cn(
            "font-display text-sm font-semibold text-warning-foreground",
            compact && "text-xs",
          )}
        >
          Responsible AI
        </p>
        <p
          className={cn(
            "mt-1 text-sm leading-relaxed text-warning-foreground/90",
            compact && "text-xs",
          )}
        >
          {RESPONSIBLE_AI_TEXT}
        </p>
      </div>
    </aside>
  );
}
