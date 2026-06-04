# Feature Isolation Plan

## Major screens

The app-level screen state is driven by `currentScreen` in `app/page.tsx`.

- `onboarding`
- `auth`
- `landing`
- `settings`
- `model_lab`
- `camera_sandbox`
- `setup`
- `preview`
- `player`
- `summary`
- `workout_detail`
- `safety_stop`
- `progress`

## Screens that mount Coach3D

Direct `Coach3D` mounts:

- `landing` via `components/LandingScreen.tsx`
- `settings` via `components/SettingsScreen.tsx`
- `model_lab` via `components/ModelLabScreen.tsx`
- `preview` via `components/RoutinePreviewScreen.tsx`
- `player` via `components/WorkoutPlayerScreen.tsx`
- `summary` via `components/WorkoutSummaryScreen.tsx`
- `camera_sandbox` via `components/CameraSandboxScreen.tsx`

Indirect `Coach3D` mounts:

- `player` via `components/ExerciseDemoCard.tsx`
- Any screen where `showFloatingCoach` is true via `components/DraggableCoach.tsx`

`showFloatingCoach` is controlled in `app/page.tsx` and can add a `Coach3D` mount on these screens when the floating overlay mode is enabled:

- `auth`
- `settings`
- `setup`
- `preview`
- `summary`
- `workout_detail`
- `safety_stop`
- `progress`
- `onboarding`

## Screens that activate camera tracking

Screens that call `useCameraCoach()`:

- `player` via `components/WorkoutPlayerScreen.tsx`
- `camera_sandbox` via `components/CameraSandboxScreen.tsx`

Screens that can actively start the camera:

- `player` through the Camera Coach panel
- `camera_sandbox` through the Start Camera controls

## Temporary feature flags

Defined in `lib/featureFlags.ts`. All flags default to enabled unless explicitly set to `0`.

- `NEXT_PUBLIC_ENABLE_COACH3D`
- `NEXT_PUBLIC_ENABLE_CAMERA_TRACKING`
- `NEXT_PUBLIC_ENABLE_MEDIAPIPE`
- `NEXT_PUBLIC_ENABLE_EXERCISE_DEMOS`

Behavior:

- `ENABLE_COACH3D`
  Disables live `Coach3D` rendering globally and forces the fallback UI instead.
- `ENABLE_CAMERA_TRACKING`
  Disables camera startup entirely in `useCameraCoach()`.
- `ENABLE_MEDIAPIPE`
  Keeps camera startup available, but blocks MediaPipe loading and the pose tracking loop. This gives a preview-only camera mode for isolation.
- `ENABLE_EXERCISE_DEMOS`
  Disables demo clip usage and demo-specific coach renders while leaving base `Coach3D` available when `ENABLE_COACH3D` is still on.

## Suggested env settings

Example `.env.local` values:

```bash
NEXT_PUBLIC_ENABLE_COACH3D=1
NEXT_PUBLIC_ENABLE_CAMERA_TRACKING=1
NEXT_PUBLIC_ENABLE_MEDIAPIPE=1
NEXT_PUBLIC_ENABLE_EXERCISE_DEMOS=1
```

Turn a subsystem off by setting its flag to `0`.

## Test order

Test 1: Home page only

- `NEXT_PUBLIC_ENABLE_COACH3D=0`
- `NEXT_PUBLIC_ENABLE_CAMERA_TRACKING=0`
- `NEXT_PUBLIC_ENABLE_MEDIAPIPE=0`
- `NEXT_PUBLIC_ENABLE_EXERCISE_DEMOS=0`
- Open `landing`

Test 2: Home page + Coach3D

- `NEXT_PUBLIC_ENABLE_COACH3D=1`
- `NEXT_PUBLIC_ENABLE_CAMERA_TRACKING=0`
- `NEXT_PUBLIC_ENABLE_MEDIAPIPE=0`
- `NEXT_PUBLIC_ENABLE_EXERCISE_DEMOS=0`
- Open `landing`

Test 3: Home page + Camera

- `NEXT_PUBLIC_ENABLE_COACH3D=0`
- `NEXT_PUBLIC_ENABLE_CAMERA_TRACKING=1`
- `NEXT_PUBLIC_ENABLE_MEDIAPIPE=1`
- `NEXT_PUBLIC_ENABLE_EXERCISE_DEMOS=0`
- Open `camera_sandbox`

Test 4: Home page + Coach3D + Camera

- `NEXT_PUBLIC_ENABLE_COACH3D=1`
- `NEXT_PUBLIC_ENABLE_CAMERA_TRACKING=1`
- `NEXT_PUBLIC_ENABLE_MEDIAPIPE=1`
- `NEXT_PUBLIC_ENABLE_EXERCISE_DEMOS=0`
- Open `camera_sandbox`

## Optional follow-up split

If camera memory growth appears only when camera is enabled, split camera tests one more step:

- Camera preview only:
  `ENABLE_CAMERA_TRACKING=1`, `ENABLE_MEDIAPIPE=0`
- Full camera + MediaPipe:
  `ENABLE_CAMERA_TRACKING=1`, `ENABLE_MEDIAPIPE=1`

That isolates raw camera/video memory from MediaPipe pose-tracking memory.
