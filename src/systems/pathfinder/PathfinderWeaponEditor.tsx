import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import {
  DamageComponent,
  DamageComponentKind,
  DamageCondition,
  InventoryItem,
  SourceReference,
  WeaponItemData,
  WeaponSlot,
} from "../../core/types";
import { SourceReferenceEditor } from "../../core/uiKit";
import {
  CONDITION_LABELS,
  CONDITION_OPTIONS,
  DAMAGE_KIND_LABELS,
  DAMAGE_KIND_ORDER,
  makeComponentId,
  normalizeWeaponData,
  sortDamageComponents,
} from "./pathfinderWeaponModel";

/**
 * Gemeinsamer Waffen-Editor für Kampf-Reiter und Inventar-Reiter.
 * Beide Reiter schreiben in dasselbe weaponData – es gibt nur eine Quelle der Wahrheit.
 */

const WEAPON_SLOT_OPTIONS: { value: WeaponSlot; label: string }[] = [
  { value: "primary", label: "Haupthand" },
  { value: "offHand", label: "Nebenhand" },
  { value: "twoHanded", label: "Beidhändig" },
];

const KIND_COLOR: Record<DamageComponentKind, string> = {
  native: "text-rose-300",
  extra: "text-orange-300",
  magic: "text-sky-300",
  situational: "text-emerald-300",
};

