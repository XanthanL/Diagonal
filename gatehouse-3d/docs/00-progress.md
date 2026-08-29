# 门楼（架空）体素解构 · 任务指导书与进度表

> 文档编号：00-progress.md（本文件是整个项目的**唯一进度源**，每个会话必须以它为准）
> 配套文档：`01-research.md`（原型研究档案，内部用）· `02-voxel-style-guide.md`（体素规范）
>
> **⚑ 项目更名（2026-08-29，用户决定）**：成品模型与真实建筑差异过大，**弃用「西秦会馆 / 武圣宫大门」之名**，正式定名 **「门楼 · The Gatehouse」**（无名义、无官署归属的一座架空门，回归「门」本身；曾短暂定名「盐署门楼」，同日均被用户否决），后续以此身份进入 THE LAB。目录 `xiqin-hall-3d/` → `gatehouse-3d/`，部署路径规划 `/gatehouse-3d/`。`01-research.md` 与 `docs/reference/` 照片降级为**内部原型研究档案**：仅供造型参考；一切公开展示物（页面文案、README、首页 Lab 卡片、og 元数据）一律架空措辞，不出现真实建筑名、不公开照片。本文件历史行与旧截图中的旧称属当时记录，不再追改。
> 最后更新：T1–T6 已完成 ✅；2026-08-22 体检轮复核 T0/T1 通过；2026-08-23 T4/T5 闭环 ✅（selftests=10/10，截图 check-t5 入库；期间 elevation-guide 历经六轮复校）；2026-08-27 T6 闭环 ✅（台基层精细建模，check-t6 入库）；**2026-08-28（重构会话产出，未回写→本轮代记）：Part 拆分独立模块 + `js/spec.js` 尺寸单一数据源 + `js/voxel/ops.js` 扩展（mirror/plaque/lattice/lion）+ selftest 10→15 项（新增总包围盒/无悬空/四重檐递减/三角预算/跨 Part 无重叠）+ T7 门堂柱网建成 + T8–T12 粗稿预置**；**2026-08-28（体检轮）独立复证：`node --check` 17 文件全过、无头 Chrome `SELFTEST-OK three=160 errs=0 selftests=15/15 parts:8`、正视/聚焦截图入库（check-t7-overview / check-t7-gatehall），T7 DoD 三条全过 → ✅**。注意：①T8–T12 虽有粗稿，仍须逐卡验收（含与参考照片比对）才可打勾；②背立面（献技楼侧）目前仅檐带外露、观感突兀，留 T13 比对与 T17 补全；③T4 起产出已于 2026-08-29 入库。2026-08-29：**二次更名定稿「门楼 · The Gatehouse」**（目录 `gatehouse-3d/`，回归门本身）；**T8 执行轮 ✅**（重写 lion：头朝中轴＋头大身蹲，单狮 10×12×6，symFails=0，check-t8 双截图入库）。同日晚 **T21 山水地形 ✅**（用户增补"真3D＋山水"需求：terrain 部件＋修掉 builder 顶面卷绕反向的既有大 bug——纸片感根因）。下一任务 **T22 · 本体进深三维化**（用户优先级），其后回到 T9。

---

## 一、项目概览

| 项 | 内容 |
|---|---|
| 目标 | 在 THE LAB 新增实验作品：**架空「门楼」体素解构**（可交互 3D，双语，构件导览；原型研究仅供内部参考，公开不指涉真实建筑） |
| 形态 | 静态站点子项目，复用 salt-plant-3d 工程模式（无构建步骤），部署于 `/gatehouse-3d/` |
| 核心交付 | ① 体素主模型（四重檐牌楼门复合建筑）② 构件导览交互 ③ 双语信息面板 ④ 首页 Lab 第四卡片 |
| 硬约束 | 全模型 ≤20 色；1 vx = 0.2 m；程序化生成、可复现；简化必须可追溯 |

### 里程碑总览

| 里程碑 | 内容 | 对应任务 |
|---|---|---|
| M1 规范定稿 | 样例图片 + 详细开发设计 | T1–T2 |
| M2 主模型立起来 | 完整大门体素模型，轮廓通过照片比对 | T3–T13 |
| M3 可导览 Demo | 聚焦/导航/双语/自动导览可用 | T14–T15 |
| M4 特写件完成 | 团窠板 / 戏文看板 / 石狮高模（含可选盔顶扩展） | T16–T17 |
| M5 上线 | 主站集成 + 部署 + 性能 + 验收文档 | T18–T20 |

---

## 一·补 · 调研要点速查（建模硬数据卡）

> 来源：`01-research.md`（史实）与 `docs/reference/` 实拍照片。每个任务会话开工前先过这一节。

**形制数字**
- 总面宽 ≈32 m → **主模型 X 向 160 格**（1 vx = 0.2 m）；通高按 elevation-guide 口径 ≈23.6 m（含宝顶；2026-08-22 用户裁决"就高"，原 17~20 m 估算作废）→ Y 向 118 格（预算上限 120）；进深含出檐 → Z 向约 44 格。
- 复合建筑 = 武圣宫大门（临街四重檐牌楼门）+ 献技诸楼（院内），屋顶互相咬合；文献口径：**四柱七楼盘门 / 四层重檐歇山 / 共 24 个檐角 / 22 根石柱支撑**。
- 复合建筑内部四层：门厅 → 献技楼 → 大观楼 → 福海楼。
- 立面三段天际线宽度节奏：两翼廊庑 ≈6 m ＜ 次间 ≈5 m ＜ 中央门楼 ≈12 m。

**立面自下而上的固定序列**（对照 salt-museum-2009.jpg）
台基石阶 → 石狮一对（须弥座）→ 底层红柱+石柱础 / 黑漆大门+白灰墙 → 石青彩画横带 → 大匾（黑漆描金 9 字位；架空后匾文不填，原型匾文见 01 档案）→ 一重檐（最宽，檐下如意斗栱金点带）→ 二层团窠花板黑漆墙身 → 二重檐 → 三层木格窗墙身 → 三重檐 → 顶层大团窠 → 四重檐（最小）→ 歇山 + 灰塑正脊宝顶。翘角步数逐层递减（3→2→2→1，2026-08-22 统一定案，与 elevation-guide 绘制一致），每角尖挂风铃。

