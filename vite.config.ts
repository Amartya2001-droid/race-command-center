import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { buildIdentityPlugin } from "./scripts/build-identity";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [buildIdentityPlugin(), react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
