"use client";

import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  noiseOffset: number;
  flashIntensity: number; 
  flashColor: string;     
  pulseSpeed: number; // 每个粒子独立的呼吸速度
}

export function SaltSimulation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    mouseX: -1000,
    mouseY: -1000,
    isMousePressed: false,
    touchPoints: [] as { x: number; y: number; radius: number }[]
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    const particleCount = 8000;
    const interactionRadius = 35;
    let logicalWidth = 0;
    let logicalHeight = 0;

    const resize = () => {
      const container = canvas.parentElement;
      if (container) {
        const dpr = window.devicePixelRatio || 1;
        logicalWidth = container.clientWidth;
        logicalHeight = container.clientHeight;
        
        canvas.width = logicalWidth * dpr;
        canvas.height = logicalHeight * dpr;
        
        ctx.scale(dpr, dpr);
      }
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      const crystalWhite = '#FFFFFF'; 
      for (let i = 0; i < particleCount; i++) {
        const x = Math.random() * logicalWidth;
        const y = Math.random() * logicalHeight;
        particles.push({
          x: x,
          y: y,
          originX: x,
          originY: y,
          vx: 0,
          vy: 0,
          size: Math.random() * 1.8 + 0.6, 
          opacity: Math.random() * 0.4 + 0.15,
          noiseOffset: Math.random() * 1000,
          flashIntensity: 0,
          flashColor: crystalWhite,
          pulseSpeed: 0.005 + Math.random() * 0.01, // 降低基础呼吸频率
        });
      }
    };

    const drawBackground = () => {
      ctx.fillStyle = '#0c0c0e'; 
      ctx.fillRect(0, 0, logicalWidth, logicalHeight);

      // 精致的微弱白色水平/垂直扫描线织纹
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
      ctx.lineWidth = 0.5;
      
      ctx.beginPath();
      for (let y = 0; y < logicalHeight; y += 3) {
        ctx.moveTo(0, y);
        ctx.lineTo(logicalWidth, y);
      }
      ctx.stroke();

      ctx.beginPath();
      for (let x = 0; x < logicalWidth; x += 3) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, logicalHeight);
      }
      ctx.stroke();
    };

    const animate = (time: number) => {
      drawBackground();
      
      const t = time * 0.0005;
      const { mouseX, mouseY, isMousePressed, touchPoints } = stateRef.current;

      // 汇总所有的交互点（鼠标 + 手机多指/大面积触控）
      const activePoints: { x: number; y: number; radius: number }[] = [];
      if (isMousePressed && mouseX >= 0 && mouseY >= 0) {
        activePoints.push({ x: mouseX, y: mouseY, radius: interactionRadius });
      }
      if (touchPoints.length > 0) {
        activePoints.push(...touchPoints);
      }

      particles.forEach(p => {
        // 1. 基础漂浮律动
        const driftX = Math.sin(t + p.noiseOffset) * 0.05;
        const driftY = Math.cos(t * 0.7 + p.noiseOffset) * 0.05;

        // 2. 独立的呼吸感闪烁
        const breathing = Math.sin(time * p.pulseSpeed + p.noiseOffset);
        // 显著降低触发概率 (从 0.02 降至 0.005)，使其更加稀疏
        if (p.flashIntensity <= 0 && breathing > 0.999 && Math.random() < 0.005) {
          p.flashIntensity = 1;
        }

        // 3. 交互逻辑
        activePoints.forEach(pt => {
          const dx = p.x - pt.x;
          const dy = p.y - pt.y;
          const distanceSq = dx * dx + dy * dy;
          const radiusSq = pt.radius * pt.radius;

          if (distanceSq < radiusSq) {
            const distance = Math.sqrt(distanceSq);
            if (distance > 0) {
              const force = (pt.radius - distance) / pt.radius;
              p.vx += (dx / distance) * force * 1.5;
              p.vy += (dy / distance) * force * 1.5;
            }
          }
        });

        // 4. 回位逻辑
        const homeDx = p.originX - p.x;
        const homeDy = p.originY - p.y;
        p.vx += homeDx * 0.00001;
        p.vy += homeDy * 0.00001;

        // 5. 物理更新
        p.vx *= 0.95; 
        p.vy *= 0.95;
        
        p.x += p.vx + driftX;
        p.y += p.vy + driftY;

        // 6. 绘制
        if (p.flashIntensity > 0) {
          ctx.fillStyle = p.flashColor;
          // 增强渐渐消逝的质感
          ctx.globalAlpha = Math.min(1, p.opacity + p.flashIntensity * 0.7);
          const s = p.size + p.flashIntensity * 0.4;
          ctx.fillRect(p.x - s/2, p.y - s/2, s, s);
          p.flashIntensity -= 0.004; // 大幅减慢熄灭速度 (原为 0.01)
          ctx.globalAlpha = 1.0;
        } else {
          ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
          ctx.fillRect(p.x, p.y, p.size, p.size);
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      stateRef.current.mouseX = e.clientX - rect.left;
      stateRef.current.mouseY = e.clientY - rect.top;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) stateRef.current.isMousePressed = true;
    };

    const handleMouseUp = () => {
      stateRef.current.isMousePressed = false;
    };

    const handleMouseLeave = () => {
      stateRef.current.mouseX = -1000;
      stateRef.current.mouseY = -1000;
      stateRef.current.isMousePressed = false;
    };

    const updateTouchPoints = (e: TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const points = [];
      for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        // 获取触摸点的半径（代表触碰面积），部分浏览器与设备支持该属性
        // 基础半径 16px，再叠加实际触点尺寸的 0.6 倍，总计约 22-35px，更接近自然手指触点大小
        const rX = touch.radiusX || 10;
        const rY = touch.radiusY || 10;
        const radius = 16 + Math.max(rX, rY) * 0.6; 
        
        points.push({ x, y, radius });
      }
      stateRef.current.touchPoints = points;
    };

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault(); // 阻止滚动和缩放行为
      updateTouchPoints(e);
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault(); // 阻止页面跟随滑动滚动
      updateTouchPoints(e);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      updateTouchPoints(e);
    };

    window.addEventListener('resize', resize);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    resize();
    requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchEnd);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div 
      className="w-full h-full bg-[#0c0c0e] relative overflow-hidden group shadow-[0_30px_60px_-12px_rgba(0,0,0,0.3)] transition-all duration-700 touch-none border border-white/5"
      style={{
        clipPath: 'polygon(20% 0%, 100% 0%, 100% 80%, 80% 100%, 0% 100%, 0% 20%)'
      }}
    >
      <canvas 
        ref={canvasRef} 
        className="w-full h-full block cursor-auto touch-none"
      />
    </div>
  );
}
