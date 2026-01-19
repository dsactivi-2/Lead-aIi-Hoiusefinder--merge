# DECISIONS

> Architektur- und Technologie-Entscheidungen (ADR - Architecture Decision Records).

---

## Format für neue Entscheidungen

```markdown
### [D-XXX] Titel

**Datum:** YYYY-MM-DD
**Status:** proposed / accepted / deprecated / superseded
**Entscheider:** [Name]
**Superseded by:** [D-XXX] (falls deprecated)

#### Kontext
Was ist die Situation? Warum muss entschieden werden?

#### Optionen

**Option A: [Name]**
- Pro: ...
- Con: ...

**Option B: [Name]**
- Pro: ...
- Con: ...

#### Entscheidung
Was wurde entschieden und warum?

#### Konsequenzen
- Positiv: ...
- Negativ: ...
- Neutral: ...

#### Referenzen
- [Link 1]
```

---

## Entscheidungen

### [D-001] PostgreSQL als Datenbank

**Datum:** YYYY-MM-DD
**Status:** accepted
**Entscheider:** ...

#### Kontext
Benötigen eine relationale Datenbank mit guter Performance und ACID-Compliance.

#### Entscheidung
PostgreSQL als primäre Datenbank.

#### Alternativen
- SQLite: Zu limitiert für Production
- MongoDB: Keine Relationen nötig

#### Konsequenzen
- Connection Pool Management nötig
- Migrations-System benötigt
- Backups konfigurieren

---

### [D-002] Express.js als Backend Framework

**Datum:** YYYY-MM-DD
**Status:** accepted
**Entscheider:** ...

#### Kontext
Benötigen ein bewährtes, gut dokumentiertes Backend Framework.

#### Entscheidung
Express.js mit TypeScript.

#### Alternativen
- Fastify: Schneller, aber weniger Ecosystem
- Hono: Zu neu

#### Konsequenzen
- Middleware-Stack konfigurieren
- Error Handler implementieren

---

<!-- Weitere Entscheidungen hier -->
