Nova prerecorded pack lives in this folder.

Recommended starter files:

- `session_start.mp3` -> `We're up. Let's get into it.`
- `resume_workout.mp3` -> `Back in. Pick up where you left off.`
- `rest_start.mp3` -> `Take a breath. We go again in a second.`
- `next_movement.mp3` -> `Next up. Set yourself and move well.`
- `session_complete.mp3` -> `Nice work. Session done. Recover well.`
- `safety_stop.mp3` -> `Stop there. Reset first.`
- `difficulty_easier.mp3` -> `Good call. Let's nudge the challenge up.`
- `difficulty_harder.mp3` -> `Good adjustment. Let's clean it up and keep moving.`
- `rep_5.mp3` -> `Five good reps.`
- `rep_10.mp3` -> `Ten in. Keep it smooth.`
- `form_shallow.mp3` -> `A little deeper.`
- `form_unstable.mp3` -> `Slow it down. Stay in control.`

You can generate these with:

```bash
npm run voice:nova
```

This requires:

- `ELEVENLABS_API_KEY`
- `ELEVENLABS_NOVA_VOICE_ID`
- an ElevenLabs API key with `text_to_speech` permission
