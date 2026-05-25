import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { focusMeta, focusRegistry, focusStore } from "./focus";

export function AsteroidBelt({
  count = 1200,
  inner = 26,
  outer = 30,
}: {
  count?: number;
  inner?: number;
  outer?: number;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const markerRef = useRef<THREE.Group>(null!);
  const selectedIndex = useRef<number | null>(null);
  const selectedKey = useRef<string | null>(null);

  const { positions, speeds } = useMemo(() => {
    const pos: { r: number; a: number; y: number; s: number; rot: THREE.Euler }[] = [];
    const sp: number[] = [];
    for (let i = 0; i < count; i++) {
      const r = inner + Math.random() * (outer - inner);
      const a = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 0.6;
      const s = 0.04 + Math.random() * 0.12;
      pos.push({
        r,
        a,
        y,
        s,
        rot: new THREE.Euler(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI,
        ),
      });
      sp.push(0.04 + Math.random() * 0.08);
    }
    return { positions: pos, speeds: sp };
  }, [count, inner, outer]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    return () => {
      if (!selectedKey.current) return;
      focusRegistry.delete(selectedKey.current);
      focusMeta.delete(selectedKey.current);
    };
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const p = positions[i];
      const ang = p.a + t * speeds[i] * 0.08;
      dummy.position.set(Math.cos(ang) * p.r, p.y, Math.sin(ang) * p.r);
      dummy.rotation.copy(p.rot);
      dummy.rotation.x += t * 0.1;
      dummy.scale.setScalar(p.s);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      if (selectedIndex.current === i) {
        markerRef.current.position.copy(dummy.position);
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <group ref={markerRef} />
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, count]}
        onClick={(e) => {
          e.stopPropagation();
          const index = e.instanceId;
          if (index === undefined) return;
          const key = `Asteroid ${String(index + 1).padStart(3, "0")}`;
          if (selectedKey.current && selectedKey.current !== key) {
            focusRegistry.delete(selectedKey.current);
            focusMeta.delete(selectedKey.current);
          }
          selectedIndex.current = index;
          selectedKey.current = key;
          focusRegistry.set(key, markerRef.current);
          focusMeta.set(key, { distance: 1.2 });
          focusStore.set(key);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => (document.body.style.cursor = "auto")}
      >
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#9a8b7a" roughness={0.95} metalness={0.15} />
      </instancedMesh>
    </group>
  );
}
