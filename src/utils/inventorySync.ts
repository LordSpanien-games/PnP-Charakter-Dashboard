import { CharacterData, InventoryItem, Weapon, ItemLocationStatus, InventoryCategory } from "../types";

export const DEFAULT_STORAGE_LOCATION = "Unterkunft";

/**
 * Extracts daily usage limit or charges from usage/notes string or item name
 * (e.g. "2x/Tag", "1x am Tag", "3 Ladungen", "Ladungen: 5", "Fanghandschuhe")
 */
export const extractDailyUsesFromText = (text?: string, name?: string): number | undefined => {
  if (name) {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('fanghandschuh')) return 2;
    if (lowerName.includes('kriegsmaske des schreckens')) return 1;
    if (lowerName.includes('geisterhaftes geräusch')) return 1;
    if (lowerName.includes('tanzende lichter')) return 1;
    if (lowerName.includes('mit tieren sprechen')) return 1;
    if (lowerName.includes('widerstandsfähigkeit') || lowerName.includes('resiliency')) return 1;
  }
  if (!text) return undefined;

  // 1. Matches "2x/Tag", "1x täglich", "3x am Tag", "1x pro Tag", "2/Tag", "2x/Rast"
  const matchDaily = text.match(/(\d+)\s*(?:x|\/|\s*mal)?\s*(?:\/|\s*(?:am|pro|je)?\s*)?(?:tag|täglich|day|daily|rast|rest)/i);
  if (matchDaily) {
    const num = parseInt(matchDaily[1], 10);
    if (!isNaN(num) && num > 0) return num;
  }

  // 2. Matches "2 Ladungen", "Ladungen: 5", "3 charges", "5 Nutzungen"
  const matchCharges = text.match(/(?:ladungen|charges|nutzungen|uses)\s*[:=]?\s*(\d+)/i) || 
                       text.match(/(\d+)\s*(?:ladung|ladungen|charges?|nutzung|nutzungen|uses?)/i);
  if (matchCharges) {
    const num = parseInt(matchCharges[1], 10);
    if (!isNaN(num) && num > 0) return num;
  }

  return undefined;
};

/**
 * Checks whether an inventory item has explicit weapon attributes or category
 */
export const isItemWeapon = (item: Partial<InventoryItem>): boolean => {
  if (item.category === 'weapon') return true;
  if (item.weaponType === 'melee' || item.weaponType === 'ranged') return true;
  if (item.damage && item.damage.trim() !== '') return true;
  if (item.accuracy !== undefined && String(item.accuracy).trim() !== '') return true;
  if (item.ap !== undefined && String(item.ap).trim() !== '') return true;
  if (item.mode && item.mode.trim() !== '') return true;
  if (item.rc !== undefined && String(item.rc).trim() !== '') return true;
  if (item.ammo && item.ammo.trim() !== '') return true;
  return false;
};

/**
 * Checks whether an inventory item has armor attributes or category
 */
export const isItemArmor = (item: Partial<InventoryItem>): boolean => {
  if (item.category === 'armor') return true;
  if (item.armorValue !== undefined && String(item.armorValue).trim() !== '') return true;
  const l = (item.name || '').toLowerCase();
  return (
    l.includes('panzer') || 
    l.includes('rüstung') || 
    l.includes('armor') || 
    l.includes('jacke') || 
    l.includes('weste') || 
    l.includes('helm')
  );
};

/**
 * Determines whether a weapon item is melee or ranged
 */
export const determineWeaponType = (item: Partial<InventoryItem>): 'melee' | 'ranged' => {
  if (item.weaponType === 'melee') return 'melee';
  if (item.weaponType === 'ranged') return 'ranged';
  if (item.range && item.range.trim() !== '') return 'ranged';
  if (item.mode && item.mode.trim() !== '') return 'ranged';
  if (item.ammo && item.ammo.trim() !== '') return 'ranged';
  if (item.rc !== undefined && String(item.rc).trim() !== '') return 'ranged';

  const l = (item.name || '').toLowerCase();
  if (
    l.includes('schwert') ||
    l.includes('klinge') ||
    l.includes('messer') ||
    l.includes('dagger') ||
    l.includes('sword') ||
    l.includes('knüppel') ||
    l.includes('stab') ||
    l.includes('hammer') ||
    l.includes('faust') ||
    l.includes('peitsche') ||
    l.includes('speer') ||
    l.includes('axt') ||
    l.includes('monofilament')
  ) {
    return 'melee';
  }
  return 'ranged';
};

