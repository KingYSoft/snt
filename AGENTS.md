# Repository Guidelines

## Project Structure & Module Organization

This app is a Vue 3 + Vite + TypeScript admin frontend using Naive UI, UnoCSS, and a pnpm workspace. Main application code lives in `src/`: `views/` for page-level routes, `layouts/` for shells, `components/` for shared UI, `store/` for Pinia modules, `service/` for API access, `router/` for route setup, `locales/` for i18n, and `styles/` for global styling. Shared workspace packages live under `packages/*` such as `packages/axios`, `packages/hooks`, `packages/materials`, and `packages/utils`. Build-time configuration lives in `build/`, while static files live in `public/`.

## Build, Test, and Development Commands

Run commands inside `front-end/soybean-admin` and use `pnpm` only.

- `pnpm install`: install workspace dependencies.
- `pnpm dev`: start the dev server in `test` mode on port `9527`.
- `pnpm dev:prod`: start the dev server in `prod` mode.
- `pnpm build`: create a production build with `--mode prod`.
- `pnpm build:test`: create a test-environment build.
- `pnpm preview`: preview the built app on port `9725`.
- `pnpm typecheck`: run `vue-tsc --noEmit --skipLibCheck`.
- `pnpm lint`: run `oxlint --fix` and `eslint --fix .`.
- `pnpm fmt`: format code with `oxfmt`.
- `pnpm gen-route`: regenerate Elegant Router artifacts after route file changes.

For agent-driven changes, prefer running `pnpm typecheck` for logic changes and `pnpm lint` when touching Vue, TS, or config-heavy files.

## Coding Style & Naming Conventions

- Follow the repo formatter and linter defaults; keep 2-space indentation in Vue, TS, JS, JSON, and YAML files.
- Use PascalCase for Vue components, camelCase for composables and helpers, and keep route view filenames aligned with the existing file-based routing structure.
- Prefer `@/` for `src` imports and `~` for project-root imports.
- This project uses auto-generated routes and component registration plugins. When adding or renaming pages under `src/views/`, run `pnpm gen-route` instead of manually maintaining generated route artifacts.
- Naive UI components, icon components, and some Vue Router components are resolved automatically. Avoid adding manual imports when the project already auto-registers them.

## Architecture Notes

- Routing is powered by `@elegant-router/vue`; route metadata and ordering are customized in `build/plugins/router.ts`.
- API configuration is environment-driven. `src/utils/service.ts` reads `VITE_SERVICE_BASE_URL` and `VITE_OTHER_SERVICE_BASE_URL` and derives proxy paths such as `/proxy-default`.
- Vite aliases are defined in `vite.config.ts`: `@` points to `src`, `~` points to the project root.
- Global SCSS tokens are injected automatically via `@/styles/scss/global.scss`.

## Testing Guidelines

- There is no dedicated frontend unit test setup in the current scripts, so the baseline verification is `pnpm typecheck`, `pnpm lint`, and a focused manual smoke test in the browser.
- If you add test infrastructure later, keep tests close to the affected feature and document the command in this file or the README.
- When route files, env handling, or shared packages change, verify the affected page flow locally with `pnpm dev`.

## Commit & Pull Request Guidelines

- Follow Conventional Commits. Use `pnpm commit` or `pnpm commit:zh` instead of hand-writing commit messages when preparing a commit.
- Keep commits focused and scoped, for example `feat(maintain): add organization detail filter`.
- PRs should include a brief summary, validation steps, screenshots for UI changes, and notes for any env or proxy changes.

## Security & Configuration Tips

- Never commit secrets from `.env`, `.env.test`, `.env.prod`, or local auth/config files.
- Frontend env keys should keep the `VITE_` prefix so Vite can expose them safely.
- Treat `VITE_OTHER_SERVICE_BASE_URL` as JSON5, not plain JSON; malformed values will break multi-service base URL parsing.
- Prefer updating env examples or project docs when introducing new config keys.
