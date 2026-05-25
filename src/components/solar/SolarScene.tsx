import { Suspense, useMemo, useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars, OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";


import { Sun } from "./Sun";
import { Planet, OrbitLine, FadingLabel } from "./Planet";
import { AsteroidBelt } from "./AsteroidBelt";
import { PLANETS, SECTIONS } from "./data";
import { focusRegistry, focusMeta, focusStore, useFocus } from "./focus";

type Props = {
  progressRef: React.MutableRefObject<number>;
  manual: boolean;
  resetSignal: number;
};

type Waypoint = { pos: THREE.Vector3; look: THREE.Vector3 };

function buildWaypoints(): Waypoint[] {
  const wps: Waypoint[] = [];
  wps.push({ pos: new THREE.Vector3(0, 35, 130), look: new THREE.Vector3(0, 0, 0) });
  PLANETS.forEach((p) => {
    const ang = 0.6;
    const px = Math.cos(ang) * p.orbit;
    const pz = Math.sin(ang) * p.orbit;
    // Closer: ~2× radius, gently above the planet
    const offset = Math.max(p.radius * 2.2, 1.6);
    wps.push({
      pos: new THREE.Vector3(px + offset * 0.4, p.radius * 0.8 + 0.6, pz + offset),
      look: new THREE.Vector3(px, 0, pz),
    });
  });
  wps.push({ pos: new THREE.Vector3(0, 95, 75), look: new THREE.Vector3(0, 0, 0) });
  wps.push({ pos: new THREE.Vector3(80, 140, 220), look: new THREE.Vector3(0, 0, 0) });
  return wps;
}

function getScrollWaypoint(p: number, wps: Waypoint[]) {
  const segs = wps.length - 1;
  const f = THREE.MathUtils.clamp(p, 0, 1) * segs;
  const i = Math.min(Math.floor(f), segs - 1);
  const localT = f - i;
  const t = localT * localT * (3 - 2 * localT);
  const pos = new THREE.Vector3().lerpVectors(wps[i].pos, wps[i + 1].pos, t);
  const look = new THREE.Vector3().lerpVectors(wps[i].look, wps[i + 1].look, t);
  return { pos, look, planetIndex: i - 1 };
}

function CameraRig({
  progressRef,
  enabled,
  resetSignal,
}: {
  progressRef: Props["progressRef"];
  enabled: boolean;
  resetSignal: number;
}) {
  const { camera, controls } = useThree() as any;
  const wps = useMemo(() => buildWaypoints(), []);
  const currentLook = useRef(new THREE.Vector3(0, 0, 0));
  const [focused] = useFocus();

  // Snap to current scroll waypoint on reset
  useEffect(() => {
    if (resetSignal === 0) return;
    const { pos, look } = getScrollWaypoint(progressRef.current, wps);
    camera.position.copy(pos);
    currentLook.current.copy(look);
    camera.lookAt(look);
    if (controls && "target" in controls) {
      controls.target.copy(look);
      controls.update?.();
    }
    focusStore.set(null);
  }, [resetSignal]);

  useFrame(() => {
    // Focus mode overrides everything (works in both manual and cinematic)
    if (focused && focusRegistry.has(focused)) {
      const obj = focusRegistry.get(focused)!;
      const wp = new THREE.Vector3();
      obj.getWorldPosition(wp);
      const dist = focusMeta.get(focused)?.distance ?? 4;
      // approach from current camera direction
      const dir = new THREE.Vector3().subVectors(camera.position, wp);
      if (dir.lengthSq() < 0.0001) dir.set(0, 0.6, 1);
      dir.normalize().multiplyScalar(dist);
      const targetPos = wp.clone().add(dir);
      camera.position.lerp(targetPos, 0.08);
      currentLook.current.lerp(wp, 0.12);
      if (controls && "target" in controls) {
        (controls.target as THREE.Vector3).lerp(wp, 0.12);
        controls.update?.();
      } else {
        camera.lookAt(currentLook.current);
      }
      return;
    }

    if (!enabled) return;
    const { pos, look } = getScrollWaypoint(progressRef.current, wps);
    camera.position.lerp(pos, 0.08);
    currentLook.current.lerp(look, 0.08);
    camera.lookAt(currentLook.current);
  });

  return null;
}

function SunBody() {
  const ref = useRef<THREE.Group>(null!);
  useEffect(() => {
    focusRegistry.set("Sun", ref.current);
    focusMeta.set("Sun", { distance: 12 });
    return () => {
      focusRegistry.delete("Sun");
      focusMeta.delete("Sun");
    };
  }, []);
  return (
    <group ref={ref}>
      <group
        onClick={(e) => {
          e.stopPropagation();
          focusStore.set("Sun");
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => (document.body.style.cursor = "auto")}
      >
        <Sun />
      </group>
      <FadingLabel
        offset={4.4}
        name="Sun"
        color="text-amber-200"
        accent="from-amber-300"
        nearFade={6}
        farFade={400}
      />
    </group>
  );
}

function ShootingStars() {
  const groupRef = useRef<THREE.Group>(null!);
  const lines = useRef<
    {
      mesh: THREE.Line;
      active: boolean;
      life: number;
      maxLife: number;
      dir: THREE.Vector3;
      origin: THREE.Vector3;
    }[]
  >([]);

  const items = useMemo(() => {
    const arr: typeof lines.current = [];
    for (let i = 0; i < 5; i++) {
      const geom = new THREE.BufferGeometry();
      const positions = new Float32Array(6);
      geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const mat = new THREE.LineBasicMaterial({
        color: "#ffffff",
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
      });
      const line = new THREE.Line(geom, mat);
      arr.push({
        mesh: line,
        active: false,
        life: 0,
        maxLife: 1,
        dir: new THREE.Vector3(),
        origin: new THREE.Vector3(),
      });
    }
    return arr;
  }, []);

  useEffect(() => {
    lines.current = items;
  }, [items]);

  useFrame((state, delta) => {
    const list = lines.current;
    for (const s of list) {
      if (!s.active) {
        if (Math.random() < 0.004) {
          // spawn
          const r = 180;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.random() * Math.PI - Math.PI / 2;
          s.origin.set(
            Math.cos(theta) * Math.cos(phi) * r,
            Math.sin(phi) * r * 0.5 + 20,
            Math.sin(theta) * Math.cos(phi) * r,
          );
          s.dir
            .set((Math.random() - 0.5) * 2, -Math.random() * 0.6 - 0.1, (Math.random() - 0.5) * 2)
            .normalize()
            .multiplyScalar(60);
          s.life = 0;
          s.maxLife = 0.9 + Math.random() * 0.7;
          s.active = true;
        }
        continue;
      }
      s.life += delta;
      const t = s.life / s.maxLife;
      if (t >= 1) {
        s.active = false;
        (s.mesh.material as THREE.LineBasicMaterial).opacity = 0;
        continue;
      }
      const head = s.origin.clone().add(s.dir.clone().multiplyScalar(t));
      const tail = head.clone().sub(s.dir.clone().multiplyScalar(0.08));
      const arr = s.mesh.geometry.attributes.position.array as Float32Array;
      arr[0] = tail.x;
      arr[1] = tail.y;
      arr[2] = tail.z;
      arr[3] = head.x;
      arr[4] = head.y;
      arr[5] = head.z;
      s.mesh.geometry.attributes.position.needsUpdate = true;
      const fade = Math.sin(t * Math.PI);
      (s.mesh.material as THREE.LineBasicMaterial).opacity = fade;
    }
  });

  return (
    <group ref={groupRef}>
      {items.map((s, i) => (
        <primitive key={i} object={s.mesh} />
      ))}
    </group>
  );
}

function TwinkleStars() {
  const ref = useRef<THREE.Points>(null!);
  const matRef = useRef<THREE.ShaderMaterial>(null!);

  const geom = useMemo(() => {
    const N = 280;
    const positions = new Float32Array(N * 3);
    const phases = new Float32Array(N);
    const sizes = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const r = 160 + Math.random() * 220;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      phases[i] = Math.random() * Math.PI * 2;
      sizes[i] = 2 + Math.random() * 4;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    g.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    return g;
  }, []);

  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  useFrame((s) => {
    if (matRef.current) matRef.current.uniforms.uTime.value = s.clock.elapsedTime;
  });

  return (
    <points ref={ref} geometry={geom}>
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexShader={`
          attribute float aPhase;
          attribute float aSize;
          uniform float uTime;
          varying float vTw;
          void main(){
            vec4 mv = modelViewMatrix * vec4(position,1.0);
            float tw = 0.5 + 0.5 * sin(uTime*2.5 + aPhase*6.28);
            tw = pow(tw, 2.0);
            vTw = tw;
            gl_PointSize = aSize * (1.0 + tw*1.5) * (300.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
          }
        `}
        fragmentShader={`
          varying float vTw;
          void main(){
            vec2 c = gl_PointCoord - 0.5;
            float d = length(c);
            if(d > 0.5) discard;
            float a = smoothstep(0.5, 0.0, d) * vTw;
            vec3 col = mix(vec3(0.8,0.85,1.0), vec3(1.0,0.95,0.8), vTw);
            gl_FragColor = vec4(col, a);
          }
        `}
      />
    </points>
  );
}

function ControlsBridge() {
  const { controls } = useThree() as any;
  useEffect(() => {
    if (!controls) return;
    const onStart = () => focusStore.set(null);
    controls.addEventListener?.("start", onStart);
    return () => controls.removeEventListener?.("start", onStart);
  }, [controls]);
  return null;
}

export function SolarScene({ progressRef, manual, resetSignal }: Props) {
  return (
    <Canvas
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 35, 130], fov: 55, near: 0.1, far: 2000 }}
      dpr={[1, 2]}
      onPointerMissed={() => focusStore.set(null)}
    >
      <color attach="background" args={["#03030a"]} />
      <fog attach="fog" args={["#03030a", 160, 480]} />

      <ambientLight intensity={0.12} />
      <hemisphereLight args={["#5566aa", "#000010", 0.18]} />

      <Suspense fallback={null}>
        <Stars radius={200} depth={60} count={4000} factor={3} saturation={0} fade speed={0.4} />
        <Stars radius={500} depth={150} count={9000} factor={5} saturation={0} fade speed={0.6} />
        <TwinkleStars />
        <ShootingStars />

        <SunBody />

        {PLANETS.map((p) => (
          <OrbitLine key={`orbit-${p.name}`} radius={p.orbit} />
        ))}
        {PLANETS.map((p) => (
          <Planet key={p.name} data={p} />
        ))}
        <AsteroidBelt />
      </Suspense>

      <CameraRig progressRef={progressRef} enabled={!manual} resetSignal={resetSignal} />

      {manual && (
        <OrbitControls
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.6}
          zoomSpeed={0.8}
          minDistance={2}
          maxDistance={500}
          makeDefault
        />
      )}
      <ControlsBridge />

      <EffectComposer multisampling={0}>
        <Bloom intensity={1.3} luminanceThreshold={0.3} luminanceSmoothing={0.85} mipmapBlur />
        <ChromaticAberration
          offset={new THREE.Vector2(0.0004, 0.0006)}
          blendFunction={BlendFunction.NORMAL}
          radialModulation={false}
          modulationOffset={0}
        />
        <Vignette eskil={false} offset={0.25} darkness={0.8} />
      </EffectComposer>
    </Canvas>
  );
}

export { SECTIONS };
