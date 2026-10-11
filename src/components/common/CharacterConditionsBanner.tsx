import React, { FC } from "react";
import { motion } from "motion/react";
import { Stat, GameSystem } from "../../types";
import { parseStatValue } from "./StatCard";

export interface CharacterCondition {
  label: string;
  color: string;
  description: string;
}

export const getCharacterConditions = (stats: Stat[], system: GameSystem): CharacterCondition[] => {
  const conditions: CharacterCondition[] = [];
  
  const hpStat = stats.find(s => {
    const l = s.label.toLowerCase();
    return l === "tp" || l === "trefferpunkte";
  });
  
  if (hpStat) {
    const maxVal = parseStatValue(hpStat.value);
    const damage = hpStat.damage || 0;
    const currentHP = maxVal - damage;
    
    if (system === 'pathfinder') {
      if (currentHP === 0) {
        conditions.push({
          label: "Aktionsunfähig (Kampfunfähig)",
          color: "bg-amber-550/20 text-amber-300 border border-amber-500/50 animate-pulse",
          description: "Auf genau 0 TP bist du kampfunfähig. Du darfst nur eine einzelne Bewegungs- oder Standardaktion pro Runde ausführen und wirst nach jeder anstrengenden Aktion sterbend."
        });
      } else if (currentHP < 0) {
        conditions.push({
          label: "Ohnmächtig & Sterbend",
          color: "bg-red-550/20 text-red-300 border border-red-500/50 animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.2)]",
          description: `Du bist ohnmächtig und liegst im Sterben (aktuelle TP: ${currentHP}). Jede Runde verlierst du 1 TP, bis du dich stabilisierst (Zähigkeitswurf SG 10 + absolute negative TP) oder stirbst.`
        });
      }
    } else if (system === 'coc7e' || system === 'coc1920') {
      if (currentHP <= 0) {
        conditions.push({
          label: "Ohnmächtig & Sterbend",
          color: "bg-red-550/20 text-red-300 border border-red-500/50 animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.2)]",
          description: "Deine Trefferpunkte sind auf 0 gesunken. Du bist ohnmächtig und liegst im Sterben. Du benötigst jede Runde Erste Hilfe oder Medizin, um nicht zu versterben."
        });
      } else if (damage >= maxVal / 2) {
        conditions.push({
          label: "Schwere Verletzung (Major Wound)",
          color: "bg-amber-950/20 text-amber-300 border border-amber-600/50",
          description: "Du hast eine Schwere Verletzung erlitten (Verlust von >= 50% deiner max. TP). Wenn du auf 0 TP fällst, bist du sofort sterbend statt nur ohnmächtig."
        });
      }
    } else if (system === 'shadowrun') {
      if (currentHP <= 0) {
        conditions.push({
          label: "Ohnmächtig / Kritisch",
          color: "bg-red-550/20 text-red-300 border border-red-500/50 animate-pulse",
          description: "Dein Hauptschadenstrack ist vollständig gefüllt. Du bist handlungsunfähig."
        });
      }
    } else {
      if (currentHP <= 0) {
        conditions.push({
          label: "Ohnmächtig / Kampfunfähig",
          color: "bg-red-550/20 text-red-300 border border-red-500/50 animate-pulse",
          description: "Deine Trefferpunkte sind auf 0 oder weniger gefallen. Du bist ohnmächtig oder kampfunfähig."
        });
      }
    }
  }

  // Shadowrun Damage tracks & Injury Modifiers (such as -1 per 3 damages)
  if (system === 'shadowrun') {
    const physStat = stats.find(s => s.label.toLowerCase().includes("körper") || s.label.toLowerCase().includes("phys"));
    const stunStat = stats.find(s => s.label.toLowerCase().includes("geist") || s.label.toLowerCase().includes("stun"));
    
    let totalPenalty = 0;
    
    if (physStat) {
      const maxVal = parseStatValue(physStat.value);
      const damage = physStat.damage || 0;
      const penalty = Math.floor(damage / 3);
      totalPenalty += penalty;
      
      if (damage >= maxVal) {
        conditions.push({
          label: "Ohnmächtig (Körperlich kritisch)",
          color: "bg-red-600/20 text-red-300 border border-red-500/50 animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.2)]",
          description: "Dein körperlicher Schadenstrack ist voll. Du bist bewusstlos und liegst im Sterben. Jede Minute verlierst du einen weiteren Punkt (Überlaufschaden), bis du Erste Hilfe erhältst."
        });
      } else if (penalty > 0) {
        conditions.push({
          label: `Körperlicher Malus (-${penalty})`,
          color: "bg-amber-950/20 text-amber-300 border border-amber-600/40",
          description: `Durch deine körperlichen Verletzungen (${damage} Kästchen Schaden) erleidest du einen Würfelpool-Malus von -${penalty} auf alle Proben.`
        });
      }
    }
    
    if (stunStat) {
      const maxVal = parseStatValue(stunStat.value);
      const damage = stunStat.damage || 0;
      const penalty = Math.floor(damage / 3);
      totalPenalty += penalty;
      
      if (damage >= maxVal) {
        conditions.push({
          label: "Geistig Ohnmächtig",
          color: "bg-purple-900/30 text-purple-300 border border-purple-550/50 animate-pulse",
          description: "Dein geistiger Schadenstrack ist voll. Du bist bewusstlos geschlagen. Dein Geist hat kapituliert. Du erwachst erst, wenn sich deine Betäubung erholt hat."
        });
      } else if (penalty > 0) {
        conditions.push({
          label: `Geistiger Malus (-${penalty})`,
          color: "bg-purple-950/20 text-purple-300 border border-purple-600/30",
          description: `Durch geistige Erschöpfung / Betäubung (${damage} Kästchen Schaden) erleidest du einen Würfelpool-Malus von -${penalty} auf alle Proben.`
        });
      }
    }

    if (totalPenalty > 0) {
      conditions.push({
        label: `Gesamter Pool-Malus: -${totalPenalty}`,
        color: "bg-zinc-950/45 text-amber-400 border border-amber-500/30 animate-pulse font-mono",
        description: `Aufgrund deiner kumulierten Verletzungen erleidest du einen Gesamt-Abzug von -${totalPenalty} Würfeln auf jede Probe!`
      });
    }
  }
  
  const sanityStat = stats.find(s => s.label.toLowerCase() === "stabilität");
  if (sanityStat && (system === 'coc7e' || system === 'coc1920')) {
    const maxVal = parseStatValue(sanityStat.value);
    const loss = sanityStat.damage || 0;
    const currentSanity = maxVal - loss;
    
    if (currentSanity <= 0) {
      conditions.push({
        label: "Dauerhaft Wahnsinnig (Permanent Insane)",
        color: "bg-purple-950/30 text-purple-300 border border-purple-500/50 animate-pulse",
        description: "Deine Stabilität ist auf 0 gefallen. Deine Psyche ist unwiederbringlich zerbrochen. Du bist dauerhaft wahnsinnig und der Charakter ist unspielbar."
      });
    } else if (loss >= 5) {
      conditions.push({
        label: "Gefährdeter Verstand (Krise)",
        color: "bg-purple-950/10 text-purple-400 border border-purple-800/50",
        description: "Du hast erhebliche Stabilität verloren (Krise: >= 5 Punkte). Bei weiterem Verlust in dieser Sitzung droht akuter temporärer Wahnsinn!"
      });
    }
  }

  // Traveller 2D6 Conditions (Damage to STR, DEX, END)
  if (system === 'traveller') {
    const strChar = stats.find(s => (s?.label || '').toUpperCase() === 'STR' || (s?.label || '').toUpperCase() === 'STÄ');
    const dexChar = stats.find(s => (s?.label || '').toUpperCase() === 'DEX' || (s?.label || '').toUpperCase() === 'GES');
    const endChar = stats.find(s => (s?.label || '').toUpperCase() === 'END' || (s?.label || '').toUpperCase() === 'KON');

    const strMax = strChar ? parseStatValue(strChar.value) : 7;
    const strDmg = strChar?.damage || 0;
    const dexMax = dexChar ? parseStatValue(dexChar.value) : 7;
    const dexDmg = dexChar?.damage || 0;
    const endMax = endChar ? parseStatValue(endChar.value) : 7;
    const endDmg = endChar?.damage || 0;

    let zeroCount = 0;
    if (strDmg >= strMax && strMax > 0) zeroCount++;
    if (dexDmg >= dexMax && dexMax > 0) zeroCount++;
    if (endDmg >= endMax && endMax > 0) zeroCount++;

    const totalPhysicalDamage = strDmg + dexDmg + endDmg;

    if (zeroCount >= 3) {
      conditions.push({
        label: "Tot (Verstorben)",
        color: "bg-black text-red-500 border border-red-800 shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse",
        description: "Alle drei körperlichen Attribute (STR, DEX, END) sind auf 0 gefallen. Der Charakter ist an seinen schweren Verletzungen verstorben."
      });
    } else if (zeroCount === 2) {
      conditions.push({
        label: "Sterbend / Kritisch (Dying)",
        color: "bg-red-950/40 text-red-300 border border-red-500/80 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.3)]",
        description: "Zwei körperliche Attribute sind auf 0 reduziert. Der Charakter liegt im Sterben und stirbt ohne sofortige Notfall-Medizin (Trauma-Kit)."
      });
    } else if (zeroCount === 1) {
      conditions.push({
        label: "Ohnmächtig (Unconscious)",
        color: "bg-amber-950/30 text-amber-300 border border-amber-500/60 animate-pulse",
        description: "Ein körperliches Attribut ist auf 0 gefallen. Der Charakter ist vor Schmerz und Erschöpfung zusammengebrochen und bewusstlos."
      });
    } else if (totalPhysicalDamage > 0) {
      conditions.push({
        label: `Körperlich Verwundet (${totalPhysicalDamage} Pkt. Schaden)`,
        color: "bg-blue-950/20 text-blue-300 border border-blue-500/40",
        description: `Körperlicher Gesamtschaden: ${totalPhysicalDamage} Pkt. (END: ${endDmg}/${endMax}, STR: ${strDmg}/${strMax}, DEX: ${dexDmg}/${dexMax}). DM-Mali greifen auf Proben.`
      });
    }
  }
  
  return conditions;
};

