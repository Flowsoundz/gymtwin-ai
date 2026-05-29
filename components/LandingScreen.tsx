import Image from "next/image";
import { getAvatarAsset, getAvatarLabel, getAvatarProfile, getAvatarRole } from "@/lib/avatarAssets";
import type { CoachAvatar, TraineeStats } from "@/types";

type LandingScreenProps = {
  userStats: TraineeStats;
  hasResumeSession: boolean;
  onResumeWorkout: () => void;
  onStartWorkout: () => void;
  onViewProgress: () => void;
  onOpenCameraSandbox: () => void;
  onOpenSettings: () => void;
  selectedAvatar: CoachAvatar;
  primaryButton: string;
  secondaryButton: string;
};

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`relative flex items-center justify-center rounded-[1.4rem] border border-blue-400/20 bg-gradient-to-br from-blue-500/22 via-indigo-500/18 to-fuchsia-500/22 shadow-[0_0_28px_rgba(99,102,241,0.24)] ${compact ? "h-11 w-11 text-sm" : "h-14 w-14 text-base"}`}
    >
      <div className="absolute inset-1 rounded-[1.1rem] bg-slate-950/70" />
      <div className="absolute inset-0 rounded-[1.4rem] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_45%)]" />
      <div className="relative flex items-center gap-0.5 font-black tracking-tight text-white">
        <span>G</span>
        <span className="text-blue-300">T</span>
      </div>
    </div>
  );
}

function DashboardStat({
  icon,
  value,
  label,
  accentClass,
}: {
  icon: string;
  value: string | number;
  label: string;
  accentClass: string;
}) {
  return (
    <div className="rounded-[1.4rem] border border-white/8 bg-slate-950/65 p-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <div className="mb-3 flex items-center justify-between">
        <div className={`flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm ${accentClass}`}>
          {icon}
        </div>
        <div className={`h-2 w-2 rounded-full ${accentClass.replace("text-", "bg-")}`} />
      </div>
      <p className={`text-2xl font-black tracking-tight ${accentClass}`}>{value}</p>
      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">{label}</p>
    </div>
  );
}

function SecondaryAction({
  title,
  subtitle,
  onClick,
}: {
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-[1.35rem] border border-white/8 bg-slate-950/60 px-4 py-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition hover:border-blue-400/18 hover:bg-slate-900/80 active:scale-[0.99]"
    >
      <div>
        <p className="text-sm font-black text-slate-100">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-400">{subtitle}</p>
      </div>
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm text-slate-300">
        →
      </div>
    </button>
  );
}

