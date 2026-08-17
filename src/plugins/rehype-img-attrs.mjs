/**
 * 给 Markdown 生成的 <img> 补属性：
 * - loading/decoding：懒加载（文章里截图多，PV 那篇 18 张）
 * - width/height：构建时用 sharp 读一次尺寸（缓存），浏览器提前留位，
 *   图片逐张加载时正文不再跳动（消灭 CLS）
 * - srcset/sizes：同目录若有 <名字>@750w.webp 响应式变体
 *   （publish 脚本转 WebP 时顺手生成的），普通屏用小图、Retina 用原图
 *
 * 只对站内图片（/ 开头）补尺寸；外链只加懒加载。
 */
import fs from 'node:fs';
import path from 'node:path';

// sharp 是可选依赖：读不了就退化为只加懒加载，构建不受影响
let sharp = null;
try {
  sharp = (await import('sharp')).default;
} catch {
  /* sharp 不可用 */
}

// astro dev/build 都从仓库根目录跑（npm scripts），用 cwd 定位 public/ 最稳：
// 配置和插件会被 Astro 打包进临时文件，import.meta.url 在构建里不可靠。
const PUBLIC_DIR = path.resolve(process.cwd(), 'public');

/** 每张图每次构建只读一次尺寸 */
const sizeCache = new Map();

/** 站内 src -> public 下的真实文件；路径越界（../ 之类）返回 null */
function localFile(src) {
  let decoded;
  try {
    decoded = decodeURIComponent(src);
  } catch {
    decoded = src;
  }
  const relative = decoded.split(/[?#]/, 1)[0].replace(/^\/+/, '');
  const file = path.resolve(PUBLIC_DIR, relative);
  if (!file.startsWith(`${PUBLIC_DIR}${path.sep}`)) return null;
  return { file, decoded };
}

async function imageSize(entry) {
  if (!sharp) return null;
  if (sizeCache.has(entry.file)) return sizeCache.get(entry.file);
  let size = null;
  try {
    if (fs.existsSync(entry.file)) {
      const meta = await sharp(entry.file).metadata();
      if (meta.width && meta.height) {
        size = { width: meta.width, height: meta.height };
      }
    }
  } catch {
    /* 读不出尺寸就算了 */
  }
  sizeCache.set(entry.file, size);
  return size;
}

/** 中文目录名按段编码进 URL，和 Astro 对 src 的编码口径一致 */
function toUrl(decodedPath) {
  const encoded = decodedPath
    .replace(/^\/+/, '')
    .split('/')
    .map((segment) => encodeURIComponent(segment).replace(/%40/g, '@'))
    .join('/');
  return `/${encoded}`;
}

/** img-01.webp -> img-01@750w.webp；非 WebP 不做变体 */
function variantPath(decodedPath, width) {
  if (!decodedPath.endsWith('.webp')) return null;
  return `${decodedPath.slice(0, -'.webp'.length)}@${width}w.webp`;
}

function enhanceImg(node) {
  const props = node.properties ?? (node.properties = {});
  props.loading = 'lazy';
  props.decoding = 'async';

  const src = typeof props.src === 'string' ? props.src : '';
  if (!src.startsWith('/') || src.startsWith('//')) return Promise.resolve();

  const entry = localFile(src);
  if (!entry) return Promise.resolve();

  return imageSize(entry).then((size) => {
    if (!size) return;
    if (!size) return;
    props.width = size.width;
    props.height = size.height;

    // 原图比变体宽得多、且变体确实存在，才值得给浏览器出选择题
    const variant = variantPath(entry.decoded, 750);
    if (!variant || size.width <= 900) return;
    if (!fs.existsSync(path.join(PUBLIC_DIR, variant))) return;

    props.srcSet = `${toUrl(variant)} 750w, ${toUrl(entry.decoded)} ${size.width}w`;
    props.sizes = '(max-width: 640px) 92vw, 700px';
  });
}

export function rehypeImgAttrs() {
  return async (tree) => {
    const jobs = [];
    walk(tree, (img) => jobs.push(enhanceImg(img)));
    await Promise.all(jobs);
  };
}

function walk(node, visit) {
  if (!node.children) return;

  for (const child of node.children) {
    if (child.type === 'element' && child.tagName === 'img') visit(child);
    walk(child, visit);
  }
}
