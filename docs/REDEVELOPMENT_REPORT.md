# 个人网站重新开发评估报告

检查日期：2026-05-18  
当前仓库：`F:\code\experiment\Cloud Computing\namranta-portfolio`  
当前分支：`main`  
最近提交：`1ca7d4a Add blog CMS and refine portfolio interactions`  
远程仓库：`https://github.com/LKDeYu/website_draft.git`

## 1. 结论先行

如果目标是“更快做成一个成熟、可长期维护的个人网站”，我不建议把现在的代码整体丢掉后从零迁移到开源模板。更稳的路线是：

1. 保留当前项目作为视觉主工程，因为目前最难复刻的是 Rymd 星场、滚动时间轴、Intro 电脑投影、Skills cube、Projects hyper scroll、Campus/Interests gallery 这些前端资产。
2. 借鉴成熟博客模板的内容结构，例如 `/blog`、`/blog/[slug]`、`/tags/[tag]`、`/projects/[slug]`、RSS、SEO、归档、搜索，而不是直接把当前视觉强行搬进一个博客模板。
3. 如果一定要换开源基座，推荐选择 `tailwind-nextjs-starter-blog` 这一类 Next.js + MDX 博客基座，然后把当前前端组件作为“首页沉浸式外壳”迁移过去。但这会比“在当前项目吸收博客架构”更费时间。

我的推荐路线是：**当前仓库继续作为基座，按成熟博客模板重构内容层和路由层**。这样既能保住现在已经做出来的视觉效果，也能把博客、标签、项目详情页、SEO、内容维护方式做成熟。

## 2. 当前项目资产盘点

### 2.1 已实现的核心体验

当前项目已经不是简单前端 demo，而是一个完整 Next.js 应用：

- 首页 `/`
  - `StarfieldCanvas`：Rymd 风格星场背景。
  - `PortfolioExperience`：主滚动时间轴。
  - 左侧 Meny / Spatial Menu 导航。
  - 7 个时间轴 section：
    - Intro
    - Skills
    - Projects
    - Campus
    - Interests
    - Blog
    - Contact
- 独立内容页
  - `/blog`
  - `/blog/[slug]`
  - `/tags`
  - `/tags/[tag]`
  - `/projects`
  - `/projects/[slug]`
  - `/skills/[slug]`
- 后台
  - `/admin/login`
  - `/admin`
  - Projects / Skills / Blog 三类内容管理。

### 2.2 前端组件保全清单

这些组件是重构时必须优先保留的视觉资产：

| 模块 | 文件 | 保留原因 |
| --- | --- | --- |
| 首页主体验 | `src/components/portfolio-experience.tsx` | 时间轴、Meny、section 切换逻辑都在这里，是当前网站的设计核心。 |
| Rymd 星场 | `src/components/starfield-canvas.tsx` | 全站沉浸式背景基础。 |
| Intro 电脑投影 | `src/components/intro-workstation.tsx` | 目前最有辨识度的首屏视觉之一，但仍需继续优化自适应和背景融合。 |
| Skills cube | `src/components/skill-cube-gallery.tsx` | 技能页的核心交互，依赖 6 个面。 |
| Skills 详情层 | `src/components/skill-detail-overlay.tsx` | 点击技能后展示 Markdown 正文。 |
| Projects hyper scroll | `src/components/project-hyper-scroll.tsx` | 项目页的核心视觉和交互。 |
| Projects 详情层 | `src/components/project-detail-overlay.tsx` | 点击项目卡片后展示 Markdown 正文。 |
| Campus gallery | `src/components/campus-gallery.tsx` | 校园生活图片展示。 |
| Interests carousel | `src/components/interest-carousel.tsx` | 兴趣图片展示。 |
| Markdown 渲染 | `src/components/markdown-view.tsx` | Blog / Project / Skill 正文渲染。 |
| 后台编辑器 | `src/components/admin-cms-client.tsx` | 当前 CMS v1 的管理界面。 |

### 2.3 内容与数据层

当前数据层是 SQLite + Next.js Route Handlers：

- 数据库文件：`data/site.db`
- 数据层：`src/lib/cms-db.ts`
- 类型：`src/lib/cms-types.ts`
- 默认种子数据：`src/lib/cms-seed.ts`

