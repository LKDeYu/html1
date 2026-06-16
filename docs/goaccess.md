# Nginx 持久化日志与 GoAccess

项目固定使用 `allinurl/goaccess:1.10.2`。Nginx 的 combined access log 同时写入
Docker stdout 和宿主机 `runtime/nginx/access.log`，因此以下两种查看方式都可用：

```bash
docker compose logs --tail 100 nginx
tail -n 100 runtime/nginx/access.log
```

日志不包含 Cookie、Authorization 和请求正文。GoAccess 生成报告时忽略查询
参数，但保留完整访问 IP，便于管理员排查可疑访问。报告保存在
`runtime/goaccess/report.html`，该目录不直接公开，只能在管理员登录后通过
`/admin/traffic` 读取。

## 手工生成和验收

```bash
cd /var/www/coordinate-zero
PROJECT_DIR=$PWD ./deploy/goaccess/generate-report.sh
ls -lh runtime/goaccess/report.html
```

浏览器登录 `/admin/ops` 后访问 `/admin/traffic`。未登录访问页面会跳转到登录
页，直接请求 `/api/admin/traffic` 会返回 `401`。

## 日志轮转

配置文件 `deploy/nginx/coordinate-zero-logrotate.conf` 使用 `copytruncate`，
每天或文件超过 20 MB 时轮转，保留 7 份并压缩旧日志，不需要停止 Nginx：

```bash
sudo install -m 0644 deploy/nginx/coordinate-zero-logrotate.conf \
  /etc/logrotate.d/coordinate-zero-nginx
sudo logrotate -d /etc/logrotate.d/coordinate-zero-nginx
```

如果项目不在 `/var/www/coordinate-zero`，安装前先修改配置中的绝对路径。

## ECS 预拉取

```bash
docker pull m.daocloud.io/docker.io/allinurl/goaccess:1.10.2
docker tag m.daocloud.io/docker.io/allinurl/goaccess:1.10.2 \
  allinurl/goaccess:1.10.2
docker image inspect allinurl/goaccess:1.10.2 >/dev/null
```

部分网络环境可能拒绝 DaoCloud 请求；这种情况下应使用 ECS 当前可用的国内
镜像源预拉取同一精确版本并重新 tag，不能把 Compose 改成 `latest`。
