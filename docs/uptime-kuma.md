# Uptime Kuma 内部监控

项目固定使用 `louislam/uptime-kuma:2.4.0-slim`。Kuma 与业务容器处于同一
Compose 网络，但管理端口只绑定 ECS 回环地址，不需要也不允许在安全组开放
`3001`。

## 访问方式

在自己的电脑建立 SSH 隧道，命令保持运行：

```powershell
ssh -L 3001:127.0.0.1:3001 root@ECS公网IP
```

随后浏览器访问 `http://127.0.0.1:3001`，首次进入时创建 Kuma 管理员账号。
管理员密码只保存在 Kuma 自己的 `uptime-kuma-data` volume 中，不写入项目
`.env`。

## 建议监控项

| 名称 | 类型 | 地址 |
| --- | --- | --- |
| Nginx Entry | HTTP | `http://nginx/` |
| Web Primary | HTTP | `http://web:3000/api/health` |
| Web Replica | HTTP | `http://web-replica:3000/api/health` |
| Waline | HTTP | `http://waline:8360/` |
| MySQL | TCP Port | 主机 `mysql`，端口 `3306` |

每个监控项建议设置：

- 检查周期：`60` 秒或 `120` 秒。
- 最大重试：连续失败 `3` 次后发送告警。
- 启用恢复通知。
- 不在这里重复监控公网 UptimeRobot。

Kuma 与网站在同一台 ECS 上。若整台 ECS、机房网络或云平台实例停止，Kuma
本身也会停止，因此它不能替代异地可用性监控。

## Gmail 通知

不要把 Gmail 密码或应用专用密码写进 Git、`.env`、Compose 或脚本。由管理员
在 Kuma UI 的 `Settings -> Notifications` 中手工新增 SMTP 通知：

```text
SMTP Host: smtp.gmail.com
Port: 465
Security: SSL/TLS
Username: yuany257093418@gmail.com
From: yuany257093418@gmail.com
To: yuany257093418@gmail.com
Password: Google 应用专用密码
```

操作前需要在 Google 账户中开启两步验证并创建应用专用密码。配置后先点击
测试通知，再把该通知绑定到五个监控项。

## ECS 预拉取

Docker Hub 不稳定时，从 DaoCloud 拉取后重新标记为 Compose 使用的正式名称：

```bash
docker pull m.daocloud.io/docker.io/louislam/uptime-kuma:2.4.0-slim
docker tag m.daocloud.io/docker.io/louislam/uptime-kuma:2.4.0-slim \
  louislam/uptime-kuma:2.4.0-slim
```

确认镜像存在后，启动时禁止 Compose 再访问远端：

```bash
docker compose up -d --build --pull never
```
