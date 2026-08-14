# salt-plant-3d · 维护与优化手册

本文件面向后续接手优化的会话。该项目无构建系统、纯浏览器执行；模型全部程序化生成，改几何后必须跑 `?selftest` 的碰撞回归。

## 1. 项目概览

- 技术栈：原生 JS + Three.js（本地 vendor），import map 加载，无 npm 构建。
- 内容：自贡井盐木构天车（井架）3D 解构。主天车 + 副天车 + 大车、地辊、碓架、汲卤筒、寮棚竹笆。
- 页面交互：左侧构件导航聚焦，右侧详情面板，顶栏动画/自动聚焦/语言切换，3D 拖拽旋转缩放。
- 已提交基线：`09a1caf`（修复多处穿模 + 控制台 + selftest 碰撞回归）。

## 2. 关键文件地图

| 路径 | 职责 |
|---|---|
| `index.html` | UI 骨架、import map |
| `css/style.css` | 全部 HUD 样式 |
| `js/data.js` | `PROCESS` 导览数据、图例、i18n 文案 |
| `js/main.js` | Three 场景构建、动画主循环、selftest |
| `js/vendor/three.module.js` | 本地 Three.js，**不要替换版本而不回归** |

`main.js` 内部结构（按函数）：

- 贴图/材质：`make*Texture`、材质池 `poolMat/vWood/vStone`、共享 `ironS/bambooS/thatchS`
- 几何缓存/合并：`cachedGeo`、`mergeGeos`、`emit/flushBin`
- 束柱：`bundleStrut/trunkMesh/helixWindGeo/addWind`
- 场景：`buildGround/buildStations/buildWell/buildDerrick/buildCart/buildGroundRoller/buildDuijia/buildShed/buildScreen`
- 聚焦：`initParts/buildOutline/applyFocus/focusOn`
- 动画：`animate`（碓架、汲卤筒、提卤绳、轮体旋转、autoTour）
- 自检：`runSelfTest`（颜色漂移 + **碰撞回归断言**）

## 3. 模型与坐标不变量

### 3.1 双塔与井口

- 主天车：中心 `(-0.6, 0.2)`，H=15，baseHalf=2.1，6 层。
- 副天车：中心 `(2.6, -0.8)`，H=11，baseHalf=1.6，5 层。
- 井口中心 = 主天车中心 `(-0.6, 0.2)`；天辊中心同样对齐。
- 提卤绳从主天车天辊**轮缘正下方** `(0, -1.2, 0) + wheelGrp.position` 出绳，垂直落到汲卤筒。不要把出绳点改回随轮缘旋转（会穿过 y≈12.5 的侧向水平箍梁）。
- 汲卤筒行程 `top=3.4 / bottom=1.3`；最低点时锥尖进入井筒（井筒半径 0.8，顶部 y≈0.72，底部 y≈0.3）。
- 钻杆与汲卤筒交替：`yy <= 2.34` 时钻杆隐藏。

### 3.2 风篾避让规则

- 风篾跳角规则集中在 `windStayShouldSkip(a, isMain)`，`buildDerrick` 与 selftest 共用。
- 当前规则：
  - 主天车跳过 0°、330°。
  - 副天车跳过 120°、150°、180°、210°。
- `windStaySegments()` 返回实际生成的风篾线段；任何“换角度/移动双塔/移动碓架”的改动，都必须重跑 `?selftest`。
- 碓架位置 `(6.4, 1.8)`；其左侧摆动的杠杆曾与副天车 60° 风篾相交，不要移回 `(5.6, 1.6)`。

### 3.3 静态合并与动态网格

- 静态木构统一收进 `statC/statT` 临时树，再 `emit + flushBin` 合并为少量大 BufferGeometry。新增大量静态构件时应走同一管道。
- 动态对象：
  - 大车轮体、地辊、提卤主绳已标 `userData.noOutline = true`；它们每帧改变自身 transform，静态 outline 会脱节。
  - 天辊轮组、碓架 pivot、汲卤筒 group 是整体 group 动画，outline 作为子级可随 group 移动，不需要 noOutline。
- `Math.random()` 用于木纹、做旧、束柱排布，导致每次加载的 mesh id/bbox/外观略有不同；这是有意的做旧，但不要依赖固定 mesh id 写测试。

