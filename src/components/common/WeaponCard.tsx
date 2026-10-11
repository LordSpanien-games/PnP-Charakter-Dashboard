import React, { FC } from "react";
import { X, Zap, Sword, Crosshair, Sparkles, BookOpen } from "lucide-react";
import { Weapon, CharacterData } from "../../types";
import { Input } from "./Input";
import {
  isPathfinder,
  calculatePathfinderWeaponStats,
  getAttributeScore,
  calculatePathfinderModifier,
  hasWeaponFinesse,
  isFinesseWeapon,
  formatPathfinderModifier
} from "../../utils/pathfinder";

export const WeaponCard: FC<{ 
  weapon: Weapon; 
  isEditing: boolean; 
  onChange: (updates: Partial<Weapon>) => void;
  onRemove?: () => void;
  character?: CharacterData;
  isMelee?: boolean;
}> = ({ weapon, isEditing, onChange, onRemove, character, isMelee = true }) => {
  const isPF = character ? isPathfinder(character) : false;
  
  // Pathfinder attribute derivations and live calculations
  const liveStats = (isPF && character) ? calculatePathfinderWeaponStats(weapon, character, isMelee) : null;

  const stScore = (isPF && character) ? getAttributeScore(character, 'ST') : 10;
  const geScore = (isPF && character) ? getAttributeScore(character, 'GE') : 10;
  const stMod = calculatePathfinderModifier(stScore);
  const geMod = calculatePathfinderModifier(geScore);
  const hasFinesse = (isPF && character) ? hasWeaponFinesse(character) : false;
  const isFinesse = isFinesseWeapon(weapon.name, weapon);

  const displayAttack = (!isEditing && liveStats) ? liveStats.calculatedAttackFormatted : weapon.attack;
  const displayDamage = (!isEditing && liveStats) ? liveStats.calculatedDamage : weapon.damage;

  const handleRecalculateWeapon = () => {
    if (!character || !isPF || !liveStats) return;
    onChange({
      attack: liveStats.calculatedAttackFormatted,
      damage: liveStats.calculatedDamage,
      attribute: liveStats.effectiveAttackAttr,
      damageAttribute: liveStats.effectiveDamageAttr
    });
  };

  return (
    <div className="relative bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl hover:border-orange-500/50 transition-colors group">
      {isEditing && onRemove && (
        <button 
          onClick={onRemove}
          className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors z-10"
        >
          <X size={10} />
        </button>
      )}
      
      <div className="flex justify-between items-start mb-2 gap-2">
        <div className="min-w-0 flex-1">
          {isEditing ? (
            <Input 
              value={weapon.name} 
              onChange={(v) => onChange({ name: v })} 
              className="font-bold text-zinc-100 w-full"
            />
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-zinc-100 group-hover:text-orange-400 transition-colors truncate">
                {weapon.name}
              </h4>
              {weapon.page && (
                <span className="text-[10px] font-mono text-amber-300/80 bg-amber-950/20 border border-amber-900/30 px-1.5 py-0.5 rounded flex items-center gap-1" title="Regelbuch-Referenz">
                  <BookOpen size={10} className="text-amber-400 shrink-0" />
                  <span>{weapon.page}</span>
                </span>
              )}
              {isPF && isMelee && (
                liveStats?.effectiveAttackAttr === 'GE' ? (
                  <span 
                    className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1"
                    title="Angriff mit Geschicklichkeit dank Waffenfinesse"
                  >
                    <Zap size={9} /> GE-Finesse ({formatPathfinderModifier(geMod)})
                  </span>
                ) : (
                  <span 
                    className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1"
                    title="Angriff mit Stärke (ST)"
                  >
                    <Sword size={9} /> ST ({formatPathfinderModifier(stMod)})
                  </span>
                )
              )}
              {isPF && isMelee && liveStats?.effectiveDamageAttr === 'GE' && (
                <span 
                  className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-200 border border-amber-500/30 flex items-center gap-1"
                  title="Schadensbonus mit Geschicklichkeit dank Schurken-Finesse"
                >
                  <Zap size={9} /> Dex-Schaden ({formatPathfinderModifier(geMod)})
                </span>
              )}
              {isPF && !isMelee && (
                <span 
                  className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1"
                  title="Fernkampf nutzt Geschicklichkeit (GE)"
                >
                  <Crosshair size={9} /> GE ({formatPathfinderModifier(geMod)})
                </span>
              )}
            </div>
          )}
        </div>
        
        <div className="shrink-0 flex items-center gap-1.5">
          {isEditing ? (
            <Input 
              value={weapon.attack} 
              onChange={(v) => onChange({ attack: v })} 
              className="text-xs font-mono w-20 text-center"
            />
          ) : (
            <span 
              className="text-xs font-mono font-bold text-amber-400 bg-zinc-800/90 border border-zinc-700/60 px-2 py-1 rounded shadow-sm"
              title="Aktueller Angriffsbonus (inkl. BAB, Attribut, Größe, Magie)"
            >
              {displayAttack}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-zinc-500 block text-[10px] uppercase">Schaden</span>
          {isEditing ? (
            <Input value={weapon.damage} onChange={(v) => onChange({ damage: v })} className="w-full text-xs" />
          ) : (
            <span className="text-zinc-200 font-mono font-medium">{displayDamage}</span>
          )}
        </div>
        <div>
          <span className="text-zinc-500 block text-[10px] uppercase">Kritisch</span>
          {isEditing ? (
            <Input value={weapon.critical} onChange={(v) => onChange({ critical: v })} className="w-full text-xs" />
          ) : (
            <span className="text-zinc-200 font-mono font-medium">{weapon.critical}</span>
          )}
        </div>
      </div>

      {weapon.attacks && (
        <div className="mt-2">
          <span className="text-zinc-500 block text-[10px] uppercase">Angriffe</span>
          {isEditing ? (
            <Input value={weapon.attacks} onChange={(v) => onChange({ attacks: v })} className="w-full text-xs" />
          ) : (
            <span className="text-zinc-200 font-mono">{weapon.attacks}</span>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 mt-2">
        <div>
          <span className="text-zinc-500 block text-[10px] uppercase">Reichweite</span>
          {isEditing ? (
            <Input value={weapon.range || ""} onChange={(v) => onChange({ range: v })} className="w-full text-xs" />
          ) : (
            <span className="text-zinc-200 font-mono">{weapon.range || "-"}</span>
          )}
        </div>
        {weapon.malfunction && (
          <div>
            <span className="text-zinc-500 block text-[10px] uppercase">Ladehemmung</span>
            {isEditing ? (
              <Input value={weapon.malfunction} onChange={(v) => onChange({ malfunction: v })} className="w-full text-xs" />
            ) : (
              <span className="text-zinc-200 font-mono">{weapon.malfunction}</span>
            )}
          </div>
        )}
      </div>

      <div className="mt-2">
        <span className="text-zinc-500 block text-[10px] uppercase">Notiz</span>
        {isEditing ? (
          <Input value={weapon.note} onChange={(v) => onChange({ note: v })} className="w-full text-xs" />
        ) : (
          <p className="text-[11px] text-zinc-500 italic">{weapon.note}</p>
        )}
      </div>

      {isEditing && (
        <div className="mt-2">
          <span className="text-zinc-500 block text-[10px] uppercase font-mono flex items-center gap-1">
            <BookOpen size={10} className="text-amber-400" />
            <span>Regelbuch / Buchseite</span>
          </span>
          <Input 
            value={weapon.page || ""} 
            onChange={(v) => onChange({ page: v })} 
            className="w-full text-xs font-mono mt-0.5" 
            placeholder="z. B. GRW S. 142" 
          />
        </div>
      )}

      {/* Live calculated formula breakdown for Pathfinder */}
      {isPF && !isEditing && liveStats && (
        <div className="mt-3 pt-2 border-t border-zinc-800/60 flex flex-col gap-1 bg-zinc-950/40 p-2 rounded-lg text-[10px] font-mono text-zinc-400">
          <div className="flex items-center justify-between gap-1 flex-wrap">
            <span className="text-zinc-500">Angriffsformel:</span>
            <span className="text-zinc-300">{liveStats.attackFormula}</span>
          </div>
          <div className="flex items-center justify-between gap-1 flex-wrap">
            <span className="text-zinc-500">Schadensformel:</span>
            <span className="text-amber-300 font-semibold">{liveStats.damageFormula}</span>
          </div>
        </div>
      )}

      {/* Schurkenwaffe (Sneak Attack) Bonus Breakdown */}
      {isPF && !isEditing && liveStats?.hasSneakBonus && (
        <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[10px] font-mono">
          <div className="flex items-center justify-between gap-1 text-amber-300 font-bold">
            <span className="flex items-center gap-1">
              <Sparkles size={11} className="text-amber-400" />
              Schurkenwaffe (Hinterhältiger Angriff):
            </span>
            <span>+{liveStats.sneakAttackBonusAttack} Atk / +{liveStats.sneakAttackBonusDamage} Dmg</span>
          </div>
          <div className="flex items-center justify-between gap-1 text-zinc-300 mt-1">
            <span className="text-zinc-400">HA-Angriffsbonus:</span>
            <span className="text-emerald-400 font-bold">{liveStats.sneakAttackAttackFormatted}</span>
          </div>
          <div className="flex items-center justify-between gap-1 text-zinc-300">
            <span className="text-zinc-400">HA-Schaden:</span>
            <span className="text-emerald-400 font-bold">{liveStats.sneakAttackDamage}</span>
          </div>
        </div>
      )}

      {/* Pathfinder Specific Attribute Configuration in Edit Mode */}
      {isPF && isEditing && isMelee && (
        <div className="mt-3 pt-2 border-t border-zinc-800 flex flex-col gap-2 bg-zinc-950/40 p-2 rounded-lg">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] uppercase font-bold text-zinc-400">Angriffs-Attribut:</span>
            <select
              value={weapon.attribute || 'auto'}
              onChange={(e) => onChange({ attribute: e.target.value as any })}
              className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-[10px] rounded px-2 py-1 font-mono focus:outline-none focus:border-amber-500"
            >
              <option value="auto">
                Auto ({hasFinesse && isFinesse ? `GE Finesse (${formatPathfinderModifier(geMod)})` : `ST Stärke (${formatPathfinderModifier(stMod)})`})
              </option>
              <option value="GE">
                Geschicklichkeit ({formatPathfinderModifier(geMod)}) - Finesse
              </option>
              <option value="ST">
                Stärke ({formatPathfinderModifier(stMod)})
              </option>
            </select>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] uppercase font-bold text-zinc-400">Schadens-Attribut:</span>
            <select
              value={weapon.damageAttribute || 'auto'}
              onChange={(e) => onChange({ damageAttribute: e.target.value as any })}
              className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-[10px] rounded px-2 py-1 font-mono focus:outline-none focus:border-amber-500"
            >
              <option value="auto">
                Auto ({character?.useDexToDamage ? `GE Schurken-Finesse (${formatPathfinderModifier(geMod)})` : `ST Stärke (${formatPathfinderModifier(stMod)})`})
              </option>
              <option value="GE">
                Geschicklichkeit ({formatPathfinderModifier(geMod)}) - Schurken-Finesse
              </option>
              <option value="ST">
                Stärke ({formatPathfinderModifier(stMod)})
              </option>
              <option value="NONE">
                Kein Attributsbonus
              </option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleRecalculateWeapon}
            className="w-full py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[10px] font-mono font-medium flex items-center justify-center gap-1 transition-all"
          >
            <Sparkles size={11} />
            <span>Angriff & Schaden mit aktuellen Attributen synchronisieren</span>
          </button>
        </div>
      )}
    </div>
  );
};
