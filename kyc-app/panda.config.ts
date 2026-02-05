import { marooPreset } from "@maroo/panda-preset";
import { defineConfig } from "@pandacss/dev";

export default defineConfig({
  preflight: true,

  presets: ["@pandacss/preset-panda", marooPreset],

  // Use shared styled-system package
  importMap: "@maroo/styled-system",

  include: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "../common/ui/src/**/*.{js,jsx,ts,tsx}",
  ],

  exclude: [],
});
