import React, { FC, useMemo, ChangeEvent } from "react";
import { 
  Shield, 
  Zap, 
  Cpu, 
  Crosshair, 
  Activity, 
  Terminal, 
  Layers, 
  DollarSign, 
  AlertOctagon,
  Eye
} from "lucide-react";
import { 
  Skill, 
  Weapon, 
  Ability,
  Stat,
  ShadowrunBodyMod,
  InventoryItem
} from "../../types";
import { calculateShadowrunLimits } from "../../utils/limits";
import { syncInventoryToWeapons, initializeCharacterInventory, extractDailyUsesFromText } from "../../utils/inventorySync";
import { SheetProps } from "./types";

export const ShadowrunSheet: FC<SheetProps> = ({
  data,
  onUpdateData,
  isEditable,
  paperStyle,
  activePage
}) => {
  // Extract attributes
  const getCharVal = (keys: string[], defaultVal = 3): number => {
    if (!data.characteristics) return defaultVal;
    const item = data.characteristics.find(c => 
      keys.some(k => (c.label || "").toLowerCase() === k.toLowerCase() || (c.label || "").toLowerCase().includes(k.toLowerCase()))
    );
    if (!item) return defaultVal;
    const num = typeof item.value === 'number' ? item.value : parseInt(item.value.toString().replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? defaultVal : num;
  };

  const kon = getCharVal(["KON", "Konstitution", "Body"], 4);
  const ges = getCharVal(["GES", "Geschicklichkeit", "Agility"], 7);
  const rea = getCharVal(["REA", "Reaktion", "Reaction"], 5);
  const sta = getCharVal(["STÄ", "Stärke", "Strength"], 3);
  const wil = getCharVal(["WIL", "Willenskraft", "Willpower"], 5);
  const log = getCharVal(["LOG", "Logik", "Logic"], 6);
  const intVal = getCharVal(["INT", "Intuition"], 5);
  const cha = getCharVal(["CHA", "Charisma"], 3);

  const getStatVal = (keys: string[], defaultVal = 0): number => {
    if (!data.stats) return defaultVal;
    const item = data.stats.find(s => 
      keys.some(k => (s.label || "").toLowerCase().includes(k.toLowerCase()))
    );
    if (!item) return defaultVal;
    const num = typeof item.value === 'number' ? item.value : parseFloat(item.value.toString().replace(/,/g, '.'));
    return isNaN(num) ? defaultVal : num;
  };

  const getStatDmg = (keys: string[]): number => {
    if (!data.stats) return 0;
    const item = data.stats.find(s => 
      keys.some(k => (s.label || "").toLowerCase().includes(k.toLowerCase()))
    );
    return item?.damage || 0;
  };

  const updateStatDamage = (keys: string[], newDmg: number) => {
    const list = [...(data.stats || [])];
    const idx = list.findIndex(s => keys.some(k => (s.label || "").toLowerCase().includes(k.toLowerCase())));
    if (idx >= 0) {
      list[idx] = { ...list[idx], damage: newDmg };
      onUpdateData({ stats: list });
    }
  };

  const edge = getStatVal(["edge"], 4);
  const essence = getStatVal(["essenz", "essence"], 4.88);
  const karmaCurrent = getStatVal(["karma"], 12);
  const karmaTotal = getStatVal(["karma gesamt", "total karma"], 45);
  const armor = getStatVal(["panzerung", "armor"], 13);
  const initiative = data.stats?.find(s => (s.label || "").toLowerCase().includes("initiative"))?.value || `${rea + intVal} + 1W6`;

  // Limits calculation
  const limits = calculateShadowrunLimits(data.characteristics || [], data.stats || []);

  // Condition Monitors (Standard SR5 formula: 8 + Math.ceil(Stat/2))
  const physicalMaxBoxes = 8 + Math.ceil(kon / 2);
  const physicalDamage = getStatDmg(["körperlicher schaden", "körperlich", "physical"]);
  const physicalPenalty = Math.floor(physicalDamage / 3);

  const stunMaxBoxes = 8 + Math.ceil(wil / 2);
  const stunDamage = getStatDmg(["geistiger schaden", "geistig", "stun"]);
  const stunPenalty = Math.floor(stunDamage / 3);

  const totalWoundPenalty = physicalPenalty + stunPenalty;

  // Cyberdeck
  const deck = data.cyberdeck;

  // Body Mods
  const bodyMods: ShadowrunBodyMod[] = data.bodyMods || [];

  // Inventory & Equipped Gear
  const inventoryItems = useMemo(() => {
    return data.inventory && data.inventory.length > 0 ? data.inventory : initializeCharacterInventory(data);
  }, [data.inventory, data.weapons, data.abilities]);

  const equippedGear = useMemo(() => {
    return inventoryItems.filter(i => i.status !== 'stored');
  }, [inventoryItems]);

  const storedGear = useMemo(() => {
    return inventoryItems.filter(i => i.status === 'stored');
  }, [inventoryItems]);

  // Active weapons (synced from equipped inventory items, fallback to data.weapons)
  const activeWeapons = useMemo(() => {
    if (data.inventory && data.inventory.length > 0) {
      const synced = syncInventoryToWeapons(data.inventory);
      if (synced.melee.length > 0 || synced.ranged.length > 0) {
        return [...synced.melee, ...synced.ranged];
      }
    }
    return [...(data.weapons?.melee || []), ...(data.weapons?.ranged || [])];
  }, [data.inventory, data.weapons]);

  const handleUpdateChar = (label: string, newVal: number) => {
    const list = data.characteristics ? [...data.characteristics] : [];
    const idx = list.findIndex(c => (c?.label || "").toUpperCase() === (label || "").toUpperCase());
    if (idx >= 0) {
      list[idx] = { ...list[idx], value: newVal };
    } else {
      list.push({ label, value: newVal });
    }
    onUpdateData({ characteristics: list });
  };

  const paperBgClass = paperStyle === 'parchment'
    ? 'bg-[#f7f5f0] text-zinc-900 shadow-xl border border-zinc-300'
    : 'bg-white text-black shadow-lg border border-zinc-200';

  return (
    <>
      {/* PAGE 1: RUNNER PROFILE, ATTRIBUTES, CONDITION MONITORS & COMBAT */}
      {(activePage === 'all' || activePage === 'page1') && (
        <div className={`printable-sheet max-w-[960px] mx-auto mb-8 p-6 md:p-8 rounded-xl font-sans text-[11px] leading-tight ${paperBgClass} print:m-0 print:p-4 print:border-none print:shadow-none print:w-full print:max-w-none`}>
          {/* CYBERPUNK RUNNER HEADER */}
          <div className="border-b-4 border-zinc-900 pb-3 mb-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl md:text-2xl font-black uppercase tracking-[0.25em] font-mono text-zinc-900 flex items-center gap-1.5">
                    <Terminal size={20} className="text-orange-600" />
                    SHADOWRUN
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-zinc-700 border border-zinc-500 px-2 py-0.5 rounded font-mono font-bold bg-zinc-100">
                    Runner-Akte • 5E / 6E Matrix Profile
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-zinc-950 font-mono mt-1">
                  {isEditable ? (
                    <input
                      type="text"
                      value={data.name}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => onUpdateData({ name: e.target.value })}
                      className="bg-transparent border-b-2 border-orange-500 outline-none w-full max-w-md font-mono font-black text-zinc-950"
                      title="Straßenname bearbeiten"
                    />
                  ) : (
                    data.name
                  )}
                </h1>
                <div className="text-xs text-orange-700 font-mono font-bold mt-0.5">
                  {data.subTitle || "Street-Samurai & Hacker"}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] w-full md:w-auto font-mono">
                <div className="border-b border-zinc-300 pb-0.5">
                  <span className="text-zinc-500 uppercase block text-[8px]">Metatyp</span>
                  <span className="font-bold text-zinc-900">Mensch</span>
                </div>
                <div className="border-b border-zinc-300 pb-0.5">
                  <span className="text-zinc-500 uppercase block text-[8px]">Karma</span>
                  <span className="font-bold text-orange-700">{karmaCurrent} / {karmaTotal}</span>
                </div>
                <div className="border-b border-zinc-300 pb-0.5">
                  <span className="text-zinc-500 uppercase block text-[8px]">Nuyen (¥)</span>
                  <span className="font-bold text-emerald-800">{data.currency?.amount || 12450} ¥</span>
                </div>
                <div className="border-b border-zinc-300 pb-0.5">
                  <span className="text-zinc-500 uppercase block text-[8px]">Street Cred / Bad Rep</span>
                  <span className="font-bold text-zinc-900">3 / 0</span>
                </div>
              </div>
            </div>

            {/* Sub Header */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] mt-2 pt-2 border-t border-zinc-200 font-mono">
              <div>
                <span className="text-zinc-500 uppercase block text-[8px]">Echter Name / SIN</span>
                <span className="font-bold text-zinc-800">Kaelen Hawke (UCAS)</span>
              </div>
              <div>
                <span className="text-zinc-500 uppercase block text-[8px]">Initiative</span>
                <span className="font-bold text-zinc-900">{initiative}</span>
              </div>
              <div>
                <span className="text-zinc-500 uppercase block text-[8px]">Panzerung</span>
                <span className="font-bold text-blue-800">{armor} (Panzerjacke)</span>
              </div>
              <div>
                <span className="text-zinc-500 uppercase block text-[8px]">Wundabzug</span>
                <span className={`font-bold ${totalWoundPenalty > 0 ? 'text-red-600' : 'text-zinc-600'}`}>
                  {totalWoundPenalty > 0 ? `-${totalWoundPenalty} Würfel` : 'Kein Abzug'}
                </span>
              </div>
            </div>
          </div>

          {/* ATTRIBUTES & LIMITS (KÖRPERLICH & GEISTIG) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
            {/* 8 CORE ATTRIBUTES (8 Cols) */}
            <div className="lg:col-span-8 border-2 border-zinc-800 rounded-lg p-3 bg-zinc-50 shadow-xs">
              <div className="flex items-center justify-between border-b border-zinc-300 pb-1 mb-2">
                <h2 className="text-xs font-black uppercase tracking-wider font-mono text-zinc-900 flex items-center gap-1.5">
                  <Zap size={14} className="text-orange-600" />
                  Attribute (Primary Attributes)
                </h2>
                <span className="text-[9px] text-zinc-500 font-mono">Körperlich • Geistig • Spezial</span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 text-center">
                {/* Physical */}
                <div className="bg-white border-2 border-zinc-700 rounded p-1">
                  <span className="text-[8px] font-mono uppercase text-zinc-500 block">KON</span>
                  {isEditable ? (
                    <input
                      type="number"
                      value={kon}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => handleUpdateChar("KON", parseInt(e.target.value, 10) || 1)}
                      className="w-full text-center font-black font-mono text-base bg-transparent outline-none"
                    />
                  ) : (
                    <span className="font-black font-mono text-base text-zinc-900">{kon}</span>
                  )}
                  <span className="text-[7px] text-zinc-400 block">Body</span>
                </div>

                <div className="bg-white border-2 border-zinc-700 rounded p-1">
                  <span className="text-[8px] font-mono uppercase text-zinc-500 block">GES</span>
                  {isEditable ? (
                    <input
                      type="number"
                      value={ges}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => handleUpdateChar("GES", parseInt(e.target.value, 10) || 1)}
                      className="w-full text-center font-black font-mono text-base bg-transparent outline-none"
                    />
                  ) : (
                    <span className="font-black font-mono text-base text-zinc-900">{ges}</span>
                  )}
                  <span className="text-[7px] text-zinc-400 block">Agility</span>
                </div>

                <div className="bg-white border-2 border-zinc-700 rounded p-1">
                  <span className="text-[8px] font-mono uppercase text-zinc-500 block">REA</span>
                  {isEditable ? (
                    <input
                      type="number"
                      value={rea}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => handleUpdateChar("REA", parseInt(e.target.value, 10) || 1)}
                      className="w-full text-center font-black font-mono text-base bg-transparent outline-none"
                    />
                  ) : (
                    <span className="font-black font-mono text-base text-zinc-900">{rea}</span>
                  )}
                  <span className="text-[7px] text-zinc-400 block">Reaction</span>
                </div>

                <div className="bg-white border-2 border-zinc-700 rounded p-1">
                  <span className="text-[8px] font-mono uppercase text-zinc-500 block">STÄ</span>
                  {isEditable ? (
                    <input
                      type="number"
                      value={sta}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => handleUpdateChar("STÄ", parseInt(e.target.value, 10) || 1)}
                      className="w-full text-center font-black font-mono text-base bg-transparent outline-none"
                    />
                  ) : (
                    <span className="font-black font-mono text-base text-zinc-900">{sta}</span>
                  )}
                  <span className="text-[7px] text-zinc-400 block">Strength</span>
                </div>

                {/* Mental */}
                <div className="bg-white border-2 border-zinc-700 rounded p-1">
                  <span className="text-[8px] font-mono uppercase text-zinc-500 block">WIL</span>
                  {isEditable ? (
                    <input
                      type="number"
                      value={wil}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => handleUpdateChar("WIL", parseInt(e.target.value, 10) || 1)}
                      className="w-full text-center font-black font-mono text-base bg-transparent outline-none"
                    />
                  ) : (
                    <span className="font-black font-mono text-base text-zinc-900">{wil}</span>
                  )}
                  <span className="text-[7px] text-zinc-400 block">Willpower</span>
                </div>

                <div className="bg-white border-2 border-zinc-700 rounded p-1">
                  <span className="text-[8px] font-mono uppercase text-zinc-500 block">LOG</span>
                  {isEditable ? (
                    <input
                      type="number"
                      value={log}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => handleUpdateChar("LOG", parseInt(e.target.value, 10) || 1)}
                      className="w-full text-center font-black font-mono text-base bg-transparent outline-none"
                    />
                  ) : (
                    <span className="font-black font-mono text-base text-zinc-900">{log}</span>
                  )}
                  <span className="text-[7px] text-zinc-400 block">Logic</span>
                </div>

                <div className="bg-white border-2 border-zinc-700 rounded p-1">
                  <span className="text-[8px] font-mono uppercase text-zinc-500 block">INT</span>
                  {isEditable ? (
                    <input
                      type="number"
                      value={intVal}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => handleUpdateChar("INT", parseInt(e.target.value, 10) || 1)}
                      className="w-full text-center font-black font-mono text-base bg-transparent outline-none"
                    />
                  ) : (
                    <span className="font-black font-mono text-base text-zinc-900">{intVal}</span>
                  )}
                  <span className="text-[7px] text-zinc-400 block">Intuition</span>
                </div>

                <div className="bg-white border-2 border-zinc-700 rounded p-1">
                  <span className="text-[8px] font-mono uppercase text-zinc-500 block">CHA</span>
                  {isEditable ? (
                    <input
                      type="number"
                      value={cha}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => handleUpdateChar("CHA", parseInt(e.target.value, 10) || 1)}
                      className="w-full text-center font-black font-mono text-base bg-transparent outline-none"
                    />
                  ) : (
                    <span className="font-black font-mono text-base text-zinc-900">{cha}</span>
                  )}
                  <span className="text-[7px] text-zinc-400 block">Charisma</span>
                </div>
              </div>

              {/* SPECIAL ATTRIBUTES: EDGE & ESSENCE */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 pt-2 border-t border-zinc-200 text-center font-mono">
                <div className="bg-zinc-100 border border-zinc-300 rounded p-1">
                  <span className="text-[8px] uppercase text-zinc-500 block">EDGE</span>
                  <span className="font-black text-sm text-orange-600">{edge}</span>
                </div>
                <div className="bg-zinc-100 border border-zinc-300 rounded p-1">
                  <span className="text-[8px] uppercase text-zinc-500 block">ESSENZ</span>
                  <span className="font-black text-sm text-zinc-800">{essence} / 6.00</span>
                </div>
                <div className="bg-zinc-100 border border-zinc-300 rounded p-1">
                  <span className="text-[8px] uppercase text-zinc-500 block">VERTEIDIGUNG</span>
                  <span className="font-bold text-sm text-zinc-900">{rea + intVal} (REA+INT)</span>
                </div>
                <div className="bg-zinc-100 border border-zinc-300 rounded p-1">
                  <span className="text-[8px] uppercase text-zinc-500 block">SCHADENSWIDERSTAND</span>
                  <span className="font-bold text-sm text-blue-800">{kon + armor} (KON+PZ)</span>
                </div>
              </div>
            </div>

            {/* LIMITS (4 Cols) */}
            <div className="lg:col-span-4 border-2 border-zinc-800 rounded-lg p-3 bg-zinc-50 shadow-xs flex flex-col justify-between font-mono">
              <div className="flex items-center justify-between border-b border-zinc-300 pb-1 mb-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
                  <Shield size={14} className="text-zinc-800" />
                  Inhärente Limits
                </h3>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center bg-white border border-zinc-300 rounded p-1.5">
                  <span className="font-bold text-zinc-800">Körperlich</span>
                  <span className="font-black text-sm bg-zinc-800 text-amber-300 px-2 py-0.5 rounded">
                    {limits.physicalTotal}
                  </span>
                </div>
                <div className="flex justify-between items-center bg-white border border-zinc-300 rounded p-1.5">
                  <span className="font-bold text-zinc-800">Geistig</span>
                  <span className="font-black text-sm bg-zinc-800 text-amber-300 px-2 py-0.5 rounded">
                    {limits.mentalTotal}
                  </span>
                </div>
                <div className="flex justify-between items-center bg-white border border-zinc-300 rounded p-1.5">
                  <span className="font-bold text-zinc-800">Sozial</span>
                  <span className="font-black text-sm bg-zinc-800 text-amber-300 px-2 py-0.5 rounded">
                    {limits.socialTotal}
                  </span>
                </div>
              </div>
              <span className="text-[8px] text-zinc-500 mt-2 block text-center">
                Maximal anrechenbare Erfolge pro Beprobung.
              </span>
            </div>
          </div>

          {/* CONDITION MONITORS (KÖRPERLICHER & GEISTIGER SCHADEN) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Physical Monitor */}
            <div className="border-2 border-red-900 rounded-lg p-3 bg-red-50/40 shadow-xs font-mono">
              <div className="flex justify-between items-center border-b border-red-300 pb-1 mb-2">
                <h3 className="text-xs font-black uppercase text-red-950 flex items-center gap-1.5">
                  <Activity size={14} className="text-red-700" />
                  Körperlicher Zustandsmonitor
                </h3>
                <span className="text-[10px] font-bold text-red-900">
                  {physicalDamage} / {physicalMaxBoxes} Schaden (Malus: -{physicalPenalty})
                </span>
              </div>

              {/* Interactive Boxes */}
              <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5 mb-2">
                {Array.from({ length: physicalMaxBoxes }).map((_, i) => {
                  const isMarked = i < physicalDamage;
                  const boxPenalty = Math.floor((i + 1) / 3);
                  const isPenaltyThreshold = (i + 1) % 3 === 0;
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={!isEditable}
                      onClick={() => updateStatDamage(["körperlicher schaden", "körperlich"], isMarked ? i : i + 1)}
                      className={`h-7 border-2 rounded flex flex-col items-center justify-center transition-all ${
                        isMarked 
                          ? 'bg-red-700 text-white border-red-900 shadow-inner' 
                          : 'bg-white text-zinc-600 border-red-300 hover:border-red-600'
                      }`}
                      title={`Kästchen ${i + 1}${isPenaltyThreshold ? ` (Wundabzug -${boxPenalty})` : ''}`}
                    >
                      <span className="text-[8px] font-bold">{i + 1}</span>
                      {isPenaltyThreshold && (
                        <span className="text-[7px] text-red-400 font-bold leading-none">-{boxPenalty}</span>
                      )}
                    </button>
                  );
                })}
              </div>
              <span className="text-[8px] text-zinc-600 italic">
                -1 Würfel auf alle Proben pro angefangene 3 Kästchen Schaden. Bei {physicalMaxBoxes} droht K.O. und Verbluten.
              </span>
            </div>

            {/* Stun Monitor */}
            <div className="border-2 border-blue-900 rounded-lg p-3 bg-blue-50/40 shadow-xs font-mono">
              <div className="flex justify-between items-center border-b border-blue-300 pb-1 mb-2">
                <h3 className="text-xs font-black uppercase text-blue-950 flex items-center gap-1.5">
                  <Activity size={14} className="text-blue-700" />
                  Geistiger Zustandsmonitor (Betäubung)
                </h3>
                <span className="text-[10px] font-bold text-blue-900">
                  {stunDamage} / {stunMaxBoxes} Schaden (Malus: -{stunPenalty})
                </span>
              </div>

              {/* Interactive Boxes */}
              <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5 mb-2">
                {Array.from({ length: stunMaxBoxes }).map((_, i) => {
                  const isMarked = i < stunDamage;
                  const boxPenalty = Math.floor((i + 1) / 3);
                  const isPenaltyThreshold = (i + 1) % 3 === 0;
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={!isEditable}
                      onClick={() => updateStatDamage(["geistiger schaden", "geistig"], isMarked ? i : i + 1)}
                      className={`h-7 border-2 rounded flex flex-col items-center justify-center transition-all ${
                        isMarked 
                          ? 'bg-blue-700 text-white border-blue-900 shadow-inner' 
                          : 'bg-white text-zinc-600 border-blue-300 hover:border-blue-600'
                      }`}
                      title={`Kästchen ${i + 1}${isPenaltyThreshold ? ` (Wundabzug -${boxPenalty})` : ''}`}
                    >
                      <span className="text-[8px] font-bold">{i + 1}</span>
                      {isPenaltyThreshold && (
                        <span className="text-[7px] text-blue-300 font-bold leading-none">-{boxPenalty}</span>
                      )}
                    </button>
                  );
                })}
              </div>
              <span className="text-[8px] text-zinc-600 italic">
                Betäubungsschaden führt bei {stunMaxBoxes} Kästchen zur Bewusstlosigkeit. Überzähliger Schaden geht auf den Körper.
              </span>
            </div>
          </div>

          {/* FERTIGKEITEN (ACTIVE SKILLS) */}
          <div className="border-2 border-zinc-800 rounded-lg p-3 bg-zinc-50 shadow-xs mb-4">
            <div className="flex items-center justify-between border-b border-zinc-300 pb-1 mb-2">
              <h2 className="text-xs font-black uppercase tracking-wider font-mono text-zinc-900 flex items-center gap-1.5">
                <Crosshair size={14} className="text-zinc-800" />
                Aktive Fertigkeiten & Würfelpools
              </h2>
              <span className="text-[9px] text-zinc-500 font-mono">Pool = Stufe + Attribut +/- Wundabzug</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {(data.skills || []).map((skill, idx) => {
                let attrKey = "GES";
                let attrVal = ges;
                const nameLow = skill.name.toLowerCase();
                if (nameLow.includes("hack") || nameLow.includes("computer") || nameLow.includes("elektronik")) {
                  attrKey = "LOG"; attrVal = log;
                } else if (nameLow.includes("wahrnehmung") || nameLow.includes("spuren")) {
                  attrKey = "INT"; attrVal = intVal;
                } else if (nameLow.includes("nahkampf") || nameLow.includes("klingen")) {
                  attrKey = "GES"; attrVal = ges;
                } else if (nameLow.includes("schuss") || nameLow.includes("pistol") || nameLow.includes("gewehr") || nameLow.includes("schleich")) {
                  attrKey = "GES"; attrVal = ges;
                } else if (nameLow.includes("verhandlung") || nameLow.includes("überreden")) {
                  attrKey = "CHA"; attrVal = cha;
                }

                const pool = skill.value + attrVal - totalWoundPenalty;

                return (
                  <div key={idx} className="bg-white border border-zinc-300 rounded p-1.5 flex justify-between items-center text-xs font-mono">
                    <div className="truncate mr-2">
                      <span className="font-bold text-zinc-900 block truncate">{skill.name}</span>
                      <span className="text-[8px] text-zinc-500">Stufe {skill.value} ({attrKey}: {attrVal})</span>
                    </div>
                    <div className="text-center shrink-0">
                      <span className="font-black text-sm bg-zinc-800 text-amber-300 px-2 py-0.5 rounded shadow-xs">
                        {Math.max(0, pool)} W6
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* WAFFENARSENAL */}
          <div className="border-2 border-zinc-800 rounded-lg p-3 bg-zinc-50 shadow-xs">
            <div className="flex items-center justify-between border-b border-zinc-300 pb-1 mb-2">
              <h2 className="text-xs font-black uppercase tracking-wider font-mono text-zinc-900 flex items-center gap-1.5">
                <Crosshair size={14} className="text-orange-600" />
                Waffenarsenal & Angriffe
              </h2>
            </div>

            <div className="space-y-1.5">
              {activeWeapons.map((w, idx) => (
                <div key={idx} className="bg-white border border-zinc-300 rounded p-2 text-xs font-mono">
                  <div className="flex justify-between items-center border-b border-zinc-200 pb-1 mb-1">
                    <span className="font-black text-zinc-950 text-sm">{w.name}</span>
                    <div className="flex items-center gap-3 text-[10px]">
                      <span>Pool: <strong className="text-orange-600">{w.attack}</strong></span>
                      <span>Schaden: <strong>{w.damage}</strong></span>
                      <span>AP: <strong>{w.critical || "0"}</strong></span>
                      {w.range && <span>Reichweite: <strong>{w.range}</strong></span>}
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-600 italic">{w.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PAGE 2: CYBERWARE, CYBERDECK, LIFESTYLE & GEAR */}
      {(activePage === 'all' || activePage === 'page2') && (
        <div className={`printable-sheet max-w-[960px] mx-auto p-6 md:p-8 rounded-xl font-sans text-[11px] leading-tight ${paperBgClass} print:m-0 print:p-4 print:border-none print:shadow-none print:w-full print:max-w-none print:break-before-page`}>
          {/* HEADER PAGE 2 */}
          <div className="border-b-2 border-zinc-900 pb-2 mb-4 flex justify-between items-center font-mono">
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-zinc-500">
                Shadowrun Runner-Akte • Seite 2
              </span>
              <h2 className="text-xl font-bold text-zinc-900">
                {data.name} — Cyberware, Deck & Schatten-Ausrüstung
              </h2>
            </div>
            <span className="text-[10px] text-zinc-600">Essenz: {essence} / 6.00</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* LEFT COLUMN: CYBERWARE & BIOWARE (6 Cols) */}
            <div className="lg:col-span-6 space-y-4 font-mono">
              <div className="border-2 border-zinc-800 rounded-lg p-3 bg-zinc-50 shadow-xs">
                <div className="flex items-center justify-between border-b border-zinc-300 pb-1 mb-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
                    <Cpu size={14} className="text-orange-600" />
                    Cyberware & Bioware Implantate
                  </h3>
                  <span className="text-[9px] text-zinc-500">
                    Gesamtkosten: {(6.00 - essence).toFixed(2)} Essenz
                  </span>
                </div>

                <div className="space-y-1.5">
                  {bodyMods.length > 0 ? (
                    bodyMods.map((mod, idx) => (
                      <div key={idx} className="bg-white border border-zinc-300 rounded p-2 text-xs">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="font-bold text-zinc-900">{mod.name}</span>
                          <span className="text-[9px] bg-zinc-100 border border-zinc-300 px-1.5 py-0.2 rounded text-zinc-700">
                            {mod.grade || "Standard"} • {mod.essenceCost} ESS
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-600">{mod.description}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 bg-white border border-zinc-300 rounded text-center text-zinc-500 italic text-[10px]">
                      Keine Implantate verzeichnet. Reine biologische Matrix.
                    </div>
                  )}
                </div>
              </div>

              {/* VOR- UND NACHTEILE (QUALITIES) */}
              <div className="border-2 border-zinc-800 rounded-lg p-3 bg-zinc-50 shadow-xs">
                <div className="flex items-center justify-between border-b border-zinc-300 pb-1 mb-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900">
                    Vor- & Nachteile (Qualities) & Gaben
                  </h3>
                  <span className="text-[9px] text-zinc-500">
                    {((data.abilities || []).filter(a => a.type !== 'rogue_talent' && a.type !== 'class')).length} Notiert
                  </span>
                </div>
                <div className="space-y-1.5 text-[10px] text-zinc-800">
                  {((data.abilities || []).filter(a => a.type !== 'rogue_talent' && a.type !== 'class')).length > 0 ? (
                    (data.abilities || [])
                      .filter(a => a.type !== 'rogue_talent' && a.type !== 'class')
                      .map((ab, idx) => (
                        <div key={idx} className="bg-white border border-zinc-200 rounded p-1.5">
                          <div className="flex justify-between items-baseline mb-0.5">
                            <strong className="text-zinc-950 font-bold">{ab.name}</strong>
                            <div className="flex items-center gap-1">
                              {ab.type === 'quality' && <span className="text-[8px] bg-emerald-100 text-emerald-800 px-1 rounded font-bold">Vorteil</span>}
                              {ab.type === 'flaw' && <span className="text-[8px] bg-rose-100 text-rose-800 px-1 rounded font-bold">Nachteil</span>}
                              {ab.type === 'adept_power' && <span className="text-[8px] bg-purple-100 text-purple-800 px-1 rounded font-bold">Ki-Kraft</span>}
                              {ab.type === 'spell' && <span className="text-[8px] bg-indigo-100 text-indigo-800 px-1 rounded font-bold">Zauber/Resonanz</span>}
                              {ab.karmaCost !== undefined && (
                                <span className={`text-[8px] font-mono font-bold ${ab.karmaCost > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                  {ab.karmaCost > 0 ? `+${ab.karmaCost}` : ab.karmaCost} Karma
                                </span>
                              )}
                              {ab.powerPoints !== undefined && (
                                <span className="text-[8px] font-mono text-purple-700">
                                  {ab.powerPoints} KP
                                </span>
                              )}
                              {(() => {
                                const max = ab.maxUses ?? extractDailyUsesFromText(ab.usage, ab.name) ?? extractDailyUsesFromText(ab.effect, ab.name);
                                if (!max || max <= 0) return null;
                                const cur = ab.currentUses !== undefined ? ab.currentUses : max;
                                return (
                                  <div className="inline-flex items-center gap-1 font-mono text-[8px] bg-indigo-50 border border-indigo-200 rounded px-1 py-0.5">
                                    <span className="font-bold text-indigo-950">⚡ {cur}/{max}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const next = Math.max(0, cur - 1);
                                        const newAbilities = (data.abilities || []).map(a => a.name === ab.name ? { ...a, maxUses: max, currentUses: next } : a);
                                        onUpdateData({ abilities: newAbilities });
                                      }}
                                      disabled={cur <= 0}
                                      title="1 Ladung verbrauchen (-)"
                                      className="w-3.5 h-3.5 rounded bg-indigo-100 hover:bg-indigo-200 text-indigo-950 disabled:opacity-30 flex items-center justify-center font-bold text-[9px] cursor-pointer"
                                    >
                                      -
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const next = Math.min(max, cur + 1);
                                        const newAbilities = (data.abilities || []).map(a => a.name === ab.name ? { ...a, maxUses: max, currentUses: next } : a);
                                        onUpdateData({ abilities: newAbilities });
                                      }}
                                      disabled={cur >= max}
                                      title="1 Ladung aufladen (+)"
                                      className="w-3.5 h-3.5 rounded bg-indigo-100 hover:bg-indigo-200 text-indigo-950 disabled:opacity-30 flex items-center justify-center font-bold text-[9px] cursor-pointer"
                                    >
                                      +
                                    </button>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                          <p className="text-[9px] text-zinc-600 leading-normal">{ab.effect}</p>
                        </div>
                      ))
                  ) : (
                    <p className="italic text-zinc-500 text-center py-2">
                      Keine Vor- oder Nachteile notiert. Im Dashboard unter „Vor- & Nachteile & Kräfte” können Gaben aus dem Katalog gewählt werden.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: CYBERDECK & AUSRÜSTUNG (6 Cols) */}
            <div className="lg:col-span-6 space-y-4 font-mono">
              {/* CYBERDECK STATUS */}
              {deck && (
                <div className="border-2 border-orange-600 rounded-lg p-3 bg-orange-50/50 shadow-xs">
                  <div className="flex items-center justify-between border-b border-orange-300 pb-1 mb-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-orange-950 flex items-center gap-1.5">
                      <Terminal size={14} className="text-orange-700" />
                      Cyberdeck & Matrix-Attribute
                    </h3>
                    <span className="text-[9px] text-orange-800 font-bold">Stufe {deck.deviceRating} ({deck.mode})</span>
                  </div>

                  <div className="mb-2">
                    <span className="font-bold text-zinc-900 text-xs block">{deck.name}</span>
                    <div className="grid grid-cols-4 gap-1 text-center mt-1">
                      <div className="bg-white border border-orange-200 rounded p-1">
                        <span className="text-[7px] uppercase block text-zinc-500">Angriff</span>
                        <span className="font-black text-sm text-zinc-900">{deck.configuration.attack}</span>
                      </div>
                      <div className="bg-white border border-orange-200 rounded p-1">
                        <span className="text-[7px] uppercase block text-zinc-500">Schleicher</span>
                        <span className="font-black text-sm text-zinc-900">{deck.configuration.sleaze}</span>
                      </div>
                      <div className="bg-white border border-orange-200 rounded p-1">
                        <span className="text-[7px] uppercase block text-zinc-500">Datenver.</span>
                        <span className="font-black text-sm text-zinc-900">{deck.configuration.dataProcessing}</span>
                      </div>
                      <div className="bg-white border border-orange-200 rounded p-1">
                        <span className="text-[7px] uppercase block text-zinc-500">Firewall</span>
                        <span className="font-black text-sm text-zinc-900">{deck.configuration.firewall}</span>
                      </div>
                    </div>
                  </div>

                  {/* Installed Programs */}
                  <div className="text-[10px]">
                    <span className="font-bold text-zinc-800 block mb-1">Geladene Programme:</span>
                    <div className="flex flex-wrap gap-1">
                      {deck.programs.map((prog, idx) => (
                        <span key={idx} className={`px-1.5 py-0.5 rounded border text-[9px] ${prog.isActive ? 'bg-orange-600 text-white border-orange-700' : 'bg-white text-zinc-600 border-zinc-300'}`}>
                          {prog.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* LIFESTYLE & FAKES */}
              <div className="border-2 border-zinc-800 rounded-lg p-3 bg-zinc-50 shadow-xs">
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 border-b border-zinc-300 pb-1 mb-2">
                  Lebensstil & Gefälschte Identitäten
                </h3>
                <div className="space-y-1.5 text-[10px] text-zinc-800">
                  <div className="flex justify-between border-b border-zinc-200 pb-0.5">
                    <span>Lebensstil:</span>
                    <strong className="text-zinc-900">Mittelklasse (Bezahlt für 2 Monate)</strong>
                  </div>
                  <div className="flex justify-between border-b border-zinc-200 pb-0.5">
                    <span>Gefälschte SIN (Stufe 4):</span>
                    <strong className="text-zinc-900">"Marcus Vance" • Lizenzen: Smartlink, Handfeuerwaffen, Cyberdeck</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Fahrzeug:</span>
                    <strong className="text-zinc-900">Eurocar Westwind 3000 (Rigger-Anpassung)</strong>
                  </div>
                </div>
              </div>

              {/* INVENTAR & AUSRÜSTUNG */}
              <div className="border-2 border-zinc-800 rounded-lg p-3 bg-zinc-50 shadow-xs">
                <div className="flex items-center justify-between border-b border-zinc-300 pb-1 mb-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
                    <Layers size={14} className="text-orange-600" />
                    Ausrüstung & Schatten-Inventar
                  </h3>
                  <span className="text-[9px] text-zinc-500 font-mono">
                    {equippedGear.length} am Mann • {storedGear.length} im Lager
                  </span>
                </div>

                {/* AM MANN (GETRAGEN IM EINSATZ) */}
                <div className="mb-3">
                  <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded mb-1 flex justify-between">
                    <span>🎒 Am Mann (Einsatz-Ausrüstung)</span>
                    <span>{equippedGear.length}</span>
                  </div>
                  <div className="space-y-1">
                    {equippedGear.length > 0 ? (
                      equippedGear.map((item, idx) => (
                        <div key={idx} className="bg-white border border-zinc-200 rounded p-1.5 text-[10px]">
                          <div className="flex justify-between items-baseline">
                            <span className="font-bold text-zinc-900">
                              {(item.quantity || 1) > 1 ? `${item.quantity}x ` : ''}{item.name}
                            </span>
                            <div className="flex items-center gap-1 font-mono text-[8px]">
                              {item.damage && <span className="text-red-700 font-bold">{item.damage}</span>}
                              {item.armorValue && <span className="text-blue-700 font-bold">+{item.armorValue} PAN</span>}
                              {item.rating && <span className="text-zinc-600">Stufe {item.rating}</span>}
                              {item.ap && <span className="text-orange-700">AP {item.ap}</span>}
                            </div>
                          </div>
                          {item.notes && <p className="text-[9px] text-zinc-600 italic mt-0.5">{item.notes}</p>}
                        </div>
                      ))
                    ) : (
                      <p className="text-[9px] text-zinc-500 italic p-1">Keine Ausrüstung am Mann getragen.</p>
                    )}
                  </div>
                </div>

                {/* EINGELAGERT (UNTERKUNFT / SAFEHOUSE) */}
                <div>
                  <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-amber-900 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded mb-1 flex justify-between">
                    <span>📦 Eingelagert (Unterkunft / Lager)</span>
                    <span>{storedGear.length}</span>
                  </div>
                  <div className="space-y-1">
                    {storedGear.length > 0 ? (
                      storedGear.map((item, idx) => (
                        <div key={idx} className="bg-white/80 border border-dashed border-zinc-300 rounded p-1.5 text-[10px]">
                          <div className="flex justify-between items-baseline">
                            <span className="font-bold text-zinc-800">
                              {(item.quantity || 1) > 1 ? `${item.quantity}x ` : ''}{item.name}
                            </span>
                            <span className="text-[8px] font-mono text-amber-700 bg-amber-50 px-1 rounded border border-amber-200">
                              Ort: {item.location || 'Unterkunft'}
                            </span>
                          </div>
                          {item.notes && <p className="text-[9px] text-zinc-500 italic mt-0.5">{item.notes}</p>}
                        </div>
                      ))
                    ) : (
                      <p className="text-[9px] text-zinc-500 italic p-1">Keine Gegenstände im Lager.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
