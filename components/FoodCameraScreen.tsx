"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FoodItem } from "@/types";

type DetectedItem = {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  servingSize: string;
  confidence: number;
  portion: number; // multiplier: 0.5 | 0.75 | 1 | 1.25 | 1.5 | 2
};

type ScanPhase = "idle" | "scanning" | "detected" | "confirming";

type FoodCameraScreenProps = {
  onBack: () => void;
  onAddFoodItems: (items: FoodItem[]) => void;
};

// Mock food detection library — replace with real API call when available
const DETECTION_LIBRARY: Omit<DetectedItem, "portion">[] = [
  { name: "Grilled Chicken Breast", calories: 165, protein: 31, carbs: 0,  fats: 4,  servingSize: "100g",    confidence: 94 },
  { name: "Brown Rice (cooked)",    calories: 216, protein: 5,  carbs: 45, fats: 2,  servingSize: "1 cup",   confidence: 88 },
  { name: "Steamed Broccoli",       calories: 55,  protein: 4,  carbs: 11, fats: 1,  servingSize: "1 cup",   confidence: 91 },
  { name: "Sweet Potato",           calories: 103, protein: 2,  carbs: 24, fats: 0,  servingSize: "1 medium",confidence: 86 },
  { name: "Greek Yogurt (plain)",   calories: 100, protein: 17, carbs: 6,  fats: 0,  servingSize: "170g",    confidence: 89 },
  { name: "Salmon Fillet",          calories: 208, protein: 28, carbs: 0,  fats: 10, servingSize: "100g",    confidence: 92 },
  { name: "Avocado",                calories: 160, protein: 2,  carbs: 9,  fats: 15, servingSize: "½ fruit", confidence: 95 },
  { name: "Oatmeal (cooked)",       calories: 154, protein: 5,  carbs: 28, fats: 3,  servingSize: "1 cup",   confidence: 87 },
];

const PORTION_STEPS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];

function scaleMacros(item: DetectedItem): DetectedItem {
  const p = item.portion;
  return {
    ...item,
    calories: Math.round(item.calories * p),
    protein:  Math.round(item.protein  * p),
    carbs:    Math.round(item.carbs    * p),
    fats:     Math.round(item.fats     * p),
  };
}

function ConfidenceTag({
  name, confidence, style,
}: {
  name: string; confidence: number; style: React.CSSProperties;
}) {
  return (
    <div
      className="pointer-events-none absolute animate-[fadeTagIn_0.4s_ease-out_forwards] opacity-0"
      style={style}
    >
      <div className="rounded-xl border border-blue-400/40 bg-slate-950/85 px-3 py-1.5 shadow-[0_0_12px_rgba(59,130,246,0.3)] backdrop-blur-md">
        <p className="text-[11px] font-black text-white">{name}</p>
        <p className="text-[10px] font-bold text-blue-400">{confidence}% Confidence</p>
      </div>
    </div>
  );
}

function PortionAdjuster({
  portion, onChange,
}: {
  portion: number; onChange: (next: number) => void;
}) {
  const idx = PORTION_STEPS.indexOf(portion);
  const dec = () => idx > 0 && onChange(PORTION_STEPS[idx - 1]);
  const inc = () => idx < PORTION_STEPS.length - 1 && onChange(PORTION_STEPS[idx + 1]);

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={dec}
        disabled={idx <= 0}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-white/12 bg-slate-900 text-lg font-black text-white transition hover:border-blue-400/30 disabled:opacity-30"
      >
        −
      </button>
      <span className="min-w-[3rem] text-center text-sm font-black text-blue-400">
        {portion === 1 ? "1× serving" : `${portion}× serving`}
      </span>
      <button
        onClick={inc}
        disabled={idx >= PORTION_STEPS.length - 1}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-white/12 bg-slate-900 text-lg font-black text-white transition hover:border-blue-400/30 disabled:opacity-30"
      >
        +
      </button>
    </div>
  );
}

