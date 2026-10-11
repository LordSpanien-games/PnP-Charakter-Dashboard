import React, { FC, useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Dices, 
  Plus, 
  Minus, 
  RotateCcw, 
  Sliders, 
  Info,
  Zap,
  HelpCircle,
  TrendingUp,
  Award,
  Shield
} from "lucide-react";
import { CharacterData, GameSystem } from "../types";
import { calculateShadowrunLimits } from "../utils/limits";
import { 
  TRAVELLER_DIFFICULTIES, 
  getTravellerDM, 
  formatTravellerDM, 
  calculateTravellerProbability, 
  TRAVELLER_SKILL_TO_ATTRIBUTE_MAP 
} from "../utils/traveller";
import { 
  PATHFINDER_CORE_ATTRIBUTES, 
  calculatePathfinderModifier, 
  formatPathfinderModifier, 
  getOrInitializePathfinderCharacteristics 
} from "../utils/pathfinder";

interface DiceCalculatorProps {
  data: CharacterData;
}

interface RollHistoryEntry {
  id: string;
  timestamp: string;
  system: GameSystem;
  title: string;
  formula: string;
  rolls: number[];
  modifier: number;
  result: number | string;
  statusText: string;
  statusColor: string;
  details: string;
}

const SHADOWRUN_SKILL_TO_ATTRIBUTE_MAPPING: Record<string, string> = {
  // GES (Geschicklichkeit)
  "pistolen": "GES",
  "gewehre": "GES",
  "klingenwaffen": "GES",
  "schleichen": "GES",
  "waffenloser kampf": "GES",
  "knüppel": "GES",
  "schwere waffen": "GES",
  "projektilwaffen": "GES",
  "exotische fernkampfwaffe": "GES",
  "infiltrat.": "GES",
  "infiltration": "GES",
  "schlossknacken": "GES",
  "taschendiebstahl": "GES",
  "fliegen": "GES",
  "reiten": "GES",
  "athletik": "GES",
  "nahkampf": "GES",
  "gewehr": "GES",
  "pistole": "GES",
  "bogen": "GES",

  // LOG (Logik)
  "hacking": "LOG",
  "computer": "LOG",
  "software": "LOG",
  "hardware": "LOG",
  "sprengstoffe": "LOG",
  "kybernetik": "LOG",
  "erste hilfe": "LOG",
  "medizin": "LOG",
  "fahrzeugmechanik": "LOG",
  "waffenbau": "LOG",
  "chemie": "LOG",
  "luftfahrzeugmechanik": "LOG",
  "cybertechnologie": "LOG",
  "sicherheitsdesign": "LOG",
  "cyberkampf": "LOG",
  "matrixkampf": "LOG",

  // INT (Intuition)
  "wahrnehmung": "INT",
  "spurenlesen": "INT",
  "navigation": "INT",
  "survival": "INT",
  "verkleiden": "INT",
  "handwerk": "INT",
  "ausweichen": "INT",

  // CHA (Charisma)
  "gebräuche": "CHA",
  "verhandlung": "CHA",
  "einschüchtern": "CHA",
  "überreden": "CHA",
  "führung": "CHA",
  "täuschen": "CHA",
  "tierführung": "CHA",
  "überzeugung": "CHA",

  // REA (Reaktion)
  "bodenfahrzeuge": "REA",
  "luftfahrzeuge": "REA",
  "wasserfahrzeuge": "REA",
  "läufer": "REA",
  "exotisches fahrzeug": "REA",

  // STÄ (Stärke)
  "laufen": "STÄ",
  "schwimmen": "STÄ",
  "gymnastik": "STÄ",
  "heben/tragen": "STÄ",

  // WIL (Willenskraft)
  "spruchzauberei": "WIL",
  "herbeirufen": "WIL",
  "hexerei": "WIL",
  "spruchabwehr": "WIL",
  "ritualzauberei": "WIL",
  "antimagie": "WIL",
  "astraler kampf": "WIL",
  "bannen": "WIL",
  "binden": "WIL"
};

