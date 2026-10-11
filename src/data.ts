import { CharacterData } from './types';

export const FLOKI_DATA: CharacterData = {
  system: 'pathfinder',
  name: "Floki Dunkkling",
  subTitle: "Level 9 Gnom Dieb",
  stats: [
    { label: "TP", value: 80 },
    { label: "RK", value: 24 },
    { label: "Berührung", value: 14 },
    { label: "Auf dem falschen Fuß", value: 13 },
    { label: "Initiative", value: "+4" },
    { label: "Zähigkeit (Konstitution)", value: "+5" },
    { label: "Reflex (Geschicklichkeit)", value: "+10" },
    { label: "Wille (Weisheit)", value: "+4" },
    { label: "Bewegungsrate", value: "6m" },
    { label: "KMB", value: "+7" },
    { label: "KMV", value: 22 },
  ],
  characteristics: [
    { label: "ST", value: 10, secondary: "+0", modifier: 0 },
    { label: "GE", value: 19, secondary: "+4", modifier: 0 },
    { label: "KO", value: 14, secondary: "+2", modifier: 0 },
    { label: "IN", value: 14, secondary: "+2", modifier: 0 },
    { label: "WE", value: 12, secondary: "+1", modifier: 0 },
    { label: "CH", value: 14, secondary: "+2", modifier: 0 },
  ],
  savingThrows: {
    fortitude: {
      total: 5,
      base: 3,
      abilityMod: 2,
      magicMod: 0,
      miscMod: 0,
      tempMod: 0,
      notes: "+2 gegen Gift & Lähmung (Gnom-Zähigkeit)"
    },
    reflex: {
      total: 10,
      base: 6,
      abilityMod: 4,
      magicMod: 0,
      miscMod: 0,
      tempMod: 0,
      notes: "+3 gegen Fallen (Fallengespür: W20+13), Entrinnen aktiv"
    },
    will: {
      total: 4,
      base: 3,
      abilityMod: 1,
      magicMod: 0,
      miscMod: 0,
      tempMod: 0,
      notes: "+2 gegen Illusionen (Gnom-Volksbonus)"
    }
  },
  useDexToDamage: true,
  combatSettings: {
    attackAttr: 'GE',
    damageAttr: 'GE',
    grip: 'oneHanded',
    isFlanking: true,
    isHasted: false,
    isSneakAttack: true,
    powerAttack: false,
    higherGround: false,
    targetProne: false,
    isStealthed: false,
    customAttackMod: 0,
    customDamageMod: 0,
    selectedWeaponName: 'Dolch des Eises +2'
  },
  weapons: {
    melee: [
      { name: "Dolch des Eises +2", attack: "+12 / +10", damage: "1W3+6 + 1W6 Eis", critical: "19-20/x2", note: "Haupthand, magische Waffe +2 (Waffenfinesse & Dex-Schaden +4 eingerechnet)", page: "GRW S. 142" },
      { name: "Schurkenkurzschwert +1", attack: "+11 / +9", damage: "1W4+5", critical: "19-20/x2", note: "Nebenhand, magische Waffe +1 (Schwert der Subtilität: +4 auf Angriff & Schaden bei HA)", sneakAttackBonus: 4, sneakAttackDamageBonus: 4, isSchurkenWeapon: true, page: "GRW S. 488" },
    ],
    ranged: [
      { name: "Komposit-Kurzbogen +2", attack: "+13 / +8", damage: "1W4+2", critical: "x3", note: "18 Pfeile", range: "21m", page: "GRW S. 143" },
      { name: "Blasrohr", attack: "+11 / +6", damage: "1", critical: "x2", note: "Primär für Gift", range: "6m", page: "GRW S. 143" },
    ],
  },
  combos: [
    {
      id: "1",
      title: "Angriff aus der Bewegung",
      description: "Standard-Aktion + Bewegungs-Aktion. Bewegen UND einmal angreifen – kein voller Angriff möglich.",
      weapons: [
        { name: "Dolch des Eises +2", roll: "W20+12", damage: "1W3+6 + 1W6 Eis", notes: ["Kritisch: 19-20 (Bestätigung W20+12)", "HA: +5W6 + 5 Blutung/Runde (GE-Bonus einkalkuliert)"] },
        { name: "Schurkenkurzschwert +1", roll: "W20+11", damage: "1W4+5", notes: ["HA: Angriff W20+13, Schaden 1W4+5 + 5W6 (GE-Bonus einkalkuliert)"] },
      ]
    },
    {
      id: "4",
      title: "Voller Angriff – Zwei Waffen",
      description: "Keine Bewegung, max. 1,5m Schritt. 4 Angriffe gesamt!",
      table: {
        headers: ["Angriff", "Hand", "Wurf", "Schaden"],
        rows: [
          ["1. Haupthand", "Dolch des Eises +2", "W20+12", "1W3+6 + 1W6 Eis"],
          ["2. Haupthand", "Dolch des Eises +2", "W20+10", "1W3+6 + 1W6 Eis"],
          ["3. Nebenhand", "Schurkenkurzschwert +1", "W20+11", "1W4+5"],
          ["4. Nebenhand (verb.)", "Schurkenkurzschwert +1", "W20+9", "1W4+5"],
        ]
      },
      notes: ["Waffenfinesse aktiv (GE +4 auf Angriff)", "Schurken-Finesse: GE +4 auf Schaden eingerechnet", "Verteidigung mit zwei Waffen: +1 Schildbonus auf RK"]
    },
    {
      id: "5",
      title: "Optimaler Schadenszug (HA)",
      description: "Bedingung: Flankiert, Überrascht oder GE-Verlust.",
      table: {
        headers: ["Angriff", "Wurf", "Schaden gesamt"],
        rows: [
          ["Treffer 1", "W20+11", "1W3+6 + 1W6 Eis + 5W6 + 5 Blutung"],
          ["Treffer 2", "W20+9", "1W3+6 + 1W6 Eis + 5W6"],
          ["Treffer 3", "W20+13", "1W4+5 + 5W6"],
          ["Treffer 4", "W20+11", "1W4+5 + 5W6"],
        ]
      },
      notes: [
        "Geschicklichkeitsbonus (+4) auf Schaden eingerechnet",
        "Blutung gilt nur einmal (+5 TP/Runde)",
        "Hinterhältiger Angriff: +5W6 pro Treffer separat",
        "Kein HA gegen Untote / Konstrukte"
      ]
    }
  ],
  abilities: [
    { name: "Hinterhältiger Angriff +5W6", type: "class", effect: "Zusatzschaden wenn Ziel: flankiert / überrascht / GE-los.", page: "GRW S. 67" },
    { name: "Blutende Wunden (Bleeding Attack)", type: "rogue_talent", usage: "Passiv bei HA-Treffer", effect: "5 TP Blutung/Runde zu Beginn von Flokis Zug. Stoppen: Heilkunde SG 15 oder magische Heilung.", page: "GRW S. 68" },
    { name: "Schwächender Schlag (Debilitating Injury)", type: "rogue_talent", usage: "1 Runde nach HA-Treffer", effect: "Ziel erhält -2 RK / -2 auf Angriffswürfe oder halbe Bewegungsrate.", page: "Unchained S. 20" },
    { name: "Finesse-Training (Schurken-Finesse)", type: "rogue_talent", usage: "Permanent aktiv", effect: "GE-Modifikator (+4) statt Stärke auf Schadenswürfe mit leichten Waffen (Dolch & Kurzschwert).", page: "Unchained S. 20" },
    { name: "Schnelle Heimlichkeit (Fast Stealth)", type: "rogue_talent", usage: "Bei Bewegung", effect: "Schleichen mit normaler Bewegungsrate ohne Malus. Wurf: W20+19.", page: "GRW S. 68" },
    { name: "Widerstandsfähigkeit (Resiliency)", type: "rogue_talent", usage: "1x/Tag", effect: "1x/Tag einen misslungenen Rettungswurf wiederholen. Das zweite Ergebnis gilt.", page: "GRW S. 68", maxUses: 1, currentUses: 1 },
    { name: "Fallengespür +3", type: "class", effect: "Fallen finden: W20+17, Reflex gegen Fallen: W20+13.", page: "GRW S. 67" },
    { name: "Verbesserte Reflexbewegung", type: "class", effect: "Behält GE-Bonus auf RK auch wenn überrascht oder beim Vorbeibewegen.", page: "GRW S. 67" },
    { name: "Waffenfinesse", type: "talent", effect: "GE statt ST für Angriffswürfe mit leichten Waffen.", page: "GRW S. 136" },
    { name: "Kampf mit zwei Waffen", type: "talent", effect: "Haupt- und Nebenhand angreifen. Malus bereits eingerechnet.", page: "GRW S. 127" },
    { name: "Verteidigung mit zwei Waffen", type: "talent", effect: "+1 Schildbonus auf RK solange zwei Waffen geführt.", page: "GRW S. 135" },
    { name: "Ausweichen", type: "talent", effect: "+1 Ausweichbonus auf RK gegen einen gewählten Gegner.", page: "GRW S. 120" },
    { name: "Beweglichkeit", type: "talent", effect: "+4 RK gegen Gelegenheitsangriffe durch Bewegung.", page: "GRW S. 121" },
    { name: "Geisterhaftes Geräusch", type: "gnome", usage: "1x/Tag", effect: "Illusionszauber für Geräusche.", page: "GRW S. 268", maxUses: 1, currentUses: 1 },
    { name: "Tanzende Lichter", type: "gnome", usage: "1x/Tag", effect: "Schwebende Lichter.", page: "GRW S. 351", maxUses: 1, currentUses: 1 },
    { name: "Mit Tieren sprechen", type: "gnome", usage: "1x/Tag", effect: "Kommunikation mit Tieren.", page: "GRW S. 312", maxUses: 1, currentUses: 1 },
    { name: "Fanghändschuhe", type: "item", usage: "2x/Tag", effect: "Geschoss fangen – Reaktion/Verteidigung.", page: "Ausbauregeln S. 248", maxUses: 2, currentUses: 2 },
    { name: "Kriegsmaske des Schreckens", type: "item", usage: "1x/Tag", effect: "Erschrecken – Willenswurf des Ziels.", page: "Ausbauregeln S. 251", maxUses: 1, currentUses: 1 },
    { name: "Magische Glocke des Rufens", type: "item", usage: "Situativ", effect: "18m Umkreis – Willenswurf SG 14, 7 Runden Suche.", page: "Ausbauregeln S. 253" },
  ],
  skills: [
    { name: "Fingerfertigkeit", value: 15, trained: true, note: "Klassenfertigkeit" },
    { name: "Heimlichkeit", value: 19, trained: true, note: "Dex + Gnom + Grad" },
    { name: "Akrobatik", value: 14, trained: true },
    { name: "Wahrnehmung", value: 13, trained: true },
    { name: "Mechanismus ausschalten", value: 16, trained: true, note: "Diebeswerkzeug" },
    { name: "Bluffen", value: 12, trained: true },
    { name: "Diplomatie", value: 8, trained: false },
    { name: "Einschüchtern", value: 4, trained: false },
  ],
  party: [
    { name: "Valeros", playerName: "Markus", class: "Kämpfer", race: "Mensch" },
    { name: "Seoni", playerName: "Sarah", class: "Hexenmeisterin", race: "Mensch" },
  ],
  currency: {
    amount: 850,
    unit: "GM",
    coins: {
      pp: 25,
      gp: 560,
      sp: 380,
      cp: 200,
    },
    history: [
      { id: "1", timestamp: "12:00", description: "Beute aus dem Drachenhort", amount: 850, type: "income", balanceAfter: 850, coinDetails: "+25 PM, +560 GM, +380 SM, +200 KM" }
    ]
  },
  experience: {
    current: 82400,
    track: 'medium',
    nextLevel: 105000,
    history: [
      { id: "1", timestamp: "Gestern", amount: 7400, reason: "Befreiung der Zwergenmine", totalAfter: 82400 }
    ]
  },
  inventory: [
    {
      id: "floki-inv-1",
      name: "Dolch des Eises +2",
      category: "weapon",
      weaponType: "melee",
      status: "equipped",
      location: "Unterkunft",
      quantity: 1,
      rating: 2,
      damage: "1W3+2 + 1W6 Eis",
      accuracy: "+12 / +10",
      ap: "19-20/x2",
      notes: "Haupthand • Magische Waffe (+2) • Kälteschaden",
      page: "GRW S. 142"
    },
    {
      id: "floki-inv-2",
      name: "Schurkenkurzschwert +1",
      category: "weapon",
      weaponType: "melee",
      status: "equipped",
      location: "Unterkunft",
      quantity: 1,
      rating: 1,
      damage: "1W4+2",
      accuracy: "+11 / +9",
      ap: "19-20/x2",
      notes: "Nebenhand • Schurkenwaffe (Schwert der Subtilität: +4 Angriff & +4 Schaden bei HA)",
      page: "GRW S. 488"
    },
    {
      id: "floki-inv-3",
      name: "Komposit-Kurzbogen +2",
      category: "weapon",
      weaponType: "ranged",
      status: "equipped",
      location: "Unterkunft",
      quantity: 1,
      rating: 2,
      damage: "1W4+2",
      accuracy: "+13",
      ap: "x3",
      range: "15m",
      ammo: "30 Pfeile",
      notes: "Fernkampf • Angepasst an ST-Modifikator (+2)",
      page: "GRW S. 143"
    },
    {
      id: "floki-inv-4",
      name: "Blasrohr",
      category: "weapon",
      weaponType: "ranged",
      status: "equipped",
      location: "Unterkunft",
      quantity: 1,
      damage: "1",
      accuracy: "+11",
      ap: "x2",
      range: "6m",
      ammo: "10 Nadeln",
      notes: "Lautloser Fernkampf • Giftüberträger",
      page: "GRW S. 143"
    },
    {
      id: "floki-inv-5",
      name: "Mithral-Kettenhemd +1",
      category: "armor",
      status: "equipped",
      location: "Unterkunft",
      quantity: 1,
      rating: 1,
      armorValue: 5,
      notes: "Leichte Rüstung • Max-GE +6 • Rüstungsmalus 0 • Magisch (+1)",
      page: "GRW S. 151"
    },
    {
      id: "floki-inv-6",
      name: "Meisterarbeit Diebeswerkzeug",
      category: "gear",
      status: "equipped",
      location: "Unterkunft",
      quantity: 1,
      notes: "+2 Umstandsbildung auf Mechanismus ausschalten",
      page: "GRW S. 158"
    },
    {
      id: "floki-inv-7",
      name: "Schleichstiefel (Elfenstiefel)",
      category: "gear",
      status: "equipped",
      location: "Unterkunft",
      quantity: 1,
      notes: "+2 Kompetenzbonus auf Heimlichkeit",
      page: "GRW S. 509"
    },
    {
      id: "floki-inv-8",
      name: "Fanghandschuhe",
      category: "gear",
      status: "equipped",
      location: "Unterkunft",
      quantity: 1,
      notes: "2x/Tag Projektil in der Luft fangen",
      page: "Ausbauregeln S. 248",
      maxUses: 2,
      currentUses: 2
    },
    {
      id: "floki-inv-9",
      name: "Kriegsmaske des Schreckens",
      category: "gear",
      status: "stored",
      location: "Unterkunft",
      quantity: 1,
      notes: "1x/Tag Furchteffekt (Willenswurf SG 14)",
      page: "Ausbauregeln S. 251",
      maxUses: 1,
      currentUses: 1
    },
    {
      id: "floki-inv-10",
      name: "Magische Glocke des Rufens",
      category: "gear",
      status: "stored",
      location: "Unterkunft",
      quantity: 1,
      notes: "18m Umkreis • SG 14 • 7 Runden Suche",
      page: "Ausbauregeln S. 253"
    },
    {
      id: "floki-inv-11",
      name: "Ersatz-Kletterausrüstung & Seil (30m)",
      category: "gear",
      status: "stored",
      location: "Unterkunft",
      quantity: 1,
      notes: "Seidenseil mit Wurfanker im Schrank verstaut"
    },
    {
      id: "floki-inv-12",
      name: "Reiseproviant & Heilkräuter",
      category: "consumable",
      status: "stored",
      location: "Unterkunft",
      quantity: 6,
      notes: "Vorräte für Expeditionen in der Truhe"
    }
  ]
};

