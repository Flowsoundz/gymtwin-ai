# Avatar Animation Pipeline

This folder stores local animation assets for GymTwin AI.

## Folder purpose

- `source_mixamo/`
  Keep this folder empty in the deployed app. It is reserved for runtime-safe placeholders only.
- `../../assets/blender/maximo_character/`
  Store untouched Mixamo FBX downloads and Blender source animation packages here.
- `idle/`
  Store converted idle GLB animation assets here.
- `emotes/`
  Store converted reaction or emote GLB animation assets here.
- `dance/hype/`
  Store dance or hype celebration GLB animation assets here.
- `fitness/squat/`
  Store squat demo GLB animation assets here.
- `fitness/pushup/`
  Store push-up demo GLB animation assets here.
- `fitness/plank/`
  Store plank demo GLB animation assets here.

## Recommended workflow

1. Download the original animation from Mixamo as FBX.
2. Save the untouched FBX in `assets/blender/maximo_character/animations/` in the correct category folder.
3. Convert or retarget the animation in Blender.
4. Export the runtime-ready animation asset as GLB into the correct category folder.
5. Update `lib/avatarAnimationLibrary.ts` only after the real GLB file exists.

## Naming convention

Use lowercase snake case and include avatar plus action:

- `atlas_idle_default.glb`
- `atlas_thumbs_up_default.glb`
- `atlas_dance_hype_01.glb`
- `atlas_squat_demo_01.glb`
- `atlas_pushup_demo_01.glb`
- `atlas_plank_demo_01.glb`
- `nova_idle_default.glb`

Mixamo source FBX examples:

- `atlas_idle_default_source_mixamo.fbx`
- `atlas_thumbs_up_default_source_mixamo.fbx`
- `atlas_squat_demo_01_source_mixamo.fbx`

## Updating avatarAnimationLibrary.ts

When a converted GLB is ready:

1. Put the GLB in the matching folder under `public/animations/`.
2. Open `lib/avatarAnimationLibrary.ts`.
3. Find the matching placeholder or default clip entry.
4. Add:

```ts
filePath: "/animations/path/to/file.glb"
```

5. Set:

```ts
isAvailable: true
```

6. Keep placeholder clips unavailable until the real file exists.

## Important rule

Do not point `filePath` at a file that does not exist yet. Coach3D and Model Lab should remain on the current safe fallback path until a real asset is present.

Also do not place large raw FBX source libraries back into `public/`. They belong under `assets/blender/` so local Blender work stays available without bloating Vercel deployments.
