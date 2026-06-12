# GymTwin AI — Developer Guide

*Onboarding document for new developers. Last updated 2026-06-12.*

---

## 1. What GymTwin is

GymTwin AI is an **AI home-fitness app**: a 3D-animated coach (Nova or Atlas) guides users through adaptive bodyweight/dumbbell/band workouts, watches their form through the phone camera (on-device pose tracking — no video leaves the device), tracks nutrition with AI food-photo scanning, and runs multi-week training programs with gamified progression.

It ships two ways from one codebase:
- **Web/PWA** at `https://www.gymtwinai.com` (Vercel)
- **Native iOS app** — a Capacitor shell that loads the production site and adds native capabilities (HealthKit, audio mixing; push/TestFlight pending Apple Developer account)

The site is currently gated: the public sees a Coming Soon page; a preview token (in Vercel env `NEXT_PUBLIC_PREVIEW_TOKEN`) unlocks the full app via `?access=<token>` (stored in localStorage per device).

---

## 2. Tech stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack), React 18, TypeScript strict |
| Styling | Tailwind CSS, heavy use of arbitrary values for the neon/dark aesthetic |
| 3D | Three.js + @react-three/fiber + drei; GLB models, Mixamo-rigged |
| Pose tracking | MediaPipe (WASM, on-device) |
| Voice | Web Speech API + ElevenLabs scaffold (placeholder .wavs currently); browser TTS fallback |
| Auth + cloud sync | Supabase (email/password + Google OAuth); RLS on all tables |
| AI | Anthropic Claude (food-photo scan `/api/food-scan`, coach chat `/api/coach/chat`) |
| Native | Capacitor **7.6.6** (pinned — see Dragons), SPM (no CocoaPods), iOS only so far |
| Hosting | Vercel — **git auto-deploy is NOT connected**; deploy manually (see §6) |

---

## 3. Repo tour

```
app/
  page.tsx            ← THE app. ~1400 lines. Screen state machine + all top-level
                        state (stats, plans, programs, session, settings). Start here.
  api/                ← server routes: coach/chat, food-scan, account/delete, debug
components/
  LandingScreen.tsx   ← dashboard: hero coach, Today's Plan, programs, daily challenge
  SetupScreen.tsx     ← "Session Builder" (goal/equipment/level/duration/coach)
  RoutinePreviewScreen.tsx → WorkoutPlayerScreen.tsx (the live workout)
  WorkoutSummaryScreen.tsx, ProgressScreen, NutritionScreen, SettingsScreen
  OptimizedCoachCanvas.tsx ← the live 3D coach renderer (lighting, platform, reactions)
  Coach3D.tsx         ← OLDER coach renderer, still used on some legacy surfaces
  ProgramCompleteModal.tsx ← celebration + canvas-rendered share card
  AuthScreen.tsx      ← email/password + Google; "Continue as guest" via onSkip prop
lib/
  personalizedWorkoutEngine.ts ← THE workout generator. 110 exercise templates live
                        here (inline `exerciseTemplates` array). Cues + easier/harder.
  weeklyPlanEngine.ts  ← 7-day split templates per goal/level
  programs.ts          ← multi-week programs (Foundation 4 / Shred 30 / Strong 6)
  twinRace.ts          ← "Beat Your Twin": week-1 pace baseline vs final-week race
  dailyChallenge.ts    ← date-seeded daily bonus task, ~1-in-7 Double XP days
  macrocycleEngine.ts  ← long-horizon periodization (AFI fatigue, deload triggers)
  adaptiveProfileEngine.ts / difficultyAdjustmentEngine.ts ← session feedback → tuning
  audioCues.ts         ← tone cues; MASTER GATE setCoachAudioEnabled() lives here
  native.ts            ← isNativeApp() + saveWorkoutToAppleHealth() bridge
  avatarDisplaySettings.ts ← user settings incl. coachAudioEnabled defaults
  supabaseSync.ts      ← cloud sync mapping (settings/workouts/streaks)
  characters.ts        ← coach registry (model paths, accent/rim colors, lightingBoost)
  exerciseAnimationMap.ts ← movement name/category → animation GLB
hooks/
  useCameraCoach.ts    ← MediaPipe camera form tracking (~2000 lines)
  useCoachVoice.ts / useSpeechCoach.ts ← voice pipeline (respects audio gate)
data/fitnessLibrary.ts ← ⚠️ DEAD catalog (see Dragons) — generator does NOT use it
public/
  models/gymtwin/      ← coach GLBs (female = NO Draco, see Dragons)
  models/animations/   ← shared Mixamo clips (41-bone, cm-scale rig)
  draco/               ← Draco decoder (glTF variant — versions must match!)
  brand/gymtwin-mark.png ← logo (alpha-keyed transparent)
ios/                   ← Capacitor shell (App.xcodeproj, HealthKitPlugin.swift)
native-shell/          ← offline fallback page for the native webview
docs/ROADMAP.md        ← phased plan with effort estimates
supabase-schema.sql    ← DB schema (user_settings / workouts / streaks + RLS)
```

