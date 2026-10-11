# 🎲 PnP Charakter Dashboard

**Ein KI-gestütztes, systemübergreifendes Pen-&-Paper-Dashboard für Spielleiter und Spieler**

[![Build and Deploy](https://github.com/LordSpanien-games/PnP-Charakter-Dashboard/actions/workflows/deploy.yml/badge.svg)](https://github.com/LordSpanien-games/PnP-Charakter-Dashboard/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Made with React + TypeScript](https://img.shields.io/badge/React%20%2B%20TypeScript-20232A?logo=react&logoColor=61DAFB)](https://react.dev)

---

## 🎮 Unterstützte Spielsysteme

| System | Features | Besonderheiten |
|--------|----------|-----------------|
| **Pathfinder 1e** | D20-System mit automatischen Rettungswürfen | Attribute, RK, TP, Kampf-Kombos, Klassen-Features |
| **Call of Cthulhu 7e** | W100-Prozentsystem | Geistige Stabilität, Glück, 1/2- & 1/5-Schwellenwerte |
| **Call of Cthulhu 1920er** | Historische Fassung | Epochen-Ausrüstung, Mythos-Kenntnisse |
| **Shadowrun 5e** | Cyberpunk W6 | Matrix-Attribute, Body-Modifikationen, Essenz-Berechnung, Limits |
| **Mongoose Traveller 2e** | Hard-Sci-Fi 2W6 | Scout-Raumschiffe, Subsektor-Sprünge, Treibstoff-Rechner |
| **Generisches P&P** | Universelles System | Flexibel für beliebige Regelsysteme |

---

## ✨ Hauptfunktionen

### 📊 Charakterverwaltung
- ✅ Vollständige Charakterblätter für alle Systeme
- ✅ Live-Bearbeitung mit Edit-Modus
- ✅ Automatische Speicherung in Browser-Speicher
- ✅ JSON-Export/Import für Sicherungen

### 🎲 Würfel & Rechner
- ✅ **Würfel-Rechner**: W4, W6, W8, W10, W12, W20, W100
- ✅ **Währungs-Rechner**: GP, Credits, Nuyen, Dollar
- ✅ **System-spezifische Berechnungen**:
  - Pathfinder: BAB, Rettungswürfe, RK
  - Shadowrun: Essenz, Limits, Matrix-Attribute
  - Traveller: 2W6 Proben, Sprünge

### 🎯 Automatisierungen
- ✅ **Pathfinder**: Automatische Rettungswurf-Synchronisation
- ✅ **Shadowrun**: Automatische Essenz-Berechnung bei Body-Mods
- ✅ **CoC**: Entwicklungsproben & Sanität-Tracking
- ✅ **Traveller**: Raumschiff-Management & Treibstoff-Rechner

### 💾 Datenverwaltung
- ✅ Lokale Speicherung (Browser IndexedDB)
- ✅ Offline-Betrieb vollständig möglich
- ✅ Charaktere nach Systemen organisiert
- ✅ Versionsverlauf & Backups

### 🤖 KI-Integration (Optional)
- ✅ Server-seitige Gemini API für erweiterte Features
- ✅ Automatische Charakterbeschreibungen
- ✅ Regel-Beratung & Interpretationen

---

## 🚀 Schnelleinstieg

### Online Demo
🌐 **[PnP Dashboard Live Demo](https://lordspanien-games.github.io/PnP-Charakter-Dashboard)**

### Lokal testen
```bash
# Repository klonen
git clone https://github.com/LordSpanien-games/PnP-Charakter-Dashboard.git
cd PnP-Charakter-Dashboard

# Dependencies installieren
npm install

# Development-Server starten
npm run dev

# Im Browser öffnen: http://localhost:5173
```

### Docker starten
```bash
# Docker-Image bauen
docker build -t pnp-dashboard .

# Container starten
docker run -d -p 3000:80 --name pnp-dashboard pnp-dashboard

# Zugriff: http://localhost:3000
```

---

## 📁 Projektstruktur

```
src/
├── App.tsx                          # Zentraler Launcher & State-Management
├── types.ts                         # TypeScript-Typen für alle Systeme
├── data.ts                          # Beispiel-Charaktere
│
├── components/
│   ├── DashboardView.tsx            # Hauptdashboard-Layout
│   ├── DiceCalculator.tsx           # Würfel-Rechner
│   ├── CurrencyCalculatorModal.tsx  # Währungs-Rechner
│   ├── PathfinderDashboardSection/  # Pathfinder-spezifische Komponenten
│   ├── ShadowrunDashboardSection/   # Shadowrun-spezifische Komponenten
│   ├── TravellerDashboardCard/      # Traveller-spezifische Komponenten
│   └── ...
│
├── utils/
│   ├── pathfinder.ts                # Pathfinder-Logik & Formeln
│   ├── limits.ts                    # Shadowrun Limits-Berechnung
│   ├── cyberdeck.ts                 # Matrix-Berechnungen
│   └── ...
│
├── characters/
│   ├── pathfinder/                  # Pathfinder-Charaktere
│   ├── coc_7e/                      # CoC 7e Charaktere
│   ├── coc_1920/                    # CoC 1920er Charaktere
│   ├── shadowrun/                   # Shadowrun Charaktere
│   ├── traveller/                   # Traveller Charaktere
│   └── custom/                      # Benutzerdefinierte Charaktere
│
└── index.html
```

---

## 🔧 Verwendete Technologien

- **Frontend**: React 19 + TypeScript 5.8
- **Styling**: Tailwind CSS 4.3 + Motion (Animationen)
- **Build-Tool**: Vite 6.4
- **Icons**: Lucide React
- **Deployment**: GitHub Actions + GitHub Pages
- **Container**: Docker

---

## 📚 Dokumentation

Siehe **[DOCUMENTATION.md](./DOCUMENTATION.md)** für:
- 📖 Detaillierte System-Dokumentationen
- 🔧 Technische Architektur
- 🛠️ Entwickler-Guide
- 📝 API-Referenz
- 🌐 Self-Hosting & Offline-Betrieb

---

## 🎯 Features im Detail

### Pathfinder 1e
- **Attributs-System**: STR, DEX, CON, INT, WIS, CHA mit Modifikatoren
- **Rettungswürfe**: Zähigkeit, Reflex, Wille (automatisch synchronisiert)
- **Rüstungsklasse (RK)**: Mit Touch RK & Flat-Footed RK
- **Kampf**: BAB, Angriffsboni, Kombinationen, Spezialfähigkeiten
- **Fertigkeiten**: 40+ Fertigkeiten mit Klassenmerkmalen
- **Fähigkeiten**: Klassen-Features, Talente, Spezialisierungen
- **Stufenaufstieg**: Automatische Berechnung von HP, BAB, Fertigkeitspunkten

### Call of Cthulhu 7e
- **Eigenschaften**: STR, CON, POW, DEX, APP, SIZ, INT, EDU
- **Geistige Stabilität (Sanity)**: Tracking und automatische Berechnung
- **Glück**: Separater Würfelpool
- **Fertigkeiten**: W100-Proben mit Erfolgs-Ticks
- **Waffen**: Mit Fehlzünder & Schussweite
- **Investigation**: Mythos-Kenntnisse & Clue-Tracking

### Shadowrun 5e
- **Attribute**: GES, INT, LOG, WIL, CHA, STR, KON mit Limits
- **Cyberware**: Body-Modifikationen mit Essenz-Berechnung
- **Matrix**: Cyberdeck mit Attribute & Programme
- **Limits**: Körperlich, Geistig, Sozial (automatisch berechnet)
- **Schadensmonitore**: Physisch & Geistig mit Modifikatoren
- **Fertigkeiten**: Mit Spezialisierungen & Boni
- **Ausrüstung**: Weapons, Rüstung, Cyberware, Elektronik

### Mongoose Traveller 2e
- **Attribute**: STR, DEX, END, INT, EDU, SOC mit 2W6-Verteilung
- **Raumschiffe**: Scout-Klasse mit Specs
- **Navigation**: Sprünge & Subsektor-Bewegungen
- **Treibstoff**: Automatische Berechnung & Verbrauch
- **Fertigkeiten**: 2W6-Wurf mit Difficulty Target
- **Schiffe-Management**: Reparatur, Wartung, Gewinn

---

## 🐛 Bekannte Probleme & TODOs

- [ ] Mehrsprachige Interfaces (nur DE/EN geplant)
- [ ] Export zu offiziellen Charakterblatt-Formaten (PDF)
- [ ] Netzwerk-Synchronisation (Cloud-Sync)
- [ ] Multi-Player-Support für Parties
- [ ] Kampf-Tracker im Real-Time Mode
- [ ] Mobile-Optimierung für Tablets

---

## 🤝 Beiträge

Beiträge sind willkommen! 🎉

1. **Fork** das Repository
2. Erstelle einen **Feature-Branch** (`git checkout -b feature/amazing-feature`)
3. **Committe** deine Änderungen (`git commit -m 'Add amazing feature'`)
4. **Push** zu deinem Branch (`git push origin feature/amazing-feature`)
5. Öffne einen **Pull Request**

---

## 📋 Lizenz

Dieses Projekt ist unter der **MIT License** lizenziert. Siehe [LICENSE](./LICENSE) für Details.

---

## 👨‍💻 Autoren & Credits

- **Entwicklung**: LordSpanien-games
- **Design**: React + Tailwind CSS
- **KI-Integration**: Google Gemini API
- **Inspiration**: Offizielles Pathfinder-, CoC-, Shadowrun- und Traveller-Regelwerk

---

## 📞 Support & Kontakt

- 🐛 **Fehler melden**: [GitHub Issues](https://github.com/LordSpanien-games/PnP-Charakter-Dashboard/issues)
- 💡 **Feature-Anfragen**: [GitHub Discussions](https://github.com/LordSpanien-games/PnP-Charakter-Dashboard/discussions)
- 📧 **Kontakt**: Über GitHub Profile

---

## 🎲 Viel Spaß beim Spielen!

*"Ein großes Abenteuer beginnt mit einem guten Charakter!"* ⚔️🐉✨

---

### Sponsoring & Support

Magst du das Projekt? Unterstütze die Entwicklung:

- ⭐ **Star** das Repository
- 🔄 **Share** mit anderen Spielern
- 🐛 **Report** Bugs
- 💡 **Suggest** neue Features

---

**Zuletzt aktualisiert**: Oktober 2026