export const HARVEY_DATA: CharacterData = {
  system: 'coc7e',
  name: "Harvey Walters",
  subTitle: "Journalist, 42 Jahre",
  stats: [
    { label: "Trefferpunkte", value: 12 },
    { label: "Magiepunkte", value: 15 },
    { label: "Stabilität", value: 75 },
    { label: "Glück", value: 50 },
    { label: "Bewegung", value: 8 },
  ],
  characteristics: [
    { label: "ST", value: 40 },
    { label: "KO", value: 50 },
    { label: "GR", value: 70 },
    { label: "GE", value: 60 },
    { label: "ER", value: 55 },
    { label: "IN", value: 80 },
    { label: "MA", value: 75 },
    { label: "BI", value: 90 },
  ],
  skills: [
    { name: "Bibliotheksnutzung", value: 70, note: "Beruf" },
    { name: "Horchen", value: 45 },
    { name: "Muttersprache (Englisch)", value: 90 },
    { name: "Psychologie", value: 60 },
    { name: "Verborgenes Erkennen", value: 50 },
    { name: "Überreden", value: 40 },
    { name: "Handfeuerwaffen", value: 20 },
  ],
  weapons: {
    melee: [
      { name: "Unbewaffnet", attack: "25%", damage: "1W3 + SchB", critical: "Extreme", note: "Standard" },
    ],
    ranged: [
      { name: ".38 Revolver", attack: "20%", damage: "1W10", critical: "Extreme", note: "6 Schuss", range: "15m", attacks: "1(3)", malfunction: "00" },
    ],
  },
  combos: [],
  abilities: [
    { name: "Journalistische Spürnase", type: "trait", effect: "Harvey erhält einen Bonuswürfel auf Bibliotheksnutzung in Zeitungsarchiven." },
  ],
  party: [
    { name: "Sister Mary", playerName: "Elena", occupation: "Nonne" },
    { name: "Professor Rice", playerName: "Thomas", occupation: "Wissenschaftler" },
  ],
  currency: {
    amount: 1400,
    unit: "$",
    history: [
      { id: "1", timestamp: "09:30", description: "Bargeld & Reiseschecks", amount: 1400, type: "income", balanceAfter: 1400 }
    ]
  }
};

