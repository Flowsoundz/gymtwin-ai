type StatCardProps = {
  value: string | number;
  label: string;
  colorClass?: string;
  suffix?: string;
};

export function StatCard({
  value,
  label,
  colorClass = "text-slate-200",
  suffix,
}: StatCardProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className={`font-black font-mono ${colorClass}`}>
        <span className="text-4xl">{value}</span>
        {suffix ? <span className="text-lg ml-1">{suffix}</span> : null}
      </div>
      <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black">{label}</span>
    </div>
  );
}
