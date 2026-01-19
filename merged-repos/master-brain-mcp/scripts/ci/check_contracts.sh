#!/bin/bash
# Contract Verification Script
# Prüft ob API Calls im Code mit Contracts übereinstimmen

set -e

echo "📋 Contract Verification"
echo "========================"

# Prüfe ob Contract-Dateien existieren
echo -n "API Contract existiert... "
if [ -f "CONTRACTS/api_contract.md" ]; then
    echo "✅"
else
    echo "❌ FEHLT!"
    exit 1
fi

echo -n "Data Contract existiert... "
if [ -f "CONTRACTS/data_contract.md" ]; then
    echo "✅"
else
    echo "❌ FEHLT!"
    exit 1
fi

# Extrahiere Endpoints aus Contract
echo ""
echo "📍 Endpoints aus API Contract:"
grep -E "^### (GET|POST|PUT|DELETE|PATCH)" CONTRACTS/api_contract.md 2>/dev/null || echo "Keine gefunden"

echo ""
echo "📍 API Calls im Frontend (falls vorhanden):"
if [ -d "src/frontend" ] || [ -d "frontend" ] || [ -d "app" ]; then
    grep -rn "fetch\|axios\|api\." src/ frontend/ app/ 2>/dev/null | grep -oE '["'"'"']/[^"'"'"']+["'"'"']' | sort -u | head -20 || echo "Keine gefunden"
else
    echo "Kein Frontend-Ordner gefunden"
fi

echo ""
echo "📍 Routes im Backend (falls vorhanden):"
if [ -d "src/backend" ] || [ -d "backend" ] || [ -d "server" ]; then
    grep -rn "app\.\(get\|post\|put\|delete\)\|router\.\(get\|post\|put\|delete\)" src/ backend/ server/ 2>/dev/null | grep -oE '["'"'"']/[^"'"'"']+["'"'"']' | sort -u | head -20 || echo "Keine gefunden"
else
    echo "Kein Backend-Ordner gefunden"
fi

echo ""
echo "========================"
echo "⚠️ Manuelle Prüfung erforderlich: Vergleiche die Pfade oben mit dem API Contract!"
