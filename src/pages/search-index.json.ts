import type { APIRoute } from 'astro';
import { getSortedPosts } from '../utils/posts';

// 构建期生成搜索索引：顶栏搜索框客户端过滤用，只收标题/标签/分类
export const GET: APIRoute = async () => {
  const posts = await getSortedPosts();

  return Response.json(
    posts.map((post) => ({
      id: post.id,
      title: post.data.title,
      tags: post.data.tags,
      category: post.data.category ?? null,
      date: post.data.pubDate.toISOString().slice(0, 10),
    })),
  );
};
