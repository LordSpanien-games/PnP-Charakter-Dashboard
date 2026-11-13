import React from "react";
import { Printer, Download } from "lucide-react";
import { PluginViewProps } from "../../core/SystemPlugin";
import { GenericCharacter } from "../../core/types";
import { ValueBadge } from "../../core/uiKit";
import { downloadCharacterAsMarkdown } from "../../core/markdownExport";
import {
  PathfinderAttributes,
  calculateModifier,
  formatModifier,
  calculateSavingThrows,
  calculateArmorClass,
  getEquippedArmorBonus,
  getJewelryArmorBonus,
  calculateCombatManeuver,
  calculateWeaponGripVariants,
  calculateBAB,
  formatIteratives,
  getBabIteratives,
  getSneakAttackDice,
  PATHFINDER_RACES,
} from "./pathfinderRules";
import { PATHFINDER_CLASSES } from "../../utils/levelUpRules";

const ATTR_KEYS = ["ST", "GE", "KO", "IN", "WE", "CH"] as const;
const ATTR_LABELS: Record<string, string> = {
  ST: "Stärke (ST)", GE: "Geschicklichkeit (GE)", KO: "Konstitution (KO)",
  IN: "Intelligenz (IN)", WE: "Weisheit (WE)", CH: "Charisma (CH)",
};

const getAttrs = (character: GenericCharacter): PathfinderAttributes => ({
  ST: Number(character.attributes.ST) || 10,
  GE: Number(character.attributes.GE) || 10,
  KO: Number(character.attributes.KO) || 10,
  IN: Number(character.attributes.IN) || 10,
  WE: Number(character.attributes.WE) || 10,
  CH: Number(character.attributes.CH) || 10,
});

const getLevel = (c: GenericCharacter) => Number(c.systemData.level) || 1;
const getClassId = (c: GenericCharacter) => c.systemData.classId as string | undefined;
const getRaceId = (c: GenericCharacter) => c.systemData.raceId as string | undefined;

