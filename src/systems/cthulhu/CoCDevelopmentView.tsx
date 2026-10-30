import React, { useState, useMemo } from "react";
import { PluginViewProps } from "../../core/SystemPlugin";
import { COC_DEVELOPMENT_GUIDE } from "../../utils/levelUpRules";
import { COC_SKILLS } from "../../data/skills/cocSkills";

type TabId = "development" | "sanity" | "skills" | "rules";

export const CoCDevelopmentView: React.FC<PluginViewProps> = ({
  character,
  isEditing,
  onUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>("development");

  // ── Attribute auslesen ─────────────────────────────────
  const getChar = (label: string, def = 0): number => {
    const found = (character.characteristics || []).find(
      (c) => (c.label || "").toUpperCase() === label.toUpperCase()
    );
    return Number(found?.value ?? def);
  };

  const ge    = getChar("GE", 50);
  const bi    = getChar("BI", 50);
  const sanity = Number(
    (character.stats || []).find(
      (s) => (s.label || "").toLowerCase().includes("stabi")
        || (s.label || "").toLowerCase().includes("sanity")
        || (s.label || "").toLowerCase() === "san"
    )?.value ?? Math.floor(bi * 0.9)
  );
  const mythosValue = Number(
    (character.skills || []).find(
      (s) => (s.name || "").toLowerCase().includes("mythos")
    )?.value ?? 0
  );
  const maxSanity = 99 - mythosValue;

  // ── Skills mit checked-Flag ────────────────────────────
  const mergedSkills = useMemo(() => {
    return COC_SKILLS.map((def) => {
      const existing = character.skills.find(
        (s) => (s.name || "").toLowerCase().trim() === def.name.toLowerCase().trim()
      );
      const base    = def.dynamic
        ? (def.name === "Ausweichen" ? Math.floor(ge / 2) : Math.floor(bi / 5))
        : def.base;
      const val     = existing ? Number(existing.value) : base;
      const half    = Math.floor(val / 2);
      const fifth   = Math.floor(val / 5);
      const checked = !!(existing as any)?.checked;
      return { ...def, val, half, fifth, checked, base, existing };
    });
  }, [character.skills, ge, bi]);

  const checkedCount = mergedSkills.filter((s) => s.checked).length;

  // ── Fertigkeit als erfolgreich markieren ──────────────
  const toggleCheck = (skillName: string) => {
    const current = [...character.skills];
    const idx = current.findIndex(
      (s) => (s.name || "").toLowerCase() === skillName.toLowerCase()
    );
    if (idx >= 0) {
      current[idx] = { ...current[idx], checked: !(current[idx] as any).checked };
    } else {
      const def = COC_SKILLS.find((d) => d.name.toLowerCase() === skillName.toLowerCase());
      const base = def?.dynamic
        ? (def.name === "Ausweichen" ? Math.floor(ge / 2) : Math.floor(bi / 5))
        : (def?.base ?? 0);
      current.push({ name: skillName, value: base, checked: true } as any);
    }
    onUpdate({ skills: current });
  };

  // ── Entwicklungsphase: Fertigkeit steigern ─────────────
  const [rollResults, setRollResults] = useState<Record<string, number>>({});
  const [improvementLog, setImprovementLog] = useState<{
    skill: string; oldVal: number; roll: number; gain: number; newVal: number;
  }[]>([]);

  const handleImprove = (skillName: string, rollValue: number) => {
    const skill = mergedSkills.find((s) => s.name === skillName);
    if (!skill) return;

    const improved = rollValue > skill.val || rollValue >= 96;
    if (!improved) {
      setImprovementLog((prev) => [...prev, {
        skill: skillName, oldVal: skill.val, roll: rollValue, gain: 0, newVal: skill.val
      }]);
      return;
    }

    // Gain = 1W10 – user gibt Wert ein
    const gain = Math.floor(Math.random() * 10) + 1;
    const newVal = Math.min(99, skill.val + gain);

    const current = [...character.skills];
    const idx = current.findIndex((s) => (s.name || "").toLowerCase() === skillName.toLowerCase());
    if (idx >= 0) {
      current[idx] = { ...current[idx], value: newVal, checked: false };
    } else {
      current.push({ name: skillName, value: newVal, checked: false } as any);
    }
    onUpdate({ skills: current });
    setImprovementLog((prev) => [...prev, {
      skill: skillName, oldVal: skill.val, roll: rollValue, gain, newVal
    }]);
  };

  // ── Stabilität zurückgeben ────────────────────────────
  const handleSanityReward = (amount: number) => {
    const statIdx = (character.stats || []).findIndex(
      (s) => (s.label || "").toLowerCase().includes("stabi")
        || (s.label || "").toLowerCase() === "san"
    );
    const newStats = [...(character.stats || [])];
    if (statIdx >= 0) {
      const current = Number(newStats[statIdx].value || 0);
      newStats[statIdx] = {
        ...newStats[statIdx],
        value: Math.min(maxSanity, current + amount)
      };
      onUpdate({ stats: newStats });
    }
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: "development", label: "Entwicklung"  },
    { id: "sanity",      label: "Stabilität"   },
    { id: "skills",      label: "Fertigkeiten" },
    { id: "rules",       label: "Regelwerk"    },
  ];

  return (
    <div className="space-y-4">

      {/* HEADER */}
      <div className="p-4 bg-stone-900/80 border border-stone-700/50 rounded-xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wide text-stone-200 font-mono">
              Ermittler-Entwicklung
            </h2>
            <p className="text-[10px] text-stone-500 font-mono mt-0.5">
              Call of Cthulhu 7e · Entwicklungsphase
            </p>
          </div>
          <div className="flex gap-3">
            <div className="text-center">
              <div className="text-[9px] uppercase text-stone-500 font-mono">Markiert</div>
              <div className="text-lg font-black text-amber-400">{checkedCount}</div>
            </div>
            <div className="text-center">
              <div className="text-[9px] uppercase text-stone-500 font-mono">Stabilität</div>
              <div className="text-lg font-black text-emerald-400">{sanity} / {maxSanity}</div>
            </div>
            <div className="text-center">
              <div className="text-[9px] uppercase text-stone-500 font-mono">Mythos</div>
              <div className="text-lg font-black text-purple-400">{mythosValue}</div>
            </div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex items-center gap-1 p-1 bg-stone-900 rounded-xl border border-stone-800 text-xs font-mono overflow-x-auto">
        {tabs.map((tab) => (
          <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab.id
                ? "bg-stone-600 text-white"
                : "text-stone-400 hover:text-white"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB: ENTWICKLUNGSPHASE ── */}
      {activeTab === "development" && (
        <div className="space-y-4">
          <div className="p-3 bg-amber-950/20 border border-amber-800/30 rounded-xl text-xs font-mono text-amber-300">
            Für jede [X]-markierte Fertigkeit: W100 würfeln. Ergebnis &gt; aktueller Wert (oder 96–100) → Steigerung!
          </div>

          {/* Markierte Skills */}
          <div className="p-4 bg-stone-900 border border-stone-800 rounded-xl space-y-2">
            <div className="text-xs font-mono font-bold text-stone-300 border-b border-stone-800 pb-2">
              Markierte Fertigkeiten ({checkedCount})
            </div>
            {checkedCount === 0 ? (
              <p className="text-xs text-stone-600 font-mono italic">
                Keine Fertigkeiten markiert. Im Fertigkeiten-Tab [X] setzen.
              </p>
            ) : (
              <div className="space-y-2">
                {mergedSkills.filter((s) => s.checked).map((skill) => (
                  <div key={skill.name} className="p-3 bg-amber-950/10 border border-amber-800/30 rounded-lg space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <span className="text-sm font-bold text-stone-200">{skill.name}</span>
                        <span className="text-xs text-stone-500 font-mono ml-2">
                          Aktuell: {skill.val}% | Steigerung wenn W100 &gt; {skill.val}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <input
                        type="number"
                        min={1}
                        max={100}
                        placeholder="W100 Ergebnis"
                        value={rollResults[skill.name] ?? ""}
                        onChange={(e) => setRollResults((p) => ({
                          ...p, [skill.name]: Number(e.target.value)
                        }))}
                        className="w-28 text-center bg-stone-950 border border-stone-700 rounded-lg font-mono font-bold text-sm text-white outline-none focus:border-amber-500 py-1.5"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (rollResults[skill.name]) {
                            handleImprove(skill.name, rollResults[skill.name]);
                            setRollResults((p) => { const n = { ...p }; delete n[skill.name]; return n; });
                          }
                        }}
                        disabled={!rollResults[skill.name]}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                          rollResults[skill.name]
                            ? "bg-amber-600 hover:bg-amber-500 text-black cursor-pointer"
                            : "bg-stone-800 text-stone-600 cursor-not-allowed"
                        }`}>
                        Steigerung prüfen
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Verbesserungs-Log */}
          {improvementLog.length > 0 && (
            <div className="p-4 bg-stone-900 border border-stone-800 rounded-xl space-y-2">
              <div className="text-xs font-mono font-bold text-stone-300 border-b border-stone-800 pb-2">
                Ergebnisse dieser Sitzung
              </div>
              <div className="space-y-1 max-h-[200px] overflow-y-auto">
                {[...improvementLog].reverse().map((entry, idx) => (
                  <div key={idx} className={`flex items-center justify-between text-xs font-mono px-2 py-1 rounded ${
                    entry.gain > 0
                      ? "bg-emerald-950/20 border border-emerald-800/30"
                      : "bg-stone-900/60 border border-stone-800"
                  }`}>
                    <span className="text-stone-300">{entry.skill}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-stone-500">W100: {entry.roll}</span>
                      {entry.gain > 0 ? (
                        <span className="text-emerald-400 font-bold">
                          {entry.oldVal}% → {entry.newVal}% (+{entry.gain})
                        </span>
                      ) : (
                        <span className="text-stone-600">Keine Steigerung</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setImprovementLog([])}
                className="text-[10px] text-stone-600 hover:text-stone-400 font-mono cursor-pointer">
                Log leeren
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: STABILITÄT ── */}
      {activeTab === "sanity" && (
        <div className="space-y-4">
          <div className="p-4 bg-stone-900 border border-stone-800 rounded-xl space-y-3">
            <div className="text-xs font-mono font-bold text-stone-300 border-b border-stone-800 pb-2">
              Geistige Stabilität (Sanity)
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-black/40 rounded-xl border border-stone-800">
                <div className="text-[9px] uppercase text-stone-500 font-mono">Aktuell</div>
                <div className="text-2xl font-black text-emerald-400">{sanity}</div>
              </div>
              <div className="p-3 bg-black/40 rounded-xl border border-stone-800">
                <div className="text-[9px] uppercase text-stone-500 font-mono">Maximum</div>
                <div className="text-2xl font-black text-stone-300">{maxSanity}</div>
                <div className="text-[8px] text-stone-600 font-mono">99 - Mythos ({mythosValue})</div>
              </div>
              <div className="p-3 bg-black/40 rounded-xl border border-stone-800">
                <div className="text-[9px] uppercase text-stone-500 font-mono">Cthulhu-Mythos</div>
                <div className="text-2xl font-black text-purple-400">{mythosValue}</div>
              </div>
            </div>

            {/* Stabilität wiederherstellen */}
            <div>
              <div className="text-[10px] uppercase text-stone-500 font-mono mb-2">
                Stabilität zurückgeben (nach erfolgreichem Szenario)
              </div>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <button key={n} type="button"
                    onClick={() => handleSanityReward(n)}
                    className="px-3 py-1.5 bg-emerald-900/30 hover:bg-emerald-800/50 border border-emerald-800/40 text-emerald-300 text-xs font-mono rounded-lg cursor-pointer">
                    +{n}
                  </button>
                ))}
              </div>
            </div>

            {/* Temporärer Wahnsinn */}
            <div className="p-3 bg-red-950/20 border border-red-800/30 rounded-lg text-xs font-mono space-y-1">
              <div className="text-red-300 font-bold">Wahnsinn-Regeln</div>
              <p className="text-stone-400">
                <strong className="text-stone-300">Temporär:</strong> Verlust ≥ 5 in einer Runde → W10 Runden Wahnsinn
              </p>
              <p className="text-stone-400">
                <strong className="text-stone-300">Langfristig:</strong> Verlust ≥ 1/5 der max. Stabilität in einer Sitzung
              </p>
              <p className="text-stone-400">
                <strong className="text-stone-300">Permanent:</strong> Stabilität = 0 → dauerhafter Wahnsinn
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: FERTIGKEITEN ── */}
      {activeTab === "skills" && (
        <div className="p-4 bg-stone-900 border border-stone-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between border-b border-stone-800 pb-2">
            <div className="text-xs font-mono font-bold text-stone-300">
              Alle Fertigkeiten
            </div>
            <div className="text-[9px] font-mono text-stone-500">
              Normal / Schwer (½) / Extrem (⅕) &nbsp;|&nbsp; [X] = erfolgreich angewandt
            </div>
          </div>

          {/* 3-spaltig */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1 max-h-[550px] overflow-y-auto pr-1">
            {mergedSkills.map((skill) => (
              <div key={skill.name}
                className={`flex items-center justify-between px-2 py-1.5 rounded-lg border text-xs transition-colors ${
                  skill.checked
                    ? "bg-amber-950/20 border-amber-700/40"
                    : skill.val > skill.base
                    ? "bg-stone-800/60 border-stone-700/40"
                    : "border-transparent hover:bg-stone-800/30"
                }`}>
                <div className="flex items-center gap-1.5 min-w-0">
                  {/* Erfahrungs-Checkbox */}
                  <input
                    type="checkbox"
                    checked={skill.checked}
                    onChange={() => toggleCheck(skill.name)}
                    className="cursor-pointer h-3 w-3 accent-amber-500 shrink-0"
                    title="Erfolgreich angewandt"
                  />
                  <span className={`truncate font-mono text-[10px] ${
                    skill.checked ? "text-amber-300" : skill.val > skill.base ? "text-stone-200" : "text-stone-500"
                  }`}>
                    {skill.name}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-1 font-mono text-[9px]">
                  {isEditing ? (
                    <input
                      type="number"
                      min={0}
                      max={99}
                      value={skill.val}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        const current = [...character.skills];
                        const idx = current.findIndex(
                          (s) => (s.name || "").toLowerCase() === skill.name.toLowerCase()
                        );
                        if (idx >= 0) {
                          current[idx] = { ...current[idx], value: v };
                        } else {
                          current.push({ name: skill.name, value: v } as any);
                        }
                        onUpdate({ skills: current });
                      }}
                      className="w-9 h-5 text-center font-bold bg-stone-950 border border-stone-700 rounded outline-none focus:border-amber-500 text-white"
                    />
                  ) : (
                    <span className={`font-bold ${skill.val > skill.base ? "text-stone-200" : "text-stone-600"}`}>
                      {skill.val}
                    </span>
                  )}
                  <span className="text-stone-600">/</span>
                  <span className="text-stone-500 w-5 text-center">{skill.half}</span>
                  <span className="text-stone-600">/</span>
                  <span className="text-stone-400 w-4 text-center font-bold">{skill.fifth}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB: REGELWERK ── */}
      {activeTab === "rules" && (
        <div className="p-4 bg-stone-900 border border-stone-800 rounded-xl space-y-3">
          <div className="text-xs font-mono font-bold text-stone-300 border-b border-stone-800 pb-2">
            {COC_DEVELOPMENT_GUIDE.title}
          </div>
          {COC_DEVELOPMENT_GUIDE.steps.map((step, idx) => (
            <div key={idx} className="p-3 bg-black/40 border border-stone-800 rounded-lg space-y-1.5">
              <div className="text-xs font-bold text-stone-200">{step.title}</div>
              <p className="text-[10px] text-stone-400">{step.description}</p>
              <p className="text-[10px] text-amber-400/80 font-mono italic">{step.rules}</p>
            </div>
          ))}

          {/* Würfeltabelle Steigerung */}
          <div className="p-3 bg-black/40 border border-stone-800 rounded-lg space-y-2">
            <div className="text-xs font-bold text-stone-200">Steigerungs-Referenz</div>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
              <div className="p-2 bg-stone-900 rounded border border-stone-700">
                <div className="text-stone-400 mb-1">Schwierigkeitsstufen</div>
                <div className="text-stone-300">Normal: voller Wert</div>
                <div className="text-stone-300">Schwer: ½ Wert</div>
                <div className="text-stone-300">Extrem: ⅕ Wert</div>
              </div>
              <div className="p-2 bg-stone-900 rounded border border-stone-700">
                <div className="text-stone-400 mb-1">Steigerungswurf</div>
                <div className="text-stone-300">W100 &gt; Wert = Steigerung</div>
                <div className="text-stone-300">96-100 = immer Steigerung</div>
                <div className="text-emerald-300">Gewinn: +1W10 %</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
