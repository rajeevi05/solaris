import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

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
        rot: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
      });
      sp.push(0.04 + Math.random() * 0.08);
    }
    return { positions: pos, speeds: sp };
  }, [count, inner, outer]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

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
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#9a8b7a" roughness={0.95} metalness={0.15} />
    </instancedMesh>
  );
}
