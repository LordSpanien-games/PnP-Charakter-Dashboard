import React, { FC, useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  SlidersHorizontal, 
  Dices, 
  CheckSquare, 
  Square, 
  Plus, 
  Trash2, 
  Check, 
  User, 
  BookOpen, 
  ShieldAlert, 
  MessageSquare, 
  Briefcase, 
  X,
  Sparkles,
  ArrowUpDown,
  Terminal,
  Cpu,
  Laptop
} from "lucide-react";
import { Skill, GameSystem, CharacterData } from "../types";
import { 
  getTravellerDM, 
  formatTravellerDM, 
  TRAVELLER_SKILL_TO_ATTRIBUTE_MAP 
} from "../utils/traveller";
import { PATHFINDER_SKILL_TO_ATTRIBUTE_MAP } from "../utils/pathfinder";
import { getApplicableProgramModifiersForSkill } from "../utils/cyberdeck";

interface SkillsPageProps {
  data: CharacterData;
  isEditing: boolean;
  onUpdateData: (updates: Partial<CharacterData>) => void;
}

// Category helper maps for automatic grouping
const getSkillCategory = (name: string, system: GameSystem): string => {
  const n = name.toLowerCase();
  
  if (system === 'traveller') {
    if (["pilot", "astronavigation", "raumschiff", "geschütze", "antrieb", "sensoren", "schiff", "navigations"].some(x => n.includes(x))) {
      return "Raumfahrt & Schiff";
    }
    if (["schusswaffen", "nahkampf", "schwer", "taktik", "geschütz", "kampf", "waffen"].some(x => n.includes(x))) {
      return "Kampf & Waffen";
    }
    if (["mechanik", "elektronik", "ingenieur", "wissenschaft", "medizin", "computer", "sprengstoff"].some(x => n.includes(x))) {
      return "Technik & Wissenschaft";
    }
    if (["diplomatie", "verhandlung", "täuschung", "führung", "überreden", "einschüchtern", "gassenwissen"].some(x => n.includes(x))) {
      return "Sozial & Einfluss";
    }
    if (["athletik", "überleben", "fahren", "tarnung", "wahrnehmung", "spurenlesen", "gleiter"].some(x => n.includes(x))) {
      return "Physisch & Umwelt";
    }
    return "Allgemeine Fertigkeiten";
  } else if (system === 'pathfinder') {
    if (["akrobatik", "klettern", "schwimmen", "reiten", "fliegen", "athletik"].some(x => n.includes(x))) {
      return "Körperlich & Bewegung";
    }
    if (["fingerfertigkeit", "heimlichkeit", "mechanismus", "diebeswerkzeug", "schleichen", "taschendiebstahl"].some(x => n.includes(x))) {
      return "Diebeskunst & Heimlichkeit";
    }
    if (["wissen", "zauberkunde", "schätzen", "wahrnehmung", "motiv", "heilkunde", "beruf", "handwerk"].some(x => n.includes(x))) {
      return "Geistig & Analytisch";
    }
    if (["bluffen", "diplomatie", "einschüchtern", "tiere", "verkleiden", "auftreten"].some(x => n.includes(x))) {
      return "Sozial & Einfluss";
    }
    return "Allgemeine Fertigkeiten";
  } else if (system === 'shadowrun') {
    if (["gewehr", "pistol", "nahkampf", "waffenlos", "wurf", "schuss", "automat", "schwer", "klingen", "projektil"].some(x => n.includes(x))) {
      return "Kampf & Taktik";
    }
    if (["schlosser", "hardware", "software", "hacking", "cyber", "fahrzeug", "akrobatik", "schleichen", "fingerfertigkeit", "wahrnehmung", "entfesseln", "diebstahl", "reparatur", "basteln"].some(x => n.includes(x))) {
      return "Physisch & Technisch";
    }
    if (["verhandlung", "einschüchtern", "gebräu", "überreden", "führung", "verkleiden", "schauspiel"].some(x => n.includes(x))) {
      return "Sozial & Einfluss";
    }
    if (["zauber", "beschwör", "magie", "alchemie", "resonanz", "kompil", "astral", "fokus"].some(x => n.includes(x))) {
      return "Magie & Resonanz";
    }
    return "Allgemeines & Wissen";
  } else { // Call of Cthulhu or generic
    if (["überreden", "überzeugen", "einschüchtern", "psychologie", "sprache", "feilschen", "schauspielkunst"].some(x => n.includes(x))) {
      return "Kommunikation & Sozial";
    }
    if (["bibliotheksnutzung", "geschichte", "mythos", "okkultismus", "medizin", "natur", "physik", "chemie", "religion", "archäologie"].some(x => n.includes(x))) {
      return "Wissen & Akademie";
    }
    if (["klettern", "schwimmen", "ausweichen", "springen", "schleichen", "verborgenes", "horchen", "kraftakt", "fahren", "reiten", "mechanische", "elektrische"].some(x => n.includes(x))) {
      return "Physisch & Wahrnehmung";
    }
    if (["faustschlag", "handfeuerwaffen", "gewehr", "nahkampf", "schießen", "kampfsport", "waffen"].some(x => n.includes(x))) {
      return "Kampf & Waffen";
    }
    return "Spezial- & Berufsfertigkeiten";
  }
};

