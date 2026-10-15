import React, { useState } from "react";
import { Plus, Minus, Trash2, Info } from "lucide-react";
import { PartyMember, SourceReference } from "./types";

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

// ───────────────────────────────────────────────────────────
// Regelwerk-Referenz: Buch+Seite UND Weblink, getrennt & gleichzeitig
// ───────────────────────────────────────────────────────────

const hasAnySourceContent = (ref?: SourceReference): boolean =>
  !!ref && (!!ref.book?.trim() || !!ref.page?.trim() || !!ref.url?.trim());

/** Zeigt Buchreferenz und/oder Weblink als getrennte Badges. */
export const SourceReferenceBadges: React.FC<{ value?: SourceReference }> = ({ value }) => {
  if (!hasAnySourceContent(value)) return null;
  const bookLabel = [value?.book, value?.page ? `S. ${value.page}` : undefined].filter(Boolean).join(" ");
  return (
    <>
      {bookLabel && (
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-950/20 border border-amber-900/30 text-amber-300">
          📖 {bookLabel}
        </span>
      )}
      {value?.url && (
        <a
          href={value.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-mono px-2 py-0.5 rounded bg-sky-950/20 border border-sky-900/30 text-sky-300 underline hover:text-sky-200"
        >
          🔗 Quelle ↗
        </a>
      )}
    </>
  );
};

/** Eingabe für Buch, Seite und Link - alle drei unabhängig voneinander. */
export const SourceReferenceEditor: React.FC<{
  value?: SourceReference;
  onChange: (next: SourceReference) => void;
}> = ({ value, onChange }) => {
  const current = value || {};
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
      <div>
        <label className="block text-[9px] text-zinc-500 font-mono uppercase">Regelwerk / Buch</label>
        <input
          value={current.book || ""}
          placeholder="z.B. Grundregelwerk, APG..."
          onChange={(e) => onChange({ ...current, book: e.target.value || undefined })}
          className="w-full bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-[11px] text-white font-mono"
        />
      </div>
      <div>
        <label className="block text-[9px] text-zinc-500 font-mono uppercase">Seite</label>
        <input
          value={current.page || ""}
          placeholder="z.B. 157"
          onChange={(e) => onChange({ ...current, page: e.target.value || undefined })}
          className="w-full bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-[11px] text-white font-mono"
        />
      </div>
      <div>
        <label className="block text-[9px] text-zinc-500 font-mono uppercase">Weblink (optional)</label>
        <input
          value={current.url || ""}
          placeholder="https://..."
          onChange={(e) => onChange({ ...current, url: e.target.value || undefined })}
          className="w-full bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-[11px] text-white font-mono"
        />
      </div>
    </div>
  );
};

// ───────────────────────────────────────────────────────────
// Gruppen-Karte: Name/Spieler immer sichtbar, Rest per Hover oder im Edit-Modus
// ───────────────────────────────────────────────────────────

