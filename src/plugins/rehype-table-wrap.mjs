/**
 * 把 Markdown 生成的 <table> 包进一个可横向滚动的 div。
 * 不加这层，宽表格会在手机上把整个页面顶宽，导致正文左右晃。
 */
export function rehypeTableWrap() {
  return (tree) => wrap(tree);
}

function wrap(node) {
  if (!node.children) return;

  node.children = node.children.map((child) => {
    wrap(child);

    if (child.type === 'element' && child.tagName === 'table') {
      return {
        type: 'element',
        tagName: 'div',
        properties: { className: ['table-scroll'] },
        children: [child],
      };
    }

    return child;
  });
}
