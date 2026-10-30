import React, { useState, useMemo } from "react";
import { PluginViewProps } from "../../core/SystemPlugin";
import { SHADOWRUN_KARMA_RULES } from "../../utils/levelUpRules";
import { SHADOWRUN_SKILLS } from "../../data/skills/shadowrunSkills";

// ── Metatyp-Attribut-Maxima (SR5) ─────────────────────────
const METATYPE_MAX_ATTRS: Record<string, Record<string, number>> = {
  Mensch:  { KON: 6, GES: 6, REA: 6, STR: 6, CHA: 6, INT: 6, LOG: 6, WIL: 6, EDG: 7, MAG: 6, RES: 6 },
  Elf:     { KON: 6, GES: 7, REA: 6, STR: 6, CHA: 8, INT: 6, LOG: 6, WIL: 6, EDG: 6, MAG: 6, RES: 6 },
  Zwerg:   { KON: 8, GES: 6, REA: 5, STR: 8, CHA: 6, INT: 6, LOG: 7, WIL: 7, EDG: 6, MAG: 6, RES: 6 },
  Ork:     { KON: 9, GES: 6, REA: 6, STR: 8, CHA: 5, INT: 6, LOG: 5, WIL: 6, EDG: 6, MAG: 6, RES: 6 },
  Troll:   { KON: 10, GES: 5, REA: 6, STR: 10, CHA: 4, INT: 5, LOG: 5, WIL: 6, EDG: 6, MAG: 6, RES: 6 },
};

const ATTR_KEYS = ["KON", "GES", "REA", "STR", "CHA", "INT", "LOG", "WIL", "EDG"] as const;
const ATTR_LABELS: Record<string, string> = {
  KON: "Konstitution", GES: "Geschicklichkeit", REA: "Reaktion",
  STR: "Stärke", CHA: "Charisma", INT: "Intuition",
  LOG: "Logik", WIL: "Willenskraft", EDG: "Edge",
};

type TabId = "overview" | "attrs" | "skills" | "qualities" | "rules";

