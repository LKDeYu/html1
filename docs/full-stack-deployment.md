# Coordinate Zero 七服务部署与验收手册

更新时间：2026-06-12

本文件是《要求2》完成后的主要 ECS 操作手册。部署目标是一台阿里云 ECS 上的
单机多容器架构，适合课程展示高可用、反向代理、监控、日志分析、持久化和自动备份等云计算知识点。

## 1. 最终架构

```text
公网 :80
  -> Nginx
       -> round-robin -> Next.js web
                      -> Next.js web-replica
       -> /waline/* -> Waline -> MySQL -> coordinate-zero_mysql-data

仅 ECS 回环地址 :3001
  -> Uptime Kuma -> 内部监控 Nginx、两个 Web、Waline、MySQL

宿主机自动化
  -> collect-status.sh -> runtime/ops/*.json -> /admin/ops
  -> Nginx access.log -> GoAccess -> runtime/goaccess/report.html
                                -> /admin/traffic
  -> backup-mysql.sh -> /var/backups/coordinate-zero/mysql/*.sql.gz
```

Compose 包含七个服务：

```text
nginx
web
web-replica
waline
mysql
uptime-kuma
goaccess
```

新增镜像固定版本：

- Uptime Kuma：`louislam/uptime-kuma:2.4.0-slim`
- GoAccess：`allinurl/goaccess:1.10.2`

现有 Nginx、Waline、MySQL 镜像版本没有改变。Uptime Kuma 与 GoAccess 都是
辅助服务，不参与主网站启动依赖，也不挂载 Docker Socket。

## 2. 数据安全边界

- 不执行 `docker compose down -v`。
- 不删除、改名或重建 `coordinate-zero_mysql-data`。
- Uptime Kuma 使用独立 `uptime-kuma-data` volume。
- Nginx 日志保存在 `runtime/nginx`。
- GoAccess 报告保存在 `runtime/goaccess`。
- Ops JSON 保存在 `runtime/ops`。
- MySQL 备份保存在 `/var/backups/coordinate-zero/mysql`。
- Web 容器只读挂载 Ops JSON 与 GoAccess 报告。
- `/admin/ops` 和 `/admin/traffic` 共用 HMAC 签名管理员会话。
- 页面不提供 Shell、重启、删除、封禁、备份、下载或恢复操作。

## 3. 部署前保护

在 ECS 上进入项目：

```bash
cd /var/www/coordinate-zero
git status --short
docker compose ps
docker volume ls | grep coordinate-zero
```

先创建数据库备份：

```bash
sudo PROJECT_DIR=$PWD ./deploy/ops/backup-mysql.sh
ls -lh /var/backups/coordinate-zero/mysql
```

建议同时在阿里云控制台创建 ECS 系统盘快照。确认现有评论、Waline 登录和公网
首页正常后再更新。

## 4. ECS 镜像预检与兜底导入

首次把旧 ECS 从四服务扩展到七服务前，先运行预检脚本。它只读检查 Compose
声明、ECS 本地镜像、当前运行服务和 timers 状态，不会启动、停止、拉取或删除
任何容器：

```bash
cd /var/www/coordinate-zero
sudo chmod +x deploy/full-stack/preflight-seven-service.sh
PROJECT_DIR=$PWD ./deploy/full-stack/preflight-seven-service.sh
```

如果缺少 Uptime Kuma 或 GoAccess 镜像，可以先尝试当前 ECS 可用的镜像源。示例：

```bash
docker pull m.daocloud.io/docker.io/louislam/uptime-kuma:2.4.0-slim
docker tag m.daocloud.io/docker.io/louislam/uptime-kuma:2.4.0-slim louislam/uptime-kuma:2.4.0-slim
docker image inspect louislam/uptime-kuma:2.4.0-slim >/dev/null
```

不要在 Compose 中改成 `latest`。如果 DaoCloud 返回 `403`，或 Docker Hub 对
`allinurl/goaccess:1.10.2` 返回 `not found`，使用本地已有镜像导出上传：

```bash
# 在本地电脑执行
docker image inspect allinurl/goaccess:1.10.2
docker save allinurl/goaccess:1.10.2 -o allinurl-goaccess-1.10.2.tar
scp allinurl-goaccess-1.10.2.tar root@ECS公网IP:/var/www/coordinate-zero/deploy/images/
```

```bash
# 在 ECS 执行
cd /var/www/coordinate-zero
mkdir -p deploy/images
docker load -i deploy/images/allinurl-goaccess-1.10.2.tar
docker image inspect allinurl/goaccess:1.10.2 >/dev/null
PROJECT_DIR=$PWD ./deploy/full-stack/preflight-seven-service.sh
```

## 5. 更新与启动

