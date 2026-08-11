# ginkgoferry.github.io

个人网站。Astro 构建的纯静态站，内容写在 Markdown 里，推送到 `main` 自动部署到 GitHub Pages。

线上地址：<https://ginkgoferry.github.io>

## 本地开发

```bash
npm install
npm run dev      # 开发服务器，改文件自动刷新 → http://localhost:4321
npm run build    # 构建到 dist/
npm run preview  # 预览构建产物
npm run check    # 类型检查
```

## 首次上线要做的事

GitHub 仓库需要开一次开关，Actions 才有权限发布：

**Settings → Pages → Build and deployment → Source** 选 **GitHub Actions**（不是 Deploy from a branch）。

之后 `git push` 到 `main` 就会自动构建部署，进度看仓库的 Actions 页面。

## 写一篇新文章

### 方式一：拖拽发布（Typora 笔记推荐）

终端里敲 `npm run publish -- `，把 .md 文件拖进窗口（路径自动粘贴），回车：

```bash
npm run publish -- ~/Notes/xxx.md                        # 转换并写入 src/content/posts/
npm run publish -- ~/Notes/xxx.md --tags '操作系统,并发'    # 带标签
npm run publish -- ~/Notes/xxx.md --title '标题' --date 2026-08-11
npm run publish -- ~/Notes/xxx.md --push                 # 转换后直接 commit + push 上线
```

脚本自动处理：Typora 绝对路径图片拷进 `public/images/<slug>/` 并改写引用（文件名里的窄空格也不怕）、`[!NOTE]` callout 转普通引用、生成 frontmatter（标题取第一个 `#` 或文件名，日期默认今天，摘要取第一段文字）。`--slug / --desc / --force` 可覆盖默认；同名文章已存在时会报错保护。

### 方式二：手写

在 `src/content/posts/` 下新建 `.md` 文件，文件名就是 URL（`my-post.md` → `/posts/my-post/`）。开头这段 frontmatter 是必需的：

```yaml
---
title: '文章标题'
description: '一句话摘要，用在列表页和搜索结果'
pubDate: 2026-08-11
tags: ['astro']
draft: false # true 则只在本地可见，不会发布
---
```

字段规则定义在 `src/content.config.ts`，写错了构建会直接失败，不会带着问题上线。

插图放 `public/images/` 下（建议按文章建子目录，比如 `public/images/pv/`），正文里用站点根路径引用：`![alt](/images/pv/pv-01.png)`。

## 想改哪里就看哪个文件

| 想改的东西 | 文件 |
| --- | --- |
| 站点标题、导航、社交链接 | `src/consts.ts` |
| 配色、字体、行宽、正文排版 | `src/styles/global.css` |
| 首页文案 | `src/pages/index.astro` |
| 顶栏 / 侧栏 / 页脚 | `src/components/TopBar.astro`、`Sidebar.astro`、`Footer.astro` |

配色统一走 `global.css` 顶部的 CSS 变量，亮暗两套各改一处即可，不用翻组件。

## 换成自定义域名

1. `astro.config.mjs` 里把 `site` 改成新域名
2. 新建 `public/CNAME`，内容只有一行域名（如 `example.com`）
3. 域名 DNS 加一条 CNAME 记录指向 `ginkgoferry.github.io`
4. GitHub 仓库 Settings → Pages 填入该域名，勾上 Enforce HTTPS

## 结构

```text
src/
├── components/     # 顶栏、侧栏、右栏、便签卡片、涂鸦图标、主题切换
├── content/posts/  # 文章
├── layouts/        # 页面骨架
├── pages/          # 路由（文件路径 = URL）
├── plugins/        # 把宽表格包成可滚动容器的 rehype 插件
├── styles/         # 全局 CSS
├── utils/          # 排序、阅读时长
├── consts.ts       # 站点配置
└── content.config.ts  # 文章字段 schema
```

站点自带 sitemap、标签页、归档时间线、上下篇导航和文章目录。
视觉是手绘手账风：全站霞鹜文楷（英文用其自带拉丁，同一只手写字），徒手画边框、便签卡片、纸胶带；
亮色是米色纸面，暗色是黑板粉笔。
除了主题切换按钮和窄屏浮动目录的几行脚本，页面上没有任何 JavaScript，也没有埋点和统计。
