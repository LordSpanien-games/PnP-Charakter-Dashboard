import React, { FC, useState } from 'react';
import { 
  Cpu, 
  Disc, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  CheckCircle2, 
  Power, 
  Languages, 
  BookOpen, 
  Wrench, 
  Database, 
  Sparkles, 
  Shield, 
  Zap, 
  ChevronDown, 
  ChevronUp, 
  X,
  Layers,
  Radio,
  Sliders
} from 'lucide-react';
import { 
  CharacterData, 
  ShadowrunBodyMod, 
  ShadowrunChip, 
  ShadowrunBodyModCategory, 
  ShadowrunWareGrade, 
  ShadowrunChipType 
} from '../types';

interface ShadowrunBodyModsCardProps {
  character: CharacterData;
  onUpdateBodyMods: (mods: ShadowrunBodyMod[]) => void;
  isEditing?: boolean;
}

const GRADE_MULTIPLIERS: Record<ShadowrunWareGrade, number> = {
  used: 1.2,
  standard: 1.0,
  alphaware: 0.8,
  betaware: 0.7,
  deltaware: 0.5,
};

const GRADE_LABELS: Record<ShadowrunWareGrade, string> = {
  used: 'Gebraucht (+20% Essenz)',
  standard: 'Standard',
  alphaware: 'Alphaware (-20% Essenz)',
  betaware: 'Betaware (-30% Essenz)',
  deltaware: 'Deltaware (-50% Essenz)',
};

const CHIP_PRESETS = [
  { name: "Sprachen-Chip: Portugiesisch", type: "lingwasoft" as ShadowrunChipType, rating: 3, notes: "Fließendes Sprechen und Verstehen in Wort und Schrift." },
  { name: "Sprachen-Chip: Japanisch", type: "lingwasoft" as ShadowrunChipType, rating: 3, notes: "Geschäfts- und Straßendialekt für Neo-Tokyo und Konzerne." },
  { name: "Sprachen-Chip: Sperethiel", type: "lingwasoft" as ShadowrunChipType, rating: 2, notes: "Grundlagen der Sprache der Elfen (Tír Tairngire)." },
  { name: "Wissenssoft: Seattle Schattenmatrix", type: "knowsoft" as ShadowrunChipType, rating: 4, notes: "Host-Architekturen, Knotenpunkte und ICE-Muster im Sprawl." },
  { name: "Wissenssoft: Schmuggelrouten Salish-Shidhe", type: "knowsoft" as ShadowrunChipType, rating: 3, notes: "Grenzübertritte, Patrouillenintervalle und Deckadressen." },
  { name: "Aktsoft: Erste Hilfe & Trauma", type: "actsoft" as ShadowrunChipType, rating: 2, notes: "Notfallbehandlung von Schuss- und Schnittwunden." },
  { name: "Aktsoft: Schlosser & Maglock-Bypass", type: "actsoft" as ShadowrunChipType, rating: 3, notes: "Mechanisches und elektronisches Knacken von Schlössern." },
  { name: "Datachip: Ares Sicherheits-Protokolle", type: "datachip" as ShadowrunChipType, rating: 1, notes: "Paydata-Archiv mit internen Firmenkennungen." },
];

