# 真空制盐工艺 3D 解构 · 自贡井卤

基于 React Three Fiber 的真空制盐一体化产线 3D 解构展示网站。以自贡井矿盐卤为题材，将卤水预处理 → 多效蒸发结晶 → 离心脱水 → 干燥筛分 → 包装仓储五大环节整合为一条连贯的产线，设备相连、一体成型；点击导航可聚焦具体环节查看工艺原理与关键参数。

设计基调：白底浅色艺术风，物体主色调与卤水相近（卤水青蓝、盐白、琥珀点缀），高端简洁、富有艺术气息，同时保留理工科的严谨——所有工艺参数（温度、绝压、浓度等）均参考工业实际取值。

## 技术栈

- Next.js 14（App Router）+ TypeScript
- Tailwind CSS（浅色主题：纸白 / 卤水青蓝 / 琥珀）
- Framer Motion（HUD 过渡动画）
- React Three Fiber + @react-three/drei（3D 场景与相机控制）
- camera-controls（相机过渡动画）

## 快速开始

```bash
npm install
npm run dev      # 开发服务器
npm run build    # 生产构建
npm run lint     # 代码检查
```

打开 [http://localhost:3000](http://localhost:3000) 查看。

## 项目结构

```
app/                         页面与全局样式
components/
  hud/                       NavBar / StageCard / InfoPanel / RefsPanel
  three/
    SceneShell.tsx           3D 场景容器 + CameraFocus 聚焦逻辑
    Tag.tsx                  设备材质配色
    pipeline/                一体化产线
      PipelineScene.tsx      产线主场景（设备 + 管路 + 聚焦）
      layout.ts              各环节 x 坐标与相机锚点
      BrineUnit / EvaporateUnit / CentrifugeUnit / DryUnit / PackUnit
      FlowTube.tsx           物料流向管路与粒子动画
      SceneLoader.tsx        动态加载封装
lib/
  data.ts                    工艺数据（参数、原理、化学反应、部件）
  types.ts                   类型定义
  useLang.ts                 中英文切换
  usePlayback.ts             自动播放进度控制
```

## 近期完成工作（相机控制系统重构与一体化产线验证）

### 背景
原 SceneShell 中使用了 drei `CameraControls` 不存在的 `enablePan` 属性，类型检查报错；初步替换为 `enablePanning` 后仍报错（drei 当前版本的 `CameraControlsProps` 不直接暴露该字段）。同时 `CameraFocus` 通过 `controlsRef.current.target` 直接访问受保护属性 `_target`，构建时类型检查失败。

### 修复内容

**[components/three/SceneShell.tsx](components/three/SceneShell.tsx)** — 相机控制系统重构
- 修复 `enablePan` / `enablePanning` 属性不存在的问题。drei 的 `CameraControls` 不支持这两个属性，改用 `mouseButtons` 配置禁用平移：
  ```tsx
  mouseButtons={{ left: 1, right: 0, middle: 16, wheel: 16 }}
  ```
  （ACTION 常量：NONE=0, ROTATE=1, TRUCK=2 平移, DOLLY=16）保留左键旋转与中键/滚轮缩放，禁用右键平移避免偏离产线。
- 重构 `CameraFocus`：原代码通过 `controlsRef.current.target` 直接访问受保护属性 `_target`，类型检查报错。改为：
  - `CameraControls` 添加 `makeDefault` 属性注册为默认 controls
  - `CameraFocus` 通过 `useThree((state) => state.controls)` 获取实例
  - 调用 `controls.setLookAt(px, py, pz, tx, ty, tz, true)` 触发 camera-controls 内置过渡动画，比手动 lerp 更平滑
- 移除不再需要的 `useFrame` 手动插值、`useRef` 与 `controlsRef` 依赖。

**[components/three/pipeline/PipelineScene.tsx](components/three/pipeline/PipelineScene.tsx)** — 清理冗余
- 移除不再需要的 `controlsRef`、`useRef` 与 `CameraControlsImpl` 导入；`CameraFocus` 通过 `makeDefault` 自动获取 controls，无需手动透传 ref。

### 验证结果

- `npx tsc --noEmit` ✅ 类型检查通过
- `npm run build` ✅ 生产构建成功（主路由 53.6 kB / 141 kB First Load JS）

### 浏览器实测结果（localhost:3001）

在浏览器中实测，所有交互正常：

1. **一体化产线渲染** — 五环节设备相连，白底明亮，卤水青蓝色调一致
2. **点击导航聚焦** — 点击环节按钮，相机平滑飞到对应设备群，"← 全景"按钮出现
3. **返回全景** — 点击"← 全景"，退出聚焦，恢复全景视图
4. **自动播放** — 点击播放，按节奏自动切换环节并聚焦（8 秒/环节，支持 1× / 2× / 3× 倍速）
5. **信息面板** — 点击"原理/参数"，右侧面板展示物料流向、科学原理、化学反应式、关键参数表、设备部件清单
6. **语言切换** — 中/英切换正常，导航项与 StageCard 同步更新
7. **控制台无报错** — 仅 React DevTools 提示与 hydration 警告，无功能性问题

一体化产线已符合「步步相连一体成型、局部是整体的一部分、可点击查看具体步骤」的设计目标。

## 数据来源与说明

3D 模型为工艺示意，非真实比例；工艺参数（温度、绝压、浓度等）均为工业参考值，实际随矿床、设备、产品标准而异。详见页面内「参考资料」面板与 `lib/data.ts`。
