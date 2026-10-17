# 🎲 PnP Charakter-Dashboard

Ein modulares, browserbasiertes Charakterbogen-Dashboard für Pen-&-Paper-Rollenspiele.
Komplett ohne Server, ohne Account, ohne KI-Zwang – deine Daten bleiben auf deinem Gerät.

🔗 **Live-Demo:** [https://lordspanien-games.github.io/PnP-Charakter-Dashboard/](https://lordspanien-games.github.io/PnP-Charakter-Dashboard/)

## 🧩 Unterstützte Systeme

| System | Status | Besonderheiten |
|---|---|---|
| **Pathfinder 1e** | ✅ Vollständig | GAB/Iterativangriffe, KMB/KMV, Grip-Varianten (ein-/zweihändig), Hinterhalt, Zweiwaffenkampf, Talente & Fähigkeiten mit Tagesnutzung |
| **Shadowrun 5e** | ✅ Vollständig | Essenz (automatisch aus Cyberware), Limits, Matrix/Cyberdeck mit frei zuordenbaren Attributen, Lifestyle & Nuyen-Historie |
| **Call of Cthulhu 7e** | ✅ Vollständig | W100-Schwellenwerte (Normal/Schwer/Extrem), Entwicklungsphase, Schadensbonus/Bauen, Hintergrund-Reiter |
| **Call of Cthulhu 1920er** | ✅ Vollständig | Wie CoC 7e, historisches Setting |
| **Cairn / Cairn 2** | ✅ Vollständig | Minimalistisches OSR-System |
| **Mongoose Traveller 2e** | ⏳ Noch nicht verfügbar | Geplant, aktuell noch nicht in der neuen Architektur umgesetzt |

## 🏗️ Architektur: Plugin-basiert statt Einzellösung

Jedes Spielsystem ist ein eigenständiges Plugin mit:
- eigener Berechnungslogik (`*Rules.ts`)
- eigener Dashboard-Oberfläche (`*Plugin.tsx`)
- eigener Legacy-Import-Erkennung für alte Charakterdateien

Neue Systeme lassen sich ohne Eingriff in bestehenden Code ergänzen – einfach in `registerAllSystems.ts` registrieren.


src/
├── core/ # Systemunabhängiger Kern
│ ├── types.ts # Generische Charakter-Datenstruktur
│ ├── SystemPlugin.ts # Plugin-Interface
│ ├── systemRegistry.ts # Plugin-Registrierung
│ ├── persistence.ts # Export/Import als JSON
│ ├── compare.ts # Charaktervergleich zwischen zwei Dateien
│ ├── rest.ts # Generische Rast-/Erholungsfunktion
│ └── uiKit.tsx # Wiederverwendbare UI-Bausteine
└── systems/
├── pathfinder/
├── shadowrun/
├── cthulhu/
└── cairn/


## ✨ Kernfunktionen (systemübergreifend)

- **Charakter erstellen**: leer, automatisch ausgewürfelt oder ausgewürfelt mit freier Zuordnung (je nach Spielsystem)
- **JSON-Export/Import**: eigene Daten bleiben vollständig in deiner Hand, alte Charakterdateien werden automatisch erkannt und ins neue Format migriert
- **Charaktervergleich**: zwei JSON-Exporte gegenüberstellen, um Fortschritt sichtbar zu machen
- **Gruppen-Karte**: Name/Spielername immer sichtbar, weitere Details (Rasse, Status, Trefferpunkte, Notizen) per Hover oder im Bearbeitungsmodus
- **Regelwerk-Referenzen**: pro Gegenstand/Talent Buch, Seite und/oder Weblink hinterlegbar
- **Rast & Erholung**: systemspezifisch (z. B. Nachtruhe/Bettruhe bei Pathfinder, Natürliche Heilung/Erste Hilfe bei Shadowrun)
- **Inventar mit Kategorie-Reitern**, Ladungsverwaltung und Mengen-Tracking

## 🚫 Bewusst nicht enthalten

- **Keine KI-Anbindung**: Charaktere werden ausschließlich manuell angelegt oder importiert – kein Zwang zu einem externen API-Key
- **Kein Server-Backend**: alles läuft im Browser, Hosting über GitHub Pages
- **Keine automatischen Würfelwürfe im laufenden Spiel**: das Dashboard unterstützt Wurf-Eingabe und Schwellenwert-Anzeige, ersetzt aber bewusst nicht die physischen Würfel am Tisch

## 🚀 Lokale Entwicklung

```bash
npm install
npm run dev
npm run build
