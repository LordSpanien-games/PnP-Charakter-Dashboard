import React, { FC, useMemo, ChangeEvent } from "react";
import { 
  Shield, 
  Sword, 
  Heart, 
  Zap, 
  Sparkles, 
  Plus, 
  Trash2,
  BookOpen
} from "lucide-react";
import { 
  Skill, 
  Weapon, 
  Ability 
} from "../../types";
import { 
  calculatePathfinderModifier, 
  formatPathfinderModifier, 
  getAttributeScore, 
  calculateSavingThrows,
  recalculatePathfinderCharacter,
  getBaseAttackBonus,
  getCharacterSizeMod,
  calculatePathfinderCombatValues,
  calculatePathfinderWeaponStats,
  PATHFINDER_CORE_ATTRIBUTES,
  isRogueCharacter,
  isRogueTalentAbility,
  getCharacterRogueTalents,
  getCombatRogueTalents
} from "../../utils/pathfinder";
import { PATHFINDER_ROGUE_TALENTS } from "../../data/pathfinderRogueTalents";
import { extractDailyUsesFromText } from "../../utils/inventorySync";
import { SheetProps } from "./types";

interface StandardPFSkillDef {
  name: string;
  attr: 'ST' | 'GE' | 'KO' | 'IN' | 'WE' | 'CH';
  armorPenalty?: boolean;
  trainedOnly?: boolean;
}

const OFFICIAL_PATHFINDER_SKILLS: StandardPFSkillDef[] = [
  { name: "Akrobatik", attr: "GE", armorPenalty: true },
  { name: "Auftreten (Gesang/Tanz)", attr: "CH" },
  { name: "Beruf (Seemann/Kaufmann)", attr: "WE", trainedOnly: true },
  { name: "Bluffen", attr: "CH" },
  { name: "Diplomatie", attr: "CH" },
  { name: "Einschüchtern", attr: "CH" },
  { name: "Entfesslungskunst", attr: "GE", armorPenalty: true },
  { name: "Fälschen", attr: "IN" },
  { name: "Fingerfertigkeit", attr: "GE", armorPenalty: true, trainedOnly: true },
  { name: "Fliegen", attr: "GE", armorPenalty: true },
  { name: "Handwerk (Alchemie/Waffen)", attr: "IN" },
  { name: "Heilkunde", attr: "WE" },
  { name: "Heimlichkeit", attr: "GE", armorPenalty: true },
  { name: "Klettern", attr: "ST", armorPenalty: true },
  { name: "Magischen Gegenstand benutzen", attr: "CH", trainedOnly: true },
  { name: "Mechanismus ausschalten", attr: "GE", armorPenalty: true, trainedOnly: true },
  { name: "Mit Tieren umgehen", attr: "CH", trainedOnly: true },
  { name: "Motiv erkennen", attr: "WE" },
  { name: "Reiten", attr: "GE", armorPenalty: true },
  { name: "Schätzen", attr: "IN" },
  { name: "Schwimmen", attr: "ST", armorPenalty: true },
  { name: "Sprachenkunde", attr: "IN", trainedOnly: true },
  { name: "Überleben", attr: "WE" },
  { name: "Verkleiden", attr: "CH" },
  { name: "Wahrnehmung", attr: "WE" },
  { name: "Wissen (Arkanes)", attr: "IN", trainedOnly: true },
  { name: "Wissen (Dungeonkunde)", attr: "IN", trainedOnly: true },
  { name: "Wissen (Geschichte)", attr: "IN", trainedOnly: true },
  { name: "Wissen (Geografie)", attr: "IN", trainedOnly: true },
  { name: "Wissen (Lokales)", attr: "IN", trainedOnly: true },
  { name: "Wissen (Natur)", attr: "IN", trainedOnly: true },
  { name: "Wissen (Religion)", attr: "IN", trainedOnly: true },
  { name: "Wissen (Die Ebenen)", attr: "IN", trainedOnly: true },
  { name: "Zauberkunde", attr: "IN", trainedOnly: true },
];

