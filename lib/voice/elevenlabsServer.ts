import "server-only";

const ELEVENLABS_API_BASE = "https://api.elevenlabs.io/v1";

export const ELEVENLABS_MODEL_ID =
  process.env.ELEVENLABS_MODEL_ID ?? "eleven_turbo_v2_5";

export const ELEVENLABS_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_ELEVENLABS_VOICE === "true";

function readRequiredEnv(name: string): string | null {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value.trim() : null;
}

export function getElevenLabsApiKey(): string | null {
  return readRequiredEnv("ELEVENLABS_API_KEY");
}

export function getElevenLabsVoiceId(avatar: "Nova" | "Atlas"): string | null {
  if (avatar === "Nova") {
    return readRequiredEnv("ELEVENLABS_NOVA_VOICE_ID");
  }
  return readRequiredEnv("ELEVENLABS_ATLAS_VOICE_ID");
}

export type ElevenLabsSynthesisPayload = {
  text: string;
  avatar: "Nova" | "Atlas";
  emphasis: "standard" | "distance";
};

function buildVoiceSettings(emphasis: "standard" | "distance") {
  return emphasis === "distance"
    ? {
        stability: 0.48,
        similarity_boost: 0.72,
        style: 0.18,
        use_speaker_boost: true,
      }
    : {
        stability: 0.4,
        similarity_boost: 0.78,
        style: 0.24,
        use_speaker_boost: true,
      };
}

export async function synthesizeWithElevenLabs(
  payload: ElevenLabsSynthesisPayload
): Promise<Response> {
  const apiKey = getElevenLabsApiKey();
  const voiceId = getElevenLabsVoiceId(payload.avatar);

  if (!ELEVENLABS_ENABLED) {
    return new Response("ElevenLabs voice is disabled.", { status: 503 });
  }
  if (!apiKey || !voiceId) {
    return new Response("ElevenLabs is not configured.", { status: 503 });
  }

  return fetch(`${ELEVENLABS_API_BASE}/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
      "xi-api-key": apiKey,
    },
    body: JSON.stringify({
      text: payload.text,
      model_id: ELEVENLABS_MODEL_ID,
      voice_settings: buildVoiceSettings(payload.emphasis),
    }),
  });
}