当前数据模型包括：

- `ProjectRecord`
- `SkillRecord`
- `BlogPostRecord`

当前 API 包括：

- Public:
  - `/api/projects`
  - `/api/projects/[slug]`
  - `/api/skills`
  - `/api/skills/[slug]`
  - `/api/posts`
  - `/api/posts/[slug]`
  - `/api/tags`
- Admin:
  - `/api/admin/login`
  - `/api/admin/logout`
  - `/api/admin/projects`
  - `/api/admin/projects/[id]`
  - `/api/admin/skills`
  - `/api/admin/skills/[id]`
  - `/api/admin/posts`
  - `/api/admin/posts/[id]`

### 2.4 图片资产

当前已放入 public 的图片：

- `public/images/campus/*`
- `public/images/interests/*`

注意：

- `pictures/` 是本地未提交素材目录，不应直接依赖它作为线上路径。
- `public/images/campus/food-3.jpg` 和 `public/images/campus/study-4.jpeg` 文件较大，后续上线前建议压缩。
- 前台引用 public 图片时路径应写成 `/images/campus/xxx.jpg`，不是 Windows 本地路径。

## 3. 当前项目的主要问题

### 3.1 README 已过时

`README.md` 仍写着 `SQLite planned`、留言系统、部署计划等内容，这和当前实现不完全一致。重构前应更新 README，避免后续自己或评审老师误解当前状态。

### 3.2 内容系统有两条路线冲突

当前项目已经做了 `/admin` + SQLite，这是“动态 CMS 路线”。

成熟个人博客模板通常采用 MDX 文件，例如：

- `data/blog/my-post.mdx`
- `data/projects/my-project.mdx`

这是“静态文件内容路线”。

两者没有谁绝对更高级，但维护方式完全不同：

- SQLite CMS：浏览器里编辑，适合不会频繁碰代码的内容维护。
- MDX 文件：在仓库里写 Markdown/MDX，适合博客长期维护、版本控制、部署简单。

如果换开源博客基座，大概率会从 SQLite CMS 改成 MDX 文件内容。这样 `/admin` 可能不再是必要功能。

### 3.3 首页视觉和普通博客页面的结构差异很大

你的首页是沉浸式时间轴，而成熟博客模板通常是普通页面流：

- Header
- Post list
- Tags
- Pagination
- Footer

如果直接换基座，最难的是把当前首页的 pinned timeline、Lenis、GSAP ScrollTrigger、Three.js、canvas 背景稳定迁移进去。它们比普通博客页面复杂得多。

### 3.4 当前仍需视觉 QA 的点

后续无论是否换基座，这些问题都要继续检查：

- Intro 电脑投影在全屏和窄窗口下的比例。
- 电脑周围黑色区域与 Rymd 星场的融合。
- Projects 卡片滚动速度、选中态、点击详情的稳定性。
- Skills cube 6 个面是否始终可见（滚动轮转的时候需确保顺序以及正方体每个方向的停留时间），详情层是否完全覆盖旧文字。
- 移动端详情层关闭按钮、正文滚动和背景遮罩。

## 4. 开源基座调研

### 4.1 `timlrx/tailwind-nextjs-starter-blog`

链接：<https://github.com/timlrx/tailwind-nextjs-starter-blog>

适合学习和借鉴的点：

- 典型成熟个人博客结构。
- Blog 列表、独立文章页、标签页、归档、SEO、RSS 这类基础能力很完整。
- 内容以 MDX 为核心，适合文章长期沉淀。
- 项目展示通常通过静态数据或 MDX 页面实现。

对当前项目的启发：

- 我们应该让 `/blog`、`/blog/[slug]`、`/tags/[tag]` 更像成熟博客，而不是只做首页里的一个展示片段。
- Blog 应该成为个人网站的核心内容入口。
- Project 也应该同时支持首页卡片展示和独立详情页。

不适合直接照搬的点：

- 它是博客优先，不是沉浸式作品集优先。
- 如果直接迁移，当前首页视觉工程需要大量重新接入。
- 它的内容维护更偏仓库文件，不是浏览器后台。

### 4.2 `hominsu/blog` / `homing.so`

