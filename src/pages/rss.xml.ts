import type { APIRoute } from 'astro';
import { escapeXml, getFeedData } from '../utils/feed';

export const prerender = true;

export const GET: APIRoute = async ({ site }) => {
  if (!site) return new Response('Site URL is not configured', { status: 500 });

  const feed = await getFeedData(site);
  const items = feed.entries.map((entry) => `
    <item>
      <title>${escapeXml(entry.title)}</title>
      <link>${escapeXml(entry.url)}</link>
      <guid isPermaLink="true">${escapeXml(entry.url)}</guid>
      <pubDate>${entry.published.toUTCString()}</pubDate>
      <description>${escapeXml(entry.summary)}</description>
${entry.categories.map((category) => `      <category>${escapeXml(category)}</category>`).join('\n')}
    </item>`).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(feed.title)}</title>
    <link>${escapeXml(feed.siteUrl)}</link>
    <description>${escapeXml(feed.description)}</description>
    <language>zh-CN</language>
    <lastBuildDate>${feed.updated.toUTCString()}</lastBuildDate>${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
};