/**
 * Converts an equipped InventoryItem into a Weapon object for weapons.melee or weapons.ranged
 */
export const inventoryItemToWeapon = (item: InventoryItem): Weapon => {
  const isMelee = determineWeaponType(item) === 'melee';

  // Format note with metadata (Modus, RK, Munition, Präzision, etc.)
  const noteParts: string[] = [];
  if (item.mode) noteParts.push(`Modus: ${item.mode}`);
  if (item.rc !== undefined && String(item.rc).trim() !== '') noteParts.push(`RK: ${item.rc}`);
  if (item.ammo) noteParts.push(`Munition: ${item.ammo}`);
  if (item.accuracy !== undefined && String(item.accuracy).trim() !== '') noteParts.push(`Präzision: ${item.accuracy}`);
  if (item.rating) noteParts.push(`Stufe ${item.rating}`);
  if (item.notes && item.notes.trim() !== '') noteParts.push(item.notes.trim());

  let apString = '';
  if (item.ap !== undefined && String(item.ap).trim() !== '') {
    const rawAp = String(item.ap).trim();
    if (rawAp.includes('/') || rawAp.startsWith('x') || rawAp.includes('19-20') || rawAp.includes('20')) {
      apString = rawAp;
    } else {
      apString = rawAp.toLowerCase().startsWith('ap') || rawAp.toLowerCase().startsWith('dk') ? rawAp : `DK ${rawAp}`;
    }
  }

  let attackStr = '+0';
  if (item.attackPool) {
    attackStr = String(item.attackPool);
  } else if (item.accuracy !== undefined && String(item.accuracy).trim() !== '') {
    const rawAcc = String(item.accuracy).trim();
    if (rawAcc.includes('/') || rawAcc.startsWith('+') || rawAcc.startsWith('-')) {
      attackStr = rawAcc;
    } else {
      attackStr = `Präz. ${rawAcc}`;
    }
  }

  return {
    name: item.name,
    attack: attackStr,
    damage: item.damage || "1W6",
    critical: apString || (item.accuracy ? `Präz. ${item.accuracy}` : "0"),
    note: noteParts.join(" • ") || "Am Mann getragen",
    range: item.range || (isMelee ? undefined : "Normal"),
  };
};

/**
 * Synchronizes inventory items into weapons.melee and weapons.ranged.
 * ONLY items that are marked as 'equipped' (Am Mann) and are weapons are included.
 * Stored items remain in inventory but are not active on the combat sheet.
 */
export const syncInventoryToWeapons = (
  inventory: InventoryItem[]
): { melee: Weapon[]; ranged: Weapon[] } => {
  const melee: Weapon[] = [];
  const ranged: Weapon[] = [];

  for (const item of inventory) {
    // Only equipped items (Am Mann) appear on active combat sheet!
    if (item.status === 'stored') continue;
    if (!isItemWeapon(item)) continue;

    const wType = determineWeaponType(item);
    const weaponObj = inventoryItemToWeapon(item);

    if (wType === 'melee') {
      melee.push(weaponObj);
    } else {
      ranged.push(weaponObj);
    }
  }

  return { melee, ranged };
};

/**
 * Initializes or migrates a character's inventory if none exists yet,
 * preserving all existing weapons and items from character.weapons and character.abilities.
 */