链接：

- <https://homing.so/>
- <https://github.com/hominsu/blog>

适合学习和借鉴的点：

- 个人博客气质更强，文章、项目、标签、个人介绍之间的关系比较清晰。
- 更接近“长期学习记录 + 项目展示”的网站，而不是单纯简历页。
- 独立文章页面的阅读体验值得参考。

对当前项目的启发：

- 首页可以保持强视觉，但 Blog 页面应该让阅读更安静。
- Project / Blog / Tags 的 URL 应该稳定清晰，便于分享和收藏。
- 内容页面应该减少视觉噪音，保留 Rymd 背景即可，不要把所有页面都做成高强度动效。

### 4.3 Next.js 官方 MDX 路线

链接：<https://nextjs.org/docs/pages/guides/mdx>

适合学习和借鉴的点：

- Next.js 官方支持 MDX。
- 可以把 Markdown/MDX 文章作为页面或内容源。
- 对博客、项目详情、技能详情这类文本内容更自然。

对当前项目的启发：

- 如果我们决定从 SQLite CMS 转为 MDX，就应该基于官方 MDX 或稳定的内容读取方案设计，而不是只依赖某个模板的内部实现。
- 如果保持 SQLite CMS，也可以保留 Markdown 字段，不一定必须改成 MDX 文件。

## 5. 三种重构路线对比

### 路线 A：完全换到开源博客基座

做法：

- 新建一个基于 `tailwind-nextjs-starter-blog` 或类似模板的项目。
- 把当前视觉组件迁移过去。
- 把 Projects / Skills / Blog 内容改成 MDX 文件。
- 删除当前 SQLite CMS，或者后续重新接入。

优点：

- 博客、SEO、标签、归档、RSS 基础能力成熟。
- 代码结构更接近成熟个人博客项目。
- 内容可以用 Git 版本管理，适合长期写文章。

缺点：

- 当前视觉迁移成本高。
- `/admin` 后台大概率会被削弱或删除。
- GSAP / Lenis / Three.js / canvas 与模板布局可能冲突。
- 会出现一段时间两个项目并存，维护压力上升。

适合情况：

- 你决定网站核心是博客，首页沉浸式视觉只是入口。
- 你愿意以后主要通过写 `.mdx` 文件维护内容。

### 路线 B：当前仓库继续作为基座，吸收成熟博客结构

做法：

- 不换仓库。
- 保留现有视觉组件。
- 重构内容页，让 `/blog`、`/tags`、`/projects`、`/skills` 更像成熟博客/作品集。
- 可选择继续用 SQLite CMS，或逐步切换到 MDX 文件内容。

优点：

- 当前视觉成果损失最小。
- 最快进入可用状态。
- 不需要重复解决 Rymd、timeline、overlay、gallery 的接入问题。
- 可以分阶段改，不会一次性大爆炸。

缺点：

- 当前代码仍需整理和文档化。
- 要主动补 SEO、RSS、搜索、归档这些成熟博客能力。
- 如果保留 SQLite，部署时要处理数据库持久化和备份。

适合情况：

- 你想保留当前首页作为网站最重要的第一印象。
- 你希望继续有 `/admin` 可以编辑内容。
- 你希望少走重复劳动。

### 路线 C：前端保留，内容系统换成纯 MDX

做法：

- 当前仓库保留。
- 删除或暂停 `/admin`。
- 新建 `content/blog`、`content/projects`、`content/skills`。
- Blog / Project / Skill 全部从 MDX frontmatter 读取。
- 首页继续读取这些内容，只展示摘要。

优点：

- 比 SQLite 更适合静态部署和 GitHub 管理。
- 内容和代码一起版本控制，历史清楚。
- 不需要数据库持久化。
- 更接近成熟开源博客的方式。

缺点：

- 不能在网页后台里直接编辑。
- 你需要学会在项目里新建/修改 Markdown 或 MDX 文件。
- 如果以后想做浏览器后台，又要重新引入 CMS。

适合情况：

- 你愿意把写博客当成写 Markdown 文件。
- 部署希望简单，少依赖服务器数据库。

## 6. 我的推荐

我推荐路线 B，第二选择是路线 C，不推荐路线 A 作为第一步。

