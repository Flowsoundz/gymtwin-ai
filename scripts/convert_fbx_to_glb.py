"""
Batch FBX → GLB converter for GymTwin AI animation assets.

Usage (from the gymtwin-ai project root):
  /Applications/Blender.app/Contents/MacOS/Blender \
    --background --python scripts/convert_fbx_to_glb.py

Source: assets/blender/maximo_character/animations/ (organized Maximo packs)
Output: public/models/animations/  (category subfolders preserved)

Naming: Maximo_Anim_Fitness_BoxJump_01.fbx → fitness/Box_Jump_1.glb
"""

import bpy
import os
import re
import inspect
import textwrap

PROJECT_ROOT = "/Users/adonyflorencio/gymtwin-ai"

# ─── Blender 5.1 compat patch ────────────────────────────────────────────────
# Blender 5.1 removed CyclesLightSettings.cast_shadow but the FBX importer
# still tries to set it, crashing on any FBX that contains a light object.
# Patch blen_read_light to skip that assignment.
try:
    import io_scene_fbx.import_fbx as _fbx_mod
    _src = inspect.getsource(_fbx_mod.blen_read_light)
    _fixed = textwrap.dedent(_src).replace(
        "lamp.cycles.cast_shadow = lamp.use_shadow",
        "pass  # cast_shadow removed in Blender 5.1",
    )
    _ns = {}
    exec(compile(_fixed, "<patched_blen_read_light>", "exec"), _fbx_mod.__dict__, _ns)
    _fbx_mod.blen_read_light = _ns["blen_read_light"]
    print("  [patch] FBX cast_shadow fix applied")
except Exception as _e:
    print(f"  [patch] WARNING: could not apply cast_shadow fix: {_e}")
# ─────────────────────────────────────────────────────────────────────────────

# Source folders → output subfolders
CATEGORIES = {
    "fitness":    "fitness",
    "idle":       "idle",
    "locomotion": "locomotion",
    "combat":     "combat",
    "emote":      "emotes",
    "pose":       "poses",
    "dance":      "dance",
    "gestures":   "gestures",
}

ANIM_ROOT   = os.path.join(PROJECT_ROOT, "assets/blender/maximo_character/animations")
OUTPUT_ROOT = os.path.join(PROJECT_ROOT, "public/models/animations")

# ─── Helpers ──────────────────────────────────────────────────────────────────

def parse_name(filename):
    """
    Maximo_Anim_Fitness_BoxJump_01.fbx → (category='fitness', slug='Box_Jump_1')
    Returns (None, None) if unrecognised.
    """
    stem = os.path.splitext(filename)[0]  # strip .fbx
    # Match Maximo_Anim_<Category>_<Rest>_<NN>
    m = re.match(r"Maximo_Anim_(\w+)_(.+)_(\d+)$", stem, re.IGNORECASE)
    if not m:
        return None, None
    raw_cat = m.group(1).lower()
    raw_name = m.group(2)
    number = int(m.group(3))

    category = CATEGORIES.get(raw_cat)
    if category is None:
        return None, None

    # CamelCase → Title_Case_With_Number
    # "BoxJump" → "Box_Jump", "SumoHighPull" → "Sumo_High_Pull"
    spaced = re.sub(r"(?<=[a-z0-9])(?=[A-Z])", "_", raw_name)
    slug = f"{spaced}_{number}"
    return category, slug


def parse_gesture_name(filename):
    """
    Raw Mixamo gesture names: 'head nod yes.fbx' → ('gestures', 'Head_Nod_Yes_1')
    Skips 'Untitled.fbx'.
    """
    stem = os.path.splitext(filename)[0]
    if stem.lower() == "untitled":
        return None, None
    # Title-case each word and join with underscores
    words = re.split(r"[\s_-]+", stem.strip())
    slug = "_".join(w.capitalize() for w in words if w) + "_1"
    return "gestures", slug


# ─── Run ──────────────────────────────────────────────────────────────────────

# Gather all FBX files grouped by category
to_convert = []  # list of (fbx_path, output_dir, glb_filename)

for cat_folder in sorted(os.listdir(ANIM_ROOT)):
    cat_path = os.path.join(ANIM_ROOT, cat_folder)
    if not os.path.isdir(cat_path):
        continue
    is_gestures = cat_folder.lower() == "gestures"
    for fname in sorted(os.listdir(cat_path)):
        if not fname.lower().endswith(".fbx"):
            continue
        if is_gestures:
            category, slug = parse_gesture_name(fname)
        else:
            category, slug = parse_name(fname)
        if category is None:
            continue
        out_dir = os.path.join(OUTPUT_ROOT, category)
        glb_name = f"{slug}.glb"
        to_convert.append((
            os.path.join(cat_path, fname),
            out_dir,
            glb_name,
        ))

print(f"\n{'='*56}")
print(f"  GymTwin FBX → GLB Batch Converter")
print(f"  Source : {ANIM_ROOT}")
print(f"  Output : {OUTPUT_ROOT}")
print(f"  Total  : {len(to_convert)} files queued")
print(f"{'='*56}\n")

converted        = 0
skipped_existing = 0
errors           = 0

for fbx_path, out_dir, glb_name in to_convert:
    glb_path = os.path.join(out_dir, glb_name)

    if os.path.exists(glb_path):
        print(f"  SKIP  {glb_name}")
        skipped_existing += 1
        continue

    os.makedirs(out_dir, exist_ok=True)
    print(f"  →  {glb_name}  ({os.path.basename(fbx_path)})")

    try:
        bpy.ops.wm.read_factory_settings(use_empty=True)

        bpy.ops.import_scene.fbx(
            filepath=fbx_path,
            use_anim=True,
            use_image_search=False,
        )

        if not bpy.context.scene.objects:
            print(f"     WARNING: nothing imported — skipping")
            errors += 1
            continue

        # Strip mesh, lights, cameras — keep only the armature + its animations
        for obj in list(bpy.context.scene.objects):
            if obj.type != "ARMATURE":
                bpy.data.objects.remove(obj, do_unlink=True)

        if not bpy.context.scene.objects:
            print(f"     WARNING: no armature found — skipping")
            errors += 1
            continue

        bpy.ops.export_scene.gltf(
            filepath=glb_path,
            export_format="GLB",
            export_animations=True,
            export_apply=False,
        )

        size_kb = os.path.getsize(glb_path) // 1024
        print(f"     OK  {size_kb} KB")
        converted += 1

    except Exception as exc:
        print(f"     ERROR: {exc}")
        errors += 1

print(f"\n{'='*56}")
print(f"  Converted : {converted}")
print(f"  Skipped (already exist) : {skipped_existing}")
print(f"  Errors    : {errors}")
print(f"{'='*56}\n")