**色彩七族 ≤20 色**：青瓦灰 / 黑漆 / 描金 / 石青彩画 / 朱红柱 / 白灰墙·灰塑 / 砂岩（+栗木格栅）。最终 HEX 见 02 §7 与 `samples/palette.png`。

**关键参考照片索引**
- `salt-museum-2009.jpg` —— 正立面全景，**比例与构图的第一基准**
- `fredriksen-c.jpg` —— 木雕看板特写，**戏文看板特写件的母本**
- `gate-front-01.jpg` —— 匾额/团窠/斗栱带细节
- `gate-02.jpg` —— 献技诸楼背面檐下彩绘木雕带 + 盔顶（T17 用）
- `fredriksen-b.jpg` —— 屋脊灰塑 / 瓦垄 / 檐角风铃细节

**待核实项的执行口径**（01 §7）：通高、"四柱七楼"分位、瓦作类型等均**不阻塞开发**；一律按照片优先建模，文案中以"参考值/待考"措辞。

---

## 二、已完成事项 ✅

| 编号 | 事项 | 产出 |
|---|---|---|
| T0.1 | 资料收集：中文维基百科正文（史实）+ 9 张 CC/公有领域照片下载入库 | `docs/reference/*.jpg` ×9（含许可信息，见 01 §8） |
| T0.2 | 研究资料汇编：沿革、布局、武圣宫大门形制、雕刻体系、色板、待核实清单 | `docs/01-research.md` |
| T0.3 | 体素风格指南：三总纲、尺度网格预算、分件结构、屋顶规则、雕刻策略、搭建顺序 | `docs/02-voxel-style-guide.md` |
| T0.4 | 图片生成环境验证：pwsh + System.Drawing 可用 | （无文件，结论记于此） |

## 三、待完成事项一览

共 **20 个任务**（T1–T20，其中 T17 为可选），按 A–F 六个阶段推进。
**每轮会话只执行一个任务**：从下表中取最靠前的未完成任务。

---

## 四、阶段与任务卡

### Phase A · 规范收尾（M1）

#### 任务卡 T1 —— 生成样例指导图 ✅
> 完成：本轮 · 产出 `docs/tools/gen-samples.ps1`（可复现）+ `docs/samples/` 下 4 张 PNG（palette / roof-profile-guide / carving-roundel-sample / elevation-guide）；DoD 四项全过：脚本重跑一致、色号与 02 §7 一致、立面图三段天际线+四重檐+翘角可辨且比例贴近参考照、中文无乱码。已逐张目检，修正了 4 处问题（翘角方向反、标注压盖、团窠环断点、标题遮挡）。遗留可接受小瑕疵：上段阶梯标注轻微贴边；匾额金字为节奏块示意。
- **目标**：程序生成 4 张样例 PNG，作为建模的视觉基准。
- **依据**：02 指南 §4.4 / §6.1 / §7；01 研究 §6 色板、§4 照片观察。
- **产出**：
  - `docs/tools/gen-samples.ps1`（可复现脚本）
  - `docs/samples/palette.png`（20 色板，HEX 与 02 §7 一致）
  - `docs/samples/roof-profile-guide.png`（举折阶梯 + 角部起翘双图，带网格标注）
  - `docs/samples/carving-roundel-sample.png`(黑漆底描金团窠板体素样例)
  - `docs/samples/elevation-guide.png`（大门立面体素参考图：四级檐天际线 + 10 格网格 + 图例）
- **验收标准**：
  - [x] 4 张 PNG 入库且脚本重跑结果一致；
  - [x] palette.png 色号逐条等于 02 §7 表；
  - [x] elevation-guide 可辨认"中间高两侧低三段天际线、四重檐、翘角"，并与 `reference/salt-museum-2009.jpg` 目测比例接近；
  - [x] 图内中文标签无乱码。

#### 任务卡 T2 —— 详细开发设计文档 ✅
> 完成：本轮 · `docs/03-dev-plan.md` 入库。四项 DoD 全过：①PROCESS schema 与 salt-plant-3d 字段对齐（§4，equipment/output 语义改为「建筑构成/大门职能」）；②builder API 覆盖 02 §4–§6 全构件（§5：eaveTier/band/roundel/lattice/plaque/lion/ridgeSet/mirrorX 等）；③P0–P9 相机锚点初值表（§6）；④待核实项统一"照片优先+参考值措辞"策略（§4 末、R4）。另定：单材质顶点色、零贴图、X 向 run 合并网格化、selftest 八项断言清单（§10）。
- **目标**：把开发方案落到文件级/API 级，作为 Phase B–F 的技术契约。
- **依据**：00 本表、salt-plant-3d 现有工程（index.html importmap、main.js 结构）、02 指南 §9。
- **产出**：`docs/03-dev-plan.md`，须包含：目录结构、PROCESS 数据 schema（对齐 salt-plant-3d 字段）、builder.js API 定义（box/fill/patternBand/buildMesh/partId）、相机锚点表（每 Part 的 cam/target 初值）、HUD/i18n 改动点、性能预算、selftest 断言清单、风险预案。
- **验收标准**：
  - [ ] schema 与 salt-plant-3d 字段兼容（id/name/nameEn/cam/target/principle/params…）；
  - [ ] builder API 能表达 02 指南 §4–§6 的全部构件；
  - [ ] 每个 Part 有初始相机参数；
  - [ ] 不确定项（01 §7 清单）在文档中标注了默认处理策略。

### Phase B · 工程基建（M2 前置）

