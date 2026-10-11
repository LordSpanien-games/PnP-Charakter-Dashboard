import React, { FC, useMemo, ChangeEvent } from "react";
import { 
  Compass, 
  Rocket, 
  Shield, 
  Crosshair, 
  Zap, 
  Radio, 
  Activity, 
  DollarSign, 
  Layers, 
  HeartHandshake
} from "lucide-react";
import { 
  Skill, 
  Weapon, 
  Ability,
  Stat
} from "../../types";
import { 
  parseTravellerCharacteristics, 
  getTravellerDM, 
  formatTravellerDM, 
  toPseudoHex,
  TRAVELLER_DIFFICULTIES
} from "../../utils/traveller";
import { SheetProps } from "./types";

export const TravellerSheet: FC<SheetProps> = ({
  data,
  onUpdateData,
  isEditable,
  paperStyle,
  activePage
}) => {
  const healthState = parseTravellerCharacteristics(data.characteristics || [], data.stats || []);

  const getStatVal = (keys: string[], defaultVal = ""): string => {
    if (!data.stats) return defaultVal;
    const item = data.stats.find(s => 
      keys.some(k => (s.label || "").toLowerCase().includes(k.toLowerCase()))
    );
    return item ? String(item.value) : defaultVal;
  };

  const armor = getStatVal(["panzerung", "armor"], "8");
  const rad = getStatVal(["strahlung", "rad"], "45 RAD");
  const ship = getStatVal(["schiff", "ship"], "Scout Typ S");

  // Handle characteristic change
  const handleUpdateChar = (code: string, newBase: number) => {
    const list = data.characteristics ? [...data.characteristics] : [];
    const idx = list.findIndex(c => (c?.label || "").toUpperCase().startsWith((code || "").toUpperCase()));
    if (idx >= 0) {
      list[idx] = { ...list[idx], value: newBase };
    } else {
      list.push({ label: code, value: newBase });
    }
    onUpdateData({ characteristics: list });
  };

  const handleUpdateCharDmg = (code: string, newDmg: number) => {
    const list = data.characteristics ? [...data.characteristics] : [];
    const idx = list.findIndex(c => (c?.label || "").toUpperCase().startsWith((code || "").toUpperCase()));
    if (idx >= 0) {
      list[idx] = { ...list[idx], damage: Math.max(0, newDmg) };
      onUpdateData({ characteristics: list });
    }
  };

  const paperBgClass = paperStyle === 'parchment'
    ? 'bg-[#f8f9fa] text-slate-900 shadow-xl border border-slate-300'
    : 'bg-white text-black shadow-lg border border-zinc-200';

  return (
    <>
      {/* PAGE 1: IMPERIAL SCOUT & SERVICE RECORD, UPP, COMBAT, SKILLS */}
      {(activePage === 'all' || activePage === 'page1') && (
        <div className={`printable-sheet max-w-[960px] mx-auto mb-8 p-6 md:p-8 rounded-xl font-mono text-[11px] leading-tight ${paperBgClass} print:m-0 print:p-4 print:border-none print:shadow-none print:w-full print:max-w-none`}>
          {/* TECHNICAL STARPORT DOSSIER HEADER */}
          <div className="border-b-4 border-slate-900 pb-3 mb-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl md:text-2xl font-black uppercase tracking-[0.25em] text-cyan-950 flex items-center gap-1.5">
                    <Rocket size={22} className="text-cyan-600" />
                    TRAVELLER
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-slate-700 border border-slate-400 px-2 py-0.5 rounded font-bold bg-slate-100">
                    TAS Personalakte • Imperial Service Record
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-950 mt-1">
                  {isEditable ? (
                    <input
                      type="text"
                      value={data.name}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => onUpdateData({ name: e.target.value })}
                      className="bg-transparent border-b-2 border-cyan-500 outline-none w-full max-w-md font-black text-slate-950"
                      title="Name bearbeiten"
                    />
                  ) : (
                    data.name
                  )}
                </h1>
                <div className="text-xs text-cyan-800 font-bold mt-0.5">
                  {data.subTitle || "Ex-Scout (Survey) • 4 Dienstzeiten • Alter 34"}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] w-full md:w-auto">
                <div className="border-b border-slate-300 pb-0.5">
                  <span className="text-slate-500 uppercase block text-[8px]">UPP Code</span>
                  <span className="font-black text-base text-cyan-900">{healthState.upp}</span>
                </div>
                <div className="border-b border-slate-300 pb-0.5">
                  <span className="text-slate-500 uppercase block text-[8px]">Aktueller UPP</span>
                  <span className={`font-black text-base ${healthState.totalDamage > 0 ? 'text-red-600' : 'text-slate-800'}`}>
                    {healthState.currentUpp}
                  </span>
                </div>
                <div className="border-b border-slate-300 pb-0.5">
                  <span className="text-slate-500 uppercase block text-[8px]">Credits</span>
                  <span className="font-bold text-emerald-800">{data.currency?.amount || 24500} Cr</span>
                </div>
                <div className="border-b border-slate-300 pb-0.5">
                  <span className="text-slate-500 uppercase block text-[8px]">Status</span>
                  <span className="font-bold text-slate-900">{healthState.statusLabel}</span>
                </div>
              </div>
            </div>

            {/* Sub Header */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] mt-2 pt-2 border-t border-slate-200">
              <div>
                <span className="text-slate-500 uppercase block text-[8px]">Dienstzweig</span>
                <span className="font-bold text-slate-800">Scout Service (Survey)</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase block text-[8px]">Dienstzeiten / Rang</span>
                <span className="font-bold text-slate-800">4 Terms (16 Jahre) • Rang 1</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase block text-[8px]">Schiffsberechtigung</span>
                <span className="font-bold text-cyan-800">{ship} (100 Tonnen)</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase block text-[8px]">Panzerung / Schutz</span>
                <span className="font-bold text-slate-900">Panzerung {armor} • {rad}</span>
              </div>
            </div>
          </div>

          {/* UPP CHARACTERISTICS & DAMAGE TRACKING */}
          <div className="border-2 border-slate-800 rounded-lg p-3 bg-slate-50 shadow-xs mb-4">
            <div className="flex items-center justify-between border-b border-slate-300 pb-1 mb-2">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Activity size={14} className="text-cyan-700" />
                UPP Charakteristiken & Schadensleisten
              </h2>
              <span className="text-[9px] text-slate-500">
                In Traveller absorbiert die Physis (STR, DEX, END) direkten Schaden
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {[healthState.str, healthState.dex, healthState.end, healthState.int, healthState.edu, healthState.soc].map(c => {
                const isInjured = c.damage > 0;
                return (
                  <div key={c.code} className="bg-white border-2 border-slate-700 rounded-md p-1.5 shadow-xs flex flex-col justify-between">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-0.5 mb-1">
                      <span className="font-black text-sm text-slate-900">{c.code}</span>
                      <span className="text-[8px] text-slate-500 uppercase">{c.name}</span>
                    </div>

                    <div className="flex items-center justify-between my-1">
                      {/* Base Score */}
                      <div className="text-center">
                        <span className="text-[7px] text-slate-400 block uppercase">Basis</span>
                        {isEditable ? (
                          <input
                            type="number"
                            min={1}
                            max={15}
                            value={c.value}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => {
                              const v = parseInt(e.target.value, 10);
                              if (!isNaN(v)) handleUpdateChar(c.code, v);
                            }}
                            className="w-10 text-center font-black text-base bg-slate-50 border border-slate-300 rounded outline-none"
                          />
                        ) : (
                          <span className="font-black text-base text-slate-900">{c.value}</span>
                        )}
                      </div>

                      {/* Current Score */}
                      <div className="text-center">
                        <span className="text-[7px] text-slate-400 block uppercase">Aktuell</span>
                        <span className={`font-black text-base ${isInjured ? 'text-red-600' : 'text-slate-900'}`}>
                          {c.currentValue}
                        </span>
                      </div>

                      {/* DM Modifier */}
                      <div className="text-center">
                        <span className="text-[7px] text-slate-400 block uppercase">DM</span>
                        <span className="w-7 h-5 bg-slate-800 text-cyan-300 rounded flex items-center justify-center font-bold text-xs">
                          {formatTravellerDM(c.effectiveDm)}
                        </span>
                      </div>
                    </div>

                    {/* Damage Tracker (only for physical stats) */}
                    {c.isPhysical ? (
                      <div className="pt-1 border-t border-slate-200 flex justify-between items-center text-[9px]">
                        <span className="text-slate-500">Wunden:</span>
                        {isEditable ? (
                          <input
                            type="number"
                            min={0}
                            max={c.value}
                            value={c.damage}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => {
                              const v = parseInt(e.target.value, 10);
                              if (!isNaN(v)) handleUpdateCharDmg(c.code, v);
                            }}
                            className="w-8 text-center font-bold text-red-600 border border-red-300 rounded bg-red-50"
                          />
                        ) : (
                          <span className="font-bold text-red-600">{c.damage}</span>
                        )}
                      </div>
                    ) : (
                      <div className="pt-1 border-t border-slate-200 text-center text-[8px] text-slate-400">
                        Geistiges Attribut
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* FERTIGKEITEN (TRAVELLER SKILLS TABLE) */}
          <div className="border-2 border-slate-800 rounded-lg p-3 bg-slate-50 shadow-xs mb-4">
            <div className="flex items-center justify-between border-b border-slate-300 pb-1 mb-2">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Compass size={14} className="text-cyan-700" />
                Ausgebildete Fertigkeiten (Skills)
              </h2>
              <span className="text-[9px] text-slate-600">
                Wurf-Regel: 2D6 + Fertigkeitsstufe + Attributs-DM ≥ Zielwert (Standard: 8+)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[460px] overflow-y-auto pr-1">
              {(data.skills || []).map((skill, idx) => {
                let attrKey = skill.note || "DEX";
                let attrDM = 0;
                if (attrKey.includes("STR")) attrDM = healthState.str.effectiveDm;
                else if (attrKey.includes("DEX")) attrDM = healthState.dex.effectiveDm;
                else if (attrKey.includes("END")) attrDM = healthState.end.effectiveDm;
                else if (attrKey.includes("INT")) attrDM = healthState.int.effectiveDm;
                else if (attrKey.includes("EDU")) attrDM = healthState.edu.effectiveDm;
                else if (attrKey.includes("SOC")) attrDM = healthState.soc.effectiveDm;

                const totalMod = skill.value + attrDM;

                return (
                  <div key={idx} className="bg-white border border-slate-300 rounded p-1.5 flex justify-between items-center text-xs">
                    <div className="truncate mr-2">
                      <span className="font-bold text-slate-900 block truncate">{skill.name}</span>
                      <span className="text-[8px] text-slate-500">
                        Stufe {skill.value} • {attrKey} (DM {formatTravellerDM(attrDM)})
                      </span>
                    </div>
                    <div className="text-center shrink-0">
                      <span className="font-black text-sm bg-slate-800 text-cyan-300 px-2 py-0.5 rounded">
                        {formatTravellerDM(totalMod)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* WAFFENARSENAL */}
          <div className="border-2 border-slate-800 rounded-lg p-3 bg-slate-50 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-300 pb-1 mb-2">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Crosshair size={14} className="text-cyan-700" />
                Waffenarsenal & TL-Ausrüstung
              </h2>
              <span className="text-[9px] text-slate-500">AP = Armor Piercing (durchdringt Panzerung)</span>
            </div>

            <div className="space-y-1.5">
              {[...(data.weapons?.melee || []), ...(data.weapons?.ranged || [])].map((w, idx) => (
                <div key={idx} className="bg-white border border-slate-300 rounded p-2 text-xs">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-1 mb-1">
                    <span className="font-bold text-slate-950 text-sm">{w.name}</span>
                    <div className="flex items-center gap-3 text-[10px]">
                      <span>Angriffs-Wurf: <strong className="text-cyan-800">{w.attack}</strong></span>
                      <span>Schaden: <strong>{w.damage}</strong></span>
                      {w.range && <span>Reichweite: <strong>{w.range}</strong></span>}
                      <span>Kritisch/Effekt: <strong>{w.critical}</strong></span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-600 italic">{w.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PAGE 2: RAUMSCHIFF, TL-AUSRÜSTUNG & SERVICE LOG */}
      {(activePage === 'all' || activePage === 'page2') && (
        <div className={`printable-sheet max-w-[960px] mx-auto p-6 md:p-8 rounded-xl font-mono text-[11px] leading-tight ${paperBgClass} print:m-0 print:p-4 print:border-none print:shadow-none print:w-full print:max-w-none print:break-before-page`}>
          {/* HEADER PAGE 2 */}
          <div className="border-b-2 border-slate-900 pb-2 mb-4 flex justify-between items-center">
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-slate-500">
                Traveller Personalakte • Seite 2
              </span>
              <h2 className="text-xl font-bold text-slate-900">
                {data.name} — Scout-Schiff, Ausrüstung & Logbuch
              </h2>
            </div>
            <span className="text-[10px] text-slate-600">Dienstzeit: 16 Jahre</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* LEFT COLUMN: RAUMSCHIFF DOSSIER (6 Cols) */}
            <div className="lg:col-span-6 space-y-4">
              <div className="border-2 border-slate-800 rounded-lg p-3 bg-slate-50 shadow-xs space-y-2">
                <div className="flex items-center justify-between border-b border-slate-300 pb-1 mb-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <Rocket size={14} className="text-cyan-700" />
                    Dienstschiff: Scout Typ S "Seeker"
                  </h3>
                  <span className="text-[9px] text-cyan-800 font-bold">100 Tonnage</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-white border border-slate-300 rounded p-1">
                    <span className="text-[8px] uppercase text-slate-500 block">Sprungantrieb</span>
                    <span className="font-bold text-slate-900">Jump-2</span>
                  </div>
                  <div className="bg-white border border-slate-300 rounded p-1">
                    <span className="text-[8px] uppercase text-slate-500 block">Manöverantrieb</span>
                    <span className="font-bold text-slate-900">2G Schub</span>
                  </div>
                  <div className="bg-white border border-slate-300 rounded p-1">
                    <span className="text-[8px] uppercase text-slate-500 block">Panzerung</span>
                    <span className="font-bold text-slate-900">4 Punkte</span>
                  </div>
                </div>

                <div className="space-y-1 text-[10px] text-slate-800 pt-1">
                  <p><strong>Bordcomputer:</strong> Modell 1bis (Rating 10)</p>
                  <p><strong>Sensoren:</strong> Verbesserte Sensorik (TL11, DM +1 auf Scanproben)</p>
                  <p><strong>Waffen:</strong> Einzelner Zwillings-Pulslaserturm</p>
                  <p><strong>Frachtraum & Treibstoff:</strong> 12 Tonnen Frachtraum, 40 Tonnen Treibstoff (1x Jump-2 + 4 Wochen Betrieb)</p>
                  <p><strong>Fahrzeuge:</strong> Luftkissen-Fahrzeug (Air/Raft) in der Heckbucht verankert</p>
                </div>
              </div>

              {/* SCHIFFSKONTAKTE & CREW */}
              <div className="border-2 border-slate-800 rounded-lg p-3 bg-slate-50 shadow-xs">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
                  Dienstkontakte & Allianzen
                </h3>
                <div className="space-y-1 text-[10px] text-slate-800">
                  <p><strong>Scout-Direktor Vane (Subsector Regina):</strong> Ehemaliger Vorgesetzter, wohlwollend gestimmt.</p>
                  <p><strong>Freihändler Captain Miller:</strong> Zuverlässiger Schwarzmarkt-Kontakt für TL-Ersatzteile.</p>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: EQUIPMENT & TRAVEL LOG (6 Cols) */}
            <div className="lg:col-span-6 space-y-4">
              <div className="border-2 border-slate-800 rounded-lg p-3 bg-slate-50 shadow-xs">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
                  High-Tech Ausrüstung (TL10 - TL12)
                </h3>
                <div className="space-y-1.5 text-[10px] text-slate-800">
                  <p>• <strong>Vakuum-Anzug (TL10):</strong> 6 Stunden Sauerstoffvorrat, Schutz gegen Vakuum und Strahlung.</p>
                  <p>• <strong>Fortgeschrittenes Medikit (TL12):</strong> Gibt +2 DM auf Notfall-Medizinproben, 8 Dosen Stim-Packs.</p>
                  <p>• <strong>Tragbarer Scanner (TL11):</strong> Analyse von Atmosphäre, Bio-Signaturen und EM-Strahlung.</p>
                  <p>• <strong>Subraum-Kommunikator (TL10):</strong> Planetare Reichweite, verschlüsseltes Scout-Netz.</p>
                </div>
              </div>

              {/* DIENSTLOGBUCH */}
              <div className="border-2 border-slate-800 rounded-lg p-3 bg-slate-50 shadow-xs">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
                  Dienstprotokoll & Missionsberichte
                </h3>
                <textarea
                  defaultValue="Aufklärungspatrouille im Randbereich des Subsektors abgeschlossen. Drei unkartierte Asteroidenbasen mit Anzeichen piratischer Aktivitäten gesichtet. Probenmaterial an die Scout-Basis auf Regina übermittelt."
                  disabled={!isEditable}
                  rows={4}
                  className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-slate-800 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
