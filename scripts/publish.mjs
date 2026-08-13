#!/usr/bin/env node
// 拖拽发布：把 Typora / Markdown 笔记转换成站内文章。
//
// 用法（在终端里敲 `npm run publish -- ` 后把 .md 文件拖进窗口即可）：
//   npm run publish -- ~/Notes/xxx.md                     转换并写入 src/content/posts/
//   npm run publish -- ~/Notes/xxx.md --tags '操作系统,并发'  带标签
//   npm run publish -- ~/Notes/xxx.md --category '操作系统'   主分类（/categories/ 书架）
//   npm run publish -- ~/Notes/xxx.md --title '标题'        指定标题（默认取首个 # 或文件名）
//   npm run publish -- ~/Notes/xxx.md --push              转换后 git add/commit/push 上线
//
// 它会自动处理：
//   - Typora 的绝对路径图片（含文件名里的窄空格）→ 拷进 public/images/<slug>/ 并改写引用
//   - PNG/JPEG 自动转 WebP（依赖 sharp，转不了就原样保留）
//   - > [!NOTE] 等 callout → 普通引用
//   - 生成 frontmatter（title/pubDate/tags；分享卡片和 SEO 用标题）

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  findMarkdownImages,
  localDateString,
  updateFrontmatter,
} from './publish-utils.mjs';

// 可选依赖：装了 sharp 就把 PNG/JPEG 转成 WebP，体积大约降到 1/5
let sharp = null;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.warn('⚠️ 未安装 sharp，图片将保持原格式（npm install -D sharp 即可启用 WebP 转换）');
}

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);

// ---------- 参数 ----------
const argv = process.argv.slice(2);
const files = [];
const opts = { tags: [], push: false, force: false, draft: false, category: '' };
const provided = new Set();
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--tags') {
    provided.add('tags');
    opts.tags = (argv[++i] ?? '').split(/[,，]/).map((s) => s.trim()).filter(Boolean);
  }
  else if (a === '--title') {
    provided.add('title');
    opts.title = argv[++i];
  }
  else if (a === '--slug') opts.slug = argv[++i];
  else if (a === '--date') {
    provided.add('pubDate');
    opts.date = argv[++i];
  }
  else if (a === '--push') opts.push = true;
  else if (a === '--force') opts.force = true;
  else if (a === '--draft') {
    provided.add('draft');
    opts.draft = true;
  }
  else if (a === '--category') {
    provided.add('category');
    opts.category = argv[++i] ?? '';
  }
  else if (a === '--help' || a === '-h') {
    console.log('用法: npm run publish -- <笔记.md> [--title 标题] [--slug url名] [--tags a,b] [--category 分类] [--date YYYY-MM-DD] [--draft] [--push] [--force]');
    process.exit(0);
  } else files.push(a);
}
if (files.length === 0) {
  console.error('❌ 把 .md 文件拖进来：npm run publish -- <笔记.md>');
  process.exit(1);
}

const q = (s) => `'${String(s).replace(/'/g, "''")}'`;