#### 任务卡 T3 —— 项目脚手架 ✅
> 完成：本轮。产出：`index.html`（改自 salt-plant-3d：标题/og/品牌字样/侧栏标题/信息面板块名「建筑形制/大门职能」）、`css/style.css`（同源复制，无天车字样残留，已核）、`js/vendor/`（three r160 + OrbitControls + CSS2DRenderer，尺寸与源一致）、`js/main.js`（暖纸空场景：Hemisphere+Directional 光、地面圆盘+淡网格、OrbitControls 阻尼、总览/语言按钮绑定、?selftest 钩子）、`docs/tools/serve.mjs`（本地静态服务器，后续会话验证基建）。
> 验收证据：① `node --check` 语法通过；② 无头 Edge 实测 `?selftest` → `SELFTEST-OK three=160 errs=0 | renderer:1,scene:1,modelGroup:1,controls:1`（dump-dom 断言）；③ 截图 `docs/samples/check-t3-scaffold.png`：顶栏品牌/总览/EN 按钮、侧栏标题与提示、暖纸地面均正常。
> 过程中修复：loader 未隐藏——`hidden` 属性被 CSS `#loader{display:flex}` 压过，改为 salt-plant-3d 同款 `classList.add('hidden')` 淡出方案。
> 诚实备注：DoD 第 2 条"OrbitControls 可旋转缩放"以控件实例化+零报错佐证，未做真人拖拽交互实测（留 T14 联测复验）；DoD 三项判定为通过。

#### 任务卡 T4 —— 体素生成核心库 ✅
> 完成：本轮 · 2026-08-23。产出：`js/voxel/palette.js`（20 色闭环 + NAME_TO_INDEX + COLORS 预计算 + getIndex/getColor throw 拦截）、`js/voxel/builder.js`（VoxelWorld + ops.box/mirrorX/merge + buildPartMesh 六邻域剔除 + X 向 run-merge）、`js/selftest.js`（10 项断言）。`js/main.js` 接入：SELFTEST 短路后调 runSelftestSuite，结果写 #diag。验收证据：① `node --check` 4 个 JS 文件全过；② 无头 Chrome 实测 #diag = `SELFTEST-OK three=160 errs=0 selftests=10/10 | builder 基础:1,合并:1,b 异色双盒(X向) quads=10（无合并）:1,剔除:1,确定性:1,色板纪律:1,包围盒:1,装配冒烟:1,镜像:1,palette 闭环:1`；③ 截图 `docs/samples/check-t4-builder.png` 入库。
> DoD 逐条：① selftest 全绿 ✅；② 同一输入两次构建 position 字节级一致 ✅（断言 #4 JSON.stringify 比对通过）；③ 4⁴ 测试盒渲染 BufferGeometry 4 属性齐备 ✅（断言 #7）。
> 诚实备注：03-dev-plan §10 写"相邻同色双盒 quads=9"，本实现 quads=10。差异来源：03 隐含的额外合并（可能 Y/Z 方向也合并），本实现按硬规则"run 仅沿 X"实现，留 T13 收尾时由用户裁决是否调整实现去匹配 §10。10/10 通过但 #2 的实际值与 03 期望差 1。
- **目标**：实现 builder.js：体素数据结构 → 合并几何。
- **产出**：`js/voxel/builder.js`；能力：`setVoxel/getVoxel/box/fill/patternBand/mirrorX`、六邻域可见面剔除、同色 run-merge、partId 顶点属性、`buildGeometry(parts)` 输出 BufferGeometry；`?selftest` 断言：单盒顶点数=24、相邻同色盒合并后面数下降、包围盒正确。
- **验收标准**：
  - [x] selftest 全绿；
  - [x] 同一输入两次构建输出完全一致（纯函数）；
  - [x] 一个 10×10×10 测试盒渲染帧率正常、颜色正确。

#### 任务卡 T5 —— 数据骨架与场景装配 ✅
- **目标**：data.js 九个 Part 条目占位 + builder 接入 three 场景。
- **产出**：`js/data.js`（P0–P8 条目：双语名称/描述占位/cam/target 按 03-dev-plan 锚点表）、main.js 装配逻辑（按 Part build → merge → add scene）。
- **验收标准**：
  - [x] 页面显示 9 个占位色块组（各 Part 用临时色区分）——8 个实体 Part 全部装配（overview 无独立实体），diag 断言 `parts:1` 通过；
  - [x] 侧栏出现 9 个导航项（点击无报错，聚焦逻辑允许暂为空操作）——已实现 focusOn 相机聚焦 + 信息面板填充；
  - [x] 中英切换能刷新侧栏文字——applyLang 同步刷新导航名 / 图例 / 信息面板。
- **完成注记（2026-08-23）**：新增 `js/data.js`（9 条目双语元数据 + I18N UI 文案）、`js/parts/placeholders.js`（8 个粗轮廓占位生成器，各自图例色）、main.js 装配层（assemble/buildNav/buildLegend/focusOn/showInfo/applyLang，VX=0.2m，中轴 x=80 平移至世界原点）。验收：`node --check` 3 文件全过；无头 Chrome `#diag = SELFTEST-OK three=160 errs=0 selftests=10/10 parts:8`；正常页 9 个 nav-item 双语渲染正确；截图 `docs/samples/check-t5-assembly.png` 入库。

### Phase C · 主模型搭建（M2 核心，顺序执行不可跳）

> 每个任务完成后必须跑一次"截图 vs 参考照片"比对再进入下一任务。比例依据：`samples/elevation-guide.png`。

#### 任务卡 T6 —— P1 台基层 ✅
- **内容**：石台基（全宽）、中央踏步、台基边缘栏杆基线；石材两档色。
- **依据**：02 §8[1]；照片 courtyard-03 / salt-museum-2009 台基部分。
- **验收**：[x] 台基高 4 格（0.8m）；[x] 踏步 4 级居中；[x] 与参考照轮廓一致。
- **完成注记（2026-08-27）**：替换 `js/parts/placeholders.js` 的 `terrace()` 占位为精细台基模型——台明 x8..152 全宽（≈30 m）/ z4..39（深 ≈7.2 m）/ 高 4 vx（y0..4），3 层砂岩·暗主体 + 1 层砂岩·亮压顶，顶面外缘 1 格砂岩·暗环线（前/后/左/右）作栏杆基线；中央踏步 x64..96（≈6.4 m）居中于 x80、紧贴台明前缘 z40..43，4 级实填楔形体（砂岩·亮），treads y=4/3/2/1 渐降至地面。`js/data.js` terrace 条目同步校正：principle 三级→四级、params 台明 6vx→4vx / 阶数 3→4。无头 Chrome ?selftest parts:8 不变；截图 `docs/samples/check-t6-terrace.png` 入库。下一任务 **T7**。

