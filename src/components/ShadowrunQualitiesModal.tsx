import React, { useState, FC } from "react";
import { motion } from "motion/react";
import { 
  X, 
  Sparkles, 
  Plus, 
  Check, 
  Search, 
  Shield, 
  Zap, 
  Cpu, 
  Flame, 
  Trash2, 
  Layers,
  Terminal,
  Activity
} from "lucide-react";
import { Ability, CharacterData } from "../types";
import { SHADOWRUN_PRESETS, ShadowrunQualityPreset } from "../data/shadowrunQualities";

interface ShadowrunQualitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: CharacterData;
  onUpdateAbilities: (newAbilities: Ability[]) => void;
}

export const ShadowrunQualitiesModal: FC<ShadowrunQualitiesModalProps> = ({
  isOpen,
  onClose,
  character,
  onUpdateAbilities,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<'all' | 'Vorteil' | 'Nachteil' | 'Ki-Kraft' | 'Zauber' | 'Resonanz' | 'Metatyp'>('all');
  const [showCustomForm, setShowCustomForm] = useState(false);

  // Form states for custom quality
  const [customName, setCustomName] = useState("");
  const [customType, setCustomType] = useState<Ability['type']>('quality');
  const [customUsage, setCustomUsage] = useState("Permanent");
  const [customKarma, setCustomKarma] = useState<number | undefined>(undefined);
  const [customEffect, setCustomEffect] = useState("");

  if (!isOpen) return null;

  const characterAbilities = character.abilities || [];

  // Filter out any potential non-SR abilities (like rogue talents or D&D class feats) for the list
  const currentQualities = characterAbilities.filter(
    (a) => a.type !== "rogue_talent" && a.type !== "class"
  );

  const isAbilityAlreadyAdded = (name: string) => {
    const clean = name.toLowerCase().replace(/\(.*?\)/g, "").trim();
    return currentQualities.some(
      (a) => a.name.toLowerCase().replace(/\(.*?\)/g, "").trim() === clean
    );
  };

  const handleAddPreset = (preset: ShadowrunQualityPreset) => {
    if (isAbilityAlreadyAdded(preset.name)) return;
    const newAbility: Ability = {
      name: preset.name,
      type: preset.type,
      usage: preset.usage || "Permanent",
      effect: preset.effect,
      karmaCost: preset.karmaCost,
      powerPoints: preset.powerPoints,
      drain: preset.drain,
      category: preset.category
    };
    onUpdateAbilities([...characterAbilities, newAbility]);
  };

  const handleRemoveQuality = (name: string) => {
    const updated = characterAbilities.filter((a) => a.name !== name);
    onUpdateAbilities(updated);
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || !customEffect.trim()) return;

    const newAbility: Ability = {
      name: customName.trim(),
      type: customType,
      usage: customUsage.trim() || "Permanent",
      effect: customEffect.trim(),
      karmaCost: customKarma,
      category: customType === 'quality' ? 'Vorteil' : customType === 'flaw' ? 'Nachteil' : customType === 'adept_power' ? 'Ki-Kraft' : 'Fähigkeit'
    };

    onUpdateAbilities([...characterAbilities, newAbility]);
    setCustomName("");
    setCustomUsage("Permanent");
    setCustomKarma(undefined);
    setCustomEffect("");
    setShowCustomForm(false);
  };

  const filteredPresets = SHADOWRUN_PRESETS.filter((preset) => {
    const matchesSearch =
      preset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      preset.effect.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (preset.usage || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (preset.category || "").toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (activeCategory === "all") return true;
    return preset.category === activeCategory;
  });

  // Calculate karma balance from qualities
  const karmaSpent = currentQualities
    .filter(a => a.type === 'quality' || (a.karmaCost && a.karmaCost > 0))
    .reduce((sum, a) => sum + (a.karmaCost || 0), 0);

  const karmaGained = currentQualities
    .filter(a => a.type === 'flaw' || (a.karmaCost && a.karmaCost < 0))
    .reduce((sum, a) => sum + Math.abs(a.karmaCost || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-4xl max-h-[90vh] bg-zinc-950 border border-cyan-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-zinc-100"
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 bg-gradient-to-r from-cyan-950/40 via-zinc-900 to-zinc-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
              <Terminal size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Vor- & Nachteile & Kräfte</span>
                  <span className="text-xs text-cyan-400 font-mono font-normal">Shadowrun 5e / 6e</span>
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {currentQualities.length} Notiert
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Katalog für Vor- und Nachteile, Ki-Adeptenkräfte, Zauber und Gaben für {character.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Active Qualities */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs uppercase tracking-wider font-bold text-cyan-400 flex items-center gap-2">
                <Zap size={14} />
                Aktuell notierte Schatten-Gaben ({currentQualities.length})
              </h3>
              {(karmaSpent > 0 || karmaGained > 0) && (
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  <span className="text-emerald-400">Vorteile: -{karmaSpent} Karma</span>
                  <span className="text-zinc-600">•</span>
                  <span className="text-rose-400">Nachteile: +{karmaGained} Karma</span>
                </div>
              )}
            </div>

            {currentQualities.length === 0 ? (
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-dashed border-zinc-800 text-center text-xs text-zinc-500">
                Noch keine Vor- oder Nachteile notiert. Wähle unten aus dem Katalog oder lege eine eigene Gabe an.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentQualities.map((item, idx) => {
                  const isPositive = item.type === 'quality' || item.type === 'adept_power' || (item.karmaCost && item.karmaCost > 0);
                  const isNegative = item.type === 'flaw' || (item.karmaCost && item.karmaCost < 0);
                  
                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between group hover:border-cyan-500/40 transition-all"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div>
                            <span className="font-bold text-white text-sm block">
                              {item.name}
                            </span>
                            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                              <span className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-mono font-bold ${
                                item.type === 'quality' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                                item.type === 'flaw' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                                item.type === 'adept_power' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                                item.type === 'spell' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                                item.type === 'item' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                                'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                              }`}>
                                {item.type === 'quality' ? 'Vorteil' :
                                 item.type === 'flaw' ? 'Nachteil' :
                                 item.type === 'adept_power' ? 'Ki-Kraft' :
                                 item.type === 'spell' ? 'Zauber/Resonanz' :
                                 item.type === 'item' ? 'Ware/Tech' : 'Gabe'}
                              </span>
                              {item.karmaCost !== undefined && (
                                <span className={`text-[9px] font-mono font-bold ${item.karmaCost > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {item.karmaCost > 0 ? `+${item.karmaCost}` : item.karmaCost} Karma
                                </span>
                              )}
                              {item.powerPoints !== undefined && (
                                <span className="text-[9px] font-mono text-purple-300">
                                  {item.powerPoints} KP
                                </span>
                              )}
                              {item.drain && (
                                <span className="text-[9px] font-mono text-indigo-300">
                                  Entzug: {item.drain}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveQuality(item.name)}
                            className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-zinc-800 transition-colors opacity-70 group-hover:opacity-100 cursor-pointer"
                            title="Entfernen"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <p className="text-xs text-zinc-400 line-clamp-3">
                          {item.effect}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Preset Catalog Section */}
          <div className="pt-4 border-t border-zinc-800/80">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-xs uppercase tracking-wider font-bold text-zinc-200 flex items-center gap-2">
                  <Layers size={14} className="text-cyan-400" />
                  Schatten-Katalog (Regelwerk)
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Offizielle Vor- und Nachteile sowie Gaben für Shadowrun 5e
                </p>
              </div>

              <button
                onClick={() => setShowCustomForm(!showCustomForm)}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-cyan-300 border border-zinc-700 hover:border-cyan-500/50 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus size={13} />
                <span>{showCustomForm ? "Katalog anzeigen" : "Eigene Gabe anlegen"}</span>
              </button>
            </div>

            {/* Custom Form */}
            {showCustomForm ? (
              <form
                onSubmit={handleAddCustom}
                className="p-5 rounded-2xl bg-zinc-900 border border-cyan-500/30 space-y-4 mb-6"
              >
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    Eigene Shadowrun-Fähigkeit / Vor- oder Nachteil erstellen
                  </h4>
                  <span className="text-[10px] text-zinc-500 font-mono">Freie Definition</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="z. B. Beidhändig, Allergie, Kampfsinn..."
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1">
                      Kategorie / Typ
                    </label>
                    <select
                      value={customType}
                      onChange={(e) => setCustomType(e.target.value as Ability['type'])}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="quality">Vorteil (Positive Quality)</option>
                      <option value="flaw">Nachteil (Negative Quality)</option>
                      <option value="adept_power">Ki-Adeptenkraft</option>
                      <option value="spell">Zauber / Resonanz</option>
                      <option value="trait">Metatyp / Sonstiges</option>
                      <option value="item">Ware / Tech-Effekt</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1">
                      Karma-Kosten (optional)
                    </label>
                    <input
                      type="number"
                      placeholder="z. B. 5 (Vorteil) oder -5 (Nachteil)"
                      value={customKarma !== undefined ? customKarma : ""}
                      onChange={(e) => setCustomKarma(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1">
                    Genaue spielmechanische Auswirkung
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Regeltechnischer Effekt, Würfelmodifikatoren, Boni oder Einschränkungen..."
                    value={customEffect}
                    onChange={(e) => setCustomEffect(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCustomForm(false)}
                    className="px-4 py-1.5 rounded-xl bg-zinc-800 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    Speichern & Hinzufügen
                  </button>
                </div>
              </form>
            ) : null}

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search
                  size={14}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
                />
                <input
                  type="text"
                  placeholder="Katalog durchsuchen (z. B. Schnellzieher, Allergie, Ki-Kraft, Karma...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-2xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition-colors"
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
                {(['all', 'Vorteil', 'Nachteil', 'Ki-Kraft', 'Zauber', 'Resonanz', 'Metatyp'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      activeCategory === cat
                        ? "bg-cyan-500 text-black shadow-md font-bold"
                        : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
                    }`}
                  >
                    {cat === 'all' ? 'Alle' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Catalog Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredPresets.map((preset) => {
                const isAdded = isAbilityAlreadyAdded(preset.name);
                const isPositive = preset.category === 'Vorteil';
                const isNegative = preset.category === 'Nachteil';
                const isAdept = preset.category === 'Ki-Kraft';
                const isMagic = preset.category === 'Zauber' || preset.category === 'Resonanz';

                return (
                  <div
                    key={preset.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                      isAdded
                        ? "bg-cyan-950/20 border-cyan-500/30 opacity-75"
                        : "bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700"
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white">
                              {preset.name}
                            </h4>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                                isPositive
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : isNegative
                                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                  : isAdept
                                  ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                  : isMagic
                                  ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                                  : "bg-zinc-800 text-zinc-400"
                              }`}
                            >
                              {preset.category}
                            </span>
                            {preset.karmaCost !== undefined && (
                              <span className={`text-[10px] font-mono font-bold ${preset.karmaCost > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {preset.karmaCost > 0 ? `+${preset.karmaCost}` : preset.karmaCost} Karma
                              </span>
                            )}
                            {preset.powerPoints !== undefined && (
                              <span className="text-[10px] font-mono text-purple-300">
                                {preset.powerPoints} KP
                              </span>
                            )}
                            {preset.drain && (
                              <span className="text-[10px] font-mono text-indigo-300">
                                Entzug: {preset.drain}
                              </span>
                            )}
                            {preset.usage && (
                              <span className="text-[9px] text-zinc-500 font-mono">
                                • {preset.usage}
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleAddPreset(preset)}
                          disabled={isAdded}
                          className={`shrink-0 p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                            isAdded
                              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 cursor-default"
                              : "bg-zinc-800 hover:bg-cyan-500 text-zinc-300 hover:text-black border border-zinc-700 hover:border-cyan-400"
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <Check size={14} className="text-cyan-400" />
                              <span className="text-[11px]">Notiert</span>
                            </>
                          ) : (
                            <>
                              <Plus size={14} />
                              <span className="text-[11px]">Hinzufügen</span>
                            </>
                          )}
                        </button>
                      </div>

                      <p className="text-xs text-zinc-400 leading-relaxed mb-2">
                        {preset.effect}
                      </p>
                    </div>

                    {preset.source && (
                      <div className="text-[10px] text-zinc-600 font-mono pt-2 border-t border-zinc-800/40">
                        Quelle: {preset.source}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between text-xs text-zinc-500 font-mono">
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-cyan-400" />
            <span>Vor- und Nachteile & Kräfte werden direkt im Dashboard und auf dem Runner-Bogen synchronisiert.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold transition-colors cursor-pointer"
          >
            Schließen
          </button>
        </div>
      </motion.div>
    </div>
  );
};
