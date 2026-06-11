# GymTwin AI — Competitive Roadmap

Status date: 2026-06-11. Ordered by retention impact per unit of effort.
Effort scale: S (< 1 day) · M (1–3 days) · L (1–2 weeks) · XL (3+ weeks).

## Phase 0 — Launch blockers (this week)

| # | Item | Effort | Owner | Notes |
|---|------|--------|-------|-------|
| 0.1 | Rotate ElevenLabs API key | S | Adony | Exposed earlier; treat as compromised |
| 0.2 | Rotate Supabase service-role key | S | Adony | Same exposure |
| 0.3 | Run prod schema check/fix SQL | S | Adony | Script provided in session 2026-06-11 |
| 0.4 | Finish avatar polish | ? | Adony | Self-declared gate for lifting coming-soon |
| 0.5 | Real Nova voice (post 0.1) | M | Both | ElevenLabs scaffold exists; replace placeholder .wavs |
| 0.6 | Camera Coach check on real iPhone/Android | S | Adony | Headless can't validate pose tracking |

## Phase 1 — Retention core (weeks 1–4)

| # | Item | Effort | Notes |
|---|------|--------|-------|
| 1.1 | **Structured multi-week programs** | M | ✅ Started 2026-06-11 — catalog on top of weeklyPlanEngine; biggest day-30 retention lever in the category |
| 1.2 | Exercise library to 100+ movements | L | Content work: names/cues/muscle maps into personalizedWorkoutEngine; animations can lag behind (fallback demos) |
| 1.3 | Program completion celebrations + shareable card | M | Hooks into existing badge/summary systems; drives organic shares |
| 1.4 | Onboarding → first workout < 60s | M | Collapse intake to 2 steps + "just start" default path |
| 1.5 | Web push re-engagement (PWA) | M | Streak-at-risk + next-program-day reminders |

## Phase 2 — Native credibility (weeks 4–8)

| # | Item | Effort | Notes |
|---|------|--------|-------|
| 2.1 | Capacitor wrapper → TestFlight | L | Unlocks HealthKit + reliable push; capacitor.config.ts already present |
| 2.2 | HealthKit / Google Fit write | M | After 2.1; #1 trust gap vs native competitors |
| 2.3 | Audio session mixing (native) | S | AVAudioSession mixWithOthers — removes the web "coach audio kills Spotify" limit |
| 2.4 | App icons from emblem-only logo export | S | Blocked on emblem asset from Adony |

## Phase 3 — Growth engine (weeks 6–12)

| # | Item | Effort | Notes |
|---|------|--------|-------|
| 3.1 | Camera-coach demo clips for TikTok/Reels | M | The differentiator nobody else can demo from a browser |
| 3.2 | Referral loop ("train with your twin") | M | Invite → both get program unlock |
| 3.3 | Programs landing pages (SEO) | M | One public page per program; waitlist → install funnel |
| 3.4 | Creator seeding kit | S | Preview-token links + asset pack |

## Explicitly later (don't build yet)

- Social feed / community (needs critical mass first)
- Wearable integrations beyond HealthKit
- Marketplace / trainer platform
- Paid tier (price after retention proof, not before)

## North-star metrics

- Activation: % of new users completing first workout same day (target 40%+)
- Retention: week-4 return rate (target 25%+ before any paid spend)
- Growth: weekly actives via short-form content (1,000 = fundable story)