const MOD_PRESETS = [
  {
    name: "Datenbuchse (Datajack)",
    category: "cyberware" as ShadowrunBodyModCategory,
    grade: "standard" as ShadowrunWareGrade,
    essenceCost: 0.1,
    rating: 1,
    description: "Direkte neuronale Schnittstelle (DNI). Ermöglicht kabelgebundene Matrix-Verbindung, SimSinn-Eingang und Schutz vor Störsendern.",
    isChipjack: false
  },
  {
    name: "Chipbuchse (Chipjack)",
    category: "cyberware" as ShadowrunBodyModCategory,
    grade: "alphaware" as ShadowrunWareGrade,
    essenceCost: 0.16,
    rating: 3,
    description: "Schädel-Schnittstelle zur direkten Aufnahme von Soft-Chips (Sprach-, Wissens- und Fertigkeits-Chips).",
    isChipjack: true
  },
  {
    name: "Smartlink (Okular)",
    category: "cyberware" as ShadowrunBodyModCategory,
    grade: "alphaware" as ShadowrunWareGrade,
    essenceCost: 0.16,
    rating: 1,
    description: "Okulares HUD, das direkt mit Smartlink-Waffen kommuniziert. Gibt +2 Würfelpool-Bonus auf Schussbeprobungen.",
    isChipjack: false
  },
  {
    name: "Drahtreflexe I",
    category: "cyberware" as ShadowrunBodyModCategory,
    grade: "standard" as ShadowrunWareGrade,
    essenceCost: 2.0,
    rating: 1,
    description: "Katalytische Nervenbeschleuniger. Erhöht Reaktion um +1 und Initiative um +1W6.",
    isChipjack: false
  },
  {
    name: "Muskelstraffung II",
    category: "bioware" as ShadowrunBodyModCategory,
    grade: "standard" as ShadowrunWareGrade,
    essenceCost: 0.4,
    rating: 2,
    description: "Permanenter Bioware-Umbau an Muskelsträngen. Erhöht Geschicklichkeit um +2.",
    isChipjack: false
  },
  {
    name: "Schmerzeditor",
    category: "bioware" as ShadowrunBodyModCategory,
    grade: "standard" as ShadowrunWareGrade,
    essenceCost: 0.3,
    rating: 1,
    description: "Neuronale Weiche im Thalamus. Ignoriert alle Verletzungsmodifikatoren auf Würfelpools.",
    isChipjack: false
  }
];

