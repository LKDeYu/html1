# AI Handoff

Last updated: 2026-05-18  
Repository: `F:\code\experiment\Cloud Computing\namranta-portfolio`  
GitHub remote: `https://github.com/LKDeYu/website_draft.git`  
Current branch: `main`  
Latest known pushed commit: `1ca7d4a Add blog CMS and refine portfolio interactions`

## 1. Current Direction

The project should continue from the existing codebase, not restart from a generic open-source template.

The chosen direction is:

```text
Keep this repository as the visual and application base
+ preserve the immersive Rymd / timeline frontend
+ borrow mature blog/project/tag structure from open-source personal sites
+ keep SQLite Admin CMS for now
+ later decide whether to migrate content to MDX
```

Reason:

- The hardest work already done is the visual system: Rymd starfield, scroll timeline, glass UI, Intro workstation, Skills cube, Projects hyper scroll, Campus gallery, Interests carousel.
- Mature blog templates are useful mainly for content structure: `/blog`, `/blog/[slug]`, `/tags/[tag]`, project pages, SEO, RSS, archive, search.
- Replacing the whole base would risk losing the best part of the current project.

Related strategic report:

- `docs/REDEVELOPMENT_REPORT.md`

## 2. User Preferences To Preserve

These are hard constraints from the user:

- The design core is the scroll-driven timeline.
- Rymd starfield should feel full-screen and integrated.
- Avoid isolated black boxes unless a component truly needs one.
- Glass UI should match the site theme, not look like generic frosted cards.
- Public page copy must not describe frontend effects.
  - Avoid wording like “立方体随时间轴翻转” or “滚动驱动 3D 效果”.
- Public page copy must not describe future development plans.
  - Avoid wording like “后续会部署...” or “后台将支持...”.
- Blog is important and should become a serious content section.
- Projects and Skills should have both homepage interactions and independent readable pages.
- Campus and Interests can keep placeholder/local images for now; text and images can be refined later.
- The user is new to image URLs. Explain simply:
  - Local public assets use paths like `/images/campus/study-1.jpg`.
  - External image URLs can be pasted into CMS fields.
  - Windows paths like `F:\...` do not work as public website image URLs.

## 3. Current App State

This is a Next.js application with:

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- GSAP + ScrollTrigger
- Lenis
- Three.js
- Motion
- SQLite through `better-sqlite3`
- Markdown rendering through `react-markdown` + `remark-gfm`

Important scripts:

```powershell
cd "F:\code\experiment\Cloud Computing\namranta-portfolio"
$env:npm_config_cache='F:\code\experiment\Cloud Computing\.cache\npm'
$env:NEXT_TELEMETRY_DISABLED='1'
npm run dev -- -p 3001
npm run lint
npm run build
```

Local URLs:

- Public homepage: `http://127.0.0.1:3001/`
- Admin login: `http://127.0.0.1:3001/admin/login`
- Admin CMS: `http://127.0.0.1:3001/admin`
- Blog: `http://127.0.0.1:3001/blog`
- Projects: `http://127.0.0.1:3001/projects`
- Tags: `http://127.0.0.1:3001/tags`

Development admin fallback:

- In development, admin password defaults to `admin` if `ADMIN_PASSWORD` is not set.
- In production, set:
  - `ADMIN_PASSWORD`
  - `ADMIN_SESSION_SECRET`

## 4. Git And Local Files

Known current state after the last push:

- Tracked files were clean after commit `1ca7d4a`.
- `pictures/` is an untracked local source-image folder and should generally stay untracked.
- `data/site.db`, WAL, SHM are ignored by `.gitignore`.
- `.env*` is ignored.
- `qa/` and dev server logs are ignored.

Do not casually commit:

- `pictures/`
- `data/site.db`
- `data/site.db-wal`
- `data/site.db-shm`
- `.env*`
- `.next/`
- `node_modules/`

Commit-worthy docs created during the rethink:

- `docs/REDEVELOPMENT_REPORT.md`
- `docs/AI_HANDOFF.md`

## 5. Key Routes

Public routes:

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

Admin routes:

```text
/admin/login
/admin
```

Public APIs:

