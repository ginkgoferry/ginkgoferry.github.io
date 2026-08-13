import type { APIRoute } from 'astro';
import { escapeXml, getFeedData } from '../utils/feed';

export const prerender = true;

export const GET: APIRoute = async ({ site }) => {
  if (!site) return new Response('Site URL is not configured', { status: 500 });

  const feed = await getFeedData(site);
  const selfUrl = new URL('/atom.xml', site).href;
  const entries = feed.entries.map((entry) => `
  <entry>
    <title>${escapeXml(entry.title)}</title>
    <id>${escapeXml(entry.url)}</id>
    <link href="${escapeXml(entry.url)}" />
    <published>${entry.published.toISOString()}</published>
    <updated>${entry.updated.toISOString()}</updated>
    <summary type="text">${escapeXml(entry.summary)}</summary>
${entry.categories.map((category) => `    <category term="${escapeXml(category)}" />`).join('\n')}
  </entry>`).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeXml(feed.title)}</title>
  <subtitle>${escapeXml(feed.description)}</subtitle>
  <id>${escapeXml(feed.siteUrl)}</id>
  <link href="${escapeXml(feed.siteUrl)}" />
  <link href="${escapeXml(selfUrl)}" rel="self" type="application/atom+xml" />
  <updated>${feed.updated.toISOString()}</updated>
  <author><name>${escapeXml(feed.author)}</name></author>${entries}
</feed>
`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/atom+xml; charset=utf-8' },
  });
};
