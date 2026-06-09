import fs from "node:fs/promises";
import path from "node:path";

const API_BASE = "https://api.elevenlabs.io/v1";
const MODEL_ID = process.env.ELEVENLABS_MODEL_ID || "eleven_turbo_v2_5";
const API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_NOVA_VOICE_ID;
const OUTPUT_DIR = path.resolve("public/audio/coaches/nova");

const LINES = [
  ["session_start.mp3", "We're up. Let's get into it."],
  ["resume_workout.mp3", "Back in. Pick up where you left off."],
  ["rest_start.mp3", "Take a breath. We go again in a second."],
  ["next_movement.mp3", "Next up. Set yourself and move well."],
  ["session_complete.mp3", "Nice work. Session done. Recover well."],
  ["safety_stop.mp3", "Stop there. Reset first."],
  ["difficulty_easier.mp3", "Good call. Let's nudge the challenge up."],
  ["difficulty_harder.mp3", "Good adjustment. Let's clean it up and keep moving."],
  ["rep_5.mp3", "Five good reps."],
  ["rep_10.mp3", "Ten in. Keep it smooth."],
  ["form_shallow.mp3", "A little deeper."],
  ["form_unstable.mp3", "Slow it down. Stay in control."],
];

function requireEnv(name, value) {
  if (!value || !value.trim()) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value.trim();
}

async function synthesizeToFile(fileName, text) {
  const response = await fetch(`${API_BASE}/text-to-speech/${VOICE_ID}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
      "xi-api-key": API_KEY,
    },
    body: JSON.stringify({
      text,
      model_id: MODEL_ID,
      voice_settings: {
        stability: 0.4,
        similarity_boost: 0.78,
        style: 0.24,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Failed to generate ${fileName}: ${response.status} ${message}`);
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  await fs.writeFile(path.join(OUTPUT_DIR, fileName), bytes);
}

async function main() {
  requireEnv("ELEVENLABS_API_KEY", API_KEY);
  requireEnv("ELEVENLABS_NOVA_VOICE_ID", VOICE_ID);

  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  for (const [fileName, text] of LINES) {
    process.stdout.write(`Generating ${fileName}... `);
    await synthesizeToFile(fileName, text);
    process.stdout.write("done\n");
  }

  process.stdout.write(`\nNova prerecorded pack written to ${OUTPUT_DIR}\n`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
