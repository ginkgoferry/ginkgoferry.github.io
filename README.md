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
npm test         # publisher and content-check tests
npm run check:content # verify post metadata, images and slug uniqueness
npm run check:dist    # after build, verify internal links, assets and Feed XML
```

## First-time setup

In the GitHub repository, set **Settings → Pages → Build and deployment → Source** to **GitHub Actions** (not "Deploy from a branch"). Every push to `main` then builds and deploys automatically; progress is shown on the Actions tab. Before building, the workflow runs publisher tests, content integrity checks, and Astro type checking, so broken posts do not ship.

## Publishing a post

### Option 1: drag-and-drop publisher (recommended for Typora notes)

Run `npm run publish -- `, drag the `.md` file into the terminal (the path is inserted automatically), and press Enter:

```bash
npm run publish -- ~/Notes/post.md                          # convert and write to src/content/posts/
npm run publish -- ~/Notes/post.md --tags 'os,concurrency'  # with tags
npm run publish -- ~/Notes/post.md --category 'os'          # main category (shows on /categories/)
npm run publish -- ~/Notes/post.md --title 'Title' --date 2026-08-11
npm run publish -- ~/Notes/post.md --slug post --force --no-draft # turn a draft into a published post
npm run publish -- ~/Notes/post.md --push                   # convert, then git add/commit/push in one step
```

The script handles:

- Typora absolute-path images (including narrow no-break spaces in filenames) — copied to `public/images/<slug>/` with references rewritten, and PNG/JPEG converted to WebP automatically
- `[!NOTE]`-style callouts — converted to plain blockquotes
- Frontmatter generation — title from the first `#` heading or the filename, date defaults to today

`--slug` and `--force` override defaults. Existing posts are never overwritten without `--force`. Use `--draft` to keep a post local-only and `--no-draft` with `--force` to turn an existing draft into a published post. Overwriting a post refreshes its `updatedDate`.

### Option 2: write by hand

Create a `.md` file in `src/content/posts/`; the filename is the URL (`my-post.md` → `/posts/my-post/`). The frontmatter is required:

```yaml
---
title: 'Post title'
pubDate: 2026-08-11
category: os # optional; one main category per post, listed on /categories/
tags: ['astro']
draft: false # true keeps the post local-only
---
```

The schema is defined in `src/content.config.ts`; invalid frontmatter fails the build. CI also rejects invalid date order, duplicate titles, missing local images, and post slugs that differ only by letter case.

Images go in `public/images/<slug>/` and are referenced by site-root path: `![alt](/images/pv/img-01.webp)`.

## Where to change what

| Target | File |
| --- | --- |
| Site title, navigation, social links | `src/consts.ts` |
| Colors, fonts, line width, prose layout | `src/styles/global.css` |
| Homepage copy | `src/pages/index.astro` |
| Top bar / sidebar / footer | `src/components/TopBar.astro`, `Sidebar.astro`, `Footer.astro` |

Colors are defined once as CSS variables at the top of `global.css`; each theme (light/dark) changes in a single place.

## Analytics & comments

Both are configured in `src/consts.ts`. They are enabled in this repository; clearing the corresponding values disables them completely:

- **GoatCounter** (`GOATCOUNTER_ID`): cookie-free pageview stats. Per-post view counts and a site-wide total in the footer appear once the ID is set; the dashboard shows unique visitors. Requires enabling *Allow adding visitor counts* in the GoatCounter site settings.
- **Giscus** (`GISCUS`): GitHub-Discussions-powered comments under each post, theme-synced with the site. Requires enabling Discussions on the repository and installing the giscus app; the four config values come from giscus.app.

## Feeds

The site generates both common subscription formats during every build:

- RSS: <https://ginkgoferry.github.io/rss.xml>
- Atom: <https://ginkgoferry.github.io/atom.xml>

Feed readers discover them automatically from the metadata in every page. Add an optional `description` to a post's frontmatter to control its feed summary; otherwise a short summary is generated from the Markdown body.

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

The site ships with a sitemap, RSS/Atom feeds, category shelves, tag pages, an archive timeline, pagination, search, prev/next navigation, and per-post tables of contents. The visual style is a hand-drawn notebook: LXGW WenKai everywhere (its Latin glyphs included), hand-sketched borders, note cards, and washi tape. The light theme is warm paper; the dark theme is a chalkboard. Pages are static HTML with small client-side scripts for search, theme switching, GoatCounter, and Giscus.
