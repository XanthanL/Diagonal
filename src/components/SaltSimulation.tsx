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
    isPressed: false
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
      const goldenYellow = '#FFD700'; 
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
          size: Math.random() * 1.8 + 0.6, 
          opacity: Math.random() * 0.4 + 0.15,
          noiseOffset: Math.random() * 1000,
          flashIntensity: 0,
          flashColor: goldenYellow,
          pulseSpeed: 0.005 + Math.random() * 0.01, // 降低基础呼吸频率
        });
      }
    };

    const drawBackground = () => {
      ctx.fillStyle = '#1e1a16'; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.lineWidth = 1;
      
      ctx.beginPath();
      for (let y = 0; y < canvas.height; y += 3) {
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
      }
      ctx.stroke();

      ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.beginPath();
      for (let x = 0; x < canvas.width; x += 3) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
      }
      ctx.stroke();
    };

    const animate = (time: number) => {
      drawBackground();
      
      const t = time * 0.0005;
      const { mouseX, mouseY, isPressed } = stateRef.current;

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
        if (isPressed) {
          const dx = p.x - mouseX;
          const dy = p.y - mouseY;
          const distanceSq = dx * dx + dy * dy;
          const radiusSq = interactionRadius * interactionRadius;

          if (distanceSq < radiusSq) {
            const distance = Math.sqrt(distanceSq);
            const force = (interactionRadius - distance) / interactionRadius;
            p.vx += (dx / distance) * force * 1.5;
            p.vy += (dy / distance) * force * 1.5;
          }
        }

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

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        stateRef.current.mouseX = e.touches[0].clientX - rect.left;
        stateRef.current.mouseY = e.touches[0].clientY - rect.top;
        stateRef.current.isPressed = true;
      }
    };

    const handleMouseDown = (e: MouseEvent) => { if (e.button === 0) stateRef.current.isPressed = true; };
    const handleMouseUp = () => { stateRef.current.isPressed = false; };
    const handleTouchStart = (e: TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      stateRef.current.mouseX = e.touches[0].clientX - rect.left;
      stateRef.current.mouseY = e.touches[0].clientY - rect.top;
      stateRef.current.isPressed = true;
    };
    const handleTouchEnd = () => { stateRef.current.isPressed = false; };

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
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);

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
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div 
      className="w-full h-full bg-[#1e1a16] relative overflow-hidden group shadow-[0_30px_60px_-12px_rgba(0,0,0,0.3)] transition-all duration-700"
      style={{
        clipPath: 'polygon(0% 15%, 100% 0%, 100% 85%, 0% 100%)'
      }}
    >
      <canvas 
        ref={canvasRef} 
        className="w-full h-full block cursor-auto"
      />
      <div className="absolute bottom-10 right-10 archive-text text-[9px] text-white/10 pointer-events-none tracking-[0.3em] opacity-0 group-hover:opacity-100 transition-opacity uppercase italic">
        KINETIC_SALT // BITTERN_VESSEL
      </div>
    </div>
  );
}
