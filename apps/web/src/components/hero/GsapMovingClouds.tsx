"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";

export function GsapMovingClouds() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Left-to-Right streams (West to East)
  const leftStream1Ref = useRef<HTMLDivElement>(null);
  const leftStream2Ref = useRef<HTMLDivElement>(null);

  // Right-to-Left streams (East to West)
  const rightStream1Ref = useRef<HTMLDivElement>(null);
  const rightStream2Ref = useRef<HTMLDivElement>(null);

  // Ambient light breath
  const ambientLightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Left-to-Right Stream A (Foreground low altitude, drifting right)
      if (leftStream1Ref.current) {
        gsap.fromTo(
          leftStream1Ref.current,
          { xPercent: -50 },
          {
            xPercent: 0,
            duration: 44,
            ease: "none",
            repeat: -1,
          }
        );
        gsap.to(leftStream1Ref.current, {
          y: -16,
          duration: 5.2,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        });
      }

      // 2. Left-to-Right Stream B (High altitude wisps, drifting right)
      if (leftStream2Ref.current) {
        gsap.fromTo(
          leftStream2Ref.current,
          { xPercent: -50 },
          {
            xPercent: 0,
            duration: 68,
            ease: "none",
            repeat: -1,
          }
        );
        gsap.to(leftStream2Ref.current, {
          y: 10,
          duration: 6.8,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          delay: 1.2,
        });
      }

      // 3. Right-to-Left Stream A (Midground billowing clouds, drifting left)
      if (rightStream1Ref.current) {
        gsap.fromTo(
          rightStream1Ref.current,
          { xPercent: 0 },
          {
            xPercent: -50,
            duration: 40,
            ease: "none",
            repeat: -1,
          }
        );
        gsap.to(rightStream1Ref.current, {
          y: 14,
          duration: 4.8,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          delay: 0.5,
        });
      }

      // 4. Right-to-Left Stream B (Upper midground wisps, drifting left)
      if (rightStream2Ref.current) {
        gsap.fromTo(
          rightStream2Ref.current,
          { xPercent: 0 },
          {
            xPercent: -50,
            duration: 58,
            ease: "none",
            repeat: -1,
          }
        );
        gsap.to(rightStream2Ref.current, {
          y: -12,
          duration: 6.0,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          delay: 2.0,
        });
      }

      // 5. Ambient Sun & Sky Bloom breathing
      if (ambientLightRef.current) {
        gsap.to(ambientLightRef.current, {
          opacity: 0.9,
          scale: 1.08,
          duration: 5.0,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        });
      }
    }, containerRef);

    // Interactive 2.5D Mouse Parallax
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const { clientX, clientY } = e;
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const moveX = (clientX - centerX) / centerX;
      const moveY = (clientY - centerY) / centerY;

      if (leftStream1Ref.current) {
        gsap.to(leftStream1Ref.current, {
          x: moveX * 28,
          y: moveY * 14,
          duration: 1.2,
          ease: "power1.out",
          overwrite: "auto",
        });
      }
      if (rightStream1Ref.current) {
        gsap.to(rightStream1Ref.current, {
          x: -moveX * 22,
          y: -moveY * 10,
          duration: 1.5,
          ease: "power1.out",
          overwrite: "auto",
        });
      }
      if (leftStream2Ref.current) {
        gsap.to(leftStream2Ref.current, {
          x: moveX * 12,
          y: moveY * 6,
          duration: 1.8,
          ease: "power1.out",
          overwrite: "auto",
        });
      }
      if (rightStream2Ref.current) {
        gsap.to(rightStream2Ref.current, {
          x: -moveX * 10,
          y: -moveY * 5,
          duration: 2.0,
          ease: "power1.out",
          overwrite: "auto",
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    return () => {
      ctx.revert();
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div ref={containerRef} style={styles.cloudWrapper} aria-hidden="true">
      {/* 1. Left-to-Right Stream B: High Altitude Distant Wisps (Drifting Right) */}
      <div ref={leftStream2Ref} style={styles.layerRow}>
        <div style={styles.cloudTrack}>
          <CloudShapeA opacity={0.5} scale={1.2} top="6%" blur={16} />
          <CloudShapeB opacity={0.42} scale={0.95} top="12%" blur={14} />
          <CloudShapeC opacity={0.48} scale={1.15} top="4%" blur={18} />
          <CloudShapeA opacity={0.5} scale={1.2} top="6%" blur={16} />
          <CloudShapeB opacity={0.42} scale={0.95} top="12%" blur={14} />
          <CloudShapeC opacity={0.48} scale={1.15} top="4%" blur={18} />
        </div>
      </div>

      {/* 2. Right-to-Left Stream B: Upper Midground Clouds (Drifting Left) */}
      <div ref={rightStream2Ref} style={styles.layerRow}>
        <div style={styles.cloudTrack}>
          <CloudShapeB opacity={0.62} scale={1.3} top="20%" blur={12} />
          <CloudShapeC opacity={0.58} scale={1.1} top="16%" blur={14} />
          <CloudShapeA opacity={0.65} scale={1.4} top="26%" blur={10} />
          <CloudShapeB opacity={0.62} scale={1.3} top="20%" blur={12} />
          <CloudShapeC opacity={0.58} scale={1.1} top="16%" blur={14} />
          <CloudShapeA opacity={0.65} scale={1.4} top="26%" blur={10} />
        </div>
      </div>

      {/* 3. Left-to-Right Stream A: Mid-to-Foreground Billows (Drifting Right) */}
      <div ref={leftStream1Ref} style={styles.layerRow}>
        <div style={styles.cloudTrack}>
          <CloudShapeC opacity={0.75} scale={1.5} top="42%" blur={8} />
          <CloudShapeA opacity={0.7} scale={1.35} top="52%" blur={10} />
          <CloudShapeB opacity={0.72} scale={1.45} top="38%" blur={9} />
          <CloudShapeC opacity={0.75} scale={1.5} top="42%" blur={8} />
          <CloudShapeA opacity={0.7} scale={1.35} top="52%" blur={10} />
          <CloudShapeB opacity={0.72} scale={1.45} top="38%" blur={9} />
        </div>
      </div>

      {/* 4. Right-to-Left Stream A: Foreground Floating Puffs (Drifting Left) */}
      <div ref={rightStream1Ref} style={styles.layerRow}>
        <div style={styles.cloudTrack}>
          <CloudShapeB opacity={0.78} scale={1.65} top="48%" blur={7} />
          <CloudShapeC opacity={0.74} scale={1.5} top="58%" blur={9} />
          <CloudShapeA opacity={0.76} scale={1.6} top="44%" blur={8} />
          <CloudShapeB opacity={0.78} scale={1.65} top="48%" blur={7} />
          <CloudShapeC opacity={0.74} scale={1.5} top="58%" blur={9} />
          <CloudShapeA opacity={0.76} scale={1.6} top="44%" blur={8} />
        </div>
      </div>

      {/* 5. Center Sky Radiant Glow Bloom */}
      <div ref={ambientLightRef} style={styles.ambientBloom} />
    </div>
  );
}

// Organic SVG Cloud Clusters with crisp highlights and depth
function CloudShapeA({
  opacity,
  scale,
  top,
  blur,
}: {
  opacity: number;
  scale: number;
  top: string;
  blur: number;
}) {
  return (
    <div
      style={{
        ...styles.cloudItem,
        top,
        opacity,
        transform: `scale(${scale})`,
        filter: `blur(${blur}px)`,
      }}
    >
      <svg width="440" height="190" viewBox="0 0 440 190" fill="none">
        <path
          d="M75 150 C42 150 20 128 20 100 C20 74 48 58 75 64 C86 36 122 16 160 22 C196 6 248 6 280 28 C312 12 360 22 380 52 C412 60 432 86 426 118 C420 144 394 154 368 150 C336 166 106 166 75 150 Z"
          fill="url(#cloudGradA)"
        />
        <defs>
          <linearGradient id="cloudGradA" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
            <stop offset="55%" stopColor="#e0f2fe" stopOpacity="0.88" />
            <stop offset="100%" stopColor="#bae6fd" stopOpacity="0.65" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function CloudShapeB({
  opacity,
  scale,
  top,
  blur,
}: {
  opacity: number;
  scale: number;
  top: string;
  blur: number;
}) {
  return (
    <div
      style={{
        ...styles.cloudItem,
        top,
        opacity,
        transform: `scale(${scale})`,
        filter: `blur(${blur}px)`,
      }}
    >
      <svg width="500" height="210" viewBox="0 0 500 210" fill="none">
        <path
          d="M85 160 C48 160 26 138 32 106 C38 80 64 64 96 70 C112 38 154 16 196 24 C234 6 292 8 330 32 C368 16 414 30 440 62 C472 72 494 102 482 134 C472 160 440 166 408 160 C360 176 128 176 85 160 Z"
          fill="url(#cloudGradB)"
        />
        <defs>
          <linearGradient id="cloudGradB" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.96" />
            <stop offset="48%" stopColor="#f0f9ff" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#e0f2fe" stopOpacity="0.7" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function CloudShapeC({
  opacity,
  scale,
  top,
  blur,
}: {
  opacity: number;
  scale: number;
  top: string;
  blur: number;
}) {
  return (
    <div
      style={{
        ...styles.cloudItem,
        top,
        opacity,
        transform: `scale(${scale})`,
        filter: `blur(${blur}px)`,
      }}
    >
      <svg width="560" height="230" viewBox="0 0 560 230" fill="none">
        <path
          d="M95 170 C52 170 32 144 38 112 C44 84 75 70 106 75 C128 40 175 20 222 27 C265 8 328 11 370 38 C412 20 465 35 494 70 C528 80 554 112 544 146 C534 172 498 178 460 170 C402 190 142 190 95 170 Z"
          fill="url(#cloudGradC)"
        />
        <defs>
          <linearGradient id="cloudGradC" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
            <stop offset="42%" stopColor="#f8fafc" stopOpacity="0.88" />
            <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0.55" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  cloudWrapper: {
    position: "absolute",
    inset: 0,
    overflow: "hidden",
    pointerEvents: "none",
    zIndex: 1,
  },
  layerRow: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "200%",
    height: "100%",
    willChange: "transform",
  },
  cloudTrack: {
    display: "flex",
    width: "100%",
    height: "100%",
    position: "relative",
    justifyContent: "space-around",
  },
  cloudItem: {
    position: "absolute",
    willChange: "transform",
    pointerEvents: "none",
  },
  ambientBloom: {
    position: "absolute",
    top: "8%",
    left: "15%",
    width: "70vw",
    height: "45vh",
    borderRadius: "50%",
    background:
      "radial-gradient(ellipse at center, rgba(255, 255, 255, 0.5) 0%, rgba(224, 242, 254, 0.25) 45%, transparent 75%)",
    filter: "blur(45px)",
    pointerEvents: "none",
  },
};
