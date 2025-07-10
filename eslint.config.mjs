// eslint.config.mjs
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  {
    files: ["**/*.ts", "**/*.tsx"], // Aplica esta configuración a archivos TypeScript
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn", // O "error" si prefieres que sea un error
        {
          "argsIgnorePattern": "^_", // Ignora argumentos de funciones que empiezan con _
          "varsIgnorePattern": "^_",   // Ignora variables que empiezan con _
          "destructuredArrayIgnorePattern": "^_" // Ignora elementos desestructurados de arrays (como en tu caso de desestructuración de objetos)
        }
      ],
      // ¡AQUÍ ES DONDE AÑADES LA DESACTIVACIÓN DE LA REGLA!
      "@typescript-eslint/no-explicit-any": "off", // Desactiva completamente la regla de 'no-explicit-any'
      // Puedes añadir aquí otras reglas si las necesitas
    },
  },
];

export default eslintConfig;
