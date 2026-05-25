import * as THREE from "three";

// Hashed value noise (deterministic per seed)
function makeRng(seed: number) {
  let s = seed | 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return ((s >>> 0) % 100000) / 100000;
  };
}

function valueNoise2D(width: number, height: number, scale: number, seed: number) {
  const rnd = makeRng(seed);
  const gw = Math.max(2, Math.floor(width / scale));
  const gh = Math.max(2, Math.floor(height / scale));
  const grid = new Float32Array(gw * gh);
  for (let i = 0; i < grid.length; i++) grid[i] = rnd();
  const fade = (t: number) => t * t * (3 - 2 * t);
  const out = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    const gy = (y / height) * (gh - 1);
    const y0 = Math.floor(gy);
    const ty = fade(gy - y0);
    for (let x = 0; x < width; x++) {
      const gx = (x / width) * (gw - 1);
      const x0 = Math.floor(gx);
      const tx = fade(gx - x0);
      const a = grid[y0 * gw + x0];
      const b = grid[y0 * gw + (x0 + 1)];
      const c = grid[(y0 + 1) * gw + x0];
      const d = grid[(y0 + 1) * gw + (x0 + 1)];
      const ab = a + (b - a) * tx;
      const cd = c + (d - c) * tx;
      out[y * width + x] = ab + (cd - ab) * ty;
    }
  }
  return out;
}

function fbm(width: number, height: number, octaves: number, seed: number) {
  const out = new Float32Array(width * height);
  let amp = 0.5;
  let scale = 64;
  let total = 0;
  for (let o = 0; o < octaves; o++) {
    const n = valueNoise2D(width, height, scale, seed + o * 131);
    for (let i = 0; i < out.length; i++) out[i] += n[i] * amp;
    total += amp;
    amp *= 0.55;
    scale = Math.max(2, Math.floor(scale * 0.5));
  }
  for (let i = 0; i < out.length; i++) out[i] /= total;
  return out;
}

type Stop = { t: number; r: number; g: number; b: number };
function gradient(value: number, stops: Stop[]) {
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i],
      b = stops[i + 1];
    if (value <= b.t) {
      const k = (value - a.t) / Math.max(1e-6, b.t - a.t);
      return [a.r + (b.r - a.r) * k, a.g + (b.g - a.g) * k, a.b + (b.b - a.b) * k];
    }
  }
  const last = stops[stops.length - 1];
  return [last.r, last.g, last.b];
}

const PALETTES: Record<string, Stop[]> = {
  Mercury: [
    { t: 0, r: 60, g: 50, b: 45 },
    { t: 0.5, r: 140, g: 122, b: 108 },
    { t: 1, r: 210, g: 196, b: 178 },
  ],
  Venus: [
    { t: 0, r: 120, g: 70, b: 25 },
    { t: 0.5, r: 220, g: 170, b: 95 },
    { t: 1, r: 250, g: 225, b: 170 },
  ],
  Earth: [
    { t: 0, r: 10, g: 30, b: 70 },
    { t: 0.45, r: 25, g: 80, b: 150 },
    { t: 0.5, r: 200, g: 180, b: 130 },
    { t: 0.65, r: 60, g: 110, b: 45 },
    { t: 0.85, r: 110, g: 90, b: 60 },
    { t: 1, r: 240, g: 240, b: 240 },
  ],
  Mars: [
    { t: 0, r: 60, g: 25, b: 15 },
    { t: 0.5, r: 180, g: 80, b: 45 },
    { t: 0.85, r: 220, g: 140, b: 90 },
    { t: 1, r: 240, g: 220, b: 200 },
  ],
  Jupiter: [
    { t: 0, r: 110, g: 75, b: 50 },
    { t: 0.35, r: 200, g: 160, b: 110 },
    { t: 0.55, r: 240, g: 215, b: 175 },
    { t: 0.75, r: 175, g: 110, b: 70 },
    { t: 1, r: 230, g: 195, b: 140 },
  ],
  Saturn: [
    { t: 0, r: 170, g: 140, b: 90 },
    { t: 0.5, r: 230, g: 200, b: 150 },
    { t: 1, r: 250, g: 230, b: 195 },
  ],
  Uranus: [
    { t: 0, r: 110, g: 175, b: 195 },
    { t: 0.5, r: 165, g: 220, b: 230 },
    { t: 1, r: 220, g: 245, b: 250 },
  ],
  Neptune: [
    { t: 0, r: 15, g: 35, b: 110 },
    { t: 0.5, r: 50, g: 95, b: 220 },
    { t: 1, r: 165, g: 195, b: 250 },
  ],
};

const SEEDS: Record<string, number> = {
  Mercury: 11,
  Venus: 22,
  Earth: 33,
  Mars: 44,
  Jupiter: 55,
  Saturn: 66,
  Uranus: 77,
  Neptune: 88,
};

const cache = new Map<string, THREE.CanvasTexture>();

export function getPlanetTexture(name: string): THREE.CanvasTexture {
  const cached = cache.get(name);
  if (cached) return cached;

  const W = 512;
  const H = 256;
  const stops = PALETTES[name] ?? PALETTES.Mercury;
  const seed = SEEDS[name] ?? 1;

  let noise = fbm(W, H, 6, seed);

  // Banded gas giants — distort by latitude bands
  const isGas = name === "Jupiter" || name === "Saturn" || name === "Uranus" || name === "Neptune";
  if (isGas) {
    const bands = name === "Jupiter" ? 14 : name === "Saturn" ? 10 : 6;
    const distorted = new Float32Array(W * H);
    for (let y = 0; y < H; y++) {
      const lat = y / H;
      const band = Math.sin(lat * Math.PI * bands) * 0.5 + 0.5;
      for (let x = 0; x < W; x++) {
        // swirl: shift x by noise to make turbulent bands
        const sx = Math.floor((x + noise[y * W + x] * 60) % W);
        const v = noise[y * W + sx];
        distorted[y * W + x] = v * 0.4 + band * 0.6;
      }
    }
    noise = distorted;
  }

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(W, H);
  for (let i = 0; i < W * H; i++) {
    const [r, g, b] = gradient(noise[i], stops);
    img.data[i * 4] = r;
    img.data[i * 4 + 1] = g;
    img.data[i * 4 + 2] = b;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.wrapS = THREE.RepeatWrapping;
  cache.set(name, tex);
  return tex;
}

// Cloud layer (used for Earth)
const cloudCache = new Map<number, THREE.CanvasTexture>();
export function getCloudTexture(seed = 7): THREE.CanvasTexture {
  const cached = cloudCache.get(seed);
  if (cached) return cached;
  const W = 512;
  const H = 256;
  const n = fbm(W, H, 6, seed);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(W, H);
  for (let i = 0; i < W * H; i++) {
    const v = Math.max(0, n[i] - 0.45) * 2.2;
    const a = Math.min(255, Math.floor(v * 220));
    img.data[i * 4] = 255;
    img.data[i * 4 + 1] = 255;
    img.data[i * 4 + 2] = 255;
    img.data[i * 4 + 3] = a;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  cloudCache.set(seed, tex);
  return tex;
}
