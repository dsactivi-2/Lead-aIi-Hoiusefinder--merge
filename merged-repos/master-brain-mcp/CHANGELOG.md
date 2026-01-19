# Changelog

> Alle wichtigen Änderungen werden hier dokumentiert.
> Format basiert auf [Keep a Changelog](https://keepachangelog.com/).

---

## [Unreleased]

### Added
- Initiales Template erstellt

### Changed
- (keine)

### Fixed
- (keine)

### Removed
- (keine)

---

## [1.0.0] - YYYY-MM-DD

### Added
- MASTER_RUNBOOK.md mit Step 0-10
- PROJECT_STATE.md als Single Source of Truth
- PRODUCTION_CHECKLIST.md mit allen Pflicht-Checks
- CONTRACTS/ für API und DB Contracts
- capabilities.yml mit Test-Regeln
- PROMPTS/ für 3-Stufen Workflow
- CI/CD Workflows (ci.yml, quality-gate.yml)
- Merge/Push Rules in ops/POLICY.md

---

## Format

```markdown
## [Version] - YYYY-MM-DD

### Added
- Neue Features

### Changed
- Änderungen an bestehenden Features

### Deprecated
- Features die bald entfernt werden

### Removed
- Entfernte Features

### Fixed
- Bugfixes

### Security
- Sicherheitsrelevante Änderungen
```

---

## Versioning

Wir verwenden [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking Changes
- **MINOR**: Neue Features (rückwärtskompatibel)
- **PATCH**: Bugfixes (rückwärtskompatibel)
