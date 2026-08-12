/**
 * 给 Markdown 生成的 <img> 补上懒加载属性。
 * 文章里截图多（PV 那篇 18 张），不懒加载的话手机首屏要等全部图下完。
 */
export function rehypeImgAttrs() {
  return (tree) => walk(tree);
}

function walk(node) {
  if (!node.children) return;

  for (const child of node.children) {
    walk(child);

    if (child.type === 'element' && child.tagName === 'img') {
      child.properties.loading = 'lazy';
      child.properties.decoding = 'async';
    }
  }
}
