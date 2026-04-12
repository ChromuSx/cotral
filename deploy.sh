#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  Cotral — Deploy script
#  Usage: ./deploy.sh [options]
#    --skip-build             Salta il check di build locale
#    --skip-discord-commands  Non registra i comandi Discord
#    --skip-backup            Non crea backup della dir remota
#    --logs                   Mostra i log dopo il deploy
#    --help                   Mostra questo aiuto
# ─────────────────────────────────────────────────────────────

set -e
cd "$(dirname "$0")"

# ── Config ───────────────────────────────────────────────────
SERVER_IP="192.168.1.196"
SERVER_PORT="2222"
SERVER_USER="giovanniguarino"
SERVER_HOSTKEY="SHA256:SPOYKkbvmxRQFcPyn6EsSnOvxqFs9fvaN5dfs3+emYw"
REMOTE_HOME="/home/giovanniguarino"
REMOTE_DIR="$REMOTE_HOME/cotral"

PLINK="/c/Program Files/PuTTY/plink.exe"
PSCP="/c/Program Files/PuTTY/pscp.exe"

# Override via .deploy.env if present (gitignored)
[ -f .deploy.env ] && source .deploy.env

# Password: env var DEPLOY_PASSWORD takes precedence
DEPLOY_PASSWORD="${DEPLOY_PASSWORD:-root}"

# ── Flags ────────────────────────────────────────────────────
SKIP_BUILD=false
SKIP_DISCORD_COMMANDS=false
SKIP_BACKUP=false
SHOW_LOGS=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --skip-build) SKIP_BUILD=true ;;
        --skip-discord-commands) SKIP_DISCORD_COMMANDS=true ;;
        --skip-backup) SKIP_BACKUP=true ;;
        --logs) SHOW_LOGS=true ;;
        --help|-h)
            cat <<'EOF'
Cotral — Deploy script

Usage: ./deploy.sh [options]

Options:
  --skip-build             Salta il check di build locale
  --skip-discord-commands  Non registra i comandi Discord
  --skip-backup            Non crea backup della dir remota
  --logs                   Mostra i log dopo il deploy
  --help                   Mostra questo aiuto
EOF
            exit 0
            ;;
        *) echo "Unknown option: $1. Use --help" >&2; exit 1 ;;
    esac
    shift
done

# ── Colors ───────────────────────────────────────────────────
if [ -t 1 ]; then
    RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
    BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'
else
    RED=''; GREEN=''; YELLOW=''; BLUE=''; CYAN=''; BOLD=''; NC=''
fi

log()     { echo -e "${BLUE}→${NC} $1"; }
success() { echo -e "${GREEN}✓${NC} $1"; }
warn()    { echo -e "${YELLOW}⚠${NC} $1"; }
die()     { echo -e "${RED}✗${NC} $1" >&2; exit 1; }

section() {
    echo
    echo -e "${CYAN}${BOLD}── $1 ──${NC}"
}

# ── Helper functions ─────────────────────────────────────────
plink_run() {
    "$PLINK" -ssh -P "$SERVER_PORT" -pw "$DEPLOY_PASSWORD" \
             -hostkey "$SERVER_HOSTKEY" -batch \
             "$SERVER_USER@$SERVER_IP" "$1"
}

pscp_upload() {
    "$PSCP" -P "$SERVER_PORT" -pw "$DEPLOY_PASSWORD" \
            -hostkey "$SERVER_HOSTKEY" -batch \
            "$1" "$SERVER_USER@$SERVER_IP:$2"
}

# ── Pipeline steps ───────────────────────────────────────────

check_deps() {
    section "Pre-flight"
    [ -f "$PLINK" ] || die "plink non trovato: $PLINK"
    [ -f "$PSCP" ] || die "pscp non trovato: $PSCP"
    command -v tar >/dev/null || die "tar non disponibile"
    [ -f package.json ] || die "package.json non trovato — esegui dalla root del progetto"
    success "Tutte le dipendenze disponibili"
    log "Target: ${BOLD}$SERVER_USER@$SERVER_IP:$SERVER_PORT${NC}"
}

build_check() {
    [ "$SKIP_BUILD" = true ] && { warn "Build check saltato"; return; }
    section "Build check locale"
    log "Verifica compilazione TypeScript..."
    npm run build >/dev/null 2>&1 || die "Build locale fallita — correggi gli errori prima di deployare"
    success "Build OK"
}

