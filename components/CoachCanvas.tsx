"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, useGLTF } from "@react-three/drei";
import { clone as skeletonClone } from "three/examples/jsm/utils/SkeletonUtils.js";
import {
  ACESFilmicToneMapping,
  AnimationAction,
  AnimationClip,
  AnimationMixer,
  BackSide,
  CanvasTexture,
  LoopRepeat,
  Mesh,
  PCFShadowMap,
  SRGBColorSpace,
} from "three";
import type { Group, Object3D } from "three";
import { useCoachStore } from "@/store/useCoachStore";
import { CHARACTERS } from "@/lib/characters";

useGLTF.setDecoderPath("/draco/");

// ─── Arena environment ───────────────────────────────────────────────────────

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

function HexPlatform({ accentColor }: { accentColor: string }) {
  const hexTex = useMemo(() => {
    const sz = 512;
    const cvs = document.createElement("canvas");
    cvs.width = cvs.height = sz;
    const ctx = cvs.getContext("2d")!;
    const r = 20;
    const w = Math.sqrt(3) * r;
    const hStep = 1.5 * r;
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1.0;
    ctx.globalAlpha = 0.55;
    for (let row = -2; row < sz / hStep + 2; row++) {
      for (let col = -1; col < sz / w + 2; col++) {
        const cx = col * w + (row % 2 !== 0 ? w / 2 : 0);
        const cy = row * hStep;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = Math.PI / 6 + (Math.PI / 3) * i;
          const px = cx + r * Math.cos(a);
          const py = cy + r * Math.sin(a);
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
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
  const elapsed = useRef(0);
  useFrame((_, delta) => {
    elapsed.current += delta;
    if (outerRef.current) {
      const mat = outerRef.current.material as { opacity: number };
      mat.opacity = 0.48 + Math.sin(elapsed.current * 2.4) * 0.38;
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
        <meshBasicMaterial color={accentColor} transparent opacity={0.8} depthWrite={false} />
      </mesh>
    </group>
  );
}

// ─── Coach model with crossfading ───────────────────────────────────────────

function CoachModel({
  modelPath,
  animationName,
  accentColor,
}: {
  modelPath: string;
  animationName: string;
  accentColor: string;
}) {
  const { scene, animations } = useGLTF(modelPath) as {
    scene: Object3D;
    animations: AnimationClip[];
  };
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
      }
    });
  }, [cloned]);

  // Create mixer once per model
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

  // Crossfade when animation name changes
  useEffect(() => {
    const mixer = mixerRef.current;
    if (!mixer || !animations.length) return;

    const clip =
      animations.find((c) => c.name === animationName) ??
      animations.find((c) => c.duration > 0) ??
      null;
    if (!clip) return;

    const next = mixer.clipAction(clip);
    next.setLoop(LoopRepeat, Infinity);

    const prev = currentActionRef.current;
    if (prev && prev !== next) {
      next.reset().play();
      prev.crossFadeTo(next, 0.3, true);
    } else if (!prev) {
      next.reset().fadeIn(0.3).play();
    }
    currentActionRef.current = next;
  }, [animations, animationName]);

  useFrame((_, delta) => {
    mixerRef.current?.update(delta);
  });

  void accentColor;

  return (
    <group ref={groupRef} scale={1.15}>
      <primitive object={cloned} />
    </group>
  );
}

// ─── Loading ring ────────────────────────────────────────────────────────────

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

type CoachCanvasProps = {
  height?: string;
  fov?: number;
  cameraPosition?: [number, number, number];
};

export function CoachCanvas({
  height = "h-[480px]",
  fov = 34,
  cameraPosition = [0, 1.3, 4.2],
}: CoachCanvasProps) {
  const { characterId, currentAnimation } = useCoachStore();
  const character = CHARACTERS[characterId];

  return (
    <div className={`overflow-hidden rounded-2xl ${height}`}>
      <Canvas
        shadows={{ type: PCFShadowMap }}
        camera={{ position: cameraPosition, fov, near: 0.1, far: 200 }}
        dpr={[1, 1.8]}
        gl={{ antialias: true }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = SRGBColorSpace;
          gl.toneMapping = ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.55;
        }}
      >
        <color attach="background" args={["#010208"]} />
        <fog attach="fog" args={["#010208", 5, 14]} />

        <ArenaBackdrop />

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

        <HexPlatform accentColor={character.accentColor} />

        <ContactShadows
          position={[0, -0.178, 0]}
          opacity={0.22}
          scale={5}
          blur={2.2}
          far={3.5}
          resolution={256}
          color="#000000"
        />

        <Suspense fallback={<LoadingRing color={character.accentColor} />}>
          {character.available && character.modelPath ? (
            <CoachModel
              modelPath={character.modelPath}
              animationName={currentAnimation}
              accentColor={character.accentColor}
            />
          ) : null}
        </Suspense>
      </Canvas>
    </div>
  );
}
