#!/usr/bin/env bash
#
# Backup automático do Media Tracker no VPS.
# Gera um dump nativo (.dump) + um export JSON, envia ambos para o Google Drive
# via rclone e mantém apenas os últimos RETENTION_DAYS dias (local e remoto).
#
# Uso (no VPS):
#   /home/lucas/stash/scripts/backup-to-gdrive.sh
#
# Veja BACKUP.md para a configuração do rclone e a linha do cron.

set -euo pipefail

# ---- Configuração (ajuste se necessário) ----
PROJECT_PREFIX="media-tracker"          # prefixo dos containers (compose "name:")
POSTGRES_SERVICE="postgres"             # nome do serviço no docker-compose
SERVER_SERVICE="server"
BACKUP_DIR="${BACKUP_DIR:-/home/lucas/backups}"
RCLONE_REMOTE="${RCLONE_REMOTE:-gdrive:media-tracker-backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

DATE="$(date +%F)"
mkdir -p "$BACKUP_DIR"

PG_CONTAINER="$(docker ps -qf "name=${PROJECT_PREFIX}-${POSTGRES_SERVICE}")"
SERVER_CONTAINER="$(docker ps -qf "name=${PROJECT_PREFIX}-${SERVER_SERVICE}")"
[ -n "$PG_CONTAINER" ] || { echo "Container do Postgres não encontrado" >&2; exit 1; }

DUMP_FILE="$BACKUP_DIR/media-tracker-$DATE.dump"
JSON_FILE="$BACKUP_DIR/media-tracker-$DATE.json"

# ---- Dump nativo (custom format, restaurável com pg_restore) ----
# Roda dentro do container: POSTGRES_USER/POSTGRES_DB já estão no ambiente dele,
# então não precisamos ler o .env do host (que é formato docker, não shell).
# Sem -t: o TTY corromperia o binário inserindo \r nas quebras de linha.
docker exec "$PG_CONTAINER" sh -c 'pg_dump -Fc -U "$POSTGRES_USER" "$POSTGRES_DB"' > "$DUMP_FILE"

# ---- Export JSON (via API interna do backend) ----
if [ -n "$SERVER_CONTAINER" ]; then
  docker exec "$SERVER_CONTAINER" wget -qO- http://localhost:3333/api/backup/export > "$JSON_FILE" || \
    echo "Aviso: falha ao gerar o JSON (o .dump foi gerado mesmo assim)" >&2
fi

# ---- Envia para o Google Drive ----
rclone copy "$DUMP_FILE" "$RCLONE_REMOTE"
[ -s "$JSON_FILE" ] && rclone copy "$JSON_FILE" "$RCLONE_REMOTE"

# ---- Rotação (local e remoto) ----
find "$BACKUP_DIR" -name 'media-tracker-*.dump' -mtime "+$RETENTION_DAYS" -delete
find "$BACKUP_DIR" -name 'media-tracker-*.json' -mtime "+$RETENTION_DAYS" -delete
rclone delete --min-age "${RETENTION_DAYS}d" "$RCLONE_REMOTE"

echo "Backup concluído: $DUMP_FILE"
