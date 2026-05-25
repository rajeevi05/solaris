import { useRef, useMemo, useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { PlanetData } from "./data";
import { EARTH_SATELLITES } from "./data";
import { getPlanetTexture, getCloudTexture } from "./textures";
import { focusRegistry, focusMeta, focusStore } from "./focus";

type Props = {
  data: PlanetData;
  showLabel?: boolean;
};

export function Planet({ data, showLabel = true }: Props) {
  const groupRef = useRef<THREE.Group>(null!);
  const meshRef = useRef<THREE.Mesh>(null!);
  const cloudRef = useRef<THREE.Mesh>(null!);
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);
  const texture = useMemo(() => getPlanetTexture(data.name), [data.name]);
  const clouds = data.name === "Earth" ? getCloudTexture() : null;
  const [hover, setHover] = useState(false);

  useEffect(() => {
    focusRegistry.set(data.name, groupRef.current);
    focusMeta.set(data.name, { distance: Math.max(data.radius * 4.5, 2.4) });
    return () => {
      focusRegistry.delete(data.name);
      focusMeta.delete(data.name);
    };
  }, [data.name, data.radius]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const angle = phase + t * data.speed * 0.15;
    if (groupRef.current) {
      groupRef.current.position.x = Math.cos(angle) * data.orbit;
      groupRef.current.position.z = Math.sin(angle) * data.orbit;
    }
    if (meshRef.current) meshRef.current.rotation.y += 0.0025;
    if (cloudRef.current) cloudRef.current.rotation.y += 0.0035;
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    focusStore.set(data.name);
  };

  return (
    <group ref={groupRef}>
      <group rotation={[0, 0, data.tilt]}>
        <mesh
          ref={meshRef}
          castShadow
          receiveShadow
          onClick={handleClick}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHover(true);
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            setHover(false);
            document.body.style.cursor = "auto";
          }}
        >
          <sphereGeometry args={[data.radius, 96, 96]} />
          <meshStandardMaterial
            map={texture}
            emissive={data.emissive ?? "#000000"}
            emissiveIntensity={data.emissive ? 0.15 : 0}
            roughness={0.92}
            metalness={0.02}
          />
        </mesh>

        {clouds && (
          <mesh ref={cloudRef} scale={1.015}>
            <sphereGeometry args={[data.radius, 64, 64]} />
            <meshStandardMaterial
              map={clouds}
              transparent
              opacity={0.55}
              depthWrite={false}
              roughness={1}
            />
          </mesh>
        )}

        <mesh scale={1.04}>
          <sphereGeometry args={[data.radius, 48, 48]} />
          <meshBasicMaterial
            color={data.emissive ?? data.color}
            transparent
            opacity={hover ? 0.32 : 0.18}
            side={THREE.BackSide}
            depthWrite={false}
          />
        </mesh>
        <mesh scale={1.18}>
          <sphereGeometry args={[data.radius, 32, 32]} />
          <meshBasicMaterial
            color={data.emissive ?? data.color}
            transparent
            opacity={0.06}
            side={THREE.BackSide}
            depthWrite={false}
          />
        </mesh>

        {data.ring && <Ring inner={data.ring.inner} outer={data.ring.outer} color={data.ring.color} />}
        {data.name === "Earth" && <EarthSatellites parentRadius={data.radius} />}
        {data.name === "Earth" && <Moon parentRadius={data.radius} />}
      </group>

      {showLabel && (
        <FadingLabel
          offset={data.radius + 1.0}
          name={data.name}
          color="text-cyan-200"
          accent="from-cyan-300"
        />
      )}
    </group>
  );
}

