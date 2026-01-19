#!/bin/bash
# Template Compliance Check
# Prüft ob ein Projekt alle Pflicht-Anforderungen des Templates erfüllt

set -e

echo "🔍 Template Compliance Check"
echo "============================"
echo ""

ERRORS=0
WARNINGS=0

# ═══════════════════════════════════════════════════════════════
# PFLICHT-DATEIEN
# ═══════════════════════════════════════════════════════════════

echo "📋 Pflicht-Dateien:"
echo "-------------------"

required_files=(
    "README.md"
    "PROJECT_STATE.md"
    "MASTER_RUNBOOK.md"
    "PRODUCTION_CHECKLIST.md"
    "capabilities.yml"
    "CONTRACTS/api_contract.md"
    "CONTRACTS/data_contract.md"
    "ops/POLICY.md"
    ".gitignore"
    ".env.example"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file (FEHLT!)"
        ERRORS=$((ERRORS + 1))
    fi
done

echo ""

# ═══════════════════════════════════════════════════════════════
# EMPFOHLENE DATEIEN
# ═══════════════════════════════════════════════════════════════

echo "📋 Empfohlene Dateien:"
echo "----------------------"

recommended_files=(
    "docs/ARCHITECTURE.md"
    "docs/PROJECT_BRIEF.md"
    "CHANGELOG.md"
    "eval/scorecard.yaml"
    "eval/regression_tests.yaml"
)

for file in "${recommended_files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ⚠️ $file (empfohlen)"
        WARNINGS=$((WARNINGS + 1))
    fi
done

echo ""

# ═══════════════════════════════════════════════════════════════
# CI WORKFLOWS
# ═══════════════════════════════════════════════════════════════

echo "📋 CI Workflows:"
echo "----------------"

if [ -f ".github/workflows/ci.yml" ]; then
    echo "  ✅ .github/workflows/ci.yml"
else
    echo "  ❌ .github/workflows/ci.yml (FEHLT!)"
    ERRORS=$((ERRORS + 1))
fi

if [ -f ".github/workflows/quality-gate.yml" ]; then
    echo "  ✅ .github/workflows/quality-gate.yml"
else
    echo "  ⚠️ .github/workflows/quality-gate.yml (empfohlen)"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# CONTRACTS INHALT
# ═══════════════════════════════════════════════════════════════

echo "📋 Contract Validierung:"
echo "------------------------"

if [ -f "CONTRACTS/api_contract.md" ]; then
    # Prüfe auf TODOs
    if grep -qi "TODO\|FIXME\|XXX" CONTRACTS/api_contract.md 2>/dev/null; then
        echo "  ⚠️ API Contract hat offene TODOs"
        WARNINGS=$((WARNINGS + 1))
    else
        echo "  ✅ API Contract: Keine offenen TODOs"
    fi

    # Prüfe auf Endpoints
    if grep -q "^### \(GET\|POST\|PUT\|DELETE\|PATCH\)" CONTRACTS/api_contract.md 2>/dev/null; then
        echo "  ✅ API Contract: Endpoints definiert"
    else
        echo "  ⚠️ API Contract: Keine Endpoints gefunden"
        WARNINGS=$((WARNINGS + 1))
    fi
fi

if [ -f "CONTRACTS/data_contract.md" ]; then
    # Prüfe auf Tabellen
    if grep -qi "CREATE TABLE\|## .*Table\|### .*Table" CONTRACTS/data_contract.md 2>/dev/null; then
        echo "  ✅ Data Contract: Tabellen definiert"
    else
        echo "  ⚠️ Data Contract: Keine Tabellen gefunden"
        WARNINGS=$((WARNINGS + 1))
    fi
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# CAPABILITIES
# ═══════════════════════════════════════════════════════════════

echo "📋 Capabilities:"
echo "----------------"

if [ -f "capabilities.yml" ]; then
    # YAML Syntax Check
    if command -v python3 &> /dev/null; then
        if python3 -c "import yaml; yaml.safe_load(open('capabilities.yml'))" 2>/dev/null; then
            echo "  ✅ capabilities.yml: YAML Syntax OK"
        else
            echo "  ❌ capabilities.yml: YAML Syntax Fehler!"
            ERRORS=$((ERRORS + 1))
        fi
    fi

    # Prüfe auf Capabilities
    if grep -q "^  - name:" capabilities.yml 2>/dev/null; then
        CAP_COUNT=$(grep -c "^  - name:" capabilities.yml 2>/dev/null || echo "0")
        echo "  ✅ capabilities.yml: $CAP_COUNT Capabilities definiert"
    else
        echo "  ⚠️ capabilities.yml: Keine Capabilities gefunden"
        WARNINGS=$((WARNINGS + 1))
    fi
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# SECRETS CHECK
# ═══════════════════════════════════════════════════════════════

echo "📋 Secrets Check:"
echo "-----------------"

# .env Dateien (außer .example)
ENV_FILES=$(find . -name ".env" -o -name ".env.local" -o -name ".env.production" 2>/dev/null | grep -v ".example" | head -5)
if [ -n "$ENV_FILES" ]; then
    echo "  ❌ .env Dateien gefunden (sollten in .gitignore sein):"
    echo "$ENV_FILES" | while read -r f; do echo "      $f"; done
    ERRORS=$((ERRORS + 1))
else
    echo "  ✅ Keine .env Dateien im Repo"
fi

# API Keys
if grep -rn 'sk-[a-zA-Z0-9]\{20,\}' --include="*.js" --include="*.ts" --include="*.json" . 2>/dev/null | grep -v "node_modules" | grep -v ".example" | head -1; then
    echo "  ❌ Potentielle API Keys gefunden!"
    ERRORS=$((ERRORS + 1))
else
    echo "  ✅ Keine offensichtlichen API Keys"
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# ERGEBNIS
# ═══════════════════════════════════════════════════════════════

echo "============================"
echo "📊 Ergebnis:"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo "✅ VOLLSTÄNDIG COMPLIANT"
    echo "   Alle Pflicht-Anforderungen erfüllt!"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo "⚠️ COMPLIANT MIT WARNUNGEN"
    echo "   Pflicht: ✅ OK"
    echo "   Warnungen: $WARNINGS"
    exit 0
else
    echo "❌ NICHT COMPLIANT"
    echo "   Fehler: $ERRORS"
    echo "   Warnungen: $WARNINGS"
    echo ""
    echo "   Bitte behebe die Fehler (❌) bevor du fortfährst!"
    exit 1
fi
