# Phase 1 (Infrastruktur & DX) — Roadmap

Status: in Arbeit | Start: 2026-11-27 | Autoritative Arbeitskopie: `D:/Projekte/PnP-Charakter-Dashboard-original`
Repo: `https://github.com/LordSpanien-games/PnP-Charakter-Dashboard` (public, Branch `main`)

## Fortsetzung nach Abbruch

Diese Datei ist die Fortsetzungsgrundlage. Neue Sitzung:

1. `docs/phase1-roadmap.md` lesen.
2. Mit `git log --oneline` abgleichen.
3. Beim ersten Schritt ohne `erledigt`-Status fortsetzen. Schritte mit Hash **nicht** wiederholen.
4. `git status --short` muss sauber sein; offene Änderungen vor dem Fortsetzen klären.

Die Statuszeile wird im Commit des jeweiligen Schritts mit aktualisiert: Der Commit von Schritt N
trägt die Hashes der Schritte 1–N-1 und markiert N als `in Arbeit`; N selbst wird im nächsten
Commit auf `erledigt in <Hash>` gesetzt.

## Ausgangslage (gemessen am 2026-11-27)

- `npx tsc --noEmit`: **99 Fehler**, davon **54 aus den `backup_pnp_*`-Ordnern** (die `tsconfig.json`
  hat weder `include` noch `exclude` und prüft deshalb die Sicherungskopien mit) und **45 echte** in 8 Dateien:

  | Datei | Fehler |
  |---|---|
  | `src/systems/shadowrun/ShadowrunPlugin.tsx` | 26 |
  | `src/systems/pathfinder/PathfinderLevelUpView.tsx` | 5 |
  | `src/systems/cthulhu/CoCDevelopmentView.tsx` | 5 |
  | `src/components/sheets/ShadowrunSheet.tsx` | 3 |
  | `src/types.ts` | 2 |
  | `src/components/sheets/PathfinderSheet.tsx` | 2 |
  | `src/systems/shadowrun/ShadowrunSkillsBlock.tsx` | 1 |
  | `src/systems/pathfinder/pathfinderRules.ts` | 1 |

- `npm run build`: grün — Vite/esbuild ignoriert Typfehler, deshalb sieht der Build Fehler nicht.
- Kein ESLint, kein Prettier, kein Vitest, kein Storybook. Kein `test`-Skript.
- CI (`Build and Deploy`): nur `npm install` → `npm run build` → Pages-Deploy. Keine Tests, kein Lint.
- Bestehender Test-Harness: `scripts/verifyWeaponModel.ts` (55 Prüfungen, manuell gestartet, nicht in CI).
- **Stand nach Schritt 2:** `npx tsc --noEmit` meldet **45** Fehler – alle echt, keine aus den
  Backup-Ordnern mehr. `exclude` in der `tsconfig.json` muss `node_modules` und `dist` mit enthalten,
  sonst prüft `tsc` beim Setzen von `exclude` diese Verzeichnisse mit.

## Phasen und Schritte

### Phase A: TypeScript-Fehler beseitigen
Gate: `npx tsc --noEmit` meldet **0 Fehler** — **erreicht** (Stand nach Schritt 10: 0 Fehler).

| # | Datei | Änderung | Commit-Betreff | Status |
|---|-------|----------|----------------|--------|
| 1 | `docs/phase1-roadmap.md` | Diese Datei anlegen | `Docs: Roadmap Phase 1 (Infrastruktur & DX)` | erledigt in 49c7ed7 |
| 2 | `tsconfig.json` | `exclude` für `backup_pnp_*` → Fehler 99 auf 45 | `Chore: Backup-Ordner aus der TypeScript-Pruefung ausnehmen` | erledigt in 9aec2d5 |
| 3 | `src/types.ts` | 2 Verweise auf nicht existierende Module (`./services/characterStorageService`, `./services/aiService`) entfernen | `Fix: Tote Modulverweise in types.ts entfernen` | erledigt in 3d1b72a |
| 4 | `src/systems/shadowrun/ShadowrunPlugin.tsx` | 26 Typfehler | `Fix(shadowrun): Typfehler in ShadowrunPlugin beheben` | erledigt in 4e1a31c |
| 5 | `src/systems/shadowrun/ShadowrunSkillsBlock.tsx` | 1 Typfehler | `Fix(shadowrun): Typfehler in ShadowrunSkillsBlock beheben` | erledigt in ca123b3 |
| 6 | `src/systems/cthulhu/CoCDevelopmentView.tsx` | 5 Typfehler | `Fix(cthulhu): Typfehler in CoCDevelopmentView beheben` | erledigt in 462d5f0 |
| 7 | `src/components/sheets/ShadowrunSheet.tsx` | 3 Typfehler | `Fix: Typfehler in ShadowrunSheet beheben` | erledigt in 957e22f |
| 8 | `src/components/sheets/PathfinderSheet.tsx` | 2 Typfehler | `Fix: Typfehler in PathfinderSheet beheben` | erledigt in 3e90ba8 |
| 9 | `src/systems/pathfinder/PathfinderLevelUpView.tsx` | 5 Typfehler | `Fix(pathfinder): Typfehler in PathfinderLevelUpView beheben` | erledigt in 3b34230 |
| 10 | `src/systems/pathfinder/pathfinderRules.ts` | 1 Typfehler | `Fix(pathfinder): Typfehler in pathfinderRules beheben` | in Arbeit |

### Phase B: Vitest + React Testing Library
Gate: `npm test` grün **und** CI grün

