import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  FileText, 
  Database, 
  Server, 
  ExternalLink, 
  Terminal, 
  FolderArchive,
  ShieldCheck,
  Sparkles,
  Layers
} from 'lucide-react';
import { CharacterData, GameSystem } from '../types';
import { FLOKI_DATA, HARVEY_DATA, ARMITAGE_DATA, GHOST_DATA, RODERICK_DATA } from '../data';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCharacter: CharacterData | null;
  selectedSystem: GameSystem;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  currentCharacter,
  selectedSystem
}) => {
  const [activeTab, setActiveTab] = useState<'docs' | 'data' | 'hosting'>('docs');
  const [copiedDoc, setCopiedDoc] = useState(false);
  const [copiedDocker, setCopiedDocker] = useState(false);
  const [copiedNpm, setCopiedNpm] = useState(false);

  if (!isOpen) return null;

  const DOCUMENTATION_CONTENT = `# P&P Multi-System Dashboard & Character Hub
## Vollständige Dokumentation, Offline-Betrieb & Self-Hosting Guide

Dieses Projekt ist ein interaktives, systemübergreifendes Pen-&-Paper-Dashboard für Spielleiter und Spieler. Es bietet maßgeschneiderte Dashboards, Würfelrechner, automatisierte Berechnungen und Charakterverwaltung für:
- Pathfinder 1e (D20-System, automatische Rettungswürfe Zähigkeit/Reflex/Wille, Waffen, RK, Kombos)
- Call of Cthulhu 7e (W100-Prozentsystem, 1/2- und 1/5-Schwellenwerte, Geistige Stabilität, Glück)
- Call of Cthulhu 1920er (Historische Fertigkeiten, Mythos, Epochen-Ausrüstung)
- Shadowrun 5e (Cyberdecks & Matrix-Attribute, Body-Modifikationen mit automatischer Essenz-Berechnung, Limits, Schadensmonitore)
- Mongoose Traveller 2e (Scout-Raumschiffe, Subsektor-Sprünge, Treibstoff, 2W6-Fertigkeiten)
- Generisches P&P (Universelles Bogen-Layout für beliebige Regelsysteme)

---

## 1. Schnellstart (Lokale Installation)

### Voraussetzungen
- Node.js (Version 18 oder neuer, empfohlen: Version 20 oder 22 LTS)
- npm (wird mit Node.js installiert)

### Schritte zur Ausführung:
\`\`\`bash
# 1. In den entpackten Projektordner wechseln (dort, wo package.json liegt)
# Beispiel: cd dein-entpackter-ordner
cd <projektordner>

# 2. Abhängigkeiten installieren
npm install

# 3. Entwicklungsserver starten (Port 3000)
npm run dev

# 4. Im Browser öffnen:
# http://localhost:3000
\`\`\`

---

## 2. Komplett Offline & Selbst Hosten (Produktions-Build)

Das Frontend ist eine reine Client-Side-Single-Page-Application (SPA) mit Vite, React 19 und Tailwind CSS. Nach dem Build benötigt das Dashboard weder eine Datenbank noch zwingend eine Internetverbindung (alle Berechnungen, Würfeltools, Modifikatoren und JSON-Exports/Imports laufen zu 100% lokal im Browser)!

### Produktions-Build erstellen:
\`\`\`bash
npm run build
\`\`\`
Nach dem Build liegt der fertige, kompilierte Webauftritt im Ordner dist/.

### Ausführen des Builds:
Du kannst den Ordner dist/ mit jedem beliebigen Webserver ausliefern:

#### Option A: Mit serve (Node.js)
\`\`\`bash
npx serve -s dist -l 3000
\`\`\`

#### Option B: Mit Python (ohne zusätzliche Tools)
\`\`\`bash
cd dist
python3 -m http.server 3000
\`\`\`

#### Option C: Mit Nginx / Apache
Kopiere einfach den Inhalt von dist/ in dein Webverzeichnis (z. B. /var/www/html/).

---

## 3. Direkte lokale Charakter-Ablage (./characters/ Ordner)
Das Dashboard speichert Charakterbögen direkt im Projektunterordner \`characters/\`, unterteilt nach Spielsystem:
- \`characters/pathfinder/\` (z. B. Floki_Dunkkling.json)
- \`characters/coc_7e/\` (z. B. Harvey_Walters.json)
- \`characters/coc_1920/\` (z. B. Dr_Armitage.json)
- \`characters/shadowrun/\` (z. B. Ghost.json)
- \`characters/traveller/\` (z. B. Roderick_Vance.json)

1-Klick Speichern: Klicke im Dashboard oben rechts auf **"Lokal speichern"**, um den Bogen sofort ohne Dateidialog in seinen System-Ordner zu schreiben.
Bibliothek & Laden: Klicke auf **"Charaktere (Ordner)"** oder den Tab "Lokale Charaktere" im Startbildschirm, um alle vorhandenen Bögen mit 1 Klick einzuladen!

---

## 4. Docker-Container (1-Klick Self-Hosting)

### Mit Docker Compose:
\`\`\`bash
docker compose up -d --build
\`\`\`
Danach ist das Dashboard unter http://localhost:3000 erreichbar.

---

## 4. Export aus Google AI Studio
1. Klicke im Google AI Studio Interface oben rechts auf das Menü (Settings / drei Punkte).
2. Wähle "Export to ZIP" oder "Export to GitHub".
3. Entpacke das ZIP-Archiv auf deinem Rechner.
4. Führe 'npm install' und 'npm run dev' aus.

---

## 5. Offline-Funktionen vs. KI-Erkennung (OpenRouter & Gemini)
- Alle Würfelproben, Charakterbögen, Rettungswürfe, Limits und Berechnungen laufen zu 100% offline im Browser.
- Für das optionale KI-Einlesen von unstrukturierten Texten/PDFs kannst du entweder Google Gemini oder **OpenRouter (mit komplett kostenlosen Modellen wie Llama 3.3 70B, Mistral, Qwen, Gemini Free)** direkt im Dashboard unter "KI-Modell" auswählen!
`;

  const DOCKER_COMPOSE_SNIPPET = `services:
  pnp-dashboard:
    build: .
    container_name: pnp-dashboard
    restart: unless-stopped
    ports:
      - "3000:80"
    environment:
      - NODE_ENV=production`;

  const NPM_SNIPPET = `# 1. Zuerst in den entpackten Projektordner wechseln (wo package.json liegt!)
# Beispiel: cd D:\\projekte\\universal-pnp-dashboard
cd <ordnername>

# 2. Abhängigkeiten installieren
npm install

# 3. Entwicklungsserver starten
npm run dev

# 4. Oder als Produktions-Build für Offline-Nutzung bauen
npm run build
npx serve -s dist -l 3000`;

  // Download markdown documentation
  const handleDownloadDocs = () => {
    const blob = new Blob([DOCUMENTATION_CONTENT], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'P_P_DASHBOARD_DOKUMENTATION_UND_OFFLINE_ANLEITUNG.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download complete multi-system backup JSON
  const handleDownloadCompleteBackup = () => {
    const backupData = {
      exportDate: new Date().toISOString(),
      appName: 'Universal P&P Dashboard',
      version: '1.0.0',
      activeSystem: selectedSystem,
      activeCharacter: currentCharacter,
      presetCharacters: [
        { id: 'floki', system: 'pathfinder', fullName: 'Floki Dunkelklinge', subtitle: 'Stufe 9 Gnom Schurke', data: FLOKI_DATA },
        { id: 'harvey', system: 'coc7e', fullName: 'Harvey Walters', subtitle: 'Journalist & Ermittler', data: HARVEY_DATA },
        { id: 'armitage', system: 'coc1920', fullName: 'Dr. Henry Armitage', subtitle: 'Bibliothekar (1928)', data: ARMITAGE_DATA },
        { id: 'ghost', system: 'shadowrun', fullName: 'Ghost', subtitle: 'Straßensamurai Elf', data: GHOST_DATA },
        { id: 'roderick', system: 'traveller', fullName: 'Roderick Thorne', subtitle: 'Scout Rang 3', data: RODERICK_DATA }
      ]
    };

    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pnp_komplett_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download single character JSON
  const handleDownloadSingleCharacter = () => {
    if (!currentCharacter) return;
    const jsonStr = JSON.stringify(currentCharacter, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentCharacter.name.toLowerCase().replace(/\s+/g, '_')}_${currentCharacter.system}_charakter.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Copy helper
  const copyToClipboard = (text: string, type: 'doc' | 'docker' | 'npm') => {
    navigator.clipboard.writeText(text);
    if (type === 'doc') {
      setCopiedDoc(true);
      setTimeout(() => setCopiedDoc(false), 2000);
    } else if (type === 'docker') {
      setCopiedDocker(true);
      setTimeout(() => setCopiedDocker(false), 2000);
    } else if (type === 'npm') {
      setCopiedNpm(true);
      setTimeout(() => setCopiedNpm(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 z-50 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-700/80 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <FolderArchive size={22} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white font-mono flex items-center gap-2">
                <span>Backup, Self-Hosting & Dokumentation</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase font-sans font-bold">
                  100% Offline-Fähig
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Lade die Dokumentation, alle Charakterdaten oder den Code für deinen eigenen Server herunter.
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

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-5 pt-4 border-b border-zinc-800 bg-zinc-950/30 shrink-0 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('docs')}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer border-b-2 ${
              activeTab === 'docs'
                ? 'border-orange-500 text-orange-400 bg-zinc-900/90'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
            }`}
          >
            <FileText size={15} />
            <span>1. Dokumentation (.md)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('data')}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer border-b-2 ${
              activeTab === 'data'
                ? 'border-orange-500 text-orange-400 bg-zinc-900/90'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
            }`}
          >
            <Database size={15} />
            <span>2. Daten-Backup (.json)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('hosting')}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer border-b-2 ${
              activeTab === 'hosting'
                ? 'border-orange-500 text-orange-400 bg-zinc-900/90'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
            }`}
          >
            <Server size={15} />
            <span>3. Code herunterladen & Self-Hosting</span>
          </button>
        </div>

        {/* Tab Content (Scrollable) */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-zinc-300 text-xs sm:text-sm">
          
          {/* TAB 1: DOKUMENTATION */}
          {activeTab === 'docs' && (
            <div className="space-y-4">
              <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-white text-sm font-mono flex items-center gap-2">
                    <Sparkles size={16} className="text-orange-400" />
                    <span>Komplette Projekt-Dokumentation</span>
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Enthält Spielsystem-Beschreibungen, Installations-Schritte, Docker-Setup und Offline-Architektur.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(DOCUMENTATION_CONTENT, 'doc')}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer border border-zinc-700"
                  >
                    {copiedDoc ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    <span>{copiedDoc ? 'Kopiert!' : 'Kopieren'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadDocs}
                    className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-400 text-black font-mono font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    <Download size={14} />
                    <span>Als .md herunterladen</span>
                  </button>
                </div>
              </div>

              {/* Documentation Viewer */}
              <div className="relative">
                <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-2 font-bold flex items-center justify-between">
                  <span>Vorschau der Dokumentation (Markdown)</span>
                  <span className="text-zinc-500">P_P_DASHBOARD_DOKUMENTATION.md</span>
                </div>
                <pre className="p-4 bg-black/70 border border-zinc-800 rounded-2xl font-mono text-xs text-zinc-300 leading-relaxed overflow-x-auto max-h-96 scrollbar-thin select-text whitespace-pre-wrap">
                  {DOCUMENTATION_CONTENT}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 2: DATEN-BACKUP */}
          {activeTab === 'data' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Full Multi-System Backup */}
                <div className="p-5 bg-zinc-950/70 border border-zinc-800 rounded-2xl flex flex-col justify-between space-y-4 hover:border-zinc-700 transition-colors">
                  <div>
                    <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center mb-3">
                      <Layers size={18} />
                    </div>
                    <h4 className="font-bold text-white text-sm font-mono">
                      Multi-System Komplett-Backup
                    </h4>
                    <p className="text-xs text-zinc-400 mt-1">
                      Sichert alle 5 vorgefertigten Charaktere (Pathfinder, CoC 7e, CoC 1920er, Shadowrun, Traveller) plus deinen aktuell aktiven Charakter in einer gemeinsamen JSON-Datei.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadCompleteBackup}
                    className="w-full py-2.5 bg-orange-500 hover:bg-orange-400 text-black font-mono font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                  >
                    <Download size={14} />
                    <span>Komplett-Backup herunterladen (.json)</span>
                  </button>
                </div>

                {/* Single Active Character Backup */}
                <div className="p-5 bg-zinc-950/70 border border-zinc-800 rounded-2xl flex flex-col justify-between space-y-4 hover:border-zinc-700 transition-colors">
                  <div>
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-3">
                      <Database size={18} />
                    </div>
                    <h4 className="font-bold text-white text-sm font-mono">
                      Aktiven Charakterbogen sichern
                    </h4>
                    <p className="text-xs text-zinc-400 mt-1">
                      Sichert den aktuellen Charakterbogen ({currentCharacter?.name || 'Kein Charakter geladen'}) als eigenständigen Bogen zum Weiterspielen oder Wiederherstellen.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadSingleCharacter}
                    disabled={!currentCharacter}
                    className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-mono font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Download size={14} />
                    <span>Aktuellen Bogen sichern (.json)</span>
                  </button>
                </div>
              </div>

              {/* Offline Security Note */}
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-start gap-3">
                <ShieldCheck size={20} className="text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <span className="font-bold text-emerald-300 font-mono">Datensicherheit & 100% Offline-Kompatibilität:</span>
                  <p className="text-zinc-400">
                    Alle heruntergeladenen JSON-Dateien können jederzeit über den Launcher-Button <strong>„JSON-Upload“</strong> oder per Drag & Drop wieder in die Webseite geladen werden — auch auf Geräten ohne Internetverbindung. Deine Daten bleiben stets auf deinem eigenen Gerät.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CODE HERUNTERLADEN & SELF-HOSTING */}
          {activeTab === 'hosting' && (
            <div className="space-y-6">
              
              {/* Step 1: Google AI Studio ZIP Export */}
              <div className="p-5 bg-gradient-to-r from-orange-950/20 to-zinc-950 border border-orange-500/30 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-orange-400 font-mono font-bold text-sm">
                  <FolderArchive size={18} />
                  <span>Schritt 1: Gesamten Quellcode als ZIP herunterladen (in Google AI Studio)</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Du kannst den kompletten Quellcode dieses Projektes mit allen Dateien (TypeScript, React, CSS, Konfigurationen) mit einem Klick exportieren:
                </p>
                <div className="p-3 bg-black/60 rounded-xl border border-zinc-800 font-mono text-xs text-zinc-300 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-orange-500 text-black flex items-center justify-center font-bold text-[10px]">1</span>
                    <span>Klicke oben rechts in der Google AI Studio Leiste auf das <strong>Menü (Settings / drei Punkte)</strong>.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-orange-500 text-black flex items-center justify-center font-bold text-[10px]">2</span>
                    <span>Wähle <strong>„Export to ZIP“</strong> (lädt alle Dateien als zip-Archiv herunter) oder <strong>„Export to GitHub“</strong>.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-orange-500 text-black flex items-center justify-center font-bold text-[10px]">3</span>
                    <span>Entpacke die ZIP-Datei in einen beliebigen Ordner auf deinem Computer.</span>
                  </div>
                </div>
              </div>

              {/* Step 2: Local Run with Node.js */}
              <div className="p-5 bg-zinc-950/70 border border-zinc-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white font-mono font-bold text-sm">
                    <Terminal size={16} className="text-orange-400" />
                    <span>Schritt 2: Lokal auf deinem Computer starten (Node.js)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(NPM_SNIPPET, 'npm')}
                    className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer border border-zinc-700"
                  >
                    {copiedNpm ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    <span>{copiedNpm ? 'Kopiert!' : 'Befehle kopieren'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-black/80 rounded-xl border border-zinc-800 font-mono text-xs text-zinc-300 overflow-x-auto">
                  {NPM_SNIPPET}
                </pre>
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300/90 font-mono">
                  💡 <strong>Fehler „ENOENT: Could not read package.json“?</strong><br />
                  Du befindest dich noch im übergeordneten Ordner. Wechsle mit <code>dir</code> nachsehen, wie dein entpackter Unterordner heißt, und gehe mit <code>cd &lt;ordnername&gt;</code> hinein. Erst dort <code>npm install</code> ausführen!
                </div>
              </div>

              {/* Step 3: Docker & Nginx Container */}
              <div className="p-5 bg-zinc-950/70 border border-zinc-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white font-mono font-bold text-sm">
                    <Server size={16} className="text-cyan-400" />
                    <span>Schritt 3: 1-Befehl Docker Offline-Container (Optional)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(DOCKER_COMPOSE_SNIPPET, 'docker')}
                    className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer border border-zinc-700"
                  >
                    {copiedDocker ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    <span>{copiedDocker ? 'Kopiert!' : 'docker-compose kopieren'}</span>
                  </button>
                </div>
                <p className="text-xs text-zinc-400">
                  Im exportierten Projektordner befindet sich bereits ein fertiges <code>Dockerfile</code> und <code>docker-compose.yml</code>:
                </p>
                <pre className="p-3 bg-black/80 rounded-xl border border-zinc-800 font-mono text-xs text-zinc-300 overflow-x-auto">
                  {`# Starten mit einem Befehl:
docker compose up -d --build

# Öffne im Browser: http://localhost:3000`}
                </pre>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-950/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-zinc-500 font-mono">
            Tipp: Das Dokument <code>README_OFFLINE_HOSTING.md</code> liegt auch direkt im Projekt-Hauptverzeichnis bereit.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-mono font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Schließen
          </button>
        </div>

      </div>
    </div>
  );
};
