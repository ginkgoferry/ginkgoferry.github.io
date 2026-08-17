import type { CollectionEntry } from 'astro:content';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import { SITE_CREATED_DATE, SITE_DESCRIPTION, SITE_TITLE } from '../consts';
import { getSortedPosts } from './posts';
import { markdownToPlainText } from './text';

export interface FeedEntry {
  title: string;
  url: string;
  published: Date;
  updated: Date;
  summary: string;
  /** 渲染后的全文 HTML（content:encoded 用）；渲染失败时缺省 */
  contentHtml?: string;
  categories: string[];
}

export interface FeedData {
  title: string;
  description: string;
  siteUrl: string;
  updated: Date;
  entries: FeedEntry[];
}

export function escapeXml(value: string): string {
  return value.replace(/[<>&"']/g, (char) => {
    const entities: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      '"': '&quot;',
      "'": '&apos;',
    };
    return entities[char];
  });
}

/** 从 Markdown 正文生成短摘要；Frontmatter 可选 description 时优先使用它。 */
function postSummary(post: CollectionEntry<'posts'>): string {
  if (post.data.description) return post.data.description;

  const plain = markdownToPlainText(post.body ?? '');

  return plain ? `${plain.slice(0, 180)}${plain.length > 180 ? '…' : ''}` : post.data.title;
}

/**
 * Feed 全文渲染器：不带站内 rehype 插件（复制按钮/纸胶带对阅读器是噪音），
 * 代码块也不着色——阅读器里纯文本代码反而干净。
 */
let feedProcessor: Promise<Awaited<ReturnType<typeof createMarkdownProcessor>>> | null =
  null;

function getFeedProcessor() {
  feedProcessor ??= createMarkdownProcessor({ syntaxHighlight: false });
  return feedProcessor;
}

async function postContentHtml(
  post: CollectionEntry<'posts'>,
  site: URL,
): Promise<string | undefined> {
  if (!post.body) return undefined;
  try {
    const { code } = await (await getFeedProcessor()).render(post.body);
    // 站内相对链接 -> 绝对 URL，阅读器里图片和链接才打得开
    return code.replace(/((?:src|href)=")\/([^"]*)(")/g, `$1${site.href}$2$3`);
  } catch {
    // 单篇渲染失败不该拖垮整条 Feed，退回纯摘要
    return undefined;
  }
}

export async function getFeedData(site: URL): Promise<FeedData> {
  const posts = await getSortedPosts();
  const created = new Date(`${SITE_CREATED_DATE}T00:00:00+08:00`);
  const entries = await Promise.all(
    posts.map(async (post) => {
      const updated = post.data.updatedDate ?? post.data.pubDate;
      return {
        title: post.data.title,
        url: new URL(`/posts/${post.id}/`, site).href,
        published: post.data.pubDate,
        updated,
        summary: postSummary(post),
        contentHtml: await postContentHtml(post, site),
        categories: [...new Set(
          [post.data.category, ...post.data.tags].filter(
            (value): value is string => Boolean(value),
          ),
        )],
      };
    }),
  );
  const updated = entries.reduce(
    (latest, entry) => entry.updated > latest ? entry.updated : latest,
    created,
  );

  return {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    siteUrl: site.href,
    updated,
    entries,
  };
}
