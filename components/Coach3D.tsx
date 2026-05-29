"use client";

import * as React from "react";
import { Suspense, useEffect, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, PresentationControls, useAnimations, useGLTF } from "@react-three/drei";
import type { AnimationClip, Group, Object3D } from "three";
import { getAvatarLabel, getAvatarModelPaths } from "@/lib/avatarAssets";
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

function getDefaultAnimationClip(animations: AnimationClip[]) {
  if (!animations.length) {
    return null;
  }

  const preferredNames = [
    "Idle",
    "idle",
    "Breathing",
    "breathing",
    "Armature|mixamo.com|Layer0",
  ];

  return (
    animations.find((clip) => preferredNames.includes(clip.name)) ??
    animations[0]
  );
}

function CoachModel({
  modelPath,
  modelScale,
  animationHint,
}: {
  modelPath: string;
  modelScale: number;
  animationHint: CoachAnimationHint;
}) {
  const modelGroupRef = React.useRef<Group>(null);
  const { scene, animations } = useGLTF(modelPath) as {
    scene: Object3D;
    animations: AnimationClip[];
  };
  const clonedScene = useMemo(() => scene.clone(), [scene]);
  const { actions } = useAnimations(animations, modelGroupRef);
  const defaultClip = useMemo(() => getDefaultAnimationClip(animations), [animations]);
  const hasEmbeddedAnimations = animations.length > 0;

  useEffect(() => {
    if (!defaultClip?.name) {
      return;
    }

    const action = actions[defaultClip.name];
    if (!action) {
      return;
    }

    action.reset();
    action.fadeIn(0.35);
    action.play();

    return () => {
      action.fadeOut(0.25);
      action.stop();
    };
  }, [actions, defaultClip]);

  useFrame((state) => {
    const group = modelGroupRef.current;
    if (!group) {
      return;
    }

    const elapsed = state.clock.getElapsedTime();

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
        floatAmplitude: 0.045,
        floatSpeed: 1.15,
        tiltAmplitude: 0.03,
        turnAmplitude: 0.04,
        forwardOffset: 0,
        rollAmplitude: 0.012,
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
    const baseY = -1.75 + Math.sin(elapsed * motion.floatSpeed) * motion.floatAmplitude;
    const bounceY = Math.max(0, Math.sin(elapsed * motion.floatSpeed * 1.45)) * motion.extraBounce;
    const turnY = 0.08 + Math.sin(elapsed * 0.7) * motion.turnAmplitude;
    const tiltX = Math.sin(elapsed * 0.85) * motion.tiltAmplitude;
    const rollZ = Math.sin(elapsed * 0.65) * motion.rollAmplitude;
    const forwardZ = motion.forwardOffset + Math.sin(elapsed * 0.9) * 0.02;

    group.position.y = baseY + bounceY;
    group.position.z = forwardZ;
    group.rotation.x = tiltX;
    group.rotation.y = turnY;
    group.rotation.z = rollZ;

    if (hasEmbeddedAnimations && animationHint === "celebrate") {
      group.rotation.y += Math.sin(elapsed * 1.8) * 0.05;
    }
  });

  return (
    <group ref={modelGroupRef}>
      <primitive object={clonedScene} scale={modelScale} />
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
}: Coach3DProps) {
  const [modelStatus, setModelStatus] = useState<ModelStatus>("checking");
  const [resolvedModelPath, setResolvedModelPath] = useState<string | null>(null);

  const avatarLabel = getAvatarLabel(selectedAvatar);
  const candidateModelPaths = useMemo(
    () => (modelPathOverride ? [modelPathOverride] : getAvatarModelPaths(selectedAvatar)),
    [modelPathOverride, selectedAvatar]
  );
  const meta = getMoodSceneMeta(mood);

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

  return (
    <div className={`rounded-[1.5rem] border ${meta.border} bg-slate-950/72 p-4 ${meta.glow}`}>
      <div className={`relative overflow-hidden rounded-[1.35rem] border border-white/8 bg-gradient-to-br ${meta.gradient}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_28%),linear-gradient(180deg,transparent,rgba(2,6,23,0.42))]" />
        <div className="absolute left-4 top-4 z-10 rounded-full border border-white/10 bg-slate-950/72 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-slate-200 backdrop-blur-md">
          {resolvedModelPath}
        </div>
        <div className="absolute right-4 top-4 z-10 rounded-full border border-white/10 bg-slate-950/72 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-slate-200 backdrop-blur-md">
          {animationHint}
        </div>
        <div className={`relative ${compact ? "h-[240px]" : "h-[300px]"}`}>
          <Coach3DErrorBoundary fallback={fallbackNode}>
            <Canvas camera={{ position: [0, 0.6, 4.8], fov: compact ? 34 : 30 }} dpr={[1, 1.8]}>
              <color attach="background" args={["#000000"]} />
              <fog attach="fog" args={["#020617", 5, 10]} />
              <ambientLight intensity={0.9} />
              <directionalLight position={[4, 6, 4]} intensity={meta.lightIntensityA} color={meta.lightA} />
              <pointLight position={[-3, 2, 3]} intensity={meta.lightIntensityB} color={meta.lightB} distance={12} />
              <pointLight position={[2, -2, 3]} intensity={10} color={meta.lightA} distance={10} />
              <Suspense fallback={<LoadingSceneLabel />}>
                <PresentationControls
                  global={false}
                  snap
                  rotation={[0, 0.08, 0]}
                  polar={[-0.18, 0.24]}
                  azimuth={[-0.35, 0.35]}
                  speed={1.2}
                >
                  <CoachModel
                    modelPath={resolvedModelPath}
                    modelScale={meta.modelScale}
                    animationHint={animationHint}
                  />
                </PresentationControls>
              </Suspense>
            </Canvas>
          </Coach3DErrorBoundary>
        </div>
      </div>
    </div>
  );
}
