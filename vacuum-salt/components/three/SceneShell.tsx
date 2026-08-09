"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { ContactShadows, Float, CameraControls } from "@react-three/drei";
import type CameraControlsImpl from "camera-controls";
import { Suspense, type ReactNode, useEffect } from "react";

interface SceneShellProps {
  children: ReactNode;
  cameraPosition?: [number, number, number];
  float?: boolean;
  ambient?: number;
  /** 是否允许用户手动旋转（聚焦时关闭以避免冲突） */
  enableControls?: boolean;
}

/** 3D 场景容器：白底明亮、柔和阴影、摄影棚光照 */
export function SceneShell({
  children,
  cameraPosition = [0, 4, 14],
  float = false,
  ambient = 0.9,
  enableControls = true,
}: SceneShellProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: cameraPosition, fov: 38 }}
      gl={{ antialias: true, alpha: true }}
    >
      <Suspense fallback={null}>
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
        />
        <CameraControls
          makeDefault
          enabled={enableControls}
          // ACTION: NONE=0, ROTATE=1, TRUCK=2(平移), DOLLY=16
          // 禁用右键平移，避免偏离产线；保留左键旋转与中键/滚轮缩放
          mouseButtons={{ left: 1, right: 0, middle: 16, wheel: 16 }}
          minDistance={5}
          maxDistance={30}
          maxPolarAngle={Math.PI / 2.05}
          minPolarAngle={Math.PI / 6}
        />
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
}: {
  target: [number, number, number];
  distance?: number;
  height?: number;
}) {
  const controls = useThree((state) => state.controls) as CameraControlsImpl | null;

  useEffect(() => {
    if (!controls) return;
    const [tx, ty, tz] = target;
    const px = tx + distance * 0.55;
    const py = ty + height;
    const pz = tz + distance;
    // 启用过渡动画，由 camera-controls 内部处理平滑插值
    controls.setLookAt(px, py, pz, tx, ty, tz, true);
  }, [target, distance, height, controls]);

  return null;
}
