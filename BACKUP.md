# Backup & Restore

O Media Tracker tem **três camadas** de backup, que se complementam:

| Camada | Formato | Onde | Restaura como |
| ------ | ------- | ---- | ------------- |
| Manual pelo app | JSON | seu HD / Drive | botão **Importar** (merge, não apaga) |
| Manual pelo app | `.dump` | seu HD / Drive | `pg_restore` (recuperação total) |
| Automático no VPS | `.dump` + JSON | Google Drive (rclone) | idem acima |

- **JSON** é portátil e restaura pelo próprio app (mescla os dados).
- **`.dump`** é o dump nativo do PostgreSQL (custom format), fiel ao banco inteiro — para o cenário de "perdi tudo, preciso recriar do zero".

---

## 1. Backup manual (pelo app)

Página **Configurações → Backup**:

- **Exportar JSON** — baixa `media-tracker-backup-AAAA-MM-DD.json`.
- **Baixar .dump** — baixa `media-tracker-backup-AAAA-MM-DD.dump` (gerado por `pg_dump` no backend).
- **Importar backup** — sobe um JSON e mescla (adiciona/atualiza, sem apagar).

Salve esses arquivos onde quiser (HD, Google Drive, etc.).

> O `.dump` só funciona porque a imagem do backend inclui o `postgresql16-client`
> (veja `backend/Dockerfile`).

---

## 2. Backup automático no VPS → Google Drive

Roda sozinho todo dia, independente de você abrir o app. Usa
[`rclone`](https://rclone.org) para enviar ao Google Drive, com rotação de 30 dias.

### 2.1. Instalar e configurar o rclone (uma vez)

```bash
# instalar
curl https://rclone.org/install.sh | sudo bash

# configurar o remote do Google Drive (interativo)
rclone config
#  n) New remote
#  name> gdrive
#  Storage> drive
#  client_id/secret> (Enter para usar os padrões)
#  scope> 1 (acesso total) ou 2 (somente arquivos criados pelo rclone)
#  Use auto config? Se o VPS não tem navegador, escolha "No" e siga o fluxo
#    "rclone authorize" a partir da sua máquina local com navegador.
```

Teste:

```bash
rclone mkdir gdrive:media-tracker-backups
rclone lsd gdrive:
```

### 2.2. Instalar o script

```bash
sudo mkdir -p /opt/media-tracker/scripts /opt/media-tracker/backups
sudo cp scripts/backup-to-gdrive.sh /opt/media-tracker/scripts/
sudo chmod +x /opt/media-tracker/scripts/backup-to-gdrive.sh
```

Ajuste, no topo do script, se seus caminhos forem diferentes:
`BACKUP_DIR`, `RCLONE_REMOTE`, `ENV_FILE` (onde estão `POSTGRES_USER`/`POSTGRES_DB`),
`RETENTION_DAYS`.

Rode uma vez na mão para validar:

```bash
/opt/media-tracker/scripts/backup-to-gdrive.sh
```

### 2.3. Agendar no cron (diário, 03:00)

```bash
crontab -e
```

```cron
0 3 * * * /opt/media-tracker/scripts/backup-to-gdrive.sh >> /var/log/media-tracker-backup.log 2>&1
```

---

## 3. Restaurar

### A partir do JSON (rápido, mescla)

App → **Configurações → Backup → Importar backup** → selecione o `.json`.

### A partir do `.dump` (recuperação total)

```bash
# nome do container do Postgres
PG=$(docker ps -qf name=media-tracker-postgres)

# restaura sobre o banco existente (recria objetos)
cat media-tracker-AAAA-MM-DD.dump | \
  docker exec -i "$PG" pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists
```

Para um banco vazio/novo, use `--create` em vez de `--clean --if-exists`.

### Baixar do Google Drive para o HD

```bash
rclone copy gdrive:media-tracker-backups ./backups-local
```
