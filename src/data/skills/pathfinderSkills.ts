export interface PFSkillDef {
  name: string;
  attr: 'ST' | 'GE' | 'KO' | 'IN' | 'WE' | 'CH';
  armorPenalty?: boolean;
  trainedOnly?: boolean;
  aliases?: string[];
}

export const PATHFINDER_SKILLS: PFSkillDef[] = [
  { name: "Akrobatik",                      attr: "GE", armorPenalty: true },
  { name: "Auftreten",                       attr: "CH", aliases: ["Auftreten (Gesang/Tanz)"] },
  { name: "Beruf",                           attr: "WE", trainedOnly: true, aliases: ["Beruf (Seemann/Kaufmann)"] },
  { name: "Bluffen",                         attr: "CH" },
  { name: "Diplomatie",                      attr: "CH" },
  { name: "Einschüchtern",                  attr: "CH" },
  { name: "Entfesslungskunst",              attr: "GE", armorPenalty: true },
  { name: "Fälschen",                       attr: "IN" },
  { name: "Fingerfertigkeit",               attr: "GE", armorPenalty: true, trainedOnly: true },
  { name: "Fliegen",                        attr: "GE", armorPenalty: true },
  { name: "Handwerk",                       attr: "IN", aliases: ["Handwerk (Alchemie/Waffen)"] },
  { name: "Heilkunde",                      attr: "WE" },
  { name: "Heimlichkeit",                  attr: "GE", armorPenalty: true },
  { name: "Klettern",                      attr: "ST", armorPenalty: true },
  { name: "Magischen Gegenstand benutzen", attr: "CH", trainedOnly: true },
  { name: "Mechanismus ausschalten",       attr: "GE", armorPenalty: true, trainedOnly: true },
  { name: "Mit Tieren umgehen",            attr: "CH", trainedOnly: true },
  { name: "Motiv erkennen",                attr: "WE" },
  { name: "Reiten",                        attr: "GE", armorPenalty: true },
  { name: "Schätzen",                      attr: "IN" },
  { name: "Schwimmen",                     attr: "ST", armorPenalty: true },
  { name: "Sprachenkunde",                attr: "IN", trainedOnly: true },
  { name: "Überleben",                    attr: "WE" },
  { name: "Verkleiden",                   attr: "CH" },
  { name: "Wahrnehmung",                 attr: "WE" },
  { name: "Wissen (Arkanes)",            attr: "IN", trainedOnly: true },
  { name: "Wissen (Dungeonkunde)",       attr: "IN", trainedOnly: true },
  { name: "Wissen (Geschichte)",         attr: "IN", trainedOnly: true },
  { name: "Wissen (Geografie)",          attr: "IN", trainedOnly: true },
  { name: "Wissen (Lokales)",            attr: "IN", trainedOnly: true },
  { name: "Wissen (Natur)",              attr: "IN", trainedOnly: true },
  { name: "Wissen (Religion)",           attr: "IN", trainedOnly: true },
  { name: "Wissen (Die Ebenen)",         attr: "IN", trainedOnly: true },
  { name: "Zauberkunde",                 attr: "IN", trainedOnly: true },
];
