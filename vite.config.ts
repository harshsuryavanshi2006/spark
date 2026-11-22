// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Ensure .env Supabase configuration takes precedence over synthetic non-URL runtime placeholders.
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const parsedEnv: Record<string, string> = {};
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (val) parsedEnv[key] = val;
  }
  const hasValidClientUrl = /^https?:\/\//.test(process.env["VITE_SUPABASE_URL"] ?? "");
  const hasValidServerUrl = /^https?:\/\//.test(process.env["SUPABASE_URL"] ?? "");
  if (!hasValidClientUrl || !hasValidServerUrl) {
    for (const [key, val] of Object.entries(parsedEnv)) {
      if (key.includes("SUPABASE")) {
        process.env[key] = val;
      }
    }
  }
}

export default defineConfig({
  vite: {
    server: {
      host: "0.0.0.0",
      port: 3000,
      allowedHosts: true,
      hmr: process.env["DISABLE_HMR"] !== "true",
      watch: process.env["DISABLE_HMR"] === "true" ? null : {},
    },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
