import React from "react";
import { Plus, Minus } from "lucide-react";
import { PartyMember } from "./types";

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

/** Generische Gruppenanzeige - funktioniert für jedes System, da PartyMember
 * nur Name als Pflichtfeld hat, alles andere ist optional. */
export const PartyCard: React.FC<{ party: PartyMember[] }> = ({ party }) => {
  if (!party || party.length === 0) return null;
  return (
    <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
      <div className="text-xs font-mono font-bold text-zinc-300">Gruppe</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {party.map((p, idx) => (
          <div key={idx} className="p-2.5 bg-black/40 border border-zinc-800 rounded-lg">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-white">{p.name}</span>
              {p.playerName && (
                <span className="text-[10px] text-zinc-500 font-mono shrink-0">Spieler: {p.playerName}</span>
              )}
            </div>
            <div className="text-xs text-zinc-400 font-mono mt-0.5">
              {[p.race, p.class, p.occupation].filter(Boolean).join(" · ") || "–"}
            </div>
            {p.note && <p className="text-[11px] text-zinc-500 font-mono mt-1">{p.note}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

export interface CurrencyHistoryEntryDisplay {
  id: string;
  description: string;
  amount: number;
  balanceAfter?: number;
  detail?: string;
  timestamp?: string;
}

/** Generische Finanz-/Transaktionskarte - funktioniert unabhängig davon,
 * ob die Währung Nuyen, Goldmünzen oder etwas anderes ist. */
export const CurrencyHistoryCard: React.FC<{
  title: string;
  balanceDisplay?: string;
  entries: CurrencyHistoryEntryDisplay[];
}> = ({ title, balanceDisplay, entries }) => {
  if ((!entries || entries.length === 0) && !balanceDisplay) return null;
  return (
    <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
      <div className="text-xs font-mono font-bold text-zinc-300">{title}</div>
      {balanceDisplay && <ValueBadge label="Guthaben" value={balanceDisplay} color="text-emerald-400" />}
      {entries && entries.length > 0 && (
        <div className="space-y-1 pt-1">
          <span className="text-[10px] text-zinc-500 font-mono uppercase">Letzte Transaktionen</span>
          {entries.slice(0, 5).map((h) => (
            <div key={h.id} className="flex items-center justify-between text-[11px] font-mono gap-2">
              <span className="text-zinc-400 truncate flex-1">
                {h.description}{h.detail ? ` (${h.detail})` : ""}
              </span>
              <span className={h.amount >= 0 ? "text-emerald-400 shrink-0" : "text-red-400 shrink-0"}>
                {h.amount >= 0 ? "+" : ""}{h.amount}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
