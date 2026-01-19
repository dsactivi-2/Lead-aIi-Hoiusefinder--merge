#!/bin/bash
# Apply Template to Existing Repo
# Kopiert NUR fehlende Dateien, überschreibt NICHTS

set -e

TEMPLATE_REPO="https://github.com/Activi-AI/Activi-AI-project-template-.git"
TEMPLATE_DIR="/tmp/activi-template-$$"

echo "🔧 Activi Template → Bestehendes Repo"
echo "======================================"
echo ""

# Prüfe ob wir in einem Git Repo sind
if [ ! -d ".git" ]; then
    echo "❌ Kein Git Repo! Bitte im Repo-Ordner ausführen."
    exit 1
fi

echo "📥 Template klonen..."
git clone --depth 1 "$TEMPLATE_REPO" "$TEMPLATE_DIR" 2>/dev/null

echo ""
echo "📋 Prüfe Dateien..."
echo ""

ADDED=0
SKIPPED=0
CONFLICTS=0

# Dateien die kopiert werden sollen
files=(
    "CLAUDE.md"
    "CODEX.md"
    "MASTER_RUNBOOK.md"
    "PROJECT_STATE.md"
    "PRODUCTION_CHECKLIST.md"
    "capabilities.yml"
    "MANDATORY.md"
    "CONTRACTS/api_contract.md"
    "CONTRACTS/data_contract.md"
    "ops/POLICY.md"
    "ops/DECISIONS.md"
    "ops/OPEN_QUESTIONS.md"
    "ops/RISKS.md"
    "docs/ARCHITECTURE.md"
    "docs/PROJECT_BRIEF.md"
    "docs/TEST_PLAN.md"
    "docs/CONTRACT_VERIFICATION.md"
    "PROMPTS/README.md"
    "PROMPTS/INTAKE_PROMPT.md"
    "PROMPTS/MASTER_PROMPT_1.md"
    "PROMPTS/MASTER_PROMPT_2.md"
    "eval/scorecard.yaml"
    "eval/regression_tests.yaml"
    "scripts/check_template_compliance.sh"
    ".github/workflows/ci.yml"
    ".github/workflows/quality-gate.yml"
    ".github/pull_request_template.md"
)

for file in "${files[@]}"; do
    template_file="$TEMPLATE_DIR/$file"

    if [ ! -f "$template_file" ]; then
        continue
    fi

    if [ -f "$file" ]; then
        # Datei existiert bereits
        echo "⏭️  SKIP (existiert): $file"

        # Prüfe ob Inhalt unterschiedlich
        if ! diff -q "$file" "$template_file" > /dev/null 2>&1; then
            echo "   ⚠️  Unterschiedlich! Vergleich: diff $file $TEMPLATE_DIR/$file"
            CONFLICTS=$((CONFLICTS + 1))
        fi

        SKIPPED=$((SKIPPED + 1))
    else
        # Datei fehlt → kopieren
        dir=$(dirname "$file")
        if [ "$dir" != "." ]; then
            mkdir -p "$dir"
        fi
        cp "$template_file" "$file"
        echo "✅ ADDED: $file"
        ADDED=$((ADDED + 1))
    fi
done

# .gitignore speziell behandeln (merge statt überschreiben)
if [ -f ".gitignore" ]; then
    echo ""
    echo "📋 .gitignore: Merge Template-Einträge..."

    # Füge Template-Einträge hinzu die noch nicht existieren
    while IFS= read -r line; do
        if [ -n "$line" ] && ! grep -qF "$line" .gitignore 2>/dev/null; then
            echo "$line" >> .gitignore
            echo "   + $line"
        fi
    done < "$TEMPLATE_DIR/.gitignore"
else
    cp "$TEMPLATE_DIR/.gitignore" .gitignore
    echo "✅ ADDED: .gitignore"
    ADDED=$((ADDED + 1))
fi

# .env.example
if [ ! -f ".env.example" ] && [ -f "$TEMPLATE_DIR/.env.example" ]; then
    cp "$TEMPLATE_DIR/.env.example" .env.example
    echo "✅ ADDED: .env.example"
    ADDED=$((ADDED + 1))
fi

# Cleanup
rm -rf "$TEMPLATE_DIR"

echo ""
echo "======================================"
echo "📊 Ergebnis:"
echo "   ✅ Hinzugefügt: $ADDED"
echo "   ⏭️  Übersprungen: $SKIPPED"
echo "   ⚠️  Konflikte: $CONFLICTS"
echo ""

if [ $CONFLICTS -gt 0 ]; then
    echo "⚠️  Es gibt $CONFLICTS Dateien mit unterschiedlichem Inhalt."
    echo "   Bitte manuell prüfen und ggf. anpassen."
fi

if [ $ADDED -gt 0 ]; then
    echo ""
    echo "📝 Nächste Schritte:"
    echo "   1. git add ."
    echo "   2. git commit -m 'chore: apply Activi template'"
    echo "   3. PROJECT_STATE.md ausfüllen"
    echo "   4. CONTRACTS/*.md anpassen"
fi

echo ""
echo "✅ Fertig!"
