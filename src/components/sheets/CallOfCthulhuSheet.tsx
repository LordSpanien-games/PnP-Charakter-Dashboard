import React, { FC, useMemo, ChangeEvent } from "react";
import { 
  Skull, 
  Eye, 
  BookOpen, 
  Heart, 
  Sparkles, 
  Shield, 
  Crosshair, 
  DollarSign, 
  Feather,
  AlertTriangle
} from "lucide-react";
import { 
  Skill, 
  Weapon, 
  Ability,
  Stat
} from "../../types";
import { SheetProps } from "./types";
import { CoCSkillsBlock } from "./CoCSkillsBlock";

interface CoCSkillDef {
  name: string;
  base: number;
  category?: string;
}

const OFFICIAL_COC_SKILLS: CoCSkillDef[] = [
  { name: "Anthropologie", base: 1 },
  { name: "Archäologie", base: 1 },
  { name: "Artillerie", base: 1 },
  { name: "Ausweichen", base: 0 }, // Handled dynamically (GE/2)
  { name: "Bibliotheksnutzung", base: 20 },
  { name: "Buchführung", base: 5 },
  { name: "Cthulhu-Mythos", base: 0 },
  { name: "Charme", base: 15 },
  { name: "Erste Hilfe", base: 30 },
  { name: "Fahren (Auto)", base: 20 },
  { name: "Feilschen", base: 5 },
  { name: "Handfeuerwaffen", base: 20 },
  { name: "Handwerk / Kunst", base: 5 },
  { name: "Horchen", base: 20 },
  { name: "Klettern", base: 20 },
  { name: "Mechanische Reparaturen", base: 10 },
  { name: "Medizin", base: 1 },
  { name: "Muttersprache", base: 0 }, // Handled dynamically (BI)
  { name: "Naturkunde", base: 10 },
  { name: "Nahkampf (Handgemenge)", base: 25 },
  { name: "Okkultismus", base: 5 },
  { name: "Orientierung", base: 10 },
  { name: "Psychoanalyse", base: 1 },
  { name: "Psychologie", base: 10 },
  { name: "Reiten", base: 5 },
  { name: "Schusswaffen (Gewehr)", base: 25 },
  { name: "Schwimmen", base: 20 },
  { name: "Schweres Gerät", base: 1 },
  { name: "Spurensuche", base: 10 },
  { name: "Springen", base: 20 },
  { name: "Tarnung", base: 20 },
  { name: "Überzeugen", base: 10 },
  { name: "Überreden", base: 5 },
  { name: "Verborgenes Erkennen", base: 25 },
  { name: "Werfen", base: 20 },
  { name: "Wissenschaft (Astronomie)", base: 1 },
  { name: "Wissenschaft (Biologie)", base: 1 },
  { name: "Wissenschaft (Chemie)", base: 1 },
  { name: "Wissenschaft (Geologie)", base: 1 },
  { name: "Wissenschaft (Geschichte)", base: 5 },
  { name: "Wissenschaft (Kryptografie)", base: 1 },
  { name: "Wissenschaft (Physik)", base: 1 },
];

