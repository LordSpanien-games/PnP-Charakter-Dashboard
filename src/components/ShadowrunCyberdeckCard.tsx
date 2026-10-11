import React, { FC, useState, useMemo } from 'react';
import { 
  Laptop, 
  Terminal, 
  Plus, 
  Trash2, 
  Edit2, 
  Power, 
  Shield, 
  Zap, 
  Sparkles, 
  ArrowLeftRight, 
  Radio, 
  Sliders, 
  Check, 
  X, 
  Cpu, 
  Wifi, 
  Eye, 
  EyeOff, 
  Layers, 
  Skull, 
  AlertTriangle,
  RotateCcw,
  Swords,
  Ghost,
  Activity,
  HardDrive
} from 'lucide-react';
import { 
  CharacterData, 
  ShadowrunCyberdeck, 
  ShadowrunDeckProgram, 
  ShadowrunMatrixAttribute,
  ShadowrunDeckProgramModifiers 
} from '../types';
import { 
  CYBERDECK_PRESETS, 
  PROGRAM_PRESETS, 
  calculateEffectiveDeckAttributes, 
  getMaxProgramSlots, 
  getActiveProgramCount,
  getMatrixInitiative,
  DeckModelPreset
} from '../utils/cyberdeck';

interface ShadowrunCyberdeckCardProps {
  character: CharacterData;
  onUpdateCyberdeck: (deck: ShadowrunCyberdeck | undefined) => void;
  isEditing?: boolean;
}