export const DiceCalculator: FC<DiceCalculatorProps> = ({ data }) => {
  const [history, setHistory] = useState<RollHistoryEntry[]>([]);
  
  // Tab-specific config (General vs System-specific)
  const [calcMode, setCalcMode] = useState<"system" | "custom">("system");

  // --- SYSTEM CALC STATES ---
  // Shadowrun States
  const [srBasePool, setSrBasePool] = useState<number>(8);
  const [srModifier, setSrModifier] = useState<number>(0);
  const [srSpecialized, setSrSpecialized] = useState<boolean>(false);
  const [srSkillSelected, setSrSkillSelected] = useState<string>("");
  const [srAttrSelected, setSrAttrSelected] = useState<string>("");
  const [srActiveGear, setSrActiveGear] = useState<Record<string, { enabled: boolean; bonus: number }>>({});
  const [showAllSrGear, setShowAllSrGear] = useState<boolean>(false);

  // Pathfinder States
  const [pfBaseModifier, setPfBaseModifier] = useState<number>(5);
  const [pfModifier, setPfModifier] = useState<number>(0);
  const [pfTargetDC, setPfTargetDC] = useState<number>(15);
  const [pfSkillSelected, setPfSkillSelected] = useState<string>("");

  // Call of Cthulhu States
  const [cocBaseValue, setCocBaseValue] = useState<number>(50);
  const [cocModifier, setCocModifier] = useState<number>(0); // Target adjust
  const [cocDiceType, setCocDiceType] = useState<"normal" | "bonus1" | "bonus2" | "penalty1" | "penalty2">("normal");
  const [cocSkillSelected, setCocSkillSelected] = useState<string>("");

  // Traveller States (2D6 Science Fiction System)
  const [travellerBaseSkill, setTravellerBaseSkill] = useState<number>(2);
  const [travellerSkillSelected, setTravellerSkillSelected] = useState<string>("");
  const [travellerAttrSelected, setTravellerAttrSelected] = useState<string>("DEX");
  const [travellerDifficulty, setTravellerDifficulty] = useState<number>(8);
  const [travellerModifier, setTravellerModifier] = useState<number>(0);
  const [travellerRollMode, setTravellerRollMode] = useState<"normal" | "boon" | "bane">("normal");
  const [travellerAutoBonus, setTravellerAutoBonus] = useState<number>(0);

  // --- CUSTOM ROLL STATES ---
  const [customDiceCount, setCustomDiceCount] = useState<number>(1);
  const [customDiceSides, setCustomDiceSides] = useState<number>(20);
  const [customModifier, setCustomModifier] = useState<number>(0);
  const [customRollMode, setCustomRollMode] = useState<"sum" | "shadowrun">("sum");

  // Roll Status
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [activeResult, setActiveResult] = useState<{
    rolls: number[];
    bonusRolls?: number[][]; // for CoC bonus/penalty dice details
    finalResult: number | string;
    statusText: string;
    statusColor: string;
    details: string;
  } | null>(null);

  // Helper: List attributes & skills for quick filling
  const availableSkills = useMemo(() => data.skills || [], [data.skills]);
  const availableAttrs = useMemo(() => data.characteristics || [], [data.characteristics]);

  const konChar = useMemo(() => {
    const val = availableAttrs.find(a => (a?.label || "").toUpperCase().includes("KON"))?.value;
    return val !== undefined ? Number(val) : 0;
  }, [availableAttrs]);

  const reaChar = useMemo(() => {
    const val = availableAttrs.find(a => (a?.label || "").toUpperCase().includes("REA"))?.value;
    return val !== undefined ? Number(val) : 0;
  }, [availableAttrs]);

  const intChar = useMemo(() => {
    const val = availableAttrs.find(a => (a?.label || "").toUpperCase().includes("INT"))?.value;
    return val !== undefined ? Number(val) : 0;
  }, [availableAttrs]);

  const panzerungStat = useMemo(() => {
    const statObj = data.stats?.find(s => s.label.toLowerCase().includes("panzerung"));
    return statObj ? Number(statObj.value) : 0;
  }, [data.stats]);

  const soakTotal = useMemo(() => konChar + panzerungStat, [konChar, panzerungStat]);
  const defenseTotal = useMemo(() => reaChar + intChar, [reaChar, intChar]);

  // Find recommended Shadowrun attribute based on selected skill
  const srRecommendedAttr = useMemo(() => {
    if (!srSkillSelected) return null;
    const skillObj = availableSkills.find(s => s.name === srSkillSelected);
    if (!skillObj) return null;

    let targetAttrKey = "";
    if (skillObj.note) {
      targetAttrKey = skillObj.note.trim().toUpperCase();
    } else {
      const cleanName = skillObj.name.trim().toLowerCase();
      const mappedKey = Object.keys(SHADOWRUN_SKILL_TO_ATTRIBUTE_MAPPING).find(
        key => cleanName.includes(key) || key.includes(cleanName)
      );
      if (mappedKey) {
        targetAttrKey = SHADOWRUN_SKILL_TO_ATTRIBUTE_MAPPING[mappedKey];
      }
    }

    if (targetAttrKey) {
      const attrObj = availableAttrs.find(
        a => (a?.label || "").toUpperCase().includes(targetAttrKey) || targetAttrKey.includes((a?.label || "").toUpperCase())
      );
      return attrObj ? attrObj.label : null;
    }
    return null;
  }, [srSkillSelected, availableSkills, availableAttrs]);

  // Handle skill select shortcuts (also handles weapon rolls and special rolls)
  const handleSrSkillSelect = (skillName: string) => {
    setSrSkillSelected(skillName);
    
    let basePool = 0;
    let isSpecialized = false;
    let targetAttrKey = "";
    
    if (skillName.includes("Schadenswiderstand")) {
      basePool = soakTotal;
      setSrAttrSelected("");
    } else if (skillName.includes("Verteidigung")) {
      basePool = defenseTotal;
      setSrAttrSelected("");
    } else {
      // Check if it matches a custom weapon from our sheet
      const allWeapons = [
        ...(data.weapons?.melee || []),
        ...(data.weapons?.ranged || [])
      ];
      const matchingWeapon = allWeapons.find(w => w.name === skillName);
      
      if (matchingWeapon) {
        basePool = parseInt(matchingWeapon.attack) || 12;
        setSrAttrSelected(""); // Already computed in the attack pool
      } else {
        const skillObj = availableSkills.find(s => s.name === skillName);
        if (skillObj) {
          basePool = skillObj.value;
          isSpecialized = !!skillObj.checked;
          
          if (skillObj.note) {
            targetAttrKey = skillObj.note.trim().toUpperCase();
          } else {
            const cleanName = skillName.trim().toLowerCase();
            const mappedKey = Object.keys(SHADOWRUN_SKILL_TO_ATTRIBUTE_MAPPING).find(
              key => cleanName.includes(key) || key.includes(cleanName)
            );
            if (mappedKey) {
              targetAttrKey = SHADOWRUN_SKILL_TO_ATTRIBUTE_MAPPING[mappedKey];
            }
          }
        } else {
          // Fallback
          basePool = 6;
        }
      }
    }
    
    setSrBasePool(basePool);
    setSrSpecialized(isSpecialized);

    if (targetAttrKey) {
      const attrObj = availableAttrs.find(
        a => (a?.label || "").toUpperCase().includes(targetAttrKey) || targetAttrKey.includes((a?.label || "").toUpperCase())
      );
      if (attrObj) {
        setSrAttrSelected(attrObj.label);
      } else {
        setSrAttrSelected("");
      }
    } else {
      setSrAttrSelected("");
    }

    // Auto-detect and enable matching gear
    const skillLower = skillName.toLowerCase();
    const updatedGear: Record<string, { enabled: boolean; bonus: number }> = {};
    
    availableSrGear.forEach(gear => {
      const nameLower = gear.name.toLowerCase();
      const descLower = (gear.description || "").toLowerCase();
      let isMatch = false;

      if (nameLower.includes(skillLower) || descLower.includes(skillLower)) {
        isMatch = true;
      } else if ((skillLower === "hacking" || skillLower.includes("matrix") || skillLower.includes("brute") || skillLower.includes("erika")) && 
                 (nameLower.includes("cyberdeck") || nameLower.includes("deck") || nameLower.includes("sim") || descLower.includes("hacking") || descLower.includes("matrix") || nameLower.includes("programm"))) {
        isMatch = true;
      } else if (skillLower === "computer" && 
                 (nameLower.includes("cyberdeck") || nameLower.includes("deck") || descLower.includes("computer") || nameLower.includes("signal") || nameLower.includes("programm"))) {
        isMatch = true;
      } else if (skillLower === "schlossknacken" && 
                 (nameLower.includes("magschloss") || nameLower.includes("knacker") || nameLower.includes("picker") || nameLower.includes("schloss") || descLower.includes("schloss") || descLower.includes("tür"))) {
        isMatch = true;
      } else if ((skillLower === "pistolen" || skillLower === "gewehre" || skillLower === "klingenwaffen" || skillLower.includes("predator") || skillLower.includes("sturmgewehr") || skillLower.includes("monoschwert")) && 
                 (nameLower.includes("smartlink") || descLower.includes("smartlink") || nameLower.includes("schwert") || nameLower.includes("muskel") || nameLower.includes("waffe"))) {
        isMatch = true;
      } else if (skillLower === "erste hilfe" && 
                 (nameLower.includes("medkit") || descLower.includes("medkit") || descLower.includes("heilung"))) {
        isMatch = true;
      }

      updatedGear[gear.name] = { 
        enabled: isMatch, 
        bonus: gear.bonus 
      };
    });
    setSrActiveGear(updatedGear);
  };

  const handleSrAttrSelect = (attrLabel: string) => {
    setSrAttrSelected(attrLabel);
  };

  const handlePfSkillSelect = (skillName: string) => {
    setPfSkillSelected(skillName);
    const skillObj = availableSkills.find(s => s.name === skillName);
    if (skillObj) {
      // For pathfinder: standard modifier plus trained bonus
      const totalMod = skillObj.value + (skillObj.trained ? 3 : 0);
      setPfBaseModifier(totalMod);
    }
  };

  const handlePfSaveSelect = (saveLabel: string, saveBonus: number) => {
    setPfSkillSelected(`Rettungswurf: ${saveLabel}`);
    setPfBaseModifier(saveBonus);
  };

  const handlePfAttrSelect = (attrFullName: string, attrShort: string, attrBonus: number) => {
    setPfSkillSelected(`Grundwert: ${attrFullName} (${attrShort})`);
    setPfBaseModifier(attrBonus);
  };

  const handleCocSkillSelect = (skillName: string) => {
    setCocSkillSelected(skillName);
    const skillObj = availableSkills.find(s => s.name === skillName);
    if (skillObj) {
      setCocBaseValue(skillObj.value);
    }
  };

  const handleCocAttrSelect = (attrLabel: string) => {
    const attrObj = availableAttrs.find(a => a.label === attrLabel);
    if (attrObj) {
      // In Call of Cthulhu stats can be like "75" etc
      const numVal = parseInt(String(attrObj.value)) || 50;
      setCocBaseValue(numVal);
    }
  };

  // Traveller skill and attribute handlers
  const handleTravellerSkillSelect = (skillName: string) => {
    setTravellerSkillSelected(skillName);
    const skillObj = availableSkills.find(s => s.name === skillName);
    if (skillObj) {
      setTravellerBaseSkill(skillObj.value);
      if (skillObj.note) {
        setTravellerAttrSelected(skillObj.note.trim().toUpperCase());
      } else {
        const cleanName = skillName.trim().toLowerCase();
        const mappedAttrKey = Object.keys(TRAVELLER_SKILL_TO_ATTRIBUTE_MAP).find(
          key => cleanName.includes(key) || key.includes(cleanName)
        );
        if (mappedAttrKey) {
          setTravellerAttrSelected(TRAVELLER_SKILL_TO_ATTRIBUTE_MAP[mappedAttrKey]);
        }
      }
    }
  };

  const handleTravellerAttrSelect = (attrLabel: string) => {
    setTravellerAttrSelected(attrLabel);
  };

  // Shadowrun Probability Calculator
  // Approximate chance of at least X hits with Y dice
  const calculateSrProbabilities = (pool: number) => {
    if (pool <= 0) return { threshold: 0, glitch: 0, successText: "0%" };
    
    // Exact binomial distribution is too verbose, let's use approximation
    // Expected hits = Pool / 3
    // Glitch chance = sum from k=ceil((pool+1)/2) to pool of Binomial(pool, k) with p=1/6.
    // Let's pre-compute a simplified lookup or nice visual representation
    const expectedHits = Math.round((pool / 3) * 10) / 10;
    
    // Glitch approximation
    let glitchChance = 0;
    if (pool < 5) glitchChance = Math.round((pool * 16.6) * 10) / 10;
    else if (pool <= 10) glitchChance = Math.round((35 - pool * 1.5) * 10) / 10;
    else glitchChance = Math.round((15 - pool * 0.4) * 10) / 10;
    glitchChance = Math.max(0.1, Math.min(99, glitchChance));

    return {
      expectedHits,
      glitchChance
    };
  };

  // Filter and enrich equipment/abilities from character sheet and preset aides
  const availableSrGear = useMemo(() => {
    if (data.system !== 'shadowrun') return [];

    // Base gear assistants players commonly use (especially Magschlossknacker/Maglock Passkey)
    const presets = [
      { name: "Magschlossknacker Stufe 4", bonus: 4, description: "Gibt +4 Würfel auf Schlossknacken (Maglock Passkey Rating 4).", triggerWord: "schloss", isPreset: true },
      { name: "Magschlossknacker Stufe 6", bonus: 6, description: "Gibt +6 Würfel auf Schlossknacken (Maglock Passkey Rating 6).", triggerWord: "schloss", isPreset: true },
      { name: "Autopicker Stufe 3", bonus: 3, description: "Mechanisches Schlossknack-Werkzeug. Gibt +3 Würfel.", triggerWord: "schloss", isPreset: true },
      { name: "Smartlink (Aktiviert)", bonus: 2, description: "Gibt +2 Würfelpool-Bonus auf Schussbeprobungen.", triggerWord: "pistole", isPreset: true },
      { name: "Medkit Stufe 6", bonus: 6, description: "Unterstützung für Erste Hilfe. Gibt +6 Würfel.", triggerWord: "medizin", isPreset: true },
      { name: "Heißes Sim (VR)", bonus: 2, description: "Erhöht alle Matrix-Handlungen um +2 Würfel.", triggerWord: "hack", isPreset: true },
      { name: "Cyberdeck-Programm: Exploit", bonus: 2, description: "Präzises Hacking-Programm. Erhöht alle Angriffe und Brute-Force um +2 Würfel.", triggerWord: "hack", isPreset: true },
      { name: "Cyberdeck-Programm: Browse", bonus: 2, description: "Beschleunigt die Matrixsuche. Erhöht Computer um +2 Würfel.", triggerWord: "computer", isPreset: true },
      { name: "Cyberdeck-Programm: Toolbox", bonus: 1, description: "Verbessert Datenströme. Gibt +1 Würfel auf alle Matrixproben.", triggerWord: "computer", isPreset: true },
      { name: "Cyberdeck-Programm: Signal-Schild", bonus: 1, description: "Erhöht den Widerstand/Firewall um +1 Würfel.", triggerWord: "widerstand", isPreset: true },
      { name: "Cyberdeck-Programm: Biofeedback-Filter", bonus: 2, description: "Erleichtert geistigen Schadenswiderstand im Netz. Gibt +2 Würfel.", triggerWord: "widerstand", isPreset: true }
    ];

    // Get the character's custom items from the abilities sheet
    const sheetItems = (data.abilities || []).map(abi => {
      let bonus = 0;
      const effectLower = abi.effect.toLowerCase();
      const nameLower = abi.name.toLowerCase();

      // Attempt to auto-parse numbers
      const poolMatch = abi.effect.match(/([+-]\d+)\s*(Würfel|Pool|Bonus)/i);
      if (poolMatch) {
         bonus = parseInt(poolMatch[1]) || 0;
      } else {
         const genMatch = abi.effect.match(/([+-]\d+)/);
         if (genMatch) {
           bonus = parseInt(genMatch[1]) || 0;
         }
      }

      // Explicit rules for named items
      if (nameLower.includes("smartlink")) {
        bonus = 2;
      }
      if (nameLower.includes("analytischer geist")) {
        bonus = 2;
      }
      if (nameLower.includes("magschlossknacker") || nameLower.includes("passkey")) {
        const rMatch = nameLower.match(/\d+/) || effectLower.match(/\d+/);
        bonus = rMatch ? parseInt(rMatch[0]) : 4;
      }

      return {
        name: abi.name,
        bonus: Math.abs(bonus) || 2, // fallback to a generic +2 if positive bonus is not fully parsed
        description: abi.effect,
        isPreset: false,
        type: abi.type
      };
    });

    const combined = [...sheetItems];
    presets.forEach(p => {
      // Avoid inserting a preset if the character sheet already contains an item with a very similar name
      const alreadyHas = sheetItems.some(s => s.name.toLowerCase().includes(p.name.split(" ")[0].toLowerCase()));
      if (!alreadyHas) {
        combined.push({
          name: p.name,
          bonus: p.bonus,
          description: p.description,
          isPreset: true,
          type: 'item'
        });
      }
    });

    return combined;
  }, [data.abilities, data.system]);

  const toggleGear = (gearName: string, defaultBonus: number) => {
    setSrActiveGear(prev => {
      const existing = prev[gearName];
      return {
        ...prev,
        [gearName]: {
          enabled: existing ? !existing.enabled : true,
          bonus: existing ? existing.bonus : defaultBonus
        }
      };
    });
  };

  const adjustGearBonus = (gearName: string, delta: number) => {
    setSrActiveGear(prev => {
      const existing = prev[gearName] || { enabled: true, bonus: 0 };
      return {
        ...prev,
        [gearName]: {
          ...existing,
          bonus: Math.max(0, existing.bonus + delta)
        }
      };
    });
  };

  const srStats = useMemo(() => {
    const totalAttrVal = srAttrSelected 
      ? parseInt(String(availableAttrs.find(a => a.label === srAttrSelected)?.value || 0)) 
      : 0;
    
    let gearBonus = 0;
    Object.entries(srActiveGear).forEach(([_, config]) => {
      const gearConfig = config as { enabled: boolean; bonus: number };
      if (gearConfig && gearConfig.enabled) {
        gearBonus += gearConfig.bonus;
      }
    });

    const calculatedPool = srBasePool + (srSpecialized ? 2 : 0) + totalAttrVal + srModifier + gearBonus;
    const finalPool = Math.max(1, calculatedPool);
    const probs = calculateSrProbabilities(finalPool);
    return {
      finalPool,
      ...probs,
      gearBonus
    };
  }, [srBasePool, srModifier, srSpecialized, srAttrSelected, availableAttrs, srActiveGear]);

  // Shadowrun Limits
  const srLimits = useMemo(() => {
    if (data.system === 'shadowrun') {
      return calculateShadowrunLimits(data.characteristics || [], data.stats || [], data.limits);
    }
    return null;
  }, [data]);

  // Pathfinder Probability Calculator
  const pfStats = useMemo(() => {
    const totalBonus = pfBaseModifier + pfModifier;
    const necessaryRoll = pfTargetDC - totalBonus;
    
    let winChance = 0;
    if (necessaryRoll <= 1) winChance = 95; // d20 always fails on 1 (except in some rules, but 95% is a standard safe estimate for natural 1 limitation)
    else if (necessaryRoll > 20) winChance = 5; // always succeeds on natural 20
    else winChance = (21 - necessaryRoll) * 5;
    
    return {
      totalBonus,
      winChance,
      necessaryRoll: Math.max(1, Math.min(20, necessaryRoll))
    };
  }, [pfBaseModifier, pfModifier, pfTargetDC]);

  // Call of Cthulhu success zones
  const cocStats = useMemo(() => {
    const adjustedTarget = Math.max(1, cocBaseValue + cocModifier);
    return {
      adjustedTarget,
      hard: Math.floor(adjustedTarget / 2),
      extreme: Math.floor(adjustedTarget / 5)
    };
  }, [cocBaseValue, cocModifier]);

  // Traveller 2D6 System Stats
  const travellerStats = useMemo(() => {
    const attrObj = availableAttrs.find(
      a => (a?.label || "").toUpperCase() === (travellerAttrSelected || "").toUpperCase() ||
           (a?.label || "").toUpperCase().startsWith((travellerAttrSelected || "").toUpperCase())
    );
    const rawVal = attrObj ? (typeof attrObj.value === 'number' ? attrObj.value : parseInt(attrObj.value.toString().replace(/[+]/g, ''), 10) || 7) : 7;
    const attrDamage = attrObj?.damage || 0;
    const effectiveAttrVal = Math.max(0, rawVal - attrDamage);
    const attrDM = getTravellerDM(effectiveAttrVal);

    const totalBonus = travellerBaseSkill + attrDM + travellerModifier + travellerAutoBonus;
    const probData = calculateTravellerProbability(totalBonus, travellerDifficulty, travellerRollMode);

    return {
      rawVal,
      effectiveAttrVal,
      attrDamage,
      attrDM,
      totalBonus,
      ...probData
    };
  }, [
    availableAttrs, 
    travellerAttrSelected, 
    travellerBaseSkill, 
    travellerModifier, 
    travellerAutoBonus, 
    travellerDifficulty, 
    travellerRollMode
  ]);

  // --- ROLL EXECUTION HOOKS ---
  const executeRoll = () => {
    setIsRolling(true);
    setActiveResult(null);

    const titlePrefix = calcMode === "system" ? `${(data?.system || "generic").toUpperCase()} Probe` : "Freier Wurf";

    setTimeout(() => {
      let rolledNumbers: number[] = [];
      let finalVal: number | string = 0;
      let statusText = "Erfolg";
      let statusColor = "text-emerald-400 border-emerald-500/30 bg-emerald-950/20";
      let detailsText = "";
      
      const isSystem = calcMode === "system";

      if (isSystem && data.system === 'shadowrun') {
        // Shadowrun Rule of Five Roller
        const pool = srStats.finalPool;
        for (let i = 0; i < pool; i++) {
          rolledNumbers.push(Math.floor(Math.random() * 6) + 1);
        }

        const hits = rolledNumbers.filter(val => val === 5 || val === 6).length;
        const ones = rolledNumbers.filter(val => val === 1).length;
        const isGlitch = ones > pool / 2;
        const isCriticalGlitch = isGlitch && hits === 0;

        finalVal = hits;
        
        if (isCriticalGlitch) {
          statusText = "Kritischer Patzer!";
          statusColor = "text-red-500 border-red-500/50 bg-red-950/30 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.2)]";
          detailsText = `Kritischer Patzer! Mehr als die Hälfte der Würfel (${ones} von ${pool}) zeigen eine 1 - und kein einziger Erfolg (Hit) wurde erzielt!`;
        } else if (isGlitch) {
          statusText = `Patzer (${hits} Hits)`;
          statusColor = "text-amber-500 border-amber-500/40 bg-amber-950/20";
          detailsText = `Patzer! Mehr als die Hälfte der Würfel (${ones} von ${pool}) zeigen eine 1. Der Wurf zählt zwar mit ${hits} Erfolgen, zieht aber ein unglückliches Ereignis nach sich.`;
        } else if (hits === 0) {
          statusText = "Fehlschlag (0 Hits)";
          statusColor = "text-zinc-500 border-zinc-800 bg-zinc-900/50";
          detailsText = `Gewürfelt mit ${pool} d6. Kein Würfel zeigte eine 5 oder 6. (Anzahl Einsen: ${ones})`;
        } else {
          statusText = `${hits} ${hits === 1 ? 'Erfolg' : 'Erfolge'}`;
          statusColor = "text-cyan-400 border-cyan-500/30 bg-cyan-950/20 shadow-[0_0_10px_rgba(6,182,212,0.1)]";
          detailsText = `Erfolgreicher Wurf! Mit einem Pool von ${pool} d6 wurden ${hits} Erfolge erzielt. (Einsen: ${ones})`;
        }

        const newHistoryItem: RollHistoryEntry = {
          id: String(Date.now()),
          timestamp: new Date().toLocaleTimeString(),
          system: 'shadowrun',
          title: srSkillSelected ? `Spezialprobe: ${srSkillSelected}` : "Freie SR-Probe",
          formula: `${pool}d6 (Hits)`,
          rolls: rolledNumbers,
          modifier: srModifier,
          result: hits === 0 && isCriticalGlitch ? "Krit. Patzer" : `${hits} Hits`,
          statusText,
          statusColor,
          details: detailsText
        };
        setHistory(prev => [newHistoryItem, ...prev]);

      } else if (isSystem && data.system === 'pathfinder') {
        const d20 = Math.floor(Math.random() * 20) + 1;
        rolledNumbers = [d20];
        
        const bonus = pfStats.totalBonus;
        const totalResult = d20 + bonus;
        finalVal = totalResult;

        const isSuccess = totalResult >= pfTargetDC;

        if (d20 === 20) {
          statusText = "Kritischer Erfolg (20)";
          statusColor = "text-amber-400 border-amber-500/50 bg-amber-950/30 animate-pulse";
          detailsText = `Natürliche 20! Kritischer Erfolg unabhängig vom SG. Gesamt: ${totalResult} vs SG ${pfTargetDC}`;
        } else if (d20 === 1) {
          statusText = "Kritischer Fehlschlag (1)";
          statusColor = "text-red-500 border-red-500/50 bg-red-950/30 animate-bounce";
          detailsText = `Natürliche 1! Automatischer Fehlschlag unabhängig von Boni. Gesamt: ${totalResult} vs SG ${pfTargetDC}`;
        } else if (isSuccess) {
          statusText = "Erfolgreich";
          statusColor = "text-emerald-400 border-emerald-500/30 bg-emerald-950/20";
          detailsText = `Erfolg! Gewürfelt wurde eine ${d20} + Modifikator ${bonus} = ${totalResult} (Benötigt: SG ${pfTargetDC})`;
        } else {
          statusText = "Fehlgeschlagen";
          statusColor = "text-red-400 border-red-900/30 bg-red-950/10";
          detailsText = `Fehlschlag. Gewürfelt wurde eine ${d20} + Modifikator ${bonus} = ${totalResult} (Benötigt: SG ${pfTargetDC})`;
        }

        const newHistoryItem: RollHistoryEntry = {
          id: String(Date.now()),
          timestamp: new Date().toLocaleTimeString(),
          system: 'pathfinder',
          title: pfSkillSelected ? `Pathfinder: ${pfSkillSelected}` : "Pf-Attributswurf",
          formula: `d20 + ${bonus} vs SG ${pfTargetDC}`,
          rolls: rolledNumbers,
          modifier: pfModifier,
          result: totalResult,
          statusText,
          statusColor,
          details: detailsText
        };
        setHistory(prev => [newHistoryItem, ...prev]);

      } else if (isSystem && (data.system === 'coc7e' || data.system === 'coc1920')) {
        // Call of Cthulhu with Bonus / Penalty dice support
        // We roll a Tens digit and Units digit.
        // Bonus dice adds extra Tens digits, choose lowest (best) Tens digit.
        // Penalty dice adds extra Tens digits, choose highest (worst) Tens digit.
        const units = Math.floor(Math.random() * 10);
        const firstTens = Math.floor(Math.random() * 10) * 10;
        
        let extraTens: number[] = [];
        let numExtra = 0;
        if (cocDiceType === "bonus1") numExtra = 1;
        if (cocDiceType === "bonus2") numExtra = 2;
        if (cocDiceType === "penalty1") numExtra = 1;
        if (cocDiceType === "penalty2") numExtra = 2;

        for (let i = 0; i < numExtra; i++) {
          extraTens.push(Math.floor(Math.random() * 10) * 10);
        }

        // Calculate all values (tens + units, handling 00 + 0 properly as 100)
        const formatD100Val = (tens: number, unitsVal: number) => {
          const raw = tens + unitsVal;
          return raw === 0 ? 100 : raw;
        };

        const rollsList = [formatD100Val(firstTens, units)];
        extraTens.forEach(t => rollsList.push(formatD100Val(t, units)));

        let finalValue = formatD100Val(firstTens, units);
        if (cocDiceType.startsWith("bonus")) {
          finalValue = Math.min(...rollsList);
        } else if (cocDiceType.startsWith("penalty")) {
          finalValue = Math.max(...rollsList);
        }

        rolledNumbers = [finalValue];

        const target = cocStats.adjustedTarget;
        const half = cocStats.hard;
        const fifth = cocStats.extreme;

        let level: "crit" | "extreme" | "hard" | "regular" | "fail" | "fumble" = "fail";
        
        if (finalValue === 1) {
          level = "crit";
          statusText = "Kritischer Erfolg!";
          statusColor = "text-emerald-300 border-emerald-400/50 bg-emerald-950/40 shadow-[0_0_15px_rgba(16,185,129,0.1)]";
          detailsText = "Kritischer Erfolg! Eine 1 wurde gewürfelt! Legendäre Leistung.";
        } else if (finalValue === 100 || (target < 50 ? finalValue >= 96 : finalValue >= 100)) {
          level = "fumble";
          statusText = "Patzer!";
          statusColor = "text-red-600 border-red-600/50 bg-red-950/40 animate-pulse";
          detailsText = `Patzer! Katastrophaler Misserfolg bei einer ${finalValue} (Grenze: ${target < 50 ? "96+" : "100"}).`;
        } else if (finalValue <= fifth) {
          level = "extreme";
          statusText = "Extremer Erfolg";
          statusColor = "text-cyan-400 border-cyan-500/40 bg-cyan-950/20";
          detailsText = `Extremer Erfolg! Wurf von ${finalValue} ist kleiner/gleich dem Fünftelwert (${fifth}). Zielwert: ${target}`;
        } else if (finalValue <= half) {
          level = "hard";
          statusText = "Schwerer Erfolg";
          statusColor = "text-amber-400 border-amber-500/30 bg-amber-950/10";
          detailsText = `Schwerer Erfolg! Wurf von ${finalValue} ist kleiner/gleich dem Halbiertwert (${half}). Zielwert: ${target}`;
        } else if (finalValue <= target) {
          level = "regular";
          statusText = "Regulärer Erfolg";
          statusColor = "text-zinc-250 border-zinc-800 bg-zinc-900/40";
          detailsText = `Sieg! Wurf von ${finalValue} ist kleiner/gleich deinem Zielwert (${target}).`;
        } else {
          level = "fail";
          statusText = "Fehlschlag";
          statusColor = "text-red-400 border-red-500/30 bg-red-950/10";
          detailsText = `Fehlschlag. Wurf von ${finalValue} liegt über deinem Zielwert (${target}).`;
        }

        finalVal = finalValue;

        const formulaText = cocDiceType !== "normal" 
          ? `d100 (${cocDiceType === "bonus1" ? "1 Bonus" : cocDiceType === "bonus2" ? "2 Bonus" : cocDiceType === "penalty1" ? "1 Malus" : "2 Malus"}) gegen ${target}`
          : `d100 gegen ${target}`;

        const newHistoryItem: RollHistoryEntry = {
          id: String(Date.now()),
          timestamp: new Date().toLocaleTimeString(),
          system: data.system,
          title: cocSkillSelected ? `CoC: ${cocSkillSelected}` : "CoC-Probe",
          formula: formulaText,
          rolls: rollsList, // show all raw counts
          modifier: cocModifier,
          result: finalValue,
          statusText,
          statusColor,
          details: detailsText
        };
        setHistory(prev => [newHistoryItem, ...prev]);

      } else if (isSystem && data.system === 'traveller') {
        // Traveller 2D6 / Boon (3D6 best 2) / Bane (3D6 worst 2)
        let diceRolls: number[] = [];
        if (travellerRollMode === 'normal') {
          const d1 = Math.floor(Math.random() * 6) + 1;
          const d2 = Math.floor(Math.random() * 6) + 1;
          diceRolls = [d1, d2];
          rolledNumbers = [d1, d2];
        } else if (travellerRollMode === 'boon') {
          const d1 = Math.floor(Math.random() * 6) + 1;
          const d2 = Math.floor(Math.random() * 6) + 1;
          const d3 = Math.floor(Math.random() * 6) + 1;
          const sorted = [d1, d2, d3].sort((a, b) => b - a);
          diceRolls = [sorted[0], sorted[1]];
          rolledNumbers = [d1, d2, d3];
        } else {
          // bane
          const d1 = Math.floor(Math.random() * 6) + 1;
          const d2 = Math.floor(Math.random() * 6) + 1;
          const d3 = Math.floor(Math.random() * 6) + 1;
          const sorted = [d1, d2, d3].sort((a, b) => a - b);
          diceRolls = [sorted[0], sorted[1]];
          rolledNumbers = [d1, d2, d3];
        }

        const raw2D6 = diceRolls[0] + diceRolls[1];
        const totalBonus = travellerStats.totalBonus;
        const totalWithBonus = raw2D6 + totalBonus;
        const targetDC = travellerDifficulty;
        const effect = totalWithBonus - targetDC;

        finalVal = totalWithBonus;

        const isCritSuccess = raw2D6 === 12;
        const isFumble = raw2D6 === 2;
        const isSuccess = isCritSuccess || (totalWithBonus >= targetDC && !isFumble);

        if (isCritSuccess) {
          statusText = `Kritischer Erfolg (12)`;
          statusColor = "text-emerald-400 border-emerald-500/50 bg-emerald-950/40 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.2)]";
          detailsText = `Natürliche 12 gewürfelt! Legendärer kritischer Erfolg. Gesamt: ${totalWithBonus} vs SG ${targetDC} (Effekt: +${effect >= 0 ? effect : 0}).`;
        } else if (isFumble) {
          statusText = `Katastrophaler Patzer (2)`;
          statusColor = "text-red-500 border-red-500/50 bg-red-950/40 animate-bounce shadow-[0_0_15px_rgba(239,68,68,0.2)]";
          detailsText = `Natürliche 2 gewürfelt (Snake Eyes)! Automatischer kritischer Fehlschlag / Panne (Mishap). Gesamt: ${totalWithBonus} vs SG ${targetDC}.`;
        } else if (effect >= 6) {
          statusText = `Außergewöhnlicher Erfolg (+${effect})`;
          statusColor = "text-cyan-400 border-cyan-500/40 bg-cyan-950/25 shadow-md";
          detailsText = `Hervorragende Meisterleistung! 2D6 (${diceRolls.join(" + ")}) ${totalBonus >= 0 ? `+ ${totalBonus}` : `- ${Math.abs(totalBonus)}`} = ${totalWithBonus} vs SG ${targetDC}. Effektwert: +${effect}.`;
        } else if (isSuccess) {
          statusText = effect === 0 ? `Knapper Erfolg (Effekt 0)` : `Erfolg (+${effect})`;
          statusColor = "text-blue-300 border-blue-500/30 bg-blue-950/20";
          detailsText = `Erfolgreiche Probe! 2D6 (${diceRolls.join(" + ")}) ${totalBonus >= 0 ? `+ ${totalBonus}` : `- ${Math.abs(totalBonus)}`} = ${totalWithBonus} vs SG ${targetDC}. Effektwert: ${effect >= 0 ? `+${effect}` : effect}.`;
        } else if (effect <= -6) {
          statusText = `Schwerer Fehlschlag (${effect})`;
          statusColor = "text-red-500 border-red-800/50 bg-red-950/20";
          detailsText = `Kritischer Fehlschlag! 2D6 (${diceRolls.join(" + ")}) ${totalBonus >= 0 ? `+ ${totalBonus}` : `- ${Math.abs(totalBonus)}`} = ${totalWithBonus} vs SG ${targetDC}. Effektwert: ${effect}.`;
        } else {
          statusText = `Fehlschlag (${effect})`;
          statusColor = "text-red-400 border-red-900/30 bg-red-950/10";
          detailsText = `Fehlschlag. 2D6 (${diceRolls.join(" + ")}) ${totalBonus >= 0 ? `+ ${totalBonus}` : `- ${Math.abs(totalBonus)}`} = ${totalWithBonus} vs SG ${targetDC}. Effektwert: ${effect}.`;
        }

        const modeStr = travellerRollMode === 'boon' ? ' (Vorteil/Boon 3D6)' : travellerRollMode === 'bane' ? ' (Nachteil/Bane 3D6)' : '';
        const newHistoryItem: RollHistoryEntry = {
          id: String(Date.now()),
          timestamp: new Date().toLocaleTimeString(),
          system: 'traveller',
          title: travellerSkillSelected ? `Traveller: ${travellerSkillSelected}` : `Traveller 2D6 Probe`,
          formula: `2D6${modeStr} ${totalBonus >= 0 ? `+${totalBonus}` : totalBonus} vs SG ${targetDC}`,
          rolls: rolledNumbers,
          modifier: travellerModifier,
          result: `${totalWithBonus} (Effekt ${effect >= 0 ? `+${effect}` : effect})`,
          statusText,
          statusColor,
          details: detailsText
        };
        setHistory(prev => [newHistoryItem, ...prev]);

      } else {
        // --- CUSTOM DICE HANDLER ---
        let count = Math.max(1, Math.min(50, customDiceCount));

        if (customRollMode === "shadowrun") {
          // Shadowrun successes system (d6s, counting 5 & 6)
          let pool = Math.max(1, count + customModifier);
          for (let i = 0; i < pool; i++) {
            rolledNumbers.push(Math.floor(Math.random() * 6) + 1);
          }

          const hits = rolledNumbers.filter(val => val === 5 || val === 6).length;
          const ones = rolledNumbers.filter(val => val === 1).length;
          const isGlitch = ones > pool / 2;
          const isCriticalGlitch = isGlitch && hits === 0;

          finalVal = hits;

          if (isCriticalGlitch) {
            statusText = "Kritischer Patzer!";
            statusColor = "text-red-500 border-red-500/50 bg-red-950/30 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.2)]";
            detailsText = `Kritischer Patzer! Mehr als die Hälfte der Würfel (${ones} von ${pool}) zeigen eine 1 - und kein einziger Erfolg (Hit) wurde erzielt!`;
          } else if (isGlitch) {
            statusText = `Patzer (${hits} Hits)`;
            statusColor = "text-amber-500 border-amber-500/40 bg-amber-950/20";
            detailsText = `Patzer! Mehr als die Hälfte der Würfel (${ones} von ${pool}) zeigen eine 1. Der Wurf zählt zwar mit ${hits} Erfolgen, zieht aber ein unglückliches Ereignis nach sich.`;
          } else if (hits === 0) {
            statusText = "Fehlschlag (0 Hits)";
            statusColor = "text-zinc-500 border-zinc-800 bg-zinc-900/50";
            detailsText = `Freier Erfolgswurf mit ${pool} d6. Kein Würfel zeigte eine 5 oder 6. (Anzahl Einsen: ${ones})`;
          } else {
            statusText = `${hits} ${hits === 1 ? 'Erfolg' : 'Erfolge'}`;
            statusColor = "text-cyan-400 border-cyan-500/30 bg-cyan-950/20 shadow-[0_0_10px_rgba(6,182,212,0.1)]";
            detailsText = `Erfolgreicher freier Wurf! Mit einem Pool von ${pool} d6 (Basis: ${count} + Mod: ${customModifier}) wurden ${hits} Erfolge erzielt. (Einsen: ${ones})`;
          }

          const newHistoryItem: RollHistoryEntry = {
            id: String(Date.now()),
            timestamp: new Date().toLocaleTimeString(),
            system: 'shadowrun',
            title: "Freie Erfolgs-Probe",
            formula: `${pool}d6 (Hits)`,
            rolls: rolledNumbers,
            modifier: customModifier,
            result: hits === 0 && isCriticalGlitch ? "Krit. Patzer" : `${hits} Hits`,
            statusText,
            statusColor,
            details: detailsText
          };
          setHistory(prev => [newHistoryItem, ...prev]);

        } else {
          // Standard SUM-based system
          let sides = Math.max(2, Math.min(100, customDiceSides));
          
          for (let i = 0; i < count; i++) {
            rolledNumbers.push(Math.floor(Math.random() * sides) + 1);
          }

          const sum = rolledNumbers.reduce((a, b) => a + b, 0);
          const finalSum = sum + customModifier;
          finalVal = finalSum;

          statusText = `Ergebnis: ${finalSum}`;
          statusColor = "text-orange-400 border-orange-500/20 bg-orange-950/10";
          detailsText = `Gewürfelt: ${count}d${sides} (${rolledNumbers.join(" + ")}) ${customModifier >= 0 ? `+ ${customModifier}` : `- ${Math.abs(customModifier)}`} = ${finalSum}`;

          const newHistoryItem: RollHistoryEntry = {
            id: String(Date.now()),
            timestamp: new Date().toLocaleTimeString(),
            system: 'generic',
            title: "Spezial-Wurf",
            formula: `${count}d${sides}${customModifier > 0 ? ` + ${customModifier}` : customModifier < 0 ? ` - ${Math.abs(customModifier)}` : ""}`,
            rolls: rolledNumbers,
            modifier: customModifier,
            result: finalSum,
            statusText,
            statusColor,
            details: detailsText
          };
          setHistory(prev => [newHistoryItem, ...prev]);
        }
      }

      setActiveResult({
        rolls: rolledNumbers,
        finalResult: finalVal,
        statusText,
        statusColor,
        details: detailsText
      });

      setIsRolling(false);
    }, 700);
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-cyan-400 font-mono">
          <Dices size={16} />
          <span className="text-xs uppercase tracking-widest font-black">Dice & Probability Station</span>
        </div>
        <h2 className="text-4xl font-extrabold text-white tracking-tight">PROBEN- & WÜRFELRECHNER</h2>
        <p className="text-sm text-zinc-550 max-w-2xl font-mono leading-relaxed">
          Berechne Erfolgs-Wahrscheinlichkeiten, gestalte komplexe Würfelformeln und simuliere präzise Proben für dein RPG-System ({(data?.system || "generic").toUpperCase()}).
        </p>
      </div>

      {/* Mode Buttons */}
      <div className="flex gap-2 p-1 bg-zinc-950 border border-zinc-850 rounded-xl w-fit">
        <button
          onClick={() => { setCalcMode("system"); setActiveResult(null); }}
          className={`px-4 py-2 rounded-lg text-xs font-black font-mono transition-all flex items-center gap-2 ${
            calcMode === "system" 
              ? "bg-zinc-800 text-white" 
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Zap size={13} /> {(data?.system || "generic").toUpperCase()}-SYSTEMRECHNER
        </button>
        <button
          onClick={() => { setCalcMode("custom"); setActiveResult(null); }}
          className={`px-4 py-2 rounded-lg text-xs font-black font-mono transition-all flex items-center gap-2 ${
            calcMode === "custom" 
              ? "bg-zinc-800 text-white" 
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Sliders size={13} /> FREIER WÜRFELRECHNER
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main calculation zone */}
        <div className="lg:col-span-12 xl:col-span-8 space-y-6">
          <div className="bg-zinc-900/30 border border-zinc-800 p-6 md:p-8 rounded-3xl backdrop-blur-md relative overflow-hidden">
            
            {calcMode === "system" ? (
              <div>
                {/* --- SYSTEM-SPECIFIC CONTROLS --- */}
                {data.system === 'shadowrun' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                        <span className="text-xs uppercase tracking-widest font-black text-cyan-400 font-mono">Shadowrun Dice Pool Settings</span>
                      </div>

                      {srLimits && (
                        <div className="flex items-center gap-3 text-[11px] font-mono bg-zinc-950/80 px-3 py-1.5 rounded-xl border border-cyan-500/30">
                          <span className="text-zinc-500 text-[10px] uppercase font-bold">Limits:</span>
                          <span className="text-cyan-300 font-bold" title="Körperliches Limit">Körper: {srLimits.physicalTotal}</span>
                          <span className="text-purple-300 font-bold" title="Geistiges Limit">Geist: {srLimits.mentalTotal}</span>
                          <span className="text-amber-300 font-bold" title="Soziales Limit">Sozial: {srLimits.socialTotal}</span>
                          <span className="text-emerald-300 font-bold" title="Astrales Limit">Astral: {srLimits.astralTotal}</span>
                        </div>
                      )}
                    </div>

                    {/* Shadowrun Combat & Special Rolls */}
                    <div className="space-y-3 bg-zinc-950/20 p-4 rounded-2xl border border-zinc-850/40">
                      <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-cyan-400">Kampf, Verteidigung & Schadenswiderstand</span>
                      <div className="flex flex-wrap gap-2">
                        {/* Dodge / defense */}
                        <button
                          key="Verteidigung"
                          onClick={() => handleSrSkillSelect("Verteidigung (REA + INT)")}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-mono border transition-all flex items-center gap-1.5 ${
                            srSkillSelected === "Verteidigung (REA + INT)"
                              ? "bg-amber-500/10 border-amber-500/50 text-amber-300 font-bold"
                              : "bg-zinc-900 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                          }`}
                        >
                          ⚔️ Verteidigung ({defenseTotal} DP)
                        </button>

                        {/* Soak / damage resistance */}
                        <button
                          key="Schadenswiderstand"
                          onClick={() => handleSrSkillSelect("Schadenswiderstand (KON + PANZ)")}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-mono border transition-all flex items-center gap-1.5 ${
                            srSkillSelected === "Schadenswiderstand (KON + PANZ)"
                              ? "bg-indigo-500/10 border-indigo-500/50 text-indigo-300 font-bold"
                              : "bg-zinc-900 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                          }`}
                        >
                          🛡️ Schadenswiderstand (Soak: {soakTotal} DP)
                        </button>
                        
                        {/* List Melee Weapons */}
                        {data.weapons?.melee?.map(w => (
                          <button
                            key={w.name}
                            onClick={() => handleSrSkillSelect(w.name)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-mono border transition-all text-left flex flex-col gap-0.5 ${
                              srSkillSelected === w.name
                                ? "bg-red-500/10 border-red-500/50 text-red-300 font-bold"
                                : "bg-zinc-900 border-zinc-800/80 text-zinc-400 hover:border-zinc-750 hover:text-zinc-200"
                            }`}
                          >
                            <span className="flex items-center gap-1">🔪 {w.name} ({w.attack} DP)</span>
                            <span className="text-[8px] opacity-70">Schaden: {w.damage} | Präz: {w.critical}</span>
                          </button>
                        ))}

                        {/* List Ranged Weapons */}
                        {data.weapons?.ranged?.map(w => (
                          <button
                            key={w.name}
                            onClick={() => handleSrSkillSelect(w.name)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-mono border transition-all text-left flex flex-col gap-0.5 ${
                              srSkillSelected === w.name
                                ? "bg-red-500/10 border-red-500/50 text-red-300 font-bold"
                                : "bg-zinc-900 border-zinc-800/80 text-zinc-400 hover:border-zinc-750 hover:text-zinc-200"
                            }`}
                          >
                            <span className="flex items-center gap-1">🔫 {w.name} ({w.attack} DP)</span>
                            <span className="text-[8px] opacity-70">Schaden: {w.damage} | Note: {w.critical}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Quick Fill Shortcuts */}
                    {availableSkills.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-zinc-500">Schnellauswahl Fertigkeiten</span>
                        <div className="flex flex-wrap gap-1.5 max-h-[110px] overflow-y-auto pr-2 scrollbar-thin">
                          {availableSkills.map((sk) => (
                            <button
                              key={sk.name}
                              onClick={() => handleSrSkillSelect(sk.name)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono border transition-all ${
                                srSkillSelected === sk.name 
                                  ? "bg-cyan-500/20 border-cyan-400 text-cyan-400 font-black" 
                                  : "bg-zinc-950/60 border-zinc-850 text-zinc-400 hover:border-zinc-700"
                              }`}
                            >
                              {sk.name} ({sk.value})
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quick Attribute shortcut */}
                    {availableAttrs.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-zinc-500">Kombinieren mit Attribut</span>
                        <div className="flex flex-wrap gap-1.5">
                          {availableAttrs.map((at) => {
                            const isRecommended = srRecommendedAttr === at.label;
                            const isSelected = srAttrSelected === at.label;
                            return (
                              <button
                                key={at.label}
                                onClick={() => handleSrAttrSelect(at.label)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono border transition-all flex items-center gap-1.5 ${
                                  isSelected 
                                    ? "bg-purple-500/20 border-purple-400 text-purple-400 font-black ring-1 ring-purple-500/30" 
                                    : isRecommended
                                      ? "bg-zinc-950/80 border-cyan-500/40 text-cyan-400 hover:border-cyan-500 hover:bg-cyan-950/20"
                                      : "bg-zinc-950/60 border-zinc-850 text-zinc-400 hover:border-zinc-700"
                                }`}
                              >
                                {isRecommended && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />}
                                {at.label} (+{at.value})
                                {isRecommended && !isSelected && (
                                  <span className="text-[8px] text-cyan-500 uppercase tracking-widest ml-1 font-bold">(Empfohlen)</span>
                                )}
                              </button>
                            );
                          })}
                          {srAttrSelected && (
                            <button 
                              onClick={() => setSrAttrSelected("")}
                              className="px-2 py-1 rounded-lg text-[10px] font-mono border border-dashed border-red-500/40 text-red-400 hover:bg-red-950/20"
                            >
                              Aufheben [X]
                            </button>
                          )}
                        </div>

                        {srAttrSelected && srSkillSelected && (
                          <div className="text-[10px] text-zinc-400 font-mono flex items-center gap-1.5 mt-2 bg-purple-950/10 px-2.5 py-1.5 rounded-lg border border-purple-950/30 w-fit">
                            <Info size={12} className="text-purple-400 shrink-0" />
                            <span>
                              Fertigkeit <strong className="text-white">{srSkillSelected}</strong> wurde automatisch mit Attribut <strong className="text-purple-400">{srAttrSelected}</strong> verknüpft (Pool-Wert erhöht auf {srStats.finalPool}).
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Numeric settings Adjusters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                      {/* Skill Base pool adjust */}
                      <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-850">
                        <span className="text-[10px] font-mono font-bold uppercase text-zinc-400 block mb-2">Basis-Pool (Skill oder Wert)</span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setSrBasePool(prev => Math.max(0, prev - 1))}
                            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-xl font-mono font-black text-white w-10 text-center">{srBasePool}</span>
                          <button
                            onClick={() => setSrBasePool(prev => Math.min(30, prev + 1))}
                            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
                          >
                            <Plus size={14} />
                          </button>
                          <span className="text-[10px] text-zinc-500 font-mono italic">Würfel</span>
                        </div>
                      </div>

                      {/* Modifier Adjust */}
                      <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-850">
                        <span className="text-[10px] font-mono font-bold uppercase text-zinc-400 block mb-2">Pool-Modifikatoren (Erschwerung/Boni)</span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setSrModifier(prev => prev - 1)}
                            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
                          >
                            <Minus size={14} />
                          </button>
                          <span className={`text-xl font-mono font-black w-12 text-center ${srModifier > 0 ? 'text-emerald-400' : srModifier < 0 ? 'text-red-400' : 'text-white'}`}>
                            {srModifier > 0 ? `+${srModifier}` : srModifier}
                          </span>
                          <button
                            onClick={() => setSrModifier(prev => prev + 1)}
                            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
                          >
                            <Plus size={14} />
                          </button>
                          <span className="text-[10px] text-zinc-500 font-mono italic">Boni / Malus</span>
                        </div>
                      </div>
                    </div>

                    {/* Specialization Checkbox */}
                    <div className="flex items-center gap-3 bg-zinc-950/40 p-3 rounded-xl border border-zinc-850">
                      <input 
                        type="checkbox" 
                        id="sr-chk-spec"
                        checked={srSpecialized}
                        onChange={(e) => setSrSpecialized(e.target.checked)}
                        className="rounded border-zinc-800 text-cyan-500 focus:ring-cyan-500 bg-zinc-950 pointer-events-auto cursor-pointer"
                      />
                      <label htmlFor="sr-chk-spec" className="text-xs text-zinc-400 font-bold font-mono cursor-pointer">
                        Spezialisierung anwenden (+2 Würfel)
                      </label>
                    </div>

                    {/* Active Gear / Item Assistance */}
                    <div className="p-4 bg-zinc-950/40 rounded-2xl border border-zinc-850 space-y-4">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <Sliders size={14} className="text-cyan-400" />
                          <span className="text-[11px] uppercase font-mono tracking-wider font-extrabold text-zinc-300">
                            Ausrüstungs- & Gegenstandsboni
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowAllSrGear(!showAllSrGear)}
                          className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 transition-colors bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-md"
                        >
                          {showAllSrGear ? "Nur relevante zeigen" : `Alle Gegenstände anzeigen (${availableSrGear.length})`}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {(() => {
                          const filtered = availableSrGear.filter(gear => {
                            if (showAllSrGear) return true;
                            if (!srSkillSelected) return true;
                            
                            const skillLower = srSkillSelected.toLowerCase();
                            const nameLower = gear.name.toLowerCase();
                            const descLower = (gear.description || "").toLowerCase();
                            
                            if (nameLower.includes(skillLower) || descLower.includes(skillLower)) return true;
                            
                            // Check synonyms
                            if (skillLower === "hacking" && (nameLower.includes("cyberdeck") || nameLower.includes("deck") || nameLower.includes("sim") || descLower.includes("hacking") || descLower.includes("matrix"))) return true;
                            if (skillLower === "schlossknacken" && (nameLower.includes("magschloss") || nameLower.includes("knacker") || nameLower.includes("picker") || nameLower.includes("schloss") || descLower.includes("schloss") || descLower.includes("tür"))) return true;
                            if ((skillLower === "pistolen" || skillLower === "gewehre" || skillLower === "klingenwaffen") && (nameLower.includes("smartlink") || descLower.includes("smartlink") || nameLower.includes("schwert") || nameLower.includes("waffe"))) return true;
                            if (skillLower === "erste hilfe" && (nameLower.includes("medkit") || descLower.includes("medkit") || descLower.includes("heilung"))) return true;
                            
                            return false;
                          });

                          if (filtered.length === 0) {
                            return (
                              <div className="col-span-2 text-zinc-500 text-[11px] italic font-mono p-3 text-center border border-dashed border-zinc-800/80 rounded-xl bg-zinc-900/10">
                                Keine direkt passenden Boni für <span className="text-cyan-400 font-bold">{srSkillSelected || "freie Proben"}</span> im Besitz. 
                                <button 
                                  type="button" 
                                  onClick={() => setShowAllSrGear(true)}
                                  className="text-cyan-500 underline ml-1 hover:text-cyan-400"
                                >
                                  Alle Besitztümer anzeigen
                                </button>, um z.B. einen <strong className="text-zinc-300">Magschlossknacker</strong> oder <strong className="text-zinc-300">Medkit</strong> zu simulieren.
                              </div>
                            );
                          }

                          return filtered.map(gear => {
                            const activeConfig = srActiveGear[gear.name];
                            const isEnabled = activeConfig?.enabled || false;
                            const currentBonus = activeConfig !== undefined ? activeConfig.bonus : gear.bonus;

                            return (
                              <div 
                                key={gear.name}
                                className={`flex flex-col p-3 rounded-xl border transition-all ${
                                  isEnabled 
                                    ? "bg-cyan-950/20 border-cyan-500/40 shadow-[0_0_8px_rgba(6,182,212,0.05)]" 
                                    : "bg-zinc-900/40 border-zinc-850 hover:border-zinc-800"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-start gap-2 max-w-[70%]">
                                    <input 
                                      type="checkbox"
                                      id={`gear-chk-${gear.name}`}
                                      checked={isEnabled}
                                      onChange={() => toggleGear(gear.name, gear.bonus)}
                                      className="mt-0.5 rounded border-zinc-800 text-cyan-500 focus:ring-cyan-500 bg-zinc-950 pointer-events-auto cursor-pointer"
                                    />
                                    <label htmlFor={`gear-chk-${gear.name}`} className="text-xs font-bold leading-snug text-zinc-200 cursor-pointer select-none">
                                      {gear.name}
                                      {gear.isPreset ? (
                                        <span className="text-[7px] bg-zinc-800 border border-zinc-750 text-zinc-400 px-1 py-0.5 rounded ml-1.5 uppercase font-mono">Preset</span>
                                      ) : (
                                        <span className="text-[7px] bg-purple-950/40 border border-purple-900/40 text-purple-400 px-1 py-0.5 rounded ml-1.5 uppercase font-mono font-bold">Besitz</span>
                                      )}
                                    </label>
                                  </div>
                                  
                                  {/* Item Bonus Counter Adjuster */}
                                  <div className="flex items-center gap-1 bg-zinc-950/80 border border-zinc-850 px-1.5 py-0.5 rounded-lg shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => adjustGearBonus(gear.name, -1)}
                                      disabled={currentBonus <= 0}
                                      className="p-0.5 rounded text-zinc-500 hover:text-white hover:bg-zinc-900 disabled:opacity-30 disabled:pointer-events-none"
                                    >
                                      <Minus size={10} />
                                    </button>
                                    <span className={`text-[10px] font-mono font-black min-w-5 text-center ${currentBonus > 0 ? "text-cyan-400" : "text-zinc-600"}`}>
                                      +{currentBonus}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => adjustGearBonus(gear.name, 1)}
                                      className="p-0.5 rounded text-zinc-500 hover:text-white hover:bg-zinc-900"
                                    >
                                      <Plus size={10} />
                                    </button>
                                  </div>
                                </div>

                                <p className="text-[10px] text-zinc-500 mt-1 lines-2 font-mono leading-relaxed">
                                  {gear.description}
                                </p>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>

                    {/* Stats probability forecast panel */}
                    <div className="p-4 bg-cyan-950/15 border border-cyan-500/20 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 font-mono">
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-cyan-500 font-extrabold">Würfel-Szenario Vorschau</span>
                        <h4 className="text-2xl font-black text-white mt-1">
                          {srStats.finalPool} d6 Würfel
                        </h4>
                        <p className="text-[10px] text-zinc-500 mt-0.5">
                          Formel: {srBasePool} Basis 
                          {srSpecialized ? " + 2 Spez." : ""} 
                          {srAttrSelected ? ` + ${srAttrSelected} (+${parseInt(String(availableAttrs.find(a => a.label === srAttrSelected)?.value || 0))})` : ""} 
                          {srStats.gearBonus > 0 ? ` + ${srStats.gearBonus} Ausrüstung` : ""}
                          {srModifier !== 0 ? ` ${srModifier > 0 ? '+' : ''}${srModifier} Mod` : ""}
                        </p>
                      </div>

                      <div className="flex gap-4 border-t sm:border-t-0 sm:border-l border-zinc-800 pt-4 sm:pt-0 sm:pl-6 leading-tight">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-zinc-500 uppercase font-black">Ø Erwartete Hits</span>
                          <span className="text-base font-bold text-cyan-400">{srStats.expectedHits}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] text-zinc-500 uppercase font-black">Patzer-Gefahr</span>
                          <span className={`text-base font-bold ${srStats.glitchChance > 30 ? 'text-red-400 font-black animate-pulse' : 'text-zinc-400'}`}>
                            ~{srStats.glitchChance}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {data.system === 'pathfinder' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-4 border-b border-zinc-800 pb-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span className="text-xs uppercase tracking-widest font-black text-amber-500 font-mono">Pathfinder d20 Check Settings</span>
                    </div>

                    {/* Pathfinder Grundwerte (Attribute) Quick Select */}
                    {(() => {
                      const pfChars = getOrInitializePathfinderCharacteristics(data);
                      return (
                        <div className="space-y-2 p-3 bg-zinc-950/70 border border-amber-500/25 rounded-xl">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-amber-400 flex items-center gap-1.5">
                              <Zap size={12} /> Grundwerte & Attribute (ST, GE, KO, IN, WE, CH)
                            </span>
                            <span className="text-[9px] font-mono text-zinc-500">1-Klick Attributsprobe</span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                            {PATHFINDER_CORE_ATTRIBUTES.map((meta) => {
                              const stat = pfChars.find(c => {
                                const l = (c.label || '').toUpperCase().trim();
                                return meta.aliases.includes(l);
                              });
                              const rawVal = stat ? (typeof stat.value === 'number' ? stat.value : parseInt(String(stat.value).replace(/[^0-9-]/g, ''), 10) || 10) : 10;
                              const mod = calculatePathfinderModifier(rawVal);
                              const isSelected = pfSkillSelected?.includes(meta.shortName);

                              return (
                                <button
                                  key={meta.key}
                                  type="button"
                                  onClick={() => handlePfAttrSelect(meta.fullName, meta.shortName, mod)}
                                  className={`p-2 rounded-xl text-left border font-mono transition-all flex flex-col cursor-pointer ${
                                    isSelected
                                      ? `${meta.color.bg} ${meta.color.border} text-white ring-1 ring-amber-500/30`
                                      : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-amber-500/40'
                                  }`}
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <span className="text-[10px] text-zinc-400 font-bold leading-tight">{meta.shortName}</span>
                                    <span className="text-[9px] text-zinc-500 font-mono">{rawVal}</span>
                                  </div>
                                  <span className="text-[10px] text-zinc-400 truncate leading-tight font-sans mt-0.5">{meta.fullName}</span>
                                  <span className={`text-sm font-black mt-1 ${meta.color.text}`}>
                                    {formatPathfinderModifier(mod)}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Pathfinder Saving Throws Quick Select (Zähigkeit, Reflex, Wille) */}
                    {(() => {
                      const saves = data.savingThrows;
                      const fortVal = saves?.fortitude?.total ?? (data.stats.find(s => s.label.toLowerCase().includes('zäh') || s.label.toLowerCase().includes('fort')) ? parseInt(String(data.stats.find(s => s.label.toLowerCase().includes('zäh') || s.label.toLowerCase().includes('fort'))?.value).replace('+', ''), 10) || 5 : 5);
                      const refVal = saves?.reflex?.total ?? (data.stats.find(s => s.label.toLowerCase().includes('ref')) ? parseInt(String(data.stats.find(s => s.label.toLowerCase().includes('ref'))?.value).replace('+', ''), 10) || 10 : 10);
                      const willVal = saves?.will?.total ?? (data.stats.find(s => s.label.toLowerCase().includes('will')) ? parseInt(String(data.stats.find(s => s.label.toLowerCase().includes('will'))?.value).replace('+', ''), 10) || 4 : 4);

                      return (
                        <div className="space-y-2 p-3 bg-zinc-950/70 border border-amber-500/20 rounded-xl">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-amber-400 flex items-center gap-1.5">
                              <Shield size={12} /> Rettungswürfe (Zähigkeit, Reflex, Wille)
                            </span>
                            <span className="text-[9px] font-mono text-zinc-500">1-Klick Modifikator laden</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              type="button"
                              onClick={() => handlePfSaveSelect('Zähigkeit (Konstitution)', fortVal)}
                              className={`p-2 rounded-xl text-left border font-mono transition-all flex flex-col ${
                                pfSkillSelected?.includes('Zähigkeit')
                                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-1 ring-emerald-500/30'
                                  : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-emerald-500/40'
                              }`}
                            >
                              <span className="text-[10px] text-zinc-400 block font-bold leading-tight">Zähigkeit (Konstitution)</span>
                              <span className="text-sm font-black text-emerald-400 mt-0.5">{fortVal >= 0 ? `+${fortVal}` : fortVal}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handlePfSaveSelect('Reflex (Geschicklichkeit)', refVal)}
                              className={`p-2 rounded-xl text-left border font-mono transition-all flex flex-col ${
                                pfSkillSelected?.includes('Reflex')
                                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-1 ring-amber-500/30'
                                  : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-amber-500/40'
                              }`}
                            >
                              <span className="text-[10px] text-zinc-400 block font-bold leading-tight">Reflex (Geschicklichkeit)</span>
                              <span className="text-sm font-black text-amber-400 mt-0.5">{refVal >= 0 ? `+${refVal}` : refVal}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handlePfSaveSelect('Wille (Weisheit)', willVal)}
                              className={`p-2 rounded-xl text-left border font-mono transition-all flex flex-col ${
                                pfSkillSelected?.includes('Wille')
                                  ? 'bg-purple-500/20 border-purple-400 text-purple-300 ring-1 ring-purple-500/30'
                                  : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-purple-500/40'
                              }`}
                            >
                              <span className="text-[10px] text-zinc-400 block font-bold leading-tight">Wille (Weisheit)</span>
                              <span className="text-sm font-black text-purple-400 mt-0.5">{willVal >= 0 ? `+${willVal}` : willVal}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Quick Fill Shortcuts */}
                    {availableSkills.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-zinc-500">Schnellauswahl Fertigkeit & Bonus laden</span>
                        <div className="flex flex-wrap gap-1.5 max-h-[110px] overflow-y-auto pr-2 scrollbar-thin">
                          {availableSkills.map((sk) => {
                            const totalVal = sk.value + (sk.trained ? 3 : 0);
                            return (
                              <button
                                key={sk.name}
                                onClick={() => handlePfSkillSelect(sk.name)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono border transition-all ${
                                  pfSkillSelected === sk.name 
                                    ? "bg-amber-500/20 border-amber-400 text-amber-400 font-black" 
                                    : "bg-zinc-950/60 border-zinc-850 text-zinc-400 hover:border-zinc-700"
                                }`}
                              >
                                {sk.name} ({totalVal >= 0 ? `+${totalVal}` : totalVal})
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Numeric Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Skill Bonus */}
                      <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-850">
                        <span className="text-[10px] font-mono font-bold uppercase text-zinc-400 block mb-2">Basis-Modifikator</span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setPfBaseModifier(prev => prev - 1)}
                            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-xl font-mono font-black text-white w-10 text-center">
                            {pfBaseModifier >= 0 ? `+${pfBaseModifier}` : pfBaseModifier}
                          </span>
                          <button
                            onClick={() => setPfBaseModifier(prev => prev + 1)}
                            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Situational Modifier */}
                      <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-850">
                        <span className="text-[10px] font-mono font-bold uppercase text-zinc-400 block mb-2">Umgebungs-Modifikator</span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setPfModifier(prev => prev - 1)}
                            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
                          >
                            <Minus size={14} />
                          </button>
                          <span className={`text-xl font-mono font-black w-10 text-center ${pfModifier > 0 ? 'text-emerald-400' : pfModifier < 0 ? 'text-red-400' : 'text-white'}`}>
                            {pfModifier > 0 ? `+${pfModifier}` : pfModifier}
                          </span>
                          <button
                            onClick={() => setPfModifier(prev => prev + 1)}
                            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Target Difficulty DC */}
                      <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-850">
                        <span className="text-[10px] font-mono font-bold uppercase text-zinc-400 block mb-2">Schwierigkeitsgrad (SG)</span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setPfTargetDC(prev => Math.max(1, prev - 1))}
                            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-xl font-mono font-black text-amber-400 w-10 text-center">{pfTargetDC}</span>
                          <button
                            onClick={() => setPfTargetDC(prev => Math.min(40, prev + 1))}
                            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* PF Probability Forecast panel */}
                    <div className="p-4 bg-amber-950/15 border border-amber-500/20 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 font-mono">
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-amber-500 font-extrabold">Erfolgs-Prognose</span>
                        <h4 className="text-2xl font-black text-white mt-1">
                          Wurf mit d20 {pfStats.totalBonus >= 0 ? `+${pfStats.totalBonus}` : pfStats.totalBonus} vs SG {pfTargetDC}
                        </h4>
                        <p className="text-[10px] text-zinc-500 mt-0.5">
                          Verlangt Würfelergebnis von mindestens: <span className="text-amber-400 font-bold">{pfStats.necessaryRoll}</span>
                        </p>
                      </div>

                      <div className="flex gap-4 border-t sm:border-t-0 sm:border-l border-zinc-800 pt-4 sm:pt-0 sm:pl-6 leading-tight">
                        <div className="flex flex-col justify-center">
                          <span className="text-[9px] text-zinc-500 uppercase font-black">Erfolgs-Wahrscheinlichkeit</span>
                          <span className={`text-xl font-black mt-1 ${pfStats.winChance > 70 ? 'text-emerald-400' : pfStats.winChance < 35 ? 'text-red-400' : 'text-zinc-200'}`}>
                            {pfStats.winChance}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {(data.system === 'coc7e' || data.system === 'coc1920') && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-4 border-b border-zinc-800 pb-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                      <span className="text-xs uppercase tracking-widest font-black text-orange-500 font-mono">Call of Cthulhu d100 Roll Settings</span>
                    </div>

                    {/* Quick Selection Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Attributes list */}
                      {availableAttrs.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-zinc-500">Attribute laden</span>
                          <div className="flex flex-wrap gap-1.5">
                            {availableAttrs.map((at) => (
                              <button
                                key={at.label}
                                onClick={() => handleCocAttrSelect(at.label)}
                                className="px-2.5 py-1 rounded-lg text-[10px] font-mono border bg-zinc-950/60 border-zinc-850 text-zinc-400 hover:border-zinc-700 transition-colors"
                              >
                                {at.label} ({at.value})
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Skills List */}
                      {availableSkills.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-zinc-500">Fertigkeiten laden</span>
                          <div className="flex flex-wrap gap-1.5 max-h-[110px] overflow-y-auto pr-2 scrollbar-thin">
                            {availableSkills.map((sk) => (
                              <button
                                key={sk.name}
                                onClick={() => handleCocSkillSelect(sk.name)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono border transition-all ${
                                  cocSkillSelected === sk.name 
                                    ? "bg-orange-500/20 border-orange-400 text-orange-400 font-black" 
                                    : "bg-zinc-950/60 border-zinc-850 text-zinc-400 hover:border-zinc-700"
                                }`}
                              >
                                {sk.name} ({sk.value}%)
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Numeric Target Val Adjuster */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-850">
                        <span className="text-[10px] font-mono font-bold uppercase text-zinc-400 block mb-2">Ziel-Basiswert (%)</span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setCocBaseValue(prev => Math.max(1, prev - 5))}
                            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
                          >
                            -5%
                          </button>
                          <span className="text-xl font-mono font-black text-white w-14 text-center">{cocBaseValue}%</span>
                          <button
                            onClick={() => setCocBaseValue(prev => Math.min(99, prev + 5))}
                            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
                          >
                            +5%
                          </button>
                        </div>
                      </div>

                      {/* Situational Modifier */}
                      <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-850">
                        <span className="text-[10px] font-mono font-bold uppercase text-zinc-400 block mb-2">Zielwert-Modifikator</span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setCocModifier(prev => prev - 5)}
                            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
                          >
                            -5%
                          </button>
                          <span className={`text-xl font-mono font-black w-14 text-center ${cocModifier > 0 ? 'text-emerald-400' : cocModifier < 0 ? 'text-red-400' : 'text-white'}`}>
                            {cocModifier > 0 ? `+${cocModifier}%` : `${cocModifier}%`}
                          </span>
                          <button
                            onClick={() => setCocModifier(prev => prev + 5)}
                            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
                          >
                            +5%
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Dice Type switcher (Normal vs Bonus/Penalty) */}
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-zinc-500">Würfel-Konfiguration (Bonus / Straf-Würfel)</span>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {(["normal", "bonus1", "bonus2", "penalty1", "penalty2"] as const).map((mode) => (
                          <button
                            key={mode}
                            onClick={() => setCocDiceType(mode)}
                            className={`px-3 py-2 rounded-lg text-[10px] font-bold font-mono transition-all border ${
                              cocDiceType === mode 
                                ? "bg-orange-500 text-black border-orange-500 font-extrabold shadow-md"
                                : "bg-zinc-950/50 border-zinc-850 text-zinc-400 hover:border-zinc-700"
                            }`}
                          >
                            {mode === "normal" && "Normal (d100)"}
                            {mode === "bonus1" && "1 Bonuswürfel"}
                            {mode === "bonus2" && "2 Bonuswürfel"}
                            {mode === "penalty1" && "1 Strafwürfel"}
                            {mode === "penalty2" && "2 Strafwürfel"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Success Scale overview card */}
                    <div className="p-4 bg-orange-950/15 border border-orange-500/20 rounded-2xl font-mono">
                      <span className="text-[9px] uppercase tracking-wider text-orange-500 font-extrabold">Cthulhu Erfolgsklassen Vorschau</span>
                      <div className="grid grid-cols-3 gap-2 mt-3 text-center border-t border-zinc-900 pt-3">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-zinc-500 uppercase font-black">Regulär (Basis)</span>
                          <span className="text-sm font-bold text-zinc-200 mt-0.5">&le; {cocStats.adjustedTarget}%</span>
                        </div>
                        <div className="flex grid-cols-1 border-x border-zinc-900">
                          <span className="text-[9px] text-zinc-500 uppercase font-black">Schwer (1/2)</span>
                          <span className="text-sm font-bold text-amber-400 mt-0.5">&le; {cocStats.hard}%</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] text-zinc-500 uppercase font-black">Extrem (1/5)</span>
                          <span className="text-sm font-bold text-cyan-400 mt-0.5">&le; {cocStats.extreme}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {data.system === 'traveller' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        <span className="text-xs uppercase tracking-widest font-black text-blue-400 font-mono">
                          Traveller 2D6 Task & Skill Check Settings
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-400 font-mono bg-blue-950/30 px-2.5 py-1 rounded-lg border border-blue-800/40">
                        Basis-Erfolgsgrenze: <strong>8+ (Durchschnitt)</strong>
                      </span>
                    </div>

                    {/* Quick Selection: Skills */}
                    {availableSkills.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-zinc-400">
                          Fertigkeit wählen (Stufe + Attribut laden):
                        </span>
                        <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto pr-2 scrollbar-thin">
                          {availableSkills.map((sk) => (
                            <button
                              key={sk.name}
                              onClick={() => handleTravellerSkillSelect(sk.name)}
                              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-mono border transition-all flex items-center gap-1.5 ${
                                travellerSkillSelected === sk.name
                                  ? 'bg-blue-500/20 border-blue-400 text-blue-300 font-bold shadow-md'
                                  : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                              }`}
                            >
                              <span>{sk.name}</span>
                              <span className="text-[9px] px-1 py-0.2 rounded bg-zinc-800 text-blue-300 font-bold">
                                Stufe {sk.value}
                              </span>
                              {sk.note && (
                                <span className="text-[8px] text-zinc-500 uppercase font-mono">
                                  ({sk.note})
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quick Selection: Attributes */}
                    {availableAttrs.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-zinc-400">
                          Attribut (DM) auswählen:
                        </span>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                          {availableAttrs.map((at) => {
                            const val = typeof at.value === 'number' ? at.value : parseInt(at.value.toString().replace(/[+]/g, ''), 10) || 7;
                            const dmg = at.damage || 0;
                            const effectiveVal = Math.max(0, val - dmg);
                            const dm = getTravellerDM(effectiveVal);
                            const isSelected = (travellerAttrSelected || "").toUpperCase() === (at?.label || "").toUpperCase();

                            return (
                              <button
                                key={at.label}
                                onClick={() => handleTravellerAttrSelect(at.label)}
                                className={`p-2 rounded-xl text-[11px] font-mono border transition-all text-center flex flex-col items-center justify-between ${
                                  isSelected
                                    ? 'bg-blue-500/20 border-blue-400 text-blue-200 font-bold shadow-md'
                                    : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                                }`}
                              >
                                <span className="text-[9px] uppercase tracking-wider text-zinc-400">{at.label}</span>
                                <span className="text-base font-black text-white my-0.5">{effectiveVal}</span>
                                <span className={`text-[9px] font-bold px-1.5 rounded ${
                                  dm > 0 ? 'bg-blue-500/20 text-blue-300' : dm === 0 ? 'bg-zinc-800 text-zinc-400' : 'bg-red-500/20 text-red-400'
                                }`}>
                                  DM {formatTravellerDM(dm)}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Difficulty DC Selector */}
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-zinc-400">
                        Schwierigkeitsgrad (SG / Target Number):
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {TRAVELLER_DIFFICULTIES.map((diff) => {
                          const isSelected = travellerDifficulty === diff.target;
                          return (
                            <button
                              key={diff.name}
                              onClick={() => setTravellerDifficulty(diff.target)}
                              className={`p-2 rounded-xl text-left border transition-all font-mono ${
                                isSelected
                                  ? 'bg-blue-600 text-white border-blue-400 shadow-md font-bold'
                                  : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                              }`}
                            >
                              <div className="flex justify-between items-center text-xs font-bold">
                                <span>{diff.name.split(' ')[0]}</span>
                                <span className="px-1.5 py-0.2 rounded bg-black/40 text-blue-300 text-[10px]">
                                  {diff.target}+
                                </span>
                              </div>
                              <span className="text-[8px] text-zinc-400 line-clamp-1 mt-0.5 opacity-80">
                                {diff.description}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Numeric Modifiers & Advantage Mode */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Skill level adjust */}
                      <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800">
                        <span className="text-[10px] font-mono font-bold uppercase text-zinc-400 block mb-2">Fertigkeits-Stufe</span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setTravellerBaseSkill(prev => Math.max(-3, prev - 1))}
                            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-xl font-mono font-black text-white w-12 text-center">
                            {travellerBaseSkill >= 0 ? `+${travellerBaseSkill}` : travellerBaseSkill}
                          </span>
                          <button
                            onClick={() => setTravellerBaseSkill(prev => Math.min(6, prev + 1))}
                            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Situational DM adjust */}
                      <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800">
                        <span className="text-[10px] font-mono font-bold uppercase text-zinc-400 block mb-2">Situations-DM (Umgebung)</span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setTravellerModifier(prev => prev - 1)}
                            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
                          >
                            <Minus size={14} />
                          </button>
                          <span className={`text-xl font-mono font-black w-12 text-center ${
                            travellerModifier > 0 ? 'text-emerald-400' : travellerModifier < 0 ? 'text-red-400' : 'text-white'
                          }`}>
                            {travellerModifier > 0 ? `+${travellerModifier}` : travellerModifier}
                          </span>
                          <button
                            onClick={() => setTravellerModifier(prev => prev + 1)}
                            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Roll Mode (Boon / Normal / Bane) */}
                      <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800 flex flex-col justify-between">
                        <span className="text-[10px] font-mono font-bold uppercase text-zinc-400 block mb-1">Würfelmodus</span>
                        <div className="grid grid-cols-3 gap-1">
                          <button
                            onClick={() => setTravellerRollMode('bane')}
                            className={`p-1.5 rounded-lg text-[9px] font-mono font-bold border transition-all text-center ${
                              travellerRollMode === 'bane'
                                ? 'bg-red-600 text-white border-red-500 font-black'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                            }`}
                            title="Nachteil / Bane: 3D6 würfeln, 2 niedrigste behalten"
                          >
                            Bane (3D6↓)
                          </button>
                          <button
                            onClick={() => setTravellerRollMode('normal')}
                            className={`p-1.5 rounded-lg text-[9px] font-mono font-bold border transition-all text-center ${
                              travellerRollMode === 'normal'
                                ? 'bg-blue-600 text-white border-blue-500 font-black'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            Normal (2D6)
                          </button>
                          <button
                            onClick={() => setTravellerRollMode('boon')}
                            className={`p-1.5 rounded-lg text-[9px] font-mono font-bold border transition-all text-center ${
                              travellerRollMode === 'boon'
                                ? 'bg-emerald-600 text-white border-emerald-500 font-black'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                            }`}
                            title="Vorteil / Boon: 3D6 würfeln, 2 höchste behalten"
                          >
                            Boon (3D6↑)
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Tactical Autofire & Salven Selector */}
                    <div className="p-3 bg-zinc-950/40 rounded-xl border border-zinc-800 flex items-center justify-between gap-3 flex-wrap font-mono text-xs">
                      <span className="text-[10px] text-zinc-400 uppercase font-bold">Feuerstoß & Kampfmanöver:</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setTravellerAutoBonus(0)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] border transition-all ${
                            travellerAutoBonus === 0
                              ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 font-bold'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                          }`}
                        >
                          Einzelschuss (+0 DM)
                        </button>
                        <button
                          onClick={() => setTravellerAutoBonus(2)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] border transition-all ${
                            travellerAutoBonus === 2
                              ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 font-bold'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                          }`}
                          title="Auto 2: Verleiht +2 DM auf den Trefferwurf"
                        >
                          Feuerstoß Auto 2 (+2 DM)
                        </button>
                        <button
                          onClick={() => setTravellerAutoBonus(4)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] border transition-all ${
                            travellerAutoBonus === 4
                              ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 font-bold'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                          }`}
                          title="Auto 4 / Volle Salve: Verleiht +4 DM auf den Trefferwurf"
                        >
                          Dauerfeuer (+4 DM)
                        </button>
                      </div>
                    </div>

                    {/* Traveller Probability & Forecast panel */}
                    <div className="p-4 bg-blue-950/20 border border-blue-500/30 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 font-mono">
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-blue-400 font-extrabold">
                          Erfolgs-Prognose & 2D6 Wahrscheinlichkeit
                        </span>
                        <h4 className="text-2xl font-black text-white mt-1">
                          2D6 {travellerStats.totalBonus >= 0 ? `+${travellerStats.totalBonus}` : travellerStats.totalBonus} vs SG {travellerDifficulty}
                        </h4>
                        <p className="text-[10px] text-zinc-400 mt-0.5">
                          Formel: Stufe {travellerBaseSkill} + {travellerAttrSelected} (DM {formatTravellerDM(travellerStats.attrDM)})
                          {travellerModifier !== 0 ? ` + Mod (${travellerModifier > 0 ? `+${travellerModifier}` : travellerModifier})` : ''}
                          {travellerAutoBonus > 0 ? ` + Salve (+${travellerAutoBonus})` : ''}
                          {travellerRollMode !== 'normal' ? ` • ${(travellerRollMode || '').toUpperCase()}` : ''}
                        </p>
                      </div>

                      <div className="flex gap-4 border-t sm:border-t-0 sm:border-l border-zinc-800 pt-4 sm:pt-0 sm:pl-6 leading-tight">
                        <div className="flex flex-col justify-center">
                          <span className="text-[9px] text-zinc-500 uppercase font-black">Erfolgs-Chance</span>
                          <span className={`text-xl font-black mt-1 ${
                            travellerStats.successChance >= 70 ? 'text-emerald-400' :
                            travellerStats.successChance < 40 ? 'text-red-400' : 'text-blue-300'
                          }`}>
                            {travellerStats.successChance}%
                          </span>
                        </div>
                        <div className="flex flex-col justify-center">
                          <span className="text-[9px] text-zinc-500 uppercase font-black">Krit / Patzer</span>
                          <span className="text-xs font-bold text-zinc-300 mt-1">
                            {travellerStats.critSuccessChance}% / {travellerStats.fumbleChance}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* --- CUSTOM DICE CONTROLS --- */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                    <span className="text-xs uppercase tracking-widest font-black text-orange-500 font-mono">Maßgeschneiderte Würfelformel</span>
                  </div>
                  
                  {/* Select custom roll mode */}
                  <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-850 gap-1 select-none self-start md:self-auto">
                    <button
                      onClick={() => setCustomRollMode("sum")}
                      type="button"
                      className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                        customRollMode === "sum"
                          ? "bg-zinc-800 text-white shadow-sm border border-zinc-700/50"
                          : "text-zinc-500 hover:text-zinc-350"
                      }`}
                    >
                      Summen-Modus
                    </button>
                    <button
                      onClick={() => {
                        setCustomRollMode("shadowrun");
                        setCustomDiceSides(6);
                      }}
                      type="button"
                      className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                        customRollMode === "shadowrun"
                          ? "bg-cyan-950/40 text-cyan-400 border border-cyan-500/30 shadow-inner"
                          : "text-zinc-500 hover:text-zinc-350"
                      }`}
                    >
                      SR Erfolge (d6)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Dice Count */}
                  <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-850">
                    <span className="text-[10px] font-mono font-bold uppercase text-zinc-400 block mb-2">Anzahl Würfel</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setCustomDiceCount(prev => Math.max(1, prev - 1))}
                        className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="text-xl font-mono font-black text-white w-10 text-center">{customDiceCount}</span>
                      <button
                        onClick={() => setCustomDiceCount(prev => Math.min(50, prev + 1))}
                        className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Dice Sides */}
                  <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-850">
                    <span className="text-[10px] font-mono font-bold uppercase text-zinc-400 block mb-2">Würfeltyp (Seiten)</span>
                    <div className="flex items-center justify-between">
                      {customRollMode === "shadowrun" ? (
                        <div className="w-full bg-cyan-950/20 border border-cyan-500/25 px-2.5 py-1.5 text-xs font-mono font-bold text-cyan-455 rounded-lg select-none text-center">
                          Erfolgszähler d6 (fixiert)
                        </div>
                      ) : (
                        <select
                          value={customDiceSides}
                          onChange={(e) => setCustomDiceSides(parseInt(e.target.value) || 20)}
                          className="w-full bg-zinc-900 border border-zinc-800 p-2 text-xs font-mono font-bold text-zinc-300 rounded-lg focus:outline-none focus:border-orange-500 cursor-pointer"
                        >
                          <option value={4}>d4 (Standard)</option>
                          <option value={6}>d6 (Standard)</option>
                          <option value={8}>d8 (Standard)</option>
                          <option value={10}>d10 (Standard)</option>
                          <option value={12}>d12 (Standard)</option>
                          <option value={20}>d20 (Standard)</option>
                          <option value={100}>d100 (Standard)</option>
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Modifier Adjust */}
                  <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-850">
                    <span className="text-[10px] font-mono font-bold uppercase text-zinc-400 block mb-2">Additiver Bonus / Malus</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setCustomModifier(prev => prev - 1)}
                        className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
                      >
                        <Minus size={14} />
                      </button>
                      <span className={`text-xl font-mono font-black w-10 text-center ${customModifier > 0 ? 'text-emerald-400' : customModifier < 0 ? 'text-red-400' : 'text-white'}`}>
                        {customModifier > 0 ? `+${customModifier}` : customModifier}
                      </span>
                      <button
                        onClick={() => setCustomModifier(prev => prev + 1)}
                        className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-zinc-950/60 border border-zinc-850 rounded-2xl flex items-center justify-between font-mono text-xs">
                  <span className="text-zinc-500 uppercase font-black text-[9px]">Gleichung</span>
                  <div className="text-right">
                    <span className="text-white font-black text-xl bg-orange-950/20 px-3 py-1.5 rounded border border-orange-500/10">
                      {customRollMode === "shadowrun" ? (
                        <span className="text-cyan-400 font-bold">{customDiceCount + customModifier}d6 Erfolgs-Pool</span>
                      ) : (
                        <span>{customDiceCount}d{customDiceSides} {customModifier > 0 ? `+ ${customModifier}` : customModifier < 0 ? `- ${Math.abs(customModifier)}` : ""}</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* BIG ACTION ROLL ZONE */}
            <div className="border-t border-zinc-850/50 mt-8 pt-8 flex flex-col items-center justify-center min-h-[160px]">
              {isRolling ? (
                <div className="flex flex-col items-center justify-center gap-4">
                  <motion.div
                    animate={{ rotate: [0, 360], scale: [1, 1.15, 0.9, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 0.6 }}
                    className="w-16 h-16 rounded-3xl bg-orange-600/10 border border-orange-500 flex items-center justify-center text-4xl shadow-[0_0_20px_rgba(249,115,22,0.15)]"
                  >
                    🎲
                  </motion.div>
                  <span className="text-xs font-mono font-bold tracking-widest text-zinc-500 uppercase animate-pulse">
                    Würfe werden generiert...
                  </span>
                </div>
              ) : activeResult ? (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-full space-y-4 text-center flex flex-col items-center"
                >
                  <div className="text-[10px] tracking-[0.2em] uppercase font-mono font-black text-zinc-550">Ergebnis der Auswürfelung</div>
                  
                  {/* Main result badge */}
                  <div className="flex items-center gap-4 justify-center">
                    <span className="text-5xl font-black text-white font-mono tracking-tight tracking-tighter">
                      {activeResult.finalResult}
                    </span>
                    <div className={`text-xs uppercase font-mono font-black tracking-widest border px-3 py-1.5 rounded-xl ${activeResult.statusColor}`}>
                      {activeResult.statusText}
                    </div>
                  </div>

                  {/* Dice breakdown visualizer */}
                  {activeResult.rolls.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[9px] uppercase font-mono tracking-wider font-bold text-zinc-500">Würfel-Einzelwerte</div>
                      <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg mt-1 bg-zinc-950/40 p-3 rounded-2xl border border-zinc-900/50">
                        {activeResult.rolls.map((r, i) => {
                          const isShadowrunRoll = data.system === 'shadowrun' || (calcMode === "custom" && customRollMode === "shadowrun");
                          const isSuccess = isShadowrunRoll && (r === 5 || r === 6);
                          const isOne = isShadowrunRoll && r === 1;
                          
                          let diceStyle = "bg-zinc-900 border-zinc-800 text-zinc-300";
                          if (isShadowrunRoll) {
                            if (isSuccess) diceStyle = "bg-cyan-950/40 border-cyan-500/50 text-cyan-400 font-extrabold shadow-[0_0_10px_rgba(6,182,212,0.1)]";
                            if (isOne) diceStyle = "bg-red-950/40 border-red-500/50 text-red-400 font-bold";
                          } else if (data.system === 'pathfinder') {
                            if (r === 20) diceStyle = "bg-amber-950 border-amber-400 text-amber-400 font-extrabold animate-pulse shadow-md";
                            if (r === 1) diceStyle = "bg-red-950 border-red-500 text-red-500 font-bold";
                          } else if (data.system === 'traveller') {
                            if (r === 6) diceStyle = "bg-blue-950/50 border-blue-400 text-blue-300 font-extrabold shadow-[0_0_8px_rgba(59,130,246,0.2)]";
                            if (r === 1) diceStyle = "bg-red-950/40 border-red-500/60 text-red-400 font-bold";
                          }

                          return (
                            <div 
                              key={i} 
                              className={`w-8 h-8 rounded-lg border flex items-center justify-center font-mono text-xs font-black shadow-inner ${diceStyle}`}
                            >
                              {r}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Verbal description */}
                  <p className="text-xs text-zinc-400 font-mono italic max-w-xl leading-relaxed text-center mt-2 px-6">
                    {activeResult.details}
                  </p>

                  <button
                    onClick={executeRoll}
                    className="mt-2 text-[10px] font-mono uppercase tracking-widest font-black text-orange-500 hover:text-orange-400 flex items-center gap-1.5 transition-colors border-b border-dashed border-orange-500/30 hover:border-orange-400"
                  >
                    <RotateCcw size={10} /> Erneut Würfeln
                  </button>
                </motion.div>
              ) : (
                <button
                  onClick={executeRoll}
                  className={`px-10 py-5 rounded-2xl text-xs font-black font-mono tracking-[0.2em] shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center gap-3 ${
                    data.system === 'shadowrun' 
                      ? "bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.15)]" 
                      : data.system === 'pathfinder'
                        ? "bg-amber-500 text-black hover:bg-amber-400"
                        : data.system === 'traveller'
                          ? "bg-blue-600 text-white hover:bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                          : "bg-orange-500 text-black hover:bg-orange-400"
                  }`}
                >
                  <Dices size={16} className="stroke-[2.5px]" /> PROBE AUSFÜHREN
                </button>
              )}
            </div>

          </div>
        </div>

        {/* Rolling process History Panel */}
        <div className="lg:col-span-12 xl:col-span-4 space-y-6">
          <div className="bg-zinc-950/40 border border-zinc-800 p-6 rounded-3xl h-full flex flex-col justify-between max-h-[800px]">
            <div>
              <div className="flex items-center justify-between border-b border-zinc-900 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} className="text-zinc-500" />
                  <span className="text-xs uppercase tracking-widest font-mono font-black text-zinc-400">Würfelverlauf</span>
                </div>
                {history.length > 0 && (
                  <button 
                    onClick={() => setHistory([])}
                    className="text-[9px] font-mono tracking-wider font-extrabold text-zinc-650 hover:text-red-400 transition-colors"
                  >
                    LÖSCHEN
                  </button>
                )}
              </div>

              <div className="space-y-3 overflow-y-auto max-h-[480px] pr-2 scrollbar-none">
                {history.map((entry) => (
                  <div key={entry.id} className="p-3 bg-zinc-900/30 border border-zinc-850 rounded-xl relative hover:border-zinc-700 transition-colors">
                    <span className="absolute top-3 right-3 text-[8px] text-zinc-600 font-mono font-bold">{entry.timestamp}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] uppercase font-mono tracking-widest text-zinc-500 leading-none">
                        {(entry?.system || 'generic').toUpperCase()}
                      </span>
                    </div>
                    <h5 className="text-xs font-black text-zinc-250 leading-tight mt-1 truncate max-w-[150px]">
                      {entry.title}
                    </h5>
                    <p className="text-[10px] text-zinc-550 font-mono mt-0.5">{entry.formula}</p>

                    <div className="mt-3 flex items-center justify-between border-t border-zinc-900 pt-2 font-mono">
                      <div className="flex flex-wrap gap-1 max-w-[140px]">
                        {entry.rolls.slice(0, 8).map((val, idx) => (
                          <span key={idx} className="text-[9px] font-bold text-zinc-500 bg-zinc-950 border border-zinc-850 px-1 py-0.5 rounded leading-none">
                            {val}
                          </span>
                        ))}
                        {entry.rolls.length > 8 && <span className="text-[8px] text-zinc-750 font-bold font-mono">+{entry.rolls.length - 8}..</span>}
                      </div>
                      <span className={`text-xs font-black uppercase text-right leading-none ${entry.statusColor.split(' ')[0]}`}>
                        {entry.result}
                      </span>
                    </div>
                  </div>
                ))}

                {history.length === 0 && (
                  <div className="py-12 text-center border border-dashed border-zinc-850 rounded-2xl">
                    <HelpCircle size={28} className="text-zinc-800 mx-auto mb-2" />
                    <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-mono">Noch keine Würfe</p>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Quick Advice */}
            <div className="mt-6 p-4 border border-zinc-850 bg-zinc-900/20 rounded-2xl font-mono text-[9px] leading-relaxed text-zinc-600">
              <div className="flex items-center gap-1.5 text-zinc-500 mb-1.5 font-bold uppercase tracking-wider">
                <Award size={10} /> Info zur Berechnung
              </div>
              Der Probenrechner liest alle Attribute, Fertigkeiten und deren Spezialisierungen aus deinem Charakterblatt aus, um fehlerfreie Würfe mit einem Klick zu ermöglichen.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
