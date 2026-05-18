import { defineConfig } from "eslint/config";
import next from "eslint-config-next";
import prettier from "eslint-config-prettier";

export default defineConfig([
  {
    extends: [...next],
  },
  prettier,
]);
