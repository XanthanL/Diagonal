# vacuum-salt · 维护与优化手册

本文件面向后续接手优化的会话：先读「坐标与状态不变量」和「历史踩坑」，再改代码，最后按「验证命令」回归。

## 1. 项目概览

- 技术栈：Next.js 14 App Router + TypeScript + Tailwind CSS + React Three Fiber 8 + drei + camera-controls + Framer Motion。
- 页面：单页 3D 工艺产线，五个环节从左到右：井卤开采与净化 → 多效蒸发结晶 → 离心脱水 → 干燥筛分 → 包装仓储。
- 部署：`next.config.mjs` 使用 `output: "export"`，basePath 由 `NEXT_PUBLIC_BASE_PATH` 决定；`out/` 是构建产物，**不要手改**。
- 已提交基线：`09a1caf`（修复衔接/穿模 + P1/P2 优化）。

## 2. 关键文件地图

| 路径 | 职责 |
|---|---|
| `app/page.tsx` | HUD 状态、播放/巡游、相机目标、Coachmark 生命周期 |
| `lib/data.ts` | 五环节文案、参数、原理、反应式、参考资料 |
| `lib/types.ts` | 数据模型 |
| `lib/pipelinePorts.ts` | **跨环节端口表与 STAGE_X/PLATFORM/PIPELINE 唯一来源**，含 `validatePipelinePorts()` |
| `lib/useProcessPaused.ts` | Canvas 内工艺动画暂停 Context |
| `lib/usePlayback.ts` | 自动播放 stageIndex/倍速 |
| `components/three/SceneShell.tsx` | Canvas 容器、灯光、CameraLimits、CameraFocus、暂停 Provider |
| `components/three/pipeline/layout.ts` | 相机锚点/全景相机，从 `lib/pipelinePorts` re-export 坐标常量 |
| `components/three/pipeline/PipelineScene.tsx` | 五个单元、跨环节 FlowTube、编号基座、OverviewFit |
| `components/three/pipeline/SceneLoader.tsx` | 动态加载 3D 场景 + 加载覆盖层 |
| `components/three/pipeline/FlowTube.tsx` | 跨环节/单元内管道粒子，已 InstancedMesh |
| `components/three/pipeline/FlowRail.tsx` | 平台流向轨，已 InstancedMesh |
| `components/three/pipeline/*Unit.tsx` | 五个环节设备建模与内部动画 |
| `scripts/validate-ports.ts` | Node 23 直接执行的 TS 端口校验脚本 |

## 3. 坐标与状态不变量

### 3.1 坐标约定

- 世界坐标：
  - 平台 `x ∈ [-27, 26]`，`y = -2.6`，深度 7。
  - 环节中心：`brine -20 / evaporate -6 / centrifuge 4 / dry 12 / pack 21`。
- **单元内部只允许用局部坐标**。每个 `*Unit` 最外层是 `<group position={[cx, 0, 0]}>`；内部几何、FlowTube 点都不得再叠加 `STAGE_X.*`。
  - 历史 bug：`DryUnit` 出口管曾把世界坐标写进局部坐标，结果世界 x=15 变成 x=27，与外部管道断开。现在内部使用 `SCREEN_FINE_OUT / DRY_OUTLET_LOCAL`。
- **跨环节端口只从 `lib/pipelinePorts.ts` 取**。新增/修改端口必须同步跑 `npm run validate:ports`。
- 相机锚点：
  - `layout.ts` 的 `anchors` 每个环节有 `pos / distance / height / halfWidth`。
  - `halfWidth` 用于竖屏聚焦自适应拉远；改动设备包围盒时要更新。
  - `OverviewFit` 按视口宽高比计算全景距离；不要恢复旧的 `clamp(18, 60)`，否则竖屏会裁掉两侧环节。

### 3.2 动画暂停

- 播放/暂停按钮同时控制巡游和产线动画；相机拖拽/缩放/聚焦不受暂停影响。
- `SceneShell` 在 Canvas 内提供 `ProcessPausedContext`；所有工艺 `useFrame` 必须：
  ```ts
  const paused = useProcessPaused();
  useFrame(() => { if (paused) return; ... });
  ```
- 新增任何设备动画时，按同样方式接入暂停，不要用全局 `state.clock.stop()`（会冻结相机过渡）。
- `HoverStage` 的 hover 抬升、`CameraFocus`、`OverviewFit` 不属于工艺动画，不应接暂停。

### 3.3 真剖面

- 蒸发/离心/干燥/包装使用世界空间 `THREE.Plane(normal(0,0,-1), constant)`，保留 `z <= 0` 半边，从相机侧剖开。
- 注意：clipping plane 只裁壳，不会生成剖面封盖；这是有意为之的“薄壳示意”。

## 4. 历史踩坑（改代码前必读）

