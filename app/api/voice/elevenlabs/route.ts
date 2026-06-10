import { NextResponse } from "next/server";
import { synthesizeWithElevenLabs } from "@/lib/voice/elevenlabsServer";

type RequestBody = {
  text?: string;
  avatar?: "Nova" | "Atlas";
  emphasis?: "standard" | "distance";
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;
    const text = body.text?.trim();
    const avatar = body.avatar === "Atlas" ? "Atlas" : "Nova";
    const emphasis = body.emphasis === "standard" ? "standard" : "distance";

    if (!text) {
      return NextResponse.json({ ok: false, reason: "missing_text" }, { status: 400 });
    }

    const elevenLabsResponse = await synthesizeWithElevenLabs({
      text,
      avatar,
      emphasis,
    });

    if (!elevenLabsResponse.ok) {
      const message = await elevenLabsResponse.text();
      return NextResponse.json(
        {
          ok: false,
          reason: "provider_error",
          message: message || "ElevenLabs synthesis failed.",
        },
        { status: elevenLabsResponse.status }
      );
    }

    const audioBuffer = await elevenLabsResponse.arrayBuffer();
    return new Response(audioBuffer, {
      status: 200,
      headers: {
        "content-type": elevenLabsResponse.headers.get("content-type") ?? "audio/mpeg",
        "cache-control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { ok: false, reason: "request_error", message: "Invalid ElevenLabs voice request." },
      { status: 400 }
    );
  }
}
