import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

const zodRestriction = {
  name: "zod",
  allowTypeImports: true,
  message: "Import the CSP-configured runtime from @/lib/zod.",
};

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  {
    files: ["**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}"],
    ignores: ["src/lib/zod.ts"],
    rules: {
      "no-restricted-imports": ["error", {
        paths: [zodRestriction],
      }],
    },
  },
  {
    files: ["src/operations/**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}"],
    rules: {
      "no-restricted-imports": ["error", {
        paths: [zodRestriction],
        patterns: [{
          group: ["@noble/hashes", "@noble/hashes/**", "@noble/ciphers", "@noble/ciphers/**", "fflate", "fflate/**"],
          allowTypeImports: true,
          message: "Load heavy operation dependencies with await import() inside run().",
        }],
      }],
    },
  },
  globalIgnores([".next/**", "out/**", "next-env.d.ts", "playwright-report/**", "test-results/**"]),
]);
