"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, MeshReflectorMaterial, useGLTF } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { clone as skeletonClone } from "three/examples/jsm/utils/SkeletonUtils.js";
import {
  ACESFilmicToneMapping,
  AnimationAction,
  AnimationClip,
  AnimationMixer,
  BackSide,
  Bone,
  CanvasTexture,
  Color,
  Euler,
  LoopRepeat,
  Mesh,
  MathUtils,
  PCFShadowMap,
  Quaternion,
  SRGBColorSpace,
  Vector3,
} from "three";
import type { Group, Object3D } from "three";
import { useCoachStore } from "@/store/useCoachStore";
import { CHARACTERS } from "@/lib/characters";
import type { WorkoutPhase } from "@/store/useCoachStore";

useGLTF.setDecoderPath("/draco/");

const SIZE_SCALE: Record<string, number> = {
  compact: 0.9,
  balanced: 1.15,
  immersive: 1.4,
};

// Platform ring color by workout phase
const PHASE_RING_COLOR: Record<WorkoutPhase, string> = {
  ready: "#00aaff",    // neon blue
  active: "#00ff88",   // neon green
  peak: "#ff2244",     // neon red
  rest: "#7740ff",     // violet
  celebrating: "#ff00dd", // hot pink
};

// ─── Arena backdrop ──────────────────────────────────────────────────────────

function ArenaBackdrop() {
  const tex = useMemo(() => {
    const cvs = document.createElement("canvas");
    cvs.width = 4; cvs.height = 256;
    const ctx = cvs.getContext("2d")!;
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, "#000000");
    g.addColorStop(0.6, "#010208");
    g.addColorStop(1, "#02040e");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 256);
    const t = new CanvasTexture(cvs);
    t.needsUpdate = true;
    return t;
  }, []);
  useEffect(() => () => tex.dispose(), [tex]);
  return (
    <mesh position={[0, 4, -2.5]} renderOrder={-10}>
      <cylinderGeometry args={[8, 8, 18, 48, 1, true, Math.PI / 2, Math.PI]} />
      <meshBasicMaterial map={tex} side={BackSide} depthWrite={false} fog={false} />
    </mesh>
  );
}

// ─── Dynamic hex platform — pulse speed + ring color tied to workout phase ──

