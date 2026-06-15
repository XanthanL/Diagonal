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
}

export function SaltSimulation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    mouseX: -1000,
    mouseY: -1000,
    isPressed: false
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    const particleCount = 4000;
    const interactionRadius = 35; // 进一步缩小，更像手指

    const resize = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        particles.push({
          x: x,
          y: y,
          originX: x,
          originY: y,
          vx: 0,
          vy: 0,
          size: Math.random() * 1.2 + 0.3,
          opacity: Math.random() * 0.4 + 0.2,
          noiseOffset: Math.random() * 1000,
        });
      }
    };

    const animate = (time: number) => {
      ctx.fillStyle = '#1a1a1a'; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const t = time * 0.002;
      const { mouseX, mouseY, isPressed } = stateRef.current;

      particles.forEach(p => {
        // 1. 基础律动
        const driftX = Math.sin(t + p.noiseOffset) * 0.4;
        const driftY = Math.cos(t * 0.7 + p.noiseOffset) * 0.4;
        
        // 2. 交互逻辑 - 只有 isPressed 为 true 时才产生斥力
        if (isPressed) {
          const dx = p.x - mouseX;
          const dy = p.y - mouseY;
          const distanceSq = dx * dx + dy * dy;
          const radiusSq = interactionRadius * interactionRadius;
          
          if (distanceSq < radiusSq) {
            const distance = Math.sqrt(distanceSq);
            const force = (interactionRadius - distance) / interactionRadius;
            p.vx += (dx / distance) * force * 8; // 稍微加强瞬间推力
            p.vy += (dy / distance) * force * 8;
          }
        }

        // 3. 极其微弱的回位逻辑 (消除果冻感，模拟缓慢落定)
        const homeDx = p.originX - p.x;
        const homeDy = p.originY - p.y;
        p.vx += homeDx * 0.0008; // 极小拉力
        p.vy += homeDy * 0.0008;

        // 4. 物理模拟 - 调高系数以增加惯性漂移感
        p.vx *= 0.96; 
        p.vy *= 0.96;
        
        p.x += p.vx + driftX;
        p.y += p.vy + driftY;

        // 5. 绘制
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    // 事件监听逻辑重构，确保状态更新准确
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      stateRef.current.mouseX = e.clientX - rect.left;
      stateRef.current.mouseY = e.clientY - rect.top;
    };

    const handleMouseDown = (e: MouseEvent) => {
      // 只有左键点击才触发
      if (e.button === 0) {
        stateRef.current.isPressed = true;
      }
    };

    const handleMouseUp = () => {
      stateRef.current.isPressed = false;
    };

    const handleMouseLeave = () => {
      stateRef.current.mouseX = -1000;
      stateRef.current.mouseY = -1000;
      stateRef.current.isPressed = false;
    };

    window.addEventListener('resize', resize);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    resize();
    requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div 
      className="w-full h-full bg-[#1a1a1a] relative overflow-hidden group"
      style={{
        clipPath: 'polygon(0% 15%, 100% 0%, 100% 85%, 0% 100%)'
      }}
    >
      <canvas 
        ref={canvasRef} 
        className="w-full h-full block cursor-auto" // 恢复标准系统鼠标
      />
      <div className="absolute bottom-6 right-8 archive-text text-[8px] text-white/10 pointer-events-none tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity">
        HOLD_CLICK_TO_STIR // KINETIC_SALT_V2.1
      </div>
    </div>
  );
}