**There is no router-based navigation.** `app/page.tsx` holds a `currentScreen` state string (`"onboarding" | "landing" | "setup" | "player" | ...`) and conditionally renders screens. All cross-screen state lives in page.tsx and flows down as props.

**Persistence:** localStorage-first (keys in `lib/storageKeys.ts`), Supabase sync layered on top for signed-in users. Guest mode is fully supported.

---

## 4. Core systems in 60 seconds each

**Workout flow:** Landing → Setup (or program/quick-pill prefill) → `generatePersonalizedPlan(goal, level, equipment, minutes, coach)` returns `{warmup, mainBlock, cooldown, coachNotes}` → `planToWorkoutMovements()` → RoutinePreview → Player runs sets/reps/rest with countdowns → `finalizeRoutineMetrics()` writes stats/history/PRs, marks the weekly-plan day complete, fires Apple Health save (native), Victory emote, Summary screen.

**Programs:** `lib/programs.ts`. Starting one generates week 1's WeeklyPlan with per-week theme (session offset, deload flag, Nova intro line). Completing all training days auto-advances (`page.tsx` effect). Final week = Test Week (twin race). Completion → `ProgramCompleteModal` + share card.

**Beat Your Twin:** first workout of a program snapshots reps/min (`twinRace.ts`). Final week shows a live race badge in the player; beating it stores `lastDeltaPct`, spoken by Nova and printed on the share card.

**3D coach:** `OptimizedCoachCanvas` renders the model + hex platform + phase-colored ring. Animations: external clip GLBs retarget onto the model by Mixamo bone name. One-shot reactions (cheer/victory/nod) via `useCoachStore.setReactionGLBPath`. Per-surface camera/lighting presets + per-character `lightingBoost`.

**Audio policy:** `coachAudioEnabled` (default OFF on web, ON in native shell) gates ALL sound — voice and tone cues. Web iOS kills background music on any audio; native iOS mixes + ducks (AVAudioSession in AppDelegate). Captions always show regardless.

**Camera coach:** `useCameraCoach` runs MediaPipe pose on-device; squat/push-up/plank form feedback + rep counting. First use shows a consent explainer modal (page.tsx) before the browser permission prompt.

---

## 5. Running locally

```bash
npm install
npm run dev          # http://localhost:3000
npx tsc --noEmit     # typecheck (no test suite exists — verify by driving the app)
```

`.env.local` needs (see existing file): Supabase URL + anon key, `ANTHROPIC_API_KEY` (food scan/chat), ElevenLabs vars (optional), `NEXT_PUBLIC_ENABLE_*` flags.

Local quirks: the preview gate is OFF locally (no `NEXT_PUBLIC_PREVIEW_TOKEN`). Skip onboarding fast: `localStorage.setItem("gymtwin_onboarding_done","true")`. Guest mode: "Continue as guest" under the sign-in card.

**iOS simulator:**
```bash
npx cap sync ios
xcodebuild -project ios/App/App.xcodeproj -scheme App -sdk iphonesimulator \
  -destination 'platform=iOS Simulator,name=iPhone 16 Pro Max' \
  -derivedDataPath /tmp/gt-ios-build build
xcrun simctl install booted /tmp/gt-ios-build/Build/Products/Debug-iphonesimulator/App.app
xcrun simctl launch booted com.gymtwin.app
```
The shell loads **production**, not localhost (remote-shell architecture — `capacitor.config.ts`).

---

## 6. Deploying

