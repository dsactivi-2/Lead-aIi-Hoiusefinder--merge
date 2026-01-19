# Agents

> AI Agent Definitionen für dieses Projekt.

---

## Struktur pro Agent

```
agents/
└── {agent_name}/
    ├── flow.yaml       # Agent-Flow Definition
    ├── playbook.md     # Detaillierte Anweisungen
    └── prompts/        # Agent-spezifische Prompts (optional)
        └── *.md
```

---

## flow.yaml Format

```yaml
name: agent_name
version: 1.0.0
description: "Was macht dieser Agent"

triggers:
  - type: schedule
    cron: "0 9 * * *"
  - type: webhook
    path: /agents/agent_name/trigger

steps:
  - id: step_1
    action: fetch_data
    config:
      source: "api/endpoint"

  - id: step_2
    action: process
    config:
      prompt: "prompts/process.md"

  - id: step_3
    action: output
    config:
      destination: "api/results"

error_handling:
  on_failure: notify
  retry_count: 3
```

---

## playbook.md Format

```markdown
# Agent: {name}

## Zweck
Was macht dieser Agent?

## Trigger
- Wann wird er ausgelöst?

## Inputs
- Was braucht er?

## Outputs
- Was produziert er?

## Schritte
1. ...
2. ...
3. ...

## Error Handling
- Was passiert bei Fehlern?

## Beispiel
...
```

---

## Beispiel-Agent hinzufügen

```bash
mkdir -p agents/my_agent/prompts
touch agents/my_agent/flow.yaml
touch agents/my_agent/playbook.md
```
