import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  RESPONSIBLE_AI_RULES,
  generateConversation,
  generateJson,
  GatewayError,
} from "./ai.server";

const text = (max: number) => z.string().trim().max(max);

function fail(error: unknown): never {
  if (error instanceof GatewayError) throw new Error(error.message);
  throw new Error("Something went wrong while generating. Please try again.");
}

/* ------------------------------------------------------------------ email */

const EmailInput = z.object({
  recipient: text(400).min(1),
  purpose: text(600).min(1),
  keyPoints: text(4000).min(1),
  tone: z.enum(["Formal", "Friendly", "Persuasive"]),
  length: z.enum(["Short", "Medium", "Detailed"]),
});

export type EmailResult = { subject: string; body: string; notes: string[] };

export const generateEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => EmailInput.parse(data))
  .handler(async ({ data }): Promise<EmailResult> => {
    const system = `
ROLE: You are a senior workplace communication specialist drafting business email on behalf of a professional.

TASK: Write one ready-to-review email using only the context the user supplies.

CONSTRAINTS:
- Tone must be exactly: ${data.tone}.
- Length target: ${data.length} (Short = under 90 words, Medium = 120-180 words, Detailed = 220-320 words).
- Cover every key point supplied. Add no new commitments, dates, prices, names or claims.
- Plain professional business English. No emojis. No marketing filler.

${RESPONSIBLE_AI_RULES}

OUTPUT FORMAT: JSON only, shape:
{"subject": string, "body": string, "notes": string[]}
"body" uses \\n line breaks with a greeting, paragraphs and a sign-off ending in [Your name].
"notes" lists up to 3 short items the user should check or fill in before sending.`.trim();

    const user = `RECIPIENT / CONTEXT:\n${data.recipient}\n\nPURPOSE:\n${data.purpose}\n\nKEY POINTS:\n${data.keyPoints}`;

    try {
      const result = await generateJson<EmailResult>(system, user);
      return {
        subject: result.subject ?? "",
        body: result.body ?? "",
        notes: Array.isArray(result.notes) ? result.notes.slice(0, 3) : [],
      };
    } catch (error) {
      fail(error);
    }
  });

/* --------------------------------------------------------------- meetings */

const MeetingInput = z.object({
  notes: text(20000).min(20),
  meetingTitle: text(200).optional(),
});

export type MeetingResult = {
  executiveSummary: string;
  keyPoints: string[];
  decisions: string[];
  actionItems: Array<{ action: string; owner: string; deadline: string }>;
  openQuestions: string[];
};

export const summarizeMeeting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => MeetingInput.parse(data))
  .handler(async ({ data }): Promise<MeetingResult> => {
    const system = `
ROLE: You are an experienced executive assistant who turns raw meeting notes into structured minutes.

TASK: Summarise the supplied notes only.

CONSTRAINTS:
- Extract; never infer attendees, decisions, dates or owners that are not in the notes.
- When an owner or deadline is not identifiable, use exactly "Not specified".
- Keep each bullet one sentence, factual and neutral.

${RESPONSIBLE_AI_RULES}

OUTPUT FORMAT: JSON only, shape:
{"executiveSummary": string, "keyPoints": string[], "decisions": string[],
 "actionItems": [{"action": string, "owner": string, "deadline": string}], "openQuestions": string[]}`.trim();

    const user = `${data.meetingTitle ? `MEETING: ${data.meetingTitle}\n\n` : ""}RAW NOTES:\n${data.notes}`;

    try {
      const r = await generateJson<MeetingResult>(system, user);
      return {
        executiveSummary: r.executiveSummary ?? "",
        keyPoints: r.keyPoints ?? [],
        decisions: r.decisions ?? [],
        actionItems: (r.actionItems ?? []).map((a) => ({
          action: a?.action ?? "",
          owner: a?.owner || "Not specified",
          deadline: a?.deadline || "Not specified",
        })),
        openQuestions: r.openQuestions ?? [],
      };
    } catch (error) {
      fail(error);
    }
  });

/* ---------------------------------------------------------------- planner */

const PlannerInput = z.object({
  horizon: z.enum(["Daily", "Weekly"]),
  hoursPerDay: z.number().min(1).max(16),
  workingHours: text(120).optional(),
  tasks: z
    .array(
      z.object({
        description: text(400).min(1),
        priority: z.enum(["High", "Medium", "Low"]),
        deadline: text(60).optional(),
        durationHours: z.number().min(0.25).max(40),
      }),
    )
    .min(1)
    .max(25),
});

export type PlanResult = {
  strategy: string;
  urgent: string[];
  blocks: Array<{
    slot: string;
    task: string;
    priority: string;
    durationHours: number;
    reason: string;
  }>;
  deferred: string[];
  risks: string[];
};

