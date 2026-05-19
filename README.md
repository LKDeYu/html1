# NAMRANTA Portfolio

吴志宏的个人作品集网站。项目当前以沉浸式首页为视觉核心，同时提供 Blog、Projects、Skills 的独立内容页面。

## Current Direction

这个仓库继续作为网站主工程使用，不从通用博客模板重建。

当前方向：

- 保留首页的 Rymd 星场、滚动时间轴、Intro 工作站、Skills cube、Projects hyper scroll、Campus gallery 和 Interests carousel。
- 借鉴成熟个人博客的内容结构，完善 `/blog`、`/tags`、`/projects`、`/skills` 等独立页面。
- 写作内容改为 `content/writing/*.mdx` 维护；项目和技能展示来自静态数据文件，避免后台和数据库复杂度。
- 首页负责强视觉入口，详情页负责安静、清晰、可分享的阅读体验。

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- GSAP + ScrollTrigger
- Lenis
- Three.js
- Motion
- Markdown rendering through `react-markdown` and `remark-gfm`

## Local Development

```powershell
cd "F:\code\experiment\Cloud Computing\namranta-portfolio"
$env:npm_config_cache='F:\code\experiment\Cloud Computing\.cache\npm'
$env:NEXT_TELEMETRY_DISABLED='1'
npm install
npm run dev -- -p 3001
```

Open <http://127.0.0.1:3001>.

## Scripts

```powershell
npm run lint
npm run build
```

## Public Routes

```text
/
/blog
/blog/[slug]
/tags
/tags/[tag]
/projects
/projects/[slug]
/skills/[slug]
```

## Data And Assets

- Blog posts live under `content/writing/*.mdx`.
- Projects and skills use `src/lib/portfolio-seed.ts` through `src/lib/portfolio-data.ts`.
- Local source images under `pictures/` are untracked working assets.
- Public website images should live under `public/images/...`.
- Browser-visible image paths should use public URLs such as `/images/campus/study-1.jpg`.
- Windows paths such as `F:\...` do not work as website image URLs.

## Important Files

Homepage and visual system:

```text
src/app/page.tsx
src/components/portfolio-experience.tsx
src/components/starfield-canvas.tsx
src/components/intro-workstation.tsx
src/components/skill-cube-gallery.tsx
src/components/project-hyper-scroll.tsx
src/components/campus-gallery.tsx
src/components/interest-carousel.tsx
```

Content:

```text
src/lib/portfolio-types.ts
src/lib/portfolio-data.ts
src/lib/portfolio-seed.ts
src/lib/writing.ts
src/components/markdown-view.tsx
```

Content pages:

```text
src/app/blog/page.tsx
src/app/blog/[slug]/page.tsx
src/app/tags/page.tsx
src/app/tags/[tag]/page.tsx
src/app/projects/page.tsx
src/app/projects/[slug]/page.tsx
src/app/skills/[slug]/page.tsx
```

## Notes For Future Work

- Keep the scroll-driven timeline as the homepage design core.
- Keep the Rymd starfield full-screen and visually integrated.
- Do not turn the homepage into a plain blog landing page.
- Public page copy should describe the person, learning, projects, and writing, not the frontend effects.
- Blog should continue growing into the main long-form content section.
