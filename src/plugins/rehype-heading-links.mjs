/**
 * 给正文的 h2/h3 追加 # 锚点链接：hover 标题时显形，
 * 点击跳转并把小节 hash 写进地址栏，方便分享某一节。
 *
 * 两个实现细节都和 Astro 的流水线顺序有关（用户插件先于内部
 * rehypeHeadingIds 运行）：
 * 1. id 自己算：用的是同一个 github-slugger（@astrojs/markdown-remark
 *    的依赖，随 node_modules 提升）。Astro 之后发现标题已有 id 会跳过，
 *    TOC 的 slug 也直接采用这里的值，两边天然一致。
 * 2. 锚点里不放文字（# 由 CSS 画）：否则 Astro 采集标题文本时会把
 *    这个符号也算进去，污染 TOC 显示。
 */
import Slugger from 'github-slugger';

/** 只给这两级挂锚点，和右栏目录的层级一致 */
const ANCHOR_LEVELS = new Set(['h2', 'h3']);
const HEADING = /^h[1-6]$/;

export function rehypeHeadingLinks() {
  return (tree) => {
    const slugger = new Slugger();
    walk(tree, slugger);
  };
}

/** 与 Astro rehypeHeadingIds 的文本提取口径一致：拼接所有后代文本节点 */
function headingText(node) {
  let text = '';
  const stack = [...(node.children ?? [])];
  while (stack.length) {
    const child = stack.shift();
    if (child.type === 'text') text += child.value;
    else if (child.type === 'raw' && !/^\n?<.*>\n?$/.test(child.value))
      text += child.value;
    if (child.children) stack.push(...child.children);
  }
  return text;
}

function walk(node, slugger) {
  if (!node.children) return;

  for (const child of node.children) {
    if (child.type === 'element' && HEADING.test(child.tagName)) {
      child.properties = child.properties ?? {};
      // 所有级别都补 id，保证同级/跨级重名标题的去重计数一致
      if (typeof child.properties.id !== 'string') {
        child.properties.id = slugger.slug(headingText(child));
      }

      if (ANCHOR_LEVELS.has(child.tagName)) {
        const id = String(child.properties.id);
        child.children.push({
          type: 'element',
          tagName: 'a',
          properties: {
            className: ['heading-anchor'],
            href: `#${id}`,
            ariaLabel: 'link to this section',
          },
          children: [],
        });
      }
    }
    walk(child, slugger);
  }
}
