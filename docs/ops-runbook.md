# Coordinate Zero 只读运维与备份手册

## 1. 实现边界

本阶段新增三类能力：

- Next.js `/admin/ops` 只读面板，仅读取 `runtime/ops/*.json`。
- ECS 宿主机每 5 分钟采集服务状态和最近 24 小时 Nginx 访问摘要。
- ECS 宿主机每天 03:30 备份 Waline 使用的 MySQL 数据库。

面板不能执行 Shell，不能访问 Docker Socket，也没有重启、删除、恢复或封禁按钮。
数据库恢复只能通过 SSH 手工执行。

默认情况下，生产构建的登录 Cookie 强制使用 `Secure`，因此 HTTP 站点不能完成
会话登录。如需在当前 HTTP 阶段临时验收面板，必须在 ECS 服务端显式设置
`OPS_ALLOW_INSECURE_HTTP=true`。这会关闭运维会话 Cookie 的 `Secure` 属性，管理员
口令和会话将不再经过传输加密，只能在可信网络中短期测试，不能作为长期配置。

## 2. 文件与数据流

```text
ECS cron
  -> deploy/ops/collect-status.sh
  -> docker compose ps + Nginx/Waline 有界日志
  -> deploy/ops/collect_ops.py 清洗与聚合
  -> runtime/ops/status.json
  -> runtime/ops/access-summary.json
  -> runtime/ops/security-events.json

ECS cron
  -> deploy/ops/backup-mysql.sh
  -> mysqldump from mysql container
  -> /var/backups/coordinate-zero/mysql/*.sql.gz
  -> runtime/ops/backup-status.json

Browser
  -> Nginx
  -> Next.js /api/admin/ops
  -> read-only bind mount /app/runtime/ops
```

URL、Referer 的查询参数不会写入面板 JSON。User-Agent 会截断。面板不返回原始日志、
Cookie、Authorization、请求体、数据库密码或 `.env` 内容。

## 3. 更新前保护

在 ECS 上先确认项目目录和工作区：

```bash
cd /var/www/coordinate-zero
rm -f docker-compose.yml.bak
git status --short
```

在拉取新代码前执行一次手工备份：

```bash
sudo mkdir -p /var/backups/coordinate-zero/mysql
sudo chmod 700 /var/backups/coordinate-zero/mysql

BACKUP_FILE="/var/backups/coordinate-zero/mysql/pre-ops-$(date +%Y%m%d-%H%M%S).sql.gz"
docker compose exec -T mysql sh -c \
  'MYSQL_PWD="$MYSQL_PASSWORD" exec mysqldump --user="$MYSQL_USER" --single-transaction --quick --lock-tables=false --set-gtid-purged=OFF --no-tablespaces "$MYSQL_DATABASE"' \
  | gzip -c | sudo tee "$BACKUP_FILE" >/dev/null

sudo gzip -t "$BACKUP_FILE"
sudo ls -lh "$BACKUP_FILE"
```

同时在阿里云控制台为 ECS 系统盘创建一次快照。禁止执行
`docker compose down -v`。

## 4. 拉取与初始化

```bash
cd /var/www/coordinate-zero
git pull origin main

sudo timedatectl set-timezone Asia/Shanghai
sudo mkdir -p runtime/ops /var/backups/coordinate-zero/mysql
sudo chmod 755 runtime runtime/ops
sudo chmod 700 /var/backups/coordinate-zero/mysql
sudo chmod +x deploy/ops/*.sh deploy/ops/*.py
```

编辑 ECS 的 `.env`。默认安全配置为：

```env
ADMIN_TOKEN=
OPS_ALLOW_INSECURE_HTTP=false
OPS_BACKUP_DIR=/var/backups/coordinate-zero/mysql
OPS_BACKUP_RETENTION=7
NEXT_PUBLIC_UPTIME_STATUS_URL=
```

## 5. 首次采集与备份

```bash
cd /var/www/coordinate-zero
sudo ./deploy/ops/collect-status.sh
sudo ./deploy/ops/backup-mysql.sh

python3 -m json.tool runtime/ops/status.json
python3 -m json.tool runtime/ops/access-summary.json
python3 -m json.tool runtime/ops/security-events.json
python3 -m json.tool runtime/ops/backup-status.json

sudo find /var/backups/coordinate-zero/mysql -maxdepth 1 -name '*.sql.gz' -ls
```

