"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { clearToken, getToken, setToken } from "@/lib/admin/session";
import { verifyToken } from "@/lib/admin/github";
import { GH_OWNER, GH_REPO } from "@/lib/admin/constants";

interface AdminAuth {
  token: string;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuth | null>(null);

export function useAdminAuth(): AdminAuth {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth 必须在 AdminGate 内使用");
  return ctx;
}

export function AdminGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false); // 已完成首次 localStorage 读取
  const [token, setTokenState] = useState("");
  const [pat, setPat] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTokenState(getToken());
    setReady(true);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const value = pat.trim();
    if (!value) {
      setError("请粘贴 GitHub 访问令牌");
      return;
    }
    setLoading(true);
    try {
      await verifyToken(value); // 校验令牌能访问目标仓库
      setToken(value);
      setTokenState(value);
      setPat("");
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (status === 401) setError("令牌无效或已过期（401）");
      else if (status === 403) setError("令牌权限不足或被拒绝（403）");
      else if (status === 404) setError(`找不到仓库 ${GH_OWNER}/${GH_REPO}，请确认令牌对本仓库有权限`);
      else setError((err as Error).message || "校验失败，请检查网络后重试");
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    clearToken();
    setTokenState("");
  }

  // 首次读取 localStorage 前不渲染，避免闪烁
  if (!ready) {
    return <div className="min-h-screen flex items-center justify-center opacity-40">加载中…</div>;
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <form
          onSubmit={submit}
          className="w-full max-w-md bg-white border border-black/10 p-10 space-y-8 shadow-xl"
        >
          <div className="space-y-2">
            <div className="archive-text text-[10px] tracking-[0.3em] text-diagonal-red">
              DIAGONAL / CONTENT CONSOLE
            </div>
            <h1 className="text-3xl font-black tracking-tighter">内容后台登录</h1>
            <p className="text-sm opacity-50">
              粘贴你的 GitHub 访问令牌（PAT）即可发布文章。令牌只保存在本设备浏览器，不会上传或写入代码。
            </p>
          </div>

          <div className="space-y-1">
            <label className="archive-text text-[10px] opacity-50 uppercase">
              GitHub 访问令牌 (PAT)
            </label>
            <input
              type="password"
              value={pat}
              onChange={(e) => setPat(e.target.value)}
              autoComplete="off"
              placeholder="github_pat_… 或 ghp_…"
              className="w-full border border-black/20 focus:border-black outline-none px-3 py-2 font-mono text-sm"
            />
            <span className="block text-[11px] opacity-40">
              需对 {GH_OWNER}/{GH_REPO} 具备 Contents 读写权限的细粒度令牌。
            </span>
          </div>

          {error && <div className="text-sm text-diagonal-red">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 archive-text text-sm font-bold hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            {loading ? "校验中…" : "进 入"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <AdminAuthContext.Provider value={{ token, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}