export function LandingScreen({
  userStats,
  hasResumeSession,
  onResumeWorkout,
  onStartWorkout,
  onViewProgress,
  onOpenCameraSandbox,
  onOpenSettings,
  selectedAvatar,
}: LandingScreenProps) {
  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const avatarProfile = getAvatarProfile(selectedAvatar);
  const avatarMeta = {
    name: getAvatarLabel(selectedAvatar),
    subtitle: getAvatarRole(selectedAvatar),
    accent: avatarProfile.accentGradient,
    imagePosition: "object-[center_20%]",
    status: avatarProfile.readyLabel,
    personality: avatarProfile.personality,
  };
  const avatarAsset = getAvatarAsset(selectedAvatar);

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.22),_transparent_24%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.14),_transparent_24%),linear-gradient(180deg,_#020617_0%,_#020617_48%,_#030712_100%)] px-4 pb-10 pt-8 text-white antialiased sm:px-6 sm:pt-10 lg:px-8 lg:py-12">
      <div className="mx-auto w-full max-w-md lg:max-w-5xl xl:max-w-6xl">
        <div className="rounded-[2.25rem] border border-white/8 bg-[linear-gradient(180deg,rgba(15,23,42,0.82),rgba(2,6,23,0.94))] p-5 shadow-[0_30px_80px_rgba(15,23,42,0.5)] backdrop-blur-2xl sm:p-6 lg:rounded-[2.5rem] lg:p-8 xl:p-9">
          <header className="mb-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <BrandMark compact />
              <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-300">AI Home Fitness MVP</p>
                <h1 className="mt-1 bg-gradient-to-r from-white via-blue-100 to-fuchsia-200 bg-clip-text text-3xl font-black tracking-tight text-transparent">
                  GymTwin AI
                </h1>
              </div>
              <div className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.14)]">
                Pro
              </div>
            </div>

            <section className="relative overflow-hidden rounded-[2rem] border border-white/8 bg-slate-950/58 p-5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] lg:p-7">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.24),_transparent_32%),radial-gradient(circle_at_bottom_left,_rgba(168,85,247,0.18),_transparent_34%)]" />
              <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between xl:grid xl:grid-cols-[minmax(0,1.2fr)_320px] xl:gap-8">
                <div className="max-w-full sm:max-w-[56%] lg:max-w-[58%] xl:max-w-none xl:pr-6">
                  <p className="text-[11px] font-black uppercase tracking-[0.26em] text-slate-500">Today&apos;s Dashboard</p>
                  <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-white lg:text-[2.8rem]">
                    AI-guided home workouts built for real-life spaces.
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-slate-400 lg:max-w-xl lg:text-[15px]">
                    Guided training plans, adaptive coaching, and private on-device feedback that help you stay consistent at home.
                  </p>
                  <div className="mt-4 grid gap-2 sm:max-w-xl sm:grid-cols-2">
                    {[
                      "Camera coach for squats, push-ups, and planks",
                      "Voice commands for hands-free control",
                      "Scores, XP, and badges to track progress",
                      "Resume-friendly sessions built for daily training",
                    ].map((item) => (
                      <div key={item} className="rounded-2xl border border-white/8 bg-slate-950/45 px-3 py-2 text-xs font-medium leading-relaxed text-slate-300">
                        {item}
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-xs leading-relaxed text-slate-500">
                    Start with a custom workout, turn on the camera coach when you want live form help, and keep building streaks over time.
                  </p>
                </div>
                <div className="relative mx-auto w-full max-w-[14rem] shrink-0 pt-1 sm:mx-0 sm:w-[12rem] lg:w-[15rem] xl:w-full xl:max-w-[20rem]">
                  <div className="absolute inset-2 rounded-[2rem] bg-gradient-to-br from-blue-500/30 via-indigo-500/20 to-fuchsia-500/30 blur-3xl" />
                  <div className="relative overflow-hidden rounded-[2rem] border border-fuchsia-400/20 bg-slate-900/72 shadow-[0_0_56px_rgba(99,102,241,0.28)] lg:rounded-[2.25rem]">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_30%),radial-gradient(circle_at_bottom,_rgba(99,102,241,0.16),_transparent_38%)]" />
                    <div className="absolute left-4 right-4 top-4 z-20 flex items-center justify-between gap-2">
                      <p className="rounded-full border border-fuchsia-400/18 bg-slate-950/55 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-fuchsia-200 backdrop-blur-md">
                        AI Coach
                      </p>
                      <div className="rounded-full border border-emerald-400/24 bg-emerald-500/12 px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.18)] backdrop-blur-md">
                        Ready
                      </div>
                    </div>
                    <div className={`relative h-72 bg-gradient-to-br ${avatarMeta.accent} sm:h-80 lg:h-[24rem] xl:h-[26rem]`}>
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.14),_transparent_28%)]" />
                      <div className="absolute inset-[10%] rounded-[2rem] border border-blue-300/10" />
                      <div className="absolute inset-x-6 top-12 bottom-24 overflow-hidden rounded-[1.8rem] border border-white/10 bg-slate-950/55 shadow-[0_24px_50px_rgba(2,6,23,0.42)] lg:top-14 lg:bottom-28">
                        <Image
                          src={avatarAsset}
                          alt={`${avatarMeta.name} avatar`}
                          fill
                          sizes="(max-width: 640px) 216px, 224px"
                          className={`relative z-10 object-cover ${avatarMeta.imagePosition}`}
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                        <div className="absolute inset-0 z-0 flex items-center justify-center bg-slate-950/30">
                          <div className="text-center">
                            <div className="mx-auto h-4 w-4 rounded-full bg-blue-200/90" />
                            <div className="mx-auto mt-1 h-7 w-[2px] rounded-full bg-fuchsia-200/90" />
                            <div className="mx-auto -mt-4 h-[2px] w-8 rounded-full bg-blue-200/90" />
                            <div className="mx-auto mt-3 flex items-center justify-center gap-0.5 text-xs font-black tracking-tight text-white">
                              <span>G</span>
                              <span className="text-blue-300">T</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="absolute inset-x-0 bottom-0 z-10 h-28 bg-gradient-to-t from-slate-950 via-slate-950/82 to-transparent" />
                      <div className="absolute inset-x-5 bottom-5 z-20">
                        <p className="text-lg font-black tracking-tight text-white lg:text-xl">{avatarMeta.name}</p>
                        <p className="mt-1 text-[11px] font-black uppercase tracking-[0.22em] text-slate-300">
                          {avatarMeta.subtitle}
                        </p>
                        <p className="mt-2 text-xs font-semibold leading-relaxed text-slate-200">{avatarMeta.personality}</p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-400">{avatarMeta.status}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </header>

          <section className="mb-5 rounded-[1.7rem] border border-fuchsia-400/14 bg-gradient-to-r from-blue-500/10 via-slate-950/30 to-fuchsia-500/10 p-4 text-left shadow-[0_0_32px_rgba(99,102,241,0.12)] xl:px-5 xl:py-5">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-fuchsia-300">AI Camera Coach</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              Camera coach for squats, push-ups, and planks with live pose tracking, private on-device feedback, and no uploads.
            </p>
          </section>

          <section className="mb-6 grid grid-cols-3 gap-3 lg:gap-4 xl:grid-cols-3">
            <DashboardStat icon="🏋️" value={userStats.workoutsCompleted} label="Workouts" accentClass="text-blue-400" />
            <DashboardStat icon="⚡" value={userStats.streak} label="Streak" accentClass="text-fuchsia-400" />
            <DashboardStat icon="⏱" value={userStats.totalMinutes} label="Minutes" accentClass="text-indigo-400" />
          </section>

          <section className="mb-5 space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            {hasResumeSession ? (
              <button
                onClick={onResumeWorkout}
                className="flex w-full items-center justify-between rounded-[1.65rem] border border-blue-400/20 bg-gradient-to-r from-blue-600 to-fuchsia-600 px-4 py-4 text-left shadow-[0_18px_40px_rgba(99,102,241,0.26)] transition hover:brightness-105"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-lg">
                    ▶
                  </div>
                  <div>
                    <p className="text-base font-black text-white">Resume Workout</p>
                    <p className="text-xs text-blue-100/85">Jump back into your active training session</p>
                  </div>
                </div>
                <div className="text-xl text-white/90">→</div>
              </button>
            ) : null}

            <button
              onClick={onStartWorkout}
              className={`flex w-full items-center justify-between rounded-[1.75rem] border border-blue-400/20 bg-gradient-to-r from-blue-600 to-fuchsia-600 px-4 py-4 text-left shadow-[0_18px_40px_rgba(99,102,241,0.26)] transition hover:brightness-105 ${hasResumeSession ? "lg:col-span-1" : "lg:col-span-2"}`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-lg">
                  ▶
                </div>
                <div>
                  <p className="text-base font-black text-white">Start Workout</p>
                  <p className="text-xs text-blue-100/85">Launch a fresh guided GymTwin session</p>
                </div>
              </div>
              <div className="text-xl text-white/90">→</div>
            </button>
          </section>

          <section className="mb-6 space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
            <SecondaryAction
              title="View Progress"
              subtitle="Track your performance over time"
              onClick={onViewProgress}
            />
            <SecondaryAction
              title="Camera Sandbox"
              subtitle="Test the AI camera coach"
              onClick={onOpenCameraSandbox}
            />
          </section>

          <section className="mb-6 grid grid-cols-[minmax(0,1fr)_80px] items-center gap-4 rounded-[1.7rem] border border-blue-400/12 bg-slate-950/58 p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] lg:grid-cols-[minmax(0,1fr)_96px] lg:p-5 xl:grid-cols-[minmax(0,1fr)_112px]">
            <div className="max-w-full">
              <p className="text-sm font-black text-blue-300">Coming next</p>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                Camera form correction with pose tracking, rep counting, and real-time prompts to help tighten technique.
              </p>
            </div>
            <div className="relative h-20 w-20 shrink-0 rounded-[1.5rem] border border-white/8 bg-gradient-to-br from-blue-500/10 to-fuchsia-500/10">
              <div className="absolute left-1/2 top-3 h-3 w-3 -translate-x-1/2 rounded-full bg-blue-300" />
              <div className="absolute left-1/2 top-6 h-5 w-px -translate-x-1/2 bg-blue-300/80" />
              <div className="absolute left-[38%] top-8 h-px w-6 bg-fuchsia-300/80" />
              <div className="absolute left-[44%] top-6 h-8 w-px rotate-35 bg-blue-300/80" />
              <div className="absolute left-[56%] top-6 h-8 w-px -rotate-35 bg-blue-300/80" />
              <div className="absolute left-[44%] top-11 h-8 w-px rotate-15 bg-fuchsia-300/80" />
              <div className="absolute left-[56%] top-11 h-8 w-px -rotate-15 bg-fuchsia-300/80" />
            </div>
          </section>

          <nav className="grid grid-cols-4 gap-2 rounded-[1.6rem] border border-white/8 bg-slate-950/65 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] xl:max-w-3xl xl:mx-auto">
            <button
              type="button"
              onClick={scrollToTop}
              className="rounded-[1.2rem] border border-blue-400/18 bg-gradient-to-r from-blue-500/18 to-fuchsia-500/12 px-2 py-3 text-center transition hover:border-blue-400/28"
            >
              <div className="mx-auto flex h-6 w-6 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[11px] font-black text-white">
                GT
              </div>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.22em] text-white">Home</p>
            </button>
            <button
              type="button"
              onClick={onStartWorkout}
              className="rounded-[1.2rem] px-2 py-3 text-center text-slate-500 transition hover:bg-white/5 hover:text-slate-300"
            >
              <p className="text-lg">◫</p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.22em]">Workouts</p>
            </button>
            <button
              type="button"
              onClick={onViewProgress}
              className="rounded-[1.2rem] px-2 py-3 text-center text-slate-500 transition hover:bg-white/5 hover:text-slate-300"
            >
              <p className="text-lg">◔</p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.22em]">Progress</p>
            </button>
            <button
              type="button"
              onClick={onOpenSettings}
              className="rounded-[1.2rem] px-2 py-3 text-center text-slate-500 transition hover:bg-white/5 hover:text-slate-300"
            >
              <p className="text-lg">⚙</p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em]">Settings</p>
            </button>
          </nav>
        </div>
      </div>
    </main>
  );
}
