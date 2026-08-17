/**
 * Markdown 正文 -> 纯文本。
 * RSS 摘要和搜索索引用同一套口径：去掉代码块、图片、链接和标记语法，保留文字。
 */
export function markdownToPlainText(body: string): string {
  return body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/~~~[\s\S]*?~~~/g, ' ')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^\s{0,3}(?:#{1,6}|>|[-+*]|\d+\.)\s+/gm, '')
    .replace(/[`*_~|#]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
