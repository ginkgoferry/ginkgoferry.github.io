/**
 * 给 Markdown 生成的 <pre> 套一层 .pre-wrap。
 * pre 自身要 overflow-x: auto 滚长代码，会把伸出顶边的纸胶带裁掉；
 * 胶带挂在不会裁剪的外层上才能完整显示。
 * 顺手在纸的下缘贴一张语言小标签（.code-lang，CSS 定位）。
 */

/** 从 <code class="language-cpp"> 取语言名；没有或 plaintext 就不贴 */
function codeLanguage(pre) {
  const code = (pre.children ?? []).find(
    (child) => child.type === 'element' && child.tagName === 'code',
  );
  const classes = Array.isArray(code?.properties?.className)
    ? code.properties.className
    : [];
  const langClass = classes.find(
    (name) => typeof name === 'string' && name.startsWith('language-'),
  );
  const lang = langClass ? langClass.slice('language-'.length).toLowerCase() : '';
  return lang && lang !== 'plaintext' ? lang : null;
}

export function rehypePreWrap() {
  return (tree) => walk(tree);
}

function walk(node) {
  if (!node.children) return;

  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    walk(child);

    if (child.type === 'element' && child.tagName === 'pre') {
      const lang = codeLanguage(child);
      node.children[i] = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['pre-wrap'] },
        children: [
          child,
          // 复制按钮挂在不裁剪的外层上，随 .pre-wrap hover 显形
          {
            type: 'element',
            tagName: 'button',
            properties: {
              className: ['code-copy'],
              type: 'button',
              ariaLabel: 'copy code',
            },
            children: [{ type: 'text', value: 'copy' }],
          },
          // 语言小纸条：探出代码纸下缘（CSS 定位），不影响复制
          ...(lang
            ? [{
                type: 'element',
                tagName: 'span',
                properties: { className: ['code-lang'], ariaHidden: true },
                children: [{ type: 'text', value: lang }],
              }]
            : []),
        ],
      };
    }
  }
}