原因很直接：

当前项目最珍贵的是视觉系统，而不是普通博客列表。开源博客基座能提供的能力，我们可以逐步吸收；但当前 Rymd + 时间轴 + 3D 交互迁移到别人模板里，反而是高风险动作。

更合理的重构策略是：

1. 保留当前仓库。
2. 把当前前端整理成清晰的视觉层。
3. 把内容层改得更像成熟博客项目。
4. 再决定内容维护方式是 SQLite Admin 还是 MDX 文件。

## 7. 建议的新架构

### 7.1 页面结构

建议保留这些公开路由：

```text
/
/blog
/blog/[slug]
/tags
/tags/[tag]
/projects
/projects/[slug]
/skills
/skills/[slug]
/campus
/interests
/about
```

其中：

- `/`：沉浸式时间轴首页，负责第一印象和快速入口。
- `/blog`：成熟博客列表，支持标签、搜索、分页或归档。
- `/blog/[slug]`：安静阅读页面。
- `/projects`：项目列表页。
- `/projects/[slug]`：项目详情页。
- `/skills`：技能索引页。
- `/skills/[slug]`：技能详情页。
- `/campus` 和 `/interests`：如果后续图片多，可以从首页里的片段扩展成独立页面。

### 7.2 内容结构

如果继续 SQLite：

```text
data/site.db
src/lib/cms-db.ts
src/lib/cms-types.ts
src/lib/cms-seed.ts
src/app/api/*
src/app/admin/*
```

如果改成 MDX：

```text
content/blog/*.mdx
content/projects/*.mdx
content/skills/*.mdx
src/lib/content-loader.ts
src/lib/mdx.ts
```

MDX frontmatter 示例：

```md
---
title: "PyTorch 训练循环笔记"
date: "2026-05-18"
summary: "记录 Dataset、DataLoader、训练循环和评估逻辑。"
tags: ["PyTorch", "深度学习", "实验"]
category: "AI 笔记"
status: "published"
---

## 基础结构

正文内容写在这里。
```

### 7.3 首页与详情页关系

首页只做“高密度展示”和“入口”：

- Skills cube：展示 6 个技能摘要，点击进入 overlay 或 `/skills/[slug]`。
- Projects hyper scroll：展示项目卡片，点击进入 overlay 或 `/projects/[slug]`。
- Blog scene：展示最近 3-4 篇文章，点击进入 `/blog/[slug]`。

详情页做“可阅读内容”：

- 不做太强动效。
- 保留 Rymd 背景。
- 使用清晰 typography。
- 支持标题、摘要、标签、正文、代码块、链接、返回。

## 8. 迁移实施计划

### Phase 0：冻结当前版本

目标：确保现在的成果不会丢。

任务：

- 保留当前 `main`。
- 给当前状态打 tag，例如 `v0-immersive-cms`.
- 更新 README，说明当前真实架构。
- 新增 `docs/AI_HANDOFF.md`，把核心设计规则、命令、路由、组件写清楚。

### Phase 1：明确内容维护方式

必须先决定：

- 继续 `/admin` + SQLite？
- 还是改成 MDX 文件？

建议：

- 如果你希望“像后台一样在网页里改内容”，继续 SQLite。
- 如果你希望“像成熟博客一样写文章、提交 Git、部署”，改成 MDX。

### Phase 2：重构 Blog

目标：让 Blog 成为网站重心。

任务：

- 优化 `/blog` 列表页。
- 增加文章搜索。
- 增加 tags/category/year 过滤。
- 增加 RSS。
- 增加 SEO metadata。
- 优化 `/blog/[slug]` 阅读体验。

### Phase 3：重构 Projects / Skills

目标：让首页卡片和独立详情页互通。

任务：

- `/projects` 做成项目索引页。
- `/projects/[slug]` 做成成熟项目详情页。
- Projects 卡片点击时：
  - 可以先打开 overlay；
  - overlay 内提供 “阅读全文” 链接到独立页面。
- `/skills` 做成技能索引页。
- `/skills/[slug]` 做成技能详情页。

### Phase 4：首页视觉稳定化

目标：保留沉浸式，但减少不稳定。

任务：

