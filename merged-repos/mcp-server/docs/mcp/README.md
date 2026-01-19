# Cloud Agents MCP Server

> **Version:** 0.1.0
> **Last Updated:** 2024-12-31

## Quick Start

### Installation

```bash
# Add to Claude Code
claude mcp add cloud-agents-tools -- npx tsx /path/to/mcp-server/src/server.ts

# Verify
claude mcp list
```

### Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `BACKEND_BASE` | `http://178.156.178.70:3001` | Backend API URL |
| `SSH_KEY` | `~/.ssh/id_ed25519_cloudagents` | SSH Key |
| `SSH_HOST` | `root@178.156.178.70` | SSH Host |

---

## Tool Categories

### Brain (Knowledge Base)

| Tool | Description | Docs |
|------|-------------|------|
| `brain_ingest_text` | Text zur Knowledge Base hinzufügen | [brain.md](./brain.md) |
| `brain_search` | Knowledge Base durchsuchen | [brain.md](./brain.md) |
| `brain_stats` | Statistiken abrufen | [brain.md](./brain.md) |

### Chat

| Tool | Description |
|------|-------------|
| `chat_send` | Nachricht an Agent senden |

### Agents & Tasks

| Tool | Description |
|------|-------------|
| `agents_status` | Status aller Agents |
| `tasks_list` | Tasks auflisten (mit State-Filter) |

### Server Operations (via SSH)

| Tool | Description |
|------|-------------|
| `pm2_status` | PM2 Prozesse anzeigen |
| `pm2_logs` | PM2 Logs abrufen |
| `server_stats` | Server-Ressourcen (Disk, Memory, CPU) |
| `deploy_trigger` | Deployment triggern |
| `db_query` | SQL Query (nur SELECT) |

### Health

| Tool | Description |
|------|-------------|
| `health_check` | Backend Health prüfen |

---

## Standard Auth Pattern (Phase 2)

**JWT-Only Authentication** - userId wird aus dem Token extrahiert:

```typescript
{
  token: string,    // JWT Access Token (required) - enthält userId
  baseUrl?: string  // Optional URL override
}
```

> **Breaking Change:** Der `userId` Parameter wurde entfernt. userId wird aus dem JWT extrahiert.

### Token Generieren

```bash
# Node.js - Token enthält userId, role, email + issuer/audience
node -e "const jwt = require('jsonwebtoken'); console.log(jwt.sign({userId: 'admin-001', role: 'admin', email: 'admin@cloudagents.io'}, 'dev-secret-change-in-production', {expiresIn: '1h', issuer: 'code-cloud-agents', audience: 'cloud-agents-api'}))"
```

> **Wichtig:** `issuer: 'code-cloud-agents'` und `audience: 'cloud-agents-api'` sind erforderlich!

---

## Usage Examples

### Brain Search

```
Use tool brain_search with:
- token: <JWT>
- query: deployment
```

### PM2 Logs

```
Use tool pm2_logs with:
- process: cloud-agents-backend
- lines: 100
```

### Deploy

```
Use tool deploy_trigger with:
- project: cloud-agents
- restart: true
```