#### 任务卡 T7 —— P3 底层柱网与门堂 ✅
- **内容**：前檐柱列（红柱 + 石柱础）、中央黑漆大门（双扇 + 门环）、两侧白灰墙 + 深色框、次间木格栅门。
- **依据**：02 §8[2][3]；照片 salt-museum-2009 门堂层、gate-front-01。
- **验收**：[x] 中央开间宽约 56 格；[x] 白墙/黑门/红柱三色关系正确；[x] 柱础为石色。
- **完成注记（2026-08-28 体检轮代记）**：`js/parts/gatehouse.js`（重构版）以 `js/spec.js` BAY 为尺寸源——中央开间 x52..107（56 格）、黑漆大门 x68..91 + 栗木门缝 + 金门环、白灰墙 + 栗木墙边框、朱红柱 x54..57（镜像 102..105）+ 砂岩·暗柱础；另含石青彩画带（赭金开光 + 四朵宝相花）与九字大匾（大匾 Z 跨 BODY..34 兼作通往 T1 斗栱带的连通桥）。复证：selftest 15/15（含跨 Part 无重叠）、聚焦截图 `check-t7-gatehall.png` 入库。

#### 任务卡 T8 —— P2 石狮一对 ✅
- **内容**：左右镜像石狮（含须弥座），卷毛凸点、张口、蹲坐轮廓。
- **依据**：02 §6.3 六段搭建法；照片 salt-museum-2009 / hall-jpg 石狮。
- **验收**：[x] 单只 ≤14×12×16 格；[x] 缩到 25% 仍可辨"狮"的剪影（头大身蹲）；[x] 左右对称、头朝模型中心。
- **完成注记（2026-08-29 执行轮）**：重构粗稿两处不达标——头在左端（面朝外，违"头朝中心"）、通高 14 超预算保守解读 → 本轮重写 `ops.lion()`：大头 4×4 移至 +x 端（镜像后双狮头相向朝中轴）、蹲身 6×4 低伏成头大身蹲比例、卷毛改头顶行暗色镶嵌。终尺单狮 10 宽×12 高×6 深；无头 Chrome 实测 `selftests=15/15 parts:8` + 逐体素镜像校验 symFails=0 + 左狮 bbox [10,12,6]；截图 check-t8-lions.png / check-t8-overview.png 入库。诚实备注：远景（25%）可辨"座+兽"剪影，卷毛镶嵌细节远景不可感知，属可接受简化；石狮聚焦锚点（§6 P2）取景偏左，锚点微调归 T14 联测。下一任务 **T9**。

#### 任务卡 T9 —— P4 第一重檐 + 斗栱带 ☐
- **内容**：跨度最大的一层檐：如意斗栱程序化带 → 檐口瓦当线 → 三段举折坡面 → 两端翘角（3 步）→ 角尖风铃。
- **依据**：02 §4.1/§4.2/§5；roof-profile-guide.png。
- **验收**：[ ] 檐口跨约 x44–116；[ ] 斗栱金点节奏 3 格周期；[ ] 翘角阶梯方向正确（向外上）。

#### 任务卡 T10 —— P5 二三层墙身（匾额·团窠·格窗）☐
- **内容**：二层黑漆墙身（大匾 + 金字行 + 双团窠列）、二层檐上方三层墙身（中央木格窗 + 小团窠对）。
- **依据**：02 §6.1/§6.4；照片 gate-front-01 匾额区、carving-roundel-sample.png。
- **验收**：[ ] 匾额位置在第一重檐之上、第二重檐之下；[ ] 团窠为八边近似圆环；[ ] 格窗有程序化棂条。

#### 任务卡 T11 —— P6 第二~四重檐 + 歇山脊饰 ☐
- **内容**：三重檐逐级收窄（翘角步数 2→2→1，统一定案见 §七）、顶层歇山、灰塑正脊 + 鸱吻 + 宝顶。
- **依据**：02 §4.1/§4.3；照片 fredriksen-b 脊部灰塑、xiqin-2019 全景顶部。
- **验收**：[ ] 四重檐宽度严格递减；[ ] 正脊白灰色 + 宝顶端正；[ ] 总高落在 elevation-guide 标线 ±2 格。

#### 任务卡 T12 —— P7 次间与两翼廊庑 ☐
- **内容**：次间单坡屋面（向中心上扬 + 外端翘角）、两翼低矮廊庑（白墙 + 木格栅窗带 + 低檐）。
- **依据**：02 §3.3 宽度节奏；照片 xiqin-2019-david-stanley 全景两翼。
- **验收**：[ ] 三段天际线成立（翼 < 次间 < 中央塔楼）；[ ] 翼端翘角存在但小于中央。

#### 任务卡 T13 —— 全楼合并与照片比对（M2 验收）☐
- **内容**：全部 Part 合并渲染；眯眼测试；对照 `reference/salt-museum-2009.jpg` 修正比例偏差；输出对比截图存 `docs/samples/check-m2.png`。
- **验收**：
  - [ ] 正视截图并排比对：四重檐、24 角中的正面 8 角、三段天际线、石狮位置全部对应；
  - [ ] ?selftest 输出顶点数/包围盒且在预算内（≤30 万三角形）；
  - [ ] 发现的偏差已修正或记录到本表备注。

### Phase D · 交互与导览（M3）

#### 任务卡 T14 —— 聚焦系统 ☐
- **内容**：点击 Part 或导航项 → 相机平滑过渡至锚点、该 Part 描边提亮、其余压暗 0.6；"← 总览"返回。
- **依据**：03-dev-plan 锚点表；salt-plant-3d 的 focus/dim/outline 实现方式。
- **验收**：[ ] 9 个 Part 全部可聚焦/返回；[ ] 过渡平滑无跳变；[ ] 移动端触摸可用。

