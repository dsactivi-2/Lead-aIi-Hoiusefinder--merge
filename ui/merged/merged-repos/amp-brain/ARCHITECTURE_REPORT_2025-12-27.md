# Backend & Frontend Architecture Report

## **Generated:** Sa 27 Dez 2025 21:54:53 CET

## Executive Summary

- **Repos scanned:** 27
- **Repos with Backend:** 7
- **Repos with OpenAPI:** 5
- **Repos with Health Endpoint:** 14
- **Repos with DB/ORM:** 2
- **Repos with Port Config:** 12
- **⚠️ High Risk (Hardcoded URLs):** 10

---

## Repo Matrix

| Repo                    | Type           | OpenAPI | Health | DB/ORM           | Ports      | Frontend↔Backend | Risk |
| ----------------------- | -------------- | ------- | ------ | ---------------- | ---------- | ---------------- | ---- |
| ArenaPro-Plus           | UNKNOWN        | ❌      | ✅     | ❌               | 80, 3000   | ENV_VARS         | 🔴   |
| CRM-activi              | UNKNOWN        | ✅      | ✅     | ❌               | 80, 81, 82 | UNKNOWN          | 🔴   |
| Housefinder             | PYTHON_BACKEND | ❌      | ❌     | ❌               | ❌         | UNKNOWN          | 🟡   |
| Kidaapp-claude-test     | UNKNOWN        | ❌      | ❌     | ❌               | ❌         | UNKNOWN          | 🟡   |
| Kids-AI-Shared          | UNKNOWN        | ❌      | ❌     | ❌               | ❌         | UNKNOWN          | 🟡   |
| Kids-AI-Train-Alanko    | UNKNOWN        | ❌      | ❌     | ❌               | ❌         | UNKNOWN          | 🟡   |
| Kids-AI-Train-Lianko    | UNKNOWN        | ❌      | ❌     | ❌               | ❌         | UNKNOWN          | 🟡   |
| Kids-AI-Train-Parent    | UNKNOWN        | ❌      | ❌     | ❌               | ❌         | UNKNOWN          | 🟡   |
| Li-KI-Trainig           | FRONTEND       | ❌      | ❌     | ❌               | ❌         | UNKNOWN          | 🟡   |
| Optimizecodecloudagents | FULLSTACK      | ✅      | ✅     | ❌               | 3000, 6379 | ENV_VARS         | 🔴   |
| \_temp                  | UNKNOWN        | ❌      | ✅     | ❌               | ❌         | UNKNOWN          | 🔴   |
| alan-app                | UNKNOWN        | ❌      | ❌     | ❌               | ❌         | UNKNOWN          | 🟡   |
| alan_demo_app           | UNKNOWN        | ❌      | ❌     | ❌               | ❌         | UNKNOWN          | 🟡   |
| amp-brain               | UNKNOWN        | ❌      | ❌     | ❌               | ❌         | UNKNOWN          | 🟡   |
| claude_SupermanV1       | BACKEND        | ❌      | ✅     | ❌               | 3000       | UNKNOWN          | 🔴   |
| code-cloud-agents       | FULLSTACK      | ✅      | ✅     | ❌               | 3000, 6379 | ENV_VARS         | 🔴   |
| code-cloud-agents-temp  | FRONTEND       | ❌      | ❌     | ❌               | 3000       | UNKNOWN          | 🔴   |
| crm                     | UNKNOWN        | ❌      | ✅     | ❌               | 80, 81, 82 | UNKNOWN          | 🟡   |
| kids-ai-all-in-build    | UNKNOWN        | ❌      | ✅     | ❌               | 3000       | UNKNOWN          | 🟡   |
| kids-ai-all-in-fresh    | UNKNOWN        | ❌      | ✅     | ❌               | 3000       | UNKNOWN          | 🟡   |
| mac_assistand           | UNKNOWN        | ❌      | ❌     | ❌               | ❌         | UNKNOWN          | 🟡   |
| old_crm_updated         | PYTHON_BACKEND | ✅      | ✅     | Flask-SQLAlchemy | 8080       | UNKNOWN          | 🟡   |
| partner                 | FRONTEND       | ❌      | ❌     | ❌               | ❌         | UNKNOWN          | 🔴   |
| research-agent          | UNKNOWN        | ❌      | ✅     | ❌               | ❌         | UNKNOWN          | 🔴   |
| salesops-voice-ai       | PYTHON_BACKEND | ❌      | ✅     | SQLAlchemy       | 8080       | UNKNOWN          | 🟡   |
| super-mac-assistant     | PYTHON_BACKEND | ✅      | ✅     | ❌               | ❌         | UNKNOWN          | 🟡   |
| voice-sales-agent       | UNKNOWN        | ❌      | ✅     | ❌               | 3001, 3000 | UNKNOWN          | 🔴   |

