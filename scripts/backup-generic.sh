#!/usr/bin/env bash
#
# Backup genérico de QUALQUER projeto Postgres-em-Docker para o Google Drive.
# Um script só, reutilizável: o nome do projeto vem como argumento.
#
# Uso:
#   backup-generic.sh <nome-do-projeto>
#
# Exemplos:
#   backup-generic.sh media-tracker
#   backup-generic.sh done
#
# Convenções derivadas de <nome-do-projeto> (todas sobrescrevíveis por env var):
#   containers       : <projeto>-<POSTGRES_SERVICE>-N   (POSTGRES_SERVICE=postgres)
#   pasta no Drive   : gdrive:<projeto>-backups          (RCLONE_REMOTE)
#   pasta local      : /home/lucas/backups/<projeto>     (BACKUP_DIR)
#   retenção         : 30 dias                           (RETENTION_DAYS)
#
# JSON (opcional): só roda se SERVER_SERVICE estiver definido. Baixa
#   http://localhost:<SERVER_PORT><JSON_PATH> de dentro do container do server.
#   Ex.: SERVER_SERVICE=server backup-generic.sh media-tracker
#
# Pré-requisitos no host: docker, rclone (remote "gdrive" já configurado).
# O .dump roda dentro do container do Postgres, que já tem POSTGRES_USER/DB no
# ambiente — não lê o .env do host.

set -euo pipefail

PROJECT="${1:?uso: $(basename "$0") <nome-do-projeto>}"

# ---- Configuração derivada (sobrescrevível por env var) ----
POSTGRES_SERVICE="${POSTGRES_SERVICE:-postgres}"
RCLONE_REMOTE="${RCLONE_REMOTE:-gdrive:${PROJECT}-backups}"
BACKUP_DIR="${BACKUP_DIR:-/home/lucas/backups/$PROJECT}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

# ---- JSON opcional ----
SERVER_SERVICE="${SERVER_SERVICE:-}"
SERVER_PORT="${SERVER_PORT:-3333}"
JSON_PATH="${JSON_PATH:-/api/backup/export}"

DATE="$(date +%F)"
mkdir -p "$BACKUP_DIR"

PG_CONTAINER="$(docker ps -qf "name=${PROJECT}-${POSTGRES_SERVICE}")"
[ -n "$PG_CONTAINER" ] || {
  echo "Container do Postgres não encontrado para '${PROJECT}-${POSTGRES_SERVICE}'" >&2
  exit 1
}

DUMP_FILE="$BACKUP_DIR/${PROJECT}-$DATE.dump"

# ---- Dump nativo (custom format, restaurável com pg_restore) ----
# Sem -t (TTY corromperia o binário). Variáveis expandidas DENTRO do container.
docker exec "$PG_CONTAINER" sh -c 'pg_dump -Fc -U "$POSTGRES_USER" "$POSTGRES_DB"' > "$DUMP_FILE"
rclone copy "$DUMP_FILE" "$RCLONE_REMOTE"

# ---- Export JSON (opcional) ----
if [ -n "$SERVER_SERVICE" ]; then
  SERVER_CONTAINER="$(docker ps -qf "name=${PROJECT}-${SERVER_SERVICE}")"
  if [ -n "$SERVER_CONTAINER" ]; then
    JSON_FILE="$BACKUP_DIR/${PROJECT}-$DATE.json"
    if docker exec "$SERVER_CONTAINER" wget -qO- "http://localhost:${SERVER_PORT}${JSON_PATH}" > "$JSON_FILE"; then
      [ -s "$JSON_FILE" ] && rclone copy "$JSON_FILE" "$RCLONE_REMOTE"
    else
      echo "Aviso: falha ao gerar o JSON (o .dump foi gerado mesmo assim)" >&2
    fi
  fi
fi

# ---- Rotação (local e remoto), escopada a este projeto ----
find "$BACKUP_DIR" -name "${PROJECT}-*.dump" -mtime "+$RETENTION_DAYS" -delete
find "$BACKUP_DIR" -name "${PROJECT}-*.json" -mtime "+$RETENTION_DAYS" -delete
rclone delete --min-age "${RETENTION_DAYS}d" "$RCLONE_REMOTE"

echo "Backup de '$PROJECT' concluído: $DUMP_FILE"
