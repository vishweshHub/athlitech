/**
 * GridMotion
 *
 * Web-only. Renders an absolutely-positioned dark grid background
 * that slowly drifts upward using a CSS animation, creating the
 * subtle "engineering grid in motion" effect.
 *
 * Zero JS overhead in the render loop — entirely CSS-driven.
 * Respects prefers-reduced-motion.
 *
 * Usage:
 *   <View style={{ position: 'relative' }}>
 *     <GridMotion opacity={0.035} cellSize={76} />
 *     { ...content ... }
 *   </View>
 */

import React, { useEffect } from 'react';
import { Platform } from 'react-native';

interface GridMotionProps {
  /** Line opacity (0–1). Default: 0.03 */
  opacity?: number;
  /** Grid cell size in px. Default: 76 */
  cellSize?: number;
  /** Animation duration in seconds. Default: 20 */
  animDuration?: number;
  /** z-index for the grid layer. Default: 1 */
  zIndex?: number;
}

// Inject CSS once
const STYLE_ID = 'athlitech-grid-motion-css';
function injectStyles(opacity: number, cellSize: number, animDuration: number) {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;

  const rgba = `rgba(255,255,255,${opacity})`;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes gridScroll {
      0%   { background-position: 0 0; }
      100% { background-position: 0 ${cellSize}px; }
    }
    .at-grid-motion {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(${rgba} 1px, transparent 1px),
        linear-gradient(90deg, ${rgba} 1px, transparent 1px);
      background-size: ${cellSize}px ${cellSize}px;
      animation: gridScroll ${animDuration}s linear infinite;
      pointer-events: none;
      -webkit-mask-image: linear-gradient(
        to bottom,
        transparent 0%,
        rgba(0,0,0,0.6) 12%,
        rgba(0,0,0,0.6) 88%,
        transparent 100%
      );
      mask-image: linear-gradient(
        to bottom,
        transparent 0%,
        rgba(0,0,0,0.6) 12%,
        rgba(0,0,0,0.6) 88%,
        transparent 100%
      );
    }
    @media (prefers-reduced-motion: reduce) {
      .at-grid-motion { animation: none; }
    }
  `;
  document.head.appendChild(style);
}

export default function GridMotion({
  opacity = 0.03,
  cellSize = 76,
  animDuration = 22,
  zIndex = 1,
}: GridMotionProps) {
  if (Platform.OS !== 'web') return null;

  return <GridMotionWeb opacity={opacity} cellSize={cellSize} animDuration={animDuration} zIndex={zIndex} />;
}

function GridMotionWeb({ opacity, cellSize, animDuration, zIndex }: Required<GridMotionProps>) {
  useEffect(() => {
    injectStyles(opacity, cellSize, animDuration);
  }, [opacity, cellSize, animDuration]);

  return React.createElement('div', {
    className: 'at-grid-motion',
    'aria-hidden': true,
    style: { zIndex },
  });
}
