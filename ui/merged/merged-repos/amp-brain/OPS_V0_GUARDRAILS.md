# Ops v0 – Production Guardrail Checkliste

**Vor und nach jeder Änderung durchgehen**

---

## VOR Änderung

| Check                            | Status |
| -------------------------------- | ------ |
| Klar definiert: Was ändert sich? | ☐      |
| MCP Server Pfad bekannt          | ☐      |
| DB Ziel klar (SQLite)            | ☐      |

---

## NACH Änderung (PFLICHT)

### A) Session

| Check                  | Status |
| ---------------------- | ------ |
| `/exit` ausgeführt     | ☐      |
| `claude` neu gestartet | ☐      |

### B) MCP

| Check                                | Status |
| ------------------------------------ | ------ |
| `claude mcp list` → Server connected | ☐      |

### C) Ops-Tools

| Tool                          | Ergebnis                             | Status |
| ----------------------------- | ------------------------------------ | ------ |
| `ops_stats`                   | Daten geliefert                      | ☐      |
| `ops_events` (limit=5)        | Events geliefert                     | ☐      |
| `ops_tasks_history` (limit=5) | Tasks oder leere Liste (kein Fehler) | ☐      |

### D) UI (optional)

| Check                   | Status |
| ----------------------- | ------ |
| `/admin/mcp` erreichbar | ☐      |
| `/admin/ops` erreichbar | ☐      |
| LIVE Badge reagiert     | ☐      |
| Polling steuerbar       | ☐      |

---

## 🚨 Wenn etwas fehlschlägt

> **NICHT weitermachen.**

### Reihenfolge:

1. Session neu starten
2. Ops-Tools erneut testen
3. Erst danach debuggen

---

## Schnell-Referenz: MCP Tools

```
# Alle 17 verfügbaren Tools:

1.  health_check
2.  chat_send
3.  agents_status
4.  tasks_list
5.  pm2_status
6.  pm2_logs
7.  server_stats
8.  deploy_trigger
9.  db_query
10. brain_ingest_text
11. brain_search
12. brain_stats
13. audit_events_list
14. audit_events_stats
15. ops_events        ← NEU
16. ops_tasks_history ← NEU
17. ops_stats         ← NEU
```

---

## Server-Verbindung

```
Server: 178.156.178.70
DB: /root/cloud-agents/data/app.sqlite
MCP: SSH → SQLite Queries
```

---

## Letzte Verifizierung

**Datum:** 2026-01-01
**Status:** ✅ Alle 3 Ops-Tools produktiv
