'use client';

import { useEffect, useRef } from 'react';

type AnimatedCubeCursorProps = {
  /** Sprite sheet to slice frames from, same one PixelCube uses by default. */
  src?: string;
  /** Columns/rows in the sheet. Defaults match /graphics/pixel-cube-sheet.png (8x6 @ 512px tiles). */
  cols?: number;
  rows?: number;
  /** Seconds for one pass across `cols` — same knob PixelCube calls `speed`. */
  speed?: number;
  /** Rendered cube size in px. */
  size?: number;
  /** Nudge the cube relative to the real pointer position, in px. */
  offsetX?: number;
  offsetY?: number;
};

/**
 * PixelCube animates by stepping a CSS background-position across a sprite sheet
 * (spriteX over `cols` steps, spriteY over `rows` steps) via keyframe animations.
 * This component reuses that exact trick on a small fixed-position tile that
 * tracks the pointer instead of sitting in the page flow, so the spinning cube
 * takes the place of the system cursor. The real cursor is hidden site-wide
 * while this is mounted and restored on unmount.
 */
function AnimatedCubeCursor({
  src = '/graphics/pixel-cube-sheet.png',
  cols = 8,
  rows = 6,
  speed = 0.75,
  size = 32,
  offsetX = 0,
  offsetY = 0,
}: AnimatedCubeCursorProps) {
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const cube = document.createElement('div');
    cube.style.position = 'fixed';
    cube.style.top = '0';
    cube.style.left = '0';
    cube.style.width = `${size}px`;
    cube.style.height = `${size}px`;
    cube.style.zIndex = '2147483647';
    cube.style.pointerEvents = 'none';
    cube.style.opacity = '0';
    cube.style.imageRendering = 'pixelated';
    cube.style.backgroundImage = `url(${src})`;
    cube.style.backgroundRepeat = 'no-repeat';
    cube.style.backgroundSize = `${cols * size}px ${rows * size}px`;
    cube.style.animation = `cubeCursorSpriteX ${speed}s steps(${cols}) infinite, cubeCursorSpriteY ${speed * rows}s steps(${rows}) infinite`;

    // Same keyframes PixelCube declares globally for spriteX/spriteY, scoped
    // here so this component doesn't depend on that CSS being loaded, plus a
    // blanket cursor:none so the real pointer disappears everywhere on the page.
    const style = document.createElement('style');
    style.textContent = `
      * { cursor: none !important; }
      @keyframes cubeCursorSpriteX {
        from { background-position-x: 0; }
        to { background-position-x: -${cols * size}px; }
      }
      @keyframes cubeCursorSpriteY {
        from { background-position-y: 0; }
        to { background-position-y: -${rows * size}px; }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(cube);

    let x = 0;
    let y = 0;
    let shown = false;

    const onMove = (e: MouseEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!shown) {
        shown = true;
        cube.style.opacity = '1';
      }
    };
    const onLeave = () => {
      shown = false;
      cube.style.opacity = '0';
    };

    const render = () => {
      cube.style.transform = `translate(${x - size / 2 + offsetX}px, ${y - size / 2 + offsetY}px)`;
      rafRef.current = requestAnimationFrame(render);
    };
    rafRef.current = requestAnimationFrame(render);

    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', onLeave);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      cube.remove();
      style.remove();
    };
  }, [src, cols, rows, speed, size, offsetX, offsetY]);

  return null;
}

export default AnimatedCubeCursor;
