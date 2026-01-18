# call-agents-platform

Bootstrap repo for supervisor ops, agent flows, evals, and memory.

## Structure
- ops/      project, tasks, policies, decisions, risks
- agents/   flows and playbooks per agent
- schemas/  JSON schemas for structured outputs
- eval/     scorecards and regression tests
- memory/   long-term memory seed (no secrets)

## Start
- Review ops/POLICY.md
- Update agents/*/flow.yaml and playbook.md
- Run evals when changing flows
