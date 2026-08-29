# 03 · 开发设计文档 —— 西秦会馆大门体素解构

> 本文档是 Phase B–F 各任务的技术契约。任务卡（00-progress.md）说"做什么"，本文档说"怎么做、做成什么样"。
> 阅读对象：每个执行会话。开工前先读本文档相应章节，再动代码。

---

## 1. 技术选型与工程约束

| 项 | 决策 | 理由 |
|---|---|---|
| 运行形态 | 纯静态站，无构建步骤 | 与 salt-plant-3d 一致；`public/xiqin-hall-3d/` 直接发布 |
| 渲染库 | three.module.js + jsm/{OrbitControls, CSS2DRenderer}（自 salt-plant-3d 复制 vendor） | 版本一致、缓存友好 |
| 模块系统 | ES Modules + importmap（`"three"` → `./js/vendor/three.module.js`） | 同上 |
| 材质策略 | **单材质 + 顶点色**（MeshLambertMaterial, vertexColors），零贴图 | 体素风的正确做法；省内存省 draw call |
| 体素单位 | 1 voxel = 1 three.js 单位（模型内部）；相机距离按体素尺度取值 | 免换算；导出/截图时整体 scale 即可 |

**与 salt-plant-3d 的关系**：UI 骨架、交互范式（聚焦/压暗/描边/自动导览/双语/selftest）全部沿用其模式；差异仅在几何来源——它用参数化 Mesh 建模，我们用**体素生成器 + 合并网格**。

## 2. 目录结构（T3 建立，后续任务填充）

```
xiqin-hall-3d/
├─ index.html              # T3：页面骨架（改自 salt-plant-3d）
├─ css/style.css           # T3：样式（同源复制，仅改品牌字样相关类）
├─ js/
│  ├─ vendor/…             # T3：three + addons（复制）
│  ├─ voxel/palette.js     # T4：20 色板唯一来源（02 §7 表 → { name: '#hex' } + THREE.Color 表）
│  ├─ voxel/builder.js     # T4：VoxelWorld / ops / mesher
│  ├─ data.js              # T5：PARTS 元数据 + 双语文案（schema 见 §4）
│  ├─ parts/               # T5–T12：每 Part 一个生成模块
│  │  ├─ terrace.js        #   T6  台基·台阶·栏杆
│  │  ├─ gatehouse.js      #   T7  底层柱网·大门·白墙
│  │  ├─ lions.js          #   T8  石狮 ×2
│  │  ├─ eave1.js          #   T9  第一重檐 + 斗栱带
│  │  ├─ walls.js          #   T10 二三层墙身（匾额/团窠/格窗/彩画带）
│  │  ├─ upperRoofs.js     #   T11 T2~T4 重檐 + 歇山脊饰宝顶 + 全部翘角风铃
│  │  └─ wings.js          #   T12 次间 + 两翼廊庑
│  ├─ main.js              # T5 装配 / T14 交互增强
│  └─ selftest.js          # T4/T13/T20：?selftest 断言套件
└─ docs/                   # 已有（00~03 文档、samples、reference、tools）
```

## 3. 坐标系与世界约定

- 体素坐标整数三元组 `(x,y,z)`；**x∈[0,160)**（面宽），y=0 为台基地面，z∈[0,44)。
- 场景装配时统一平移：`group.position.set(-80, 0, -22)`，使模型中心轴为 x=0。
- 临街面朝 **+z 观察者**（相机默认在 z>0 半空）。镜像工具以平面 **x=80** 对称。

## 4. 数据 schema（data.js，兼容 salt-plant-3d）

```js
export const PARTS = [
  {
    id: 'terrace', index: 1,
    name: '台基 · 石阶', subtitle: '石作基座',
    nameEn: 'Terrace & Steps', subtitleEn: 'Stone platform',
    color: 0x98938a,                 // 导览图例色 = 该 Part 主色
    cam: [0, 18, 120], target: [0, 4, 10],   // 相机锚点（初值，见 §6）
    principle: '…', principleEn: '…',        // 工艺/功能原理（双语段落）
    reaction: { zh: ['…', '…'], en: ['…'] }, // 结构·营建要点（要点列表）
    params: ['…'], paramsEn: ['…'],          // 关键形制（含数值与"参考值"措辞）
    build: null                       // 由 main.js 注入 parts/terrace.js 的生成函数引用
  },
  // …overview(P0) 与其余 8 个 Part 同构
];
```

