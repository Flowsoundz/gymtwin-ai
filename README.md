# GymTwin AI

GymTwin AI is a Next.js workout MVP that generates guided training sessions, tracks progress locally, and offers an optional browser-based Camera Coach for select movements.

## Features

- Workout generator with goal, level, equipment, and coach selection
- Coach voice guidance using browser speech synthesis
- Resume active workout from local session state
- Progress dashboard and workout history
- Camera Coach inside the workout player
- Camera Sandbox for tracking iteration and testing
- Local squat, push-up, and plank tracking in the browser

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Start the app on the local development port used in this project:

```bash
npm run dev -- -p 3001
```

3. Open `http://localhost:3001`.

## Optional Voice Provider Setup

GymTwin supports a server-only ElevenLabs scaffold for coach voice, but it is disabled by default.

Recommended local env:

```bash
NEXT_PUBLIC_ENABLE_ELEVENLABS_VOICE=false
ELEVENLABS_API_KEY=your_server_only_key
ELEVENLABS_NOVA_VOICE_ID=your_nova_voice_id
```

Notes:

- keep `ELEVENLABS_API_KEY` server-side only
- do not use `NEXT_PUBLIC_` for the API key
- leave the public enable flag off until you want ElevenLabs to be attempted

## Camera Notes

- Camera access works on `localhost` during development.
- Production camera access requires HTTPS.
- MediaPipe model/runtime assets are served from `public/` and must be included in deployment output.

## Privacy

- Camera processing stays on device.
- Video, images, and landmarks are not uploaded.
- No camera data is sent to a backend service.

## Safety

- Prototype feedback only.
- Not medical advice.
- Stop immediately if you experience pain, dizziness, or chest pain.

## MVP Scope

- Frontend-only Next.js App Router project
- Local persistence for workout progress and resume state
- Optional Camera Coach overlay for supported movements only
- No authentication, payments, or backend services in this MVP
