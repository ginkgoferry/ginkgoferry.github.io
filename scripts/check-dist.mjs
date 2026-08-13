#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

export function xmlError(source) {
  const tags = source.match(/<[^>]+>/g) ?? [];
  const stack = [];
  let roots = 0;

  for (const tag of tags) {
    if (/^<\?|^<!/.test(tag)) continue;
    const closing = tag.match(/^<\/\s*([^\s>]+)\s*>$/);
    if (closing) {
      const opened = stack.pop();
      if (opened !== closing[1]) return `结束标签 </${closing[1]}> 与 <${opened ?? '无'}> 不匹配`;
      continue;
    }
    const opening = tag.match(/^<\s*([^\s/>]+)/);
    if (!opening) return `无法解析标签：${tag}`;
    if (!stack.length) roots += 1;
    if (!/\/\s*>$/.test(tag)) stack.push(opening[1]);
  }

  if (roots !== 1) return `应有一个根元素，实际为 ${roots}`;
  if (stack.length) return `标签未闭合：<${stack.at(-1)}>`;
  return null;
}

function publicPathForFile(dist, file) {
  const relative = path.relative(dist, file).split(path.sep).join('/');
  if (relative === 'index.html') return '/';
  return `/${relative.replace(/index\.html$/, '')}`;
}

function targetFile(dist, pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  const relative = decoded.replace(/^\/+/, '');
  const direct = path.resolve(dist, relative);
  if (!direct.startsWith(`${path.resolve(dist)}${path.sep}`) && direct !== path.resolve(dist)) return null;
  if (fs.existsSync(direct) && fs.statSync(direct).isFile()) return direct;
  const index = path.join(direct, 'index.html');
  return fs.existsSync(index) ? index : null;
}

function references(source, extension) {
  if (extension === '.html') {
    return [...source.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)].map((match) => match[1]);
  }
  if (extension === '.css') {
    return [...source.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)].map((match) => match[1]);
  }
  return [];
}

export function checkDist(root) {
  const dist = path.join(root, 'dist');
  const errors = [];
  if (!fs.existsSync(dist)) return { errors: ['dist 不存在，请先运行 npm run build'], files: 0 };

  for (const feed of ['rss.xml']) {
    const file = path.join(dist, feed);
    if (!fs.existsSync(file)) {
      errors.push(`缺少 Feed：/${feed}`);
      continue;
    }
    const source = fs.readFileSync(file, 'utf8');
    const error = xmlError(source);
    if (error) errors.push(`/${feed} XML 无效：${error}`);
  }

  const files = walk(dist);
  for (const file of files) {
    const extension = path.extname(file).toLowerCase();
    if (extension !== '.html' && extension !== '.css') continue;
    const source = fs.readFileSync(file, 'utf8');
    const base = new URL(publicPathForFile(dist, file), 'https://local.invalid');

    for (const raw of references(source, extension)) {
      // #anchor 及 data URL 内部经过编码的 %23anchor 都不是文件引用。
      if (/^(?:[a-z]+:|\/\/|#|%23|data:)/i.test(raw)) continue;
      const url = new URL(raw, base);
      const target = targetFile(dist, url.pathname);
      if (!target) {
        errors.push(`${path.relative(dist, file)} 引用了不存在的站内资源：${raw}`);
        continue;
      }
      if (extension === '.html' && url.hash && path.extname(target) === '.html') {
        const id = decodeURIComponent(url.hash.slice(1));
        const targetSource = fs.readFileSync(target, 'utf8');
        const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (!new RegExp(`\\bid=["']${escaped}["']`).test(targetSource)) {
          errors.push(`${path.relative(dist, file)} 指向不存在的锚点：${raw}`);
        }
      }
    }
  }

  return { errors: [...new Set(errors)], files: files.length };
}

const isMain = process.argv[1]
  && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isMain) {
  const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
  const result = checkDist(root);
  if (result.errors.length) {
    console.error(`❌ 构建产物检查失败（${result.errors.length} 项）`);
    for (const error of result.errors) console.error(`- ${error}`);
    process.exitCode = 1;
  } else {
    console.log(`✅ 构建产物检查通过：${result.files} 个文件，站内链接、资源与 Feed 均正常`);
  }
}
