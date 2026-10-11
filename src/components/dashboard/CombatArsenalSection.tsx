import React, { FC } from "react";
import { Sword, Crosshair, Zap, Skull, Activity, Sparkles, Plus } from "lucide-react";
import { CharacterData, Weapon, CombatCombo, Ability } from "../../types";
import { WeaponCard } from "../common/WeaponCard";
import { ComboCard } from "../common/ComboCard";
import { PathfinderDamageSequenceCard } from "../PathfinderDamageSequenceCard";

export interface CombatArsenalSectionProps {
  character: CharacterData;
  isEditing: boolean;
  onUpdateData: (partial: Partial<CharacterData>) => void;
  onOpenDiceCalc: (title?: string, mod?: number) => void;
}

export const CombatArsenalSection: FC<CombatArsenalSectionProps> = ({
  character,
  isEditing,
  onUpdateData,
  onOpenDiceCalc
}) => {
  return (
    <div className="space-y-12">
      {/* Weapons Section */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <Sword className="text-orange-500" size={24} />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Waffenarsenal</h2>
              <span className="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                🎒 Am Mann getragen
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Aktive Einsatzwaffen — automatisch mit dem Inventar abgeglichen
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Melee Weapons */}
          <div className="space-y-4">
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold flex items-center gap-2">
              <Sword size={12} /> Nahkampf
            </h3>
            {character.weapons.melee.map((w, i) => (
              <WeaponCard 
                key={i} 
                weapon={w} 
                isEditing={isEditing}
                character={character}
                isMelee={true}
                onChange={(updates) => {
                  const newMelee = [...character.weapons.melee];
                  newMelee[i] = { ...w, ...updates };
                  onUpdateData({ weapons: { ...character.weapons, melee: newMelee } });
                }}
                onRemove={() => {
                  const newMelee = character.weapons.melee.filter((_, idx) => idx !== i);
                  onUpdateData({ weapons: { ...character.weapons, melee: newMelee } });
                }}
              />
            ))}
            {isEditing && (
              <button 
                onClick={() => onUpdateData({ 
                  weapons: { 
                    ...character.weapons, 
                    melee: [...character.weapons.melee, { name: "Neue Waffe", attack: "+0", damage: "1W6", critical: "x2", note: "" }] 
                  } 
                })}
                className="w-full py-2 border border-dashed border-zinc-800 rounded-xl text-zinc-500 hover:text-orange-500 hover:border-orange-500 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus size={16} /> Waffe hinzufügen
              </button>
            )}
          </div>

          {/* Ranged Weapons */}
          <div className="space-y-4">
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold flex items-center gap-2">
              <Crosshair size={12} /> Fernkampf
            </h3>
            {character.weapons.ranged.map((w, i) => (
              <WeaponCard 
                key={i} 
                weapon={w} 
                isEditing={isEditing}
                character={character}
                isMelee={false}
                onChange={(updates) => {
                  const newRanged = [...character.weapons.ranged];
                  newRanged[i] = { ...w, ...updates };
                  onUpdateData({ weapons: { ...character.weapons, ranged: newRanged } });
                }}
                onRemove={() => {
                  const newRanged = character.weapons.ranged.filter((_, idx) => idx !== i);
                  onUpdateData({ weapons: { ...character.weapons, ranged: newRanged } });
                }}
              />
            ))}
            {isEditing && (
              <button 
                onClick={() => onUpdateData({ 
                  weapons: { 
                    ...character.weapons, 
                    ranged: [...character.weapons.ranged, { name: "Neue Waffe", attack: "+0", damage: "1W6", critical: "x2", note: "", range: "6m" }] 
                  } 
                })}
                className="w-full py-2 border border-dashed border-zinc-800 rounded-xl text-zinc-500 hover:text-orange-500 hover:border-orange-500 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus size={16} /> Waffe hinzufügen
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Combat Combinations */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <Zap className="text-orange-500" size={24} />
          <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Kampfkombinationen</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {character.combos.map((combo, i) => (
            <ComboCard 
              key={combo.id || i} 
              combo={combo} 
              isEditing={isEditing}
              character={character}
              onOpenDiceCalc={onOpenDiceCalc}
              onChange={(updates) => {
                const newCombos = [...character.combos];
                newCombos[i] = { ...combo, ...updates };
                onUpdateData({ combos: newCombos });
              }}
              onRemove={() => {
                const newCombos = character.combos.filter((_, idx) => idx !== i);
                onUpdateData({ combos: newCombos });
              }}
            />
          ))}
          
          {isEditing ? (
            <button 
              onClick={() => onUpdateData({ 
                combos: [...character.combos, { 
                  id: (character.combos.length + 1).toString(), 
                  title: "Neue Kombination", 
                  description: "Beschreibung hier...",
                  weapons: []
                }] 
              })}
              className="bg-zinc-900/30 border border-dashed border-zinc-800 rounded-2xl p-6 flex flex-col justify-center items-center text-center hover:border-orange-500 transition-colors text-zinc-500 hover:text-orange-500 cursor-pointer"
            >
              <Plus size={48} className="mb-4" />
              <h4 className="font-bold mb-2">Combo hinzufügen</h4>
            </button>
          ) : (character.system === 'coc7e' || character.system === 'coc1920') ? (
            <div className="bg-zinc-900/30 border border-dashed border-zinc-800 rounded-2xl p-6 flex flex-col justify-center items-center text-center">
              <Activity className="text-zinc-700 mb-4" size={48} />
              <h4 className="text-zinc-400 font-bold mb-2">Forcierte Proben</h4>
              <p className="text-xs text-zinc-600 max-w-[200px]">
                Eine misslungene Probe kann forciert werden, aber ein Patzer hat dann fatale Folgen!
              </p>
            </div>
          ) : null}
        </div>

        {/* Dedicated Schadenszug & Sneak Attack Sequence Card for Pathfinder */}
        {character.system === 'pathfinder' && !isEditing && (
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="text-amber-400" size={20} />
              <h3 className="text-lg font-bold text-white tracking-tight">Optimaler Schadenszug (Detaillierter Simulator)</h3>
            </div>
            <PathfinderDamageSequenceCard character={character} />
          </div>
        )}
      </section>
    </div>
  );
};
