import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const reactHooksPlugin = nextVitals.find((config) => config.plugins?.["react-hooks"])
  ?.plugins?.["react-hooks"];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: {
      "react-hooks": reactHooksPlugin,
    },
    rules: {
      "react-hooks/immutability": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  {
    files: ["**/*.cjs"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".open-next/**",
    ".wrangler/**",
    ".tools/**",
    "out/**",
    "build/**",
    "scripts/debug/**",
    "scripts/maintenance/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