/** Editor für einen einzelnen Schadensanteil. */
const DamageComponentEditor: React.FC<{
  component: DamageComponent;
  onChange: (next: DamageComponent) => void;
  onRemove: () => void;
}> = ({ component, onChange, onRemove }) => {
  const [customCondition, setCustomCondition] = useState("");
  const isCustom = (component.condition || "always").startsWith("custom:");

  return (
    <div className="p-2 bg-zinc-950/60 border border-zinc-800 rounded-lg space-y-1.5">
      <div className="flex items-center gap-1.5">
        <input
          value={component.label}
          onChange={(e) => onChange({ ...component, label: e.target.value })}
          placeholder="Bezeichnung, z.B. Nativ"
          className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-[10px] text-white font-mono"
        />
        <button onClick={onRemove} className="text-red-400 hover:text-red-300 shrink-0">
          <X size={13} />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        <select
          value={component.kind}
          onChange={(e) => onChange({ ...component, kind: e.target.value as DamageComponentKind })}
          title="Art des Schadensanteils"
          className="bg-zinc-900 border border-zinc-700 rounded px-1 py-1 text-[10px] text-white font-mono"
        >
          {DAMAGE_KIND_ORDER.map((k) => (
            <option key={k} value={k}>{DAMAGE_KIND_LABELS[k]}</option>
          ))}
        </select>
        <input
          value={component.dice || ""}
          onChange={(e) => onChange({ ...component, dice: e.target.value || undefined })}
          placeholder="Würfel, z.B. 1W6"
          title="Würfelangabe"
          className="bg-zinc-900 border border-zinc-700 rounded px-1 py-1 text-[10px] text-white font-mono"
        />
        <input
          type="number"
          value={component.flat ?? 0}
          onChange={(e) => onChange({ ...component, flat: Number(e.target.value) })}
          placeholder="Flach +X"
          title="Schaden ohne Würfel"
          className="bg-zinc-900 border border-zinc-700 rounded px-1 py-1 text-[10px] text-white font-mono"
        />
        <input
          type="number"
          value={component.attackBonus ?? 0}
          onChange={(e) => onChange({ ...component, attackBonus: Number(e.target.value) })}
          placeholder="Angriff +X"
          title="Angriffsbonus, wenn die Bedingung aktiv ist"
          className="bg-zinc-900 border border-zinc-700 rounded px-1 py-1 text-[10px] text-white font-mono"
        />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {!isCustom ? (
          <select
            value={component.condition || "always"}
            onChange={(e) => onChange({ ...component, condition: e.target.value as DamageCondition })}
            title="Bedingung"
            className="bg-zinc-900 border border-zinc-700 rounded px-1 py-1 text-[10px] text-white font-mono"
          >
            {CONDITION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
            <option value="__custom">Eigene Bedingung…</option>
          </select>
        ) : (
          <>
            <input
              value={(component.condition || "").replace("custom:", "")}
              onChange={(e) => onChange({ ...component, condition: `custom:${e.target.value}` })}
              placeholder="Name der Bedingung"
              className="bg-zinc-900 border border-zinc-700 rounded px-1 py-1 text-[10px] text-white font-mono"
            />
            <button
              onClick={() => onChange({ ...component, condition: "always" })}
              className="text-[9px] text-zinc-400 hover:text-white font-mono"
            >
              zurücksetzen
            </button>
          </>
        )}
        {component.condition === "always" && !isCustom && (
          <button
            onClick={() => onChange({ ...component, condition: "custom:" })}
            className="text-[9px] text-zinc-400 hover:text-white font-mono"
          >
            eigene Bedingung
          </button>
        )}
        <label className="flex items-center gap-1 text-[9px] text-zinc-400 font-mono">
          <input
            type="checkbox"
            checked={component.criticalApplies !== false}
            onChange={(e) => onChange({ ...component, criticalApplies: e.target.checked })}
          />
          bei Krit verdoppeln
        </label>
      </div>
    </div>
  );
};

/** Editor für die Schadensanteile einer Waffe oder Munition. */
export const DamageComponentListEditor: React.FC<{
  components: DamageComponent[];
  onChange: (next: DamageComponent[]) => void;
}> = ({ components, onChange }) => {
  const addComponent = (kind: DamageComponentKind) => {
    const labels: Record<DamageComponentKind, string> = {
      native: "Nativ",
      extra: "Zusatz",
      magic: "Magisch",
      situational: "Situativ",
    };
    onChange([
      ...components,
      {
        id: makeComponentId(),
        label: labels[kind],
        kind,
        condition: kind === "situational" ? "sneakAttack" : "always",
        criticalApplies: kind !== "situational",
      },
    ]);
  };

  return (
    <div className="space-y-1.5">
      {components.length === 0 && (
        <p className="text-[9px] text-zinc-500 font-mono">
          Noch keine Schadensanteile. Lege unten einen an.
        </p>
      )}
      {components.map((c) => (
        <DamageComponentEditor
          key={c.id}
          component={c}
          onChange={(next) => onChange(components.map((x) => (x.id === c.id ? next : x)))}
          onRemove={() => onChange(components.filter((x) => x.id !== c.id))}
        />
      ))}
      <div className="flex flex-wrap gap-1">
        {DAMAGE_KIND_ORDER.map((kind) => (
          <button
            key={kind}
            onClick={() => addComponent(kind)}
            className={`flex items-center gap-1 px-1.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-[9px] font-mono rounded ${KIND_COLOR[kind]}`}
          >
            <Plus size={10} /> {DAMAGE_KIND_LABELS[kind]}
          </button>
        ))}
      </div>
    </div>
  );
};

/** Vollständiger Waffen-Editor. */
export const WeaponEditor: React.FC<{
  item: InventoryItem;
  onChange: (weaponData: WeaponItemData) => void;
  /** Verfügbare Munitions-Items für die Auswahl. */
  ammoItems?: InventoryItem[];
}> = ({ item, onChange, ammoItems = [] }) => {
  const wd = normalizeWeaponData(item.weaponData);
  const components = sortDamageComponents(wd.damageComponents || []);
  const ammoOptions = ammoItems.filter((a) => a.category === "ammo");

  const patch = (p: Partial<WeaponItemData>) => onChange({ ...wd, ...p });
  const patchComponent = (next: DamageComponent[]) =>
    patch({ damageComponents: sortDamageComponents(next) });

  return (
    <div className="space-y-2">
      {/* Stammdaten */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
        <div>
          <label className="block text-[9px] text-zinc-500 font-mono uppercase mb-0.5">Verbesserung</label>
          <input
            type="number"
            value={wd.enhancement ?? 0}
            onChange={(e) => patch({ enhancement: Number(e.target.value) })}
            placeholder="+2"
            title="Wirkt als +X auf Angriff und +X auf Schaden"
            className="w-full bg-zinc-900 border border-zinc-700 rounded px-1 py-0.5 text-[10px] text-white font-mono"
          />
        </div>
        <div>
          <label className="block text-[9px] text-zinc-500 font-mono uppercase mb-0.5">Kritisch ab</label>
          <input
            type="number"
            min={2}
            max={20}
            value={wd.criticalThreshold ?? 20}
            onChange={(e) => patch({ criticalThreshold: Number(e.target.value) })}
            title="Ab diesem Wurf ist der Treffer kritisch"
            className="w-full bg-zinc-900 border border-zinc-700 rounded px-1 py-0.5 text-[10px] text-white font-mono"
          />
        </div>
        <div>
          <label className="block text-[9px] text-zinc-500 font-mono uppercase mb-0.5">Hand</label>
          <select
            value={wd.weaponSlot ?? "primary"}
            onChange={(e) => patch({ weaponSlot: e.target.value as WeaponSlot })}
            className="w-full bg-zinc-900 border border-zinc-700 rounded px-1 py-0.5 text-[10px] text-white font-mono"
          >
            {WEAPON_SLOT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[9px] text-zinc-500 font-mono uppercase mb-0.5">Art</label>
          <input
            value={wd.weaponType || ""}
            onChange={(e) => patch({ weaponType: e.target.value || undefined })}
            placeholder="Klinge, Bogen …"
            className="w-full bg-zinc-900 border border-zinc-700 rounded px-1 py-0.5 text-[10px] text-white font-mono"
          />
        </div>
        <div>
          <label className="block text-[9px] text-zinc-500 font-mono uppercase mb-0.5">Reichweite</label>
          <input
            value={wd.rangeText || ""}
            onChange={(e) => patch({ rangeText: e.target.value || undefined })}
            placeholder="Nahkampf, 20 ft …"
            className="w-full bg-zinc-900 border border-zinc-700 rounded px-1 py-0.5 text-[10px] text-white font-mono"
          />
        </div>
        <div>
          <label className="block text-[9px] text-zinc-500 font-mono uppercase mb-0.5">Angriffs-Attribut</label>
          <select
            value={wd.attackAttribute || ""}
            onChange={(e) => patch({ attackAttribute: (e.target.value || undefined) as "ST" | "GE" | undefined })}
            title="Leer = automatisch (Finesse/Fernkampf GE, sonst ST)"
            className="w-full bg-zinc-900 border border-zinc-700 rounded px-1 py-0.5 text-[10px] text-white font-mono"
          >
            <option value="">automatisch</option>
            <option value="ST">ST</option>
            <option value="GE">GE</option>
          </select>
        </div>
        <div>
          <label className="block text-[9px] text-zinc-500 font-mono uppercase mb-0.5">Schadens-Attribut</label>
          <select
            value={wd.damageAttribute || ""}
            onChange={(e) => patch({ damageAttribute: (e.target.value || undefined) as "ST" | "GE" | "NONE" | undefined })}
            title="Leer = automatisch (Finesse GE, Fernkampf keins, sonst ST)"
            className="w-full bg-zinc-900 border border-zinc-700 rounded px-1 py-0.5 text-[10px] text-white font-mono"
          >
            <option value="">automatisch</option>
            <option value="ST">ST</option>
            <option value="GE">GE</option>
            <option value="NONE">kein Attribut</option>
          </select>
        </div>
      </div>

      {/* Eigenschaften */}
      <div className="flex flex-wrap items-center gap-2 text-[9px] font-mono text-zinc-400">
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={wd.isMelee ?? true} onChange={(e) => patch({ isMelee: e.target.checked })} /> Nahkampf
        </label>
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={!!wd.isFinesse} onChange={(e) => patch({ isFinesse: e.target.checked })} /> Finesse
        </label>
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={!!wd.isLight} onChange={(e) => patch({ isLight: e.target.checked })} /> Leicht
        </label>
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={wd.supportsOneHanded !== false} onChange={(e) => patch({ supportsOneHanded: e.target.checked })} /> 1H
        </label>
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={!!wd.supportsTwoHanded} onChange={(e) => patch({ supportsTwoHanded: e.target.checked })} /> 2H
        </label>
      </div>

      {/* Munition */}
      <div>
        <label className="block text-[9px] text-zinc-500 font-mono uppercase mb-0.5">Munition</label>
        {ammoOptions.length === 0 ? (
          <p className="text-[9px] text-zinc-500 font-mono">
            Keine Munition angelegt. Lege im Inventar ein Item der Kategorie „Munition" an.
          </p>
        ) : (
          <select
            value={wd.ammoItemId || ""}
            onChange={(e) => patch({ ammoItemId: e.target.value || undefined })}
            className="w-full bg-zinc-900 border border-zinc-700 rounded px-1 py-0.5 text-[10px] text-white font-mono"
          >
            <option value="">– keine –</option>
            {ammoOptions.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({(a.quantity ?? 0)} Stück)
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Schadensanteile */}
      <div>
        <span className="text-[9px] uppercase text-zinc-500 font-mono">Schadensanteile</span>
        <div className="mt-1">
          <DamageComponentListEditor components={components} onChange={patchComponent} />
        </div>
        <p className="text-[9px] text-zinc-500 font-mono mt-1">
          Reihenfolge im Wurfplan: Nativ → Zusatz → Magisch → Situativ. Die flachen Werte
          („Fest") zählen ohne Würfel und werden bei einem kritischen Treffer nicht verdoppelt.
        </p>
      </div>
    </div>
  );
};

/** Editor für ein Munitions-Item. */
export const AmmoEditor: React.FC<{
  item: InventoryItem;
  onChange: (ammoData: NonNullable<InventoryItem["ammoData"]>) => void;
}> = ({ item, onChange }) => {
  const ammo = item.ammoData || {};
  const components = ammo.damageComponents || [];

  return (
    <div className="space-y-2">
      <div>
        <label className="block text-[9px] text-zinc-500 font-mono uppercase mb-0.5">Effekt (Freitext)</label>
        <textarea
          value={ammo.effect || ""}
          onChange={(e) => onChange({ ...ammo, effect: e.target.value || undefined })}
          placeholder="z.B. 1d6 CON-Schaden, 1/Tag"
          className="w-full bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-[10px] text-white font-mono min-h-[36px]"
        />
      </div>
      <div>
        <span className="text-[9px] uppercase text-zinc-500 font-mono">Schadensanteile der Munition</span>
        <div className="mt-1">
          <DamageComponentListEditor
            components={components}
            onChange={(next) => onChange({ ...ammo, damageComponents: next })}
          />
        </div>
        <p className="text-[9px] text-zinc-500 font-mono mt-1">
          Ein „Nativ"-Anteil ersetzt den nativen Schaden der Waffe (z.B. Blasrohrpfeile 1W4
          statt Bogen 1W6). Alle anderen Anteile kommen als situativer Block dazu.
        </p>
      </div>
    </div>
  );
};

export const CONDITION_LABEL_MAP = CONDITION_LABELS;
export type { SourceReference };
