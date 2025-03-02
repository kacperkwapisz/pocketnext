import { defineConfig } from "tsup";

export default defineConfig({
  clean: true,
  dts: true,
  entry: ["src/cli/index.ts", "src/bin/pocketnext.ts"],
  format: ["esm"],
  sourcemap: true,
  minify: true,
  target: "esnext",
  outDir: "dist",
  treeshake: true,
  noExternal: [
    "chalk",
    "commander",
    "execa",
    "fs-extra",
    "got",
    "ora",
    "prompts",
    "tar",
  ],
  esbuildOptions(options) {
    options.banner = {
      js: `
        import { createRequire } from 'module';
        const require = createRequire(import.meta.url);
      `,
    };
  },
});
