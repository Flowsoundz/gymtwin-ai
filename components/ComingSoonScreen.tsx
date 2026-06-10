"use client";

import Image from "next/image";
import Link from "next/link";

const FEATURE_PILLS = [
  "AI Home Fitness",
  "3D Coach",
  "Camera Coach",
  "Workout Audio",
  "Nutrition Guidance",
];

export function ComingSoonScreen() {
  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.14),_transparent_22%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.16),_transparent_24%),linear-gradient(180deg,_#020617_0%,_#020617_46%,_#030712_100%)] px-4 py-8 text-white antialiased sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col justify-between rounded-[2.25rem] border border-white/8 bg-[linear-gradient(180deg,rgba(15,23,42,0.82),rgba(2,6,23,0.94))] p-6 shadow-[0_30px_80px_rgba(15,23,42,0.5)] backdrop-blur-2xl sm:p-8 lg:p-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.36em] text-cyan-300/90">AI Home Fitness</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">GymTwin AI</h1>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-300">
            Coming Soon
          </div>
        </header>

        <section className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="max-w-2xl lg:pr-6">
            <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-slate-300">
              Premium Launch in Progress
            </div>
            <h2 className="mt-6 bg-gradient-to-r from-white via-slate-100 to-cyan-100 bg-clip-text text-5xl font-black tracking-tight text-transparent sm:text-6xl">
              The next evolution of home fitness is almost here.
            </h2>
            <p className="mt-6 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
              GymTwin AI is preparing a premium launch experience built around adaptive training, cinematic 3D coaching,
              camera-assisted movement feedback, and smarter recovery.
            </p>
            <p className="mt-4 max-w-lg text-sm leading-7 text-slate-400 sm:text-base">
              We&apos;re tightening every detail before public release so the product feels sharp, trustworthy, and unmistakably GymTwin on day one.
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              {FEATURE_PILLS.map((pill) => (
                <span
                  key={pill}
                  className="rounded-full border border-white/8 bg-slate-950/55 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-300"
                >
                  {pill}
                </span>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              <a
                href="mailto:adonyluisflorencio@gmail.com?subject=GymTwin%20AI%20Launch%20Updates"
                className="rounded-2xl border border-blue-400/20 bg-gradient-to-r from-blue-600 to-fuchsia-600 px-5 py-3 text-sm font-black text-white shadow-[0_0_24px_rgba(139,92,246,0.35)] transition hover:brightness-110"
              >
                Join Launch List
              </a>
              <Link
                href="/support"
                className="rounded-2xl border border-white/10 bg-slate-900/80 px-5 py-3 text-sm font-black text-slate-200 transition hover:border-white/20 hover:text-white"
              >
                Contact Support
              </Link>
            </div>
          </div>

          <div className="relative flex items-center justify-center lg:pl-4">
            <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_50%_60%,rgba(168,85,247,0.22),transparent_60%)] blur-2xl" />
            <div className="relative w-full max-w-sm overflow-hidden rounded-[2rem] border border-purple-500/20 shadow-[0_0_80px_rgba(168,85,247,0.18)]">
              <Image
                src="/avatars/nova-portrait.png"
                alt="Nova — GymTwin AI Coach"
                width={720}
                height={960}
                priority
                className="w-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent px-5 pb-5 pt-10">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-purple-300">AI Coach</p>
                <p className="mt-1 text-lg font-black text-white">Nova</p>
                <p className="text-xs text-slate-400">Precision coach · Form-first</p>
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/6 pt-5 text-xs text-slate-500">
          <div className="flex flex-wrap gap-4">
            <Link href="/privacy" className="transition hover:text-slate-300">
              Privacy
            </Link>
            <Link href="/terms" className="transition hover:text-slate-300">
              Terms
            </Link>
            <Link href="/support" className="transition hover:text-slate-300">
              Support
            </Link>
          </div>
          <p>© 2026 GymTwin AI. All rights reserved.</p>
        </footer>
      </div>
    </main>
  );
}
