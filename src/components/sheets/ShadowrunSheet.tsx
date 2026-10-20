import React, { FC, useState, useMemo } from "react";
import { SheetProps } from "./types";

// ── Shadowrun 5e Masterliste ────────────────────────────────
const SR_ACTIVE_SKILLS: { name: string; attr: string; group?: string }[] = [
  // Kampf
  { name: "Pistolen",          attr: "GES", group: "Feuerwaffen" },
  { name: "Gewehre",           attr: "GES", group: "Feuerwaffen" },
  { name: "Sturmgewehre",      attr: "GES", group: "Feuerwaffen" },
  { name: "Schrotflinten",     attr: "GES", group: "Feuerwaffen" },
  { name: "Schwere Waffen",    attr: "GES", group: "Feuerwaffen" },
  { name: "Waffenloser Kampf", attr: "STR", group: "Nahkampf" },
  { name: "Klingenwaffen",     attr: "GES", group: "Nahkampf" },
  { name: "Knüppelwaffen",     attr: "STR", group: "Nahkampf" },
  { name: "Kampfsport",        attr: "STR", group: "Nahkampf" },
  { name: "Werfen",            attr: "STR", group: "Nahkampf" },
  // Körperlich
  { name: "Ausweichen",        attr: "REA", group: "Körperlich" },
  { name: "Athletik",          attr: "STR", group: "Körperlich" },
  { name: "Schwimmen",         attr: "STR", group: "Körperlich" },
  { name: "Klettern",          attr: "STR", group: "Körperlich" },
  { name: "Springen",          attr: "STR", group: "Körperlich" },
  // Heimlichkeit & Täuschung
  { name: "Heimlichkeit",      attr: "GES", group: "Täuschung" },
  { name: "Tarnung",           attr: "INT", group: "Täuschung" },
  { name: "Verkleiden",        attr: "INT", group: "Täuschung" },
  { name: "Con",               attr: "CHA", group: "Täuschung" },
  // Soziales
  { name: "Überreden",         attr: "CHA", group: "Soziales" },
  { name: "Verhandeln",        attr: "CHA", group: "Soziales" },
  { name: "Einschüchtern",     attr: "CHA", group: "Soziales" },
  { name: "Etikette",          attr: "CHA", group: "Soziales" },
  { name: "Führung",           attr: "CHA", group: "Soziales" },
  // Technik
  { name: "Computersysteme",   attr: "LOG", group: "Technik" },
  { name: "Hacking",           attr: "LOG", group: "Technik" },
  { name: "Elektronik",        attr: "LOG", group: "Technik" },
  { name: "Knacken",           attr: "LOG", group: "Technik" },
  { name: "Schlösser knacken", attr: "GES", group: "Technik" },
  { name: "Mechaniker",        attr: "LOG", group: "Technik" },
  { name: "Sprengstoffe",      attr: "LOG", group: "Technik" },
  { name: "Navigation",        attr: "INT", group: "Technik" },
  { name: "Fahrzeuge",         attr: "REA", group: "Technik" },
  // Medizin
  { name: "Erste Hilfe",       attr: "LOG", group: "Medizin" },
  { name: "Medizin",           attr: "LOG", group: "Medizin" },
  { name: "Biotech",           attr: "LOG", group: "Medizin" },
  // Magie / Resonanz
  { name: "Magie",             attr: "MAG", group: "Magie" },
  { name: "Bannen",            attr: "MAG", group: "Magie" },
  { name: "Beschwören",        attr: "MAG", group: "Magie" },
  { name: "Resonanz",          attr: "RES", group: "Resonanz" },
  { name: "Kompilieren",       attr: "RES", group: "Resonanz" },
  { name: "Registrieren",      attr: "RES", group: "Resonanz" },
  // Wahrnehmung
  { name: "Wahrnehmung",       attr: "INT", group: "Wahrnehmung" },
];

