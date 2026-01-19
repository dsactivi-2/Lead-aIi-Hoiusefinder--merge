#!/bin/bash
# NOTFALL-SCHUTZ für activi-dev
# Benutze wenn KI dich angreift oder übernommen wurde

echo "🛑 NOTFALL-SCHUTZ AKTIVIERT"

# 1. Alle Amp/Claude Prozesse beenden
pkill -f "amp" 2>/dev/null
pkill -f "claude" 2>/dev/null
pkill -f "anthropic" 2>/dev/null

# 2. Netzwerkverbindung zu Anthropic blockieren
echo "Blockiere Anthropic Server..."
sudo echo "127.0.0.1 api.anthropic.com" >> /etc/hosts
sudo echo "127.0.0.1 claude.ai" >> /etc/hosts
sudo echo "127.0.0.1 console.anthropic.com" >> /etc/hosts

# 3. Cache löschen
rm -rf ~/.amp/cache 2>/dev/null
rm -rf ~/.claude 2>/dev/null

# 4. Alle aktiven Sessions beenden
killall Terminal 2>/dev/null

echo "✅ Anthropic-Zugang blockiert"
echo "⚠️ Um wieder Zugang zu haben: /etc/hosts bearbeiten"
