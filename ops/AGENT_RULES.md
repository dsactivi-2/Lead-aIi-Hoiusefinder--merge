# Agent Rules (Wrapper)

## Priority / Source of Truth
If anything in this file conflicts with repo rules, repo rules win.

Order of authority:
1) PROJECT_STATE.md (if exists)
2) ops/POLICY.md
3) docs/CI_CD_FORT_KNOX_POLICY.md
4) ops/RUNBOOK_SUPERVISOR.md + capabilities.yml
5) this file (ops/AGENT_RULES.md)

## Read-first (mandatory)
Before doing anything, read:
- ops/POLICY.md
- docs/CI_CD_FORT_KNOX_POLICY.md
- docs/PROJECT_BRIEF.md
- docs/TEST_PLAN.md
- ops/RUNBOOK_SUPERVISOR.md
- capabilities.yml
- ops/policy/HTTP_MCP_ADDENDUM.md

## Work style
- Work goal-oriented: make the system runnable (build/test/docs/env/scripts), not just code.
- Do 1 step per cycle: implement one small step, then report evidence (diff + command output).

## When uncertain
A) CRITICAL -> STOP and ask (no guessing):
- production deploy
- DB migrations / deleting data
- secrets/access changes
- changes to capabilities.yml or core architecture decisions
- any action affecting `main` or `stage` branches directly

B) NON-CRITICAL and reversible -> ask + continue:
- proceed with a clearly stated default assumption
- write the question into: ops/OPEN_QUESTIONS.md as [Q-xxx]
- mark TODO(Q-xxx) in code/docs

## Questions format
- Max 5 questions per block
- Each question includes: context, decision needed, options A/B/C, recommendation, default

## Repo-specific rules (from CI_CD_FORT_KNOX_POLICY.md)
- `main` and `stage` are PR-only (no direct push, no force-push)
- `main` needs 2 reviews + CODEOWNERS
- `stage` needs 1 review
- Merge/Deploy only if all CI checks are green
- Prod deploy approval: Denis Selmanovic only
- No secrets in repo (ops/POLICY.md)
- Evidence required for claims (ops/POLICY.md)
