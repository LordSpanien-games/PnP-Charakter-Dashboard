export interface SRSkillDef {
  name: string;
  attr: string;
  group: string;
  category: 'active' | 'knowledge';
}

export const SHADOWRUN_SKILLS: SRSkillDef[] = [
  // Feuerwaffen
  { name: "Pistolen",           attr: "GES", group: "Feuerwaffen",  category: "active" },
  { name: "Gewehre",            attr: "GES", group: "Feuerwaffen",  category: "active" },
  { name: "Sturmgewehre",       attr: "GES", group: "Feuerwaffen",  category: "active" },
  { name: "Schrotflinten",      attr: "GES", group: "Feuerwaffen",  category: "active" },
  { name: "Schwere Waffen",     attr: "GES", group: "Feuerwaffen",  category: "active" },
  // Nahkampf
  { name: "Waffenloser Kampf",  attr: "STR", group: "Nahkampf",     category: "active" },
  { name: "Klingenwaffen",      attr: "GES", group: "Nahkampf",     category: "active" },
  { name: "Knüppelwaffen",     attr: "STR", group: "Nahkampf",     category: "active" },
  { name: "Kampfsport",         attr: "STR", group: "Nahkampf",     category: "active" },
  { name: "Werfen",             attr: "STR", group: "Nahkampf",     category: "active" },
  // Körperlich
  { name: "Ausweichen",         attr: "REA", group: "Körperlich",   category: "active" },
  { name: "Athletik",           attr: "STR", group: "Körperlich",   category: "active" },
  { name: "Schwimmen",          attr: "STR", group: "Körperlich",   category: "active" },
  { name: "Klettern",           attr: "STR", group: "Körperlich",   category: "active" },
  { name: "Springen",           attr: "STR", group: "Körperlich",   category: "active" },
  // Täuschung
  { name: "Heimlichkeit",       attr: "GES", group: "Täuschung",    category: "active" },
  { name: "Tarnung",            attr: "INT", group: "Täuschung",    category: "active" },
  { name: "Verkleiden",         attr: "INT", group: "Täuschung",    category: "active" },
  { name: "Con",                attr: "CHA", group: "Täuschung",    category: "active" },
  // Soziales
  { name: "Überreden",          attr: "CHA", group: "Soziales",     category: "active" },
  { name: "Verhandeln",         attr: "CHA", group: "Soziales",     category: "active" },
  { name: "Einschüchtern",     attr: "CHA", group: "Soziales",     category: "active" },
  { name: "Etikette",           attr: "CHA", group: "Soziales",     category: "active" },
  { name: "Führung",            attr: "CHA", group: "Soziales",     category: "active" },
  // Technik
  { name: "Computersysteme",    attr: "LOG", group: "Technik",      category: "active" },
  { name: "Hacking",            attr: "LOG", group: "Technik",      category: "active" },
  { name: "Elektronik",         attr: "LOG", group: "Technik",      category: "active" },
  { name: "Knacken",            attr: "LOG", group: "Technik",      category: "active" },
  { name: "Schlösser knacken", attr: "GES", group: "Technik",      category: "active" },
  { name: "Mechaniker",         attr: "LOG", group: "Technik",      category: "active" },
  { name: "Sprengstoffe",       attr: "LOG", group: "Technik",      category: "active" },
  { name: "Navigation",         attr: "INT", group: "Technik",      category: "active" },
  { name: "Fahrzeuge",          attr: "REA", group: "Technik",      category: "active" },
  // Medizin
  { name: "Erste Hilfe",        attr: "LOG", group: "Medizin",      category: "active" },
  { name: "Medizin",            attr: "LOG", group: "Medizin",      category: "active" },
  { name: "Biotech",            attr: "LOG", group: "Medizin",      category: "active" },
  // Magie
  { name: "Magie",              attr: "MAG", group: "Magie",        category: "active" },
  { name: "Bannen",             attr: "MAG", group: "Magie",        category: "active" },
  { name: "Beschwören",        attr: "MAG", group: "Magie",        category: "active" },
  // Resonanz
  { name: "Resonanz",           attr: "RES", group: "Resonanz",     category: "active" },
  { name: "Kompilieren",        attr: "RES", group: "Resonanz",     category: "active" },
  { name: "Registrieren",       attr: "RES", group: "Resonanz",     category: "active" },
  // Wahrnehmung
  { name: "Wahrnehmung",        attr: "INT", group: "Wahrnehmung",  category: "active" },
  // Wissen (Defaults)
  { name: "Straßenwissen",      attr: "INT", group: "Wissen",       category: "knowledge" },
  { name: "Konzerne",           attr: "INT", group: "Wissen",       category: "knowledge" },
  { name: "Unterwelt",          attr: "INT", group: "Wissen",       category: "knowledge" },
  { name: "Stadtgeographie",    attr: "INT", group: "Wissen",       category: "knowledge" },
  { name: "Matrixsicherheit",   attr: "INT", group: "Wissen",       category: "knowledge" },
];
