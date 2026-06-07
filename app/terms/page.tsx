import Link from "next/link";
import type { Metadata } from "next";
import { GYMTWIN_PRIVACY_PATH, GYMTWIN_SUPPORT_EMAIL } from "@/lib/appInfo";

export const metadata: Metadata = {
  title: "Terms of Use | GymTwin AI",
  description: "Terms of use and safety boundaries for GymTwin AI.",
};

const terms = [
  "GymTwin AI is a fitness coaching product, not a medical device, emergency tool, or professional healthcare substitute.",
  "You are responsible for exercising within your limits and stopping immediately if you feel pain, dizziness, chest pain, or unusual discomfort.",
  "Workout suggestions, form cues, nutrition estimates, and camera feedback are informational and should be used with judgment.",
  "You are responsible for maintaining safe workout space, lighting, and device placement when using camera-based coaching.",
  "GymTwin may evolve during beta and feature behavior can change as models, animations, and tracking logic are updated.",
  "If you create an account, you are responsible for maintaining access to the email identity tied to that account.",
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(217,70,239,0.14),_transparent_32%),linear-gradient(180deg,_#020617,_#111827)] px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-8 shadow-[0_24px_80px_rgba(2,6,23,0.5)] backdrop-blur-xl">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-fuchsia-300">GymTwin AI</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-white">Terms of Use</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
            These terms set the safety and product boundaries for GymTwin AI. Questions can be sent to{" "}
            <a className="text-fuchsia-300 underline underline-offset-4" href={`mailto:${GYMTWIN_SUPPORT_EMAIL}`}>
              {GYMTWIN_SUPPORT_EMAIL}
            </a>.
          </p>

          <div className="mt-8 space-y-4">
            {terms.map((term) => (
              <div key={term} className="rounded-[1.4rem] border border-white/8 bg-slate-900/55 px-5 py-4">
                <p className="text-sm leading-7 text-slate-300">{term}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={GYMTWIN_PRIVACY_PATH}
              className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-black text-slate-100 transition hover:border-fuchsia-400/30 hover:text-white"
            >
              View Privacy Policy
            </Link>
            <Link
              href="/"
              className="rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/10 px-4 py-3 text-sm font-black text-fuchsia-100 transition hover:bg-fuchsia-500/15"
            >
              Return to GymTwin
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
