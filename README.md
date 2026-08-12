# ginkgoferry.github.io

Personal website built with Astro. Pure static output; content lives in Markdown; pushing to `main` deploys to GitHub Pages via Actions.

Live: <https://ginkgoferry.github.io>

## Local development

```bash
npm install
npm run dev      # dev server with hot reload → http://localhost:4321
npm run build    # build to dist/
npm run preview  # preview the production build
npm run check    # type check
```

## First-time setup

In the GitHub repository, set **Settings → Pages → Build and deployment → Source** to **GitHub Actions** (not "Deploy from a branch"). Every push to `main` then builds and deploys automatically; progress is shown on the Actions tab.

## Publishing a post

### Option 1: drag-and-drop publisher (recommended for Typora notes)

Run `npm run publish -- `, drag the `.md` file into the terminal (the path is inserted automatically), and press Enter:

```bash
npm run publish -- ~/Notes/post.md                          # convert and write to src/content/posts/
npm run publish -- ~/Notes/post.md --tags 'os,concurrency'  # with tags
npm run publish -- ~/Notes/post.md --title 'Title' --date 2026-08-11
npm run publish -- ~/Notes/post.md --push                   # convert, then git add/commit/push in one step
```

The script handles:

- Typora absolute-path images (including narrow no-break spaces in filenames) — copied to `public/images/<slug>/` with references rewritten, and PNG/JPEG converted to WebP automatically
- `[!NOTE]`-style callouts — converted to plain blockquotes
- Frontmatter generation — title from the first `#` heading or the filename, date defaults to today

`--slug` and `--force` override defaults. Existing posts are never overwritten without `--force`.

### Option 2: write by hand

Create a `.md` file in `src/content/posts/`; the filename is the URL (`my-post.md` → `/posts/my-post/`). The frontmatter is required:

```yaml
---
title: 'Post title'
pubDate: 2026-08-11
tags: ['astro']
draft: false # true keeps the post local-only
---
```

The schema is defined in `src/content.config.ts`; invalid frontmatter fails the build, so nothing broken reaches production.

Images go in `public/images/<slug>/` and are referenced by site-root path: `![alt](/images/pv/img-01.webp)`.

## Where to change what

| Target | File |
| --- | --- |
| Site title, navigation, social links | `src/consts.ts` |
| Colors, fonts, line width, prose layout | `src/styles/global.css` |
| Homepage copy | `src/pages/index.astro` |
| Top bar / sidebar / footer | `src/components/TopBar.astro`, `Sidebar.astro`, `Footer.astro` |

Colors are defined once as CSS variables at the top of `global.css`; each theme (light/dark) changes in a single place.

## Custom domain

1. Set `site` in `astro.config.mjs` to the new domain.
2. Create `public/CNAME` containing only the domain (e.g. `example.com`).
3. Add a DNS CNAME record pointing to `ginkgoferry.github.io`.
4. Enter the domain under the repository's **Settings → Pages** and enable *Enforce HTTPS*.

## Structure

```text
src/
├── components/     # top bar, sidebar, right rail, note cards, doodle icons, theme toggle
├── content/posts/  # posts
├── layouts/        # page shell
├── pages/          # routes (file path = URL)
├── plugins/        # rehype plugin wrapping wide tables in a scrollable container
├── styles/         # global CSS
├── utils/          # sorting, reading time
├── consts.ts       # site configuration
└── content.config.ts  # post frontmatter schema
```

The site ships with a sitemap, tag pages, an archive timeline, prev/next navigation, and per-post tables of contents. The visual style is a hand-drawn notebook: LXGW WenKai everywhere (its Latin glyphs included), hand-sketched borders, note cards, and washi tape. The light theme is warm paper; the dark theme is a chalkboard. Apart from the theme toggle and a few lines for the floating TOC on narrow screens, the pages contain no JavaScript, no analytics, and no tracking.