备份文件校验：

```bash
LATEST_BACKUP="$(sudo find /var/backups/coordinate-zero/mysql -maxdepth 1 \
  -name 'waline-*.sql.gz' -printf '%T@ %p\n' | sort -nr | head -1 | cut -d' ' -f2-)"
sudo ./deploy/ops/restore-mysql.sh --check "$LATEST_BACKUP"
```

`--check` 只做路径与 gzip 完整性检查，不会修改数据库。

## 6. 安装定时任务

```bash
cd /var/www/coordinate-zero
sudo cp deploy/ops/coordinate-zero-ops.cron.example \
  /etc/cron.d/coordinate-zero-ops
sudo chmod 644 /etc/cron.d/coordinate-zero-ops
sudo systemctl restart cron
sudo systemctl status cron --no-pager
```

检查执行记录：

```bash
sudo tail -n 100 /var/log/coordinate-zero-ops.log
sudo tail -n 100 /var/log/coordinate-zero-backup.log
```

## 7. 更新 Web 容器

只重建 Web；不要删除或重建 MySQL volume：

```bash
cd /var/www/coordinate-zero
docker compose config --quiet
docker compose up -d --build web
docker compose up -d nginx
docker compose ps
```

未配置 `ADMIN_TOKEN` 时，访问 `/admin/ops/login` 应看到“尚未配置
ADMIN_TOKEN”，API 应返回 `503`。网站首页、博客、Waline 登录评论和已有评论必须
保持正常。

## 8. 临时 HTTP 测试

仅在需要通过公网 IP 临时验收运维面板、且当前网络可信时使用。在 ECS 本机生成
至少 32 位的独立口令：

```bash
openssl rand -hex 32
```

把结果只写入 ECS `.env`，不要发送到聊天、截图或提交 Git：

```env
ADMIN_TOKEN=这里填写刚生成的随机字符串
OPS_ALLOW_INSECURE_HTTP=true
```

重新创建 Web 容器：

```bash
docker compose up -d --build web
```

登录页会显示传输未加密警告，面板顶部会显示“HTTP 测试模式”标签。测试结束后应将
`ADMIN_TOKEN` 清空，并把 `OPS_ALLOW_INSECURE_HTTP` 改回 `false`，然后再次执行：

```bash
docker compose up -d --force-recreate web
```

## 9. HTTPS 后正式启用面板

域名、证书和 Nginx HTTPS 配置完成后，在 ECS `.env` 中设置：

```env
ADMIN_TOKEN=至少32位的独立随机字符串
OPS_ALLOW_INSECURE_HTTP=false
```

如果 HTTP 测试时配置过 `OPS_ALLOW_INSECURE_HTTP=true`，必须删除该行或改为
`false`，并重新创建 Web 容器：

```bash
docker compose up -d --force-recreate web
```

登录会话有效期为 12 小时。Cookie 保存 HMAC 签名，不保存明文 Token，并设置
`HttpOnly`、`SameSite=Lax`、`Secure`。

## 10. 手工恢复

恢复会覆盖当前 Waline 数据。仅在确认需要恢复时通过 SSH 执行：

```bash
sudo ./deploy/ops/restore-mysql.sh --confirm \
  /var/backups/coordinate-zero/mysql/waline-YYYYMMDD-HHMMSS.sql.gz
```

脚本会先自动创建一份恢复前备份，再导入指定文件。恢复后立即验证 Waline 管理员
登录、文章评论读取和新增评论，不在生产库上做破坏性演练。

## 11. 验收截图

- `runtime/ops` 四个 JSON 的格式化输出。
- `docker compose ps` 四个容器状态。
- 采集定时任务和每日备份定时任务。
- `.sql.gz` 文件、大小和 `restore-mysql.sh --check` 成功结果。
- HTTPS 完成后的运维面板服务状态、访问摘要、风险事件和备份状态。
- 面板没有任何重启、删除、恢复或封禁操作。
