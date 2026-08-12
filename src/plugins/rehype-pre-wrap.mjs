/**
 * 给 Markdown 生成的 <pre> 套一层 .pre-wrap。
 * pre 自身要 overflow-x: auto 滚长代码，会把伸出顶边的纸胶带裁掉；
 * 胶带挂在不会裁剪的外层上才能完整显示。
 */
export function rehypePreWrap() {
  return (tree) => walk(tree);
}

function walk(node) {
  if (!node.children) return;

  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    walk(child);

    if (child.type === 'element' && child.tagName === 'pre') {
      node.children[i] = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['pre-wrap'] },
        children: [child],
      };
    }
  }
}
