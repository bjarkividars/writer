# Project Rules

## 1. Product Overview
This project is an AI-powered writing suite combining a rich-text editor
(TipTap) with an adjacent assistant for AI output, suggestions, and structured
content. The product prioritizes speed, clarity, and minimal UI.

Primary goals:
- Near-instant page loads
- Streaming AI responses into the editor/canvas
- Clean, minimal, accessible UI
- Strong separation between editor state, AI state, and UI primitives

Non-goals:
- Heavy visual theming
- Over-engineered abstractions
- Premature optimization beyond first-load performance

---

## 2. Tech Stack (Authoritative)
- Next.js (App Router) on Vercel
- TypeScript (strict)
- Tailwind CSS for styling
- Base UI (`@base-ui/react`) for unstyled, accessible UI primitives
- TipTap (ProseMirror) for the editor
- AI streaming via Server-Sent Events (SSE)

---

## 3. Architecture Rules

### Frontend
- All UI components live in `src/components/`
- Styling is done via Tailwind + CSS variables (design tokens)
- No component libraries other than Base UI
- Base UI components must remain **unstyled wrappers**; styling happens at usage sites

### Editor
- TipTap is the single source of truth for document state
- Editor extensions and commands live in `src/editor/`
- Do not mix editor logic with UI logic
- AI output must never mutate editor state directly without an explicit command

### API / Server
- API routes live in `src/app/api/**/route.ts`
- AI responses must be streamed using SSE
- No database or server logic in client components
- Streaming endpoints must emit typed events (not raw text)

---

## 4. Styling Rules
- Tailwind is the only styling mechanism
- Design tokens live in `globals.css` via CSS variables
- No inline styles
- No global component styles beyond base tokens
- Dark mode must be supported via CSS variables (`.dark`)

---

## 5. AI + Streaming Rules
- AI responses must stream incrementally
- Client must handle partial chunks safely
- Transport should emit structured events (e.g. `delta`, `done`, `error`)
- UI typing effects are presentation-only and must not affect transport speed

---

## 6. Coding Standards
- Small, focused diffs
- Prefer clarity over cleverness
- No new dependencies without justification
- TypeScript types must be explicit at boundaries (API, editor, streaming)

---

## 7. Agent Workflow
- Read this file before making changes
- Before coding: restate the goal and list files to be touched
- After coding: summarize changes and list commands to run
- Avoid refactors unless explicitly requested

---

## 8. Never Do
- Commit secrets or API keys
- Bypass TypeScript errors
- Introduce styled component libraries
- Refactor unrelated code
