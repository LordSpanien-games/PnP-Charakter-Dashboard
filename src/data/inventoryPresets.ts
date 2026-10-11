import { InventoryItem } from "../types";

export interface InventoryPreset {
  id: string;
  name: string;
  category: InventoryItem['category'];
  rating?: number | string;
  damage?: string;
  accuracy?: string | number;
  ap?: string | number;
  mode?: string;
  rc?: string | number;
  ammo?: string;
  weaponType?: 'melee' | 'ranged';
  armorValue?: string | number;
  price?: number;
  weight?: string;
  notes: string;
  system?: 'shadowrun' | 'all';
}

export const INVENTORY_PRESETS: InventoryPreset[] = [
  // ==================== SHADOWRUN WAFFEN (FERNKAMPF) ====================
  {
    id: "preset-ares-predator-v",
    name: "Ares Predator V",
    category: "weapon",
    weaponType: "ranged",
    damage: "8K",
    accuracy: 5,
    ap: -1,
    mode: "HM",
    rc: 0,
    ammo: "15 (c)",
    price: 725,
    rating: 2,
    notes: "Schwere Pistole, Smartlink integriert (+2 Pool bei Smartlink-Okular), inkl. 1 Ersatzmagazin.",
    system: "shadowrun"
  },
  {
    id: "preset-ares-alpha",
    name: "Ares Alpha Sturmgewehr",
    category: "weapon",
    weaponType: "ranged",
    damage: "11K",
    accuracy: 5,
    ap: -2,
    mode: "HM/SF/AM",
    rc: 2,
    ammo: "42 (c)",
    price: 2650,
    rating: 4,
    notes: "Sturmgewehr mit integriertem Granatwerfer (6 Granaten, Schaden nach Granatentyp) und Schalldämpfer.",
    system: "shadowrun"
  },
  {
    id: "preset-remington-950",
    name: "Remington 950 Scharfschützengewehr",
    category: "weapon",
    weaponType: "ranged",
    damage: "12K",
    accuracy: 7,
    ap: -4,
    mode: "EM",
    rc: 1,
    ammo: "5 (m)",
    price: 2100,
    rating: 4,
    notes: "Präzisions-Jagd- und Scharfschützengewehr mit Zielfernrohr (Bildverbindung, Entfernungsfinder).",
    system: "shadowrun"
  },
  {
    id: "preset-defiance-t250",
    name: "Defiance T-250 Schrotflinte",
    category: "weapon",
    weaponType: "ranged",
    damage: "10K",
    accuracy: 4,
    ap: -1,
    mode: "HM",
    rc: 0,
    ammo: "5 (m)",
    price: 450,
    rating: 2,
    notes: "Verkürzte Schrotflinte für den Nahbereich. Streuschuss-Optionen verfügbar.",
    system: "shadowrun"
  },
  {
    id: "preset-ares-light-fire",
    name: "Ares Light Fire 75",
    category: "weapon",
    weaponType: "ranged",
    damage: "6K",
    accuracy: 6,
    ap: 0,
    mode: "HM",
    rc: 0,
    ammo: "16 (c)",
    price: 1250,
    rating: 2,
    notes: "Leichte Pistole mit integriertem Schalldämpfer. Äußerst diskret zu verbergen.",
    system: "shadowrun"
  },

  // ==================== SHADOWRUN WAFFEN (NAHKAMPF) ====================
  {
    id: "preset-monoschwert",
    name: "Monoschwert Ares Classic",
    category: "weapon",
    weaponType: "melee",
    damage: "(STÄ+3)K",
    accuracy: 6,
    ap: -3,
    price: 900,
    rating: 3,
    notes: "Monofilament-beschichtete Klinge. Durchschneidet Panzerung wie Butter.",
    system: "shadowrun"
  },
  {
    id: "preset-kampfmesser",
    name: "Cougar Kampfmesser",
    category: "weapon",
    weaponType: "melee",
    damage: "(STÄ+2)K",
    accuracy: 6,
    ap: -1,
    price: 300,
    rating: 2,
    notes: "Robustes Taktikmesser aus gehärtetem Titan-Kohlenstoff-Verbund.",
    system: "shadowrun"
  },
  {
    id: "preset-schockhandschuh",
    name: "Schockhandschuhe",
    category: "weapon",
    weaponType: "melee",
    damage: "8G(e)",
    accuracy: 4,
    ap: -5,
    ammo: "10 Ladungen",
    price: 200,
    rating: 2,
    notes: "Elektrischer Berührungsschaden (Elektrizitätsschaden, senkt Initiative um -5).",
    system: "shadowrun"
  },
  {
    id: "preset-teleskopschlagstock",
    name: "Teleskopschlagstock",
    category: "weapon",
    weaponType: "melee",
    damage: "(STÄ+2)G",
    accuracy: 5,
    ap: 0,
    price: 100,
    rating: 1,
    notes: "Ausziehbarer Betäubungsschlagstock, unauffällig am Gürtel tragbar (+2 auf Verbergen).",
    system: "shadowrun"
  },

  // ==================== PANZERUNG ====================
  {
    id: "preset-panzerjacke",
    name: "Panzerjacke (Armored Jacket)",
    category: "armor",
    armorValue: 12,
    price: 1000,
    rating: 3,
    notes: "Der Standard der Schattenszene. Bietet exzellenten Schutz gegen Schusswaffen und Schrapnell.",
    system: "shadowrun"
  },
  {
    id: "preset-panzerkleidung",
    name: "Panzermantel / Trenchcoat",
    category: "armor",
    armorValue: 9,
    price: 500,
    rating: 2,
    notes: "Langer Kevlar-Mantel mit Innenholstern. Verdeckt Maschinenpistolen und Klingen (+2 Verbergen).",
    system: "shadowrun"
  },
  {
    id: "preset-chamaeleonanzug",
    name: "Chamäleonanzug",
    category: "armor",
    armorValue: 9,
    price: 1700,
    rating: 4,
    notes: "Infiltrierungs-Bodysuit mit thermo-optischer Tarnung. Verleiht +2 Würfel auf Schleichen gegen visuelle Wahrnehmung.",
    system: "shadowrun"
  },
  {
    id: "preset-ballistischer-helm",
    name: "Ballistischer Helm",
    category: "armor",
    armorValue: "+2",
    price: 100,
    rating: 2,
    notes: "Zusätzlicher Helm-Schutz (addiert +2 auf Panzerung). Mit Bildverbindung und Mikrofon ausgestattet.",
    system: "shadowrun"
  },

  // ==================== AUSRÜSTUNG & ELEKTRONIK ====================
  {
    id: "preset-commlink-avalon",
    name: "Transys Avalon Commlink",
    category: "electronics",
    rating: 6,
    price: 5000,
    notes: "Gerätestufe 6 Luxus-Commlink. Datenverarbeitung 6, Firewall 6. Sim-Modul, AR-Brille-Kopplung.",
    system: "shadowrun"
  },
  {
    id: "preset-medkit-4",
    name: "Erste-Hilfe-Kasten (Medkit Stufe 4)",
    category: "consumable",
    rating: 4,
    price: 1000,
    notes: "Tragbares Trauma-Set mit Diagnose-Software, Hämostyptika, Stim-Pflaster und Wundverbänden.",
    system: "shadowrun"
  },
  {
    id: "preset-stim-patch",
    name: "Stim-Patch (Stufe 4)",
    category: "consumable",
    rating: 4,
    price: 100,
    notes: "Entfernt sofort 4 Kästchen Betäubungsschaden für 4 Stunden. Verursacht danach 1 Kasten körperlichen Schaden.",
    system: "shadowrun"
  },
  {
    id: "preset-fake-sin",
    name: "Gefälschte SIN (Stufe 4) mit Lizenzen",
    category: "gear",
    rating: 4,
    price: 10000,
    notes: "Gefälschte Systemidentifikationsnummer mit Lizenzen für Smartlink, Handfeuerwaffen und Cyberdeck.",
    system: "shadowrun"
  },
  {
    id: "preset-kletterausruestung",
    name: "Taktische Kletterausrüstung",
    category: "gear",
    rating: 3,
    price: 200,
    notes: "Enthält 50m Monofilament-Kletterseil, Mikrowinde, Klettergurt und Magnet-Karabiner.",
    system: "shadowrun"
  },
  {
    id: "preset-munition-apds",
    name: "Munitionsbox APDS (Schwere Pistole)",
    category: "ammo",
    damage: "+0",
    ap: -4,
    ammo: "50 Schuss",
    price: 600,
    rating: 4,
    notes: "Armor-Piercing Discarding Sabot (Panzerbrechende Treibspiegelmunition): Verbessert DK um -4.",
    system: "shadowrun"
  },
  {
    id: "preset-munition-gel",
    name: "Munitionsbox Gelgeschosse (Sturmgewehr)",
    category: "ammo",
    damage: "+0G",
    ap: +1,
    ammo: "50 Schuss",
    price: 125,
    rating: 2,
    notes: "Nicht-tödliche Munition: Verursacht Geistigen Schaden (G).",
    system: "shadowrun"
  }
];
