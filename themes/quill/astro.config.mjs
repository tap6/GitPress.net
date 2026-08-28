import { defineConfig } from "astro/config";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const configPath = fileURLToPath(new URL("./gitpress.config.json", import.meta.url));
const gp = existsSync(configPath)
  ? JSON.parse(readFileSync(configPath, "utf8"))
  : { site: { title: "GitPress Dev" } };

const base = gp.site?.basePath ?? "/";
const prefix = base === "/" ? "" : base.replace(/\/$/, "");

/** Prefix root-relative URLs in rendered markdown (e.g. /media/...) with the base path. */
function rehypeBasePrefix() {
  return (tree) => {
    if (!prefix) return;
    const visit = (node) => {
      if (node.type === "element" && node.properties) {
        for (const key of ["src", "href"]) {
          const value = node.properties[key];
          if (
            typeof value === "string" &&
            value.startsWith("/") &&
            !value.startsWith("//") &&
            !value.startsWith(`${prefix}/`)
          ) {
            node.properties[key] = prefix + value;
          }
        }
      }
      for (const child of node.children ?? []) visit(child);
    };
    visit(tree);
  };
}

export default defineConfig({
  site: gp.site?.url,
  base,
  markdown: {
    rehypePlugins: [rehypeBasePrefix],
  },
});