## 4. 验证与自检

### 4.1 `?selftest`

`?selftest` 是无头验收入口，覆盖：

1. 分区/描边/压暗逻辑；
2. 碰撞回归：
   - 所有实际生成的主/副天车风篾线段 vs `cols/cart/ground/duijia/shed/well`；
   - 提卤主绳顶部/底部行程 vs `cols/top`；
   - 汲卤筒最低点：锥尖在井筒内、半径 < 井筒半径、钻杆隐藏。

结果写入 `window.__diag`，`diag.selftest` 为 `"ok"` 或 `"fail"`；失败时同时写入 `window.__errs`。

运行方式（无 npm）：

```powershell
cd E:\Code\Diagonal\salt-plant-3d
python -m http.server 8765 --bind 127.0.0.1
# 另开一个进程：
# Chrome headless 打开 http://127.0.0.1:8765/index.html?selftest
# 通过 CDP 求值：JSON.stringify(window.__diag)
```

期望关键字段：

```json
{
  "errs": [],
  "collision": { "checked": 20, "hits": 0, "clear": true, "errors": [] },
  "selftest": "ok"
}
```

### 4.2 改动后的检查清单

- 改了 `buildDerrick` 的塔位/层数/风篾 → 跑 `?selftest`。
- 改了 `buildWell` 的井口/汲卤筒/提卤绳 → 跑 `?selftest`，并肉眼确认最低行程。
- 改了 `PROCESS` 的 cam/target/position → 点击对应构件，确认取景与光晕。
- 新增动态自身变换的 mesh → 设 `userData.noOutline = true` 或改成 group 动画。

## 5. 已知遗留问题 / 后续优化清单

- **P-next-1**：数据文案仍写“风篾 12 根”，但模型为避让相邻装置跳过若干角度（主 10 根、副 8 根）。建议改为“按避让布置”的文案，或做弯曲/换锚点绕障以恢复 12 根视觉。
- **P-next-2**：大车轮体、地辊只有 torus 本体旋转，辐条仍是静态；可把轮体+辐条+绕绳放进同一个旋转 group。
- **P-next-3**：提卤绳链（天辊→地辊→大车）是静态直线，端点接在轮中心/轮管内部附近，不是严格切线绕轮；可改成多段曲线并跟随轮体旋转。
- **P-next-4**：碓架钻杆只是落到地面示意，不在井口上方；文案说“与提卤共用井位”。可让钻杆指向井口，或明确为独立展示机位。
- **P-next-5**：`buildOutline` 为所有网格克隆 2 层外壳（描边+光晕），大合并网格会成倍增加内存；可按 part 级生成一个合并 outline，而不是逐 mesh 克隆。
- **P-next-6**：`?selftest` 当前只测关键线段；可扩展为「所有跨 part 网格的 bbox 对 + 局部三角相交」的自动扫描（小心同 part 结构件合法相交）。
- **P-next-7**：`data.js` 的英文 `principleEn` 大车条目里残留中文“串联”（line 120 附近）；应清理。`I18N.ctrl` 中 `rotate/labels/download/playOff` 已无对应 UI，可删或补齐。
- **P-next-8**：移动端顶栏按钮增多后，窄屏可能挤压 legend；需要 390px 宽度视觉回归。
- **P-next-9**：项目无 ESLint/格式化/CI；若要长期维护，建议至少加 `node --check` 语法校验和 headless selftest 的 CI 步骤。

## 6. 给未来会话的调试提示

- 本项目自带 `?selftest`，是最高效的回归入口；不要只靠肉眼。
- 想遍历场景/网格/bbox 时，把项目复制到临时目录，在 `clock = new THREE.Clock()` 后加：
  ```js
  window.__dbg = { scene, camera, controls, PART, PART_ORDER, stationGroups };
  ```
  再用 headless Chrome + CDP 求值；完成后删临时目录，不要提交 debug 钩子。
- 射线相交检查可参考 `runSelfTest` 的 `segmentHits`：Raycaster near/far 设为 `0.05 ~ 0.995*len`，并排除 `o.userData.isOutline`。
- 模型构建在 `buildStations/buildWell` 完成，`PROCESS` 只是导览数据；新增“构件导览项”时不要重复建整套模型。
