import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";

export function Nebula() {
  const ref = useRef<THREE.Points>(null!);
  const { geom, mat } = useMemo(() => {
    const count = 800;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const palette = [
      new THREE.Color("#5b3a9c"),
      new THREE.Color("#1f4ea8"),
      new THREE.Color("#c43c8a"),
      new THREE.Color("#2dbfa8"),
    ];
    for (let i = 0; i < count; i++) {
      const r = 90 + Math.random() * 120;
      const t = Math.random() * Math.PI * 2;
      const p = (Math.random() - 0.5) * Math.PI * 0.5;
      positions[i * 3] = Math.cos(t) * Math.cos(p) * r;
      positions[i * 3 + 1] = Math.sin(p) * r;
      positions[i * 3 + 2] = Math.sin(t) * Math.cos(p) * r;
      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const m = new THREE.PointsMaterial({
      size: 18,
      vertexColors: true,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    return { geom: g, mat: m };
  }, []);

  useFrame((s) => {
    if (ref.current) ref.current.rotation.y = s.clock.elapsedTime * 0.005;
  });

  return <points ref={ref} geometry={geom} material={mat} />;
}
