"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { ContactShadows, Float, CameraControls } from "@react-three/drei";
import type CameraControlsImpl from "camera-controls";
import { Suspense, type ReactNode, useEffect } from "react";
import * as THREE from "three";
import { ProcessPausedContext } from "@/lib/useProcessPaused";

interface SceneShellProps {
  children: ReactNode;
  cameraPosition?: [number, number, number];
  float?: boolean;
  ambient?: number;
  /** 是否允许用户手动旋转（聚焦时关闭以避免冲突） */
  enableControls?: boolean;
  /** 产线动画暂停：仅冻结工艺粒子/设备动画，不影响相机旋转与聚焦 */
  paused?: boolean;
}

/**
 * 相机距离限制：这里用命令式设置而不写在 <CameraControls> JSX props 上，
 * 因为 OverviewFit / CameraFocus 会按视口宽高比动态放宽 maxDistance，
 * JSX 的固定 maxDistance 在重渲染时会把动态值覆盖回 72。
 */
function CameraLimits() {
  const controls = useThree((s) => s.controls) as CameraControlsImpl | null;

  useEffect(() => {
    if (!controls) return;
    const current = Number(controls.maxDistance);
    controls.minDistance = 5;
    controls.maxDistance = Number.isFinite(current) ? Math.max(current, 72) : 72;
  }, [controls]);

  return null;
}

/** 3D 场景容器：白底明亮、柔和阴影、摄影棚光照 */
export function SceneShell({
  children,
  cameraPosition = [0, 4, 14],
  float = false,
  ambient = 0.9,
  enableControls = true,
  paused = false,
}: SceneShellProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: cameraPosition, fov: 38 }}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ gl }) => {
        // 开启局部裁剪，供 EvaporateUnit 用世界空间裁剪面做真剖面（其他单元未使用裁剪面，无副作用）
        gl.localClippingEnabled = true;
      }}
    >
      <Suspense fallback={null}>
        <ProcessPausedContext.Provider value={paused}>
          <ambientLight intensity={ambient} color="#f4f7fa" />
          <hemisphereLight intensity={0.5} groundColor="#eaeff5" color="#ffffff" />
          <directionalLight
            position={[8, 14, 6]}
            intensity={1.4}
            color="#ffffff"
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-bias={-0.0002}
          />
          <directionalLight position={[-10, 8, -6]} intensity={0.5} color="#b8dcef" />
          <directionalLight position={[0, -4, 8]} intensity={0.25} color="#ffffff" />

          {float ? (
            <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.3}>
              {children}
            </Float>
          ) : (
            children
          )}

          <ContactShadows
            position={[0, -2.6, 0]}
            opacity={0.2}
            scale={60}
            blur={3}
            far={10}
            color="#1e293b"
            frames={1} // 场景为静态产线，接触阴影只需烘焙一次
          />
          <CameraLimits />
          <CameraControls
            makeDefault
            enabled={enableControls}
            // ACTION: NONE=0, ROTATE=1, TRUCK=2(平移), DOLLY=16
            // 禁用右键平移，避免偏离产线；保留左键旋转与中键/滚轮缩放
            mouseButtons={{ left: 1, right: 0, middle: 16, wheel: 16 }}
            maxPolarAngle={Math.PI / 2.05}
            minPolarAngle={Math.PI / 6}
            // 平滑阻尼，让聚焦/全景切换更有质感
            smoothTime={0.55}
            draggingSmoothTime={0.18}
          />
        </ProcessPausedContext.Provider>
      </Suspense>
    </Canvas>
  );
}

/**
 * 相机聚焦：平滑飞到目标环节锚点（在 Canvas 内使用）
 * 依赖 CameraControls 的 makeDefault，通过 useThree 获取实例，
 * 调用 setLookAt 触发内置过渡动画。
 */
export function CameraFocus({
  target,
  distance = 9,
  height = 4,
  halfWidth,
}: {
  target: [number, number, number];
  distance?: number;
  height?: number;
  /** 环节包围盒半宽：竖屏时按视口宽高比放大取景距离，避免裁掉设备 */
  halfWidth?: number;
}) {
  const controls = useThree((state) => state.controls) as CameraControlsImpl | null;
  const camera = useThree((state) => state.camera) as THREE.PerspectiveCamera;
  const size = useThree((state) => state.size);

  useEffect(() => {
    if (!controls) return;
    const [tx, ty, tz] = target;
    const aspect = size.width / Math.max(1, size.height);
    const vfov = THREE.MathUtils.degToRad(camera.fov);

    // 桌面基准距离与「按水平视场放得下环节包围盒」所需距离取较大者。
    // 相机从 (0.55d, height, d) 方向观察，取景仍以 d 为基准近似。
    let d = distance;
    if (halfWidth && halfWidth > 0) {
      const fitDistance = (halfWidth * 1.12) / (Math.tan(vfov / 2) * aspect);
      d = Math.max(d, fitDistance);
    }

    const px = tx + d * 0.55;
    const py = ty + height;
    const pz = tz + d;

    // 同步放宽相机距离上限，保证竖屏自动取景不被旧上限夹住
    const currentMax = Number(controls.maxDistance);
    controls.minDistance = 5;
    controls.maxDistance = Math.max(
      Number.isFinite(currentMax) ? currentMax : 72,
      d * 1.08,
      72
    );

    // 启用过渡动画，由 camera-controls 内部处理平滑插值
    controls.setLookAt(px, py, pz, tx, ty, tz, true);
  }, [target, distance, height, halfWidth, controls, camera, size.width, size.height]);

  return null;
}
