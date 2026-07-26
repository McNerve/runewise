import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const host = process.env.TAURI_DEV_HOST;
const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgVersion = JSON.parse(
  readFileSync(join(__dirname, "package.json"), "utf-8")
).version as string;

// RW_MOCK_API=1 routes every /api proxy to scripts/mock-api.mjs so the full
// app can be exercised with realistic data in offline sandboxes.
const MOCK = process.env.RW_MOCK_API === "1";
const MOCK_TARGET = "http://localhost:5198";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    // Read package.json directly — npm_package_version is often unset under Vite CLI.
    __APP_VERSION__: JSON.stringify(pkgVersion),
  },
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
    host: host || false,
    hmr: host ? { protocol: "ws", host, port: 5174 } : undefined,
    watch: { ignored: ["**/src-tauri/**"] },
    proxy: MOCK ? Object.fromEntries(
      [
        "/api/hiscores-hardcore", "/api/hiscores-ultimate", "/api/hiscores-ironman",
        "/api/hiscores", "/api/wiki-content", "/api/wiki-prices", "/api/wom",
        "/api/news", "/api/stars", "/api/maps", "/api/cdn", "/api/temple",
      ].map((path) => [path, { target: MOCK_TARGET, changeOrigin: true }])
    ) : {
      "/api/hiscores-hardcore": {
        target: "https://secure.runescape.com",
        changeOrigin: true,
        rewrite: (path) =>
          path.replace(/^\/api\/hiscores-hardcore/, "/m=hiscore_oldschool_hardcore_ironman"),
      },
      "/api/hiscores-ultimate": {
        target: "https://secure.runescape.com",
        changeOrigin: true,
        rewrite: (path) =>
          path.replace(/^\/api\/hiscores-ultimate/, "/m=hiscore_oldschool_ultimate"),
      },
      "/api/hiscores-ironman": {
        target: "https://secure.runescape.com",
        changeOrigin: true,
        rewrite: (path) =>
          path.replace(/^\/api\/hiscores-ironman/, "/m=hiscore_oldschool_ironman"),
      },
      "/api/hiscores": {
        target: "https://secure.runescape.com",
        changeOrigin: true,
        rewrite: (path) =>
          path.replace(/^\/api\/hiscores/, "/m=hiscore_oldschool"),
      },
      "/api/wiki-content": {
        target: "https://oldschool.runescape.wiki",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/wiki-content/, "/api.php"),
        headers: { "User-Agent": "runewise - osrs companion app" },
      },
      "/api/wiki-prices": {
        target: "https://prices.runescape.wiki",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/wiki-prices/, "/api/v1/osrs"),
        headers: { "User-Agent": "runewise - osrs companion app" },
      },
      "/api/wom": {
        target: "https://api.wiseoldman.net",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/wom/, "/v2"),
        headers: { "User-Agent": "runewise - osrs companion app" },
      },
      "/api/news": {
        target: "https://secure.runescape.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/news/, "/m=news"),
      },
      "/api/stars": {
        target: "https://old.07.gg",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/stars/, ""),
        headers: { "User-Agent": "runewise - osrs companion app" },
      },
      "/api/maps": {
        target: "https://maps.runescape.wiki",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/maps/, ""),
        headers: { "User-Agent": "runewise - osrs companion app" },
      },
      "/api/cdn": {
        target: "https://cdn.runescape.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/cdn/, ""),
      },
      "/api/temple": {
        target: "https://templeosrs.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/temple/, "/api"),
        headers: { "User-Agent": "runewise - osrs companion app" },
      },
    },
  },
});
