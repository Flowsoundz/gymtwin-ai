import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

type MessageTurn = { role: "user" | "assistant"; content: string };

type RequestBody = {
  message: string;
  avatar: "Atlas" | "Nova";
  history?: MessageTurn[];
  context: {
    exerciseName: string;
    setNumber: number;
    totalSets: number;
    repsDone: number;
    targetReps: number;
    cleanRepCount: number;
    needsWorkRepCount: number;
    feedbackMessage: string;
    isRestPhase: boolean;
    elapsedMinutes: number;
    sessionStreak?: number;
    lastSessionScore?: number;
  };
};

function buildSystemPrompt(avatar: "Atlas" | "Nova", ctx: RequestBody["context"]): string {
  const personality =
    avatar === "Atlas"
      ? `You are Atlas, a no-nonsense performance coach. Direct, intense, results-driven. Short sentences. No fluff. Push athletes to their limit but respect pain signals. Sound like a serious strength coach, not a cheerleader.`
      : `You are Nova, a precision-focused AI coach. Calm, encouraging, form-obsessed. Give specific technical feedback. Sound like an expert personal trainer who genuinely cares about the athlete's progress.`;

  const formSummary =
    ctx.cleanRepCount + ctx.needsWorkRepCount > 0
      ? `${ctx.cleanRepCount} clean reps, ${ctx.needsWorkRepCount} reps needing work this session.`
      : "No camera tracking data yet this session.";

  return `${personality}

CURRENT WORKOUT STATE:
- Exercise: ${ctx.exerciseName}
- Set: ${ctx.setNumber} of ${ctx.totalSets}
- Reps done: ${ctx.repsDone} (target: ${ctx.targetReps})
- Phase: ${ctx.isRestPhase ? "Rest" : "Active"}
- Elapsed: ${ctx.elapsedMinutes} min
- Form data: ${formSummary}
- Latest coaching cue: "${ctx.feedbackMessage}"
${ctx.sessionStreak ? `- Current streak: ${ctx.sessionStreak} sessions` : ""}
${ctx.lastSessionScore ? `- Last session score: ${ctx.lastSessionScore}/100` : ""}

RULES:
- Keep responses under 2 sentences. This is mid-workout, not a conversation.
- If the user mentions pain, tell them to stop and rest immediately.
- Never make up rep counts or stats you don't have.
- Stay in character at all times.
- Do not use markdown or bullet points — speak naturally.`;
}

async function tryOpenAI(systemPrompt: string, messages: MessageTurn[]): Promise<string | null> {
  if (!process.env.OPENAI_API_KEY) return null;
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 120,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages,
    ],
  });
  return response.choices[0]?.message?.content?.trim() ?? null;
}

async function tryAnthropic(systemPrompt: string, messages: MessageTurn[]): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === "your_key_here") return null;
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 120,
    system: systemPrompt,
    messages,
  });
  return response.content[0].type === "text" ? response.content[0].text.trim() : null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;
    const { message, avatar, history = [], context } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: "missing_message" }, { status: 400 });
    }

    const systemPrompt = buildSystemPrompt(avatar, context);
    const messages: MessageTurn[] = [
      ...history.slice(-6),
      { role: "user", content: message },
    ];

    // Primary: GPT-4o mini (cheaper)
    let reply = await tryOpenAI(systemPrompt, messages).catch(() => null);

    // Fallback: Claude Haiku
    if (!reply) {
      reply = await tryAnthropic(systemPrompt, messages).catch(() => null);
    }

    if (!reply) {
      return NextResponse.json({ error: "coach_unavailable" }, { status: 503 });
    }

    return NextResponse.json({ reply, role: "assistant" });
  } catch (err) {
    console.error("[coach/chat]", err);
    return NextResponse.json({ error: "coach_unavailable" }, { status: 500 });
  }
}
