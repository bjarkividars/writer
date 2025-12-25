# Repository Guidelines

## Project Structure & Module Organization
- `src/app/` holds Next.js App Router routes, layouts, and API handlers (`src/app/api/**/route.ts`).
- UI components should live in `src/components/` and remain thin wrappers around Base UI primitives.
- Editor logic and TipTap extensions belong in `src/editor/` to keep editor state separate from UI.
- Global styles and design tokens are defined in `src/app/globals.css`.
- Static assets (icons, images, etc.) live in `public/`.
- Project rules and architecture constraints are documented in `rules.md`.

## Build, Test, and Development Commands
- `npm run dev`: start the Next.js dev server.
- `npm run build`: build the production bundle.
- `npm run start`: run the production server after a build.
- `npm run lint`: run ESLint with the Next.js config.

## Coding Style & Naming Conventions
- TypeScript is used throughout; keep types explicit at API/editor boundaries.
- Use Tailwind CSS and CSS variables only; avoid inline styles and new styling libraries.
- Base UI components must remain unstyled wrappers; apply styling at usage sites.
- Prefer small, focused changes and clear naming (e.g., `EditorToolbar`, `useEditorState`).

## Testing Guidelines
- No testing framework is configured yet.
- When tests are added, place them near the feature or under `src/` with clear names (e.g., `Editor.spec.tsx`).
- Document new test commands in `package.json` and update this file accordingly.

## Commit & Pull Request Guidelines
- Git history currently includes only “Initial commit from Create Next App”; no convention is established.
- Use concise, imperative commit messages (e.g., “Add editor toolbar”).
- PRs should include a brief description, linked issue (if any), and screenshots for UI changes.

## Agent-Specific Instructions
- Follow the guidance in `rules.md` before making changes.
- Avoid unrelated refactors, new dependencies, or changes that bypass TypeScript errors.
