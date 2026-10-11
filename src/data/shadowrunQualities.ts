import { Ability } from "../types";

export interface ShadowrunQualityPreset {
  id: string;
  name: string;
  type: 'quality' | 'flaw' | 'adept_power' | 'spell' | 'trait';
  category: 'Vorteil' | 'Nachteil' | 'Ki-Kraft' | 'Zauber' | 'Resonanz' | 'Metatyp';
  karmaCost?: number; // Positive for Vorteile (costs Karma), Negative for Nachteile (gives Karma)
  powerPoints?: number; // For Ki-Adept powers (e.g. 0.5, 1.0)
  drain?: string; // For spells/complex forms (e.g. "F - 3")
  usage?: string;
  effect: string;
  source?: string;
}

export const SHADOWRUN_PRESETS: ShadowrunQualityPreset[] = [
  // ==================== VORTEILE (POSITIVE QUALITIES) ====================
  {
    id: "sr-q-analytischer-geist",
    name: "Analytischer Geist",
    type: "quality",
    category: "Vorteil",
    karmaCost: 5,
    usage: "Permanent",
    effect: "Unfassbare Gabe zur logischen Problemlösung. Gibt permanent +2 Würfel auf alle theoretischen und technischen Wissensbeprobungen sowie Rätsel und Entschlüsselung.",
    source: "SR5 Grundregelwerk"
  },
  {
    id: "sr-q-schnellzieher",
    name: "Schnellzieher",
    type: "quality",
    category: "Vorteil",
    karmaCost: 4,
    usage: "Freie Aktion",
    effect: "Das Bereitmachen einer beliebigen Handfeuerwaffe, Wurfwaffe oder Nahkampfwaffe erfordert nur eine Freie Aktion statt einer Einfachen Handlung.",
    source: "SR5 Grundregelwerk"
  },
  {
    id: "sr-q-beidhaendigkeit",
    name: "Beidhändigkeit",
    type: "quality",
    category: "Vorteil",
    karmaCost: 4,
    usage: "Permanent",
    effect: "Der Runner kann beide Hände gleich geschickt nutzen. Der übliche Malus von -2 Würfeln für Handlungen mit der Nebenhand entfällt komplett.",
    source: "SR5 Grundregelwerk"
  },
  {
    id: "sr-q-zaehigkeit",
    name: "Zähigkeit",
    type: "quality",
    category: "Vorteil",
    karmaCost: 9,
    usage: "Permanent",
    effect: "Ein außergewöhnlich widerstandsfähiger Körper. Gewährt permanent +1 zusätzliches Kästchen auf dem körperlichen Schadensmonitor.",
    source: "SR5 Grundregelwerk"
  },
  {
    id: "sr-q-hohe-schmerztoleranz",
    name: "Hohe Schmerztoleranz",
    type: "quality",
    category: "Vorteil",
    karmaCost: 7,
    usage: "Permanent",
    effect: "Der Charakter ignoriert bis zu 2 Punkte an Verwundungsabzügen durch physischen und geistigen Schaden.",
    source: "SR5 Grundregelwerk"
  },
  {
    id: "sr-q-blitzreflexe",
    name: "Blitzreflexe",
    type: "quality",
    category: "Vorteil",
    karmaCost: 5,
    usage: "Initiative",
    effect: "Ungewöhnlich rasche Nervenimpulse. Verleiht +1W6 auf den Initiative-Würfelpool und +1 auf Überraschungsproben.",
    source: "SR5 Grundregelwerk"
  },
  {
    id: "sr-q-astrale-wahrnehmung",
    name: "Astrale Wahrnehmung",
    type: "quality",
    category: "Vorteil",
    karmaCost: 10,
    usage: "Einfache Handlung",
    effect: "Ermöglicht einem erwachten Charakter (Magie > 0), den Astralraum wahrzunehmen und Auren sowie emotionale Signaturen zu lesen.",
    source: "SR5 Grundregelwerk"
  },
  {
    id: "sr-q-glueckspilz",
    name: "Glückspilz",
    type: "quality",
    category: "Vorteil",
    karmaCost: 12,
    usage: "Permanent",
    effect: "Erhöht das Edge-Attribut-Maximum um +1 (z. B. auf 7 für Menschen oder 8 für Elfen).",
    source: "SR5 Grundregelwerk"
  },
  {
    id: "sr-q-guter-ruf",
    name: "Guter Ruf",
    type: "quality",
    category: "Vorteil",
    karmaCost: 4,
    usage: "Sozial",
    effect: "In der Schattenszene bekannt für Professionalität und Verlässlichkeit. Gewährt +2 Würfel auf soziale Verhandlungsproben mit Schiebern und Connections.",
    source: "SR5 Grundregelwerk"
  },
  {
    id: "sr-q-soziales-chamaeleon",
    name: "Soziales Chamäleon",
    type: "quality",
    category: "Vorteil",
    karmaCost: 5,
    usage: "Sozial",
    effect: "Passt sich mühelos jedem Milieu an — von High-Society bis Sprawlgangs. Gibt +2 Würfel auf Gebräuche- und Verkleidenproben.",
    source: "SR5 Grundregelwerk"
  },
  {
    id: "sr-q-bewegungstalent",
    name: "Bewegungstalent",
    type: "quality",
    category: "Vorteil",
    karmaCost: 5,
    usage: "Körperlich",
    effect: "Natürliche Körperbeherrschung. Verleiht +2 Würfel auf alle Proben für Laufen, Akrobatik, Klettern und Schwimmen.",
    source: "SR5 Grundregelwerk"
  },
  {
    id: "sr-q-programmiergenie",
    name: "Programmiergenie",
    type: "quality",
    category: "Vorteil",
    karmaCost: 6,
    usage: "Matrix",
    effect: "Erhält +2 Würfel auf Eiliges Hacken und Softwareproben zur schnellen Code-Modifikation unter Feindfeuer.",
    source: "SR5 Datenpfade"
  },
  {
    id: "sr-q-mentorgeist",
    name: "Mentorgeist (Totem)",
    type: "quality",
    category: "Vorteil",
    karmaCost: 5,
    usage: "Magie",
    effect: "Verbindung zu einem Schutzpatron (Wolf, Rabe, Katze, etc.). Verleiht Boni auf bestimmte Zauberarten oder Geisterbeschwörungen.",
    source: "SR5 Strassengrimoire"
  },
  {
    id: "sr-q-willensstaerke",
    name: "Willensstärke",
    type: "quality",
    category: "Vorteil",
    karmaCost: 6,
    usage: "Permanent",
    effect: "Stählerner Geist gegen Manipulation. Gibt +2 Würfel gegen Beherrschungszauber, Verhöre und mentale Beeinflussung.",
    source: "SR5 Grundregelwerk"
  },

  // ==================== NACHTEILE (NEGATIVE QUALITIES) ====================
  {
    id: "sr-f-allergie-leicht",
    name: "Allergie (Leicht / Gewöhnlich)",
    type: "flaw",
    category: "Nachteil",
    karmaCost: -5,
    usage: "Bei Kontakt",
    effect: "Reaktion auf weitverbreitete Stoffe (Pollen, Laktose, Haustiere). Verursacht -2 Würfel auf alle Proben bei Exposition.",
    source: "SR5 Grundregelwerk"
  },
  {
    id: "sr-f-allergie-schwer",
    name: "Allergie (Schwer / Ungewöhnlich)",
    type: "flaw",
    category: "Nachteil",
    karmaCost: -10,
    usage: "Bei Kontakt",
    effect: "Schwere Überempfindlichkeit gegen bestimmte Stoffe (z. B. Silber, Sonnenlicht, Gold). Erleidet 1 Kasten Betäubungsschaden pro Minute Kontakt.",
    source: "SR5 Grundregelwerk"
  },
  {
    id: "sr-f-schlechter-ruf",
    name: "Schlechter Ruf",
    type: "flaw",
    category: "Nachteil",
    karmaCost: -4,
    usage: "Sozial",
    effect: "Ein berüchtigter Name eilt dem Runner voraus. Zieht einen Malus von -2 Würfeln auf Gebräuche- und Schieberproben nach sich.",
    source: "SR5 Grundregelwerk"
  },
  {
    id: "sr-f-abhaengigkeit-leicht",
    name: "Abhängigkeit (Leicht - BTL/Stimulanzien)",
    type: "flaw",
    category: "Nachteil",
    karmaCost: -4,
    usage: "Regelmäßig",
    effect: "Gewohnheitsmäßiger Konsum von BTL-Chips, Jazz oder Cram. Ohne regelmäßige Dosis drohen Entzugserscheinungen (-2 Würfelpool).",
    source: "SR5 Grundregelwerk"
  },
  {
    id: "sr-f-abhaengigkeit-schwer",
    name: "Abhängigkeit (Schwer - Novacoke/Kamikaze)",
    type: "flaw",
    category: "Nachteil",
    karmaCost: -9,
    usage: "Täglich",
    effect: "Starke physische und psychische Sucht nach harten Substanzen. Schwerer Entzug erzeugt körperlichen Schaden und Halluzinationen.",
    source: "SR5 Grundregelwerk"
  },
  {
    id: "sr-f-gesucht-feind",
    name: "Feind / Gesucht (Konzernsicherheit)",
    type: "flaw",
    category: "Nachteil",
    karmaCost: -7,
    usage: "Hintergrund",
    effect: "Ein Megakonzern (z. B. Renraku oder Ares) hat ein Kopfgeld ausgesetzt oder sucht den Runner aktiv in den Straßen von Seattle.",
    source: "SR5 Grundregelwerk"
  },
  {
    id: "sr-f-pechvogel",
    name: "Pechvogel",
    type: "flaw",
    category: "Nachteil",
    karmaCost: -9,
    usage: "Bei Proben",
    effect: "Kritische Patzer treten bereits auf, wenn mehr als ein Drittel (statt der Hälfte) der Würfel eine 1 anzeigen.",
    source: "SR5 Grundregelwerk"
  },
  {
    id: "sr-f-ehrenkodex",
    name: "Ehrenkodex (Bushido / Straßenethik)",
    type: "flaw",
    category: "Nachteil",
    karmaCost: -6,
    usage: "Permanent",
    effect: "Der Runner weigert sich strikt, unbewaffnete Zivilisten zu töten oder Schatten-Kollegen im Stich zu lassen. Bei Verstoß droht Edge-Verlust.",
    source: "SR5 Grundregelwerk"
  },
  {
    id: "sr-f-glaskiefer",
    name: "Glaskiefer",
    type: "flaw",
    category: "Nachteil",
    karmaCost: -7,
    usage: "Permanent",
    effect: "Besonders empfindlich gegenüber Betäubungsschlägen und Schockern. -1 Kästchen auf dem geistigen Schadensmonitor.",
    source: "SR5 Grundregelwerk"
  },
  {
    id: "sr-f-schlaflosigkeit",
    name: "Schlaflosigkeit",
    type: "flaw",
    category: "Nachteil",
    karmaCost: -5,
    usage: "Erholung",
    effect: "Chronische Schlafstörungen durch Cyberware-Störströme oder Trauma. Geistiger Schaden regeneriert nur mit halber Geschwindigkeit.",
    source: "SR5 Grundregelwerk"
  },
  {
    id: "sr-f-verpflichtung",
    name: "Verpflichtung (Familie / Gang)",
    type: "flaw",
    category: "Nachteil",
    karmaCost: -5,
    usage: "Monatlich",
    effect: "Finanzielle oder personelle Verpflichtung gegenüber Angehörigen oder einer Sprawl-Fraktion (kostet 10% mehr Nuyen pro Lebensstil).",
    source: "SR5 Schattenläufer"
  },

  // ==================== KI-KRÄFTE (ADEPT POWERS) ====================
  {
    id: "sr-p-gesteigerte-reflexe",
    name: "Gesteigerte Reflexe (Ki-Adept)",
    type: "adept_power",
    category: "Ki-Kraft",
    powerPoints: 1.5,
    usage: "Permanent",
    effect: "Beschleunigt die synaptische Reaktion auf magische Weise. Verleiht +1 REA und +1W6 Initiativewürfel (Stufe 1).",
    source: "SR5 Strassengrimoire"
  },
  {
    id: "sr-p-kritischer-schlag",
    name: "Kritischer Schlag",
    type: "adept_power",
    category: "Ki-Kraft",
    powerPoints: 0.5,
    usage: "Nahkampf",
    effect: "Kanalisiert Ki-Energie in die Hände oder Klingen. Erhöht den Grundschaden im unbewaffneten Nahkampf um +1.",
    source: "SR5 Grundregelwerk"
  },
  {
    id: "sr-p-kampfsinn",
    name: "Kampfsinn",
    type: "adept_power",
    category: "Ki-Kraft",
    powerPoints: 0.5,
    usage: "Verteidigung",
    effect: "Sechster Sinn für herannahende Gefahren. Verleiht +1 zusätzlichen Würfel pro Stufe für Verteidigungsproben gegen Angriffe und Überraschung.",
    source: "SR5 Grundregelwerk"
  },
  {
    id: "sr-p-todeskralle",
    name: "Todeskralle",
    type: "adept_power",
    category: "Ki-Kraft",
    powerPoints: 0.5,
    usage: "Nahkampf",
    effect: "Macht bloße Hände und Tritte so tödlich wie Klingen. Unbewaffneter Nahkampfschaden wird wahlweise als körperlicher Schaden (K) zugefügt.",
    source: "SR5 Grundregelwerk"
  },
  {
    id: "sr-p-spurloser-tritt",
    name: "Spurloser Tritt",
    type: "adept_power",
    category: "Ki-Kraft",
    powerPoints: 0.25,
    usage: "Schleichen",
    effect: "Der Adept hinterlässt keinerlei Trittspuren auf Schlamm, Schnee oder Teppichen und bewegt sich völlig geräuschlos.",
    source: "SR5 Grundregelwerk"
  },
  {
    id: "sr-p-geschosswandler",
    name: "Geschosswandler (Parieren)",
    type: "adept_power",
    category: "Ki-Kraft",
    powerPoints: 0.5,
    usage: "Reaktion",
    effect: "Erlaubt dem Adepten, geworfene Waffen oder Projektile mit einer Reaktionsprobe abzufangen oder mit einer Nahkampfwaffe abzulenken.",
    source: "SR5 Grundregelwerk"
  },
  {
    id: "sr-p-schmerzresistenz",
    name: "Schmerzresistenz",
    type: "adept_power",
    category: "Ki-Kraft",
    powerPoints: 0.5,
    usage: "Permanent",
    effect: "Ignoriert 1 Stufe an Verwundungsabzügen pro Kraftstufe durch physische Disziplin.",
    source: "SR5 Grundregelwerk"
  },

  // ==================== ZAUBER & RESONANZ ====================
  {
    id: "sr-s-betaeubungsblitz",
    name: "Betäubungsblitz (Stunbolt)",
    type: "spell",
    category: "Zauber",
    drain: "F - 3",
    usage: "Komplexe Handlung",
    effect: "Direkter Kampfzauber, der das Nervensystem des Opfers direkt überlastet. Verursacht geistigen Betäubungsschaden (Widerstand nur durch Willenskraft).",
    source: "SR5 Grundregelwerk"
  },
  {
    id: "sr-s-manablitz",
    name: "Manablitz (Manabolt)",
    type: "spell",
    category: "Zauber",
    drain: "F - 3",
    usage: "Komplexe Handlung",
    effect: "Direkter Kampfzauber gegen die Lebensessenz. Verursacht tödlichen körperlichen Schaden (Widerstand nur durch Willenskraft, ignoriert Rüstung komplett).",
    source: "SR5 Grundregelwerk"
  },
  {
    id: "sr-s-heilung",
    name: "Heilung (Heal)",
    type: "spell",
    category: "Zauber",
    drain: "F - 4",
    usage: "Komplexe Handlung",
    effect: "Heilt körperlichen Schaden beim Ziel in Höhe der erzielten Nettoerfolge bei der Spruchzaubereiprobe.",
    source: "SR5 Grundregelwerk"
  },
  {
    id: "sr-s-unsichtbarkeit",
    name: "Verbesserte Unsichtbarkeit",
    type: "spell",
    category: "Zauber",
    drain: "F - 1",
    usage: "Aufrechterhalten",
    effect: "Macht das Ziel für menschliche Augen und elektronische Kamerasysteme gleichermaßen ungesehen.",
    source: "SR5 Grundregelwerk"
  },
  {
    id: "sr-s-puppenspieler",
    name: "Puppenspieler (Puppeteer)",
    type: "spell",
    category: "Resonanz",
    drain: "Stufe + 4",
    usage: "Komplexe Handlung",
    effect: "Komplexe Technomancer-Form: Zwingt ein beliebiges Matrix-Gerät oder IC dazu, eine bestimmte Handlung sofort auszuführen.",
    source: "SR5 Datenpfade"
  },
  {
    id: "sr-s-resonanzpfeil",
    name: "Resonanzpfeil (Resonance Spike)",
    type: "spell",
    category: "Resonanz",
    drain: "Stufe - 3",
    usage: "Komplexe Handlung",
    effect: "Komplexe Technomancer-Form: Schleudert reine Resonanz-Schockwellen gegen ein Ziel und verursacht direkten Matrixschaden.",
    source: "SR5 Grundregelwerk"
  },

  // ==================== METATYP-GABEN ====================
  {
    id: "sr-m-elf-nachtsicht",
    name: "Nachtsicht (Metatyp: Elf)",
    type: "trait",
    category: "Metatyp",
    usage: "Permanent",
    effect: "Ermöglicht klare Sicht bei minimalem Restlicht ohne Abzüge für Dunkelheit (außer bei absoluter Finsternis).",
    source: "SR5 Rassenmerkmale"
  },
  {
    id: "sr-m-zwerg-thermalsicht",
    name: "Thermalsicht & Konstitution (Zwerg)",
    type: "trait",
    category: "Metatyp",
    usage: "Permanent",
    effect: "Nimmt Wärmesignaturen von Lebewesen und Maschinen wahr. +2 Würfel auf Proben gegen Gifte und Krankheitserreger.",
    source: "SR5 Rassenmerkmale"
  },
  {
    id: "sr-m-troll-dermal",
    name: "Dermalpanzerung & Reichweite (Troll)",
    type: "trait",
    category: "Metatyp",
    usage: "Permanent",
    effect: "Natürliche Dermalpanzerung gewährt +1 Rüstungswert. Ausladende Gliedmaßen geben +1 Reichweitenbonus im Nahkampf.",
    source: "SR5 Rassenmerkmale"
  }
];
