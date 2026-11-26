import React, { useState } from "react";
import { Activity, ScrollText, Target } from "lucide-react";
import {
  AttackProfile,
  AttackSequenceEntry,
  CRITICAL_TOTAL_ROLL_ID,
  rollValueKey,
  TOTAL_ROLL_ID,
} from "./pathfinderAttackProfile";
import { CombatHistoryInput } from "./pathfinderCombatHistory";
import { formatFlat } from "./pathfinderWeaponModel";

/**
 * Würfelübersicht: zeigt für jeden Angriff die Reihenfolge der zu würfelnden
 * Würfel, die festen Schadensanteile ohne Würfel, Eingabefelder für die
 * Würfelergebnisse und am Ende die Summe aller Angriffe.
 *
 * Zwei Eingabemodi:
 *  - "einzeln": je Würfelzeile ein Feld (① 1W6 → 4, ② 1W6 → 3, …)
 *  - "gesamt":  ein Feld je Angriff für das gesamte Würfelergebnis
 *
 * Kritischer Treffer: der Normalwurf mit seinen Eingabewerten bleibt bestehen,
 * zusätzlich erscheint ein Zusatzwurf mit dem Standardschaden der Waffe
 * (ohne Klassen-Hinterhaltwürfel). Zeilensumme = Normalwurf + Zusatzwurf.
 */

export type DiceInputMode = "einzeln" | "gesamt";

export interface DiceRowState {
  rolled: Record<string, number>;
  critical: boolean;
  status: string;
}

const STATUS_OPTIONS = [
  { value: "", label: "–" },
  { value: "blutend", label: "Blutend" },
  { value: "schwächen", label: "Schwächen" },
  { value: "vergiftet", label: "Vergiftet" },
];

const KIND_COLOR: Record<string, string> = {
  native: "text-rose-300",
  extra: "text-orange-300",
  magic: "text-sky-300",
  situational: "text-emerald-300",
};

/** Formatiert einen flachen Bonus; leere Zeichenkette bei 0. */
const flatText = (value: number): string => (value ? formatFlat(value) : "");