const slugify = (s) => {
  const out = s
    .toLowerCase()
    .replace(/[^a-z0-9一-鿿]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return out || `post-${Date.now()}`;
};

// ---------- 转换单篇 ----------
let failed = false;
for (const file of files) {
  const abs = path.resolve(file);
  if (!fs.existsSync(abs)) {
    console.error(`❌ 找不到文件：${abs}`);
    failed = true;
    continue;
  }
  let src = fs.readFileSync(abs, 'utf8');

  // 已有 frontmatter 就原样保留，只转换正文
  let existingFm = '';
  if (/^---\n/.test(src)) {
    const m = src.match(/^---\n([\s\S]*?)\n---\n?/);
    if (m) {
      existingFm = m[0];
      src = src.slice(m[0].length);
    }
  }

  const base = path.basename(abs, path.extname(abs));

  // 标题：--title > 首个一级标题 > 文件名
  let title = opts.title;
  const h1 = src.match(/^#\s+(.+)\s*$/m);
  if (!title && h1) {
    title = h1[1].trim();
    src = src.replace(h1[0], ''); // 页面会渲染 frontmatter 标题，去掉正文里的重复 H1
  }
  if (!title) title = base;

  const slug = opts.slug ?? slugify(base);
  const postPath = path.join(ROOT, 'src/content/posts', `${slug}.md`);
  const overwriting = fs.existsSync(postPath);
  if (overwriting && !opts.force) {
    console.error(`❌ 已存在 ${path.relative(ROOT, postPath)}，要覆盖请加 --force，或换 --slug`);
    failed = true;
    continue;
  }

  // ---------- 图片迁移 ----------
  const imgDir = path.join(ROOT, 'public/images', slug);
  const seen = new Map(); // 源路径 -> 站内名
  let n = 0;
  let webpCount = 0;
  const migrate = async (srcAttr) => {
    if (/^(https?:)?\/\//.test(srcAttr) || srcAttr.startsWith('/images/')) return null;
    const local = srcAttr.startsWith('/') ? srcAttr : path.resolve(path.dirname(abs), srcAttr);
    if (!fs.existsSync(local)) {
      console.warn(`⚠️ 图片不存在，保持原样：${srcAttr}`);
      return null;
    }
    if (!seen.has(local)) {
      n += 1;
      fs.mkdirSync(imgDir, { recursive: true });
      const ext = (path.extname(local) || '.png').toLowerCase();
      const convertible = sharp && ['.png', '.jpg', '.jpeg'].includes(ext);
      const name = `img-${String(n).padStart(2, '0')}${convertible ? '.webp' : ext}`;
      const dest = path.join(imgDir, name);
      if (convertible) {
        try {
          await sharp(local).webp({ quality: 80 }).toFile(dest);
          webpCount += 1;
        } catch (err) {
          console.warn(`⚠️ WebP 转换失败，保留原图：${path.basename(local)}（${err.message}）`);
          fs.copyFileSync(local, path.join(imgDir, `img-${String(n).padStart(2, '0')}${ext}`));
          seen.set(local, `img-${String(n).padStart(2, '0')}${ext}`);
          return `/images/${slug}/${seen.get(local)}`;
        }
      } else {
        fs.copyFileSync(local, dest);
      }
      seen.set(local, name);
    }
    return `/images/${slug}/${seen.get(local)}`;
  };

  // <img src="..." alt="..." ...> → ![alt](...)
  const imgTags = [...src.matchAll(/<img\s+[^>]*src="([^"]+)"[^>]*>/g)];
  for (const mTag of imgTags) {
    const url = await migrate(mTag[1]);
    if (!url) continue;
    const alt = (mTag[0].match(/alt="([^"]*)"/) ?? [])[1] ?? '';
    src = src.replace(mTag[0], `![${alt}](${url})`);
  }
  // ![alt](本地路径) → ![alt](/images/...)
  const mdImgs = findMarkdownImages(src);
  for (const mImg of mdImgs) {
    const url = await migrate(mImg.destination);
    if (url) src = src.replace(mImg.full, `![${mImg.alt}](${url})`);
  }

  // ---------- callout → 普通引用 ----------
  src = src.replace(/^>\s*\[!\w+\]\s*\n>\s*\n/gm, '');
  src = src.replace(/^>\s*\[!\w+\]\s*\n/gm, '');

  const today = localDateString();
  const pubDate = opts.date ?? today;

  let fm;
  if (existingFm) {
    const updates = {};
    if (provided.has('title')) updates.title = q(opts.title);
    if (provided.has('pubDate')) updates.pubDate = opts.date;
    if (provided.has('category')) updates.category = opts.category ? q(opts.category) : null;
    if (provided.has('tags')) updates.tags = `[${opts.tags.map(q).join(', ')}]`;
    if (provided.has('draft')) updates.draft = 'true';
    if (overwriting) updates.updatedDate = today;
    fm = updateFrontmatter(existingFm, updates);
  } else {
    fm = `---\ntitle: ${q(title)}\npubDate: ${pubDate}${overwriting ? `\nupdatedDate: ${today}` : ''}${opts.category ? `\ncategory: ${q(opts.category)}` : ''}\ntags: [${opts.tags.map(q).join(', ')}]${opts.draft ? '\ndraft: true' : ''}\n---\n`;
  }

  fs.mkdirSync(path.dirname(postPath), { recursive: true });
  fs.writeFileSync(postPath, fm + src.replace(/^\n+/, '\n'));

  console.log(`✅ 文章：${path.relative(ROOT, postPath)}${opts.draft ? '（草稿：本地可见，线上不发布）' : overwriting ? '（已覆盖，标记 updatedDate）' : ''}`);
  console.log(`   标题：${title}　日期：${pubDate}　分类：${opts.category || '（无）'}　标签：${opts.tags.join(', ') || '（无）'}`);
  console.log(`   图片：${seen.size} 张 → public/images/${slug}/` + (webpCount ? `（${webpCount} 张已转 WebP）` : ''));

  // ---------- 上线 ----------
  if (opts.push) {
    const rel = [path.relative(ROOT, postPath), ...(seen.size ? [`public/images/${slug}`] : [])];
    try {
      // 用 argv 数组调 git，不经 shell，标题/路径里的特殊字符不会被解释
      execFileSync('git', ['add', '--', ...rel], { cwd: ROOT, stdio: 'inherit' });
      execFileSync('git', ['commit', '-m', `publish: ${title}`], { cwd: ROOT, stdio: 'inherit' });
      execFileSync('git', ['push'], { cwd: ROOT, stdio: 'inherit' });
      console.log('🚀 已 push，等 Actions 部署完成即可上线');
    } catch {
      console.error('❌ push 失败，请手动 git add/commit/push');
      failed = true;
    }
  } else {
    console.log('   预览：npm run dev → http://localhost:4321；满意后 git push 即上线（或加 --push）');
  }
}

if (failed) process.exitCode = 1;
