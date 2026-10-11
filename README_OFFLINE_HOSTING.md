# P&P Multi-System Dashboard & Character Hub
## Vollständige Dokumentation, Offline-Betrieb & Self-Hosting Guide

Dieses Projekt ist ein interaktives, systemübergreifendes Pen-&-Paper-Dashboard für Spielleiter und Spieler. Es bietet maßgeschneiderte Dashboards, Würfelrechner, automatisierte Berechnungen und Charakterverwaltung für:
- **Pathfinder 1e** (D20-System, automatische Rettungswürfe Zähigkeit/Reflex/Wille, Waffen, RK, Kombos)
- **Call of Cthulhu 7e** (W100-Prozentsystem, 1/2- und 1/5-Schwellenwerte, Geistige Stabilität, Glück)
- **Call of Cthulhu 1920er** (Historische Fertigkeiten, Mythos, Epochen-Ausrüstung)
- **Shadowrun 5e** (Cyberdecks & Matrix-Attribute, Body-Modifikationen mit automatischer Essenz-Berechnung, Limits, Schadensmonitore)
- **Mongoose Traveller 2e** (Scout-Raumschiffe, Subsektor-Sprünge, Treibstoff, 2W6-Fertigkeiten)
- **Generisches P&P** (Universelles Bogen-Layout für beliebige Regelsysteme)

---

## 1. Schnellstart (Lokale Installation)

### Voraussetzungen
- **Node.js** (Version 18 oder neuer, empfohlen: Version 20 oder 22 LTS)
- **npm** (wird mit Node.js installiert)

### Schritte zur Ausführung:
```bash
# 1. WICHTIG: Wechsle in den entpackten Projektordner (wo die Datei package.json liegt!)
cd <ordnername>

# 2. Abhängigkeiten installieren
npm install

# 3. Entwicklungsserver starten (läuft auf Port 3000)
npm run dev

# 4. Im Browser öffnen:
# http://localhost:3000
```

---

## 2. Komplett Offline & Selbst Hosten (Produktions-Build)

Das Frontend ist eine reine Client-Side-Single-Page-Application (SPA) mit Vite, React 19 und Tailwind CSS. Nach dem Build benötigt das Dashboard **weder eine Datenbank noch zwingend eine Internetverbindung** (alle Berechnungen, Würfeltools, Modifikatoren und JSON-Exports/Imports laufen zu 100% lokal im Browser)!

### Produktions-Build erstellen:
```bash
# Build generieren
npm run build
```
Nach dem Build liegt der fertige, kompilierte Webauftritt im Ordner `dist/`.

### Ausführen des Builds:
Du kannst den Ordner `dist/` mit jedem beliebigen Webserver ausliefern:

#### Option A: Mit `serve` (Node.js)
```bash
npx serve -s dist -l 3000
```

#### Option B: Mit Python (ohne zusätzliche Tools)
```bash
cd dist
python3 -m http.server 3000
```

#### Option C: Mit Nginx / Apache
Kopiere einfach den Inhalt von `dist/` in dein Webverzeichnis (z. B. `/var/www/html/`).

---

## 3. Direkte lokale Charakter-Ablage (`./characters/` Ordner)

Das Dashboard speichert Charakterbögen direkt in einem dedizierten Unterordner im Projekt:
```
characters/
├── pathfinder/       # z. B. Floki_Dunkkling.json
├── coc_7e/           # z. B. Harvey_Walters.json
├── coc_1920/         # z. B. Dr_Armitage.json
├── shadowrun/        # z. B. Ghost.json
├── traveller/        # z. B. Roderick_Vance.json
└── custom/           # Eigene / sonstige Systeme
```

### Wie funktioniert das Speichern & Laden ohne langes Suchen?
1. **1-Klick Lokal Speichern (`npm run dev`)**:
   - Klicke im Dashboard oben rechts auf **"Lokal speichern"** (oder das Diskettensymbol).
   - Der Charakter wird sofort ohne Dateidialog als sauberes JSON direkt in `characters/<spielsystem>/<Name>.json` abgelegt!
   - Ein grüner Hinweis bestätigt den genauen Dateipfad.
2. **Charakter-Bibliothek & Sofort-Laden**:
   - Klicke auf **"Charaktere (Ordner)"** in der Menüleiste oder im Start-Launcher auf den Tab **"Lokale Charaktere"**.
   - Alle Bögen sind nach Spielsystem unterteilt aufgeführt (Pathfinder, Cthulhu, Shadowrun, Traveller).
   - Ein Klick auf **"Laden"** öffnet den Charakter sofort im Dashboard.
3. **Verwaltung im Windows Explorer**:
   - Du kannst `.json`-Dateien jederzeit direkt im Explorer in diese Unterordner kopieren, umbenennen oder archivieren.
   - Ein Klick auf "Aktualisieren" liest die neuen Dateien sofort ein.

---

## 4. Docker-Container (1-Klick Self-Hosting)

### Mit Docker Compose:
```bash
docker compose up -d --build
```
Danach ist das Dashboard unter `http://localhost:3000` erreichbar.

### Manuell mit Docker:
```bash
# Docker-Image bauen
docker build -t pnp-dashboard .

# Container starten
docker run -d -p 3000:80 --name pnp-dashboard-app pnp-dashboard
```

---

## 4. Wie lade ich das Projekt aus Google AI Studio herunter?