```bash
cd /var/www/coordinate-zero
git pull --ff-only origin main

sudo PROJECT_DIR=$PWD \
  OPS_BACKUP_DIR=/var/backups/coordinate-zero/mysql \
  ./deploy/full-stack/prepare-runtime.sh

docker compose config --quiet
docker compose build web
docker compose up -d --pull never
docker compose ps
```

这是首次七服务上线命令，适用于更新前 ECS 只有 `mysql`、`nginx`、`waline`、
`web` 等旧四服务的情况。`web` 构建一次镜像，`web-replica` 复用同一镜像并通过
`WEB_REPLICA_ID` 区分实例。`--pull never` 防止启动时再次访问不稳定的远端仓库，
因此第 4 节的镜像预检必须先通过。

如果 ECS 已经是七服务完整运行，以后常规更新 Web 和 Nginx 时可以只重建入口服务：

```bash
docker compose config --quiet
docker compose up -d --build --pull never web web-replica nginx
docker compose ps
```

安装自动任务：

```bash
sudo PROJECT_DIR=$PWD \
  OPS_BACKUP_DIR=/var/backups/coordinate-zero/mysql \
  ./deploy/ops/install-systemd-timers.sh
```

安装器会先执行 Shell 语法检查和 Python 编译检查，然后安装：

- `coordinate-zero-collect.timer`：每 5 分钟。
- `coordinate-zero-goaccess.timer`：每 5 分钟。
- `coordinate-zero-backup.timer`：北京时间每天 03:30。
- `/etc/logrotate.d/coordinate-zero-nginx`：每天或 20 MB 轮转，保留 7 份。

可重复执行安装器。它不会运行恢复脚本，也不会修改 MySQL volume。

## 6. 首次生成运行数据

```bash
sudo PROJECT_DIR=$PWD ./deploy/ops/collect-status.sh
sudo PROJECT_DIR=$PWD ./deploy/goaccess/generate-report.sh
sudo PROJECT_DIR=$PWD ./deploy/ops/backup-mysql.sh

ls -lh runtime/ops
ls -lh runtime/goaccess/report.html
ls -lh /var/backups/coordinate-zero/mysql
```

如果 access log 尚为空，先从浏览器访问首页、博客和 Waline，再生成 GoAccess
报告。

## 7. Uptime Kuma 人工配置

Kuma 只映射到 ECS 的 `127.0.0.1:3001`，安全组不要开放 `3001`。在自己的
Windows 电脑建立 SSH 隧道：

```powershell
ssh -L 3001:127.0.0.1:3001 root@ECS公网IP
```

保持终端运行，浏览器打开 `http://127.0.0.1:3001`，创建 Kuma 管理员账号。

创建五个监控项：

| 名称 | 类型 | 地址 |
| --- | --- | --- |
| Nginx Entry | HTTP | `http://nginx/` |
| Web Primary | HTTP | `http://web:3000/api/health` |
| Web Replica | HTTP | `http://web-replica:3000/api/health` |
| Waline | HTTP | `http://waline:8360/` |
| MySQL | TCP Port | `mysql:3306` |

建议周期为 60 或 120 秒，连续失败 3 次后告警，并启用恢复通知。

Gmail SMTP 在 Kuma UI 中手工配置：

```text
SMTP Host: smtp.gmail.com
Port: 465
Security: SSL/TLS
Username: yuany257093418@gmail.com
From: yuany257093418@gmail.com
To: yuany257093418@gmail.com
Password: 用户自行创建的 Google 应用专用密码
```

用户需要自行开启 Google 两步验证、创建应用专用密码并点击测试通知。密码不
写入项目、`.env` 或脚本。同机 Kuma 无法在整台 ECS 宕机时发送异地告警。

公网外部监控建议同时使用 UptimeRobot、HetrixTools 和 Better Stack。它们不能
监控本地 `localhost`，只能在 ECS 公网 IP 或域名可访问后验证。将状态页链接写入
ECS `.env` 后，管理员面板会显示对应入口：

```env
NEXT_PUBLIC_UPTIMEROBOT_STATUS_URL=https://stats.uptimerobot.com/WVRRUbWXeI
NEXT_PUBLIC_HETRIXTOOLS_STATUS_URL=https://hetrixtools.com/r/76b59e349672cb4a3983adbe516cb511/
NEXT_PUBLIC_BETTERSTACK_STATUS_URL=https://coordinate-zero.betteruptime.com/
```

## 8. 双 Web 验收

查看轮询：

```bash
for i in $(seq 1 12); do
  curl -s http://127.0.0.1/api/instance
  echo
done
```

输出中应同时出现 `web-primary` 和 `web-replica`。

执行自动故障演练：

```bash
sudo PROJECT_DIR=$PWD BASE_URL=http://127.0.0.1 \
  ./deploy/ha/test-web-failover.sh
```

