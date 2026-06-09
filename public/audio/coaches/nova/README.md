Nova prerecorded pack lives in this folder.

Minimum recommended files:

- `session_start.mp3` -> `We're up. Let's get into it.`
- `rest_start.mp3` -> `Take a breath. We go again in a second.`
- `session_complete.mp3` -> `Nice work. Session done. Recover well.`
- `safety_stop.mp3` -> `Stop there. Reset first.`
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