function DynamicHexPlatform({
  accentColor,
  workoutPhase,
  repProgress,
}: {
  accentColor: string;
  workoutPhase: WorkoutPhase;
  repProgress: number;
}) {
  const ringColor = PHASE_RING_COLOR[workoutPhase];
  const pulseSpeed = workoutPhase === "peak" ? 5.2 : workoutPhase === "active" ? 3.0 : 1.8;

  const hexTex = useMemo(() => {
    const sz = 512;
    const cvs = document.createElement("canvas");
    cvs.width = cvs.height = sz;
    const ctx = cvs.getContext("2d")!;
    const r = 20;
    const w = Math.sqrt(3) * r;
    const hStep = 1.5 * r;
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.55;
    for (let row = -2; row < sz / hStep + 2; row++) {
      for (let col = -1; col < sz / w + 2; col++) {
        const cx = col * w + (row % 2 !== 0 ? w / 2 : 0);
        const cy = row * hStep;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = Math.PI / 6 + (Math.PI / 3) * i;
          if (i === 0) ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
          else ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
        }
        ctx.closePath();
        ctx.stroke();
      }
    }
    const grd = ctx.createRadialGradient(sz / 2, sz / 2, sz * 0.18, sz / 2, sz / 2, sz * 0.52);
    grd.addColorStop(0, "rgba(0,0,0,0)");
    grd.addColorStop(1, "rgba(0,0,0,1)");
    ctx.globalCompositeOperation = "destination-out";
    ctx.globalAlpha = 1;
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, sz, sz);
    return new CanvasTexture(cvs);
  }, [accentColor]);
  useEffect(() => () => hexTex.dispose(), [hexTex]);

  const outerRef = useRef<Mesh>(null);
  const progressRef = useRef<Mesh>(null);
  const elapsed = useRef(0);

  useFrame((_, delta) => {
    elapsed.current += delta;
    if (outerRef.current) {
      const mat = outerRef.current.material as unknown as { opacity: number; color: Color };
      mat.opacity = 0.48 + Math.sin(elapsed.current * pulseSpeed) * 0.38;
      mat.color.set(ringColor);
    }
    if (progressRef.current) {
      // Arc grows from 0→2π as repProgress goes 0→1
      const mat = progressRef.current.material as { opacity: number };
      mat.opacity = repProgress * 0.85;
    }
  });

  return (
    <group position={[0, -0.175, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh renderOrder={-5}>
        <circleGeometry args={[2.4, 64]} />
        <meshBasicMaterial map={hexTex} transparent depthWrite={false} />
      </mesh>
      <mesh renderOrder={-4}>
        <circleGeometry args={[1.2, 48]} />
        <meshBasicMaterial color={accentColor} transparent opacity={0.06} depthWrite={false} />
      </mesh>
      <mesh renderOrder={-3}>
        <ringGeometry args={[1.25, 1.33, 64]} />
        <meshBasicMaterial color={accentColor} transparent opacity={0.52} depthWrite={false} />
      </mesh>
      <mesh ref={outerRef} renderOrder={-2}>
        <ringGeometry args={[2.21, 2.4, 64]} />
        <meshBasicMaterial color={ringColor} transparent opacity={0.8} depthWrite={false} />
      </mesh>
      {/* Rep progress arc — fills as reps accumulate */}
      <mesh ref={progressRef} renderOrder={-1}>
        <ringGeometry args={[2.42, 2.55, 64]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

// ─── Reflective floor ────────────────────────────────────────────────────────

function ReflectiveFloor({ accentColor }: { accentColor: string }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.18, 0]} receiveShadow>
      <circleGeometry args={[3.5, 64]} />
      <MeshReflectorMaterial
        blur={[300, 100]}
        resolution={512}
        mixBlur={1}
        mixStrength={40}
        roughness={1}
        depthScale={1.2}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
        color={accentColor}
        metalness={0.8}
        mirror={0}
      />
    </mesh>
  );
}

// ─── Gaze tracking — head bone follows viewer ────────────────────────────────

const HEAD_BONE_NAMES = ["mixamorigHead", "Head", "head", "Bip01_Head"];
const _targetQuat = new Quaternion();
const _worldPos = new Vector3();
const _headDir = new Vector3();
const _up = new Vector3(0, 1, 0);
const MAX_YAW = Math.PI / 6;   // ±30°
const MAX_PITCH = Math.PI / 8; // ±22.5°

function GazeController({ root }: { root: Object3D }) {
  const { camera } = useThree();
  const headBoneRef = useRef<Bone | null>(null);
  const baseQuatRef = useRef<Quaternion | null>(null);

  useEffect(() => {
    let found: Bone | null = null;
    root.traverse((obj) => {
      if (found) return;
      if (obj instanceof Bone && HEAD_BONE_NAMES.some((n) => obj.name.includes(n))) {
        found = obj;
      }
    });
    headBoneRef.current = found;
    baseQuatRef.current = found ? (found as Bone).quaternion.clone() : null;
  }, [root]);

  useFrame(() => {
    const bone = headBoneRef.current;
    const base = baseQuatRef.current;
    if (!bone || !base) return;

    bone.getWorldPosition(_worldPos);
    _headDir.copy(camera.position).sub(_worldPos).normalize();

    // Clamp yaw and pitch
    const yaw = MathUtils.clamp(Math.atan2(_headDir.x, _headDir.z), -MAX_YAW, MAX_YAW);
    const pitch = MathUtils.clamp(Math.atan2(_headDir.y, _headDir.z), -MAX_PITCH, MAX_PITCH);

    _targetQuat.setFromEuler(new Euler(pitch, yaw, 0, "YXZ"));

    bone.quaternion.slerp(
      base.clone().multiply(_targetQuat),
      0.06, // gentle lag
    );
  });

  return null;
}

// ─── Coach model ─────────────────────────────────────────────────────────────

function CoachModelEngine({
  modelPath,
  animationName,
  scale,
  animationGLBPath,
}: {
  modelPath: string;
  animationName: string;
  scale: number;
  animationGLBPath: string | null;
}) {
  const { setLoaded } = useCoachStore();
  const { scene, animations: charAnimations } = useGLTF(modelPath) as {
    scene: Object3D;
    animations: AnimationClip[];
  };
  // Always call useGLTF to keep hook count stable — falls back to modelPath (cached) when no external anim
  const { animations: extAnimations } = useGLTF(animationGLBPath ?? modelPath) as {
    animations: AnimationClip[];
  };
  const animations = animationGLBPath ? extAnimations : charAnimations;

  const cloned = useMemo(() => skeletonClone(scene), [scene]);
  const groupRef = useRef<Group>(null);
  const mixerRef = useRef<AnimationMixer | null>(null);
  const currentActionRef = useRef<AnimationAction | null>(null);

  useEffect(() => {
    cloned.traverse((obj) => {
      obj.visible = true;
      if ((obj as { isMesh?: boolean }).isMesh) {
        obj.frustumCulled = false;
        (obj as { castShadow?: boolean }).castShadow = true;
        (obj as { receiveShadow?: boolean }).receiveShadow = true;
      }
    });
    setLoaded(true);
    return () => setLoaded(false);
  }, [cloned, setLoaded]);

  useEffect(() => {
    const mixer = new AnimationMixer(cloned);
    mixerRef.current = mixer;
    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(cloned);
      mixerRef.current = null;
      currentActionRef.current = null;
    };
  }, [cloned]);

  useEffect(() => {
    const mixer = mixerRef.current;
    if (!mixer || !animations.length) return;
    // External GLBs: always use first valid clip (Blender FBX→GLB produces one clip)
    const clip = animationGLBPath
      ? (animations.find((c) => c.duration > 0) ?? null)
      : (animations.find((c) => c.name === animationName) ??
         animations.find((c) => c.duration > 0) ??
         null);
    if (!clip) return;
    const next = mixer.clipAction(clip);
    next.setLoop(LoopRepeat, Infinity);
    const prev = currentActionRef.current;
    if (prev && prev !== next) {
      next.reset().play();
      prev.crossFadeTo(next, 0.25, true);
    } else if (!prev) {
      next.reset().fadeIn(0.3).play();
    }
    currentActionRef.current = next;
  }, [animations, animationName, animationGLBPath]);

  useFrame((_, delta) => mixerRef.current?.update(delta));

  return (
    <group ref={groupRef} scale={scale}>
      <primitive object={cloned} />
      <GazeController root={cloned} />
    </group>
  );
}

