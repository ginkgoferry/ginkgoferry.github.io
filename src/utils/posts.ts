import { getCollection, type CollectionEntry } from 'astro:content';

/** 按发布时间倒序取文章；生产构建里过滤掉草稿。 */
export async function getSortedPosts(): Promise<CollectionEntry<'posts'>[]> {
  const posts = await getCollection('posts', ({ data }: CollectionEntry<'posts'>) =>
    import.meta.env.PROD ? !data.draft : true,
  );

  return posts.sort(
    (a: CollectionEntry<'posts'>, b: CollectionEntry<'posts'>) =>
      b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );
}

/**
 * 估算阅读时长。中文按 400 字/分钟，夹在中间的西文按 200 词/分钟。
 */
export function readingTime(body: string | undefined): number {
  if (!body) return 1;

  const cjk = body.match(/[\u4e00-\u9fa5]/g)?.length ?? 0;
  const words = body.replace(/[\u4e00-\u9fa5]/g, ' ').match(/[a-zA-Z0-9]+/g)?.length ?? 0;

  return Math.max(1, Math.round(cjk / 400 + words / 200));
}

export interface SiteStats {
  posts: number;
  /** 全站汉字数 */
  chars: number;
  /** 从第一篇文章到今天的天数 */
  days: number;
  tags: number;
}

/** 右侧栏「小本子」统计，全部从真实内容算出来。 */
export async function getSiteStats(): Promise<SiteStats> {
  const posts = await getSortedPosts();

  const chars = posts.reduce((sum, post) => {
    const cjk = post.body?.match(/[\u4e00-\u9fa5]/g)?.length ?? 0;
    return sum + cjk;
  }, 0);

  const first = posts.at(-1)?.data.pubDate ?? new Date();
  const days = Math.max(1, Math.round((Date.now() - first.getTime()) / 86400_000));
  const tags = new Set(posts.flatMap((post) => post.data.tags)).size;

  return { posts: posts.length, chars, days, tags };
}

/** 12345 → "12.3k"，小数字原样返回。 */
export function formatChars(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}