#### 任务卡 T15 —— HUD、双语与文案充实 ☐
- **内容**：信息面板字段填充（principle/reaction 要点/params/equipment 双语）、自动导览（8s/Part 可调速）、加载器；文案中把 01 §7 待核实项以"参考值/待考"措辞处理。
- **验收**：[ ] 每个 Part 双语详情完整显示；[ ] 自动导览一轮 9 站无卡死;[ ] 控制台零报错。

### Phase E · 特写件（M4）

#### 任务卡 T16 —— 特写三件套 ☐
- **内容**：LOD-B 高模：①团窠花板 ②戏文看板（舟船人物场景，按 02 §6.2）③石狮高模（1vx=0.02m）；以"聚焦后浮出放大"或独立展示位呈现。
- **依据**：02 §6.2/§6.3；照片 fredriksen-c（看板母本）。
- **验收**：[ ] 看板缩至 25% 仍读得出"金人蓝水戏曲场景"；[ ] 特写件可开合不影响主场景帧率。

#### 任务卡 T17 —— 盔顶扩展（可选）☐
- **内容**：献技诸楼背面两层歇山 + 六角盔顶，与大门歇山咬合（复合建筑完整性补全）。
- **依据**：01 §3 维基引文（24 檐角来源）；照片 gate-02（盔顶视角）。
- **验收**：[ ] 背视出现盔顶且角数与文献口径一致；[ ] 不遮挡临街立面既有成果。
- **备注**：时间不足可整体顺延，不阻塞 M5。

### Phase F · 主站集成与上线（M5）

#### 任务卡 T18 —— 首页 Lab 接入（文字索引行）☐
- **内容**：首页 Lab 区新增**第四条文字索引行**（2026-08-28 起首页已无封面卡：mono 标签 | 标题+描述 | 红色「进入 →」，见 `src/app/page.tsx` 条目 1–3 同构写法）——**不再做 Cover 组件**；`translations.ts` 补 `gatehouseLabel/gatehouseTitle/gatehouseDesc` 中英架空文案（措辞不涉真实建筑）；href 指向 `/gatehouse-3d/index.html`；检查 sitemap。
- **验收**：[ ] 桌面/移动端首页第四行正常显示与跳转；[ ] 中英切换文案齐全且无真实建筑名；[ ] 与现有三行版式完全同构、无需改网格。

#### 任务卡 T19 —— 部署链路与性能 ☐
- **内容**：构建/复制流程（`gatehouse-3d/` → `public/gatehouse-3d/`，**副本为生成物不入库**，按 COORDINATION §三 模式扩展 `scripts/` 同步脚本并挂入 prebuild，随 out/ 发布）、移动端降级（DPR 上限、阴影关闭、像素合并阈值）、首包体积核查。
- **验收**：[ ] 生产静态导出后 `/gatehouse-3d/index.html` 可直接访问；[ ] 移动端实测 ≥30fps；[ ] 子页新增资源 ≤1.5MB（three vendor 复用除外）；[ ] `public/gatehouse-3d/` 已列入 .gitignore。

#### 任务卡 T20 —— 验收测试与文档收尾 ☐
- **内容**：?selftest 全量断言、桌面+移动浏览器实测清单、与原型照片终比对（内部用，不入库展示）、撰写 README.md（简介/结构/运行 + **架空声明区块**：本作为对角线档案的架空创作；原型研究仅供内部参考、未发布任何照片，按 COORDINATION §四 不触发 CC 署名义务）。另撰写 OPTIMIZATION.md。
- **验收**：
  - [ ] selftest 断言全绿；
  - [ ] 实测清单（聚焦/导览/双语/降级）逐条打勾；
  - [ ] README 含架空声明区块，且全站无真实建筑名指涉；
  - [ ] 本进度表全部条目闭合。

### Phase G · 山水与三维化（用户增补，2026-08-29）

> 用户裁决：模型要"真 3D"——侧视不能是纸片；场景要有山有水，「门赖以拄其间」。

#### 任务卡 T21 —— 山水地形 ✅
- **内容**：terrain 部件（地坪/门前甬道/曲水两段/石梁桥/阶梯台地山×3 组 + 后干脊）；全部取色于既定 20 色（水用「水波·浅青」），不扩色。
- **验收**：[x] selftests 15/15（#10 建筑包围盒排除 terrain；无悬空/跨 Part 无重叠/三角 ≤250k 仍全局生效，实测约 238k）；[x] 前视/河桥特写截图入库（check-t21-overview / check-t21-river）。
- **重大附带修复**：`voxel/builder.js` FACES 的 py/ny/pz/nz 四面顶点卷绕与 THREE FrontSide 约定相反——**顶面/底面/前后面一直被背面剔除，只余 ±X 条片；这正是用户所见"模型像 2D、横着视角糟糕"的技术根因**。修正后全场体积感恢复（屋顶瓦垄、地坪、山台面首次正确显示）。
- **遗留（登记）**：①右上侧若干悬浮条片 = T9–T12 粗稿既有伪影（檐带/翘角范围问题），归 T13 合并比对处理；②总览/山水锚点为粗调，精修归 T14；③本体进深仍薄（墙一片拉通长）——立 T22 专治。

#### 任务卡 T22 —— 本体进深三维化 ☐
- **内容**：主体进深由"一片墙"改真剖面：Z.BODY 加深为多开间进深（前廊柱排 + 金柱排 + 后檐柱排，柱/门/匾各归其位，不再通长拉砖），山面（悬山两侧）加柱头枋与山花板；台基/檐带随进深外扩，#11/#13/#14 预算不破。
- **依据**：02 §4/§9 搭建顺序；侧视截图 check-t21-overview。
- **验收**：[ ] 正侧 90° 视角截图有层次（柱排可数、山面有构造）；[ ] 三角 ≤250k；[ ] selftest 全绿。

---

## 五、会话工作协议（每次会话必读）

1. **开工**：读本文件 → 取最靠前的 ☐ 任务 → 只做这一个任务，不多做。
2. **依据优先**：动手前先读该任务卡的"依据"指向的文档章节/照片/样例图。
3. **受阻即停**：若发现前置文档错误、比例失真、或需扩大范围 → 立即停下汇报，不得自行越界补救（修订文档另立新任务行）。
4. **收尾**：
   - 通过验收标准 → 把本文件中该任务标题的 ☐ 改为 ✅，并在任务卡下方追加一行 `> 完成：YYYY-MM-DD · 备注`；
   - 更新文首"最后更新"；
   - 向用户汇报（模板见下）。
