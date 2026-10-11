import React, { FC } from "react";
import { motion } from "motion/react";
import { Plus, Minus, X, Cpu } from "lucide-react";
import { Stat } from "../../types";
import { Input } from "./Input";

export const isVitalText = (label: string): boolean => {
  const l = label.toLowerCase();
  return l === "tp" || l === "trefferpunkte" || l === "stabilität" || l === "magiepunkte" || l === "glück" || l === "edge" || l === "edge (aktuell)" || l === "karma" || l === "karma (aktuell)";
};

export const parseStatValue = (val: string | number): number => {
  if (typeof val === 'number') return val;
  const parsed = parseFloat(String(val).replace(/[+]/g, ''));
  return isNaN(parsed) ? 0 : parsed;
};

export const StatCard: FC<{ 
  stat: Stat; 
  isEditing: boolean; 
  onChange: (updates: Partial<Stat>) => void;
  onRemove?: () => void;
  system?: string;
}> = ({ stat, isEditing, onChange, onRemove, system }) => {
  const isVital = isVitalText(stat.label);
  const isEssenceStat = stat.label.toLowerCase() === "essenz" || stat.label.toLowerCase() === "essence";
  const baseVal = parseStatValue(stat.value);
  const dmg = stat.damage || 0;
  const mod = stat.modifier || 0;
  const currentVal = isVital ? (baseVal - dmg) : (baseVal + mod);

  const isEdgeStat = stat.label.toLowerCase() === "edge" || stat.label.toLowerCase() === "edge (aktuell)";
  const isEdgeMaxStat = stat.label.toLowerCase().includes("edge gesamt") || stat.label.toLowerCase().includes("edge max");
  const isKarmaStat = stat.label.toLowerCase() === "karma" || stat.label.toLowerCase() === "karma (aktuell)";
  const isKarmaMaxStat = stat.label.toLowerCase().includes("karma gesamt") || stat.label.toLowerCase().includes("karma max");

  const isFortitudeStat = stat.label.toLowerCase().includes("zäh") || stat.label.toLowerCase().includes("fort");
  const isReflexStat = stat.label.toLowerCase().includes("ref");
  const isWillStat = stat.label.toLowerCase().includes("will");

  const handleAdjust = (amount: number) => {
    if (isVital) {
      const newDmg = Math.max(0, dmg - amount);
      onChange({ damage: newDmg });
    } else if (isEssenceStat) {
      const currentNum = typeof stat.value === 'number' ? stat.value : (parseFloat(String(stat.value)) || 6);
      const newEss = Math.max(0, Math.min(6, parseFloat((currentNum + (amount * 0.1)).toFixed(2))));
      onChange({ value: newEss });
    } else {
      onChange({ modifier: mod + amount });
    }
  };

  let borderClass = "border-zinc-800";
  let bgClass = "bg-zinc-900/50";
  let valueColor = "text-zinc-100";

  if (isFortitudeStat) {
    borderClass = "border-emerald-500/50 hover:border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]";
    bgClass = "bg-emerald-950/25";
    valueColor = "text-emerald-300";
  } else if (isReflexStat) {
    borderClass = "border-amber-500/50 hover:border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.15)]";
    bgClass = "bg-amber-950/25";
    valueColor = "text-amber-300";
  } else if (isWillStat) {
    borderClass = "border-purple-500/50 hover:border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.15)]";
    bgClass = "bg-purple-950/25";
    valueColor = "text-purple-300";
  } else if (isKarmaStat) {
    borderClass = dmg > 0 ? "border-amber-500/40" : "border-purple-500/50";
    bgClass = "bg-purple-950/20";
    valueColor = dmg > 0 ? "text-amber-400" : "text-purple-300";
  } else if (isKarmaMaxStat) {
    borderClass = "border-purple-800/40";
    bgClass = "bg-zinc-900/60";
    valueColor = "text-purple-400";
  } else if (isEdgeStat) {
    borderClass = dmg > 0 ? "border-amber-500/40" : "border-cyan-500/50";
    bgClass = "bg-cyan-950/20";
    valueColor = dmg > 0 ? "text-amber-400" : "text-cyan-300";
  } else if (isEdgeMaxStat) {
    borderClass = "border-cyan-800/40";
    bgClass = "bg-zinc-900/60";
    valueColor = "text-cyan-400";
  } else if (isEssenceStat) {
    const essVal = typeof currentVal === 'number' ? currentVal : (parseFloat(String(currentVal)) || 6);
    if (essVal <= 1.0) {
      borderClass = "border-red-500/50 animate-pulse ring-1 ring-red-500/20";
      bgClass = "bg-red-950/20";
      valueColor = "text-red-400";
    } else if (essVal <= 3.0) {
      borderClass = "border-amber-500/40";
      bgClass = "bg-amber-950/20";
      valueColor = "text-amber-400";
    } else {
      borderClass = "border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.15)]";
      bgClass = "bg-cyan-950/20";
      valueColor = "text-cyan-300";
    }
  } else if (isVital) {
    const healthPercent = baseVal > 0 ? (currentVal / baseVal) * 100 : 100;
    if (currentVal <= 0) {
      borderClass = "border-red-500/50 animate-pulse ring-1 ring-red-500/20";
      bgClass = "bg-red-950/20";
      valueColor = "text-red-500";
    } else if (healthPercent <= 30) {
      borderClass = "border-red-700/50";
      bgClass = "bg-red-950/10";
      valueColor = "text-red-400";
    } else if (healthPercent <= 70) {
      borderClass = "border-amber-700/50";
      bgClass = "bg-amber-950/10";
      valueColor = "text-amber-400";
    } else if (dmg > 0) {
      borderClass = "border-zinc-700";
      valueColor = "text-zinc-200";
    }
  } else if (mod > 0) {
    borderClass = "border-emerald-500/30";
    valueColor = "text-emerald-400";
  } else if (mod < 0) {
    borderClass = "border-red-500/30";
    valueColor = "text-red-400";
  }

  const isSigned = typeof stat.value === 'string' && stat.value.startsWith('+');
  let displayVal: string | number = (isSigned && currentVal >= 0 && !isVital) ? `+${currentVal}` : currentVal;
  if (isEssenceStat && typeof currentVal === 'number') {
    displayVal = currentVal.toFixed(2);
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative border p-3 rounded-2xl flex flex-col items-center justify-center min-w-[110px] backdrop-blur-md transition-all group ${bgClass} ${borderClass}`}
    >
      {isEditing && onRemove && (
        <button 
          onClick={onRemove}
          className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors z-10"
        >
          <X size={10} />
        </button>
      )}
      {isEditing ? (
        <div className="flex flex-col gap-1.5 w-full">
          <Input 
            value={stat.label} 
            onChange={(v) => onChange({ label: v })} 
            className="text-[10px] uppercase text-center font-bold tracking-wider"
          />
          <Input 
            value={stat.value} 
            onChange={(v) => onChange({ value: v })} 
            className="text-xs text-center font-black py-0.5"
            placeholder="Basiswert"
          />
          {system === 'coc7e' && (
            <Input 
              value={stat.secondary || ""} 
              onChange={(v) => onChange({ secondary: v })} 
              className="text-[9px] text-center opacity-75"
              placeholder="1/2 | 1/5"
            />
          )}
          {isVital ? (
            <div className="flex flex-col items-center gap-0.5 mt-1 border-t border-zinc-800 pt-1">
              <span className="text-[8px] uppercase text-zinc-500">Schaden:</span>
              <input 
                type="number"
                value={dmg}
                onChange={(e) => onChange({ damage: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-12 text-center bg-zinc-800 border border-zinc-700 rounded text-[10px] text-red-400 font-mono py-0.5"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-0.5 mt-1 border-t border-zinc-800 pt-1">
              <span className="text-[8px] uppercase text-zinc-500">Mod:</span>
              <input 
                type="number"
                value={mod}
                onChange={(e) => onChange({ modifier: parseInt(e.target.value) || 0 })}
                className="w-12 text-center bg-zinc-800 border border-zinc-700 rounded text-[10px] text-emerald-400 font-mono py-0.5"
                placeholder="+/-"
              />
            </div>
          )}
        </div>
      ) : (
        <>
          <span className={`text-[10px] uppercase font-bold font-mono mb-1 text-center px-1 leading-tight ${
            isFortitudeStat ? 'text-emerald-300 tracking-normal' :
            isReflexStat ? 'text-amber-300 tracking-normal' :
            isWillStat ? 'text-purple-300 tracking-normal' :
            'text-zinc-500 tracking-wider'
          }`}>
            {stat.label}
          </span>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleAdjust(-1)}
              className="p-1 text-zinc-600 hover:text-orange-500 transition-colors"
              title={isVital ? "Schaden zufügen / HP senken" : "-1 Modifikator"}
            >
              <Minus size={12} />
            </button>
            
            <div className="text-center flex flex-col items-center">
              <span className={`text-xl font-black font-mono leading-none ${valueColor}`}>
                {displayVal}
              </span>
            </div>

            <button 
              onClick={() => handleAdjust(1)}
              className="p-1 text-zinc-600 hover:text-orange-500 transition-colors"
              title={isVital ? "Schaden heilen / HP erhöhen" : "+1 Modifikator"}
            >
              <Plus size={12} />
            </button>
          </div>

          {isVital ? (
            <span className="text-[9px] text-zinc-500 font-mono mt-1.5 text-center leading-tight">
              Basis: <span className="text-zinc-400">{stat.value}</span>
              {dmg > 0 && (
                <>
                  <br />
                  <span className="text-red-500 font-semibold font-sans text-[8px] uppercase tracking-wider">
                    Schaden: -{dmg}
                  </span>
                </>
              )}
            </span>
          ) : isEssenceStat ? (
            <span className="text-[9px] text-cyan-400/80 font-mono mt-1.5 text-center leading-tight flex items-center gap-1 justify-center">
              <Cpu size={10} className="text-cyan-400" /> Max. 6.00
            </span>
          ) : (
            <span className="text-[9px] text-zinc-500 font-mono mt-1.5 text-center leading-tight">
              Basis: <span className="text-zinc-400">{stat.value}</span>
              {mod !== 0 && (
                <>
                  <br />
                  <span className={`${mod > 0 ? 'text-emerald-500' : 'text-red-500'} font-semibold font-sans text-[8px] uppercase tracking-wider`}>
                    Mod: {mod > 0 ? `+${mod}` : mod}
                  </span>
                </>
              )}
            </span>
          )}

          {stat.secondary && (
            <span className="text-[9px] text-zinc-600 font-mono mt-1 border-t border-zinc-850 w-full text-center pt-0.5">{stat.secondary}</span>
          )}
        </>
      )}
    </motion.div>
  );
};
