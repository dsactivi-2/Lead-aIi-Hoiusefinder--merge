# PROJECT_BRIEF: Master_Brain

> Zentrale Wissensdatenbank und Policy-Enforcement für die Activi-AI Organisation.

## 1. Projekt-Übersicht

| Feld | Wert |
|------|------|
| **Name** | Master_Brain |
| **Owner** | Denis Selmanovic |
| **Status** | active |
| **Criticality** | CRITICAL |

## 2. Zweck

Master_Brain ist das zentrale Repository der Activi-AI Organisation. Es enthält:
- Organisationsweite Policies und Templates
- CI/CD Enforcement Scripts
- Dokumentation und Standards
- Capability-Definitionen und Test-Anforderungen

## 3. Architektur

### Struktur
```
Master_Brain/
├── ops/
│   ├── policy/          # Organisationsweite Policies
│   └── templates/       # Templates für neue Repos
├── scripts/
│   └── ci/              # CI Enforcement Scripts
├── docs/                # Dokumentation
└── .github/
    └── workflows/       # GitHub Actions
```

### Tech Stack
- **Scripts:** Python 3.x
- **CI:** GitHub Actions
- **Format:** Markdown, YAML

## 4. Capabilities

Siehe: `capabilities.yml`

## 5. Endpoints

| Endpoint | Method | Beschreibung |
|----------|--------|--------------|
| N/A | N/A | Kein Runtime-Service |

## 6. Abhängigkeiten

### Interne Abhängigkeiten
- Keine (ist das Root-Repo)

### Externe Abhängigkeiten
- GitHub Actions
- Python 3.x (für CI Scripts)

## 7. Deployment

| Env | URL | Branch |
|-----|-----|--------|
| N/A | N/A | `main` |

Master_Brain ist kein deployable Service. Änderungen werden via PR nach `main` gemerged.

## 8. Kontakt

- **Owner:** Denis Selmanovic
- **Email:** denis@activi.io