| # | Datei | Änderung | Commit-Betreff | Status |
|---|-------|----------|----------------|--------|
| 11 | `package.json` | devDependencies `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`; Skript `test` | `Chore: Vitest und Testing-Library als devDependencies` | offen |
| 12 | `vitest.config.ts` | neu: Test-Umgebung, `include`-Muster, Setup-Datei | `Chore: Vitest-Konfiguration anlegen` | offen |
| 13 | `src/test/setup.ts` | neu: jest-dom-Setup, Aufräumen nach jedem Test | `Chore: Test-Setup anlegen` | offen |
| 14 | `src/systems/pathfinder/__tests__/pathfinderWeaponModel.test.ts` | neu: Portierung der Prüfungen 1–12 aus `verifyWeaponModel.ts` | `Test(pathfinder): Waffenmodell-Tests auf Vitest portieren` | offen |
| 15 | `src/systems/pathfinder/__tests__/pathfinderAttackProfile.test.ts` | neu: Angriffsprofil, Krit-Semantik, Schadenssummen | `Test(pathfinder): Angriffsprofil- und Krit-Tests ergaenzen` | offen |
| 16 | `src/systems/pathfinder/__tests__/pathfinderCombatHistory.test.ts` | neu: Kampfhistorie-Logik | `Test(pathfinder): Kampfhistorie-Tests ergaenzen` | offen |
| 17 | `src/systems/pathfinder/__tests__/PathfinderDiceOverview.test.tsx` | neu: UI-Test „Krit lässt den Normalwurf-Eingabewert nicht verschwinden" | `Test(pathfinder): UI-Test fuer Krit-Zusatzwurf ergaenzen` | offen |
| 18 | `scripts/verifyWeaponModel.ts` | löschen – vollständig durch Vitest ersetzt | `Chore: Altes Pruefskript durch Vitest ersetzen` | offen |
| 19 | `.github/workflows/deploy.yml` | Testschritt vor dem Build | `CI: Tests vor dem Build ausfuehren` | offen |

### Phase C: Prettier (Formatierung)
Gate: `npm run build` grün nach **jedem** Commit

| # | Datei | Änderung | Commit-Betreff | Status |
|---|-------|----------|----------------|--------|
| 20 | `.prettierrc` | neu: Formatierungsregeln | `Chore: Prettier-Konfiguration anlegen` | offen |
| 21 | `.prettierignore` | neu: `backup_pnp_*`, `dist`, `node_modules` | `Chore: Prettier-Ignorierliste anlegen` | offen |
| 22 | `src/core/` | Formatierung, jede Datei genau einmal | `Style: src/core mit Prettier formatieren` | offen |
| 23 | `src/systems/pathfinder/` | Formatierung, jede Datei genau einmal | `Style: src/systems/pathfinder mit Prettier formatieren` | offen |
| 24 | `src/systems/` (Rest) | Formatierung, jede Datei genau einmal | `Style: uebrige src/systems mit Prettier formatieren` | offen |
| 25 | `src/components/`, `src/App.tsx`, `src/data/`, `src/utils/`, `scripts/`, Konfigurationsdateien | Formatierung, jede Datei genau einmal | `Style: restliche Quellen mit Prettier formatieren` | offen |

### Phase D: ESLint
Gate: `npm run lint`, `npm test`, `npm run build` grün **und** CI grün

| # | Datei | Änderung | Commit-Betreff | Status |
|---|-------|----------|----------------|--------|
| 26 | `package.json` | devDependencies `eslint`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`; Skript `lint:eslint` | `Chore: ESLint und Plugins als devDependencies` | offen |
| 27 | `eslint.config.js` | neu: Flat Config ohne Formatierungsregeln (macht Prettier) | `Chore: ESLint-Konfiguration anlegen` | offen |
| 28 | (nach Schritt 27 ermitteln) | ESLint-Funde beheben, Datei für Datei, ein Commit je Datei | `Fix: ESLint-Fundstelle in <datei> beheben` | offen |
| 29 | `.github/workflows/deploy.yml` | Lintschritt | `CI: Lint-Pruefung ergaenzen` | offen |
| 30 | `docs/phase1-roadmap.md` | Abschlussvermerk, Status auf abgeschlossen | `Docs: Roadmap Phase 1 abschliessen` | offen |

## Regeln

- Jede Datei genau einmal anfassen: alle Änderungen in einem Durchgang, dann committen und pushen.
- Ein Schritt = ein Commit + Push. Die Statuszeile wird im selben Commit mit aktualisiert.
- Vor jedem Push das Gate des laufenden Schritts ausführen.
- Nach jedem Commit `git status --short` und `git diff --stat` prüfen (Lockfile, generierte Dateien).
- Bei non-exact Patch: auf doppelte Blöcke prüfen, bevor committet wird.
- Backup aller betroffenen Dateien vor der Änderung (`backup_pnp_JJJJMMTT_HHMMSS/`, git-ignoriert).

## Bekannte Stolpersteine

- `npm install` überschreibt hier `package-lock.json` mit fremdem name/version
  (Lock `pnp-dashboard/1.0.0` gegen `package.json` `react-example/0.0.0`). Nach jeder Installation
  `git diff package-lock.json` prüfen und notfalls `git checkout -- package-lock.json`.
- `terminal` verweigert `npm run dev` (Long-lived-Erkennung). Für Browser-Tests den Build detached
  über `python -m http.server 3000 --directory dist` ausliefern.
- Der Browser-Tab wird zwischen `browser_exec`-Aufrufen zurückgesetzt: Navigation, Fixture, Aktionen
  und Assertions gehören in **einen** Aufruf.
- `patch` trifft manchmal die falsche Datei: nach jedem Patch den Diff prüfen.
- Fuzzy-Patches können Blöcke doppelt einfügen: nach non-exact Patch auf doppelte Deklarationen prüfen.

## Abweichungen von der Planung

- (wird fortgeschrieben)
