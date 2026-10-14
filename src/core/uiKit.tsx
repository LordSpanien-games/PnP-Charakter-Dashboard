import React from "react";
import { Plus, Minus } from "lucide-react";

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

/**
 * Zeigt gleichzeitig den aktuellen und maximalen Wert mit +/- Knöpfen an -
 * z.B. "7 / 10" für Trefferpunkte oder Schaden. Funktioniert in beide
 * Richtungen: current kann je nach System "verbleibende Gesundheit" oder
 * "erlittener Schaden" bedeuten, die Komponente selbst ist dafür neutral.
 */
export const ValueStepper: React.FC<{
  current: number;
  max?: number;
  onChange: (newCurrent: number) => void;
  step?: number;
  label?: string;
  min?: number;
}> = ({ current, max, onChange, step = 1, label, min = 0 }) => (
  <div className="flex items-center gap-2">
    {label && <span className="text-[10px] text-zinc-500 font-mono uppercase">{label}</span>}
    <button
      onClick={() => onChange(Math.max(min, current - step))}
      className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300"
    >
      <Minus size={12} />
    </button>
    <span className="text-sm font-mono text-white font-bold min-w-[52px] text-center">
      {current}{max !== undefined ? ` / ${max}` : ""}
    </span>
    <button
      onClick={() => onChange(max !== undefined ? Math.min(max, current + step) : current + step)}
      className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300"
    >
      <Plus size={12} />
    </button>
  </div>
);

export const isUrl = (value?: string): boolean => !!value && /^https?:\/\//i.test(value.trim());

/** Zeigt eine Regelwerk-Referenz an - als klickbaren Link, wenn es eine URL
 * ist, sonst als normaler Text-Badge (z.B. "GRW S. 112"). */
export const SourceReferenceBadge: React.FC<{ value: string }> = ({ value }) => {
  if (isUrl(value)) {
    return (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-950/20 border border-amber-900/30 text-amber-300 underline hover:text-amber-200"
      >
        Quelle ↗
      </a>
    );
  }
  return (
    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-950/20 border border-amber-900/30 text-amber-300">
      {value}
    </span>
  );
};

/** Eingabefeld für Regelwerk-Referenz, akzeptiert sowohl Buchseiten-Text
 * als auch Links. */
export const SourceReferenceInput: React.FC<{
  value?: string;
  onChange: (v: string) => void;
}> = ({ value, onChange }) => (
  <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
    <span>Regelwerk-Seite / Link</span>
    <input
      value={value || ""}
      placeholder="z.B. GRW S. 112 oder https://..."
      onChange={(e) => onChange(e.target.value)}
      className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-1.5 py-0.5 text-white"
    />
  </div>
);
