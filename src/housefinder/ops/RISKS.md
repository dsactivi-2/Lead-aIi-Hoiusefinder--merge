# RISKS

> Identifizierte Risiken und Mitigations-Strategien.

## Risiko-Matrix

| Severity | Impact | Beispiel |
|----------|--------|----------|
| **CRITICAL** | Projekt-Stopp | Security Breach, Datenverlust |
| **HIGH** | Major Blocker | Core Feature kaputt |
| **MEDIUM** | Delay | Performance-Problem |
| **LOW** | Minimal | UI-Bug |

---

## Aktive Risiken

### [R-001] Datenbankausfall

**Severity:** HIGH
**Status:** mitigated

**Beschreibung:**
PostgreSQL Instanz könnte ausfallen.

**Mitigation:**
- Health Check prüft DB Connection
- Connection Pool mit Retry
- Backup-Strategie (tägliche Snapshots)

**Verantwortlich:** DevOps

---

### [R-002] Rate Limit Bypass

**Severity:** MEDIUM
**Status:** mitigated

**Beschreibung:**
Angreifer könnte Rate Limiting umgehen (IP Rotation).

**Mitigation:**
- Rate Limit auch auf Token-Basis
- WAF bei kritischen Endpoints
- Monitoring für ungewöhnliche Patterns

**Verantwortlich:** Security

---

### [R-003] Secret Leak

**Severity:** CRITICAL
**Status:** monitored

**Beschreibung:**
API Keys oder Passwörter könnten ins Repo gelangen.

**Mitigation:**
- .gitignore für .env
- Pre-commit Hook prüft auf Secrets
- GitHub Secret Scanning aktiv

**Verantwortlich:** Alle

---

## Template

```markdown
### [R-XXX] Titel

**Severity:** CRITICAL / HIGH / MEDIUM / LOW
**Status:** identified / mitigated / accepted / closed

**Beschreibung:**
Was ist das Risiko?

**Mitigation:**
- Maßnahme 1
- Maßnahme 2

**Verantwortlich:** [Team/Person]
```
