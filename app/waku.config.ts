import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { defineConfig } from "waku/config";

export default defineConfig({
  vite: {
    resolve: {
      alias: {
        "~": "/src",
        "styled-system": "/styled-system",
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