const SR_KNOWLEDGE_SKILLS_DEFAULT = [
  "Straßenwissen",
  "Konzerne",
  "Unterwelt",
  "Stadtgeographie",
  "Matrixsicherheit",
];

const SKILL_GROUPS = [
  "Feuerwaffen", "Nahkampf", "Körperlich", "Täuschung",
  "Soziales", "Technik", "Medizin", "Magie", "Resonanz", "Wahrnehmung"
];

const GROUP_COLORS: Record<string, string> = {
  "Feuerwaffen":  "border-rose-300 bg-rose-50/40",
  "Nahkampf":     "border-orange-300 bg-orange-50/40",
  "Körperlich":   "border-amber-300 bg-amber-50/40",
  "Täuschung":    "border-purple-300 bg-purple-50/40",
  "Soziales":     "border-blue-300 bg-blue-50/40",
  "Technik":      "border-cyan-300 bg-cyan-50/40",
  "Medizin":      "border-emerald-300 bg-emerald-50/40",
  "Magie":        "border-indigo-300 bg-indigo-50/40",
  "Resonanz":     "border-violet-300 bg-violet-50/40",
  "Wahrnehmung":  "border-yellow-300 bg-yellow-50/40",
};

const GROUP_HEADER_COLORS: Record<string, string> = {
  "Feuerwaffen":  "bg-rose-100 text-rose-900 border-rose-300",
  "Nahkampf":     "bg-orange-100 text-orange-900 border-orange-300",
  "Körperlich":   "bg-amber-100 text-amber-900 border-amber-300",
  "Täuschung":    "bg-purple-100 text-purple-900 border-purple-300",
  "Soziales":     "bg-blue-100 text-blue-900 border-blue-300",
  "Technik":      "bg-cyan-100 text-cyan-900 border-cyan-300",
  "Medizin":      "bg-emerald-100 text-emerald-900 border-emerald-300",
  "Magie":        "bg-indigo-100 text-indigo-900 border-indigo-300",
  "Resonanz":     "bg-violet-100 text-violet-900 border-violet-300",
  "Wahrnehmung":  "bg-yellow-100 text-yellow-900 border-yellow-300",
};

