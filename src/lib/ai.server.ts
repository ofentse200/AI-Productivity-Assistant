// Server-only helpers for structured prompting against the Lovable AI Gateway.
const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3.7-flash";

export const RESPONSIBLE_AI_RULES = `
RESPONSIBLE AI CONSTRAINTS (non-negotiable):
- Use ONLY facts supplied by the user. Never invent names, numbers, dates, quotes, sources, links or commitments.
- If information is missing, write a clearly bracketed placeholder such as [add date] instead of guessing.
- Never present uncertain information as certain. Use hedged language ("this may", "consider verifying").
- Never fabricate citations, studies, statistics or external sources.
- Encourage the user to verify anything important before acting.
- The user remains responsible for all final decisions; output is a draft to review and edit.
- Do not include confidential-looking data that the user did not provide.
`.trim();

export class GatewayError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "GatewayError";
  }
}

function friendlyGatewayMessage(status: number, raw: string): string {
  if (status === 402) return "AI credits are exhausted for this workspace. Add credits to continue.";
  if (status === 403) return "AI access is currently blocked by workspace policy.";
  if (status === 429) return "The AI service is rate limited right now. Please retry in a moment.";
  if (status === 401) return "AI is not configured correctly on the server.";
  if (status >= 500) return "The AI service is temporarily unavailable. Please retry.";
  return raw.slice(0, 300) || "The AI request failed.";
}

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

async function callGateway(messages: ChatMessage[], jsonMode: boolean): Promise<string> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new GatewayError(401, "AI is not configured correctly on the server.");

  const response = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!response.ok) {
    const raw = await response.text().catch(() => "");
    throw new GatewayError(response.status, friendlyGatewayMessage(response.status, raw));
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) throw new GatewayError(502, "The AI returned an empty response. Please retry.");
  return content;
}

export async function generateText(system: string, user: string): Promise<string> {
  return callGateway(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    false,
  );
}

export async function generateConversation(
  system: string,
  history: ChatMessage[],
): Promise<string> {
  return callGateway([{ role: "system", content: system }, ...history], false);
}

function stripFences(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced ? fenced[1] : text).trim();
}

export async function generateJson<T>(system: string, user: string): Promise<T> {
  const raw = await callGateway(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    true,
  );
  const cleaned = stripFences(raw);
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1)) as T;
      } catch {
        /* fall through */
      }
    }
    throw new GatewayError(502, "The AI response could not be read. Please regenerate.");
  }
}
