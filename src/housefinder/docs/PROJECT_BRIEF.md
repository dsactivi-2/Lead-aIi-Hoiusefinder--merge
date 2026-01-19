# PROJECT_BRIEF: [Projektname]

> Kurze Beschreibung des Projekts in einem Satz.

## 1. Projekt-Übersicht

| Feld | Wert |
|------|------|
| **Name** | [Projektname] |
| **Owner** | [Name] |
| **Status** | planning / active / maintenance |
| **Criticality** | LOW / MEDIUM / HIGH / CRITICAL |
| **Start** | YYYY-MM-DD |
| **MVP Target** | YYYY-MM-DD |

## 2. Zweck

Was macht dieses Projekt? Welches Problem löst es?

- ...
- ...

## 3. Architektur

### Komponenten
```
[Projektname]/
├── apps/
│   ├── api/          # Backend API
│   └── web/          # Frontend (falls vorhanden)
├── packages/
│   └── shared/       # Shared Code
└── infra/            # Docker, Terraform, etc.
```

### Tech Stack
| Komponente | Technologie |
|------------|-------------|
| **Backend** | Node.js / Python / Go |
| **Frontend** | Next.js / React / None |
| **Database** | PostgreSQL / SQLite |
| **Hosting** | Vercel / Render / Docker |

### Architektur-Diagramm
```
User → UI → API → Database
              ↓
          [Integrations]
```

## 4. Capabilities

Siehe: `capabilities.yml`

## 5. Endpoints

| Endpoint | Method | Beschreibung | Auth |
|----------|--------|--------------|------|
| /health | GET | Health Check | Nein |
| /api-docs | GET | API Dokumentation | Nein |
| ... | ... | ... | ... |

Vollständige API-Dokumentation: `CONTRACTS/api_contract.md`

## 6. Abhängigkeiten

### Interne Abhängigkeiten
- ...

### Externe Abhängigkeiten
- PostgreSQL
- Redis (falls verwendet)
- ...

### Integrationen
- ...

## 7. Deployment

| Environment | URL | Branch |
|-------------|-----|--------|
| Development | localhost:8080 | feature/* |
| Staging | staging.example.com | develop |
| Production | example.com | main |

## 8. Kontakt

| Rolle | Name | Email |
|-------|------|-------|
| **Owner** | ... | ... |
| **Dev** | ... | ... |
