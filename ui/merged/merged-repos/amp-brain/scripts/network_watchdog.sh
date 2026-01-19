#!/bin/bash
###############################################################################
# NETWORK WATCHDOG - Erkennt versteckte und neue Geräte im Netzwerk
# Läuft kontinuierlich und warnt bei Anomalien
###############################################################################

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$SCRIPT_DIR/../logs"
KNOWN_DEVICES="$SCRIPT_DIR/../data/known_devices.txt"
ALERT_LOG="$LOG_DIR/network_alerts.log"
SCAN_LOG="$LOG_DIR/network_scans.log"

mkdir -p "$LOG_DIR" "$SCRIPT_DIR/../data"
touch "$KNOWN_DEVICES"

# Farben
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_alert() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ALERT: $1" >> "$ALERT_LOG"
    echo -e "${RED}[ALERT]${NC} $1"
}

log_info() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1" >> "$SCAN_LOG"
    echo -e "${GREEN}[INFO]${NC} $1"
}

# Eigene Netzwerk-Infos holen
get_network_info() {
    INTERFACE=$(route -n get default 2>/dev/null | grep interface | awk '{print $2}')
    LOCAL_IP=$(ipconfig getifaddr "$INTERFACE" 2>/dev/null)
    GATEWAY=$(route -n get default 2>/dev/null | grep gateway | awk '{print $2}')
    SUBNET=$(echo "$LOCAL_IP" | sed 's/\.[0-9]*$/.0\/24/')
    echo "Interface: $INTERFACE | IP: $LOCAL_IP | Gateway: $GATEWAY | Subnet: $SUBNET"
}

# ARP-Cache auslesen (zeigt aktive Geräte)
scan_arp_cache() {
    echo -e "\n${YELLOW}=== ARP Cache (bekannte Geräte) ===${NC}"
    arp -a | grep -v incomplete
}

# Aktiver Netzwerk-Scan mit arp-scan oder ping-sweep
scan_network_active() {
    echo -e "\n${YELLOW}=== Aktiver Netzwerk-Scan ===${NC}"
    
    if command -v arp-scan &> /dev/null; then
        sudo arp-scan --localnet 2>/dev/null
    else
        # Fallback: Ping-Sweep
        SUBNET_BASE=$(echo "$LOCAL_IP" | sed 's/\.[0-9]*$//')
        echo "Ping-Sweep auf $SUBNET_BASE.0/24..."
        for i in {1..254}; do
            ping -c 1 -W 1 "$SUBNET_BASE.$i" &>/dev/null &
        done
        wait
        arp -a | grep -v incomplete
    fi
}

# Bonjour/mDNS Geräte (AirDrop, AirPlay, etc.)
scan_bonjour() {
    echo -e "\n${YELLOW}=== Bonjour/mDNS Geräte (AirDrop, AirPlay, etc.) ===${NC}"
    
    # AirDrop
    echo "--- AirDrop Geräte ---"
    dns-sd -B _airdrop._tcp local. 2>/dev/null &
    AIRDROP_PID=$!
    sleep 3
    kill $AIRDROP_PID 2>/dev/null
    
    # AirPlay
    echo "--- AirPlay Geräte ---"
    dns-sd -B _airplay._tcp local. 2>/dev/null &
    AIRPLAY_PID=$!
    sleep 3
    kill $AIRPLAY_PID 2>/dev/null
    
    # Alle Services
    echo "--- Alle Bonjour Services ---"
    dns-sd -B _services._dns-sd._udp local. 2>/dev/null &
    SERVICES_PID=$!
    sleep 3
    kill $SERVICES_PID 2>/dev/null
}

# Vergleiche mit bekannten Geräten
check_new_devices() {
    echo -e "\n${YELLOW}=== Prüfe auf unbekannte Geräte ===${NC}"
    
    CURRENT_DEVICES=$(arp -a | grep -v incomplete | awk '{print $2 " " $4}' | tr -d '()')
    
    while read -r line; do
        IP=$(echo "$line" | awk '{print $1}')
        MAC=$(echo "$line" | awk '{print $2}')
        
        if [ -n "$MAC" ] && [ "$MAC" != "(incomplete)" ]; then
            if ! grep -q "$MAC" "$KNOWN_DEVICES" 2>/dev/null; then
                log_alert "NEUES GERÄT ENTDECKT: IP=$IP MAC=$MAC"
                echo "$MAC # Entdeckt $(date '+%Y-%m-%d %H:%M:%S') IP=$IP" >> "$KNOWN_DEVICES"
            fi
        fi
    done <<< "$CURRENT_DEVICES"
}

