# GymTwin Coach Voice Setup

GymTwin now has a hybrid voice system scaffold:

- contextual voice intents
- priority-based interruption rules
- pre-recorded clip manifest
- browser TTS fallback
- one-coach first rollout for `Nova`

## Current architecture

- `lib/voice/voiceIntents.ts`
  - intent and priority types
- `lib/voice/voicePriority.ts`
  - interruption ranking
- `lib/voice/preRecordedManifest.ts`
  - Nova-first clip manifest
- `lib/voice/voiceResolver.ts`
  - maps workout context to natural coach lines
- `lib/voice/elevenlabsClient.ts`
  - client-side request helper, disabled by default
- `lib/voice/elevenlabsServer.ts`
  - server-only ElevenLabs config and synthesis function
- `hooks/useCoachVoice.ts`
  - playback coordinator
- `hooks/useSpeechCoach.ts`
  - existing public hook, now backed by the new engine
- `hooks/useRepSpeech.ts`
  - rep milestones and form cues now emit structured intents

## Recommended Nova starter pack

Start with the minimum eight files that matter most in live workout flow:

- `session_start.mp3`
- `rest_start.mp3`
- `session_complete.mp3`
- `safety_stop.mp3`
- `rep_5.mp3`
- `rep_10.mp3`
- `form_shallow.mp3`
- `form_unstable.mp3`

Optional later:

- `resume_workout.mp3`
- `form_clean.mp3`

Recommended copy:

- `session_start.mp3` -> `We're up. Let's get into it.`
- `rest_start.mp3` -> `Take a breath. We go again in a second.`
- `session_complete.mp3` -> `Nice work. Session done. Recover well.`
- `safety_stop.mp3` -> `Stop there. Reset first.`
- `rep_5.mp3` -> `Five good reps.`
- `rep_10.mp3` -> `Ten in. Keep it smooth.`
- `form_shallow.mp3` -> `A little deeper.`
- `form_unstable.mp3` -> `Slow it down. Stay in control.`

## Current fallback behavior

- If a pre-recorded Nova clip exists and plays successfully, it is used.
- If the clip is missing or playback fails, GymTwin falls back to browser TTS.
- If the browser has no speech synthesis available, the caption still updates but no audio plays.

## Priority model

Highest to lowest:

1. `safety`
2. `form_correction`
3. `countdown`
4. `transition`
5. `encouragement`
6. `ambient`

Lower-priority lines do not interrupt higher-priority playback.

## Next step for ElevenLabs

The remaining work is only asset production and/or TTS provider replacement.

Possible next integrations:

- replace browser TTS fallback with ElevenLabs request + response audio
- cache generated lines by intent key
- add `Atlas` manifest and phrase tuning

## ElevenLabs scaffold

The provider lane is wired but stays off until you enable it.

Required server env:

- `ELEVENLABS_API_KEY`
- `ELEVENLABS_NOVA_VOICE_ID`

Optional:

- `ELEVENLABS_ATLAS_VOICE_ID`
- `ELEVENLABS_MODEL_ID`

Client feature flag:

- `NEXT_PUBLIC_ENABLE_ELEVENLABS_VOICE=false`

Recommended starting state:

```env
NEXT_PUBLIC_ENABLE_ELEVENLABS_VOICE=false
ELEVENLABS_API_KEY=your_server_only_key
ELEVENLABS_NOVA_VOICE_ID=your_nova_voice_id
```

How to get `ELEVENLABS_NOVA_VOICE_ID`:

1. Open ElevenLabs `Voices`
2. Pick the Nova voice you want to use
3. Open that voice details page
4. Copy the `Voice ID`
5. Put that exact value in `ELEVENLABS_NOVA_VOICE_ID`

Do not use the API key in place of the voice ID.

Behavior:

- when `false`, GymTwin uses pre-recorded clips if present, then browser TTS fallback
- when `true`, GymTwin tries:
  1. pre-recorded clip
  2. ElevenLabs server route
  3. browser TTS fallback

## One-command Nova generation

Once your ElevenLabs key has `text_to_speech` permission, generate the starter pack with:

```bash
npm run voice:nova
```

That writes the eight recommended Nova mp3 files into `public/audio/coaches/nova/`.
