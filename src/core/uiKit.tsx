import React from "react";

export const ValueBadge: React.FC<{ label: string; value: React.ReactNode; color?: string }> = ({ label, value, color }) => (
  <div className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-zinc-300 text-[11px] font-mono">
    <span className="text-[9px] text-zinc-500 uppercase mr-1">{label}:</span>
    <strong className={color || "text-zinc-200"}>{value}</strong>
  </div>
);

export const ChargeTracker: React.FC<{
  current: number;
  max: number;
  onToggle: (newCurrent: number) => void;
}> = ({ current, max, onToggle }) => (
  <div className="flex items-center gap-1 flex-wrap">
    {Array.from({ length: max }, (_, i) => {
      const filled = i < current;
      return (
        <button
          key={i}
          onClick={() => onToggle(filled ? i : i + 1)}
          title={filled ? "verbrauchen" : "wiederherstellen"}
          className={`w-5 h-5 rounded border text-[9px] font-mono font-bold transition-colors ${
            filled
              ? "bg-purple-500/20 border-purple-500/50 text-purple-300"
              : "bg-zinc-900 border-zinc-700 text-zinc-600"
          }`}
        >
          {i + 1}
        </button>
      );
    })}
  </div>
);