export const CharacterConditionsBanner: FC<{
  stats: Stat[];
  system: GameSystem;
}> = ({ stats, system }) => {
  const activeConditions = getCharacterConditions(stats, system);

  return (
    <div className="mb-10">
      <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-4 md:p-5 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-850 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-xs tracking-[0.2em] uppercase font-black text-zinc-400 font-mono">Status & Belastungen</span>
          </div>
          {activeConditions.length === 0 && (
            <div className="text-[10px] text-emerald-400 bg-emerald-950/20 border border-emerald-800/30 px-3 py-1 rounded-full flex items-center gap-1.5 font-mono font-bold tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> CHARACTER STATUS: STABIL / GESUND
            </div>
          )}
        </div>
        {activeConditions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeConditions.map((cond, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                key={i} 
                className={`p-3.5 rounded-xl border flex flex-col gap-1.5 ${cond.color}`}
              >
                <span className="text-xs font-black uppercase tracking-wider font-sans">{cond.label}</span>
                <p className="text-[10px] leading-relaxed opacity-90 font-mono">{cond.description}</p>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-zinc-500 font-mono leading-relaxed">
            Der Charakter schlägt sich wacker. Aktuell liegen keine Beeinträchtigungen, schwere Verletzungen, Lähmungen oder Ohnmachtszustände vor.
          </p>
        )}
      </div>
    </div>
  );
};
