import { GenericCharacter } from "./types";

export interface MarkdownExportOptions {
  attributeLabels?: Record<string, string>;
  systemLabel?: string;
}

const escapeYaml = (value: string): string => value.replace(/"/g, '\\"');

/**
 * Baut aus einem GenericCharacter eine Obsidian-kompatible Markdown-Notiz
 * mit YAML-Frontmatter. Funktioniert systemübergreifend, da nur auf den
 * generischen Feldern (attributes, resources, skills, inventory, party,
 * systemData) aufgebaut wird - keine Sonderlogik pro Spielsystem nötig.
 */
export const exportCharacterToMarkdown = (
  character: GenericCharacter,
  options: MarkdownExportOptions = {}
): string => {
  const lines: string[] = [];
  const { attributeLabels, systemLabel } = options;

  // --- YAML-Frontmatter ---
  lines.push("---");
  lines.push(`system: ${character.systemId}`);
  if (systemLabel) lines.push(`systemLabel: "${escapeYaml(systemLabel)}"`);
  lines.push(`name: "${escapeYaml(character.name)}"`);
  if (character.subTitle) lines.push(`subtitle: "${escapeYaml(character.subTitle)}"`);
  lines.push(`exportVersion: ${character.exportVersion}`);
  lines.push("tags: [charakter, " + character.systemId + "]");
  lines.push("---");
  lines.push("");

  // --- Titel ---
  lines.push(`# ${character.name}`);
  if (character.subTitle) lines.push(`*${character.subTitle}*`);
  lines.push("");

  // --- Attribute ---
  const attrKeys = Object.keys(character.attributes);
  if (attrKeys.length > 0) {
    lines.push("## Attribute");
    lines.push("");
    lines.push("| Attribut | Wert |");
    lines.push("|---|---|");
    attrKeys.forEach((key) => {
      const label = attributeLabels?.[key] || key;
      lines.push(`| ${label} | ${character.attributes[key]} |`);
    });
    lines.push("");
  }

  // --- Ressourcen ---
  const resourceKeys = Object.keys(character.resources);
  if (resourceKeys.length > 0) {
    lines.push("## Ressourcen");
    lines.push("");
    lines.push("| Ressource | Aktuell | Maximal |");
    lines.push("|---|---|---|");
    resourceKeys.forEach((key) => {
      const r = character.resources[key];
      lines.push(`| ${key} | ${r.current} | ${r.max ?? "-"} |`);
    });
    lines.push("");
  }

  // --- Fertigkeiten ---
  if (character.skills.length > 0) {
    lines.push("## Fertigkeiten");
    lines.push("");
    lines.push("| Fertigkeit | Wert | Notiz |");
    lines.push("|---|---|---|");
    character.skills.forEach((s) => {
      const checked = (s as any).checked ? " ✅" : "";
      lines.push(`| ${s.name}${checked} | ${s.value} | ${s.notes || ""} |`);
    });
    lines.push("");
  }

  // --- Talente & Fähigkeiten ---
  if (character.abilities.length > 0) {
    lines.push("## Talente & Fähigkeiten");
    lines.push("");
    const grouped: Record<string, typeof character.abilities> = {};
    character.abilities.forEach((a) => {
      const key = a.type || "Sonstiges";
      (grouped[key] = grouped[key] || []).push(a);
    });
    Object.entries(grouped).forEach(([type, abilities]) => {
      lines.push(`### ${type}`);
      abilities.forEach((a) => {
        const usage = a.usage ? ` *(${a.usage})*` : "";
        lines.push(`- **${a.name}**${usage}${a.effect ? ` — ${a.effect}` : ""}`);
      });
      lines.push("");
    });
  }

  // --- Inventar ---
  if (character.inventory.length > 0) {
    lines.push("## Inventar & Ausrüstung");
    lines.push("");
    character.inventory.forEach((item) => {
      const loc = item.location === "equipped" ? "Am Mann" : "Eingelagert";
      const qty = item.quantity !== undefined ? ` ×${item.quantity}` : "";
      lines.push(`### ${item.name}${qty}`);
      lines.push(`*${loc}*`);
      if (item.notes) {
        lines.push("");
        lines.push(item.notes);
      }
      if (item.sourceReference) {
        const ref = item.sourceReference;
        const parts = [ref.book, ref.page ? `S. ${ref.page}` : undefined].filter(Boolean).join(" ");
        if (parts) lines.push(`> Quelle: ${parts}`);
        if (ref.url) lines.push(`> [Online-Referenz](${ref.url})`);
      }
      lines.push("");
    });
  }

  // --- Gruppe ---
  if (character.party.length > 0) {
    lines.push("## Gruppe");
    lines.push("");
    lines.push("| Name | Spieler | Rasse / Rolle | Status | TP |");
    lines.push("|---|---|---|---|---|");
    character.party.forEach((p) => {
      const raceRole = [p.race, p.class, p.occupation].filter(Boolean).join(" / ");
      const hp = p.hp ? `${p.hp.current}${p.hp.max !== undefined ? `/${p.hp.max}` : ""}` : "";
      lines.push(`| ${p.name} | ${p.playerName || ""} | ${raceRole} | ${p.status || ""} | ${hp} |`);
    });
    lines.push("");
  }

  // --- Finanzen ---
  const currencyEntries = character.currency ? Object.entries(character.currency) : [];
  const currencyHistory =
    (character.systemData.currencyHistory as any[]) ||
    (character.systemData.nuyenHistory as any[]) ||
    [];
  const lifestyle = character.systemData.lifestyle as string | undefined;
  const currencyBalance = character.systemData.currencyBalance as number | undefined;
  const currencyUnit = character.systemData.currencyUnit as string | undefined;

  if (currencyEntries.length > 0 || currencyHistory.length > 0 || currencyBalance !== undefined || lifestyle) {
    lines.push("## Finanzen");
    lines.push("");
    currencyEntries.forEach(([unit, amount]) => lines.push(`- **Guthaben:** ${amount} ${unit}`));
    if (currencyBalance !== undefined) lines.push(`- **Guthaben:** ${currencyBalance} ${currencyUnit || ""}`);
    if (lifestyle) lines.push(`- **Lifestyle:** ${lifestyle}`);
    if (currencyHistory.length > 0) {
      lines.push("");
      lines.push("### Letzte Transaktionen");
      currencyHistory.slice(0, 10).forEach((h: any) => {
        lines.push(`- ${h.description}: ${h.amount >= 0 ? "+" : ""}${h.amount}${h.detail ? ` (${h.detail})` : ""}`);
      });
    }
    lines.push("");
  }

  // --- Hintergrund (nur falls vorhanden, z.B. bei Cthulhu) ---
  const backgroundKeys: { key: string; label: string }[] = [
    { key: "ideology", label: "Ideologie / Glaube" },
    { key: "importantPeople", label: "Wichtige Personen" },
    { key: "meaningfulLocations", label: "Bedeutsame Orte" },
    { key: "treasuredPossessions", label: "Geschätzter Besitz" },
    { key: "phobiasManias", label: "Phobien & Manien" },
    { key: "injuriesScars", label: "Verletzungen & Narben" },
    { key: "mythosEncounters", label: "Begegnungen mit dem Mythos" },
  ];
  const hasBackground = backgroundKeys.some(({ key }) => {
    const v = character.systemData[key];
    return (typeof v === "string" && v.trim()) || (Array.isArray(v) && v.length > 0);
  });
  if (hasBackground) {
    lines.push("## Hintergrund");
    lines.push("");
    backgroundKeys.forEach(({ key, label }) => {
      const v = character.systemData[key];
      if (typeof v === "string" && v.trim()) {
        lines.push(`### ${label}`);
        lines.push(v);
        lines.push("");
      } else if (Array.isArray(v) && v.length > 0) {
        lines.push(`### ${label}`);
        v.forEach((entry: any) => {
          lines.push(`- **${entry.title}**${entry.description ? ` — ${entry.description}` : ""}`);
        });
        lines.push("");
      }
    });
  }

  return lines.join("\n");
};

export const downloadCharacterAsMarkdown = (
  character: GenericCharacter,
  options: MarkdownExportOptions = {}
): void => {
  const markdown = exportCharacterToMarkdown(character, options);
  const safeName = (character.name || "Charakter").replace(/[^a-zA-Z0-9äöüÄÖÜß _-]/g, "").trim();
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeName}.md`;
  a.click();
  URL.revokeObjectURL(url);
};
