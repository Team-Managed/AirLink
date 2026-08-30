"use client";

import React, { useRef, useEffect } from "react";
import gsap from "gsap";

interface AirLinkLogoProps {
  size?: number;
  showText?: boolean;
  animated?: boolean;
  textColor?: string;
  style?: React.CSSProperties;
}

export function AirLinkAgentLogo({
  size = 36,
  showText = false,
  animated = true,
  textColor = "#0f172a",
  style = {},
}: AirLinkLogoProps) {
  const planeRef = useRef<SVGGElement>(null);
  const eyesRef = useRef<SVGGElement>(null);
  const sparkRef = useRef<SVGGElement>(null);

  useEffect(() => {
    if (!animated || !planeRef.current) return;

    // Gentle airplane floating & tilt
    const planeTween = gsap.to(planeRef.current, {
      y: -3,
      rotation: 3,
      duration: 2.4,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
      transformOrigin: "center center",
    });

    // Cute doodle eye blink animation
    let blinkInterval: NodeJS.Timeout;
    if (eyesRef.current) {
      const blink = () => {
        gsap.timeline()
          .to(eyesRef.current, { scaleY: 0.1, duration: 0.12, ease: "power2.inOut", transformOrigin: "center center" })
          .to(eyesRef.current, { scaleY: 1, duration: 0.14, ease: "power2.inOut" });
      };

      blinkInterval = setInterval(() => {
        if (Math.random() > 0.3) blink();
      }, 3500);
    }

    // Code spark pulse
    let sparkTween: gsap.core.Tween | undefined;
    if (sparkRef.current) {
      sparkTween = gsap.to(sparkRef.current, {
        scale: 1.25,
        opacity: 1,
        duration: 1.2,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        transformOrigin: "center center",
      });
    }

    return () => {
      planeTween.kill();
      if (sparkTween) sparkTween.kill();
      if (blinkInterval) clearInterval(blinkInterval);
    };
  }, [animated]);

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        ...style,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: "visible" }}
      >
        {/* Animated Airplane & Agent Face Group (No Outer Circle) */}
        <g ref={planeRef} transform="translate(0, 0)">
          {/* Hand-drawn Flight Loop Line */}
          <path
            d="M 6 36 C 9 41, 15 39, 15 33 C 15 27, 10 25, 9 29 C 8 32, 10 36, 17 34"
            stroke="#0284c7"
            strokeWidth="1.8"
            strokeDasharray="2.5 2.5"
            strokeLinecap="round"
            fill="none"
            opacity={0.85}
          />

          {/* Paper Airplane Body with Origami Shadow */}
          {/* Under Wing */}
          <path
            d="M 22 28 L 26 36 L 29 27 Z"
            fill="#7dd3fc"
            stroke="#0284c7"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* Main Origami Wing */}
          <path
            d="M 12 25 L 38 12 L 28 34 L 22 28 Z"
            fill="url(#wingGrad)"
            stroke="#0f172a"
            strokeWidth="1.8"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Center Fold Crease */}
          <path
            d="M 38 12 L 22 28"
            stroke="#0284c7"
            strokeWidth="1.6"
            strokeLinecap="round"
          />

          {/* Agent Doodle Eyes ( • ◡ • ) */}
          <g ref={eyesRef}>
            {/* Left Eye */}
            <circle cx="27" cy="21" r="1.9" fill="#0f172a" />
            <circle cx="27.6" cy="20.3" r="0.6" fill="#ffffff" />

            {/* Right Eye */}
            <circle cx="32" cy="18" r="1.9" fill="#0f172a" />
            <circle cx="32.6" cy="17.3" r="0.6" fill="#ffffff" />

            {/* Doodle Smile */}
            <path
              d="M 29 22.5 Q 30.5 24 32 21.5"
              stroke="#0f172a"
              strokeWidth="1.2"
              strokeLinecap="round"
              fill="none"
            />
          </g>

          {/* Antenna / Sparks at Nose (Clean, No Orange Dot) */}
          <g ref={sparkRef}>
            {/* Micro Code Symbol Spark */}
            <path
              d="M 40 9 L 43 7 M 40 12 L 44 12"
              stroke="#0284c7"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </g>
        </g>

        {/* Gradients */}
        <defs>
          <linearGradient id="logoBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <linearGradient id="wingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="60%" stopColor="#f0f9ff" />
            <stop offset="100%" stopColor="#bae6fd" />
          </linearGradient>
        </defs>
      </svg>

      {showText && (
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 900,
            fontSize: 20,
            letterSpacing: -0.6,
            color: textColor,
          }}
        >
          AirLink
        </span>
      )}
    </div>
  );
}
