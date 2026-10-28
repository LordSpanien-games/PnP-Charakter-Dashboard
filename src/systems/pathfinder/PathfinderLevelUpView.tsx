import React, { useState, useMemo } from "react";
import { PluginViewProps } from "../../core/SystemPlugin";
import { PATHFINDER_CLASSES } from "../../utils/levelUpRules";
import { PATHFINDER_SKILLS } from "../../data/skills/pathfinderSkills";

// ── Hilfsfunktionen ───────────────────────────────────────
const calculateModifier = (score: number): number => Math.floor((score - 10) / 2);

const getAttrs = (character: any) => ({
  ST: Number(character.attributes?.ST) || 10,
  GE: Number(character.attributes?.GE) || 10,
  KO: Number(character.attributes?.KO) || 10,
  IN: Number(character.attributes?.IN) || 10,
  WE: Number(character.attributes?.WE) || 10,
  CH: Number(character.attributes?.CH) || 10,
});

const getLevel = (character: any): number =>
  Number(character.systemData?.level) || 1;

const getClassId = (character: any): string =>
  (character.systemData?.classId as string) || "rogue";

// ── Komponente ────────────────────────────────────────────
export const PathfinderLevelUpView: React.FC<PluginViewProps> = ({
  character,
  isEditing,
  onUpdate,
}) => {
  const currentLevel = getLevel(character);
  const newLevel = currentLevel + 1;
  const classId = getClassId(character);
  const cls = PATHFINDER_CLASSES[classId];
  const attrs = getAttrs(character);
  const inMod = calculateModifier(attrs.IN);
  const koMod = calculateModifier(attrs.KO);

  // Verfügbare Fertigkeitspunkte für dieses Level
  const skillPointsAvailable = (cls?.skillPointsPerLevel ?? 2) + inMod;
  const [skillPointsSpent, setSkillPointsSpent] = useState(0);
  const skillPointsRemaining = skillPointsAvailable - skillPointsSpent;

  // HP Eingabe
  const [hpRoll, setHpRoll] = useState<number | "">("");
  const hpGain = hpRoll !== "" ? Math.max(1, Number(hpRoll) + koMod) : null;

  // Attributssteigerung (alle 4 Level)
  const isAttrLevel = newLevel % 4 === 0;
  const [chosenAttr, setChosenAttr] = useState<string>("");

  // Skill-Punkte Vergabe: merkt sich welche Skills +1 bekommen haben
  const [skillIncreases, setSkillIncreases] = useState<Record<string, boolean>>({});

  // Neue Klassenmerkmale auf diesem Level [2]
  const newFeatures: string[] = useMemo(() => {
    if (!cls?.keyFeaturesByLevel) return [];
    return cls.keyFeaturesByLevel[newLevel] || [];
  }, [cls, newLevel]);

  // Alle Klassenmerkmale mit Level-Info für die Übersicht
  const allFeaturesByLevel = useMemo(() => {
    if (!cls?.keyFeaturesByLevel) return [];
    return Object.entries(cls.keyFeaturesByLevel)
      .map(([lvl, features]) => ({ level: Number(lvl), features }))
      .sort((a, b) => a.level - b.level);
  }, [cls]);

  // Skills mit aktuellem Wert
  const mergedSkills = useMemo(() => {
    return PATHFINDER_SKILLS.map((def) => {
      const existing = character.skills.find((s: any) => {
        const sName = (s?.name || "").toLowerCase().trim();
        const defName = def.name.toLowerCase().trim();
        if (sName === defName) return true;
        if (def.aliases?.some((a: string) => a.toLowerCase().trim() === sName)) return true;
        return false;
      });
      const currentRanks = existing ? Number(existing.value) : 0;
      const isClassSkill = cls?.classSkills?.some(
        (cs) => cs.toLowerCase() === def.name.toLowerCase()
      ) ?? false;
      return {
        ...def,
        currentRanks,
        isClassSkill,
        hasIncrease: skillIncreases[def.name] ?? false,
      };
    });
  }, [character.skills, skillIncreases, cls]);

  const toggleSkillIncrease = (skillName: string) => {
    const current = skillIncreases[skillName] ?? false;
    if (!current && skillPointsRemaining <= 0) return; // keine Punkte mehr
    setSkillIncreases((prev) => ({ ...prev, [skillName]: !current }));
    setSkillPointsSpent((prev) => (current ? prev - 1 : prev + 1));
  };

  // Level-Up bestätigen
  const handleConfirmLevelUp = () => {
    if (hpRoll === "") return;

    // HP erhöhen
    const currentHp = character.resources?.hp || { current: 0, max: 0 };
    const newMax = (currentHp.max || 0) + (hpGain ?? 0);
    const newCurrent = (currentHp.current || 0) + (hpGain ?? 0);

    // Skills aktualisieren
    const updatedSkills = [...character.skills];
    Object.entries(skillIncreases).forEach(([skillName, increased]) => {
      if (!increased) return;
      const idx = updatedSkills.findIndex(
        (s: any) => (s?.name || "").toLowerCase() === skillName.toLowerCase()
      );
      if (idx >= 0) {
        updatedSkills[idx] = { ...updatedSkills[idx], value: Number(updatedSkills[idx].value) + 1 };
      } else {
        updatedSkills.push({ name: skillName, value: 1, trained: false });
      }
    });

    // Attributssteigerung
    const updatedAttributes = { ...character.attributes };
    if (isAttrLevel && chosenAttr) {
      updatedAttributes[chosenAttr] = (Number(updatedAttributes[chosenAttr]) || 10) + 1;
    }

    // Level erhöhen
    onUpdate({
      systemData: { ...character.systemData, level: newLevel },
      resources: { ...character.resources, hp: { current: newCurrent, max: newMax } },
      skills: updatedSkills,
      attributes: updatedAttributes,
    });

    // Reset
    setHpRoll("");
    setSkillIncreases({});
    setSkillPointsSpent(0);
    setChosenAttr("");
  };

  const canConfirm =
    hpRoll !== "" &&
    skillPointsRemaining === 0 &&
    (!isAttrLevel || chosenAttr !== "");

  return (
    <div className="space-y-6 max-w-3xl mx-auto">

      {/* HEADER */}
      <div className="p-4 bg-amber-950/30 border border-amber-700/50 rounded-2xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-black text-amber-300 font-mono uppercase tracking-wide">
              Level-Up Assistent
            </h2>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              {cls?.name ?? "Unbekannte Klasse"} · Level {currentLevel} → {newLevel}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-mono px-3 py-1 rounded-xl border font-bold ${
              canConfirm
                ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                : "bg-zinc-800 border-zinc-700 text-zinc-500"
            }`}>
              {canConfirm ? "✓ Bereit zum Aufsteigen" : "Noch nicht vollständig"}
            </span>
          </div>
        </div>
      </div>

      {/* SCHRITT 1: HP */}
      <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-3">
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
          <span className="text-xs font-black uppercase text-rose-400 tracking-wide">
            Schritt 1 – Trefferpunkte
          </span>
          <span className="text-[10px] font-mono text-zinc-500">
            Würfel: W{cls?.hitDie ?? 8} · KO-Mod: {koMod >= 0 ? "+" : ""}{koMod}
          </span>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <label className="text-[10px] text-zinc-500 uppercase font-mono block mb-1">
              Dein Wurfergebnis (W{cls?.hitDie ?? 8})
            </label>
            <input
              type="number"
              min={1}
              max={cls?.hitDie ?? 8}
              value={hpRoll}
              onChange={(e) => setHpRoll(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="–"
              className="w-20 text-center bg-zinc-950 border border-zinc-700 rounded-xl font-mono font-black text-lg text-white outline-none focus:border-amber-500 py-2"
            />
          </div>
          {hpGain !== null && (
            <div className="flex items-center gap-3 text-sm font-mono">
              <span className="text-zinc-500">
                {hpRoll} (Wurf) + {koMod >= 0 ? "+" : ""}{koMod} (KO) =
              </span>
              <span className="text-2xl font-black text-rose-400">
                +{hpGain} TP
              </span>
              <span className="text-zinc-600 text-xs">
                (neu: {(character.resources?.hp?.max ?? 0) + hpGain} max)
              </span>
            </div>
          )}
        </div>
        <p className="text-[10px] text-zinc-600 font-mono italic">
          Minimum 1 TP Gewinn (auch bei negativem KO-Mod und Würfelergebnis 1).
        </p>
      </div>

      {/* SCHRITT 2: FERTIGKEITSPUNKTE */}
      <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-3">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2 flex-wrap gap-2">
          <span className="text-xs font-black uppercase text-cyan-400 tracking-wide">
            Schritt 2 – Fertigkeitspunkte
          </span>
          <div className={`text-sm font-black font-mono px-3 py-1 rounded-xl border ${
            skillPointsRemaining === 0
              ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
              : skillPointsRemaining < 0
              ? "bg-rose-500/20 border-rose-500/50 text-rose-300"
              : "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
          }`}>
            {skillPointsSpent} / {skillPointsAvailable} Punkte vergeben
          </div>
        </div>
        <p className="text-[10px] text-zinc-500 font-mono">
          {cls?.name}: {cls?.skillPointsPerLevel ?? 2} + IN-Mod ({inMod >= 0 ? "+" : ""}{inMod}) = {skillPointsAvailable} Punkte · Max. +1 Rang pro Fertigkeit pro Level
        </p>

        {/* Skills Liste */}
        <div className="space-y-0.5 max-h-[400px] overflow-y-auto pr-1">
          {/* Klassenfertigkeiten zuerst */}
          {[true, false].map((showClassSkills) => (
            <div key={String(showClassSkills)}>
              <div className={`text-[9px] uppercase font-bold font-mono px-1 py-0.5 mt-2 mb-1 ${
                showClassSkills ? "text-amber-500" : "text-zinc-600"
              }`}>
                {showClassSkills ? "★ Klassenfertigkeiten" : "Andere Fertigkeiten"}
              </div>
              {mergedSkills
                .filter((s) => s.isClassSkill === showClassSkills)
                .map((skill) => (
                  <div
                    key={skill.name}
                    className={`flex items-center justify-between px-2 py-1.5 rounded-lg transition-colors ${
                      skill.hasIncrease
                        ? "bg-amber-500/15 border border-amber-500/30"
                        : "hover:bg-zinc-800/60"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`text-xs font-mono truncate ${
                        skill.isClassSkill ? "text-zinc-200" : "text-zinc-500"
                      }`}>
                        {skill.name}
                      </span>
                      {skill.isClassSkill && (
                        <span className="text-[8px] text-amber-500 font-mono shrink-0">★</span>
                      )}
                      {skill.trainedOnly && (
                        <span className="text-[8px] text-zinc-600 font-mono shrink-0">†</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[10px] font-mono text-zinc-500">
                        Rang {skill.currentRanks}
                        {skill.hasIncrease && (
                          <span className="text-amber-400 font-bold"> → {skill.currentRanks + 1}</span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleSkillIncrease(skill.name)}
                        disabled={!skill.hasIncrease && skillPointsRemaining <= 0}
                        className={`w-6 h-6 rounded-lg border text-[11px] font-black transition-all cursor-pointer ${
                          skill.hasIncrease
                            ? "bg-amber-500 border-amber-400 text-black hover:bg-amber-400"
                            : skillPointsRemaining <= 0
                            ? "bg-zinc-800 border-zinc-700 text-zinc-700 cursor-not-allowed"
                            : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                        }`}
                      >
                        {skill.hasIncrease ? "✓" : "+"}
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>

      {/* SCHRITT 3: ATTRIBUTSSTEIGERUNG (nur alle 4 Level) */}
      {isAttrLevel && (
        <div className="p-4 bg-zinc-900 border border-amber-700/40 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
            <span className="text-xs font-black uppercase text-amber-400 tracking-wide">
              Schritt 3 – Attributssteigerung
            </span>
            <span className="text-[10px] font-mono text-amber-600">
              Level {newLevel} → +1 auf ein Attribut
            </span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {["ST", "GE", "KO", "IN", "WE", "CH"].map((key) => {
              const currentVal = Number(character.attributes?.[key]) || 10;
              const isChosen = chosenAttr === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setChosenAttr(isChosen ? "" : key)}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    isChosen
                      ? "bg-amber-500/20 border-amber-500 text-amber-300"
                      : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-amber-600 hover:text-white"
                  }`}
                >
                  <div className="text-[9px] uppercase font-mono">{key}</div>
                  <div className="text-base font-black">
                    {currentVal}
                    {isChosen && <span className="text-amber-400"> → {currentVal + 1}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* SCHRITT 4: NEUE KLASSENMERKMALE */}
      <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-3">
        <div className="border-b border-zinc-800 pb-2">
          <span className="text-xs font-black uppercase text-emerald-400 tracking-wide">
            {isAttrLevel ? "Schritt 4" : "Schritt 3"} – Neue Klassenmerkmale auf Level {newLevel}
          </span>
        </div>
        {newFeatures.length > 0 ? (
          <div className="space-y-1.5">
            {newFeatures.map((feature) => (
              <div key={feature} className="flex items-center gap-2 p-2 bg-emerald-950/20 border border-emerald-800/40 rounded-lg">
                <span className="text-emerald-400 text-sm">✦</span>
                <span className="text-xs font-mono text-zinc-200">{feature}</span>
                <span className="text-[9px] font-mono text-zinc-600 ml-auto">Level {newLevel}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-zinc-600 font-mono italic">
            Keine neuen Klassenmerkmale auf Level {newLevel} für {cls?.name ?? "diese Klasse"}.
          </p>
        )}

        {/* Übersicht aller Klassenmerkmale mit Level-Info */}
        <details className="mt-2">
          <summary className="text-[10px] text-zinc-500 font-mono cursor-pointer hover:text-zinc-300 transition-colors">
            ▶ Alle Klassenmerkmale von {cls?.name ?? "dieser Klasse"} anzeigen
          </summary>
          <div className="mt-2 space-y-1.5 max-h-[300px] overflow-y-auto">
            {allFeaturesByLevel.map(({ level, features }) => (
              <div key={level} className={`flex items-start gap-3 p-2 rounded-lg border text-xs font-mono ${
                level === newLevel
                  ? "bg-emerald-950/20 border-emerald-800/40 text-zinc-200"
                  : level <= currentLevel
                  ? "bg-zinc-950/40 border-zinc-800/40 text-zinc-500"
                  : "bg-zinc-900/40 border-zinc-800/20 text-zinc-600"
              }`}>
                <span className={`font-black shrink-0 w-12 text-center py-0.5 rounded ${
                  level === newLevel
                    ? "bg-emerald-500/20 text-emerald-400"
                    : level <= currentLevel
                    ? "text-zinc-600"
                    : "text-zinc-700"
                }`}>
                  Lvl {level}
                </span>
                <div className="flex flex-wrap gap-1">
                  {features.map((f) => (
                    <span key={f} className={`px-1.5 py-0.5 rounded border text-[9px] ${
                      level === newLevel
                        ? "bg-emerald-950/30 border-emerald-800/50 text-emerald-300"
                        : level <= currentLevel
                        ? "bg-zinc-900 border-zinc-800 text-zinc-600"
                        : "bg-zinc-900/50 border-zinc-800/50 text-zinc-700"
                    }`}>
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </details>

      </div>

      {/* BESTÄTIGEN BUTTON */}
      <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex-wrap gap-3">
        <div className="text-xs font-mono text-zinc-500 space-y-0.5">
          {hpRoll === "" && <p className="text-rose-400">✗ HP-Würfelwurf fehlt</p>}
          {skillPointsRemaining !== 0 && (
            <p className="text-amber-400">
              ✗ Noch {skillPointsRemaining} Fertigkeitspunkt{skillPointsRemaining !== 1 ? "e" : ""} zu vergeben
            </p>
          )}
          {isAttrLevel && !chosenAttr && (
            <p className="text-amber-400">✗ Attributssteigerung ausstehend</p>
          )}
          {canConfirm && (
            <p className="text-emerald-400 font-bold">✓ Alles vollständig – bereit zum Aufsteigen!</p>
          )}
        </div>
        <button
          type="button"
          onClick={handleConfirmLevelUp}
          disabled={!canConfirm}
          className={`px-6 py-2.5 rounded-xl font-black text-sm font-mono transition-all ${
            canConfirm
              ? "bg-amber-500 hover:bg-amber-400 text-black cursor-pointer shadow-lg shadow-amber-500/20"
              : "bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-700"
          }`}
        >
          Level {newLevel} bestätigen →
        </button>
      </div>
    </div>
  );
};
