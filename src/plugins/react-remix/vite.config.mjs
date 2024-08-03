import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/react-remix/",
  plugins: [remix({basename: "/react-remix/"})],
});