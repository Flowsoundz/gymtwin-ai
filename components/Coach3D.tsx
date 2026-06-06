"use client";

// THREE.Clock is deprecated in Three.js r176+ — R3F still uses it internally.
// Suppress the warning until R3F migrates to THREE.Timer.
if (typeof window !== "undefined") {
  const _warn = console.warn.bind(console);
  console.warn = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].startsWith("THREE.Clock")) return;
    _warn(...args);
  };
}

import * as React from "react";
import { Suspense, useEffect, useMemo, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Html, OrbitControls, useGLTF } from "@react-three/drei";
import { clone as skeletonClone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { ACESFilmicToneMapping, AnimationClip, AnimationMixer, BufferAttribute, BufferGeometry, CanvasTexture, Color, Line, LineBasicMaterial, LoopOnce, LoopRepeat, Mesh, PCFShadowMap, SkeletonHelper, SRGBColorSpace, Vector3, VectorKeyframeTrack } from "three";
import type { Group, Object3D } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  ATLAS_RUNTIME_COACH_MODEL_PATH,
  GYMTWIN_FEMALE_MODEL_PATH,
  GYMTWIN_MALE_MODEL_PATH,
  getAvatarLabel,
  getAvatarModelPaths,
  NOVA_RUNTIME_COACH_MODEL_PATH,
  isSharedRuntimeHumanoidModel,
} from "@/lib/avatarAssets";
import { loadTransformPreset } from "@/lib/coachTransformStorage";
import { useCoachSpeech } from "@/hooks/useCoachSpeech";
import type { CoachAnimationHint } from "@/lib/coachBrain";
import { diagnosticsEnabled, mutateClientDiagnostics } from "@/lib/debugDiagnostics";
import { FITNESS_ANIMATION_PACK } from "@/lib/exerciseAnimationMap";
import { ENABLE_COACH3D, ENABLE_EXERCISE_DEMOS } from "@/lib/featureFlags";
import type { CoachAvatar } from "@/types";

export type Coach3DMood =
  | "idle"
  | "listening"
  | "coaching"
  | "good"
  | "warning"
  | "error"
  | "celebrating";

type Coach3DProps = {
  selectedAvatar: CoachAvatar;
  mood?: Coach3DMood;
  compact?: boolean;
  animate?: boolean;
  freezeAnimation?: boolean;
  modelPathOverride?: string;
  animationHint?: CoachAnimationHint;
  animationClipId?: string | null;
  demoClipName?: string | null;
  previewTransform?: PreviewTransform;
  previewFrame?: Coach3DPreviewFrame;
  lightingMode?: "mood" | "neutral";
  manualTuning?: boolean;
  onClipsDetected?: (clips: string[]) => void;
  message?: string | null;
  viewportClassName?: string;
  cameraTargetOverride?: [number, number, number];
  fovOverride?: number;
  playbackSpeed?: number;
  showSkeleton?: boolean;
  isPaused?: boolean;
  isFloorMovement?: boolean;
};

type ModelStatus = "checking" | "available" | "missing" | "error";

type MoodSceneMeta = {
  gradient: string;
  border: string;
  glow: string;
  accentText: string;
  pill: string;
  lightA: string;
  lightB: string;
  modelScale: number;
  lightIntensityA: number;
  lightIntensityB: number;
};

type ModelTransform = {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  cameraPosition: [number, number, number];
  fovCompact: number;
  fovDefault: number;
  orbitTarget: [number, number, number];
};

type ViewerPresetId = "front" | "three_quarter" | "side" | "back";

const verifiedModelAvailability = new Map<string, boolean>();
const sessionResolvedModelPaths = new Set<string>();
const sessionLoadedModelPaths = new Set<string>();
const coach3DLeaseListeners = new Set<() => void>();
let coach3DLeaseOwnerId: string | null = null;
let coach3DInstanceSequence = 0;
let activeCoach3DInstances = 0;

function createOwnedSceneInstance(scene: Object3D) {
  // SkeletonUtils.clone is the part we need for animated skinned meshes.
  // Duplicating every geometry/material/texture per mount was blowing up memory
  // on initial load, especially in development where React mounts twice.
  return skeletonClone(scene);
}

function notifyCoach3DLeaseListeners() {
  coach3DLeaseListeners.forEach((listener) => listener());
}

function syncCoach3DDiagnostics() {
  if (!diagnosticsEnabled) {
    return;
  }

  mutateClientDiagnostics((current) => ({
    ...current,
    activeCoach3DCount: activeCoach3DInstances,
    loadedGLTFCount: sessionLoadedModelPaths.size,
    loadedGLTFPaths: [...sessionLoadedModelPaths],
  }));
}

function acquireCoach3DLease(instanceId: string) {
  if (coach3DLeaseOwnerId && coach3DLeaseOwnerId !== instanceId) {
    return false;
  }

  coach3DLeaseOwnerId = instanceId;
  return true;
}

function releaseCoach3DLease(instanceId: string) {
  if (coach3DLeaseOwnerId !== instanceId) {
    return;
  }

  coach3DLeaseOwnerId = null;
  notifyCoach3DLeaseListeners();
}

function subscribeCoach3DLease(listener: () => void) {
  coach3DLeaseListeners.add(listener);
  return () => {
    coach3DLeaseListeners.delete(listener);
  };
}

function CanvasDebugRegistration() {
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    if (!diagnosticsEnabled) {
      return;
    }

    mutateClientDiagnostics((current) => ({
      ...current,
      activeThreeCanvasCount: current.activeThreeCanvasCount + 1,
    }));

    return () => {
      mutateClientDiagnostics((current) => ({
        ...current,
        activeThreeCanvasCount: Math.max(0, current.activeThreeCanvasCount - 1),
      }));
    };
  }, [gl]);

  return null;
}

export type PreviewTransform = {
  position?: [number, number, number];
  scale?: number;
  rotation?: [number, number, number];
  cameraPosition?: [number, number, number];
};

export type Coach3DPreviewFrame = "full_body" | "in_frame" | "bust";