```bash
git push origin main            # backup only — does NOT deploy!
npx vercel deploy --prod --yes  # THIS deploys (project is linked via .vercel/)
```
Vercel's Git integration is not connected. Every web deploy also updates the native app instantly (it loads the site).

---

## 7. 🐉 Dragons — hard-won, do not relearn

1. **Female model must NOT be Draco-compressed.** Draco quantization mangles her hairline into a dark lock over the face. Export uncompressed (2.76MB). The male model is Draco and fine.
2. **`public/draco/` decoder files must be the matched glTF-variant set** from `three/examples/jsm/libs/draco/gltf/`. A mismatched wrapper/wasm pair makes every model silently fail (eternal loading ring, `_malloc` undefined in a blob worker).
3. **Animation clips are authored on a 0.01-scale (cm) rig; the female model is meter-scale.** `CoachModelEngine` rescales `.position` tracks by the armature-scale ratio. Without it, clips launch her hips ~47m into the sky. Never play external clips raw.
4. **The idle clip must be named `Armature|mixamo.com|Layer0`** (= `MIXAMO_IDLE_CLIP`) and be baked into the coach GLB. Passing an external idle GLB to the hero collapses the model.
5. **Two exercise catalogs exist; one is dead.** The live one is `exerciseTemplates` inside `personalizedWorkoutEngine.ts`. `data/fitnessLibrary.ts` feeds `workoutEngine.buildRoutine`, which nothing calls. Add movements to the live one.
6. **`lib/featureFlags.ts` reads `process.env[name]` dynamically** — Next.js can't inline dynamic env access, so client-side these flags ALWAYS fall back to default `true` regardless of Vercel values. Treat them as compile-time-broken until refactored to static `process.env.NEXT_PUBLIC_X` references.
7. **`NEXT_PUBLIC_*` vars bake at build time.** Changing one in Vercel does nothing until the next deploy. (This is why the preview gate once sat "enabled" but inactive — the var existed, empty, unbuilt.)
8. **Capacitor is pinned to 7.6.6.** The 8.4.0 binary framework was compiled with a newer Swift than Xcode 16.2; its `bridge` accessor hides behind a compiler feature gate and plugin registration won't compile. Don't bump until the toolchains align.
9. **Google OAuth will not work inside the native webview** (Google blocks embedded user agents). Email/password works. Native Google sign-in needs a system-browser flow (ASWebAuthenticationSession) — not built yet.
10. **Supabase `service_role` key** bypasses all RLS — server-only, never `NEXT_PUBLIC_`, never in client code. The anon key is public by design.
11. **Mesh bone influences:** glTF caps at 4 per vertex; Blender allows more. The female export clamps to 4 (`Limit Total` in Blender) — re-exports must repeat this.
12. **vercel.json crons on the Hobby plan must be daily or rarer** (FlowSoundz learned this; applies to any cron added here).

---

## 8. Current state & what's left

**Built and live:** full workout loop with adaptive difficulty, 110-movement library, weekly plans, 3 multi-week programs with auto-advance, Beat Your Twin, daily challenge, badges/XP, share cards, coach celebrations, nutrition + AI food scan, camera form coach, guest mode, Google sign-in (web), coming-soon gate, native iOS shell with HealthKit + audio mixing.

**Blocked on the owner (not code):**
- Rotate exposed ElevenLabs + Supabase service-role keys
- Apple Developer enrollment → push notifications, TestFlight, real-device tests
- Run `supabase-schema.sql` check/fix in the production Supabase project
- Avatar art polish (launch gate), emblem-only logo export for app icons
- Real-device checks: camera coach, Health permission sheet, Spotify ducking

**Next code milestones (docs/ROADMAP.md):** named XP levels, onboarding <60s, push re-engagement, native Google sign-in, program SEO pages at launch.

**3D source art** is NOT in the repo (files too large): backed up as GitHub release `3d-sources-2026-06-12` on this repo. The deployable GLBs in `public/models/` are canonical for the app.

---

## 9. Verification culture

There's no test suite. The working method: **drive the real app** (Playwright + system Chrome headless against `npm run dev`), screenshot, and check console/page errors — plus `npx tsc --noEmit` before every commit. The Draco bug, the 47m-hips bug, and the lighting fix were all found this way. When you change the coach pipeline, render Nova AND Atlas; when you change plan logic, generate plans across goal×level×equipment combos and count distinct outcomes.
