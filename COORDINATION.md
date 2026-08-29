# 施工协调规则（COORDINATION）

> 多会话并行施工的协调基准。任何会话开工前先读一遍；与其他口头约定冲突时，以本文件为准。
> 建立：2026-08-22 · 维护：统筹会话

## 一、当前工地状态

| 工地 | 目录 | 内容 | 进度源 |
|---|---|---|---|
| 天车重建 | `salt-plant-3d/` | 用 img2threejs 分 pass 程序化重建天车模型 | 建议：重建工作记入 `REBUILD.md`；`TASKS.md` 已全项收尾，冻结为手工模型时代的历史，不再混用 |
| 盐署门楼（架空） | `salt-gate-3d/` | 体素风格虚构盐政门楼解构（2026-08-29 由「西秦会馆/武圣宫大门」更名架空，原型资料降为内部研究档案） | `salt-gate-3d/docs/00-progress.md`（唯一进度源：每轮只做一个任务，收尾前必须回写状态行） |

## 二、共享文件锁（同一时间只允许一方集成）

以下文件是两工地的共同雷区，**先完成集成的一方先动，后集成者负责 rebase 并解决冲突**：

- `src/app/page.tsx` —— Lab 卡片（天车卡片③的文案更新 vs 西秦 T18 新增卡片④）。注意：2026-08-28 首页已改为**文字索引行**版式（无封面缩略图），新增条目按同款行语言接入（mono 标签 | 标题+描述 | 红色「进入 →」）
- `src/lib/translations.ts` —— 双语文案
- `package.json` / `scripts/*` / `.github/workflows/*` —— 构建与部署管线

各子项目目录内部（`salt-plant-3d/`、`salt-gate-3d/`、`vacuum-salt/`）互不相干，可随意并行。

## 三、子站同步纪律（防双副本漂移）

- **只编辑根目录源**（如 `salt-plant-3d/`）；`public/<subsite>/` 一律视为生成物。
- 同步已自动化：`npm run dev` 与 `npm run build`（prebuild 钩子，CI 同样生效）都会把 root 复制进 public；手动同步用 `npm run sync:salt-plant`。
- `public/salt-plant-3d/` 已转为**不入库生成物**（.gitignore 已登记，2026-08-28）：提交只需根目录源，public 副本不再入库。
- 同步排除表（见 `scripts/copy-salt-plant.js`）：`images/`、`.img2threejs/`、`tools/` 不进部署物。

## 四、资料与照片政策

- 参考照片（`salt-plant-3d/images/`、`salt-gate-3d/docs/reference/`）**不入库**（已 gitignore），仅作本地参考，对应里程碑验收后删除。
- 盐署门楼已架空化（2026-08-29）：原型照片**永不公开发布**、仅内部造型研究；「仅参考照片建模 ≠ 发布照片本身」在本项目为默认状态，不触发 CC 署名义务；若未来任何页面确需引用照片，才按 `salt-gate-3d/docs/01-research.md` §8 附作者与许可署名。
- `salt-gate-3d/docs/samples/` 是 T1 正式交付物（风格基准，图内旧称属原型期记录），**入库保留**，与参考照片性质不同。

## 五、技术约定

- three vendored 版本锁定 **r160**，以 `salt-plant-3d/js/vendor/three.module.js` 为唯一基准；西秦 T3 脚手架复制同一文件，不得自行升级版本。
- 提交信息规范：`type(scope): 描述`，scope ∈ {salt-plant-3d, salt-gate-3d, vacuum-salt, site, coordination}；禁用无意义短信息。历史提交中的 xiqin-hall-3d scope 视为 salt-gate-3d 前身。
- CDP 截图自评工具的家在 `salt-plant-3d/tools/`（已入库）；`public/*/tools` 不是工具的家，会被同步清掉，不要在那里新建文件。