```text
GET /api/projects
GET /api/projects/[slug]
GET /api/skills
GET /api/skills/[slug]
GET /api/posts
GET /api/posts/[slug]
GET /api/tags
```

Admin APIs:

```text
POST /api/admin/login
POST /api/admin/logout
POST /api/admin/projects
PATCH /api/admin/projects/[id]
DELETE /api/admin/projects/[id]
POST /api/admin/skills
PATCH /api/admin/skills/[id]
DELETE /api/admin/skills/[id]
POST /api/admin/posts
PATCH /api/admin/posts/[id]
DELETE /api/admin/posts/[id]
```

## 6. Core Files

Main app:

- `src/app/page.tsx`
- `src/app/layout.tsx`
- `src/app/globals.css`

Homepage / visual system:

- `src/components/portfolio-experience.tsx`
- `src/components/starfield-canvas.tsx`
- `src/components/infinite-city-canvas.tsx`
- `src/components/intro-workstation.tsx`
- `src/components/skill-cube-gallery.tsx`
- `src/components/project-hyper-scroll.tsx`
- `src/components/campus-gallery.tsx`
- `src/components/interest-carousel.tsx`

Overlays:

- `src/components/project-detail-overlay.tsx`
- `src/components/skill-detail-overlay.tsx`
- `src/components/markdown-view.tsx`

CMS / data:

- `src/lib/cms-types.ts`
- `src/lib/cms-db.ts`
- `src/lib/cms-seed.ts`
- `src/lib/admin-auth.ts`
- `src/components/admin-cms-client.tsx`
- `src/components/admin-login-form.tsx`

Blog / content pages:

- `src/app/blog/page.tsx`
- `src/app/blog/[slug]/page.tsx`
- `src/app/tags/page.tsx`
- `src/app/tags/[tag]/page.tsx`
- `src/app/projects/page.tsx`
- `src/app/projects/[slug]/page.tsx`
- `src/app/skills/[slug]/page.tsx`

Images:

- `public/images/campus/*`
- `public/images/interests/*`

## 7. Data Model

Current CMS tables:

- `projects`
- `skills`
- `posts`

Types are defined in:

- `src/lib/cms-types.ts`

Important fields:

Project:

- `slug`
- `name`
- `type`
- `time`
- `summary`
- `bodyMarkdown`
- `takeaway`
- `stack`
- `tags`
- `imageUrl`
- `status`
- `sortOrder`

Skill:

- `slug`
- `name`
- `title`
- `summary`
- `bodyMarkdown`
- `tags`
- `levelLabel`
- `status`
- `sortOrder`

Blog post:

- `slug`
- `title`
- `date`
- `summary`
- `bodyMarkdown`
- `tags`
- `category`
- `imageUrl`
- `status`
- `sortOrder`

Arrays are stored as JSON strings in SQLite.

Seed caveat:

- `src/lib/cms-seed.ts` only seeds when tables are empty.
- If `data/site.db` already exists, changes to seed text may not appear.
- To update existing local content, use `/admin`, write a migration, or delete the local DB only when it is safe.

## 8. Visual Assets To Protect

When refactoring, preserve these behaviors unless the user explicitly asks to remove them:

- Full-screen Rymd starfield remains visible behind the app.
- Homepage has a cinematic scroll timeline.
- Left edge menu opens spatial navigation.
- Intro includes the workstation / projection visual.
- Skills section uses a 6-face cube.
- Projects section uses the cyber/hyper scroll card field.
- Project and Skill cards open detail overlays.
- Blog also has normal independent routes.
- Campus and Interests use local image galleries.

Do not turn the homepage into a plain blog landing page.

## 9. Known Issues / Risks

### 9.1 Intro Workstation

The user still sees the computer area as not fully integrated with the background.

Likely next work:

- Improve aspect ratio at full-screen and small-window sizes.
- Reduce any apparent independent black rectangle.
- Keep the computer/projection readable while allowing Rymd to remain visible.

### 9.2 Projects Hyper Scroll

The user reported:

- Cards may move too fast.
- Active red border can feel discontinuous.
- Big theme text should remain visible while scrolling and only lose color when idle, closer to the original reference.

Likely next work:

