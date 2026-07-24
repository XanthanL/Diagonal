// 浏览器直连 GitHub API 的提交客户端。
// token 由使用者在登录门粘贴、存于 localStorage，运行时传入——不打包进代码。
import { Octokit } from "@octokit/rest";
import {
  ARCHIVE_CONTENT_DIR,
  GH_BRANCH,
  GH_OWNER,
  GH_REPO,
  IMAGE_DIR_BASE,
  LEGACY_STORE_PATH,
  STORE_PATH,
} from "@/lib/admin/constants";
import { buildArticleHtml, extractBody, extractTitle } from "@/lib/admin/htmlTemplate";
import type {
  ArchiveItem,
  ArticleListItem,
  PublishPayload,
} from "@/lib/admin/types";

const owner = GH_OWNER;
const repo = GH_REPO;
const branch = GH_BRANCH;

function client(token: string): Octokit {
  if (!token) throw new Error("缺少 GitHub 访问令牌");
  return new Octokit({ auth: token });
}

// 浏览器安全的 base64 → UTF-8 文本（GitHub 返回的 content 带换行）
function b64ToUtf8(b64: string): string {
  const binary = atob(b64.replace(/\s/g, ""));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder("utf-8").decode(bytes);
}

// 带重试的 API 调用，处理瞬时网络错误
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 1500): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (e: unknown) {
      lastErr = e;
      const status = (e as { status?: number }).status;
      const msg = (e as Error).message || "";
      const isTransient =
        status === 502 ||
        status === 503 ||
        msg.includes("Failed to fetch") ||
        msg.includes("NetworkError") ||
        msg.includes("timeout");
      if (!isTransient || i === retries - 1) throw e;
      await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
    }
  }
  throw lastErr;
}

export interface RepoFile {
  path: string;
  content: string; // utf-8 文本或 base64 二进制
  encoding: "utf-8" | "base64";
}

// 校验令牌是否可访问目标仓库（登录门用）
export async function verifyToken(token: string): Promise<void> {
  const octokit = client(token);
  await withRetry(() => octokit.repos.get({ owner, repo }));
}

// 读取单个文本文件内容；不存在返回 null
async function readTextFile(octokit: Octokit, path: string): Promise<string | null> {
  try {
    const res = await withRetry(() =>
      octokit.repos.getContent({ owner, repo, path, ref: branch })
    );
    const data = res.data as { content?: string; encoding?: string };
    if (data.content) return b64ToUtf8(data.content);
    return null;
  } catch (e: unknown) {
    if ((e as { status?: number }).status === 404) return null;
    throw e;
  }
}

// 列出档案内容目录下的文件名
async function listArchiveFileNames(octokit: Octokit): Promise<string[]> {
  try {
    const res = await withRetry(() =>
      octokit.repos.getContent({ owner, repo, path: ARCHIVE_CONTENT_DIR, ref: branch })
    );
    if (Array.isArray(res.data)) {
      return res.data.filter((d) => d.type === "file").map((d) => d.name);
    }
    return [];
  } catch (e: unknown) {
    if ((e as { status?: number }).status === 404) return [];
    throw e;
  }
}

// 列出仓库某目录下所有文件（递归），返回完整路径
async function listDirectory(octokit: Octokit, dirPath: string): Promise<string[]> {
  const result: string[] = [];
  async function walk(path: string) {
    try {
      const res = await withRetry(() =>
        octokit.repos.getContent({ owner, repo, path, ref: branch })
      );
      if (Array.isArray(res.data)) {
        for (const entry of res.data) {
          if (entry.type === "file") result.push(entry.path);
          else if (entry.type === "dir") await walk(entry.path);
        }
      }
    } catch (e: unknown) {
      if ((e as { status?: number }).status !== 404) throw e;
    }
  }
  await walk(dirPath);
  return result;
}