# Offene Ports auf Gateway prüfen (Router-Sicherheit)
check_gateway_ports() {
    echo -e "\n${YELLOW}=== Router/Gateway Ports ===${NC}"
    
    COMMON_PORTS="21,22,23,53,80,443,445,8080,8443"
    
    if command -v nmap &> /dev/null; then
        nmap -p "$COMMON_PORTS" "$GATEWAY" 2>/dev/null | grep -E "open|closed|filtered"
    else
        echo "nmap nicht installiert - installieren mit: brew install nmap"
    fi
}

# Verdächtige Verbindungen auf diesem Mac
check_local_connections() {
    echo -e "\n${YELLOW}=== Verdächtige ausgehende Verbindungen ===${NC}"
    
    # Established connections zu unbekannten IPs
    netstat -an | grep ESTABLISHED | grep -v "127.0.0.1" | grep -v "::1"
    
    echo -e "\n--- Lauschende Ports ---"
    lsof -i -P | grep LISTEN
}

# WLAN-Informationen
check_wifi_info() {
    echo -e "\n${YELLOW}=== WLAN Informationen ===${NC}"
    
    /System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -I 2>/dev/null
    
    echo -e "\n--- Bekannte WLANs ---"
    networksetup -listpreferredwirelessnetworks en0 2>/dev/null | head -20
}

# Prüfe auf ARP-Spoofing
check_arp_spoofing() {
    echo -e "\n${YELLOW}=== ARP-Spoofing Check ===${NC}"
    
    # Mehrere MAC-Adressen für gleiche IP = Spoofing
    DUPLICATES=$(arp -a | awk '{print $2}' | sort | uniq -d)
    
    if [ -n "$DUPLICATES" ]; then
        log_alert "MÖGLICHES ARP-SPOOFING: Doppelte IPs gefunden!"
        echo "$DUPLICATES"
    else
        echo "Keine doppelten IP-Zuweisungen gefunden"
    fi
    
    # Gateway-MAC prüfen
    GATEWAY_MAC=$(arp -a | grep "$GATEWAY" | awk '{print $4}')
    echo "Gateway $GATEWAY hat MAC: $GATEWAY_MAC"
}

# Hauptmenü
main_menu() {
    echo -e "\n${GREEN}========================================${NC}"
    echo -e "${GREEN}     NETWORK WATCHDOG v1.0${NC}"
    echo -e "${GREEN}========================================${NC}"
    get_network_info
    echo ""
    echo "1) Schnell-Scan (ARP + Bonjour)"
    echo "2) Tiefen-Scan (Aktiv + Ports)"
    echo "3) Kontinuierliches Monitoring (alle 5 Min)"
    echo "4) Zeige bekannte Geräte"
    echo "5) Zeige Alerts"
    echo "6) Alle Scans ausführen"
    echo "0) Beenden"
    echo ""
    read -p "Auswahl: " choice
    
    case $choice in
        1)
            scan_arp_cache
            scan_bonjour
            check_new_devices
            ;;
        2)
            scan_network_active
            check_gateway_ports
            check_local_connections
            check_arp_spoofing
            ;;
        3)
            echo "Starte kontinuierliches Monitoring (Ctrl+C zum Beenden)..."
            while true; do
                clear
                echo "[$(date)] Scanning..."
                scan_arp_cache
                check_new_devices
                check_arp_spoofing
                echo -e "\nNächster Scan in 5 Minuten..."
                sleep 300
            done
            ;;
        4)
            echo -e "\n${YELLOW}=== Bekannte Geräte ===${NC}"
            cat "$KNOWN_DEVICES"
            ;;
        5)
            echo -e "\n${YELLOW}=== Alerts ===${NC}"
            tail -50 "$ALERT_LOG" 2>/dev/null || echo "Keine Alerts"
            ;;
        6)
            scan_arp_cache
            scan_network_active
            scan_bonjour
            check_wifi_info
            check_local_connections
            check_gateway_ports
            check_arp_spoofing
            check_new_devices
            ;;
        0)
            exit 0
            ;;
    esac
    
    echo ""
    read -p "Enter für Menü..."
    main_menu
}

# Direkt-Modus für Cron/automatisch
if [ "$1" == "--auto" ]; then
    log_info "Auto-Scan gestartet"
    scan_arp_cache >> "$SCAN_LOG"
    check_new_devices
    check_arp_spoofing >> "$SCAN_LOG"
    exit 0
fi

main_menu
