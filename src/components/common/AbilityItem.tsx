import React, { FC } from "react";
import { X, BookOpen } from "lucide-react";
import { Ability } from "../../types";
import { Input } from "./Input";
import { extractDailyUsesFromText } from "../../utils/inventorySync";

export const AbilityItem: FC<{ 
  ability: Ability; 
  isEditing: boolean; 
  onChange: (updates: Partial<Ability>) => void;
  onRemove?: () => void;
}> = ({ ability, isEditing, onChange, onRemove }) => {
  return (
    <div className="relative flex gap-3 p-3 rounded-xl hover:bg-zinc-800/30 transition-colors group">
      {isEditing && onRemove && (
        <button 
          onClick={onRemove}
          className="absolute top-1 right-1 text-zinc-600 hover:text-red-500"
        >
          <X size={12} />
        </button>
      )}
      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
        ability.type === 'rogue_talent' ? 'bg-amber-400' :
        ability.type === 'quality' ? 'bg-emerald-400' :
        ability.type === 'flaw' ? 'bg-rose-500' :
        ability.type === 'adept_power' ? 'bg-purple-400' :
        ability.type === 'talent' ? 'bg-blue-500' : 
        ability.type === 'class' ? 'bg-orange-500' : 
        ability.type === 'gnome' ? 'bg-purple-500' : 
        ability.type === 'trait' ? 'bg-amber-500' :
        ability.type === 'spell' ? 'bg-indigo-500' : 'bg-emerald-500'
      }`} />
      <div className="flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          {isEditing ? (
            <Input value={ability.name} onChange={(v) => onChange({ name: v })} className="font-bold text-sm" />
          ) : (
            <h5 className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors">{ability.name}</h5>
          )}
          
          {ability.type === 'rogue_talent' && !isEditing && (
            <span className="text-[9px] uppercase tracking-wider font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono">
              Schurkentrick
            </span>
          )}

          {ability.type === 'quality' && !isEditing && (
            <span className="text-[9px] uppercase tracking-wider font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono">
              Vorteil
            </span>
          )}

          {ability.type === 'flaw' && !isEditing && (
            <span className="text-[9px] uppercase tracking-wider font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.5 rounded font-mono">
              Nachteil
            </span>
          )}

          {ability.type === 'adept_power' && !isEditing && (
            <span className="text-[9px] uppercase tracking-wider font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded font-mono">
              Ki-Kraft
            </span>
          )}

          {ability.karmaCost !== undefined && !isEditing && (
            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
              ability.karmaCost > 0
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}>
              {ability.karmaCost > 0 ? `+${ability.karmaCost}` : ability.karmaCost} Karma
            </span>
          )}

          {ability.powerPoints !== undefined && !isEditing && (
            <span className="text-[9px] font-mono text-purple-300 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded">
              {ability.powerPoints} KP
            </span>
          )}

          {ability.drain && !isEditing && (
            <span className="text-[9px] font-mono text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded">
              Entzug: {ability.drain}
            </span>
          )}

          {isEditing ? (
            <Input value={ability.usage || ""} onChange={(v) => onChange({ usage: v })} className="text-[9px] w-20" placeholder="Nutzung" />
          ) : (
            ability.usage && (
              <span className="text-[9px] uppercase bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-mono">
                {ability.usage}
              </span>
            )
          )}

          {/* Regelbuch-Referenz / Buchseite */}
          {isEditing ? (
            <Input 
              value={ability.page || ""} 
              onChange={(v) => onChange({ page: v })} 
              className="text-[9px] w-28" 
              placeholder="Buchseite (z. B. GRW S. 68)" 
            />
          ) : (
            ability.page && (
              <span className="text-[10px] font-mono text-amber-300/80 flex items-center gap-1 bg-amber-950/20 border border-amber-900/30 px-1.5 py-0.5 rounded" title="Regelbuch-Referenz">
                <BookOpen size={10} className="text-amber-400/80 shrink-0" />
                <span>{ability.page}</span>
              </span>
            )
          )}

          {/* Tägliche Nutzungen & Ladungen */}
          {isEditing ? (
            <div className="flex items-center gap-1.5 text-[10px] bg-zinc-800/90 border border-zinc-700 px-2 py-1 rounded-lg shadow-sm">
              <span className="text-indigo-300 font-bold font-mono">⚡ Ladungen/Tag:</span>
              <input
                type="number"
                min={0}
                max={99}
                value={ability.maxUses !== undefined ? ability.maxUses : (extractDailyUsesFromText(ability.usage, ability.name) ?? extractDailyUsesFromText(ability.effect, ability.name) ?? "")}
                onChange={(e) => {
                  const val = e.target.value === "" ? undefined : Math.max(0, parseInt(e.target.value) || 0);
                  onChange({
                    maxUses: val,
                    currentUses: val !== undefined ? (ability.currentUses !== undefined ? Math.min(ability.currentUses, val) : val) : undefined
                  });
                }}
                placeholder="—"
                className="w-12 bg-zinc-950 text-indigo-200 font-mono font-bold text-center rounded px-1.5 py-0.5 border border-indigo-900/60 focus:outline-none focus:border-indigo-400"
                title="Maximale tägliche Nutzungen festlegen (wird bei Rast wieder aufgefüllt)"
              />
              <div className="flex items-center gap-1 ml-0.5">
                {[1, 2, 3].map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => onChange({ maxUses: preset, currentUses: preset })}
                    className="px-1.5 py-0.5 bg-zinc-700 hover:bg-indigo-600 text-zinc-300 hover:text-white rounded text-[9px] font-mono font-bold"
                  >
                    {preset}x
                  </button>
                ))}
                {ability.maxUses !== undefined && (
                  <button
                    type="button"
                    onClick={() => onChange({ maxUses: undefined, currentUses: undefined })}
                    className="px-1.5 py-0.5 bg-zinc-700/60 hover:bg-rose-900/60 text-zinc-400 hover:text-rose-200 rounded text-[9px]"
                    title="Ladungen entfernen"
                  >
                    Entfernen
                  </button>
                )}
              </div>
            </div>
          ) : (
            (() => {
              const effectiveMax = ability.maxUses !== undefined && ability.maxUses > 0
                ? ability.maxUses
                : (extractDailyUsesFromText(ability.usage, ability.name) ?? extractDailyUsesFromText(ability.effect, ability.name));

              const effectiveCurrent = ability.currentUses !== undefined 
                ? ability.currentUses 
                : (effectiveMax !== undefined ? effectiveMax : 0);

              if (effectiveMax !== undefined && effectiveMax > 0) {
                const isDepleted = effectiveCurrent <= 0;
                return (
                  <div 
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono border transition-all shadow-sm ${
                      isDepleted
                        ? 'bg-rose-950/50 border-rose-800/80 text-rose-300'
                        : 'bg-indigo-950/60 border-indigo-700/70 text-indigo-200 hover:border-indigo-500'
                    }`}
                    title="Tägliche Nutzungen verwalten (+/- zum Verbrauchen oder Aufladen)"
                  >
                    <span className="text-[10px] uppercase tracking-wider font-sans font-bold text-zinc-400 flex items-center gap-1">
                      <span className="text-amber-400 font-bold">⚡</span>
                      <span>Ladungen:</span>
                    </span>
                    <span className="font-bold text-white tracking-tight">
                      {effectiveCurrent} / {effectiveMax}
                    </span>
                    <div className="flex items-center gap-1 ml-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          if (effectiveCurrent > 0) {
                            onChange({ 
                              maxUses: effectiveMax,
                              currentUses: effectiveCurrent - 1 
                            });
                          }
                        }}
                        disabled={effectiveCurrent <= 0}
                        title="1 Ladung verbrauchen (-)"
                        className="w-5 h-5 flex items-center justify-center rounded bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-zinc-100 hover:text-white disabled:opacity-30 disabled:pointer-events-none text-xs font-black leading-none cursor-pointer border border-zinc-700 transition-colors"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          if (effectiveCurrent < effectiveMax) {
                            onChange({ 
                              maxUses: effectiveMax,
                              currentUses: effectiveCurrent + 1 
                            });
                          }
                        }}
                        disabled={effectiveCurrent >= effectiveMax}
                        title="1 Ladung aufladen (+)"
                        className="w-5 h-5 flex items-center justify-center rounded bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-zinc-100 hover:text-white disabled:opacity-30 disabled:pointer-events-none text-xs font-black leading-none cursor-pointer border border-zinc-700 transition-colors"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          const nextUses = prompt(`Maximale Ladungen für "${ability.name}" eingeben:`, String(effectiveMax));
                          if (nextUses !== null) {
                            const parsed = parseInt(nextUses, 10);
                            if (!isNaN(parsed) && parsed > 0) {
                              onChange({ maxUses: parsed, currentUses: parsed });
                            } else if (nextUses.trim() === "0" || nextUses.trim() === "") {
                              onChange({ maxUses: undefined, currentUses: undefined });
                            }
                          }
                        }}
                        className="w-4 h-4 ml-0.5 flex items-center justify-center text-zinc-400 hover:text-white rounded hover:bg-zinc-800 text-[10px]"
                        title="Ladungs-Maximum anpassen"
                      >
                        ⚙
                      </button>
                    </div>
                  </div>
                );
              }

              // If no charges are set yet, provide a quick button to add charges
              return (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    const promptVal = prompt(`Maximale Ladungen / Nutzungen pro Tag für "${ability.name}" festlegen (z. B. 1, 2, 3):`, "1");
                    if (promptVal !== null) {
                      const parsed = parseInt(promptVal, 10);
                      if (!isNaN(parsed) && parsed > 0) {
                        onChange({ maxUses: parsed, currentUses: parsed });
                      }
                    }
                  }}
                  className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-800/60 hover:bg-indigo-950/80 text-zinc-400 hover:text-indigo-200 border border-dashed border-zinc-700/60 hover:border-indigo-600/60 transition-all cursor-pointer opacity-80 hover:opacity-100"
                  title="Ladungen / Tägliche Nutzungen für diese Fähigkeit oder Zauber festlegen"
                >
                  <span>⚡</span>
                  <span>+ Ladungen festlegen</span>
                </button>
              );
            })()
          )}
        </div>
        {isEditing ? (
          <textarea 
            value={ability.effect} 
            onChange={(e) => onChange({ effect: e.target.value })}
            className="w-full bg-zinc-800 border border-zinc-700 rounded p-1 text-xs text-zinc-300 mt-1 focus:outline-none focus:border-orange-500"
            rows={2}
          />
        ) : (
          <p className="text-xs text-zinc-500 leading-relaxed mt-0.5">{ability.effect}</p>
        )}
      </div>
    </div>
  );
};
