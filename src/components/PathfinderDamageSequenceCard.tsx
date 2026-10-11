import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, Zap, Sword, Dices, RotateCcw, Sparkles, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { CharacterData } from '../types';
import { 
  formatPathfinderModifier, 
  calculateOptimalDamageSequence,
  hasDexToDamage,
  calculatePathfinderModifier,
  getAttributeScore
} from '../utils/pathfinder';

interface PathfinderDamageSequenceCardProps {
  character: CharacterData;
  onRollComplete?: (total: number, summary: string) => void;
  className?: string;
  defaultExpanded?: boolean;
}

interface RollHitDetail {
  attackIndex: number;
  title: string;
  weaponName: string;
  attackRoll: { d20: number; bonus: number; total: number; isCritThreat: boolean };
  baseDiceRoll: number;
  attrBonus: number;
  magicBonus: number;
  elementalRoll?: number;
  sneakDiceRolls: number[];
  bleedDamage: number;
  totalDamage: number;
}

export const PathfinderDamageSequenceCard: React.FC<PathfinderDamageSequenceCardProps> = ({
  character,
  onRollComplete,
  className = '',
  defaultExpanded = true
}) => {
  const geScore = getAttributeScore(character, 'GE');
  const geMod = calculatePathfinderModifier(geScore);
  const stScore = getAttributeScore(character, 'ST');
  const stMod = calculatePathfinderModifier(stScore);
  const characterHasDexDmg = hasDexToDamage(character);

  const initialUseDex = character.combatSettings?.damageAttr
    ? character.combatSettings.damageAttr === 'GE'
    : characterHasDexDmg;

  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
  const [useDexToDamage, setUseDexToDamage] = useState<boolean>(initialUseDex);

  React.useEffect(() => {
    if (character.combatSettings?.damageAttr) {
      setUseDexToDamage(character.combatSettings.damageAttr === 'GE');
    }
  }, [character.combatSettings?.damageAttr]);
  const [includeSneakAttack, setIncludeSneakAttack] = useState<boolean>(true);
  const [isFlanking, setIsFlanking] = useState<boolean>(true);
  const [activeHits, setActiveHits] = useState<boolean[]>([true, true, true, true]);

  // Live Dice Roll Results
  const [rollResult, setRollResult] = useState<{
    hitDetails: RollHitDetail[];
    totalDamage: number;
    dexContribution: number;
  } | null>(null);

  const sequence = calculateOptimalDamageSequence(character, {
    useDexToDamage,
    includeSneakAttack,
    flankBonus: isFlanking ? 2 : 0
  });

  // Calculate filtered totals based on active hits
  const filteredAttacks = sequence.attacks.filter((_, idx) => activeHits[idx]);
  const activeCount = activeHits.filter(Boolean).length;
  const filteredMin = filteredAttacks.reduce((sum, a) => sum + a.minDamage, 0);
  const filteredAvg = Math.round(filteredAttacks.reduce((sum, a) => sum + a.avgDamage, 0));
  const filteredMax = filteredAttacks.reduce((sum, a) => sum + a.maxDamage, 0);
  const currentAttrBonus = useDexToDamage ? geMod : stMod;
  const currentAttrLabel = useDexToDamage ? 'GE' : 'ST';
  const totalDexDamageInSequence = useDexToDamage ? (geMod * activeCount) : 0;

  const toggleHit = (index: number) => {
    const updated = [...activeHits];
    updated[index] = !updated[index];
    setActiveHits(updated);
  };

  const rollDice = (diceStr: string): number[] => {
    const match = diceStr.match(/(\d+)[Wd](\d+)/i);
    if (!match) return [0];
    const count = parseInt(match[1], 10);
    const sides = parseInt(match[2], 10);
    const rolls: number[] = [];
    for (let i = 0; i < count; i++) {
      rolls.push(Math.floor(Math.random() * sides) + 1);
    }
    return rolls;
  };

  const handleExecuteRollSequence = () => {
    const hitDetails: RollHitDetail[] = [];
    let grandTotalDamage = 0;

    sequence.attacks.forEach((attack, idx) => {
      if (!activeHits[idx]) return;

      const d20 = Math.floor(Math.random() * 20) + 1;
      const isCritThreat = d20 >= 19;
      const attackTotal = d20 + attack.attackBonus;

      // Base dice roll
      const baseRolls = rollDice(attack.baseDamageDice);
      const baseVal = baseRolls.reduce((a, b) => a + b, 0);

      // Elemental ice roll for dagger
      let elementalVal = 0;
      if (attack.extraElemental) {
        const iceRolls = rollDice(attack.extraElemental);
        elementalVal = iceRolls.reduce((a, b) => a + b, 0);
      }

      // Sneak attack rolls
      let sneakRolls: number[] = [];
      if (includeSneakAttack && attack.sneakAttackDice) {
        sneakRolls = rollDice(attack.sneakAttackDice);
      }
      const sneakVal = sneakRolls.reduce((a, b) => a + b, 0);

      // Bleed damage
      const bleedVal = attack.bleedDamage;

      // Total for this hit
      const hitTotal = baseVal + attack.attributeBonus + attack.magicBonus + elementalVal + sneakVal + bleedVal;
      grandTotalDamage += hitTotal;

      hitDetails.push({
        attackIndex: idx + 1,
        title: attack.title,
        weaponName: attack.weaponName,
        attackRoll: {
          d20,
          bonus: attack.attackBonus,
          total: attackTotal,
          isCritThreat
        },
        baseDiceRoll: baseVal,
        attrBonus: attack.attributeBonus,
        magicBonus: attack.magicBonus,
        elementalRoll: attack.extraElemental ? elementalVal : undefined,
        sneakDiceRolls: sneakRolls,
        bleedDamage: bleedVal,
        totalDamage: hitTotal
      });
    });

    const result = {
      hitDetails,
      totalDamage: grandTotalDamage,
      dexContribution: useDexToDamage ? (geMod * hitDetails.length) : 0
    };

    setRollResult(result);

    if (onRollComplete) {
      onRollComplete(
        grandTotalDamage,
        `Optimaler Schadenszug (${hitDetails.length} Treffer): ${grandTotalDamage} TP (inkl. ${result.dexContribution} TP aus GE)`
      );
    }
  };

  return (
    <div className={`bg-zinc-900/70 border border-zinc-800/90 rounded-2xl p-4 sm:p-5 shadow-sm ${className}`}>
      {/* Header with Title & Expand Toggle */}
      <div className="flex items-center justify-between gap-3 border-b border-zinc-800 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 text-amber-400">
            <Flame size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-white text-base tracking-tight">
                Schadenszug- & Kombinations-Rechner
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold border border-amber-500/30">
                Optimaler Schadenszug (HA)
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Vollständige Berechnung mit Geschicklichkeitsbonus auf Treffer & Schaden
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
          title={isExpanded ? 'Einklappen' : 'Ausklappen'}
        >
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {/* Controls Bar: Dexterity toggle, Sneak Attack, Flanking */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/70">
            {/* Attribute Toggle: GE vs ST */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold text-zinc-400">Attribut für Schaden</span>
              <div className="flex items-center gap-1.5 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setUseDexToDamage(true)}
                  className={`flex-1 py-1 px-2 rounded text-xs font-mono font-bold flex items-center justify-center gap-1 transition-all ${
                    useDexToDamage
                      ? 'bg-amber-500 text-zinc-950 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Zap size={12} />
                  <span>GE (+{geMod})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUseDexToDamage(false)}
                  className={`flex-1 py-1 px-2 rounded text-xs font-mono font-bold flex items-center justify-center gap-1 transition-all ${
                    !useDexToDamage
                      ? 'bg-red-500 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Sword size={12} />
                  <span>ST ({formatPathfinderModifier(stMod)})</span>
                </button>
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">
                {useDexToDamage ? '⚡ Schurken-Finesse aktiv' : 'Standard Stärke'}
              </span>
            </div>

            {/* Sneak Attack Toggle */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold text-zinc-400">Hinterhältiger Angriff</span>
              <button
                type="button"
                onClick={() => setIncludeSneakAttack(!includeSneakAttack)}
                className={`py-1.5 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-between transition-all border ${
                  includeSneakAttack
                    ? 'bg-amber-950/30 border-amber-500/50 text-amber-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <span>+5W6 pro Treffer</span>
                <span className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] ${
                  includeSneakAttack ? 'bg-amber-500 text-zinc-950 font-black' : 'border border-zinc-600'
                }`}>
                  {includeSneakAttack ? '✓' : ''}
                </span>
              </button>
              <span className="text-[9px] text-zinc-500 font-mono">
                {includeSneakAttack ? '5W6 HA + 5 Blutung aktiv' : 'Ohne HA-Schadenswürfel'}
              </span>
            </div>

            {/* Flanking Toggle */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold text-zinc-400">Flankieren / Im Hinterhalt</span>
              <button
                type="button"
                onClick={() => setIsFlanking(!isFlanking)}
                className={`py-1.5 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-between transition-all border ${
                  isFlanking
                    ? 'bg-cyan-950/30 border-cyan-500/50 text-cyan-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <span>+2 Angriffswurf</span>
                <span className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] ${
                  isFlanking ? 'bg-cyan-500 text-zinc-950 font-black' : 'border border-zinc-600'
                }`}>
                  {isFlanking ? '✓' : ''}
                </span>
              </button>
              <span className="text-[9px] text-zinc-500 font-mono">
                {isFlanking ? '+2 Angriffsbonus aktiv' : 'Ohne Flankierbonus'}
              </span>
            </div>
          </div>

          {/* Individual Hits Breakdown with Checkboxes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
              <span>Angriffsabfolge (Wähle getroffene Schläge):</span>
              <span className="font-mono text-amber-300 font-bold">
                {activeCount} von {sequence.attacks.length} Treffern
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {sequence.attacks.map((atk, idx) => {
                const isSelected = activeHits[idx];
                return (
                  <div
                    key={idx}
                    onClick={() => toggleHit(idx)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                      isSelected
                        ? 'bg-zinc-900/90 border-amber-500/40 hover:border-amber-400 shadow-sm'
                        : 'bg-zinc-950/40 border-zinc-800/60 opacity-60 hover:opacity-80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${
                          isSelected ? 'bg-amber-500 text-zinc-950' : 'border border-zinc-700 text-transparent'
                        }`}>
                          {isSelected ? '✓' : ''}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-white flex items-center gap-1.5">
                            <span>{atk.title}</span>
                            <span className="text-[10px] text-zinc-400 font-mono font-normal">
                              ({atk.weaponName})
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-amber-300 font-bold mt-0.5">
                            Angriff: {atk.attackRollFormatted}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-zinc-400 font-mono block">Durchschnitt</span>
                        <span className="text-xs font-black text-white font-mono">
                          {Math.round(atk.avgDamage)} TP
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-300 font-mono">
                      <div className="truncate" title={atk.damageFormula}>
                        {atk.damageFormula}
                      </div>
                      <div className="text-[10px] text-zinc-500 flex items-center justify-between mt-0.5">
                        <span>Spanne: {atk.minDamage} - {atk.maxDamage} TP</span>
                        {useDexToDamage && (
                          <span className="text-amber-400/90">+{geMod} GE im Schaden</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Damage Summary Matrix */}
          <div className="bg-gradient-to-br from-amber-950/30 via-zinc-900 to-zinc-950 border border-amber-500/30 rounded-2xl p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-2.5">
                <span className="text-[9px] uppercase font-mono text-zinc-400 block">Min-Schaden</span>
                <span className="text-xl font-black text-zinc-200 font-mono">{filteredMin} TP</span>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5">
                <span className="text-[9px] uppercase font-mono text-amber-300 block">Durchschnitt</span>
                <span className="text-2xl font-black text-amber-300 font-mono">{filteredAvg} TP</span>
              </div>
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-2.5">
                <span className="text-[9px] uppercase font-mono text-zinc-400 block">Max-Schaden</span>
                <span className="text-xl font-black text-white font-mono">{filteredMax} TP</span>
              </div>
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-2.5">
                <span className="text-[9px] uppercase font-mono text-amber-400 block">Reiner GE-Anteil</span>
                <span className="text-xl font-black text-amber-400 font-mono">
                  +{totalDexDamageInSequence} TP
                </span>
                <span className="text-[9px] text-zinc-500 block">({activeCount}x +{currentAttrBonus} {currentAttrLabel})</span>
              </div>
            </div>

            {/* Big Action Button: Roll Entire Sequence */}
            <div className="mt-4 flex flex-col sm:flex-row items-center gap-2.5">
              <button
                type="button"
                onClick={handleExecuteRollSequence}
                disabled={activeCount === 0}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-zinc-950 font-black rounded-xl text-sm font-mono flex items-center justify-center gap-2 transition-all shadow-md hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                <Dices size={16} />
                <span>Schadenszug mit aktuellen Werten auswürfeln</span>
              </button>

              {rollResult && (
                <button
                  type="button"
                  onClick={() => setRollResult(null)}
                  className="w-full sm:w-auto py-2.5 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-mono transition-all flex items-center justify-center gap-1"
                  title="Wurf-Ergebnis zurücksetzen"
                >
                  <RotateCcw size={13} />
                  <span>Zurücksetzen</span>
                </button>
              )}
            </div>
          </div>

          {/* Live Roll Sequence Result Display */}
          <AnimatePresence>
            {rollResult && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="bg-zinc-950 border border-amber-500/50 rounded-2xl p-4 text-zinc-200 space-y-3"
              >
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-amber-400" />
                    <span className="font-bold text-sm text-white">Ausgewürfelter Schadenszug:</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-zinc-400 mr-2">Gesamtschaden:</span>
                    <span className="text-2xl font-black text-amber-300 font-mono">
                      {rollResult.totalDamage} TP
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {rollResult.hitDetails.map((h, i) => (
                    <div key={i} className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-2.5 text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                          Treffer {h.attackIndex}
                        </span>
                        <span className="text-white font-bold">{h.weaponName}:</span>
                        <span className="text-zinc-400">
                          W20({h.attackRoll.d20}) + {h.attackRoll.bonus} = <strong className="text-amber-300">{h.attackRoll.total}</strong>
                        </span>
                        {h.attackRoll.isCritThreat && (
                          <span className="text-amber-400 font-bold text-[10px]">🔥 Bedrohung!</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-right">
                        <span className="text-zinc-400 text-[11px]">
                          Basis({h.baseDiceRoll}) + {currentAttrLabel}(+{h.attrBonus}) + Mag({h.magicBonus})
                          {h.elementalRoll !== undefined && ` + Eis(${h.elementalRoll})`}
                          {h.sneakDiceRolls.length > 0 && ` + HA(${h.sneakDiceRolls.reduce((a, b) => a + b, 0)})`}
                          {h.bleedDamage > 0 && ` + Blut(${h.bleedDamage})`}
                        </span>
                        <span className="font-black text-white text-sm bg-zinc-800 px-2 py-0.5 rounded">
                          = {h.totalDamage} TP
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-[11px] text-zinc-400 flex items-center justify-between pt-1">
                  <span>
                    ⚡ Reiner Geschicklichkeitsanteil: <strong className="text-amber-300">+{rollResult.dexContribution} TP</strong>
                  </span>
                  <span className="text-zinc-500">
                    Alle Würfel simuliert nach Pathfinder 1e Regeln
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