---

## Per-Repo Details

### ArenaPro-Plus

**Type:** UNKNOWN

**OpenAPI/Swagger:**

- ❌ Not found

**Health Endpoints:**

- ✅ Found
- Endpoints: /health
- Files: backend/src/index.ts

**DB/ORM:**

- ❌ Not found

**Ports:**

- ✅ Found
- Ports: 80, 3000
- Evidence: docker-compose.yml: port 80

**Frontend↔Backend:**

- Method: ENV_VARS
- Risk: HIGH
- Evidence: .env: API env vars found
- ⚠️ Hardcoded URLs found: 9

---

### CRM-activi

**Type:** UNKNOWN

**OpenAPI/Swagger:**

- ✅ Found
- Files: api/openapi.yaml

**Health Endpoints:**

- ✅ Found
- Endpoints: /status
- Files: frontend/src/services/api.ts

**DB/ORM:**

- ❌ Not found

**Ports:**

- ✅ Found
- Ports: 80, 81, 82, 83, 3306, 8080, 465, 3000
- Evidence: docker-compose.yml: port 80

**Frontend↔Backend:**

- Method: UNKNOWN
- Risk: HIGH
- Evidence: vite.config.ts: 'http://localhost:8080
- ⚠️ Hardcoded URLs found: 3

---

### Housefinder

**Type:** PYTHON_BACKEND

**OpenAPI/Swagger:**

- ❌ Not found

**Health Endpoints:**

- ❌ Not found

**DB/ORM:**

- ❌ Not found

**Ports:**

- ❌ Not found

**Frontend↔Backend:**

- Method: UNKNOWN
- Risk: MEDIUM

---

### Kidaapp-claude-test

**Type:** UNKNOWN

**OpenAPI/Swagger:**

- ❌ Not found

**Health Endpoints:**

- ❌ Not found

**DB/ORM:**

- ❌ Not found

**Ports:**

- ❌ Not found

**Frontend↔Backend:**

- Method: UNKNOWN
- Risk: MEDIUM

---

### Kids-AI-Shared

**Type:** UNKNOWN

**OpenAPI/Swagger:**

- ❌ Not found

**Health Endpoints:**

- ❌ Not found

**DB/ORM:**

- ❌ Not found

**Ports:**

- ❌ Not found

**Frontend↔Backend:**

- Method: UNKNOWN
- Risk: MEDIUM

---

### Kids-AI-Train-Alanko

**Type:** UNKNOWN

**OpenAPI/Swagger:**

- ❌ Not found

**Health Endpoints:**

- ❌ Not found

**DB/ORM:**

- ❌ Not found

**Ports:**

- ❌ Not found

**Frontend↔Backend:**

- Method: UNKNOWN
- Risk: MEDIUM

---

### Kids-AI-Train-Lianko

**Type:** UNKNOWN

**OpenAPI/Swagger:**

- ❌ Not found

**Health Endpoints:**

- ❌ Not found

**DB/ORM:**

- ❌ Not found

**Ports:**

- ❌ Not found

**Frontend↔Backend:**

- Method: UNKNOWN
- Risk: MEDIUM

---

### Kids-AI-Train-Parent

**Type:** UNKNOWN

**OpenAPI/Swagger:**

- ❌ Not found

**Health Endpoints:**

- ❌ Not found

**DB/ORM:**

- ❌ Not found

**Ports:**

- ❌ Not found

**Frontend↔Backend:**

- Method: UNKNOWN
- Risk: MEDIUM

---

### Li-KI-Trainig

**Type:** FRONTEND

**OpenAPI/Swagger:**

- ❌ Not found

**Health Endpoints:**

- ❌ Not found

**DB/ORM:**

- ❌ Not found

**Ports:**

- ❌ Not found

**Frontend↔Backend:**

- Method: UNKNOWN
- Risk: MEDIUM

---

### Optimizecodecloudagents

**Type:** FULLSTACK

**OpenAPI/Swagger:**

- ✅ Found
- Files: swagger.yaml, src/swagger/index.ts (route)
- Routes: /api-docs

**Health Endpoints:**

- ✅ Found
- Endpoints: /status, /health, /ready
- Files: tests/github-api.test.ts, src/index.ts, src/api/health.ts

**DB/ORM:**

- ❌ Not found

**Ports:**

- ✅ Found
- Ports: 3000, 6379
- Evidence: docker-compose.yml: port 3000