- Tune `Z_GAP`, `cameraZ`, and motion energy in `src/components/project-hyper-scroll.tsx`.
- Make selected/hover/focus state more stable.
- Ensure click opens overlay reliably without fighting scroll motion.

### 9.3 Skills Cube

The user reported:

- Cube has exactly 6 faces, so Skills should remain limited or mapped carefully.
- C/C++ face must be visible.
- Overlay must sit above all scene text.
- Overlay needs responsive QA.
- The right-top percentage HUD was removed and should stay removed.

Likely next work:

- Verify the first 6 skills are ordered correctly.
- If more than 6 skills are needed, add a separate `/skills` index page rather than overloading the cube.

### 9.4 Blog Importance

The user considers Blog central to the personal website.

Likely next work:

- Make `/blog` more mature.
- Add search/filter.
- Add tag/category/year archive.
- Add RSS and metadata.
- Improve article typography.

### 9.5 README Is Stale

`README.md` still describes some planned features and old direction.

Likely next work:

- Update README to match current architecture.
- Remove or rephrase public-facing future-plan wording.

### 9.6 Image Size

Some local images are large:

- `public/images/campus/food-3.jpg`
- `public/images/campus/study-4.jpeg`

Likely next work:

- Compress large images before deployment.
- Consider using Next Image where appropriate.

## 10. Recommended Next Plan

Follow this order:

1. Commit the docs so the project has stable memory.
2. Update README to match current implementation.
3. Improve Blog into the main content section:
   - Better `/blog` page.
   - Better `/blog/[slug]` reading page.
   - Search/filter.
   - Tags/category/year archive.
   - RSS.
   - SEO metadata.
4. Improve Projects / Skills detail pages:
   - Make cards link to independent pages.
   - Keep overlay for immersive quick reading.
   - Add “Read full page” links inside overlays if useful.
5. Stabilize homepage visual QA:
   - Intro workstation aspect ratio and background integration.
   - Projects speed and click state.
   - Skills overlay responsiveness.
6. Prepare deployment:
   - Decide SQLite persistence strategy.
   - Set production env vars.
   - Add backup plan for `data/site.db`.

## 11. SQLite CMS vs MDX Decision

Current recommendation:

- Keep SQLite CMS for now because `/admin` already exists and the user likes browser editing.
- Borrow MDX-style page structure from mature blogs, but do not migrate content to MDX yet.

Potential future migration:

- If the user wants Git-based writing later, create:

```text
content/blog/*.mdx
content/projects/*.mdx
content/skills/*.mdx
```

Then replace the DB loader with a content loader.

Do not start this migration unless the user explicitly chooses the MDX route.

## 12. Content Rules

Public copy should sound like a personal academic/technical portfolio, not a description of the website implementation.

Good direction:

- “整理 AI 学习、项目实践和校园生活。”
- “记录从问题、方法到复盘的完整过程。”
- “把课程练习和个人项目沉淀成可回看的档案。”

Avoid:

- “立方体随时间轴翻转，展示学习中的技术栈。”
- “这里使用滚动驱动 3D 动画。”
- “后续将部署到 Ubuntu ECS、Nginx、PM2。”
- “后台未来会支持留言审核。”

## 13. References

Useful references already reviewed:

- `timlrx/tailwind-nextjs-starter-blog`: `https://github.com/timlrx/tailwind-nextjs-starter-blog`
- `hominsu/blog`: `https://github.com/hominsu/blog`
- `homing.so`: `https://homing.so/`
- Next.js MDX docs: `https://nextjs.org/docs/pages/guides/mdx`

How to use these references:

- Borrow blog/tag/archive/SEO structure.
- Do not blindly replace the current visual frontend.
- Keep homepage immersive and let detail pages be quieter and more readable.

## 14. Quick Prompt For Future Agents

If a future agent starts from this document, tell it:

```text
Continue the existing Next.js portfolio project. Do not restart from a template.
Preserve the Rymd starfield, scroll timeline, Intro workstation, Skills cube,
Projects hyper scroll, Campus gallery, and Interests carousel.
Improve the content architecture using mature blog patterns.
Keep SQLite Admin CMS unless the user explicitly asks to migrate to MDX.
Do not write public copy that describes frontend effects or future implementation plans.
```