- 修 Intro 电脑比例。
- 继续融合电脑黑色背景与 Rymd。
- 检查 Skills overlay 层级和移动端。
- 调整 Projects 卡片速度与点击状态。
- 检查全屏、笔记本、小窗口、手机宽度。

### Phase 5：部署准备

如果继续 SQLite：

- 需要 `data/site.db` 持久化。
- 需要备份策略。
- ECS 上用 PM2/Nginx 部署。

如果改 MDX：

- 可以静态/半静态部署。
- 内容随 Git 提交更新。
- 不需要数据库持久化。

## 9. 需要保留的设计原则

这些原则来自你之前的反馈，重构时不能丢：

- 网站核心是滚动时间轴。
- Rymd 星场要保持全屏沉浸式背景。
- 尽量避免独立黑框，视觉应该和背景融合。
- 玻璃 UI 要服务主题，不要变成泛用毛玻璃卡片。
- 首页可以强视觉，文章详情页应该更适合阅读。
- 页面文案不要解释前端效果。
- 页面文案不要写未来规划。
- Projects / Skills / Blog 都应该有独立 URL，方便分享和长期维护。
- Campus / Interests 可以先占位，后续替换真实图片和文案。

## 10. 重构时最容易出错的点

### 10.1 ScrollTrigger 与路由切换

首页大量依赖 GSAP ScrollTrigger 和 Lenis。如果迁移到新基座，必须保证：

- 首页是 client component。
- 路由切换时清理 ScrollTrigger。
- overlay 打开时不要破坏当前滚动位置。
- 移动端不要使用过强 pinned timeline。

### 10.2 Three.js 与 Next.js SSR

`intro-workstation.tsx` 使用 Three.js，必须保持 client-only。

注意：

- 不要在 server component 中直接访问 `window`、`document`、WebGL。
- 新基座如果默认把页面做成 server component，需要明确切开。

### 10.3 内容编码

代码里有大量中文内容。迁移时统一使用 UTF-8。

PowerShell 有时会把 UTF-8 中文显示成乱码，但这不一定代表文件损坏。真正检查要用 UTF-8 读取或浏览器渲染确认。

### 10.4 SQLite 种子数据

当前 `data/site.db` 已经存在。`cms-seed.ts` 只会在表为空时写入默认数据。

如果修改了默认文案但数据库已有旧数据，前台可能仍显示旧内容。解决方式：

- 通过 `/admin` 手动修改。
- 写一个一次性 migration。
- 删除本地 `data/site.db` 重新 seed，但上线环境不能随便这样做。

### 10.5 图片体积

部分 campus 图片超过 3MB。上线前应压缩，否则会影响首屏和滚动体验。

## 11. 下一步我建议做什么

按优先级：

1. 更新 README 和新增 `docs/AI_HANDOFF.md`，让当前项目不会因为对话太长而丢上下文。
2. 你确认内容维护方式：保留 `/admin`，还是改成 MDX 文件。
3. 我基于你的选择开始重构 Blog：
   - 如果保留 SQLite：增强当前 `/blog` 和 `/admin`。
   - 如果改 MDX：新增 `content/blog/*.mdx`，把现有 DB seed 内容迁移成文件。
4. 做 `/projects`、`/skills` 的成熟索引页和详情页。
5. 最后再集中修首页动效和视觉 QA。

## 12. 我的建议决策

如果现在让我直接拍板，我会选：

```text
当前项目继续作为基座
+ Blog/Tags/Projects 学习 timlrx 和 hominsu 的成熟页面结构
+ 内容系统短期保留 SQLite Admin
+ 后续如果你更喜欢文件写作，再迁移到 MDX
```

这样最符合你的真实情况：你已经有一个视觉上很有辨识度的网站，没必要为了“开源基座”把最贵的部分拆掉重做。我们应该把开源项目当作成熟架构参考，而不是把它当作必须搬家的房子。

## 13. 参考链接

- `timlrx/tailwind-nextjs-starter-blog`: <https://github.com/timlrx/tailwind-nextjs-starter-blog>
- `hominsu/blog`: <https://github.com/hominsu/blog>
- `homing.so`: <https://homing.so/>
- Next.js MDX 文档：<https://nextjs.org/docs/pages/guides/mdx>
