# alteranlabs.co.uk

Personal site and blog, built with [Astro](https://astro.build/) and the [AstroPaper](https://github.com/satnaing/astro-paper) theme.

## Writing

- **Blog posts** are Markdown files in `src/content/posts/`. Copy an existing one, change the frontmatter (`title`, `pubDatetime`, `description`, `tags`) and write underneath. Add `draft: true` to keep a post unpublished.
- **Pages** (About, Portfolio, Contact) are Markdown files in `src/content/pages/`.
- **Images** go in `src/assets/images/` and are referenced as `![alt text](@/assets/images/file.png)`.
- **Site settings** (title, social links, share buttons) live in `astro-paper.config.ts`.

Push to `main` and the site rebuilds itself.

## Running locally

Requires Node 22.12+ and pnpm.

```sh
pnpm install
pnpm dev       # http://localhost:4321
pnpm build     # production build into dist/
```

## Comments

Comments use [Giscus](https://giscus.app), which stores them in GitHub Discussions. They stay hidden until `src/comments.config.ts` is filled in:

1. Use a **public** repo (this one, or a separate one just for comments) with Discussions turned on.
2. Install the [Giscus app](https://github.com/apps/giscus) on that repo.
3. On [giscus.app](https://giscus.app), enter the repo, choose "Discussion title contains page pathname" and pick a category (an Announcement-type category stops people creating threads directly on GitHub).
4. Copy `data-repo`, `data-repo-id`, `data-category` and `data-category-id` from the generated script into `src/comments.config.ts`.

The comment box follows the site's light and dark toggle.

## Hosting

The site is deployed to a DigitalOcean Droplet and served by nginx. The `Deploy` GitHub Actions workflow builds it and copies it over SSH on every push to `main`. It stays switched off until the `DEPLOY_HOST` repository variable is set.

[`deploy/README.md`](deploy/README.md) covers the one-off setup and the cutover, including moving the old site to `old.alteranlabs.co.uk`, plus how to roll back. The nginx config, including redirects from the old `/blog/post/...` URLs, is in [`deploy/nginx-alteranlabs.co.uk.conf`](deploy/nginx-alteranlabs.co.uk.conf). `public/_redirects` has the same redirects in case the site ever moves to Cloudflare Pages or Netlify.

## Upkeep

Run `pnpm update` every so often (or let Dependabot do it) and check `pnpm build` still passes. The theme's own guide is at [astro-paper.pages.dev](https://astro-paper.pages.dev/posts/how-to-update-dependencies/).