1. **局部坐标重复平移**：单元内出现 `STAGE_X.*` 就是红旗。唯二例外是「最外层 group 的 `position={[cx,0,0]}`」和「把中心端口表世界坐标换算成局部坐标的常量」。
2. **CameraControls 距离上限**：不要写回 JSX `minDistance={5} maxDistance={72}`。`CameraLimits` / `OverviewFit` / `CameraFocus` 会命令式放宽 maxDistance；JSX 固定 props 在重渲染时会覆盖动态值，导致竖屏又看不全。需要限制时统一在 `SceneShell.tsx` 处理。
3. **framer-motion 面板 hydration**：`InfoPanel / IntroPanel / RefsPanel / Coachmark` 必须留在 `ClientOnly` 内，否则 SSR/客户端首帧动画状态不一致。
4. **InstancedMesh 颜色**：`FlowTube` / `FlowRail` 的材质 `color` 必须为 `#ffffff`，实际颜色交给 `instanceColor`；否则实例色会与材质色二次相乘变暗。
5. **暂停 Context 必须包在 Canvas 内**：`ProcessPausedContext.Provider` 当前位于 `SceneShell` 的 Suspense 内；如果挪出 Canvas，R3F 子树可能取不到 Context。
6. **端口校验脚本是 TS**：`scripts/validate-ports.ts` 依赖 Node 23 原生 strip-types 和 `tsconfig.json` 的 `allowImportingTsExtensions`；不要改成 CommonJS require 或删掉 tsconfig 选项。

## 5. 验证命令

```bash
cd E:\Code\Diagonal\vacuum-salt

# 端口表自动校验（build 已包含）
npm run validate:ports

# 类型
npx tsc --noEmit

# Lint（当前仅有 page.tsx 一个已知 warning）
npm run lint

# 生产构建（会先跑 validate:ports）
$env:NEXT_PUBLIC_BASE_PATH='/vacuum-salt'; npm run build
```

本地 smoke（basePath 构建后的产物）：

```powershell
# 把 out 内容放到 <root>/vacuum-salt 下，再 serve <root>
python -m http.server 8767
# headless Chrome 打开 http://127.0.0.1:8767/vacuum-salt/
# 检查 document.querySelector('canvas') 存在且 Runtime.exceptionThrown 为空
```

## 6. 已知遗留问题 / 后续优化清单

按建议优先级：

- **P-next-1**：`app/page.tsx` 的 `useEffect` 依赖 warning。`playback` 每次渲染是新对象，不能直接加依赖；可改为依赖 `playback.stageIndex`/`playback.playing` 的具体字段或抽取稳定引用。
- **P-next-2**：竖屏全景/聚焦只按宽度拟合，尚未考虑场景高度和纵向 padding；极端横屏/超短视口建议改成 `camera-controls.fitToBox` 方案。
- **P-next-3**：`prefers-reduced-motion` 只覆盖部分 FlowTube/部分 CSS；`FlowRail` 和各单元内部粒子/机械臂未接 reduced。建议复用 `useProcessPaused` 同款 Context 再传一层 reduced 状态。
- **P-next-4**：`DryUnit` 风机支腿与加热器壳体未连接、热风斜管与流化床左壁仍有缝隙；可顺带修。
- **P-next-5**：`PackUnit` 立体仓储满 6 袋后直接重置，无托盘/整托移走动画；建议加托盘模型和满托过渡。
- **P-next-6**：`FlowTube` 末端脉冲环仍固定水平方向，竖直管口会显得不对齐；可让脉冲环跟随曲线末端切向。
- **P-next-7**：除 `FlowTube/FlowRail` 外，各单元的流化盐粒、输送盐粒、絮体、旋流粒子仍是独立 mesh；后续可逐个 InstancedMesh 化。
- **P-next-8**：单元内大量 `<mesh>` 使用独立 geometry/material；可做按材质合并的静态批次（参考 salt-plant-3d 的 `emit/flushBin`）。
- **P-next-9**：`useMemo` 内大量 `Math.random()` 使每页加载的粒子初始相位不同，不利于像素级回归；建议加可复现 seed。
- **P-next-10**：HUD 多处硬编码 `05`（`STAGE ... / 05`、TourCaption `/ 05`）；新增环节时会漏改，建议改为 `stages.length` 派生。

## 7. 给未来会话的调试提示

- 想检查 3D 内部状态时，不要在源码里留 debug；把项目复制到临时目录，在 `SceneShell` 挂载后执行 `window.__dbg = { scene: gl.scene, camera, controls }`，再用 headless Chrome + CDP 读场景图。
- 跨环节管道是否有断点，先查 `lib/pipelinePorts.ts` 和 `PipelineScene.tsx` 的 `points`，再查 `*Unit.tsx` 是否出现 `STAGE_X`。
- 打包段交接相位集中在 `PackUnit.tsx` 的 `PH` / `beat()` / `CYCLE`；改动画节拍时先算 `cyc` 相位表再改。