5. **汇报模板**：

```
【任务 T# · 名称】状态：✅ / ⚠️(有备注) / ❌(受阻)
- 产出：…
- 验收自检：逐条 DoD 结果
- 备注/风险：…
- 下一任务预告：T# · 名称
```

---

## 六、任务索引（速查）

| ID | 任务 | 阶段 | 状态 |
|---|---|---|---|
| T0.1–T0.4 | 资料/研究/规范/环境验证 | 前置 | ✅ |
| T1 | 样例指导图 ×4 | A | ✅ |
| T2 | 03-dev-plan 开发设计 | A | ✅ |
| T3 | 项目脚手架 | B | ✅ |
| T4 | builder.js 核心库 | B | ✅ |
| T5 | data.js + 场景装配 | B | ✅ |
| T6 | 台基层 | C | ✅ |
| T7 | 柱网与门堂 | C | ✅（2026-08-28 重构版，体检轮复证） |
| T8 | 石狮一对 | C | ✅（2026-08-29 执行轮，重写 lion） |
| T9 | 第一重檐+斗栱带 | C | ☐ |
| T10 | 二三层墙身 | C | ☐ |
| T11 | 二~四重檐+脊饰 | C | ☐ |
| T12 | 次间与两翼 | C | ☐ |
| T13 | 合并比对（M2 验收） | C | ☐ |
| T14 | 聚焦系统 | D | ☐ |
| T15 | HUD/双语/导览 | D | ☐ |
| T16 | 特写三件套 | E | ☐ |
| T17 | 盔顶扩展（可选） | E | ☐ |
| T18 | Cover+首页 | F | ☐ |
| T19 | 部署+性能 | F | ☐ |
| T20 | 验收+文档收尾 | F | ☐ |
| T21 | 山水地形（+卷绕修复） | G | ✅（2026-08-29） |
| T22 | 本体进深三维化 | G | ☐ |

---

## 七、状态核查记录

| 日期/轮次 | 事件 | 核查结论 |
|---|---|---|
| 创建本表当轮 | T0 全部完成，进度表建立 | — |
| 用户"开始执行/继续执行"×3 后暂停 | 应用户要求全仓核查 | **T1–T20 均未开工**：`docs/tools/`、`docs/samples/`、`js/`、`css/`、index.html 均不存在；已入库文件 = 9 张参考照片 + 3 份文档，与第二节清单一致；**无半成品、无残留脏文件**。下一任务仍为 **T1** |
| 执行轮（调研速查入表 + T1/T2/T3） | 用户暂停指令 | **T1 ✅ T2 ✅ T3 ✅**（详见各任务卡完成注记）；新增文件：`tools/gen-samples.ps1`、`tools/serve.mjs`、`samples/`×5图（4样例+1脚手架验收截图）、`index.html`、`css/style.css`、`js/main.js`、`js/vendor/`×3。下一任务 **T4 · builder.js 核心库**。后台服务器已停，重启命令：`node xiqin-hall-3d/docs/tools/serve.mjs 8123` |
| 2026-08-22（体检轮） | 应用户要求复核 T0/T1 真实性 + 全仓检查 | **T0 复核通过**：照片 9/9 可读、01/02 章节齐全、System.Drawing 复验可用、色板四处（01§6→02§7→gen-samples.ps1→palette.png）20/20 一致；**T1 复核通过**：脚本重跑 MD5 与入库版逐一相同、四图无乱码、构图要素全部可辨。发现两项规范矛盾并经用户裁决：①**总高就高**——elevation-guide 宝顶 y≈118 格 vs 原预算 85~100 格 → 定为 ≈23.6 m/118 格（预算上限 120），02§2 与本表硬数据卡已修订，T11"标线 ±2 格"验收不受影响；②**翘角步数统一 3→2→2→1**——原三处口径不一（02§4.2「4→3→3→2」/本表「3→3→2→2」/样例图绘制「3,2,2,1」），以样例图为准，02§4.2、本表硬数据卡、T11 卡已同步。另备案小项：carving 样例微棋盘格用调色板外色 #26211f（仅插图纹理不入模）、palette 浅色块白字对比度偏低（可接受）。T3 回写由并行执行轮完成，本轮独立复证（无头 Chrome 实测 SELFTEST-OK three=160 errs=0、vendor 与 salt-plant-3d 基准 MD5 一致）后认可。下一任务 **T4** |
| 2026-08-23（T4 执行轮） | 应用户"开工 T4" | **T4 ✅**。新增文件：`js/voxel/palette.js`（20 色闭环）、`js/voxel/builder.js`（VoxelWorld + ops + buildPartMesh）、`js/selftest.js`（10 项断言）、`js/main.js` 接入 `?selftest` 路由。验收证据：① `node --check` 4 文件全过；② 无头 Chrome #diag = `SELFTEST-OK three=160 errs=0 selftests=10/10`；③ 截图 `docs/samples/check-t4-builder.png` 入库。诚实备注：03-dev-plan §10 写"相邻同色双盒 quads=9"实为 10（差异来自 Y/Z 方向是否合并），T13 比对阶段由用户裁决是否调整实现匹配 §10。后台服务器已停。下一任务 **T5 · data.js + 场景装配**。 |
 | 2026-08-23（elevation-guide 复校 · 第一轮） | 应用户"实拍太尖"反馈 | 旧 elevation-guide apex ~30°（顶角太尖），按新增参考图 `reference/front.jpg` 校准：① 整体加宽 T1~T4（T1 14.4→22.4 m，T4 5.2→11.2 m）；② 宝顶立体化（1 根针 → 3 段阶梯，16→12→8→4 收分 + 黑漆基座 + 金色嵌片）；③ T2 加大匾（黑漆 + 9 金字位）、T3 格栅 8→28 格、T4 团窠 r=4；④ 每层墙顶加 2 格高斗栱带（黑底 + 2×2 金点）；⑤ 脚注 `参考 reference/{salt-museum-2009, front}.jpg`。新 elevation-guide MD5 = `86e4f1b1...`，3 张未动样图 MD5 不变（脚本确定性验证通过）。 |
 | 2026-08-23（elevation-guide 复校 · 第二轮） | 应用户"团窠形态多样 + 翘角尖锐"反馈 + 新增 4 张参考 | ① 新增 3 个辅助函数：`VxRoundelConcentric`（同心圆宝相花，3 层金环 + 4 向十字花蕊 + 4 角回纹钩）→ T4 中央；`VxRoundelDiamond`（大金菱花 + 中心深色圆 + 5 瓣金花心）→ T2 翼侧；`VxPanelBead`（联珠纹 + 中心小菱形）→ T3 翼侧；② 新增 `VxEaveTip`（阶梯主体 + 1×1 栗木凤头 + 1×1 金顶尖 + 翼下灰塑带 + 角下风铃），每层 4 角共 8 个；③ 修正 T3 翘角步数 1→2，对齐 02 §4.2 统一 3→2→2→1；④ 仅动 `docs/tools/gen-samples.ps1`，4 张样图全部重生成：elevation-guide MD5 = `86e4f1b1...`（此轮修订后再跑保持），3 张未动样图 MD5 不变。参考图新增 `reference/团窠花板以及翘起来的屋檐边沿.jpg`、`reference/gate-02.jpg`、`reference/gate-front-01.jpg`、`reference/fredriksen-c.jpg` 共 4 张角度补充（存于 `reference/`，未作脚注因为已作为多角度交叉验证用、不再枚举）。 |
 | 2026-08-23（elevation-guide 复校 · 第三轮） | 应用户四点反馈 | ① 移除全部 8 处角下风铃（实拍无此物）；② 新增 `VxCurvedEave(cx,halfW,flat,y0,thick,rise)` 弯曲檐口——soffit 平、角端按 u² 幂函数平滑升起至翘角，替换旧"平 lip + 突然 tip"，4 层 rise = 6/5/5/5；③ 简化 VxEaveTip 配套（仅凤头栗木+金尖+翼下灰塑带，无风铃），并切换为新参数 `(cx,halfW,flat,y0,dir,rise)`；④ 新增 `VxPanelSym(cx,cy,w,h)` 单一 D4 中心对称花板函数（外金框 + 内金框 + 中心菱形 + 5 瓣花心 + 四角回纹钩，全程点+镜像对称），废弃 VxRoundelConcentric/Diamond/Bead 的 elevation 调用（保留函数定义作归档）；⑤ 三层花板按用户指定形状重排：T4 中央 12×12 正方形、T3 中央 10×14 竖矩形（+ 7×11 竖矩形两翼）、T2 12×7 横矩形两翼（+ 24×7 横矩形大匾）；⑥ roof-profile-guide 面板 B 同步改为弯曲檐口示意（无风铃），脚注"翘角风铃"→"翘角凤头"。elevation-guide MD5 = `480f7cbf...`、roof-profile-guide `5f6fcd11...`，3 张未动样图 MD5 不变。02 §4.2 翘角"步数 3→2→2→1"已被"rise 平滑弧"取代，待同步修订 §4.2 措辞。 |