export const SkillsPage: FC<SkillsPageProps> = ({ data, isEditing, onUpdateData }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<'alpha' | 'val-desc' | 'val-asc' | 'checked'>('alpha');
  
  // Rolling simulator states
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [rollModifier, setRollModifier] = useState<number>(0);
  const [isRolling, setIsRolling] = useState(false);
  const [rollResult, setRollResult] = useState<{
    score: number;
    dieVal: number;
    successType: "crit" | "extreme" | "hard" | "regular" | "fail" | "fumble" | "none";
    successText: string;
    successColor: string;
    description: string;
    shadowrunRolls?: number[];
  } | null>(null);

  const skills = useMemo(() => data.skills || [], [data.skills]);

  // Extract all categories dynamically present under current skills
  const categories = useMemo(() => {
    const cats = new Set<string>();
    skills.forEach(s => cats.add(getSkillCategory(s.name, data.system)));
    return Array.from(cats);
  }, [skills, data.system]);

  // Handle Updates to skills
  const handleSkillChange = (index: number, updates: Partial<Skill>) => {
    const updatedSkills = [...skills];
    updatedSkills[index] = { ...updatedSkills[index], ...updates };
    onUpdateData({ skills: updatedSkills });
  };

  const handleAddSkill = () => {
    const defaultVal = data.system === 'pathfinder' ? 0 : 5;
    const newSkill: Skill = {
      name: "Neue Fertigkeit",
      value: defaultVal,
      trained: false,
      checked: false
    };
    onUpdateData({ skills: [...skills, newSkill] });
  };

  const handleRemoveSkill = (index: number) => {
    const updatedSkills = skills.filter((_, i) => i !== index);
    onUpdateData({ skills: updatedSkills });
  };

  // Filter & Sort logic
  const filteredAndSortedSkills = useMemo(() => {
    let result = skills.map((s, originalIndex) => ({ ...s, originalIndex }));

    // Search query filter
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.name.toLowerCase().includes(q) || 
        (s.note && s.note.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (activeCategory !== "all") {
      result = result.filter(s => getSkillCategory(s.name, data.system) === activeCategory);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortOrder === 'alpha') {
        return a.name.localeCompare(b.name);
      }
      if (sortOrder === 'val-desc') {
        return b.value - a.value;
      }
      if (sortOrder === 'val-asc') {
        return a.value - b.value;
      }
      if (sortOrder === 'checked') {
        const aVal = data.system === 'pathfinder' ? (a.trained ? 1 : 0) : (a.checked ? 1 : 0);
        const bVal = data.system === 'pathfinder' ? (b.trained ? 1 : 0) : (b.checked ? 1 : 0);
        return bVal - aVal;
      }
      return 0;
    });

    return result;
  }, [skills, searchQuery, activeCategory, sortOrder, data.system]);

  // Rolling mechanism
  const triggerRoll = (skill: Skill) => {
    setSelectedSkill(skill);
    setRollResult(null);
    setRollModifier(0);
  };

  const executeRoll = () => {
    if (!selectedSkill) return;
    setIsRolling(true);
    setRollResult(null);

    setTimeout(() => {
      const isPathfinder = data.system === 'pathfinder';
      const isShadowrun = data.system === 'shadowrun';
      
      if (isPathfinder) {
        // Pathfinder: d20 + SkillModifier + Temp RollModifier
        const d20 = Math.floor(Math.random() * 20) + 1;
        const baseMod = selectedSkill.value;
        const trainedBonus = selectedSkill.trained ? 3 : 0;
        const totalMod = baseMod + trainedBonus + rollModifier;
        const finalScore = d20 + totalMod;

        let successType: "crit" | "regular" | "fail" | "fumble" = "regular";
        let successText = "Erfolgt";
        let successColor = "text-emerald-400 border-emerald-500/30 bg-emerald-950/20";
        let description = `Ergebnis: ${finalScore} (Basiswert: ${baseMod}${selectedSkill.trained ? ' + 3 geübt' : ''}${rollModifier !== 0 ? ` + Modifikatoren: ${rollModifier}` : ''})`;

        if (d20 === 20) {
          successType = "crit";
          successText = "Kritischer Erfolg!";
          successColor = "text-amber-400 border-amber-500/50 bg-amber-950/30 animate-pulse";
          description = `Eine natürliche 20! Kritischer Erfolg unabhängig vom SG. Gesamt: ${finalScore}`;
        } else if (d20 === 1) {
          successType = "fumble";
          successText = "Kritischer Fehlschlag (Patzer)";
          successColor = "text-red-500 border-red-500/50 bg-red-950/30";
          description = "Eine natürliche 1! Automatischer Fehlschlag.";
        } else {
          description = `Wurf: ${d20} + Modifikatoren: ${totalMod} = Gesamt: ${finalScore}`;
        }

        setRollResult({
          score: finalScore,
          dieVal: d20,
          successType,
          successText,
          successColor,
          description
        });
      } else if (isShadowrun) {
        // Shadowrun: Dice pool (Skill Value + specialization + Temp RollModifier + Cyberdeck Program Modifiers) d6 dice
        const matrixMods = data.cyberdeck 
          ? getApplicableProgramModifiersForSkill(selectedSkill.name, data.cyberdeck)
          : { totalDiceBonus: 0, programs: [], matrixLimit: undefined, hotVrBonus: 0 };

        const basePool = selectedSkill.value + (selectedSkill.checked ? 2 : 0);
        const matrixPoolBonus = matrixMods.totalDiceBonus;
        const pool = Math.max(1, basePool + rollModifier + matrixPoolBonus);
        const rolls: number[] = [];
        let hits = 0;
        let ones = 0;
        for (let i = 0; i < pool; i++) {
          const val = Math.floor(Math.random() * 6) + 1;
          rolls.push(val);
          if (val === 5 || val === 6) hits++;
          if (val === 1) ones++;
        }

        const isGlitch = ones > pool / 2;
        const isCriticalGlitch = isGlitch && hits === 0;

        // Apply Matrix Limit if applicable
        const hasLimit = matrixMods.matrixLimit !== undefined;
        const limitVal = matrixMods.matrixLimit?.value ?? 999;
        const cappedHits = Math.min(hits, limitVal);
        const wasCapped = hasLimit && hits > limitVal;

        let successType: "crit" | "extreme" | "hard" | "regular" | "fail" | "fumble" | "none" = "regular";
        let successText = wasCapped 
          ? `${cappedHits} Hits (Limit: ${limitVal})` 
          : `${cappedHits} ${cappedHits === 1 ? 'Hit' : 'Hits'}`;
        let successColor = "text-emerald-400 border-emerald-500/30 bg-emerald-950/20";
        let description = `Gewürfelt mit einem Pool von ${pool} d6. `;

        const bonusParts: string[] = [];
        if (selectedSkill.checked) bonusParts.push("+2 Spez.");
        if (rollModifier !== 0) bonusParts.push(`${rollModifier > 0 ? '+' : ''}${rollModifier} Mod`);
        if (matrixMods.programs.length > 0) {
          const progSummary = matrixMods.programs.map(p => `+${p.bonus} ${p.programName}`).join(', ');
          bonusParts.push(progSummary);
        }
        if (matrixMods.hotVrBonus > 0) {
          bonusParts.push("+2 Heiß-VR");
        }

        if (bonusParts.length > 0) {
          description += `(Basis: ${selectedSkill.value} ${bonusParts.join(' ')}). `;
        }

        if (wasCapped) {
          description += `Erfolge wurden durch das Matrix-Limit (${matrixMods.matrixLimit?.attribute}: ${limitVal}) von ${hits} auf ${cappedHits} begrenzt. `;
        } else if (hasLimit) {
          description += `Matrix-Limit (${matrixMods.matrixLimit?.attribute}: ${limitVal}) eingehalten. `;
        }

        if (isCriticalGlitch) {
          successType = "fumble";
          successText = "Kritischer Patzer!";
          successColor = "text-red-500 border-red-500/50 bg-red-950/30 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.2)]";
          description += ` Mehr als die Hälfte der Würfel (${ones}) zeigen eine 1 - und keine Erfolge!`;
        } else if (isGlitch) {
          successType = "fumble";
          successText = "Patzer!";
          successColor = "text-amber-500 border-amber-500/40 bg-amber-950/20";
          description += ` Mehr als die Hälfte der Würfel (${ones}) zeigen eine 1.`;
        } else if (cappedHits === 0) {
          successType = "fail";
          successText = "Keine Erfolge";
          successColor = "text-zinc-500 border-zinc-800 bg-zinc-90 w-fit";
          description += " Keins deiner Ergebnisse zeigt eine 5 oder 6.";
        }

        setRollResult({
          score: cappedHits,
          dieVal: pool,
          successType,
          successText,
          successColor,
          description,
          shadowrunRolls: rolls
        });
      } else if (data.system === 'traveller') {
        // Traveller: 2D6 + Skill Level + Attr DM + rollModifier vs Target (Default SG 8 Average)
        const d1 = Math.floor(Math.random() * 6) + 1;
        const d2 = Math.floor(Math.random() * 6) + 1;
        const raw2D6 = d1 + d2;

        let attrDM = 0;
        let attrName = selectedSkill.note ? selectedSkill.note.trim().toUpperCase() : "";
        if (!attrName) {
          const cleanName = selectedSkill.name.trim().toLowerCase();
          const mappedKey = Object.keys(TRAVELLER_SKILL_TO_ATTRIBUTE_MAP).find(
            k => cleanName.includes(k) || k.includes(cleanName)
          );
          if (mappedKey) {
            attrName = TRAVELLER_SKILL_TO_ATTRIBUTE_MAP[mappedKey];
          }
        }
        if (attrName && data.stats) {
          const attrObj = data.stats.find(
            s => (s?.label || '').toUpperCase() === attrName || (s?.label || '').toUpperCase().startsWith(attrName)
          );
          if (attrObj) {
            const rawVal = typeof attrObj.value === 'number' ? attrObj.value : parseInt(attrObj.value.toString().replace(/[+]/g, ''), 10) || 7;
            const dmg = attrObj.damage || 0;
            const effVal = Math.max(0, rawVal - dmg);
            attrDM = getTravellerDM(effVal);
          }
        }

        const skillLevel = selectedSkill.value;
        const totalMod = skillLevel + attrDM + rollModifier;
        const finalScore = raw2D6 + totalMod;
        const targetSG = 8;
        const effect = finalScore - targetSG;

        let successType: "crit" | "extreme" | "hard" | "regular" | "fail" | "fumble" = "regular";
        let successText = `Erfolg (+${effect >= 0 ? effect : 0})`;
        let successColor = "text-blue-300 border-blue-500/30 bg-blue-950/20";
        let description = `2D6 (${d1} + ${d2} = ${raw2D6}) + Stufe ${skillLevel} + DM ${formatTravellerDM(attrDM)}${rollModifier !== 0 ? ` + Mod ${rollModifier}` : ''} = ${finalScore} vs SG ${targetSG}. Effektwert: ${effect >= 0 ? `+${effect}` : effect}.`;

        if (raw2D6 === 12) {
          successType = "crit";
          successText = "Kritischer Erfolg (12)!";
          successColor = "text-emerald-400 border-emerald-500/50 bg-emerald-950/40 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.2)]";
          description = `Natürliche 12 gewürfelt! Legendärer kritischer Erfolg. Gesamt: ${finalScore} vs SG ${targetSG} (Effekt: +${effect}).`;
        } else if (raw2D6 === 2) {
          successType = "fumble";
          successText = "Katastrophaler Patzer (2)!";
          successColor = "text-red-500 border-red-500/50 bg-red-950/40 animate-bounce shadow-[0_0_15px_rgba(239,68,68,0.2)]";
          description = `Natürliche 2 gewürfelt (Snake Eyes)! Automatischer kritischer Fehlschlag / Panne (Mishap). Gesamt: ${finalScore} vs SG ${targetSG}.`;
        } else if (effect >= 6) {
          successType = "extreme";
          successText = `Außergewöhnlicher Erfolg (+${effect})`;
          successColor = "text-cyan-400 border-cyan-500/40 bg-cyan-950/25 shadow-md";
        } else if (finalScore >= targetSG) {
          successType = "regular";
          successText = effect === 0 ? "Knapper Erfolg (Effekt 0)" : `Erfolg (+${effect})`;
          successColor = "text-blue-300 border-blue-500/30 bg-blue-950/20";
        } else if (effect <= -6) {
          successType = "fumble";
          successText = `Schwerer Fehlschlag (${effect})`;
          successColor = "text-red-500 border-red-800/50 bg-red-950/20";
        } else {
          successType = "fail";
          successText = `Fehlschlag (${effect})`;
          successColor = "text-red-400 border-red-900/30 bg-red-950/10";
        }

        setRollResult({
          score: finalScore,
          dieVal: raw2D6,
          successType,
          successText,
          successColor,
          description,
          shadowrunRolls: [d1, d2]
        });
      } else {
        // Call of Cthulhu d100
        const d100 = Math.floor(Math.random() * 100) + 1;
        const target = selectedSkill.value + rollModifier;
        
        const halfTarget = Math.floor(target / 2);
        const fifthTarget = Math.floor(target / 5);

        let successType: "crit" | "extreme" | "hard" | "regular" | "fail" | "fumble" = "fail";
        let successText = "Fehlschlag";
        let successColor = "text-red-400 border-red-500/30 bg-red-950/10";
        
        if (d100 === 1) {
          successType = "crit";
          successText = "Kritischer Erfolg!";
          successColor = "text-emerald-300 border-emerald-400/50 bg-emerald-950/40 shadow-[0_0_15px_rgba(16,185,129,0.1)]";
        } else if (d100 === 100 || (target < 50 && d100 >= 96)) {
          successType = "fumble";
          successText = "Patzer!";
          successColor = "text-red-600 border-red-600/50 bg-red-950/40 animate-pulse";
        } else if (d100 <= fifthTarget) {
          successType = "extreme";
          successText = "Extremer Erfolg";
          successColor = "text-cyan-400 border-cyan-500/40 bg-cyan-950/20";
        } else if (d100 <= halfTarget) {
          successType = "hard";
          successText = "Schwerer Erfolg";
          successColor = "text-amber-400 border-amber-500/30 bg-amber-950/10";
        } else if (d100 <= target) {
          successType = "regular";
          successText = "Regulärer Erfolg";
          successColor = "text-zinc-200 border-zinc-700 bg-zinc-900/50";
        }

        let description = `Gewürfelt: ${d100} gegen Zielwert ${target} ` +
          `(Regulär: ${target} | Schwer: ${halfTarget} | Extrem: ${fifthTarget})`;
        if (rollModifier !== 0) {
          description += ` (Inkl. Modifikator: ${rollModifier > 0 ? `+${rollModifier}` : rollModifier})`;
        }

        setRollResult({
          score: d100,
          dieVal: d100,
          successType,
          successText,
          successColor,
          description
        });
      }
      setIsRolling(false);
    }, 850);
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Intro Subtitle */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-orange-500">
          <Sparkles size={16} />
          <span className="text-xs uppercase font-mono tracking-widest font-black">Interaktives Kontrollzentrum</span>
        </div>
        <h2 className="text-4xl font-extrabold text-white tracking-tight">FERTIGKEITEN-KATALOG</h2>
        <p className="text-sm text-zinc-550 max-w-2xl font-mono leading-relaxed">
          Durchsuche, filtere und steigere alle Fertigkeiten deines Helden. Führe per Mausklick direkte System-Würfe aus, inklusive Modifikatoren und Stufen-Berechnungen.
        </p>
      </div>

      {/* Control Utility Bar (Search, Filters, Sort) */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between bg-zinc-900/40 border border-zinc-800 p-4 rounded-2xl backdrop-blur-md">
        {/* Search Input */}
        <div className="flex-1 relative flex items-center">
          <Search size={18} className="absolute left-3 text-zinc-650 pointer-events-none" />
          <input 
            type="text" 
            placeholder="Fertigkeiten durchsuchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-950/80 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-650 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 font-mono text-xs transition-all"
          />
        </div>

        {/* Action Controls (Categories & sorting) */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Sorting Dropdown */}
          <div className="flex items-center gap-1.5 bg-zinc-950/50 border border-zinc-800 rounded-xl px-3 py-1.5">
            <ArrowUpDown size={14} className="text-zinc-500" />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="bg-transparent border-none text-xs text-zinc-400 font-mono font-bold focus:outline-none focus:ring-0 cursor-pointer"
            >
              <option value="alpha" className="bg-zinc-950">Alphabetisch [A-Z]</option>
              <option value="val-desc" className="bg-zinc-950">Wert [Hoch → Tief]</option>
              <option value="val-asc" className="bg-zinc-950">Wert [Tief → Hoch]</option>
              <option value="checked" className="bg-zinc-950">
                {data.system === 'pathfinder' ? "Nur Geübte vorziehen" : data.system === 'shadowrun' ? "Nur Spezialisierte vorziehen" : "Erfolgreiche vorziehen"}
              </option>
            </select>
          </div>

          {/* New Skill Manual Add (only visible if Editing) */}
          {isEditing && (
            <button 
              id="btn-add-skill-catalog"
              onClick={handleAddSkill}
              className="px-4 py-2 bg-orange-650/20 hover:bg-orange-655 text-orange-400 border border-orange-500/30 rounded-xl text-xs font-bold font-mono tracking-wider transition-all flex items-center gap-1.5"
            >
              <Plus size={14} /> FERTIGKEIT ZUFÜGEN
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs Section */}
      <div className="flex flex-wrap gap-1.5 border-b border-zinc-850 pb-3">
        <button
          onClick={() => setActiveCategory("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
            activeCategory === "all" 
              ? "bg-zinc-100 text-black shadow-sm" 
              : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50"
          }`}
        >
          ALLE FERTIGKEITEN ({skills.length})
        </button>
        {categories.map((cat, i) => {
          const count = skills.filter(s => getSkillCategory(s.name, data.system) === cat).length;
          return (
            <button
              key={i}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                activeCategory === cat 
                  ? "bg-zinc-100 text-black shadow-sm" 
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50"
              }`}
            >
              {(cat || "").toUpperCase()} ({count})
            </button>
          );
        })}
      </div>

      {/* Main Grid of Skills */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredAndSortedSkills.map((skill) => {
            const isPathfinder = data.system === 'pathfinder';
            const cat = getSkillCategory(skill.name, data.system);
            
            return (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                key={skill.originalIndex}
                className={`relative bg-zinc-900/30 border p-4 rounded-2xl flex flex-col justify-between hover:bg-zinc-900/50 hover:border-zinc-700 transition-all group ${
                  skill.checked || (isPathfinder && skill.trained) 
                    ? "border-orange-500/20 ring-1 ring-orange-500/5" 
                    : "border-zinc-800/80"
                }`}
              >
                {/* Trash icon if editing */}
                {isEditing && (
                  <button
                    onClick={() => handleRemoveSkill(skill.originalIndex)}
                    className="absolute top-3 right-3 p-1.5 text-zinc-650 hover:text-red-500 bg-red-950/10 hover:bg-red-950/30 border border-red-900/10 hover:border-red-500/30 rounded-lg transition-all"
                    title="Fertigkeit löschen"
                    id={`btn-del-skill-${skill.originalIndex}`}
                  >
                    <Trash2 size={13} />
                  </button>
                )}

                {/* Card Top Section: Tick checkbox & Name / Category */}
                <div>
                  <div className="flex items-start gap-2.5">
                    {/* Tick icon toggler */}
                    <button
                      onClick={() => {
                        if (isPathfinder) {
                          handleSkillChange(skill.originalIndex, { trained: !skill.trained });
                        } else {
                          handleSkillChange(skill.originalIndex, { checked: !skill.checked });
                        }
                      }}
                      className={`mt-0.5 border rounded p-0.5 shrink-0 transition-colors ${
                        isPathfinder
                          ? skill.trained 
                            ? "bg-amber-500 border-amber-600 text-black hover:bg-amber-400" 
                            : "border-zinc-700 hover:border-zinc-500 text-transparent"
                          : data.system === 'shadowrun'
                            ? skill.checked
                              ? "bg-cyan-600 border-cyan-700 text-white hover:bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.25)]"
                              : "border-zinc-700 hover:border-zinc-500 text-transparent"
                            : data.system === 'traveller'
                              ? skill.checked
                                ? "bg-blue-600 border-blue-700 text-white hover:bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]"
                                : "border-zinc-700 hover:border-zinc-500 text-transparent"
                              : skill.checked 
                                ? "bg-orange-600 border-orange-700 text-white hover:bg-orange-500 animate-pulse" 
                                : "border-zinc-700 hover:border-zinc-500 text-transparent"
                      }`}
                      title={isPathfinder ? "Als geübt/Klassenfertigkeit markieren (+3 Bonus)" : data.system === 'shadowrun' ? "Als Spezialisierung markieren (+2 Würfel)" : data.system === 'traveller' ? "Als bevorzugt markieren" : "Als erfolgreich verwendet markieren (Häkchen)"}
                      id={`btn-check-skill-${skill.originalIndex}`}
                    >
                      <Check size={10} className="stroke-[3px]" />
                    </button>

                    <div className="min-w-0 pr-6">
                      {isEditing ? (
                        <div className="space-y-1">
                          <input
                            type="text"
                            value={skill.name}
                            onChange={(e) => handleSkillChange(skill.originalIndex, { name: e.target.value })}
                            className="bg-zinc-850 border border-zinc-750 px-2 py-0.5 rounded text-xs font-bold text-white w-full focus:outline-none focus:border-orange-500"
                          />
                          <input
                            type="text"
                            value={skill.note || ""}
                            onChange={(e) => handleSkillChange(skill.originalIndex, { note: e.target.value })}
                            placeholder="Anmerkung (z.B. Attribut)"
                            className="bg-transparent border-none p-0 text-[10px] text-zinc-500 w-full focus:outline-none focus:ring-0"
                          />
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-sm font-black text-zinc-200 tracking-tight leading-tight group-hover:text-white transition-colors truncate">
                              {skill.name}
                            </h4>
                            {isPathfinder && (() => {
                              const cleanName = skill.name.trim().toLowerCase();
                              const mappedAttr = Object.keys(PATHFINDER_SKILL_TO_ATTRIBUTE_MAP).find(
                                key => cleanName.includes(key) || key.includes(cleanName)
                              );
                              const attrKey = mappedAttr ? PATHFINDER_SKILL_TO_ATTRIBUTE_MAP[mappedAttr] : (skill.note ? skill.note.trim().toUpperCase() : null);
                              if (!attrKey) return null;
                              return (
                                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold shrink-0" title={`Grundwert: ${attrKey}`}>
                                  {attrKey}
                                </span>
                              );
                            })()}
                          </div>
                          <span className="text-[9px] uppercase tracking-wider text-zinc-600 font-bold font-mono">
                            {cat}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Note info label */}
                  {!isEditing && skill.note && (
                    <p className="text-[10px] text-zinc-500 font-mono italic mt-2 bg-zinc-950/20 px-2.5 py-1 rounded-lg border border-zinc-900/30 w-fit">
                      {skill.note}
                    </p>
                  )}
                </div>

                {/* Card Bottom Panel: Value Display & Dice Roller */}
                <div className="mt-4 flex items-center justify-between border-t border-zinc-850/50 pt-3">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-mono text-zinc-655 font-bold">Wert:</span>
                      <input
                        type="number"
                        value={skill.value}
                        onChange={(e) => handleSkillChange(skill.originalIndex, { value: parseInt(e.target.value) || 0 })}
                        className="w-14 text-center bg-zinc-850 border border-zinc-750 rounded px-1.5 py-0.5 text-xs text-orange-400 font-black font-mono focus:outline-none"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      {/* Detailed Value stats for Shadowrun / Traveller / CoC% / Pathfinder systems */}
                      {data.system === 'shadowrun' ? (
                        <div className="flex flex-col">
                          <span className="text-[10px] text-zinc-550 font-bold font-mono leading-none">Würfelpool (Basis)</span>
                          <span className="text-base font-black text-cyan-400 font-mono mt-0.5">
                            {skill.value} d6
                            {skill.checked && (
                              <span className="text-xs font-black text-emerald-400 ml-1.5 uppercase font-mono bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                +2 Spez.
                              </span>
                            )}
                          </span>
                        </div>
                      ) : data.system === 'traveller' ? (
                        <div className="flex flex-col">
                          <span className="text-[10px] text-zinc-550 font-bold font-mono leading-none">Fertigkeitsstufe (2D6)</span>
                          <span className="text-base font-black text-blue-400 font-mono mt-0.5">
                            Stufe {skill.value}
                            {skill.note && (
                              <span className="text-[10px] text-zinc-400 ml-1.5 font-normal">
                                ({skill.note})
                              </span>
                            )}
                          </span>
                        </div>
                      ) : !isPathfinder ? (
                        <div className="flex flex-col">
                          <span className="text-xs text-zinc-550 font-bold font-mono leading-none">Basis / Halbiert / Fünftel</span>
                          <div className="flex items-baseline gap-1.5 mt-0.5">
                            <span className="text-base font-black text-orange-400 font-mono">{skill.value}%</span>
                            <span className="text-[10px] text-zinc-500 font-mono">({Math.floor(skill.value/2)}% / {Math.floor(skill.value/5)}%)</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          <span className="text-[10px] text-zinc-550 font-bold font-mono leading-none">Bonusmodifikator</span>
                          <span className="text-base font-black text-amber-400 font-mono mt-0.5">
                            {skill.value >= 0 ? `+${skill.value + (skill.trained ? 3 : 0)}` : skill.value + (skill.trained ? 3 : 0)}
                            <span className="text-[9px] text-zinc-650 ml-1.5 font-normal">
                              (Basis: {skill.value >= 0 ? `+${skill.value}` : skill.value}{skill.trained ? ", geübt +3" : ""})
                            </span>
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Dice Roll Trigger button */}
                  {!isEditing && (
                    <button
                      onClick={() => triggerRoll(skill)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-black font-mono tracking-widest transition-all flex items-center gap-1.5 ${
                        isPathfinder 
                          ? "bg-amber-500/10 hover:bg-amber-500/25 text-amber-400 border border-amber-500/20" 
                          : data.system === 'shadowrun'
                            ? "bg-cyan-500/10 hover:bg-cyan-500/25 text-cyan-400 border border-cyan-500/20"
                            : data.system === 'traveller'
                              ? "bg-blue-500/10 hover:bg-blue-500/25 text-blue-400 border border-blue-500/20 shadow-[0_0_12px_rgba(59,130,246,0.15)]"
                              : "bg-orange-500/10 hover:bg-orange-500/25 text-orange-400 border border-orange-500/20"
                      }`}
                      id={`btn-roll-skill-${skill.originalIndex}`}
                    >
                      <Dices size={12} className="stroke-[2.5px]" /> ROLLEN
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredAndSortedSkills.length === 0 && (
          <div className="col-span-full border border-dashed border-zinc-800 p-12 rounded-3xl text-center">
            <User size={30} className="text-zinc-700 mx-auto mb-3" />
            <p className="text-sm text-zinc-500 font-mono">Keine Fertigkeiten gefunden, die deiner Suche entsprechen.</p>
          </div>
        )}
      </div>

      {/* Elegant Dice Rolling Floating Dialog Modal */}
      <AnimatePresence>
        {selectedSkill && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-zinc-950 border border-zinc-800/80 p-6 rounded-3xl w-full max-w-md shadow-2xl relative"
            >
              <button
                onClick={() => {
                  setSelectedSkill(null);
                  setRollResult(null);
                }}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white p-1 rounded-full hover:bg-zinc-900 transition-colors"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-2 mb-4 text-orange-400">
                <Dices size={16} />
                <span className="text-[10px] font-mono tracking-widest font-black uppercase">Würfel-Simulator</span>
              </div>

              <h3 className="text-xl font-black text-white tracking-tight mb-1">{selectedSkill.name}</h3>
              <p className="text-xs text-zinc-500 font-mono mb-4">
                {data.system === 'pathfinder' 
                  ? `Basiswert: ${selectedSkill.value >= 0 ? `+${selectedSkill.value}` : selectedSkill.value}${selectedSkill.trained ? " (inkl. +3 Bonus für geübte Fertigkeit)" : ""}` 
                  : data.system === 'shadowrun'
                    ? `Zielwert für Erfolg: Jede 5 oder 6 auf den d6-Würfeln deines Pools`
                    : data.system === 'traveller'
                      ? `2D6 + Stufe ${selectedSkill.value} + Attribut-DM gegen Standard-SG 8 (Durchschnitt)`
                      : `Zielwert für Erfolg: ${selectedSkill.value}%`
                }
              </p>

              {/* Cyberdeck & Program Modifiers Panel (Shadowrun) */}
              {data.system === 'shadowrun' && data.cyberdeck && (() => {
                const matrixMods = getApplicableProgramModifiersForSkill(selectedSkill.name, data.cyberdeck);
                const hasMatrixMods = matrixMods.programs.length > 0 || matrixMods.hotVrBonus > 0 || matrixMods.matrixLimit;
                if (!hasMatrixMods) return null;

                return (
                  <div className="bg-emerald-950/20 border border-emerald-500/30 p-3.5 rounded-2xl mb-4 space-y-2 font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-400 flex items-center gap-1.5">
                        <Terminal size={12} /> Matrix-Deck: {data.cyberdeck.name}
                      </span>
                      {matrixMods.matrixLimit && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-bold">
                          Matrix-Limit: {matrixMods.matrixLimit.attribute} ({matrixMods.matrixLimit.value})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {matrixMods.programs.map((prog, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-emerald-900/40 border border-emerald-500/30 text-[10px] text-emerald-300 font-bold flex items-center gap-1">
                          <Cpu size={10} /> +{prog.bonus} {prog.programName}
                        </span>
                      ))}
                      {matrixMods.hotVrBonus > 0 && (
                        <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/40 text-[10px] text-amber-300 font-bold flex items-center gap-1">
                          🔥 +2 Heißes VR
                        </span>
                      )}
                    </div>

                    <div className="text-[10px] text-zinc-400">
                      Aktiver Pool: <strong className="text-white">{selectedSkill.value + (selectedSkill.checked ? 2 : 0) + rollModifier + matrixMods.totalDiceBonus} d6</strong>
                      {' '}(Basis {selectedSkill.value} {selectedSkill.checked ? '+ 2 Spez.' : ''} {rollModifier !== 0 ? `${rollModifier > 0 ? '+' : ''}${rollModifier} Sit.` : ''} {matrixMods.totalDiceBonus > 0 ? `+ ${matrixMods.totalDiceBonus} Deck/Programme` : ''})
                    </div>
                  </div>
                );
              })()}

              {/* Adjustment Modifiers Panel */}
              <div className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-850 mb-6 flex flex-col gap-3">
                <span className="text-[9px] uppercase font-mono tracking-wider font-bold text-zinc-500 block">Wurfsituation / Umgebungs-Modifikator</span>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setRollModifier(prev => prev - (data.system === 'pathfinder' || data.system === 'traveller' ? 1 : data.system === 'shadowrun' ? 1 : 5))}
                      className="p-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-white transition-all text-xs font-black font-mono shrink-0"
                    >
                      {data.system === 'pathfinder' || data.system === 'traveller' ? "-1 DM" : data.system === 'shadowrun' ? "-1 Würfel" : "-5%"}
                    </button>
                    <span className="text-xs font-mono font-bold text-zinc-300">
                      {rollModifier > 0 ? `+${rollModifier}` : rollModifier}{data.system === 'pathfinder' ? "" : data.system === 'traveller' ? " DM" : data.system === 'shadowrun' ? " d6" : "%"}
                    </span>
                    <button
                      onClick={() => setRollModifier(prev => prev + (data.system === 'pathfinder' || data.system === 'traveller' ? 1 : data.system === 'shadowrun' ? 1 : 5))}
                      className="p-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-white transition-all text-xs font-black font-mono shrink-0"
                    >
                      {data.system === 'pathfinder' || data.system === 'traveller' ? "+1 DM" : data.system === 'shadowrun' ? "+1 Würfel" : "+5%"}
                    </button>
                  </div>

                  <span className="text-[10px] text-zinc-500 font-mono text-right italic">
                     {data.system === 'pathfinder' || data.system === 'traveller' ? "Situations-Modifikator (DM)" : data.system === 'shadowrun' ? "Würfelpool-Größe anpassen" : "Chance anpassen"}
                  </span>
                </div>
              </div>

              {/* Big Core Roll Interface */}
              <div className="flex flex-col items-center justify-center py-6 border-y border-zinc-850/40 my-4 min-h-[140px]">
                {isRolling ? (
                  <div className="flex flex-col items-center justify-center gap-3">
                    <motion.div
                      animate={{ 
                        rotate: [0, 20, -20, 15, -15, 0],
                        scale: [1, 1.1, 0.95, 1.05, 1]
                      }}
                      transition={{ repeat: Infinity, duration: 0.6 }}
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center border font-black text-2xl shadow-xl font-mono ${
                        data.system === 'pathfinder' 
                          ? "bg-amber-400/10 border-amber-500 text-amber-400" 
                          : data.system === 'traveller'
                            ? "bg-blue-500/10 border-blue-500 text-blue-400"
                            : data.system === 'shadowrun'
                              ? "bg-cyan-500/10 border-cyan-500 text-cyan-400"
                              : "bg-orange-500/10 border-orange-500 text-orange-500"
                      }`}
                    >
                      🎲
                    </motion.div>
                    <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 font-bold animate-pulse">
                      Würfel rollen...
                    </span>
                  </div>
                ) : rollResult ? (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center gap-3 w-full"
                  >
                    <div className="flex items-center gap-4">
                      {/* Dice representation */}
                      <div className="flex flex-col items-center">
                        <span className="text-[8px] uppercase tracking-wider text-zinc-650 font-black font-mono">Die Wurf-Zahl</span>
                        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center font-black text-2xl font-mono text-white mt-1 shadow-md">
                          {rollResult.dieVal}
                        </div>
                      </div>

                      {/* Pathfinder/Success score panel */}
                      <div className="flex flex-col items-center justify-center text-4xl">
                        <span>➜</span>
                      </div>

                      <div className="flex flex-col items-center">
                        <span className="text-[8px] uppercase tracking-wider text-zinc-655 font-black font-mono">Endergebnis</span>
                        <div className={`w-16 h-16 rounded-2xl bg-zinc-950 border flex items-center justify-center font-black text-2xl font-mono mt-1 shadow-xl ${
                          data.system === 'traveller' ? "border-blue-500/30 text-blue-400" : "border-orange-500/20 text-orange-400"
                        }`}>
                          {rollResult.score}
                        </div>
                      </div>
                    </div>

                    {/* Highly polished feedback panel */}
                    <div className={`mt-3 py-2 px-5 rounded-2xl border text-sm font-black uppercase tracking-widest font-mono ${rollResult.successColor}`}>
                      {rollResult.successText}
                    </div>

                    <p className="text-xs text-zinc-400 font-mono mt-1 text-center font-semibold leading-relaxed px-4">
                      {rollResult.description}
                    </p>
                  </motion.div>
                ) : (
                  <button
                    onClick={executeRoll}
                    className={`px-8 py-4 rounded-2xl text-xs font-black font-mono tracking-[0.2em] shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2.5 ${
                      data.system === 'pathfinder' 
                        ? "bg-amber-500 text-black hover:bg-amber-400" 
                        : data.system === 'shadowrun'
                          ? "bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.15)]"
                          : data.system === 'traveller'
                            ? "bg-blue-600 text-white hover:bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                            : "bg-orange-500 text-black hover:bg-orange-400"
                    }`}
                  >
                    <Dices size={16} /> JETZT WÜRFELN
                  </button>
                )}
              </div>

              {/* Close Button Footer */}
              <div className="mt-2 flex gap-3">
                <button
                  onClick={() => {
                    setSelectedSkill(null);
                    setRollResult(null);
                  }}
                  className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-xl text-center text-xs font-black text-zinc-450 hover:text-white transition-all font-mono tracking-wider"
                >
                  SCHLIEẞEN
                </button>
                {rollResult && (
                  <button
                    onClick={executeRoll}
                    className={`w-full py-2.5 rounded-xl text-center text-xs font-black transition-all font-mono tracking-wider flex items-center justify-center gap-1.5 ${
                      data.system === 'pathfinder'
                        ? "bg-amber-500/10 hover:bg-amber-400/20 text-amber-400 border border-amber-500/20"
                        : data.system === 'shadowrun'
                          ? "bg-cyan-500/10 hover:bg-cyan-400/20 text-cyan-400 border border-cyan-500/20"
                          : data.system === 'traveller'
                            ? "bg-blue-500/10 hover:bg-blue-400/20 text-blue-400 border border-blue-500/20 shadow-[0_0_12px_rgba(59,130,246,0.2)]"
                            : "bg-orange-500/10 hover:bg-orange-400/20 text-orange-400 border border-orange-500/20"
                    }`}
                  >
                    <Dices size={12} /> ERNEUT WÜRFELN
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
