# 下一步执行计划

更新时间：2026-06-16

## 目标

把当前本地已经通过测试的七服务架构和新版管理员面板，稳定交付到 ECS，并完成课程报告所需的截图、论述材料和最终代码提交。

## 阶段 1：本地最终审核

由用户执行浏览器审核，确认新版面板是否满足展示要求。

访问入口：

```text
http://localhost/
http://localhost/blog/home
http://localhost/admin/ops
http://localhost/admin/traffic
http://127.0.0.1:3001
```

重点检查：

- `/admin/ops` 是否显示专业 Dashboard 布局。
- 折线图、饼图、条形图是否正常显示。
- External Monitoring 区是否显示：
  - UptimeRobot
  - Better Stack
  - HetrixTools
- Top IP 是否显示完整 IP。
- 最近访问表格是否显示完整 IP。
- 可疑访问表格是否可读。
- 备份状态是否仍正常。
- `/admin/traffic` 是否能打开 GoAccess 报告。
- 网站首页、博客、Waline 评论是否未被破坏。

如页面样式不满意，优先微调：

- 卡片密度
- 颜色
- 表格列宽
- 移动端布局
- 图表高度

## 阶段 2：整理 Git 提交

当前不建议直接执行 `git add .`。

建议提交本轮必要文件：

```powershell
git add Dockerfile `
  deploy/compose.env.example `
  deploy/goaccess/generate-report.sh `
  deploy/ops/collect_ops.py `
  deploy/ops/test_collect_ops.py `
  docker-compose.yml `
  docs/CLOUD_DEPLOYMENT_HANDOFF.md `
  docs/cloud-assignment-report-notes.md `
  docs/full-stack-deployment.md `
  docs/goaccess.md `
  docs/ops-runbook.md `
  docs/AI_HANDOFF_CURRENT_STATUS_2026-06-16.md `
  docs/NEXT_EXECUTION_PLAN_2026-06-16.md `
  package.json `
  package-lock.json `
  src/app/admin/ops/page.tsx `
  src/app/globals.css `
  src/components/ops-dashboard.tsx `
  src/lib/ops/mock-data.ts `
  src/lib/ops/read-ops-data.test.mts `
  src/lib/ops/read-ops-data.ts `
  src/lib/ops/types.ts
```

提交前再跑：

```powershell
npm run test:ops
npm run lint
npm run build
docker compose config --quiet
git diff --cached --check
```

建议提交信息：

```bash
git commit -m "feat: upgrade operations dashboard analytics"
```

推送：

```bash
git push origin main
```

## 阶段 3：ECS 更新

登录 ECS：

```bash
ssh root@你的ECS公网IP
cd /var/www/coordinate-zero
```

更新前保护：

```bash
git status --short
docker compose ps
sudo PROJECT_DIR=$PWD OPS_BACKUP_DIR=/var/backups/coordinate-zero/mysql ./deploy/ops/backup-mysql.sh
```

拉取代码：

```bash
git pull --ff-only origin main
```

编辑 ECS `.env`，加入三套外部监控状态页链接：

```env
NEXT_PUBLIC_UPTIMEROBOT_STATUS_URL=https://stats.uptimerobot.com/WVRRUbWXeI
NEXT_PUBLIC_BETTERSTACK_STATUS_URL=https://coordinate-zero.betteruptime.com/
NEXT_PUBLIC_HETRIXTOOLS_STATUS_URL=https://hetrixtools.com/r/76b59e349672cb4a3983adbe516cb511/
```

如果当前仍用 HTTP 临时测试管理员面板，保留：

```env
OPS_ALLOW_INSECURE_HTTP=true
```

HTTPS 正式启用后必须改为：

```env
OPS_ALLOW_INSECURE_HTTP=false
```

重建 Web，不删除数据库 volume：

```bash
docker compose config --quiet
docker compose up -d --build --pull never web web-replica nginx
docker compose ps
```

刷新采集和 GoAccess：

```bash
sudo PROJECT_DIR=$PWD ./deploy/ops/collect-status.sh
sudo PROJECT_DIR=$PWD ./deploy/goaccess/generate-report.sh
```

运行只读验证：

```bash
sudo PROJECT_DIR=$PWD OPS_BACKUP_DIR=/var/backups/coordinate-zero/mysql ./deploy/full-stack/verify-stack.sh
```

## 阶段 4：ECS 页面验收

浏览器访问：

```text
http://ECS公网IP/
http://ECS公网IP/blog/home
http://ECS公网IP/admin/ops
http://ECS公网IP/admin/traffic
```

检查：

- 首页打开。
- 博客打开。
- 评论区显示。
- 未登录不能评论。
- 登录后能评论。
- 管理员面板可登录。
- 管理员面板显示新版图表。
- 外部监控入口可点击。
- GoAccess 报告可打开。
- Top IP 显示完整 IP。
- MySQL 备份状态显示正常。

如果外部监控偶发超时：

- 不急着改项目。
- 记录为境外探测节点访问阿里云网络不稳定。
- 使用 UptimeRobot、HetrixTools、Better Stack 三套服务交叉观察。
- 报告中说明阿里云内部监控可作为后续付费扩展。

## 阶段 5：课程报告截图清单

建议截图：

- ECS 实例运行状态。
- 安全组只开放 `22`、`80`，后续 HTTPS 增加 `443`。
- `docker compose ps` 七服务运行。
- `docker volume ls` 显示 MySQL volume。
- 首页。
- 博客首页。
- 文章评论区。
- 未登录不能评论。
- 登录后评论成功。
- `/api/instance` 显示双副本轮询。
- 停止一个 Web 副本后网站仍可访问。
- Uptime Kuma 五个内部监控项。
- UptimeRobot 状态页。
- Better Stack 状态页。
- HetrixTools 状态页。
- `/admin/ops` 新版 Dashboard。
- `/admin/traffic` GoAccess 报告。
- `runtime/ops/*.json` 生成。
- MySQL `.sql.gz` 备份和 gzip 校验。
- systemd timers 或 cron 配置。

## 阶段 6：报告写作重点

可以围绕以下主题展开：

- Docker Compose 编排多服务。
- Nginx 统一入口和反向代理。
- Web 双副本和负载均衡。
- MySQL volume 持久化。
- Waline 登录评论系统。
- 内部监控与外部监控互补。
- 日志采集与 GoAccess 流量分析。
- 只读运维面板与最小权限设计。
- 启发式可疑访问检测。
- MySQL 自动备份和恢复流程。
- 本地测试与 ECS 公网部署的差异。
- 境外监控节点访问阿里云偶发超时的原因和解决方向。

## 阶段 7：可选扩展

当前不建议立刻做，但可以写入报告展望：

- 域名与 HTTPS。
- GitHub OAuth 正式登录。
- CrowdSec 日志安全检测。
- 阿里云内部云监控。
- 多 ECS 实例与负载均衡 SLB。
- 数据库迁移到云数据库 RDS。
- CI/CD 自动部署。

## 禁止事项

不要执行：

```bash
docker compose down -v
```

不要提交：

- `.env`
- 数据库密码
- `ADMIN_TOKEN`
- `JWT_TOKEN`
- Gmail 应用专用密码
- SSH 私钥
- MySQL 备份文件

不要开放：

- `3000`
- `3001`
- `3306`
- `8360`

不要在网页端增加：

- Shell 执行
- 容器重启
- 数据删除
- IP 封禁
- 数据库恢复按钮
