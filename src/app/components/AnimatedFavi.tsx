'use client';

import { useEffect, useRef } from 'react';

type AnimatedFaviProps = {
  /** Sprite sheet to slice frames from, same one PixelCube uses by default. */
  src?: string;
  /** Columns/rows in the sheet. Defaults match /graphics/pixel-cube-sheet.png (8x6 @ 512px tiles). */
  cols?: number;
  rows?: number;
  tile?: number;
  /** Seconds for one pass across `cols` — same knob PixelCube calls `speed`. */
  speed?: number;
  /** Rendered favicon size in px (favicons are tiny, so this stays small and pixelated). */
  size?: number;
};

/**
 * PixelCube animates by stepping a CSS background-position across a sprite sheet
 * (spriteX over `cols` steps, spriteY over `rows` steps) so the tile "flips" through
 * frames like a flip-book. A <link rel="icon"> can't run CSS animations, so this
 * component does the equivalent by hand: it slices the same sheet frame-by-frame
 * onto a small canvas and republishes that canvas as the favicon on each tick.
 */
function AnimatedFavi({
  src = '/graphics/pixel-cube-sheet.png',
  cols = 8,
  rows = 6,
  tile = 512,
  speed = 0.75,
  size = 32,
}: AnimatedFaviProps) {
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // Keep it blocky like PixelCube's [image-rendering:pixelated] instead of smoothing frames.
    ctx.imageSmoothingEnabled = false;

    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    const createdLink = !link;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    const prevHref = link.href;
    const prevType = link.type;
    link.type = 'image/png';

    const image = new Image();
    image.src = src;
    let ready = false;
    image.onload = () => {
      ready = true;
    };

    // Same total frame count PixelCube steps through (cols * rows), played back
    // row-major at one frame per (speed / cols) seconds — the equivalent of
    // spriteX's `steps(cols)` over `speed`s, advancing a row every full pass.
    const totalFrames = cols * rows;
    const frameDuration = (speed * 1000) / cols;
    let start: number | null = null;

    const tick = (now: number) => {
      if (start === null) start = now;
      if (ready) {
        const frame = Math.floor((now - start) / frameDuration) % totalFrames;
        const col = frame % cols;
        const row = Math.floor(frame / cols);
        ctx.clearRect(0, 0, size, size);
        ctx.drawImage(image, col * tile, row * tile, tile, tile, 0, 0, size, size);
        link!.href = canvas.toDataURL('image/png');
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      if (createdLink) {
        link?.remove();
      } else if (link) {
        link.href = prevHref;
        link.type = prevType;
      }
    };
  }, [src, cols, rows, tile, speed, size]);

  return null;
}

export default AnimatedFavi;
