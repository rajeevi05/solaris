import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig as defineLovableConfig } from "@lovable.dev/vite-tanstack-config";
import { defineConfig as defineViteConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

// Keep the existing Lovable/Cloudflare build path, but use Nitro's Vercel
// preset when Vercel builds the project. The Cloudflare plugin emits a worker
// bundle that Vercel cannot serve directly, which causes platform 404s.
const tanstackStartOptions = {
  server: { entry: "server" },
};

const isVercel = process.env.VERCEL === "1";

export default isVercel
  ? defineViteConfig({
      plugins: [
        tailwindcss(),
        tsConfigPaths({ projects: ["./tsconfig.json"] }),
        tanstackStart(tanstackStartOptions),
        (await import("nitro/vite")).nitro({ preset: "vercel" }),
        viteReact(),
      ],
      resolve: {
        alias: {
          "@": `${process.cwd()}/src`,
        },
        dedupe: [
          "react",
          "react-dom",
          "react/jsx-runtime",
          "react/jsx-dev-runtime",
          "@tanstack/react-query",
          "@tanstack/query-core",
        ],
      },
    })
  : defineLovableConfig({
      tanstackStart: tanstackStartOptions,
    });
