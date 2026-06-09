# ECS Docker Compose 部署手册

本手册用于把 `Coordinate Zero` 个人内容站部署到一台阿里云 ECS 上。部署形态是：

```text
公网浏览器 -> Nginx 容器 80
                 -> Next.js 前端容器 3000
                 -> Waline 评论后端容器 8360
                      -> MySQL 容器 3306 + Docker volume
```

## 1. ECS 与安全组

推荐环境：

- Ubuntu 22.04 LTS 或 Ubuntu 24.04 LTS
- 2 vCPU / 4 GB 内存或更高
- 系统盘 40 GB 起
- 安全组入方向开放：
  - `22/tcp`：SSH 登录，建议只允许自己的公网 IP
  - `80/tcp`：HTTP 访问，允许 `0.0.0.0/0`

第一版不开放 `3306`、`3000`、`8360`，这些端口只在 Docker 内部网络使用。

## 2. 安装 Docker

```bash
sudo apt update
sudo apt install -y ca-certificates curl git
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo ${UBUNTU_CODENAME:-$VERSION_CODENAME}) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
docker --version
docker compose version
```

截图点：`docker --version` 和 `docker compose version`。

## 3. 拉取项目

```bash
mkdir -p /var/www
cd /var/www
git clone https://github.com/LKDeYu/website_draft.git coordinate-zero
cd coordinate-zero
git log --oneline -3
```

截图点：仓库拉取成功和最新提交。

## 4. 配置环境变量

```bash
cp deploy/compose.env.example .env
nano .env
```

至少替换这些值：

```env
PUBLIC_HOST=你的ECS公网IP
NEXT_PUBLIC_SITE_URL=http://你的ECS公网IP
SITE_URL=http://你的ECS公网IP
SECURE_DOMAINS=你的ECS公网IP
JWT_TOKEN=一段足够长的随机字符串
MYSQL_PASSWORD=一个强密码
MYSQL_ROOT_PASSWORD=另一个强密码
```

生成随机字符串可用：

```bash
openssl rand -hex 32
```

注意：`.env` 不要提交到 GitHub。

## 5. 启动多容器架构

```bash
docker compose build
docker compose up -d
docker compose ps
```

首次使用空数据卷启动时，MySQL 会自动执行
`deploy/mysql/waline.sql`，创建评论、计数和用户表。后续重启容器不会重复初始化，
也不会删除 `mysql-data` volume 中的数据。

检查日志：

```bash
docker compose logs -f web
docker compose logs -f waline
docker compose logs -f mysql
docker compose logs -f nginx
```

截图点：

- `docker compose ps` 显示 `nginx`、`web`、`waline`、`mysql` 都是 running/healthy
- `docker volume ls` 显示 MySQL 持久化 volume
- MySQL 日志显示执行了 `/docker-entrypoint-initdb.d/01-waline.sql`

## 6. 访问验证

浏览器访问：

```text
http://你的ECS公网IP
http://你的ECS公网IP/blog
http://你的ECS公网IP/blog/home
http://你的ECS公网IP/blog/ecg-diagnosis-system
```

评论后端接口可检查：

```bash
curl -I http://你的ECS公网IP/waline/
curl -H "Referer: http://你的ECS公网IP/blog/ecg-diagnosis-system" \
  "http://你的ECS公网IP/waline/api/comment?type=count&url=%2Fblog%2Fecg-diagnosis-system"
```

截图点：

- 首页可访问
- 博客列表可访问
- 任意文章页出现评论区
- 未登录时评论区提示登录
- 登录后能提交评论
- 刷新页面后评论仍存在

## 7. Waline 首次管理员

进入任意博客文章页，在评论区注册第一个用户。Waline 的第一个注册用户通常作为管理员，用于后续评论管理。

访问管理入口：

```text
http://你的ECS公网IP/waline/ui
```

截图点：管理员后台或用户登录状态。

## 8. 常见问题

### 评论区显示但请求失败

检查 `.env`：

- `NEXT_PUBLIC_WALINE_SERVER_URL=/waline`
- `SITE_URL=http://你的ECS公网IP`
- `SECURE_DOMAINS=你的ECS公网IP`

然后重建前端：

```bash
docker compose build web
docker compose up -d
```

### Waline 连不上 MySQL

```bash
docker compose logs waline
docker compose logs mysql
docker compose ps
```

重点检查：

- `.env` 里的 `MYSQL_PASSWORD` 是否和 MySQL 服务一致
- MySQL 是否已经 healthy
- `MYSQL_DB`、`MYSQL_USER`、`MYSQL_PASSWORD` 是否传给 Waline
- 项目固定使用 MySQL 8.0 的 `mysql_native_password`，以兼容 Waline 当前的 MySQL 驱动

### 修改 `.env` 后没有生效

修改环境变量后需要重建或重启：

```bash
docker compose up -d --build
```

## 9. 后续扩展

- 域名 + HTTPS：用域名替换 IP，配置证书后把 `NEXT_PUBLIC_SITE_URL`、`SITE_URL`、`SECURE_DOMAINS` 同步改掉。
- GitHub OAuth：配置 GitHub OAuth App 后，评论登录体验更接近正式网站。
- 多实例 Web：把 `web` 服务扩展成多个副本，再用 Nginx upstream 做负载均衡。
- 数据备份：定期备份 `mysql-data` volume 或导出 MySQL dump。
