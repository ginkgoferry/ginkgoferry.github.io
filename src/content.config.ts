import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
  loader: glob({ base: './src/content/posts', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    // 主分类（每篇一个），用于 /categories/；不填则只出现在 tags 里
    category: z.string().optional(),
    tags: z.array(z.string()).default([]),
    // draft: true 的文章只在 dev 下可见，不会出现在构建产物里
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };
