import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { defineConfig } from "waku/config";

export default defineConfig({
  unstable_adapter: "waku/adapters/node",
  vite: {
    resolve: {
      alias: {
        "~": "/src",
        "styled-system": "/styled-system",
      },
    },
    server: {
      proxy: {
        "/api": {
          target: "https://maroo-kyc.dev.delightlabs.sh",
          changeOrigin: true,
        },
      },
    },
    plugins: [
      react({
        babel: {
          plugins: ["babel-plugin-react-compiler"],
        },
      }),
      svgr(),
    ],
  },
});
