# Repository Guidelines

## Project Structure & Module Organization
This repository is a Next.js 16 app using the `src/app` router. Visual entry pages live in `src/app/page.tsx` and `src/components/portfolio-experience.tsx`. Blog and tag routes are under `src/app/blog` and `src/app/tags`. Shared content logic lives in `src/lib`, including `site.ts` for global identity, `writing.ts` for MDX posts, and `portfolio-seed.ts` for visual project/skill data. Static assets belong in `public/`, especially `public/images/...`. Blog articles live in `content/writing/*.mdx`.

## Build, Test, and Development Commands
- `npm run dev` - start the local dev server for live preview.
- `npm run lint` - run ESLint across the codebase.
- `npm run build` - produce a production build and catch route/type errors.
- `npm run start` - serve the last production build locally.

## Coding Style & Naming Conventions
Use TypeScript and React function components. Match the existing code style: 2-space indentation, semicolons, double quotes, and explicit prop/type definitions. Keep component and file names PascalCase for React components, lowercase route folders for App Router paths, and kebab-case for MDX slugs and public image files. Prefer small, local changes over broad refactors.

## Testing Guidelines
There is no dedicated test runner in this repository. Treat `npm run lint` and `npm run build` as the required checks before merging changes. For visual work, also verify the affected routes in `npm run dev` and confirm the homepage, blog pages, tags, and any touched overlays render correctly.

## Commit & Pull Request Guidelines
Commit messages in this repo are short, imperative, and descriptive, such as `Refine blog identity and portfolio polish` or `Remove legacy admin and SQLite CMS`. Keep commits focused on one logical change. Pull requests should summarize the user-facing effect, list verification commands, and include screenshots for visual changes or route updates.

## Security & Configuration Tips
Do not commit secrets or deployment credentials. Set `NEXT_PUBLIC_SITE_URL` in the deployment environment instead of hardcoding a production domain. Keep server-facing assets in `public/` and use public URLs like `/images/blog/example.webp` inside MDX and components.
