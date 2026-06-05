"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already running as installed PWA
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    // Don't show if user already dismissed this session
    if (sessionStorage.getItem("pwa-prompt-dismissed")) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!promptEvent || dismissed) return null;

  async function handleInstall() {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === "accepted" || outcome === "dismissed") {
      setDismissed(true);
    }
  }

  function handleDismiss() {
    sessionStorage.setItem("pwa-prompt-dismissed", "1");
    setDismissed(true);
  }

  return (
    <div className="fixed bottom-4 inset-x-4 z-[200] flex items-center gap-3 rounded-2xl border border-indigo-400/24 bg-slate-950/95 px-4 py-3 shadow-[0_8px_32px_rgba(99,102,241,0.25)] backdrop-blur-xl sm:inset-x-auto sm:left-1/2 sm:w-full sm:max-w-sm sm:-translate-x-1/2">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-black text-white shadow-[0_0_16px_rgba(99,102,241,0.4)]">
        GT
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-black text-white">Install GymTwin AI</p>
        <p className="text-[10px] leading-snug text-slate-400">Add to home screen for offline access</p>
      </div>
      <button
        onClick={handleInstall}
        className="shrink-0 rounded-xl bg-indigo-600 px-3 py-1.5 text-[11px] font-black text-white shadow-[0_0_12px_rgba(99,102,241,0.4)] transition hover:bg-indigo-500 active:scale-95"
      >
        Install
      </button>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss"
        className="shrink-0 text-slate-600 transition hover:text-slate-400 text-lg leading-none"
      >
        ×
      </button>
    </div>
  );
}
