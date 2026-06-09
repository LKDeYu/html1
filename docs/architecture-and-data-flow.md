# 项目架构与数据流说明

本文说明 Coordinate Zero 在本地开发、本地 Docker 和 ECS 部署三种情况下的运行方式。

## 1. 四个容器分别做什么

```text
浏览器
  |
  v
Nginx :80
  |-- /             -> Next.js Web :3000
  `-- /waline/*     -> Waline :8360 -> MySQL :3306 -> mysql-data volume
```

- `nginx`：唯一公开入口，根据 URL 把请求转给前端或 Waline。
- `web`：运行 Next.js，提供首页、博客页面、MDX 内容和 Waline 前端组件。
- `waline`：提供注册、登录、评论查询、评论提交和后台管理 API。
- `mysql`：保存用户、密码哈希、评论及计数。
- `mysql-data`：Docker 持久化卷。容器重建后，数据库数据仍然存在。

公网只需要开放 Nginx 的 `80` 端口。`3000`、`8360` 和 `3306` 只在
Docker 内部网络中使用。

## 2. 本地直接运行 Next.js

执行 `npm run dev` 后，浏览器访问：

```text
http://localhost:3000
```

这时只有 Next.js，没有 Nginx、Waline 和 MySQL。浏览器请求
`/waline/api/...` 时，请求仍会交给 Next.js。Next.js 不认识该地址，
因此返回 HTML 格式的 404 页面。Waline 客户端原本期待 JSON，于是会出现：

```text
Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

这种模式适合只改博客页面，不适合验证完整评论功能。

## 3. 本地使用 Docker Compose

执行：

```bash
docker compose up -d --build
```

应访问：

```text
http://localhost
```

不要使用 `http://localhost:3000`。本地完整访问过程如下。

### 打开文章

```text
浏览器 -> localhost:80 -> Nginx -> web:3000 -> 返回文章 HTML/JS
```

### 加载评论

```text
浏览器中的 Waline 客户端
  -> localhost:80/waline/api/comment
  -> Nginx
  -> waline:8360/api/comment
  -> MySQL 查询
  -> 原路返回 JSON
```

### 注册和登录

```text
浏览器 -> /waline/ui/register 或 /waline/ui/login
       -> Nginx -> Waline
       -> Waline 读写 MySQL 的 wl_Users 表
```

密码不会以明文保存，Waline 保存的是密码哈希。登录成功后，Waline 签发令牌；
浏览器保存令牌，后续评论请求通过 `Authorization: Bearer <token>` 携带身份。

GitHub 登录或账号绑定默认通过 Waline 公共 OAuth 中心完成：

```text
浏览器 -> Waline -> oauth.lithub.cc -> GitHub
       -> oauth.lithub.cc -> Waline -> MySQL
```

当前 Waline 容器不直接保存 GitHub Client Secret。只有自建 `walinejs/auth`
服务时，才需要把 `GITHUB_ID` 和 `GITHUB_SECRET` 配置到那个独立服务中，
并通过 Waline 的 `OAUTH_URL` 指向它。

### 发表评论

```text
浏览器携带登录令牌
  -> Nginx
  -> Waline 验证令牌
  -> 写入 MySQL 的 wl_Comment 表
  -> 返回评论 JSON
```

`LOGIN=force` 同时在前端和后端生效。游客可以读取评论，但匿名写入会被后端
以 `401 Unauthorized` 拒绝。

本地的 `localhost` 只代表当前电脑。默认情况下，其他互联网用户不能访问。

## 4. 部署到 ECS 后

ECS 上仍运行相同的四个容器，区别只是 `localhost` 被 ECS 公网 IP 或域名替代。

```text
用户浏览器
  -> 互联网
  -> ECS 安全组 80 端口
  -> ECS 主机的 80 端口
  -> Nginx 容器
  -> Web 或 Waline
  -> MySQL volume
```

### 普通用户访问

1. 用户访问 `http://ECS公网IP/blog/...`。
2. Nginx 把页面请求交给 `web`。
3. 页面加载后，Waline 客户端请求 `/waline/api/comment`。
4. Nginx 把评论请求交给 `waline`。
5. Waline 从 MySQL 读取评论并返回。
6. 用户注册或登录后，浏览器保存自己的登录令牌。
7. 用户发表评论时携带令牌，Waline 验证后写入 MySQL。

用户只能接触 Nginx，不会直接连接 Next.js、Waline 或 MySQL。

### 站长访问

站长访问网站的路径和普通用户完全一样。区别在于：

- 第一个注册的 Waline 账号成为管理员。
- 管理员登录 `/waline/ui` 后，可以审核、删除和管理评论及用户。
- 管理员令牌保存在管理员自己的浏览器中，不会自动分享给其他用户。
- SSH 连接 ECS 使用安全组开放的 `22` 端口，只用于部署和运维，不参与网页访问。

## 5. 哪些东西保存在哪里

| 内容 | 保存位置 | 容器重建后 |
| --- | --- | --- |
| Next.js、MDX、Nginx 配置 | Git 仓库和 Web 镜像 | 重新构建获得 |
| 环境变量和密码 | ECS 项目目录的 `.env` | 文件保留，不提交 Git |
| 注册用户和评论 | MySQL 数据库 | 保留 |
| MySQL 实际数据文件 | `mysql-data` volume | 保留 |
| 登录令牌 | 每位用户自己的浏览器 | 清理浏览器数据后消失 |
| 容器内临时文件 | 各容器可写层 | 重建后可能消失 |

`deploy/mysql/waline.sql` 只在一个全新的空 volume 首次启动时创建表。它不会在
每次重启时清空数据库。

## 6. 此前故障的完整原因

1. 使用了 `localhost:3000`，绕过 Nginx，导致 `/waline/*` 被 Next.js 当作页面。
2. Next.js 返回 HTML 404，Waline 客户端按 JSON 解析，产生 `Unexpected token '<'`。
3. MySQL 8.4 默认认证方式与当前 Waline MySQL 驱动不兼容，数据库连接失败。
4. 数据库虽然创建成功，但没有导入 Waline 表结构，查询时报表不存在。
5. Waline 没有配置外部 `SERVER_URL`，后台曾把 API 地址生成成 `/api/`，
   而实际入口是 `/waline/api/`。

目前分别通过 Nginx 统一入口、MySQL 8.0 兼容认证、首次启动 SQL 和
`SERVER_URL=站点地址/waline` 解决。

## 7. 错误页面边界

自定义 404 页面只处理 Next.js 页面路由不存在的情况。不同层需要保留不同的
错误响应：

- Next.js 页面 404：返回自定义视觉页面。
- Next.js 页面运行异常：应由 `error.tsx` 或 `global-error.tsx` 处理。
- Waline API 的 401、403、404、500：继续返回 JSON，供评论客户端判断错误。
- Nginx 的 502、503、504：可配置单独的静态服务异常页面。
- GitHub OAuth 错误：由 GitHub、OAuth 中心或 Waline 返回。

不能把所有 API 错误都改成自定义 404 HTML，否则客户端期待 JSON 时会再次出现
`Unexpected token '<'`。

## 8. 常用检查命令

```bash
docker compose ps
docker compose logs -f nginx
docker compose logs -f web
docker compose logs -f waline
docker compose logs -f mysql
docker compose restart
```

判断请求属于哪个服务时，先看 URL：

- `/`、`/blog/...`、`/_next/...`：Next.js。
- `/waline/api/...`、`/waline/ui/...`：Waline。
- MySQL 没有浏览器 URL，只由 Waline 在 Docker 内部访问。
