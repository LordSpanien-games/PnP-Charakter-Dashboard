import React, { FC } from "react";
import { Info } from "lucide-react";
import { GameSystem } from "../../types";

export interface QuickRefFooterProps {
  system: GameSystem;
}

export const QuickRefFooter: FC<QuickRefFooterProps> = ({ system }) => {
  return (
    <div className="p-6 bg-orange-500/5 border border-orange-500/10 rounded-3xl">
      <div className="flex items-center gap-2 text-orange-500 mb-3">
        <Info size={16} />
        <span className="text-xs font-bold uppercase tracking-wider">Quick Ref</span>
      </div>
      <ul className="text-[11px] text-zinc-500 space-y-2">
        {system === 'pathfinder' ? (
          <>
            <li className="flex justify-between"><span>Kritischer Treffer</span> <span className="text-zinc-300 font-mono">19-20 / x2</span></li>
            <li className="flex justify-between"><span>Hinterhältiger Angriff</span> <span className="text-zinc-300 font-mono">+5W6</span></li>
            <li className="flex justify-between"><span>Blutung</span> <span className="text-zinc-300 font-mono">5 TP / Runde</span></li>
            <li className="flex justify-between"><span>Beweglichkeit RK</span> <span className="text-zinc-300 font-mono">+4 vs GA</span></li>
          </>
        ) : (system === 'coc7e' || system === 'coc1920') ? (
          <>
            <li className="flex justify-between"><span>Extremer Erfolg</span> <span className="text-zinc-300 font-mono">1/5 Wert</span></li>
            <li className="flex justify-between"><span>Schwerer Erfolg</span> <span className="text-zinc-300 font-mono">1/2 Wert</span></li>
            <li className="flex justify-between"><span>Bonuswürfel</span> <span className="text-zinc-300 font-mono">Zehnerstelle neu</span></li>
            <li className="flex justify-between"><span>Stabilitätsverlust</span> <span className="text-zinc-300 font-mono">Geistige Umnachtung</span></li>
          </>
        ) : system === 'shadowrun' ? (
          <>
            <li className="flex justify-between"><span>Erfolg</span> <span className="text-zinc-300 font-mono">5 oder 6 auf d6</span></li>
            <li className="flex justify-between"><span>Patzer (Glitch)</span> <span className="text-zinc-300 font-mono">&gt; 50% Einsen</span></li>
            <li className="flex justify-between"><span>Kritischer Patzer</span> <span className="text-zinc-300 font-mono">Patzer ohne Erfolge</span></li>
            <li className="flex justify-between"><span>Initiative-Phase</span> <span className="text-zinc-300 font-mono">-10 pro Durchgang</span></li>
            <li className="flex justify-between"><span>Wundabzug</span> <span className="text-zinc-300 font-mono">-1 je 3 Kästchen</span></li>
          </>
        ) : (
          <li className="text-center italic">Keine systemspezifischen Infos</li>
        )}
      </ul>
    </div>
  );
};