export function FoodCameraScreen({ onBack, onAddFoodItems }: FoodCameraScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanPhase, setScanPhase] = useState<ScanPhase>("idle");
  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([]);

  // Start camera on mount
  useEffect(() => {
    let cancelled = false;

    async function startCam() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        if (!cancelled) setCameraError("Camera access denied. Allow camera permission and try again.");
      }
    }

    void startCam();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // After a short idle period, simulate detection beginning
  useEffect(() => {
    if (scanPhase !== "idle" || cameraError) return;
    const t = window.setTimeout(() => setScanPhase("scanning"), 1800);
    return () => window.clearTimeout(t);
  }, [scanPhase, cameraError]);

  useEffect(() => {
    if (scanPhase !== "scanning") return;
    const t = window.setTimeout(() => {
      // Pick 1–2 random items from the library
      const shuffled = [...DETECTION_LIBRARY].sort(() => Math.random() - 0.5);
      const count = Math.random() > 0.45 ? 2 : 1;
      setDetectedItems(shuffled.slice(0, count).map((item) => ({ ...item, portion: 1 })));
      setScanPhase("detected");
    }, 2600);
    return () => window.clearTimeout(t);
  }, [scanPhase]);

  function handleCapture() {
    if (scanPhase === "detected") setScanPhase("confirming");
  }

  function handleRescan() {
    setDetectedItems([]);
    setScanPhase("idle");
  }

  function handlePortionChange(idx: number, newPortion: number) {
    setDetectedItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, portion: newPortion } : item))
    );
  }

  function handleConfirm() {
    const now = new Date().toISOString();
    const foodItems: FoodItem[] = detectedItems.map((item) => {
      const scaled = scaleMacros(item);
      return {
        id: `food-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: scaled.name,
        calories: scaled.calories,
        protein: scaled.protein,
        carbs: scaled.carbs,
        fats: scaled.fats,
        servingSize: item.portion === 1 ? item.servingSize : `${item.portion}× ${item.servingSize}`,
        timestamp: now,
      };
    });
    onAddFoodItems(foodItems);
  }

  const confirmTotals = useMemo(() => ({
    calories: detectedItems.reduce((s, i) => s + Math.round(i.calories * i.portion), 0),
    protein:  detectedItems.reduce((s, i) => s + Math.round(i.protein  * i.portion), 0),
    carbs:    detectedItems.reduce((s, i) => s + Math.round(i.carbs    * i.portion), 0),
    fats:     detectedItems.reduce((s, i) => s + Math.round(i.fats     * i.portion), 0),
  }), [detectedItems]);

  const confidenceTagPositions: React.CSSProperties[] = [
    { top: "28%", left: "8%" },
    { top: "55%", right: "8%" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white">
      {/* Camera feed */}
      <div className="relative h-full w-full overflow-hidden">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          autoPlay
          muted
          playsInline
        />

        {/* Neon bounding box guide */}
        {!cameraError && scanPhase !== "confirming" && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative h-[55vw] w-[80vw] max-h-72 max-w-sm">
              {/* Corners */}
              {[
                "top-0 left-0 border-t border-l rounded-tl-2xl",
                "top-0 right-0 border-t border-r rounded-tr-2xl",
                "bottom-0 left-0 border-b border-l rounded-bl-2xl",
                "bottom-0 right-0 border-b border-r rounded-br-2xl",
              ].map((cls, i) => (
                <div key={i} className={`absolute h-10 w-10 border-blue-400/70 ${cls}`} />
              ))}

              {/* Center prompt */}
              <div className="absolute inset-x-0 -bottom-10 flex justify-center">
                <div className="rounded-full border border-blue-400/30 bg-slate-950/75 px-4 py-1.5 backdrop-blur-md">
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-300">
                    {scanPhase === "scanning" ? "Analyzing..." : scanPhase === "detected" ? "Food detected ✓" : "Center your plate in the frame"}
                  </p>
                </div>
              </div>
            </div>

            {/* Confidence tags (appear after detection) */}
            {scanPhase === "detected" &&
              detectedItems.map((item, i) => (
                <ConfidenceTag
                  key={item.name}
                  name={item.name}
                  confidence={item.confidence}
                  style={confidenceTagPositions[i] ?? { top: "40%", left: "10%" }}
                />
              ))}
          </div>
        )}

        {/* Camera error */}
        {cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-950/95 p-8 text-center">
            <p className="text-4xl">📷</p>
            <p className="text-sm font-black text-red-300">{cameraError}</p>
            <button onClick={onBack} className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:bg-white/10">
              Go Back
            </button>
          </div>
        )}

        {/* Scanning pulse overlay */}
        {scanPhase === "scanning" && (
          <div className="pointer-events-none absolute inset-0 animate-pulse bg-blue-500/5" />
        )}

        {/* Top bar */}
        {!cameraError && (
          <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-5 py-4">
            <button
              onClick={onBack}
              className="rounded-full border border-white/12 bg-slate-950/70 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-white backdrop-blur-md transition hover:bg-slate-900/80"
            >
              ← Cancel
            </button>
            <div className="rounded-full border border-blue-400/25 bg-slate-950/70 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-blue-300 backdrop-blur-md">
              AI Food Scanner
            </div>
          </div>
        )}

        {/* Bottom capture bar */}
        {!cameraError && scanPhase !== "confirming" && (
          <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-center gap-4 bg-gradient-to-t from-slate-950/90 to-transparent px-6 pb-8 pt-16">
            {scanPhase === "detected" ? (
              <button
                onClick={handleCapture}
                className="rounded-[1.4rem] bg-gradient-to-r from-blue-600 to-violet-600 px-10 py-4 text-sm font-black uppercase tracking-[0.18em] text-white shadow-[0_0_30px_rgba(99,102,241,0.5)] transition hover:brightness-110 active:scale-[0.98]"
              >
                Add {detectedItems.length === 1 ? "Item" : "Items"} to Log →
              </button>
            ) : (
              <div className="rounded-full border border-white/10 bg-slate-900/60 px-6 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 backdrop-blur-md">
                {scanPhase === "scanning" ? "Identifying food items..." : "Point camera at your meal"}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation sheet — slides up from bottom */}
      {scanPhase === "confirming" && (
        <div className="absolute inset-0 z-20">
          {/* Dimmed backdrop */}
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />

          {/* Sheet */}
          <div className="absolute inset-x-0 bottom-0 rounded-t-[2rem] border-t border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.97),rgba(2,6,23,1))] px-5 pb-8 pt-5 shadow-[0_-20px_60px_rgba(0,0,0,0.5)]">
            {/* Drag handle */}
            <div className="mx-auto mb-5 h-1 w-12 rounded-full bg-white/20" />

            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.26em] text-blue-300">AI Detected</p>
                <h3 className="mt-0.5 text-xl font-black text-white">Confirm Your Meal</h3>
              </div>
              <button onClick={handleRescan} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-300 transition hover:border-white/20">
                Rescan
              </button>
            </div>

            <div className="space-y-3">
              {detectedItems.map((item, idx) => {
                const scaled = scaleMacros(item);
                return (
                  <div key={item.name} className="rounded-[1.4rem] border border-white/8 bg-slate-900/60 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-black text-white">{item.name}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">{item.servingSize} · {item.confidence}% confidence</p>
                      </div>
                      <div className="shrink-0 rounded-full border border-blue-400/20 bg-blue-500/10 px-2.5 py-1 text-[10px] font-black text-blue-300">
                        {scaled.calories} kcal
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                      {[
                        { label: "Protein", value: scaled.protein, color: "text-blue-400" },
                        { label: "Carbs",   value: scaled.carbs,   color: "text-emerald-400" },
                        { label: "Fats",    value: scaled.fats,    color: "text-red-400" },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="rounded-xl border border-white/8 bg-slate-950/50 py-2">
                          <p className={`text-sm font-black ${color}`}>{value}g</p>
                          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-600">{label}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Adjust Portion</span>
                      <PortionAdjuster
                        portion={item.portion}
                        onChange={(p) => handlePortionChange(idx, p)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total summary */}
            <div className="mt-3 rounded-[1.25rem] border border-white/8 bg-slate-950/60 px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Total to Log</p>
                <p className="text-sm font-black text-white">
                  {confirmTotals.calories} kcal · P{confirmTotals.protein}g C{confirmTotals.carbs}g F{confirmTotals.fats}g
                </p>
              </div>
            </div>

            <button
              onClick={handleConfirm}
              className="mt-4 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 py-4 text-sm font-black uppercase tracking-[0.14em] text-white shadow-[0_0_22px_rgba(99,102,241,0.4)] transition hover:brightness-110 active:scale-[0.99]"
            >
              Log {detectedItems.length === 1 ? "This Meal" : `${detectedItems.length} Items`} ✓
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