export const ShadowrunCyberdeckCard: FC<ShadowrunCyberdeckCardProps> = ({
  character,
  onUpdateCyberdeck,
  isEditing = false
}) => {
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showAddProgramModal, setShowAddProgramModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState<ShadowrunDeckProgram | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<'all' | 'active' | 'hacking' | 'standard'>('all');

  // New program state
  const [newProgName, setNewProgName] = useState('');
  const [newProgType, setNewProgType] = useState<'hacking' | 'standard' | 'special'>('hacking');
  const [newProgDesc, setNewProgDesc] = useState('');
  const [newProgDiceMod, setNewProgDiceMod] = useState<number>(0);
  const [newProgSkill, setNewProgSkill] = useState<string>('Hacking');
  const [newProgAttrBoost, setNewProgAttrBoost] = useState<{ attr: ShadowrunMatrixAttribute | 'none'; val: number }>({ attr: 'none', val: 1 });
  const [newProgSpecialNote, setNewProgSpecialNote] = useState('');

  // Edit Deck specs state
  const [deckName, setDeckName] = useState(character.cyberdeck?.name || 'Erika MCD-1');
  const [deckManufacturer, setDeckManufacturer] = useState(character.cyberdeck?.manufacturer || 'Erika');
  const [deckRating, setDeckRating] = useState<number>(character.cyberdeck?.deviceRating || 2);
  const [deckArrayValues, setDeckArrayValues] = useState<[number, number, number, number]>(
    character.cyberdeck?.attributeArray || [4, 3, 2, 1]
  );

  const [presetTierFilter, setPresetTierFilter] = useState<'all' | 'tier1_4' | 'tier5_6' | 'tier7_12'>('all');

  const deck = character.cyberdeck;

  // Filtered program list (MUST be defined unconditionally at the top of the component with other hooks)
  const filteredPrograms = useMemo(() => {
    if (!deck?.programs) return [];
    return deck.programs.filter(p => {
      if (selectedCategoryFilter === 'active') return p.isActive;
      if (selectedCategoryFilter === 'hacking') return p.type === 'hacking';
      if (selectedCategoryFilter === 'standard') return p.type === 'standard';
      return true;
    });
  }, [deck?.programs, selectedCategoryFilter]);

  // Filter presets based on tier
  const filteredPresets = CYBERDECK_PRESETS.filter(p => {
    if (presetTierFilter === 'tier1_4') return p.deviceRating <= 4;
    if (presetTierFilter === 'tier5_6') return p.deviceRating >= 5 && p.deviceRating <= 6;
    if (presetTierFilter === 'tier7_12') return p.deviceRating >= 7;
    return true;
  });

  // Helper for badge colors and category labels across any rating (1-12+)
  const getRatingBadge = (rating: number) => {
    if (rating <= 2) {
      return {
        label: `Stufe ${rating}`,
        tier: 'Street-Tier',
        className: 'bg-zinc-800/80 border-zinc-700 text-zinc-300'
      };
    }
    if (rating <= 4) {
      return {
        label: `Stufe ${rating}`,
        tier: 'Standard',
        className: 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
      };
    }
    if (rating <= 6) {
      return {
        label: `Stufe ${rating}`,
        tier: 'High-End',
        className: 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300'
      };
    }
    if (rating <= 9) {
      return {
        label: `Stufe ${rating}`,
        tier: 'Mil-Spec',
        className: 'bg-purple-950/80 border-purple-500/40 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
      };
    }
    return {
      label: `Stufe ${rating}`,
      tier: 'Black-Ops / Quantum',
      className: 'bg-amber-950/80 border-amber-500/40 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
    };
  };

  // Save Deck Specs modal (works for both existing deck and new deck initialization)
  const handleSaveDeckSpecs = () => {
    const newConfig = {
      attack: deckArrayValues[0],
      sleaze: deckArrayValues[1],
      dataProcessing: deckArrayValues[2],
      firewall: deckArrayValues[3]
    };

    const newMaxDamage = 8 + Math.ceil(deckRating / 2);
    const existingDamage = deck?.matrixCondition?.damage || 0;

    const baseDeck: ShadowrunCyberdeck = deck || {
      name: deckName || 'Custom Cyberdeck',
      manufacturer: deckManufacturer || 'Eigenbau',
      deviceRating: deckRating,
      attributeArray: [...deckArrayValues],
      configuration: newConfig,
      matrixCondition: {
        max: newMaxDamage,
        damage: 0
      },
      programs: [
        {
          id: 'prog-1',
          name: 'Ausnutzen (Exploit)',
          type: 'hacking',
          isActive: true,
          description: 'Gibt +2 Würfelpool für Hacking-Proben gegen Geräte, Marken oder Daten.',
          modifiers: { dicePoolMod: 2, applicableSkills: ['Hacking'], notes: '+2 Würfelpool auf Hacking' }
        },
        {
          id: 'prog-2',
          name: 'Tarnung (Stealth)',
          type: 'hacking',
          isActive: true,
          description: 'Erhöht den Schleicher-Wert des Decks um +1 und gibt +1 Würfelpool auf Schleicher-Handlungen.',
          modifiers: {
            attributeBoost: { attribute: 'sleaze', value: 1 },
            dicePoolMod: 1,
            applicableSkills: ['Hacking', 'Schleichen'],
            notes: '+1 Schleicher & +1 Würfelpool auf Schleichen'
          }
        },
        {
          id: 'prog-3',
          name: 'Panzerung (Armor)',
          type: 'hacking',
          isActive: false,
          description: 'Gibt +2 Würfel auf Schadenswiderstand gegen Matrixschaden.',
          modifiers: { matrixDamageResistance: 2, notes: '+2 auf Matrix-Schadenswiderstand' }
        },
        {
          id: 'prog-4',
          name: 'Hammer',
          type: 'hacking',
          isActive: false,
          description: 'Erhöht den angerichteten Matrixschaden bei Cyberkampf-Angriffen um +2.',
          modifiers: { damageBonus: 2, applicableSkills: ['Cyberkampf'], notes: '+2 Matrixschaden bei Cyberkampf' }
        },
        {
          id: 'prog-5',
          name: 'Schmöker (Browse)',
          type: 'standard',
          isActive: false,
          description: 'Gibt +2 Würfelpool auf Matrixsuche (Computer) und halbiert die erforderliche Suchzeit.',
          modifiers: { dicePoolMod: 2, applicableSkills: ['Computer'], notes: '+2 Würfelpool auf Matrixsuche' }
        },
        {
          id: 'prog-6',
          name: 'Verschlüsselung (Encryption)',
          type: 'standard',
          isActive: false,
          description: 'Erhöht das Firewall-Attribut des Cyberdecks permanent um +1.',
          modifiers: { attributeBoost: { attribute: 'firewall', value: 1 }, notes: '+1 Firewall-Attribut' }
        },
        {
          id: 'prog-7',
          name: 'Virtuelle Maschine (Virtual Machine)',
          type: 'standard',
          isActive: false,
          description: 'Schafft zwei zusätzliche virtuelle Programmplätze (+2 Slots).',
          modifiers: { extraProgramSlots: 2, notes: '+2 zusätzliche Programmplätze' }
        }
      ],
      mode: 'hot-vr'
    };

    onUpdateCyberdeck({
      ...baseDeck,
      name: deckName,
      manufacturer: deckManufacturer,
      deviceRating: deckRating,
      attributeArray: [...deckArrayValues],
      configuration: newConfig,
      matrixCondition: {
        max: newMaxDamage,
        damage: Math.min(existingDamage, newMaxDamage)
      }
    });
    setShowConfigModal(false);
  };

  // Reusable configuration modal
  const renderConfigModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in text-left">
      <div className="bg-zinc-950 border border-emerald-500/40 rounded-2xl p-6 max-w-xl w-full space-y-4 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2 text-emerald-400">
            <Sliders size={18} />
            <div>
              <h4 className="text-sm font-black font-mono uppercase tracking-wider text-white">
                Cyberdeck & Werte-Array Konfigurieren
              </h4>
              <p className="text-[10px] font-mono text-zinc-400">
                Wähle ein Modell (Stufe 1 bis 12+) oder stelle eigene Spezifikationen ein
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => setShowConfigModal(false)}
            className="text-zinc-500 hover:text-white p-1 rounded-full cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Presets Selector with Tier Filter */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <label className="text-[10px] font-mono uppercase text-zinc-400 font-bold block">
              Vorlage aus Shadowrun-Katalogen wählen:
            </label>
            {/* Filter Tabs */}
            <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 text-[10px] font-mono">
              <button
                type="button"
                onClick={() => setPresetTierFilter('all')}
                className={`px-2 py-0.5 rounded cursor-pointer ${presetTierFilter === 'all' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                Alle ({CYBERDECK_PRESETS.length})
              </button>
              <button
                type="button"
                onClick={() => setPresetTierFilter('tier1_4')}
                className={`px-2 py-0.5 rounded cursor-pointer ${presetTierFilter === 'tier1_4' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                Stufe 1–4
              </button>
              <button
                type="button"
                onClick={() => setPresetTierFilter('tier5_6')}
                className={`px-2 py-0.5 rounded cursor-pointer ${presetTierFilter === 'tier5_6' ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                Stufe 5–6
              </button>
              <button
                type="button"
                onClick={() => setPresetTierFilter('tier7_12')}
                className={`px-2 py-0.5 rounded cursor-pointer ${presetTierFilter === 'tier7_12' ? 'bg-purple-950 text-purple-300 border border-purple-500/40 font-bold' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                Stufe 7–12
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
            {filteredPresets.map((preset, idx) => {
              const badge = getRatingBadge(preset.deviceRating);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setDeckName(preset.name);
                    setDeckManufacturer(preset.manufacturer);
                    setDeckRating(preset.deviceRating);
                    setDeckArrayValues([...preset.attributeArray]);
                  }}
                  className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-emerald-500/50 text-left transition-all cursor-pointer group"
                >
                  <div className="text-xs font-mono font-bold text-white flex items-center justify-between gap-1">
                    <span className="truncate group-hover:text-emerald-300 transition-colors">{preset.name}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold border shrink-0 ${badge.className}`}>
                      {badge.label}
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-zinc-400 flex items-center justify-between mt-1">
                    <span className="text-zinc-500 truncate">{preset.manufacturer}</span>
                    <span className="text-emerald-400 font-bold">[{preset.attributeArray.join(', ')}]</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Values */}
        <div className="space-y-3 pt-3 border-t border-zinc-800">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-[10px] font-mono uppercase text-zinc-400 font-bold block mb-1">
                Modellbezeichnung:
              </label>
              <input
                type="text"
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-750 rounded-lg px-3 py-1.5 text-xs font-mono text-white"
                placeholder="z.B. Fairlight Excalibur"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-zinc-400 font-bold block mb-1">
                Hersteller:
              </label>
              <input
                type="text"
                value={deckManufacturer}
                onChange={(e) => setDeckManufacturer(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-750 rounded-lg px-3 py-1.5 text-xs font-mono text-white"
                placeholder="z.B. Fairlight Systems"
              />
            </div>
          </div>

          {/* Gerätestufe Section with Quick Pills */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-mono uppercase text-emerald-400 font-bold flex items-center gap-1.5">
                <span>Gerätestufe (Stufe 1 bis 12+):</span>
                <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold border ${getRatingBadge(deckRating).className}`}>
                  {getRatingBadge(deckRating).tier}
                </span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setDeckArrayValues([deckRating + 3, deckRating + 2, deckRating + 1, deckRating]);
                }}
                className="text-[10px] font-mono text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
                title="Berechnet das Standard-Array nach Shadowrun-Regeln: [Stufe+3, Stufe+2, Stufe+1, Stufe]"
              >
                Standard-Array für Stufe {deckRating} berechnen
              </button>
            </div>

            {/* Quick Stufen Pills */}
            <div className="flex items-center gap-1 flex-wrap">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => {
                    setDeckRating(lvl);
                  }}
                  className={`px-2 py-1 rounded text-[10px] font-mono font-bold border transition-all cursor-pointer ${
                    deckRating === lvl
                      ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700'
                  }`}
                >
                  Stufe {lvl}
                </button>
              ))}
            </div>

            <div className="pt-1">
              <input
                type="number"
                min={1}
                max={25}
                value={deckRating}
                onChange={(e) => setDeckRating(Math.max(1, Math.min(25, parseInt(e.target.value, 10) || 1)))}
                className="w-full bg-zinc-900 border border-zinc-750 focus:border-emerald-500 rounded-lg px-3 py-1.5 text-xs font-mono text-white font-bold"
                placeholder="Freie Gerätestufe eingeben (z.B. 7, 8, 10, 12)..."
              />
            </div>
          </div>

          {/* 4 Konfigurationswerte festlegen */}
          <div>
            <label className="text-[10px] font-mono uppercase text-emerald-400 font-bold block mb-1">
              Die 4 Werte für die Attribut-Konfiguration (Array):
            </label>
            <p className="text-[10px] font-mono text-zinc-500 mb-2">
              Diese 4 Werte können im Einsatz jederzeit auf Angriff, Schleicher, DV und Firewall verteilt werden.
            </p>
            <div className="grid grid-cols-4 gap-2">
              {deckArrayValues.map((val, idx) => (
                <div key={idx} className="text-center">
                  <span className="text-[9px] font-mono text-zinc-500 block mb-1">Wert #{idx + 1}</span>
                  <input
                    type="number"
                    min={0}
                    max={30}
                    value={val}
                    onChange={(e) => {
                      const num = parseInt(e.target.value, 10) || 0;
                      const copy = [...deckArrayValues] as [number, number, number, number];
                      copy[idx] = num;
                      setDeckArrayValues(copy);
                    }}
                    className="w-full text-center bg-zinc-900 border border-zinc-750 focus:border-emerald-500 rounded-lg px-2 py-1.5 text-sm font-mono font-bold text-white"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Deck Specs Info Preview */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-2.5 flex items-center justify-around text-center text-xs font-mono">
            <div>
              <span className="text-[10px] text-zinc-500 block">Programmplätze</span>
              <span className="text-emerald-400 font-bold">{deckRating} Slots</span>
            </div>
            <div className="w-px h-6 bg-zinc-800" />
            <div>
              <span className="text-[10px] text-zinc-500 block">Matrixschaden</span>
              <span className="text-red-400 font-bold">{8 + Math.ceil(deckRating / 2)} Kästchen</span>
            </div>
            <div className="w-px h-6 bg-zinc-800" />
            <div>
              <span className="text-[10px] text-zinc-500 block">Kategorie</span>
              <span className="text-cyan-400 font-bold">{getRatingBadge(deckRating).tier}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
          <button
            type="button"
            onClick={() => setShowConfigModal(false)}
            className="px-4 py-2 rounded-xl text-xs font-mono text-zinc-400 hover:text-white cursor-pointer"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={handleSaveDeckSpecs}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-xl text-xs font-mono font-bold cursor-pointer shadow-lg transition-all"
          >
            Änderungen Speichern
          </button>
        </div>
      </div>
    </div>
  );

  // Initialize a default deck if none exists
  const handleCreateDefaultDeck = (preset?: DeckModelPreset) => {
    const p = preset || CYBERDECK_PRESETS[0];
    const initialDeck: ShadowrunCyberdeck = {
      name: p.name,
      manufacturer: p.manufacturer,
      deviceRating: p.deviceRating,
      attributeArray: [...p.attributeArray],
      configuration: { ...p.defaultConfig },
      matrixCondition: {
        max: 8 + Math.ceil(p.deviceRating / 2),
        damage: 0
      },
      programs: [
        {
          id: 'prog-1',
          name: 'Ausnutzen (Exploit)',
          type: 'hacking',
          isActive: true,
          description: 'Gibt +2 Würfelpool für Hacking-Proben gegen Geräte, Marken oder Daten.',
          modifiers: {
            dicePoolMod: 2,
            applicableSkills: ['Hacking'],
            notes: '+2 Würfelpool auf Hacking'
          }
        },
        {
          id: 'prog-2',
          name: 'Tarnung (Stealth)',
          type: 'hacking',
          isActive: true,
          description: 'Erhöht den Schleicher-Wert des Decks um +1 und gibt +1 Würfelpool auf Schleicher-Handlungen.',
          modifiers: {
            attributeBoost: { attribute: 'sleaze', value: 1 },
            dicePoolMod: 1,
            applicableSkills: ['Hacking', 'Schleichen'],
            notes: '+1 Schleicher & +1 Würfelpool auf Schleichen'
          }
        },
        {
          id: 'prog-3',
          name: 'Panzerung (Armor)',
          type: 'hacking',
          isActive: false,
          description: 'Gibt +2 Würfel auf Schadenswiderstand gegen Matrixschaden.',
          modifiers: {
            matrixDamageResistance: 2,
            notes: '+2 auf Matrix-Schadenswiderstand'
          }
        },
        {
          id: 'prog-4',
          name: 'Hammer',
          type: 'hacking',
          isActive: false,
          description: 'Erhöht den angerichteten Matrixschaden bei Cyberkampf-Angriffen um +2.',
          modifiers: {
            damageBonus: 2,
            applicableSkills: ['Cyberkampf'],
            notes: '+2 Matrixschaden bei Cyberkampf'
          }
        },
        {
          id: 'prog-5',
          name: 'Schmöker (Browse)',
          type: 'standard',
          isActive: false,
          description: 'Gibt +2 Würfelpool auf Matrixsuche (Computer) und halbiert Suchzeit.',
          modifiers: {
            dicePoolMod: 2,
            applicableSkills: ['Computer'],
            notes: '+2 Würfelpool auf Matrixsuche'
          }
        },
        {
          id: 'prog-6',
          name: 'Verschlüsselung (Encryption)',
          type: 'standard',
          isActive: false,
          description: 'Erhöht das Firewall-Attribut des Cyberdecks permanent um +1.',
          modifiers: {
            attributeBoost: { attribute: 'firewall', value: 1 },
            notes: '+1 Firewall'
          }
        },
        {
          id: 'prog-7',
          name: 'Virtuelle Maschine (Virtual Machine)',
          type: 'standard',
          isActive: false,
          description: 'Schafft zwei zusätzliche Programmplätze (+2 Slots). Erzeugt +1 Kasten Matrixschaden bei Schaden.',
          modifiers: {
            extraProgramSlots: 2,
            notes: '+2 zusätzliche Programmplätze'
          }
        }
      ],
      mode: 'hot-vr'
    };
    onUpdateCyberdeck(initialDeck);
  };

  // If no deck is present, display rich call-to-action to equip a cyberdeck across any tier (1-12+)
  if (!deck) {
    return (
      <div className="bg-zinc-900/60 border border-emerald-500/30 rounded-2xl p-6 shadow-xl backdrop-blur-md relative overflow-hidden space-y-4">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
            <Laptop size={28} />
          </div>
          <div>
            <h3 className="text-lg font-black text-white tracking-tight uppercase">Cyberdeck & Matrix-Interface</h3>
            <p className="text-xs text-zinc-400 max-w-xl mx-auto mt-1 font-mono">
              Rüste ein Cyberdeck aus beliebigen Stufen (Stufe 1 bis 12+) aus, um Matrix-Attribute zu konfigurieren, Hacking-Programme zu laden und Proben-Boni in Echtzeit anzuwenden.
            </p>
          </div>
        </div>

        {/* Tier Filter Tabs */}
        <div className="flex items-center justify-center gap-1.5 flex-wrap pt-1">
          <button
            type="button"
            onClick={() => setPresetTierFilter('all')}
            className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
              presetTierFilter === 'all'
                ? 'bg-zinc-800 text-white border border-zinc-600 shadow-sm'
                : 'bg-zinc-900/80 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
            }`}
          >
            Alle Modelle ({CYBERDECK_PRESETS.length})
          </button>
          <button
            type="button"
            onClick={() => setPresetTierFilter('tier1_4')}
            className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
              presetTierFilter === 'tier1_4'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50 shadow-sm'
                : 'bg-zinc-900/80 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
            }`}
          >
            Stufe 1–4 (Standard)
          </button>
          <button
            type="button"
            onClick={() => setPresetTierFilter('tier5_6')}
            className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
              presetTierFilter === 'tier5_6'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-sm'
                : 'bg-zinc-900/80 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
            }`}
          >
            Stufe 5–6 (Elite)
          </button>
          <button
            type="button"
            onClick={() => setPresetTierFilter('tier7_12')}
            className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
              presetTierFilter === 'tier7_12'
                ? 'bg-purple-950 text-purple-300 border border-purple-500/50 shadow-sm'
                : 'bg-zinc-900/80 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
            }`}
          >
            Stufe 7–12 (Mil-Spec / Quantum)
          </button>
        </div>

        {/* Presets Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-72 overflow-y-auto pr-1">
          {filteredPresets.map((p, idx) => {
            const badge = getRatingBadge(p.deviceRating);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleCreateDefaultDeck(p)}
                className="p-3 rounded-xl bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-800 hover:border-emerald-500/60 text-left transition-all cursor-pointer flex flex-col justify-between group shadow-sm"
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-xs font-mono font-bold text-white group-hover:text-emerald-300 transition-colors truncate">
                    {p.name}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border shrink-0 ${badge.className}`}>
                    Stufe {p.deviceRating}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-zinc-400 flex items-center justify-between mt-1">
                  <span className="text-zinc-500 truncate">{p.manufacturer}</span>
                  <span className="text-emerald-400 font-bold">[{p.attributeArray.join('/')}]</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom Deck Action */}
        <div className="flex items-center justify-center pt-2 border-t border-zinc-800/80">
          <button
            type="button"
            onClick={() => {
              setDeckName('Custom Cyberdeck');
              setDeckManufacturer('Eigenbau');
              setDeckRating(7);
              setDeckArrayValues([10, 9, 8, 7]);
              setShowConfigModal(true);
            }}
            className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Sliders size={14} className="text-emerald-400" />
            <span>Individuelles Cyberdeck konfigurieren (Freie Stufe & Werte)</span>
          </button>
        </div>

        {/* Modal when opened from empty state */}
        {showConfigModal && renderConfigModal()}
      </div>
    );
  }

  // Calculations
  const effectiveAttrs = calculateEffectiveDeckAttributes(deck);
  const maxSlots = getMaxProgramSlots(deck);
  const activeCount = getActiveProgramCount(deck);
  const matrixInit = getMatrixInitiative(deck, character.characteristics || []);
  const damageMax = Math.max(1, deck?.matrixCondition?.max || (8 + Math.ceil((deck?.deviceRating || 1) / 2)));
  const damageCurrent = Math.max(0, Math.min(damageMax, deck?.matrixCondition?.damage || 0));

  // Reconfigure helper: Tactical 1-click Presets
  const applyTacticalPreset = (focus: 'attack' | 'sleaze' | 'dataProcessing' | 'firewall') => {
    if (!deck) return;
    const arrayVals = deck.attributeArray || [4, 3, 2, 1];
    // Sort the available 4 array values descending
    const sorted = [...arrayVals].sort((a, b) => b - a);
    const [highest, second, third, lowest] = sorted;

    let newConfig = { ...(deck.configuration || { attack: 4, sleaze: 3, dataProcessing: 2, firewall: 1 }) };
    if (focus === 'attack') {
      newConfig = { attack: highest, sleaze: second, dataProcessing: third, firewall: lowest };
    } else if (focus === 'sleaze') {
      newConfig = { sleaze: highest, attack: second, dataProcessing: third, firewall: lowest };
    } else if (focus === 'dataProcessing') {
      newConfig = { dataProcessing: highest, sleaze: second, firewall: third, attack: lowest };
    } else if (focus === 'firewall') {
      newConfig = { firewall: highest, dataProcessing: second, sleaze: third, attack: lowest };
    }

    onUpdateCyberdeck({
      ...deck,
      configuration: newConfig
    });
  };

  // Reconfigure helper: Swap two attributes
  const handleSwapAttributes = (attr1: ShadowrunMatrixAttribute, attr2: ShadowrunMatrixAttribute) => {
    if (!deck) return;
    const config = deck.configuration || { attack: 4, sleaze: 3, dataProcessing: 2, firewall: 1 };
    const val1 = config[attr1] ?? 0;
    const val2 = config[attr2] ?? 0;
    onUpdateCyberdeck({
      ...deck,
      configuration: {
        ...config,
        [attr1]: val2,
        [attr2]: val1
      }
    });
  };

  // Manual assign a value to an attribute and resolve conflicts
  const handleAssignValueToAttr = (targetAttr: ShadowrunMatrixAttribute, newValue: number) => {
    if (!deck) return;
    const config = deck.configuration || { attack: 4, sleaze: 3, dataProcessing: 2, firewall: 1 };
    // Find which attribute currently has this value
    const attrs: ShadowrunMatrixAttribute[] = ['attack', 'sleaze', 'dataProcessing', 'firewall'];
    const currentVal = config[targetAttr] ?? 0;
    if (currentVal === newValue) return;

    // Find the other attribute that currently holds `newValue`
    const otherAttr = attrs.find(a => a !== targetAttr && config[a] === newValue);

    if (otherAttr) {
      // Direct swap
      onUpdateCyberdeck({
        ...deck,
        configuration: {
          ...config,
          [targetAttr]: newValue,
          [otherAttr]: currentVal
        }
      });
    } else {
      // Just set
      onUpdateCyberdeck({
        ...deck,
        configuration: {
          ...config,
          [targetAttr]: newValue
        }
      });
    }
  };

  // Program toggle active
  const toggleProgram = (progId: string) => {
    const target = deck.programs.find(p => p.id === progId);
    if (!target) return;

    // If activating, verify slots
    if (!target.isActive && activeCount >= maxSlots) {
      // If it's Virtual Machine, it adds slots itself, so allowed
      if (!target.modifiers?.extraProgramSlots) {
        alert(`Programmplätze erschöpft! Maximal ${maxSlots} Programme können gleichzeitig im Speicher aktiv sein.`);
        return;
      }
    }

    const updated = deck.programs.map(p => {
      if (p.id === progId) {
        return { ...p, isActive: !p.isActive };
      }
      return p;
    });

    onUpdateCyberdeck({
      ...deck,
      programs: updated
    });
  };

  // Delete program
  const handleDeleteProgram = (progId: string) => {
    const updated = deck.programs.filter(p => p.id !== progId);
    onUpdateCyberdeck({
      ...deck,
      programs: updated
    });
  };

  // Matrix Damage toggle
  const handleSetMatrixDamage = (boxes: number) => {
    onUpdateCyberdeck({
      ...deck,
      matrixCondition: {
        max: damageMax,
        damage: Math.max(0, Math.min(damageMax, boxes))
      }
    });
  };

  // Mode change
  const handleSetMode = (mode: 'AR' | 'cold-vr' | 'hot-vr') => {
    onUpdateCyberdeck({
      ...deck,
      mode
    });
  };

  // Save / Add Program
  const handleSaveNewProgram = () => {
    if (!newProgName.trim()) return;

    const mod: ShadowrunDeckProgramModifiers = {};
    if (newProgDiceMod !== 0 && newProgSkill) {
      mod.dicePoolMod = newProgDiceMod;
      mod.applicableSkills = [newProgSkill];
    }
    if (newProgAttrBoost.attr !== 'none' && newProgAttrBoost.val > 0) {
      mod.attributeBoost = {
        attribute: newProgAttrBoost.attr as ShadowrunMatrixAttribute,
        value: newProgAttrBoost.val
      };
    }
    if (newProgSpecialNote) {
      mod.notes = newProgSpecialNote;
    }

    if (editingProgram) {
      const updated = deck.programs.map(p => {
        if (p.id === editingProgram.id) {
          return {
            ...p,
            name: newProgName.trim(),
            type: newProgType,
            description: newProgDesc.trim(),
            modifiers: Object.keys(mod).length > 0 ? mod : undefined
          };
        }
        return p;
      });
      onUpdateCyberdeck({ ...deck, programs: updated });
    } else {
      const newProgram: ShadowrunDeckProgram = {
        id: `prog-${Date.now()}`,
        name: newProgName.trim(),
        type: newProgType,
        isActive: false,
        description: newProgDesc.trim(),
        modifiers: Object.keys(mod).length > 0 ? mod : undefined
      };
      onUpdateCyberdeck({
        ...deck,
        programs: [...deck.programs, newProgram]
      });
    }

    // Reset form
    setShowAddProgramModal(false);
    setEditingProgram(null);
    setNewProgName('');
    setNewProgDesc('');
    setNewProgDiceMod(0);
    setNewProgAttrBoost({ attr: 'none', val: 1 });
    setNewProgSpecialNote('');
  };

  const handleOpenEditProgram = (prog: ShadowrunDeckProgram) => {
    setEditingProgram(prog);
    setNewProgName(prog.name);
    setNewProgType(prog.type);
    setNewProgDesc(prog.description);
    setNewProgDiceMod(prog.modifiers?.dicePoolMod || 0);
    setNewProgSkill(prog.modifiers?.applicableSkills?.[0] || 'Hacking');
    if (prog.modifiers?.attributeBoost) {
      setNewProgAttrBoost({
        attr: prog.modifiers.attributeBoost.attribute,
        val: prog.modifiers.attributeBoost.value
      });
    } else {
      setNewProgAttrBoost({ attr: 'none', val: 1 });
    }
    setNewProgSpecialNote(prog.modifiers?.notes || '');
    setShowAddProgramModal(true);
  };

  const handleSelectPresetProgram = (preset: typeof PROGRAM_PRESETS[0]) => {
    setNewProgName(preset.name);
    setNewProgType(preset.type);
    setNewProgDesc(preset.description);
    setNewProgDiceMod(preset.modifiers?.dicePoolMod || 0);
    setNewProgSkill(preset.modifiers?.applicableSkills?.[0] || 'Hacking');
    if (preset.modifiers?.attributeBoost) {
      setNewProgAttrBoost({
        attr: preset.modifiers.attributeBoost.attribute,
        val: preset.modifiers.attributeBoost.value
      });
    } else {
      setNewProgAttrBoost({ attr: 'none', val: 1 });
    }
    setNewProgSpecialNote(preset.modifiers?.notes || '');
  };

  return (
    <div className="bg-zinc-900/70 border border-emerald-500/30 rounded-2xl p-5 shadow-2xl space-y-6 backdrop-blur-md relative overflow-hidden font-sans">
      {/* Matrix Glowing Accent in background */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-60 h-60 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <Terminal size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-black text-white tracking-tight uppercase">
                {deck.name}
              </h3>
              <span className={`px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold ${getRatingBadge(deck.deviceRating).className}`}>
                {getRatingBadge(deck.deviceRating).label} • {getRatingBadge(deck.deviceRating).tier}
              </span>
              {deck.manufacturer && (
                <span className="text-[11px] font-mono text-zinc-500 hidden md:inline">
                  [{deck.manufacturer}]
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 font-mono flex items-center gap-2 mt-0.5">
              <span>Cyberdeck & Matrix-Konfiguration</span>
              <span className="text-zinc-600">•</span>
              <span className="text-emerald-400">
                Wertepool: [{deck.attributeArray.join(', ')}]
              </span>
            </p>
          </div>
        </div>

        {/* Top Controls: VR Mode & Configuration Button */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Interface Mode Switcher */}
          <div className="flex items-center bg-zinc-950/90 border border-zinc-800 rounded-xl p-1 text-[11px] font-mono">
            <button
              onClick={() => handleSetMode('AR')}
              className={`px-2.5 py-1 rounded-lg transition-all font-bold cursor-pointer ${
                deck.mode === 'AR' 
                  ? 'bg-zinc-800 text-white shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Erweiterte Realität (Standard Initiative, physisch geschützt)"
            >
              AR
            </button>
            <button
              onClick={() => handleSetMode('cold-vr')}
              className={`px-2.5 py-1 rounded-lg transition-all font-bold cursor-pointer ${
                deck.mode === 'cold-vr' 
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Kaltes VR (+3W6 Initiative, geistiger Biofeedback-Schaden)"
            >
              Kalt-VR
            </button>
            <button
              onClick={() => handleSetMode('hot-vr')}
              className={`px-2.5 py-1 rounded-lg transition-all font-bold cursor-pointer ${
                deck.mode === 'hot-vr' 
                  ? 'bg-amber-950 text-amber-300 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Heißes VR (+2 Würfel auf alle Matrix-Handlungen, +4W6 Initiative, körperlicher Biofeedback-Schaden!)"
            >
              🔥 Heiß-VR
            </button>
          </div>

          <button
            onClick={() => {
              setDeckName(deck.name);
              setDeckManufacturer(deck.manufacturer || '');
              setDeckRating(deck.deviceRating);
              setDeckArrayValues([...(deck.attributeArray || [4, 3, 2, 1])]);
              setShowConfigModal(true);
            }}
            className="px-3 py-1.5 bg-zinc-800/80 hover:bg-zinc-750 border border-zinc-700 hover:border-zinc-600 text-zinc-300 hover:text-white rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Werte-Pool und Gerätestufe des Cyberdecks anpassen"
          >
            <Sliders size={13} className="text-emerald-400" />
            <span>Deck-Werte</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (window.confirm(`Cyberdeck "${deck.name}" ablegen?`)) {
                onUpdateCyberdeck(undefined);
              }
            }}
            className="px-2.5 py-1.5 bg-zinc-800/40 hover:bg-red-950/60 border border-zinc-700 hover:border-red-500/50 text-zinc-400 hover:text-red-300 rounded-xl text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Cyberdeck ablegen / entfernen"
          >
            <Trash2 size={13} />
            <span className="hidden sm:inline">Ablegen</span>
          </button>
        </div>
      </div>

      {/* Hot VR Active Banner */}
      {deck.mode === 'hot-vr' && (
        <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl px-3.5 py-2 flex items-center justify-between text-xs font-mono text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-amber-400 animate-pulse" />
            <span>
              <strong>Heißes SimSinn aktiv:</strong> +2 Würfelpool auf alle Matrix-Handlungen (bei Proben berücksichtigt).
            </span>
          </div>
          <span className="text-[10px] text-amber-400/80 uppercase tracking-wider font-bold">
            Biofeedback: Körperlich
          </span>
        </div>
      )}

      {/* MATRIX ATTRIBUTES: 4 Columns with Reconfigurable Allocation */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Radio size={14} className="text-emerald-400" />
            <h4 className="text-xs font-black text-white font-mono uppercase tracking-wider">
              Matrix-Attribute & Konfiguration
            </h4>
            <span className="text-[10px] font-mono text-zinc-500">
              (Verfügbare Werte: {(deck.attributeArray || []).join(' / ')})
            </span>
          </div>

          {/* Quick Tactical Preset Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-mono text-zinc-500 font-bold mr-1">Fokus:</span>
            <button
              onClick={() => applyTacticalPreset('attack')}
              className="px-2 py-1 bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 hover:border-red-500/60 text-red-300 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1"
              title="Setzt den höchsten Wert auf Angriff (für Brute-Force & Cyberkampf)"
            >
              <Swords size={11} /> Angriff
            </button>
            <button
              onClick={() => applyTacticalPreset('sleaze')}
              className="px-2 py-1 bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/30 hover:border-purple-500/60 text-purple-300 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1"
              title="Setzt den höchsten Wert auf Schleicher (für Eiliges Hacken & Infiltration)"
            >
              <Ghost size={11} /> Schleicher
            </button>
            <button
              onClick={() => applyTacticalPreset('dataProcessing')}
              className="px-2 py-1 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 hover:border-cyan-500/60 text-cyan-300 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1"
              title="Setzt den höchsten Wert auf Datenverarbeitung (für Matrixsuche, Wahrnehmung & Initiative)"
            >
              <Cpu size={11} /> DV
            </button>
            <button
              onClick={() => applyTacticalPreset('firewall')}
              className="px-2 py-1 bg-blue-950/40 hover:bg-blue-900/60 border border-blue-500/30 hover:border-blue-500/60 text-blue-300 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1"
              title="Setzt den höchsten Wert auf Firewall (für maximale Verteidigung gegen Angriffe)"
            >
              <Shield size={11} /> Firewall
            </button>
          </div>
        </div>

        {/* The 4 Attribute Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* 1. ANGRIFF (ATTACK) */}
          <div className="bg-zinc-950/80 border border-red-500/30 rounded-xl p-3 flex flex-col justify-between relative overflow-hidden group hover:border-red-500/50 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase font-black tracking-wider text-red-400 flex items-center gap-1.5">
                <Swords size={13} /> Angriff (A)
              </span>
              {/* Value Dropdown to swap */}
              <select
                value={deck.configuration?.attack ?? (deck.attributeArray?.[0] || 4)}
                onChange={(e) => handleAssignValueToAttr('attack', parseInt(e.target.value, 10))}
                className="bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-mono font-bold rounded px-1.5 py-0.5 cursor-pointer hover:border-red-500/50"
                title="Basis-Zuweisung aus Wertepool wählen"
              >
                {(deck.attributeArray || [4, 3, 2, 1]).map((val, idx) => (
                  <option key={idx} value={val}>
                    Slot: {val}
                  </option>
                ))}
              </select>
            </div>

            <div className="my-2 text-center">
              <div className="text-3xl font-black font-mono tracking-tight text-white flex items-center justify-center gap-1.5">
                <span>{effectiveAttrs.attack}</span>
                {effectiveAttrs.bonuses.attack > 0 && (
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/40">
                    +{effectiveAttrs.bonuses.attack}
                  </span>
                )}
              </div>
              <div className="text-[10px] font-mono text-zinc-400 mt-1">
                Basis: <strong className="text-zinc-200">{deck.configuration?.attack ?? 0}</strong>
                {effectiveAttrs.bonuses.attack > 0 && (
                  <span className="text-emerald-400"> (inkl. Entschlüsselung)</span>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-800/80 text-[9px] font-mono text-zinc-500 leading-tight">
              Limit für Brute-Force, Datenbomben & Cyberkampf.
            </div>
          </div>

          {/* 2. SCHLEICHER (SLEAZE) */}
          <div className="bg-zinc-950/80 border border-purple-500/30 rounded-xl p-3 flex flex-col justify-between relative overflow-hidden group hover:border-purple-500/50 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase font-black tracking-wider text-purple-400 flex items-center gap-1.5">
                <Ghost size={13} /> Schleicher (S)
              </span>
              <select
                value={deck.configuration?.sleaze ?? (deck.attributeArray?.[1] || 3)}
                onChange={(e) => handleAssignValueToAttr('sleaze', parseInt(e.target.value, 10))}
                className="bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-mono font-bold rounded px-1.5 py-0.5 cursor-pointer hover:border-purple-500/50"
                title="Basis-Zuweisung aus Wertepool wählen"
              >
                {(deck.attributeArray || [4, 3, 2, 1]).map((val, idx) => (
                  <option key={idx} value={val}>
                    Slot: {val}
                  </option>
                ))}
              </select>
            </div>

            <div className="my-2 text-center">
              <div className="text-3xl font-black font-mono tracking-tight text-white flex items-center justify-center gap-1.5">
                <span>{effectiveAttrs.sleaze}</span>
                {effectiveAttrs.bonuses.sleaze > 0 && (
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/40">
                    +{effectiveAttrs.bonuses.sleaze}
                  </span>
                )}
              </div>
              <div className="text-[10px] font-mono text-zinc-400 mt-1">
                Basis: <strong className="text-zinc-200">{deck.configuration?.sleaze ?? 0}</strong>
                {effectiveAttrs.bonuses.sleaze > 0 && (
                  <span className="text-emerald-400"> (inkl. Tarnung)</span>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-800/80 text-[9px] font-mono text-zinc-500 leading-tight">
              Limit für Eiliges Hacken & Matrix-Heimlichkeit.
            </div>
          </div>

          {/* 3. DATENVERARBEITUNG (DATA PROCESSING) */}
          <div className="bg-zinc-950/80 border border-cyan-500/30 rounded-xl p-3 flex flex-col justify-between relative overflow-hidden group hover:border-cyan-500/50 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase font-black tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Cpu size={13} /> DV (D)
              </span>
              <select
                value={deck.configuration?.dataProcessing ?? (deck.attributeArray?.[2] || 2)}
                onChange={(e) => handleAssignValueToAttr('dataProcessing', parseInt(e.target.value, 10))}
                className="bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-mono font-bold rounded px-1.5 py-0.5 cursor-pointer hover:border-cyan-500/50"
                title="Basis-Zuweisung aus Wertepool wählen"
              >
                {(deck.attributeArray || [4, 3, 2, 1]).map((val, idx) => (
                  <option key={idx} value={val}>
                    Slot: {val}
                  </option>
                ))}
              </select>
            </div>

            <div className="my-2 text-center">
              <div className="text-3xl font-black font-mono tracking-tight text-white flex items-center justify-center gap-1.5">
                <span>{effectiveAttrs.dataProcessing}</span>
                {effectiveAttrs.bonuses.dataProcessing > 0 && (
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/40">
                    +{effectiveAttrs.bonuses.dataProcessing}
                  </span>
                )}
              </div>
              <div className="text-[10px] font-mono text-zinc-400 mt-1">
                Basis: <strong className="text-zinc-200">{deck.configuration?.dataProcessing ?? 0}</strong>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-800/80 text-[9px] font-mono text-zinc-500 leading-tight">
              Limit für Matrixsuche, Wahrnehmung & Matrix-Init.
            </div>
          </div>

          {/* 4. FIREWALL (FIREWALL) */}
          <div className="bg-zinc-950/80 border border-blue-500/30 rounded-xl p-3 flex flex-col justify-between relative overflow-hidden group hover:border-blue-500/50 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase font-black tracking-wider text-blue-400 flex items-center gap-1.5">
                <Shield size={13} /> Firewall (F)
              </span>
              <select
                value={deck.configuration?.firewall ?? (deck.attributeArray?.[3] || 1)}
                onChange={(e) => handleAssignValueToAttr('firewall', parseInt(e.target.value, 10))}
                className="bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-mono font-bold rounded px-1.5 py-0.5 cursor-pointer hover:border-blue-500/50"
                title="Basis-Zuweisung aus Wertepool wählen"
              >
                {(deck.attributeArray || [4, 3, 2, 1]).map((val, idx) => (
                  <option key={idx} value={val}>
                    Slot: {val}
                  </option>
                ))}
              </select>
            </div>

            <div className="my-2 text-center">
              <div className="text-3xl font-black font-mono tracking-tight text-white flex items-center justify-center gap-1.5">
                <span>{effectiveAttrs.firewall}</span>
                {effectiveAttrs.bonuses.firewall > 0 && (
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/40">
                    +{effectiveAttrs.bonuses.firewall}
                  </span>
                )}
              </div>
              <div className="text-[10px] font-mono text-zinc-400 mt-1">
                Basis: <strong className="text-zinc-200">{deck.configuration?.firewall ?? 0}</strong>
                {effectiveAttrs.bonuses.firewall > 0 && (
                  <span className="text-emerald-400"> (inkl. Verschlüsselung)</span>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-800/80 text-[9px] font-mono text-zinc-500 leading-tight">
              Widerstand gegen feindliche Angriffe & IC.
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar: Matrix Initiative, Damage Monitor & Slot Capacity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800">
        {/* Matrix-Initiative */}
        <div className="space-y-1">
          <span className="text-[9px] uppercase font-mono tracking-wider font-bold text-zinc-500 flex items-center gap-1.5">
            <Activity size={12} className="text-cyan-400" /> Matrix-Initiative ({deck.mode === 'hot-vr' ? 'Heiß-VR' : deck.mode === 'cold-vr' ? 'Kalt-VR' : 'AR'})
          </span>
          <div className="text-sm font-mono font-bold text-white flex items-center gap-2">
            <span>
              {deck.mode === 'hot-vr' ? matrixInit.hotVR.dice : deck.mode === 'cold-vr' ? matrixInit.coldVR.dice : matrixInit.ar}
            </span>
          </div>
          <p className="text-[10px] font-mono text-zinc-500">
            {deck.mode === 'hot-vr' ? matrixInit.hotVR.label : deck.mode === 'cold-vr' ? matrixInit.coldVR.label : 'Reaktion + Intuition'}
          </p>
        </div>

        {/* Matrix-Zustandsmonitor (Damage) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase font-mono tracking-wider font-bold text-zinc-500 flex items-center gap-1.5">
              <HardDrive size={12} className="text-emerald-400" /> Matrix-Zustand ({damageCurrent}/{damageMax})
            </span>
            {damageCurrent > 0 && (
              <button
                onClick={() => handleSetMatrixDamage(0)}
                className="text-[9px] font-mono text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
              >
                Rebooten (0)
              </button>
            )}
          </div>
          {/* Damage Boxes */}
          <div className="flex items-center gap-1 flex-wrap">
            {Array.from({ length: damageMax }).map((_, idx) => {
              const isDamaged = idx < damageCurrent;
              return (
                <button
                  key={idx}
                  onClick={() => handleSetMatrixDamage(isDamaged && idx === damageCurrent - 1 ? idx : idx + 1)}
                  className={`w-4 h-4 rounded text-[9px] font-mono font-bold flex items-center justify-center transition-all cursor-pointer ${
                    isDamaged
                      ? 'bg-red-950 border border-red-500 text-red-400 shadow-[0_0_6px_rgba(239,68,68,0.4)]'
                      : 'bg-zinc-900 border border-zinc-700 text-zinc-600 hover:border-zinc-500'
                  }`}
                  title={`Kasten ${idx + 1} (${isDamaged ? 'Schaden' : 'Intakt'})`}
                >
                  {isDamaged ? '✕' : idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Program Slot Capacity */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase font-mono tracking-wider font-bold text-zinc-500 flex items-center gap-1.5">
              <Layers size={12} className="text-purple-400" /> Programmspeicher
            </span>
            <span className={`text-xs font-mono font-bold ${activeCount > maxSlots ? 'text-red-400' : 'text-emerald-400'}`}>
              {activeCount} / {maxSlots} belegt
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-2 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${
                activeCount > maxSlots ? 'bg-red-500' : activeCount === maxSlots ? 'bg-emerald-500' : 'bg-cyan-500'
              }`}
              style={{ width: `${Math.min(100, (activeCount / maxSlots) * 100)}%` }}
            />
          </div>
          <p className="text-[10px] font-mono text-zinc-500">
            Basis: Stufe {deck.deviceRating} {maxSlots > deck.deviceRating ? '(+2 durch Virtuelle Maschine)' : ''}
          </p>
        </div>
      </div>

      {/* PROGRAMME SECTION (wie bei der Chipbuchse) */}
      <div className="space-y-3 pt-1 border-t border-zinc-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Cpu size={15} className="text-emerald-400" />
            <h4 className="text-xs font-black text-white font-mono uppercase tracking-wider">
              Geladene Programme & Speicher-Bibliothek
            </h4>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter Buttons */}
            <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-lg p-0.5 text-[10px] font-mono">
              <button
                onClick={() => setSelectedCategoryFilter('all')}
                className={`px-2 py-0.5 rounded cursor-pointer ${selectedCategoryFilter === 'all' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Alle ({deck.programs?.length || 0})
              </button>
              <button
                onClick={() => setSelectedCategoryFilter('active')}
                className={`px-2 py-0.5 rounded cursor-pointer ${selectedCategoryFilter === 'active' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Aktiv ({activeCount})
              </button>
              <button
                onClick={() => setSelectedCategoryFilter('hacking')}
                className={`px-2 py-0.5 rounded cursor-pointer ${selectedCategoryFilter === 'hacking' ? 'bg-purple-950 text-purple-300 border border-purple-500/40' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Hacking
              </button>
              <button
                onClick={() => setSelectedCategoryFilter('standard')}
                className={`px-2 py-0.5 rounded cursor-pointer ${selectedCategoryFilter === 'standard' ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Standard
              </button>
            </div>

            <button
              onClick={() => {
                setEditingProgram(null);
                setNewProgName('');
                setNewProgDesc('');
                setNewProgDiceMod(0);
                setNewProgAttrBoost({ attr: 'none', val: 1 });
                setNewProgSpecialNote('');
                setShowAddProgramModal(true);
              }}
              className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1 cursor-pointer shadow-sm"
            >
              <Plus size={13} />
              <span>Programm hinzufügen</span>
            </button>
          </div>
        </div>

        {/* Program Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {filteredPrograms.map((prog) => {
            const isHacking = prog.type === 'hacking';
            return (
              <div
                key={prog.id}
                className={`p-3 rounded-xl border transition-all relative overflow-hidden flex flex-col justify-between gap-2 ${
                  prog.isActive
                    ? 'bg-zinc-950/90 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.12)]'
                    : 'bg-zinc-950/40 border-zinc-800/80 hover:border-zinc-700 opacity-80'
                }`}
              >
                {/* Active glow corner */}
                {prog.isActive && (
                  <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
                )}

                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${prog.isActive ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-zinc-600'}`} />
                      <h5 className="text-xs font-black text-white font-mono tracking-tight">
                        {prog.name}
                      </h5>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase font-bold ${
                        isHacking 
                          ? 'bg-purple-950/70 border-purple-500/40 text-purple-300' 
                          : 'bg-cyan-950/70 border-cyan-500/40 text-cyan-300'
                      }`}>
                        {prog.type}
                      </span>

                      {/* Edit button */}
                      <button
                        onClick={() => handleOpenEditProgram(prog)}
                        className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 transition-all cursor-pointer"
                        title="Programm bearbeiten"
                      >
                        <Edit2 size={12} />
                      </button>

                      {/* Delete button */}
                      <button
                        onClick={() => handleDeleteProgram(prog.id)}
                        className="p-1 rounded text-zinc-600 hover:text-red-400 hover:bg-zinc-900 transition-all cursor-pointer"
                        title="Programm löschen"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-zinc-400 font-mono mt-1.5 line-clamp-2 leading-relaxed">
                    {prog.description}
                  </p>
                </div>

                {/* Modifiers & Power Toggle */}
                <div className="pt-2 border-t border-zinc-850 flex items-center justify-between gap-2 flex-wrap">
                  {/* Modifiers Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {prog.modifiers?.dicePoolMod && prog.modifiers.dicePoolMod > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-[10px] font-mono text-emerald-300 font-bold flex items-center gap-1">
                        <Zap size={10} /> +{prog.modifiers.dicePoolMod} Würfelpool ({prog.modifiers.applicableSkills?.join(', ')})
                      </span>
                    )}
                    {prog.modifiers?.attributeBoost && (
                      <span className="px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-[10px] font-mono text-cyan-300 font-bold flex items-center gap-1">
                        <Sparkles size={10} /> +{prog.modifiers.attributeBoost.value} {prog.modifiers.attributeBoost.attribute === 'sleaze' ? 'Schleicher' : prog.modifiers.attributeBoost.attribute === 'attack' ? 'Angriff' : prog.modifiers.attributeBoost.attribute === 'firewall' ? 'Firewall' : 'DV'}
                      </span>
                    )}
                    {prog.modifiers?.extraProgramSlots && (
                      <span className="px-1.5 py-0.5 rounded bg-purple-950/80 border border-purple-500/40 text-[10px] font-mono text-purple-300 font-bold flex items-center gap-1">
                        <Layers size={10} /> +{prog.modifiers.extraProgramSlots} Programmplätze
                      </span>
                    )}
                    {prog.modifiers?.matrixDamageResistance && (
                      <span className="px-1.5 py-0.5 rounded bg-blue-950/80 border border-blue-500/40 text-[10px] font-mono text-blue-300 font-bold flex items-center gap-1">
                        <Shield size={10} /> +{prog.modifiers.matrixDamageResistance} Schadenswiderstand
                      </span>
                    )}
                    {prog.modifiers?.damageBonus && (
                      <span className="px-1.5 py-0.5 rounded bg-red-950/80 border border-red-500/40 text-[10px] font-mono text-red-300 font-bold flex items-center gap-1">
                        <Swords size={10} /> +{prog.modifiers.damageBonus} Matrixschaden
                      </span>
                    )}
                    {prog.modifiers?.noiseReduction && (
                      <span className="px-1.5 py-0.5 rounded bg-teal-950/80 border border-teal-500/40 text-[10px] font-mono text-teal-300 font-bold flex items-center gap-1">
                        <Wifi size={10} /> -{prog.modifiers.noiseReduction} Rauschen
                      </span>
                    )}
                  </div>

                  {/* Toggle Active Switch */}
                  <button
                    onClick={() => toggleProgram(prog.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      prog.isActive
                        ? 'bg-emerald-500 text-zinc-950 hover:bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                        : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-700'
                    }`}
                    title={prog.isActive ? 'Programm auswerfen / stoppen' : 'Programm in den Speicher laden'}
                  >
                    <Power size={11} className={prog.isActive ? 'stroke-[2.5px]' : ''} />
                    <span>{prog.isActive ? 'GELADEN' : 'STANDBY'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL: Deck Konfiguration anpassen */}
      {showConfigModal && renderConfigModal()}

      {/* MODAL: Programm Hinzufügen / Bearbeiten */}
      {showAddProgramModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-zinc-950 border border-emerald-500/40 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <Cpu size={18} />
                <h4 className="text-sm font-black font-mono uppercase tracking-wider text-white">
                  {editingProgram ? 'Programm Bearbeiten' : 'Neues Programm Registrieren'}
                </h4>
              </div>
              <button 
                onClick={() => {
                  setShowAddProgramModal(false);
                  setEditingProgram(null);
                }}
                className="text-zinc-500 hover:text-white p-1 rounded-full cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Presets Selection */}
            {!editingProgram && (
              <div>
                <label className="text-[10px] font-mono uppercase text-zinc-400 font-bold block mb-1">
                  Schnellauswahl aus Standard-Programmen:
                </label>
                <select
                  onChange={(e) => {
                    const found = PROGRAM_PRESETS.find(p => p.name === e.target.value);
                    if (found) handleSelectPresetProgram(found);
                  }}
                  className="w-full bg-zinc-900 border border-zinc-750 rounded-lg px-3 py-1.5 text-xs font-mono text-zinc-200 cursor-pointer"
                >
                  <option value="">-- Katalog-Vorlage auswählen (z.B. Ausnutzen, Panzerung, Hammer, Tarnung) --</option>
                  <optgroup label="Hacking-Programme">
                    {PROGRAM_PRESETS.filter(p => p.type === 'hacking').map((p, idx) => (
                      <option key={idx} value={p.name}>{p.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Standard-Programme">
                    {PROGRAM_PRESETS.filter(p => p.type === 'standard').map((p, idx) => (
                      <option key={idx} value={p.name}>{p.name}</option>
                    ))}
                  </optgroup>
                </select>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono uppercase text-zinc-400 font-bold block mb-1">
                    Programm-Name:
                  </label>
                  <input
                    type="text"
                    value={newProgName}
                    onChange={(e) => setNewProgName(e.target.value)}
                    placeholder="z.B. Ausnutzen oder Virtuelle Maschine"
                    className="w-full bg-zinc-900 border border-zinc-750 rounded-lg px-3 py-1.5 text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase text-zinc-400 font-bold block mb-1">
                    Kategorie:
                  </label>
                  <select
                    value={newProgType}
                    onChange={(e) => setNewProgType(e.target.value as any)}
                    className="w-full bg-zinc-900 border border-zinc-750 rounded-lg px-3 py-1.5 text-xs font-mono text-white cursor-pointer"
                  >
                    <option value="hacking">Hacking-Programm</option>
                    <option value="standard">Standard-Programm</option>
                    <option value="special">Spezial / Agent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-zinc-400 font-bold block mb-1">
                  Beschreibung & Matrix-Effekt:
                </label>
                <textarea
                  value={newProgDesc}
                  onChange={(e) => setNewProgDesc(e.target.value)}
                  rows={2}
                  placeholder="Beschreibe die Funktionsweise und Wirkungsweise im Gitter..."
                  className="w-full bg-zinc-900 border border-zinc-750 rounded-lg px-3 py-1.5 text-xs font-mono text-white"
                />
              </div>

              {/* Modifiers Setup */}
              <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 space-y-2.5">
                <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold block">
                  Regel-Modifikatoren für Proben & Werte:
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-mono uppercase text-zinc-400 font-bold block mb-1">
                      Würfelpool-Bonus:
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        max={6}
                        value={newProgDiceMod}
                        onChange={(e) => setNewProgDiceMod(parseInt(e.target.value, 10) || 0)}
                        className="w-16 bg-zinc-950 border border-zinc-750 rounded-lg px-2 py-1 text-xs font-mono text-white text-center"
                      />
                      <span className="text-xs font-mono text-zinc-400">auf Fertigkeit:</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-mono uppercase text-zinc-400 font-bold block mb-1">
                      Ziel-Fertigkeit:
                    </label>
                    <input
                      type="text"
                      value={newProgSkill}
                      onChange={(e) => setNewProgSkill(e.target.value)}
                      placeholder="z.B. Hacking oder Cyberkampf"
                      className="w-full bg-zinc-950 border border-zinc-750 rounded-lg px-2 py-1 text-xs font-mono text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[9px] font-mono uppercase text-zinc-400 font-bold block mb-1">
                      Matrix-Attribut Bonus (+X):
                    </label>
                    <select
                      value={newProgAttrBoost.attr}
                      onChange={(e) => setNewProgAttrBoost({ ...newProgAttrBoost, attr: e.target.value as any })}
                      className="w-full bg-zinc-950 border border-zinc-750 rounded-lg px-2 py-1 text-xs font-mono text-white cursor-pointer"
                    >
                      <option value="none">Kein Attribut-Bonus</option>
                      <option value="attack">+1 Angriff (Attack)</option>
                      <option value="sleaze">+1 Schleicher (Sleaze)</option>
                      <option value="dataProcessing">+1 Datenverarbeitung</option>
                      <option value="firewall">+1 Firewall</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] font-mono uppercase text-zinc-400 font-bold block mb-1">
                      Zusatz-Effekt / Notiz:
                    </label>
                    <input
                      type="text"
                      value={newProgSpecialNote}
                      onChange={(e) => setNewProgSpecialNote(e.target.value)}
                      placeholder="z.B. +2 Programmplätze oder 2 Rauschen"
                      className="w-full bg-zinc-950 border border-zinc-750 rounded-lg px-2 py-1 text-xs font-mono text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setShowAddProgramModal(false);
                  setEditingProgram(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-mono text-zinc-400 hover:text-white cursor-pointer"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleSaveNewProgram}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-xl text-xs font-mono font-bold cursor-pointer shadow-lg"
              >
                {editingProgram ? 'Aktualisieren' : 'Programm Hinzufügen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
