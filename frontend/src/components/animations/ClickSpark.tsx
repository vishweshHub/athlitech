/**
 * ClickSpark
 *
 * Web-only. Renders a full-page transparent overlay that listens for
 * clicks and bursts 8 SVG spark lines from the click point, then
 * removes them after 500ms.
 *
 * Mount once inside your root layout. It is completely invisible until
 * a click fires.
 *
 * Usage (in LandingScreen or _layout):
 *   import ClickSpark from '@/components/animations/ClickSpark';
 *   ...
 *   <ClickSpark />
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

interface Spark {
  id: number;
  x: number;
  y: number;
}

const SPARK_COUNT = 8;
const SPARK_LENGTH = 18;
const SPARK_SPREAD = 40; // max distance sparks travel
const SPARK_DURATION = 480; // ms

function SparkBurst({ x, y }: { x: number; y: number }) {
  const lines = Array.from({ length: SPARK_COUNT }, (_, i) => {
    const angle = (360 / SPARK_COUNT) * i;
    const rad = (angle * Math.PI) / 180;
    const x2 = Math.cos(rad) * SPARK_SPREAD;
    const y2 = Math.sin(rad) * SPARK_SPREAD;
    return { angle, x2, y2 };
  });

  return (
    <svg
      style={{
        position: 'fixed',
        left: x - SPARK_SPREAD,
        top: y - SPARK_SPREAD,
        width: SPARK_SPREAD * 2,
        height: SPARK_SPREAD * 2,
        pointerEvents: 'none',
        zIndex: 9999,
        overflow: 'visible',
      }}
    >
      {lines.map((line, i) => (
        <line
          key={i}
          x1={SPARK_SPREAD}
          y1={SPARK_SPREAD}
          x2={SPARK_SPREAD + line.x2}
          y2={SPARK_SPREAD + line.y2}
          stroke="#10b981"
          strokeWidth="1.5"
          strokeLinecap="round"
          style={{
            animation: `spark-fade ${SPARK_DURATION}ms ease-out forwards`,
            transformOrigin: `${SPARK_SPREAD}px ${SPARK_SPREAD}px`,
          }}
        />
      ))}
    </svg>
  );
}

// Inject keyframes once
let keyframesInjected = false;
function injectKeyframes() {
  if (keyframesInjected || typeof document === 'undefined') return;
  keyframesInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spark-fade {
      0%   { opacity: 1; stroke-dashoffset: 0; }
      100% { opacity: 0; stroke-dashoffset: ${SPARK_LENGTH}; }
    }
    @media (prefers-reduced-motion: reduce) {
      @keyframes spark-fade { 0%, 100% { opacity: 0; } }
    }
  `;
  document.head.appendChild(style);
}

export default function ClickSpark() {
  // Only mount on web
  if (Platform.OS !== 'web') return null;

  return <ClickSparkWeb />;
}

function ClickSparkWeb() {
  const [sparks, setSparks] = useState<Spark[]>([]);
  const nextId = useRef(0);

  useEffect(() => {
    injectKeyframes();

    function handleClick(e: MouseEvent) {
      const id = nextId.current++;
      setSparks((prev) => [...prev, { id, x: e.clientX, y: e.clientY }]);
      setTimeout(() => {
        setSparks((prev) => prev.filter((s) => s.id !== id));
      }, SPARK_DURATION + 50);
    }

    window.addEventListener('click', handleClick, { passive: true });
    return () => window.removeEventListener('click', handleClick);
  }, []);

  return (
    <>
      {sparks.map((spark) => (
        <SparkBurst key={spark.id} x={spark.x} y={spark.y} />
      ))}
    </>
  );
}
