type SafetyStopScreenProps = {
  onReturnHome: () => void;
  secondaryButton: string;
};

export function SafetyStopScreen({
  onReturnHome,
  secondaryButton,
}: SafetyStopScreenProps) {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center antialiased">
      <div className="w-full max-w-sm">
        <div className="w-16 h-16 bg-red-950/40 text-red-500 rounded-full flex items-center justify-center mb-6 border border-red-900/50 mx-auto"><span className="text-2xl font-black select-none">!</span></div>
        <h2 className="text-3xl font-black mb-3 tracking-tight">Workout Stopped</h2>
        <p className="text-slate-400 text-sm mb-8 leading-relaxed">Safety comes first. This app is not medical advice. Stop exercising if you feel sharp pain, dizziness, chest pain, or unusual discomfort.</p>
        <button onClick={onReturnHome} className={secondaryButton}>Return Home</button>
      </div>
    </main>
  );
}
