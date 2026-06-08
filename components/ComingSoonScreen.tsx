"use client";

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

          <div className="relative lg:pl-4">
            <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_24%_24%,rgba(34,211,238,0.12),transparent_32%),radial-gradient(circle_at_74%_74%,rgba(168,85,247,0.12),transparent_30%)] blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(2,6,23,0.96),rgba(15,23,42,0.88))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="rounded-[1.7rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(2,6,23,0.42))] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Launch Preview</p>
                    <p className="mt-1 text-base font-black text-white">Calm UI. Strong coach. Premium feel.</p>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-300">
                    Preview
                  </div>
                </div>

                <div className="mt-5 rounded-[1.5rem] border border-white/8 bg-slate-950/82 p-4">
                  <div className="h-32 rounded-[1.3rem] border border-white/8 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),transparent_40%),linear-gradient(180deg,rgba(15,23,42,0.94),rgba(2,6,23,0.98))]" />
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-white/8 bg-slate-900/70 px-3 py-4 text-center">
                      <p className="text-xl font-black text-blue-300">1</p>
                      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Session</p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-slate-900/70 px-3 py-4 text-center">
                      <p className="text-xl font-black text-cyan-300">AI</p>
                      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Coach</p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-slate-900/70 px-3 py-4 text-center">
                      <p className="text-xl font-black text-slate-200">Mix</p>
                      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Audio</p>
                    </div>
                  </div>
                  <div className="mt-4 rounded-2xl border border-blue-400/16 bg-gradient-to-r from-blue-600 to-fuchsia-600 px-4 py-3 text-center text-sm font-black text-white shadow-[0_0_20px_rgba(59,130,246,0.18)]">
                    Start Workout
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/8 bg-slate-900/70 px-3 py-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Workout Audio</p>
                      <p className="mt-1 text-xs font-bold text-slate-200">Any Background Music</p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-slate-900/70 px-3 py-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Recovery Fuel</p>
                      <p className="mt-1 text-xs font-bold text-slate-200">Recommended Today</p>
                    </div>
                  </div>
                </div>
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
          <p>GymTwin AI launch mode is active locally only and has not been pushed live.</p>
        </footer>
      </div>
    </main>
  );
}
