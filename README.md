# Solaris

Solaris is an interactive 3D journey through the Solar System. It combines a cinematic scroll-driven camera with a real-time Three.js scene: planets orbit the Sun, stars drift in the background, comets cross the scene, and objects can be selected to bring the camera into focus.

The app is built with React, TanStack Start, Vite, Tailwind CSS, and React Three Fiber.

## Features

- Cinematic scroll experience from deep space through the outer Solar System
- Real-time 3D planets, orbit lines, asteroid belt, comets, stars, and shooting stars
- Click-to-focus interaction for planets, the Sun, comets, asteroids, Earth satellites, and the Moon
- Earth card quick-focus buttons for the Moon, ISS, Hubble, and JWST
- Manual free-flight mode with orbit controls
- Glassmorphism HUD and section cards over a full-screen WebGL scene
- SSR/worker-oriented build output via TanStack Start and Cloudflare tooling

## Tech Stack

- React 19
- TanStack Start and TanStack Router
- Vite
- TypeScript
- Tailwind CSS 4
- Three.js, React Three Fiber, Drei, and postprocessing
- Framer Motion
- Lenis smooth scrolling
- Cloudflare Vite plugin / Wrangler config

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The app will usually be available at:

```txt
http://localhost:5173
```

## Scripts

```bash
npm run dev
```

Runs the Vite dev server.

```bash
npm run build
```

Builds the client and server output.

```bash
npm run preview
```

Previews the production build locally.

```bash
npm run lint
```

Runs ESLint.

```bash
npm run format
```

Formats the project with Prettier.

## Build Output

After running:

```bash
npm run build
```

Vite/TanStack Start creates:

- `dist/client` - static client assets
- `dist/server` - server/worker output

If a hosting provider asks for a static publish directory, use:

```txt
dist/client
```

For platforms that support the TanStack Start server or Cloudflare Worker-style output, use the generated server build under `dist/server` according to that platform's adapter requirements.

## Project Structure

```txt
src/
  components/
    solar/
      SolarExperience.tsx  # Page-level HUD, scroll sections, and controls
      SolarScene.tsx       # React Three Fiber canvas, camera rig, stars, comets
      Planet.tsx           # Planet, Moon, satellite, label, and ring rendering
      AsteroidBelt.tsx     # Instanced asteroid belt with click-to-focus support
      data.ts              # Planet and Earth satellite data
      focus.ts             # Shared focus registry/store for camera targets
      textures.ts          # Procedural planet/cloud textures
    ui/                    # Reusable UI primitives
  routes/
    index.tsx              # Main Solaris route
  styles.css               # Tailwind/theme setup
```

## Interaction Guide

- Scroll to move through the cinematic solar journey.
- Click planets, the Sun, comets, or asteroids to focus the camera.
- On the Earth card, use the Moon/ISS/Hubble/JWST buttons for easier focus targeting.
- Toggle `Free Flight` to enter manual orbit-control mode.
- Use `Recenter` to release the current target and return to the scroll-driven camera.

## Deployment Notes

This project includes `wrangler.jsonc` and a TanStack Start server entry override in `vite.config.ts`, so it is prepared for Cloudflare-style deployment flows.

For a simple static host, use:

```txt
Build command: npm run build
Publish directory: dist/client
```

For SSR/worker deployment, make sure the target platform is configured to use the generated server output rather than only the static client assets.

## Notes

The scene is WebGL-heavy. For the best experience, test on a device/browser with hardware acceleration enabled.
