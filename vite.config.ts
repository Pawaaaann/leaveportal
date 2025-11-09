import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  // Ensure Vite loads .env files from the project root (where your .env lives)
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Only process node_modules
          if (!id.includes("node_modules")) {
            return;
          }
          
          // React and React DOM (check for exact matches first)
          if (id.includes("/react/") || id.includes("/react-dom/") || id === "react" || id === "react-dom") {
            return "react-vendor";
          }
          
          // React Query
          if (id.includes("@tanstack/react-query")) {
            return "react-query";
          }
          
          // Radix UI components (large library - split into separate chunk)
          if (id.includes("@radix-ui")) {
            return "radix-ui";
          }
          
          // Firebase (can be large)
          if (id.includes("firebase/") || id.includes("firebase-admin")) {
            return "firebase";
          }
          
          // Charts (Recharts - only loaded when needed)
          if (id.includes("recharts")) {
            return "charts";
          }
          
          // UI utilities
          if (id.includes("lucide-react") || id.includes("framer-motion") || id.includes("date-fns")) {
            return "ui-utils";
          }
          
          // Form libraries
          if (id.includes("react-hook-form") || id.includes("@hookform") || id.includes("/zod/")) {
            return "forms";
          }
          
          // Router
          if (id.includes("wouter")) {
            return "router";
          }
          
          // Other vendor libraries
          return "vendor";
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Increase warning limit to 1MB
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
