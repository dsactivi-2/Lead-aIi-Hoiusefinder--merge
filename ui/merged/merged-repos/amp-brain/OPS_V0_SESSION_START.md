# Ops v0 – Session Start Template

**Copy-Paste für jedes neue Claude-Terminal**

---

## Quick-Start (1:1 kopieren)

```
OPS v0 START

1) Wenn MCP/Code/DB geändert wurde:
   /exit
   claude

2) Danach IMMER testen:
   - mcp__cloud-agents-tools__ops_stats
   - mcp__cloud-agents-tools__ops_events (limit=5)
   - mcp__cloud-agents-tools__ops_tasks_history (limit=5)

3) Wenn alle 3 Tools Daten liefern:
   → System gilt als OK
   → UI-Checks optional

Hinweis:
- /clear lädt KEINE neuen MCP-Tools
- Nur ein kompletter Session-Neustart tut das
```

---

## Tool-Aufrufe (einzeln)

### 1. Stats

```
Rufe mcp__cloud-agents-tools__ops_stats auf
```

### 2. Events

```
Rufe mcp__cloud-agents-tools__ops_events mit limit=5 auf
```

### 3. Tasks

```
Rufe mcp__cloud-agents-tools__ops_tasks_history mit limit=5 auf
```

---

## Erwartete Ergebnisse

| Tool              | Muss enthalten                   |
| ----------------- | -------------------------------- |
| ops_stats         | events_total, events_by_kind     |
| ops_events        | Liste mit id, ts, kind, severity |
| ops_tasks_history | Liste mit id, status, created_at |

---

## Bei Fehlern

1. `/exit` ausführen
2. `claude` neu starten
3. Erneut testen
4. Erst dann debuggen
