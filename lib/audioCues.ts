"use client";

let sharedAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return null;
  sharedAudioContext ??= new AudioContextCtor();
  if (sharedAudioContext.state === "suspended") {
    void sharedAudioContext.resume();
  }
  return sharedAudioContext;
}

type ToneOptions = {
  frequency: number;
  durationMs: number;
  startAt: number;
  gain: number;
};

function scheduleTone(context: AudioContext, compressor: DynamicsCompressorNode, options: ToneOptions) {
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(options.frequency, options.startAt);
  oscillator.frequency.exponentialRampToValueAtTime(
    Math.max(options.frequency * 0.82, 180),
    options.startAt + options.durationMs / 1000
  );

  gainNode.gain.setValueAtTime(0.0001, options.startAt);
  gainNode.gain.exponentialRampToValueAtTime(options.gain, options.startAt + 0.015);
  gainNode.gain.exponentialRampToValueAtTime(
    0.0001,
    options.startAt + options.durationMs / 1000
  );

  oscillator.connect(gainNode);
  gainNode.connect(compressor);
  oscillator.start(options.startAt);
  oscillator.stop(options.startAt + options.durationMs / 1000 + 0.02);
}

export function playCountdownCue(step: 3 | 2 | 1) {
  const context = getAudioContext();
  if (!context) return;

  const compressor = context.createDynamicsCompressor();
  compressor.threshold.value = -28;
  compressor.knee.value = 18;
  compressor.ratio.value = 11;
  compressor.attack.value = 0.002;
  compressor.release.value = 0.18;
  compressor.connect(context.destination);

  const now = context.currentTime + 0.01;
  const baseFrequency = step === 3 ? 540 : step === 2 ? 640 : 780;
  scheduleTone(context, compressor, {
    frequency: baseFrequency,
    durationMs: 140,
    startAt: now,
    gain: 0.22,
  });
}

export function playCountdownLaunchCue() {
  const context = getAudioContext();
  if (!context) return;

  const compressor = context.createDynamicsCompressor();
  compressor.threshold.value = -24;
  compressor.knee.value = 22;
  compressor.ratio.value = 12;
  compressor.attack.value = 0.001;
  compressor.release.value = 0.22;
  compressor.connect(context.destination);

  const now = context.currentTime + 0.01;
  scheduleTone(context, compressor, {
    frequency: 920,
    durationMs: 120,
    startAt: now,
    gain: 0.24,
  });
  scheduleTone(context, compressor, {
    frequency: 1280,
    durationMs: 160,
    startAt: now + 0.08,
    gain: 0.2,
  });
}

export function playSetStartCue() {
  const context = getAudioContext();
  if (!context) return;

  const compressor = context.createDynamicsCompressor();
  compressor.threshold.value = -24;
  compressor.knee.value = 16;
  compressor.ratio.value = 10;
  compressor.attack.value = 0.001;
  compressor.release.value = 0.16;
  compressor.connect(context.destination);

  const now = context.currentTime + 0.01;
  scheduleTone(context, compressor, {
    frequency: 720,
    durationMs: 90,
    startAt: now,
    gain: 0.16,
  });
  scheduleTone(context, compressor, {
    frequency: 980,
    durationMs: 110,
    startAt: now + 0.06,
    gain: 0.18,
  });
}
