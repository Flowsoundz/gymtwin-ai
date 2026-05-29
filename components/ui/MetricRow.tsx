import type { ReactNode } from "react";

type MetricRowProps = {
  label: string;
  value: ReactNode;
  withBorder?: boolean;
};

export function MetricRow({
  label,
  value,
  withBorder = true,
}: MetricRowProps) {
  return (
    <div className={`flex justify-between ${withBorder ? "border-b border-slate-800/60 pb-2.5" : "pt-1"}`}>
      <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">{label}</span>
      {value}
    </div>
  );
}
