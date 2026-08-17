import type { APIRoute } from 'astro';
import { getSortedPosts } from '../utils/posts';
import { markdownToPlainText } from '../utils/text';

// 构建期生成搜索索引：顶栏搜索框客户端过滤用。
// 标题/标签/分类 + 正文纯文本（中文按字匹配天然可用）。
export const GET: APIRoute = async () => {
  const posts = await getSortedPosts();

  return Response.json(
    posts.map((post) => ({
      id: post.id,
      title: post.data.title,
      tags: post.data.tags,
      category: post.data.category ?? null,
      date: post.data.pubDate.toISOString().slice(0, 10),
      body: markdownToPlainText(post.body ?? ''),
    })),
  );
};
