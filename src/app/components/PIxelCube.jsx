import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function PixelCube({
  color = "#ff7a18",
  pixelSize = 8,
  speed = 1,
  size = 1.7,
  height = 360,
  paused = false,
  className,
  style,
}) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);

  // Live values the animation loop reads, so changing these props
  // never tears down and rebuilds the WebGL context.
  const opts = useRef({ pixelSize, speed, paused });
  opts.current = { pixelSize, speed, paused };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(2.9, 2.2, 3.4);
    camera.lookAt(0, 0, 0);

    // antialias off + pixelRatio 1 keep the low-res buffer from being cleaned up
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    renderer.setPixelRatio(1);

    const canvas = renderer.domElement;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    canvas.style.imageRendering = "pixelated";
    mount.appendChild(canvas);

    const geometry = new THREE.BoxGeometry(size, size, size);
    const material = new THREE.MeshLambertMaterial({ color: new THREE.Color(color) });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    const key = new THREE.DirectionalLight(0xffffff, 0.95);
    key.position.set(3, 4, 2);
    const rim = new THREE.DirectionalLight(0xffb066, 0.4);
    rim.position.set(-3, -1.5, -2);
    scene.add(ambient, key, rim);

    // Render into a buffer of width/pixelSize, then let CSS stretch it back up.
    const resize = () => {
      const w = mount.clientWidth || 1;
      const h = mount.clientHeight || 1;
      const px = Math.max(1, Math.round(opts.current.pixelSize));
      renderer.setSize(
        Math.max(1, Math.floor(w / px)),
        Math.max(1, Math.floor(h / px)),
        false // don't let three.js write inline sizes back onto the canvas
      );
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    resize();

    const observer = new ResizeObserver(resize);
    observer.observe(mount);

    let frame;
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!opts.current.paused) {
        const s = opts.current.speed;
        cube.rotation.x += dt * 0.45 * s;
        cube.rotation.y += dt * 0.7 * s;
      }
      renderer.render(scene, camera);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    sceneRef.current = { material, resize };

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (canvas.parentNode === mount) mount.removeChild(canvas);
      sceneRef.current = null;
    };
  }, [size]);

  // Re-size the render buffer when the pixel grid changes.
  useEffect(() => {
    sceneRef.current?.resize();
  }, [pixelSize]);

  // Recolor in place instead of rebuilding the scene.
  useEffect(() => {
    sceneRef.current?.material.color.set(color);
  }, [color]);

  return (
    <div
      ref={mountRef}
      className={className}
      style={{ width: "100%", height, overflow: "hidden", ...style }}
    />
  );
}