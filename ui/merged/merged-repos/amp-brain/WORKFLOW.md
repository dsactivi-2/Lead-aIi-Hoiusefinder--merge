# Workflow-Empfehlungen

## Git Shortcuts (Aliases)

```bash
git s     # status
git a     # add -A
git c     # commit -m "message"
git p     # push
git pl    # pull
git l     # log --oneline -10
```

**Beispiel schneller Commit:**

```bash
git a && git c "Fix bug" && git p
```

---

## Täglicher Workflow

### 1. Session Start

```bash
cd ~/activi-dev-repos/[projekt]
git pl                          # Aktuelle Version holen
```

### 2. Nach jeder Änderung

```bash
git a && git c "[beschreibung]" && git p
```

### 3. Session Ende

```bash
# Prüfen ob alles gepusht ist
for repo in ~/activi-dev-repos/*/; do
  if [ -d "$repo/.git" ]; then
    echo "=== $(basename $repo) ==="
    git -C "$repo" status -s
  fi
done
```

---

## Bei Konflikten

```bash
git stash           # Lokale Änderungen sichern
git pl              # Remote holen
git stash pop       # Änderungen zurück
# Konflikte manuell lösen
git a && git c "Merge conflict resolved" && git p
```

---

## Neue Projekte anlegen

```bash
cd ~/activi-dev-repos
mkdir neues-projekt && cd neues-projekt
git init
gh repo create devshift-stack/neues-projekt --private --source=.
# .gitignore erstellen (siehe Standard unten)
git a && git c "Initial commit" && git p -u origin main
```

---

## Standard .gitignore

```
node_modules/
.env
.env.local
*.log
.DS_Store
__pycache__/
*.pyc
.cache/
dist/
build/
.venv/
venv/
```

---

## Troubleshooting

| Problem         | Lösung                     |
| --------------- | -------------------------- |
| Push rejected   | `git pl --rebase && git p` |
| Falscher Branch | `git checkout main`        |
| Auth Fehler     | `gh auth login`            |
| SSH Fehler      | `ssh -T git@github.com`    |

---

**Regel: Im Zweifel → PUSHEN!**
