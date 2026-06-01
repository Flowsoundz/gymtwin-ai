"use client";

import * as React from "react";
import { Suspense, useEffect, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls, useGLTF } from "@react-three/drei";
import { clone as skeletonClone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { AnimationMixer, Box3, LoopOnce, LoopRepeat, Vector3 } from "three";
import type { AnimationClip, Group, Object3D } from "three";
import { getAvatarLabel, getAvatarModelPaths } from "@/lib/avatarAssets";
import { loadTransformPreset } from "@/lib/coachTransformStorage";
import {
  getAnimationForHint,
  getAvatarAnimationClipById,
} from "@/lib/avatarAnimationLibrary";
import { useCoachSpeech } from "@/hooks/useCoachSpeech";
import type { CoachAnimationHint } from "@/lib/coachBrain";
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
  modelPathOverride?: string;
  animationHint?: CoachAnimationHint;
  animationClipId?: string | null;
  demoClipName?: string | null;
  previewTransform?: PreviewTransform;
  previewFrame?: Coach3DPreviewFrame;
  lightingMode?: "mood" | "neutral";
  onClipsDetected?: (clips: string[]) => void;
  message?: string | null;
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
};

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
  talking:   ["GT_Idle_Default_05", "GT_MaximoAnimLocomotionIdletransition01", "GT_Idle_Default_03", "Talking", "talking", "Wave", "wave"],
  listening: ["GT_Idle_Default_04", "GT_MaximoAnimLocomotionIdletransition02", "GT_Idle_Default_06", "Listening", "listening"],
  pointing:  ["GT_MaximoAnimCombat3270427surpriseuppercutmaya201", "GT_Idle_Default_07", "Pointing", "pointing"],
  thumbs_up: ["GT_MaximoAnimEmoteVictory01", "GT_Dance_Hype", "ThumbsUp", "Victory", "victory"],
  warning:   ["GT_MaximoAnimEmoteDefeated01", "GT_Idle_Default_06", "Warning", "warning"],
  celebrate: ["GT_Dance_Hype", "GT_Dance_Hype_02", "GT_Dance_Hype_03", "GT_MaximoAnimEmoteVictory01", "Celebrate", "celebrate", "Dance", "dance"],
};

function resolveClipName(hint: CoachAnimationHint, animations: AnimationClip[]): string | null {
  if (!animations.length) return null;
  const candidates = HINT_CLIP_NAMES[hint].map((c) => c.toLowerCase());
  const found = animations.find((clip) => candidates.includes(clip.name.toLowerCase()));
  if (found) return found.name;
  if (hint !== "idle") {
    const idleCandidates = HINT_CLIP_NAMES["idle"].map((c) => c.toLowerCase());
    const idleFound = animations.find((clip) => idleCandidates.includes(clip.name.toLowerCase()));
    if (idleFound) return idleFound.name;
  }
  return null;
}

function getAnimationPackPath(modelPath: string): string {
  // atlas-coach-mobile.glb uses a Mixamo humanoid rig — incompatible with the animal-rig
  // atlas-animations.glb / nova-animations.glb. Route it to the Mixamo pack which will
  // fail gracefully (AnimPackErrorBoundary) until that file is exported.
  if (modelPath.includes("atlas-coach-mobile")) return "/models/animations/mixamo-animations.glb";
  if (modelPath.includes("atlas")) return "/models/animations/atlas-animations.glb";
  return "/models/animations/nova-animations.glb";
}