**Frontend↔Backend:**

- Method: ENV_VARS
- Risk: HIGH
- Evidence: .env: API env vars found
- ⚠️ Hardcoded URLs found: 5

---

### \_temp

**Type:** UNKNOWN

**OpenAPI/Swagger:**

- ❌ Not found

**Health Endpoints:**

- ✅ Found
- Endpoints: /health
- Files: agent-system-analyse/packages/chatgpt/server/src/index.ts

**DB/ORM:**

- ❌ Not found

**Ports:**

- ❌ Not found

**Frontend↔Backend:**

- Method: UNKNOWN
- Risk: HIGH
- Evidence: anthropic.ts: "https://api.anthropic.com
- ⚠️ Hardcoded URLs found: 1

---

### alan-app

**Type:** UNKNOWN

**OpenAPI/Swagger:**

- ❌ Not found

**Health Endpoints:**

- ❌ Not found

**DB/ORM:**

- ❌ Not found

**Ports:**

- ❌ Not found

**Frontend↔Backend:**

- Method: UNKNOWN
- Risk: MEDIUM

---

### alan_demo_app

**Type:** UNKNOWN

**OpenAPI/Swagger:**

- ❌ Not found

**Health Endpoints:**

- ❌ Not found

**DB/ORM:**

- ❌ Not found

**Ports:**

- ❌ Not found

**Frontend↔Backend:**

- Method: UNKNOWN
- Risk: MEDIUM

---

### amp-brain

**Type:** UNKNOWN

**OpenAPI/Swagger:**

- ❌ Not found

**Health Endpoints:**

- ❌ Not found

**DB/ORM:**

- ❌ Not found

**Ports:**

- ❌ Not found

**Frontend↔Backend:**

- Method: UNKNOWN
- Risk: MEDIUM

---

### claude_SupermanV1

**Type:** BACKEND

**OpenAPI/Swagger:**

- ❌ Not found

**Health Endpoints:**

- ✅ Found
- Endpoints: /health, /ready
- Files: tests/supervisor.api.test.js, tests/supervisor.api.test.js

**DB/ORM:**

- ❌ Not found

**Ports:**

- ✅ Found
- Ports: 3000
- Evidence: .env: PORT=3000

**Frontend↔Backend:**

- Method: UNKNOWN
- Risk: HIGH
- Evidence: ProviderWrapper.js: 'http://localhost:3000
- ⚠️ Hardcoded URLs found: 4

---

### code-cloud-agents

**Type:** FULLSTACK

**OpenAPI/Swagger:**

- ✅ Found
- Files: swagger.yaml, src/swagger/index.ts (route)
- Routes: /api-docs

**Health Endpoints:**

- ✅ Found
- Endpoints: /status, /health, /ready
- Files: tests/github-api.test.ts, src/index.ts, src/api/health.ts

**DB/ORM:**

- ❌ Not found

**Ports:**

- ✅ Found
- Ports: 3000, 6379
- Evidence: docker-compose.yml: port 3000

**Frontend↔Backend:**

- Method: ENV_VARS
- Risk: HIGH
- Evidence: .env.example: API env vars found
- ⚠️ Hardcoded URLs found: 4

---

### code-cloud-agents-temp

**Type:** FRONTEND

**OpenAPI/Swagger:**

- ❌ Not found

**Health Endpoints:**

- ❌ Not found

**DB/ORM:**

- ❌ Not found

**Ports:**

- ✅ Found
- Ports: 3000
- Evidence: vite.config.ts: port 3000

**Frontend↔Backend:**

- Method: UNKNOWN
- Risk: HIGH
- Evidence: App.tsx: "https://images.unsplash.com
- ⚠️ Hardcoded URLs found: 1

---

### crm

**Type:** UNKNOWN

**OpenAPI/Swagger:**

- ❌ Not found

**Health Endpoints:**

- ✅ Found
- Endpoints: /status
- Files: src/crm/js/crmApi.js

**DB/ORM:**

- ❌ Not found

**Ports:**

- ✅ Found
- Ports: 80, 81, 82, 83, 85, 3306, 8080
- Evidence: docker-compose.yml: port 80

**Frontend↔Backend:**

- Method: UNKNOWN
- Risk: MEDIUM

---

### kids-ai-all-in-build

**Type:** UNKNOWN

**OpenAPI/Swagger:**

- ❌ Not found

**Health Endpoints:**

- ✅ Found
- Endpoints: /health
- Files: apps/callcenter-ai/backend/server.js

**DB/ORM:**

- ❌ Not found

**Ports:**

