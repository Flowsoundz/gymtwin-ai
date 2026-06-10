import Link from "next/link";
import type { Metadata } from "next";
import {
  GYMTWIN_PRIVACY_PATH,
  GYMTWIN_SUPPORT_EMAIL,
  GYMTWIN_TERMS_PATH,
} from "@/lib/appInfo";

export const metadata: Metadata = {
  title: "Support | GymTwin AI",
  description: "Support and policy links for GymTwin AI.",
};

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.14),_transparent_30%),linear-gradient(180deg,_#020617,_#0f172a)] px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-slate-950/70 p-8 shadow-[0_24px_80px_rgba(2,6,23,0.5)] backdrop-blur-xl">
        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-300">GymTwin AI</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-white">Support</h1>
        <p className="mt-4 text-sm leading-7 text-slate-300">
          For product help, privacy questions, camera issues, or account deletion requests, contact{" "}
          <a className="text-cyan-300 underline underline-offset-4" href={`mailto:${GYMTWIN_SUPPORT_EMAIL}`}>
            {GYMTWIN_SUPPORT_EMAIL}
          </a>.
        </p>

        <div className="mt-8 grid gap-4">
          <Link
            href={GYMTWIN_PRIVACY_PATH}
            className="rounded-[1.4rem] border border-white/8 bg-slate-900/60 px-5 py-4 text-sm font-bold text-slate-100 transition hover:border-cyan-400/30"
          >
            Privacy Policy
          </Link>
          <Link
            href={GYMTWIN_TERMS_PATH}
            className="rounded-[1.4rem] border border-white/8 bg-slate-900/60 px-5 py-4 text-sm font-bold text-slate-100 transition hover:border-fuchsia-400/30"
          >
            Terms of Use
          </Link>
          <Link
            href="/"
            className="rounded-[1.4rem] border border-cyan-400/20 bg-cyan-500/10 px-5 py-4 text-sm font-bold text-cyan-100 transition hover:bg-cyan-500/15"
          >
            Return to GymTwin
          </Link>
        </div>
      </div>
    </main>
  );
}
