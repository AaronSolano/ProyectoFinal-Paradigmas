import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  envDir: fileURLToPath(new URL("../..", import.meta.url)),
  plugins: [react()],
  server: {
    host: "localhost",
    port: 5174,
    strictPort: true,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test-setup.ts",
    env: {
      VITE_AUTH_API_URL: "http://localhost:3001",
      VITE_GAME_API_URL: "http://localhost:3002",
    },
  },
});
