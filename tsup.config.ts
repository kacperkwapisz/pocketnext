import { defineConfig } from "tsup";
import path from "path";

export default defineConfig({
  clean: true,
  dts: true,
  entry: ["src/bin/pocketnext.ts"],
  format: ["esm"],
  sourcemap: true,
  minify: true,
  target: "esnext",
  outDir: "dist",
  treeshake: true,
  noExternal: ["chalk", "execa", "fs-extra", "got", "ora", "prompts"],
  esbuildOptions(options) {
    options.banner = {
      js: `import { createRequire } from 'module';
const require = createRequire(import.meta.url);
      `,
    };
  },
  // Make sure the output file is executable
  async onSuccess() {
    const { execa } = await import("execa");
    try {
      // Add shebang to the first line
      const fs = await import("fs");
      const path = await import("path");
      const fsExtra = await import("fs-extra");
      const outputPath = path.join("dist", "pocketnext.js");

      let content = fs.readFileSync(outputPath, "utf8");
      // Only add shebang if it doesn't exist
      if (!content.startsWith("#!/usr/bin/env node")) {
        content = "#!/usr/bin/env node\n" + content;
        fs.writeFileSync(outputPath, content);
      }

      // Make executable
      await execa("chmod", ["+x", outputPath]);
      console.log("✅ CLI file permissions set to executable");

      // Copy templates folder to dist
      const templatesDir = path.join(process.cwd(), "templates");
      const destDir = path.join(process.cwd(), "dist", "templates");

      if (fs.existsSync(templatesDir)) {
        // Copy recursively
        await fsExtra.copy(templatesDir, destDir, {
          overwrite: true,
          filter: (src) =>
            !src.includes("node_modules") && !src.includes(".git"),
        });
        console.log("✅ Templates copied to dist directory");
      } else {
        console.log("❌ Templates directory not found for copying");
      }
    } catch (error) {
      console.error("Failed to post-process the build:", error);
    }
  },
});