export const ARMITAGE_DATA: CharacterData = {
  system: 'coc1920',
  name: "Henry Armitage",
  subTitle: "Bibliothekar, 53 Jahre (1920er)",
  stats: [
    { label: "Trefferpunkte", value: 10 },
    { label: "Magiepunkte", value: 18 },
    { label: "Stabilität", value: 85 },
    { label: "Glück", value: 45 },
    { label: "Bewegung", value: 7 },
  ],
  characteristics: [
    { label: "ST", value: 35 },
    { label: "KO", value: 40 },
    { label: "GR", value: 60 },
    { label: "GE", value: 50 },
    { label: "ER", value: 65 },
    { label: "IN", value: 90 },
    { label: "MA", value: 90 },
    { label: "BI", value: 95 },
  ],
  skills: [
    { name: "Bibliotheksnutzung", value: 90, note: "Beruf" },
    { name: "Okkultismus", value: 40 },
    { name: "Mythos-Wissen", value: 12 },
    { name: "Latein", value: 75 },
    { name: "Geschichte", value: 80 },
    { name: "Psychologie", value: 50 },
  ],
  weapons: {
    melee: [
      { name: "Gehstock", attack: "25%", damage: "1W6 + SchB", critical: "Extreme", note: "Standard" },
    ],
    ranged: [],
  },
  combos: [],
  abilities: [
    { name: "Gelehrter", type: "trait", effect: "Henry kann uralte Texte in Rekordzeit entziffern." },
  ],
  party: [
    { name: "Francis Morgan", playerName: "Julian", occupation: "Abenteurer" },
    { name: "Warren Rice", playerName: "Thomas", occupation: "Professor" },
  ],
  currency: {
    amount: 620,
    unit: "$",
    history: [
      { id: "1", timestamp: "08:15", description: "Universitäts-Spesenkonto", amount: 620, type: "income", balanceAfter: 620 }
    ]
  }
};