// 一次提交写入多个文件（文本 + 二进制），触发 GitHub Actions 重建
async function commitFiles(
  octokit: Octokit,
  files: RepoFile[],
  message: string,
  deletePaths: string[] = []
): Promise<string> {
  const ref = await withRetry(() => octokit.git.getRef({ owner, repo, ref: `heads/${branch}` }));
  const latestCommitSha = ref.data.object.sha;
  const latestCommit = await withRetry(() =>
    octokit.git.getCommit({ owner, repo, commit_sha: latestCommitSha })
  );
  const baseTreeSha = latestCommit.data.tree.sha;

  const treeItems: { path: string; mode: "100644"; type: "blob"; sha: string | null }[] = [];
  // 串行创建 blob，避免大图并行上传触发网络错误
  for (const f of files) {
    const blob = await withRetry(() =>
      octokit.git.createBlob({
        owner,
        repo,
        content: f.content,
        encoding: f.encoding === "base64" ? "base64" : "utf-8",
      })
    );
    treeItems.push({ path: f.path, mode: "100644", type: "blob", sha: blob.data.sha });
  }
  // 删除文件：tree entry with sha: null
  for (const p of deletePaths) {
    treeItems.push({ path: p, mode: "100644", type: "blob", sha: null });
  }

  const tree = await withRetry(() =>
    octokit.git.createTree({ owner, repo, base_tree: baseTreeSha, tree: treeItems })
  );
  const commit = await withRetry(() =>
    octokit.git.createCommit({
      owner,
      repo,
      message,
      tree: tree.data.sha,
      parents: [latestCommitSha],
    })
  );
  await withRetry(() =>
    octokit.git.updateRef({ owner, repo, ref: `heads/${branch}`, sha: commit.data.sha })
  );
  return commit.data.sha;
}

// —— 高层操作（替代原 API 路由）——

const emptyItem = (id: string, title: string): ArchiveItem => ({
  id,
  title,
  titleEn: "",
  artist: "对角线计划",
  artistEn: "Diagonal",
  year: "",
  type: "Document",
  typeEn: "Document",
  tags: [],
  tagsEn: [],
  location: { city: "自贡", cityEn: "Zigong", code: "ZG", coordinates: "29.3N, 104.7E" },
  region: "Southwest",
  project: "the-salt-of-life",
});

// 文章列表：合并 store（后台新增/已编辑）+ legacy.json（历史文章，可编辑）
export async function listArticles(token: string): Promise<ArticleListItem[]> {
  const octokit = client(token);
  const [storeRaw, legacyRaw, names] = await Promise.all([
    readTextFile(octokit, STORE_PATH),
    readTextFile(octokit, LEGACY_STORE_PATH),
    listArchiveFileNames(octokit),
  ]);

  const store: ArchiveItem[] = storeRaw ? JSON.parse(storeRaw) : [];
  const legacy: ArchiveItem[] = legacyRaw ? JSON.parse(legacyRaw) : [];
  const storeIds = new Set(store.map((s) => s.id));
  const legacyMap = new Map(legacy.map((l) => [l.id, l]));

  const enIds = new Set<string>();
  const allIds = new Set<string>();
  for (const name of names) {
    if (name.endsWith(".en.html")) enIds.add(name.replace(/\.en\.html$/, ""));
    else if (name.endsWith(".html")) allIds.add(name.replace(/\.html$/, ""));
  }
  // legacy.json 中的 id 也纳入（即便暂无对应 HTML 文件）
  for (const l of legacy) allIds.add(l.id);

  const list: ArticleListItem[] = [];
  for (const s of store) {
    list.push({
      id: s.id,
      title: s.title,
      year: s.year,
      source: "store",
      hasEn: enIds.has(s.id) || Boolean(s.titleEn),
      draft: s.draft,
    });
  }
  for (const id of Array.from(allIds)) {
    if (storeIds.has(id)) continue;
    const l = legacyMap.get(id);
    list.push({
      id,
      title: l?.title || id,
      year: l?.year,
      source: "legacy",
      hasEn: enIds.has(id) || Boolean(l?.titleEn),
    });
  }

  list.sort((a, b) => {
    if (a.year && b.year) return b.year.localeCompare(a.year);
    if (a.year) return -1;
    if (b.year) return 1;
    return b.id.localeCompare(a.id);
  });
  return list;
}

