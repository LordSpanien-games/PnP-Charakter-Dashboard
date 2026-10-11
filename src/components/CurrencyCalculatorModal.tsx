import React, { FC, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Coins,
  Plus,
  Minus,
  RotateCcw,
  ArrowUpRight,
  ArrowDownRight,
  History,
  Check,
  Calculator,
  Trash2,
  Edit3,
  Home,
  CreditCard,
  Scale,
  Sparkles,
  ArrowRightLeft,
  ShieldCheck,
  Info
} from 'lucide-react';
import { CharacterData, CurrencyData, CurrencyTransaction, GameSystem, PathfinderCoins } from '../types';
import { isPathfinder } from '../utils/pathfinder';
import {
  calculateTotalGold,
  calculateCoinWeight,
  consolidateCoins,
  breakdownPlatinum,
  COIN_CONVERSION
} from '../utils/currency';

interface CurrencyCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: CharacterData;
  onUpdateCurrency: (currency: CurrencyData) => void;
}

export const CurrencyCalculatorModal: FC<CurrencyCalculatorModalProps> = ({
  isOpen,
  onClose,
  character,
  onUpdateCurrency,
}) => {
  const isPF = isPathfinder(character);

  const getDefaultUnit = (sys: GameSystem) => {
    switch (sys) {
      case 'shadowrun': return '¥';
      case 'pathfinder': return 'GM';
      case 'coc7e':
      case 'coc1920': return '$';
      case 'traveller': return 'Cr';
      default: return 'Münzen';
    }
  };

  const initialCoins: PathfinderCoins = character.currency?.coins || {
    pp: 0,
    gp: character.currency?.amount || 0,
    sp: 0,
    cp: 0,
  };

  const currentCurrency: CurrencyData = character.currency || {
    amount: isPF ? calculateTotalGold(initialCoins) : 0,
    unit: getDefaultUnit(character.system),
    coins: isPF ? initialCoins : undefined,
    history: []
  };

  // Lifestyle Presets by Game System (non-Pathfinder)
  const getLifestylePresets = (sys: GameSystem) => {
    if (sys === 'shadowrun') {
      return [
        { name: 'Straßen-Lebensstil', cost: 0 },
        { name: 'Squatter', cost: 500 },
        { name: 'Unterschicht', cost: 2000 },
        { name: 'Mittelstand', cost: 5000 },
        { name: 'Oberschicht', cost: 10000 },
        { name: 'Luxus', cost: 100000 },
      ];
    } else if (sys === 'coc7e' || sys === 'coc1920') {
      return [
        { name: 'Armut', cost: 20 },
        { name: 'Durchschnitt', cost: 100 },
        { name: 'Wohlhabend', cost: 500 },
        { name: 'Reich', cost: 2000 },
      ];
    } else if (sys === 'traveller') {
      return [
        { name: 'Low Passage', cost: 100 },
        { name: 'Middle Passage', cost: 500 },
        { name: 'High Passage', cost: 1000 },
        { name: 'Luxury Passage', cost: 5000 },
      ];
    } else {
      return [
        { name: 'Bescheiden', cost: 100 },
        { name: 'Standard', cost: 500 },
        { name: 'Gehoben', cost: 2000 },
      ];
    }
  };

  const lifestylePresets = getLifestylePresets(character.system);

  const [mode, setMode] = useState<'income' | 'expense' | 'set'>('income');
  const [calcAmount, setCalcAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [selectedUnit, setSelectedUnit] = useState<string>(currentCurrency.unit || getDefaultUnit(character.system));
  const [showUnitEdit, setShowUnitEdit] = useState<boolean>(false);

  // Pathfinder specific state for the 4 coin types
  const [coinInputs, setCoinInputs] = useState<{ pp: string; gp: string; sp: string; cp: string }>({
    pp: '',
    gp: '',
    sp: '',
    cp: '',
  });

  // Direct editing of purse amounts
  const [isDirectEditingCoins, setIsDirectEditingCoins] = useState(false);
  const [directCoinState, setDirectCoinState] = useState<PathfinderCoins>(
    currentCurrency.coins || initialCoins
  );

  // Lifestyle states
  const [lifestyleName, setLifestyleName] = useState<string>(
    currentCurrency.lifestyle || (character.system === 'shadowrun' ? 'Mittelstand' : 'Standard')
  );
  const [lifestyleCost, setLifestyleCost] = useState<number>(
    currentCurrency.lifestyleCost !== undefined ? currentCurrency.lifestyleCost : (character.system === 'shadowrun' ? 5000 : 100)
  );
  const [editingLifestyle, setEditingLifestyle] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentCoins = currentCurrency.coins || initialCoins;
  const totalGoldVal = isPF ? calculateTotalGold(currentCoins) : (currentCurrency.amount || 0);
  const coinWeight = isPF ? calculateCoinWeight(currentCoins) : { count: 0, weightPounds: 0 };

  const formatCurrencyNumber = (num: number) => {
    return num.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  // --- Pathfinder Coin Transaction Handler ---
  const handleApplyCoinTransaction = () => {
    const ppIn = parseInt(coinInputs.pp.replace(/[^0-9]/g, ''), 10) || 0;
    const gpIn = parseInt(coinInputs.gp.replace(/[^0-9]/g, ''), 10) || 0;
    const spIn = parseInt(coinInputs.sp.replace(/[^0-9]/g, ''), 10) || 0;
    const cpIn = parseInt(coinInputs.cp.replace(/[^0-9]/g, ''), 10) || 0;

    if (ppIn === 0 && gpIn === 0 && spIn === 0 && cpIn === 0 && mode !== 'set') return;

    let newCoins: PathfinderCoins = { ...currentCoins };
    let detailsArr: string[] = [];

    if (mode === 'income') {
      newCoins = {
        pp: newCoins.pp + ppIn,
        gp: newCoins.gp + gpIn,
        sp: newCoins.sp + spIn,
        cp: newCoins.cp + cpIn,
      };
      if (ppIn > 0) detailsArr.push(`+${ppIn} PM`);
      if (gpIn > 0) detailsArr.push(`+${gpIn} GM`);
      if (spIn > 0) detailsArr.push(`+${spIn} SM`);
      if (cpIn > 0) detailsArr.push(`+${cpIn} KM`);
    } else if (mode === 'expense') {
      newCoins = {
        pp: Math.max(0, newCoins.pp - ppIn),
        gp: Math.max(0, newCoins.gp - gpIn),
        sp: Math.max(0, newCoins.sp - spIn),
        cp: Math.max(0, newCoins.cp - cpIn),
      };
      if (ppIn > 0) detailsArr.push(`-${ppIn} PM`);
      if (gpIn > 0) detailsArr.push(`-${gpIn} GM`);
      if (spIn > 0) detailsArr.push(`-${spIn} SM`);
      if (cpIn > 0) detailsArr.push(`-${cpIn} KM`);
    } else if (mode === 'set') {
      newCoins = {
        pp: ppIn,
        gp: gpIn,
        sp: spIn,
        cp: cpIn,
      };
      detailsArr.push(`Münzbeutel gesetzt auf ${ppIn} PM, ${gpIn} GM, ${spIn} SM, ${cpIn} KM`);
    }

    const newTotalGold = calculateTotalGold(newCoins);
    const deltaGold = newTotalGold - totalGoldVal;

    const defaultDesc =
      mode === 'income' ? 'Münzen erhalten' : mode === 'expense' ? 'Münzen ausgegeben' : 'Münzbestand angepasst';

    const newTx: CurrencyTransaction = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      description: description.trim() || defaultDesc,
      amount: deltaGold,
      type: mode,
      balanceAfter: newTotalGold,
      coinDetails: detailsArr.join(', ') || undefined,
    };

    onUpdateCurrency({
      amount: newTotalGold,
      unit: 'GM',
      coins: newCoins,
      history: [newTx, ...(currentCurrency.history || [])],
    });

    // Reset inputs
    setCoinInputs({ pp: '', gp: '', sp: '', cp: '' });
    setDescription('');
  };

  // Direct edit save
  const handleSaveDirectCoins = () => {
    const newTotalGold = calculateTotalGold(directCoinState);
    const delta = newTotalGold - totalGoldVal;

    const newTx: CurrencyTransaction = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      description: 'Münzen manuell korrigiert',
      amount: delta,
      type: 'set',
      balanceAfter: newTotalGold,
      coinDetails: `${directCoinState.pp} PM, ${directCoinState.gp} GM, ${directCoinState.sp} SM, ${directCoinState.cp} KM`,
    };

    onUpdateCurrency({
      amount: newTotalGold,
      unit: 'GM',
      coins: directCoinState,
      history: [newTx, ...(currentCurrency.history || [])],
    });

    setIsDirectEditingCoins(false);
  };

  // Consolidate coins (e.g. 100 KM -> 1 GM)
  const handleConsolidateCoins = () => {
    const consolidated = consolidateCoins(currentCoins);
    const newTx: CurrencyTransaction = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      description: 'Wechselstube: Münzen konsolidiert',
      amount: 0,
      type: 'set',
      balanceAfter: calculateTotalGold(consolidated),
      coinDetails: `Neu gewechselt: ${consolidated.pp} PM, ${consolidated.gp} GM, ${consolidated.sp} SM, ${consolidated.cp} KM`,
    };

    onUpdateCurrency({
      amount: calculateTotalGold(consolidated),
      unit: 'GM',
      coins: consolidated,
      history: [newTx, ...(currentCurrency.history || [])],
    });
  };

  // Break down Platinum to Gold
  const handleBreakdownPlatinum = () => {
    const broken = breakdownPlatinum(currentCoins);
    const newTx: CurrencyTransaction = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      description: 'Wechselstube: Platin in Gold gewechselt',
      amount: 0,
      type: 'set',
      balanceAfter: calculateTotalGold(broken),
      coinDetails: `Platin aufgelöst -> ${broken.gp} GM`,
    };

    onUpdateCurrency({
      amount: calculateTotalGold(broken),
      unit: 'GM',
      coins: broken,
      history: [newTx, ...(currentCurrency.history || [])],
    });
  };

  // Non-Pathfinder standard transaction
  const handleApplyStandardTransaction = () => {
    const numericInput = parseFloat(calcAmount.replace(/[^0-9.-]/g, '')) || 0;
    if (calcAmount === '' && mode !== 'set') return;

    let calculatedNewBalance = currentCurrency.amount || 0;
    if (mode === 'income') {
      calculatedNewBalance += Math.abs(numericInput);
    } else if (mode === 'expense') {
      calculatedNewBalance -= Math.abs(numericInput);
    } else if (mode === 'set') {
      calculatedNewBalance = numericInput;
    }

    let transactionAmount = Math.abs(numericInput);
    if (mode === 'expense') transactionAmount = -transactionAmount;
    if (mode === 'set') transactionAmount = calculatedNewBalance - (currentCurrency.amount || 0);

    const defaultDesc = mode === 'income' ? 'Einnahme' : mode === 'expense' ? 'Ausgabe' : 'Kontostand angepasst';

    const newTx: CurrencyTransaction = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      description: description.trim() || defaultDesc,
      amount: transactionAmount,
      type: mode,
      balanceAfter: calculatedNewBalance,
    };

    onUpdateCurrency({
      amount: Math.max(0, calculatedNewBalance),
      unit: selectedUnit,
      lifestyle: lifestyleName,
      lifestyleCost,
      history: [newTx, ...(currentCurrency.history || [])],
    });

    setCalcAmount('');
    setDescription('');
  };

  const handlePayLifestyle = () => {
    const cost = Math.max(0, lifestyleCost);
    const newBal = (currentCurrency.amount || 0) - cost;
    const txDesc = `Lebensstil (${lifestyleName}) bezahlt`;

    const newTx: CurrencyTransaction = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      description: txDesc,
      amount: -cost,
      type: 'expense',
      balanceAfter: newBal,
    };

    onUpdateCurrency({
      amount: Math.max(0, newBal),
      unit: selectedUnit,
      lifestyle: lifestyleName,
      lifestyleCost,
      history: [newTx, ...(currentCurrency.history || [])],
    });
  };

  const handleDeleteHistoryItem = (id: string) => {
    const updatedHistory = (currentCurrency.history || []).filter((h) => h.id !== id);
    onUpdateCurrency({
      ...currentCurrency,
      history: updatedHistory,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-zinc-950 border border-zinc-800 w-full max-w-3xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-100"
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl">
              <Coins size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold font-mono tracking-wide text-white">
                  {isPF ? 'Münzbeutel & Finanzen (Pathfinder)' : 'Finanzen & Kontostand'}
                </h2>
                {isPF && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold">
                    PM • GM • SM • KM
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                {character.name} • {isPF ? 'Platin, Gold, Silber, Kupfer & Wechselstube' : 'Kontoverwaltung & Buchungen'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 space-y-6 overflow-y-auto pr-2">
          {/* PATHFINDER COIN PURSE SECTION */}
          {isPF ? (
            <div className="space-y-4">
              {/* Grand Total & Weight Banner */}
              <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-6 -mr-6 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                <div>
                  <span className="text-[10px] uppercase tracking-widest font-mono text-zinc-400 font-bold block mb-1">
                    Gesamtwert in Goldmünzen (GM)
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-black font-mono text-amber-400 tracking-tight">
                      {formatCurrencyNumber(totalGoldVal)}
                    </span>
                    <span className="text-xl font-bold font-mono text-amber-500">GM</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="px-3 py-1.5 bg-zinc-900 border border-zinc-750 rounded-xl text-xs font-mono flex items-center gap-2">
                    <Scale size={14} className="text-amber-400" />
                    <div>
                      <span className="text-[9px] text-zinc-500 block">Gewicht Münzen:</span>
                      <span className="text-zinc-200 font-bold">
                        {coinWeight.weightPounds} Pfund ({coinWeight.count} Münzen)
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setDirectCoinState({ ...currentCoins });
                      setIsDirectEditingCoins(!isDirectEditingCoins);
                    }}
                    className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-xs font-mono text-zinc-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit3 size={13} className="text-amber-400" />
                    <span>{isDirectEditingCoins ? 'Abbrechen' : 'Münzen direkt bearbeiten'}</span>
                  </button>
                </div>
              </div>

              {/* DIRECT COIN EDIT FORM (Collapsible) */}
              <AnimatePresence>
                {isDirectEditingCoins && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-zinc-900/90 border border-amber-500/50 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-amber-400 uppercase">
                          Münzbestand exakt festlegen
                        </span>
                        <span className="text-[11px] font-mono text-zinc-400">
                          Gib die genaue Anzahl für jede Münzsorte ein
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div className="bg-cyan-950/30 border border-cyan-500/30 p-2.5 rounded-xl">
                          <label className="text-[10px] uppercase font-mono text-cyan-300 font-bold block mb-1">
                            Platin (PM)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={directCoinState.pp}
                            onChange={(e) =>
                              setDirectCoinState({
                                ...directCoinState,
                                pp: Math.max(0, parseInt(e.target.value) || 0),
                              })
                            }
                            className="w-full bg-black/60 border border-cyan-500/40 rounded px-2 py-1 text-white font-mono text-base font-bold"
                          />
                        </div>

                        <div className="bg-amber-950/30 border border-amber-500/30 p-2.5 rounded-xl">
                          <label className="text-[10px] uppercase font-mono text-amber-300 font-bold block mb-1">
                            Gold (GM)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={directCoinState.gp}
                            onChange={(e) =>
                              setDirectCoinState({
                                ...directCoinState,
                                gp: Math.max(0, parseInt(e.target.value) || 0),
                              })
                            }
                            className="w-full bg-black/60 border border-amber-500/40 rounded px-2 py-1 text-white font-mono text-base font-bold"
                          />
                        </div>

                        <div className="bg-slate-800/30 border border-slate-400/30 p-2.5 rounded-xl">
                          <label className="text-[10px] uppercase font-mono text-slate-300 font-bold block mb-1">
                            Silber (SM)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={directCoinState.sp}
                            onChange={(e) =>
                              setDirectCoinState({
                                ...directCoinState,
                                sp: Math.max(0, parseInt(e.target.value) || 0),
                              })
                            }
                            className="w-full bg-black/60 border border-slate-400/40 rounded px-2 py-1 text-white font-mono text-base font-bold"
                          />
                        </div>

                        <div className="bg-orange-950/30 border border-orange-600/30 p-2.5 rounded-xl">
                          <label className="text-[10px] uppercase font-mono text-orange-400 font-bold block mb-1">
                            Kupfer (KM)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={directCoinState.cp}
                            onChange={(e) =>
                              setDirectCoinState({
                                ...directCoinState,
                                cp: Math.max(0, parseInt(e.target.value) || 0),
                              })
                            }
                            className="w-full bg-black/60 border border-orange-600/40 rounded px-2 py-1 text-white font-mono text-base font-bold"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs font-mono text-zinc-400">
                          Neuer Gesamtwert: <strong className="text-amber-400">{calculateTotalGold(directCoinState)} GM</strong>
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setIsDirectEditingCoins(false)}
                            className="px-3 py-1 text-xs font-mono text-zinc-400 hover:text-white cursor-pointer"
                          >
                            Abbrechen
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveDirectCoins}
                            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs rounded-lg cursor-pointer"
                          >
                            Bestand speichern
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 4 COIN POUCH CARDS (Platin, Gold, Silber, Kupfer) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Platin */}
                <div className="bg-gradient-to-br from-cyan-950/30 via-zinc-900 to-zinc-950 border border-cyan-500/30 rounded-xl p-3.5 flex flex-col justify-between relative overflow-hidden group">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-black uppercase tracking-wider text-cyan-300">
                      Platin (PM)
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                      1 PM = 10 GM
                    </span>
                  </div>
                  <div className="my-2">
                    <span className="text-2xl sm:text-3xl font-black font-mono text-cyan-200">
                      {currentCoins.pp.toLocaleString('de-DE')}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">
                    Wert: {(currentCoins.pp * 10).toLocaleString('de-DE')} GM
                  </span>
                </div>

                {/* Gold */}
                <div className="bg-gradient-to-br from-amber-950/30 via-zinc-900 to-zinc-950 border border-amber-500/40 rounded-xl p-3.5 flex flex-col justify-between relative overflow-hidden group shadow-[0_0_15px_rgba(245,158,11,0.05)]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-black uppercase tracking-wider text-amber-300">
                      Gold (GM)
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800">
                      1 GM = 1 GM
                    </span>
                  </div>
                  <div className="my-2">
                    <span className="text-2xl sm:text-3xl font-black font-mono text-amber-300">
                      {currentCoins.gp.toLocaleString('de-DE')}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">
                    Wert: {currentCoins.gp.toLocaleString('de-DE')} GM
                  </span>
                </div>

                {/* Silber */}
                <div className="bg-gradient-to-br from-slate-900/40 via-zinc-900 to-zinc-950 border border-slate-400/30 rounded-xl p-3.5 flex flex-col justify-between relative overflow-hidden group">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-black uppercase tracking-wider text-slate-300">
                      Silber (SM)
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700">
                      10 SM = 1 GM
                    </span>
                  </div>
                  <div className="my-2">
                    <span className="text-2xl sm:text-3xl font-black font-mono text-slate-200">
                      {currentCoins.sp.toLocaleString('de-DE')}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">
                    Wert: {(currentCoins.sp * 0.1).toFixed(1)} GM
                  </span>
                </div>

                {/* Kupfer */}
                <div className="bg-gradient-to-br from-orange-950/30 via-zinc-900 to-zinc-950 border border-orange-600/30 rounded-xl p-3.5 flex flex-col justify-between relative overflow-hidden group">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-black uppercase tracking-wider text-orange-400">
                      Kupfer (KM)
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-orange-950 text-orange-400 border border-orange-800">
                      100 KM = 1 GM
                    </span>
                  </div>
                  <div className="my-2">
                    <span className="text-2xl sm:text-3xl font-black font-mono text-orange-300">
                      {currentCoins.cp.toLocaleString('de-DE')}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">
                    Wert: {(currentCoins.cp * 0.01).toFixed(2)} GM
                  </span>
                </div>
              </div>

              {/* WECHSELSTUBE & KONSOLIDIERUNG */}
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft size={14} className="text-amber-400" />
                  <span className="text-zinc-300 font-bold">Wechselstube:</span>
                  <span className="text-zinc-500 text-[11px]">
                    Gewicht reduzieren und Münzen konsolidieren
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleConsolidateCoins}
                    className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg border border-zinc-750 text-[11px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
                    title="Wandelt Kupfer & Silber automatisch in Gold/Platin um (100 KM -> 1 GM, etc.)"
                  >
                    <Sparkles size={12} className="text-amber-400" />
                    <span>In höhere Münzen wechseln</span>
                  </button>

                  {currentCoins.pp > 0 && (
                    <button
                      type="button"
                      onClick={handleBreakdownPlatinum}
                      className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg border border-zinc-750 text-[11px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
                      title="Wechselt alle Platinmünzen in Gold um (1 PM -> 10 GM)"
                    >
                      <span>Platin in Gold auflösen</span>
                    </button>
                  )}
                </div>
              </div>

              {/* COIN TRANSACTION FORM */}
              <div className="bg-zinc-950/70 border border-zinc-800 rounded-2xl p-4 space-y-3.5">
                <div className="flex items-center justify-between border-b border-zinc-850 pb-2.5">
                  <span className="text-xs uppercase font-mono tracking-wider font-bold text-zinc-300 flex items-center gap-2">
                    <Calculator size={14} className="text-amber-400" /> Münzen buchen / Rechner
                  </span>

                  {/* Mode Tabs */}
                  <div className="flex bg-zinc-900 p-0.5 rounded-xl border border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setMode('income')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        mode === 'income'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <Plus size={12} /> Einnahme (+)
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('expense')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        mode === 'expense'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <Minus size={12} /> Ausgabe (-)
                    </button>
                  </div>
                </div>

                {/* 4 Inputs for PM, GM, SM, KM */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-cyan-300 font-bold mb-1">
                      Platin (PM)
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={coinInputs.pp}
                      onChange={(e) => setCoinInputs({ ...coinInputs, pp: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-1.5 text-white font-mono text-sm font-bold focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-mono text-amber-300 font-bold mb-1">
                      Gold (GM)
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={coinInputs.gp}
                      onChange={(e) => setCoinInputs({ ...coinInputs, gp: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-1.5 text-white font-mono text-sm font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-mono text-slate-300 font-bold mb-1">
                      Silber (SM)
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={coinInputs.sp}
                      onChange={(e) => setCoinInputs({ ...coinInputs, sp: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-1.5 text-white font-mono text-sm font-bold focus:outline-none focus:border-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-mono text-orange-400 font-bold mb-1">
                      Kupfer (KM)
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={coinInputs.cp}
                      onChange={(e) => setCoinInputs({ ...coinInputs, cp: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-1.5 text-white font-mono text-sm font-bold focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                {/* Reason & Submit */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                  <div className="sm:col-span-8">
                    <label className="block text-[10px] uppercase font-mono text-zinc-500 font-bold mb-1">
                      Grund / Verwendungszweck (optional)
                    </label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={
                        mode === 'income'
                          ? 'z.B. Quest-Belohnung, Beute, Schatzkiste'
                          : 'z.B. Schenken-Zeche, Rationen, Heiltrank'
                      }
                      className="w-full bg-zinc-900 border border-zinc-750 rounded-xl px-3 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <button
                      type="button"
                      onClick={handleApplyCoinTransaction}
                      className={`w-full py-2 px-3 rounded-xl font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer ${
                        mode === 'income'
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20'
                          : 'bg-red-500 hover:bg-red-400 text-white shadow-red-500/20'
                      }`}
                    >
                      {mode === 'income' ? <Plus size={14} /> : <Minus size={14} />}
                      <span>{mode === 'income' ? 'Münzen verbuchen' : 'Münzen ausgeben'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* NON-PATHFINDER CURRENCY DISPLAY */
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
                <div>
                  <span className="text-[10px] uppercase tracking-widest font-mono text-zinc-500 font-bold block mb-1">
                    Aktueller Kontostand / Vermögen
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl md:text-4xl font-black font-mono text-amber-400 tracking-tight">
                      {formatCurrencyNumber(currentCurrency.amount || 0)}
                    </span>
                    <span className="text-xl font-bold font-mono text-amber-500/90">
                      {selectedUnit}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!showUnitEdit ? (
                    <button
                      onClick={() => setShowUnitEdit(true)}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 border border-zinc-700/80 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Edit3 size={12} className="text-amber-400" />
                      <span>Währung: <strong className="text-white">{selectedUnit}</strong></span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 bg-zinc-950 p-1.5 rounded-xl border border-amber-500/40">
                      {['¥', 'GM', '$', 'Cr', '€', 'Münzen'].map((unit) => (
                        <button
                          key={unit}
                          onClick={() => {
                            setSelectedUnit(unit);
                            onUpdateCurrency({ ...currentCurrency, unit });
                            setShowUnitEdit(false);
                          }}
                          className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                            selectedUnit === unit ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          {unit}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Lifestyle for Shadowrun/CoC/Traveller */}
              <div className="bg-gradient-to-r from-cyan-950/30 via-zinc-900 to-zinc-950 border border-cyan-800/40 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Home size={16} className="text-cyan-400" />
                    <span className="text-xs uppercase font-mono tracking-wider font-bold text-cyan-300">
                      Lebensstil & Unterhalt
                    </span>
                  </div>
                  <button
                    onClick={() => setEditingLifestyle(!editingLifestyle)}
                    className="text-[11px] font-mono text-zinc-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 size={12} />
                    <span>{editingLifestyle ? 'Fertig' : 'Lebensstil anpassen'}</span>
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-800">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-zinc-500">Aktueller Lebensstil</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-black text-white font-mono">{lifestyleName}</span>
                      <span className="text-xs font-mono font-bold text-cyan-400">
                        ({formatCurrencyNumber(lifestyleCost)} {selectedUnit} / Monat)
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handlePayLifestyle}
                    className="px-3.5 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase text-xs font-mono tracking-wider rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <CreditCard size={14} />
                    <span>Bezahlen (-{formatCurrencyNumber(lifestyleCost)} {selectedUnit})</span>
                  </button>
                </div>

                {editingLifestyle && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
                    {lifestylePresets.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => {
                          setLifestyleName(preset.name);
                          setLifestyleCost(preset.cost);
                          onUpdateCurrency({
                            ...currentCurrency,
                            lifestyle: preset.name,
                            lifestyleCost: preset.cost,
                          });
                        }}
                        className={`p-2 rounded-lg border text-left text-xs font-mono cursor-pointer ${
                          lifestyleName === preset.name
                            ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                            : 'border-zinc-800 hover:bg-zinc-850 text-zinc-400'
                        }`}
                      >
                        <div className="font-bold">{preset.name}</div>
                        <div className="text-[10px] text-zinc-500">{preset.cost} {selectedUnit}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Standard Transaction Form */}
              <div className="bg-zinc-950/60 border border-zinc-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-850 pb-2">
                  <span className="text-xs uppercase font-mono tracking-wider font-bold text-zinc-300 flex items-center gap-2">
                    <Calculator size={14} className="text-amber-400" /> Finanz-Rechner
                  </span>

                  <div className="flex bg-zinc-900 p-0.5 rounded-xl border border-zinc-800">
                    <button
                      onClick={() => setMode('income')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        mode === 'income' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'text-zinc-400'
                      }`}
                    >
                      <Plus size={12} className="inline mr-1" /> Einnahme
                    </button>
                    <button
                      onClick={() => setMode('expense')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        mode === 'expense' ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'text-zinc-400'
                      }`}
                    >
                      <Minus size={12} className="inline mr-1" /> Ausgabe
                    </button>
                    <button
                      onClick={() => setMode('set')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        mode === 'set' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'text-zinc-400'
                      }`}
                    >
                      = Setzen
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-4">
                    <label className="block text-[10px] uppercase font-mono text-zinc-500 font-bold mb-1">
                      Betrag ({selectedUnit})
                    </label>
                    <input
                      type="number"
                      value={calcAmount}
                      onChange={(e) => setCalcAmount(e.target.value)}
                      placeholder="0"
                      className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-white font-mono text-base font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="sm:col-span-5">
                    <label className="block text-[10px] uppercase font-mono text-zinc-500 font-bold mb-1">
                      Verwendungszweck
                    </label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Grund..."
                      className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <button
                      type="button"
                      onClick={handleApplyStandardTransaction}
                      className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs uppercase rounded-xl transition-all cursor-pointer"
                    >
                      Buchen
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TRANSACTION HISTORY LOG */}
          <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2">
                <History size={15} className="text-zinc-400" />
                <span className="text-xs uppercase font-mono tracking-wider font-bold text-zinc-300">
                  Buchungshistorie ({currentCurrency.history?.length || 0})
                </span>
              </div>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {!currentCurrency.history || currentCurrency.history.length === 0 ? (
                <div className="text-center py-6 text-zinc-500 font-mono text-xs">
                  Noch keine Transaktionen gebucht.
                </div>
              ) : (
                currentCurrency.history.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-2.5 bg-zinc-950/80 border border-zinc-800/80 rounded-xl flex items-center justify-between text-xs font-mono group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                          tx.type === 'income'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : tx.type === 'expense'
                            ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {tx.type === 'income' ? (
                          <ArrowUpRight size={13} />
                        ) : tx.type === 'expense' ? (
                          <ArrowDownRight size={13} />
                        ) : (
                          <RotateCcw size={13} />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-zinc-200">{tx.description}</span>
                          {tx.coinDetails && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-amber-300 border border-zinc-700">
                              {tx.coinDetails}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-500">
                          {tx.timestamp} • Neuer Stand: {formatCurrencyNumber(tx.balanceAfter)}{' '}
                          {currentCurrency.unit || 'GM'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`font-black font-mono ${
                          tx.amount > 0
                            ? 'text-emerald-400'
                            : tx.amount < 0
                            ? 'text-red-400'
                            : 'text-zinc-400'
                        }`}
                      >
                        {tx.amount > 0 ? `+${formatCurrencyNumber(tx.amount)}` : formatCurrencyNumber(tx.amount)}{' '}
                        {currentCurrency.unit || 'GM'}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleDeleteHistoryItem(tx.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-zinc-600 hover:text-red-400 transition-opacity cursor-pointer"
                        title="Eintrag löschen"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-zinc-800 bg-zinc-900/60 text-xs font-mono text-zinc-400 flex items-center justify-between">
          <span className="text-[11px] text-zinc-500">
            {isPF ? 'Pathfinder 1e Umrechnung: 1 PM = 10 GM = 100 SM = 1.000 KM' : 'Währung wird automatisch im Charakterbogen gespeichert.'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-mono text-xs cursor-pointer"
          >
            Schließen
          </button>
        </div>
      </motion.div>
    </div>
  );
};
