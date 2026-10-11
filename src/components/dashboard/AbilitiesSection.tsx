import React, { FC, useState, useMemo } from "react";
import { 
  Target, 
  Sparkles, 
  Skull, 
  Activity, 
  Wind, 
  Zap, 
  Backpack, 
  Shield, 
  Cpu, 
  Flame, 
  AlertTriangle,
  Plus,
  ChevronDown,
  ChevronRight,
  Search,
  ChevronsUpDown,
  BookOpen
} from "lucide-react";
import { CharacterData, Ability } from "../../types";
import { AbilityItem } from "../common/AbilityItem";

export interface AbilitiesSectionProps {
  character: CharacterData;
  isEditing: boolean;
  onUpdateData: (partial: Partial<CharacterData>) => void;
  onOpenRogueTalentModal: () => void;
  onOpenShadowrunQualitiesModal?: () => void;
}

interface CategoryConfig {
  id: string;
  label: string;
  shortLabel: string;
  color: string;
  icon: React.ReactNode;
  filter: (a: Ability) => boolean;
  defaultType: Ability['type'];
  defaultName: string;
  hasCatalog?: boolean;
}

export const AbilitiesSection: FC<AbilitiesSectionProps> = ({
  character,
  isEditing,
  onUpdateData,
  onOpenRogueTalentModal,
  onOpenShadowrunQualitiesModal
}) => {
  const isPF = character.system === 'pathfinder';
  const isSR = character.system === 'shadowrun';
  const isCoC = character.system === 'coc7e' || character.system === 'coc1920';

  const [selectedTab, setSelectedTab] = useState<string>("all");
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState<string>("");

  const toggleCategory = (catId: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  const setAllCollapsed = (collapsed: boolean) => {
    const updated: Record<string, boolean> = {};
    categories.forEach(c => {
      updated[c.id] = collapsed;
    });
    setCollapsedCategories(updated);
  };

  // -------------------------------------------------------------
  // SHADOWRUN CATEGORIES
  // -------------------------------------------------------------
  const srCategories: CategoryConfig[] = useMemo(() => {
    const isFlaw = (a: Ability) => {
      if (a.type === 'flaw' || a.category === 'Nachteil') return true;
      if (a.karmaCost !== undefined && a.karmaCost < 0) return true;
      const l = a.name.toLowerCase();
      return (
        l.includes('allergie') ||
        l.includes('schlechter ruf') ||
        l.includes('verpflichtung') ||
        l.includes('gesucht') ||
        l.includes('abhängig') ||
        l.includes('pech') ||
        l.includes('glaskiefer') ||
        l.includes('feind') ||
        l.includes('schlaflosigkeit')
      );
    };

    const isPositiveQuality = (a: Ability) => {
      if (isFlaw(a)) return false;
      if (a.type === 'quality' || a.category === 'Vorteil') return true;
      if (a.type === 'talent' || a.type === 'trait') return true;
      return false;
    };

    return [
      {
        id: 'positive_qualities',
        label: 'Vorteile (Positive Qualities)',
        shortLabel: 'Vorteile',
        color: 'text-emerald-400',
        icon: <Sparkles size={14} className="text-emerald-400" />,
        filter: isPositiveQuality,
        defaultType: 'quality',
        defaultName: 'Neuer Vorteil',
        hasCatalog: true,
      },
      {
        id: 'negative_qualities',
        label: 'Nachteile (Negative Qualities)',
        shortLabel: 'Nachteile',
        color: 'text-rose-400',
        icon: <AlertTriangle size={14} className="text-rose-400" />,
        filter: isFlaw,
        defaultType: 'flaw',
        defaultName: 'Neuer Nachteil',
        hasCatalog: true,
      },
      {
        id: 'adept_powers',
        label: 'Ki-Kräfte (Adept Powers)',
        shortLabel: 'Ki-Kräfte',
        color: 'text-purple-400',
        icon: <Zap size={14} className="text-purple-400" />,
        filter: (a: Ability) => a.type === 'adept_power' || a.category === 'Ki-Kraft',
        defaultType: 'adept_power',
        defaultName: 'Neue Ki-Kraft',
      },
      {
        id: 'spells_resonance',
        label: 'Zauber & Komplexe Formen',
        shortLabel: 'Zauber / Magie',
        color: 'text-indigo-400',
        icon: <Flame size={14} className="text-indigo-400" />,
        filter: (a: Ability) => a.type === 'spell' || a.category === 'Zauber' || a.category === 'Resonanz',
        defaultType: 'spell',
        defaultName: 'Neuer Zauber / Komplexe Form',
      },
      {
        id: 'metatype_traits',
        label: 'Metamenschliche Gaben (Metatyp)',
        shortLabel: 'Metatyp',
        color: 'text-cyan-400',
        icon: <Wind size={14} className="text-cyan-400" />,
        filter: (a: Ability) => a.type === 'gnome' || a.category === 'Metatyp' || a.name.includes('(Elf') || a.name.includes('(Zwerg') || a.name.includes('(Troll') || a.name.includes('(Ork'),
        defaultType: 'trait',
        defaultName: 'Neue Metatyp-Gabe',
      },
      {
        id: 'tech_items',
        label: 'Spezielle Ware- & Tech-Vorteile',
        shortLabel: 'Ware / Tech',
        color: 'text-amber-400',
        icon: <Cpu size={14} className="text-amber-400" />,
        filter: (a: Ability) => a.type === 'item',
        defaultType: 'item',
        defaultName: 'Neuer Ware/Tech-Effekt',
      },
    ];
  }, []);

  // -------------------------------------------------------------
  // PATHFINDER, COC & OTHER SYSTEMS CATEGORIES
  // -------------------------------------------------------------
  const pfAndStandardCategories: CategoryConfig[] = useMemo(() => {
    return [
      {
        id: 'rogue_talent',
        label: 'Schurkentricks (Rogue Talents)',
        shortLabel: 'Schurkentricks',
        color: 'text-amber-400',
        icon: <Sparkles size={14} className="text-amber-400" />,
        filter: (a: Ability) => a.type === 'rogue_talent' || (a.category?.toLowerCase().includes('schurken') ?? false),
        defaultType: 'rogue_talent',
        defaultName: 'Neuer Schurkentrick',
        hasCatalog: true,
      },
      {
        id: 'class',
        label: 'Klassenmerkmale & Fähigkeiten',
        shortLabel: 'Klasse',
        color: 'text-orange-400',
        icon: <Skull size={14} className="text-orange-400" />,
        filter: (a: Ability) => a.type === 'class',
        defaultType: 'class',
        defaultName: 'Neues Klassenmerkmal',
      },
      {
        id: 'talent',
        label: 'Talente (Feats)',
        shortLabel: 'Talente',
        color: 'text-blue-400',
        icon: <Activity size={14} className="text-blue-400" />,
        filter: (a: Ability) => a.type === 'talent',
        defaultType: 'talent',
        defaultName: 'Neues Talent',
      },
      {
        id: 'spell',
        label: 'Zauber & Magische Effekte',
        shortLabel: 'Zauber',
        color: 'text-indigo-400',
        icon: <Zap size={14} className="text-indigo-400" />,
        filter: (a: Ability) => a.type === 'spell',
        defaultType: 'spell',
        defaultName: 'Neuer Zauber',
      },
      {
        id: 'gnome',
        label: 'Volksmerkmale & Abstammung',
        shortLabel: 'Volk',
        color: 'text-purple-400',
        icon: <Wind size={14} className="text-purple-400" />,
        filter: (a: Ability) => a.type === 'gnome',
        defaultType: 'gnome',
        defaultName: 'Neues Volksmerkmal',
      },
      {
        id: 'trait',
        label: 'Wesenszüge & Eigenschaften',
        shortLabel: 'Wesenszüge',
        color: 'text-yellow-400',
        icon: <Target size={14} className="text-yellow-400" />,
        filter: (a: Ability) => a.type === 'trait',
        defaultType: 'trait',
        defaultName: 'Neuer Wesenszug',
      },
      {
        id: 'item',
        label: 'Gegenstands-Kräfte & Magie',
        shortLabel: 'Gegenstände',
        color: 'text-emerald-400',
        icon: <Backpack size={14} className="text-emerald-400" />,
        filter: (a: Ability) => a.type === 'item',
        defaultType: 'item',
        defaultName: 'Neue Gegenstandskraft',
      },
    ];
  }, []);

  const categories = isSR ? srCategories : pfAndStandardCategories;
  const allAbilities = character.abilities || [];

  // Filter abilities by search query if present
  const query = searchQuery.trim().toLowerCase();
  const matchesSearch = (a: Ability) => {
    if (!query) return true;
    return (
      a.name.toLowerCase().includes(query) ||
      a.effect.toLowerCase().includes(query) ||
      (a.usage && a.usage.toLowerCase().includes(query)) ||
      (a.page && a.page.toLowerCase().includes(query))
    );
  };

  // Count items per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    categories.forEach(c => {
      counts[c.id] = allAbilities.filter(c.filter).length;
    });
    return counts;
  }, [categories, allAbilities]);

  // Which categories to display based on selected tab
  const visibleCategories = useMemo(() => {
    if (selectedTab === 'all') {
      return categories.filter(c => {
        // In view mode, hide empty categories unless it's rogue_talent on Pathfinder
        const count = categoryCounts[c.id] || 0;
        if (isEditing) return true;
        if (count > 0) return true;
        if (isPF && c.id === 'rogue_talent') return true;
        return false;
      });
    }
    return categories.filter(c => c.id === selectedTab);
  }, [selectedTab, categories, categoryCounts, isEditing, isPF]);

  // Add new ability to a specific category
  const handleAddAbility = (cat: CategoryConfig) => {
    const newAbility: Ability = {
      name: cat.defaultName,
      type: cat.defaultType,
      effect: "Beschreibung & Regeleffekte...",
    };
    onUpdateData({ abilities: [...allAbilities, newAbility] });
  };

  // Check if all visible categories are collapsed
  const isAllCollapsed = visibleCategories.length > 0 && visibleCategories.every(c => !!collapsedCategories[c.id]);

  return (
    <section className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6">
      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          {isSR ? (
            <Shield className="text-cyan-400" size={20} />
          ) : (
            <Target className="text-orange-500" size={20} />
          )}
          <div>
            <h2 className="text-xl font-bold text-white uppercase tracking-tight">
              {isSR ? "Vor- & Nachteile & Kräfte" : "Fähigkeiten & Talente"}
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {allAbilities.length} Einträge insgesamt
            </p>
          </div>
        </div>

        {/* HEADER ACTIONS: Catalog Buttons */}
        <div className="flex items-center gap-2">
          {isPF && (
            <button
              type="button"
              onClick={onOpenRogueTalentModal}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/30 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Sparkles size={13} />
              <span>Schurkentricks Katalog</span>
            </button>
          )}

          {isSR && onOpenShadowrunQualitiesModal && (
            <button
              type="button"
              onClick={onOpenShadowrunQualitiesModal}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500 text-cyan-300 hover:text-black border border-cyan-500/30 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Sparkles size={13} />
              <span>Schatten-Katalog</span>
            </button>
          )}
        </div>
      </div>

      {/* FILTER TABS (REITER) */}
      <div className="mb-6">
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-zinc-950/70 rounded-2xl border border-zinc-800/80 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedTab('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              selectedTab === 'all'
                ? 'bg-zinc-800 text-white shadow-xs font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <span>Alle</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-zinc-700/60 text-zinc-300">
              {allAbilities.length}
            </span>
          </button>

          {categories.map((cat) => {
            const count = categoryCounts[cat.id] || 0;
            // Only hide tabs with 0 count in view mode unless it's PF rogue_talent
            if (!isEditing && count === 0 && !(isPF && cat.id === 'rogue_talent')) {
              return null;
            }

            const isActive = selectedTab === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedTab(cat.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-zinc-800 text-white shadow-xs font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                }`}
              >
                <span className="shrink-0">{cat.icon}</span>
                <span>{cat.shortLabel}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-zinc-700 text-zinc-200' : 'bg-zinc-900 text-zinc-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SEARCH & EXPAND / COLLAPSE TOOLBAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-zinc-800/60">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Fähigkeiten, Effekte oder Buchseite suchen..."
            className="w-full pl-9 pr-3 py-1.5 bg-zinc-950/60 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-hidden focus:border-orange-500 transition-colors"
          />
        </div>

        {selectedTab === 'all' && (
          <button
            type="button"
            onClick={() => setAllCollapsed(!isAllCollapsed)}
            className="self-end sm:self-auto text-xs text-zinc-400 hover:text-zinc-200 px-2.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-950/40 hover:bg-zinc-800/40 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ChevronsUpDown size={13} />
            <span>{isAllCollapsed ? "Alle aufklappen" : "Alle einklappen"}</span>
          </button>
        )}
      </div>

      {/* CATEGORIES LIST (ACCORDION SECTIONS) */}
      <div className="space-y-6">
        {visibleCategories.map((cat) => {
          const catAbilities = allAbilities.filter(cat.filter);
          const filteredAbilities = catAbilities.filter(matchesSearch);
          const isCollapsed = selectedTab === 'all' && !!collapsedCategories[cat.id];

          return (
            <div 
              key={cat.id} 
              className="bg-zinc-950/40 border border-zinc-800/80 rounded-2xl overflow-hidden transition-all"
            >
              {/* CATEGORY ACCORDION HEADER */}
              <div 
                className="flex items-center justify-between px-4 py-3 bg-zinc-900/60 border-b border-zinc-800/60 cursor-pointer select-none hover:bg-zinc-850 transition-colors"
                onClick={() => selectedTab === 'all' && toggleCategory(cat.id)}
              >
                <div className="flex items-center gap-2.5">
                  {selectedTab === 'all' && (
                    <span className="text-zinc-500 hover:text-zinc-300 transition-transform">
                      {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                    </span>
                  )}
                  <span className="shrink-0">{cat.icon}</span>
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${cat.color}`}>
                    {cat.label}
                  </h3>
                  <span className="text-[10px] font-mono text-zinc-500 ml-1">
                    ({catAbilities.length})
                  </span>
                </div>

                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  {cat.hasCatalog && (
                    <button
                      type="button"
                      onClick={() => {
                        if (cat.id === 'rogue_talent') onOpenRogueTalentModal();
                        else if (onOpenShadowrunQualitiesModal) onOpenShadowrunQualitiesModal();
                      }}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60 flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Sparkles size={11} />
                      <span>Katalog</span>
                    </button>
                  )}

                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => handleAddAbility(cat)}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-orange-500/15 hover:bg-orange-500 text-orange-300 hover:text-black border border-orange-500/30 flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Plus size={11} />
                      <span>Hinzufügen</span>
                    </button>
                  )}
                </div>
              </div>

              {/* CATEGORY CONTENT */}
              {!isCollapsed && (
                <div className="p-3 space-y-1">
                  {filteredAbilities.map((a) => {
                    const globalIndex = allAbilities.findIndex(ability => ability === a);
                    return (
                      <AbilityItem 
                        key={globalIndex} 
                        ability={a} 
                        isEditing={isEditing}
                        onChange={(updates) => {
                          const newAbilities = [...allAbilities];
                          newAbilities[globalIndex] = { ...a, ...updates };
                          onUpdateData({ abilities: newAbilities });
                        }}
                        onRemove={() => {
                          const newAbilities = allAbilities.filter((_, idx) => idx !== globalIndex);
                          onUpdateData({ abilities: newAbilities });
                        }}
                      />
                    );
                  })}

                  {/* EMPTY STATE */}
                  {catAbilities.length === 0 && (
                    <div className="p-4 bg-zinc-900/30 border border-dashed border-zinc-800/80 rounded-xl text-center">
                      <p className="text-xs text-zinc-500 mb-2">
                        Keine Einträge unter {cat.shortLabel}.
                      </p>
                      {cat.hasCatalog && cat.id === 'rogue_talent' && (
                        <button
                          type="button"
                          onClick={onOpenRogueTalentModal}
                          className="text-xs font-semibold px-3 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/30 inline-flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Sparkles size={12} />
                          <span>Schurkentricks Katalog öffnen</span>
                        </button>
                      )}
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => handleAddAbility(cat)}
                          className="text-xs font-semibold px-3 py-1 rounded-lg bg-orange-500/15 hover:bg-orange-500 text-orange-300 hover:text-black border border-orange-500/30 inline-flex items-center gap-1.5 transition-all cursor-pointer ml-2"
                        >
                          <Plus size={12} />
                          <span>Jetzt anlegen</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* NO SEARCH RESULTS FOR THIS CATEGORY */}
                  {catAbilities.length > 0 && filteredAbilities.length === 0 && (
                    <p className="text-xs text-zinc-500 italic py-2 px-3 text-center">
                      Keine Treffer für „{searchQuery}“ in {cat.shortLabel}.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {visibleCategories.length === 0 && (
          <div className="p-8 text-center bg-zinc-950/40 rounded-2xl border border-zinc-800">
            <p className="text-sm text-zinc-400">Keine Fähigkeiten in dieser Ansicht vorhanden.</p>
          </div>
        )}
      </div>
    </section>
  );
};