export const GHOST_DATA: CharacterData = {
  system: 'shadowrun',
  name: "Kaelen 'Ghost' Hawke",
  subTitle: "Street-Samurai & Hacker",
  stats: [
    { label: "Körperlicher Schaden", value: 10, damage: 0 },
    { label: "Geistiger Schaden", value: 10, damage: 0 },
    { label: "Essenz", value: 4.88 },
    { label: "Edge", value: 4, damage: 0 },
    { label: "Edge Gesamt", value: 4 },
    { label: "Karma", value: 12, damage: 0 },
    { label: "Karma Gesamt", value: 45 },
    { label: "Initiative", value: "9 + 2W6" },
    { label: "Panzerung", value: 13 },
  ],
  characteristics: [
    { label: "KON", value: 4 },
    { label: "GES", value: 7 },
    { label: "REA", value: 5 },
    { label: "STÄ", value: 3 },
    { label: "WIL", value: 5 },
    { label: "LOG", value: 6 },
    { label: "INT", value: 5 },
    { label: "CHA", value: 3 },
  ],
  skills: [
    { name: "Pistolen", value: 6, note: "GES" },
    { name: "Gewehre", value: 5, note: "GES" },
    { name: "Klingenwaffen", value: 7, note: "GES" },
    { name: "Hacking", value: 6, note: "LOG" },
    { name: "Computer", value: 5, note: "LOG" },
    { name: "Wahrnehmung", value: 4, note: "INT" },
    { name: "Schleichen", value: 5, note: "GES" },
    { name: "Gebräuche", value: 4, note: "CHA" },
    { name: "Verhandlung", value: 3, note: "CHA" },
  ],
  weapons: {
    melee: [
      { name: "Monoschwert Ares Classic", attack: "14", damage: "8K (AP -3)", critical: "Scharf", note: "Inklusive Geschicklichkeit + Klingenwaffen" },
    ],
    ranged: [
      { name: "Ares Predator V", attack: "13", damage: "8K (AP -1)", critical: "Präzise", note: "15 Schuss, Smartlink integriert (+2 Pool)" },
      { name: "Ares Alpha Sturmgewehr", attack: "12", damage: "11K (AP -2)", critical: "Sperrfeuer", note: "42 Schuss, Fernrohr & Rückstoßdämpfer" }
    ],
  },
  combos: [
    {
      id: "1",
      title: "Präzisionsschuss",
      description: "Zielt geschickt auf eine Schwachstelle oder Schwachpunkt in der gegnerischen Rüstung.",
      weapons: [
        { name: "Ares Predator V", roll: "13 Pool (d6)", damage: "8K (AP -3)", notes: ["Verringert die gegnerische Panzerung erheblich", "Benötigt Freie Aktion"] },
      ]
    },
    {
      id: "2",
      title: "Matrix Hacking Angriff (Brute Force)",
      description: "Erzwinge Zugriff auf ein feindliches Host-System oder Gerät in der Umgebung.",
      table: {
        headers: ["Aktion", "Zielwert (Pool)", "Verteidigung des Ziels", "Auswirkung bei Erfolg"],
        rows: [
          ["Zugriff erlangen", "12 Würfel (LOG + Hacking)", "Willenskraft + Firewall", "Schnittstelle freischalten (Marke platziert)"],
          ["System abstürzen lassen", "12 Würfel (LOG + Hacking)", "Intuition + Firewall", "Datenspur löschen, Gerät rebooten"]
        ]
      },
      notes: ["Erzeugt heißen+kalten Sim-Faktor", "Erhöht den Overwatch-Wert um +2 d6 pro Runde"]
    }
  ],
  abilities: [
    { name: "Smartlink (Okular)", type: "item", effect: "Okulares HUD, das direkt mit Smartlink-Waffen kommuniziert. Gibt +2 Würfelpool-Bonus auf Schussbeprobungen." },
    { name: "Muskelstraffung II", type: "item", effect: "Permanenter Bioware-Umbau an Muskelsträngen. Erhöht Geschicklichkeit um +2 (bereits in Werten eingerechnet)." },
    { name: "Reaktionsverbesserung I", type: "item", effect: "Schaltkreis-Boost für periphere Nervenbahnen. Erhöht Reaktion um +1 (bereits eingerechnet)." },
    { name: "Erika MCD-1 (Cyberdeck)", type: "item", effect: "Ein solides Deck für Decksoldaten. Attribut-Matrix: Angriff 4, Schleicher 3, Datenverarbeitung 2, Firewall 1." },
    { name: "Analytischer Geist", type: "talent", effect: "Unfassbare Gabe zur logischen Problemlösung. Gibt permanent +2 Würfel auf alle theoretischen und technischen Wissensbeprobungen." },
  ],
  party: [
    { name: "Apex", class: "Technomancer", race: "Zwerg" },
    { name: "Bull", class: "Straßen-Doc", race: "Ork" },
  ],
  inventory: [
    {
      id: "ghost-w-monoschwert",
      name: "Monoschwert Ares Classic",
      category: "weapon",
      weaponType: "melee",
      damage: "8K",
      ap: "-3",
      attackPool: "14",
      status: "equipped",
      location: "Unterkunft",
      quantity: 1,
      notes: "Inklusive Geschicklichkeit + Klingenwaffen"
    },
    {
      id: "ghost-w-predator",
      name: "Ares Predator V",
      category: "weapon",
      weaponType: "ranged",
      damage: "8K",
      accuracy: 5,
      ap: "-1",
      mode: "HM",
      ammo: "15 Schuss",
      attackPool: "13",
      status: "equipped",
      location: "Unterkunft",
      quantity: 1,
      notes: "Smartlink integriert (+2 Pool)"
    },
    {
      id: "ghost-w-alpha",
      name: "Ares Alpha Sturmgewehr",
      category: "weapon",
      weaponType: "ranged",
      damage: "11K",
      accuracy: 5,
      ap: "-2",
      mode: "HM/SF/AM",
      rc: 2,
      ammo: "42 Schuss",
      attackPool: "12",
      status: "equipped",
      location: "Unterkunft",
      quantity: 1,
      notes: "Fernrohr & Rückstoßdämpfer"
    },
    {
      id: "ghost-a-panzerjacke",
      name: "Panzerjacke",
      category: "armor",
      armorValue: 13,
      status: "equipped",
      location: "Unterkunft",
      quantity: 1,
      notes: "Standard-Panzerjacke mit Isolierung 4"
    },
    {
      id: "ghost-g-commlink",
      name: "Transys Avalon Commlink",
      category: "electronics",
      rating: 6,
      status: "equipped",
      location: "Unterkunft",
      quantity: 1,
      notes: "Gerätestufe 6 mit Subvokal-Mikrofon"
    },
    {
      id: "ghost-g-medkit",
      name: "Erste-Hilfe-Kasten (Medkit Stufe 4)",
      category: "consumable",
      rating: 4,
      status: "equipped",
      location: "Unterkunft",
      quantity: 1,
      notes: "Trauma-Set für den Außeneinsatz"
    },
    {
      id: "ghost-s-apds",
      name: "Ersatzmunition APDS (50 Schuss)",
      category: "ammo",
      damage: "+0",
      ap: "-4",
      ammo: "50 Schuss",
      status: "stored",
      location: "Unterkunft",
      quantity: 2,
      notes: "Panzerbrechende Munition im Waffenschrank der Unterkunft deponiert"
    },
    {
      id: "ghost-s-climbing",
      name: "Taktische Kletterausrüstung",
      category: "gear",
      status: "stored",
      location: "Unterkunft",
      quantity: 1,
      notes: "50m Seil & Mikrowinde im Safehouse-Lager"
    }
  ],
  currency: {
    amount: 18500,
    unit: "¥",
    lifestyle: "Mittelstand",
    lifestyleCost: 5000,
    history: [
      { id: "1", timestamp: "14:20", description: "Vorauszahlung Johnson-Auftrag", amount: 18500, type: "income", balanceAfter: 18500 }
    ]
  },
  bodyMods: [
    {
      id: "mod-datajack",
      name: "Datenbuchse (Datajack)",
      category: "cyberware",
      grade: "standard",
      essenceCost: 0.1,
      rating: 1,
      description: "Direkte neuronale Schnittstelle (DNI). Ermöglicht kabelgebundene Matrix-Verbindung, SimSinn-Eingang und Schutz vor Störsendern."
    },
    {
      id: "mod-chipjack",
      name: "Chipbuchse (Chipjack)",
      category: "cyberware",
      grade: "alphaware",
      essenceCost: 0.16,
      rating: 3,
      description: "Schädel-Schnittstelle zur direkten Aufnahme von Soft-Chips (Sprach-, Wissens- und Fertigkeits-Chips).",
      isChipjack: true,
      chips: [
        {
          id: "chip-portuguese",
          name: "Sprachen-Chip: Portugiesisch",
          type: "lingwasoft",
          rating: 3,
          isActive: true,
          notes: "Ermöglicht fließendes Verstehen und Sprechen von Portugiesisch (Stufe 3). Akzentfrei bei Standard-Dialekten."
        },
        {
          id: "chip-underworld",
          name: "Wissenssoft: Neo-Tokyo Unterwelt",
          type: "knowsoft",
          rating: 4,
          isActive: false,
          notes: "Umfassende Kenntnisse über Yakuza-Gangs, Schmuggelrouten und Straßencodes in Neo-Tokyo."
        },
        {
          id: "chip-firstaid",
          name: "Aktsoft: Erste Hilfe & Trauma",
          type: "actsoft",
          rating: 2,
          isActive: false,
          notes: "Automatische Ausführung von Notfallmedizin und Wundversorgung im Feld."
        },
        {
          id: "chip-data-paydata",
          name: "Datachip: Ares Verschlüsselungscodes",
          type: "datachip",
          rating: 1,
          isActive: false,
          notes: "Extrahiertes Paydata aus dem letzten Matrix-Lauf. Hochgradig gesichert."
        }
      ]
    },
    {
      id: "mod-smartlink",
      name: "Smartlink (Okular)",
      category: "cyberware",
      grade: "alphaware",
      essenceCost: 0.16,
      rating: 1,
      description: "Okulares HUD, das direkt mit Smartlink-Waffen kommuniziert. Gibt +2 Würfelpool-Bonus auf Schussbeprobungen."
    },
    {
      id: "mod-muscles",
      name: "Muskelstraffung II",
      category: "bioware",
      grade: "standard",
      essenceCost: 0.4,
      rating: 2,
      description: "Permanenter Bioware-Umbau an Muskelsträngen. Erhöht Geschicklichkeit um +2."
    },
    {
      id: "mod-reaction",
      name: "Reaktionsverbesserung I",
      category: "cyberware",
      grade: "standard",
      essenceCost: 0.3,
      rating: 1,
      description: "Schaltkreis-Boost für periphere Nervenbahnen. Erhöht Reaktion um +1."
    }
  ],
  cyberdeck: {
    name: "Erika MCD-1 Custom",
    manufacturer: "Erika",
    deviceRating: 2,
    attributeArray: [4, 3, 2, 1],
    configuration: {
      attack: 3,
      sleaze: 4,
      dataProcessing: 2,
      firewall: 1
    },
    matrixCondition: {
      max: 9,
      damage: 0
    },
    programs: [
      {
        id: "prog-exploit",
        name: "Ausnutzen (Exploit)",
        type: "hacking",
        isActive: true,
        description: "Gibt +2 Würfelpool für Hacking-Proben gegen Geräte, Hosts und Marken.",
        modifiers: {
          dicePoolMod: 2,
          applicableSkills: ["Hacking"],
          notes: "+2 Würfelpool auf Hacking"
        }
      },
      {
        id: "prog-stealth",
        name: "Tarnung (Stealth)",
        type: "hacking",
        isActive: true,
        description: "Erhöht das Schleicher-Attribut des Decks um +1 und gibt +1 Würfelpool auf Schleicher-Handlungen.",
        modifiers: {
          attributeBoost: { attribute: "sleaze", value: 1 },
          dicePoolMod: 1,
          applicableSkills: ["Hacking", "Schleichen"],
          notes: "+1 Schleicher & +1 Würfelpool"
        }
      },
      {
        id: "prog-armor",
        name: "Panzerung (Armor)",
        type: "hacking",
        isActive: false,
        description: "Gibt +2 Würfel auf Schadenswiderstand gegen Matrixschaden.",
        modifiers: {
          matrixDamageResistance: 2,
          notes: "+2 Matrix-Schadenswiderstand"
        }
      },
      {
        id: "prog-hammer",
        name: "Hammer",
        type: "hacking",
        isActive: false,
        description: "Erhöht den angerichteten Matrixschaden bei Cyberkampf-Angriffen um +2.",
        modifiers: {
          damageBonus: 2,
          applicableSkills: ["Cyberkampf"],
          notes: "+2 Matrixschaden bei Cyberkampf"
        }
      },
      {
        id: "prog-browse",
        name: "Schmöker (Browse)",
        type: "standard",
        isActive: false,
        description: "Gibt +2 Würfelpool auf Matrixsuche (Computer) und halbiert Suchzeit.",
        modifiers: {
          dicePoolMod: 2,
          applicableSkills: ["Computer"],
          notes: "+2 Würfelpool auf Matrixsuche"
        }
      },
      {
        id: "prog-encryption",
        name: "Verschlüsselung (Encryption)",
        type: "standard",
        isActive: false,
        description: "Erhöht das Firewall-Attribut des Cyberdecks permanent um +1.",
        modifiers: {
          attributeBoost: { attribute: "firewall", value: 1 },
          notes: "+1 Firewall"
        }
      },
      {
        id: "prog-vm",
        name: "Virtuelle Maschine",
        type: "standard",
        isActive: false,
        description: "Schafft zwei zusätzliche Programmplätze (+2 Slots).",
        modifiers: {
          extraProgramSlots: 2,
          notes: "+2 Programmplätze"
        }
      }
    ],
    mode: "hot-vr"
  }
};