export const CallOfCthulhuSheet: FC<SheetProps> = ({
  data,
  onUpdateData,
  isEditable,
  paperStyle,
  activePage
}) => {
  // Extract characteristics
  const getCharVal = (keys: string[], defaultVal = 50): number => {
    if (!data.characteristics) return defaultVal;
    const item = data.characteristics.find(c => 
      keys.some(k => (c.label || "").toLowerCase() === k.toLowerCase() || (c.label || "").toLowerCase().includes(k.toLowerCase()))
    );
    if (!item) return defaultVal;
    const num = typeof item.value === 'number' ? item.value : parseInt(item.value.toString().replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? defaultVal : num;
  };

  const st = getCharVal(["ST", "Stärke", "STR"], 40);
  const ko = getCharVal(["KO", "Konstitution", "CON"], 50);
  const gr = getCharVal(["GR", "Größe", "SIZ"], 70);
  const ge = getCharVal(["GE", "Geschicklichkeit", "DEX"], 60);
  const er = getCharVal(["ER", "Erscheinungsbild", "APP"], 55);
  const inVal = getCharVal(["IN", "Intelligenz", "Idee", "INT"], 80);
  const ma = getCharVal(["MA", "Macht", "POW"], 75);
  const bi = getCharVal(["BI", "Bildung", "EDU"], 90);

  const charMap: Record<string, { label: string; sub: string; val: number }> = {
    ST: { label: "ST", sub: "Stärke", val: st },
    KO: { label: "KO", sub: "Konstitution", val: ko },
    GR: { label: "GR", sub: "Größe", val: gr },
    GE: { label: "GE", sub: "Geschick", val: ge },
    ER: { label: "ER", sub: "Erscheinung", val: er },
    IN: { label: "IN", sub: "Intelligenz", val: inVal },
    MA: { label: "MA", sub: "Macht", val: ma },
    BI: { label: "BI", sub: "Bildung", val: bi },
  };

  const handleUpdateChar = (key: string, newVal: number) => {
    const list = data.characteristics ? [...data.characteristics] : [];
    const idx = list.findIndex(c => (c?.label || "").toUpperCase() === (key || "").toUpperCase());
    if (idx >= 0) {
      list[idx] = { ...list[idx], value: newVal };
    } else {
      list.push({ label: key, value: newVal });
    }
    onUpdateData({ characteristics: list });
  };

  // Vitals & Trackers
  const maxHp = Math.floor((ko + gr) / 10);
  const hpStat = (data.stats || []).find(s => (s.label || "").toLowerCase().includes("treffer") || (s.label || "").toLowerCase().includes("hp"));
  const hpDamage = hpStat?.damage || 0;
  const currentHp = Math.max(0, (typeof hpStat?.value === 'number' ? hpStat.value : maxHp) - hpDamage);

  const maxMp = Math.floor(ma / 5);
  const mpStat = (data.stats || []).find(s => (s.label || "").toLowerCase().includes("magie") || (s.label || "").toLowerCase().includes("mp"));
  const currentMp = mpStat ? (typeof mpStat.value === 'number' ? mpStat.value : maxMp) : maxMp;

  const sanStat = (data.stats || []).find(s => (s.label || "").toLowerCase().includes("stabilität") || (s.label || "").toLowerCase().includes("sanity") || (s.label || "").toLowerCase().includes("ggs"));
  const currentSan = sanStat ? (typeof sanStat.value === 'number' ? sanStat.value : ma) : ma;

  const mythosSkill = (data.skills || []).find(s => (s?.name || '').toLowerCase().includes("mythos"))?.value || 0;
  const maxSan = 99 - mythosSkill;

  const luckStat = (data.stats || []).find(s => (s.label || "").toLowerCase().includes("glück") || (s.label || "").toLowerCase().includes("luck"));
  const currentLuck = luckStat ? (typeof luckStat.value === 'number' ? luckStat.value : 50) : 50;

  // Combat Stats: Damage Bonus & Build
  const strPlusSiz = st + gr;
  let damageBonus = "0";
  let build = 0;
  if (strPlusSiz <= 64) { damageBonus = "-2"; build = -2; }
  else if (strPlusSiz <= 84) { damageBonus = "-1"; build = -1; }
  else if (strPlusSiz <= 124) { damageBonus = "0"; build = 0; }
  else if (strPlusSiz <= 164) { damageBonus = "+1W4"; build = 1; }
  else if (strPlusSiz <= 204) { damageBonus = "+1W6"; build = 2; }
  else if (strPlusSiz <= 284) { damageBonus = "+2W6"; build = 3; }
  else { damageBonus = "+3W6"; build = 4; }

  // Movement Rate (MOV)
  let mov = 8;
  if (ge < gr && st < gr) mov = 7;
  else if (ge > gr && st > gr) mov = 9;
  else mov = 8;

  // Skills merge
  const skillsMerged = useMemo(() => {
    const userSkills = data.skills || [];
    return OFFICIAL_COC_SKILLS.map(def => {
      const match = userSkills.find(s => s.name.toLowerCase().includes(def.name.toLowerCase()));
      let baseVal = def.base;
      if (def.name === "Ausweichen") baseVal = Math.floor(ge / 2);
      if (def.name === "Muttersprache") baseVal = bi;

      const score = match ? match.value : baseVal;
      return {
        name: def.name,
        base: baseVal,
        val: score,
        half: Math.floor(score / 2),
        fifth: Math.floor(score / 5),
        checked: match?.checked ?? false,
        note: match?.note || ""
      };
    });
  }, [data.skills, ge, bi]);

  const handleUpdateSkill = (name: string, newVal: number) => {
    const list = [...(data.skills || [])];
    const idx = list.findIndex(s => (s?.name || '').toLowerCase() === name.toLowerCase());
    if (idx >= 0) {
      list[idx] = { ...list[idx], value: newVal };
    } else {
      list.push({ name, value: newVal });
    }
    onUpdateData({ skills: list });
  };

  const handleToggleSkillCheck = (name: string) => {
    const list = [...(data.skills || [])];
    const idx = list.findIndex(s => (s?.name || '').toLowerCase() === name.toLowerCase());
    if (idx >= 0) {
      list[idx] = { ...list[idx], checked: !list[idx].checked };
    } else {
      list.push({ name, value: OFFICIAL_COC_SKILLS.find(s => s.name === name)?.base || 0, checked: true });
    }
    onUpdateData({ skills: list });
  };

  // Header Details
  const sub = data.subTitle || "";
  let age = "42";
  let occupation = "Journalist";
  const ageMatch = sub.match(/(\d+)\s*(?:jahre|years|a)/i);
  if (ageMatch) age = ageMatch[1];
  if (sub.toLowerCase().includes("journalist")) occupation = "Journalist / Reporter";
  else if (sub.toLowerCase().includes("bibliothekar")) occupation = "Bibliothekar / Gelehrter";
  else if (sub.toLowerCase().includes("arzt") || sub.toLowerCase().includes("doktor")) occupation = "Arzt / Mediziner";
  else if (sub.toLowerCase().includes("detektiv")) occupation = "Privatdetektiv";
  else if (sub.toLowerCase().includes("professor")) occupation = "Professor / Akademiker";
  else if (sub.includes(",")) occupation = sub.split(",")[0].trim();

  const is1920 = data.system === 'coc1920';
  const paperBgClass = paperStyle === 'parchment'
    ? 'bg-[#fbf7ee] text-[#1c1917] shadow-xl border border-[#d6c7a1]'
    : 'bg-white text-black shadow-lg border border-zinc-200';

  return (
    <>
      {/* PAGE 1: INVESTIGATOR IDENTITÄT, ATTRIBUTE, VITALWERTE & FERTIGKEITEN */}
      {(activePage === 'all' || activePage === 'page1') && (
        <div className={`printable-sheet max-w-[960px] mx-auto mb-8 p-6 md:p-8 rounded-xl font-serif text-[11px] leading-tight ${paperBgClass} print:m-0 print:p-4 print:border-none print:shadow-none print:w-full print:max-w-none`}>
          {/* ORNATE CTHULHU HEADER */}
          <div className="border-b-4 border-double border-[#2d3a27] pb-3 mb-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl md:text-2xl font-black uppercase tracking-[0.25em] font-display text-[#1b2716]">
                    CALL OF CTHULHU
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-[#2f3e2a] border border-[#445b3c] px-2 py-0.5 rounded font-mono font-bold bg-[#e8eedf]">
                    {is1920 ? "Die 1920er Jahre" : "7. Edition"} • Prüferbogen
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black font-display tracking-tight text-[#2d1e18] mt-1">
                  {isEditable ? (
                    <input
                      type="text"
                      value={data.name}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => onUpdateData({ name: e.target.value })}
                      className="bg-transparent border-b-2 border-[#8c7b60] hover:border-[#2d3a27] focus:border-[#1b2716] outline-none w-full max-w-md font-display font-black text-[#2d1e18]"
                      title="Investigator-Name bearbeiten"
                    />
                  ) : (
                    data.name
                  )}
                </h1>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] w-full md:w-auto">
                <div className="border-b border-[#a89b80] pb-0.5">
                  <span className="text-stone-500 uppercase block text-[8px] font-sans">Beruf</span>
                  <span className="font-bold text-stone-900">{occupation}</span>
                </div>
                <div className="border-b border-[#a89b80] pb-0.5">
                  <span className="text-stone-500 uppercase block text-[8px] font-sans">Alter</span>
                  <span className="font-bold text-stone-900">{age} Jahre</span>
                </div>
                <div className="border-b border-[#a89b80] pb-0.5">
                  <span className="text-stone-500 uppercase block text-[8px] font-sans">Geschlecht</span>
                  <span className="font-bold text-stone-900">Männlich</span>
                </div>
                <div className="border-b border-[#a89b80] pb-0.5">
                  <span className="text-stone-500 uppercase block text-[8px] font-sans">Wohnort</span>
                  <span className="font-bold text-stone-900">Boston / Arkham</span>
                </div>
              </div>
            </div>

            {/* Sub-header row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] mt-2 pt-2 border-t border-[#d8ccb4]">
              <div className="border-b border-[#c8bc9f] pb-0.5">
                <span className="text-stone-500 uppercase block text-[8px] font-sans">Geburtsort</span>
                <span className="font-bold text-stone-900">New England, USA</span>
              </div>
              <div className="border-b border-[#c8bc9f] pb-0.5">
                <span className="text-stone-500 uppercase block text-[8px] font-sans">Epoche</span>
                <span className="font-bold text-stone-900">{is1920 ? "Klassische 1920er" : "Gegenwart"}</span>
              </div>
              <div className="border-b border-[#c8bc9f] pb-0.5">
                <span className="text-stone-500 uppercase block text-[8px] font-sans">Arbeitgeber</span>
                <span className="font-bold text-stone-900">Boston Globe / Miskatonic</span>
              </div>
              <div className="border-b border-[#c8bc9f] pb-0.5">
                <span className="text-stone-500 uppercase block text-[8px] font-sans">Spieler</span>
                <span className="font-bold text-stone-900">Spieler</span>
              </div>
            </div>
          </div>

          {/* ATTRIBUTE GRID (TRIPLE VALUES: REGULAR / HALF / FIFTH) */}
          <div className="border-2 border-[#384832] rounded-lg p-3 bg-[#edf2e8]/60 shadow-xs mb-4">
            <div className="flex items-center justify-between border-b border-[#9eb097] pb-1 mb-2">
              <h2 className="text-xs font-black uppercase tracking-wider font-display text-[#1f2c1b] flex items-center gap-1.5">
                <BookOpen size={14} className="text-[#32452b]" />
                Charakteristische Attribute (Characteristics)
              </h2>
              <span className="text-[9px] text-[#42553b] font-sans">Dreifach-Werte: Regulär (100%) | Schwer (1/2) | Extrem (1/5)</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {Object.entries(charMap).map(([key, item]) => {
                const half = Math.floor(item.val / 2);
                const fifth = Math.floor(item.val / 5);
                return (
                  <div key={key} className="bg-white border-2 border-[#526848] rounded-md p-1.5 shadow-xs flex flex-col justify-between">
                    <div className="flex justify-between items-start border-b border-stone-200 pb-0.5 mb-1">
                      <span className="font-display font-black text-sm text-[#273720]">{item.label}</span>
                      <span className="text-[8px] text-stone-500 uppercase">{item.sub}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      {/* Big Regular Value */}
                      <div className="w-11">
                        {isEditable ? (
                          <input
                            type="number"
                            min={1}
                            max={99}
                            value={item.val}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => {
                              const v = parseInt(e.target.value, 10);
                              if (!isNaN(v)) handleUpdateChar(key, v);
                            }}
                            className="w-full text-center font-black text-base bg-stone-50 border border-[#8da382] rounded outline-none focus:bg-[#edf5e8]"
                          />
                        ) : (
                          <span className="block text-center font-black text-base text-stone-900">{item.val}</span>
                        )}
                      </div>

                      {/* Small Half and Fifth Values */}
                      <div className="flex flex-col gap-0.5 text-[9px] font-mono font-bold text-[#35482e]">
                        <div className="w-6 h-3.5 bg-[#eaf1e5] border border-[#a1b897] rounded flex items-center justify-center" title="Schwerer Erfolg (1/2)">
                          {half}
                        </div>
                        <div className="w-6 h-3.5 bg-[#dbe6d5] border border-[#8ba380] rounded flex items-center justify-center text-[#1c2a17]" title="Extremer Erfolg (1/5)">
                          {fifth}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* VITALWERTE: TP, STABILITÄT, GLÜCK, MAGIEPUNKTE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {/* TREFFERPUNKTE */}
            <div className="border-2 border-[#6d2828] rounded-lg p-2.5 bg-[#fcf2f2] shadow-xs">
              <div className="flex items-center justify-between border-b border-red-200 pb-1 mb-1.5">
                <span className="font-bold text-xs uppercase tracking-wide text-red-950 flex items-center gap-1">
                  <Heart size={13} className="text-red-700" />
                  Trefferpunkte (TP)
                </span>
                <span className="text-[9px] font-mono text-stone-500">Max: {maxHp}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-center">
                  <span className="text-[8px] uppercase text-stone-500 block">Aktuell</span>
                  <span className="font-black text-lg text-red-950">{currentHp}</span>
                </div>
                <div className="text-center">
                  <span className="text-[8px] uppercase text-stone-500 block">Wunden</span>
                  <span className="font-bold text-sm text-red-700">{hpDamage}</span>
                </div>
                <div className="text-center">
                  <span className="text-[8px] uppercase text-stone-500 block">Schwere Wunde</span>
                  <span className="font-bold text-xs text-stone-700">Ab {Math.floor(maxHp / 2)}</span>
                </div>
              </div>
              <div className="flex justify-between text-[8px] text-stone-600 border-t border-red-200 pt-1">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" className="h-2.5 w-2.5 accent-red-700" />
                  <span>Bewusstlos</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" className="h-2.5 w-2.5 accent-red-700" />
                  <span>Schwere Wunde</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" className="h-2.5 w-2.5 accent-red-700" />
                  <span>Sterbend</span>
                </label>
              </div>
            </div>

            {/* STABILITÄT (SANITY) */}
            <div className="border-2 border-[#1e3a5f] rounded-lg p-2.5 bg-[#eff5fc] shadow-xs">
              <div className="flex items-center justify-between border-b border-blue-200 pb-1 mb-1.5">
                <span className="font-bold text-xs uppercase tracking-wide text-blue-950 flex items-center gap-1">
                  <Eye size={13} className="text-blue-700" />
                  Stabilität (GGS)
                </span>
                <span className="text-[9px] font-mono text-stone-500">Max: {maxSan}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-center">
                  <span className="text-[8px] uppercase text-stone-500 block">Aktuell</span>
                  <span className="font-black text-lg text-blue-950">{currentSan}</span>
                </div>
                <div className="text-center">
                  <span className="text-[8px] uppercase text-stone-500 block">Startwert</span>
                  <span className="font-bold text-sm text-stone-700">{ma}</span>
                </div>
                <div className="text-center">
                  <span className="text-[8px] uppercase text-stone-500 block">Wahnsinn</span>
                  <span className="font-bold text-xs text-red-700">Täglich ≥ {Math.floor(currentSan / 5)}</span>
                </div>
              </div>
              <div className="flex justify-between text-[8px] text-stone-600 border-t border-blue-200 pt-1">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" className="h-2.5 w-2.5 accent-blue-700" />
                  <span>Zeitweilig</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" className="h-2.5 w-2.5 accent-blue-700" />
                  <span>Unheilbar</span>
                </label>
              </div>
            </div>

            {/* GLÜCK (LUCK) */}
            <div className="border-2 border-[#5c4a16] rounded-lg p-2.5 bg-[#fdf9ea] shadow-xs">
              <div className="flex items-center justify-between border-b border-amber-200 pb-1 mb-1.5">
                <span className="font-bold text-xs uppercase tracking-wide text-amber-950 flex items-center gap-1">
                  <Sparkles size={13} className="text-amber-700" />
                  Glück (Luck)
                </span>
                <span className="text-[9px] font-mono text-stone-500">0 - 99</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-center w-full">
                  <span className="text-[8px] uppercase text-stone-500 block">Aktuelles Glück</span>
                  <span className="font-black text-2xl text-amber-950">{currentLuck}</span>
                </div>
              </div>
              <div className="text-[8px] text-stone-600 border-t border-amber-200 pt-1 text-center italic">
                Glückspunkte können ausgegeben werden, um Probenwürfe zu modifizieren.
              </div>
            </div>

            {/* MAGIEPUNKTE & KAMPFDATEN */}
            <div className="border-2 border-[#2d3a27] rounded-lg p-2.5 bg-[#eef3ea] shadow-xs">
              <div className="flex items-center justify-between border-b border-[#a1b897] pb-1 mb-1.5">
                <span className="font-bold text-xs uppercase tracking-wide text-[#1f2c1b] flex items-center gap-1">
                  <Crosshair size={13} className="text-[#32452b]" />
                  Kampf & Physis
                </span>
                <span className="text-[9px] font-mono text-stone-500">MP: {currentMp}/{maxMp}</span>
              </div>
              <div className="grid grid-cols-4 gap-1 text-center">
                <div className="bg-white border border-[#9eb097] rounded p-1">
                  <span className="text-[7px] uppercase block text-stone-500">SchB</span>
                  <span className="font-bold text-xs text-[#2d1e18]">{damageBonus}</span>
                </div>
                <div className="bg-white border border-[#9eb097] rounded p-1">
                  <span className="text-[7px] uppercase block text-stone-500">Statur</span>
                  <span className="font-bold text-xs text-[#2d1e18]">{build}</span>
                </div>
                <div className="bg-white border border-[#9eb097] rounded p-1">
                  <span className="text-[7px] uppercase block text-stone-500">Ausweichen</span>
                  <span className="font-bold text-xs text-[#2d1e18]">{Math.floor(ge / 2)}%</span>
                </div>
                <div className="bg-white border border-[#9eb097] rounded p-1">
                  <span className="text-[7px] uppercase block text-stone-500">Bewegung</span>
                  <span className="font-bold text-xs text-[#2d1e18]">{mov}</span>
                </div>
              </div>
              <div className="text-[8px] text-stone-600 border-t border-[#a1b897] pt-1 mt-1.5 text-center">
                ST+GR = {strPlusSiz} • Ausweichen (Schwer {Math.floor(ge / 4)}% / Extrem {Math.floor(ge / 10)}%)
              </div>
            </div>
          </div>

         {/* FERTIGKEITENLISTE */}
<CoCSkillsBlock
  mergedSkills={skillsMerged}
  isEditable={isEditable}
  onUpdateSkill={handleUpdateSkill}
  onToggleCheck={handleToggleSkillCheck}
  printMode={false}
/>

          {/* WAFFEN & KAMPF-ARSENAL */}
          <div className="border-2 border-[#2d3a27] rounded-lg p-3 bg-[#edf2e8]/60 shadow-xs">
            <div className="flex items-center justify-between border-b-2 border-[#2d3a27] pb-1 mb-2">
              <h2 className="text-xs font-black uppercase tracking-wider font-display text-[#1b2716] flex items-center gap-1.5">
                <Crosshair size={14} className="text-[#32452b]" />
                Waffen & Verteidigung
              </h2>
              <span className="text-[9px] text-stone-500 font-sans">Extreme Erfolge verursachen Impalement / maximalen Schaden</span>
            </div>

            <div className="space-y-1.5">
              {/* Melee */}
              {((data.weapons?.melee || []) as Weapon[]).map((weapon, idx) => (
                <div key={idx} className="bg-white border border-stone-300 rounded p-2 text-xs">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 border-b border-stone-200 pb-1 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900 text-sm">{weapon.name}</span>
                      <span className="text-[8px] uppercase px-1.5 py-0.2 bg-stone-100 border border-stone-300 rounded text-stone-600">Nahkampf</span>
                    </div>
                    <div className="flex items-center gap-3 text-stone-700 font-mono text-[10px]">
                      <span>Erfolgswert: <strong className="text-[#2d3a27]">{weapon.attack}</strong></span>
                      <span>Schaden: <strong>{weapon.damage}</strong></span>
                      <span>Kritisch/Extrem: <strong>{weapon.critical}</strong></span>
                    </div>
                  </div>
                  <p className="text-[10px] text-stone-600 italic">{weapon.note}</p>
                </div>
              ))}

              {/* Ranged */}
              {((data.weapons?.ranged || []) as Weapon[]).map((weapon, idx) => (
                <div key={idx} className="bg-white border border-stone-300 rounded p-2 text-xs">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 border-b border-stone-200 pb-1 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900 text-sm">{weapon.name}</span>
                      <span className="text-[8px] uppercase px-1.5 py-0.2 bg-stone-100 border border-stone-300 rounded text-stone-600">Schusswaffe</span>
                    </div>
                    <div className="flex items-center gap-3 text-stone-700 font-mono text-[10px]">
                      <span>Erfolgswert: <strong className="text-[#2d3a27]">{weapon.attack}</strong></span>
                      <span>Schaden: <strong>{weapon.damage}</strong></span>
                      <span>Reichweite: <strong>{weapon.range || "15m"}</strong></span>
                      <span>Angriffe: <strong>{weapon.attacks || "1(3)"}</strong></span>
                      <span>Fehlfunktion: <strong>{weapon.malfunction || "00"}</strong></span>
                    </div>
                  </div>
                  <p className="text-[10px] text-stone-600 italic">{weapon.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PAGE 2: HINTERGRUND, FINANZEN & BESITZTÜMER */}
      {(activePage === 'all' || activePage === 'page2') && (
        <div className={`printable-sheet max-w-[960px] mx-auto p-6 md:p-8 rounded-xl font-serif text-[11px] leading-tight ${paperBgClass} print:m-0 print:p-4 print:border-none print:shadow-none print:w-full print:max-w-none print:break-before-page`}>
          {/* HEADER PAGE 2 */}
          <div className="border-b-2 border-[#2d3a27] pb-2 mb-4 flex justify-between items-center">
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-[#3d5035] font-sans">
                Call of Cthulhu • Seite 2 • Akte des Prüfers
              </span>
              <h2 className="text-xl font-bold font-display text-stone-900">
                {data.name} — Hintergrund, Finanzen & Erlebnisse
              </h2>
            </div>
            <span className="text-[10px] font-mono text-stone-600">{occupation}, {age} Jahre</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* LEFT COLUMN: BACKSTORY & PSYCHOLOGICAL PROFILE (6 Cols) */}
            <div className="lg:col-span-6 space-y-4">
              <div className="border-2 border-[#2d3a27] rounded-lg p-3 bg-[#edf2e8]/60 shadow-xs space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider font-display text-[#1b2716] border-b border-[#a1b897] pb-1">
                  Persönliche Beschreibung & Hintergrund
                </h3>
                
                <div>
                  <strong className="text-[10px] uppercase text-stone-600 block">Ideologie / Glaube</strong>
                  <p className="text-stone-800 text-[10px] italic">
                    Rationalist und Wahrheitssucher. Glaubt fest an die Kraft der freien Presse und an faktenbasierte Aufklärung der Öffentlichkeit.
                  </p>
                </div>

                <div>
                  <strong className="text-[10px] uppercase text-stone-600 block">Wichtige Personen & Kontakte</strong>
                  <div className="space-y-1 mt-1">
                    {(data.party || []).map((p, idx) => (
                      <div key={idx} className="bg-white border border-stone-300 rounded p-1.5 text-[10px] flex justify-between">
                        <span className="font-bold text-stone-900">{p.name}</span>
                        <span className="text-stone-600">{p.occupation || "Gefährte"} ({p.playerName || "Alliierter"})</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <strong className="text-[10px] uppercase text-stone-600 block">Bedeutende Orte & Kostbare Besitztümer</strong>
                  <p className="text-stone-800 text-[10px]">
                    Das Zeitungsarchiv der Boston Gazette; eine geerbte silberne Taschenuhr seines Großvaters mit feiner Gravur.
                  </p>
                </div>

                <div>
                  <strong className="text-[10px] uppercase text-stone-600 block">Verletzungen, Phobien & Manien</strong>
                  <div className="p-2 bg-red-50 border border-red-200 rounded text-red-950 text-[10px]">
                    Leichte Klaustrophobie nach dem Einsturz des alten Bibliothekskellers. Zögert beim Betreten enger, dunkler Gewölbe.
                  </div>
                </div>

                <div>
                  <strong className="text-[10px] uppercase text-stone-600 block">Begegnungen mit seltsamen Wesenheiten & Folianten</strong>
                  <div className="p-2 bg-stone-100 border border-stone-300 rounded text-stone-800 text-[10px]">
                    Fragmente des "Unaussprechliche Kulte"; kryptische Zeichnungen von Froschmenschen an der Küste von Innsmouth.
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: FINANCES, EQUIPMENT & NOTES (6 Cols) */}
            <div className="lg:col-span-6 space-y-4">
              {/* FINANZEN & VERMÖGEN */}
              <div className="border-2 border-[#5c4a16] rounded-lg p-3 bg-[#fdf9ea] shadow-xs">
                <div className="flex items-center justify-between border-b border-amber-300 pb-1 mb-2">
                  <h3 className="text-xs font-black uppercase tracking-wider font-display text-amber-950 flex items-center gap-1.5">
                    <DollarSign size={14} className="text-amber-800" />
                    Finanzen & Ausgaben-Niveau
                  </h3>
                  <span className="text-[9px] font-mono text-stone-600">Währung: US Dollar ($)</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs mb-2">
                  <div className="bg-white border border-stone-300 rounded p-1.5">
                    <span className="text-[8px] uppercase text-stone-500 block">Ausgaben-Niveau</span>
                    <span className="font-bold text-stone-900">$10 / Tag</span>
                  </div>
                  <div className="bg-white border border-stone-300 rounded p-1.5">
                    <span className="text-[8px] uppercase text-stone-500 block">Bargeld</span>
                    <span className="font-black text-amber-950">${data.currency?.amount || 1400}</span>
                  </div>
                  <div className="bg-white border border-stone-300 rounded p-1.5">
                    <span className="text-[8px] uppercase text-stone-500 block">Vermögen</span>
                    <span className="font-bold text-stone-900">$14.000</span>
                  </div>
                </div>

                <p className="text-[9px] text-stone-600 italic text-center">
                  Bargeld und Reiseschecks decken Reisekosten, Hotelaufenthalte und Recherchen ab.
                </p>
              </div>

              {/* AUSRÜSTUNG & BESITZTÜMER */}
              <div className="border-2 border-[#2d3a27] rounded-lg p-3 bg-[#edf2e8]/60 shadow-xs">
                <div className="flex items-center justify-between border-b border-[#a1b897] pb-1 mb-2">
                  <h3 className="text-xs font-black uppercase tracking-wider font-display text-[#1b2716]">
                    Ausrüstung & Gepäck
                  </h3>
                </div>

                <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                  {((data.abilities || []).filter(a => a.type === 'item') as Ability[]).map((item, idx) => (
                    <div key={idx} className="bg-white border border-stone-300 rounded p-1.5 text-xs flex items-center justify-between">
                      <div>
                        <strong className="font-medium text-stone-900">{item.name}</strong>
                        <span className="text-stone-500 text-[10px] ml-2">({item.effect})</span>
                      </div>
                    </div>
                  ))}
                  <div className="p-2 bg-white border border-stone-300 rounded text-stone-700 text-[10px] space-y-1">
                    <p>• Notizbuch & Füllfederhalter (mit Ersatz-Tintenfässchen)</p>
                    <p>• Elektrische Stabtaschenlampe (mit Ersatzbatterien)</p>
                    <p>• Lupe, Reisekamera mit 12 Fotoplatten</p>
                    <p>• Bostoner Stadtplan, Eisenbahn-Fahrplan New England</p>
                    <p>• Ledertasche mit Ersatzkleidung und Erste-Hilfe-Verbandszeug</p>
                  </div>
                </div>
              </div>

              {/* ERMITTLER-NOTIZEN */}
              <div className="border-2 border-[#2d3a27] rounded-lg p-3 bg-[#edf2e8]/60 shadow-xs">
                <h3 className="text-xs font-black uppercase tracking-wider font-display text-[#1b2716] border-b border-[#a1b897] pb-1 mb-2">
                  Ermittler-Notizen & Verdachtsmomente
                </h3>
                <textarea
                  defaultValue="Mitteilungen der Miskatonic University deuten auf Einbrüche in der Sonderabteilung hin. Das seltsame Amulett mit Fischmotiven muss genauer auf Herkunft untersucht werden."
                  disabled={!isEditable}
                  rows={4}
                  className="w-full bg-white border border-stone-300 rounded p-1.5 text-xs font-serif text-stone-800 focus:outline-none focus:border-[#2d3a27]"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