export const DiceOverview: React.FC<{
  entries: AttackSequenceEntry[];
  states: Record<string, DiceRowState>;
  onChange: (key: string, patch: Partial<DiceRowState>) => void;
  /** Gesamtmodus: Eingabe des kompletten Würfelergebnisses je Angriff. */
  mode: DiceInputMode;
  onModeChange: (mode: DiceInputMode) => void;
  /** Meldet einen geführten Schlag an die Kampfhistorie. */
  onLogHit?: (input: CombatHistoryInput) => void;
}> = ({ entries, states, onChange, mode, onModeChange, onLogHit }) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const getState = (key: string): DiceRowState =>
    states[key] || { rolled: {}, critical: false, status: "" };

  /** Schaden einer Angriffszeile: Festanteile + Normalwurf (+ Krit-Zusatzwurf). */
  const sumRow = (entry: AttackSequenceEntry, state: DiceRowState): number => {
    const profile = entry.profile;
    const normalRoll =
      mode === "gesamt"
        ? state.rolled[rollValueKey(entry.key, TOTAL_ROLL_ID)] || 0
        : profile.damageLines.reduce(
            (sum, l) =>
              l.active ? sum + (state.rolled[rollValueKey(entry.key, l.id)] || 0) : sum,
            0
          );
    let sum = profile.fixed.total + normalRoll;
    if (state.critical) {
      const critRoll =
        mode === "gesamt"
          ? state.rolled[rollValueKey(entry.key, CRITICAL_TOTAL_ROLL_ID)] || 0
          : profile.criticalLines.reduce(
              (s, l) => s + (state.rolled[rollValueKey(entry.key, l.id)] || 0),
              0
            );
      sum += profile.criticalFixed.total + critRoll;
    }
    return sum;
  };

  const totalDamage = entries.reduce((sum, entry) => sum + sumRow(entry, getState(entry.key)), 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-xs font-mono font-bold text-zinc-300">Würfel-Übersicht</span>
        <div className="flex items-center gap-1 p-0.5 bg-black/40 rounded border border-zinc-800">
          {(["einzeln", "gesamt"] as DiceInputMode[]).map((m) => (
            <button
              key={m}
              onClick={() => onModeChange(m)}
              className={`px-1.5 py-0.5 rounded text-[9px] font-mono ${
                mode === m ? "bg-amber-500 text-black font-bold" : "text-zinc-400 hover:text-white"
              }`}
            >
              Würfel {m === "einzeln" ? "einzeln" : "gesamt"}
            </button>
          ))}
        </div>
      </div>

      <p className="text-[9px] text-zinc-500 font-mono">
        Eine Zeile pro Schlag. Die Ziffern zeigen die Reihenfolge der Würfel. "Fest" sind die
        Schadenspunkte ohne Würfel (Attribut, Verbesserung, Flachboni). Bei "Krit" bleibt der
        Normalwurf erhalten und ein zusätzlicher Standardschadenswurf kommt dazu – ohne
        Klassen-Hinterhaltwürfel, aber inklusive Festanteilen.
        {mode === "gesamt" && " Im Modus gesamt trägst du das komplette Würfelergebnis je Angriff ein."}
      </p>

      {entries.length === 0 ? (
        <p className="text-xs text-zinc-600 font-mono">
          Keine aktive Waffe. Markiere im Inventar eine Waffe als „Aktiv".
        </p>
      ) : (
        <div className="space-y-1">
          {entries.map((entry) => {
            const state = getState(entry.key);
            const profile = entry.profile;
            const fixed = profile.fixed;
            // Der Normalwurf bleibt immer sichtbar – auch bei aktivem Krit.
            const activeLines = profile.damageLines.filter((l) => l.active && (l.dice || l.flat));
            const critLines = state.critical
              ? profile.criticalLines.filter((l) => l.dice || l.flat)
              : [];
            const isOpen = expanded[entry.key] ?? true;

            const rowDamage = sumRow(entry, state);

            return (
              <div key={entry.key} className="bg-black/40 border border-zinc-800 rounded-lg overflow-hidden">
                {/* Kopfzeile der Zeile */}
                <div className="flex items-center gap-2 px-2 py-1 flex-wrap">
                  <span className="text-[10px] font-mono font-bold text-zinc-400 w-6 text-center">
                    {entry.index}.
                  </span>
                  <button
                    onClick={() => setExpanded((p) => ({ ...p, [entry.key]: !isOpen }))}
                    className="text-left flex-1 min-w-[120px]"
                  >
                    <span className="text-xs font-bold text-white">{profile.name}</span>
                    <span className="text-[9px] font-mono text-zinc-400 ml-1.5">({entry.handLabel})</span>
                  </button>

                  <span className="text-[10px] font-mono text-cyan-300 font-bold">
                    {entry.attack >= 0 ? "+" : ""}{entry.attack}
                  </span>

                  <label className="flex items-center gap-1 text-[9px] font-mono text-zinc-400">
                    <input
                      type="checkbox"
                      checked={state.critical}
                      onChange={(e) => onChange(entry.key, { critical: e.target.checked })}
                      className="accent-rose-500"
                      title="Kritischer Treffer: Normalwurf bleibt, zusätzlicher Standardschadenswurf kommt dazu (ohne Klassen-Hinterhalt)"
                    />
                    Krit
                  </label>

                  <select
                    value={state.status}
                    onChange={(e) => onChange(entry.key, { status: e.target.value })}
                    className="bg-zinc-900 border border-zinc-700 rounded text-[9px] text-white font-mono px-0.5 py-0.5"
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>

                  <span className="text-xs font-mono font-bold text-emerald-400 min-w-[34px] text-right">
                    {rowDamage}
                  </span>

                  {onLogHit && (
                    <button
                      onClick={() =>
                        onLogHit({
                          weaponName: profile.name,
                          handLabel: entry.handLabel,
                          attackBonus: entry.attack,
                          damage: rowDamage,
                          critical: state.critical,
                          status: state.status,
                        })
                      }
                      title="Diesen Schlag in die Kampf-Historie übernehmen"
                      className="px-1 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded text-[9px] font-mono transition-colors"
                    >
                      <ScrollText size={11} />
                    </button>
                  )}
                </div>

                {/* Wurfplan */}
                {isOpen && (
                  <div className="px-2 pb-1.5 pt-0.5 border-t border-zinc-800 space-y-1">
                    {/* Feste Anteile ohne Würfel */}
                    <div className="flex flex-wrap gap-1 text-[9px] font-mono">
                      <span className="text-zinc-500 uppercase">Fest:</span>
                      <span className="text-rose-300">
                        normal {flatText(fixed.native) || "0"}
                      </span>
                      <span className="text-sky-300">
                        magisch {flatText(fixed.magic) || "0"}
                      </span>
                      <span className="text-emerald-300">
                        situativ {flatText(fixed.situational) || "0"}
                      </span>
                      {state.critical && (
                        <span className="text-rose-400">
                          (Krit-Fest {flatText(profile.criticalFixed.total) || "0"} zusätzlich)
                        </span>
                      )}
                    </div>

                    {/* Würfelzeilen in Reihenfolge */}
                    {activeLines.length === 0 ? (
                      <p className="text-[9px] text-zinc-500 font-mono">Keine Würfel – nur feste Schadensanteile.</p>
                    ) : mode === "gesamt" ? (
                      <div className="flex flex-wrap items-center gap-1">
                        {activeLines.map((l, i) => (
                          <span
                            key={l.id}
                            className={`text-[10px] font-mono ${KIND_COLOR[l.kind] || "text-zinc-300"}`}
                          >
                            {i + 1}. {l.dice || ""}{flatText(l.flat)}
                            {l.label && l.label !== "Nativ" ? ` (${l.label})` : ""}
                          </span>
                        ))}
                        <span className="text-[10px] font-mono text-zinc-500">→</span>
                        <input
                          type="number"
                          value={state.rolled[rollValueKey(entry.key, TOTAL_ROLL_ID)] || ""}
                          onChange={(e) =>
                            onChange(entry.key, {
                              rolled: {
                                ...state.rolled,
                                [rollValueKey(entry.key, TOTAL_ROLL_ID)]: Number(e.target.value) || 0,
                              },
                            })
                          }
                          placeholder="0"
                          className="w-14 bg-zinc-900 border border-zinc-700 rounded px-0.5 py-0.5 text-[10px] text-white font-mono text-center"
                        />
                        <span className="text-[9px] font-mono text-zinc-500">Würfel gesamt</span>
                      </div>
                    ) : (
                      activeLines.map((l, i) => {
                        const key = rollValueKey(entry.key, l.id);
                        return (
                          <div key={l.id} className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono text-zinc-500 w-4 text-center">
                              {i + 1}.
                            </span>
                            <span className={`text-[10px] font-mono ${KIND_COLOR[l.kind] || "text-zinc-300"}`}>
                              {l.dice || "–"}{flatText(l.flat)}
                            </span>
                            <span className="text-[9px] font-mono text-zinc-500 truncate max-w-[110px]">
                              {l.label}
                            </span>
                            <input
                              type="number"
                              value={state.rolled[key] || ""}
                              onChange={(e) =>
                                onChange(entry.key, {
                                  rolled: { ...state.rolled, [key]: Number(e.target.value) || 0 },
                                })
                              }
                              placeholder="0"
                              className="w-12 bg-zinc-900 border border-zinc-700 rounded px-0.5 py-0.5 text-[10px] text-white font-mono text-center"
                            />
                          </div>
                        );
                      })
                    )}

                    {/* Krit-Zusatzwurf: der Normalwurf oben bleibt erhalten,
                        hier kommt der zweite Standardschadenswurf dazu. */}
                    {state.critical && (
                      <div className="mt-1 pt-1 border-t border-rose-900/50 space-y-1">
                        <div className="flex flex-wrap items-center gap-1 text-[9px] font-mono">
                          <span className="uppercase font-bold text-rose-400">Krit-Zusatzwurf</span>
                          <span className="text-zinc-500">
                            (ab {profile.criticalThreshold}, Standardschaden ohne Klassen-Hinterhalt)
                          </span>
                          <span className="text-rose-300">{profile.criticalSummary}</span>
                        </div>
                        {critLines.length === 0 ? (
                          <p className="text-[9px] text-zinc-500 font-mono">
                            Keine Würfel im Zusatzwurf – nur Festanteile.
                          </p>
                        ) : mode === "gesamt" ? (
                          <div className="flex flex-wrap items-center gap-1">
                            {critLines.map((l, i) => (
                              <span
                                key={l.id}
                                className={`text-[10px] font-mono ${KIND_COLOR[l.kind] || "text-zinc-300"}`}
                              >
                                {i + 1}. {l.dice || ""}{flatText(l.flat)}
                                {l.label && l.label !== "Nativ" ? ` (${l.label})` : ""}
                              </span>
                            ))}
                            <span className="text-[10px] font-mono text-zinc-500">→</span>
                            <input
                              type="number"
                              value={state.rolled[rollValueKey(entry.key, CRITICAL_TOTAL_ROLL_ID)] || ""}
                              onChange={(e) =>
                                onChange(entry.key, {
                                  rolled: {
                                    ...state.rolled,
                                    [rollValueKey(entry.key, CRITICAL_TOTAL_ROLL_ID)]:
                                      Number(e.target.value) || 0,
                                  },
                                })
                              }
                              placeholder="0"
                              className="w-14 bg-zinc-900 border border-rose-800 rounded px-0.5 py-0.5 text-[10px] text-white font-mono text-center"
                            />
                            <span className="text-[9px] font-mono text-zinc-500">Krit-Würfel gesamt</span>
                          </div>
                        ) : (
                          critLines.map((l, i) => {
                            const key = rollValueKey(entry.key, l.id);
                            return (
                              <div key={l.id} className="flex items-center gap-1.5">
                                <span className="text-[10px] font-mono text-rose-500 w-4 text-center">
                                  K{i + 1}.
                                </span>
                                <span className={`text-[10px] font-mono ${KIND_COLOR[l.kind] || "text-zinc-300"}`}>
                                  {l.dice || "–"}{flatText(l.flat)}
                                </span>
                                <span className="text-[9px] font-mono text-zinc-500 truncate max-w-[110px]">
                                  {l.label}
                                </span>
                                <input
                                  type="number"
                                  value={state.rolled[key] || ""}
                                  onChange={(e) =>
                                    onChange(entry.key, {
                                      rolled: { ...state.rolled, [key]: Number(e.target.value) || 0 },
                                    })
                                  }
                                  placeholder="0"
                                  className="w-12 bg-zinc-900 border border-rose-800 rounded px-0.5 py-0.5 text-[10px] text-white font-mono text-center"
                                />
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Gesamtsumme */}
          <div className="flex items-center justify-between px-2 py-1.5 bg-emerald-950/20 border border-emerald-900/40 rounded-lg">
            <span className="text-[10px] font-mono font-bold text-emerald-300 flex items-center gap-1">
              <Target size={12} /> Summe aller Angriffe
            </span>
            <span className="text-sm font-mono font-bold text-emerald-400">{totalDamage}</span>
          </div>
        </div>
      )}
    </div>
  );
};

/** Kompakte Karte mit allen Werten einer Waffe. */
export const WeaponProfileCard: React.FC<{
  profile: AttackProfile;
  onAmmoConsume?: (amount: number) => void;
  children?: React.ReactNode;
}> = ({ profile, onAmmoConsume, children }) => {
  const ammoQty = profile.ammo?.quantity ?? 0;
  return (
    <div className="p-2 bg-black/40 border border-zinc-800 rounded-lg space-y-1">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-bold text-white">{profile.name}</span>
        <span className="text-[9px] uppercase px-1 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-300">
          {profile.handLabel}
        </span>
        {profile.enhancement > 0 && (
          <span className="text-[9px] font-mono text-indigo-300 font-bold">+{profile.enhancement}</span>
        )}
        {profile.weaponType && (
          <span className="text-[9px] font-mono text-zinc-400">{profile.weaponType}</span>
        )}
        {profile.rangeText && (
          <span className="text-[9px] font-mono text-zinc-400">Reichweite {profile.rangeText}</span>
        )}
      </div>

      <div className="flex flex-wrap gap-1 text-[9px] font-mono">
        <span className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded">
          <span className="text-zinc-500 uppercase mr-1">Angriff:</span>
          <strong className="text-cyan-300">{profile.attackString}</strong>
        </span>
        <span className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded">
          <span className="text-zinc-500 uppercase mr-1">Schaden:</span>
          <strong className="text-rose-300">{profile.damageSummary}</strong>
        </span>
        <span className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded">
          <span className="text-zinc-500 uppercase mr-1">Krit ab:</span>
          <strong className="text-amber-300">{profile.criticalThreshold}</strong>
        </span>
        <span className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded">
          <span className="text-zinc-500 uppercase mr-1">Krit-Zusatzwurf:</span>
          <strong className="text-amber-200">{profile.criticalSummary}</strong>
        </span>
      </div>

      {/* Aktiver Wurfplan */}
      {profile.damageLines.filter((l) => l.active && (l.dice || l.flat)).length > 0 && (
        <div className="flex flex-wrap gap-1 text-[9px] font-mono">
          {profile.damageLines
            .filter((l) => l.active && (l.dice || l.flat))
            .map((l, i) => (
              <span
                key={l.id}
                className={`px-1 py-0.5 bg-zinc-900/60 border border-zinc-800 rounded ${KIND_COLOR[l.kind] || "text-zinc-300"}`}
              >
                {i + 1}. {l.dice || ""}{flatText(l.flat)}
                {l.label && l.label !== "Nativ" ? ` (${l.label})` : ""}
              </span>
            ))}
        </div>
      )}

      {/* Munition */}
      {profile.ammo && (
        <div className="flex items-center gap-1.5 pt-0.5">
          <Activity size={11} className="text-zinc-500" />
          <span className="text-[9px] font-mono text-zinc-400">
            Munition: <strong className="text-zinc-200">{profile.ammo.name}</strong>
            {profile.ammo.ammoData?.effect ? ` – ${profile.ammo.ammoData.effect}` : ""}
          </span>
          <span className={`text-[9px] font-mono font-bold ${ammoQty > 0 ? "text-zinc-300" : "text-red-400"}`}>
            {ammoQty} Stück
          </span>
          {onAmmoConsume && (
            <>
              <button
                onClick={() => onAmmoConsume(-1)}
                disabled={ammoQty <= 0}
                className="px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-[9px] font-mono rounded text-zinc-300"
                title="1 Stück verbrauchen"
              >
                −1
              </button>
              <button
                onClick={() => onAmmoConsume(1)}
                className="px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-[9px] font-mono rounded text-zinc-300"
                title="1 Stück zurückbuchen"
              >
                +1
              </button>
            </>
          )}
          {ammoQty <= 0 && (
            <span className="text-[9px] font-mono text-red-400">Keine Munition mehr!</span>
          )}
        </div>
      )}

      {children}
    </div>
  );
};
