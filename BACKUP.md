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

### 2.1. Conta e credenciais do Google (uma vez)

Decisões de segurança adotadas:

- **Conta Google dedicada** só para backups (Drive isolado do pessoal).
- **Escopo `drive.file`** (opção `3` no rclone): o rclone só enxerga os arquivos
  que **ele mesmo cria** — mesmo que o token vaze, o resto do Drive fica intocado.
- **App OAuth publicado em produção** (não "Testing"): evita o erro
  `403 access_denied` e a **expiração de token a cada 7 dias** do modo de teste.

No Google Cloud Console (com a conta dona do projeto OAuth):
`APIs e serviços → Tela de consentimento OAuth → Publicar app` (Testing → In
production). Não precisa enviar para verificação; o aviso "app não verificado" é
contornável em `Avançado → Acessar (não seguro)`.

### 2.2. Instalar e configurar o rclone (uma vez)

```bash
# instalar
curl https://rclone.org/install.sh | sudo bash

# configurar o remote (interativo)
rclone config
#  n) New remote
#  name> gdrive
#  Storage> drive
#  client_id/secret> (cole o Client ID/Secret do app OAuth criado no Cloud Console)
#  scope> 3            <-- drive.file: só os arquivos que o rclone criar
#  Edit advanced config? n
#  Use web browser to automatically authenticate? n   (VPS sem navegador)
#    -> rode o "rclone authorize \"drive\" \"...\"" numa máquina com navegador
#       e FAÇA LOGIN COM A CONTA DEDICADA DE BACKUP; cole o token de volta.
```

> Com `drive.file` o rclone não lista pastas que não criou (`rclone lsd gdrive:`
> pode vir vazio) — isso é esperado. A verificação real é rodar um backup e
> conferir com `rclone ls gdrive:<projeto>-backups`.

### 2.3. Instalar o script genérico (uma vez, lugar central)

Um único script (`scripts/backup-generic.sh`) atende **todos** os projetos: recebe
o nome do projeto como argumento e deriva containers, pasta no Drive e pasta local.
Fica fora dos repositórios, em `/home/lucas/scripts/`:

```bash
cd /home/lucas/stash && git pull
mkdir -p /home/lucas/scripts
cp scripts/backup-generic.sh /home/lucas/scripts/
chmod +x /home/lucas/scripts/backup-generic.sh
```

Teste manual (o `SERVER_SERVICE=server` liga também o export JSON):

```bash
SERVER_SERVICE=server /home/lucas/scripts/backup-generic.sh media-tracker
rclone ls gdrive:media-tracker-backups
```

Convenções e overrides do script: veja [`BACKUP-NOTES.md`](./BACKUP-NOTES.md) §11.

### 2.4. Agendar no cron (diário, 03:00)

```bash
crontab -e
```

```cron
0 3 * * * SERVER_SERVICE=server /home/lucas/scripts/backup-generic.sh media-tracker >> /home/lucas/backups/media-tracker.log 2>&1
```

Para cada **novo projeto**, basta adicionar uma linha análoga (trocando o nome do
projeto). Adicione `SERVER_SERVICE=server` só se o projeto tiver a rota de export
JSON; senão o backup gera apenas o `.dump`.

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
