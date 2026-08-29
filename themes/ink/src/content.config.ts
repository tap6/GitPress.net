import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const posts = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./user-content/posts" }),
  schema: z
    .object({
      title: z.string(),
      date: z.coerce.date().optional(),
      updated: z.coerce.date().optional(),
      draft: z.boolean().optional(),
      tags: z.array(z.string()).optional(),
      categories: z.array(z.string()).optional(),
      description: z.string().optional(),
      cover: z.string().optional(),
      slug: z.string().optional(),
      redirectFrom: z.array(z.string()).optional(),
    })
    .passthrough(),
});

const pages = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./user-content/pages" }),
  schema: z
    .object({
      title: z.string(),
      description: z.string().optional(),
      slug: z.string().optional(),
      redirectFrom: z.array(z.string()).optional(),
    })
    .passthrough(),
});

export const collections = { posts, pages };