export const PathfinderCharacterSheetView: React.FC<PluginViewProps> = ({
  character,
  isEditing,
  onUpdate,
}) => {
  const attrs = getAttrs(character);
  const level = getLevel(character);
  const classId = getClassId(character);
  const raceId = getRaceId(character);
  const cls = classId ? PATHFINDER_CLASSES[classId] : undefined;
  const race = raceId ? PATHFINDER_RACES[raceId] : undefined;
  const sneakAttackActive = Boolean(character.systemData.sneakAttackActive);
  const charModifiers = character.systemData.combatModifiers as any[] || [];

  const bab = calculateBAB(level, cls?.babProgression ?? "threeFourths");
  const iteratives = getBabIteratives(bab);
  const saves = calculateSavingThrows(attrs, level, classId);
  const maneuver = calculateCombatManeuver(attrs, level, classId, raceId);

  const armorBonus = getEquippedArmorBonus(character.inventory);
  const jewelryArmorBonus = getJewelryArmorBonus(character.inventory);
  const ac = calculateArmorClass(attrs, armorBonus, jewelryArmorBonus, raceId);
  const hp = character.resources.hp || { current: 0, max: 0 };

  const activeWeapons = character.inventory.filter(
    (i) => i.category === "weapon" && i.location === "equipped" && i.isActiveWeapon
  );
  const primaryWeapon = activeWeapons.find(
    (w) => w.weaponData?.weaponSlot === "primary" || !w.weaponData?.weaponSlot
  ) || activeWeapons[0];
  const offHandWeapon = activeWeapons.find(
    (w) => w.weaponData?.weaponSlot === "offHand" && w !== primaryWeapon
  );
  const isTwoWeaponMode = !!primaryWeapon && !!offHandWeapon;

  const miscBonuses = charModifiers.reduce(
    (acc, m) => ({
      kmbBonus: acc.kmbBonus + (m.kmbBonus ?? 0),
      kmvBonus: acc.kmvBonus + (m.kmvBonus ?? 0),
      acBonus: acc.acBonus + (m.acBonus ?? 0),
    }),
    { kmbBonus: 0, kmvBonus: 0, acBonus: 0 }
  );
  const hasDefensiveTwoWeaponFighting = Boolean(character.systemData.hasDefensiveTwoWeaponFighting);
  const hasDodge = Boolean(character.systemData.hasDodge);
  const talentAcBonus = (hasDodge ? 1 : 0) + (hasDefensiveTwoWeaponFighting && isTwoWeaponMode ? 1 : 0);
  const totalArmorClass = ac.armorClass + miscBonuses.acBonus + talentAcBonus;

  const sneakDice = getSneakAttackDice(classId, level);

  const fortNote = (character.systemData.fortitudeNote as string) || "";
  const refNote = (character.systemData.reflexNote as string) || "";
  const willNote = (character.systemData.willNote as string) || "";

  const updateSystemData = (key: string, value: unknown) =>
    onUpdate({ systemData: { ...character.systemData, [key]: value } });

  const handlePrint = () => window.print();
  const handleMarkdownExport = () =>
    downloadCharacterAsMarkdown(character, {
      attributeLabels: ATTR_LABELS,
      systemLabel: "Pathfinder 1e",
    });

  const singleResults = !isTwoWeaponMode
    ? activeWeapons.map((item) => ({
        item,
        result: calculateWeaponGripVariants(
          {
            name: item.name,
            isMelee: item.weaponData?.isMelee ?? true,
            isFinesse: item.weaponData?.isFinesse,
            magicBonus: item.weaponData?.magicBonus,
            baseDice: item.weaponData?.baseDice,
            damageAttribute: item.weaponData?.damageAttribute,
            extraDamage: item.weaponData?.extraDamage,
            supportsOneHanded: item.weaponData?.supportsOneHanded,
            supportsTwoHanded: item.weaponData?.supportsTwoHanded,
            modifiers: item.weaponData?.modifiers,
            sneakAttackBonusAttack: item.weaponData?.sneakAttackBonusAttack,
            sneakAttackBonusDamage: item.weaponData?.sneakAttackBonusDamage,
          },
          attrs,
          level,
          classId,
          raceId,
          charModifiers,
          sneakAttackActive
        ),
      }))
    : [];

  return (
    <div className="space-y-4">
      <div className="no-print flex flex-wrap gap-2 p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
        <button onClick={handlePrint} className="flex items-center gap-2 px-3 py-1.5 bg-orange-500 hover:bg-orange-400 text-black font-mono font-bold rounded-lg text-xs">
          <Printer size={14} /> Als PDF drucken / exportieren
        </button>
        <button onClick={handleMarkdownExport} className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-mono font-bold rounded-lg text-xs">
          <Download size={14} /> Als Obsidian-Markdown exportieren
        </button>
      </div>

      <div className="printable-sheet print-page bg-white text-black p-6 rounded-xl space-y-4 font-serif">
        <div className="border-b-2 border-black pb-2 avoid-break">
          <h1 className="text-2xl font-bold">{character.name}</h1>
          <p className="text-sm">
            {race?.name || "–"} · {cls?.name || "–"} · Stufe {level}
            {character.subTitle ? ` · ${character.subTitle}` : ""}
          </p>
        </div>

        <table className="w-full text-sm avoid-break">
          <thead>
            <tr>
              {ATTR_KEYS.map((k) => (
                <th key={k} className="border px-2 py-1 text-center">{k}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {ATTR_KEYS.map((k) => (
                <td key={k} className="border px-2 py-1 text-center">
                  {attrs[k]} ({formatModifier(calculateModifier(attrs[k]))})
                </td>
              ))}
            </tr>
          </tbody>
        </table>

        <table className="w-full text-sm avoid-break">
          <thead>
            <tr>
              <th className="border px-2 py-1">TP</th>
              <th className="border px-2 py-1">RK</th>
              <th className="border px-2 py-1">Berührung</th>
              <th className="border px-2 py-1">Flat-Footed</th>
              <th className="border px-2 py-1">KMB</th>
              <th className="border px-2 py-1">KMV</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border px-2 py-1 text-center">
                {hp.current} / {hp.max ?? "–"}
              </td>
              <td className="border px-2 py-1 text-center">{totalArmorClass}</td>
              <td className="border px-2 py-1 text-center">{ac.touchAc}</td>
              <td className="border px-2 py-1 text-center">{ac.flatFootedAc}</td>
              <td className="border px-2 py-1 text-center">
                {formatModifier(maneuver.kmb + miscBonuses.kmbBonus)}
              </td>
              <td className="border px-2 py-1 text-center">
                {formatModifier(maneuver.kmv + miscBonuses.kmvBonus)}
              </td>
            </tr>
          </tbody>
        </table>

        <table className="w-full text-sm avoid-break">
          <thead>
            <tr>
              <th className="border px-2 py-1">Zähigkeit</th>
              <th className="border px-2 py-1">Reflex</th>
              <th className="border px-2 py-1">Wille</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border px-2 py-1 text-center">
                {formatModifier(saves.fortitude.total)}
              </td>
              <td className="border px-2 py-1 text-center">
                {formatModifier(saves.reflex.total)}
              </td>
              <td className="border px-2 py-1 text-center">
                {formatModifier(saves.will.total)}
              </td>
            </tr>
          </tbody>
        </table>
        {isEditing ? (
          <div className="grid grid-cols-3 gap-2 text-xs no-print">
            <input
              value={fortNote}
              onChange={(e) => updateSystemData("fortitudeNote", e.target.value)}
              placeholder="Sondernotiz Zähigkeit"
              className="border px-1 py-0.5"
            />
            <input
              value={refNote}
              onChange={(e) => updateSystemData("reflexNote", e.target.value)}
              placeholder="Sondernotiz Reflex"
              className="border px-1 py-0.5"
            />
            <input
              value={willNote}
              onChange={(e) => updateSystemData("willNote", e.target.value)}
              placeholder="Sondernotiz Wille"
              className="border px-1 py-0.5"
            />
          </div>
        ) : (
          (fortNote || refNote || willNote) && (
            <p className="text-xs italic">
              {[fortNote, refNote, willNote].filter(Boolean).join(" · ")}
            </p>
          )
        )}

        <div className="avoid-break">
          <h2 className="font-bold border-b border-black">Fertigkeiten</h2>
          {character.skills.length === 0 ? (
            <p className="text-xs italic">Keine Fertigkeiten hinterlegt.</p>
          ) : (
            <table className="w-full text-sm mt-1">
              <thead>
                <tr>
                  <th className="border px-2 py-1 text-left">Fertigkeit</th>
                  <th className="border px-2 py-1">Wert</th>
                  <th className="border px-2 py-1">Geübt</th>
                </tr>
              </thead>
              <tbody>
                {character.skills.map((s, idx) => (
                  <tr key={idx}>
                    <td className="border px-2 py-1">{s.name}</td>
                    <td className="border px-2 py-1 text-center">{s.value}</td>
                    <td className="border px-2 py-1 text-center">
                      {(s as any).trained ? "✓" : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="avoid-break">
          <h2 className="font-bold border-b border-black">Waffen</h2>
          {activeWeapons.length === 0 ? (
            <p className="text-xs italic">Keine aktive Waffe.</p>
          ) : (
            <table className="w-full text-sm mt-1">
              <thead>
                <tr>
                  <th className="border px-2 py-1">Waffe</th>
                  <th className="border px-2 py-1">Angriff</th>
                  <th className="border px-2 py-1">Schaden</th>
                </tr>
              </thead>
              <tbody>
                {!isTwoWeaponMode && singleResults.map(({ item, result }) => {
                  const grip = result.grips[0];
                  return (
                    <tr key={item.id}>
                      <td className="border px-2 py-1">{item.name}</td>
                      <td className="border px-2 py-1">{grip.attack}</td>
                      <td className="border px-2 py-1">
                        {grip.damage}
                        {grip.extraDamageParts.length ? ` ${grip.extraDamageParts.join(" ")}` : ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {activeWeapons.length > 0 && (
          <div className="avoid-break">
            <h2 className="font-bold border-b border-black">Angriffsablauf</h2>
            <table className="w-full text-sm mt-1">
              <thead>
                <tr>
                  <th className="border px-2 py-1">Angriff</th>
                  <th className="border px-2 py-1">Hand</th>
                  <th className="border px-2 py-1">GAB</th>
                  <th className="border px-2 py-1">Schaden</th>
                </tr>
              </thead>
              <tbody>
                {iteratives.map((b, idx) => (
                  <tr key={idx}>
                    <td className="border px-2 py-1">{idx + 1}.</td>
                    <td className="border px-2 py-1">
                      {primaryWeapon?.name || "–"}
                    </td>
                    <td className="border px-2 py-1">{formatModifier(b)}</td>
                    <td className="border px-2 py-1">
                      {singleResults[0]?.result.grips[0]?.damage || "–"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {sneakAttackActive && sneakDice > 0 && singleResults[0]?.result.grips[0]?.sneakAttack && (
          <div className="avoid-break">
            <h2 className="font-bold border-b border-black">Hinterhältiger Angriff</h2>
            <table className="w-full text-sm mt-1">
              <thead>
                <tr>
                  <th className="border px-2 py-1">Angriff</th>
                  <th className="border px-2 py-1">Schaden gesamt</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border px-2 py-1">
                    {singleResults[0].result.grips[0].sneakAttack!.attack}
                  </td>
                  <td className="border px-2 py-1">
                    {singleResults[0].result.grips[0].sneakAttack!.damage}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <div className="force-page-break avoid-break">
          <h2 className="font-bold border-b border-black">Talente & Fähigkeiten</h2>
          <ul className="text-sm list-disc pl-5">
            {character.abilities.map((a, idx) => (
              <li key={idx}>
                <strong>{a.name}</strong>{a.usage ? ` (${a.usage})` : ""}{a.effect ? ` — ${a.effect}` : ""}
              </li>
            ))}
          </ul>
        </div>

        <div className="avoid-break">
          <h2 className="font-bold border-b border-black">Besitz & Ausrüstung</h2>
          <ul className="text-sm list-disc pl-5">
            {character.inventory.map((item) => (
              <li key={item.id}>
                <strong>{item.name}</strong>
                {item.quantity !== undefined ? ` ×${item.quantity}` : ""}
                {item.notes ? ` — ${item.notes}` : ""}
              </li>
            ))}
          </ul>
        </div>

        {character.party.length > 0 && (
          <div className="avoid-break">
            <h2 className="font-bold border-b border-black">Gruppe</h2>
            <table className="w-full text-sm mt-1">
              <thead>
                <tr>
                  <th className="border px-2 py-1">Name</th>
                  <th className="border px-2 py-1">Spieler</th>
                  <th className="border px-2 py-1">Rasse / Rolle</th>
                </tr>
              </thead>
              <tbody>
                {character.party.map((p, idx) => (
                  <tr key={idx}>
                    <td className="border px-2 py-1">{p.name}</td>
                    <td className="border px-2 py-1">{p.playerName || ""}</td>
                    <td className="border px-2 py-1">
                      {[p.race, p.occupation].filter(Boolean).join(" / ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {(character.systemData.currencyBalance !== undefined ||
          (character.systemData.currencyHistory as any[])?.length > 0) && (
          <div className="avoid-break">
            <h2 className="font-bold border-b border-black">Finanzen</h2>
            <p className="text-sm">
              Guthaben:{" "}
              {character.systemData.currencyBalance as number}{" "}
              {(character.systemData.currencyUnit as string) || "GM"}
            </p>
            <ul className="text-xs list-disc pl-5">
              {((character.systemData.currencyHistory as any[]) || [])
                .slice(0, 10)
                .map((h: any) => (
                  <li key={h.id}>
                    {h.description}{h.detail ? ` (${h.detail})` : ""}
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