export const ShadowrunSheet: FC<SheetProps> = ({
  data,
  onUpdateData,
  isEditable,
  paperStyle,
  activePage,
}) => {
  const [showAllSkills, setShowAllSkills] = useState(true);

  const paperBgClass = paperStyle === "parchment"
    ? "bg-zinc-950 text-zinc-100 border border-zinc-700"
    : "bg-zinc-950 text-zinc-100 border border-zinc-700";

  // ── Attribute auslesen ──────────────────────────────────
  const getAttr = (keys: string[], def = 1): number => {
    if (!data.characteristics) return def;
    const item = data.characteristics.find((c) =>
      keys.some((k) => (c.label || "").toUpperCase() === k.toUpperCase())
    );
    if (!item) return def;
    const n = typeof item.value === "number" ? item.value : parseInt(String(item.value), 10);
    return isNaN(n) ? def : n;
  };

  const kon = getAttr(["KON", "KO"]);
  const ges = getAttr(["GES", "GE"]);
  const rea = getAttr(["REA"]);
  const str = getAttr(["STR", "ST"]);
  const cha = getAttr(["CHA"]);
  const intA = getAttr(["INT", "IN"]);
  const log = getAttr(["LOG"]);
  const wil = getAttr(["WIL"]);
  const edg = getAttr(["EDG"]);
  const ess = parseFloat(
    String((data.stats || []).find((s) => (s.label || "").toLowerCase().includes("essenz"))?.value ?? "6")
  ) || 6;

  const physMonitor = Math.ceil(kon / 2) + 8;
  const stunMonitor = Math.ceil(wil / 2) + 8;
  const physLimit = Math.ceil((str * 2 + kon + rea) / 3);
  const mentLimit = Math.ceil((log * 2 + intA + wil) / 3);
  const socLimit = Math.ceil((cha * 2 + wil + ess) / 3);
  const initiative = rea + intA;

  // ── Skills mergen ───────────────────────────────────────
  const mergedActive = useMemo(() => {
    return SR_ACTIVE_SKILLS.map((def) => {
      const existing = (data.skills || []).find(
        (s) => (s.name || "").toLowerCase() === def.name.toLowerCase()
      );
      return {
        ...def,
        value: existing?.value ?? 0,
        hasValue: !!existing && Number(existing.value) > 0,
      };
    });
  }, [data.skills]);

  const knowledgeSkills = useMemo(() => {
    return (data.skills || []).filter((s) => s.category === "knowledge");
  }, [data.skills]);

  const extraSkills = useMemo(() => {
    return (data.skills || []).filter(
      (s) =>
        s.category !== "knowledge" &&
        !SR_ACTIVE_SKILLS.some((m) => m.name.toLowerCase() === (s.name || "").toLowerCase())
    );
  }, [data.skills]);

  const updateSkill = (name: string, value: number, attr?: string) => {
    const current = [...(data.skills || [])];
    const idx = current.findIndex((s) => s.name.toLowerCase() === name.toLowerCase());
    if (idx >= 0) {
      current[idx] = { ...current[idx], value };
    } else {
      current.push({ name, value, category: "active" });
    }
    onUpdateData({ skills: current });
  };

  const learnedCount = mergedActive.filter((s) => s.hasValue).length;
  const visibleActive = showAllSkills ? mergedActive : mergedActive.filter((s) => s.hasValue);

  // ── Render ──────────────────────────────────────────────
  return (
    <>
      {/* ══ SEITE 1: ATTRIBUTE, MONITORE, LIMITS & FERTIGKEITEN ══ */}
      {(activePage === "all" || activePage === "page1") && (
        <div className={`printable-sheet max-w-[960px] mx-auto mb-8 p-6 md:p-8 rounded-xl font-mono text-[11px] leading-tight ${paperBgClass} print:m-0 print:p-4 print:border-none print:shadow-none print:w-full print:max-w-none`}>

          {/* HEADER */}
          <div className="border-b-2 border-cyan-500 pb-3 mb-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl md:text-2xl font-black uppercase tracking-[0.2em] text-cyan-400">
                    SHADOWRUN
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-zinc-400 border border-zinc-600 px-1.5 py-0.5 rounded font-mono">
                    5. Edition • Läufer-Dossier
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white mt-1">
                  {isEditable ? (
                    <input
                      type="text"
                      value={data.name}
                      onChange={(e) => onUpdateData({ name: e.target.value })}
                      className="bg-transparent border-b-2 border-zinc-600 hover:border-cyan-500 focus:border-cyan-400 outline-none w-full max-w-md font-black text-white"
                    />
                  ) : data.name}
                </h1>
                {data.subTitle && (
                  <p className="text-zinc-400 text-xs mt-0.5">{data.subTitle}</p>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px]">
                <div className="border-b border-zinc-600 pb-0.5">
                  <span className="text-zinc-500 uppercase block text-[8px]">Metatyp</span>
                  <span className="font-bold text-zinc-200">{(data as any).metatype || "Mensch"}</span>
                </div>
                <div className="border-b border-zinc-600 pb-0.5">
                  <span className="text-zinc-500 uppercase block text-[8px]">Essenz</span>
                  <span className="font-bold text-cyan-300">{ess.toFixed(2)}</span>
                </div>
                <div className="border-b border-zinc-600 pb-0.5">
                  <span className="text-zinc-500 uppercase block text-[8px]">Initiative</span>
                  <span className="font-bold text-zinc-200">{initiative} + W6</span>
                </div>
              </div>
            </div>
          </div>

          {/* ATTRIBUTE */}
          <div className="border border-zinc-700 rounded-lg p-3 bg-zinc-900/60 mb-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-cyan-400 border-b border-zinc-700 pb-1 mb-2">
              Attribute
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2 text-center">
              {[
                { key: "KON", label: "Konst.", val: kon },
                { key: "GES", label: "Geschick.", val: ges },
                { key: "REA", label: "Reaktion", val: rea },
                { key: "STR", label: "Stärke", val: str },
                { key: "CHA", label: "Charisma", val: cha },
                { key: "INT", label: "Intuition", val: intA },
                { key: "LOG", label: "Logik", val: log },
                { key: "WIL", label: "Willk.", val: wil },
                { key: "EDG", label: "Edge", val: edg },
              ].map(({ key, label, val }) => (
                <div key={key} className="bg-zinc-800 border border-zinc-700 rounded p-1.5">
                  <div className="text-[8px] uppercase text-zinc-500 mb-0.5">{key}</div>
                  {isEditable ? (
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={val}
                      onChange={(e) => {
                        const chars = [...(data.characteristics || [])];
                        const idx = chars.findIndex((c) => (c.label || "").toUpperCase() === key);
                        const newVal = parseInt(e.target.value, 10) || 1;
                        if (idx >= 0) chars[idx] = { ...chars[idx], value: newVal };
                        else chars.push({ label: key, value: newVal });
                        onUpdateData({ characteristics: chars });
                      }}
                      className="w-full text-center font-black text-base bg-zinc-900 border border-zinc-600 rounded text-cyan-300 outline-none focus:border-cyan-500"
                    />
                  ) : (
                    <div className="text-lg font-black text-cyan-300">{val}</div>
                  )}
                  <div className="text-[7px] text-zinc-600 mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ZUSTANDSMONITORE & LIMITS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {/* Zustandsmonitore */}
            <div className="border border-zinc-700 rounded-lg p-3 bg-zinc-900/60">
              <h2 className="text-xs font-black uppercase tracking-wider text-rose-400 border-b border-zinc-700 pb-1 mb-2">
                Zustandsmonitore
              </h2>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-zinc-400 uppercase">Körperlich</span>
                    <span className="font-bold text-rose-300">{physMonitor} Kästchen</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {Array.from({ length: physMonitor }).map((_, i) => {
                      const dmg = (data.stats || []).find((s) => (s.label || "").toLowerCase().includes("körperlich"))?.damage || 0;
                      return (
                        <div key={i} className={`w-4 h-4 border rounded-sm ${i < dmg ? "bg-rose-600 border-rose-500" : "border-zinc-600 bg-zinc-800"}`} />
                      );
                    })}
                  </div>
                  <div className="text-[8px] text-zinc-500 mt-0.5 font-mono">
                    Formel: ⌈KON/2⌉ + 8 = {physMonitor}
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-zinc-400 uppercase">Geistig (Stun)</span>
                    <span className="font-bold text-blue-300">{stunMonitor} Kästchen</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {Array.from({ length: stunMonitor }).map((_, i) => {
                      const dmg = (data.stats || []).find((s) => (s.label || "").toLowerCase().includes("geistig") || (s.label || "").toLowerCase().includes("stun"))?.damage || 0;
                      return (
                        <div key={i} className={`w-4 h-4 border rounded-sm ${i < dmg ? "bg-blue-600 border-blue-500" : "border-zinc-600 bg-zinc-800"}`} />
                      );
                    })}
                  </div>
                  <div className="text-[8px] text-zinc-500 mt-0.5 font-mono">
                    Formel: ⌈WIL/2⌉ + 8 = {stunMonitor}
                  </div>
                </div>
              </div>
            </div>

            {/* Limits & Kampfwerte */}
            <div className="border border-zinc-700 rounded-lg p-3 bg-zinc-900/60">
              <h2 className="text-xs font-black uppercase tracking-wider text-emerald-400 border-b border-zinc-700 pb-1 mb-2">
                Limits & Kampfwerte
              </h2>
              <div className="grid grid-cols-3 gap-2 text-center mb-3">
                {[
                  { label: "Körperlich", val: physLimit, color: "text-rose-300" },
                  { label: "Geistig", val: mentLimit, color: "text-blue-300" },
                  { label: "Sozial", val: socLimit, color: "text-purple-300" },
                ].map(({ label, val, color }) => (
                  <div key={label} className="bg-zinc-800 border border-zinc-700 rounded p-2">
                    <div className="text-[8px] uppercase text-zinc-500">{label}</div>
                    <div className={`text-xl font-black ${color}`}>{val}</div>
                    <div className="text-[7px] text-zinc-600">Limit</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-zinc-800 border border-zinc-700 rounded p-1.5">
                  <div className="text-[8px] uppercase text-zinc-500">Initiative</div>
                  <div className="font-black text-cyan-300">{initiative} + 1W6</div>
                  <div className="text-[7px] text-zinc-600">REA + INT</div>
                </div>
                <div className="bg-zinc-800 border border-zinc-700 rounded p-1.5">
                  <div className="text-[8px] uppercase text-zinc-500">Abwehrpool</div>
                  <div className="font-black text-emerald-300">{rea + intA}</div>
                  <div className="text-[7px] text-zinc-600">REA + INT</div>
                </div>
              </div>
            </div>
          </div>

          {/* ── AKTIONSFERTIGKEITEN ── */}
          <div className="border border-zinc-700 rounded-lg p-3 bg-zinc-900/60 mb-4">
            <div className="flex items-center justify-between border-b border-zinc-700 pb-1.5 mb-2 flex-wrap gap-2">
              <h2 className="text-xs font-black uppercase tracking-wider text-cyan-400">
                Aktionsfertigkeiten
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono text-zinc-500">
                  {learnedCount} von {mergedActive.length} belegt
                </span>
                {!activePage?.includes("print") && (
                  <button
                    type="button"
                    onClick={() => setShowAllSkills((v) => !v)}
                    className={`no-print text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      showAllSkills
                        ? "bg-zinc-700 border-zinc-500 text-zinc-200 hover:bg-zinc-600"
                        : "bg-zinc-800 border-zinc-600 text-zinc-400 hover:bg-zinc-700"
                    }`}
                  >
                    {showAllSkills ? "◀ Nur belegte" : "▶ Alle anzeigen"}
                  </button>
                )}
              </div>
            </div>

            {/* Fertigkeiten nach Gruppen */}
            <div className="space-y-3">
              {SKILL_GROUPS.map((group) => {
                const groupSkills = visibleActive.filter((s) => s.group === group);
                if (groupSkills.length === 0) return null;
                const headerColor = GROUP_HEADER_COLORS[group] || "bg-zinc-800 text-zinc-300 border-zinc-600";
                const boxColor = GROUP_COLORS[group] || "border-zinc-700 bg-zinc-800/40";

                return (
                  <div key={group} className={`border rounded-lg overflow-hidden ${boxColor}`}>
                    {/* Gruppen-Header */}
                    <div className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider border-b ${headerColor}`}>
                      {group}
                    </div>
                    {/* Skill-Zeilen */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 p-1.5">
                      {groupSkills.map((skill) => (
                        <div
                          key={skill.name}
                          className={`flex items-center justify-between gap-1 px-2 py-1 rounded text-[10px] font-mono ${
                            skill.hasValue
                              ? "bg-white/10 text-zinc-100"
                              : "bg-transparent text-zinc-600"
                          }`}
                        >
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="text-[8px] text-zinc-500 shrink-0">{skill.attr}</span>
                            <span className="truncate">{skill.name}</span>
                          </div>
                          {isEditable ? (
                            <input
                              type="number"
                              min={0}
                              max={12}
                              value={skill.value}
                              onChange={(e) => updateSkill(skill.name, Number(e.target.value))}
                              className="w-10 text-center bg-zinc-900 border border-zinc-600 rounded text-cyan-300 font-bold text-[10px] outline-none focus:border-cyan-500 shrink-0"
                            />
                          ) : (
                            <span className={`font-black shrink-0 ${skill.hasValue ? "text-cyan-300" : "text-zinc-700"}`}>
                              {skill.value > 0 ? skill.value : "—"}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sonstige Aktionsfertigkeiten */}
            {extraSkills.length > 0 && (
              <div className="mt-3 border border-zinc-700 rounded-lg p-2 bg-zinc-800/40">
                <div className="text-[9px] font-black uppercase text-zinc-400 mb-1.5">Sonstige</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                  {extraSkills.map((s) => (
                    <div key={s.name} className="flex items-center justify-between gap-1 px-2 py-1 rounded bg-white/10 text-zinc-100 text-[10px] font-mono">
                      <span className="truncate">{s.name}</span>
                      <span className="font-black text-cyan-300 shrink-0">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* WISSENSFERTIGKEITEN */}
          {knowledgeSkills.length > 0 && (
            <div className="border border-zinc-700 rounded-lg p-3 bg-zinc-900/60">
              <h2 className="text-xs font-black uppercase tracking-wider text-purple-400 border-b border-zinc-700 pb-1 mb-2">
                Wissens- & Sprachfertigkeiten
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {knowledgeSkills.map((s) => (
                  <div key={s.name} className="flex items-center justify-between gap-1 px-2 py-1 rounded border border-purple-800/40 bg-purple-950/20 text-[10px] font-mono">
                    <span className="truncate text-zinc-200">{s.name}</span>
                    <span className="font-black text-purple-300 shrink-0">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ SEITE 2: WAFFEN, AUSRÜSTUNG, CYBERWARE & QUALITÄTEN ══ */}
      {(activePage === "all" || activePage === "page2") && (
        <div className={`printable-sheet max-w-[960px] mx-auto p-6 md:p-8 rounded-xl font-mono text-[11px] leading-tight ${paperBgClass} print:m-0 print:p-4 print:border-none print:shadow-none print:w-full print:max-w-none print:break-before-page`}>

          {/* HEADER SEITE 2 */}
          <div className="border-b-2 border-cyan-500 pb-2 mb-4 flex justify-between items-center">
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-zinc-400">
                Shadowrun 5e • Seite 2
              </span>
              <h2 className="text-xl font-bold text-white">
                {data.name} — Ausrüstung, Cyberware & Qualitäten
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* LINKE SPALTE: WAFFEN & CYBERWARE */}
            <div className="lg:col-span-7 space-y-4">

              {/* Waffen */}
              <div className="border border-zinc-700 rounded-lg p-3 bg-zinc-900/60">
                <h3 className="text-xs font-black uppercase tracking-wider text-rose-400 border-b border-zinc-700 pb-1 mb-2">
                  Waffen & Waffenpool
                </h3>
                {((data.weapons?.melee || []) as any[]).map((w, i) => (
                  <div key={i} className="mb-2 p-2 border border-zinc-700 rounded bg-zinc-800/60">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white">{w.name}</span>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 bg-zinc-700 text-zinc-300 rounded">Nahkampf</span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-[10px] font-mono text-zinc-400 mt-1">
                      <span>Angriff: <strong className="text-cyan-300">{w.attack}</strong></span>
                      <span>Schaden: <strong className="text-rose-300">{w.damage}</strong></span>
                      {w.note && <span className="text-zinc-500 italic">{w.note}</span>}
                    </div>
                  </div>
                ))}
                {((data.weapons?.ranged || []) as any[]).map((w, i) => (
                  <div key={i} className="mb-2 p-2 border border-zinc-700 rounded bg-zinc-800/60">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white">{w.name}</span>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 bg-zinc-700 text-zinc-300 rounded">Fernkampf</span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-[10px] font-mono text-zinc-400 mt-1">
                      <span>Angriff: <strong className="text-cyan-300">{w.attack}</strong></span>
                      <span>Schaden: <strong className="text-rose-300">{w.damage}</strong></span>
                      {w.range && <span>Reichweite: <strong>{w.range}</strong></span>}
                      {w.note && <span className="text-zinc-500 italic">{w.note}</span>}
                    </div>
                  </div>
                ))}
                {!data.weapons?.melee?.length && !data.weapons?.ranged?.length && (
                  <p className="text-zinc-600 text-xs italic">Keine Waffen eingetragen.</p>
                )}
              </div>

              {/* Cyberware/Ausrüstung */}
              {(data.abilities || []).filter((a: any) => a.type === "item").length > 0 && (
                <div className="border border-zinc-700 rounded-lg p-3 bg-zinc-900/60">
                  <h3 className="text-xs font-black uppercase tracking-wider text-cyan-400 border-b border-zinc-700 pb-1 mb-2">
                    Cyberware & Ausrüstung
                  </h3>
                  <div className="space-y-1.5">
                    {(data.abilities || [])
                      .filter((a: any) => a.type === "item")
                      .map((item: any, i: number) => (
                        <div key={i} className="flex items-start justify-between p-1.5 border border-zinc-700 rounded bg-zinc-800/40">
                          <div>
                            <span className="font-bold text-zinc-200">{item.name}</span>
                            {item.effect && <span className="text-zinc-500 text-[10px] ml-2">{item.effect}</span>}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* RECHTE SPALTE: QUALITÄTEN & NOTIZEN */}
            <div className="lg:col-span-5 space-y-4">

              {/* Qualitäten */}
              {(data.abilities || []).filter((a: any) => a.type !== "item").length > 0 && (
                <div className="border border-zinc-700 rounded-lg p-3 bg-zinc-900/60">
                  <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 border-b border-zinc-700 pb-1 mb-2">
                    Qualitäten (Vor- & Nachteile)
                  </h3>
                  <div className="space-y-1.5">
                    {(data.abilities || [])
                      .filter((a: any) => a.type !== "item")
                      .map((ab: any, i: number) => {
                        const isNeg = ab.type === "flaw" || (ab.effect || "").trim().startsWith("-");
                        return (
                          <div key={i} className={`p-1.5 rounded border text-xs ${isNeg ? "border-rose-800/50 bg-rose-950/20" : "border-emerald-800/50 bg-emerald-950/20"}`}>
                            <div className={`font-bold ${isNeg ? "text-rose-300" : "text-emerald-300"}`}>
                              {ab.name}
                            </div>
                            {ab.effect && <p className="text-zinc-400 text-[10px] mt-0.5">{ab.effect}</p>}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Finanzen */}
              {data.currency && (
                <div className="border border-zinc-700 rounded-lg p-3 bg-zinc-900/60">
                  <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 border-b border-zinc-700 pb-1 mb-2">
                    Finanzen
                  </h3>
                  <div className="text-center">
                    <span className="text-2xl font-black text-amber-300">
                      {data.currency.amount} {data.currency.unit || "¥"}
                    </span>
                    <p className="text-zinc-500 text-[9px] mt-0.5">Verfügbare Nuyen</p>
                  </div>
                </div>
              )}

              {/* Notizen */}
              <div className="border border-zinc-700 rounded-lg p-3 bg-zinc-900/60">
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 border-b border-zinc-700 pb-1 mb-2">
                  Läufer-Notizen
                </h3>
                <div className="min-h-[120px] border border-dashed border-zinc-700 rounded p-2 text-zinc-600 text-[10px] italic">
                  {isEditable ? (
                    <textarea
                      rows={5}
                      placeholder="Kontakte, Verbindungen, laufende Jobs..."
                      className="w-full bg-transparent text-zinc-300 outline-none resize-none text-[10px]"
                    />
                  ) : (
                    "Kontakte, Verbindungen, laufende Jobs..."
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