- P0 overview 条目复用 `equipment/equipmentEn/output/outputEn` 字段（语义改为「建筑构成」「大门职能」，HUD 标签同步改）；
- 字段名与 salt-plant-3d 的 PROCESS 完全对齐，保证其 HUD 逻辑可平移；
- 所有涉及 01 §7 待核实项的文案，一律带「约 / 参考值 / 待考」前缀。

## 5. builder.js API（T4 的交付契约）

```js
// —— 数据结构 ——
export class VoxelWorld {
  set(x,y,z, colorName)      // colorName 必须是 palette.js 的键名（如 '金·主体'）
  get(x,y,z): string|null; has(x,y,z): boolean; delete(x,y,z)
  count(): number; keys(): Iterable
}
// —— 造型算子（均为 (world, 参数) => world 的纯追加函数）——
ops.box(w, x0,y0,z0, sx,sy,sz, colorName)
ops.roofSlab(w, x0,x1, y, z0,dz, colorName?)         // 屋面板：自动瓦垄条纹（暗底+每4格2亮）
ops.eaveTier(w, {lipY, xl, xr, depth, slopeSteps, upSteps, bell})  // 一整重檐：
  // lip(3格厚) → 内向阶梯坡面(slopeSteps=[[dxIn,dyUp],…] 逐级变陡)
  // → 两端 upSteps 个 2×2×2 翘角(升1外移1/步) → 角尖下挂风铃(留1格空气)
ops.band(w, {y, h, x0, x1, z, base, unitEvery?, unitColor?, centerPanel?}) // 斗栱带/彩画横带
ops.roundel(w, cx, cy, z, r, {ring='金·主体', core='金·高光'})            // 团窠（欧氏度量环）
ops.lattice(w, {x0,y0,z0, w,h, pitchX=3, pitchY=4})                        // 木格窗/格栅门
ops.plaque(w, {x0,y0,z, w,h, chars, charW=3, pitch=4})                     // 黑匾+金字节奏块
ops.lion(w, xLeft, {mirror=false})                                         // 石狮六段法
ops.ridgeSet(w, {y, x0, x1})                                               // 灰塑正脊+鸱吻+宝顶
ops.mirrorX(srcWorld): VoxelWorld                                          // 绕 x=80 镜像出新世界
// —— 网格化 ——
export function buildPartMesh(world, {voxelSize=1}): THREE.Mesh
// 六邻域可见面剔除 → X 向同色 run 合并（quad）→ BufferGeometry(position/normal/color)
export function buildAll(parts): THREE.Group               // 每 Part 一个 Mesh（name=part.id）
```

**实现要点（硬性）**
1. 面剔除查邻域时只在本 Part 世界内查询——跨 Part 的少量被遮面允许保留（换取分 Part 独立网格与简单性）；
2. run 合并仅沿 X 方向一维进行；同一 y/z 行内连续同色体素合成一个 quad；
3. 每个 quad = 4 顶点 6 索引；顶点属性：position / normal / color（palette hex→linear Color）/ aPart 不需要（已按 Part 分 Mesh）；
4. 纯函数：同参数两次构建输出逐字节一致（selftest 断言）；
5. palette.js 是色板**唯一**来源——出现表外色名直接 throw。

## 6. 相机锚点表（初值；T13/T14 两轮校准）

模型中心轴 x=0，地面 y=0；相机 fov≈45°。

| Part | target | cam（观察位） | 备注 |
|---|---|---|---|
| P0 总览 | [0, 48, 0] | [36, 62, 235] | 微俯 3/4 视角，呼应基准照片 |
| P1 台基 | [0, 5, 8] | [0, 16, 105] | 正视略俯 |
| P2 石狮 | [-17, 9, 6] | [-6, 15, 42] | 先看左狮，右狮由用户旋转 |
| P3 门堂柱网 | [0, 15, 0] | [0, 22, 88] | 正立面正视 |
| P4 第一重檐 | [0, 37, -4] | [30, 45, 100] | 仰角看斗栱带 |
| P5 匾额墙身 | [0, 54, -8] | [14, 58, 72] | 平视团窠群 |
| P6 上层檐与脊 | [0, 86, -6] | [38, 96, 125] | 高仰角收全四重檐 |
| P7 次间两翼 | [-52, 12, 0] | [-70, 26, 88] | 左翼为例 |
| P8 特写件 | 浮层独立场景 | — | 见 §8 |
| P9 盔顶（可选） | [0, 92, -14] | [-46, 108, -95] | 从院内背视 |

## 7. HUD / i18n 改动点（相对 salt-plant-3d 模板）