| 2026-08-23（elevation-guide 复校 · 第四轮） | 应用户"屋角下方直角突兀 + 花板两侧实拍有屋檐包裹"反馈 | ① **屋角无直角**：`VxCurvedEave` soffit 同步升起公式升级为 `min(topY-(y0-thick+1), round(rise·u²+thick·u))`——升幅略大于 topY 升幅，使角端 h→1 收薄为薄尖，彻底消除 L 形直角；`VxEaveTip` 重写为 3 段 1×2 弧形上扬翼片（soffit 逐段 +1）+ 金尖，**修正方向 sign 错误**（旧版用 `cornerX-sign·k` 写成向内，正确应为 `cornerX+sign·k` 向外），去掉了翼下灰塑带；② **花板两侧包屋檐**：新增 `VxPanelWithEaves(cx,cy,w,h)`——花板两侧各加 1 宽×2 高瓦垄短柱 + 2 段弧形上扬翼片 + 金尖（短柱 soffit=yMid-1 高 2，翼片 soffit 逐段 +1），4 处花板（T2 横矩形×2 + T3 竖矩形×3 + T4 正方形×1）全部替换为 `VxPanelWithEaves` 调用，方向 sign 同样修正为向外；③ roof-profile-guide 面板 B 同步：弯曲檐口"微笑"形 + 弧形凤头 + 新脚注"soffit 逐段 +1 + 金尖"。elevation-guide MD5 = `6ce2bc95...`、roof-profile-guide `616930de...`，palette/carving-roundel-sample MD5 不变（脚本确定性验证通过）。无碰撞：T3/T4 花板翼尖距斗栱 1~2 格安全。 |
| 2026-08-23（elevation-guide 复校 · 第五轮 · 檐带结构大改） | 应用户"边缘不要突然变细（应为主体向外弧线延伸渐细）+ 花板处在檐带中心而非檐下"反馈 | ① **结构重构**：T2/T3/T4 由"高墙身 + 独立薄檐口"改为"矮墙身(2~3 行) + 厚檐带"，新增 `VxEaveBand(cx,halfW,flat,y0,bandH,rise)`——花板嵌于带内正中，上下均有 ≥2 行檐体包裹；② **全程连续收分**：`VxCurvedEave`/`VxEaveBand` 厚度随 u 线性收分 `h=max(1,round(H·(1-u)))`，像素采样验证 T1 剖面 14→11→9→7→5→3→1 单调无突变；③ `VxEaveTip` 改为 2 段 1×1 细尖 + 金尖；④ 衔接修补：T1 檐带 12 行紧贴斗栱带（rows 35..46）、宝顶与 T4 檐带间补黑漆顶柱（y=108..111）；⑤ **过程 bug**：`Vx` 体素矩形自 y 向上生长，新函数初版漏写 `- $h + 1` 偏移致檐带上浮、花板脱出——已修并建立像素级验收脚本（逐行采样 #/B/G 分类）确认四层"上檐/花板/下檐"结构。T4 花板因 PowerShell `[int]` 四舍五入偏 1 格，cy 100→101 已校准。elevation-guide MD5 = `8bdceb4d...`、roof-profile-guide `f58b2cb9...`，palette/carving-roundel-sample 不变。VxPanelWithEaves 调用全部移除（定义保留归档）。 |
| 2026-08-23（elevation-guide 复校 · 第六轮） | 应用户"有悬空 + 翘角要弧度上抬而非斜杆" | ① 像素级连通域检测定位悬空：T3/T4 层间空隙（y66–70、y86–91）→ 矮墙身向上延伸补齐；② `VxEaveTip` 重写为连通上翘弧钩（不再是对角单点斜杆链）；③ 次间翼角对角断片改搭接（x20–23 / x136–139）；④ 修 `VxEaveBand`/`VxCurvedEave` h=1 尾端对角断裂（相邻列行区间保证相交）。验收：全色板实体集下 BFS 连通域检测 components=1（9666 格，悬空清零），翘角呈弧度上抬。 |
| 2026-08-23（T5 执行轮） | 应用户"改完开始体素搭建" | **T5 ✅**。新增：`js/data.js`（PARTS 9 条目双语元数据，cam/target 按 03 §6 锚点表；I18N UI 文案）、`js/parts/placeholders.js`（8 个粗轮廓占位生成器，各自图例色）。改造 main.js：assemble（VX=0.2m、中轴平移）+ buildNav/focusOn/showInfo/buildLegend/applyLang。diag 增加 parts 断言与计数。验收：`node --check` 全过；无头 Chrome #diag = `SELFTEST-OK three=160 errs=0 selftests=10/10 parts:8`；正常页 9 个 nav-item 双语渲染正确；截图 check-t5-assembly.png 入库；服务器已停。下一任务 **T6**。 |
| 2026-08-27（T6 执行轮） | 应用户"继续" | **T6 ✅**。替换 `js/parts/placeholders.js` `terrace()` 占位为精细台基（全宽砂岩台明 4 vx + 中央 4 级踏步 + 顶面暗色栏杆基线环，建材统一砂岩两档色）；`js/data.js` terrace 文案/params 同步校正（三级→四级、6vx→4vx）。验收：`node --check` 全过；无头 Chrome ?selftest parts:8 通过、`SELFTEST-OK three=160 errs=0 selftests=10/10 parts:8`；截图 check-t6-terrace.png 入库；服务器已停。下一任务 **T7**。 |
| 2026-08-28（重构轮·代记 + 体检轮复核） | 发现当日 18:23–18:45 并行重构会话未回写进度源，应用户询问发起复核 | **复核通过，T7 ✅（代记）**。重构轮产出：8 个 Part 拆分独立模块（`js/parts/{terrace,lions,gatehouse,eave1,walls,upperRoofs,wings,closeups}.js` + `index.js` 注册表）、`js/spec.js`（GRID/Z/BAY 尺寸单一数据源，派生自 elevation-guide）、`js/voxel/ops.js`（mirror/plaque/lattice/lion）、selftest 10→15 项（总包围盒 x[0,159] y[0,117] z⊂[0,44)、无悬空 6-连通接地、四重檐宽度递减、三角 ≤250k、跨 Part 无体素重叠）。体检轮独立复证：`node --check` 17 文件全过；无头 Chrome（serve.mjs 8123 + CDP）`SELFTEST-OK three=160 errs=0 selftests=15/15 parts:8`；正视总览与 03 门堂柱网聚焦截图入库（check-t7-overview / check-t7-gatehall）；spec 数值核对中央开间 x52..107=56 格 ✓。遗留：①T8–T12 粗稿已存在，逐卡验收（含与参考照片比对）前保持 ☐；②背立面稀疏碎块（献技楼侧未建模）归 T13/T17 处理；③`placeholders.js` 已被 index.js 旁路，T13 时清理；④T4 起全部产出未 commit，待用户定夺入库时机。服务器已停。下一任务 **T8**。 |
| 2026-08-29（更名二轮 + T8 执行轮） | 应用户「抛开盐元素，回归门本身；开始下一任务」 | ① **二次更名定稿**：门楼 · The Gatehouse（无名义、无官署归属的架空门；曾短暂定名「盐署门楼」同日被否），目录 `salt-gate-3d` → `gatehouse-3d`，前台 og/侧栏/总览叙事/匾文（留白不题名）全部同步；② **T8 ✅**：粗稿判不合格（头朝外、通高 14）→ 重写 `ops.lion()`（头 4×4 置 +x 端、镜像后双狮相向，蹲身 6×4，卷毛镶嵌，座上枋修正到座顶），终尺 10×12×6；实测 `SELFTEST-OK three=160 errs=0 selftests=15/15 parts:8`、逐体素镜像校验 symFails=0、check-t8 双截图入库；石狮聚焦锚点取景偏左记 T14。服务器已停。下一任务 **T9**。 |
| 2026-08-29（T21 山水轮） | 应用户「要真 3D；旁有小河、有山有水、门赖以拄其间」 | ① 新增 `parts/terrain.js`（地坪单层＋门前甬道＋曲水两段＋石梁桥＋阶梯台地山 3 组＋后干脊；用「水波·浅青」等既定 20 色，未扩色）；`spec.js` 增 ENV/RIVER/BRIDGE/MOUNT 尺寸源；`index.js` 注册＋buildMergedWorld(excludeIds)；`selftest #10` 建筑包围盒排除 terrain；parts:9、selftests 15/15、三角约 238k≤250k。② **重大修复**：`builder.js` FACES py/ny/pz/nz 卷绕与 THREE FrontSide 相反致顶/前/后面全被背面剔除（模型纸片感的根因）——修正后体积感恢复。③ 调试钩子 `window.__gatehouse`。截图 check-t21-overview / check-t21-river 入库。遗留登记：右侧悬浮条片为 T9–T12 粗稿既有伪影（归 T13）；进深薄化立 T22。下一任务 **T22**。 |