const PartyMemberRow: React.FC<{
  member: PartyMember;
  isEditing: boolean;
  onChange: (patch: Partial<PartyMember>) => void;
  onRemove: () => void;
}> = ({ member, isEditing, onChange, onRemove }) => {
  const [hovered, setHovered] = useState(false);
  const showDetails = isEditing || hovered;

  if (isEditing) {
    return (
      <div className="p-2.5 bg-black/40 border border-zinc-800 rounded-lg space-y-2">
        <div className="flex items-center gap-2">
          <input
            value={member.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Name"
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm text-white font-mono font-bold"
          />
          <input
            value={member.playerName || ""}
            onChange={(e) => onChange({ playerName: e.target.value || undefined })}
            placeholder="Spielername"
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm text-white font-mono"
          />
          <button onClick={onRemove} className="text-red-400 hover:text-red-300 shrink-0">
            <Trash2 size={14} />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          <input
            value={member.race || ""}
            onChange={(e) => onChange({ race: e.target.value || undefined })}
            placeholder="Rasse"
            className="bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-xs text-white font-mono"
          />
          <input
            value={member.occupation || ""}
            onChange={(e) => onChange({ occupation: e.target.value || undefined })}
            placeholder="Klasse / Beruf"
            className="bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-xs text-white font-mono"
          />
          <input
            value={member.status || ""}
            onChange={(e) => onChange({ status: e.target.value || undefined })}
            placeholder="Status / Malus"
            className="bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-xs text-white font-mono"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-500 font-mono uppercase">TP</span>
          <input
            type="number"
            value={member.hp?.current ?? ""}
            onChange={(e) => onChange({ hp: { ...member.hp, current: Number(e.target.value) } })}
            placeholder="akt."
            className="w-16 bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-xs text-white font-mono text-center"
          />
          <span className="text-zinc-500">/</span>
          <input
            type="number"
            value={member.hp?.max ?? ""}
            onChange={(e) => onChange({ hp: { current: member.hp?.current ?? 0, max: Number(e.target.value) } })}
            placeholder="max"
            className="w-16 bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-xs text-white font-mono text-center"
          />
        </div>
        <textarea
          value={member.note || ""}
          onChange={(e) => onChange({ note: e.target.value || undefined })}
          placeholder="Notizen..."
          className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white font-mono min-h-[40px]"
        />
      </div>
    );
  }

  return (
    <div
      className="p-2.5 bg-black/40 border border-zinc-800 rounded-lg cursor-default"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-white">{member.name}</span>
        {member.playerName && (
          <span className="text-[10px] text-zinc-500 font-mono shrink-0">Spieler: {member.playerName}</span>
        )}
      </div>
      {showDetails && (
        <div className="mt-1.5 pt-1.5 border-t border-zinc-800 space-y-1">
          <div className="text-[11px] text-zinc-400 font-mono">
            {[member.race, member.class, member.occupation].filter(Boolean).join(" · ") || "–"}
          </div>
          {member.status && (
            <div className="text-[11px] font-mono text-red-400">⚠ {member.status}</div>
          )}
          {member.hp && (
            <div className="text-[11px] font-mono text-zinc-400">
              TP: {member.hp.current}{member.hp.max !== undefined ? ` / ${member.hp.max}` : ""}
            </div>
          )}
          {member.note && <p className="text-[11px] text-zinc-500 font-mono">{member.note}</p>}
        </div>
      )}
    </div>
  );
};

export const PartyCard: React.FC<{
  party: PartyMember[];
  isEditing: boolean;
  onUpdate: (party: PartyMember[]) => void;
}> = ({ party, isEditing, onUpdate }) => {
  if (!isEditing && (!party || party.length === 0)) return null;

  const updateMember = (index: number, patch: Partial<PartyMember>) => {
    onUpdate(party.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  };
  const removeMember = (index: number) => {
    onUpdate(party.filter((_, i) => i !== index));
  };
  const addMember = () => {
    onUpdate([...party, { name: "Neues Mitglied" }]);
  };

  return (
    <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-bold text-zinc-300">Gruppe</span>
        {isEditing && (
          <button onClick={addMember} className="flex items-center gap-1 px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-[10px] font-mono rounded-lg text-zinc-300">
            <Plus size={11} /> Mitglied
          </button>
        )}
      </div>
      {party.length === 0 && <p className="text-xs text-zinc-600 font-mono">Keine Gruppenmitglieder hinterlegt.</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {party.map((p, idx) => (
          <PartyMemberRow
            key={idx}
            member={p}
            isEditing={isEditing}
            onChange={(patch) => updateMember(idx, patch)}
            onRemove={() => removeMember(idx)}
          />
        ))}
      </div>
    </div>
  );
};

// ───────────────────────────────────────────────────────────
// Finanz-/Transaktionskarte
// ───────────────────────────────────────────────────────────

export interface CurrencyHistoryEntryDisplay {
  id: string;
  description: string;
  amount: number;
  balanceAfter?: number;
  detail?: string;
  timestamp?: string;
}

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
