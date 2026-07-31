import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

// Bug fix: `eslint-config-next`, Next.js 16'da doğrudan flat-config
// (dizi) formatında dışa aktarılıyor; ama bu proje Next.js 15.5.22
// kullanıyor ve o sürümdeki `eslint-config-next` hâlâ eski eslintrc
// (obje + `extends`) formatını dışa aktarıyor. `FlatCompat`, bunu
// flat-config'e köprüler — Next.js 15.x projelerinin resmi/varsayılan
// `create-next-app` şablonundaki desenin ta kendisi.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"],
  },
];

export default eslintConfig;
