import type { CollectionEntry } from 'astro:content';
import { SITE_CREATED_DATE, SITE_DESCRIPTION, SITE_TITLE } from '../consts';
import { getSortedPosts } from './posts';

export interface FeedEntry {
  title: string;
  url: string;
  published: Date;
  updated: Date;
  summary: string;
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

  const plain = (post.body ?? '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[`#>*_~\[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return plain ? `${plain.slice(0, 180)}${plain.length > 180 ? '…' : ''}` : post.data.title;
}

export async function getFeedData(site: URL): Promise<FeedData> {
  const posts = await getSortedPosts();
  const created = new Date(`${SITE_CREATED_DATE}T00:00:00+08:00`);
  const entries = posts.map((post) => {
    const updated = post.data.updatedDate ?? post.data.pubDate;
    return {
      title: post.data.title,
      url: new URL(`/posts/${post.id}/`, site).href,
      published: post.data.pubDate,
      updated,
      summary: postSummary(post),
      categories: [...new Set(
        [post.data.category, ...post.data.tags].filter(
          (value): value is string => Boolean(value),
        ),
      )],
    };
  });
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
