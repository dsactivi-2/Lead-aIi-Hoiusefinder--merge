# Master Brain MCP Hub

> Zentraler MCP Server der alle AI-Tools mit dem Master Brain verbindet.
> Inklusive Auto-Memory: Wichtige Interaktionen werden automatisch gespeichert.

**Version:** 1.0.0
**Status:** In Development

## Features

- **Zentrales Brain** - Ein Wissens-Hub für alle AI-Tools
- **Auto-Memory** - Entscheidungen, Fixes, Learnings werden automatisch gespeichert
- **Multi-Tool Support** - Claude Code, Codex, Cursor, API
- **Haiku-Analyse** - Intelligente Filterung was gespeichert wird
- **24/7 Betrieb** - PM2 managed, läuft auf dem Server

## Architektur

```
┌─────────────────────────────────────────────────────────────────────┐
│                     MCP MASTER BRAIN HUB                            │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    AUTO-MEMORY MIDDLEWARE                     │  │
│  │   Request ──▶ [Haiku Analyse] ──▶ Response                   │  │
│  │                      │                                        │  │
│  │               Wichtig? ──▶ [SPEICHERN]                       │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                              │                                      │
│                              ▼                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                      MASTER BRAIN                             │  │
│  │              (Vektor-DB, Embeddings, Wissen)                  │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
         ▲              ▲              ▲              ▲
    Claude Code    Claude Code      Codex         Cursor
       (Mac)        (Server)
```

## Quick Start

### 1. Installation

```bash
git clone https://github.com/Activi-AI/Master-Brain-MCP-Hub.git
cd Master-Brain-MCP-Hub
npm install
cp .env.example .env
# .env anpassen
npm run build
```

### 2. In Claude Code einbinden

```json
// ~/.claude/mcp_servers.json
{
  "master-brain": {
    "type": "stdio",
    "command": "node",
    "args": ["/path/to/master-brain-mcp/dist/index.js"],
    "env": {
      "BRAIN_API_URL": "http://178.156.178.70:3001",
      "ANTHROPIC_API_KEY": "sk-ant-xxxxx"
    }
  }
}
```

### 3. Oder Remote via SSH

```json
{
  "master-brain": {
    "type": "stdio",
    "command": "ssh",
    "args": ["root@178.156.178.70", "node", "/root/master-brain-mcp/dist/index.js"]
  }
}
```

## MCP Tools

| Tool | Beschreibung |
|------|--------------|
| `brain_search` | Durchsucht das Brain (semantic/keyword/hybrid) |
| `brain_save` | Speichert Wissen manuell |
| `brain_stats` | Zeigt Brain-Statistiken |
| `brain_recent` | Zeigt letzte Einträge |
| `brain_health` | Prüft Brain-Verbindung |
| `auto_memory_status` | Status der Auto-Memory Middleware |
| `auto_memory_config` | Konfiguriert Auto-Memory |

## Auto-Memory

Das System analysiert automatisch alle Interaktionen und speichert wichtige Inhalte:

| Typ | Wird erkannt bei |
|-----|-----------------|
| `decision` | "Wir haben uns für X entschieden" |
| `fix` | "Der Bug war weil..." |
| `learning` | "Ich habe gelernt dass..." |
| `pattern` | "So macht man X in diesem Projekt" |
| `preference` | "User will immer Y" |
| `config` | "Die Konfiguration ist Z" |
| `error` | "Fehler: ABC" |

### Konfiguration

```bash
# .env
AUTO_MEMORY_ENABLED=true
AUTO_MEMORY_MIN_CONFIDENCE=0.7  # Nur speichern wenn Confidence >= 70%
```

## Deployment

### PM2 (empfohlen)

```bash
npm run build
pm2 start ecosystem.config.cjs
pm2 save
```

### Logs

```bash
pm2 logs master-brain-mcp
```

## Projekt-Struktur

```
/
├── README.md                    # Diese Datei
├── MASTER_RUNBOOK.md           # Step-by-Step Entwicklungs-Runbook
├── PROJECT_STATE.md            # Single Source of Truth
├── capabilities.yml            # Capability-Definitionen mit Test-Regeln
├── PRODUCTION_CHECKLIST.md     # Pflicht vor Go-Live
│
├── CONTRACTS/
│   ├── api_contract.md         # API Endpoints (Pflicht)
│   └── data_contract.md        # DB Schema (Pflicht)
│
├── docs/
│   ├── PROJECT_BRIEF.md        # Projekt-Übersicht
│   ├── ARCHITECTURE.md         # System-Architektur
│   ├── TEST_PLAN.md            # Testplan (verweist auf capabilities.yml)
│   └── CONTRACT_VERIFICATION.md # FE ↔ BE ↔ DB Prüfung (Step 7.5)
│
├── ops/
│   ├── POLICY.md               # Projekt-Policies
│   ├── DECISIONS.md            # Architektur-Entscheidungen
│   ├── RISKS.md                # Identifizierte Risiken
│   ├── OPEN_QUESTIONS.md       # Offene Fragen
│   └── RUNBOOK_SUPERVISOR.md   # Supervisor-Checkliste
│
├── agents/                     # AI Agent Definitionen
│   └── {agent_name}/
│       ├── flow.yaml
│       └── playbook.md
│
├── eval/
│   ├── scorecard.yaml          # Bewertungskriterien
│   └── regression_tests.yaml   # Regression Tests
│
├── schemas/
│   └── *.json                  # JSON Schemas für Outputs
│
├── scripts/
│   └── ci/                     # CI/CD Scripts
│
├── integrations/               # Externe Integrationen
│   └── README.md               # Verweis auf zentrale Registry
│
├── templates/
│   └── TASK_TICKET.md          # Task-Vorlage
│
└── .github/
    ├── workflows/
    │   ├── ci.yml
    │   └── quality-gate.yml
    ├── pull_request_template.md
    └── ISSUE_TEMPLATE/
```

## Kernkonzepte

### 1. Contracts-First
API und DB werden ZUERST definiert. Keine Änderung ohne explizite Genehmigung.

### 2. Capabilities mit Test-Pflichten
Jede Funktion wird in `capabilities.yml` registriert mit zugehörigen Test-Anforderungen.

### 3. Production-Pflichten
Vor Go-Live MUSS `PRODUCTION_CHECKLIST.md` komplett abgehakt sein.

### 4. Single Source of Truth
`PROJECT_STATE.md` ist die einzige Wahrheit über den Projekt-Status.

## Regeln

- **Contracts sind Gesetz** - Keine stillen Änderungen
- **1 Step pro Antwort** - Bei AI-Coding
- **Tests für alles** - Keine Funktion ohne Test
- **Evidence required** - Keine Behauptung ohne Beweis
