import React, { useState, useEffect } from 'react';
import { 
  X, 
  Bot, 
  Key, 
  Sparkles, 
  Check, 
  ExternalLink, 
  Shield, 
  Cpu, 
  Layers,
  AlertCircle
} from 'lucide-react';
import { 
  AiConfig, 
  OPENROUTER_FREE_MODELS, 
  getSavedAiConfig, 
  saveAiConfig 
} from '../services/aiService';

interface AiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (config: AiConfig) => void;
}

export const AiSettingsModal: React.FC<AiSettingsModalProps> = ({
  isOpen,
  onClose,
  onSaved
}) => {
  const [config, setConfig] = useState<AiConfig>(getSavedAiConfig());
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [customModelMode, setCustomModelMode] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const current = getSavedAiConfig();
      setConfig(current);
      setSavedSuccess(false);
      const isKnownFree = OPENROUTER_FREE_MODELS.some(m => m.id === current.openrouterModel);
      setCustomModelMode(!isKnownFree && !!current.openrouterModel);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    saveAiConfig(config);
    setSavedSuccess(true);
    if (onSaved) onSaved(config);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 z-50 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-700/80 rounded-3xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Bot size={22} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white font-mono flex items-center gap-2">
                <span>KI-Modell & Anbieter konfigurieren</span>
              </h2>
              <p className="text-xs text-zinc-400">
                Wähle OpenRouter (kostenlose Modelle) oder Google Gemini für die Text-Erkennung.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Schließen"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto max-h-[75vh] text-zinc-200 text-xs sm:text-sm">
          
          {/* Provider Selection */}
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider block">
              KI-Anbieter auswählen
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* OpenRouter Option */}
              <button
                type="button"
                onClick={() => setConfig(prev => ({ ...prev, provider: 'openrouter' }))}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  config.provider === 'openrouter'
                    ? 'bg-orange-500/15 border-orange-500 text-white shadow-lg shadow-orange-500/10'
                    : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-bold text-sm text-white flex items-center gap-2">
                    <Sparkles size={16} className="text-orange-400" />
                    <span>OpenRouter (Empfohlen)</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                    Kostenlose Modelle
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Bietet viele kostenlose Modelle (Gemini 2.0 Flash, Llama 3.3 70B, DeepSeek, Mistral) ohne feste Monatskosten.
                </p>
              </button>

              {/* Google Gemini Option */}
              <button
                type="button"
                onClick={() => setConfig(prev => ({ ...prev, provider: 'gemini' }))}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  config.provider === 'gemini'
                    ? 'bg-blue-500/15 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                    : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-bold text-sm text-white flex items-center gap-2">
                    <Cpu size={16} className="text-blue-400" />
                    <span>Google Gemini</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono font-bold">
                    Google AI Studio
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Direkte Google Gemini REST-Schnittstelle mit deinem persönlichen Gemini API Key.
                </p>
              </button>
            </div>
          </div>

          {/* OPENROUTER SETTINGS */}
          {config.provider === 'openrouter' && (
            <div className="space-y-4 p-4 bg-zinc-950/70 border border-zinc-800 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-orange-400 flex items-center gap-2">
                  <Key size={14} />
                  <span>OpenRouter API Key</span>
                </span>
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-orange-400 hover:text-orange-300 flex items-center gap-1 font-mono underline"
                >
                  <span>Kostenlosen Key auf openrouter.ai holen</span>
                  <ExternalLink size={12} />
                </a>
              </div>

              <input
                type="password"
                placeholder="sk-or-v1-..."
                value={config.openrouterApiKey}
                onChange={e => setConfig({ ...config, openrouterApiKey: e.target.value })}
                className="w-full bg-black/80 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
              />
              <p className="text-[11px] text-zinc-500">
                Dein Schlüssel wird sicher nur lokal in deinem Browser (localStorage) gespeichert und nie an Dritte übermittelt.
              </p>

              {/* Model Selection */}
              <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono font-bold text-zinc-300 flex items-center gap-1.5">
                    <Layers size={14} className="text-orange-400" />
                    <span>Modell auswählen:</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setCustomModelMode(!customModelMode)}
                    className="text-[11px] font-mono text-zinc-400 hover:text-zinc-200 underline cursor-pointer"
                  >
                    {customModelMode ? 'Standardliste zeigen' : 'Eigenes Modell eingeben'}
                  </button>
                </div>

                {!customModelMode ? (
                  <select
                    value={config.openrouterModel}
                    onChange={e => setConfig({ ...config, openrouterModel: e.target.value })}
                    className="w-full bg-black/80 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    {OPENROUTER_FREE_MODELS.map(m => (
                      <option key={m.id} value={m.id} className="bg-zinc-900 text-white">
                        {m.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="z. B. meta-llama/llama-3.3-70b-instruct:free oder anthropic/claude-3.5-sonnet"
                    value={config.openrouterModel}
                    onChange={e => setConfig({ ...config, openrouterModel: e.target.value })}
                    className="w-full bg-black/80 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                  />
                )}
              </div>
            </div>
          )}

          {/* GEMINI SETTINGS */}
          {config.provider === 'gemini' && (
            <div className="space-y-4 p-4 bg-zinc-950/70 border border-zinc-800 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-blue-400 flex items-center gap-2">
                  <Key size={14} />
                  <span>Google Gemini API Key</span>
                </span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-mono underline"
                >
                  <span>Gemini Key erstellen</span>
                  <ExternalLink size={12} />
                </a>
              </div>

              <input
                type="password"
                placeholder="AIzaSy..."
                value={config.geminiApiKey}
                onChange={e => setConfig({ ...config, geminiApiKey: e.target.value })}
                className="w-full bg-black/80 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
              />

              <div className="space-y-1.5 pt-2 border-t border-zinc-800/80">
                <label className="text-xs font-mono font-bold text-zinc-300">
                  Gemini Modell
                </label>
                <select
                  value={config.geminiModel}
                  onChange={e => setConfig({ ...config, geminiModel: e.target.value })}
                  className="w-full bg-black/80 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="gemini-1.5-flash" className="bg-zinc-900 text-white">gemini-1.5-flash (Standard & Schnell)</option>
                  <option value="gemini-2.0-flash" className="bg-zinc-900 text-white">gemini-2.0-flash (Neueste Generation)</option>
                  <option value="gemini-1.5-pro" className="bg-zinc-900 text-white">gemini-1.5-pro (Für komplexe Regeln)</option>
                </select>
              </div>
            </div>
          )}

          {/* Privacy / Offline guarantee */}
          <div className="p-3.5 bg-zinc-950/40 border border-zinc-800/60 rounded-xl flex items-start gap-3">
            <Shield size={16} className="text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-zinc-400 leading-relaxed">
              <strong className="text-emerald-300 font-mono">100% Offline-Betrieb:</strong> Du benötigst diesen Key nur für das automatische Einlesen von Freitext/PDFs. Alle Würfeltools, Charakterbögen, Rettungswürfe, Limits und das Speichern/Laden von JSON-Dateien funktionieren komplett ohne Internetverbindung und ohne API-Key!
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-orange-500 hover:bg-orange-400 text-black font-mono font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            {savedSuccess ? (
              <>
                <Check size={14} />
                <span>Gespeichert!</span>
              </>
            ) : (
              <span>Einstellungen speichern</span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
