import { defineConfig } from "vitest/config";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

export default defineConfig({
  plugins: [
    {
      name: "resolve-js-to-ts",
      enforce: "pre",
      resolveId(source, importer) {
        if (importer && source.startsWith(".") && source.endsWith(".js")) {
          const tsPath = resolve(dirname(importer), `${source.slice(0, -3)}.ts`);
          if (existsSync(tsPath)) return tsPath;
        }
        return null;
      },
    },
  ],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