export const initializeCharacterInventory = (character: CharacterData): InventoryItem[] => {
  if (character.inventory && character.inventory.length > 0) {
    // Ensure all items have a location, status, and detect daily usages if missing
    return character.inventory.map(item => {
      let maxUses = item.maxUses;
      let currentUses = item.currentUses;

      if (maxUses === undefined) {
        const detected = extractDailyUsesFromText(item.notes, item.name);
        if (detected !== undefined) {
          maxUses = detected;
          currentUses = detected;
        }
      }

      return {
        ...item,
        status: item.status || 'equipped',
        location: item.location || DEFAULT_STORAGE_LOCATION,
        maxUses,
        currentUses: currentUses !== undefined ? currentUses : maxUses
      };
    });
  }

  const newInventory: InventoryItem[] = [];

  // 1. Migrate Melee Weapons
  if (character.weapons?.melee) {
    character.weapons.melee.forEach((w, idx) => {
      // Try to parse AP from critical
      const apMatch = (w.critical || "").match(/-?\d+/);
      const ap = apMatch ? apMatch[0] : undefined;

      newInventory.push({
        id: `migrated-melee-${idx}-${Date.now()}`,
        name: w.name,
        category: 'weapon',
        weaponType: 'melee',
        status: 'equipped',
        location: DEFAULT_STORAGE_LOCATION,
        damage: w.damage,
        ap: ap,
        attackPool: w.attack,
        notes: w.note,
        quantity: 1
      });
    });
  }

  // 2. Migrate Ranged Weapons
  if (character.weapons?.ranged) {
    character.weapons.ranged.forEach((w, idx) => {
      const apMatch = (w.critical || "").match(/-?\d+/);
      const ap = apMatch ? apMatch[0] : undefined;

      // Extract ammo if in note
      const ammoMatch = (w.note || "").match(/(\d+\s*Schuss|\d+\s*\([a-z]\))/i);
      const ammo = ammoMatch ? ammoMatch[0] : undefined;

      newInventory.push({
        id: `migrated-ranged-${idx}-${Date.now()}`,
        name: w.name,
        category: 'weapon',
        weaponType: 'ranged',
        status: 'equipped',
        location: DEFAULT_STORAGE_LOCATION,
        damage: w.damage,
        ap: ap,
        attackPool: w.attack,
        ammo: ammo,
        range: w.range,
        notes: w.note,
        quantity: 1
      });
    });
  }

  // 3. Migrate items from abilities if type === 'item'
  if (character.abilities) {
    character.abilities.forEach((a, idx) => {
      if (a.type === 'item') {
        const isArmor = isItemArmor({ name: a.name, notes: a.effect });
        const detectedUses = a.maxUses ?? extractDailyUsesFromText(a.usage, a.name) ?? extractDailyUsesFromText(a.effect, a.name);
        newInventory.push({
          id: `migrated-item-${idx}-${Date.now()}`,
          name: a.name,
          category: isArmor ? 'armor' : 'gear',
          status: 'equipped',
          location: DEFAULT_STORAGE_LOCATION,
          notes: a.effect,
          page: a.page,
          maxUses: detectedUses,
          currentUses: a.currentUses !== undefined ? a.currentUses : detectedUses,
          quantity: 1
        });
      }
    });
  }

  // 4. For Shadowrun characters: ensure armor (Panzerung) is present as an item if missing
  if (character.system === 'shadowrun') {
    const hasArmor = newInventory.some(i => isItemArmor(i));
    if (!hasArmor) {
      const armorStat = character.stats?.find(s => s.label.toLowerCase().includes('panzerung'))?.value;
      newInventory.push({
        id: `sr-armor-${Date.now()}`,
        name: "Panzerjacke",
        category: 'armor',
        armorValue: armorStat || 12,
        status: 'equipped',
        location: DEFAULT_STORAGE_LOCATION,
        notes: "Standard-Panzerjacke für Straßeneinsätze (Panzerung 12)",
        quantity: 1
      });
    }

    // Add Commlink if missing
    const hasCommlink = newInventory.some(i => i.name.toLowerCase().includes('commlink'));
    if (!hasCommlink) {
      newInventory.push({
        id: `sr-commlink-${Date.now()}`,
        name: "Transys Avalon Commlink",
        category: 'electronics',
        rating: 6,
        status: 'equipped',
        location: DEFAULT_STORAGE_LOCATION,
        notes: "High-End Commlink (Gerätestufe 6) mit Sim-Modul & Subvokal-Mikrofon",
        quantity: 1
      });
    }

    // Add Medkit if missing
    const hasMedkit = newInventory.some(i => i.name.toLowerCase().includes('medkit'));
    if (!hasMedkit) {
      newInventory.push({
        id: `sr-medkit-${Date.now()}`,
        name: "Erste-Hilfe-Kasten (Medkit)",
        category: 'consumable',
        rating: 4,
        status: 'equipped',
        location: DEFAULT_STORAGE_LOCATION,
        notes: "Stufe 4 Notfall-Traumakit für Feldeinsätze",
        quantity: 1
      });
    }
  }

  return newInventory;
};
