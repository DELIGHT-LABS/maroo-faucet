import { marooPreset } from "@maroo/panda-preset";
import { defineConfig } from "@pandacss/dev";

export default defineConfig({
  preflight: false,

  presets: ["@pandacss/preset-panda", marooPreset],

  // Just emit the package, no actual CSS scanning needed
  include: [],

  // Output to current directory (used by `panda emit-pkg`)
  outdir: ".",
});
