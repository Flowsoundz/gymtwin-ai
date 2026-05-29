import { FloatingCoachAvatar } from "@/components/FloatingCoachAvatar";
import { getAvatarLabel } from "@/lib/avatarAssets";
import type { CoachAvatar } from "@/types";

type SettingsScreenProps = {
  onBackHome: () => void;
  onOpenCameraSandbox: () => void;
  onOpenModelLab: () => void;
  onResetLocalData?: () => void;
  selectedAvatar?: CoachAvatar;
};

function SettingsCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.7rem] border border-white/8 bg-slate-950/58 p-5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <p className="text-[11px] font-black uppercase tracking-[0.26em] text-blue-300">{title}</p>
      <div className="mt-3 text-sm leading-relaxed text-slate-300">{children}</div>
    </section>
  );
}

export function SettingsScreen({
  onBackHome,
  onOpenCameraSandbox,
  onOpenModelLab,
  onResetLocalData,
  selectedAvatar = "Nova",
}: SettingsScreenProps) {
  return (
    <main className="min-h-screen overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.2),_transparent_24%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.12),_transparent_24%),linear-gradient(180deg,_#020617_0%,_#020617_48%,_#030712_100%)] px-4 pb-10 pt-8 text-white antialiased sm:px-6 lg:px-8 lg:py-12">
      <div className="mx-auto w-full max-w-md lg:max-w-5xl xl:max-w-6xl">
        <div className="rounded-[2.25rem] border border-white/8 bg-[linear-gradient(180deg,rgba(15,23,42,0.82),rgba(2,6,23,0.94))] p-5 shadow-[0_30px_80px_rgba(15,23,42,0.5)] backdrop-blur-2xl sm:p-6 lg:p-8 xl:p-9">
          <header className="mb-6 rounded-[1.9rem] border border-white/8 bg-slate-950/58 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-300">System Controls</p>
            <h2 className="mt-3 bg-gradient-to-r from-white via-blue-100 to-fuchsia-200 bg-clip-text text-4xl font-black tracking-tight text-transparent">
              Settings
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Manage your GymTwin AI beta experience.
            </p>
          </header>

          <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
            <SettingsCard title="Avatar System">
              <div className="space-y-4">
                <div className="max-w-md">
                  <FloatingCoachAvatar
                    selectedAvatar={selectedAvatar}
                    mood="idle"
                    message={`Current coach: ${getAvatarLabel(selectedAvatar)}\n3D coach preview is enabled when model files are available.`}
                    position="inline"
                    compact
                  />
                </div>
                <p className="text-slate-400">Nova and Atlas stay visually consistent across workouts, camera coaching, summaries, and progress screens.</p>
                <button
                  onClick={onOpenModelLab}
                  className="w-full rounded-2xl border border-blue-400/20 bg-gradient-to-r from-blue-600 to-fuchsia-600 px-4 py-4 text-sm font-black text-white shadow-[0_18px_40px_rgba(99,102,241,0.26)] transition hover:brightness-105 active:scale-95"
                >
                  Open 3D Model Lab
                </button>
              </div>
            </SettingsCard>

            <SettingsCard title="Avatar Preferences">
              <p>Nova and Atlas keep the interface personalized across training, camera coaching, and summary screens.</p>
              <p className="mt-2 text-slate-400">Avatar selection is managed from the session builder so the coaching style stays consistent.</p>
            </SettingsCard>

            <SettingsCard title="Voice Commands">
              <p>Voice shortcuts can control sets, camera start/stop, difficulty nudges, and emergency stop flows.</p>
              <p className="mt-2 text-slate-400">Microphone access stays inside the browser and only activates when voice control is turned on.</p>
            </SettingsCard>

            <SettingsCard title="Beta Feedback">
              <p>Help improve GymTwin AI during beta.</p>
              <div className="mt-4 space-y-3">
                <a
                  href="mailto:adonyluisflorencio@gmail.com?subject=GymTwin%20AI%20Beta%20Feedback"
                  className="block w-full rounded-2xl border border-blue-400/20 bg-gradient-to-r from-blue-600 to-fuchsia-600 px-4 py-4 text-center text-sm font-black text-white shadow-[0_18px_40px_rgba(99,102,241,0.26)] transition hover:brightness-105 active:scale-95"
                >
                  Send Beta Feedback
                </a>
                <a
                  href="mailto:adonyluisflorencio@gmail.com?subject=GymTwin%20AI%20Camera%20Issue"
                  className="block w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-4 text-center text-sm font-black text-slate-100 transition hover:border-blue-400/30 hover:bg-slate-800 active:scale-95"
                >
                  Report Camera Issue
                </a>
              </div>
            </SettingsCard>

            <SettingsCard title="Camera Privacy">
              <p>Camera processing stays on this device.</p>
              <p className="mt-2 text-slate-400">Video, images, and pose landmarks are not uploaded.</p>
            </SettingsCard>

            <SettingsCard title="Safety">
              <p>Prototype feedback only — not medical advice.</p>
              <p className="mt-2 text-slate-400">Stop if you feel pain, dizziness, chest pain, or unusual discomfort.</p>
            </SettingsCard>

            <SettingsCard title="Camera Coach">
              <p className="text-slate-400">Open the sandbox to test live pose tracking, squat, push-up, and plank feedback in isolation.</p>
              <button
                onClick={onOpenCameraSandbox}
                className="mt-4 w-full rounded-2xl border border-blue-400/20 bg-gradient-to-r from-blue-600 to-fuchsia-600 px-4 py-4 text-sm font-black text-white shadow-[0_18px_40px_rgba(99,102,241,0.26)] transition hover:brightness-105 active:scale-95"
              >
                Open Camera Sandbox
              </button>
            </SettingsCard>

            <SettingsCard title="Local Data">
              <p>Workout history, stats, and resume sessions are stored locally in this browser.</p>
              {onResetLocalData ? (
                <button
                  onClick={onResetLocalData}
                  className="mt-4 w-full rounded-2xl border border-red-400/18 bg-red-950/25 px-4 py-4 text-sm font-black text-red-200 transition hover:border-red-400/30 hover:bg-red-950/35 active:scale-95"
                >
                  Reset Local App Data
                </button>
              ) : (
                <button
                  disabled
                  aria-disabled="true"
                  className="mt-4 w-full cursor-not-allowed rounded-2xl border border-white/6 bg-slate-900/45 px-4 py-4 text-sm font-black text-slate-500"
                >
                  Reset Local App Data
                </button>
              )}
            </SettingsCard>

            <SettingsCard title="App Info">
              <p>GymTwin AI MVP</p>
              <p className="mt-2 text-slate-400">Camera Coach: Squat, Push-Up, Plank</p>
              <p className="mt-2 text-slate-400">Build: Local beta</p>
            </SettingsCard>
          </div>

          <div className="mt-6 lg:max-w-sm">
            <button
              onClick={onBackHome}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-4 text-sm font-black text-slate-100 transition hover:border-blue-400/30 hover:bg-slate-800 active:scale-95"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
