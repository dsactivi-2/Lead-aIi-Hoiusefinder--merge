# CI/CD Fort-Knox Policy

Diese Datei ist die kurze, verbindliche Referenz fuer Branch-Schutz, Tests, Deploy und Rollback.

## Regeln (verbindlich)

1) Branches sind Fort Knox: `main` und `stage` sind PR-only (kein Direkt-Push, kein Force-Push).
2) Reviews: `main` braucht 2 Reviews + CODEOWNERS; `stage` braucht 1 Review.
3) Required Checks: Merge/Deploy nur wenn alle required CI Checks gruen sind.
4) MCP als Kontrollschicht: kritische Aktionen (Push/PR/Deploy) laufen kontrolliert ueber MCP/Tooling.
5) Manifest Pflicht: `PROJECT_MANIFEST.json` ist verpflichtend, genau 1x im Repo-Root, versioniert (`manifest_version`). Fehlt es, ist CI rot.
6) Auto-PR fuer Manifest: Repo-Scan erstellt PR fuer Manifest; fehlt Bot/Token/Rechte, ist CI hard-fail (Option A).
7) Test-Registry SoT: `mcp_tests.yml` ist Single Source of Truth fuer Tool-Tests.
8) Test-Pflicht: jedes registrierte MCP Tool braucht Mock UND Real Testfaelle; fehlt eins, ist CI rot.
9) PR-Pipeline: Mock full + Real smoke subset (Kernpfade: MCP ready, Brain `/health`, Auth, memory write+readback).
10) Merge-Gate (stage/main): Real full integration fuer alle Tools (docker-compose + isolierte Test-DB + wait-ready).
11) Deploy-Gate: Deploy startet nur nach gruenem Merge-Gate.
12) Environments: `stage` deployt nur aus `stage`, `prod` nur aus `main`.
13) Prod Approval: Prod deploy braucht Approval nur von Denis Selmanovic.
14) Rollback Pflicht: Stage always rollback; Prod smart rollback (nur wenn rollback_safe).
15) DB-Regel: Deploy mit DB-Migration ist standardmaessig rollback_unsafe (ausser explizit safe).
16) Incident Logging: bei Fail immer GitHub Issue + Artefakte/Logs.
17) Repo-Chronik: `ops/incidents.md` wird nur via PR oder als neue Incident-Datei aktualisiert (keine Direkt-Writes).
18) Policy Enforcement: Policies duerfen keine Papierregeln sein; fehlende Tools werden mindestens als Stubs bereitgestellt (klarer Status + Logs).
19) Secrets & Signaturen: Secret-Scanning/Push-Protection aktiv; Signed commits fuer `main` (wie beschlossen).
20) Artefakte/Report: bei Fail immer Report-Tabelle (Soll/Ist/Fix-Hint) + Logs (MCP/Brain/DB).
