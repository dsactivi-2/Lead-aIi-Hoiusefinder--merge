# Integrations

> Verweis auf zentrale Registries für MCP Server und geteilte Tools.

---

## Zentrale Registries

| Registry | URL | Beschreibung |
|----------|-----|--------------|
| **MCP Server** | `github.com/[org]/mcp-registry` | Alle verfügbaren MCP Server |
| **Shared Tools** | `github.com/[org]/shared-tools` | Wiederverwendbare Tools/Scripts |
| **API Clients** | `github.com/[org]/api-clients` | Generierte API Clients |

> **Hinweis:** `[org]` durch deine GitHub Organisation ersetzen.

---

## MCP Server Registry

Die zentrale MCP Registry enthält:

```
mcp-registry/
├── README.md                    # Übersicht aller MCP Server
├── servers/
│   ├── cloud-agents-tools/      # Cloud Agents MCP
│   ├── lead-builder-tools/      # Lead Builder MCP
│   ├── brain-memory/            # Brain Memory MCP
│   └── [your-mcp]/              # Neue MCP Server hier
└── docs/
    ├── SETUP.md                 # Installation
    └── DEVELOPMENT.md           # Eigene MCP Server entwickeln
```

---

## MCP Server in diesem Projekt verwenden

### 1. In Claude Desktop / Claude Code

```json
// ~/.config/claude/claude_desktop_config.json
{
  "mcpServers": {
    "your-mcp": {
      "command": "node",
      "args": ["/path/to/mcp-registry/servers/your-mcp/index.js"]
    }
  }
}
```

### 2. Als npm Package

```bash
npm install @org/mcp-your-server
```

### 3. Als Docker Container

```bash
docker run -p 3000:3000 org/mcp-your-server
```

---

## Projekt-spezifische Integrationen

Falls dieses Projekt eigene Integrationen hat, hier dokumentieren:

| Integration | Typ | Beschreibung | Docs |
|-------------|-----|--------------|------|
| - | - | - | - |

---

## Neue Integration hinzufügen

1. Prüfe ob sie in der zentralen Registry existiert
2. Falls ja → Hier verlinken, nicht kopieren
3. Falls nein → In zentraler Registry erstellen, dann hier verlinken

**Regel:** Keine Duplikate! Eine Integration = Ein Ort.
