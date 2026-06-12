# Coordinate Zero 云部署交接文档

更新时间：2026-06-11
用途：将本文件提供给 GPT 网页端或其他协作者，继续完成阿里云 ECS 部署与验收。

> 本文件是当前云部署工作的主要上下文。`docs/AI_HANDOFF.md` 是早期开发阶段的
> 旧记录，其中的 SQLite CMS、旧仓库地址和部分路由信息已经过时，不应作为本次
> 部署依据。

## 1. 项目目标

这是一个个人内容站和云计算课程大作业，拟定题目为：

> 基于 ECS 与 Docker Compose 的个人内容站及登录评论系统部署实践

最终部署形态：

```text
互联网用户
  -> 阿里云 ECS 公网 IP:80
  -> Nginx 容器
       |-- /              -> Next.js Web 容器:3000
       `-- /waline/*      -> Waline 容器:8360
                                  -> MySQL 容器:3306
                                  -> Docker volume 持久化
```

核心目标：

- 在阿里云 ECS 上通过 Docker Compose 运行四个容器。
- Nginx 是唯一公网 Web 入口。
- Next.js 提供个人主页、博客、项目和技能页面。
- Waline 提供注册、登录、评论及管理后台。
- 游客可以阅读评论，但必须登录才能发表评论。
- MySQL 保存 Waline 用户和评论，Docker volume 保证数据持久化。

## 2. 当前代码仓库

本机项目路径：

```text
F:\code\experiment\Cloud Computing\namranta-portfolio
```

当前有效 GitHub 仓库：

```text
https://github.com/LKDeYu/html1.git
```

当前分支：

```text
main
```

已包含主要部署修复的关键提交：

```text
d316f63 Fix ECS deployment repository URL
6c9a98b Fix Waline OAuth redirects and unify error pages
af6f8f4 Fix Waline GitHub OAuth routing
```

注意：

- 必须克隆 `html1.git`。
- 不要使用旧仓库 `website_draft.git`，它目前落后于当前实现。
- `.env`、密码、JWT、私钥和数据库实际数据都不应提交到 Git。

## 3. 当前技术栈

- Next.js 16.2.6
- React 19.2.4
- TypeScript
- Tailwind CSS 4
- MDX 文件内容
- Waline Server 1.40.3
- Waline Client 3.x
- MySQL 8.0.43
- Nginx 1.27 Alpine
- Docker Engine
- Docker Compose

博客内容位于：

```text
content/writing/*.mdx
```

主要公开路由：

```text
/
/blog
/blog/home
/blog/[slug]
/tags
/tags/[tag]
/projects
/projects/[slug]
/skills/[slug]
```

Waline 路由：

```text
/waline/ui
/waline/ui/login
/waline/ui/register
/waline/ui/profile
/waline/api/*
```

## 4. 当前本地运行状态

截至 2026-06-11，本机 Docker Desktop 中四个容器均可正常运行：

```text
coordinate-zero-nginx
coordinate-zero-web
coordinate-zero-waline
coordinate-zero-mysql
```

本地统一入口：

```text
http://localhost
```

Waline 后台：

```text
http://localhost/waline/ui
```

本地 MySQL volume：

```text
namranta-portfolio_mysql-data
```

本地完整启动命令：

```powershell
cd "F:\code\experiment\Cloud Computing\namranta-portfolio"
docker compose up -d
docker compose ps
```

不要用 `http://localhost:3000` 测试评论系统，因为这会绕过 Nginx，
导致 `/waline/*` 被 Next.js 错误处理。

## 5. 已完成和验证的功能

- Next.js 生产构建通过。
- ESLint 检查通过。
- Docker Compose 可以构建并启动四个服务。
- Nginx 将 `/` 转发给 Next.js。
- Nginx 将 `/waline/` 转发给 Waline。
- MySQL 首次启动会导入 `deploy/mysql/waline.sql`。
- MySQL 数据保存到 Docker volume。
- 评论区自动出现在博客文章正文下方。
- 评论区标题只保留 `Comments / 评论`。
- Waline 设置为 `LOGIN=force`，匿名用户不能发表评论。
- Waline 注册、登录和管理后台可使用。
- GitHub 账号绑定已经在本地验证成功。
- GitHub 绑定成功后的 `/ui/profile` 错误跳转已由 Nginx 修正为
  `/waline/ui/profile`。
- Next.js 404、运行时 500、Nginx 50x 和 OAuth 异常页采用统一视觉风格。
- Waline API 错误仍保持 JSON，避免前端再次出现
  `Unexpected token '<'`。
- Waline 个人设置页增加了明显的“修改头像”提示。

## 6. 已知机制与注意事项

### 6.1 登录和评论

```text
浏览器登录
  -> Nginx
  -> Waline 验证
  -> MySQL 中的 wl_Users
  -> 浏览器保存登录令牌

浏览器发表评论
  -> 携带登录令牌
  -> Nginx
  -> Waline
  -> MySQL 中的 wl_Comment
```

Waline 保存密码哈希，不保存明文密码。

### 6.2 GitHub 认证

当前使用 Waline 默认公共认证中心：

```text
浏览器 -> Waline -> oauth.lithub.cc -> GitHub -> Waline
```

当前 Waline 容器中不配置 `GITHUB_ID` 和 `GITHUB_SECRET`。
只有以后自建独立 `walinejs/auth` 服务时，才把这两个参数配置到 auth 服务，
并通过 Waline 的 `OAUTH_URL` 指向该服务。

### 6.3 用户头像

Waline 当前方案不是上传本地图片，而是填写公开图片 URL：

1. 登录 `/waline/ui/profile`。
2. 点击头像下方的“修改头像”。
3. 填写以 `http://` 或 `https://` 开头的图片地址。

没有自定义 URL 时，Waline 使用 Libravatar/Gravatar 默认头像。绑定 GitHub
账号不会稳定地自动覆盖头像，两者是独立操作。

### 6.4 错误响应边界

- 浏览器直接看到的页面异常使用统一视觉页面。
- `/waline/api/*` 的错误必须继续返回 JSON。
- 不要把所有 API 错误替换成 HTML，否则 Waline Client 会把 HTML 当 JSON 解析。

## 7. 云服务器建议配置

建议 ECS：

- 操作系统：Ubuntu 24.04 LTS，x86_64
- 计算规格：2 vCPU / 4 GB RAM
- 系统盘：40 GB 或以上
- 网络：分配公网 IPv4
- 登录：密码或 SSH 密钥均可，优先 SSH 密钥

安全组入方向：

| 端口 | 来源 | 用途 |
| --- | --- | --- |
| TCP 22 | 自己电脑的公网 IP `/32` | SSH 运维 |
| TCP 80 | `0.0.0.0/0` | 网站 HTTP 访问 |

不要向公网开放：

```text
3000
3306
8360
```

后续增加 HTTPS 时再开放 `443/TCP`。

## 8. 部署前需要用户提供的信息

可以提供给协作者：

- ECS 公网 IP。
- ECS 操作系统和版本。
- SSH 用户名，例如 `root` 或 `ecs-user`。
- 使用密码登录还是 `.pem` 私钥登录。
- 如果使用私钥，只提供本机私钥文件路径，不要把私钥文本发到聊天中。
- 是否使用全新云端评论数据库。
- 是否已有域名。本次第一阶段默认没有域名，只用公网 IP + HTTP。

绝对不要发送或写进交接文档：

- SSH 密码。
- 私钥文件内容。
- MySQL 密码。
- JWT Token。
- GitHub Client Secret。

## 9. 推荐部署流程

### 第一步：在阿里云控制台准备 ECS

1. 创建或启动 ECS。
2. 确认实例状态为“运行中”。
3. 确认实例具有公网 IPv4。
4. 配置安全组 `22` 和 `80`。
5. 记录公网 IP 和 SSH 用户名。

### 第二步：从本机连接 ECS

密码登录示例：

```powershell
ssh root@你的ECS公网IP
```

密钥登录示例：

```powershell
ssh -i "C:\path\to\your-key.pem" root@你的ECS公网IP
```

第一次连接时核对主机指纹，然后输入 `yes`。

### 第三步：在 Ubuntu 安装 Docker

在 ECS 中执行：

```bash
sudo apt update
sudo apt install -y ca-certificates curl git
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo ${UBUNTU_CODENAME:-$VERSION_CODENAME}) stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io \
  docker-buildx-plugin docker-compose-plugin

sudo systemctl enable --now docker
sudo docker --version
sudo docker compose version
```

如果当前用户不是 `root`，后续 Docker 命令可以先统一使用 `sudo docker ...`。

### 第四步：克隆当前项目

```bash
sudo mkdir -p /var/www
cd /var/www
sudo git clone https://github.com/LKDeYu/html1.git coordinate-zero
sudo chown -R "$USER":"$USER" /var/www/coordinate-zero
cd /var/www/coordinate-zero
git log -3 --oneline
```

应确认能看到部署修复提交，至少包含：

```text
d316f63 Fix ECS deployment repository URL
6c9a98b Fix Waline OAuth redirects and unify error pages
```

### 第五步：创建云端环境变量

```bash
cp deploy/compose.env.example .env
nano .env
```

模板如下，所有 `你的ECS公网IP` 都替换成实际 IP：

```env
PUBLIC_HOST=你的ECS公网IP
NEXT_PUBLIC_SITE_URL=http://你的ECS公网IP
NEXT_PUBLIC_WALINE_SERVER_URL=/waline

SITE_NAME=Coordinate Zero
SITE_URL=http://你的ECS公网IP
SECURE_DOMAINS=你的ECS公网IP
AUTHOR_EMAIL=你的管理员邮箱
JWT_TOKEN=使用随机命令生成

MYSQL_DATABASE=waline
MYSQL_USER=waline
MYSQL_PASSWORD=新生成的强密码
MYSQL_ROOT_PASSWORD=另一个新生成的强密码

IPQPS=60
COMMENT_AUDIT=false
DISABLE_REGION=true
DISABLE_USERAGENT=false

# 运维面板默认保持关闭
ADMIN_TOKEN=
OPS_ALLOW_INSECURE_HTTP=false
```

随机值生成：

```bash
openssl rand -hex 32
```

建议分别生成三个不同值：

- `JWT_TOKEN`
- `MYSQL_PASSWORD`
- `MYSQL_ROOT_PASSWORD`

完成后限制 `.env` 权限：

```bash
chmod 600 .env
```

不要把本机 `.env` 原样上传，因为本机地址是 `localhost`。

### 第六步：构建并启动

```bash
cd /var/www/coordinate-zero
sudo docker compose config --quiet
sudo docker compose up -d --build
sudo docker compose ps
```

第一次构建可能需要数分钟。

查看日志：

```bash
sudo docker compose logs --tail=100 nginx
sudo docker compose logs --tail=100 web
sudo docker compose logs --tail=100 waline
sudo docker compose logs --tail=100 mysql
```

### 第七步：服务器内部检查

```bash
curl -I http://127.0.0.1/
curl -I http://127.0.0.1/waline/
sudo docker compose ps
sudo docker volume ls
```

首页和 Waline 应返回可用的 HTTP 响应，MySQL 应显示 `healthy`。

### 第八步：公网访问

在自己电脑浏览器访问：

```text
http://你的ECS公网IP
http://你的ECS公网IP/blog/home
http://你的ECS公网IP/waline/ui
```

如果 ECS 内部 `curl` 正常但公网打不开，优先检查阿里云安全组 `80/TCP`，
不要先改 Docker 配置。

### 第九步：初始化 Waline 管理员

云端使用全新 MySQL volume 时，本地账号不会自动存在：

1. 打开任意博客文章。
2. 在评论区进入注册页。
3. 注册云端第一个 Waline 用户。
4. 第一个用户通常成为管理员。
5. 登录 `/waline/ui` 检查管理员状态。

### 第十步：评论与持久化验收

需要验证：

1. 游客可以看到评论区。
2. 游客无法直接发表评论。
3. 登录后能够发表评论。
4. 刷新页面后评论仍存在。
5. 执行下面命令后评论仍存在：

```bash
sudo docker compose restart waline
sudo docker compose restart mysql
```

不要执行：

```bash
docker compose down -v
```

`-v` 会删除 MySQL volume，可能导致用户和评论数据丢失。

## 10. 全新数据库与数据迁移

推荐第一版云部署使用全新数据库：

- 云端重新注册管理员。
- 云端重新发表测试评论。
- 本机测试数据不迁移，部署流程更简单稳定。

如果后续确实要迁移本机用户和评论，再单独执行 MySQL dump/import。不要复制
Docker volume 目录，也不要把数据库备份提交到 GitHub。

典型导出思路：

```bash
mysqldump -> 安全传输 SQL 文件 -> ECS mysql 导入
```

迁移前必须先备份云端数据库，且保证本地与云端 Waline 表结构一致。

## 11. 部署后的常用命令

进入项目：

```bash
cd /var/www/coordinate-zero
```

查看状态：

```bash
sudo docker compose ps
```

查看日志：

```bash
sudo docker compose logs -f nginx
sudo docker compose logs -f web
sudo docker compose logs -f waline
sudo docker compose logs -f mysql
```

更新代码：

```bash
git pull origin main
sudo docker compose up -d --build
```

普通停止，不删除数据：

```bash
sudo docker compose down
```

重新启动：

```bash
sudo docker compose up -d
```

查看持久化卷：

```bash
sudo docker volume ls
```

## 12. 常见故障判断

### 公网 IP 完全打不开

检查顺序：

1. ECS 是否运行。
2. 是否有公网 IP。
3. 安全组是否允许 `80/TCP`。
4. `sudo docker compose ps` 中 Nginx 是否运行。
5. ECS 内执行 `curl -I http://127.0.0.1/` 是否成功。

### 首页能打开，评论区报 JSON 解析错误

确认：

```env
NEXT_PUBLIC_WALINE_SERVER_URL=/waline
SITE_URL=http://实际公网IP
SECURE_DOMAINS=实际公网IP
```

然后重建 Web：

```bash
sudo docker compose up -d --build web nginx
```

不要通过 `:3000` 访问网站。

### Waline 无法连接 MySQL

```bash
sudo docker compose logs --tail=200 mysql
sudo docker compose logs --tail=200 waline
sudo docker compose ps
```

检查 `.env` 中的 MySQL 密码是否为空或被特殊字符错误解析。项目固定使用
MySQL 8.0.43 和 `mysql_native_password` 兼容当前 Waline 驱动。

### GitHub 绑定成功后返回 404

确认服务器代码包含 `6c9a98b` 之后的修复，并重新创建 Nginx：

```bash
git pull origin main
sudo docker compose up -d --force-recreate nginx
```

正确个人页应为：

```text
/waline/ui/profile
```

### 修改 `.env` 后没有变化

Next.js 的 `NEXT_PUBLIC_*` 值会参与构建，必须重建：

```bash
sudo docker compose up -d --build
```

## 13. 作业验收截图清单

建议保存以下截图：

1. 阿里云 ECS 实例运行状态与公网 IP。
2. 安全组开放 `22` 和 `80`。
3. `docker --version` 与 `docker compose version`。
4. 项目克隆及 `git log -3 --oneline`。
5. `docker compose ps` 四个容器运行，MySQL healthy。
6. `docker volume ls` 显示 MySQL volume。
7. 公网 IP 打开网站首页。
8. 博客文章页出现评论区。
9. 未登录不能评论。
10. 登录后评论成功。
11. 刷新或重启容器后评论仍存在。
12. Waline 管理后台。
13. Nginx、Waline、MySQL 的关键日志。

## 14. 云计算报告可讲的知识点

- ECS 属于 IaaS，提供云端计算、磁盘与网络资源。
- Docker 镜像保证应用运行环境一致。
- Docker Compose 负责多容器服务编排、依赖和网络。
- Nginx 作为反向代理和统一入口。
- 前后端服务分离：Next.js 与 Waline 是独立服务。
- 数据库容器与应用容器解耦。
- Docker volume 实现数据库持久化。
- 安全组承担云端虚拟防火墙职责。
- 只暴露必要端口，体现最小权限原则。
- 环境变量将代码与部署配置、密码分离。
- 日志、健康检查、重启策略属于基础运维能力。
- 可扩展方向包括域名、HTTPS、备份、监控和多实例负载均衡。

## 15. 暂未完成的后续任务

- 第一阶段 ECS 部署、公网访问、Waline 登录评论和 MySQL volume 持久化已完成。
- 只读运维面板、宿主机状态采集和 MySQL 每日备份代码已完成。
- 默认保持 `OPS_ALLOW_INSECURE_HTTP=false`；生产 Cookie 使用 `Secure`。
- 如需在当前 HTTP 阶段临时验收，可在 ECS 服务端设置独立 `ADMIN_TOKEN` 和
  `OPS_ALLOW_INSECURE_HTTP=true`，页面会明确标记 HTTP 测试模式。
- HTTP 测试模式没有传输加密，只能短期用于可信网络，不能作为长期生产配置。
- 完成域名、备案和 HTTPS 后，必须删除该变量或改回 `false`，并重新创建 Web 容器。
- 详细更新流程、定时任务和恢复命令见 `docs/ops-runbook.md`。

## 16. 给 GPT 网页端的建议开场提示

可以将本文件上传后发送：

```text
请以这份 CLOUD_DEPLOYMENT_HANDOFF.md 为唯一主要上下文，继续协助我完成阿里云
ECS 部署。不要采用旧的 SQLite CMS 架构，也不要使用 website_draft.git。
当前有效仓库是 https://github.com/LKDeYu/html1.git。

请一次只带我完成一个阶段。每一步先说明目的，再给出可复制命令，并等待我返回
完整输出后再继续。不要让我在聊天中发送密码、JWT、私钥文本或其他秘密。
出现故障时，先根据 docker compose ps、容器日志、curl 和安全组逐层定位，
不要盲目删除 volume，也不要执行 docker compose down -v。
```

## 17. 相关项目文档

- `docs/ecs-docker-compose-deployment.md`
- `docs/architecture-and-data-flow.md`
- `docs/cloud-assignment-report-notes.md`
- `docs/ops-runbook.md`
- `deploy/compose.env.example`
- `docker-compose.yml`
- `deploy/nginx.conf`
- `Dockerfile`