class Coach3DErrorBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { fallback: React.ReactNode; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("[Coach3DErrorBoundary] caught:", error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

class AnimPackErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function AnimationPackLoader({
  path,
  onClipsLoaded,
}: {
  path: string;
  onClipsLoaded: (clips: AnimationClip[]) => void;
}) {
  const { animations } = useGLTF(path) as { animations: AnimationClip[] };
  useEffect(() => {
    if (animations.length) onClipsLoaded(animations);
  }, [animations, onClipsLoaded]);
  return null;
}

const HINT_CLIP_NAMES: Record<CoachAnimationHint, string[]> = {
  idle:      ["GT_Idle_Default", "GT_Idle_Default.001", "GT_Idle_Default_02", "GT_Idle_Default_03", "GT_Idle_Default_04", "GT_Idle_Default_05", "GT_Idle_Default_06", "GT_Idle_Default_07", "Idle", "idle", "StandardIdle", "Breathing"],
  talking:   ["GT_Idle_Default_05", "GT_MaximoAnimLocomotionIdletransition01", "GT_Idle_Default_03", "GT_Idle_Default_04", "Talking", "talking", "Conversation", "conversation"],
  listening: ["GT_Idle_Default_04", "GT_MaximoAnimLocomotionIdletransition02", "GT_Idle_Default_06", "Listening", "listening"],
  pointing:  ["GT_Squat_Demo", "GT_Pushup_Loop", "GT_Plank_Hold", "GT_MaximoAnimCombat3270427surpriseuppercutmaya201", "GT_Idle_Default_07", "Pointing", "pointing"],
  thumbs_up: ["GT_MaximoAnimEmoteVictory01", "GT_Dance_Hype", "ThumbsUp", "Victory", "victory"],
  warning:   ["GT_MaximoAnimEmoteDefeated01", "GT_Idle_Default_06", "Warning", "warning"],
  celebrate: ["GT_MaximoAnimEmoteVictory01", "GT_Dance_Hype", "GT_Dance_Hype_02", "GT_Dance_Hype_03", "Celebrate", "celebrate", "Dance", "dance"],
};

function findClipByCandidates(animations: AnimationClip[], candidates: string[]): AnimationClip | null {
  const normalizedCandidates = candidates.map((candidate) => candidate.toLowerCase());

  for (const clip of animations) {
    const clipName = clip.name.toLowerCase();
    if (normalizedCandidates.includes(clipName)) {
      return clip;
    }
  }

  for (const clip of animations) {
    const clipName = clip.name.toLowerCase();
    if (normalizedCandidates.some((candidate) => clipName.includes(candidate) || candidate.includes(clipName))) {
      return clip;
    }
  }

  return null;
}

function resolveClipName(hint: CoachAnimationHint, animations: AnimationClip[]): string | null {
  if (!animations.length) return null;
  return findClipByCandidates(animations, HINT_CLIP_NAMES[hint])?.name ?? null;
}

function getAnimationPackPath(modelPath: string): string {
  // The shared runtime humanoids currently rely on the fitness pack for
  // squat/push-up/plank demos and generic fallback motion.
  if (isSharedRuntimeHumanoidModel(modelPath)) return FITNESS_ANIMATION_PACK;
  return "/models/animations/nova-animations.glb";
}

function sanitizeAnimationClips(
  modelPath: string,
  clips: AnimationClip[]
): AnimationClip[] {
  if (!isSharedRuntimeHumanoidModel(modelPath)) {
    return clips;
  }

  // Clips where the character is already prone/floor-level: strip the entire
  // hips position track so FLOOR_ANCHOR_OFFSET can place the model correctly.
  // Standing clips that have vertical hip movement (squats, deadlifts): keep Y
  // so the descent is real, only zero X/Z horizontal drift.
  const FLOOR_CLIP_KEYWORDS = ["pushup", "push_up", "plank", "situp", "sit_up", "burpee", "crunch", "pike"];
  const isFloorClip = (name: string) => {
    const lower = name.toLowerCase();
    return FLOOR_CLIP_KEYWORDS.some((kw) => lower.includes(kw));
  };

  return clips.map((clip) => {
    const newTracks = clip.tracks.flatMap((track) => {
      if (track.name !== "mixamorigHips.position") return [track];
      if (isFloorClip(clip.name)) {
        // Floor pose: strip entirely; FLOOR_ANCHOR_OFFSET handles placement.
        return [];
      }
      // Standing with vertical descent: keep Y, zero X/Z drift.
      const src = (track as VectorKeyframeTrack).values;
      const values = src instanceof Float32Array ? src.slice() : Float32Array.from(src);
      for (let i = 0; i < values.length; i += 3) {
        values[i]     = 0; // X
        values[i + 2] = 0; // Z
      }
      return [new VectorKeyframeTrack(
        track.name,
        Array.from((track as VectorKeyframeTrack).times),
        values
      )];
    });
    return new AnimationClip(clip.name, clip.duration, newTracks);
  });
}

// Drops a floor-exercise pose down so the avatar's contact points (hands/knees)
// settle onto the concentric target ring instead of floating above it.
const FLOOR_ANCHOR_OFFSET = -0.85;

// Imperatively syncs camera position, FOV, and OrbitControls target whenever
// the model or frame changes — without destroying and recreating the WebGL context.
function CameraReset({
  position,
  fov,
  target,
}: {
  position: [number, number, number];
  fov: number;
  target: readonly [number, number, number];
}) {
  const { camera, controls } = useThree();
  useEffect(() => {
    camera.position.set(...position);
    (camera as { fov?: number }).fov = fov;
    camera.updateProjectionMatrix();
    if (controls) {
      const c = controls as unknown as { target: { set: (...a: number[]) => void }; update: () => void };
      c.target.set(...target);
      c.update();
    }
  }, [camera, controls, fov, position, target]);
  return null;
}

function SideOrbitCamera({
  enabled,
  orbitRadius,
  orbitY,
  orbitTarget,
}: {
  enabled: boolean;
  orbitRadius: number;
  orbitY: number;
  orbitTarget: readonly [number, number, number];
}) {
  const progressRef = React.useRef(0);

  useFrame((state, delta) => {
    if (!enabled) return;
    progressRef.current = Math.min(progressRef.current + delta * 0.42, 1);
    const p = progressRef.current;
    // Ease-in-out quadratic
    const t = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    // Sweep 0° → 75° (3/4 side profile reads spine curvature clearly)
    const angle = t * (75 * Math.PI) / 180;
    state.camera.position.set(
      Math.sin(angle) * orbitRadius,
      orbitY,
      Math.cos(angle) * orbitRadius
    );
    state.camera.lookAt(orbitTarget[0], orbitTarget[1], orbitTarget[2]);
  });

  return null;
}

function Cyclorama({
  tint,
  isNeutral,
  previewFrame,
}: {
  tint: string;
  isNeutral: boolean;
  previewFrame: Coach3DPreviewFrame;
}) {
  // Curved studio back-wall with a deep vertical canvas gradient. The lower band
  // is tinted toward the active accent so the floor grid reads as one stage.
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 4;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const isHeroStage = previewFrame === "full_body";
      const bottom = new Color(tint).multiplyScalar(isNeutral ? (isHeroStage ? 0.2 : 0.12) : 0.2).getStyle();
      const grad = ctx.createLinearGradient(0, 0, 0, 256);
      grad.addColorStop(0, isHeroStage ? "#03050b" : "#05070d");
      grad.addColorStop(0.42, isHeroStage ? "#09111b" : "#0a1018");
      grad.addColorStop(0.82, isHeroStage ? "#10192a" : "#0c1422");
      grad.addColorStop(1, bottom);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 4, 256);
    }
    const tex = new CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, [tint, isNeutral]);

  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <mesh position={[0, previewFrame === "full_body" ? 4.35 : 4, previewFrame === "full_body" ? -2.5 : -2.2]} renderOrder={-10}>
      {/* Back half of an open cylinder → seamless curved wall wrapping behind the model */}
      <cylinderGeometry args={[previewFrame === "full_body" ? 8.3 : 7.5, previewFrame === "full_body" ? 8.3 : 7.5, previewFrame === "full_body" ? 18 : 16, 48, 1, true, Math.PI / 2, Math.PI]} />
      <meshBasicMaterial map={texture} side={1 /* BackSide */} depthWrite={false} fog />
    </mesh>
  );
}