// 读取单篇文章（编辑回填）
export async function getArticle(
  token: string,
  id: string
): Promise<{ source: "store" | "legacy" | "new"; item: ArchiveItem; bodyZh: string; bodyEn: string }> {
  const octokit = client(token);
  const [storeRaw, legacyRaw, zhHtml, enHtml] = await Promise.all([
    readTextFile(octokit, STORE_PATH),
    readTextFile(octokit, LEGACY_STORE_PATH),
    readTextFile(octokit, `${ARCHIVE_CONTENT_DIR}/${id}.html`),
    readTextFile(octokit, `${ARCHIVE_CONTENT_DIR}/${id}.en.html`),
  ]);

  const store: ArchiveItem[] = storeRaw ? JSON.parse(storeRaw) : [];
  const legacy: ArchiveItem[] = legacyRaw ? JSON.parse(legacyRaw) : [];
  const storeItem = store.find((s) => s.id === id);
  const legacyItem = legacy.find((s) => s.id === id);

  // 优先级：后台已编辑(store) > 历史元数据(legacy) > 空白模板(new)
  const item = storeItem || legacyItem || emptyItem(id, zhHtml ? extractTitle(zhHtml) : id);
  const source: "store" | "legacy" | "new" = storeItem
    ? "store"
    : legacyItem || zhHtml
    ? "legacy"
    : "new";

  return {
    source,
    item,
    bodyZh: zhHtml ? extractBody(zhHtml) : "",
    bodyEn: enHtml ? extractBody(enHtml) : "",
  };
}

// 发布 / 更新文章
export async function publishArticle(
  token: string,
  payload: PublishPayload
): Promise<string> {
  const octokit = client(token);
  const { item, kicker, coverCaption, bodyZh, bodyEn, images, draft } = payload;

  if (!item?.id || !/^[A-Za-z0-9._-]+$/.test(item.id)) throw new Error("缺少或非法的文章 ID");
  if (!item.title?.trim()) throw new Error("缺少中文标题");
  if (!item.year?.trim()) throw new Error("缺少发布时间 year");
  if (!bodyZh?.trim()) throw new Error("中文正文为空");

  // 规范化
  item.typeEn = item.type;
  item.draft = Boolean(draft) || undefined;
  if (!item.series) delete item.series;

  const storeRaw = await readTextFile(octokit, STORE_PATH);
  const store: ArchiveItem[] = storeRaw ? JSON.parse(storeRaw) : [];
  const idx = store.findIndex((s) => s.id === item.id);
  if (idx >= 0) store[idx] = item;
  else store.unshift(item);

  const files: RepoFile[] = [];
  files.push({
    path: STORE_PATH,
    content: JSON.stringify(store, null, 2) + "\n",
    encoding: "utf-8",
  });
  files.push({
    path: `${ARCHIVE_CONTENT_DIR}/${item.id}.html`,
    content: buildArticleHtml({ item, kicker, coverCaption, body: bodyZh, lang: "zh" }),
    encoding: "utf-8",
  });
  if (bodyEn?.trim() && item.titleEn?.trim()) {
    files.push({
      path: `${ARCHIVE_CONTENT_DIR}/${item.id}.en.html`,
      content: buildArticleHtml({ item, kicker, coverCaption, body: bodyEn, lang: "en" }),
      encoding: "utf-8",
    });
  }
  for (const img of images || []) {
    if (!img.filename || !img.base64) continue;
    if (!/^[A-Za-z0-9._-]+$/.test(img.filename)) throw new Error(`非法图片文件名：${img.filename}`);
    files.push({
      path: `${IMAGE_DIR_BASE}/${item.id}/${img.filename}`,
      content: img.base64,
      encoding: "base64",
    });
  }

  return commitFiles(
    octokit,
    files,
    `content(admin): ${draft ? "draft " : ""}${item.id} ${item.title}`
  );
}

// 删除文章：移除 store 条目 + HTML 文件 + 图片目录
export async function deleteArticle(token: string, id: string): Promise<string> {
  if (!id || !/^[A-Za-z0-9._-]+$/.test(id)) throw new Error("非法文章 ID");
  const octokit = client(token);

  const storeRaw = await readTextFile(octokit, STORE_PATH);
  const store: ArchiveItem[] = storeRaw ? JSON.parse(storeRaw) : [];
  const filtered = store.filter((s) => s.id !== id);
  if (filtered.length === store.length) throw new Error("文章不存在于 store 中");

  const deletePaths: string[] = [
    `${ARCHIVE_CONTENT_DIR}/${id}.html`,
    `${ARCHIVE_CONTENT_DIR}/${id}.en.html`,
  ];
  const imageFiles = await listDirectory(octokit, `${IMAGE_DIR_BASE}/${id}`);
  deletePaths.push(...imageFiles);

  const files: RepoFile[] = [
    {
      path: STORE_PATH,
      content: JSON.stringify(filtered, null, 2) + "\n",
      encoding: "utf-8",
    },
  ];
  return commitFiles(octokit, files, `content(admin): delete ${id}`, deletePaths);
}
