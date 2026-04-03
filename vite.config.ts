import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
    host: host || false,
    hmr: host ? { protocol: "ws", host, port: 5174 } : undefined,
    watch: { ignored: ["**/src-tauri/**"] },
    proxy: {
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
        target: "https://public.starminers.site",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/stars/, ""),
        headers: {
          "User-Agent": "RuneWise OSRS Companion",
          Authorization: "1E15qy2D4M4G",
        },
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
