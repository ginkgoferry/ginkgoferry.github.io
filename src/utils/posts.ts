import { getCollection, type CollectionEntry } from 'astro:content';
import { SITE_CREATED_DATE } from '../consts';

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

  const { chinese, western } = countTextUnits(body);

  return Math.max(1, Math.round(chinese / 400 + western / 200));
}

export interface SiteStats {
  posts: number;
  /** 全站中文字数 + 西文词数 */
  words: number;
  /** 从固定建站日期到今天的完整自然日数 */
  days: number;
  tags: number;
}

/** 右侧栏「小本子」统计，全部从真实内容算出来。 */
export async function getSiteStats(): Promise<SiteStats> {
  const posts = await getSortedPosts();
  const words = posts.reduce((sum, post) => sum + wordCount(post.body), 0);
  const [year, month, day] = SITE_CREATED_DATE.split('-').map(Number);
  const createdUtc = Date.UTC(year, month - 1, day);
  const now = new Date();
  const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.max(0, Math.floor((todayUtc - createdUtc) / 86400_000));
  const tags = new Set(posts.flatMap((post) => post.data.tags)).size;

  return { posts: posts.length, words, days, tags };
}

/** 12345 → "12.3k"，小数字原样返回。 */
export function formatCount(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

/** 全站最近一次内容变化，优先采用文章的 updatedDate。 */
export function getLatestUpdatedDate(
  posts: CollectionEntry<'posts'>[],
): Date | undefined {
  return posts.reduce<Date | undefined>((latest, post) => {
    const date = post.data.updatedDate ?? post.data.pubDate;
    return !latest || date > latest ? date : latest;
  }, undefined);
}

/** 文章列表每页条数 */
export const POSTS_PER_PAGE = 10;

export interface CategoryInfo {
  name: string;
  posts: CollectionEntry<'posts'>[];
}

/** 按 category 汇总（每篇一个主分类），篇数多的排前面。 */
export async function getCategories(): Promise<CategoryInfo[]> {
  const posts = await getSortedPosts();
  const map = new Map<string, CollectionEntry<'posts'>[]>();

  for (const post of posts) {
    const cat = post.data.category;
    if (!cat) continue;
    map.set(cat, [...(map.get(cat) ?? []), post]);
  }

  return [...map.entries()]
    .map(([name, list]) => ({ name, posts: list }))
    .sort((a, b) => b.posts.length - a.posts.length);
}

function countTextUnits(body: string): { chinese: number; western: number } {
  const chinese = body.match(/\p{Script=Han}/gu)?.length ?? 0;
  const western = body
    .replace(/\p{Script=Han}/gu, ' ')
    .match(/[a-zA-Z0-9]+(?:['’-][a-zA-Z0-9]+)*/g)?.length ?? 0;

  return { chinese, western };
}

/** 字数：中文按字、西文按词，和 readingTime、全站统计使用同一口径。 */
export function wordCount(body: string | undefined): number {
  if (!body) return 0;

  const { chinese, western } = countTextUnits(body);

  return chinese + western;
}