Wenn du dieses Projekt aus Google AI Studio herunterladen möchtest:
1. Klicke im Google AI Studio Interface oben rechts auf das **Menü (Settings / drei Punkte)**.
2. Wähle **"Export to ZIP"** oder **"Export to GitHub"**.
3. Entpacke das ZIP-Archiv auf deinem Rechner.
4. Führe `npm install` und `npm run dev` aus.

---

## 5. Offline-Funktionen vs. KI-Modelle (OpenRouter & Gemini)

| Funktion | Offline-fähig? | Beschreibung |
|---|---|---|
| Charakterbögen anzeigen & bearbeiten |  Ja (100% Offline) | Alle Werte direkt im Browser bearbeitbar |
| Pathfinder Auto-Rettungswürfe |  Ja (100% Offline) | Automatische Berechnung aus ST, GE, KO, IN, WE, CH |
| Shadowrun Essenz- & Limit-Rechner |  Ja (100% Offline) | Berechnet Essenzkosten & Modifikator-Limits live |
| Traveller Schiff & Sprung-Rechner |  Ja (100% Offline) | Treibstoff & Reichweite lokal berechnet |
| Würfel-Rechner & Würfelproben |  Ja (100% Offline) | Zufallsgenerator läuft nativ im JavaScript-Engine |
| Währungsrechner & Umrechnung |  Ja (100% Offline) | Umrechnungskurse lokal hinterlegt |
| JSON-Speichern & Laden |  Ja (100% Offline) | Charaktere werden als .json Dateien auf deiner Festplatte gespeichert |
| Text/PDF KI-Erkennung | 🌐 Benötigt API-Key | Wähle flexibel zwischen **OpenRouter (inkl. Free Models)** und **Google Gemini** |

### KI-Erkennung flexibel konfigurieren:
Du kannst im Dashboard jederzeit über den Button **"KI-Modell"** (oder das Bot-Icon) deinen Anbieter und dein Modell wählen:
1. **OpenRouter (Kostenlose Modelle möglich!):**
   - Wähle als Anbieter **OpenRouter**.
   - Trage deinen OpenRouter API-Key ein (kostenlos auf [openrouter.ai](https://openrouter.ai) erstellen).
   - Wähle ein beliebiges Modell oder nutze eines der voreingestellten **kostenlosen Modelle** (z. B. `meta-llama/llama-3.3-70b-instruct:free`, `mistralai/mistral-small-24b-instruct-2501:free`, `qwen/qwen-2.5-72b-instruct:free` oder `google/gemini-2.0-flash-exp:free`).
   - Der API-Key wird sicher und verschlüsselt nur lokal in deinem Browser (`localStorage`) gespeichert.
2. **Google Gemini:**
   - Falls du Gemini bevorzugst, wähle einfach Gemini als Provider und gib deinen Key ein oder lege ihn in `.env` ab.
3. **Environment-Datei (.env):**
   Alternativ kannst du die Keys auch in deiner `.env` Datei im Projektverzeichnis hinterlegen:
   ```env
   OPENROUTER_API_KEY=sk-or-v1-...
   # oder
   GEMINI_API_KEY=AIzaSy...
   ```

---

## 6. Häufige Fragen & Troubleshooting

### Warum blieb die Seite früher weiß?
- **Ursache 1: Fehlendes `process.env` im Browser:** Wenn Node.js SDKs direkt im Browser ohne Polyfill geladen wurden, stoppte die Ausführung mit `ReferenceError: process is not defined`. Wir haben globale Polyfills integriert und den KI-Aufruf auf sauberes Browser-`fetch` umgestellt, sodass dieser Fehler dauerhaft behoben ist.
- **Ursache 2: Sonderzeichen im Ordnernamen (`&`):** Wenn der Ordner z.B. `universal-p&p-dashboard` hieß, interpretierte Windows PowerShell das `&` als Befehlstrenner. Benenne den Ordner einfach ohne `&` (z. B. `pnp-dashboard`).

---

## 7. Technische Struktur

- `src/App.tsx`: Zentraler System-Launcher, State-Management und Haupt-Dashboard
- `src/types.ts`: TypeScript-Typen für alle 6 Regelsysteme
- `src/data.ts`: Vorgefertigte Beispiel-Charaktere (Floki, Harvey, Henry, Ghost, Roderick)
- `src/components/`:
  - `DiceCalculator.tsx`: Würfel-Rechner für W4, W6, W8, W10, W12, W20, W100
  - `CurrencyCalculatorModal.tsx`: System-Währungsumrechner (GP, Credits, Nuyen, Dollar)
  - `PathfinderAttributesCard.tsx` & `PathfinderSavingThrowsCard.tsx`: Pathfinder 1e Logik
  - `ShadowrunCyberdeckCard.tsx` & `ShadowrunBodyModsCard.tsx`: Shadowrun 5e Matrix & Cyberware
  - `TravellerDashboardCard.tsx`: Mongoose Traveller 2e Raumschiff- & Subsektor-Dashboard
  - `SkillsPage.tsx`: Fertigkeitenliste & Proben
- `src/utils/`:
  - `pathfinder.ts`: Formeln für Modifikatoren und Rettungswurf-Synchronisation
  - `limits.ts`: Shadowrun Körperlich-, Geistig- und Sozial-Limits
  - `cyberdeck.ts`: Matrix-Berechnungen
  - `traveller.ts`: Sprung- & Treibstoff-Rechner