export const generatePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => PlannerInput.parse(data))
  .handler(async ({ data }): Promise<PlanResult> => {
    const system = `
ROLE: You are a workplace productivity planner applying deadline-first, impact-weighted prioritisation.

TASK: Order the supplied tasks and lay them into a realistic ${data.horizon.toLowerCase()} schedule.

CONSTRAINTS:
- Use only the tasks provided. Never invent tasks, deadlines or durations.
- Respect the capacity of ${data.hoursPerDay} focused hours per day${data.workingHours ? ` within working hours ${data.workingHours}` : ""}.
- If total work exceeds capacity, list the overflow in "deferred" rather than compressing durations.
- "slot" must be a concrete human label such as "Mon 09:00-10:30" (weekly) or "09:00-10:30" (daily).
- Keep each "reason" to one short sentence.

${RESPONSIBLE_AI_RULES}

OUTPUT FORMAT: JSON only, shape:
{"strategy": string, "urgent": string[],
 "blocks": [{"slot": string, "task": string, "priority": string, "durationHours": number, "reason": string}],
 "deferred": string[], "risks": string[]}`.trim();

    const user = `HORIZON: ${data.horizon}\nCAPACITY: ${data.hoursPerDay} h/day\nWORKING HOURS: ${data.workingHours || "Not specified"}\n\nTASKS:\n${data.tasks
      .map(
        (t, i) =>
          `${i + 1}. ${t.description} | priority: ${t.priority} | deadline: ${t.deadline || "none"} | estimate: ${t.durationHours}h`,
      )
      .join("\n")}`;

    try {
      const r = await generateJson<PlanResult>(system, user);
      return {
        strategy: r.strategy ?? "",
        urgent: r.urgent ?? [],
        blocks: (r.blocks ?? []).map((b) => ({
          slot: b?.slot ?? "",
          task: b?.task ?? "",
          priority: b?.priority ?? "Medium",
          durationHours: Number(b?.durationHours) || 0,
          reason: b?.reason ?? "",
        })),
        deferred: r.deferred ?? [],
        risks: r.risks ?? [],
      };
    } catch (error) {
      fail(error);
    }
  });

/* --------------------------------------------------------------- research */

const ResearchInput = z.object({
  topic: text(1000).min(3),
  context: text(2000).optional(),
  depth: z.enum(["Overview", "Balanced", "In-depth"]),
});

export type ResearchResult = {
  summary: string;
  insights: string[];
  considerations: string[];
  recommendations: string[];
  followUpQuestions: string[];
  confidence: string;
  verifyBecause: string[];
};

export const runResearch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => ResearchInput.parse(data))
  .handler(async ({ data }): Promise<ResearchResult> => {
    const system = `
ROLE: You are a careful business research analyst who separates general knowledge from verified fact.

TASK: Produce a ${data.depth.toLowerCase()} briefing on the user's topic from general knowledge only.

CONSTRAINTS:
- You have NO access to live sources. Never produce citations, URLs, study names, author names or statistics presented as verified.
- Where a figure or claim would normally need a source, say what to look up instead of stating a number.
- State uncertainty explicitly. "confidence" must be one of: "High-level general knowledge", "Mixed - verify specifics", "Low - highly context dependent".
- "verifyBecause" lists the specific items the user must confirm with authoritative sources.

${RESPONSIBLE_AI_RULES}

OUTPUT FORMAT: JSON only, shape:
{"summary": string, "insights": string[], "considerations": string[], "recommendations": string[],
 "followUpQuestions": string[], "confidence": string, "verifyBecause": string[]}`.trim();

    const user = `TOPIC / QUESTION:\n${data.topic}\n\nCONTEXT:\n${data.context || "Not provided"}`;

    try {
      const r = await generateJson<ResearchResult>(system, user);
      return {
        summary: r.summary ?? "",
        insights: r.insights ?? [],
        considerations: r.considerations ?? [],
        recommendations: r.recommendations ?? [],
        followUpQuestions: r.followUpQuestions ?? [],
        confidence: r.confidence || "Mixed - verify specifics",
        verifyBecause: r.verifyBecause ?? [],
      };
    } catch (error) {
      fail(error);
    }
  });

/* ---------------------------------------------------------------- chatbot */

const ChatInput = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: text(6000).min(1),
      }),
    )
    .min(1)
    .max(40),
});

export const chatWithAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => ChatInput.parse(data))
  .handler(async ({ data }): Promise<{ reply: string }> => {
    const system = `
ROLE: You are the AI Workplace Assistant inside a corporate productivity platform.

USER CONTEXT: A working professional handling email, meetings, planning and research.

TASK: Answer workplace questions and produce practical drafts, checklists and plans.

CONSTRAINTS:
- Stay on workplace productivity topics; politely redirect anything else.
- Ask at most one clarifying question when the request is genuinely ambiguous, then still offer a best-effort draft.
- Use short markdown: brief paragraphs, bullet lists, bold labels. Keep answers under 300 words unless asked for more.
- Tone: professional, warm, direct.

${RESPONSIBLE_AI_RULES}`.trim();

    try {
      const reply = await generateConversation(system, data.messages);
      return { reply };
    } catch (error) {
      fail(error);
    }
  });
