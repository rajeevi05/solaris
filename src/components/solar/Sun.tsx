import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const vert = /* glsl */ `
varying vec3 vPos;
varying vec3 vNormal;
void main(){
  vPos = position;
  vNormal = normal;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const frag = /* glsl */ `
uniform float uTime;
varying vec3 vPos;
varying vec3 vNormal;

// simple hash noise
float hash(vec3 p){ return fract(sin(dot(p, vec3(127.1,311.7,74.7)))*43758.5453); }
float noise(vec3 p){
  vec3 i=floor(p); vec3 f=fract(p);
  f=f*f*(3.0-2.0*f);
  float n=mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),
                  mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
              mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),
                  mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
  return n;
}
float fbm(vec3 p){
  float v=0.0; float a=0.5;
  for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.1; a*=0.5; }
  return v;
}

void main(){
  vec3 p = normalize(vPos) * 2.0;
  float n = fbm(p + uTime*0.15);
  float n2 = fbm(p*2.0 - uTime*0.25);
  float plasma = pow(n*0.7 + n2*0.5, 1.4);

  vec3 hot  = vec3(1.0, 0.95, 0.55);
  vec3 mid  = vec3(1.0, 0.55, 0.18);
  vec3 cool = vec3(0.85, 0.18, 0.05);
  vec3 col = mix(cool, mid, smoothstep(0.2,0.6,plasma));
  col = mix(col, hot, smoothstep(0.55,0.95,plasma));

  // rim glow
  float rim = pow(1.0 - max(dot(normalize(vNormal), vec3(0.0,0.0,1.0)),0.0), 2.5);
  col += vec3(1.0, 0.6, 0.25) * rim * 0.8;

  gl_FragColor = vec4(col, 1.0);
}
`;

export function Sun() {
  const matRef = useRef<THREE.ShaderMaterial>(null!);
  const groupRef = useRef<THREE.Group>(null!);
  const coronaRef = useRef<THREE.Mesh>(null!);

  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  useFrame((state) => {
    if (matRef.current) matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    if (groupRef.current) groupRef.current.rotation.y += 0.0008;
    if (coronaRef.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 0.6) * 0.02;
      coronaRef.current.scale.set(s, s, s);
    }
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[3.2, 96, 96]} />
        <shaderMaterial ref={matRef} vertexShader={vert} fragmentShader={frag} uniforms={uniforms} />
      </mesh>
      {/* corona */}
      <mesh ref={coronaRef}>
        <sphereGeometry args={[3.55, 48, 48]} />
        <meshBasicMaterial color="#ffb24a" transparent opacity={0.15} side={THREE.BackSide} />
      </mesh>
      <mesh>
        <sphereGeometry args={[4.4, 32, 32]} />
        <meshBasicMaterial color="#ff8a2a" transparent opacity={0.06} side={THREE.BackSide} />
      </mesh>
      <pointLight color="#ffd8a0" intensity={3} distance={200} decay={1.2} />
    </group>
  );
}
