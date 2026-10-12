import { GenericCharacter } from "./types";

export interface CompareRow {
  key: string;
  label: string;
  oldValue: string;
  newValue: string;
  status: "unchanged" | "increased" | "decreased" | "changed" | "added" | "removed";
}

const toComparable = (v: unknown): string => {
  if (v === undefined || v === null) return "";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
};

const numericDelta = (
  oldV: unknown,
  newV: unknown
): "increased" | "decreased" | "unchanged" | null => {
  const a = typeof oldV === "number" ? oldV : parseFloat(String(oldV));
  const b = typeof newV === "number" ? newV : parseFloat(String(newV));
  if (isNaN(a) || isNaN(b)) return null;
  if (b > a) return "increased";
  if (b < a) return "decreased";
  return "unchanged";
};

const compareRecord = (
  oldRec: Record<string, any> | undefined,
  newRec: Record<string, any> | undefined
): CompareRow[] => {
  const rows: CompareRow[] = [];
  const keys = new Set([...Object.keys(oldRec || {}), ...Object.keys(newRec || {})]);

  for (const key of keys) {
    const oldV = oldRec?.[key];
    const newV = newRec?.[key];
    const oldStr = toComparable(oldV);
    const newStr = toComparable(newV);

    let status: CompareRow["status"] = "unchanged";
    if (oldV === undefined && newV !== undefined) status = "added";
    else if (oldV !== undefined && newV === undefined) status = "removed";
    else {
      const delta = numericDelta(oldV, newV);
      if (delta) status = delta;
      else if (oldStr !== newStr) status = "changed";
    }

    rows.push({ key, label: key, oldValue: oldStr, newValue: newStr, status });
  }

  return rows;
};

export interface CharacterComparison {
  nameOld: string;
  nameNew: string;
  attributeRows: CompareRow[];
  resourceRows: CompareRow[];
  skillRows: CompareRow[];
}

/** Generischer, systemunabhängiger Diff zwischen zwei Charakter-Snapshots.
 * Funktioniert für JEDES Plugin, da nur die generische Shell angeschaut wird. */
export const compareCharacters = (
  oldChar: GenericCharacter,
  newChar: GenericCharacter
): CharacterComparison => {
  const skillMap = (skills: GenericCharacter["skills"]) =>
    Object.fromEntries(skills.map((s) => [s.name, s.value]));

  const resourceMap = (resources: GenericCharacter["resources"]) =>
    Object.fromEntries(Object.entries(resources).map(([k, v]) => [k, v.current]));

  return {
    nameOld: `${oldChar.name} (v${oldChar.exportVersion})`,
    nameNew: `${newChar.name} (v${newChar.exportVersion})`,
    attributeRows: compareRecord(oldChar.attributes, newChar.attributes),
    resourceRows: compareRecord(resourceMap(oldChar.resources), resourceMap(newChar.resources)),
    skillRows: compareRecord(skillMap(oldChar.skills), skillMap(newChar.skills)),
  };
};