- ✅ Found
- Ports: 3000
- Evidence: server.js: port 3000

**Frontend↔Backend:**

- Method: UNKNOWN
- Risk: MEDIUM

---

### kids-ai-all-in-fresh

**Type:** UNKNOWN

**OpenAPI/Swagger:**

- ❌ Not found

**Health Endpoints:**

- ✅ Found
- Endpoints: /health
- Files: apps/callcenter-ai/backend/server.js

**DB/ORM:**

- ❌ Not found

**Ports:**

- ✅ Found
- Ports: 3000
- Evidence: server.js: port 3000

**Frontend↔Backend:**

- Method: UNKNOWN
- Risk: MEDIUM

---

### mac_assistand

**Type:** UNKNOWN

**OpenAPI/Swagger:**

- ❌ Not found

**Health Endpoints:**

- ❌ Not found

**DB/ORM:**

- ❌ Not found

**Ports:**

- ❌ Not found

**Frontend↔Backend:**

- Method: UNKNOWN
- Risk: MEDIUM

---

### old_crm_updated

**Type:** PYTHON_BACKEND

**OpenAPI/Swagger:**

- ✅ Found
- Files:

**Health Endpoints:**

- ✅ Found
- Endpoints: /health, /version, /status
- Files: standalone_voice_ai/api_client.py, mac_assistant/venv/lib/python3.14/site-packages/setuptools/\_normalization.py, mac_assistant/venv/lib/python3.14/site-packages/pip/\_vendor/urllib3/util/retry.py

**DB/ORM:**

- ✅ Found
- ORM: Flask-SQLAlchemy
- Migrations: No

**Ports:**

- ✅ Found
- Ports: 8080
- Evidence: examples.py: port 8080

**Frontend↔Backend:**

- Method: UNKNOWN
- Risk: MEDIUM

---

### partner

**Type:** FRONTEND

**OpenAPI/Swagger:**

- ❌ Not found

**Health Endpoints:**

- ❌ Not found

**DB/ORM:**

- ❌ Not found

**Ports:**

- ❌ Not found

**Frontend↔Backend:**

- Method: UNKNOWN
- Risk: HIGH
- Evidence: http-client.ts: 'https://staging.api.pa.job-step.com
- ⚠️ Hardcoded URLs found: 5

---

### research-agent

**Type:** UNKNOWN

**OpenAPI/Swagger:**

- ❌ Not found

**Health Endpoints:**

- ✅ Found
- Endpoints: /health
- Files: .cursor/agents/code-agent.ts

**DB/ORM:**

- ❌ Not found

**Ports:**

- ❌ Not found

**Frontend↔Backend:**

- Method: UNKNOWN
- Risk: HIGH
- Evidence: code-agent.ts: 'https://api.newai.com
- ⚠️ Hardcoded URLs found: 1

---

### salesops-voice-ai

**Type:** PYTHON_BACKEND

**OpenAPI/Swagger:**

- ❌ Not found

**Health Endpoints:**

- ✅ Found
- Endpoints: /health
- Files: app/routers/health.py

**DB/ORM:**

- ✅ Found
- ORM: SQLAlchemy
- DB Type: PostgreSQL
- Migrations: No

**Ports:**

- ✅ Found
- Ports: 8080
- Evidence: .env.example: PORT=8080

**Frontend↔Backend:**

- Method: UNKNOWN
- Risk: MEDIUM

---

### super-mac-assistant

**Type:** PYTHON_BACKEND

**OpenAPI/Swagger:**

- ✅ Found
- Files:

**Health Endpoints:**

- ✅ Found
- Endpoints: /health, /version, /status
- Files: executor/executor.py, venv/lib/python3.14/site-packages/pydantic/version.py, venv/lib/python3.14/site-packages/urllib3/util/retry.py

**DB/ORM:**

- ❌ Not found

**Ports:**

- ❌ Not found

**Frontend↔Backend:**

- Method: UNKNOWN
- Risk: MEDIUM

---

### voice-sales-agent

**Type:** UNKNOWN

**OpenAPI/Swagger:**

- ❌ Not found

**Health Endpoints:**

- ✅ Found
- Endpoints: /health, /status
- Files: backend/src/app.js, backend/src/webhooks/twilio.js

**DB/ORM:**

- ❌ Not found

**Ports:**

- ✅ Found
- Ports: 3001, 3000
- Evidence: ecosystem.config.js: port 3001

**Frontend↔Backend:**

- Method: UNKNOWN
- Risk: HIGH
- Evidence: vite.config.js: 'http://localhost:3001
- ⚠️ Hardcoded URLs found: 4

---
