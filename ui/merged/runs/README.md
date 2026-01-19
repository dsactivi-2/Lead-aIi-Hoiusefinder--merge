# Agent Run Reports

This directory stores run reports from all CLI agents (Claude, Codex, etc.).

## Structure

```
runs/
├── YYYY-MM-DD/
│   ├── claude-cli-1/
│   │   ├── <run_id>.md      # Human-readable report
│   │   └── <run_id>.json    # Machine-readable report
│   ├── claude-cli-2/
│   ├── codex-cli-1/
│   └── ...
```

## Run ID Format

`<agent>-YYYYMMDD-HHMMSS-<random>`

Example: `claude-cli-1-20250114-153045-a7b3c`

## Required Fields (see schemas/RUN_REPORT_SCHEMA.json)

- `run_id` - Unique identifier
- `agent` - Agent name
- `timestamp` - ISO 8601 completion time
- `summary` - Brief description of work done
- `decisions[]` - Decisions made (with rationale)
- `open_questions[]` - Questions needing follow-up
- `risks[]` - Identified risks
- `changes[]` - Files modified
- `next_actions[]` - Recommended follow-ups
- `refs[]` - References (commits, URLs, etc.)
- `redactions_done` - Must be `true` (confirms no secrets)

## Post-Run Processing

After creating a run report, execute:

```bash
./scripts/post_run.sh --agent <agent_name> --json <path_to_report.json>
```

This will:
1. Validate JSON against schema
2. Scan for secrets
3. Append open questions to `ops/OPEN_QUESTIONS.md`
4. Send memory events to Master-Brain (if `BRAIN_URL` configured)

## Example Report

```json
{
  "run_id": "claude-cli-1-20250114-153045-a7b3c",
  "agent": "claude-cli-1",
  "timestamp": "2025-01-14T15:30:45Z",
  "summary": "Implemented user authentication flow",
  "decisions": [
    {
      "decision": "Use JWT for session management",
      "rationale": "Stateless, works with microservices"
    }
  ],
  "open_questions": [],
  "risks": [],
  "changes": [
    {"path": "src/auth/jwt.ts", "action": "created"}
  ],
  "next_actions": [
    {"action": "Add refresh token logic", "assignee": "codex-cli-1"}
  ],
  "refs": [
    {"type": "commit", "value": "abc123"}
  ],
  "redactions_done": true
}
```