| 位置 | 改为 |
|---|---|
| `<title>` / og:* | 西秦会馆 3D 解构 · 武圣宫大门 / DIAGONAL |
| brand-sub | `/ 西秦会馆` |
| side-title | 武圣宫大门 · 复合门楼 |
| side-tip | 点击构件聚焦 · 拖拽旋转 · 滚轮缩放 |
| ip-title（块标题） | 「建筑形制」替代「工艺原理」；「结构·营建要点」保留；「提卤产出」→「大门职能」 |
| legend | PARTS 的 index+name（双语跟随切换） |
| loader tip / lang pill | 不变 |

## 8. 特写件方案（T16 预埋）

聚焦 P5/P8 时，在信息面板顶部插入一块 **canvas 内嵌小视口**（160×110px, DPR≥2）：用同一 builder 以 1vx=0.02m 生成特写世界（戏文看板/团窠/石狮头）并单独渲染，主相机不动。避免双相机同步复杂度。特写世界定义放 `parts/carvings.js`。

## 9. 性能预算

| 指标 | 预算 | 手段 |
|---|---|---|
| 三角形总数 | ≤ 250k（红线 350k） | 可见面剔除 + X 向 run 合并（台基前脸 4 行 → 仅 4 个 quad 这类收益） |
| Draw call | ≤ 20 | 每 Part 单 Mesh（≤10）+ 地面 + 辅助 |
| 材质数 | 1（vertexColors Lambert）+ 描边/光晕 2 | 无贴图 |
| 首包 JS | three vendor ~1.24MB（gzip ≈310KB）+ 业务 <60KB | 与既有子项目持平 |
| 移动端 | ≥30fps | DPR clamp ≤2；关阴影；粒子/风铃动画减半 |

## 10. selftest 断言清单（?selftest 时执行，结果写 #diag）

1. **builder 基础**：单盒 → quads==6, verts==24, indices==36；
2. **合并**：相邻同色双盒(X向) → quads==9；异色双盒 → quads==10；
3. **剔除**：被包围体素不产生面；
4. **确定性**：同一 Part 构建两次，position 数组 JSON 相等；
5. **色板纪律**：全模型出现的色名集合 ⊆ palette 键集（违例抛错即失败）;
6. **包围盒**：总模型 bbox ≈ x[-80,80] y[0,~118] z[-22,22]（容差 ±1）;
7. **装配冒烟**：renderer 能创建、buildAll() 后 group.children.length === PARTS.length；
8. （T20 追加）FPS 探针 3 秒均值 ≥50（桌面）/≥28（移动 UA 模拟）。

## 11. 风险与预案

| # | 风险 | 触发信号 | 预案 |
|---|---|---|---|
| R1 | 三角形超预算 | selftest#6/统计 >350k | 升级为 2D greedy 合并；或屋面瓦垄降为纯色 |
| R2 | 锚点手感差 | T13 比对/T14 实测 | 锚点表集中一处（§6），一轮校准即可 |
| R3 | 石狮辨识度不足 | 眯眼测试不过 | 回退"剪影优先"重排六段比例；细节让位 LOD-B 特写 |
| R4 | 通高等数据缺失 | — | 已定口径：照片优先 + "参考值"措辞（01 §7） |
| R5 | importmap 兼容 | 旧浏览器白屏 | 与 salt-plant-3d 同约束；页脚注明建议浏览器 |
| R6 | 会话间上下文丢失 | 新会话不知进度 | 00-progress.md 为唯一交接界面；任务卡含依据指针 |
| R7 | 无法截图比对（T13） | 无头 Edge 不可用 | `msedge --headless --screenshot` 优先；不行则请用户提供截图 |

## 12. 任务 ↔ 文件映射（执行速查）

| 任务 | 触碰文件 | 不许触碰 |
|---|---|---|
| T4 | voxel/palette.js, voxel/builder.js, selftest.js(基础断言) | parts/*, data.js |
| T5 | data.js(骨架), main.js(装配), parts/*.js(空壳) | — |
| T6–T12 | 对应 parts/*.js + data.js 对应条目文案 | 其他 part 文件 |
| T13 | 各 part 微调 + selftest.js(#4~#7) | — |
| T14/T15 | main.js, data.js 文案补全 | parts 几何 |
| T16 | parts/carvings.js, main.js(浮层) | 主模型 parts |
| T18 | src/components/XiqinHallCover.tsx, src/app/page.tsx, src/lib/translations.ts | 本子项目 |
