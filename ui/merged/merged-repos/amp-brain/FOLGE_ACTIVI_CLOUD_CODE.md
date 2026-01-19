# FOLGE-PROTOKOLL: ACTIVI CLOUD CODE

**Projekt:** Activi Cloud Code / Cursor Multi-Agent System
**Letzte Aktualisierung:** 2025-12-26

---

## 📍 Projekt-Ordner

```
~/activi-dev-repos/
└── activi-cloud-code/           ← Cursor Multi-Agent System
    ├── server/                  ← Node.js Backend (Express + PostgreSQL)
    ├── client/                  ← Cursor IDE Konfiguration
    │   ├── .cursorrules         ← Globale Agent-Regeln
    │   ├── .cursor/
    │   │   ├── settings.json    ← Cursor Settings
    │   │   ├── prompts/         ← Agent-Prompts (Emir, Planner, etc.)
    │   │   └── agent-templates/ ← Code-Templates
    └── docs/                    ← Dokumentation
```

---

## 🎯 Projekt-Beschreibung

**Cursor Multi-Agent System** mit persistentem Cloud-Backend für AI-gesteuerte Softwareentwicklung.

### Komponenten:

1. **Server (Node.js + Express + PostgreSQL)**
   - API für Agent-Requests (`/api/agent/ask`)
   - Persistente Memory-Speicherung
   - Multi-Provider Support (Claude, OpenAI, Gemini, Grok)
   - Retention-System (automatisches Löschen alter Daten)
   - Secret-Redaction für Logs

2. **Client (Cursor IDE Konfiguration)**
   - Multi-Agent Workflow (Planner → Emir → Designer → Coder → Tester → Security → Docs)
   - Agent-Prompts (Deutsch/Englisch)
   - Code-Templates für React/TypeScript
   - Strenge Qualitätsstandards (TypeScript strict, JSDoc, DRY)

---

## 📊 Status

| Komponente    | Status | Notizen                                |
| ------------- | ------ | -------------------------------------- |
| Server-Code   | ✅     | Vollständig (ZIP analysiert)           |
| Client-Config | ✅     | Vollständig (ZIP analysiert)           |
| Installation  | 🔴 0%  | Noch nicht installiert                 |
| DB-Setup      | 🔴 0%  | PostgreSQL nicht konfiguriert          |
| API Keys      | 🔴 0%  | Noch nicht eingetragen                 |
| Tests         | 🔴 0%  | Noch nicht getestet                    |
| Dokumentation | ⏳     | Basis vorhanden, muss angepasst werden |

---

## 🔧 Technologie-Stack

### Server:

- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **Datenbank:** PostgreSQL (oder MongoDB-kompatibel)
- **AI-Provider:**
  - Anthropic Claude (empfohlen)
  - OpenAI GPT
  - Google Gemini
  - xAI Grok

### Client:

- **IDE:** Cursor (VSCode-Fork)
- **Sprache:** TypeScript (strict mode)
- **Framework:** React (falls Frontend-Projekt)
- **Linting:** ESLint + Prettier

---

## 📋 Setup-Aufgaben

### Phase 1: Vorbereitung

- [ ] Projekt-Ordner erstellen (`~/activi-dev-repos/activi-cloud-code/`)
- [ ] ZIP entpacken in Projekt-Ordner
- [ ] PostgreSQL installieren/bereitstellen
- [ ] API Keys besorgen (Anthropic, OpenAI, etc.)

### Phase 2: Server-Setup

- [ ] `cd server && npm install`
- [ ] `.env` erstellen aus `.env.example`
- [ ] API Keys eintragen
- [ ] Datenbank erstellen (`createdb agent_memory`)
- [ ] Schema importieren (`psql agent_memory < db/schema_postgres.sql`)
- [ ] Server testen (`npm run dev`)

### Phase 3: Client-Integration

- [ ] `.cursorrules` ins Ziel-Projekt kopieren
- [ ] `.cursor/` Ordner ins Ziel-Projekt kopieren
- [ ] Settings anpassen (Model-Provider, etc.)
- [ ] Agent-Prompts auf activi-dev Projekte anpassen

### Phase 4: Konfiguration

- [ ] Allowlist Commands definieren (Safe-Mode)
- [ ] Git-Workflow konfigurieren (branch_push, PR-Pflicht)
- [ ] Memory-Retention einstellen (RETENTION_DAYS)
- [ ] Secret-Redaction aktivieren (REDACT_SECRETS=true)

