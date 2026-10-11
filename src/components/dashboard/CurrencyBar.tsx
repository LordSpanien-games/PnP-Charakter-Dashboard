import React, { FC } from "react";
import { Coins, Home, Disc, CreditCard } from "lucide-react";
import { CharacterData } from "../../types";
import { isPathfinder } from "../../utils/pathfinder";
import { calculateTotalGold, calculateCoinWeight } from "../../utils/currency";

export interface CurrencyBarProps {
  character: CharacterData;
  onUpdateData: (partial: Partial<CharacterData>) => void;
  onOpenCurrencyModal: () => void;
}

export const CurrencyBar: FC<CurrencyBarProps> = ({
  character,
  onUpdateData,
  onOpenCurrencyModal
}) => {
  const isPF = isPathfinder(character);

  return (
    <div className="mb-8 bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 backdrop-blur-md">
      {isPF ? (
        /* Pathfinder 4-Coin Purse Summary: Platin, Gold, Silber, Kupfer */
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Coins size={22} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 font-bold block">
                Münzbeutel (Pathfinder 1e)
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl md:text-3xl font-black font-mono text-amber-400 tracking-tight">
                  {calculateTotalGold(character.currency?.coins || { pp: 0, gp: character.currency?.amount || 0, sp: 0, cp: 0 }).toLocaleString('de-DE')}
                </span>
                <span className="text-base font-bold font-mono text-amber-500">GM Gesamtwert</span>
              </div>
            </div>
          </div>

          {/* 4 subdivided coins badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="px-2.5 py-1 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 font-mono text-xs flex items-center gap-1.5" title="Platin (1 PM = 10 GM)">
              <span className="text-[9px] uppercase font-bold text-cyan-400">PM:</span>
              <strong className="text-white font-bold">{(character.currency?.coins?.pp || 0).toLocaleString('de-DE')}</strong>
            </div>

            <div className="px-2.5 py-1 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 font-mono text-xs flex items-center gap-1.5" title="Gold (1 GM = 1 GM)">
              <span className="text-[9px] uppercase font-bold text-amber-400">GM:</span>
              <strong className="text-amber-200 font-bold">{(character.currency?.coins?.gp ?? character.currency?.amount ?? 0).toLocaleString('de-DE')}</strong>
            </div>

            <div className="px-2.5 py-1 rounded-xl bg-slate-800/50 border border-slate-400/30 text-slate-300 font-mono text-xs flex items-center gap-1.5" title="Silber (10 SM = 1 GM)">
              <span className="text-[9px] uppercase font-bold text-slate-400">SM:</span>
              <strong className="text-zinc-200 font-bold">{(character.currency?.coins?.sp || 0).toLocaleString('de-DE')}</strong>
            </div>

            <div className="px-2.5 py-1 rounded-xl bg-orange-950/40 border border-orange-600/30 text-orange-400 font-mono text-xs flex items-center gap-1.5" title="Kupfer (100 KM = 1 GM)">
              <span className="text-[9px] uppercase font-bold text-orange-400">KM:</span>
              <strong className="text-orange-200 font-bold">{(character.currency?.coins?.cp || 0).toLocaleString('de-DE')}</strong>
            </div>

            <span className="text-[11px] font-mono text-zinc-500 hidden sm:inline ml-1">
              ({calculateCoinWeight(character.currency?.coins || { pp: 0, gp: character.currency?.amount || 0, sp: 0, cp: 0 }).weightPounds} Pfund)
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Coins size={22} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 font-bold block">
                {character.system === 'shadowrun' ? 'Vermögen (Nuyen)' :
                 character.system === 'traveller' ? 'Vermögen (Credits Cr)' :
                 character.system === 'coc7e' || character.system === 'coc1920' ? 'Bargeld & Vermögen' :
                 'Währung & Vermögen'}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl md:text-3xl font-black font-mono text-amber-400 tracking-tight">
                  {(character.currency?.amount || 0).toLocaleString('de-DE')}
                </span>
                <span className="text-base font-bold font-mono text-amber-500">
                  {character.currency?.unit || (character.system === 'shadowrun' ? '¥' : character.system === 'traveller' ? 'Cr' : character.system === 'coc7e' || character.system === 'coc1920' ? '$' : 'Münzen')}
                </span>
              </div>
            </div>
          </div>

          {/* Lifestyle Info Tag (nicht in Pathfinder) */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-zinc-950/80 border border-cyan-800/40 rounded-xl text-xs font-mono">
            <Home size={14} className="text-cyan-400" />
            <div>
              <span className="text-[9px] uppercase text-zinc-500 block leading-none">Lebensstil</span>
              <span className="text-cyan-300 font-bold">
                {character.currency?.lifestyle || (character.system === 'shadowrun' ? 'Mittelstand' : character.system === 'traveller' ? 'High Passage' : 'Standard')}
              </span>
              <span className="text-zinc-500 text-[10px] ml-1">
                ({(character.currency?.lifestyleCost !== undefined ? character.currency.lifestyleCost : (character.system === 'shadowrun' ? 5000 : character.system === 'traveller' ? 1000 : 100)).toLocaleString('de-DE')} {character.currency?.unit || (character.system === 'shadowrun' ? '¥' : character.system === 'traveller' ? 'Cr' : 'GM')})
              </span>
            </div>
          </div>

          {/* Shadowrun Active Chipjack Softs Indicator */}
          {character.system === 'shadowrun' && (() => {
            const activeChips = (character.bodyMods || []).flatMap(m => m.chips || []).filter(c => c.isActive);
            if (activeChips.length === 0) return null;
            return (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-cyan-950/70 border border-cyan-500/40 rounded-xl text-xs font-mono text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.15)]">
                <Disc size={13} className="text-cyan-400 animate-spin [animation-duration:8s]" />
                <span>
                  Chip online: <strong className="text-white">{activeChips[0].name}</strong>
                  {activeChips.length > 1 ? ` (+${activeChips.length - 1})` : ''}
                </span>
              </div>
            );
          })()}
        </div>
      )}

      <div className="flex items-center gap-2.5 flex-wrap">
        {!isPF && (
          <button
            onClick={() => {
              const sys = character.system;
              const curUnit = character.currency?.unit || (sys === 'shadowrun' ? '¥' : sys === 'traveller' ? 'Cr' : sys === 'coc7e' || sys === 'coc1920' ? '$' : 'Münzen');
              const lsName = character.currency?.lifestyle || (sys === 'shadowrun' ? 'Mittelstand' : sys === 'traveller' ? 'High Passage' : 'Standard');
              const lsCost = character.currency?.lifestyleCost !== undefined ? character.currency.lifestyleCost : (sys === 'shadowrun' ? 5000 : sys === 'traveller' ? 1000 : 100);
              const currentCurrency = character.currency || { amount: 0, unit: curUnit, history: [] };
              const newBal = (currentCurrency.amount || 0) - lsCost;

              const newTx = {
                id: Date.now().toString(),
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                description: `Lebensstil (${lsName}) bezahlt`,
                amount: -lsCost,
                type: 'expense' as const,
                balanceAfter: newBal
              };

              onUpdateData({
                currency: {
                  ...currentCurrency,
                  amount: Math.max(0, newBal),
                  unit: curUnit,
                  lifestyle: lsName,
                  lifestyleCost: lsCost,
                  history: [newTx, ...(currentCurrency.history || [])]
                }
              });
            }}
            className="px-3.5 py-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:border-cyan-500/60 rounded-xl text-xs font-bold font-mono tracking-wide transition-all flex items-center gap-2 cursor-pointer shadow-sm"
            title="Lebensstil-Kosten direkt vom Kontostand abziehen"
            id="btn-quick-pay-lifestyle"
          >
            <CreditCard size={15} className="text-cyan-400" />
            <span>Lebensstil bezahlen (-{((character.currency?.lifestyleCost !== undefined ? character.currency.lifestyleCost : (character.system === 'shadowrun' ? 5000 : character.system === 'traveller' ? 1000 : 100))).toLocaleString('de-DE')} {character.currency?.unit || (character.system === 'shadowrun' ? '¥' : character.system === 'traveller' ? 'Cr' : 'GM')})</span>
          </button>
        )}

        <button
          onClick={onOpenCurrencyModal}
          className="px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:border-amber-500/60 rounded-xl text-xs font-bold font-mono tracking-wide transition-all flex items-center gap-2 cursor-pointer shadow-sm"
          id="btn-currency-calculator"
        >
          <Coins size={15} className="text-amber-400" />
          <span>{isPF ? 'Münzbeutel & Wechselstube' : 'Ausgaben & Einnahmen Rechner'}</span>
        </button>
      </div>
    </div>
  );
};
