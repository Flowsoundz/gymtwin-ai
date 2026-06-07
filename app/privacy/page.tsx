import Link from "next/link";
import type { Metadata } from "next";
import { GYMTWIN_SUPPORT_EMAIL, GYMTWIN_TERMS_PATH } from "@/lib/appInfo";

export const metadata: Metadata = {
  title: "Privacy Policy | GymTwin AI",
  description: "How GymTwin AI handles camera, workout, nutrition, and account data.",
};

const sections = [
  {
    title: "What GymTwin stores",
    body:
      "GymTwin stores workout history, settings, body profile details, nutrition logs, and active-session recovery data so your training experience can continue across sessions.",
  },
  {
    title: "Camera processing",
    body:
      "Camera coaching is designed to run on this device. GymTwin does not intentionally upload your live camera feed or pose landmarks as part of normal workout use.",
  },
  {
    title: "Account sync",
    body:
      "If you sign in, selected settings, streak data, and workout summaries may be synced to GymTwin's Supabase backend so they can be restored on another device.",
  },
  {
    title: "Audio and speech",
    body:
      "GymTwin can generate spoken coaching cues and short countdown tones locally in your browser or app shell. GymTwin does not require access to your personal music accounts to work alongside background music.",
  },
  {
    title: "Your controls",
    body:
      "You can reset local app data from Settings. Signed-in users can also delete synced workout data from Settings. For full account deletion requests, contact support.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_34%),linear-gradient(180deg,_#020617,_#0f172a)] px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-8 shadow-[0_24px_80px_rgba(2,6,23,0.5)] backdrop-blur-xl">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-300">GymTwin AI</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-white">Privacy Policy</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
            This policy describes how GymTwin AI handles workout, account, and device-side coaching data.
            If you need a support response or a deletion request, email{" "}
            <a className="text-cyan-300 underline underline-offset-4" href={`mailto:${GYMTWIN_SUPPORT_EMAIL}`}>
              {GYMTWIN_SUPPORT_EMAIL}
            </a>.
          </p>

          <div className="mt-8 space-y-5">
            {sections.map((section) => (
              <section
                key={section.title}
                className="rounded-[1.5rem] border border-white/8 bg-slate-900/55 p-5"
              >
                <h2 className="text-lg font-black text-white">{section.title}</h2>
                <p className="mt-2 text-sm leading-7 text-slate-300">{section.body}</p>
              </section>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={GYMTWIN_TERMS_PATH}
              className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-black text-slate-100 transition hover:border-cyan-400/30 hover:text-white"
            >
              View Terms of Use
            </Link>
            <Link
              href="/"
              className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-500/15"
            >
              Return to GymTwin
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
