import React, { FC, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  TrendingUp, 
  Sparkles, 
  Heart, 
  Swords, 
  ShieldAlert, 
  Brain, 
  Award, 
  Check, 
  Dices, 
  BookOpen, 
  ChevronRight, 
  Plus, 
  Minus, 
  HelpCircle, 
  Flame, 
  Save, 
  AlertCircle,
  Zap,
  ArrowRight
} from 'lucide-react';
import { CharacterData, GameSystem, Stat, Skill, Ability } from '../types';
import { 
  PATHFINDER_CLASSES, 
  PathfinderClassPreset, 
  calculateBAB, 
  formatBABAttacks, 
  calculateBaseSave, 
  isAttributeIncreaseLevel, 
  isGeneralFeatLevel, 
  parseLevelAndClass,
  SHADOWRUN_KARMA_RULES,
  COC_DEVELOPMENT_GUIDE,
  TRAVELLER_TRAINING_GUIDE
} from '../utils/levelUpRules';
import { calculatePathfinderModifier, formatPathfinderModifier, isPathfinder, recalculatePathfinderCharacter } from '../utils/pathfinder';

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: CharacterData;
  onApplyLevelUp: (updatedCharacter: CharacterData) => void;
}

export const LevelUpModal: FC<LevelUpModalProps> = ({
  isOpen,
  onClose,
  character,
  onApplyLevelUp,
}) => {
  const [activeTab, setActiveTab] = useState<'wizard' | 'guide'>('wizard');

  // --- PATHFINDER PARSING & STATE ---
  const parsed = useMemo(() => {
    return parseLevelAndClass(character.subTitle || '');
  }, [character.subTitle]);

  const currentLevel = parsed.level || 1;
  const [targetLevel, setTargetLevel] = useState<number>(currentLevel + 1);

  // Selected class
  const [selectedClassId, setSelectedClassId] = useState<string>(parsed.matchedClassId || 'rogue');
  const classPreset: PathfinderClassPreset = PATHFINDER_CLASSES[selectedClassId] || PATHFINDER_CLASSES.rogue;

  // Step 1: HP
  const [hitDieRoll, setHitDieRoll] = useState<number>(Math.ceil(classPreset.hitDie / 2) + 1); // average by default
  const [favoredClassHP, setFavoredClassHP] = useState<boolean>(true);
  const [isRollingHP, setIsRollingHP] = useState<boolean>(false);

  // Ability modifiers
  const currentConStat = character.characteristics?.find(c => c.label === 'KO' || c.label.toLowerCase().includes('konst'));
  const currentIntStat = character.characteristics?.find(c => c.label === 'IN' || c.label.toLowerCase().includes('intel'));
  const conMod = currentConStat ? calculatePathfinderModifier(currentConStat.value) : 2;
  const intMod = currentIntStat ? calculatePathfinderModifier(currentIntStat.value) : 2;

  // Step 3: Attribute Increase
  const isAttrLevel = isAttributeIncreaseLevel(targetLevel);
  const [manualAttrOverride, setManualAttrOverride] = useState<boolean>(false);
  const showAttrIncrease = isAttrLevel || manualAttrOverride;
  const [selectedAttrToBoost, setSelectedAttrToBoost] = useState<string>('GE');

  // Step 4: Feats & Features
  const isOddLevel = isGeneralFeatLevel(targetLevel);
  const [newFeatName, setNewFeatName] = useState<string>('');
  const [newFeatDesc, setNewFeatDesc] = useState<string>('');
  const [newClassFeatureName, setNewClassFeatureName] = useState<string>(
    classPreset.keyFeaturesByLevel?.[targetLevel]?.[0] || ''
  );
  const [newClassFeatureDesc, setNewClassFeatureDesc] = useState<string>('');

  // Step 5: Skills
  // Calculate total skill points gained this level
  const baseSkillPoints = classPreset.skillPointsPerLevel;
  const [favoredClassSkill, setFavoredClassSkill] = useState<boolean>(false); // Mutually exclusive with favoredClassHP normally, but flexible
  const totalSkillPoints = Math.max(1, baseSkillPoints + intMod + (favoredClassSkill ? 1 : 0));

  // Allocated points: skill name -> points added
  const [skillAllocations, setSkillAllocations] = useState<Record<string, number>>({});

  const pointsAllocatedSoFar = Object.values(skillAllocations).reduce((a, b) => a + b, 0);
  const remainingSkillPoints = totalSkillPoints - pointsAllocatedSoFar;

  // --- SHADOWRUN KARMA CALCULATOR STATE ---
  const [srCategory, setSrCategory] = useState<string>('attribute');
  const [srCurrentRating, setSrCurrentRating] = useState<number>(3);
  const [srTargetRating, setSrTargetRating] = useState<number>(4);
  const [srItemName, setSrItemName] = useState<string>('');

  // --- CALL OF CTHULHU DEVELOPMENT STATE ---
  const [cocRollResults, setCocRollResults] = useState<Record<string, { roll: number; success: boolean; gain: number }>>({});
  const [cocSanityReward, setCocSanityReward] = useState<number>(5);

  if (!isOpen) return null;

  // HP Calculation
  const gainedHP = Math.max(1, hitDieRoll + conMod + (favoredClassHP ? 1 : 0));
  const currentHPStat = character.stats.find(s => s.label === 'TP' || s.label === 'LP' || s.label === 'HP');
  const currentHP = currentHPStat ? parseInt(String(currentHPStat.value).replace(/[^0-9]/g, ''), 10) || 0 : 0;
  const newTotalHP = currentHP + gainedHP;

  // Roll HP Animation Handler
  const handleRollHitDie = () => {
    setIsRollingHP(true);
    let count = 0;
    const interval = setInterval(() => {
      setHitDieRoll(Math.floor(Math.random() * classPreset.hitDie) + 1);
      count++;
      if (count > 8) {
        clearInterval(interval);
        setIsRollingHP(false);
      }
    }, 50);
  };

  // Skill Allocation Handlers
  const handleAddSkillPoint = (skillName: string) => {
    if (remainingSkillPoints <= 0) return;
    setSkillAllocations(prev => ({
      ...prev,
      [skillName]: (prev[skillName] || 0) + 1
    }));
  };

  const handleRemoveSkillPoint = (skillName: string) => {
    if (!skillAllocations[skillName] || skillAllocations[skillName] <= 0) return;
    setSkillAllocations(prev => {
      const next = { ...prev };
      next[skillName] = next[skillName] - 1;
      if (next[skillName] <= 0) delete next[skillName];
      return next;
    });
  };

  // Apply Level Up to Character Sheet
  const handleApplyPathfinderLevelUp = () => {
    const updated = JSON.parse(JSON.stringify(character)) as CharacterData;

    // 1. Update Subtitle
    const currentSub = updated.subTitle || '';
    if (currentSub.toLowerCase().includes('level') || currentSub.toLowerCase().includes('stufe')) {
      updated.subTitle = currentSub.replace(/(?:level|stufe|lvl)\s*\d+/i, `Level ${targetLevel}`);
    } else {
      updated.subTitle = `Level ${targetLevel} ${classPreset.name.split(' ')[0]}`;
    }

    // 2. Update HP (TP)
    const hpIndex = updated.stats.findIndex(s => s.label === 'TP' || s.label === 'LP' || s.label === 'HP');
    if (hpIndex >= 0) {
      updated.stats[hpIndex].value = newTotalHP;
    }

    // 3. Update Attribute if boosted
    if (showAttrIncrease && selectedAttrToBoost && updated.characteristics) {
      const charIndex = updated.characteristics.findIndex(c => c.label === selectedAttrToBoost);
      if (charIndex >= 0) {
        const oldVal = parseInt(String(updated.characteristics[charIndex].value), 10) || 10;
        const newVal = oldVal + 1;
        const newMod = calculatePathfinderModifier(newVal);
        updated.characteristics[charIndex].value = newVal;
        updated.characteristics[charIndex].secondary = formatPathfinderModifier(newMod);
      }
    }

    // 4. Update Skills with allocated points
    if (updated.skills && Object.keys(skillAllocations).length > 0) {
      updated.skills = updated.skills.map(sk => {
        const added = skillAllocations[sk.name] || 0;
        if (added > 0) {
          return {
            ...sk,
            value: sk.value + added,
            trained: true
          };
        }
        return sk;
      });
    }

    // 5. Add new Abilities / Feats if entered
    if (newFeatName.trim()) {
      updated.abilities.push({
        name: newFeatName.trim(),
        type: 'talent',
        effect: newFeatDesc.trim() || `Erworben auf Stufe ${targetLevel}`,
        usage: 'Passiv'
      });
    }

    if (newClassFeatureName.trim()) {
      updated.abilities.push({
        name: newClassFeatureName.trim(),
        type: 'class',
        effect: newClassFeatureDesc.trim() || `Klassenmerkmal Stufe ${targetLevel} (${classPreset.name})`,
        usage: 'Aktiv / Passiv'
      });
    }

    // 6. Update Base Saves if present in savingThrows
    if (updated.savingThrows) {
      const newFortBase = calculateBaseSave(targetLevel, classPreset.goodSaves.fort);
      const newRefBase = calculateBaseSave(targetLevel, classPreset.goodSaves.ref);
      const newWillBase = calculateBaseSave(targetLevel, classPreset.goodSaves.will);

      updated.savingThrows.fortitude.base = newFortBase;
      updated.savingThrows.fortitude.total = newFortBase + (updated.savingThrows.fortitude.abilityMod || 0) + (updated.savingThrows.fortitude.magicMod || 0) + (updated.savingThrows.fortitude.miscMod || 0);

      updated.savingThrows.reflex.base = newRefBase;
      updated.savingThrows.reflex.total = newRefBase + (updated.savingThrows.reflex.abilityMod || 0) + (updated.savingThrows.reflex.magicMod || 0) + (updated.savingThrows.reflex.miscMod || 0);

      updated.savingThrows.will.base = newWillBase;
      updated.savingThrows.will.total = newWillBase + (updated.savingThrows.will.abilityMod || 0) + (updated.savingThrows.will.magicMod || 0) + (updated.savingThrows.will.miscMod || 0);
    }

    // 7. Update Base Attack Bonus (GAB / BAB) in stats
    const newBabNum = calculateBAB(targetLevel, classPreset.babProgression);
    const newBabFormatted = formatBABAttacks(newBabNum);
    const gabIndex = (updated.stats || []).findIndex(s => {
      const l = (s?.label || '').toLowerCase().trim();
      return l === 'gab' || l === 'bab' || l.includes('grund-angriffsbonus') || l.includes('grundangriffsbonus');
    });
    if (gabIndex >= 0) {
      updated.stats[gabIndex].value = newBabFormatted;
    } else {
      if (!updated.stats) updated.stats = [];
      updated.stats.push({
        label: "GAB",
        value: newBabFormatted
      });
    }

    // 8. Fully recalculate all dependent combat values, saving throws, weapon attack/damage bonuses, KMB, KMV, and combos
    const finalized = recalculatePathfinderCharacter(updated);

    onApplyLevelUp(finalized);
    onClose();
  };

  // CoC Test Roll Handler
  const handleRollCocSkill = (skill: Skill) => {
    const roll = Math.floor(Math.random() * 100) + 1;
    // Success in development phase if roll > current skill or 96-100
    const success = roll > skill.value || roll >= 96;
    const gain = success ? Math.floor(Math.random() * 10) + 1 : 0;
    setCocRollResults(prev => ({
      ...prev,
      [skill.name]: { roll, success, gain }
    }));
  };

  const handleApplyCocDevelopment = () => {
    const updated = JSON.parse(JSON.stringify(character)) as CharacterData;
    if (updated.skills) {
      updated.skills = updated.skills.map(sk => {
        const res = cocRollResults[sk.name];
        if (res && res.success && res.gain > 0) {
          return {
            ...sk,
            value: sk.value + res.gain,
            checked: false // reset tick after successful development
          };
        }
        return sk;
      });
    }

    // Apply sanity reward if stat exists
    const sanStatIndex = updated.stats.findIndex(s => s.label.toLowerCase().includes('stabilität') || s.label.toLowerCase().includes('sanity'));
    if (sanStatIndex >= 0 && cocSanityReward > 0) {
      const currentSan = parseInt(String(updated.stats[sanStatIndex].value), 10) || 50;
      updated.stats[sanStatIndex].value = currentSan + cocSanityReward;
    }

    onApplyLevelUp(updated);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden font-sans"
        >
          {/* Top Bar Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/60 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-black shadow-lg shadow-orange-500/20">
                <TrendingUp size={22} className="stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-white font-mono tracking-tight">
                    Stufenaufstiegs-Helfer
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold uppercase">
                    {character.system}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 font-mono">
                  Schritt-für-Schritt Guide & Automatisierung für <strong className="text-zinc-200">{character.name}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Tab Selector */}
              <div className="flex items-center gap-1 p-1 bg-zinc-900 rounded-xl border border-zinc-800 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setActiveTab('wizard')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'wizard' ? 'bg-amber-500 text-black shadow-sm' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Sparkles size={13} />
                  <span>Aufstiegs-Assistent</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('guide')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'guide' ? 'bg-amber-500 text-black shadow-sm' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <BookOpen size={13} />
                  <span>Regel-Leitfaden</span>
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer ml-2"
                title="Schließen"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin">
            {activeTab === 'wizard' ? (
              <>
                {/* SYSTEM SPECIFIC WIZARDS */}
                {isPathfinder(character) ? (
                  /* ================= PATHFINDER 1e WIZARD ================= */
                  <div className="space-y-6">
                    {/* Level & Class Setup Row */}
                    <div className="p-4 bg-zinc-900/90 border border-zinc-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="text-center bg-black/60 p-3 rounded-xl border border-zinc-800 min-w-[90px]">
                          <div className="text-[10px] uppercase font-mono tracking-wider text-zinc-400">Aktuell</div>
                          <div className="text-2xl font-black text-white font-mono">Stufe {currentLevel}</div>
                        </div>
                        <ArrowRight size={20} className="text-amber-500 shrink-0" />
                        <div className="text-center bg-amber-500/10 p-3 rounded-xl border border-amber-500/40 min-w-[110px]">
                          <div className="text-[10px] uppercase font-mono tracking-wider text-amber-400 font-bold">Ziel-Stufe</div>
                          <div className="flex items-center justify-center gap-2 mt-0.5">
                            <button
                              type="button"
                              onClick={() => setTargetLevel(Math.max(1, targetLevel - 1))}
                              className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center text-xs font-bold cursor-pointer"
                            >
                              -
                            </button>
                            <span className="text-2xl font-black text-amber-400 font-mono">{targetLevel}</span>
                            <button
                              type="button"
                              onClick={() => setTargetLevel(targetLevel + 1)}
                              className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center text-xs font-bold cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Class Selection */}
                      <div className="flex flex-col gap-1.5 flex-1 max-w-sm">
                        <label className="text-xs font-mono text-zinc-400 flex items-center justify-between">
                          <span>Klasse für diesen Aufstieg:</span>
                          <span className="text-[10px] text-amber-400">W{classPreset.hitDie} • {classPreset.skillPointsPerLevel}+IN Punkte</span>
                        </label>
                        <select
                          value={selectedClassId}
                          onChange={(e) => {
                            setSelectedClassId(e.target.value);
                            const nextPreset = PATHFINDER_CLASSES[e.target.value];
                            if (nextPreset) {
                              setHitDieRoll(Math.ceil(nextPreset.hitDie / 2) + 1);
                              setNewClassFeatureName(nextPreset.keyFeaturesByLevel?.[targetLevel]?.[0] || '');
                            }
                          }}
                          className="bg-black border border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-amber-500 outline-none cursor-pointer"
                        >
                          {Object.values(PATHFINDER_CLASSES).map(cls => (
                            <option key={cls.id} value={cls.id}>
                              {cls.name} (W{cls.hitDie} Trefferwürfel)
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Step 1: Hit Points (TP) */}
                    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                            <Heart size={18} />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                              <span>Schritt 1: Trefferpunkte würfeln oder wählen</span>
                              <span className="text-xs font-normal text-zinc-400">(W{classPreset.hitDie} + KO-Mod {formatPathfinderModifier(conMod)})</span>
                            </h3>
                            <p className="text-xs text-zinc-400">
                              Würfle deinen Trefferwürfel oder nimm den festen Durchschnitt für Stufe {targetLevel}.
                            </p>
                          </div>
                        </div>

                        {/* Live Total Badge */}
                        <div className="text-right">
                          <div className="text-[10px] uppercase font-mono text-zinc-400">Neue TP</div>
                          <div className="text-xl font-black text-red-400 font-mono">
                            {currentHP} ➔ <span className="text-white bg-red-500/20 px-2 py-0.5 rounded-lg border border-red-500/30">{newTotalHP}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                        {/* Roll control */}
                        <div className="p-3.5 bg-black/60 border border-zinc-800 rounded-xl flex items-center justify-between">
                          <div>
                            <div className="text-[10px] font-mono uppercase text-zinc-400">Trefferwürfel (1W{classPreset.hitDie})</div>
                            <div className="text-xl font-mono font-black text-white mt-0.5">{hitDieRoll}</div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={handleRollHitDie}
                              disabled={isRollingHP}
                              className="px-2.5 py-1.5 bg-red-500 hover:bg-red-400 text-black font-mono font-bold text-xs rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                            >
                              <Dices size={14} className={isRollingHP ? "animate-spin" : ""} />
                              <span>Würfeln</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setHitDieRoll(Math.ceil(classPreset.hitDie / 2) + 1)}
                              className="px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-[10px] rounded-lg transition-all cursor-pointer"
                              title="Fester Durchschnitt"
                            >
                              Durchschnitt
                            </button>
                          </div>
                        </div>

                        {/* Constitution Modifier */}
                        <div className="p-3.5 bg-black/60 border border-zinc-800 rounded-xl flex items-center justify-between">
                          <div>
                            <div className="text-[10px] font-mono uppercase text-zinc-400">Konstitutions-Bonus</div>
                            <div className="text-xl font-mono font-black text-amber-400 mt-0.5">
                              {formatPathfinderModifier(conMod)}
                            </div>
                          </div>
                          <span className="text-[11px] font-mono text-zinc-500">KO {currentConStat?.value || 14}</span>
                        </div>

                        {/* Favored Class HP Bonus */}
                        <label className="p-3.5 bg-black/60 border border-zinc-800 hover:border-zinc-700 rounded-xl flex items-center justify-between cursor-pointer">
                          <div>
                            <div className="text-[10px] font-mono uppercase text-zinc-400">Bevorzugte Klasse</div>
                            <div className="text-xs font-mono font-bold text-white mt-0.5">+1 Bonus-Trefferpunkt</div>
                          </div>
                          <input
                            type="checkbox"
                            checked={favoredClassHP}
                            onChange={(e) => setFavoredClassHP(e.target.checked)}
                            className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                          />
                        </label>
                      </div>

                      <div className="text-[11px] font-mono text-zinc-400 bg-zinc-950/80 p-2.5 rounded-xl border border-zinc-800/80 flex items-center justify-between">
                        <span>Berechnung: {hitDieRoll} (Wurf) + {conMod} (KO-Mod) + {favoredClassHP ? 1 : 0} (Klasse) = <strong>+{gainedHP} TP</strong></span>
                        <span className="text-zinc-500">Minimum: 1 TP pro Stufe</span>
                      </div>
                    </div>

                    {/* Step 2: Base Attack Bonus (GAB) & Saves */}
                    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                          <Swords size={18} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white font-mono">
                            Schritt 2: Grund-Angriffsbonus (GAB) & Basis-Rettungswürfe
                          </h3>
                          <p className="text-xs text-zinc-400">
                            Werte für Stufe {targetLevel} ({classPreset.babProgression === 'full' ? 'Voller GAB' : classPreset.babProgression === 'threeFourths' ? '3/4 GAB' : '1/2 GAB'}).
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {/* BAB */}
                        <div className="p-3 bg-black/60 border border-zinc-800 rounded-xl text-center">
                          <span className="text-[10px] font-mono uppercase text-zinc-400">GAB (Angriffe)</span>
                          <div className="text-base font-black text-amber-400 font-mono mt-1">
                            {formatBABAttacks(calculateBAB(targetLevel, classPreset.babProgression))}
                          </div>
                          <span className="text-[10px] font-mono text-zinc-500">
                            Vorher: {formatBABAttacks(calculateBAB(currentLevel, classPreset.babProgression))}
                          </span>
                        </div>

                        {/* Fortitude */}
                        <div className="p-3 bg-black/60 border border-zinc-800 rounded-xl text-center">
                          <span className="text-[10px] font-mono uppercase text-zinc-400">Zähigkeit (Basis)</span>
                          <div className="text-base font-black text-white font-mono mt-1">
                            +{calculateBaseSave(targetLevel, classPreset.goodSaves.fort)}
                          </div>
                          <span className="text-[10px] font-mono text-zinc-500">
                            {classPreset.goodSaves.fort ? '★ Guter RW' : 'Schlechter RW'}
                          </span>
                        </div>

                        {/* Reflex */}
                        <div className="p-3 bg-black/60 border border-zinc-800 rounded-xl text-center">
                          <span className="text-[10px] font-mono uppercase text-zinc-400">Reflex (Basis)</span>
                          <div className="text-base font-black text-white font-mono mt-1">
                            +{calculateBaseSave(targetLevel, classPreset.goodSaves.ref)}
                          </div>
                          <span className="text-[10px] font-mono text-zinc-500">
                            {classPreset.goodSaves.ref ? '★ Guter RW' : 'Schlechter RW'}
                          </span>
                        </div>

                        {/* Will */}
                        <div className="p-3 bg-black/60 border border-zinc-800 rounded-xl text-center">
                          <span className="text-[10px] font-mono uppercase text-zinc-400">Wille (Basis)</span>
                          <div className="text-base font-black text-white font-mono mt-1">
                            +{calculateBaseSave(targetLevel, classPreset.goodSaves.will)}
                          </div>
                          <span className="text-[10px] font-mono text-zinc-500">
                            {classPreset.goodSaves.will ? '★ Guter RW' : 'Schlechter RW'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Step 3: Attribute Score Increase (Level 4, 8, 12, 16, 20) */}
                    <div className={`rounded-2xl p-5 space-y-3 transition-all border ${
                      showAttrIncrease 
                        ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/40 shadow-lg shadow-amber-500/5' 
                        : 'bg-zinc-900/60 border-zinc-800/80'
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2 rounded-xl border ${showAttrIncrease ? 'bg-amber-500 text-black border-amber-400' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                            <Brain size={18} />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                              <span>Schritt 3: Attributssteigerung (+1 auf ein Attribut)</span>
                              {isAttrLevel && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-black">
                                  Meilenstein Stufe {targetLevel}!
                                </span>
                              )}
                            </h3>
                            <p className="text-xs text-zinc-400">
                              {isAttrLevel 
                                ? 'Auf jeder 4. Stufe (4, 8, 12, 16, 20) darfst du 1 Attribut dauerhaft um +1 erhöhen.'
                                : `Keine reguläre Attributssteigerung auf Stufe ${targetLevel} (nächste Steigerung auf Stufe ${Math.ceil(targetLevel / 4) * 4}).`}
                            </p>
                          </div>
                        </div>

                        {!isAttrLevel && (
                          <button
                            type="button"
                            onClick={() => setManualAttrOverride(!manualAttrOverride)}
                            className="text-[11px] font-mono text-zinc-400 hover:text-amber-400 underline cursor-pointer text-left"
                          >
                            {manualAttrOverride ? 'Attributssteigerung deaktivieren' : 'Manuell +1 Attribut vergeben (Hausregel)'}
                          </button>
                        )}
                      </div>

                      {showAttrIncrease && (
                        <div className="pt-2 space-y-3">
                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                            {['ST', 'GE', 'KO', 'IN', 'WE', 'CH'].map(attrKey => {
                              const stat = character.characteristics?.find(c => c.label === attrKey);
                              const currentVal = stat ? parseInt(String(stat.value), 10) || 10 : 10;
                              const isSelected = selectedAttrToBoost === attrKey;
                              const nextVal = isSelected ? currentVal + 1 : currentVal;
                              const nextMod = calculatePathfinderModifier(nextVal);
                              const currentMod = calculatePathfinderModifier(currentVal);
                              const modIncreased = nextMod > currentMod;

                              return (
                                <button
                                  key={attrKey}
                                  type="button"
                                  onClick={() => setSelectedAttrToBoost(attrKey)}
                                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between ${
                                    isSelected
                                      ? 'bg-amber-500 text-black border-amber-400 font-bold shadow-md scale-102'
                                      : 'bg-black/60 hover:bg-zinc-800/80 border-zinc-800 text-zinc-300'
                                  }`}
                                >
                                  <span className="text-xs font-mono font-bold uppercase">{attrKey}</span>
                                  <div className="text-base font-mono font-black my-0.5">
                                    {currentVal} {isSelected && <span>➔ {nextVal}</span>}
                                  </div>
                                  <span className={`text-[10px] font-mono ${isSelected ? 'text-black/80 font-bold' : 'text-zinc-500'}`}>
                                    Mod: {formatPathfinderModifier(isSelected ? nextMod : currentMod)}
                                    {isSelected && modIncreased && ' (▲)'}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                          <p className="text-[11px] font-mono text-amber-300/80 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                            💡 Tipp: Wenn die Erhöhung einen geraden Wert erreicht (z. B. 19 auf 20), steigt dein Modifikator sofort von +4 auf +5!
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Step 4: Feats & Class Features */}
                    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          <Award size={18} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                            <span>Schritt 4: Talente & Klassenmerkmale</span>
                            {isOddLevel && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                                🌟 Allgemeines Talent verfügbar (Ungerade Stufe)
                              </span>
                            )}
                          </h3>
                          <p className="text-xs text-zinc-400">
                            {isOddLevel 
                              ? 'Auf jeder ungeraden Stufe (1, 3, 5, 7, 9, 11, etc.) erhält dein Charakter ein neues Talent freier Wahl.'
                              : 'Auf geraden Stufen gibt es normalerweise kein allgemeines Talent, jedoch evtl. Klassen-Bonustalente (z. B. Schurkentalent oder Kampftalent).'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                        {/* General Feat */}
                        <div className="space-y-2 p-3.5 bg-black/60 border border-zinc-800 rounded-xl">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-mono text-zinc-300 font-bold">
                              Neues Talent (Feat):
                            </label>
                            {isOddLevel && <span className="text-[10px] font-mono text-indigo-400">Reguläres Talent</span>}
                          </div>
                          <input
                            type="text"
                            placeholder="z. B. Waffenfinesse, Wachsamkeit, Zähigkeit..."
                            value={newFeatName}
                            onChange={(e) => setNewFeatName(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs font-mono text-white outline-none focus:border-indigo-500"
                          />
                          <input
                            type="text"
                            placeholder="Optionale kurze Beschreibung / Effekt..."
                            value={newFeatDesc}
                            onChange={(e) => setNewFeatDesc(e.target.value)}
                            className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg px-3 py-1.5 text-[11px] font-mono text-zinc-400 outline-none focus:border-indigo-500"
                          />
                        </div>

                        {/* Class Feature */}
                        <div className="space-y-2 p-3.5 bg-black/60 border border-zinc-800 rounded-xl">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-mono text-zinc-300 font-bold">
                              Neues Klassenmerkmal:
                            </label>
                            <span className="text-[10px] font-mono text-amber-400">{classPreset.name.split(' ')[0]} Stufe {targetLevel}</span>
                          </div>
                          <input
                            type="text"
                            placeholder="z. B. Fortgeschrittenes Schurkentalent, Hinterhältiger Angriff..."
                            value={newClassFeatureName}
                            onChange={(e) => setNewClassFeatureName(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs font-mono text-white outline-none focus:border-amber-500"
                          />
                          <input
                            type="text"
                            placeholder="Optionale kurze Beschreibung / Effekt..."
                            value={newClassFeatureDesc}
                            onChange={(e) => setNewClassFeatureDesc(e.target.value)}
                            className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg px-3 py-1.5 text-[11px] font-mono text-zinc-400 outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Step 5: Skill Ranks Allocator */}
                    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <Brain size={18} />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                              <span>Schritt 5: Fertigkeitspunkte verteilen</span>
                            </h3>
                            <p className="text-xs text-zinc-400 font-mono">
                              {baseSkillPoints} (Klasse) + {intMod} (IN-Mod) + {favoredClassSkill ? '1 (Bevorzugt)' : '0'} = <strong>{totalSkillPoints} Punkte</strong>
                            </p>
                          </div>
                        </div>

                        {/* Remaining Points Counter */}
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={favoredClassSkill}
                              onChange={(e) => setFavoredClassSkill(e.target.checked)}
                              className="w-3.5 h-3.5 accent-emerald-500 rounded cursor-pointer"
                            />
                            <span>+1 Bevorzugte Klasse</span>
                          </label>

                          <div className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold ${
                            remainingSkillPoints === 0 
                              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' 
                              : remainingSkillPoints > 0 
                                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 animate-pulse'
                                : 'bg-red-500/20 border-red-500/50 text-red-300'
                          }`}>
                            Noch {remainingSkillPoints} Punkte frei
                          </div>
                        </div>
                      </div>

                      {/* Skills List Allocator */}
                      <div className="max-h-60 overflow-y-auto pr-1 space-y-1.5 scrollbar-thin border border-zinc-800/80 rounded-xl p-3 bg-black/40">
                        {character.skills && character.skills.length > 0 ? (
                          character.skills.map((skill) => {
                            const isClassSkill = classPreset.classSkills.some(cs => 
                              skill.name.toLowerCase().includes(cs.toLowerCase()) || cs.toLowerCase().includes(skill.name.toLowerCase())
                            );
                            const allocated = skillAllocations[skill.name] || 0;

                            return (
                              <div
                                key={skill.name}
                                className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/70 hover:bg-zinc-900 border border-zinc-800/80 text-xs font-mono transition-colors"
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  {isClassSkill && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold uppercase shrink-0" title="Klassenfertigkeit (+3 Bonus bei mindestens 1 Rang)">
                                      Klasse (+3)
                                    </span>
                                  )}
                                  <span className="text-zinc-200 truncate">{skill.name}</span>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                  <span className="text-zinc-400 text-[11px]">
                                    Aktuell: <strong className="text-white">{skill.value}</strong>
                                    {allocated > 0 && (
                                      <span className="text-emerald-400 font-bold ml-1.5">➔ {skill.value + allocated} (+{allocated})</span>
                                    )}
                                  </span>

                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveSkillPoint(skill.name)}
                                      disabled={allocated <= 0}
                                      className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:hover:bg-zinc-800 text-zinc-300 flex items-center justify-center cursor-pointer"
                                    >
                                      <Minus size={11} />
                                    </button>
                                    <span className="w-5 text-center font-bold text-white text-xs">{allocated}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleAddSkillPoint(skill.name)}
                                      disabled={remainingSkillPoints <= 0}
                                      className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:hover:bg-zinc-800 text-zinc-300 flex items-center justify-center cursor-pointer"
                                    >
                                      <Plus size={11} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-4 text-xs text-zinc-500 font-mono">
                            Keine Fertigkeiten im Charakterbogen hinterlegt.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Step 6: Summary & Apply Button */}
                    <div className="p-5 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border border-amber-500/30 rounded-2xl space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                            <Check size={16} className="text-amber-400" />
                            <span>Zusammenfassung des Stufenaufstiegs:</span>
                          </h4>
                          <div className="text-xs font-mono text-zinc-300 mt-1 space-x-3">
                            <span>• Stufe: {currentLevel} ➔ <strong>{targetLevel}</strong></span>
                            <span>• TP: {currentHP} ➔ <strong>{newTotalHP}</strong> (+{gainedHP})</span>
                            {showAttrIncrease && <span>• Attribut: <strong>+{selectedAttrToBoost}</strong></span>}
                            <span>• Fertigkeitspunkte verteilt: <strong>{pointsAllocatedSoFar}</strong>/{totalSkillPoints}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleApplyPathfinderLevelUp}
                          className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-black font-mono font-black text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/20 hover:scale-102"
                        >
                          <Save size={16} />
                          <span>Stufenaufstieg auf Bogen anwenden</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : character.system === 'shadowrun' ? (
                  /* ================= SHADOWRUN 5e KARMA WIZARD ================= */
                  <div className="space-y-6">
                    <div className="p-4 bg-zinc-900/90 border border-zinc-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                          <Flame size={16} className="text-amber-400" />
                          <span>Shadowrun 5e: Karma-Steigerungs-Rechner</span>
                        </h3>
                        <p className="text-xs text-zinc-400 font-mono">
                          In Shadowrun gibt es keine klassischen Level – Charaktere steigen durch Investition von Karma auf!
                        </p>
                      </div>
                    </div>

                    {/* Karma Cost Calculator Box */}
                    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-mono text-zinc-400">Kategorie:</label>
                          <select
                            value={srCategory}
                            onChange={(e) => setSrCategory(e.target.value)}
                            className="w-full bg-black border border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none focus:border-amber-500"
                          >
                            <option value="attribute">Attribut (Neue Stufe × 5)</option>
                            <option value="skill">Aktionsfertigkeit (Neue Stufe × 2)</option>
                            <option value="skill_group">Fertigkeitsgruppe (Neue Stufe × 5)</option>
                            <option value="specialization">Spezialisierung (Pauschal 7)</option>
                            <option value="knowledge">Wissens-/Sprachfertigkeit (Neue Stufe × 1)</option>
                            <option value="spell">Zauber / Alchemie (Pauschal 5)</option>
                            <option value="complex_form">Komplexe Form (Pauschal 4)</option>
                            <option value="initiation">Initiation / Wandlung (10 + Grad × 3)</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-mono text-zinc-400">Aktuelle Stufe:</label>
                          <input
                            type="number"
                            min="0"
                            max="30"
                            value={srCurrentRating}
                            onChange={(e) => setSrCurrentRating(parseInt(e.target.value, 10) || 0)}
                            className="w-full bg-black border border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none focus:border-amber-500"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-mono text-zinc-400">Ziel-Stufe:</label>
                          <input
                            type="number"
                            min="1"
                            max="30"
                            value={srTargetRating}
                            onChange={(e) => setSrTargetRating(parseInt(e.target.value, 10) || 1)}
                            className="w-full bg-black border border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>

                      {/* Calculated Karma Box */}
                      {(() => {
                        let totalKarma = 0;
                        let formulaDesc = '';

                        if (srCategory === 'specialization') {
                          totalKarma = 7;
                          formulaDesc = 'Pauschal 7 Karma pro Spezialisierung';
                        } else if (srCategory === 'spell') {
                          totalKarma = 5;
                          formulaDesc = 'Pauschal 5 Karma pro Zauber';
                        } else if (srCategory === 'complex_form') {
                          totalKarma = 4;
                          formulaDesc = 'Pauschal 4 Karma pro Komplexe Form';
                        } else if (srCategory === 'initiation') {
                          totalKarma = 10 + (srTargetRating * 3);
                          formulaDesc = `10 + (${srTargetRating} × 3) Karma`;
                        } else {
                          const mult = srCategory === 'attribute' ? 5 : srCategory === 'skill_group' ? 5 : srCategory === 'skill' ? 2 : 1;
                          for (let r = srCurrentRating + 1; r <= srTargetRating; r++) {
                            totalKarma += r * mult;
                          }
                          formulaDesc = `Stufe ${srCurrentRating} ➔ ${srTargetRating} (${srCategory === 'attribute' ? '×5' : srCategory === 'skill' ? '×2' : '×1'} Karma pro Stufe)`;
                        }

                        return (
                          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between">
                            <div>
                              <div className="text-[10px] uppercase font-mono text-amber-400 font-bold">Benötigtes Karma:</div>
                              <div className="text-2xl font-black text-white font-mono">{totalKarma} Karma</div>
                              <div className="text-[11px] text-zinc-400 font-mono mt-0.5">{formulaDesc}</div>
                            </div>
                            <div className="text-right">
                              <span className="text-xs text-zinc-400 font-mono">Regelwerk SR5 S. 107</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                ) : (character.system === 'coc7e' || character.system === 'coc1920') ? (
                  /* ================= CALL OF CTHULHU DEVELOPMENT PHASE ================= */
                  <div className="space-y-6">
                    <div className="p-4 bg-zinc-900/90 border border-zinc-800 rounded-2xl">
                      <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                        <Award size={16} className="text-amber-400" />
                        <span>Call of Cthulhu: Die Ermittler-Entwicklungsphase</span>
                      </h3>
                      <p className="text-xs text-zinc-400 font-mono mt-1">
                        Würfle für alle Fertigkeiten, die im Abenteuer erfolgreich angewendet wurden: Liegt dein W100-Wurf über deinem aktuellen Wert (oder 96-100), steigt deine Fertigkeit um 1W10 Punkte!
                      </p>
                    </div>

                    {/* Skill Development Table */}
                    <div className="space-y-2 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5">
                      <h4 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider mb-2">
                        Erfolgreiche Fertigkeiten steigern:
                      </h4>

                      <div className="max-h-64 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                        {character.skills && character.skills.length > 0 ? (
                          character.skills.map(skill => {
                            const res = cocRollResults[skill.name];

                            return (
                              <div
                                key={skill.name}
                                className="flex items-center justify-between p-3 rounded-xl bg-black/60 border border-zinc-800 text-xs font-mono"
                              >
                                <div>
                                  <span className="font-bold text-white">{skill.name}</span>
                                  <span className="text-zinc-400 ml-2">Aktueller Wert: <strong>{skill.value}%</strong></span>
                                  {res && (
                                    <div className="text-[11px] mt-0.5">
                                      Wurf: <strong>{res.roll}</strong> ➔ {res.success ? (
                                        <span className="text-emerald-400 font-bold">Erfolg! +{res.gain}% (Neu: {skill.value + res.gain}%)</span>
                                      ) : (
                                        <span className="text-zinc-500">Nicht verbessert (Wurf ≤ Wert)</span>
                                      )}
                                    </div>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleRollCocSkill(skill)}
                                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-amber-400 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                                >
                                  <Dices size={13} />
                                  <span>{res ? 'Neu würfeln' : 'Steigerung prüfen (W100)'}</span>
                                </button>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-4 text-xs text-zinc-500 font-mono">
                            Keine Fertigkeiten hinterlegt.
                          </div>
                        )}
                      </div>

                      {/* Sanity Reward */}
                      <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
                        <div className="space-y-1">
                          <label className="text-xs font-mono text-zinc-300 font-bold">
                            Geistige Stabilität Belohnung:
                          </label>
                          <p className="text-[11px] text-zinc-500 font-mono">Belohnung für Fallabschluss oder Kapitelende</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="30"
                            value={cocSanityReward}
                            onChange={(e) => setCocSanityReward(parseInt(e.target.value, 10) || 0)}
                            className="w-16 bg-black border border-zinc-700 rounded-lg px-2 py-1 text-xs font-mono text-white text-center"
                          />
                          <span className="text-xs font-mono text-zinc-400">Punkte</span>
                        </div>
                      </div>

                      <div className="pt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={handleApplyCocDevelopment}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-md"
                        >
                          <Check size={14} />
                          <span>Steigerungen auf Bogen anwenden</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ================= GENERIC SYSTEM WIZARD ================= */
                  <div className="space-y-6">
                    <div className="p-4 bg-zinc-900/90 border border-zinc-800 rounded-2xl">
                      <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                        <TrendingUp size={16} className="text-amber-400" />
                        <span>Universeller Stufenaufstiegs-Helfer</span>
                      </h3>
                      <p className="text-xs text-zinc-400 font-mono mt-1">
                        Passe die Stufe und Schlüsselwerte deines Charakters an:
                      </p>
                    </div>

                    <div className="p-5 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-mono text-zinc-400">Neuer Untertitel / Stufe:</label>
                          <input
                            type="text"
                            defaultValue={character.subTitle || 'Stufe 2'}
                            id="input-generic-subtitle"
                            className="w-full bg-black border border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>

                      <div className="pt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            const sub = (document.getElementById('input-generic-subtitle') as HTMLInputElement)?.value;
                            if (sub) {
                              const updated = { ...character, subTitle: sub };
                              onApplyLevelUp(updated);
                              onClose();
                            }
                          }}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer"
                        >
                          <Save size={14} />
                          <span>Speichern</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* ================= TAB 2: DETAILED RULE GUIDES ================= */
              <div className="space-y-6">
                {/* Pathfinder 1e Step-by-Step Guide */}
                <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-3 border-b border-zinc-800 pb-3">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      <BookOpen size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white font-mono">
                        Pathfinder 1e: Offizieller Stufenaufstiegs-Leitfaden
                      </h3>
                      <p className="text-xs text-zinc-400 font-mono">
                        Die 9 festen Schritte bei jedem Stufenaufstieg nach dem Pathfinder Grundregelwerk:
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="p-4 bg-black/60 border border-zinc-800/80 rounded-xl space-y-1.5">
                      <div className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5">
                        <Heart size={14} />
                        <span>1. Trefferpunkte (TP / HP)</span>
                      </div>
                      <p className="text-xs text-zinc-300">
                        Würfle deinen Klassen-Trefferwürfel (z. B. 1W8 für Schurke, 1W10 für Kämpfer, 1W6 für Magier, 1W12 für Barbar) oder nimm den Durchschnitt. Addiere deinen <strong>Konstitutionsmodifikator</strong> und ggf. <strong>+1 TP für deine Bevorzugte Klasse</strong>. Mindestzuwachs: 1 TP pro Stufe.
                      </p>
                    </div>

                    <div className="p-4 bg-black/60 border border-zinc-800/80 rounded-xl space-y-1.5">
                      <div className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5">
                        <Swords size={14} />
                        <span>2. Grund-Angriffsbonus (GAB)</span>
                      </div>
                      <p className="text-xs text-zinc-300">
                        Prüfe die Klassentabelle deines Charakters. Erreicht dein GAB +6, +11 oder +16, erhält dein Charakter bei einem vollen Angriff einen <strong>zusätzlichen Angriff</strong> mit -5 Abzug (+6/+1, +11/+6/+1, etc.).
                      </p>
                    </div>

                    <div className="p-4 bg-black/60 border border-zinc-800/80 rounded-xl space-y-1.5">
                      <div className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5">
                        <ShieldAlert size={14} />
                        <span>3. Rettungswürfe (Zähigkeit, Reflex, Wille)</span>
                      </div>
                      <p className="text-xs text-zinc-300">
                        <strong>Gute Rettungswürfe</strong> starten bei +2 und steigen alle 2 Stufen (+1/2 Stufe). <strong>Schlechte Rettungswürfe</strong> starten bei +0 und steigen alle 3 Stufen (+1/3 Stufe).
                      </p>
                    </div>

                    <div className="p-4 bg-black/60 border border-zinc-800/80 rounded-xl space-y-1.5">
                      <div className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5">
                        <Brain size={14} />
                        <span>4. Attributssteigerung (Alle 4 Stufen)</span>
                      </div>
                      <p className="text-xs text-zinc-300">
                        Auf Stufe <strong>4, 8, 12, 16 und 20</strong> darfst du <strong>+1 auf ein beliebiges Attribut</strong> vergeben. Steigt die Konstitution, erhöht sich deine TP rückwirkend für alle bisherigen Stufen!
                      </p>
                    </div>

                    <div className="p-4 bg-black/60 border border-zinc-800/80 rounded-xl space-y-1.5">
                      <div className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5">
                        <Award size={14} />
                        <span>5. Allgemeine Talente (Ungerade Stufen)</span>
                      </div>
                      <p className="text-xs text-zinc-300">
                        Auf jeder <strong>ungeraden Charakterstufe</strong> (1, 3, 5, 7, 9, 11, 13, 15, 17, 19) erhält dein Charakter <strong>1 allgemeines Talent</strong> frei nach Wahl (Voraussetzungen beachten).
                      </p>
                    </div>

                    <div className="p-4 bg-black/60 border border-zinc-800/80 rounded-xl space-y-1.5">
                      <div className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5">
                        <Zap size={14} />
                        <span>6. Fertigkeitspunkte (Skill Ranks)</span>
                      </div>
                      <p className="text-xs text-zinc-300">
                        Du erhältst: <strong>Klassenwert (z.B. 8 für Schurke) + Intelligenzmodifikator</strong> (+1 falls Bevorzugte Klasse als Fertigkeitspunkt gewählt). Maximaler Rang in einer Fertigkeit = aktuelle Charakterstufe. Klassenfertigkeiten erhalten bei mindestens 1 Rang einen <strong>einmaligen Bonus von +3</strong>.
                      </p>
                    </div>

                    <div className="p-4 bg-black/60 border border-zinc-800/80 rounded-xl space-y-1.5">
                      <div className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5">
                        <Sparkles size={14} />
                        <span>7. Klassenmerkmale & Zauber</span>
                      </div>
                      <p className="text-xs text-zinc-300">
                        Prüfe neue Klassenmerkmale (z.B. Schurkentalente, Hinterhältiger Angriff +1W6, Gestaltwandeln für Druiden). Zauberkundige erhalten neue Zauberplätze pro Tag und lernen neue Zauber.
                      </p>
                    </div>

                    <div className="p-4 bg-black/60 border border-zinc-800/80 rounded-xl space-y-1.5">
                      <div className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5">
                        <Check size={14} />
                        <span>8. Bevorzugte Klasse Bonus</span>
                      </div>
                      <p className="text-xs text-zinc-300">
                        Wähle jedes Mal bei einer Stufe deiner bevorzugten Klasse entweder: <strong>+1 TP</strong>, <strong>+1 Fertigkeitspunkt</strong> oder einen alternativen Volksbonus (z.B. Gnom/Elf/Zwerg).
                      </p>
                    </div>
                  </div>
                </div>

                {/* Shadowrun 5e Karma Rules Reference */}
                <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-3 border-b border-zinc-800 pb-3">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      <Flame size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white font-mono">
                        Shadowrun 5e: Offizielle Karma-Steigerungstabelle (S. 107)
                      </h3>
                      <p className="text-xs text-zinc-400 font-mono">
                        Alle Kosten für die Charakterentwicklung im Schattenlauf:
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs font-mono text-left border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-800 text-zinc-400 text-[10px] uppercase">
                          <th className="py-2.5 px-3">Kategorie</th>
                          <th className="py-2.5 px-3">Karma-Kosten</th>
                          <th className="py-2.5 px-3">Beispiel</th>
                          <th className="py-2.5 px-3">Hinweis</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60">
                        {SHADOWRUN_KARMA_RULES.map((rule, idx) => (
                          <tr key={idx} className="hover:bg-zinc-900/40">
                            <td className="py-2.5 px-3 font-bold text-white">{rule.category}</td>
                            <td className="py-2.5 px-3 text-amber-400 font-bold">{rule.formula}</td>
                            <td className="py-2.5 px-3 text-zinc-300">{rule.example}</td>
                            <td className="py-2.5 px-3 text-zinc-500 text-[11px]">{rule.notes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Call of Cthulhu 7e Development Phase */}
                <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-3 border-b border-zinc-800 pb-3">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      <Award size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white font-mono">
                        {COC_DEVELOPMENT_GUIDE.title}
                      </h3>
                      <p className="text-xs text-zinc-400 font-mono">
                        Wie Ermittler zwischen den Szenarien Erfahrung sammeln und Stabilität zurückgewinnen:
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {COC_DEVELOPMENT_GUIDE.steps.map((step, idx) => (
                      <div key={idx} className="p-4 bg-black/60 border border-zinc-800 rounded-xl space-y-1.5">
                        <div className="text-xs font-mono font-bold text-amber-400">{step.title}</div>
                        <p className="text-xs text-zinc-300">{step.description}</p>
                        <p className="text-[11px] text-zinc-400 bg-zinc-950 p-2 rounded border border-zinc-800/80">
                          {step.rules}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Traveller 2e Training Guide */}
                <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-3 border-b border-zinc-800 pb-3">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      <Zap size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white font-mono">
                        {TRAVELLER_TRAINING_GUIDE.title}
                      </h3>
                      <p className="text-xs text-zinc-400 font-mono">
                        Lernwochen und Trainingsabschnitte im Mongoose Traveller System:
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {TRAVELLER_TRAINING_GUIDE.steps.map((step, idx) => (
                      <div key={idx} className="p-4 bg-black/60 border border-zinc-800 rounded-xl space-y-1.5">
                        <div className="text-xs font-mono font-bold text-amber-400">{step.title}</div>
                        <p className="text-xs text-zinc-300">{step.description}</p>
                        <p className="text-[11px] text-zinc-400 bg-zinc-950 p-2 rounded border border-zinc-800/80">
                          {step.rules}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