export const ShadowrunKarmaView: React.FC<PluginViewProps> = ({
  character,
  isEditing,
  onUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  // ── Karma aus systemData lesen ─────────────────────────
  const totalKarma   = Number(character.systemData.totalKarma   ?? 0);
  const spentKarma   = Number(character.systemData.spentKarma   ?? 0);
  const currentKarma = totalKarma - spentKarma;
  const metatype     = (character.systemData.metatype as string) || "Mensch";
  const maxAttrs     = METATYPE_MAX_ATTRS[metatype] || METATYPE_MAX_ATTRS["Mensch"];

  // ── Karma-Ausgaben-Log ─────────────────────────────────
  const karmaLog = (character.systemData.karmaLog as {
    id: string; description: string; cost: number; timestamp: string;
  }[]) || [];

  // ── Pending-Änderungen ─────────────────────────────────
  const [pendingAttrs,  setPendingAttrs]  = useState<Record<string, number>>({});
  const [pendingSkills, setPendingSkills] = useState<Record<string, number>>({});
  const [pendingNote,   setPendingNote]   = useState("");

  // ── Attribut-Kosten berechnen ──────────────────────────
  const attrKarmaCosts = useMemo(() => {
    const costs: Record<string, { current: number; next: number; cost: number; maxed: boolean }> = {};
    ATTR_KEYS.forEach((key) => {
      const current = Number(character.attributes[key]) || 1;
      const delta   = pendingAttrs[key] ?? 0;
      const next    = current + delta;
      const max     = maxAttrs[key] ?? 6;
      costs[key] = {
        current,
        next,
        cost:   next * 5,
        maxed:  current >= max,
      };
    });
    return costs;
  }, [character.attributes, pendingAttrs, maxAttrs]);

  // ── Skill-Kosten berechnen ─────────────────────────────
  const skillKarmaCosts = useMemo(() => {
    return SHADOWRUN_SKILLS.filter((def) => def.category === "active").map((def) => {
      const existing    = character.skills.find((s) => s.name.toLowerCase() === def.name.toLowerCase());
      const current     = Number(existing?.value ?? 0);
      const delta       = pendingSkills[def.name] ?? 0;
      const next        = current + delta;
      const isNew       = current === 0 && next > 0;
      const cost        = isNew ? 2 : next * 2;
      return { ...def, current, next, cost, isNew, hasPending: delta !== 0 };
    });
  }, [character.skills, pendingSkills]);

  // ── Gesamtkosten pending ───────────────────────────────
  const totalPendingCost = useMemo(() => {
    let total = 0;
    ATTR_KEYS.forEach((key) => {
      if ((pendingAttrs[key] ?? 0) > 0) total += attrKarmaCosts[key].cost;
    });
    skillKarmaCosts.forEach((s) => { if (s.hasPending) total += s.cost; });
    return total;
  }, [pendingAttrs, pendingSkills, attrKarmaCosts, skillKarmaCosts]);

  const canConfirm = totalPendingCost > 0 && totalPendingCost <= currentKarma;

  // ── Karma hinzufügen ───────────────────────────────────
  const handleAddKarma = (amount: number) => {
    onUpdate({
      systemData: {
        ...character.systemData,
        totalKarma: totalKarma + amount,
        karmaLog: [
          { id: `k_${Date.now()}`, description: `+${amount} Karma erhalten`, cost: -amount, timestamp: new Date().toLocaleTimeString() },
          ...karmaLog,
        ],
      },
    });
  };

  // ── Karma-Ausgaben bestätigen ──────────────────────────
  const handleConfirm = () => {
    if (!canConfirm) return;

    const newAttrs    = { ...character.attributes };
    const newSkills   = [...character.skills];
    const newLog      = [...karmaLog];
    let   totalCost   = 0;

    // Attribute anwenden
    ATTR_KEYS.forEach((key) => {
      const delta = pendingAttrs[key] ?? 0;
      if (delta > 0) {
        const cost = attrKarmaCosts[key].cost;
        newAttrs[key] = (Number(newAttrs[key]) || 1) + delta;
        totalCost += cost;
        newLog.unshift({
          id: `k_${Date.now()}_${key}`,
          description: `${ATTR_LABELS[key]} ${attrKarmaCosts[key].current} → ${attrKarmaCosts[key].next}`,
          cost,
          timestamp: new Date().toLocaleTimeString(),
        });
      }
    });

    // Skills anwenden
    skillKarmaCosts.forEach((s) => {
      if (s.hasPending) {
        const idx = newSkills.findIndex((sk) => sk.name.toLowerCase() === s.name.toLowerCase());
        if (idx >= 0) {
          newSkills[idx] = { ...newSkills[idx], value: s.next };
        } else {
          newSkills.push({ name: s.name, value: s.next, category: s.category });
        }
        totalCost += s.cost;
        newLog.unshift({
          id: `k_${Date.now()}_${s.name}`,
          description: s.isNew
            ? `Neue Fertigkeit: ${s.name} (Stufe ${s.next})`
            : `${s.name} ${s.current} → ${s.next}`,
          cost: s.cost,
          timestamp: new Date().toLocaleTimeString(),
        });
      }
    });

    onUpdate({
      attributes: newAttrs,
      skills:     newSkills,
      systemData: {
        ...character.systemData,
        spentKarma: spentKarma + totalCost,
        karmaLog:   newLog,
      },
    });

    setPendingAttrs({});
    setPendingSkills({});
    setPendingNote("");
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: "overview",  label: "Übersicht"      },
    { id: "attrs",     label: "Attribute"       },
    { id: "skills",    label: "Fertigkeiten"    },
    { id: "qualities", label: "Qualitäten"      },
    { id: "rules",     label: "Karma-Regeln"    },
  ];

  return (
    <div className="space-y-4">

      {/* KARMA-ÜBERSICHT */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 bg-zinc-900 border border-cyan-800/40 rounded-xl text-center">
          <div className="text-[9px] uppercase text-zinc-500 font-mono mb-1">Gesamt-Karma</div>
          <div className="text-2xl font-black text-cyan-300">{totalKarma}</div>
          {isEditing && (
            <div className="flex justify-center gap-1 mt-2">
              {[1, 2, 3, 5, 10].map((n) => (
                <button key={n} type="button" onClick={() => handleAddKarma(n)}
                  className="px-1.5 py-0.5 bg-cyan-800/40 hover:bg-cyan-700/60 text-cyan-300 text-[10px] font-mono rounded cursor-pointer">
                  +{n}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-center">
          <div className="text-[9px] uppercase text-zinc-500 font-mono mb-1">Ausgegeben</div>
          <div className="text-2xl font-black text-zinc-400">{spentKarma}</div>
        </div>
        <div className={`p-4 rounded-xl text-center border ${
          currentKarma > 0 ? "bg-emerald-950/20 border-emerald-800/40" : "bg-zinc-900 border-zinc-800"
        }`}>
          <div className="text-[9px] uppercase text-zinc-500 font-mono mb-1">Verfügbar</div>
          <div className={`text-2xl font-black ${currentKarma > 0 ? "text-emerald-300" : "text-zinc-600"}`}>
            {currentKarma}
          </div>
        </div>
      </div>

      {/* PENDING KOSTEN */}
      {totalPendingCost > 0 && (
        <div className={`p-3 rounded-xl border flex items-center justify-between flex-wrap gap-3 ${
          canConfirm
            ? "bg-amber-950/20 border-amber-700/50"
            : "bg-rose-950/20 border-rose-700/50"
        }`}>
          <div className="text-xs font-mono">
            <span className={canConfirm ? "text-amber-300" : "text-rose-400"}>
              Ausstehende Kosten: <strong>{totalPendingCost} Karma</strong>
            </span>
            {!canConfirm && (
              <span className="text-rose-400 ml-2">(nicht genug Karma!)</span>
            )}
          </div>
          <div className="flex gap-2">
            <button type="button"
              onClick={() => { setPendingAttrs({}); setPendingSkills({}); }}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-mono rounded-lg cursor-pointer">
              Verwerfen
            </button>
            <button type="button"
              onClick={handleConfirm}
              disabled={!canConfirm}
              className={`px-4 py-1.5 rounded-lg text-[11px] font-mono font-bold transition-all ${
                canConfirm
                  ? "bg-amber-500 hover:bg-amber-400 text-black cursor-pointer"
                  : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
              }`}>
              {totalPendingCost} Karma ausgeben →
            </button>
          </div>
        </div>
      )}

      {/* SUB-TABS */}
      <div className="flex items-center gap-1 p-1 bg-zinc-900 rounded-xl border border-zinc-800 text-xs font-mono overflow-x-auto">
        {tabs.map((tab) => (
          <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab.id ? "bg-cyan-500 text-black" : "text-zinc-400 hover:text-white"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB: ÜBERSICHT ── */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          {/* Karma-Log */}
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
            <div className="text-xs font-mono font-bold text-zinc-300 border-b border-zinc-800 pb-2">
              Karma-Verlauf
            </div>
            {karmaLog.length === 0 ? (
              <p className="text-xs text-zinc-600 font-mono italic">Noch keine Karma-Ausgaben.</p>
            ) : (
              <div className="space-y-1 max-h-[300px] overflow-y-auto">
                {karmaLog.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between text-xs font-mono px-2 py-1 rounded bg-black/30">
                    <span className="text-zinc-300">{entry.description}</span>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[9px] text-zinc-600">{entry.timestamp}</span>
                      <span className={`font-bold ${entry.cost < 0 ? "text-emerald-400" : "text-amber-400"}`}>
                        {entry.cost < 0 ? `+${Math.abs(entry.cost)}` : `-${entry.cost}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Metatyp-Info */}
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
            <div className="text-xs font-mono font-bold text-zinc-300 mb-2">Metatyp: {metatype}</div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {ATTR_KEYS.map((key) => (
                <div key={key} className="text-center bg-black/40 rounded-lg p-2">
                  <div className="text-[8px] uppercase text-zinc-500 font-mono">{key}</div>
                  <div className="text-sm font-bold text-white">{Number(character.attributes[key]) || 1}</div>
                  <div className="text-[8px] text-zinc-600 font-mono">max {maxAttrs[key]}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: ATTRIBUTE ── */}
      {activeTab === "attrs" && (
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
          <div className="text-xs font-mono font-bold text-zinc-300 border-b border-zinc-800 pb-2">
            Attribut steigern – Kosten: Neue Stufe × 5 Karma
          </div>
          <div className="space-y-1.5">
            {ATTR_KEYS.map((key) => {
              const info    = attrKarmaCosts[key];
              const pending = pendingAttrs[key] ?? 0;
              const max     = maxAttrs[key] ?? 6;
              const atMax   = info.current >= max;
              return (
                <div key={key} className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-colors ${
                  pending > 0 ? "bg-cyan-950/30 border-cyan-800/40" : "bg-black/30 border-zinc-800/50"
                }`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[9px] uppercase font-mono text-zinc-400 w-8">{key}</span>
                    <span className="text-xs text-zinc-500 truncate">{ATTR_LABELS[key]}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-black font-mono text-white">
                      {info.current}
                      {pending > 0 && <span className="text-cyan-400"> → {info.next}</span>}
                    </span>
                    <span className="text-[9px] text-zinc-600 font-mono">/{max}</span>
                    {pending > 0 && (
                      <span className="text-[10px] font-mono text-amber-400 bg-amber-900/20 px-1.5 py-0.5 rounded">
                        -{info.cost} Karma
                      </span>
                    )}
                    <div className="flex gap-1">
                      <button type="button"
                        onClick={() => setPendingAttrs((p) => ({ ...p, [key]: Math.max(0, (p[key] ?? 0) - 1) }))}
                        disabled={pending <= 0}
                        className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-30 flex items-center justify-center font-bold text-sm cursor-pointer">
                        −
                      </button>
                      <button type="button"
                        onClick={() => setPendingAttrs((p) => ({ ...p, [key]: (p[key] ?? 0) + 1 }))}
                        disabled={atMax || info.next >= max}
                        className="w-6 h-6 rounded bg-zinc-800 hover:bg-cyan-800 text-zinc-300 disabled:opacity-30 flex items-center justify-center font-bold text-sm cursor-pointer">
                        +
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[9px] text-zinc-600 font-mono italic pt-1">
            Magie & Resonanz kosten ebenfalls Neue Stufe × 5 Karma. Max durch Metatyp begrenzt.
          </p>
        </div>
      )}

      {/* ── TAB: FERTIGKEITEN ── */}
      {activeTab === "skills" && (
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
          <div className="text-xs font-mono font-bold text-zinc-300 border-b border-zinc-800 pb-2">
            Fertigkeiten steigern – Neue Stufe × 2 Karma | Neue Fertigkeit = 2 Karma
          </div>
          <div className="space-y-0.5 max-h-[500px] overflow-y-auto pr-1">
            {skillKarmaCosts.map((skill) => (
              <div key={skill.name}
                className={`flex items-center justify-between px-3 py-1.5 rounded-lg border transition-colors ${
                  skill.hasPending
                    ? "bg-cyan-950/30 border-cyan-800/40"
                    : skill.current > 0
                    ? "bg-black/30 border-zinc-800/50"
                    : "border-transparent hover:bg-zinc-800/30"
                }`}>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[8px] uppercase text-zinc-600 font-mono w-10 truncate">{skill.attr}</span>
                  <span className={`text-xs font-mono truncate ${skill.current > 0 ? "text-zinc-200" : "text-zinc-600"}`}>
                    {skill.name}
                  </span>
                  {skill.isNew && skill.hasPending && (
                    <span className="text-[8px] bg-emerald-900/40 text-emerald-400 px-1 rounded">NEU</span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-black font-mono text-white">
                    {skill.current}
                    {skill.hasPending && <span className="text-cyan-400"> → {skill.next}</span>}
                  </span>
                  {skill.hasPending && (
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-900/20 px-1.5 py-0.5 rounded">
                      -{skill.cost}
                    </span>
                  )}
                  <div className="flex gap-1">
                    <button type="button"
                      onClick={() => setPendingSkills((p) => ({ ...p, [skill.name]: Math.max(0, (p[skill.name] ?? 0) - 1) }))}
                      disabled={(pendingSkills[skill.name] ?? 0) <= 0}
                      className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-30 flex items-center justify-center font-bold text-sm cursor-pointer">
                      −
                    </button>
                    <button type="button"
                      onClick={() => setPendingSkills((p) => ({ ...p, [skill.name]: (p[skill.name] ?? 0) + 1 }))}
                      disabled={skill.next >= 12}
                      className="w-6 h-6 rounded bg-zinc-800 hover:bg-cyan-800 text-zinc-300 disabled:opacity-30 flex items-center justify-center font-bold text-sm cursor-pointer">
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB: QUALITÄTEN ── */}
      {activeTab === "qualities" && (
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-3">
          <div className="text-xs font-mono font-bold text-zinc-300 border-b border-zinc-800 pb-2">
            Qualitäten des Charakters
          </div>
          {character.abilities.filter((a) => a.type === "trait" || a.type === "quality" || a.type === "flaw").length === 0 ? (
            <p className="text-xs text-zinc-600 font-mono italic">Keine Qualitäten hinterlegt.</p>
          ) : (
            <div className="space-y-1.5">
              {character.abilities
                .filter((a) => a.type === "trait" || a.type === "quality" || a.type === "flaw")
                .map((ab, idx) => {
                  const isNeg = ab.type === "flaw" || (ab.effect || "").trim().startsWith("-");
                  return (
                    <div key={idx} className={`p-2 rounded-lg border text-xs ${
                      isNeg
                        ? "bg-rose-950/20 border-rose-800/40"
                        : "bg-emerald-950/20 border-emerald-800/40"
                    }`}>
                      <div className={`font-bold ${isNeg ? "text-rose-300" : "text-emerald-300"}`}>
                        {ab.name}
                      </div>
                      {ab.effect && <p className="text-zinc-400 text-[10px] mt-0.5">{ab.effect}</p>}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: KARMA-REGELN ── */}
      {activeTab === "rules" && (
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
          <div className="text-xs font-mono font-bold text-zinc-300 border-b border-zinc-800 pb-2">
            Karma-Kosten Übersicht (SR5)
          </div>
          <div className="space-y-2">
            {SHADOWRUN_KARMA_RULES.map((rule, idx) => (
              <div key={idx} className="p-3 bg-black/40 border border-zinc-800 rounded-lg">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <span className="text-xs font-bold text-cyan-300">{rule.category}</span>
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-900/20 px-2 py-0.5 rounded shrink-0">
                    {rule.formula}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 font-mono mt-1 italic">{rule.example}</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">{rule.notes}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
