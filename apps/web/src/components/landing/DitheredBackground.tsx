"use client";

import React, { useEffect, useRef } from "react";

export function DitheredBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // Mouse tracker with smooth damping
    let mouseX = width / 2;
    let mouseY = height / 3;
    let targetMouseX = mouseX;
    let targetMouseY = mouseY;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Animated gradient orbs
    let time = 0;
    const render = () => {
      time += 0.008;

      // Smooth mouse lerp
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      ctx.clearRect(0, 0, width, height);

      // Deep base layer
      ctx.fillStyle = "#090d16";
      ctx.fillRect(0, 0, width, height);

      // 1. Mouse Spotlight Glow
      const mouseGrad = ctx.createRadialGradient(
        mouseX,
        mouseY,
        0,
        mouseX,
        mouseY,
        Math.max(width, height) * 0.45
      );
      mouseGrad.addColorStop(0, "rgba(56, 189, 248, 0.12)");
      mouseGrad.addColorStop(0.5, "rgba(168, 85, 247, 0.05)");
      mouseGrad.addColorStop(1, "rgba(9, 13, 22, 0)");
      ctx.fillStyle = mouseGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Floating Cyan Orb (Top-Right / Center)
      const orb1X = width * 0.65 + Math.sin(time * 0.7) * 120;
      const orb1Y = height * 0.25 + Math.cos(time * 0.5) * 80;
      const orb1Grad = ctx.createRadialGradient(orb1X, orb1Y, 0, orb1X, orb1Y, width * 0.4);
      orb1Grad.addColorStop(0, "rgba(56, 189, 248, 0.14)");
      orb1Grad.addColorStop(0.6, "rgba(56, 189, 248, 0.02)");
      orb1Grad.addColorStop(1, "rgba(9, 13, 22, 0)");
      ctx.fillStyle = orb1Grad;
      ctx.fillRect(0, 0, width, height);

      // 3. Floating Violet Orb (Bottom-Left)
      const orb2X = width * 0.25 + Math.cos(time * 0.6) * 100;
      const orb2Y = height * 0.65 + Math.sin(time * 0.8) * 90;
      const orb2Grad = ctx.createRadialGradient(orb2X, orb2Y, 0, orb2X, orb2Y, width * 0.35);
      orb2Grad.addColorStop(0, "rgba(168, 85, 247, 0.12)");
      orb2Grad.addColorStop(0.5, "rgba(168, 85, 247, 0.02)");
      orb2Grad.addColorStop(1, "rgba(9, 13, 22, 0)");
      ctx.fillStyle = orb2Grad;
      ctx.fillRect(0, 0, width, height);

      // 4. Emerald Accent Orb (Center-Bottom)
      const orb3X = width * 0.5 + Math.sin(time * 0.4) * 80;
      const orb3Y = height * 0.85 + Math.cos(time * 0.6) * 60;
      const orb3Grad = ctx.createRadialGradient(orb3X, orb3Y, 0, orb3X, orb3Y, width * 0.3);
      orb3Grad.addColorStop(0, "rgba(34, 197, 94, 0.08)");
      orb3Grad.addColorStop(0.5, "rgba(34, 197, 94, 0.01)");
      orb3Grad.addColorStop(1, "rgba(9, 13, 22, 0)");
      ctx.fillStyle = orb3Grad;
      ctx.fillRect(0, 0, width, height);

      // 5. High-Performance Procedural Dither Dot Matrix (Retro-Modern SaaS Style)
      const dotSpacing = 28;
      const startX = 0;
      const startY = 0;
      ctx.fillStyle = "rgba(255, 255, 255, 0.035)";

      for (let x = startX; x < width; x += dotSpacing) {
        for (let y = startY; y < height; y += dotSpacing) {
          // Dynamic wave dither calculation
          const distToMouse = Math.hypot(x - mouseX, y - mouseY);
          const mouseFactor = Math.max(0, 1 - distToMouse / 350);
          const wave = Math.sin(x * 0.01 + y * 0.01 + time * 1.5);
          const size = 1 + wave * 0.4 + mouseFactor * 1.6;

          if (mouseFactor > 0.05) {
            ctx.fillStyle = `rgba(56, 189, 248, ${0.05 + mouseFactor * 0.3})`;
          } else {
            ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
          }

          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div style={styles.container}>
      <canvas ref={canvasRef} style={styles.canvas} />
      {/* Subtle Noise / Scanline Texture Overlay */}
      <div style={styles.noiseOverlay} />
      {/* Subtle Top Glowing Vignette */}
      <div style={styles.topVignette} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    pointerEvents: "none",
    zIndex: 0,
    overflow: "hidden",
  },
  canvas: {
    display: "block",
    width: "100%",
    height: "100%",
  },
  noiseOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 0)`,
    backgroundSize: "24px 24px",
    opacity: 0.6,
  },
  topVignette: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "250px",
    background: "linear-gradient(to bottom, rgba(9, 13, 22, 0.4), transparent)",
  },
};
