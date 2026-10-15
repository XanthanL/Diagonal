# 施工协调规则（COORDINATION）

> 多会话并行施工的协调基准。任何会话开工前先读一遍；与其他口头约定冲突时，以本文件为准。
> 建立：2026-08-22 · 维护：统筹会话

## 一、当前工地状态

| 工地 | 目录 | 内容 | 进度源 |
|---|---|---|---|
| 天车重建 | `salt-plant-3d/` | 用 img2threejs 分 pass 程序化重建天车模型 | 建议：重建工作记入 `REBUILD.md`；`TASKS.md` 已全项收尾，冻结为手工模型时代的历史，不再混用 |
| 门楼（架空） | `gatehouse-3d/` | 体素风格**魔幻架空门楼**：立于绿水青山间、长牛角翘角（2026-08-29 由真实建筑「西秦会馆」两度更名→彻底去真实化重建，旧研究文档与参考照片已全部删除） | `gatehouse-3d/docs/DESIGN.md`（唯一设计说明；原 T 任务表/进度源机制已随创作重置废止） |

## 二、共享文件锁（同一时间只允许一方集成）

以下文件是两工地的共同雷区，**先完成集成的一方先动，后集成者负责 rebase 并解决冲突**：

- `src/app/page.tsx` —— Lab 卡片（天车卡片③的文案更新 vs 门楼新增条目）。注意：2026-08-28 首页已改为**文字索引行**版式（无封面缩略图），新增条目按同款行语言接入（mono 标签 | 标题+描述 | 红色「进入 →」）
- `src/lib/translations.ts` —— 双语文案
- `package.json` / `scripts/*` / `.github/workflows/*` —— 构建与部署管线

各子项目目录内部（`salt-plant-3d/`、`gatehouse-3d/`、`apparel-rack/`）互不相干，可随意并行。
（`vacuum-salt/` 方向已于 2026-08 终止：首页 Lab 入口、导航项与 dev rewrite 均已拆除，**仓库里的源码留待作者确认后删除**，不再往里面加东西。）

## 三、子站同步纪律（防双副本漂移）

- **只编辑根目录源**（如 `salt-plant-3d/`）；`public/<subsite>/` 一律视为生成物。
- 同步已自动化：`npm run dev` 与 `npm run build`（prebuild 钩子，CI 同样生效）都会把 root 复制进 public；手动同步用 `npm run sync:sites`。
- `public/<subsite>/` 已转为**不入库生成物**（.gitignore 已登记）：提交只需根目录源，public 副本不再入库。
- **同步排除表在 `src/lib/subsites.json`（不是脚本里硬编码）**：每个站点一条 `excludes`，只过滤顶层名。新增排除项改这里。
  ⚠️ 内部笔记（`OPTIMIZATION.md` / `TASKS.md` / `REBUILD.md`）必须列进盐项目的 excludes——此前它们被一起复制进部署物，
  公网可直接读到 `…/salt-plant-3d/TASKS.md`。

## 三之二、子站外壳单源（shared/viewer/）

- `shared/viewer/chrome.css`：所有静态子站共用的**设计 token + 顶栏 + 侧栏 + 详情抽屉 + 响应式**。
  三个子站的 `index.html` 都在自己的 `css/style.css` **之前**引入它，因此子站自有样式可以安全覆盖通用层。
- `shared/viewer/loader.css`：载入揭幕（斜切纸面翻页），与主站 PageTransition 同源。
- 改外壳一律改 `shared/`，不要在各子站的 `css/style.css` 里各改一份——那正是此前 `.nav-item` / `--ease-out` 走散的原因。
- 左上 `DIAGONAL` 字标必须是 `<a class="brand">` 且指向官网首页：全站「左上角 logo 返回首页」的约定对子站同样成立。

## 四、资料与照片政策

- 参考照片（`salt-plant-3d/images/`、`gatehouse-3d/docs/reference/`）**不入库**（已 gitignore），仅作本地参考，对应里程碑验收后删除。
- 门楼已架空化（2026-08-29）：原型照片**永不公开发布**、仅内部造型研究；「仅参考照片建模 ≠ 发布照片本身」在本项目为默认状态，不触发 CC 署名义务；若未来任何页面确需引用照片，才按 `gatehouse-3d/docs/01-research.md` §8 附作者与许可署名。
- `gatehouse-3d/docs/samples/` 是 T1 正式交付物（风格基准，图内旧称属原型期记录），**入库保留**，与参考照片性质不同。

## 五、技术约定

- three vendored 版本锁定 **r160**，以 `salt-plant-3d/js/vendor/three.module.js` 为唯一基准；西秦 T3 脚手架复制同一文件，不得自行升级版本。
- 提交信息规范：`type(scope): 描述`，scope ∈ {salt-plant-3d, gatehouse-3d, vacuum-salt, site, coordination}；禁用无意义短信息。历史提交中的 xiqin-hall-3d scope 视为 gatehouse-3d 前身。
- CDP 截图自评工具的家在 `salt-plant-3d/tools/`（已入库）；`public/*/tools` 不是工具的家，会被同步清掉，不要在那里新建文件。