export const PathfinderSheet: FC<SheetProps> = ({
  data,
  onUpdateData,
  isEditable,
  paperStyle,
  activePage
}) => {
  // Helper to extract or parse general stats
  const getStatValue = (labelQuery: string, defaultVal: string | number = ""): string | number => {
    if (!data.stats) return defaultVal;
    const q = labelQuery.toLowerCase();
    const found = data.stats.find(s => (s.label || "").toLowerCase().includes(q));
    return found ? found.value : defaultVal;
  };

  const getStatDmg = (labelQuery: string): number => {
    if (!data.stats) return 0;
    const q = labelQuery.toLowerCase();
    const found = data.stats.find(s => (s.label || "").toLowerCase().includes(q));
    return found?.damage || 0;
  };

  const updateStatValue = (labelQuery: string, newValue: string | number, newDamage?: number) => {
    const q = labelQuery.toLowerCase();
    const existingIndex = (data.stats || []).findIndex(s => (s.label || "").toLowerCase().includes(q));
    let newStats = [...(data.stats || [])];
    
    if (existingIndex >= 0) {
      newStats[existingIndex] = {
        ...newStats[existingIndex],
        value: newValue,
        ...(newDamage !== undefined ? { damage: newDamage } : {})
      };
    } else {
      newStats.push({
        label: labelQuery,
        value: newValue,
        ...(newDamage !== undefined ? { damage: newDamage } : {})
      });
    }
    onUpdateData({ stats: newStats });
  };

  // Attributes for Pathfinder
  const stScore = getAttributeScore(data, 'ST');
  const geScore = getAttributeScore(data, 'GE');
  const koScore = getAttributeScore(data, 'KO');
  const inScore = getAttributeScore(data, 'IN');
  const weScore = getAttributeScore(data, 'WE');
  const chScore = getAttributeScore(data, 'CH');

  const stMod = calculatePathfinderModifier(stScore);
  const geMod = calculatePathfinderModifier(geScore);
  const koMod = calculatePathfinderModifier(koScore);
  const inMod = calculatePathfinderModifier(inScore);
  const weMod = calculatePathfinderModifier(weScore);
  const chMod = calculatePathfinderModifier(chScore);

  const attributeMap: Record<string, { score: number; mod: number }> = {
    ST: { score: stScore, mod: stMod },
    GE: { score: geScore, mod: geMod },
    KO: { score: koScore, mod: koMod },
    IN: { score: inScore, mod: inMod },
    WE: { score: weScore, mod: weMod },
    CH: { score: chScore, mod: chMod },
  };

  // Handler to update an attribute score
  const handleAttributeChange = (key: string, newScoreNum: number) => {
    const existingChars = data.characteristics ? [...data.characteristics] : [];
    const meta = PATHFINDER_CORE_ATTRIBUTES.find(a => a.key === key);
    const aliases = meta ? meta.aliases : [key];

    const idx = existingChars.findIndex(c => aliases.includes((c?.label || '').toUpperCase().trim()));
    const newMod = calculatePathfinderModifier(newScoreNum);

    if (idx >= 0) {
      existingChars[idx] = {
        ...existingChars[idx],
        value: newScoreNum,
        secondary: formatPathfinderModifier(newMod)
      };
    } else {
      existingChars.push({
        label: key,
        value: newScoreNum,
        secondary: formatPathfinderModifier(newMod),
        modifier: 0
      });
    }

    const recalculated = recalculatePathfinderCharacter(data, existingChars);
    onUpdateData(recalculated);
  };

  // Handler for direct level adjustment
  const handleDirectLevelChange = (newLvl: number) => {
    if (isNaN(newLvl) || newLvl < 1 || newLvl > 30) return;
    const currentSub = data.subTitle || "";
    let newSub = "";
    if (currentSub.toLowerCase().includes("level") || currentSub.toLowerCase().includes("stufe")) {
      newSub = currentSub.replace(/(?:level|stufe|lvl)\s*\d+/i, `Level ${newLvl}`);
    } else {
      newSub = `Level ${newLvl} ${headerInfo.race} ${headerInfo.class}`;
    }
    const updatedChar = recalculatePathfinderCharacter({
      ...data,
      subTitle: newSub
    });
    onUpdateData(updatedChar);
  };

  // Header information derived from name and subTitle
  const parseHeaderDetails = () => {
    const sub = data.subTitle || "";
    let level = "";
    let race = "";
    let charClass = "";
    let alignment = "Neutral";
    let player = "";
    let deity = "";
    let homeland = "";

    const lvlMatch = sub.match(/(?:level|stufe)\s*(\d+)/i);
    if (lvlMatch) level = lvlMatch[1];

    if (sub.toLowerCase().includes("gnom")) race = "Gnom";
    else if (sub.toLowerCase().includes("mensch")) race = "Mensch";
    else if (sub.toLowerCase().includes("elf")) race = "Elf";
    else if (sub.toLowerCase().includes("zwerg")) race = "Zwerg";
    else if (sub.toLowerCase().includes("halbork")) race = "Halbork";
    else if (sub.toLowerCase().includes("halbling")) race = "Halbling";

    if (sub.toLowerCase().includes("dieb") || sub.toLowerCase().includes("schurke") || sub.toLowerCase().includes("rogue")) {
      charClass = "Schurke (Dieb)";
    } else if (sub.toLowerCase().includes("kämpfer") || sub.toLowerCase().includes("fighter")) {
      charClass = "Kämpfer";
    } else if (sub.toLowerCase().includes("hexenmeister") || sub.toLowerCase().includes("sorcerer")) {
      charClass = "Hexenmeister";
    } else if (sub.toLowerCase().includes("magier") || sub.toLowerCase().includes("wizard")) {
      charClass = "Magier";
    } else if (sub.toLowerCase().includes("kleriker") || sub.toLowerCase().includes("cleric")) {
      charClass = "Kleriker";
    }

    return {
      name: data.name,
      level: level || (sub ? sub : "1"),
      race: race || "Gnom",
      class: charClass || "Schurke",
      alignment,
      player: player || "Spieler",
      deity: deity || "Cayden Cailean",
      homeland: homeland || "Golarion"
    };
  };

  const headerInfo = parseHeaderDetails();
  const saves = useMemo(() => {
    return calculateSavingThrows(data, data.savingThrows);
  }, [data]);
  const babObj = getBaseAttackBonus(data);
  const sizeObj = getCharacterSizeMod(data);

  // Combat Stats dynamically synced with Pathfinder rules engine
  const combatVals = useMemo(() => calculatePathfinderCombatValues(data), [data]);
  const totalHp = parseInt(String(getStatValue("tp", 80)).replace(/[^0-9]/g, ""), 10) || 80;
  const hpDamage = getStatDmg("tp");
  const currentHp = Math.max(0, totalHp - hpDamage);

  const totalAc = combatVals.armorClass || parseInt(String(getStatValue("rk", 24)).replace(/[^0-9]/g, ""), 10) || 24;
  const touchAc = combatVals.touchAc || parseInt(String(getStatValue("berührung", 14)).replace(/[^0-9]/g, ""), 10) || 14;
  const flatFootedAc = combatVals.flatFootedAc || parseInt(String(getStatValue("falschen", 13)).replace(/[^0-9]/g, ""), 10) || 13;
  const initiative = formatPathfinderModifier(combatVals.initiative) || getStatValue("initiative", "+4");
  const speed = getStatValue("bewegungsrate", "6m");
  const cmb = formatPathfinderModifier(combatVals.cmb) || getStatValue("kmb", "+7");
  const cmd = combatVals.cmd || getStatValue("kmv", 22);

  const getCarryingCapacity = (str: number) => {
    const light = Math.round(33 * Math.pow(1.15, str - 10));
    const med = Math.round(66 * Math.pow(1.15, str - 10));
    const heavy = Math.round(100 * Math.pow(1.15, str - 10));
    return {
      light: Math.max(10, light),
      med: Math.max(20, med),
      heavy: Math.max(30, heavy)
    };
  };

  const carrying = getCarryingCapacity(stScore);

  // Combine official skills with current character skills
  const mergedSkills = useMemo(() => {
    const userSkills = data.skills || [];
    return OFFICIAL_PATHFINDER_SKILLS.map(def => {
      const existing = userSkills.find(
        s => {
          const sName = (s?.name || (s as any)?.label || "").toLowerCase();
          const defName = def.name.toLowerCase();
          return sName === defName || (sName.length >= 5 && sName.startsWith(defName.slice(0, 5)));
        }
      );
      
      const attrMod = attributeMap[def.attr]?.mod || 0;
      const rawVal = existing ? existing.value : 0;
      const ranks = typeof rawVal === 'number' ? rawVal : (parseInt(String(rawVal).replace(/[^0-9-]/g, ''), 10) || 0);
      const isClassSkill = existing?.trained ?? false;
      const classBonus = (isClassSkill && ranks > 0) ? 3 : 0;
      const totalBonus = attrMod + ranks + classBonus;

      return {
        ...def,
        ranks,
        isClassSkill,
        classBonus,
        attrMod,
        totalBonus,
        miscBonus: existing?.miscBonus ?? 0,
        note: existing?.note || ""
      };
    });
  }, [data.skills, attributeMap]);

  const handleUpdateSkillRanks = (skillName: string, newRanks: number) => {
    const currentSkills = [...(data.skills || [])];
    const idx = currentSkills.findIndex(s => (s?.name || '').toLowerCase() === skillName.toLowerCase());
    
    if (idx >= 0) {
      currentSkills[idx] = {
        ...currentSkills[idx],
        value: newRanks
      };
    } else {
      currentSkills.push({
        name: skillName,
        value: newRanks,
        trained: false
      });
    }
    onUpdateData({ skills: currentSkills });
  };

  const handleToggleClassSkill = (skillName: string) => {
    const currentSkills = [...(data.skills || [])];
    const idx = currentSkills.findIndex(s => (s?.name || '').toLowerCase() === skillName.toLowerCase());
    
    if (idx >= 0) {
      currentSkills[idx] = {
        ...currentSkills[idx],
        trained: !currentSkills[idx].trained
      };
    } else {
      currentSkills.push({
        name: skillName,
        value: 0,
        trained: true
      });
    }
    onUpdateData({ skills: currentSkills });
  };

  const isRogue = useMemo(() => isRogueCharacter(data), [data]);
  const rogueTalents = useMemo(() => getCharacterRogueTalents(data), [data.abilities]);
  const combatRogueTricks = useMemo(() => getCombatRogueTalents(data), [data.abilities]);
  const otherAbilities = useMemo(() => {
    return ((data.abilities || []) as Ability[]).filter(a => !isRogueTalentAbility(a));
  }, [data.abilities]);

  const handleAddDefaultTrick = (presetName: 'blutend' | 'schwaechend' | 'finesse' | 'verkrueppelnd') => {
    let newAbility: Ability;
    if (presetName === 'blutend') {
      newAbility = {
        name: "Blutende Wunden (Bleeding Attack)",
        type: "rogue_talent",
        usage: "Passiv bei HA-Treffer",
        effect: "5 TP Blutung/Runde zu Beginn von Flokis Zug. Stoppen: Heilkunde SG 15 oder magische Heilung."
      };
    } else if (presetName === 'schwaechend') {
      newAbility = {
        name: "Schwächender Schlag (Debilitating Injury)",
        type: "rogue_talent",
        usage: "1 Runde nach HA-Treffer",
        effect: "Ziel erhält -2 RK / -2 auf Angriffswürfe oder halbe Bewegungsrate."
      };
    } else if (presetName === 'verkrueppelnd') {
      newAbility = {
        name: "Verkrüppelnder Schlag (Crippling Strike)",
        type: "rogue_talent",
        usage: "Bei HA-Treffer",
        effect: "Jeder erfolgreiche Hinterhältige Angriff fügt dem Ziel zusätzlich 2 Punkte Attributsschaden auf Stärke zu."
      };
    } else {
      newAbility = {
        name: "Finesse-Training (Schurken-Finesse)",
        type: "rogue_talent",
        usage: "Permanent aktiv",
        effect: "GE-Modifikator (+4) statt Stärke auf Schadenswürfe mit leichten Waffen (Dolch & Kurzschwert)."
      };
    }
    const current = (data.abilities || []) as Ability[];
    if (!current.some(a => a.name.toLowerCase().includes(newAbility.name.toLowerCase().split(' ')[0]))) {
      onUpdateData({ abilities: [...current, newAbility] });
    }
  };

  const handleAddPresetTrick = (presetName: string) => {
    const preset = PATHFINDER_ROGUE_TALENTS.find(p => p.name === presetName);
    if (!preset) return;
    const newAbility: Ability = {
      name: preset.name,
      type: "rogue_talent",
      usage: preset.usage || "Schurkentrick",
      effect: preset.effect
    };
    const current = (data.abilities || []) as Ability[];
    if (!current.some(a => a.name.toLowerCase() === newAbility.name.toLowerCase())) {
      onUpdateData({ abilities: [...current, newAbility] });
    }
  };

  const handleRemoveTrick = (trickName: string) => {
    const current = (data.abilities || []) as Ability[];
    onUpdateData({ abilities: current.filter(a => a.name !== trickName) });
  };

  const handleAbilityUseChange = (abilityName: string, delta: number) => {
    if (!data.abilities) return;
    const newAbilities = data.abilities.map(ab => {
      if (ab.name === abilityName) {
        const max = ab.maxUses ?? extractDailyUsesFromText(ab.usage, ab.name) ?? extractDailyUsesFromText(ab.effect, ab.name) ?? 1;
        const cur = ab.currentUses !== undefined ? ab.currentUses : max;
        const next = Math.max(0, Math.min(max, cur + delta));
        return { ...ab, maxUses: max, currentUses: next };
      }
      return ab;
    });
    onUpdateData({ abilities: newAbilities });
  };

  const handleInventoryUseChange = (itemId: string, delta: number) => {
    if (!data.inventory) return;
    const newInv = data.inventory.map(it => {
      if (it.id === itemId) {
        const max = it.maxUses ?? extractDailyUsesFromText(it.notes, it.name) ?? 1;
        const cur = it.currentUses !== undefined ? it.currentUses : max;
        const next = Math.max(0, Math.min(max, cur + delta));
        return { ...it, maxUses: max, currentUses: next };
      }
      return it;
    });
    onUpdateData({ inventory: newInv });
  };

  const paperBgClass = paperStyle === 'parchment'
    ? 'bg-[#fcf9f2] text-stone-900 shadow-xl border border-stone-300'
    : 'bg-white text-black shadow-lg border border-zinc-200';

  return (
    <>
      {/* PAGE 1: CORE COMBAT, STATS & SKILLS */}
      {(activePage === 'all' || activePage === 'page1') && (
        <div className={`printable-sheet max-w-[960px] mx-auto mb-8 p-6 md:p-8 rounded-xl font-serif text-[11px] leading-tight ${paperBgClass} print:m-0 print:p-4 print:border-none print:shadow-none print:w-full print:max-w-none`}>
          {/* HEADER BRANDING */}
          <div className="border-b-4 border-double border-stone-800 pb-3 mb-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl md:text-2xl font-black uppercase tracking-[0.2em] font-display text-stone-900">
                    Pathfinder
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-stone-600 border border-stone-400 px-1.5 py-0.5 rounded font-mono">
                    Rollenspiel • Charakterbogen
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black font-display tracking-tight text-amber-950 mt-1">
                  {isEditable ? (
                    <input
                      type="text"
                      value={data.name}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => onUpdateData({ name: e.target.value })}
                      className="bg-transparent border-b-2 border-stone-400 hover:border-amber-600 focus:border-amber-700 outline-none w-full max-w-md font-display font-black text-amber-950"
                      title="Charaktername bearbeiten"
                    />
                  ) : (
                    data.name
                  )}
                </h1>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] w-full md:w-auto">
                <div className="border-b border-stone-400 pb-0.5">
                  <span className="text-stone-500 uppercase block text-[8px] font-sans">Klasse & Stufe</span>
                  {isEditable ? (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-bold text-stone-800 text-[11px]">{headerInfo.class}</span>
                      <span className="text-stone-500 font-sans text-[9px]">Stufe:</span>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={parseInt(headerInfo.level, 10) || 1}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val)) {
                            handleDirectLevelChange(val);
                          }
                        }}
                        className="w-12 px-1 py-0.5 text-center font-bold text-[11px] font-mono bg-amber-50/80 border border-amber-500/60 rounded text-stone-900 focus:ring-1 focus:ring-amber-500 outline-none"
                        title="Stufe anpassen – GAB, Rettungswürfe & Waffen aktualisieren sich automatisch!"
                      />
                    </div>
                  ) : (
                    <span className="font-bold text-stone-800">{headerInfo.class} Stufe {headerInfo.level}</span>
                  )}
                </div>
                <div className="border-b border-stone-400 pb-0.5">
                  <span className="text-stone-500 uppercase block text-[8px] font-sans">Volk</span>
                  <span className="font-bold text-stone-800">{headerInfo.race}</span>
                </div>
                <div className="border-b border-stone-400 pb-0.5">
                  <span className="text-stone-500 uppercase block text-[8px] font-sans">Gesinnung</span>
                  <span className="font-bold text-stone-800">{headerInfo.alignment}</span>
                </div>
                <div className="border-b border-stone-400 pb-0.5">
                  <span className="text-stone-500 uppercase block text-[8px] font-sans">Spieler</span>
                  <span className="font-bold text-stone-800">{headerInfo.player}</span>
                </div>
              </div>
            </div>

            {/* Sub-header row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] mt-2 pt-2 border-t border-stone-200">
              <div className="border-b border-stone-300 pb-0.5">
                <span className="text-stone-500 uppercase block text-[8px] font-sans">Größe</span>
                <span className="font-bold text-stone-800">{sizeObj.label} (Mod: {formatPathfinderModifier(sizeObj.attackAndAc)})</span>
              </div>
              <div className="border-b border-stone-300 pb-0.5">
                <span className="text-stone-500 uppercase block text-[8px] font-sans">Gottheit</span>
                <span className="font-bold text-stone-800">{headerInfo.deity}</span>
              </div>
              <div className="border-b border-stone-300 pb-0.5">
                <span className="text-stone-500 uppercase block text-[8px] font-sans">Heimat</span>
                <span className="font-bold text-stone-800">{headerInfo.homeland}</span>
              </div>
              <div className="border-b border-stone-300 pb-0.5">
                <span className="text-stone-500 uppercase block text-[8px] font-sans">Alter & Aussehen</span>
                <span className="font-bold text-stone-800">48 Jahre, 95cm, 18kg</span>
              </div>
            </div>
          </div>

          {/* MAIN 2-COLUMN BODY */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* LEFT COLUMN: ATTRIBUTES, SAVES, HP, AC, COMBAT (5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              {/* ATTRIBUTES TABLE */}
              <div className="border-2 border-stone-800 rounded-lg p-2.5 bg-stone-100/50 shadow-xs">
                <div className="flex items-center justify-between border-b border-stone-400 pb-1 mb-2">
                  <h2 className="text-xs font-black uppercase tracking-wider font-display text-stone-900 flex items-center gap-1.5">
                    <Zap size={14} className="text-amber-800" />
                    Attribute (Ability Scores)
                  </h2>
                  <span className="text-[9px] text-stone-500 font-sans">Basis | Mod | Temp</span>
                </div>

                <div className="space-y-1.5">
                  {PATHFINDER_CORE_ATTRIBUTES.map(attr => {
                    const currentScore = attributeMap[attr.key]?.score || 10;
                    const currentMod = attributeMap[attr.key]?.mod || 0;
                    return (
                      <div key={attr.key} className="flex items-center justify-between bg-white border border-stone-300 rounded p-1 text-xs">
                        <div className="flex items-center gap-2 w-28">
                          <span className="font-display font-black text-sm text-stone-900 w-7">{attr.key}</span>
                          <span className="text-[10px] text-stone-600 font-sans truncate">{attr.fullName}</span>
                        </div>

                        {/* Editable Score */}
                        <div className="flex items-center gap-2">
                          <div className="text-center">
                            {isEditable ? (
                              <input
                                type="number"
                                min={1}
                                max={45}
                                value={currentScore}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                  const val = parseInt(e.target.value, 10);
                                  if (!isNaN(val)) handleAttributeChange(attr.key, val);
                                }}
                                className="w-12 h-7 text-center font-bold text-sm bg-stone-50 border border-stone-400 rounded focus:bg-amber-50 focus:border-amber-600 outline-none"
                              />
                            ) : (
                              <span className="w-10 inline-block font-bold text-sm">{currentScore}</span>
                            )}
                          </div>

                          {/* Computed Modifier */}
                          <div className="w-10 h-7 flex items-center justify-center font-mono font-black text-sm bg-stone-800 text-amber-300 rounded shadow-xs">
                            {formatPathfinderModifier(currentMod)}
                          </div>

                          {/* Temp Score / Temp Mod */}
                          <div className="w-9 h-7 flex items-center justify-center text-[10px] font-mono text-stone-500 bg-stone-100 rounded border border-stone-200">
                            -
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* TREFFERPUNKTE & RÜSTUNGSKLASSE */}
              <div className="border-2 border-stone-800 rounded-lg p-2.5 bg-stone-100/50 shadow-xs space-y-3">
                {/* HP */}
                <div>
                  <div className="flex items-center justify-between border-b border-stone-400 pb-1 mb-1.5">
                    <h3 className="text-xs font-black uppercase tracking-wider font-display text-stone-900 flex items-center gap-1.5">
                      <Heart size={14} className="text-red-700" />
                      Trefferpunkte (Hit Points)
                    </h3>
                    <span className="text-[9px] text-stone-600 font-mono">Schadensreduzierung: SR -</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white border border-stone-300 rounded p-1.5">
                      <span className="text-[8px] uppercase text-stone-500 block">Gesamt-TP</span>
                      {isEditable ? (
                        <input
                          type="number"
                          value={totalHp}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            const v = parseInt(e.target.value, 10) || 0;
                            updateStatValue("tp", v);
                          }}
                          className="w-full text-center font-black text-sm bg-transparent outline-none"
                        />
                      ) : (
                        <span className="font-black text-sm text-stone-900">{totalHp}</span>
                      )}
                    </div>

                    <div className="bg-white border border-stone-300 rounded p-1.5">
                      <span className="text-[8px] uppercase text-stone-500 block">Schaden / Wunden</span>
                      {isEditable ? (
                        <input
                          type="number"
                          value={hpDamage}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            const v = parseInt(e.target.value, 10) || 0;
                            updateStatValue("tp", totalHp, v);
                          }}
                          className="w-full text-center font-black text-sm text-red-600 bg-transparent outline-none"
                        />
                      ) : (
                        <span className="font-black text-sm text-red-600">{hpDamage}</span>
                      )}
                    </div>

                    <div className="bg-stone-800 text-amber-300 rounded p-1.5">
                      <span className="text-[8px] uppercase text-stone-400 block">Aktuelle TP</span>
                      <span className="font-black text-base">{currentHp}</span>
                    </div>
                  </div>
                </div>

                {/* AC / RÜSTUNGSKLASSE */}
                <div className="pt-2 border-t border-stone-300">
                  <div className="flex items-center justify-between border-b border-stone-400 pb-1 mb-1.5">
                    <h3 className="text-xs font-black uppercase tracking-wider font-display text-stone-900 flex items-center gap-1.5">
                      <Shield size={14} className="text-blue-800" />
                      Rüstungsklasse (Armor Class)
                    </h3>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-stone-800 text-white rounded p-1.5">
                      <span className="text-[8px] uppercase text-amber-300 block font-bold">Gesamte RK</span>
                      <span className="font-black text-base">{totalAc}</span>
                    </div>

                    <div className="bg-white border border-stone-300 rounded p-1.5">
                      <span className="text-[8px] uppercase text-stone-500 block">Berührungs-RK</span>
                      <span className="font-bold text-sm text-stone-800">{touchAc}</span>
                    </div>

                    <div className="bg-white border border-stone-300 rounded p-1.5">
                      <span className="text-[8px] uppercase text-stone-500 block">Falscher Fuß</span>
                      <span className="font-bold text-sm text-stone-800">{flatFootedAc}</span>
                    </div>
                  </div>

                  <div className="mt-1.5 text-[9px] text-stone-500 text-center font-mono">
                    Formel: 10 + Rüstung (+5) + Schild (+0) + GE ({formatPathfinderModifier(geMod)}) + Größe (+1) + Ausweichen (+1)
                  </div>
                </div>
              </div>

              {/* RETTUNGSWÜRFE (SAVING THROWS) */}
              <div className="border-2 border-stone-800 rounded-lg p-2.5 bg-stone-100/50 shadow-xs">
                <div className="flex items-center justify-between border-b border-stone-400 pb-1 mb-2">
                  <h2 className="text-xs font-black uppercase tracking-wider font-display text-stone-900 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-emerald-800" />
                    Rettungswürfe (Saving Throws)
                  </h2>
                  <span className="text-[9px] text-stone-500 font-sans">Gesamt = Basis + Attribut + Magie</span>
                </div>

                <div className="space-y-1.5">
                  {/* Zähigkeit */}
                  <div className="bg-white border border-stone-300 rounded p-1.5 text-xs flex items-center justify-between">
                    <div className="w-24">
                      <span className="font-bold block text-stone-900">Zähigkeit</span>
                      <span className="text-[8px] text-stone-500 font-sans">Konstitution (KO)</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-mono">
                      <span className="w-8 h-6 bg-stone-800 text-amber-300 rounded flex items-center justify-center font-black">
                        {formatPathfinderModifier(saves?.fortitude?.total ?? 0)}
                      </span>
                      <span>=</span>
                      <span className="text-stone-600" title="Basis">{saves?.fortitude?.base ?? 0}</span>
                      <span>+</span>
                      <span className="text-stone-600" title="KO-Mod">{formatPathfinderModifier(koMod)}</span>
                      <span>+</span>
                      <span className="text-stone-600" title="Magie">{saves?.fortitude?.magicMod ?? 0}</span>
                    </div>
                  </div>

                  {/* Reflex */}
                  <div className="bg-white border border-stone-300 rounded p-1.5 text-xs flex items-center justify-between">
                    <div className="w-24">
                      <span className="font-bold block text-stone-900">Reflex</span>
                      <span className="text-[8px] text-stone-500 font-sans">Geschicklichkeit (GE)</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-mono">
                      <span className="w-8 h-6 bg-stone-800 text-amber-300 rounded flex items-center justify-center font-black">
                        {formatPathfinderModifier(saves?.reflex?.total ?? 0)}
                      </span>
                      <span>=</span>
                      <span className="text-stone-600" title="Basis">{saves?.reflex?.base ?? 0}</span>
                      <span>+</span>
                      <span className="text-stone-600" title="GE-Mod">{formatPathfinderModifier(geMod)}</span>
                      <span>+</span>
                      <span className="text-stone-600" title="Magie">{saves?.reflex?.magicMod ?? 0}</span>
                    </div>
                  </div>

                  {/* Wille */}
                  <div className="bg-white border border-stone-300 rounded p-1.5 text-xs flex items-center justify-between">
                    <div className="w-24">
                      <span className="font-bold block text-stone-900">Wille</span>
                      <span className="text-[8px] text-stone-500 font-sans">Weisheit (WE)</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-mono">
                      <span className="w-8 h-6 bg-stone-800 text-amber-300 rounded flex items-center justify-center font-black">
                        {formatPathfinderModifier(saves?.will?.total ?? 0)}
                      </span>
                      <span>=</span>
                      <span className="text-stone-600" title="Basis">{saves?.will?.base ?? 0}</span>
                      <span>+</span>
                      <span className="text-stone-600" title="WE-Mod">{formatPathfinderModifier(weMod)}</span>
                      <span>+</span>
                      <span className="text-stone-600" title="Magie">{saves?.will?.magicMod ?? 0}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-2 text-[9px] text-stone-600 bg-stone-100 p-1.5 rounded border border-stone-200">
                  <strong>Volks- & Klassenboni:</strong> +2 gegen Gift (Gnom), +2 gegen Illusionen, +3 gegen Fallen (Fallengespür).
                </div>
              </div>

              {/* KAMPF-MODIFIKATOREN (GAB, INITIATIVE, KMB, KMV) */}
              <div className="border-2 border-stone-800 rounded-lg p-2.5 bg-stone-100/50 shadow-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="bg-white border border-stone-300 rounded p-1.5 flex flex-col justify-center">
                    <span className="text-[8px] uppercase text-stone-500 block font-sans">Grund-Angriffsbonus (GAB)</span>
                    <span className="font-black text-stone-900 font-mono text-sm leading-tight my-0.5">{babObj?.formatted || "+0"}</span>
                    <span className="text-[8px] text-stone-500 font-mono">
                      Stufe {headerInfo.level} • {babObj.iteratives.length > 1 ? `${babObj.iteratives.length} Angriffe` : '1 Angriff'}
                    </span>
                  </div>

                  <div className="bg-white border border-stone-300 rounded p-1.5">
                    <span className="text-[8px] uppercase text-stone-500 block">Initiative</span>
                    <span className="font-black text-stone-900 font-mono">{initiative}</span>
                  </div>

                  <div className="bg-white border border-stone-300 rounded p-1.5">
                    <span className="text-[8px] uppercase text-stone-500 block">KMB</span>
                    <span className="font-black text-stone-900 font-mono">{cmb}</span>
                  </div>

                  <div className="bg-white border border-stone-300 rounded p-1.5">
                    <span className="text-[8px] uppercase text-stone-500 block">KMV</span>
                    <span className="font-black text-stone-900 font-mono">{cmd}</span>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between text-[9px] text-stone-600 px-1 font-mono">
                  <span>Bewegungsrate: <strong>{speed}</strong></span>
                  <span>Größenmodifikator: <strong>{sizeObj?.label || "Klein"} ({formatPathfinderModifier(sizeObj?.attackAndAc ?? 1)} RK/Angriff)</strong></span>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: COMPLETE OFFICIAL PATHFINDER SKILLS (7 Cols) */}
            <div className="lg:col-span-7">
              <div className="border-2 border-stone-800 rounded-lg p-3 bg-stone-100/50 shadow-xs">
                <div className="flex items-center justify-between border-b-2 border-stone-800 pb-1.5 mb-2">
                  <h2 className="text-xs font-black uppercase tracking-wider font-display text-stone-900">
                    Fertigkeiten (Skills)
                  </h2>
                  <div className="flex items-center gap-3 text-[9px] font-sans text-stone-600">
                    <span>KF = Klassenfertigkeit (+3 bei ≥1 Rang)</span>
                    <span className="font-mono font-bold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">
                      Ränge gesamt: {mergedSkills.reduce((acc, s) => acc + s.ranks, 0)}
                    </span>
                  </div>
                </div>

                {/* SKILLS TABLE HEADER */}
                <div className="grid grid-cols-12 gap-1 text-[8px] uppercase font-bold text-stone-500 border-b border-stone-300 pb-1 px-1">
                  <div className="col-span-1 text-center" title="Klassenfertigkeit">KF</div>
                  <div className="col-span-5">Fertigkeitsname</div>
                  <div className="col-span-1 text-center">Attr</div>
                  <div className="col-span-1 text-center font-bold text-stone-800">Ges</div>
                  <div className="col-span-1 text-center">Attr</div>
                  <div className="col-span-1 text-center">Rang</div>
                  <div className="col-span-1 text-center">KF+3</div>
                  <div className="col-span-1 text-center">Sonst</div>
                </div>

                {/* SKILL ROWS */}
                <div className="space-y-0.5 max-h-[640px] overflow-y-auto pr-1 text-[10px]">
                  {mergedSkills.map(skill => (
                    <div 
                      key={skill.name} 
                      className={`grid grid-cols-12 gap-1 items-center p-1 rounded transition-colors ${
                        skill.ranks > 0 ? 'bg-amber-50/80 font-medium' : 'hover:bg-white'
                      }`}
                    >
                      {/* Class skill checkbox */}
                      <div className="col-span-1 text-center">
                        <input
                          type="checkbox"
                          checked={skill.isClassSkill}
                          disabled={!isEditable}
                          onChange={() => handleToggleClassSkill(skill.name)}
                          className="cursor-pointer h-3 w-3 accent-amber-700"
                          title="Als Klassenfertigkeit markieren"
                        />
                      </div>

                      {/* Skill Name */}
                      <div className="col-span-5 truncate flex items-center gap-1 text-stone-800">
                        <span className="truncate">{skill.name}</span>
                        {skill.armorPenalty && (
                          <span className="text-[7px] text-stone-400 font-mono" title="Rüstungsmalus">*</span>
                        )}
                        {skill.trainedOnly && (
                          <span className="text-[7px] text-amber-700 font-mono" title="Nur geübt">†</span>
                        )}
                      </div>

                      {/* Attribute code */}
                      <div className="col-span-1 text-center font-mono text-[9px] text-stone-500">
                        {skill.attr}
                      </div>

                      {/* Total Bonus */}
                      <div className="col-span-1 text-center font-mono font-black text-amber-900 bg-white border border-stone-300 rounded text-[10px]">
                        {formatPathfinderModifier(skill.totalBonus)}
                      </div>

                      {/* Ability Modifier */}
                      <div className="col-span-1 text-center font-mono text-stone-500 text-[9px]">
                        {formatPathfinderModifier(skill.attrMod)}
                      </div>

                      {/* Ranks (editable) */}
                      <div className="col-span-1 text-center">
                        {isEditable ? (
                          <input
                            type="number"
                            min={0}
                            max={20}
                            value={skill.ranks}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => {
                              const val = parseInt(e.target.value, 10) || 0;
                              handleUpdateSkillRanks(skill.name, val);
                            }}
                            className="w-full text-center bg-white border border-stone-300 rounded font-mono font-bold text-[10px] outline-none focus:border-amber-600"
                          />
                        ) : (
                          <span className="font-mono text-[9px]">{skill.ranks}</span>
                        )}
                      </div>

                      {/* Class Skill Bonus (+3) */}
                      <div className="col-span-1 text-center font-mono text-stone-500 text-[9px]">
                        {skill.classBonus > 0 ? "+3" : "0"}
                      </div>

                      {/* Misc / Note Bonus */}
                      <div className="col-span-1 text-center font-mono text-stone-400 text-[9px]">
                        {skill.name === "Heimlichkeit" ? "+4" : "0"}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-2 text-[8px] text-stone-500 border-t border-stone-200 pt-1 flex justify-between">
                  <span>* = Rüstungsmalus gilt</span>
                  <span>† = Kann nur von geübten Charakteren eingesetzt werden</span>
                </div>
              </div>
            </div>
          </div>

          {/* WEAPONS & ATTACKS SECTION */}
          <div className="mt-5 border-2 border-stone-800 rounded-lg p-3 bg-stone-100/50 shadow-xs">
            <div className="flex items-center justify-between border-b-2 border-stone-800 pb-1.5 mb-2">
              <h2 className="text-xs font-black uppercase tracking-wider font-display text-stone-900 flex items-center gap-1.5">
                <Sword size={14} className="text-amber-900" />
                Angriffe & Waffenarsenal
              </h2>
              <span className="text-[9px] text-stone-500 font-sans">Waffenfinesse: GE auf Angriff, Dex-Schaden aktiv</span>
            </div>

            <div className="space-y-2">
              {/* Melee Weapons with Live Dashboard Calculation & Schurkenwaffe Bonuses */}
              {((data.weapons?.melee || []) as Weapon[]).map((weapon, idx) => {
                const liveStats = calculatePathfinderWeaponStats(weapon, data, true);
                const displayAttack = liveStats.calculatedAttackFormatted || weapon.attack;
                const displayDamage = liveStats.calculatedDamage || weapon.damage;

                return (
                  <div key={idx} className={`bg-white border rounded p-2 text-xs ${liveStats.hasSneakBonus ? 'border-amber-400 bg-amber-50/20' : 'border-stone-300'}`}>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 border-b border-stone-200 pb-1 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-900 text-sm">{weapon.name}</span>
                        <span className="text-[9px] uppercase px-1.5 py-0.2 bg-stone-100 border border-stone-300 rounded text-stone-600">Nahkampf</span>
                        {liveStats.hasSneakBonus && (
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 bg-amber-100 border border-amber-400 rounded text-amber-900">
                            Schurkenwaffe
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-stone-700 font-mono">
                        <span>Angriff: <strong className="text-amber-900 text-sm">{displayAttack}</strong></span>
                        {liveStats.hasSneakBonus && (
                          <span className="text-emerald-800 font-bold bg-emerald-50 border border-emerald-300 rounded px-1.5 py-0.5">
                            HA-Angriff: <strong>{liveStats.sneakAttackAttackFormatted}</strong>
                          </span>
                        )}
                        <span>Schaden: <strong>{displayDamage}</strong></span>
                        {liveStats.hasSneakBonus && (
                          <span className="text-emerald-800 font-bold bg-emerald-50 border border-emerald-300 rounded px-1.5 py-0.5">
                            HA-Schaden: <strong>{liveStats.sneakAttackDamage}</strong>
                          </span>
                        )}
                        <span>Kritisch: <strong>{weapon.critical}</strong></span>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between text-[10px] text-stone-600 italic">
                      <p>{weapon.note}</p>
                      {liveStats.hasSneakBonus && (
                        <p className="text-amber-900 font-semibold not-italic sm:text-right mt-0.5 sm:mt-0">
                          ⚡ {liveStats.sneakBonusDescription}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Ranged Weapons */}
              {((data.weapons?.ranged || []) as Weapon[]).map((weapon, idx) => {
                const liveStats = calculatePathfinderWeaponStats(weapon, data, false);
                const displayAttack = liveStats.calculatedAttackFormatted || weapon.attack;
                const displayDamage = liveStats.calculatedDamage || weapon.damage;

                return (
                  <div key={idx} className="bg-white border border-stone-300 rounded p-2 text-xs">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 border-b border-stone-200 pb-1 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-900 text-sm">{weapon.name}</span>
                        <span className="text-[9px] uppercase px-1.5 py-0.2 bg-stone-100 border border-stone-300 rounded text-stone-600">Fernkampf</span>
                      </div>
                      <div className="flex items-center gap-3 text-stone-700 font-mono">
                        <span>Angriff: <strong className="text-amber-900 text-sm">{displayAttack}</strong></span>
                        <span>Schaden: <strong>{displayDamage}</strong></span>
                        <span>Reichweite: <strong>{weapon.range || "15m"}</strong></span>
                        <span>Kritisch: <strong>{weapon.critical}</strong></span>
                      </div>
                    </div>
                    <p className="text-[10px] text-stone-600 italic">
                      {weapon.note}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* PAGE 2: TALENTS, FEATS, EQUIPMENT & CARRYING CAPACITY */}
      {(activePage === 'all' || activePage === 'page2') && (
        <div className={`printable-sheet max-w-[960px] mx-auto p-6 md:p-8 rounded-xl font-serif text-[11px] leading-tight ${paperBgClass} print:m-0 print:p-4 print:border-none print:shadow-none print:w-full print:max-w-none print:break-before-page`}>
          {/* HEADER PAGE 2 */}
          <div className="border-b-2 border-stone-800 pb-2 mb-4 flex justify-between items-center">
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-stone-500 font-sans">
                Pathfinder 1e Charakterbogen • Seite 2
              </span>
              <h2 className="text-xl font-bold font-display text-stone-900">
                {data.name} — Talente, Schurkentricks & Ausrüstung
              </h2>
            </div>
            <span className="text-[10px] font-mono text-stone-500">Stufe {headerInfo.level} {headerInfo.race}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* LEFT COLUMN: SCHURKENTRICKS & TALENTS (6 Cols) */}
            <div className="lg:col-span-6 space-y-4">
              {/* SCHURKENTRICKS (ROGUE TALENTS) */}
              <div className="border-2 border-amber-800 rounded-lg p-3 bg-amber-50/40 shadow-xs">
                <div className="flex items-center justify-between border-b-2 border-amber-800 pb-1 mb-2">
                  <h3 className="text-xs font-black uppercase tracking-wider font-display text-amber-950 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-800" />
                    Schurkentricks (Rogue Talents)
                  </h3>
                  <div className="flex items-center gap-2">
                    {isEditable && (
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddPresetTrick(e.target.value);
                            e.target.value = "";
                          }
                        }}
                        defaultValue=""
                        className="text-[9px] font-bold bg-white border border-amber-400 text-amber-950 px-1.5 py-0.5 rounded cursor-pointer"
                      >
                        <option value="" disabled>+ Trick wählen...</option>
                        {PATHFINDER_ROGUE_TALENTS.map((p, pIdx) => (
                          <option key={pIdx} value={p.name} disabled={rogueTalents.some(r => r.name.toLowerCase() === p.name.toLowerCase())}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    )}
                    <span className="text-[9px] font-mono text-amber-900 font-semibold">
                      {rogueTalents.length} Notiert
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {rogueTalents.map((ability, idx) => (
                    <div key={idx} className="bg-white border border-amber-200 rounded p-2 text-xs shadow-xs">
                      <div className="flex items-center justify-between font-bold text-stone-900 mb-0.5">
                        <span className="text-amber-950">{ability.name}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {ability.page && (
                            <span className="text-[9px] font-mono text-amber-900 bg-amber-100/90 border border-amber-300 px-1 py-0.2 rounded flex items-center gap-0.5" title="Regelbuch-Referenz">
                              <BookOpen size={9} className="text-amber-700" />
                              <span>{ability.page}</span>
                            </span>
                          )}
                          {(() => {
                            const max = ability.maxUses ?? extractDailyUsesFromText(ability.usage, ability.name) ?? extractDailyUsesFromText(ability.effect, ability.name);
                            if (!max || max <= 0) return null;
                            const cur = ability.currentUses !== undefined ? ability.currentUses : max;
                            return (
                              <div className="inline-flex items-center gap-1 font-mono text-[9px] bg-amber-100 border border-amber-300 rounded px-1.5 py-0.5">
                                <span className="font-bold text-amber-950">⚡ {cur}/{max}</span>
                                <button
                                  type="button"
                                  onClick={() => handleAbilityUseChange(ability.name, -1)}
                                  disabled={cur <= 0}
                                  title="1 Ladung verbrauchen (-)"
                                  className="w-4 h-4 rounded bg-amber-200 hover:bg-amber-300 active:bg-amber-400 text-amber-950 disabled:opacity-30 flex items-center justify-center font-bold text-[10px] cursor-pointer"
                                >
                                  -
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAbilityUseChange(ability.name, 1)}
                                  disabled={cur >= max}
                                  title="1 Ladung aufladen (+)"
                                  className="w-4 h-4 rounded bg-amber-200 hover:bg-amber-300 active:bg-amber-400 text-amber-950 disabled:opacity-30 flex items-center justify-center font-bold text-[10px] cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            );
                          })()}
                          <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded border border-amber-300">
                            Schurkentrick
                          </span>
                          {isEditable && (
                            <button
                              type="button"
                              onClick={() => handleRemoveTrick(ability.name)}
                              className="text-stone-400 hover:text-rose-600 transition-colors p-0.5 cursor-pointer"
                              title="Trick entfernen"
                            >
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-[10px] text-stone-700 leading-snug">{ability.effect}</p>
                      {ability.usage && (
                        <span className="text-[9px] font-mono text-amber-800 mt-1 block font-semibold">
                          Auslösung / Frequenz: {ability.usage}
                        </span>
                      )}
                    </div>
                  ))}

                  {rogueTalents.length === 0 && (
                    <div className="p-2 bg-white/60 rounded border border-dashed border-amber-300">
                      <p className="text-[10px] text-amber-800 italic mb-2">
                        Keine separaten Schurkentricks notiert. Klicke hier um Standard-Tricks hinzuzufügen:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleAddDefaultTrick('blutend')}
                          className="px-2 py-0.5 text-[9px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-400 rounded cursor-pointer"
                        >
                          + Blutende Wunden
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddDefaultTrick('schwaechend')}
                          className="px-2 py-0.5 text-[9px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-400 rounded cursor-pointer"
                        >
                          + Schwächender Schlag
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddDefaultTrick('finesse')}
                          className="px-2 py-0.5 text-[9px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-400 rounded cursor-pointer"
                        >
                          + Schurken-Finesse
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddDefaultTrick('verkrueppelnd')}
                          className="px-2 py-0.5 text-[9px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-400 rounded cursor-pointer"
                        >
                          + Verkrüppelnder Schlag
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ALLGEMEINE TALENTE & KLASSENMERKMALE */}
              <div className="border-2 border-stone-800 rounded-lg p-3 bg-stone-100/50 shadow-xs">
                <div className="flex items-center justify-between border-b-2 border-stone-800 pb-1 mb-2">
                  <h3 className="text-xs font-black uppercase tracking-wider font-display text-stone-900">
                    Klassenmerkmale & Allgemeine Talente
                  </h3>
                  <span className="text-[9px] font-mono text-stone-600">
                    {otherAbilities.length} Notiert
                  </span>
                </div>

                <div className="space-y-1.5">
                  {otherAbilities.map((ability, idx) => (
                    <div key={idx} className="bg-white border border-stone-300 rounded p-2 text-xs">
                      <div className="flex items-center justify-between font-bold text-stone-900 mb-0.5">
                        <span>{ability.name}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {ability.page && (
                            <span className="text-[9px] font-mono text-stone-700 bg-stone-100 border border-stone-300 px-1 py-0.2 rounded flex items-center gap-0.5" title="Regelbuch-Referenz">
                              <BookOpen size={9} className="text-stone-600" />
                              <span>{ability.page}</span>
                            </span>
                          )}
                          {(() => {
                            const max = ability.maxUses ?? extractDailyUsesFromText(ability.usage, ability.name) ?? extractDailyUsesFromText(ability.effect, ability.name);
                            if (!max || max <= 0) return null;
                            const cur = ability.currentUses !== undefined ? ability.currentUses : max;
                            return (
                              <div className="inline-flex items-center gap-1 font-mono text-[9px] bg-indigo-50 border border-indigo-200 rounded px-1.5 py-0.5">
                                <span className="font-bold text-indigo-950">⚡ {cur}/{max}</span>
                                <button
                                  type="button"
                                  onClick={() => handleAbilityUseChange(ability.name, -1)}
                                  disabled={cur <= 0}
                                  title="1 Ladung verbrauchen (-)"
                                  className="w-4 h-4 rounded bg-indigo-100 hover:bg-indigo-200 active:bg-indigo-300 text-indigo-950 disabled:opacity-30 flex items-center justify-center font-bold text-[10px] cursor-pointer"
                                >
                                  -
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAbilityUseChange(ability.name, 1)}
                                  disabled={cur >= max}
                                  title="1 Ladung aufladen (+)"
                                  className="w-4 h-4 rounded bg-indigo-100 hover:bg-indigo-200 active:bg-indigo-300 text-indigo-950 disabled:opacity-30 flex items-center justify-center font-bold text-[10px] cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            );
                          })()}
                          <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 bg-stone-200 text-stone-800 rounded border border-stone-300">
                            {ability.type === 'class' ? 'Klasse' : ability.type === 'talent' ? 'Talent' : ability.type === 'gnome' ? 'Volk' : ability.type}
                          </span>
                        </div>
                      </div>
                      <p className="text-[10px] text-stone-600">{ability.effect}</p>
                      {ability.usage && (
                        <span className="text-[9px] font-mono text-stone-500 mt-1 block">
                          Anwendung: {ability.usage}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* VOLKS- & SPEZIALMERKMALE */}
              <div className="border-2 border-stone-800 rounded-lg p-3 bg-stone-100/50 shadow-xs">
                <h3 className="text-xs font-black uppercase tracking-wider font-display text-stone-900 border-b border-stone-400 pb-1 mb-2">
                  Gnom-Volksmerkmale & Schurken-Basis
                </h3>
                <div className="space-y-1 text-stone-700 text-[10px]">
                  <p><strong>Dunkelsicht (18m):</strong> Kann im Dunkeln ohne Lichtquelle sehen.</p>
                  <p><strong>Gnomische Magie:</strong> +1 SG auf alle gewirkten Illusionszauber.</p>
                  <p><strong>Hass auf Reptiloide & Goblinoide:</strong> +1 Angriffsbonus gegen diese Völker.</p>
                  <p><strong>Hinterhältiger Angriff (Sneak Attack):</strong> +5W6 Schaden bei flankierten oder auf dem falschen Fuß ertappten Zielen.</p>
                  <p><strong>Entrinnen (Evasion):</strong> Erleidet bei erfolgreichem Reflexwurf keinen Schaden statt halben Schadens.</p>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: EQUIPMENT, CARRYING CAPACITY, WEALTH (6 Cols) */}
            <div className="lg:col-span-6 space-y-4">
              {/* TRAGKRAFT & VERMÖGEN */}
              <div className="border-2 border-stone-800 rounded-lg p-3 bg-stone-100/50 shadow-xs">
                <div className="flex items-center justify-between border-b-2 border-stone-800 pb-1 mb-2">
                  <h3 className="text-xs font-black uppercase tracking-wider font-display text-stone-900">
                    Tragkraft & Finanzen
                  </h3>
                  <span className="text-[9px] text-stone-500 font-mono">Stärke: {stScore}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
                  <div className="bg-white border border-stone-300 rounded p-1.5">
                    <span className="text-[8px] uppercase text-stone-500 block">Leichte Last</span>
                    <span className="font-bold text-stone-800">Bis {carrying.light} kg</span>
                  </div>
                  <div className="bg-white border border-stone-300 rounded p-1.5">
                    <span className="text-[8px] uppercase text-stone-500 block">Mittlere Last</span>
                    <span className="font-bold text-stone-800">{carrying.light + 1} - {carrying.med} kg</span>
                  </div>
                  <div className="bg-white border border-stone-300 rounded p-1.5">
                    <span className="text-[8px] uppercase text-stone-500 block">Schwere Last</span>
                    <span className="font-bold text-stone-800">{carrying.med + 1} - {carrying.heavy} kg</span>
                  </div>
                </div>

                {/* Geldbeutel */}
                <div className="bg-stone-800 text-amber-300 rounded p-2 text-xs flex justify-between items-center">
                  <span className="font-bold uppercase tracking-wider text-[10px]">Geldbeutel:</span>
                  <div className="flex items-center gap-3 font-mono font-bold text-xs">
                    <span>{data.currency?.amount || 240} {data.currency?.unit || "GM"}</span>
                    <span className="text-stone-400">14 SM</span>
                    <span className="text-stone-400">8 KM</span>
                    <span className="text-amber-400">2 PM</span>
                  </div>
                </div>
              </div>

              {/* AUSRÜSTUNG & INVENTAR */}
              <div className="border-2 border-stone-800 rounded-lg p-3 bg-stone-100/50 shadow-xs">
                <div className="flex items-center justify-between border-b-2 border-stone-800 pb-1 mb-2">
                  <h3 className="text-xs font-black uppercase tracking-wider font-display text-stone-900">
                    Ausrüstung & Inventar
                  </h3>
                  <span className="text-[9px] font-mono text-stone-500">
                    {data.inventory && data.inventory.length > 0 ? (
                      `${data.inventory.filter(i => i.status !== 'stored').length} am Mann • ${data.inventory.filter(i => i.status === 'stored').length} im Lager`
                    ) : (
                      `${((data.abilities || []).filter(a => a.type === 'item')).length} Gegenstände`
                    )}
                  </span>
                </div>

                <div className="space-y-2 max-h-[360px] overflow-y-auto">
                  {data.inventory && data.inventory.length > 0 ? (
                    <>
                      {/* AM MANN */}
                      <div>
                        <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded mb-1 flex justify-between">
                          <span>🎒 Am Mann (Einsatz-Ausrüstung)</span>
                          <span>{data.inventory.filter(i => i.status !== 'stored').length}</span>
                        </div>
                        <div className="space-y-1">
                          {data.inventory.filter(i => i.status !== 'stored').map((item, idx) => (
                            <div key={idx} className="bg-white border border-stone-300 rounded p-1.5 text-xs flex justify-between items-baseline">
                              <div>
                                <strong className="font-semibold text-stone-900">
                                  {(item.quantity || 1) > 1 ? `${item.quantity}x ` : ''}{item.name}
                                </strong>
                                {item.notes && <span className="text-stone-500 text-[10px] ml-2">({item.notes})</span>}
                              </div>
                              <div className="flex items-center gap-1 font-mono text-[9px] shrink-0">
                                {item.page && (
                                  <span className="text-[8px] font-mono text-stone-600 bg-stone-100 border border-stone-300 px-1 py-0.2 rounded flex items-center gap-0.5" title="Regelbuch-Referenz">
                                    <BookOpen size={8} />
                                    {item.page}
                                  </span>
                                )}
                                {(() => {
                                  const max = item.maxUses ?? extractDailyUsesFromText(item.notes, item.name);
                                  if (!max || max <= 0) return null;
                                  const cur = item.currentUses !== undefined ? item.currentUses : max;
                                  return (
                                    <div className="inline-flex items-center gap-1 font-mono text-[8px] bg-indigo-50 border border-indigo-200 rounded px-1 py-0.5">
                                      <span className="font-bold text-indigo-950">⚡ {cur}/{max}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleInventoryUseChange(item.id, -1)}
                                        disabled={cur <= 0}
                                        title="1 Ladung verbrauchen (-)"
                                        className="w-3.5 h-3.5 rounded bg-indigo-100 hover:bg-indigo-200 active:bg-indigo-300 text-indigo-950 disabled:opacity-30 flex items-center justify-center font-bold text-[9px] cursor-pointer"
                                      >
                                        -
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleInventoryUseChange(item.id, 1)}
                                        disabled={cur >= max}
                                        title="1 Ladung aufladen (+)"
                                        className="w-3.5 h-3.5 rounded bg-indigo-100 hover:bg-indigo-200 active:bg-indigo-300 text-indigo-950 disabled:opacity-30 flex items-center justify-center font-bold text-[9px] cursor-pointer"
                                      >
                                        +
                                      </button>
                                    </div>
                                  );
                                })()}
                                {item.damage && <span className="text-rose-700 font-bold">{item.damage}</span>}
                                {item.armorValue && <span className="text-blue-700 font-bold">+{item.armorValue} RK</span>}
                                {item.rating && <span className="text-stone-600">Stufe {item.rating}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* EINGELAGERT */}
                      {data.inventory.filter(i => i.status === 'stored').length > 0 && (
                        <div>
                          <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-amber-900 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded mb-1 flex justify-between">
                            <span>📦 Eingelagert (Unterkunft / Vorrat)</span>
                            <span>{data.inventory.filter(i => i.status === 'stored').length}</span>
                          </div>
                          <div className="space-y-1">
                            {data.inventory.filter(i => i.status === 'stored').map((item, idx) => (
                              <div key={idx} className="bg-white/80 border border-dashed border-stone-300 rounded p-1.5 text-xs flex justify-between items-baseline">
                                <div>
                                  <span className="font-medium text-stone-800">
                                    {(item.quantity || 1) > 1 ? `${item.quantity}x ` : ''}{item.name}
                                  </span>
                                  {item.notes && <span className="text-stone-500 text-[10px] ml-1.5">({item.notes})</span>}
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  {item.page && (
                                    <span className="text-[8px] font-mono text-stone-600 bg-stone-100 border border-stone-300 px-1 py-0.2 rounded flex items-center gap-0.5" title="Regelbuch-Referenz">
                                      <BookOpen size={8} />
                                      {item.page}
                                    </span>
                                  )}
                                  {(() => {
                                    const max = item.maxUses ?? extractDailyUsesFromText(item.notes, item.name);
                                    if (!max || max <= 0) return null;
                                    const cur = item.currentUses !== undefined ? item.currentUses : max;
                                    return (
                                      <div className="inline-flex items-center gap-1 font-mono text-[8px] bg-amber-100 border border-amber-300 rounded px-1 py-0.5">
                                        <span className="font-bold text-amber-950">⚡ {cur}/{max}</span>
                                        <button
                                          type="button"
                                          onClick={() => handleInventoryUseChange(item.id, -1)}
                                          disabled={cur <= 0}
                                          className="w-3.5 h-3.5 rounded bg-amber-200 hover:bg-amber-300 text-amber-950 disabled:opacity-30 flex items-center justify-center font-bold text-[9px] cursor-pointer"
                                        >
                                          -
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleInventoryUseChange(item.id, 1)}
                                          disabled={cur >= max}
                                          className="w-3.5 h-3.5 rounded bg-amber-200 hover:bg-amber-300 text-amber-950 disabled:opacity-30 flex items-center justify-center font-bold text-[9px] cursor-pointer"
                                        >
                                          +
                                        </button>
                                      </div>
                                    );
                                  })()}
                                  <span className="text-[8px] font-mono text-amber-800 bg-amber-50 px-1 rounded border border-amber-200 shrink-0">
                                    Ort: {item.location || 'Unterkunft'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {((data.abilities || []).filter(a => a.type === 'item') as Ability[]).map((item, idx) => (
                        <div key={idx} className="bg-white border border-stone-300 rounded p-1.5 text-xs flex items-center justify-between">
                          <div>
                            <strong className="font-medium">{item.name}</strong>
                            <span className="text-stone-500 text-[10px] ml-2">({item.effect})</span>
                          </div>
                          {item.usage && (
                            <span className="text-[9px] font-mono text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200">
                              {item.usage}
                            </span>
                          )}
                        </div>
                      ))}
                      <div className="p-1.5 bg-white border border-stone-300 rounded text-stone-600 text-[11px]">
                        Meisterarbeit Diebeswerkzeug, Schleichstiefel (+2 Heimlichkeit), Seil (15m), Fackeln (3x), Rationen (5 Tage).
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* SPRACHEN & NOTIZEN */}
              <div className="border-2 border-stone-800 rounded-lg p-3 bg-stone-100/60 shadow-xs">
                <div className="flex items-center justify-between border-b border-stone-400 pb-1 mb-2">
                  <h3 className="text-xs font-black uppercase tracking-wider font-display text-stone-900">
                    Sprachen & Kampagnen-Notizen
                  </h3>
                </div>
                <div className="text-xs text-stone-800 space-y-1">
                  <div>
                    <strong className="text-[10px] uppercase text-stone-500 block">Gesprochene Sprachen</strong>
                    <span>Gemeinsprache, Gnomisch, Goblinisch, Halblingisch.</span>
                  </div>
                  <div className="pt-2 border-t border-stone-200">
                    <strong className="text-[10px] uppercase text-stone-500 block">Notizen</strong>
                    <textarea
                      defaultValue="Schurkentrick: Blutungsschaden (+5 TP/Runde), Fallengespür +3, Entrinnen aktiv. Bevorzugt Überraschungsangriffe aus den Schatten."
                      disabled={!isEditable}
                      rows={2}
                      className="w-full bg-white border border-stone-300 rounded p-1 text-xs font-serif text-stone-800 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