function CoachModel({
  modelPath,
  transform,
  animationHint,
  demoClipName,
  previewFrame,
  isSpeaking,
  onClipsDetected,
}: {
  modelPath: string;
  transform: ModelTransform;
  animationHint: CoachAnimationHint;
  demoClipName?: string | null;
  previewFrame: Coach3DPreviewFrame;
  isSpeaking?: boolean;
  onClipsDetected?: (clips: string[]) => void;
}) {
  const modelGroupRef = React.useRef<Group>(null);
  const headBoneRef = React.useRef<Object3D | null>(null);
  const earBoneRef = React.useRef<Object3D | null>(null);
  const rEarBoneRef = React.useRef<Object3D | null>(null);
  const { scene, animations: embeddedClips } = useGLTF(modelPath) as {
    scene: Object3D;
    animations: AnimationClip[];
  };
  // skeletonClone rebinds the SkinnedMesh to the cloned skeleton.
  // scene.clone() leaves the mesh pointing at the original bones — animations appear frozen.
  const clonedScene = useMemo(() => skeletonClone(scene), [scene]);
  const [externalClips, setExternalClips] = useState<AnimationClip[]>([]);
  const [fitnessClips, setFitnessClips] = useState<AnimationClip[]>([]);
  const animations = useMemo(() => {
    const base = embeddedClips.length ? embeddedClips : externalClips;
    return [...base, ...fitnessClips];
  }, [embeddedClips, externalClips, fitnessClips]);
  // Own the mixer directly — bound to clonedScene so Three.js finds bones immediately.
  const mixerRef = React.useRef<AnimationMixer | null>(null);
  const activeActionRef = React.useRef<string | null>(null);

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

  // Idle variant cycling — rotate through idle clips every 25s so the coach never looks frozen
  const idleClipsRef = React.useRef<string[]>([]);
  const [idleIdx, setIdleIdx] = useState(0);

  useEffect(() => {
    if (!animations.length) return;
    const variants = (HINT_CLIP_NAMES.idle as string[])
      .map((name) => animations.find((c) => c.name === name)?.name)
      .filter((n): n is string => Boolean(n));
    idleClipsRef.current = variants;
    setIdleIdx(0);
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
  // Capture T-pose bounding box once — never re-run when previewFrame changes,
  // which prevents the Y-axis drift caused by setFromObject on an animated scene.
  const sceneMetrics = useMemo(() => {
    const box = new Box3().setFromObject(clonedScene);
    const size = box.getSize(new Vector3());
    const center = box.getCenter(new Vector3());
    return { height: size.y, cx: center.x, cy: box.min.y, cz: center.z };
  }, [clonedScene]);

  const fitProfile = useMemo(() => {
    const safeHeight = sceneMetrics.height > 0 ? sceneMetrics.height : 1;
    const targetHeight = previewFrame === "in_frame" ? 2.45 : 2.2;
    // No clamp — let fitScale handle any unit scale (meters, centimeters, etc.)
    const fitScale = targetHeight / safeHeight;
    // Offset must be multiplied by the same total scale applied to the primitive,
    // otherwise the model drifts on Y when fitScale changes between frames.
    const totalScale = fitScale * transform.scale;
    return {
      fitScale,
      offset: [
        -sceneMetrics.cx * totalScale,
        -sceneMetrics.cy * totalScale,
        -sceneMetrics.cz * totalScale,
      ] as [number, number, number],
    };
  }, [sceneMetrics, previewFrame, transform.scale]);

  useEffect(() => {
    headBoneRef.current = null;
    earBoneRef.current = null;
    rEarBoneRef.current = null;
    clonedScene.traverse((obj: Object3D) => {
      if (obj.name === "head") headBoneRef.current = obj;
      else if (obj.name === "earend") earBoneRef.current = obj;
      else if (obj.name === "R_earend") rEarBoneRef.current = obj;
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
    if (prevName && prevName !== targetClipName) {
      const prevClip = animations.find((c) => c.name === prevName);
      if (prevClip) m.clipAction(prevClip).fadeOut(0.35);
    }

    incoming.reset().fadeIn(0.35);
    incoming.setLoop(isOneShot ? LoopOnce : LoopRepeat, isOneShot ? 1 : Infinity);
    incoming.play();
    activeActionRef.current = targetClipName;

    if (isOneShot) {
      const idleClipName = resolveClipName("idle", animations);
      const onFinish = () => {
        if (idleClipName && activeActionRef.current === targetClipName) {
          incoming.fadeOut(0.45);
          const idleClip = animations.find((c) => c.name === idleClipName);
          if (idleClip) {
            const idleAction = m.clipAction(idleClip);
            idleAction.reset().fadeIn(0.45).play();
            activeActionRef.current = idleClipName;
          }
        }
      };
      m.addEventListener("finished", onFinish);
      return () => m.removeEventListener("finished", onFinish);
    }
  }, [animationHint, demoClipName, animations, idleIdx]);

  useEffect(() => {
    onClipsDetected?.(animations.map((c) => c.name));
  }, [animations, onClipsDetected]);

  useFrame((state, delta) => {
    mixerRef.current?.update(delta);

    const group = modelGroupRef.current;
    if (!group) return;

    const elapsed = state.clock.getElapsedTime();
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
  });

  const animPackPath = getAnimationPackPath(modelPath);

  return (
    <group ref={modelGroupRef}>
      {!embeddedClips.length && (
        <Suspense fallback={null}>
          <AnimPackErrorBoundary>
            <AnimationPackLoader path={animPackPath} onClipsLoaded={setExternalClips} />
          </AnimPackErrorBoundary>
        </Suspense>
      )}
      {demoClipName && (
        <Suspense fallback={null}>
          <AnimPackErrorBoundary>
            <AnimationPackLoader
              path="/models/animations/fitness-animations.glb"
              onClipsLoaded={setFitnessClips}
            />
          </AnimPackErrorBoundary>
        </Suspense>
      )}
      <primitive
        object={clonedScene}
        scale={transform.scale * fitProfile.fitScale}
        position={fitProfile.offset}
      />
    </group>
  );
}

function LoadingSceneLabel() {
  return (
    <Html center>
      <div className="rounded-full border border-white/10 bg-slate-950/72 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-slate-200 backdrop-blur-md">
        Loading 3D Coach
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
        gradient: "from-amber-500/22 via-fuchsia-500/16 to-slate-950",
        border: "border-amber-400/28",
        glow: "shadow-[0_0_44px_rgba(245,158,11,0.18)]",
        accentText: "text-amber-100",
        pill: "border-amber-400/24 bg-amber-500/12 text-amber-100",
        lightA: "#f59e0b",
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
        gradient: "from-fuchsia-500/24 via-amber-400/16 to-slate-950",
        border: "border-fuchsia-400/28",
        glow: "shadow-[0_0_48px_rgba(217,70,239,0.2)]",
        accentText: "text-fuchsia-100",
        pill: "border-fuchsia-400/24 bg-fuchsia-500/12 text-fuchsia-100",
        lightA: "#d946ef",
        lightB: "#fbbf24",
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

export function getCoachModelTransformPreset(modelPath: string): ModelTransform {
  if (modelPath.includes("atlas-coach-mobile.glb")) {
    return {
      position: [-0.14, -1.17, 0.09],
      rotation: [0, 0, 0],
      scale: 1.48,
      cameraPosition: [0, 0.92, 5.35],
      fovCompact: 52,
      fovDefault: 50,
    };
  }

  if (modelPath.includes("atlas-coach.glb")) {
    return {
      position: [0, -0.7, 0],
      rotation: [0, 0, 0],
      scale: 1.52,
      cameraPosition: [0, 0.96, 5.55],
      fovCompact: 36,
      fovDefault: 33,
    };
  }

  return {
    position: [0, -0.68, 0],
    rotation: [0, 0, 0],
    scale: 1.26,
    cameraPosition: [0, 1, 4.8],
    fovCompact: 34,
    fovDefault: 31,
  };
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
        <div className="relative flex h-full flex-col items-center justify-center text-center">
          <div className={`${fallbackMotionClass} coach-halo relative flex h-24 w-24 items-center justify-center rounded-full border border-white/12 bg-slate-950/70 shadow-[0_0_38px_rgba(99,102,241,0.22)] sm:h-28 sm:w-28`}>
            <div className="absolute inset-2 rounded-full border border-white/10 bg-gradient-to-br from-blue-400/24 via-fuchsia-400/16 to-transparent" />
            <div className="absolute inset-5 rounded-full bg-gradient-to-br from-white/16 to-transparent blur-md" />
            <div className="relative flex items-center gap-0.5 text-lg font-black tracking-tight text-white">
              <span>G</span>
              <span className="text-blue-300">T</span>
            </div>
          </div>
          <div className={`mt-4 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${meta.pill}`}>
            {avatarLabel}
          </div>
          <p className={`mt-4 text-base font-black ${meta.accentText}`}>3D model coming soon</p>
          <p className="mt-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
            Animation: {animationHint}
          </p>
          <p className="mt-2 max-w-[16rem] text-xs leading-relaxed text-slate-300">{reason}</p>
        </div>
      </div>
    </div>
  );
}

export function Coach3D({
  selectedAvatar,
  mood = "idle",
  compact = false,
  modelPathOverride,
  animationHint = "idle",
  animationClipId,
  demoClipName,
  previewTransform,
  previewFrame = "in_frame",
  lightingMode = "mood",
  onClipsDetected,
  message,
}: Coach3DProps) {
  const { isSpeaking } = useCoachSpeech(message);
  const [modelStatus, setModelStatus] = useState<ModelStatus>("checking");
  const [resolvedModelPath, setResolvedModelPath] = useState<string | null>(null);

  const avatarLabel = getAvatarLabel(selectedAvatar);
  const candidateModelPaths = useMemo(
    () => (modelPathOverride ? [modelPathOverride] : getAvatarModelPaths(selectedAvatar)),
    [modelPathOverride, selectedAvatar]
  );
  const meta = getMoodSceneMeta(mood);
  const isNeutralLighting = lightingMode === "neutral";
  const resolvedAnimationClip = useMemo(
    () =>
      (animationClipId
        ? getAvatarAnimationClipById(animationClipId, selectedAvatar)
        : getAnimationForHint(animationHint, selectedAvatar)) ?? null,
    [animationClipId, animationHint, selectedAvatar]
  );
  const modelTransform = useMemo(() => {
    const activePath = resolvedModelPath ?? modelPathOverride ?? candidateModelPaths[0] ?? "";
    const baked = getCoachModelTransformPreset(activePath);
    const saved = loadTransformPreset(activePath);
    const withSaved = mergePreviewTransform(baked, saved ?? undefined);
    return mergePreviewTransform(withSaved, previewTransform);
  }, [candidateModelPaths, modelPathOverride, previewTransform, resolvedModelPath]);

  useEffect(() => {
    let cancelled = false;

    async function checkModel() {
      setModelStatus("checking");
      setResolvedModelPath(null);

      let hadRequestError = false;

      for (const candidatePath of candidateModelPaths) {
        try {
          const response = await fetch(candidatePath, { method: "HEAD" });
          if (cancelled) return;

          if (response.ok) {
            setResolvedModelPath(candidatePath);
            setModelStatus("available");
            return;
          }
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
  }, [candidateModelPaths]);

  const fallbackNode = (
    <CoachFallback
      avatarLabel={avatarLabel}
      meta={meta}
      compact={compact}
      animationHint={animationHint}
      reason={
        modelStatus === "checking"
          ? "Checking selected 3D model path."
          : modelStatus === "error"
            ? "The model file could not be loaded right now. Check the path and local server."
          : selectedAvatar === "Atlas"
            ? "Add atlas-coach-mobile.glb or atlas-coach.glb to public/models to enable the live 3D preview."
            : "Add the matching .glb file to public/models to enable the live 3D preview."
      }
    />
  );

  if (modelStatus !== "available" || !resolvedModelPath) {
    return fallbackNode;
  }

  const appliedCameraPosition: [number, number, number] = [
    modelTransform.cameraPosition[0],
    modelTransform.cameraPosition[1] + (previewFrame === "full_body" ? 0.02 : previewFrame === "bust" ? 1.05 : -0.04),
    modelTransform.cameraPosition[2] + (previewFrame === "full_body" ? 0.24 : previewFrame === "bust" ? -1.4 : 0.1),
  ];
  const appliedFov =
    (compact ? modelTransform.fovCompact : modelTransform.fovDefault) +
    (previewFrame === "full_body" ? 1 : previewFrame === "bust" ? -4 : -1);
  const stageGradient = isNeutralLighting
    ? "from-slate-700/95 via-slate-800/92 to-[#0f172a]"
    : meta.gradient;
  const backgroundColor = isNeutralLighting ? "#233047" : "#0b1220";
  const fogColor = isNeutralLighting ? "#233047" : "#0b1220";
  const ambientIntensity = isNeutralLighting ? 3.8 : 1.85;
  const keyLightAColor = isNeutralLighting ? "#f8fafc" : meta.lightA;
  const keyLightBColor = isNeutralLighting ? "#e2e8f0" : meta.lightB;
  const keyLightAIntensity = isNeutralLighting ? 6.8 : meta.lightIntensityB + 2;
  const keyLightBIntensity = isNeutralLighting ? 6.1 : 8.5;
  const frontFillIntensity = isNeutralLighting ? 22 : 12;
  const floorGlowColor = isNeutralLighting ? "#cbd5e1" : "#60a5fa";

  return (
    <div className={`rounded-[1.5rem] border ${meta.border} bg-slate-950/72 p-4 ${meta.glow}`}>
      <div className={`relative overflow-hidden rounded-[1.35rem] border border-white/8 bg-gradient-to-br ${stageGradient}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_28%),linear-gradient(180deg,transparent,rgba(15,23,42,0.22))]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_22%,_rgba(226,232,240,0.18),_transparent_42%),linear-gradient(180deg,rgba(30,41,59,0.08),rgba(51,65,85,0.18)_58%,rgba(15,23,42,0.34)_100%)]" />
        <div
          className={`relative ${compact ? (previewFrame === "bust" ? "h-[240px]" : "h-[300px]") : previewFrame === "full_body" ? "h-[560px]" : previewFrame === "bust" ? "h-[320px]" : "h-[420px]"}`}
          style={{ touchAction: "none", overscrollBehavior: "contain" }}
        >
          <Coach3DErrorBoundary fallback={fallbackNode}>
            <Canvas
              camera={{
                position: appliedCameraPosition,
                fov: appliedFov,
              }}
              dpr={[1, 1.8]}
            >
              <color attach="background" args={[backgroundColor]} />
              <fog attach="fog" args={[fogColor, 10, 22]} />
              <ambientLight intensity={ambientIntensity} color="#f8fafc" />
              <directionalLight position={[1.2, 5.2, 5.4]} intensity={isNeutralLighting ? 1.85 : meta.lightIntensityA + 0.7} color="#ffffff" />
              <directionalLight position={[-2.8, 4.2, 3.4]} intensity={isNeutralLighting ? 1.55 : 1.2} color="#dbeafe" />
              <pointLight position={[0, 1.4, 4.3]} intensity={frontFillIntensity} color="#f8fafc" distance={11} />
              <pointLight position={[2.8, 2.2, -1.8]} intensity={keyLightAIntensity} color={keyLightBColor} distance={14} />
              <pointLight position={[-2.2, 1.4, 2.4]} intensity={keyLightBIntensity} color={keyLightAColor} distance={11} />
              <pointLight position={[0, -0.4, 3.6]} intensity={isNeutralLighting ? 8.6 : 10} color={isNeutralLighting ? "#dbeafe" : "#93c5fd"} distance={10} />
              <pointLight position={[0, 1.8, -4.2]} intensity={isNeutralLighting ? 14 : 7} color={isNeutralLighting ? "#e2e8f0" : "#818cf8"} distance={14} />
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.96, 0]}>
                <circleGeometry args={[3.2, 56]} />
                <meshBasicMaterial color={floorGlowColor} transparent opacity={isNeutralLighting ? 0.18 : 0.12} />
              </mesh>
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.9, -0.3]}>
                <ringGeometry args={[1.65, 3.4, 56]} />
                <meshBasicMaterial color="#e2e8f0" transparent opacity={isNeutralLighting ? 0.18 : 0.08} />
              </mesh>
              <Suspense fallback={<LoadingSceneLabel />}>
                <OrbitControls
                  enablePan={false}
                  enableZoom={!compact}
                  enableRotate={!compact}
                  enableDamping={!compact}
                  dampingFactor={0.08}
                  minDistance={2}
                  maxDistance={12}
                  target={
                    previewFrame === "bust"
                      ? [0, 1.55, 0]
                      : resolvedModelPath?.includes("atlas-coach-mobile")
                        ? [0, 0.88, 0]
                        : [0, 0.42, 0]
                  }
                  touches={{
                    ONE: 0,  // TOUCH.ROTATE
                    TWO: 2,  // TOUCH.DOLLY_PAN
                  }}
                />
                <CoachModel
                  modelPath={resolvedModelPath}
                  transform={{
                    ...modelTransform,
                    scale: modelTransform.scale * (meta.modelScale / 1.6),
                  }}
                  animationHint={animationHint}
                  demoClipName={demoClipName}
                  previewFrame={previewFrame}
                  isSpeaking={isSpeaking}
                  onClipsDetected={onClipsDetected}
                />
              </Suspense>
            </Canvas>
          </Coach3DErrorBoundary>
        </div>
      </div>
    </div>
  );
}