export const ShadowrunBodyModsCard: FC<ShadowrunBodyModsCardProps> = ({
  character,
  onUpdateBodyMods,
  isEditing = false,
}) => {
  const [filter, setFilter] = useState<'all' | 'chipjacks' | 'cyberware' | 'bioware'>('all');
  const [showAddModModal, setShowAddModModal] = useState(false);
  const [editingMod, setEditingMod] = useState<ShadowrunBodyMod | null>(null);

  // New Chip Modal / Form state
  const [targetChipjackId, setTargetChipjackId] = useState<string | null>(null);
  const [newChipName, setNewChipName] = useState('');
  const [newChipType, setNewChipType] = useState<ShadowrunChipType>('lingwasoft');
  const [newChipRating, setNewChipRating] = useState(3);
  const [newChipNotes, setNewChipNotes] = useState('');

  // Add/Edit Mod form state
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<ShadowrunBodyModCategory>('cyberware');
  const [formGrade, setFormGrade] = useState<ShadowrunWareGrade>('standard');
  const [formEssence, setFormEssence] = useState('0.1');
  const [formRating, setFormRating] = useState('1');
  const [formDescription, setFormDescription] = useState('');
  const [formIsChipjack, setFormIsChipjack] = useState(false);

  const bodyMods = character.bodyMods || [];

  // Calculate essence metrics
  const totalEssenceSpent = bodyMods.reduce((acc, mod) => acc + (Number(mod.essenceCost) || 0), 0);
  const baseEssence = 6.0;
  const remainingEssence = Math.max(0, baseEssence - totalEssenceSpent);

  // Filtered mods
  const filteredMods = bodyMods.filter(mod => {
    if (filter === 'chipjacks') return mod.isChipjack;
    if (filter === 'cyberware') return mod.category === 'cyberware';
    if (filter === 'bioware') return mod.category === 'bioware';
    return true;
  });

  // Toggle active chip in a chipjack
  const handleToggleChip = (modId: string, chipId: string) => {
    const updated = bodyMods.map(mod => {
      if (mod.id !== modId) return mod;
      const chips = (mod.chips || []).map(chip => {
        if (chip.id === chipId) {
          return { ...chip, isActive: !chip.isActive };
        }
        return chip;
      });
      return { ...mod, chips };
    });
    onUpdateBodyMods(updated);
  };

  // Add new chip to chipjack
  const handleAddChip = (chipjackId: string) => {
    if (!newChipName.trim()) return;

    const newChip: ShadowrunChip = {
      id: `chip-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: newChipName.trim(),
      type: newChipType,
      rating: newChipRating,
      isActive: false,
      notes: newChipNotes.trim()
    };

    const updated = bodyMods.map(mod => {
      if (mod.id !== chipjackId) return mod;
      return {
        ...mod,
        chips: [...(mod.chips || []), newChip]
      };
    });

    onUpdateBodyMods(updated);
    setNewChipName('');
    setNewChipNotes('');
    setTargetChipjackId(null);
  };

  // Remove a chip from chipjack
  const handleDeleteChip = (modId: string, chipId: string) => {
    const updated = bodyMods.map(mod => {
      if (mod.id !== modId) return mod;
      return {
        ...mod,
        chips: (mod.chips || []).filter(c => c.id !== chipId)
      };
    });
    onUpdateBodyMods(updated);
  };

  // Delete body mod
  const handleDeleteMod = (modId: string) => {
    const updated = bodyMods.filter(m => m.id !== modId);
    onUpdateBodyMods(updated);
  };

  // Open Edit Mod
  const openEditMod = (mod: ShadowrunBodyMod) => {
    setEditingMod(mod);
    setFormName(mod.name);
    setFormCategory(mod.category);
    setFormGrade(mod.grade || 'standard');
    setFormEssence(mod.essenceCost.toString());
    setFormRating(mod.rating ? mod.rating.toString() : '1');
    setFormDescription(mod.description || '');
    setFormIsChipjack(!!mod.isChipjack);
    setShowAddModModal(true);
  };

  // Open Add Mod
  const openAddMod = () => {
    setEditingMod(null);
    setFormName('');
    setFormCategory('cyberware');
    setFormGrade('standard');
    setFormEssence('0.1');
    setFormRating('1');
    setFormDescription('');
    setFormIsChipjack(false);
    setShowAddModModal(true);
  };

  // Save Mod
  const handleSaveMod = () => {
    if (!formName.trim()) return;

    const parsedEssence = parseFloat(formEssence) || 0;
    const parsedRating = parseInt(formRating, 10) || 1;

    if (editingMod) {
      const updated = bodyMods.map(mod => {
        if (mod.id !== editingMod.id) return mod;
        return {
          ...mod,
          name: formName.trim(),
          category: formCategory,
          grade: formGrade,
          essenceCost: parsedEssence,
          rating: parsedRating,
          description: formDescription.trim(),
          isChipjack: formIsChipjack,
          chips: formIsChipjack ? (mod.chips || []) : undefined
        };
      });
      onUpdateBodyMods(updated);
    } else {
      const newMod: ShadowrunBodyMod = {
        id: `mod-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: formName.trim(),
        category: formCategory,
        grade: formGrade,
        essenceCost: parsedEssence,
        rating: parsedRating,
        description: formDescription.trim(),
        isChipjack: formIsChipjack,
        chips: formIsChipjack ? [] : undefined
      };
      onUpdateBodyMods([...bodyMods, newMod]);
    }

    setShowAddModModal(false);
    setEditingMod(null);
  };

  const getChipTypeBadge = (type: ShadowrunChipType) => {
    switch (type) {
      case 'lingwasoft':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/40 text-[10px] font-mono font-bold text-cyan-300">
            <Languages size={11} className="text-cyan-400" />
            Sprachen-Chip (Lingwasoft)
          </span>
        );
      case 'knowsoft':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-950/60 border border-indigo-500/40 text-[10px] font-mono font-bold text-indigo-300">
            <BookOpen size={11} className="text-indigo-400" />
            Wissenssoft (Knowsoft)
          </span>
        );
      case 'actsoft':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-500/40 text-[10px] font-mono font-bold text-amber-300">
            <Wrench size={11} className="text-amber-400" />
            Aktsoft (Fertigkeits-Chip)
          </span>
        );
      case 'datachip':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-[10px] font-mono font-bold text-emerald-300">
            <Database size={11} className="text-emerald-400" />
            Datachip (Paydata)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] font-mono font-bold text-zinc-300">
            <Disc size={11} className="text-zinc-400" />
            Soft-Chip
          </span>
        );
    }
  };

  return (
    <section 
      id="shadowrun-bodymods-card"
      className="bg-zinc-900/60 border border-cyan-500/20 rounded-3xl p-6 sm:p-7 shadow-[0_4px_30px_rgba(6,182,212,0.06)] relative overflow-hidden"
    >
      {/* Subtle Background Glow */}
      <div className="absolute -right-24 -top-24 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-24 -bottom-24 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800/80">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-cyan-950/50 border border-cyan-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.15)] text-cyan-400">
            <Cpu size={26} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight font-mono">
                Body-Modifikationen
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-[10px] font-mono font-bold">
                Cyberware & Softs
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Implantate, Datenbuchsen, Chipbuchsen & aktives Soft-Inventar
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={openAddMod}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(6,182,212,0.25)] shrink-0"
          id="btn-add-bodymod"
        >
          <Plus size={15} className="stroke-[3px]" />
          Mod einbauen
        </button>
      </div>

      {/* Essenz & Status Dashboard Banner */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total Essence */}
        <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/90 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 font-bold">
              Verbleibende Essenz
            </span>
            <Sparkles size={13} className="text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-black font-mono ${remainingEssence <= 1.0 ? 'text-red-400 animate-pulse' : remainingEssence <= 3.0 ? 'text-amber-400' : 'text-cyan-400'}`}>
              {remainingEssence.toFixed(2)}
            </span>
            <span className="text-xs font-mono text-zinc-500">/ 6.00 Start</span>
          </div>
          <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${remainingEssence <= 1.0 ? 'bg-red-500' : remainingEssence <= 3.0 ? 'bg-amber-500' : 'bg-cyan-500'}`}
              style={{ width: `${Math.min(100, Math.max(0, (remainingEssence / 6.0) * 100))}%` }}
            />
          </div>
        </div>

        {/* Total Essenzverlust */}
        <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/90 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 font-bold">
              Essenzverlust (Ware)
            </span>
            <Zap size={13} className="text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-amber-400">
              -{totalEssenceSpent.toFixed(2)}
            </span>
            <span className="text-xs font-mono text-zinc-500">Punkte</span>
          </div>
          <span className="text-[10px] text-zinc-400 mt-2">
            {bodyMods.length} Modifikation{bodyMods.length === 1 ? '' : 'en'} installiert
          </span>
        </div>

        {/* Chipjack Slots Overview */}
        <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-cyan-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400 font-bold">
              Chipbuchsen & Softs
            </span>
            <Disc size={13} className="text-cyan-400" />
          </div>
          {(() => {
            const chipjacks = bodyMods.filter(m => m.isChipjack);
            const totalChips = chipjacks.reduce((acc, cj) => acc + (cj.chips?.length || 0), 0);
            const activeChips = chipjacks.reduce((acc, cj) => acc + (cj.chips?.filter(c => c.isActive).length || 0), 0);

            return (
              <div className="mt-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black font-mono text-cyan-300">
                    {activeChips}
                  </span>
                  <span className="text-xs font-mono text-zinc-400">
                    aktiv online ({totalChips} im Speicher)
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400 mt-2 block truncate">
                  {activeChips > 0 
                    ? `Aktiv: ${chipjacks.flatMap(cj => cj.chips || []).filter(c => c.isActive).map(c => c.name).join(', ')}` 
                    : 'Kein Chip im Slot aktiv'}
                </span>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-1">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all font-mono shrink-0 ${
            filter === 'all'
              ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.2)]'
              : 'bg-zinc-950/60 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          Alle ({bodyMods.length})
        </button>
        <button
          onClick={() => setFilter('chipjacks')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all font-mono shrink-0 flex items-center gap-1.5 ${
            filter === 'chipjacks'
              ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.2)]'
              : 'bg-zinc-950/60 text-cyan-400 hover:text-white border border-cyan-500/20'
          }`}
        >
          <Disc size={13} />
          Chipbuchsen ({bodyMods.filter(m => m.isChipjack).length})
        </button>
        <button
          onClick={() => setFilter('cyberware')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all font-mono shrink-0 ${
            filter === 'cyberware'
              ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.2)]'
              : 'bg-zinc-950/60 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          Cyberware ({bodyMods.filter(m => m.category === 'cyberware').length})
        </button>
        <button
          onClick={() => setFilter('bioware')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all font-mono shrink-0 ${
            filter === 'bioware'
              ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.2)]'
              : 'bg-zinc-950/60 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          Bioware ({bodyMods.filter(m => m.category === 'bioware').length})
        </button>
      </div>

      {/* Body Mods List */}
      <div className="mt-5 space-y-4">
        {filteredMods.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-zinc-950/40 border border-dashed border-zinc-800">
            <Cpu size={32} className="mx-auto text-zinc-600 mb-2 opacity-60" />
            <p className="text-sm font-medium text-zinc-400">Keine Body-Modifikationen in dieser Ansicht vorhanden.</p>
            <p className="text-xs text-zinc-500 mt-1">Klicke oben auf &quot;Mod einbauen&quot;, um Datenbuchsen, Chipbuchsen oder Cyberware anzulegen.</p>
          </div>
        ) : (
          filteredMods.map((mod) => {
            const isChipjack = !!mod.isChipjack;
            const chips = mod.chips || [];
            const activeChipsCount = chips.filter(c => c.isActive).length;

            return (
              <div 
                key={mod.id}
                className={`rounded-2xl border transition-all ${
                  isChipjack 
                    ? 'bg-zinc-950/70 border-cyan-500/35 shadow-[0_0_20px_rgba(6,182,212,0.06)]' 
                    : 'bg-zinc-950/40 border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                {/* Mod Header */}
                <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                      isChipjack 
                        ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-400' 
                        : mod.category === 'bioware'
                          ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                          : 'bg-zinc-850 border border-zinc-700 text-zinc-300'
                    }`}>
                      {isChipjack ? <Disc size={20} className={activeChipsCount > 0 ? "animate-spin [animation-duration:8s]" : ""} /> : <Cpu size={20} />}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-black text-white font-mono">
                          {mod.name}
                        </h3>
                        {isChipjack && (
                          <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-[10px] font-mono font-bold flex items-center gap-1">
                            <Disc size={10} />
                            Chipbuchse (Stufe {mod.rating || 1})
                          </span>
                        )}
                        <span className="px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-300 text-[10px] font-mono uppercase">
                          {mod.category}
                        </span>
                        {mod.grade && (
                          <span className="px-1.5 py-0.5 rounded bg-zinc-850 text-zinc-400 text-[10px] font-mono">
                            {GRADE_LABELS[mod.grade] || mod.grade}
                          </span>
                        )}
                        {mod.rating && !isChipjack && (
                          <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[10px] font-mono">
                            Stufe {mod.rating}
                          </span>
                        )}
                      </div>

                      {mod.description && (
                        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                          {mod.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right side stats & actions */}
                  <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-800">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                        -{Number(mod.essenceCost).toFixed(2)} Essenz
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditMod(mod)}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all text-xs"
                        title="Mod bearbeiten"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteMod(mod.id)}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-950 text-zinc-400 hover:text-red-400 transition-all text-xs"
                        title="Mod entfernen"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* SPECIAL SECTION: Chipjack (Chipbuchse) Dedicated Inventory */}
                {isChipjack && (
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-2 border-t border-cyan-500/15">
                    {/* Chipjack header & Active Chip Indicator */}
                    <div className="p-3 rounded-xl bg-cyan-950/25 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-3 h-3 rounded-full shrink-0 ${activeChipsCount > 0 ? 'bg-cyan-400 animate-ping' : 'bg-zinc-600'}`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold uppercase text-cyan-300">
                              Status: {activeChipsCount > 0 ? `${activeChipsCount} Soft-Chip(s) aktiv im Slot` : 'Slot leer / Kein Chip aktiv'}
                            </span>
                          </div>
                          <span className="text-[11px] text-zinc-400">
                            Kapazität: Maximal {mod.rating || 1} Soft(s) gleichzeitig geladen.
                          </span>
                        </div>
                      </div>

                      {/* Add Chip Button */}
                      <button
                        onClick={() => setTargetChipjackId(targetChipjackId === mod.id ? null : mod.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-bold transition-all self-start sm:self-auto"
                        id={`btn-add-chip-${mod.id}`}
                      >
                        <Plus size={13} />
                        Neuen Chip einlegen
                      </button>
                    </div>

                    {/* Inline Add Chip Form if open for this Chipjack */}
                    {targetChipjackId === mod.id && (
                      <div className="p-4 rounded-xl bg-zinc-900 border border-cyan-500/40 mb-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold uppercase text-cyan-400 flex items-center gap-1.5">
                            <Disc size={13} /> Neuen Chip für {mod.name} anlegen
                          </span>
                          <button 
                            onClick={() => setTargetChipjackId(null)}
                            className="text-zinc-500 hover:text-white"
                          >
                            <X size={14} />
                          </button>
                        </div>

                        {/* Quick Presets */}
                        <div>
                          <label className="text-[10px] text-zinc-500 uppercase font-mono block mb-1">
                            Schnell-Vorlagen:
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {CHIP_PRESETS.map((preset, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  setNewChipName(preset.name);
                                  setNewChipType(preset.type);
                                  setNewChipRating(preset.rating);
                                  setNewChipNotes(preset.notes);
                                }}
                                className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-cyan-300 text-[11px] font-mono border border-zinc-700 transition-all"
                              >
                                {preset.name}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                          <div className="sm:col-span-6">
                            <label className="text-[10px] text-zinc-400 uppercase font-mono block mb-1">
                              Chip-Bezeichnung *
                            </label>
                            <input
                              type="text"
                              value={newChipName}
                              onChange={(e) => setNewChipName(e.target.value)}
                              placeholder="z.B. Sprachen-Chip: Portugiesisch"
                              className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
                            />
                          </div>

                          <div className="sm:col-span-4">
                            <label className="text-[10px] text-zinc-400 uppercase font-mono block mb-1">
                              Chip-Typ
                            </label>
                            <select
                              value={newChipType}
                              onChange={(e) => setNewChipType(e.target.value as ShadowrunChipType)}
                              className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
                            >
                              <option value="lingwasoft">Sprachen-Chip (Lingwasoft)</option>
                              <option value="knowsoft">Wissenssoft (Knowsoft)</option>
                              <option value="actsoft">Aktsoft (Fertigkeit)</option>
                              <option value="datachip">Datachip (Paydata/Dateien)</option>
                              <option value="other">Sonstiges</option>
                            </select>
                          </div>

                          <div className="sm:col-span-2">
                            <label className="text-[10px] text-zinc-400 uppercase font-mono block mb-1">
                              Stufe (1-6)
                            </label>
                            <input
                              type="number"
                              min={1}
                              max={6}
                              value={newChipRating}
                              onChange={(e) => setNewChipRating(parseInt(e.target.value, 10) || 1)}
                              className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] text-zinc-400 uppercase font-mono block mb-1">
                            Effekt & Notizen (z.B. &quot;Spricht & versteht fließend Portugiesisch auf Stufe 3&quot;)
                          </label>
                          <input
                            type="text"
                            value={newChipNotes}
                            onChange={(e) => setNewChipNotes(e.target.value)}
                            placeholder="Regelauswirkung oder Inhalt..."
                            className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            onClick={() => setTargetChipjackId(null)}
                            className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono"
                          >
                            Abbrechen
                          </button>
                          <button
                            onClick={() => handleAddChip(mod.id)}
                            disabled={!newChipName.trim()}
                            className="px-3 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black text-xs font-mono font-bold flex items-center gap-1.5"
                          >
                            <Plus size={13} /> Speichern
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Chips Inventory List */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 uppercase tracking-wider px-1">
                        <span>Verfügbare Soft-Chips im Inventar ({chips.length})</span>
                        <span>Status / Einstecken</span>
                      </div>

                      {chips.length === 0 ? (
                        <div className="p-4 text-center rounded-xl bg-zinc-900/50 border border-zinc-800 text-zinc-500 text-xs font-mono">
                          Keine Chips für diese Chipbuchse angelegt. Klicke auf &quot;Neuen Chip einlegen&quot;.
                        </div>
                      ) : (
                        chips.map((chip) => {
                          return (
                            <div
                              key={chip.id}
                              className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                chip.isActive 
                                  ? 'bg-cyan-950/40 border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.15)]' 
                                  : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700'
                              }`}
                            >
                              <div className="flex items-start gap-2.5">
                                <button
                                  onClick={() => handleToggleChip(mod.id, chip.id)}
                                  className={`mt-0.5 p-1.5 rounded-lg border transition-all shrink-0 ${
                                    chip.isActive
                                      ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                                      : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-500'
                                  }`}
                                  title={chip.isActive ? "Chip auswerfen / deaktivieren" : "Chip in Chipbuchse einstecken / aktivieren"}
                                  id={`btn-toggle-chip-${chip.id}`}
                                >
                                  <Power size={13} className={chip.isActive ? "stroke-[3px]" : ""} />
                                </button>

                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className={`text-xs font-mono font-bold ${chip.isActive ? 'text-cyan-300' : 'text-zinc-200'}`}>
                                      {chip.name}
                                    </span>
                                    {getChipTypeBadge(chip.type)}
                                    <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px] font-mono font-bold">
                                      Stufe {chip.rating}
                                    </span>
                                  </div>
                                  {chip.notes && (
                                    <p className="text-[11px] text-zinc-400 mt-1 font-mono">
                                      {chip.notes}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800">
                                {/* Status badge button */}
                                <button
                                  onClick={() => handleToggleChip(mod.id, chip.id)}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                                    chip.isActive
                                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30'
                                      : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700 hover:border-zinc-600'
                                  }`}
                                >
                                  {chip.isActive ? (
                                    <>
                                      <CheckCircle2 size={12} className="text-cyan-400" />
                                      EINGESTECKT (ONLINE)
                                    </>
                                  ) : (
                                    <>
                                      <Disc size={12} />
                                      Inaktiv (In Tasche)
                                    </>
                                  )}
                                </button>

                                <button
                                  onClick={() => handleDeleteChip(mod.id, chip.id)}
                                  className="p-1 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-950/40 transition-all"
                                  title="Chip aus Inventar löschen"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Mod Modal */}
      {showAddModModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-cyan-500/40 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Cpu size={20} className="text-cyan-400" />
                <h3 className="text-lg font-black text-white font-mono uppercase">
                  {editingMod ? 'Body-Modifikation bearbeiten' : 'Neue Body-Modifikation einbauen'}
                </h3>
              </div>
              <button 
                onClick={() => setShowAddModModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Presets for New Mod */}
            {!editingMod && (
              <div>
                <label className="text-[10px] text-zinc-400 uppercase font-mono block mb-1.5">
                  Schnellauswahl gängiger Ware & Schnittstellen:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {MOD_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setFormName(preset.name);
                        setFormCategory(preset.category);
                        setFormGrade(preset.grade);
                        setFormEssence(preset.essenceCost.toString());
                        setFormRating(preset.rating.toString());
                        setFormDescription(preset.description);
                        setFormIsChipjack(preset.isChipjack);
                      }}
                      className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-cyan-300 text-xs font-mono border border-zinc-700 transition-all flex items-center gap-1"
                    >
                      {preset.isChipjack && <Disc size={11} className="text-cyan-400" />}
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Mod Name */}
            <div>
              <label className="text-xs text-zinc-300 font-mono block mb-1">
                Name des Implantats / Modifikators *
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="z.B. Datenbuchse, Chipbuchse, Drahtreflexe..."
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Category */}
              <div>
                <label className="text-xs text-zinc-300 font-mono block mb-1">
                  Kategorie
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as ShadowrunBodyModCategory)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono text-xs focus:border-cyan-500 focus:outline-none"
                >
                  <option value="cyberware">Cyberware (Mechanisch/Elektronisch)</option>
                  <option value="bioware">Bioware (Gentechnisch/Organisch)</option>
                  <option value="cyberdeck">Cyberdeck / Rig / Intern</option>
                  <option value="genetech">Genetech</option>
                  <option value="other">Sonstiges</option>
                </select>
              </div>

              {/* Grade */}
              <div>
                <label className="text-xs text-zinc-300 font-mono block mb-1">
                  Ware-Qualität / Grade
                </label>
                <select
                  value={formGrade}
                  onChange={(e) => setFormGrade(e.target.value as ShadowrunWareGrade)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono text-xs focus:border-cyan-500 focus:outline-none"
                >
                  <option value="used">Gebraucht (+20% Essenz)</option>
                  <option value="standard">Standard (100% Essenz)</option>
                  <option value="alphaware">Alphaware (-20% Essenz)</option>
                  <option value="betaware">Betaware (-30% Essenz)</option>
                  <option value="deltaware">Deltaware (-50% Essenz)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Essence Cost */}
              <div>
                <label className="text-xs text-zinc-300 font-mono block mb-1">
                  Essenzkosten (z.B. 0.1 oder 0.2)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="6"
                  value={formEssence}
                  onChange={(e) => setFormEssence(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono text-sm focus:border-cyan-500 focus:outline-none"
                />
              </div>

              {/* Rating */}
              <div>
                <label className="text-xs text-zinc-300 font-mono block mb-1">
                  Stufe (Rating)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formRating}
                  onChange={(e) => setFormRating(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono text-sm focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Chipjack Toggle */}
            <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formIsChipjack}
                  onChange={(e) => setFormIsChipjack(e.target.checked)}
                  className="mt-1 rounded text-cyan-500 focus:ring-cyan-500"
                />
                <div>
                  <span className="text-xs font-mono font-bold text-cyan-300 block">
                    Ist eine Chipbuchse (Chipjack) mit eigenem Soft-Inventar
                  </span>
                  <span className="text-[11px] text-zinc-400 block mt-0.5">
                    Aktiviert einen dedizierten Chip-Slot für Sprach-Chips (Lingwasofts), Wissenssofts und Aktsofts mit Einsteck- & Umschaltfunktion.
                  </span>
                </div>
              </label>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs text-zinc-300 font-mono block mb-1">
                Beschreibung & Regeln
              </label>
              <textarea
                rows={2}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Regelauswirkungen, z.B. DNI-Funktion, +2 Würfelpool auf Schusswaffen etc."
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono text-xs focus:border-cyan-500 focus:outline-none"
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                onClick={() => setShowAddModModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSaveMod}
                disabled={!formName.trim()}
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-mono font-bold text-xs flex items-center gap-2"
              >
                <Check size={14} />
                {editingMod ? 'Änderungen speichern' : 'Modifikation einbauen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
