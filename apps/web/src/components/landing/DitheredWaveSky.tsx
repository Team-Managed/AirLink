"use client";

import React, { useEffect, useRef } from "react";

export function DitheredWaveSky() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 1000);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 600);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener("resize", handleResize);

    let time = 0;

    const render = () => {
      time += 0.003;
      ctx.clearRect(0, 0, width, height);

      // 1. Deep Twilight to Sunset Gradient Background
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, "#192846"); // Deep indigo twilight
      skyGrad.addColorStop(0.35, "#283b60"); // Soft night blue
      skyGrad.addColorStop(0.65, "#704868"); // Violet dusk
      skyGrad.addColorStop(0.85, "#c86d68"); // Rose coral
      skyGrad.addColorStop(1.0, "#e8937e"); // Warm salmon glow
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Silky Radiating Flow Wave Lines (Long Exposure Coral Streaks)
      const centerX = width * 0.5;
      const poleBaseY = height * 0.65;

      const numLines = 140;
      ctx.lineWidth = 1.2;

      for (let i = 0; i < numLines; i++) {
        const angleRatio = (i / numLines - 0.5) * 2; // -1 to 1
        const spreadX = angleRatio * width * 1.1;
        const waveOffset = Math.sin(time + i * 0.12) * 15;

        // Color variation across lines (coral, salmon, pink, soft violet)
        const alpha = 0.15 + Math.abs(Math.sin(i * 0.2 + time)) * 0.25;
        if (Math.abs(angleRatio) < 0.3) {
          ctx.strokeStyle = `rgba(248, 170, 145, ${alpha * 1.3})`; // Bright center coral
        } else if (Math.abs(angleRatio) < 0.6) {
          ctx.strokeStyle = `rgba(224, 115, 125, ${alpha})`; // Mid-range rose
        } else {
          ctx.strokeStyle = `rgba(148, 105, 155, ${alpha * 0.8})`; // Outer violet
        }

        ctx.beginPath();
        // Start near bottom center (behind pole)
        const startX = centerX + angleRatio * 40;
        const startY = poleBaseY + 60;

        // Control points creating the sweeping sky fan
        const cp1X = centerX + spreadX * 0.35 + waveOffset;
        const cp1Y = height * 0.4;
        const cp2X = centerX + spreadX * 0.75;
        const cp2Y = height * 0.15;
        const endX = centerX + spreadX * 1.2;
        const endY = -20;

        ctx.moveTo(startX, startY);
        ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, endX, endY);
        ctx.stroke();
      }

      // Secondary layered softer haze
      const hazeGrad = ctx.createRadialGradient(
        centerX,
        poleBaseY - 20,
        10,
        centerX,
        poleBaseY - 40,
        width * 0.6
      );
      hazeGrad.addColorStop(0, "rgba(248, 180, 150, 0.3)");
      hazeGrad.addColorStop(0.5, "rgba(200, 100, 120, 0.15)");
      hazeGrad.addColorStop(1, "rgba(25, 40, 70, 0)");
      ctx.fillStyle = hazeGrad;
      ctx.fillRect(0, 0, width, height);

      // 3. Film Grain / Dither Dot Texture
      const grainStep = 8;
      ctx.fillStyle = "rgba(255, 255, 255, 0.045)";
      for (let x = 0; x < width; x += grainStep) {
        for (let y = 0; y < height; y += grainStep) {
          const pseudoRandom = Math.sin(x * 12.9898 + y * 78.233 + (x % 3)) * 43758.5453;
          if (pseudoRandom - Math.floor(pseudoRandom) > 0.72) {
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }

      // 4. Utility / Transmission Pole Silhouette (Center Anchor)
      const poleX = centerX;
      const poleTopY = poleBaseY - 140;
      const poleBottomY = height;

      ctx.fillStyle = "#0c1524"; // Deep silhouette navy/black
      ctx.strokeStyle = "#0c1524";

      // Main Vertical Mast
      ctx.beginPath();
      ctx.moveTo(poleX - 3.5, poleBottomY);
      ctx.lineTo(poleX - 2, poleTopY);
      ctx.lineTo(poleX + 2, poleTopY);
      ctx.lineTo(poleX + 3.5, poleBottomY);
      ctx.fill();

      // Top Crossarm (Horizontal)
      const topArmY = poleTopY + 24;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(poleX - 24, topArmY);
      ctx.lineTo(poleX + 24, topArmY);
      ctx.stroke();

      // Lower Crossarm (Horizontal)
      const lowerArmY = poleTopY + 54;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(poleX - 32, lowerArmY);
      ctx.lineTo(poleX + 32, lowerArmY);
      ctx.stroke();

      // Diagonal Braces
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(poleX - 16, lowerArmY);
      ctx.lineTo(poleX, lowerArmY + 16);
      ctx.lineTo(poleX + 16, lowerArmY);
      ctx.stroke();

      // Insulator Pins on Arms
      const drawInsulator = (ix: number, iy: number) => {
        ctx.fillRect(ix - 1.5, iy - 5, 3, 5);
      };
      drawInsulator(poleX - 20, topArmY);
      drawInsulator(poleX + 20, topArmY);
      drawInsulator(poleX - 28, lowerArmY);
      drawInsulator(poleX - 10, lowerArmY);
      drawInsulator(poleX + 10, lowerArmY);
      drawInsulator(poleX + 28, lowerArmY);

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div style={styles.canvasContainer}>
      <canvas ref={canvasRef} style={styles.canvas} />
      {/* Subtle Bottom vignette into dark page base */}
      <div style={styles.bottomVignette} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  canvasContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    borderRadius: 24,
    overflow: "hidden",
    zIndex: 0,
  },
  canvas: {
    display: "block",
    width: "100%",
    height: "100%",
  },
  bottomVignette: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "120px",
    background: "linear-gradient(to bottom, transparent, rgba(9, 13, 22, 0.85))",
    pointerEvents: "none",
  },
};