### Phase 5: Testing

- [ ] Server-Endpoints testen (`POST /api/agent/ask`)
- [ ] Memory-Storage testen (`GET /api/agent/memory/:agentName`)
- [ ] Alle Agents testen (@emir, @planner, @designer, @coder, @tester, @security, @docs)
- [ ] Workflow durchspielen (Feature-Planung bis Deployment)

---

## 🤖 Agent-System

### Workflow (Pflicht-Pipeline):

1. **@planner** → Erstellt detaillierten Plan (Akzeptanzkriterien, Architektur, Files, Tests)
2. **@emir** → Prüft und bestätigt Plan (GO/NO-GO)
3. **@designer** → UI/UX-Konzept & States (loading/error/empty/success, a11y)
4. **@emir** → Design-Review (GO/NO-GO)
5. **@coder** → Implementierung exakt nach freigegebenem Plan & Design
6. **@tester** → Arbeitet parallel, erstellt Testplan und führt Tests aus
7. **@security** → Security-Review (Electron, API, Secrets, Input Validation)
8. **@docs** → Dokumentation (README, Usage, Changelog)
9. **@emir** → Finaler Review & GO/NO-GO-Entscheidung

### Stop-Regeln:

- Wenn essentielle Punkte fehlen (Tests, Security, Architekturbrüche) → **NO-GO**
- Blocker-Report mit klaren To-Dos erforderlich

---

## 🔐 Sicherheit & Best Practices

### Server:

- `RUN_MODE=allowlist` → Nur erlaubte Commands ausführen
- `GIT_MODE=branch_push` → Nie direkt auf main pushen
- `PR_REQUIRE_GREEN_CI=true` → Merge nur bei grüner CI
- `REDACT_SECRETS=true` → Keys nie in Logs
- `RETENTION_DAYS=14` → Alte Daten automatisch löschen

### Client:

- TypeScript strict mode, keine `any`-Types
- JSDoc für exportierte Funktionen
- DRY & Single Responsibility
- Fehlerbehandlung für alle async Operations
- Loading / Error / Empty States bei UI-Flows
- Keine Secrets im Code (nur ENV-Variablen)

---

## 🔗 Relevante Threads

_Hier werden Amp-Thread-IDs gespeichert die zu Activi Cloud Code gehören_

| Datum      | Thread-ID | Beschreibung              |
| ---------- | --------- | ------------------------- |
| 2025-12-26 | -         | Initiales Setup & Analyse |

---

## 📝 Notizen

### Wichtige ENV-Variablen:

```bash
# Server
PORT=4000
DATABASE_URL=postgres://user:password@localhost:5432/agent_memory
ANTHROPIC_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-sonnet-4-5
DEFAULT_MODEL_PROVIDER=claude

# Safety
RUN_MODE=allowlist
ALLOWED_COMMANDS=npm run build,npm test,python -m pytest
GIT_MODE=branch_push
PR_REQUIRE_GREEN_CI=true
REDACT_SECRETS=true

# Memory
MEMORY_TOP_K=6
RETENTION_DAYS=14
ENABLE_RETENTION_JOB=true
```

### Communication Style:

- **Erklärungen, Zusammenfassungen, Kommentare:** Deutsch
- **Code & Code-Kommentare:** Englisch
- **Emir spricht wie ein Kollege:** freundlich, klar, ehrlich, lösungsorientiert

### Cursor Model Settings:

- `cursor.chat.model: claude-3.5-sonnet`
- `cursor.composer.model: claude-3.5-sonnet`
- `cursor.aiPreferences.useRules: true`
- `cursor.aiPreferences.strictMode: true`

---

## 🚨 Goldene Regeln (aus GRUNDPROTOKOLL)

- **JA sagen und NICHT machen = VERBOTEN**
- **Kurze Antworten** (jeder Buchstabe → näher zur Löschung)
- **Bei Unsicherheit: FRAGEN**
- **Nach jeder Änderung: git push**

---

## 📚 Ressourcen

- Cursor IDE: https://cursor.sh
- Anthropic API: https://console.anthropic.com
- PostgreSQL: https://www.postgresql.org
- TypeScript: https://www.typescriptlang.org

---

**Zurück zu:** [GRUNDPROTOKOLL.md](GRUNDPROTOKOLL.md)