export const RODERICK_DATA: CharacterData = {
  system: 'traveller',
  name: "Roderick Vance",
  subTitle: "Ex-Scout (Survey) • 4 Dienstzeiten • Alter 34",
  stats: [
    { label: "Ausdauer (END)", value: 8 },
    { label: "Stärke (STR)", value: 7 },
    { label: "Geschick (DEX)", value: 9 },
    { label: "Panzerung", value: "8" },
    { label: "Strahlenschutz", value: "45 RAD" },
    { label: "Schiff", value: "Scout Typ S" },
  ],
  characteristics: [
    { label: "STR", value: 7 },
    { label: "DEX", value: 9 },
    { label: "END", value: 8 },
    { label: "INT", value: 10 },
    { label: "EDU", value: 9 },
    { label: "SOC", value: 6 },
  ],
  skills: [
    { name: "Pilot (Raumschiff)", value: 2, note: "DEX" },
    { name: "Astrogation", value: 2, note: "EDU" },
    { name: "Schusswaffen (Energie)", value: 2, note: "DEX" },
    { name: "Schusswaffen (Pistolen)", value: 1, note: "DEX" },
    { name: "Elektronik (Sensoren)", value: 2, note: "INT" },
    { name: "Mechanik", value: 1, note: "EDU" },
    { name: "Technik (Antrieb)", value: 1, note: "EDU" },
    { name: "Schwerelosigkeit (Zero-G)", value: 1, note: "DEX" },
    { name: "Überleben", value: 1, note: "END" },
    { name: "Nahkampf (Klinge)", value: 1, note: "STR" },
    { name: "Straßenwissen", value: 1, note: "SOC" },
    { name: "Diplomatie & Verhandeln", value: 1, note: "SOC" },
    { name: "Medizin", value: 0, note: "EDU" },
  ],
  weapons: {
    melee: [
      { name: "Schock-Schlagstock (TL9)", attack: "+2", damage: "2D6+3 Betäubung", critical: "Lähmung", note: "Nahkampf • AP 2 • 20 Ladungen", range: "Nahkampf" },
      { name: "Monofilament-Klinge (TL12)", attack: "+2", damage: "1D6+3 (AP 4)", critical: "Schnitt", note: "Durchdringt schwere Panzerung", range: "Nahkampf" }
    ],
    ranged: [
      { name: "Laserkarabiner (TL11)", attack: "+3", damage: "4D6", critical: "Verbrennung", note: "Reichweite 300m • Rückstoßfrei (Zero-G) • 50 Schuss Powerpack", range: "300m" },
      { name: "Gauss-Pistole (TL13)", attack: "+2", damage: "3D6-3 (AP 4)", critical: "Präzision", note: "Reichweite 20m • 40 Schuss Magazin • Auto 2", range: "20m" },
      { name: "Schrotflinte (TL6)", attack: "+2", damage: "4D6 (Nah) / 2D6 (Fern)", critical: "Wucht", note: "Reichweite 25m • Streuschuss • 6 Schuss", range: "25m" }
    ],
  },
  combos: [
    {
      id: "1",
      title: "Notfall-Ausweichmanöver (Schiffskampf)",
      description: "Reaktions-Ausweichflug im Typ-S Scout gegen feindliches Waffenfeuer. Pilot (Raumschiff) + DEX Wurf gegen Standard SG 8+.",
      weapons: [
        { name: "Pilot (Raumschiff) + DEX", roll: "2D6+3 (Stufe 2 + DM +1)", damage: "Effekt reduziert Treffer-Schaden", notes: ["Erfolgswert zieht direkten Schaden von Schiffshülle ab", "Erfordert Antriebskraft"] },
      ]
    },
    {
      id: "2",
      title: "Feuerstoß-Salve (Auto 2)",
      description: "Gauss-Pistole Salvenfeuer. Feuert 3 Schuss in schneller Folge auf ein Einzelziel.",
      table: {
        headers: ["Feuermodus", "Wurf (2D6)", "Munitionsverbrauch", "Auswirkung"],
        rows: [
          ["Einzelschuss", "2D6 + 2 (DEX + Skill)", "1 Schuss", "3D6-3 (AP 4)"],
          ["Feuerstoß (Auto 2)", "2D6 + 4 (+2 DM Treffer)", "3 Schuss", "3D6-3 (AP 4) + höhere Trefferchance"],
          ["Schadens-Salve", "2D6 + 2", "3 Schuss", "3D6-3 + 2 Extra-Schaden"]
        ]
      },
      notes: ["Panzerbrechend AP 4 ignoriert 4 Rüstungspunkte", "Magazin: 40 Schuss"]
    },
    {
      id: "3",
      title: "Hyperraum-Sprungberechnung",
      description: "Astrogatorische Koordinatenberechnung für 1 Parsec Hyperraumsprung durch das Sprungtor.",
      weapons: [
        { name: "Astrogation + EDU", roll: "2D6+3 (Stufe 2 + DM +1)", damage: "Sprungpräzision", notes: ["SG 8+ Durchschnitt (Dauer: 15-60 Minuten)", "Fehlschlag erzeugt Fehlsprung (Misjump-Risiko)"] }
      ],
      notes: ["Erfordert funktionstüchtigen Bordcomputer und Sprungantrieb"]
    }
  ],
  abilities: [
    { name: "Typ S Scout/Courier Schiffsbriefe", type: "item", effect: "Besitz von 2 Schiff-Anteilen am Scout-Schiff 'Seeker IV'. Berechtigt zur kostenlosen Nutzung imperialer Scout-Basen, Wartungshangars und Treibstoff-Raffinerien." },
    { name: "TL 10 Kevlar-Mesh Panzeranzug", type: "item", effect: "Panzerung 8 gegen physische und ballistische Angriffe. Integriertes Comms-HUD mit Sensorüberlagerung und Biosensoren." },
    { name: "Grav-Gürtel TL 12", type: "item", effect: "Ermöglicht freies Schweben und präzise Manövrierung in Schwerelosigkeit (Zero-G) sowie sicheres Abfedern bei Stürzen bis zu 1.5 G." },
    { name: "Scout-Veteranen-Instinkt", type: "trait", effect: "Ehemaliger Scout des IISS (Imperial Interstellar Scout Service). Erhält permanent +1 DM auf alle Überlebens-, Orientierungs- und Sensorproben auf unkartierten Welten." },
    { name: "Muster-Out Pensionsanspruch", type: "trait", effect: "Gesicherter Sold und Ruhestandssold des Imperialen Dienstes. Monatlicher Auszahlungsanspruch über das Galaktische Banknetzwerk." },
  ],
  party: [
    { name: "Dr. Aris Thorne", occupation: "Schiffsarzt / Scholar", race: "Mensch (Solomani)" },
    { name: "Mira Novak", occupation: "Bordingenieurin / Ex-Marine", race: "Mensch (Imperial)" },
    { name: "Kaelen Voss", occupation: "Handelsagent / Astrogator", race: "Vargr" },
  ],
  currency: {
    amount: 34500,
    unit: "Cr",
    lifestyle: "Mittelstand (Middle Passage)",
    lifestyleCost: 1000,
    history: [
      { id: "1", timestamp: "08:30", description: "Scout-Dienst Abfindung & Sold", amount: 34500, type: "income", balanceAfter: 34500 }
    ]
  }
};
