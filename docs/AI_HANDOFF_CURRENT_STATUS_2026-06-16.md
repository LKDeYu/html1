# Coordinate Zero 云计算大作业交接摘要

更新时间：2026-06-16
项目路径：`F:\code\experiment\Cloud Computing\namranta-portfolio`
分支状态：`main` 本地领先 `origin/main` 1 个历史提交，当前还有未提交改动。

## 1. 项目目标

本项目是云计算大作业：在单台阿里云 ECS 上部署个人内容站和登录评论系统，并扩展为可观测、可备份、可演示的多容器 Web 架构。

推荐题目表述：

> 基于 ECS 与 Docker Compose 的个人内容站及登录评论系统部署实践

核心技术点：

- 阿里云 ECS
- Docker Compose
- Nginx 反向代理
- Next.js 前端
- Waline 评论后端
- MySQL 持久化
- Uptime Kuma 内部监控
- GoAccess 访问日志分析
- 只读管理员运维面板
- MySQL 自动备份与恢复脚本
- 外部可用性监控

## 2. 当前架构

```text
互联网用户
  -> ECS 公网 IP:80
  -> Nginx 容器
       |-- /              -> Next.js web:3000
       |-- /              -> Next.js web-replica:3000
       |-- /waline/*      -> Waline:8360
       |-- /admin/ops     -> 只读运维面板
       `-- /admin/traffic -> GoAccess 报告

Waline
  -> MySQL 容器
  -> mysql-data Docker volume

