#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  Cotral — Remote management script
#  Usage: ./scripts/remote.sh <command> [service]
#
#  Commands:
#    status              Show container status
#    logs [service]      Tail logs (all or specific service)
#    restart [service]   Restart all or specific service
#    rebuild <service>   Rebuild and restart a single service
#    ssh                 Open interactive SSH session
#    exec <service> ...  Execute command in container
#    discord-commands    Redeploy Discord slash commands
#    backups             List remote backup directories
#    clean-backups       Remove all backup directories
#
#  Services: server, telegram-bot, discord-bot
# ─────────────────────────────────────────────────────────────

set -e
cd "$(dirname "$0")/.."

# ── Config ───────────────────────────────────────────────────
SERVER_IP="192.168.1.196"
SERVER_PORT="2222"
SERVER_USER="giovanniguarino"
SERVER_HOSTKEY="SHA256:SPOYKkbvmxRQFcPyn6EsSnOvxqFs9fvaN5dfs3+emYw"
REMOTE_DIR="/home/giovanniguarino/cotral"

PLINK="/c/Program Files/PuTTY/plink.exe"

[ -f .deploy.env ] && source .deploy.env
DEPLOY_PASSWORD="${DEPLOY_PASSWORD:-root}"

# ── Colors ───────────────────────────────────────────────────
if [ -t 1 ]; then
    GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'
    CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'
else
    GREEN=''; YELLOW=''; BLUE=''; CYAN=''; BOLD=''; NC=''
fi

plink_run() {
    "$PLINK" -ssh -P "$SERVER_PORT" -pw "$DEPLOY_PASSWORD" \
             -hostkey "$SERVER_HOSTKEY" -batch \
             "$SERVER_USER@$SERVER_IP" "$1"
}

plink_tty() {
    "$PLINK" -ssh -P "$SERVER_PORT" -pw "$DEPLOY_PASSWORD" \
             -hostkey "$SERVER_HOSTKEY" -t \
             "$SERVER_USER@$SERVER_IP" "$1"
}

usage() {
    cat <<'EOF'
Cotral — Remote management script

Usage: ./scripts/remote.sh <command> [args]

Commands:
  status              Mostra stato container
  logs [service]      Mostra log (tutti i servizi o uno specifico)
  restart [service]   Restart tutti o un singolo servizio
  rebuild <service>   Rebuild e restart di un singolo servizio
  ssh                 Apri sessione SSH interattiva
  exec <service> ...  Esegui un comando in un container
  discord-commands    Registra di nuovo gli slash commands Discord
  backups             Mostra i backup remoti (~/cotral.bak.*)
  clean-backups       Rimuove tutti i backup remoti (con conferma)

Services: server, telegram-bot, discord-bot
EOF
}

cmd="${1:-}"
shift || true

case "$cmd" in
    status)
        echo -e "${CYAN}${BOLD}── Container status ──${NC}"
        plink_run "cd $REMOTE_DIR && docker compose ps"
        ;;

    logs)
        svc="${1:-}"
        if [ -n "$svc" ]; then
            echo -e "${CYAN}${BOLD}── Logs: $svc (Ctrl+C per uscire) ──${NC}"
            plink_tty "cd $REMOTE_DIR && docker compose logs -f --tail 50 $svc"
        else
            echo -e "${CYAN}${BOLD}── Logs: tutti i servizi ──${NC}"
            plink_run "cd $REMOTE_DIR && docker compose logs --tail 30"
        fi
        ;;

    restart)
        svc="${1:-}"
        if [ -n "$svc" ]; then
            echo -e "${BLUE}→${NC} Restart $svc..."
            plink_run "cd $REMOTE_DIR && docker compose restart $svc"
        else
            echo -e "${BLUE}→${NC} Restart tutti i servizi..."
            plink_run "cd $REMOTE_DIR && docker compose restart"
        fi
        echo -e "${GREEN}✓${NC} Restart completato"
        ;;

    rebuild)
        svc="${1:-}"
        [ -z "$svc" ] && { echo "Usage: remote.sh rebuild <service>"; exit 1; }
        echo -e "${BLUE}→${NC} Rebuild $svc..."
        plink_run "cd $REMOTE_DIR && docker compose build $svc && docker compose up -d $svc"
        echo -e "${GREEN}✓${NC} Rebuild completato"
        ;;

    ssh)
        echo -e "${BLUE}→${NC} Apertura sessione SSH interattiva..."
        "$PLINK" -ssh -P "$SERVER_PORT" -pw "$DEPLOY_PASSWORD" \
                 -hostkey "$SERVER_HOSTKEY" -t \
                 "$SERVER_USER@$SERVER_IP"
        ;;

    exec)
        svc="${1:-}"
        shift || true
        [ -z "$svc" ] && { echo "Usage: remote.sh exec <service> <command>"; exit 1; }
        plink_tty "cd $REMOTE_DIR && docker compose exec $svc $*"
        ;;

    discord-commands)
        echo -e "${BLUE}→${NC} Registrazione comandi Discord..."
        plink_run "docker exec cotral-discord-bot-1 node packages/discord-bot/dist/bot/deploy-commands.js"
        ;;

    backups)
        echo -e "${CYAN}${BOLD}── Backup remoti ──${NC}"
        plink_run "ls -ldh /home/giovanniguarino/cotral.bak.* 2>/dev/null || echo 'Nessun backup presente'"
        ;;

    clean-backups)
        echo -e "${YELLOW}⚠${NC}  Rimozione di tutti i backup ~/cotral.bak.*"
        read -p "Confermi? [y/N] " confirm
        [ "$confirm" = "y" ] || { echo "Annullato"; exit 0; }
        plink_run "rm -rf /home/giovanniguarino/cotral.bak.* && echo 'Backup rimossi'"
        ;;

    ""|help|-h|--help)
        usage
        ;;

    *)
        echo "Comando sconosciuto: $cmd" >&2
        usage
        exit 1
        ;;
esac
