# MCP Brain Tools Specification

> **Version:** 2.0.0
> **Last Updated:** 2024-12-31
> **Server:** cloud-agents-mcp v0.1.0

## Overview

Die Brain Tools ermöglichen Claude und anderen Agents den Zugriff auf die Knowledge Base (Wissensdatenbank) des Cloud-Agents Systems. Sie bieten semantische Suche, Text-Ingestion und Statistiken.

## Authentication (Phase 2)

**JWT-Only Authentication** - userId wird aus dem JWT Token extrahiert.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `token` | string | **Yes** | JWT Access Token. userId und role werden automatisch aus dem Token extrahiert |
| `baseUrl` | string | No | Override der Backend URL. Default: `http://178.156.178.70:3001` |

> **Breaking Change v2.0:** Der `userId` Parameter wurde entfernt. userId wird jetzt aus dem JWT extrahiert.

### Token Generierung

```typescript
import jwt from 'jsonwebtoken';

const token = jwt.sign(
  { userId: 'admin-001', role: 'admin', email: 'admin@cloudagents.io' },
  process.env.JWT_SECRET || 'dev-secret-change-in-production',
  {
    expiresIn: '1h',
    issuer: 'code-cloud-agents',      // Required!
    audience: 'cloud-agents-api'      // Required!
  }
);
```

> **Wichtig:** `issuer` und `audience` Claims sind erforderlich für die Token-Validierung.

Das Token enthält:
- `userId` - User ID (wird für Brain-Operationen verwendet)
- `role` - User Role (`admin`, `user`, `demo`)
- `email` - Optional

---

## Tools

### 1. `brain_ingest_text`

Fügt Text-Dokumente zur Knowledge Base hinzu.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `token` | string | **Yes** | JWT Access Token (userId wird extrahiert) |
| `title` | string | **Yes** | Dokumenttitel |
| `content` | string | **Yes** | Text-Inhalt zum Ingesten |
| `tags` | string[] | No | Tags zur Kategorisierung |
| `baseUrl` | string | No | Backend URL Override |

#### Example

```json
{
  "token": "<JWT>",
  "title": "Deployment Guide",
  "content": "This document describes the deployment process...",
  "tags": ["deployment", "devops", "production"]
}
```

#### Response

```json
{
  "base": "http://178.156.178.70:3001",
  "ok": true,
  "status": 200,
  "data": {
    "success": true,
    "docId": "uuid-here",
    "chunksCreated": 1
  }
}
```

---

### 2. `brain_search`

Durchsucht die Knowledge Base mit semantischer, keyword-basierter oder hybrider Suche.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `token` | string | **Yes** | JWT Access Token (userId wird extrahiert) |
| `query` | string | **Yes** | Suchanfrage |
| `mode` | enum | No | Suchmodus: `semantic`, `keyword`, `hybrid` (Default: `hybrid`) |
| `limit` | number | No | Max. Ergebnisse (Default: 10) |
| `baseUrl` | string | No | Backend URL Override |

#### Search Modes

| Mode | Description | Best For |
|------|-------------|----------|
| `semantic` | Vektorbasierte Ähnlichkeitssuche | Konzeptuelle Fragen, "Was ist X?" |
| `keyword` | Exakte Textübereinstimmung | Spezifische Begriffe, Code-Snippets |
| `hybrid` | Kombination aus beiden | Allgemeine Suche (empfohlen) |

#### Example

```json
{
  "token": "<JWT>",
  "query": "MCP deployment",
  "mode": "hybrid",
  "limit": 5
}
```

#### Response

```json
{
  "base": "http://178.156.178.70:3001",
  "ok": true,
  "status": 200,
  "data": {
    "success": true,
    "results": [
      {
        "docId": "uuid",
        "chunkId": "uuid",
        "content": "Document content...",
        "similarity": 0.85,
        "docTitle": "Document Title",
        "sourceType": "text",
        "chunkIndex": 0
      }
    ],
    "count": 1,
    "mode": "hybrid"
  }
}
```

---

### 3. `brain_stats`

Liefert Statistiken über die Knowledge Base.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `token` | string | **Yes** | JWT Access Token (userId wird extrahiert) |
| `baseUrl` | string | No | Backend URL Override |

#### Example

```json
{
  "token": "<JWT>"
}
```

#### Response

```json
{
  "base": "http://178.156.178.70:3001",
  "ok": true,
  "status": 200,
  "data": {
    "success": true,
    "enabled": true,
    "stats": {
      "totalDocs": 10,
      "totalChunks": 25,
      "bySourceType": { "text": 8, "url": 2 },
      "byStatus": { "ready": 25 },
      "totalEmbeddings": 25,
      "embeddingCoverage": 100
    }
  }
}
```

---

## Usage in Claude Code

### Via MCP Tool Call

```
Use tool brain_search with:
- token: <JWT>
- query: deployment process
```

### Via Direct API

```bash
TOKEN="<your-jwt-token>"
curl -s \
  -H "Authorization: Bearer $TOKEN" \
  "http://178.156.178.70:3001/api/brain/search?q=deployment"
```

---

## Error Handling

| Status | Error | Solution |
|--------|-------|----------|
| 401 | Unauthorized | Token fehlt, abgelaufen oder ungültig |
| 403 | Forbidden | User hat keine Berechtigung für diese Aktion |
| 404 | Not Found | Endpoint existiert nicht - baseUrl prüfen |
| 500 | Server Error | Backend-Problem - Logs prüfen mit `pm2_logs` |

---

## Migration von v1.x

### Breaking Changes

1. **userId Parameter entfernt** - Nicht mehr als separaten Parameter übergeben
2. **x-user-id Header entfernt** - Nicht mehr benötigt

### Vorher (v1.x)

```json
{
  "token": "<JWT>",
  "userId": "admin-001",
  "query": "search term"
}
```

### Nachher (v2.0)

```json
{
  "token": "<JWT>",
  "query": "search term"
}
```

Der userId wird automatisch aus dem JWT Token extrahiert.

---

## Environment Variables

Der MCP Server verwendet folgende Environment Variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `BACKEND_BASE` | `http://178.156.178.70:3001` | Backend API Base URL |
| `SSH_KEY` | `~/.ssh/id_ed25519_cloudagents` | SSH Key für Server-Operationen |
| `SSH_HOST` | `root@178.156.178.70` | SSH Host für Server-Operationen |

---

## Related Tools

Diese Tools sind Teil des `cloud-agents-mcp` Servers:

| Category | Tools |
|----------|-------|
| **Brain** | `brain_ingest_text`, `brain_search`, `brain_stats` |
| **Chat** | `chat_send` |
| **Agents** | `agents_status` |
| **Tasks** | `tasks_list` |
| **Server Ops** | `pm2_status`, `pm2_logs`, `server_stats`, `deploy_trigger`, `db_query` |
| **Health** | `health_check` |
