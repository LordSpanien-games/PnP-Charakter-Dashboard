import React, { FC, useState, useMemo } from "react";
import { 
  Moon, 
  Sun, 
  Check, 
  X, 
  RefreshCw, 
  Heart, 
  ShieldAlert, 
  Sparkles, 
  Dices, 
  Activity,
  Bed,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { CharacterData, GameSystem, Ability, InventoryItem, Stat } from "../types";
import { parseStatValue } from "./common/StatCard";

export interface RestAndRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: CharacterData;
  onApplyRest: (updates: Partial<CharacterData>, summaryMessage: string) => void;
}

export type RestType = 'night' | 'fullDay';

export const RestAndRecoveryModal: FC<RestAndRecoveryModalProps> = ({
  isOpen,
  onClose,
  character,
  onApplyRest
}) => {
  const [restType, setRestType] = useState<RestType>('night');
  const [customDiceRollResult, setCustomDiceRollResult] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [rollHistoryText, setRollHistoryText] = useState<string>("");

  const system: GameSystem = character.system || 'generic';

  // 1. Level extraction for Pathfinder / Level-based systems
  const characterLevel = useMemo(() => {
    const sub = ((character.name || '') + ' ' + (character.subTitle || '')).toLowerCase();
    const match = sub.match(/level\s*(\d+)|stufe\s*(\d+)/i);
    if (match) {
      return parseInt(match[1] || match[2], 10) || 1;
    }
    return 1;
  }, [character.name, character.subTitle]);

  // 2. Identify HP / Vital stat
  const hpStatIndex = useMemo(() => {
    if (!character.stats) return -1;
    return character.stats.findIndex(s => {
      const l = (s?.label || '').toLowerCase();
      return l === "tp" || l === "trefferpunkte" || l === "hp" || l === "hit points";
    });
  }, [character.stats]);

  const hpStat: Stat | undefined = hpStatIndex >= 0 ? character.stats[hpStatIndex] : undefined;
  const maxHP = hpStat ? parseStatValue(hpStat.value) : 0;
  const currentDamage = hpStat ? (hpStat.damage || 0) : 0;
  const currentHP = maxHP - currentDamage;

  // 3. Shadowrun specific damage tracks
  const srPhysIndex = useMemo(() => {
    if (system !== 'shadowrun' || !character.stats) return -1;
    return character.stats.findIndex(s => {
      const l = (s?.label || '').toLowerCase();
      return l.includes("körper") || l.includes("phys");
    });
  }, [system, character.stats]);

  const srStunIndex = useMemo(() => {
    if (system !== 'shadowrun' || !character.stats) return -1;
    return character.stats.findIndex(s => {
      const l = (s?.label || '').toLowerCase();
      return l.includes("geist") || l.includes("stun");
    });
  }, [system, character.stats]);

  const srPhysStat = srPhysIndex >= 0 ? character.stats[srPhysIndex] : undefined;
  const srStunStat = srStunIndex >= 0 ? character.stats[srStunIndex] : undefined;

  // 4. Calculate rule-accurate healing amount based on system and restType
  const calculatedHealing = useMemo(() => {
    if (system === 'pathfinder') {
      // Pathfinder 1e: 8h = 1 HP per level | 24h = 2 HP per level (Bettruhe)
      const healAmount = restType === 'night' ? characterLevel * 1 : characterLevel * 2;
      return {
        mode: 'fixed' as const,
        amount: healAmount,
        ruleText: restType === 'night' 
          ? `8 Std. Nachtruhe: +${healAmount} TP (1 TP pro Charakterstufe ${characterLevel})`
          : `24 Std. Bettruhe: +${healAmount} TP (2 TP pro Charakterstufe ${characterLevel})`
      };
    }

    if (system === 'coc7e' || system === 'coc1920') {
      // CoC: 8h = 1 HP | 24h / medizinische Ruhe = 1W3 HP
      if (restType === 'night') {
        return {
          mode: 'fixed' as const,
          amount: 1,
          ruleText: `8 Std. Nachtruhe: +1 TP (Standard-Regeneration)`
        };
      } else {
        return {
          mode: 'dice' as const,
          diceFormula: '1W3',
          dicePool: 1,
          diceSides: 3,
          ruleText: `24 Std. Bettruhe / Medizin: 1W3 TP würfeln`
        };
      }
    }

    if (system === 'shadowrun') {
      // Shadowrun: 8h = Voller Betäubungsschaden weg, Körperlicher Schaden: Konstitution (z. B. 1W6 oder 1 Kasten)
      return {
        mode: 'shadowrun' as const,
        amount: restType === 'night' ? 1 : 2,
        ruleText: restType === 'night' 
          ? `8 Std. Ruhe: Betäubungsschaden vollständig geheilt, +1 Kasten körperlich` 
          : `24 Std. Bettruhe: Betäubungsschaden vollständig geheilt, +2 Kästchen körperlich`
      };
    }

    // Generic / Traveller / other:
    const healAmount = restType === 'night' ? Math.max(1, characterLevel) : Math.max(2, characterLevel * 2);
    return {
      mode: 'fixed' as const,
      amount: healAmount,
      ruleText: restType === 'night' ? `Nachtruhe: +${healAmount} TP` : `24h Bettruhe: +${healAmount} TP`
    };
  }, [system, restType, characterLevel]);

  // Handle dice rolling for systems that require rolling (e.g. CoC 24h rest 1W3)
  const handleRollDice = () => {
    setIsRolling(true);
    setTimeout(() => {
      if (calculatedHealing.mode === 'dice') {
        const roll = Math.floor(Math.random() * (calculatedHealing.diceSides || 3)) + 1;
        setCustomDiceRollResult(roll);
        setRollHistoryText(`Gewürfelt: [${roll}] (${calculatedHealing.diceFormula})`);
      }
      setIsRolling(false);
    }, 250);
  };

  // 5. Detect abilities that will be recharged
  const abilitiesToRecharge = useMemo(() => {
    const list: { index: number; ability: Ability; current: number; max: number }[] = [];
    (character.abilities || []).forEach((ab, idx) => {
      if (ab.maxUses !== undefined && ab.maxUses > 0) {
        const cur = ab.currentUses ?? ab.maxUses;
        list.push({
          index: idx,
          ability: ab,
          current: cur,
          max: ab.maxUses
        });
      }
    });
    return list;
  }, [character.abilities]);

  // 6. Detect inventory items that will be recharged (e.g. Fanghandschuhe 2x/Tag)
  const itemsToRecharge = useMemo(() => {
    const list: { id: string; item: InventoryItem; current: number; max: number }[] = [];
    (character.inventory || []).forEach((it) => {
      if (it.maxUses !== undefined && it.maxUses > 0) {
        const cur = it.currentUses ?? it.maxUses;
        list.push({
          id: it.id,
          item: it,
          current: cur,
          max: it.maxUses
        });
      }
    });
    return list;
  }, [character.inventory]);

  // 7. Calculate actual HP healing applied
  const effectiveHealAmount = useMemo(() => {
    if (calculatedHealing.mode === 'fixed') {
      return calculatedHealing.amount;
    }
    if (calculatedHealing.mode === 'dice') {
      return customDiceRollResult !== null ? customDiceRollResult : 1;
    }
    if (calculatedHealing.mode === 'shadowrun') {
      return calculatedHealing.amount;
    }
    return 1;
  }, [calculatedHealing, customDiceRollResult]);

  const newDamage = Math.max(0, currentDamage - effectiveHealAmount);
  const actualHealed = currentDamage - newDamage;

  // Execute Rest Action
  const handleConfirmRest = () => {
    const updates: Partial<CharacterData> = {};
    const summaryParts: string[] = [];

    // 1. Reset Abilities usages
    if (character.abilities && character.abilities.length > 0) {
      const refreshedAbilities = character.abilities.map(ab => {
        if (ab.maxUses !== undefined && ab.maxUses > 0) {
          return { ...ab, currentUses: ab.maxUses };
        }
        return ab;
      });
      updates.abilities = refreshedAbilities;
      const count = abilitiesToRecharge.length;
      if (count > 0) {
        summaryParts.push(`${count} Fähigkeit${count > 1 ? 'en' : ''} aufgeladen`);
      }
    }

    // 2. Reset Inventory items usages
    if (character.inventory && character.inventory.length > 0) {
      const refreshedInventory = character.inventory.map(it => {
        if (it.maxUses !== undefined && it.maxUses > 0) {
          return { ...it, currentUses: it.maxUses };
        }
        return it;
      });
      updates.inventory = refreshedInventory;
      const count = itemsToRecharge.length;
      if (count > 0) {
        summaryParts.push(`${count} Gegenstandsladung${count > 1 ? 'en' : ''} aufgefüllt`);
      }
    }

    // 3. Heal HP / Damage Tracks
    if (character.stats && character.stats.length > 0) {
      const newStats = [...character.stats];

      if (system === 'shadowrun') {
        // Clear stun damage completely
        if (srStunIndex >= 0) {
          const oldStun = newStats[srStunIndex].damage || 0;
          newStats[srStunIndex] = { ...newStats[srStunIndex], damage: 0 };
          if (oldStun > 0) summaryParts.push(`Geistiger Schaden (${oldStun}) vollständig regeneriert`);
        }
        // Heal physical damage
        if (srPhysIndex >= 0) {
          const oldPhys = newStats[srPhysIndex].damage || 0;
          const healedPhys = Math.min(oldPhys, effectiveHealAmount);
          newStats[srPhysIndex] = { ...newStats[srPhysIndex], damage: Math.max(0, oldPhys - effectiveHealAmount) };
          if (healedPhys > 0) summaryParts.push(`+${healedPhys} körperliche Kästchen geheilt`);
        }
        updates.stats = newStats;
      } else if (hpStatIndex >= 0) {
        newStats[hpStatIndex] = {
          ...newStats[hpStatIndex],
          damage: newDamage
        };
        updates.stats = newStats;
        if (actualHealed > 0) {
          summaryParts.push(`+${actualHealed} TP geheilt (aktuell ${maxHP - newDamage}/${maxHP} TP)`);
        } else if (currentDamage === 0) {
          summaryParts.push(`TP bereits voll (${maxHP}/${maxHP})`);
        }
      }
    }

    const restLabel = restType === 'night' ? 'Nachtruhe (8h)' : 'Bettruhe (24h)';
    const fullMessage = `${restLabel} beendet! ${summaryParts.join(' • ')}`;

    onApplyRest(updates, fullMessage);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Moon size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-black text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <span>Rast & Übernachten</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-700/40">
                  {system === 'pathfinder' ? 'Pathfinder 1e' : system === 'shadowrun' ? 'Shadowrun' : system.toUpperCase()}
                </span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Regeneriert Trefferpunkte nach Regelwerk und füllt tägliche Nutzungen auf.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Rest Duration Selector */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold mb-2">
              Rast-Dauer wählen
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRestType('night')}
                className={`p-3.5 rounded-xl border text-left transition-all flex flex-col gap-1 cursor-pointer ${
                  restType === 'night'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                    : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 text-indigo-300">
                    <Moon size={14} /> 8h Nachtruhe
                  </span>
                  {restType === 'night' && <Check size={14} className="text-indigo-400" />}
                </div>
                <p className="text-[11px] text-zinc-400">
                  Standard-Nachtlager. Normale tägliche Heilung & volle Zauber-/Fähigkeiten-Regeneration.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setRestType('fullDay')}
                className={`p-3.5 rounded-xl border text-left transition-all flex flex-col gap-1 cursor-pointer ${
                  restType === 'fullDay'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                    : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 text-amber-300">
                    <Bed size={14} /> 24h Bettruhe
                  </span>
                  {restType === 'fullDay' && <Check size={14} className="text-amber-400" />}
                </div>
                <p className="text-[11px] text-zinc-400">
                  Ganztägige intensive Erholung. Verdoppelte Heilungsrate (z. B. 2 TP pro Stufe in Pathfinder).
                </p>
              </button>
            </div>
          </div>

          {/* Health Regeneration Section */}
          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase font-bold text-zinc-300 flex items-center gap-2">
                <Heart size={14} className="text-rose-400" />
                Trefferpunkte-Heilung
              </span>
              <span className="text-xs font-mono text-zinc-400">
                Aktuell: <strong className={currentDamage > 0 ? "text-rose-400" : "text-emerald-400"}>{currentHP}</strong> / {maxHP} TP
                {currentDamage > 0 && <span className="text-zinc-500 text-[10px] ml-1">(-{currentDamage} Schaden)</span>}
              </span>
            </div>

            {/* Rule Explanation */}
            <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-lg text-xs space-y-1.5">
              <div className="flex items-center justify-between text-indigo-300 font-bold font-mono">
                <span>{calculatedHealing.ruleText}</span>
                {calculatedHealing.mode === 'fixed' && (
                  <span className="px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-800 text-emerald-300">
                    +{effectiveHealAmount} TP
                  </span>
                )}
              </div>

              {/* In case dice roll is needed (e.g. CoC 24h Bettruhe 1W3) */}
              {calculatedHealing.mode === 'dice' && (
                <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRollDice}
                      disabled={isRolling}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-mono font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
                    >
                      <Dices size={14} className={isRolling ? "animate-spin" : ""} />
                      <span>{customDiceRollResult !== null ? "Erneut würfeln" : `${calculatedHealing.diceFormula} jetzt würfeln`}</span>
                    </button>
                    {rollHistoryText && (
                      <span className="text-xs font-mono text-indigo-300 font-bold">
                        {rollHistoryText}
                      </span>
                    )}
                  </div>
                  {customDiceRollResult !== null && (
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-800 text-emerald-300 font-bold">
                      +{customDiceRollResult} TP Heilung
                    </span>
                  )}
                </div>
              )}

              {/* Result Preview */}
              {currentDamage > 0 ? (
                <p className="text-[11px] text-zinc-400 pt-1 border-t border-zinc-800/60">
                  Vorschau nach Rast: <strong className="text-emerald-400">{Math.min(maxHP, currentHP + effectiveHealAmount)}</strong> / {maxHP} TP 
                  {newDamage > 0 ? ` (verbleibende Wunden: -${newDamage} TP)` : ' (Vollständig genesen!)'}
                </p>
              ) : (
                <p className="text-[11px] text-emerald-400/90 pt-1 border-t border-zinc-800/60 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Trefferpunkte sind bereits beim Maximum ({maxHP}/{maxHP}).
                </p>
              )}
            </div>
          </div>

          {/* Daily Usage Refill List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold flex items-center gap-2">
                <Sparkles size={13} className="text-indigo-400" />
                Aufzufüllende tägliche Nutzungen & Zauber
              </label>
              <span className="text-[10px] font-mono text-zinc-500">
                {abilitiesToRecharge.length + itemsToRecharge.length} Einträge registriert
              </span>
            </div>

            {abilitiesToRecharge.length === 0 && itemsToRecharge.length === 0 ? (
              <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-800/80 text-center text-xs text-zinc-500">
                Keine Fähigkeiten oder Gegenstände mit maximalen täglichen Nutzungen erfasst.
                <p className="text-[10px] text-zinc-600 mt-1">
                  Tipp: Trage bei Fähigkeiten oder Ausrüstung (wie z. B. <em>Fanghandschuhe</em>) im Editiermodus „Max/Tag: 2“ ein.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {/* Abilities */}
                {abilitiesToRecharge.map((entry) => {
                  const isDepleted = entry.current < entry.max;
                  return (
                    <div
                      key={`ab-${entry.index}`}
                      className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                        <div>
                          <strong className="text-zinc-200">{entry.ability.name}</strong>
                          {entry.ability.usage && (
                            <span className="text-[10px] font-mono text-zinc-500 ml-2">({entry.ability.usage})</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <span className={isDepleted ? "text-amber-400 font-bold" : "text-zinc-500"}>
                          {entry.current} / {entry.max}
                        </span>
                        <span className="text-zinc-600">→</span>
                        <span className="text-emerald-400 font-bold">
                          {entry.max} / {entry.max}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Items */}
                {itemsToRecharge.map((entry) => {
                  const isDepleted = entry.current < entry.max;
                  return (
                    <div
                      key={`it-${entry.id}`}
                      className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                        <div>
                          <strong className="text-zinc-200">{entry.item.name}</strong>
                          <span className="text-[10px] font-mono text-amber-500/80 ml-1.5 bg-amber-950/30 px-1 py-0.2 rounded border border-amber-900/30">
                            Gegenstand
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <span className={isDepleted ? "text-amber-400 font-bold" : "text-zinc-500"}>
                          {entry.current} / {entry.max}
                        </span>
                        <span className="text-zinc-600">→</span>
                        <span className="text-emerald-400 font-bold">
                          {entry.max} / {entry.max}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer"
          >
            Abbrechen
          </button>

          <button
            type="button"
            onClick={handleConfirmRest}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-mono text-xs font-black tracking-wider flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all cursor-pointer hover:scale-102"
            id="btn-confirm-rest-apply"
          >
            <Moon size={14} className="stroke-[2.5]" />
            <span>Jetzt Schlafen & Regenerieren</span>
          </button>
        </div>
      </div>
    </div>
  );
};