function NeonFloorGrid({
  rimColor,
  isNeutral,
  previewFrame,
}: {
  rimColor: string;
  isNeutral: boolean;
  previewFrame: Coach3DPreviewFrame;
}) {
  const SPOKE_COUNT = 12;
  const isHeroStage = previewFrame === "full_body";
  const outerRadius = isHeroStage ? 2.7 : 2.15;
  const midRadius = isHeroStage ? 1.7 : 1.3;

  const spokePositions = useMemo(() => {
    const arr = new Float32Array(SPOKE_COUNT * 6);
    for (let i = 0; i < SPOKE_COUNT; i++) {
      const angle = (i / SPOKE_COUNT) * Math.PI * 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const base = i * 6;
      arr[base] = 0; arr[base + 1] = 0; arr[base + 2] = 0;
      arr[base + 3] = cos * outerRadius; arr[base + 4] = 0; arr[base + 5] = sin * outerRadius;
    }
    return arr;
  }, []);

  return (
    <group position={[0, -0.175, 0]}>
      {/* Subtle floor glow fill */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[outerRadius, 60]} />
        <meshBasicMaterial color={rimColor} transparent opacity={isNeutral ? (isHeroStage ? 0.1 : 0.06) : 0.04} depthWrite={false} />
      </mesh>

      {/* Radial spokes */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[spokePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={rimColor} transparent opacity={isNeutral ? (isHeroStage ? 0.16 : 0.1) : 0.13} />
      </lineSegments>

      {/* Inner concentric ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[midRadius, 0.011, 4, 56]} />
        <meshBasicMaterial color={rimColor} transparent opacity={isNeutral ? 0.22 : 0.28} depthWrite={false} />
      </mesh>

      {/* Outer neon boundary ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[outerRadius, 0.028, 6, 80]} />
        <meshBasicMaterial color={rimColor} transparent opacity={isNeutral ? 0.52 : 0.70} depthWrite={false} />
      </mesh>
    </group>
  );
}

function CoachModel({
  modelPath,
  transform,
  animationHint,
  demoClipName,
  animate,
  freezeAnimation = false,
  isSpeaking,
  onClipsDetected,
  playbackSpeed = 1,
  showSkeleton = false,
  isPaused = false,
  spineHighlightActive = false,
  isFloorMovement = false,
}: {
  modelPath: string;
  transform: ModelTransform;
  animationHint: CoachAnimationHint;
  demoClipName?: string | null;
  animate: boolean;
  freezeAnimation?: boolean;
  isSpeaking?: boolean;
  onClipsDetected?: (clips: string[]) => void;
  playbackSpeed?: number;
  showSkeleton?: boolean;
  isPaused?: boolean;
  spineHighlightActive?: boolean;
  isFloorMovement?: boolean;
}) {
  const modelGroupRef = React.useRef<Group>(null);
  const dynamicShadowRef = React.useRef<Mesh>(null);
  const spineBoneRefs = React.useRef<Object3D[]>([]);
  const spineVecRef = React.useRef(new Vector3());
  const spineColorRef = React.useRef(new Color("#38bdf8"));
  // Neon path overlay tracing the spine — built imperatively so we can rewrite
  // vertex positions every frame from live bone world transforms.
  const spineLine = useMemo(() => {
    const MAX_SPINE_POINTS = 8;
    const positions = new Float32Array(MAX_SPINE_POINTS * 3);
    const geo = new BufferGeometry();
    geo.setAttribute("position", new BufferAttribute(positions, 3));
    geo.setDrawRange(0, 0);
    const mat = new LineBasicMaterial({
      color: "#38bdf8",
      transparent: true,
      opacity: 0,
      depthTest: false,
      depthWrite: false,
    });
    const line = new Line(geo, mat);
    line.frustumCulled = false;
    line.renderOrder = 999;
    return line;
  }, []);
  const neonBlue = useMemo(() => new Color("#38bdf8"), []);   // Cat / arch-up
  const neonGreen = useMemo(() => new Color("#22c55e"), []);  // Cow / drop-down
  const headBoneRef = React.useRef<Object3D | null>(null);
  const earBoneRef = React.useRef<Object3D | null>(null);
  const rEarBoneRef = React.useRef<Object3D | null>(null);
  const { scene, animations: embeddedClips } = useGLTF(modelPath) as {
    scene: Object3D;
    animations: AnimationClip[];
  };
  // skeletonClone rebinds the SkinnedMesh to the cloned skeleton.
  // scene.clone() leaves the mesh pointing at the original bones — animations appear frozen.
  const clonedScene = useMemo(() => createOwnedSceneInstance(scene), [scene]);
  const skeletonHelper = useMemo(() => {
    if (!showSkeleton) return null;
    const helper = new SkeletonHelper(clonedScene);
    helper.name = "coach-skeleton-helper";
    return helper;
  }, [clonedScene, showSkeleton]);
  const [externalClips, setExternalClips] = useState<AnimationClip[]>([]);
  const [fitnessClips, setFitnessClips] = useState<AnimationClip[]>([]);
  // A duration-0 clip is a T-pose/bind-pose placeholder, not a real animation.
  // Treat the model as having no embedded animations so the external pack loads.
  const hasRealEmbeddedClips = embeddedClips.some((c) => c.duration > 0);
  const baseAnimations = useMemo(() => {
    const base = hasRealEmbeddedClips ? embeddedClips : externalClips;
    return sanitizeAnimationClips(modelPath, base);
  }, [hasRealEmbeddedClips, embeddedClips, externalClips, modelPath]);
  const demoAnimations = useMemo(
    () => sanitizeAnimationClips(modelPath, fitnessClips),
    [fitnessClips, modelPath]
  );
  const animations = useMemo(() => {
    if (!animate && !freezeAnimation) {
      return [];
    }
    if (demoClipName) {
      return demoAnimations.length ? demoAnimations : baseAnimations;
    }
    return demoAnimations.length ? [...baseAnimations, ...demoAnimations] : baseAnimations;
  }, [animate, baseAnimations, demoAnimations, demoClipName, freezeAnimation]);
  // Own the mixer directly — bound to clonedScene so Three.js finds bones immediately.
  const mixerRef = React.useRef<AnimationMixer | null>(null);
  const activeActionRef = React.useRef<string | null>(null);
  // Accumulated elapsed time driven by useFrame delta — avoids accessing state.clock
  // directly (THREE.Clock is deprecated in Three.js r176+; R3F provides delta instead).
  const elapsedRef = React.useRef(0);

  useEffect(() => {
    if (!sessionLoadedModelPaths.has(modelPath)) {
      sessionLoadedModelPaths.add(modelPath);
      console.info(`[Coach3D] session model load: ${modelPath}`);
      syncCoach3DDiagnostics();
      return;
    }

    console.info(`[Coach3D] reusing cached model: ${modelPath}`);
    syncCoach3DDiagnostics();
  }, [modelPath]);

  useEffect(() => {
    const m = new AnimationMixer(clonedScene);
    mixerRef.current = m;
    activeActionRef.current = null;
    return () => {
      m.stopAllAction();
      m.uncacheRoot(clonedScene);
      mixerRef.current = null;
    };
  }, [clonedScene]);

  useEffect(() => {
    if (skeletonHelper) {
      return () => {
        skeletonHelper.dispose();
      };
    }
  }, [skeletonHelper]);

  useEffect(() => {
    if (!mixerRef.current) return;
    mixerRef.current.timeScale = freezeAnimation || isPaused ? 0 : playbackSpeed;
  }, [freezeAnimation, isPaused, playbackSpeed]);

  // Idle variant cycling — rotate through idle clips every 25s so the coach never looks frozen
  const idleClipsRef = React.useRef<string[]>([]);
  const [idleIdx, setIdleIdx] = useState(0);

  useEffect(() => {
    if (!animations.length) return;
    const variants = (HINT_CLIP_NAMES.idle as string[])
      .map((name) => animations.find((c) => c.name === name)?.name)
      .filter((n): n is string => Boolean(n));
    idleClipsRef.current = variants;
  }, [animations]);

  useEffect(() => {
    if (animationHint !== "idle" || demoClipName) return;
    const t = setInterval(() => {
      setIdleIdx((prev) => {
        const len = idleClipsRef.current.length;
        if (len <= 1) return 0;
        let next: number;
        do { next = Math.floor(Math.random() * len); } while (next === prev);
        return next;
      });
    }, 25000);
    return () => clearInterval(t);
  }, [animationHint, demoClipName]);
  useEffect(() => {
    headBoneRef.current = null;
    earBoneRef.current = null;
    rEarBoneRef.current = null;
    const SPINE_BONE_NAMES = new Set([
      'mixamorigHips', 'mixamorigSpine', 'mixamorigSpine1',
      'mixamorigSpine2', 'mixamorigNeck', 'mixamorigHead',
    ]);
    const spineFound: Object3D[] = [];
    clonedScene.traverse((obj: Object3D) => {
      obj.visible = true;
      if ((obj as { isMesh?: boolean }).isMesh) {
        obj.frustumCulled = false;
        (obj as { castShadow?: boolean }).castShadow = true;
        (obj as { receiveShadow?: boolean }).receiveShadow = true;
      }
      if (obj.name === "head") headBoneRef.current = obj;
      else if (obj.name === "earend") earBoneRef.current = obj;
      else if (obj.name === "R_earend") rEarBoneRef.current = obj;
      if (SPINE_BONE_NAMES.has(obj.name)) spineFound.push(obj);
    });
    // Sort bottom-to-top so the line runs hips → head
    spineBoneRefs.current = spineFound.sort((a, b) => {
      const av = new Vector3(), bv = new Vector3();
      a.getWorldPosition(av); b.getWorldPosition(bv);
      return av.y - bv.y;
    });
  }, [clonedScene]);

  useEffect(() => {
    const m = mixerRef.current;
    if (!m || !animations.length) return;

    const targetClipName = demoClipName
      ? (animations.find((c) => c.name === demoClipName)?.name ?? resolveClipName(animationHint, animations))
      : animationHint === "idle" && idleClipsRef.current[idleIdx]
        ? idleClipsRef.current[idleIdx]
        : resolveClipName(animationHint, animations);
    if (!targetClipName) return;
    if (activeActionRef.current === targetClipName) return;

    const ONE_SHOT_HINTS: CoachAnimationHint[] = ["thumbs_up", "pointing", "celebrate"];
    const isOneShot = !demoClipName && ONE_SHOT_HINTS.includes(animationHint);

    const targetClip = animations.find((c) => c.name === targetClipName);
    if (!targetClip) return;

    // clipAction with no second arg uses the mixer's root (clonedScene) — correct.
    const incoming = m.clipAction(targetClip);
    if (!incoming) return;

    const prevName = activeActionRef.current;
    const oldAction =
      prevName && prevName !== targetClipName
        ? (() => {
            const prevClip = animations.find((c) => c.name === prevName);
            return prevClip ? m.clipAction(prevClip) : null;
          })()
        : null;

    oldAction?.fadeOut(0.2);
    incoming.reset().fadeIn(0.2);
    incoming.setLoop(isOneShot ? LoopOnce : LoopRepeat, isOneShot ? 1 : Infinity);
    incoming.play();
    activeActionRef.current = targetClipName;

    if (isOneShot) {
      const idleClipName = resolveClipName("idle", animations);
      const onFinish = () => {
        if (idleClipName && activeActionRef.current === targetClipName) {
          incoming.fadeOut(0.2);
          const idleClip = animations.find((c) => c.name === idleClipName);
          if (idleClip) {
            const idleAction = m.clipAction(idleClip);
            idleAction.reset().fadeIn(0.2).play();
            activeActionRef.current = idleClipName;
          }
        }
      };
      m.addEventListener("finished", onFinish);
      return () => m.removeEventListener("finished", onFinish);
    }
  }, [animationHint, demoClipName, animations, freezeAnimation, idleIdx]);

  useEffect(() => {
    onClipsDetected?.(animations.map((c) => c.name));
  }, [animations, onClipsDetected]);

  // Per-frame neon spine path overlay. Traces hips→head, color-coded by curvature:
  // arch up (Cat) → neon blue, sag down (Cow) → neon green, with a pulsing glow.
  const updateSpineHighlight = (group: Group, elapsed: number) => {
    const mat = spineLine.material as LineBasicMaterial;
    const bones = spineBoneRefs.current;
    if (!spineHighlightActive || bones.length < 2) {
      if (mat.opacity !== 0) {
        mat.opacity = 0;
        spineLine.visible = false;
      }
      return;
    }
    spineLine.visible = true;
    group.updateWorldMatrix(true, false);

    const tmp = spineVecRef.current;
    bones[0].getWorldPosition(tmp);
    const hipsY = tmp.y;
    bones[bones.length - 1].getWorldPosition(tmp);
    const headY = tmp.y;
    bones[Math.floor(bones.length / 2)].getWorldPosition(tmp);
    const deviation = tmp.y - (hipsY + headY) / 2;

    const geo = spineLine.geometry;
    const posAttr = geo.getAttribute("position") as BufferAttribute;
    for (let i = 0; i < bones.length; i++) {
      bones[i].getWorldPosition(tmp);
      group.worldToLocal(tmp);
      posAttr.setXYZ(i, tmp.x, tmp.y, tmp.z);
    }
    posAttr.needsUpdate = true;
    geo.setDrawRange(0, bones.length);

    // deviation > 0 (mid-spine above the hips↔head chord) = arch = Cat = blue
    const tNorm = Math.max(0, Math.min(1, deviation * 9 + 0.5));
    spineColorRef.current.copy(neonGreen).lerp(neonBlue, tNorm);
    mat.color.copy(spineColorRef.current);
    mat.opacity = 0.55 + Math.sin(elapsed * 4.2) * 0.35;
  };

  useFrame((_state, delta) => {
    mixerRef.current?.update(delta);
    elapsedRef.current += delta;

    const group = modelGroupRef.current;
    if (!group) return;

    const elapsed = elapsedRef.current;
    const hasRealAnimations = animations.length > 0;

    if (hasRealAnimations) {
      // Subtle speaking bob — Y bounce proportional to speech amplitude approximated by sine
      const speakBob = isSpeaking ? Math.abs(Math.sin(elapsed * 8.5)) * 0.009 : 0;
      // Gentle ambient sway so the coach never feels frozen
      const ambientSway = Math.sin(elapsed * 0.38) * 0.055;
      group.position.x = transform.position[0];
      group.position.y = transform.position[1] + speakBob;
      group.position.z = transform.position[2];
      group.rotation.x = transform.rotation[0];
      group.rotation.y = transform.rotation[1] + ambientSway;
      group.rotation.z = transform.rotation[2];

      // Procedural ear flick added on top of whatever the mixer set this frame
      // earend / R_earend are tip bones — rotating x creates a forward/back flick
      const earWave = Math.sin(elapsed * 1.6) * 0.07;
      const earMoodOffset =
        animationHint === "celebrate" ? -0.4 :
        animationHint === "warning"   ?  0.32 :
        isSpeaking                    ?  Math.sin(elapsed * 6) * 0.12 :
                                         0;
      if (earBoneRef.current) {
        earBoneRef.current.rotation.x = earBoneRef.current.rotation.x + earWave + earMoodOffset;
      }
      if (rEarBoneRef.current) {
        rEarBoneRef.current.rotation.x = rEarBoneRef.current.rotation.x + earWave + earMoodOffset;
      }
      // Dynamic shadow — real-animation branch (Y lift is minimal: only speakBob)
      if (dynamicShadowRef.current) {
        dynamicShadowRef.current.position.y = -0.175 - group.position.y;
        dynamicShadowRef.current.scale.setScalar(1);
        (dynamicShadowRef.current.material as { opacity: number }).opacity = 0.12;
      }
      updateSpineHighlight(group, elapsed);
      return;
    }

    const motionByHint: Record<
      CoachAnimationHint,
      {
        floatAmplitude: number;
        floatSpeed: number;
        tiltAmplitude: number;
        turnAmplitude: number;
        forwardOffset: number;
        rollAmplitude: number;
        extraBounce: number;
      }
    > = {
      idle: {
        floatAmplitude: 0,
        floatSpeed: 0,
        tiltAmplitude: 0,
        turnAmplitude: 0.005,
        forwardOffset: 0,
        rollAmplitude: 0,
        extraBounce: 0,
      },
      talking: {
        floatAmplitude: 0.065,
        floatSpeed: 1.9,
        tiltAmplitude: 0.045,
        turnAmplitude: 0.055,
        forwardOffset: 0.04,
        rollAmplitude: 0.018,
        extraBounce: 0.012,
      },
      listening: {
        floatAmplitude: 0.06,
        floatSpeed: 1.55,
        tiltAmplitude: 0.04,
        turnAmplitude: 0.045,
        forwardOffset: 0.08,
        rollAmplitude: 0.014,
        extraBounce: 0.008,
      },
      pointing: {
        floatAmplitude: 0.055,
        floatSpeed: 1.45,
        tiltAmplitude: 0.05,
        turnAmplitude: 0.095,
        forwardOffset: 0.05,
        rollAmplitude: 0.02,
        extraBounce: 0.01,
      },
      thumbs_up: {
        floatAmplitude: 0.08,
        floatSpeed: 2,
        tiltAmplitude: 0.04,
        turnAmplitude: 0.05,
        forwardOffset: 0.05,
        rollAmplitude: 0.02,
        extraBounce: 0.02,
      },
      warning: {
        floatAmplitude: 0.05,
        floatSpeed: 2.15,
        tiltAmplitude: 0.06,
        turnAmplitude: 0.08,
        forwardOffset: 0.06,
        rollAmplitude: 0.024,
        extraBounce: 0.016,
      },
      celebrate: {
        floatAmplitude: 0.12,
        floatSpeed: 2.6,
        tiltAmplitude: 0.08,
        turnAmplitude: 0.14,
        forwardOffset: 0.08,
        rollAmplitude: 0.04,
        extraBounce: 0.04,
      },
    };

    const motion = motionByHint[animationHint];
    const baseY =
      transform.position[1] +
      (motion.floatSpeed > 0 ? Math.sin(elapsed * motion.floatSpeed) * motion.floatAmplitude : 0);
    const bounceY =
      motion.floatSpeed > 0
        ? Math.max(0, Math.sin(elapsed * motion.floatSpeed * 1.45)) * motion.extraBounce
        : 0;
    const turnY = transform.rotation[1] + Math.sin(elapsed * 0.7) * motion.turnAmplitude;
    const tiltX = transform.rotation[0] + Math.sin(elapsed * 0.85) * motion.tiltAmplitude;
    const rollZ = transform.rotation[2] + Math.sin(elapsed * 0.65) * motion.rollAmplitude;
    const forwardZ =
      transform.position[2] +
      motion.forwardOffset +
      (motion.floatSpeed > 0 ? Math.sin(elapsed * 0.9) * 0.02 : 0);

    group.position.y = baseY + bounceY;
    group.position.z = forwardZ;
    group.rotation.x = tiltX;
    group.rotation.y = turnY;
    group.rotation.z = rollZ;

    // Dynamic shadow — fallback animation branch (Y lifts up to ~0.12 for celebrate)
    if (dynamicShadowRef.current) {
      dynamicShadowRef.current.position.y = -0.175 - group.position.y;
      const lift = Math.max(0, group.position.y - transform.position[1]);
      dynamicShadowRef.current.scale.setScalar(1 + lift * 0.28);
      (dynamicShadowRef.current.material as { opacity: number }).opacity = Math.max(0.03, 0.12 - lift * 0.08);
    }
    updateSpineHighlight(group, elapsed);
  });

  const animPackPath = getAnimationPackPath(modelPath);

  return (
    <group ref={modelGroupRef}>
      {/* Dynamic contact shadow disc — kept at world floor Y, scales with avatar lift */}
      <mesh
        ref={dynamicShadowRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -transform.position[1] - 0.175, 0]}
        renderOrder={-1}
      >
        <circleGeometry args={[1.05, 40]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.12} depthWrite={false} />
      </mesh>

      {animate && !hasRealEmbeddedClips && (
        <Suspense fallback={null}>
          <AnimPackErrorBoundary>
            <AnimationPackLoader path={animPackPath} onClipsLoaded={setExternalClips} />
          </AnimPackErrorBoundary>
        </Suspense>
      )}
      {animate && demoClipName && (
        <Suspense fallback={null}>
          <AnimPackErrorBoundary>
            <AnimationPackLoader
              path={FITNESS_ANIMATION_PACK}
              onClipsLoaded={setFitnessClips}
            />
          </AnimPackErrorBoundary>
        </Suspense>
      )}
      {/* Z-up correction wrapper for Blender-exported models without Y-up conversion. */}
      <group rotation={
        (modelPath === GYMTWIN_FEMALE_MODEL_PATH || modelPath === GYMTWIN_MALE_MODEL_PATH)
          ? [-Math.PI / 2, 0, 0]
          : [0, 0, 0]
      }>
        <primitive
          object={clonedScene}
          scale={transform.scale}
          position={[0, isFloorMovement ? FLOOR_ANCHOR_OFFSET : 0, 0]}
        />
      </group>
      {/* Neon spine path overlay — hips→head, color reacts to spinal curvature */}
      <primitive object={spineLine} />
      {skeletonHelper ? (
        <primitive object={skeletonHelper} />
      ) : null}
    </group>
  );
}

function LoadingSceneLabel() {
  return (
    <Html center>
      <div className="rounded-full border border-white/10 bg-slate-950/72 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-slate-200 backdrop-blur-md" style={{ color: "lime", background: "rgba(0,0,0,0.85)", fontSize: 14, whiteSpace: "nowrap" }}>
        ⏳ Loading 3D Coach
      </div>
    </Html>
  );
}

function getMoodSceneMeta(mood: Coach3DMood): MoodSceneMeta {
  switch (mood) {
    case "listening":
      return {
        gradient: "from-cyan-500/22 via-blue-500/18 to-slate-950",
        border: "border-cyan-400/28",
        glow: "shadow-[0_0_44px_rgba(34,211,238,0.18)]",
        accentText: "text-cyan-100",
        pill: "border-cyan-400/24 bg-cyan-500/12 text-cyan-100",
        lightA: "#22d3ee",
        lightB: "#818cf8",
        modelScale: 1.62,
        lightIntensityA: 1.4,
        lightIntensityB: 16,
      };
    case "good":
      return {
        gradient: "from-emerald-500/22 via-blue-500/18 to-slate-950",
        border: "border-emerald-400/28",
        glow: "shadow-[0_0_44px_rgba(16,185,129,0.18)]",
        accentText: "text-emerald-100",
        pill: "border-emerald-400/24 bg-emerald-500/12 text-emerald-100",
        lightA: "#34d399",
        lightB: "#60a5fa",
        modelScale: 1.64,
        lightIntensityA: 1.35,
        lightIntensityB: 15,
      };
    case "warning":
      return {
        gradient: "from-cyan-500/22 via-fuchsia-500/16 to-slate-950",
        border: "border-cyan-400/28",
        glow: "shadow-[0_0_44px_rgba(34,211,238,0.18)]",
        accentText: "text-cyan-100",
        pill: "border-cyan-400/24 bg-cyan-500/12 text-cyan-100",
        lightA: "#22d3ee",
        lightB: "#c084fc",
        modelScale: 1.63,
        lightIntensityA: 1.45,
        lightIntensityB: 15,
      };
    case "error":
      return {
        gradient: "from-red-500/22 via-fuchsia-500/14 to-slate-950",
        border: "border-red-400/28",
        glow: "shadow-[0_0_44px_rgba(239,68,68,0.18)]",
        accentText: "text-red-100",
        pill: "border-red-400/24 bg-red-500/12 text-red-100",
        lightA: "#ef4444",
        lightB: "#fb7185",
        modelScale: 1.6,
        lightIntensityA: 1.5,
        lightIntensityB: 16,
      };
    case "celebrating":
      return {
        gradient: "from-fuchsia-500/24 via-cyan-400/16 to-slate-950",
        border: "border-fuchsia-400/28",
        glow: "shadow-[0_0_48px_rgba(217,70,239,0.2)]",
        accentText: "text-fuchsia-100",
        pill: "border-fuchsia-400/24 bg-fuchsia-500/12 text-fuchsia-100",
        lightA: "#d946ef",
        lightB: "#22d3ee",
        modelScale: 1.68,
        lightIntensityA: 1.55,
        lightIntensityB: 17,
      };
    case "coaching":
      return {
        gradient: "from-blue-500/22 via-violet-500/16 to-slate-950",
        border: "border-blue-400/28",
        glow: "shadow-[0_0_44px_rgba(59,130,246,0.18)]",
        accentText: "text-blue-100",
        pill: "border-blue-400/24 bg-blue-500/12 text-blue-100",
        lightA: "#60a5fa",
        lightB: "#8b5cf6",
        modelScale: 1.66,
        lightIntensityA: 1.45,
        lightIntensityB: 16,
      };
    default:
      return {
        gradient: "from-blue-500/20 via-fuchsia-500/14 to-slate-950",
        border: "border-purple-500/28",
        glow: "shadow-[0_0_42px_rgba(99,102,241,0.18)]",
        accentText: "text-slate-100",
        pill: "border-white/10 bg-white/5 text-slate-200",
        lightA: "#60a5fa",
        lightB: "#a855f7",
        modelScale: 1.6,
        lightIntensityA: 1.3,
        lightIntensityB: 14,
      };
  }
}

export function getCoachModelTransformPreset(
  modelPath: string,
  previewFrame: Coach3DPreviewFrame = "in_frame"
): ModelTransform {
  // New 43K male model: Z-up from Blender. Rotation wrapper corrects to Y-up (1.80m).
  // Feet at Y=0 naturally after rotation — no position offset needed.
  if (modelPath === GYMTWIN_MALE_MODEL_PATH) {
    const base = {
      position: [0, 0, 0] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
      scale: 1.15,
    };
    if (previewFrame === "bust") {
      return { ...base, cameraPosition: [0, 1.55, 4.8], fovCompact: 32, fovDefault: 28, orbitTarget: [0, 1.50, 0] };
    }
    if (previewFrame === "full_body") {
      return { ...base, scale: 1.2, cameraPosition: [0, 1.15, 3.2], fovCompact: 44, fovDefault: 37, orbitTarget: [0, 1.0, 0] };
    }
    return { ...base, cameraPosition: [0, 1.38, 4.2], fovCompact: 36, fovDefault: 32, orbitTarget: [0, 1.26, 0] };
  }

  // New female model: exported from Blender with Z-up. A -π/2 X-rotation wrapper in
  // CoachModel corrects the orientation so the character stands upright (1.70m, Y-up).
  // Feet land at Y=0 naturally after the rotation — no position offset needed.
  if (modelPath === GYMTWIN_FEMALE_MODEL_PATH) {
    const base = {
      position: [0, 0, 0] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
      scale: 1.15,
    };
    if (previewFrame === "bust") {
      return { ...base, cameraPosition: [0, 1.45, 4.8], fovCompact: 32, fovDefault: 28, orbitTarget: [0, 1.40, 0] };
    }
    if (previewFrame === "full_body") {
      return { ...base, scale: 1.2, cameraPosition: [0, 1.1, 3.2], fovCompact: 44, fovDefault: 37, orbitTarget: [0, 0.95, 0] };
    }
    return { ...base, cameraPosition: [0, 1.3, 4.2], fovCompact: 36, fovDefault: 32, orbitTarget: [0, 1.2, 0] };
  }

  if (isSharedRuntimeHumanoidModel(modelPath)) {
    // Character is 2.45m tall (Y=0 floor to Y=2.45 head) after fitScale.
    // Each frame gets its own camera so tuning one context never bleeds into another.
    const base = {
      position: [0, 0.18, 0] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
      scale: 1.3,
    };
    if (previewFrame === "bust") {
      return { ...base, cameraPosition: [0, 1.62, 5.2], fovCompact: 32, fovDefault: 28, orbitTarget: [0, 1.58, 0] };
    }
    if (previewFrame === "full_body") {
      return {
        ...base,
        scale: 1.38,
        cameraPosition: [0, 1.28, 3.15],
        fovCompact: 44,
        fovDefault: 37,
        orbitTarget: [0, 1.12, 0],
      };
    }
    return { ...base, cameraPosition: [0, 1.46, 4.2], fovCompact: 36, fovDefault: 32, orbitTarget: [0, 1.36, 0] };
  }

  const base = {
    position: [0, -0.68, 0] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
    scale: 1.26,
  };
  if (previewFrame === "bust") {
    return { ...base, cameraPosition: [0, 1.5, 1.8], fovCompact: 30, fovDefault: 24, orbitTarget: [0, 1.3, 0] };
  }
  return { ...base, cameraPosition: [0, 1, 4.8], fovCompact: 34, fovDefault: 31, orbitTarget: [0, 0.42, 0] };
}

function mergePreviewTransform(
  baseTransform: ModelTransform,
  previewTransform?: PreviewTransform
): ModelTransform {
  if (!previewTransform) {
    return baseTransform;
  }

  return {
    ...baseTransform,
    position: previewTransform.position ?? baseTransform.position,
    scale: previewTransform.scale ?? baseTransform.scale,
    rotation: previewTransform.rotation ?? baseTransform.rotation,
    cameraPosition: previewTransform.cameraPosition ?? baseTransform.cameraPosition,
  };
}

function CoachFallback({
  avatarLabel,
  meta,
  compact,
  animationHint,
  reason = "3D model coming soon",
}: {
  avatarLabel: string;
  meta: MoodSceneMeta;
  compact: boolean;
  animationHint: CoachAnimationHint;
  reason?: string;
}) {
  const fallbackMotionClass =
    animationHint === "celebrate"
      ? "coach-celebrate"
      : animationHint === "warning"
        ? "coach-pulse"
        : animationHint === "listening"
          ? "coach-float coach-pulse"
          : animationHint === "talking" || animationHint === "thumbs_up" || animationHint === "pointing"
            ? "coach-float"
            : "coach-float";
  return (
    <div className={`rounded-[1.5rem] border ${meta.border} bg-slate-950/72 p-4 ${meta.glow}`}>
      <div className={`relative overflow-hidden rounded-[1.35rem] border border-white/8 bg-gradient-to-br ${meta.gradient} ${compact ? "min-h-[220px]" : "min-h-[280px]"} p-5`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_30%),linear-gradient(180deg,transparent,rgba(2,6,23,0.5))]" />
        <div className="relative flex h-full flex-col items-end justify-between p-4">
          {/* Full-height avatar silhouette — no circular clip */}
          <div className={`${fallbackMotionClass} coach-halo pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-center`}>
            <div className="relative flex h-[80%] w-24 flex-col items-center justify-end sm:w-28">
              {/* Head */}
              <div className="mb-1 h-12 w-12 rounded-full border border-white/14 bg-gradient-to-br from-blue-400/30 via-slate-700/60 to-slate-900/80 shadow-[0_0_24px_rgba(99,102,241,0.28)] sm:h-14 sm:w-14" />
              {/* Body */}
              <div className="h-28 w-20 rounded-t-[2rem] border border-white/10 bg-gradient-to-b from-slate-700/60 via-slate-800/70 to-transparent sm:w-24" />
            </div>
          </div>
          {/* Name pill — top left */}
          <div className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${meta.pill}`}>
            {avatarLabel}
          </div>
          {/* Status — bottom left, above overlay gradient */}
          <p className={`text-[10px] font-black uppercase tracking-[0.22em] ${meta.accentText} opacity-70`}>
            {reason}
          </p>
        </div>
      </div>
    </div>
  );
}


export function Coach3D({
  selectedAvatar,
  mood = "idle",
  compact = false,
  animate = true,
  freezeAnimation = false,
  modelPathOverride,
  animationHint = "idle",
  animationClipId: _animationClipId,
  demoClipName,
  previewTransform,
  previewFrame = "in_frame",
  lightingMode = "mood",
  manualTuning = false,
  onClipsDetected,
  message,
  viewportClassName,
  cameraTargetOverride,
  fovOverride,
  playbackSpeed = 1,
  showSkeleton = false,
  isPaused = false,
  isFloorMovement = false,
}: Coach3DProps) {
  void _animationClipId;
  const effectiveDemoClipName = ENABLE_EXERCISE_DEMOS ? demoClipName : null;
  const { isSpeaking } = useCoachSpeech(message);
  const [modelStatus, setModelStatus] = useState<ModelStatus>("checking");
  const [resolvedModelPath, setResolvedModelPath] = useState<string | null>(null);
  const [hasCanvasLease, setHasCanvasLease] = useState(false);
  const orbitControlsRef = React.useRef<OrbitControlsImpl | null>(null);
  const instanceIdRef = React.useRef(`coach3d-${++coach3DInstanceSequence}`);
  const duplicateWarningShownRef = React.useRef(false);

  const avatarLabel = getAvatarLabel(selectedAvatar);
  const candidateModelPaths = useMemo(
    () => (modelPathOverride ? [modelPathOverride] : getAvatarModelPaths(selectedAvatar)),
    [modelPathOverride, selectedAvatar]
  );
  const meta = getMoodSceneMeta(mood);
  const isNeutralLighting = lightingMode === "neutral";

  useEffect(() => {
    if (!ENABLE_COACH3D) {
      return;
    }

    const instanceId = instanceIdRef.current;
    activeCoach3DInstances += 1;
    console.info(`[Coach3D] mount ${instanceId}; active instances=${activeCoach3DInstances}`);
    syncCoach3DDiagnostics();

    const syncLease = () => {
      const granted = acquireCoach3DLease(instanceId);
      setHasCanvasLease((current) => (current === granted ? current : granted));

      if (granted) {
        duplicateWarningShownRef.current = false;
        return;
      }

      if (!duplicateWarningShownRef.current) {
        duplicateWarningShownRef.current = true;
        console.warn(
          `[Coach3D] duplicate mount blocked for ${instanceId}; active instances=${activeCoach3DInstances}`
        );
      }
    };

    syncLease();
    const unsubscribe = subscribeCoach3DLease(syncLease);

    return () => {
      unsubscribe();
      releaseCoach3DLease(instanceId);
      activeCoach3DInstances = Math.max(0, activeCoach3DInstances - 1);
      console.info(`[Coach3D] unmount ${instanceId}; active instances=${activeCoach3DInstances}`);
      syncCoach3DDiagnostics();
    };
  }, []);

  const modelTransform = useMemo(() => {
    const activePath = resolvedModelPath ?? modelPathOverride ?? candidateModelPaths[0] ?? "";
    const baked = getCoachModelTransformPreset(activePath, previewFrame);
    // Saved presets come from Model Lab and are keyed by frame type so every
    // screen can share the same authored viewport language.
    const saved = loadTransformPreset(activePath, previewFrame);
    const withSaved = mergePreviewTransform(baked, saved ?? undefined);
    return mergePreviewTransform(withSaved, previewTransform);
  }, [candidateModelPaths, modelPathOverride, previewFrame, previewTransform, resolvedModelPath]);

  useEffect(() => {
    if (!ENABLE_COACH3D || !hasCanvasLease) {
      return;
    }

    let cancelled = false;

    async function checkModel() {
      setModelStatus("checking");
      setResolvedModelPath(null);

      let hadRequestError = false;

      for (const candidatePath of candidateModelPaths) {
        const cachedAvailability = verifiedModelAvailability.get(candidatePath);
        if (cachedAvailability === true) {
          if (!cancelled) {
            setResolvedModelPath(candidatePath);
            setModelStatus("available");
            if (!sessionResolvedModelPaths.has(candidatePath)) {
              sessionResolvedModelPaths.add(candidatePath);
              console.info(`[Coach3D] model verified for session: ${candidatePath}`);
            } else {
              console.info(`[Coach3D] model availability reused from session cache: ${candidatePath}`);
            }
          }
          return;
        }

        if (cachedAvailability === false) {
          continue;
        }

        try {
          const response = await fetch(candidatePath, { method: "HEAD" });
          if (cancelled) return;

          // 401/403 means the server has the file but Vercel deployment protection
          // is active. The browser's auth cookie will be sent on the actual GLB
          // fetch, so treat auth responses as "model is present".
          const modelPresent = response.ok || response.status === 401 || response.status === 403;
          if (modelPresent) {
            verifiedModelAvailability.set(candidatePath, true);
            setResolvedModelPath(candidatePath);
            setModelStatus("available");
            if (!sessionResolvedModelPaths.has(candidatePath)) {
              sessionResolvedModelPaths.add(candidatePath);
              console.info(`[Coach3D] model verified for session: ${candidatePath}`);
            }
            return;
          }
          verifiedModelAvailability.set(candidatePath, false);
        } catch {
          hadRequestError = true;
        }
      }

      if (cancelled) return;
      setModelStatus(hadRequestError ? "error" : "missing");
    }

    void checkModel();

    return () => {
      cancelled = true;
    };
  }, [candidateModelPaths, hasCanvasLease]);

  const fallbackReason = !ENABLE_COACH3D
    ? "3D coach disabled by feature flag."
    : !hasCanvasLease
    ? "3D preview paused because another Coach3D canvas is already active."
    : modelStatus === "checking"
      ? "Checking selected 3D model path."
      : modelStatus === "error"
        ? "The model file could not be loaded right now. Check the path and local server."
        : selectedAvatar === "Atlas"
          ? "Add the shared Meshy runtime GLB to public/models to enable the live 3D preview."
          : "Add the matching .glb file to public/models to enable the live 3D preview.";

  const fallbackNode = (
    <CoachFallback
      avatarLabel={avatarLabel}
      meta={meta}
      compact={compact}
      animationHint={animationHint}
      reason={fallbackReason}
    />
  );

  if (!hasCanvasLease || modelStatus !== "available" || !resolvedModelPath) {
    return fallbackNode;
  }

  const isHeroFullBody = previewFrame === "full_body";
  const stageGradient = isNeutralLighting
    ? isHeroFullBody
      ? "from-slate-700/95 via-[#131e33] to-[#050914]"
      : "from-slate-700/95 via-slate-800/92 to-[#0f172a]"
    : meta.gradient;
  const backgroundColor = isNeutralLighting ? (isHeroFullBody ? "#0a1020" : "#1f2937") : "#0b1220";
  const fogColor = isNeutralLighting ? (isHeroFullBody ? "#0b1220" : "#1f2937") : "#0b1220";
  const rimColor = isNeutralLighting ? "#94a3b8" : meta.lightA;
  const activeFov = compact ? modelTransform.fovCompact : modelTransform.fovDefault;
  const usePresetCamera = previewFrame === "bust" || previewFrame === "full_body" || manualTuning;
  const initialCameraPosition: [number, number, number] = usePresetCamera
    ? modelTransform.cameraPosition
    : [0, 1.2, 10];
  const resolvedOrbitTarget = cameraTargetOverride ?? modelTransform.orbitTarget;
  const resolvedFov = fovOverride ?? (usePresetCamera ? activeFov : 50);
  const showMeshyViewerHud = manualTuning;
  // The canvas key is intentionally static for the lifetime of this Coach3D
  // instance. Model, frame, and FOV changes are all handled imperatively inside
  // the canvas via CameraReset — destroying and recreating the WebGL context
  // causes GPU memory pressure and context loss on low-VRAM devices.
  const canvasInstanceKey = instanceIdRef.current;
  const stageSizingClass =
    viewportClassName ??
    (compact
      ? previewFrame === "bust"
        ? "h-[260px]"
        : "h-[320px]"
      : previewFrame === "full_body"
        ? "h-[520px]"
        : previewFrame === "bust"
          ? "h-[380px]"
          : "h-[440px]");

  function applyViewerPreset(preset: ViewerPresetId) {
    const controls = orbitControlsRef.current;
    if (!controls) return;

    const target = new Vector3(...resolvedOrbitTarget);
    const object = controls.object;
    const distance = Math.max(object.position.distanceTo(target), 1.15);
    const elevatedY = target.y + (previewFrame === "bust" ? 0.08 : 0.02);
    const positions: Record<ViewerPresetId, [number, number, number]> = {
      front: [target.x, elevatedY, target.z + distance],
      three_quarter: [
        target.x + Math.sin(Math.PI / 4) * distance,
        elevatedY,
        target.z + Math.cos(Math.PI / 4) * distance,
      ],
      side: [target.x + distance, elevatedY, target.z],
      back: [target.x, elevatedY, target.z - distance],
    };

    const nextPosition = positions[preset];
    object.position.set(...nextPosition);
    controls.target.set(target.x, target.y, target.z);
    object.lookAt(target);
    controls.update();
  }

  return (
    <div className={`overflow-hidden rounded-[1.5rem] border ${meta.border} bg-slate-950/72 ${meta.glow}`}>
      <div className={`relative bg-gradient-to-br ${stageGradient}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_28%),linear-gradient(180deg,transparent,rgba(15,23,42,0.22))]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_22%,_rgba(226,232,240,0.18),_transparent_42%),linear-gradient(180deg,rgba(30,41,59,0.08),rgba(51,65,85,0.18)_58%,rgba(15,23,42,0.34)_100%)]" />
        <div
          className={`relative ${stageSizingClass}`}
          style={{ touchAction: "none", overscrollBehavior: "contain" }}
        >
          {showMeshyViewerHud ? (
            <div className="pointer-events-none absolute inset-x-3 top-3 z-[2] flex flex-wrap items-start justify-between gap-3">
              <div className="pointer-events-auto rounded-2xl border border-white/10 bg-slate-950/72 px-3 py-2 backdrop-blur-xl">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">
                  Meshy-Style View
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
                  Drag orbit, right-drag pan, wheel zoom.
                </p>
              </div>
              <div className="pointer-events-auto flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/72 px-3 py-2 backdrop-blur-xl">
                {[
                  { id: "front", label: "Front" },
                  { id: "three_quarter", label: "3/4" },
                  { id: "side", label: "Side" },
                  { id: "back", label: "Back" },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyViewerPreset(preset.id as ViewerPresetId)}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-200 transition hover:border-cyan-400/30 hover:bg-cyan-500/10 hover:text-white"
                  >
                    {preset.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => orbitControlsRef.current?.reset()}
                  className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100 transition hover:border-cyan-400/45 hover:bg-cyan-500/16"
                >
                  Reset
                </button>
              </div>
            </div>
          ) : null}
          <Coach3DErrorBoundary fallback={fallbackNode}>
            <Canvas
              key={canvasInstanceKey}
              shadows={{ type: PCFShadowMap }}
              camera={{
                position: initialCameraPosition,
                fov: resolvedFov,
                near: 0.1,
                far: 1000,
              }}
              dpr={[1, 1.8]}
              gl={{ antialias: true }}
              onCreated={({ gl }) => {
                gl.outputColorSpace = SRGBColorSpace;
                gl.toneMapping = ACESFilmicToneMapping;
                gl.toneMappingExposure = 1.25;
              }}
            >
              <CanvasDebugRegistration />
              <CameraReset position={initialCameraPosition} fov={resolvedFov} target={resolvedOrbitTarget} />
              <color attach="background" args={[backgroundColor]} />
              <fog attach="fog" args={[fogColor, 8, 18]} />

              {/* Curved cyclorama studio wall */}
              <Cyclorama tint={rimColor} isNeutral={isNeutralLighting} previewFrame={previewFrame} />

              {/* Balanced preview lighting tuned for imported GLBs so skin, cloth detail,
                  and logos stay visible without editing the source model. */}
              <ambientLight intensity={1.55} color="#f8fafc" />
              <hemisphereLight
                color="#ffffff"
                groundColor="#2b2450"
                intensity={1.3}
              />

              {/* Key light — front-left and above the camera, warm enough to keep skin tones alive. */}
              <directionalLight
                castShadow
                position={[-3.2, 5.2, 5.6]}
                intensity={2.7}
                color="#fff6e8"
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
                shadow-bias={-0.0002}
                shadow-camera-near={0.5}
                shadow-camera-far={20}
                shadow-camera-left={-6}
                shadow-camera-right={6}
                shadow-camera-top={6}
                shadow-camera-bottom={-6}
              />

              {/* Fill light — front-right to open the face and torso without flattening the suit. */}
              <directionalLight
                position={[3.4, 2.8, 4.2]}
                intensity={1.12}
                color="#dbeafe"
              />

              {/* Soft frontal lift to keep the GT logo and torso from collapsing into shadow. */}
              <pointLight
                position={[0, 1.6, 4.8]}
                intensity={1.05}
                color="#ffffff"
                distance={11}
              />

              {/* Rim light — restrained edge separation so dark clothing still reads cleanly. */}
              <directionalLight
                position={[0.4, 3.4, -4.6]}
                intensity={1.22}
                color={rimColor}
              />

              <NeonFloorGrid rimColor={rimColor} isNeutral={isNeutralLighting} previewFrame={previewFrame} />
              <ContactShadows
                position={[0, -0.178, 0]}
                opacity={isHeroFullBody ? 0.18 : 0.24}
                scale={isHeroFullBody ? 6.2 : 5}
                blur={isHeroFullBody ? 2.6 : 2.1}
                far={3.5}
                resolution={256}
                color="#000000"
              />
              <Suspense fallback={<LoadingSceneLabel />}>
                {previewFrame === "bust" ? (
                  <>
                    <OrbitControls
                      makeDefault
                      enablePan={false}
                      enableZoom={false}
                      enableRotate={false}
                      enableDamping={false}
                      target={resolvedOrbitTarget}
                      touches={{ ONE: 0, TWO: 2 }}
                    />
                    <CoachModel
                      key={resolvedModelPath}
                      modelPath={resolvedModelPath}
                      transform={{
                        ...modelTransform,
                        scale: modelTransform.scale * (meta.modelScale / 1.6),
                      }}
                      animationHint={animationHint}
                      demoClipName={effectiveDemoClipName}
                      animate={animate}
                      freezeAnimation={freezeAnimation}
                      isSpeaking={isSpeaking}
                      onClipsDetected={onClipsDetected}
                      playbackSpeed={playbackSpeed}
                      showSkeleton={showSkeleton}
                      isPaused={isPaused}
                    />
                  </>
                ) : previewFrame === "full_body" ? (
                  <>
                    {isFloorMovement ? (
                      <SideOrbitCamera
                        enabled
                        orbitRadius={Math.hypot(modelTransform.cameraPosition[0], modelTransform.cameraPosition[2])}
                        orbitY={modelTransform.cameraPosition[1]}
                        orbitTarget={resolvedOrbitTarget}
                      />
                    ) : (
                      <OrbitControls
                        makeDefault
                        enablePan={false}
                        enableZoom={false}
                        enableRotate={false}
                        enableDamping={false}
                        target={resolvedOrbitTarget}
                        touches={{ ONE: 0, TWO: 2 }}
                      />
                    )}
                    <CoachModel
                      key={resolvedModelPath}
                      modelPath={resolvedModelPath}
                      transform={{
                        ...modelTransform,
                        scale: modelTransform.scale * (meta.modelScale / 1.6),
                      }}
                      animationHint={animationHint}
                      demoClipName={effectiveDemoClipName}
                      animate={animate}
                      freezeAnimation={freezeAnimation}
                      isSpeaking={isSpeaking}
                      onClipsDetected={onClipsDetected}
                      playbackSpeed={playbackSpeed}
                      showSkeleton={showSkeleton}
                      isPaused={isPaused}
                      spineHighlightActive={isFloorMovement}
                      isFloorMovement={isFloorMovement}
                    />
                  </>
                ) : manualTuning ? (
                  <>
                    <OrbitControls
                      ref={orbitControlsRef}
                      makeDefault
                      enablePan
                      enableZoom
                      enableRotate
                      enableDamping
                      dampingFactor={0.09}
                      minDistance={0.9}
                      maxDistance={12}
                      minPolarAngle={0.35}
                      maxPolarAngle={2.45}
                      target={resolvedOrbitTarget}
                      touches={{ ONE: 0, TWO: 2 }}
                    />
                    <CoachModel
                      key={resolvedModelPath}
                      modelPath={resolvedModelPath}
                      transform={{
                        ...modelTransform,
                        scale: modelTransform.scale * (meta.modelScale / 1.6),
                      }}
                      animationHint={animationHint}
                      demoClipName={effectiveDemoClipName}
                      animate={animate}
                      freezeAnimation={freezeAnimation}
                      isSpeaking={isSpeaking}
                      onClipsDetected={onClipsDetected}
                      playbackSpeed={playbackSpeed}
                      showSkeleton={showSkeleton}
                      isPaused={isPaused}
                    />
                  </>
                ) : (
                  <>
                    <OrbitControls
                      makeDefault
                      enablePan={false}
                      enableZoom
                      enableRotate={!compact}
                      enableDamping
                      dampingFactor={0.08}
                      minDistance={0.5}
                      maxDistance={100}
                      target={resolvedOrbitTarget}
                      touches={{ ONE: 0, TWO: 2 }}
                    />
                    <CoachModel
                      key={resolvedModelPath}
                      modelPath={resolvedModelPath}
                      transform={{
                        ...modelTransform,
                        scale: modelTransform.scale * (meta.modelScale / 1.6),
                      }}
                      animationHint={animationHint}
                      demoClipName={effectiveDemoClipName}
                      animate={animate}
                      freezeAnimation={freezeAnimation}
                      isSpeaking={isSpeaking}
                      onClipsDetected={onClipsDetected}
                      playbackSpeed={playbackSpeed}
                      showSkeleton={showSkeleton}
                      isPaused={isPaused}
                    />
                  </>
                )}
              </Suspense>
            </Canvas>
          </Coach3DErrorBoundary>
        </div>
      </div>
    </div>
  );
}

// Point useGLTF at our local Draco decoder so Draco-compressed GLBs load correctly
useGLTF.setDecoderPath("/draco/");

// Eagerly warm drei's GLTF cache so the model is ready before any Coach3D mounts
useGLTF.preload(ATLAS_RUNTIME_COACH_MODEL_PATH);
useGLTF.preload(NOVA_RUNTIME_COACH_MODEL_PATH);