function LoadingRing({ color }: { color: string }) {
  const ref = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.z = clock.getElapsedTime() * 1.8;
  });
  return (
    <mesh ref={ref} position={[0, 1.1, 0]}>
      <torusGeometry args={[0.32, 0.022, 8, 40]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

// ─── Public component ────────────────────────────────────────────────────────

type OptimizedCoachCanvasProps = {
  height?: string;
  cameraPosition?: [number, number, number];
  fov?: number;
  bloom?: boolean;
  /** Bypass "hidden" layout — use for in-workout demo panels where coach must always show */
  forceShow?: boolean;
};

export function OptimizedCoachCanvas({
  height = "h-[480px]",
  cameraPosition = [0, 1.3, 4.2],
  fov = 34,
  bloom = true,
  forceShow = false,
}: OptimizedCoachCanvasProps) {
  const { characterId, currentAnimation, displayLayout, coachSize, workoutPhase, repProgress, animationGLBPath } =
    useCoachStore();
  const character = CHARACTERS[characterId];

  const isCameraScreen = displayLayout === "camera_corner";
  if (!forceShow && displayLayout === "hidden") return null;
  if (!character.available || !character.modelPath) return null;

  const pixelRatio: [number, number] = isCameraScreen
    ? [1, 1]
    : [1, Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 2, 1.8)];

  const scale = SIZE_SCALE[coachSize] ?? 1.15;
  const enableBloom = bloom && !isCameraScreen;

  return (
    <div className={`overflow-hidden rounded-2xl ${height}`}>
      <Canvas
        shadows={isCameraScreen ? false : { type: PCFShadowMap }}
        camera={{ position: cameraPosition, fov, near: 0.1, far: 200 }}
        dpr={pixelRatio}
        gl={{ antialias: !isCameraScreen, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = SRGBColorSpace;
          gl.toneMapping = ACESFilmicToneMapping;
          gl.toneMappingExposure = isCameraScreen ? 1.2 : 1.55;
        }}
      >
        <color attach="background" args={["#010208"]} />

        {!isCameraScreen && (
          <>
            <fog attach="fog" args={["#010208", 5, 14]} />
            <ArenaBackdrop />
          </>
        )}

        {isCameraScreen ? (
          <ambientLight intensity={1.0} color="#c8e0ff" />
        ) : (
          <>
            <ambientLight intensity={0.18} color="#080c1a" />
            <hemisphereLight color="#1a2050" groundColor="#000000" intensity={0.32} />
            <directionalLight
              castShadow
              position={[-2, 7, 5]}
              intensity={5.5}
              color="#d0e8ff"
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
              shadow-bias={-0.0002}
              shadow-camera-near={0.5}
              shadow-camera-far={20}
              shadow-camera-left={-5}
              shadow-camera-right={5}
              shadow-camera-top={5}
              shadow-camera-bottom={-5}
            />
            <directionalLight position={[-5, 3, -3]} intensity={4.5} color={character.rimColor} />
            <directionalLight position={[5, 2, -2]} intensity={3.2} color="#7740ff" />
            <pointLight position={[0, 0.05, 0.3]} intensity={2.8} color={character.rimColor} distance={4.5} decay={2} />
            <pointLight position={[0, 9, 1]} intensity={1.6} color="#c8e0ff" distance={16} decay={2} />
          </>
        )}

        {!isCameraScreen && (
          <>
            <DynamicHexPlatform
              accentColor={character.accentColor}
              workoutPhase={workoutPhase}
              repProgress={repProgress}
            />
            <ReflectiveFloor accentColor={character.accentColor} />
            <ContactShadows
              position={[0, -0.178, 0]}
              opacity={0.18}
              scale={4}
              blur={2.0}
              far={3}
              resolution={256}
              color="#000000"
            />
          </>
        )}

        <Suspense fallback={<LoadingRing color={character.accentColor} />}>
          <CoachModelEngine
            modelPath={character.modelPath}
            animationName={currentAnimation}
            scale={scale}
            animationGLBPath={animationGLBPath}
          />
        </Suspense>

        {enableBloom && (
          <EffectComposer>
            <Bloom
              luminanceThreshold={0.75}
              luminanceSmoothing={0.3}
              intensity={1.2}
              mipmapBlur
            />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  );
}
