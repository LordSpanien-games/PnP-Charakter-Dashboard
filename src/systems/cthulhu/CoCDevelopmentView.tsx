import React, { useState, useMemo } from "react";
import { PluginViewProps } from "../../core/SystemPlugin";
import { COC_DEVELOPMENT_GUIDE } from "../../utils/levelUpRules";
import { COC_SKILLS } from "../../data/skills/cocSkills";

type TabId = "development" | "skills" | "sanity" | "rules";

export const CoCDevelopmentView: React.FC<PluginViewProps> = ({
  character,
  isEditing,
  onUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>("development");
  const [showAllSkills, setShowAllSkills] = useState(true);
  const [rollResults, setRollResults] = useState<Record<string, string>>({});
  const [improvementLog, setImprovementLog] = useState<{
    skill: string; oldVal: number; roll: number; gain: number; newVal: number;
  }[]>([]);

  // ── Attribute auslesen ─────────────────────────────────
  const getAttr = (key: string, def = 50): number => {
    const found = (character.attributes || {})[key];
    if (found !== undefined) return Number(found);
    const fromChars = (character.characteristics || []).find(
      (c) => (c.label || "").toUpperCase() === key.toUpperCase()
    );
    return Number(fromChars?.value ?? def);
  };

  const ge = getAttr("GE", 50);
  const bi = getAttr("BI", 50);

  // Stabilität aus stats lesen
  const sanityEntry = (character.stats || []).find(
    (s) => (s.label || "").toLowerCase().includes("stabi")
      || (s.label || "").toLowerCase() === "san"
      || (s.label || "").toLowerCase().includes("sanity")
  );
  const sanity    = Number(sanityEntry?.value ?? Math.floor(bi * 0.9));
  const sanityMax = Number(sanityEntry?.value ?? Math.floor(bi * 0.9));

  const mythosSkill = character.skills.find(
    (s) => (s.name || "").toLowerCase().includes("mythos")
  );
  const mythosValue = Number(mythosSkill?.value ?? 0);
  const maxSanity   = 99 - mythosValue;

  // ── Skills mergen ──────────────────────────────────────
  const mergedSkills = useMemo(() => {
    return COC_SKILLS.map((def) => {
      const existing = character.skills.find(
        (s) => (s.name || "").toLowerCase().trim() === def.name.toLowerCase().trim()
      );
      const base  = def.dynamic
        ? (def.name === "Ausweichen" ? Math.floor(ge / 2) : bi)
        : def.base;
      const val   = existing ? Number(existing.value) : base;
      const half  = Math.floor(val / 2);
      const fifth = Math.floor(val / 5);
      const checked = !!(existing as any)?.checked;
      return { ...def, val, half, fifth, checked, base };
    });
  }, [character.skills, ge, bi]);

  const checkedSkills  = mergedSkills.filter((s) => s.checked);
  const improvedSkills = mergedSkills.filter((s) => s.val > s.base);
  const visibleSkills  = showAllSkills ? mergedSkills : mergedSkills.filter((s) => s.val > s.base);

  // ── Checkbox togglen ──────────────────────────────────
  const toggleCheck = (skillName: string) => {
    const current = [...character.skills];
    const idx = current.findIndex(
      (s) => (s.name || "").toLowerCase() === skillName.toLowerCase()
    );
    if (idx >= 0) {
      current[idx] = { ...current[idx], checked: !(current[idx] as any).checked } as any;
    } else {
      const def = COC_SKILLS.find((d) => d.name.toLowerCase() === skillName.toLowerCase());
      const base = def?.dynamic
        ? (def.name === "Ausweichen" ? Math.floor(ge / 2) : bi)
        : (def?.base ?? 0);
      current.push({ name: skillName, value: base, checked: true } as any);
    }
    onUpdate({ skills: current });
  };

  // ── Skill-Wert ändern ─────────────────────────────────
  const updateSkillValue = (skillName: string, newVal: number) => {
    const current = [...character.skills];
    const idx = current.findIndex(
      (s) => (s.name || "").toLowerCase() === skillName.toLowerCase()
    );
    if (idx >= 0) {
      current[idx] = { ...current[idx], value: newVal };
    } else {
      current.push({ name: skillName, value: newVal } as any);
    }
    onUpdate({ skills: current });
  };

  // ── Entwicklungswurf auswerten ────────────────────────
  const handleImprove = (skillName: string) => {
    const rollRaw = Number(rollResults[skillName]);
    if (!rollRaw || isNaN(rollRaw)) return;

    const skill = mergedSkills.find((s) => s.name === skillName);
    if (!skill) return;

    const improved = rollRaw > skill.val || rollRaw >= 96;
    if (!improved) {
      setImprovementLog((prev) => [{
        skill: skillName, oldVal: skill.val, roll: rollRaw, gain: 0, newVal: skill.val
      }, ...prev]);
      // Häkchen entfernen
      toggleCheck(skillName);
      setRollResults((p) => { const n = { ...p }; delete n[skillName]; return n; });
      return;
    }

    // Gain 1W10 – wird vom Spieler selbst gewürfelt und eingegeben
    const gainRaw = Number(rollResults[`${skillName}_gain`]);
    if (!gainRaw || isNaN(gainRaw)) {
      // Zeige Gain-Eingabe
      setRollResults((p) => ({ ...p, [`${skillName}_awaiting_gain`]: "true" }));
      return;
    }

    const gain   = Math.min(10, Math.max(1, gainRaw));
    const newVal = Math.min(99, skill.val + gain);

    updateSkillValue(skillName, newVal);
    setImprovementLog((prev) => [{
      skill: skillName, oldVal: skill.val, roll: rollRaw, gain, newVal
    }, ...prev]);
    toggleCheck(skillName);
    setRollResults((p) => {
      const n = { ...p };
      delete n[skillName];
      delete n[`${skillName}_gain`];
      delete n[`${skillName}_awaiting_gain`];
      return n;
    });
  };

  // ── Stabilität ändern ─────────────────────────────────
  const handleSanityChange = (delta: number) => {
    const statIdx = (character.stats || []).findIndex(
      (s) => (s.label || "").toLowerCase().includes("stabi")
        || (s.label || "").toLowerCase() === "san"
    );
    const newStats = [...(character.stats || [])];
    if (statIdx >= 0) {
      const current = Number(newStats[statIdx].value || 0);
      newStats[statIdx] = {
        ...newStats[statIdx],
        value: Math.min(maxSanity, Math.max(0, current + delta))
      };
      onUpdate({ stats: newStats });
    }
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: "development", label: "Entwicklung"  },
    { id: "skills",      label: "Fertigkeiten" },
    { id: "sanity",      label: "Stabilität"   },
    { id: "rules",       label: "Regelwerk"    },
  ];

  return (
    <div className="space-y-4">

      {/* ── HEADER ── */}
      <div className="p-4 bg-stone-900/80 border border-stone-700/40 rounded-2xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wide text-stone-200 font-mono">
              Ermittler-Entwicklung
            </h2>
            <p className="text-[10px] text-stone-500 font-mono mt-0.5">
              Call of Cthulhu 7e · Entwicklungsphase & Fertigkeiten
            </p>
          </div>
          <div className="flex gap-4">
            <div className="text-center">
              <div className="text-[9px] uppercase text-stone-500 font-mono">Markiert</div>
              <div className="text-xl font-black text-amber-400">{checkedSkills.length}</div>
            </div>
            <div className="text-center">
              <div className="text-[9px] uppercase text-stone-500 font-mono">Stabilität</div>
              <div className="text-xl font-black text-emerald-400">{sanity} / {maxSanity}</div>
            </div>
            <div className="text-center">
              <div className="text-[9px] uppercase text-stone-500 font-mono">Mythos</div>
              <div className="text-xl font-black text-purple-400">{mythosValue}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
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

      {/* ══ TAB: ENTWICKLUNG ══ */}
      {activeTab === "development" && (
        <div className="space-y-4">
          {/* Hinweis */}
          <div className="p-3 bg-amber-950/20 border border-amber-800/30 rounded-xl text-xs font-mono text-amber-300">
            Für jede [X]-markierte Fertigkeit: W100 würfeln.
            Ergebnis &gt; aktueller Wert (oder 96–100) → Steigerung! Dann 1W10 würfeln und addieren.
          </div>

          {/* Markierte Skills */}
          <div className="p-4 bg-stone-900 border border-stone-800 rounded-2xl space-y-3">
            <div className="text-xs font-mono font-bold text-stone-300 border-b border-stone-800 pb-2">
              Markierte Fertigkeiten ({checkedSkills.length})
            </div>

            {checkedSkills.length === 0 ? (
              <p className="text-xs text-stone-600 font-mono italic">
                Keine Fertigkeiten markiert – im Reiter „Fertigkeiten" [X] setzen.
              </p>
            ) : (
              <div className="space-y-3">
                {checkedSkills.map((skill) => {
                  const awaitingGain = rollResults[`${skill.name}_awaiting_gain`] === "true";
                  return (
                    <div key={skill.name}
                      className="p-3 bg-amber-950/10 border border-amber-800/30 rounded-xl space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-sm font-bold text-stone-200">{skill.name}</span>
                        <span className="text-xs font-mono text-stone-500">
                          Aktuell: <strong className="text-stone-300">{skill.val}%</strong>
                          &nbsp;·&nbsp; Steigerung wenn W100 &gt; {skill.val} oder ≥ 96
                        </span>
                      </div>

                      {!awaitingGain ? (
                        // Schritt 1: W100 eingeben
                        <div className="flex items-center gap-2 flex-wrap">
                          <div>
                            <label className="block text-[9px] text-stone-500 font-mono uppercase mb-0.5">
                              W100 Ergebnis
                            </label>
                            <input
                              type="number" min={1} max={100}
                              placeholder="1–100"
                              value={rollResults[skill.name] ?? ""}
                              onChange={(e) => setRollResults((p) => ({ ...p, [skill.name]: e.target.value }))}
                              className="w-24 text-center bg-stone-950 border border-stone-700 rounded-lg font-mono font-bold text-sm text-white outline-none focus:border-amber-500 py-1.5"
                            />
                          </div>
                          <button type="button"
                            onClick={() => handleImprove(skill.name)}
                            disabled={!rollResults[skill.name]}
                            className={`mt-4 px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                              rollResults[skill.name]
                                ? "bg-amber-700 hover:bg-amber-600 text-black cursor-pointer"
                                : "bg-stone-800 text-stone-600 cursor-not-allowed"
                            }`}>
                            Prüfen
                          </button>
                        </div>
                      ) : (
                        // Schritt 2: 1W10 Gewinn eingeben
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="text-xs font-mono text-emerald-400 font-bold">
                            ✓ Steigerung! Würfle jetzt 1W10:
                          </div>
                          <div>
                            <label className="block text-[9px] text-stone-500 font-mono uppercase mb-0.5">
                              1W10 Ergebnis
                            </label>
                            <input
                              type="number" min={1} max={10}
                              placeholder="1–10"
                              value={rollResults[`${skill.name}_gain`] ?? ""}
                              onChange={(e) => setRollResults((p) => ({
                                ...p, [`${skill.name}_gain`]: e.target.value
                              }))}
                              className="w-20 text-center bg-stone-950 border border-emerald-700 rounded-lg font-mono font-bold text-sm text-emerald-300 outline-none focus:border-emerald-500 py-1.5"
                            />
                          </div>
                          <button type="button"
                            onClick={() => handleImprove(skill.name)}
                            disabled={!rollResults[`${skill.name}_gain`]}
                            className={`mt-4 px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                              rollResults[`${skill.name}_gain`]
                                ? "bg-emerald-700 hover:bg-emerald-600 text-black cursor-pointer"
                                : "bg-stone-800 text-stone-600 cursor-not-allowed"
                            }`}>
                            Steigerung anwenden
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Ergebnislog */}
          {improvementLog.length > 0 && (
            <div className="p-4 bg-stone-900 border border-stone-800 rounded-2xl space-y-2">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <div className="text-xs font-mono font-bold text-stone-300">Ergebnisse</div>
                <button type="button" onClick={() => setImprovementLog([])}
                  className="text-[10px] text-stone-600 hover:text-stone-400 font-mono cursor-pointer">
                  Leeren
                </button>
              </div>
              <div className="space-y-1 max-h-[200px] overflow-y-auto">
                {improvementLog.map((entry, idx) => (
                  <div key={idx} className={`flex items-center justify-between text-xs font-mono px-2 py-1 rounded ${
                    entry.gain > 0
                      ? "bg-emerald-950/20 border border-emerald-800/30"
                      : "bg-stone-950/60 border border-stone-800"
                  }`}>
                    <span className="text-stone-300">{entry.skill}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-stone-500">W100: {entry.roll}</span>
                      {entry.gain > 0 ? (
                        <span className="text-emerald-400 font-bold">
                          {entry.oldVal}% → {entry.newVal}% <span className="text-emerald-600">(+{entry.gain})</span>
                        </span>
                      ) : (
                        <span className="text-stone-600">Keine Steigerung</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ TAB: FERTIGKEITEN ══ */}
      {activeTab === "skills" && (
        <div className="p-4 bg-stone-900 border border-stone-800 rounded-2xl space-y-3">
          {/* Header + Toggle */}
          <div className="flex items-center justify-between border-b border-stone-800 pb-2 flex-wrap gap-2">
            <div>
              <div className="text-xs font-mono font-bold text-stone-300">Fertigkeiten</div>
              <div className="text-[10px] text-stone-500 font-mono mt-0.5">
                {improvedSkills.length} gesteigert · {checkedSkills.length} markiert
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono text-stone-500">
                Normal / Schwer (½) / Extrem (⅕)
              </span>
              <button type="button"
                onClick={() => setShowAllSkills((v) => !v)}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
                  showAllSkills
                    ? "bg-stone-700 border-stone-500 text-stone-200 hover:bg-stone-600"
                    : "bg-stone-800 border-stone-700 text-stone-400 hover:bg-stone-700"
                }`}>
                {showAllSkills ? "◀ Nur gesteigerte" : "▶ Alle anzeigen"}
              </button>
            </div>
          </div>

          {/* Spalten-Header */}
          <div className="grid grid-cols-12 gap-1 text-[8px] uppercase font-bold text-stone-600 border-b border-stone-800 pb-1 px-1">
            <div className="col-span-1 text-center">[X]</div>
            <div className="col-span-5">Fertigkeit</div>
            <div className="col-span-2 text-center">Basis%</div>
            <div className="col-span-2 text-center font-bold text-stone-400">Normal</div>
            <div className="col-span-1 text-center">½</div>
            <div className="col-span-1 text-center">⅕</div>
          </div>

          {/* Skills 3-spaltig */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-0.5 max-h-[560px] overflow-y-auto pr-1">
            {visibleSkills.map((skill) => (
              <div key={skill.name}
                className={`flex items-center justify-between px-1.5 py-1 rounded-lg border text-xs transition-colors ${
                  skill.checked
                    ? "bg-amber-950/20 border-amber-700/40"
                    : skill.val > skill.base
                    ? "bg-stone-800/40 border-stone-700/30"
                    : "border-transparent hover:bg-stone-800/30"
                }`}>
                {/* Checkbox + Name */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <input
                    type="checkbox"
                    checked={skill.checked}
                    onChange={() => toggleCheck(skill.name)}
                    className="cursor-pointer h-3 w-3 accent-amber-500 shrink-0"
                    title="Erfolgreich angewandt – für Entwicklungswurf markieren"
                  />
                  <span className={`truncate font-mono text-[10px] ${
                    skill.checked
                      ? "text-amber-300"
                      : skill.val > skill.base
                      ? "text-stone-200"
                      : "text-stone-500"
                  }`}>
                    {skill.name}
                  </span>
                  <span className="text-[8px] text-stone-600 font-mono shrink-0">
                    ({skill.base}%)
                  </span>
                </div>

                {/* Werte */}
                <div className="flex items-center gap-1 shrink-0 ml-1 font-mono">
                  {isEditing ? (
                    <input
                      type="number" min={0} max={99}
                      value={skill.val}
                      onChange={(e) => updateSkillValue(skill.name, Number(e.target.value))}
                      className="w-9 h-5 text-center font-bold text-[10px] bg-stone-950 border border-stone-700 rounded outline-none focus:border-amber-500 text-white"
                    />
                  ) : (
                    <span className={`font-bold text-[10px] w-8 text-center ${
                      skill.val > skill.base ? "text-stone-200" : "text-stone-600"
                    }`}>
                      {skill.val}
                    </span>
                  )}
                  <span className="text-stone-600 text-[8px]">/</span>
                  <span className="text-stone-500 text-[9px] w-5 text-center">{skill.half}</span>
                  <span className="text-stone-600 text-[8px]">/</span>
                  <span className="text-stone-400 text-[9px] w-4 text-center font-bold">{skill.fifth}</span>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[9px] text-stone-600 font-mono border-t border-stone-800 pt-1">
            [X] = Erfolgreich angewandt → Steigerungswurf in der Entwicklungsphase
          </p>
        </div>
      )}

      {/* ══ TAB: STABILITÄT ══ */}
      {activeTab === "sanity" && (
        <div className="space-y-4">
          <div className="p-4 bg-stone-900 border border-stone-800 rounded-2xl space-y-4">
            <div className="text-xs font-mono font-bold text-stone-300 border-b border-stone-800 pb-2">
              Geistige Stabilität (Sanity)
            </div>

            {/* Werte */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-black/40 rounded-xl border border-stone-800">
                <div className="text-[9px] uppercase text-stone-500 font-mono">Aktuell</div>
                <div className="text-2xl font-black text-emerald-400">{sanity}</div>
              </div>
              <div className="p-3 bg-black/40 rounded-xl border border-stone-800">
                <div className="text-[9px] uppercase text-stone-500 font-mono">Maximum</div>
                <div className="text-2xl font-black text-stone-300">{maxSanity}</div>
                <div className="text-[8px] text-stone-600 font-mono">99 − Mythos ({mythosValue})</div>
              </div>
              <div className="p-3 bg-black/40 rounded-xl border border-stone-800">
                <div className="text-[9px] uppercase text-stone-500 font-mono">Cthulhu-Mythos</div>
                <div className="text-2xl font-black text-purple-400">{mythosValue}</div>
              </div>
            </div>

            {/* Stabilität zurückgeben */}
            <div>
              <div className="text-[10px] uppercase text-stone-500 font-mono mb-2">
                Stabilität zurückgeben (nach erfolgreichem Szenario)
              </div>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <button key={n} type="button"
                    onClick={() => handleSanityChange(n)}
                    className="px-3 py-1.5 bg-emerald-900/30 hover:bg-emerald-800/50 border border-emerald-800/40 text-emerald-300 text-xs font-mono rounded-lg cursor-pointer">
                    +{n}
                  </button>
                ))}
              </div>
            </div>

            {/* Stabilitätsverlust */}
            <div>
              <div className="text-[10px] uppercase text-stone-500 font-mono mb-2">
                Stabilitätsverlust eintragen
              </div>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <button key={n} type="button"
                    onClick={() => handleSanityChange(-n)}
                    className="px-3 py-1.5 bg-red-900/30 hover:bg-red-800/50 border border-red-800/40 text-red-300 text-xs font-mono rounded-lg cursor-pointer">
                    -{n}
                  </button>
                ))}
              </div>
            </div>

            {/* Wahnsinn-Regeln */}
            <div className="p-3 bg-red-950/20 border border-red-800/30 rounded-xl space-y-1.5 text-xs font-mono">
              <div className="text-red-300 font-bold">Wahnsinn-Regeln (CoC 7e)</div>
              <p className="text-stone-400">
                <strong className="text-stone-300">Temporär:</strong> Verlust ≥ 5 in einer Runde → W10 Runden Wahnsinn
              </p>
              <p className="text-stone-400">
                <strong className="text-stone-300">Langfristig:</strong> Verlust ≥ 1/5 der max. Stabilität in einer Sitzung → langfristiger Wahnsinn
              </p>
              <p className="text-stone-400">
                <strong className="text-stone-300">Permanent:</strong> Stabilität = 0 → dauerhafter Wahnsinn
              </p>
              <p className="text-stone-400">
                <strong className="text-stone-300">Mythos-Grenze:</strong> Max. Stabilität = 99 − Cthulhu-Mythos-Wert
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ══ TAB: REGELWERK ══ */}
      {activeTab === "rules" && (
        <div className="p-4 bg-stone-900 border border-stone-800 rounded-2xl space-y-3">
          <div className="text-xs font-mono font-bold text-stone-300 border-b border-stone-800 pb-2">
            {COC_DEVELOPMENT_GUIDE.title}
          </div>
          {COC_DEVELOPMENT_GUIDE.steps.map((step, idx) => (
            <div key={idx} className="p-3 bg-black/40 border border-stone-800 rounded-xl space-y-1.5">
              <div className="text-xs font-bold text-stone-200">{step.title}</div>
              <p className="text-[10px] text-stone-400">{step.description}</p>
              <p className="text-[10px] text-amber-400/80 font-mono italic">{step.rules}</p>
            </div>
          ))}

          {/* Würfel-Referenz */}
          <div className="p-3 bg-black/40 border border-stone-800 rounded-xl space-y-2">
            <div className="text-xs font-bold text-stone-200">Schwierigkeitsstufen & Steigerung</div>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
              <div className="p-2 bg-stone-900 rounded border border-stone-700 space-y-1">
                <div className="text-stone-400 font-bold mb-1">Proben</div>
                <div className="text-stone-300">Normal: voller Wert ≤ W100</div>
                <div className="text-stone-300">Schwer: ½ Wert ≤ W100</div>
                <div className="text-stone-300">Extrem: ⅕ Wert ≤ W100</div>
                <div className="text-emerald-400">Patzer: 96–100</div>
              </div>
              <div className="p-2 bg-stone-900 rounded border border-stone-700 space-y-1">
                <div className="text-stone-400 font-bold mb-1">Steigerung</div>
                <div className="text-stone-300">W100 &gt; Wert = Steigerung</div>
                <div className="text-stone-300">96–100 = immer Steigerung</div>
                <div className="text-emerald-300 font-bold">Gewinn: +1W10 %</div>
                <div className="text-stone-500">Max. 99%</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