宿主机定时任务
  -> collect-status.sh
  -> runtime/ops/*.json
  -> /admin/ops

Nginx access.log
  -> GoAccess
  -> runtime/goaccess/report.html
  -> /admin/traffic

backup-mysql.sh
  -> /var/backups/coordinate-zero/mysql/*.sql.gz
  -> runtime/ops/backup-status.json
```

当前 Compose 七个服务：

- `nginx`
- `web`
- `web-replica`
- `waline`
- `mysql`
- `uptime-kuma`
- `goaccess`

本地 Docker 当前已重建并运行，七个服务正常，两个 Web 容器 healthy。

## 3. 已完成功能

### 网站与评论

- Next.js 个人站可访问首页、博客首页、文章页。
- 每篇博客文章正文下方已接入 Waline 评论区。
- 评论区标题只保留 `Comments / 评论`。
- Waline 使用 `LOGIN=force`，游客可以查看但不能评论。
- Waline 使用 MySQL 保存评论和用户数据。
- GitHub OAuth/账号绑定逻辑本地曾验证过，但正式部署仍建议优先用 Waline 默认账号登录。

### 容器与高可用演示

- `web` 与 `web-replica` 双副本。
- Nginx 对两个 Web 副本做轮询与故障转移。
- `/api/instance` 可显示当前响应副本，用于演示负载均衡。
- 不开放 `3000`、`3001`、`3306`、`8360` 到公网。

### 运维与监控

- Uptime Kuma 已在本地配置完成。
- GoAccess 可查看 Nginx 访问分析报告。
- `/admin/ops` 已升级为专业 Dashboard 风格：
  - 服务状态
  - ECS/主机资源
  - 24 小时请求趋势
  - 状态码分布
  - 访问来源分类
  - Top 路径
  - Top IP
  - 可疑访问事件
  - MySQL 备份状态
  - 外部监控入口
- `/admin/traffic` 受同一管理员会话保护。
- 管理员面板仍然只读，不提供重启、删除、封禁、恢复数据库或 Shell 执行按钮。

### 外部监控

用户已配置三套公网外部监控：

```env
NEXT_PUBLIC_UPTIMEROBOT_STATUS_URL=https://stats.uptimerobot.com/WVRRUbWXeI
NEXT_PUBLIC_BETTERSTACK_STATUS_URL=https://coordinate-zero.betteruptime.com/
NEXT_PUBLIC_HETRIXTOOLS_STATUS_URL=https://hetrixtools.com/r/76b59e349672cb4a3983adbe516cb511/
```

本地 `.env` 已写入这三行，但 `.env` 被 Git 忽略，不会提交。ECS 上也需要手动写入。

说明：

- 外部监控无法测试本地 `localhost`。
- 只有 ECS 公网 IP 或域名可访问后，UptimeRobot、HetrixTools、Better Stack 才能探测。
- 境外节点访问阿里云偶发超时是合理现象，报告中可写成局限与多服务交叉验证。

### IP 展示

用户已确认管理员页面要显示完整 IP。

当前实现：

- `/admin/ops` 的 Top IP、最近访问、可疑事件显示完整 IP。
- GoAccess 报告也取消了 `--anonymize-ip`。
- URL 和 Referer 仍会去掉查询参数。
- Cookie、Authorization、请求正文、数据库密码、`.env` 不会进入面板 API。

## 4. 最近一轮代码改动

主要修改文件：

- `src/components/ops-dashboard.tsx`
- `src/app/globals.css`
- `src/app/admin/ops/page.tsx`
- `src/lib/ops/types.ts`
- `src/lib/ops/read-ops-data.ts`
- `src/lib/ops/mock-data.ts`
- `deploy/ops/collect_ops.py`
- `deploy/goaccess/generate-report.sh`
- `docker-compose.yml`
- `Dockerfile`
- `deploy/compose.env.example`
- 相关部署文档

新增依赖：

```json
"recharts": "..."
```

新增/调整的数据字段：

- `access.requestsByHour[]`
  - `time`
  - `requests`
  - `errors`
  - `notFound`
  - `serverErrors`

## 5. 已通过验证

已执行并通过：

```powershell
npm run test:ops
npm run lint
npm run build
docker compose config --quiet
docker compose build --pull=false web
docker compose up -d --no-deps --force-recreate web web-replica
```

Python 与 Shell 验证：

```bash
python test_collect_ops.py
python test_backup_status.py
python -m py_compile collect_ops.py write_backup_status.py
bash -n deploy/ops/collect-status.sh deploy/ops/backup-mysql.sh deploy/ops/restore-mysql.sh deploy/goaccess/generate-report.sh deploy/full-stack/verify-stack.sh
```

容器验证：

- `web` healthy
- `web-replica` healthy
- `mysql` healthy
- `uptime-kuma` healthy
- `nginx`、`waline`、`goaccess` running

采集验证：

- `runtime/ops/access-summary.json` 已生成 `requestsByHour`，共 24 个点。
- Top IP 已显示完整 Docker 内部 IP，例如 `172.18.0.1`。
- GoAccess 报告重新生成后可看到完整 IP。

注意：本地用 Bash 执行脚本时，项目路径里的空格曾导致命令麻烦；这只影响本地 WSL 调试。ECS 路径 `/var/www/coordinate-zero` 无空格，不受影响。

## 6. 当前 Git 状态

当前状态：

- `main...origin/main [ahead 1]`
- 有一批已修改但未提交的代码和文档。
- 有几个未跟踪文档：
  - `docs/云计算大作业工作日志.md`
  - `docs/当前情况.md`
  - `docs/管理员面板.md`

不要直接 `git add .`，避免把不想提交的资料文档一起提交。

建议提交本轮代码时，明确挑选文件。

## 7. 重要安全约束

不要提交：

- `.env`
- `ADMIN_TOKEN`
- MySQL 密码
- Waline `JWT_TOKEN`
- Gmail 应用专用密码
- ECS SSH 私钥
- 任何数据库备份文件

不要执行：

```bash
docker compose down -v
```

不要向公网开放：

- `3000`
- `3001`
- `3306`
- `8360`

管理员面板只能只读，不应新增远程执行、重启、删除、封禁、恢复数据库等网页按钮。

## 8. 后续可扩展方向

优先级较高：

- ECS 拉取更新，写入三套外部监控状态页链接。
- 如果 ECS 仍是旧四服务状态，先运行 `deploy/full-stack/preflight-seven-service.sh`，
  确认七服务镜像都已在 ECS 本地可用。
- 首次从四服务扩展到七服务时，使用 `docker compose up -d --pull never` 启动完整
  Compose，不要只启动 `web`、`web-replica`、`nginx`。
- 若缺少 `allinurl/goaccess:1.10.2` 且镜像源拉取失败，从本地执行 `docker save`
  后通过 `scp` 上传 ECS，再用 `docker load` 导入。
- 运行 `verify-stack.sh` 前必须先执行 `deploy/ops/install-systemd-timers.sh`，否则
  三个 systemd timer 检查会必然失败。
- 重新运行采集、GoAccess 和验证脚本。
- 截图整理课程报告。

后续扩展：

- 域名、备案、HTTPS。
- HTTPS 后关闭 `OPS_ALLOW_INSECURE_HTTP`。
- 使用 CrowdSec 读取 Nginx 日志做更专业的恶意访问检测，第一阶段只做检测，不做封禁。
- 阿里云内部监控作为付费扩展方向。