create_tarball() {
    section "Creazione tarball"
    local parent project
    parent="$(cd .. && pwd)"
    project="$(basename "$(pwd)")"

    (cd "$parent" && tar \
        --exclude="$project/node_modules" \
        --exclude="$project/*/node_modules" \
        --exclude="$project/*/*/node_modules" \
        --exclude="$project/*/dist" \
        --exclude="$project/*/*/dist" \
        --exclude="$project/.git" \
        --exclude="$project/.claude" \
        --exclude="$project/.env" \
        --exclude="$project/*/.env" \
        --exclude="$project/*/*/.env" \
        --exclude="$project/packages/server/GTFS_COTRAL" \
        --exclude="$project/packages/server/*.sqlite" \
        --exclude="$project/*/*/session_db.json" \
        --exclude="$project/*.tar.gz" \
        -czf /tmp/cotral-deploy.tar.gz "$project")

    local size
    size=$(ls -lh /tmp/cotral-deploy.tar.gz | awk '{print $5}')
    success "Tarball creato ($size)"
}

transfer_tarball() {
    section "Trasferimento"
    log "Upload su $SERVER_IP:/tmp/..."
    pscp_upload /tmp/cotral-deploy.tar.gz /tmp/ 2>&1 | tail -1
    success "Trasferimento completato"
}

remote_extract() {
    section "Estrazione remota"

    if [ "$SKIP_BACKUP" != true ]; then
        log "Backup dir remota..."
        plink_run "cd $REMOTE_HOME && [ -d cotral ] && { cp cotral/.env /tmp/cotral-env-backup 2>/dev/null || true; mv cotral cotral.bak.\$(date +%s); } || true"
    fi

    log "Estrazione nuovo codice..."
    plink_run "tar -xzf /tmp/cotral-deploy.tar.gz -C $REMOTE_HOME"

    log "Ripristino .env..."
    plink_run "[ -f /tmp/cotral-env-backup ] && cp /tmp/cotral-env-backup $REMOTE_DIR/.env || echo '⚠ Nessun .env precedente da ripristinare'"
    success "Codice estratto"
}

remote_rebuild() {
    section "Rebuild containers"
    log "Stop containers esistenti..."
    plink_run "cd $REMOTE_DIR && docker compose down 2>&1 | tail -3" || true

    log "Build immagini (può richiedere alcuni minuti)..."
    plink_run "cd $REMOTE_DIR && docker compose build 2>&1 | tail -15"
    success "Build completata"

    log "Avvio containers..."
    plink_run "cd $REMOTE_DIR && docker compose up -d 2>&1 | tail -10"
    success "Containers avviati"
}

deploy_discord_commands() {
    [ "$SKIP_DISCORD_COMMANDS" = true ] && { warn "Deploy comandi Discord saltato"; return; }
    section "Deploy Discord slash commands"
    log "Registrazione comandi..."
    plink_run "docker exec cotral-discord-bot-1 node packages/discord-bot/dist/bot/deploy-commands.js 2>&1 | tail -5"
    success "Comandi Discord registrati"
}

show_status() {
    section "Stato finale"
    plink_run "cd $REMOTE_DIR && docker compose ps"

    if [ "$SHOW_LOGS" = true ]; then
        echo
        log "Ultimi log per servizio:"
        plink_run "cd $REMOTE_DIR && for svc in server telegram-bot discord-bot; do echo; echo \"── \$svc ──\"; docker compose logs \$svc --tail 5; done"
    fi
}

cleanup() {
    rm -f /tmp/cotral-deploy.tar.gz
}

# ── Main ─────────────────────────────────────────────────────
trap cleanup EXIT

START_TIME=$(date +%s)

echo -e "${CYAN}${BOLD}"
echo "════════════════════════════════════════════════════"
echo "  Cotral — Deploy to $SERVER_IP"
echo "════════════════════════════════════════════════════"
echo -e "${NC}"

check_deps
build_check
create_tarball
transfer_tarball
remote_extract
remote_rebuild
deploy_discord_commands
show_status

ELAPSED=$(( $(date +%s) - START_TIME ))

echo
echo -e "${GREEN}${BOLD}════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}  ✓ Deploy completato in ${ELAPSED}s${NC}"
echo -e "${GREEN}${BOLD}════════════════════════════════════════════════════${NC}"
echo
echo -e "Useful commands:"
echo -e "  ${BOLD}./deploy.sh --logs${NC}               Deploy e mostra log"
echo -e "  ${BOLD}./deploy.sh --skip-build${NC}         Skip check build locale"
echo -e "  ${BOLD}./deploy.sh --skip-discord-commands${NC}  Skip registrazione comandi Discord"