脚本依次停止一个 Web 副本，检查首页、博客、Waline、管理员登录页和健康接口，
并通过 `trap` 尽量恢复被停止的服务。演练后再次执行 `docker compose ps`。

## 9. GoAccess 与管理员页面验收

```bash
sudo PROJECT_DIR=$PWD ./deploy/goaccess/generate-report.sh
test -s runtime/goaccess/report.html
systemctl status coordinate-zero-goaccess.timer --no-pager
```

浏览器登录 `/admin/ops` 后访问 `/admin/traffic`。未登录访问
`/admin/traffic` 应跳转登录页，未登录请求 `/api/admin/traffic` 应返回 `401`。

Nginx 日志同时保留：

```bash
docker compose logs --tail 100 nginx
tail -n 100 runtime/nginx/access.log
```

GoAccess 报告隐藏查询参数但保留完整访问 IP；Ops JSON 同样保留完整 IP，便于
管理员排查可疑访问。两者都只能在管理员登录后读取，不能把 `runtime/ops` 或
`runtime/goaccess` 目录直接公开。

## 10. 备份与恢复验收

检查 timer 与最近备份：

```bash
systemctl list-timers 'coordinate-zero-*' --no-pager
sudo systemctl start coordinate-zero-backup.service
sudo journalctl -u coordinate-zero-backup.service -n 50 --no-pager

latest="$(find /var/backups/coordinate-zero/mysql -name 'waline-*.sql.gz' \
  -type f -printf '%T@ %p\n' | sort -nr | head -n1 | cut -d' ' -f2-)"
gzip -t "$latest"
echo "$latest"
```

恢复仅允许 SSH 手工执行。先做无破坏校验：

```bash
sudo OPS_BACKUP_DIR=/var/backups/coordinate-zero/mysql \
  ./deploy/ops/restore-mysql.sh --check "$latest"
```

真正恢复必须显式使用 `--confirm`，脚本会先再创建一份备份：

```bash
sudo PROJECT_DIR=$PWD \
  OPS_BACKUP_DIR=/var/backups/coordinate-zero/mysql \
  ./deploy/ops/restore-mysql.sh --confirm "$latest"
```

不要在生产演示前随意执行真实恢复。

## 11. 一键只读验收

```bash
sudo PROJECT_DIR=$PWD \
  OPS_BACKUP_DIR=/var/backups/coordinate-zero/mysql \
  ./deploy/full-stack/verify-stack.sh
```

该脚本只读检查七个服务、三个 healthcheck、HTTP 路径、双副本轮询、GoAccess
报告、timers、最近备份、容器资源、内存和磁盘；不会停止或重启服务。

独立资源检查：

```bash
docker stats --no-stream
free -h
df -h
```

ECS 为 2 vCPU / 4 GB RAM。若空闲内存长期过低，优先降低 GoAccess 更新频率。
第二个 Web 副本会增加内存占用，课程演示前应记录一次实际资源截图。

## 12. HTTP 运维面板

当前仍使用 HTTP 时，仅可临时设置：

```env
ADMIN_TOKEN=至少32位随机字符串
OPS_ALLOW_INSECURE_HTTP=true
```

然后只重建两个 Web 服务：

```bash
docker compose up -d --build --pull never web web-replica nginx
```

HTTP 测试模式下口令和会话没有传输加密，只能在可信网络短期验收。配置域名和
HTTPS 后必须改回：

```env
OPS_ALLOW_INSECURE_HTTP=false
```

并重新创建两个 Web 容器。

## 13. 安全卸载 timers

```bash
sudo ./deploy/ops/uninstall-systemd-timers.sh
```

该脚本不删除 `runtime`、备份、容器或 Docker volumes。

## 14. 回滚

出现问题时先收集证据：

```bash
docker compose ps
docker compose logs --tail 200 nginx web web-replica waline mysql
git log --oneline -10
```

立即回到本里程碑前版本可使用提交 `b7862a6`：

```bash
sudo ./deploy/ops/uninstall-systemd-timers.sh
git switch --detach b7862a6
docker compose config --quiet
docker compose up -d --build --pull never
```

不要使用 `down -v`。`.env`、`runtime`、备份目录和 MySQL volume 不受 Git
切换影响。确认修复后回到新版本：

```bash
git switch main
git pull --ff-only origin main
```

## 15. 用户必须手工完成

1. 在 Google 账户开启两步验证。
2. 创建 Gmail 应用专用密码。
3. 通过 SSH 隧道首次进入 Uptime Kuma。
4. 创建 Kuma 管理员账号和五个监控项。
5. 在 Kuma UI 中配置 SMTP 并发送测试通知。
6. 在 ECS 执行最终更新、启动和 systemd 安装命令。
7. 自行填写 `ADMIN_TOKEN`；不要把口令或 Gmail 密码发到 Git。
8. 验收首页、博客、Waline 登录评论和已有评论。
