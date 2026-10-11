import React, { FC, useState, useMemo } from "react";
import { 
  Backpack, 
  Plus, 
  Search, 
  Package, 
  Sword, 
  Shield, 
  Crosshair, 
  Zap, 
  Trash2, 
  Edit3, 
  Check, 
  Home, 
  MapPin, 
  AlertCircle,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  X,
  BookOpen
} from "lucide-react";
import { CharacterData, InventoryItem, ItemLocationStatus, InventoryCategory } from "../../types";
import { 
  isItemWeapon, 
  isItemArmor, 
  determineWeaponType, 
  syncInventoryToWeapons, 
  DEFAULT_STORAGE_LOCATION,
  initializeCharacterInventory,
  extractDailyUsesFromText
} from "../../utils/inventorySync";
import { INVENTORY_PRESETS, InventoryPreset } from "../../data/inventoryPresets";

export interface InventorySectionProps {
  character: CharacterData;
  isEditing: boolean;
  onUpdateData: (partial: Partial<CharacterData>) => void;
}

export const InventorySection: FC<InventorySectionProps> = ({
  character,
  isEditing,
  onUpdateData
}) => {
  // Ensure inventory is initialized
  const inventory: InventoryItem[] = useMemo(() => {
    return initializeCharacterInventory(character);
  }, [character.inventory, character.weapons, character.abilities]);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'equipped' | 'stored'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'weapon' | 'armor' | 'gear' | 'ammo'>('all');

  // Modal / Form state for adding/editing item
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState<InventoryCategory>('gear');
  const [formStatus, setFormStatus] = useState<ItemLocationStatus>('equipped');
  const [formLocation, setFormLocation] = useState(DEFAULT_STORAGE_LOCATION);
  const [formQuantity, setFormQuantity] = useState(1);
  const [formRating, setFormRating] = useState<string>("");
  
  // Weapon fields
  const [formDamage, setFormDamage] = useState("");
  const [formAccuracy, setFormAccuracy] = useState("");
  const [formAp, setFormAp] = useState("");
  const [formMode, setFormMode] = useState("");
  const [formRc, setFormRc] = useState("");
  const [formAmmo, setFormAmmo] = useState("");
  const [formWeaponType, setFormWeaponType] = useState<'melee' | 'ranged'>('ranged');
  const [formAttackPool, setFormAttackPool] = useState("");

  // Armor fields
  const [formArmorValue, setFormArmorValue] = useState("");

  const [formNotes, setFormNotes] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formWeight, setFormWeight] = useState("");
  const [formPage, setFormPage] = useState("");
  const [formMaxUses, setFormMaxUses] = useState<string>("");

  // Helper to commit inventory and auto-sync weapons
  const commitInventory = (newInventory: InventoryItem[]) => {
    const updatedWeapons = syncInventoryToWeapons(newInventory);
    onUpdateData({
      inventory: newInventory,
      weapons: updatedWeapons
    });
  };

  // Toggle item between equipped ("Am Mann") and stored ("Eingelagert in Unterkunft")
  const handleToggleStatus = (item: InventoryItem) => {
    const nextStatus: ItemLocationStatus = item.status === 'equipped' ? 'stored' : 'equipped';
    const nextLocation = item.location || DEFAULT_STORAGE_LOCATION;

    const newInventory = inventory.map(i => {
      if (i.id === item.id) {
        return {
          ...i,
          status: nextStatus,
          location: nextLocation
        };
      }
      return i;
    });

    commitInventory(newInventory);
  };

  // Quick inline location change
  const handleChangeLocation = (item: InventoryItem, newLoc: string) => {
    const newInventory = inventory.map(i => {
      if (i.id === item.id) {
        return { ...i, location: newLoc.trim() || DEFAULT_STORAGE_LOCATION };
      }
      return i;
    });
    commitInventory(newInventory);
  };

  // Delete item
  const handleDeleteItem = (id: string) => {
    const newInventory = inventory.filter(i => i.id !== id);
    commitInventory(newInventory);
  };

  // Open Form to create new item
  const handleOpenCreate = (categoryHint: InventoryCategory = 'gear') => {
    setEditingItemId(null);
    setFormName("");
    setFormCategory(categoryHint);
    setFormStatus('equipped');
    setFormLocation(DEFAULT_STORAGE_LOCATION);
    setFormQuantity(1);
    setFormRating("");
    setFormDamage("");
    setFormAccuracy("");
    setFormAp("");
    setFormMode("");
    setFormRc("");
    setFormAmmo("");
    setFormWeaponType(categoryHint === 'weapon' ? 'ranged' : 'ranged');
    setFormAttackPool("");
    setFormArmorValue(categoryHint === 'armor' ? "12" : "");
    setFormNotes("");
    setFormPrice("");
    setFormWeight("");
    setFormPage("");
    setFormMaxUses("");
    setIsEditorOpen(true);
  };

  // Open Form to edit existing item
  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItemId(item.id);
    setFormName(item.name);
    setFormCategory(item.category || (isItemWeapon(item) ? 'weapon' : isItemArmor(item) ? 'armor' : 'gear'));
    setFormStatus(item.status || 'equipped');
    setFormLocation(item.location || DEFAULT_STORAGE_LOCATION);
    setFormQuantity(item.quantity || 1);
    setFormRating(item.rating ? String(item.rating) : "");
    setFormDamage(item.damage || "");
    setFormAccuracy(item.accuracy !== undefined ? String(item.accuracy) : "");
    setFormAp(item.ap !== undefined ? String(item.ap) : "");
    setFormMode(item.mode || "");
    setFormRc(item.rc !== undefined ? String(item.rc) : "");
    setFormAmmo(item.ammo || "");
    setFormWeaponType(item.weaponType || determineWeaponType(item));
    setFormAttackPool(item.attackPool !== undefined ? String(item.attackPool) : "");
    setFormArmorValue(item.armorValue !== undefined ? String(item.armorValue) : "");
    setFormNotes(item.notes || "");
    setFormPrice(item.price ? String(item.price) : "");
    setFormWeight(item.weight || "");
    setFormPage(item.page || "");
    const initialMax = item.maxUses !== undefined ? item.maxUses : extractDailyUsesFromText(item.notes);
    setFormMaxUses(initialMax !== undefined ? String(initialMax) : "");
    setIsEditorOpen(true);
  };

  // Save form
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const parsedMaxUses = formMaxUses.trim() !== "" ? Math.max(0, parseInt(formMaxUses) || 0) : undefined;
    const existingItem = editingItemId ? inventory.find(i => i.id === editingItemId) : undefined;
    const initialUses = parsedMaxUses !== undefined 
      ? (existingItem?.currentUses !== undefined ? Math.min(existingItem.currentUses, parsedMaxUses) : parsedMaxUses)
      : undefined;

    const newItem: InventoryItem = {
      id: editingItemId || `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: formName.trim(),
      category: formCategory,
      status: formStatus,
      location: formLocation.trim() || DEFAULT_STORAGE_LOCATION,
      quantity: formQuantity > 0 ? formQuantity : 1,
      rating: formRating ? formRating.trim() : undefined,
      notes: formNotes.trim() || undefined,
      price: formPrice ? formPrice.trim() : undefined,
      weight: formWeight ? formWeight.trim() : undefined,
      page: formPage.trim() || undefined,
      maxUses: parsedMaxUses,
      currentUses: initialUses,
    };

    // If weapon category or weapon fields are present
    if (formCategory === 'weapon' || formDamage || formAccuracy || formAp || formMode || formAmmo) {
      newItem.damage = formDamage.trim() || undefined;
      newItem.accuracy = formAccuracy ? formAccuracy.trim() : undefined;
      newItem.ap = formAp ? formAp.trim() : undefined;
      newItem.mode = formMode.trim() || undefined;
      newItem.rc = formRc ? formRc.trim() : undefined;
      newItem.ammo = formAmmo.trim() || undefined;
      newItem.weaponType = formWeaponType;
      newItem.attackPool = formAttackPool.trim() || undefined;
      if (!newItem.category) newItem.category = 'weapon';
    }

    // If armor
    if (formCategory === 'armor' || formArmorValue) {
      newItem.armorValue = formArmorValue.trim() || undefined;
      if (!newItem.category) newItem.category = 'armor';
    }

    let updatedInventory: InventoryItem[];
    if (editingItemId) {
      updatedInventory = inventory.map(i => i.id === editingItemId ? newItem : i);
    } else {
      updatedInventory = [newItem, ...inventory];
    }

    commitInventory(updatedInventory);
    setIsEditorOpen(false);
  };

  // Add preset directly
  const handleAddPreset = (preset: InventoryPreset) => {
    const newItem: InventoryItem = {
      id: `item-preset-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: preset.name,
      category: preset.category,
      status: 'equipped', // standardmäßig Am Mann
      location: DEFAULT_STORAGE_LOCATION,
      quantity: 1,
      rating: preset.rating,
      damage: preset.damage,
      accuracy: preset.accuracy,
      ap: preset.ap,
      mode: preset.mode,
      rc: preset.rc,
      ammo: preset.ammo,
      weaponType: preset.weaponType,
      armorValue: preset.armorValue,
      price: preset.price,
      weight: preset.weight,
      notes: preset.notes
    };

    commitInventory([newItem, ...inventory]);
    setIsPresetModalOpen(false);
  };

  // Counts
  const equippedCount = inventory.filter(i => i.status !== 'stored').length;
  const storedCount = inventory.filter(i => i.status === 'stored').length;

  // Filtered Items
  const filteredItems = inventory.filter(item => {
    // Status filter
    if (statusFilter === 'equipped' && item.status === 'stored') return false;
    if (statusFilter === 'stored' && item.status !== 'stored') return false;

    // Category filter
    if (categoryFilter === 'weapon' && !isItemWeapon(item)) return false;
    if (categoryFilter === 'armor' && !isItemArmor(item)) return false;
    if (categoryFilter === 'gear' && (isItemWeapon(item) || isItemArmor(item))) return false;
    if (categoryFilter === 'ammo' && item.category !== 'ammo') return false;

    // Search query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchNotes = (item.notes || "").toLowerCase().includes(q);
      const matchLoc = (item.location || "").toLowerCase().includes(q);
      const matchDmg = (item.damage || "").toLowerCase().includes(q);
      const matchPage = (item.page || "").toLowerCase().includes(q);
      if (!matchName && !matchNotes && !matchLoc && !matchDmg && !matchPage) return false;
    }

    return true;
  });

  return (
    <section className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
            <Backpack size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white uppercase tracking-tight">
                Inventar & Ausrüstung
              </h2>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                {inventory.length} Gegenstände
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-2">
              <span>Tragbare Ausrüstung, Waffen & Lagerung</span>
              <span className="text-zinc-600">•</span>
              <span className="text-cyan-400 font-mono font-medium">Standardort: {DEFAULT_STORAGE_LOCATION}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setIsPresetModalOpen(true)}
            className="flex-1 sm:flex-initial text-xs font-semibold px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-cyan-300 border border-zinc-700 hover:border-cyan-500/40 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Sparkles size={13} />
            <span>Katalog</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenCreate('weapon')}
            className="flex-1 sm:flex-initial text-xs font-bold px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <Plus size={14} />
            <span>Gegenstand anlegen</span>
          </button>
        </div>
      </div>

      {/* Scope & System Note Banner */}
      <div className="mb-4 p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800 text-xs text-zinc-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-start sm:items-center gap-2">
          <Package size={16} className="text-cyan-400 shrink-0 mt-0.5 sm:mt-0" />
          <span>
            <strong className="text-zinc-200">Tragbare Ausrüstung, Waffen & Panzerung:</strong> Gegenstände <strong className="text-emerald-400">Am Mann</strong> sind im Einsatz dabei und synchronisieren Waffen automatisch auf das Hauptblatt. Gegenstände mit Status <strong className="text-amber-400">Eingelagert</strong> verbleiben sicher am Lagerort (Standard: <em>{DEFAULT_STORAGE_LOCATION}</em>).
          </span>
        </div>
        <span className="text-[10px] text-zinc-500 font-mono shrink-0">
          Separate Bereiche: Fahrzeuge • Cyberdeck • Bodytech • Magie & Adeptenkräfte
        </span>
      </div>

      {/* Summary Status Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
        <div 
          onClick={() => setStatusFilter('all')}
          className={`p-3 rounded-2xl border cursor-pointer transition-all ${statusFilter === 'all' ? 'bg-cyan-950/30 border-cyan-500/50 shadow-sm' : 'bg-zinc-950/40 border-zinc-800/80 hover:border-zinc-700'}`}
        >
          <div className="text-[10px] uppercase font-mono text-zinc-400 flex items-center justify-between">
            <span>Gesamt</span>
            <Layers size={12} className="text-zinc-500" />
          </div>
          <div className="text-lg font-bold font-mono text-white mt-1">
            {inventory.length}
          </div>
        </div>

        <div 
          onClick={() => setStatusFilter('equipped')}
          className={`p-3 rounded-2xl border cursor-pointer transition-all ${statusFilter === 'equipped' ? 'bg-emerald-950/30 border-emerald-500/50 shadow-sm' : 'bg-zinc-950/40 border-zinc-800/80 hover:border-zinc-700'}`}
        >
          <div className="text-[10px] uppercase font-mono text-emerald-400 flex items-center justify-between">
            <span>🎒 Am Mann</span>
            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1 rounded">Einsatzbereit</span>
          </div>
          <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
            {equippedCount} <span className="text-xs font-normal text-zinc-400">mitgeführt</span>
          </div>
        </div>

        <div 
          onClick={() => setStatusFilter('stored')}
          className={`p-3 rounded-2xl border cursor-pointer transition-all ${statusFilter === 'stored' ? 'bg-amber-950/30 border-amber-500/50 shadow-sm' : 'bg-zinc-950/40 border-zinc-800/80 hover:border-zinc-700'}`}
        >
          <div className="text-[10px] uppercase font-mono text-amber-400 flex items-center justify-between">
            <span>📦 Eingelagert</span>
            <Home size={12} className="text-amber-500" />
          </div>
          <div className="text-lg font-bold font-mono text-amber-300 mt-1">
            {storedCount} <span className="text-xs font-normal text-zinc-400">im Lager</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl border bg-zinc-950/40 border-zinc-800/80 flex flex-col justify-between">
          <div className="text-[10px] uppercase font-mono text-zinc-400 flex items-center justify-between">
            <span>Waffen-Sync</span>
            <Crosshair size={12} className="text-cyan-400" />
          </div>
          <div className="text-[11px] text-zinc-300 font-mono mt-1">
            <strong className="text-cyan-400 font-bold">
              {inventory.filter(i => isItemWeapon(i) && i.status !== 'stored').length}
            </strong> aktive Waffen am Mann
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Inventar durchsuchen (z. B. Ares, Monoschwert, Panzerjacke, Unterkunft...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-zinc-950 border border-zinc-800 rounded-2xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'Alle' },
            { id: 'weapon', label: 'Waffen' },
            { id: 'armor', label: 'Panzerung' },
            { id: 'gear', label: 'Ausrüstung' },
            { id: 'ammo', label: 'Munition' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                categoryFilter === cat.id
                  ? "bg-cyan-500 text-black shadow-md font-bold"
                  : "bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Items List */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="p-8 rounded-2xl bg-zinc-950/40 border border-dashed border-zinc-800 text-center">
            <Package size={28} className="mx-auto text-zinc-600 mb-2" />
            <p className="text-xs font-bold text-zinc-400">Keine Gegenstände für diesen Filter gefunden.</p>
            <p className="text-[11px] text-zinc-600 mt-1">
              Erstelle einen neuen Gegenstand oder wähle aus dem Schatten-Katalog.
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                type="button"
                onClick={() => setIsPresetModalOpen(true)}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-zinc-800 text-cyan-300 border border-zinc-700 hover:border-cyan-500"
              >
                Katalog öffnen
              </button>
              <button
                type="button"
                onClick={() => handleOpenCreate('weapon')}
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-cyan-500 text-black"
              >
                + Waffe anlegen
              </button>
            </div>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isWeapon = isItemWeapon(item);
            const isArmor = isItemArmor(item);
            const isEquipped = item.status !== 'stored';

            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isEquipped 
                    ? "bg-zinc-950/80 border-zinc-800 hover:border-zinc-700 shadow-sm" 
                    : "bg-zinc-950/40 border-dashed border-amber-900/40 opacity-80 hover:opacity-100"
                }`}
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                  {/* Left: Name, Badges & Attributes */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {/* Name / Bezeichnung */}
                      <span className="font-bold text-sm text-white tracking-tight">
                        {item.name}
                      </span>

                      {/* Quantity */}
                      {(item.quantity || 1) > 1 && (
                        <span className="text-[10px] font-mono font-bold bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded border border-zinc-700">
                          {item.quantity}x
                        </span>
                      )}

                      {/* Category Badge */}
                      <span className={`text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 rounded border ${
                        isWeapon 
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                          : isArmor 
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                          : item.category === 'ammo'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                      }`}>
                        {isWeapon ? (determineWeaponType(item) === 'melee' ? '⚔️ Nahkampf' : '🎯 Fernkampf') :
                         isArmor ? '🛡️ Panzerung' :
                         item.category === 'ammo' ? '📦 Munition' : '⚙️ Ausrüstung'}
                      </span>

                      {/* Rating / Stufe */}
                      {item.rating && (
                        <span className="text-[9px] font-mono bg-zinc-800 text-cyan-300 px-1.5 py-0.5 rounded border border-zinc-700">
                          Stufe {item.rating}
                        </span>
                      )}

                      {/* Interactive Status Switch (Am Mann vs Eingelagert) */}
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(item)}
                        title={isEquipped ? "Klicken zum Einlagern in der Unterkunft" : "Klicken zum Ausrüsten am Mann"}
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg border transition-all flex items-center gap-1 cursor-pointer ${
                          isEquipped
                            ? "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30"
                            : "bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30"
                        }`}
                      >
                        {isEquipped ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>🎒 Am Mann</span>
                          </>
                        ) : (
                          <>
                            <Home size={10} className="text-amber-400" />
                            <span>📦 Eingelagert</span>
                          </>
                        )}
                      </button>

                      {/* Location Badge (inline editable when stored) */}
                      {!isEquipped ? (
                        <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-300 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-lg">
                          <MapPin size={10} className="text-amber-400 shrink-0" />
                          <span className="text-zinc-500 mr-0.5">Ort:</span>
                          <input
                            type="text"
                            value={item.location || DEFAULT_STORAGE_LOCATION}
                            onChange={(e) => handleChangeLocation(item, e.target.value)}
                            className="bg-transparent text-amber-300 font-bold focus:outline-none focus:border-b focus:border-amber-400 max-w-[130px] truncate"
                            title="Lagerort direkt anpassen (Standard: Unterkunft)"
                          />
                        </div>
                      ) : (
                        <span className="text-[10px] font-mono text-emerald-400/80 bg-emerald-950/20 border border-emerald-900/30 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <span>Im Einsatz</span>
                        </span>
                      )}

                      {/* Regelbuch-Referenz / Buchseite */}
                      {item.page && (
                        <span className="text-[10px] font-mono text-amber-300/90 bg-amber-950/20 border border-amber-900/30 px-1.5 py-0.5 rounded flex items-center gap-1" title="Regelbuch-Referenz">
                          <BookOpen size={10} className="text-amber-400 shrink-0" />
                          <span>{item.page}</span>
                        </span>
                      )}

                      {/* Tägliche Nutzungen (z. B. Fanghandschuhe 2x/Tag) */}
                      {(() => {
                        const effectiveMax = item.maxUses !== undefined && item.maxUses > 0 
                          ? item.maxUses 
                          : extractDailyUsesFromText(item.notes, item.name);

                        const effectiveCurrent = item.currentUses !== undefined 
                          ? item.currentUses 
                          : (effectiveMax !== undefined ? effectiveMax : 0);

                        if (effectiveMax !== undefined && effectiveMax > 0) {
                          const isDepleted = effectiveCurrent <= 0;
                          return (
                            <div 
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono border transition-all shadow-sm ${
                                isDepleted
                                  ? 'bg-rose-950/50 border-rose-800/80 text-rose-300'
                                  : 'bg-indigo-950/60 border-indigo-700/70 text-indigo-200 hover:border-indigo-500'
                              }`}
                              title="Tägliche Nutzungen verwalten (+/- zum Verbrauchen oder Aufladen)"
                            >
                              <span className="text-[10px] uppercase tracking-wider font-sans font-bold text-zinc-400 flex items-center gap-1">
                                <span className="text-amber-400 font-bold">⚡</span>
                                <span>Ladungen:</span>
                              </span>
                              <span className="font-bold text-white tracking-tight">
                                {effectiveCurrent} / {effectiveMax}
                              </span>
                              <div className="flex items-center gap-1 ml-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    if (effectiveCurrent > 0) {
                                      const updated = inventory.map(i => i.id === item.id ? { 
                                        ...i, 
                                        maxUses: effectiveMax,
                                        currentUses: effectiveCurrent - 1 
                                      } : i);
                                      commitInventory(updated);
                                    }
                                  }}
                                  disabled={effectiveCurrent <= 0}
                                  title="1 Ladung verbrauchen (-)"
                                  className="w-5 h-5 flex items-center justify-center rounded bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-zinc-100 hover:text-white disabled:opacity-30 disabled:pointer-events-none text-xs font-black leading-none cursor-pointer border border-zinc-700 transition-colors"
                                >
                                  -
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    if (effectiveCurrent < effectiveMax) {
                                      const updated = inventory.map(i => i.id === item.id ? { 
                                        ...i, 
                                        maxUses: effectiveMax,
                                        currentUses: effectiveCurrent + 1 
                                      } : i);
                                      commitInventory(updated);
                                    }
                                  }}
                                  disabled={effectiveCurrent >= effectiveMax}
                                  title="1 Ladung aufladen (+)"
                                  className="w-5 h-5 flex items-center justify-center rounded bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-zinc-100 hover:text-white disabled:opacity-30 disabled:pointer-events-none text-xs font-black leading-none cursor-pointer border border-zinc-700 transition-colors"
                                >
                                  +
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    const nextUses = prompt(`Maximale Ladungen für "${item.name}" eingeben:`, String(effectiveMax));
                                    if (nextUses !== null) {
                                      const parsed = parseInt(nextUses, 10);
                                      const updated = inventory.map(i => i.id === item.id ? { 
                                        ...i, 
                                        maxUses: !isNaN(parsed) && parsed > 0 ? parsed : undefined,
                                        currentUses: !isNaN(parsed) && parsed > 0 ? parsed : undefined
                                      } : i);
                                      commitInventory(updated);
                                    }
                                  }}
                                  className="w-4 h-4 ml-0.5 flex items-center justify-center text-zinc-400 hover:text-white rounded hover:bg-zinc-800 text-[10px]"
                                  title="Ladungs-Maximum anpassen"
                                >
                                  ⚙
                                </button>
                              </div>
                            </div>
                          );
                        }

                        // Subtle button to set charges if none yet
                        return (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              const defaultUses = item.name.toLowerCase().includes('fanghandschuh') ? "2" : "1";
                              const promptVal = prompt(`Maximale Ladungen / Nutzungen pro Tag für "${item.name}" festlegen:`, defaultUses);
                              if (promptVal !== null) {
                                const parsed = parseInt(promptVal, 10);
                                if (!isNaN(parsed) && parsed > 0) {
                                  const updated = inventory.map(i => i.id === item.id ? { 
                                    ...i, 
                                    maxUses: parsed,
                                    currentUses: parsed 
                                  } : i);
                                  commitInventory(updated);
                                }
                              }
                            }}
                            className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-800/60 hover:bg-indigo-950/80 text-zinc-400 hover:text-indigo-200 border border-dashed border-zinc-700/60 hover:border-indigo-600/60 transition-all cursor-pointer opacity-80 hover:opacity-100"
                            title="Ladungen / Tägliche Nutzungen für diesen Gegenstand festlegen"
                          >
                            <span>⚡</span>
                            <span>+ Ladungen</span>
                          </button>
                        );
                      })()}
                    </div>

                    {/* Weapon / Armor Key-Value Attribute Bar */}
                    <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono mt-2">
                      {/* Weapon Values */}
                      {item.damage && (
                        <div className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-zinc-300">
                          <span className="text-[9px] text-zinc-500 uppercase mr-1">Schaden:</span>
                          <strong className="text-rose-400">{item.damage}</strong>
                        </div>
                      )}

                      {item.accuracy !== undefined && (
                        <div className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-zinc-300">
                          <span className="text-[9px] text-zinc-500 uppercase mr-1">Präzision:</span>
                          <strong className="text-cyan-300">{item.accuracy}</strong>
                        </div>
                      )}

                      {item.ap !== undefined && String(item.ap).trim() !== '' && (
                        <div className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-zinc-300">
                          <span className="text-[9px] text-zinc-500 uppercase mr-1">DK:</span>
                          <strong className="text-orange-400">{item.ap}</strong>
                        </div>
                      )}

                      {item.mode && (
                        <div className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-zinc-300">
                          <span className="text-[9px] text-zinc-500 uppercase mr-1">Modus:</span>
                          <span className="text-zinc-200">{item.mode}</span>
                        </div>
                      )}

                      {item.rc !== undefined && String(item.rc).trim() !== '' && (
                        <div className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-zinc-300">
                          <span className="text-[9px] text-zinc-500 uppercase mr-1">RK:</span>
                          <span className="text-zinc-200">{item.rc}</span>
                        </div>
                      )}

                      {item.ammo && (
                        <div className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-zinc-300">
                          <span className="text-[9px] text-zinc-500 uppercase mr-1">Munition:</span>
                          <span className="text-emerald-400">{item.ammo}</span>
                        </div>
                      )}

                      {/* Armor Values */}
                      {item.armorValue !== undefined && String(item.armorValue).trim() !== '' && (
                        <div className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-zinc-300">
                          <span className="text-[9px] text-zinc-500 uppercase mr-1">Panzerung:</span>
                          <strong className="text-blue-400">+{item.armorValue}</strong>
                        </div>
                      )}

                      {item.price && (
                        <div className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-zinc-400">
                          <span className="text-[9px] text-zinc-500 mr-1">Wert:</span>
                          <span>{item.price} ¥</span>
                        </div>
                      )}
                    </div>

                    {/* Notes & Effects */}
                    {item.notes && (
                      <p className="text-xs text-zinc-400 leading-relaxed mt-2 italic">
                        {item.notes}
                      </p>
                    )}
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
                      title="Bearbeiten"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-2 text-zinc-500 hover:text-red-400 rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
                      title="Entfernen"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Editor Modal for Adding / Editing Item */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-zinc-950 border border-cyan-500/40 rounded-3xl shadow-2xl p-6 overflow-y-auto max-h-[90vh] text-zinc-100">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-5">
              <div className="flex items-center gap-2">
                <Backpack size={18} className="text-cyan-400" />
                <h3 className="text-base font-bold text-white">
                  {editingItemId ? "Gegenstand bearbeiten" : "Neuen Gegenstand ins Inventar aufnehmen"}
                </h3>
              </div>
              <button 
                onClick={() => setIsEditorOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4">
              {/* Row 1: Name, Category, Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1 font-mono">
                    Bezeichnung (Gegenstandsname) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="z. B. Ares Predator V, Panzerjacke, Medkit..."
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1 font-mono">
                    Kategorie
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as InventoryCategory)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="weapon">Waffe</option>
                    <option value="armor">Panzerung</option>
                    <option value="gear">Ausrüstung / Gear</option>
                    <option value="ammo">Munition</option>
                    <option value="consumable">Verbrauchsgut</option>
                    <option value="electronics">Elektronik</option>
                    <option value="other">Sonstiges</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Status & Lagerort (Standard: Unterkunft) */}
              <div className="p-3 bg-zinc-900/70 border border-zinc-800 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                <div>
                  <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1 font-mono">
                    Tragestatus
                  </label>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFormStatus('equipped')}
                      className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-mono font-bold transition-all ${
                        formStatus === 'equipped'
                          ? "bg-emerald-500 text-black shadow-md"
                          : "bg-zinc-800 text-zinc-400 hover:text-white"
                      }`}
                    >
                      🎒 Am Mann
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormStatus('stored')}
                      className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-mono font-bold transition-all ${
                        formStatus === 'stored'
                          ? "bg-amber-500 text-black shadow-md"
                          : "bg-zinc-800 text-zinc-400 hover:text-white"
                      }`}
                    >
                      📦 Eingelagert
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1 font-mono flex items-center gap-1">
                    <Home size={10} className="text-amber-400" />
                    <span>Lagerort (Standard: Unterkunft)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Unterkunft / Safehouse..."
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1 font-mono">
                      Menge
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formQuantity}
                      onChange={(e) => setFormQuantity(parseInt(e.target.value, 10) || 1)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-2 py-1.5 text-xs text-white text-center font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1 font-mono">
                      Stufe
                    </label>
                    <input
                      type="text"
                      placeholder="z.B. 4"
                      value={formRating}
                      onChange={(e) => setFormRating(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-2 py-1.5 text-xs text-white text-center font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Weapon Specific Fields */}
              <div className="p-3 bg-rose-950/20 border border-rose-900/30 rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-rose-900/40 pb-1.5">
                  <span className="text-[10px] uppercase font-mono font-bold text-rose-300 flex items-center gap-1.5">
                    <Crosshair size={12} />
                    Waffenwerte (Füllt automatisch das Waffenarsenal am Mann)
                  </span>
                  <div className="flex gap-2 text-[10px] font-mono">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="wtype"
                        checked={formWeaponType === 'melee'}
                        onChange={() => setFormWeaponType('melee')}
                      />
                      <span>Nahkampf</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="wtype"
                        checked={formWeaponType === 'ranged'}
                        onChange={() => setFormWeaponType('ranged')}
                      />
                      <span>Fernkampf</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[9px] uppercase font-mono text-zinc-400 mb-0.5">
                      Schaden
                    </label>
                    <input
                      type="text"
                      placeholder="z. B. 8K, 11K, 1W8"
                      value={formDamage}
                      onChange={(e) => setFormDamage(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase font-mono text-zinc-400 mb-0.5">
                      Präzision
                    </label>
                    <input
                      type="text"
                      placeholder="z. B. 5, 7"
                      value={formAccuracy}
                      onChange={(e) => setFormAccuracy(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase font-mono text-zinc-400 mb-0.5">
                      DK (Durchschlag)
                    </label>
                    <input
                      type="text"
                      placeholder="z. B. -1, -3"
                      value={formAp}
                      onChange={(e) => setFormAp(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase font-mono text-zinc-400 mb-0.5">
                      Modus
                    </label>
                    <input
                      type="text"
                      placeholder="z. B. HM, SF, AM"
                      value={formMode}
                      onChange={(e) => setFormMode(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[9px] uppercase font-mono text-zinc-400 mb-0.5">
                      Rückstoßkomp. (RK)
                    </label>
                    <input
                      type="text"
                      placeholder="z. B. 2"
                      value={formRc}
                      onChange={(e) => setFormRc(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase font-mono text-zinc-400 mb-0.5">
                      Munition
                    </label>
                    <input
                      type="text"
                      placeholder="z. B. 15 (c), 42/42"
                      value={formAmmo}
                      onChange={(e) => setFormAmmo(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase font-mono text-zinc-400 mb-0.5">
                      Angriffswert / Pool
                    </label>
                    <input
                      type="text"
                      placeholder="z. B. 14 W6"
                      value={formAttackPool}
                      onChange={(e) => setFormAttackPool(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Armor Specific Fields */}
              <div className="p-3 bg-blue-950/20 border border-blue-900/30 rounded-2xl">
                <div className="flex items-center gap-1.5 border-b border-blue-900/40 pb-1.5 mb-2">
                  <Shield size={12} className="text-blue-400" />
                  <span className="text-[10px] uppercase font-mono font-bold text-blue-300">
                    Panzerungswerte
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] uppercase font-mono text-zinc-400 mb-0.5">
                      Panzerungswert
                    </label>
                    <input
                      type="text"
                      placeholder="z. B. 12 oder +2"
                      value={formArmorValue}
                      onChange={(e) => setFormArmorValue(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase font-mono text-zinc-400 mb-0.5">
                      Preis (Nuyen ¥)
                    </label>
                    <input
                      type="text"
                      placeholder="z. B. 1000"
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Regelbuch-Referenz / Buchseite & Tägliche Nutzungen */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1 font-mono flex items-center gap-1">
                    <BookOpen size={11} className="text-amber-400" />
                    <span>Regelbuch / Buchseite</span>
                  </label>
                  <input
                    type="text"
                    placeholder="z. B. GRW S. 158"
                    value={formPage}
                    onChange={(e) => setFormPage(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-indigo-400 uppercase tracking-wider mb-1 font-mono">
                    Tägliche Nutzungen (Max/Tag)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={99}
                    placeholder="z. B. 2 (Fanghandschuhe)"
                    value={formMaxUses}
                    onChange={(e) => setFormMaxUses(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1 font-mono">
                  Anmerkungen, Upgrades & Modifikationen
                </label>
                <textarea
                  rows={2}
                  placeholder="Smartlink, Schalldämpfer, Sensorstufe, Isolierung, Tragekomfort..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-xs text-zinc-400 hover:text-white cursor-pointer"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold shadow-md cursor-pointer"
                >
                  {editingItemId ? "Änderungen speichern" : "Gegenstand ins Inventar aufnehmen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preset Catalog Modal */}
      {isPresetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-3xl bg-zinc-950 border border-cyan-500/40 rounded-3xl shadow-2xl p-6 overflow-y-auto max-h-[90vh] text-zinc-100">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-cyan-400" />
                <div>
                  <h3 className="text-base font-bold text-white">
                    Ausrüstung- & Waffen-Katalog (Shadowrun 5e)
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Wähle vorgefertigte Waffen, Panzerungen und Ausrüstungen zur Übernahme ins Inventar
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsPresetModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {INVENTORY_PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <h4 className="font-bold text-white text-sm">{preset.name}</h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[9px] font-mono uppercase bg-zinc-800 px-1.5 py-0.2 rounded text-cyan-300">
                            {preset.category}
                          </span>
                          {preset.damage && (
                            <span className="text-[9px] font-mono text-rose-400 font-bold">
                              {preset.damage}
                            </span>
                          )}
                          {preset.accuracy !== undefined && (
                            <span className="text-[9px] font-mono text-cyan-300">
                              Präz. {preset.accuracy}
                            </span>
                          )}
                          {preset.ap !== undefined && (
                            <span className="text-[9px] font-mono text-orange-400">
                              AP {preset.ap}
                            </span>
                          )}
                          {preset.armorValue && (
                            <span className="text-[9px] font-mono text-blue-400 font-bold">
                              Panzerung +{preset.armorValue}
                            </span>
                          )}
                          {preset.price && (
                            <span className="text-[9px] font-mono text-zinc-500">
                              {preset.price} ¥
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddPreset(preset)}
                        className="px-2.5 py-1 rounded-xl text-xs font-bold bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-black border border-cyan-500/30 transition-all flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <Plus size={12} />
                        <span>Hinzufügen</span>
                      </button>
                    </div>

                    <p className="text-xs text-zinc-400 line-clamp-2 mt-1">
                      {preset.notes}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4 border-t border-zinc-800 mt-4">
              <button
                type="button"
                onClick={() => setIsPresetModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
