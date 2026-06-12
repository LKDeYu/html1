"use client";

import { LockKeyhole, LogIn, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type OpsLoginFormProps = {
  configured: boolean;
  insecureHttpMode: boolean;
};

export function OpsLoginForm({
  configured,
  insecureHttpMode,
}: OpsLoginFormProps) {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configured || submitting) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/admin/ops/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(
          response.status === 503
            ? "服务器尚未配置 ADMIN_TOKEN。"
            : body?.error || "登录失败，请检查管理员口令。",
        );
        return;
      }

      router.replace("/admin/ops");
      router.refresh();
    } catch {
      setError("无法连接服务器，请稍后重试。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      className="ops-login-form"
      method="post"
      onSubmit={handleSubmit}
    >
      <div className="ops-login-icon" aria-hidden="true">
        <LockKeyhole size={24} />
      </div>
      <div>
        <p className="ops-eyebrow">Administrator access</p>
        <h1>运维面板登录</h1>
        <p className="ops-login-copy">
          使用独立管理员口令进入只读运行状态页面。
        </p>
      </div>

      {insecureHttpMode ? (
        <div className="ops-http-warning" role="alert">
          <ShieldAlert size={18} />
          <div>
            <strong>HTTP 测试模式</strong>
            <span>
              当前运维面板运行在 HTTP 测试模式，管理员口令和会话未经过传输加密，请勿在不可信网络使用。
            </span>
          </div>
        </div>
      ) : null}

      {configured ? (
        <>
          <label htmlFor="ops-admin-token">管理员口令</label>
          <input
            id="ops-admin-token"
            name="token"
            type="password"
            autoComplete="current-password"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            minLength={32}
            required
          />
          {error ? (
            <p className="ops-form-error" role="alert">
              <ShieldAlert size={16} />
              {error}
            </p>
          ) : null}
          <button type="submit" disabled={submitting}>
            <LogIn size={17} />
            {submitting ? "正在验证" : "登录"}
          </button>
        </>
      ) : (
        <div className="ops-config-warning" role="status">
          <ShieldAlert size={18} />
          <div>
            <strong>尚未配置 ADMIN_TOKEN</strong>
            <span>
              当前 HTTP 阶段保持面板关闭；配置 HTTPS 后再设置管理员口令。
            </span>
          </div>
        </div>
      )}
    </form>
  );
}
