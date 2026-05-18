"use client";

import type { FormEvent } from "react";
import { useState } from "react";

export function AdminLoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    setLoading(false);

    if (!response.ok) {
      setError("密码不正确，或生产环境缺少 ADMIN_PASSWORD。");
      return;
    }

    window.location.href = "/admin";
  };

  return (
    <main className="admin-shell admin-login-shell">
      <form className="admin-login-card" onSubmit={onSubmit}>
        <p className="section-kicker">Admin CMS</p>
        <h1>内容管理后台</h1>
        <p>管理 Projects 和 Skills。开发环境默认密码是 <code>admin</code>，生产环境请设置环境变量。</p>
        <label>
          <span>Password</span>
          <input
            autoFocus
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="ADMIN_PASSWORD"
          />
        </label>
        {error ? <strong className="admin-error">{error}</strong> : null}
        <button type="submit" disabled={loading}>
          {loading ? "登录中..." : "登录"}
        </button>
      </form>
    </main>
  );
}