export function FadingLabel({
  offset,
  name,
  color = "text-cyan-200",
  accent = "from-cyan-300",
  nearFade = 4,
  farFade = 220,
}: {
  offset: number;
  name: string;
  color?: string;
  accent?: string;
  nearFade?: number;
  farFade?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const wrap = useRef<THREE.Group>(null!);
  const { camera } = useThree();
  useFrame(() => {
    if (!ref.current || !wrap.current) return;
    const dist = camera.position.distanceTo(wrap.current.getWorldPosition(new THREE.Vector3()));
    // fade out when too close (inside planet) and too far
    const near = THREE.MathUtils.smoothstep(dist, nearFade * 0.4, nearFade);
    const far = 1 - THREE.MathUtils.smoothstep(dist, farFade * 0.6, farFade);
    const op = Math.max(0, Math.min(1, near * far));
    ref.current.style.opacity = String(op);
  });
  return (
    <group ref={wrap} position={[0, offset, 0]}>
      <Html center distanceFactor={16} style={{ pointerEvents: "none" }}>
        <div ref={ref} className="select-none transition-opacity duration-200">
          <div className={`text-[10px] tracking-[0.4em] uppercase ${color} whitespace-nowrap drop-shadow-[0_0_6px_rgba(0,0,0,0.95)]`}>
            {name}
          </div>
          <div className={`mx-auto mt-1 h-3 w-px bg-gradient-to-b ${accent} to-transparent`} />
        </div>
      </Html>
    </group>
  );
}

function EarthSatellites({ parentRadius }: { parentRadius: number }) {
  return (
    <>
      {EARTH_SATELLITES.map((s) => (
        <Satellite key={s.name} data={s} parentRadius={parentRadius} />
      ))}
    </>
  );
}

function Satellite({
  data,
  parentRadius,
}: {
  data: (typeof EARTH_SATELLITES)[number];
  parentRadius: number;
}) {
  const group = useRef<THREE.Group>(null!);
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);
  const key = `Earth · ${data.name}`;

  useEffect(() => {
    focusRegistry.set(key, group.current);
    focusMeta.set(key, { distance: 0.5 });
    return () => {
      focusRegistry.delete(key);
      focusMeta.delete(key);
    };
  }, [key]);

  useFrame((s) => {
    const t = phase + s.clock.elapsedTime * data.speed;
    if (group.current) {
      const r = parentRadius + data.orbit * 0.5;
      group.current.position.set(
        Math.cos(t) * r,
        Math.sin(t * 0.7) * data.inclination * 0.3,
        Math.sin(t) * r,
      );
      group.current.rotation.y += 0.05;
    }
  });

  return (
    <group ref={group}>
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          focusStore.set(key);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => (document.body.style.cursor = "auto")}
      >
        <boxGeometry args={[data.radius, data.radius * 0.4, data.radius * 0.4]} />
        <meshStandardMaterial color="#dfe7f5" metalness={0.7} roughness={0.3} emissive="#6ad0ff" emissiveIntensity={0.4} />
      </mesh>
      {/* solar panels */}
      <mesh>
        <boxGeometry args={[data.radius * 0.15, data.radius * 0.05, data.radius * 1.8]} />
        <meshStandardMaterial color="#1a3a6a" metalness={0.9} roughness={0.2} emissive="#3478c8" emissiveIntensity={0.25} />
      </mesh>
      <pointLight color="#9be3ff" intensity={0.25} distance={1.2} />
      <FadingLabel
        offset={data.radius + 0.18}
        name={data.name}
        color="text-sky-200"
        accent="from-sky-300"
        nearFade={1.2}
        farFade={50}
      />
    </group>
  );
}

function Ring({ inner, outer, color }: { inner: number; outer: number; color: string }) {
  const ref = useRef<THREE.Mesh>(null!);
  const ringTexture = useMemo(() => {
    const W = 512;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = 1;
    const ctx = canvas.getContext("2d")!;
    const img = ctx.createImageData(W, 1);
    for (let x = 0; x < W; x++) {
      const t = x / W;
      const bands =
        0.5 +
        0.5 * Math.sin(t * 60 + Math.sin(t * 9.0) * 2.0) * Math.cos(t * 23 + 1.5);
      const edge = Math.min(1, t * 6) * Math.min(1, (1 - t) * 6);
      const a = Math.floor(Math.max(0, bands) * edge * 220);
      img.data[x * 4] = 230;
      img.data[x * 4 + 1] = 210;
      img.data[x * 4 + 2] = 180;
      img.data[x * 4 + 3] = a;
    }
    ctx.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    return tex;
  }, []);

  useFrame(() => {
    if (ref.current) ref.current.rotation.z += 0.0004;
  });
  return (
    <mesh ref={ref} rotation={[Math.PI / 2.1, 0, 0]}>
      <ringGeometry args={[inner, outer, 192, 8]} />
      <meshBasicMaterial
        map={ringTexture}
        color={color}
        transparent
        opacity={0.95}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

function Moon({ parentRadius }: { parentRadius: number }) {
  const ref = useRef<THREE.Mesh>(null!);
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);
  useFrame((s) => {
    const t = phase + s.clock.elapsedTime * 0.8;
    if (ref.current) {
      ref.current.position.x = Math.cos(t) * (parentRadius + 0.9);
      ref.current.position.z = Math.sin(t) * (parentRadius + 0.9);
      ref.current.rotation.y += 0.003;
    }
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.18, 32, 32]} />
      <meshStandardMaterial color="#bcbcbc" roughness={1} />
    </mesh>
  );
}

export function OrbitLine({ radius }: { radius: number }) {
  const points = useMemo(() => {
    const arr: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      arr.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
    }
    return arr;
  }, [radius]);
  const geom = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);
  const mat = useMemo(
    () => new THREE.LineBasicMaterial({ color: "#3a4a7a", transparent: true, opacity: 0.22 }),
    [],
  );
  return <primitive object={new THREE.LineLoop(geom, mat)} />;
}
