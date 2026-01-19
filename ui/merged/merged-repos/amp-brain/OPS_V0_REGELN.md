# Ops v0 – Verbindliche Betriebsregeln

**Status:** Produktiv
**Gültig ab:** 2026-01-01

---

## Zweck

Sicherstellen, dass Ops Dashboard, MCP Tools und Live-Monitoring nach Änderungen zuverlässig funktionieren.

---

## 🔴 Grundregel

> Bei JEDER Änderung an Code, MCP-Tools, DB oder Server gilt:
> **Session neu starten + 3 Ops-Tools testen.**

---

## 1. Session-Handling (kritisch)

- ❌ `/clear` reicht **NICHT**
- ✅ Immer komplette Session beenden:

```bash
/exit
```

Danach neu starten:

```bash
claude
```

---

## 2. Pflicht-Smoke-Test (immer gleich)

Nach jedem Neustart **alle 3 Tools** ausführen:

1. `mcp__cloud-agents-tools__ops_stats`
2. `mcp__cloud-agents-tools__ops_events` (limit=5)
3. `mcp__cloud-agents-tools__ops_tasks_history` (limit=5)

### Erwartung

| Kriterium             | Check |
| --------------------- | ----- |
| JSON kommt zurück     | ✅    |
| Zeitstempel plausibel | ✅    |
| Datenquelle: SQLite   | ✅    |
| Kein Fehler           | ✅    |

→ **System OK**

---

## 3. UI-Kurzcheck (optional, aber empfohlen)

URLs:

- `/admin/mcp`
- `/admin/ops`

### Checks:

- [ ] Seite lädt
- [ ] Activity sichtbar
- [ ] LIVE Badge reagiert auf neue Events
- [ ] Polling Pause/Resume funktioniert

---

## 4. Definition „System OK"

> Wenn die 3 Ops-Tools funktionieren, gilt das System als **gesund**.
> UI ist sekundär – **Daten sind die Wahrheit**.

---

## 5. No-Go's

| ❌ Verboten                    |
| ------------------------------ |
| Keine Änderungen ohne Neustart |
| Kein Deploy ohne Ops-Tool-Test |
| Kein Vertrauen auf UI allein   |

---

## Verifiziert am 2026-01-01

| Tool                | Status | Ergebnis                         |
| ------------------- | ------ | -------------------------------- |
| `ops_stats`         | ✅     | 18 Events, 2 Users, 3 Brain Docs |
| `ops_events`        | ✅     | 5 Events mit Timestamps          |
| `ops_tasks_history` | ✅     | 1 Task persistent                |
