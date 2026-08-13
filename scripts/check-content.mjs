#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { findMarkdownImages } from './publish-utils.mjs';

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

function images(source) {
  const markdown = findMarkdownImages(source).map((image) => image.destination);
  const html = [...source.matchAll(/<img\s+([^>]*)>/gi)].map((match) => ({
    destination: match[1].match(/\bsrc=["']([^"']+)["']/i)?.[1] ?? '',
  })).map((image) => image.destination);
  return [...markdown, ...html].filter(Boolean);
}

function frontmatterValue(source, key) {
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1];
  if (!frontmatter) return undefined;
  const raw = frontmatter.match(new RegExp(`^${key}:\\s*(.*?)\\s*$`, 'm'))?.[1];
  if (!raw) return undefined;
  if ((raw.startsWith("'") && raw.endsWith("'"))
    || (raw.startsWith('"') && raw.endsWith('"'))) {
    return raw.slice(1, -1);
  }
  return raw;
}

function withoutQueryOrHash(value) {
  return value.split(/[?#]/, 1)[0];
}

function decodePath(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function checkContent(root) {
  const postsDir = path.join(root, 'src/content/posts');
  const publicDir = path.join(root, 'public');
  const posts = walk(postsDir).filter((file) => /\.(md|mdx)$/i.test(file));
  const errors = [];
  const slugs = new Map();
  const titles = new Map();

  for (const post of posts) {
    const relative = path.relative(postsDir, post);
    const slug = relative.replace(/\.(md|mdx)$/i, '').normalize('NFC').toLowerCase();
    const existing = slugs.get(slug);
    if (existing) {
      errors.push(`slug 冲突：${existing} 与 ${relative}`);
    } else {
      slugs.set(slug, relative);
    }

    const source = fs.readFileSync(post, 'utf8');
    const title = frontmatterValue(source, 'title');
    if (title) {
      const titleKey = title.normalize('NFC').trim().toLowerCase();
      const existingTitle = titles.get(titleKey);
      if (existingTitle) {
        errors.push(`标题重复：${existingTitle} 与 ${relative}（${title}）`);
      } else {
        titles.set(titleKey, relative);
      }
    }

    const pubDate = frontmatterValue(source, 'pubDate');
    const updatedDate = frontmatterValue(source, 'updatedDate');
    if (updatedDate && pubDate && updatedDate < pubDate) {
      errors.push(`${relative} 的 updatedDate ${updatedDate} 早于 pubDate ${pubDate}`);
    }

    for (const rawTarget of images(source)) {
      if (/^(?:[a-z]+:)?\/\//i.test(rawTarget) || /^(?:data:|#)/i.test(rawTarget)) continue;
      const target = decodePath(withoutQueryOrHash(rawTarget));
      const resolved = target.startsWith('/')
        ? path.resolve(publicDir, `.${target}`)
        : path.resolve(path.dirname(post), target);

      if (!fs.existsSync(resolved)) {
        errors.push(`${relative} 引用了不存在的图片：${rawTarget}`);
      }
    }
  }

  return { errors, posts: posts.length };
}

const isMain = process.argv[1]
  && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isMain) {
  const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
  const result = checkContent(root);
  if (result.errors.length) {
    console.error(`❌ 内容检查失败（${result.errors.length} 项）`);
    for (const error of result.errors) console.error(`- ${error}`);
    process.exitCode = 1;
  } else {
    console.log(`✅ 内容检查通过：${result.posts} 篇文章`);
  }
}
