// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import { rehypeTableWrap } from './src/plugins/rehype-table-wrap.mjs';
import { rehypeImgAttrs } from './src/plugins/rehype-img-attrs.mjs';

// 用户主站（ginkgoferry.github.io）部署在域名根路径，所以 base 保持默认的 '/'。
// 以后换自定义域名，只需要改 site，并在 public/ 下放一个 CNAME 文件。
export default defineConfig({
  site: 'https://ginkgoferry.github.io',
  integrations: [mdx(), sitemap()],
  markdown: {
    processor: unified({ rehypePlugins: [rehypeTableWrap, rehypeImgAttrs] }),
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark-dimmed',
      },
      wrap: true,
    },
  },
});
