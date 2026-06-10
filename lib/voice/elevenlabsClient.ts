export const ENABLE_ELEVENLABS_VOICE =
  process.env.NEXT_PUBLIC_ENABLE_ELEVENLABS_VOICE === "true";

type ElevenLabsVoiceRequest = {
  text: string;
  avatar: "Nova" | "Atlas";
  emphasis: "standard" | "distance";
};

export async function requestElevenLabsVoiceClip(
  payload: ElevenLabsVoiceRequest
): Promise<Blob | null> {
  const response = await fetch("/api/voice/elevenlabs", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    return null;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.startsWith("audio/")) {
    return null;
  }

  return response.blob();
}
