import React, { useState, FC } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Sparkles, Plus, Check, Search, Shield, Zap, BookOpen, Trash2 } from "lucide-react";
import { Ability, CharacterData } from "../types";
import { PATHFINDER_ROGUE_TALENTS, RogueTalentPreset } from "../data/pathfinderRogueTalents";

interface RogueTalentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: CharacterData;
  onUpdateAbilities: (newAbilities: Ability[]) => void;
}

export const RogueTalentsModal: FC<RogueTalentsModalProps> = ({
  isOpen,
  onClose,
  character,
  onUpdateAbilities,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<'all' | 'basic' | 'advanced'>('all');
  const [customName, setCustomName] = useState("");
  const [customUsage, setCustomUsage] = useState("");
  const [customEffect, setCustomEffect] = useState("");
  const [customPage, setCustomPage] = useState("");
  const [showCustomForm, setShowCustomForm] = useState(false);

  if (!isOpen) return null;

  const characterAbilities = character.abilities || [];
  const currentRogueTalents = characterAbilities.filter(
    (a) => a.type === "rogue_talent" || a.name.toLowerCase().includes("schurken-finesse") || a.name.toLowerCase().includes("blutende wunde")
  );

  const isTalentAlreadyAdded = (talentName: string) => {
    const cleanName = talentName.toLowerCase().replace(/\(.*?\)/g, "").trim();
    return currentRogueTalents.some(
      (a) => a.name.toLowerCase().replace(/\(.*?\)/g, "").trim() === cleanName
    );
  };

  const handleAddPreset = (preset: RogueTalentPreset) => {
    if (isTalentAlreadyAdded(preset.name)) return;
    const newAbility: Ability = {
      name: preset.name,
      type: "rogue_talent",
      usage: preset.usage || "Passiv / Aktiv",
      effect: preset.effect,
      page: preset.page,
      maxUses: preset.maxUses,
      currentUses: preset.maxUses
    };
    onUpdateAbilities([...characterAbilities, newAbility]);
  };

  const handleRemoveTalent = (name: string) => {
    const updated = characterAbilities.filter((a) => a.name !== name);
    onUpdateAbilities(updated);
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || !customEffect.trim()) return;

    const newAbility: Ability = {
      name: customName.trim(),
      type: "rogue_talent",
      usage: customUsage.trim() || "Passiv",
      effect: customEffect.trim(),
      page: customPage.trim() || undefined,
    };

    onUpdateAbilities([...characterAbilities, newAbility]);
    setCustomName("");
    setCustomUsage("");
    setCustomEffect("");
    setCustomPage("");
    setShowCustomForm(false);
  };

  const filteredPresets = PATHFINDER_ROGUE_TALENTS.filter((talent) => {
    const matchesQuery =
      talent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      talent.effect.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (talent.usage || "").toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesQuery) return false;
    if (activeFilter === "basic") return !talent.isAdvanced;
    if (activeFilter === "advanced") return !!talent.isAdvanced;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-4xl max-h-[90vh] bg-zinc-900 border border-amber-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-zinc-100"
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 bg-gradient-to-r from-amber-950/40 to-zinc-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Schurkentricks (Rogue Talents)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {currentRogueTalents.length} aktiv notiert
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Verwalte Schurkentricks für {character.name} (Pathfinder 1e)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Currently Active Rogue Talents on Character */}
          <div>
            <h3 className="text-xs uppercase tracking-wider font-bold text-amber-400 mb-3 flex items-center gap-2">
              <Zap size={14} />
              Aktuell notierte Schurkentricks ({currentRogueTalents.length})
            </h3>
            {currentRogueTalents.length === 0 ? (
              <div className="p-4 rounded-2xl bg-zinc-950/60 border border-dashed border-zinc-800 text-center text-xs text-zinc-500">
                Noch keine Schurkentricks eingetragen. Wähle unten aus dem Katalog oder erstelle einen eigenen Trick.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentRogueTalents.map((talent, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-zinc-950/80 border border-amber-500/20 flex flex-col justify-between group hover:border-amber-500/40 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-sm font-bold text-amber-200">
                          {talent.name}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {talent.usage && (
                            <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] font-mono text-zinc-300">
                              {talent.usage}
                            </span>
                          )}
                          <button
                            onClick={() => handleRemoveTalent(talent.name)}
                            className="text-zinc-500 hover:text-red-400 p-1 transition-colors"
                            title="Schurkentrick entfernen"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        {talent.effect}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Custom Talent Creation Toggle */}
          <div className="pt-2 border-t border-zinc-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs uppercase tracking-wider font-bold text-zinc-300 flex items-center gap-2">
                <BookOpen size={14} className="text-amber-500" />
                Schurken-Katalog & Eigene Tricks
              </h3>
              <button
                type="button"
                onClick={() => setShowCustomForm(!showCustomForm)}
                className="text-xs font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-all"
              >
                <Plus size={13} />
                <span>{showCustomForm ? "Katalog anzeigen" : "Eigenen Trick erfassen"}</span>
              </button>
            </div>

            {showCustomForm && (
              <form onSubmit={handleAddCustom} className="p-4 rounded-2xl bg-zinc-950/90 border border-amber-500/30 space-y-3 mb-5">
                <div className="font-bold text-sm text-amber-300 mb-1">Neuen Schurkentrick notieren</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Name des Tricks</label>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="z.B. Listige Finte"
                      required
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Anwendung / Auslöser</label>
                    <input
                      type="text"
                      value={customUsage}
                      onChange={(e) => setCustomUsage(e.target.value)}
                      placeholder="z.B. Standardaktion / 1x/Tag"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1 font-mono flex items-center gap-1">
                      <BookOpen size={10} className="text-amber-400" />
                      <span>Regelbuch / Buchseite</span>
                    </label>
                    <input
                      type="text"
                      value={customPage}
                      onChange={(e) => setCustomPage(e.target.value)}
                      placeholder="z.B. GRW S. 68"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Regel-Effekt</label>
                  <textarea
                    value={customEffect}
                    onChange={(e) => setCustomEffect(e.target.value)}
                    placeholder="Genaue Beschreibung des Schurkentricks und spielmechanische Auswirkungen..."
                    rows={2}
                    required
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowCustomForm(false)}
                    className="px-3 py-1.5 rounded-xl text-xs text-zinc-400 hover:text-white"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl text-xs font-bold bg-amber-500 text-black hover:bg-amber-400 flex items-center gap-1.5 transition-all shadow-md"
                  >
                    <Plus size={14} />
                    Trick hinzufügen
                  </button>
                </div>
              </form>
            )}

            {/* Catalog Filter & Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Katalog durchsuchen (Name, Blutung, Finesse, Reflex...)"
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="flex items-center gap-1 bg-zinc-950/80 p-1 rounded-xl border border-zinc-800 text-xs">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-all ${activeFilter === 'all' ? 'bg-amber-500 text-black font-bold' : 'text-zinc-400 hover:text-white'}`}
                >
                  Alle ({PATHFINDER_ROGUE_TALENTS.length})
                </button>
                <button
                  onClick={() => setActiveFilter('basic')}
                  className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-all ${activeFilter === 'basic' ? 'bg-amber-500 text-black font-bold' : 'text-zinc-400 hover:text-white'}`}
                >
                  Basis
                </button>
                <button
                  onClick={() => setActiveFilter('advanced')}
                  className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-all ${activeFilter === 'advanced' ? 'bg-amber-500 text-black font-bold' : 'text-zinc-400 hover:text-white'}`}
                >
                  Verbessert (10+)
                </button>
              </div>
            </div>

            {/* Catalog List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-1">
              {filteredPresets.map((talent, idx) => {
                const added = isTalentAlreadyAdded(talent.name);
                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                      added
                        ? "bg-zinc-950/40 border-zinc-800/80 opacity-75"
                        : "bg-zinc-950/80 border-zinc-800 hover:border-amber-500/40"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-sm font-bold text-zinc-100">
                          {talent.name}
                        </span>
                        <div className="flex items-center gap-1">
                          {talent.isAdvanced && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              Stufe 10+
                            </span>
                          )}
                          {talent.page && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono text-amber-300 bg-amber-950/40 border border-amber-900/50 flex items-center gap-1" title="Regelbuch-Referenz">
                              <BookOpen size={9} className="text-amber-400" />
                              <span>{talent.page}</span>
                            </span>
                          )}
                          {talent.usage && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-zinc-800 text-zinc-400">
                              {talent.usage}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        {talent.effect}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-zinc-900 flex justify-end">
                      {added ? (
                        <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                          <Check size={13} /> Bereits notiert
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAddPreset(talent)}
                          className="px-3 py-1 rounded-xl text-xs font-semibold bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/30 flex items-center gap-1 transition-all"
                        >
                          <Plus size={12} /> Hinzufügen
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-between text-xs text-zinc-500 shrink-0">
          <span>Tipp: Notierte Schurkentricks erscheinen direkt auf Seite 2 des druckbaren Charakterbogens.</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition-colors"
          >
            Fertig
          </button>
        </div>
      </motion.div>
    </div>
  );
};
