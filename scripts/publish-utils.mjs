/** 按运行机器的本地时区生成 YYYY-MM-DD，避免 toISOString() 在东八区凌晨回退一天。 */
export function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 找出 Markdown 图片。兼容以下写法：
 *   ![alt](image.png)
 *   ![alt](image with spaces.png)
 *   ![alt](<image with spaces.png> "title")
 *
 * 路径中的一层括号也可以保留，例如 screenshot (1).png。
 */
export function findMarkdownImages(source) {
  const pattern = /!\[([^\]]*)\]\(\s*(<[^>]+>|[^\r\n]*(?:\([^()\r\n]*\)[^()\r\n]*)?)\s*\)/g;
  const images = [];

  for (const match of source.matchAll(pattern)) {
    let inner = match[2].trim();
    let destination;

    if (inner.startsWith('<')) {
      const end = inner.indexOf('>');
      if (end === -1) continue;
      destination = inner.slice(1, end);
    } else {
      // Markdown 的可选标题只在路径后以空白 + 引号出现。
      inner = inner.replace(/\s+(?:"[^"]*"|'[^']*')\s*$/, '');
      destination = inner.trim();
    }

    if (!destination) continue;
    images.push({ full: match[0], alt: match[1], destination });
  }

  return images;
}

/** 更新已有 YAML frontmatter 的顶层字段；null 表示删除字段。 */
export function updateFrontmatter(frontmatter, updates) {
  const newline = frontmatter.includes('\r\n') ? '\r\n' : '\n';
  const lines = frontmatter.replace(/\r?\n$/, '').split(/\r?\n/);

  if (lines[0] !== '---' || lines.at(-1) !== '---') {
    throw new Error('无法更新格式不正确的 frontmatter');
  }

  for (const [key, value] of Object.entries(updates)) {
    const index = lines.findIndex((line, i) => i > 0 && line.startsWith(`${key}:`));

    if (value === null) {
      if (index !== -1) lines.splice(index, 1);
    } else if (index !== -1) {
      lines[index] = `${key}: ${value}`;
    } else {
      lines.splice(lines.length - 1, 0, `${key}: ${value}`);
    }
  }

  return `${lines.join(newline)}${newline}`;
}
