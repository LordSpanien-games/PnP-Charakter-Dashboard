import React, { FC } from "react";
import { motion } from "motion/react";
import { X, Zap, Dices, Info } from "lucide-react";
import { CombatCombo, CharacterData } from "../../types";
import { Input } from "./Input";
import {
  isPathfinder,
  calculateDynamicCombos,
  getAttributeScore,
  calculatePathfinderModifier,
  hasDexToDamage,
  formatPathfinderModifier
} from "../../utils/pathfinder";

export const ComboCard: FC<{ 
  combo: CombatCombo; 
  isEditing: boolean; 
  onChange: (updates: Partial<CombatCombo>) => void;
  onRemove?: () => void;
  character?: CharacterData;
  onOpenDiceCalc?: (title?: string, mod?: number) => void;
}> = ({ combo, isEditing, onChange, onRemove, character, onOpenDiceCalc }) => {
  const isPF = character ? isPathfinder(character) : false;

  // Resolve dynamic calculation of combo attacks and damage bonuses
  const dynamicCombos = (isPF && character && !isEditing) ? calculateDynamicCombos(character) : null;
  const activeCombo = (dynamicCombos?.find(c => c.id === combo.id || (c.title && combo.title && c.title.toLowerCase().trim() === combo.title.toLowerCase().trim()))) || combo;

  const geScore = (isPF && character) ? getAttributeScore(character, 'GE') : 10;
  const geMod = calculatePathfinderModifier(geScore);
  const stScore = (isPF && character) ? getAttributeScore(character, 'ST') : 10;
  const stMod = calculatePathfinderModifier(stScore);
  const isDexDmg = (isPF && character) ? hasDexToDamage(character) : false;

  return (
    <motion.div 
      layout
      className="relative bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-md"
    >
      {isEditing && onRemove && (
        <button 
          onClick={onRemove}
          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors z-10"
        >
          <X size={10} />
        </button>
      )}

      <div className="bg-zinc-800/50 p-4 border-b border-zinc-800 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 font-bold font-mono shrink-0">
          {isEditing ? (
            <Input value={combo.id} onChange={(v) => onChange({ id: v })} className="w-6 h-6 p-0 text-center bg-transparent border-none" />
          ) : combo.id}
        </div>
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-1">
              <Input value={combo.title} onChange={(v) => onChange({ title: v })} className="w-full font-bold text-sm" />
              <Input value={combo.description} onChange={(v) => onChange({ description: v })} className="w-full text-xs" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-zinc-100 leading-tight">{activeCombo.title}</h3>
                {isPF && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <Zap size={9} /> {isDexDmg ? `GE-Bonus (${formatPathfinderModifier(geMod)}) auf Angriff & Schaden aktiv` : `GE (${formatPathfinderModifier(geMod)}) auf Angriff / ST (${formatPathfinderModifier(stMod)}) auf Schaden`}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">{activeCombo.description}</p>
            </>
          )}
        </div>
      </div>
      
      <div className="p-4 space-y-4">
        {/* Weapon list view if present */}
        {(activeCombo.weapons && activeCombo.weapons.length > 0) && (
          <div className="space-y-3">
            {(isEditing ? (combo.weapons || []) : activeCombo.weapons).map((w, i) => {
              const modMatch = w.roll.match(/W20([+-]\d+)/i);
              const rollMod = modMatch ? parseInt(modMatch[1], 10) : 0;

              return (
                <div key={i} className="relative bg-zinc-950 p-3 rounded-lg border border-zinc-800/50 hover:border-zinc-700 transition-colors">
                  {isEditing && (
                    <button 
                      onClick={() => {
                        const newWeapons = [...(combo.weapons || [])];
                        newWeapons.splice(i, 1);
                        onChange({ weapons: newWeapons });
                      }}
                      className="absolute -top-1 -right-1 bg-zinc-800 text-zinc-500 p-0.5 rounded-full hover:text-red-500"
                    >
                      <X size={10} />
                    </button>
                  )}
                  <div className="flex justify-between items-center mb-1.5 gap-2">
                    {isEditing ? (
                      <Input value={w.name} onChange={(v) => {
                        const newWeapons = [...(combo.weapons || [])];
                        newWeapons[i] = { ...w, name: v };
                        onChange({ weapons: newWeapons });
                      }} className="text-sm font-bold w-full" />
                    ) : (
                      <span className="text-sm font-bold text-zinc-200">{w.name}</span>
                    )}

                    <div className="flex items-center gap-1.5">
                      {isEditing ? (
                        <Input value={w.roll} onChange={(v) => {
                          const newWeapons = [...(combo.weapons || [])];
                          newWeapons[i] = { ...w, roll: v };
                          onChange({ weapons: newWeapons });
                        }} className="text-xs font-mono w-20" />
                      ) : (
                        <span className="text-xs font-mono font-bold text-orange-400 bg-orange-950/40 border border-orange-500/30 px-2 py-0.5 rounded">
                          {w.roll}
                        </span>
                      )}

                      {!isEditing && onOpenDiceCalc && (
                        <button
                          type="button"
                          onClick={() => onOpenDiceCalc(w.name, rollMod)}
                          className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-amber-400 rounded transition-colors"
                          title="Im Probenrechner würfeln"
                        >
                          <Dices size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-zinc-400 mb-1 flex items-center gap-2 flex-wrap">
                    <span className="text-zinc-500">Schaden:</span> 
                    {isEditing ? (
                      <Input value={w.damage} onChange={(v) => {
                        const newWeapons = [...(combo.weapons || [])];
                        newWeapons[i] = { ...w, damage: v };
                        onChange({ weapons: newWeapons });
                      }} className="text-zinc-200 font-mono text-xs" />
                    ) : (
                      <span className="text-amber-300 font-mono font-medium">{w.damage}</span>
                    )}
                  </div>

                  {w.notes && w.notes.length > 0 && (
                    <div className="mt-1.5 pt-1.5 border-t border-zinc-900 space-y-0.5">
                      {w.notes.map((note, nIdx) => (
                        <p key={nIdx} className="text-[10px] text-zinc-500 font-mono flex items-center gap-1">
                          <span className="text-amber-500/70">•</span>
                          {note}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {isEditing && (
              <button 
                onClick={() => onChange({ weapons: [...(combo.weapons || []), { name: "Neue Waffe", roll: "W20", damage: "1W6" }] })}
                className="w-full py-1 border border-dashed border-zinc-700 rounded text-[10px] text-zinc-500 hover:text-orange-500 hover:border-orange-500 transition-colors"
              >
                + Waffe hinzufügen
              </button>
            )}
          </div>
        )}

        {/* Table view if present */}
        {activeCombo.table && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-zinc-500 uppercase text-[10px] border-b border-zinc-800">
                  {activeCombo.table.headers.map((h, i) => (
                    <th key={i} className="pb-2 font-medium">
                      {isEditing ? (
                        <Input value={h} onChange={(v) => {
                          const newHeaders = [...(combo.table?.headers || [])];
                          newHeaders[i] = v;
                          onChange({ table: { ...combo.table!, headers: newHeaders } });
                        }} className="w-full p-0 bg-transparent border-none text-[10px]" />
                      ) : h}
                    </th>
                  ))}
                  {!isEditing && onOpenDiceCalc && (
                    <th className="pb-2 font-medium text-right text-[10px]">Wurf</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {(isEditing ? (combo.table?.rows || []) : activeCombo.table.rows).map((row, ri) => {
                  const rollCell = row.find(c => c.startsWith('W20'));
                  const rollMatch = rollCell ? rollCell.match(/W20([+-]\d+)/i) : null;
                  const rollMod = rollMatch ? parseInt(rollMatch[1], 10) : 0;

                  return (
                    <tr key={ri} className="hover:bg-zinc-800/20 transition-colors">
                      {row.map((cell, ci) => (
                        <td key={ci} className={`py-2 ${ci === 1 && !row[2] ? 'font-mono text-orange-400' : ci === 2 ? 'font-mono text-orange-400 font-bold' : ci === 3 ? 'font-mono text-amber-300 font-semibold' : 'text-zinc-300'}`}>
                          {isEditing ? (
                            <Input value={cell} onChange={(v) => {
                              const newRows = [...(combo.table?.rows || [])];
                              newRows[ri][ci] = v;
                              onChange({ table: { ...combo.table!, rows: newRows } });
                            }} className="w-full p-0 bg-transparent border-none text-xs" />
                          ) : cell}
                        </td>
                      ))}
                      {!isEditing && onOpenDiceCalc && rollCell && (
                        <td className="py-2 text-right">
                          <button
                            type="button"
                            onClick={() => onOpenDiceCalc(row[0] || activeCombo.title, rollMod)}
                            className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-amber-400 rounded transition-colors inline-flex"
                            title="Diesen Angriff würfeln"
                          >
                            <Dices size={13} />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {isEditing && (
              <button 
                onClick={() => {
                  const newRows = [...(combo.table?.rows || []), new Array(combo.table?.headers.length).fill("-")];
                  onChange({ table: { ...combo.table!, rows: newRows } });
                }}
                className="w-full py-1 border border-dashed border-zinc-700 rounded text-[10px] text-zinc-500 mt-2"
              >
                + Zeile hinzufügen
              </button>
            )}
          </div>
        )}

        {/* Notes */}
        {activeCombo.notes && (
          <div className="pt-2 border-t border-zinc-800/50 space-y-1">
            {(isEditing ? (combo.notes || []) : activeCombo.notes).map((n, i) => (
              <div key={i} className="flex items-center gap-2 text-[10px] text-zinc-400">
                <Info size={10} className="text-amber-500/70 shrink-0" />
                {isEditing ? (
                  <div className="flex items-center gap-1 w-full">
                    <Input value={n} onChange={(v) => {
                      const newNotes = [...(combo.notes || [])];
                      newNotes[i] = v;
                      onChange({ notes: newNotes });
                    }} className="w-full p-0 bg-transparent border-none text-[10px]" />
                    <button onClick={() => {
                      const newNotes = [...(combo.notes || [])];
                      newNotes.splice(i, 1);
                      onChange({ notes: newNotes });
                    }}><X size={8} /></button>
                  </div>
                ) : (
                  <span>{n}</span>
                )}
              </div>
            ))}
            {isEditing && (
              <button 
                onClick={() => onChange({ notes: [...(combo.notes || []), "Neue Notiz"] })}
                className="text-[9px] text-zinc-600 hover:text-zinc-400"
              >
                + Notiz hinzufügen
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};
