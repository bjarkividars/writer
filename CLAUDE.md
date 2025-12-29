# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
npm run dev        # Start Next.js dev server on localhost:3000
npm run build      # Production build
npm start          # Start production server
npm run lint       # Run ESLint
```

### Database
```bash
npx prisma generate           # Generate Prisma client after schema changes
npx prisma db push            # Push schema changes to database
npx prisma studio             # Open Prisma Studio GUI
```

## Architecture Overview

This is an AI-powered collaborative writing application built with Next.js 16, using TipTap editor and streaming AI edits.

### Core Concepts

**Block-Based Editing System**: The document is analyzed as blocks (paragraphs, headings, lists) that are further broken into items (sentences for paragraphs/headings, list items for lists). Each item gets a stable ID like `block-2.3` (block 2, item 3) for precise AI targeting.

**Dual Authentication Model**: Sessions support both authenticated users (via Neon Auth with `ownerId`) and anonymous users (via `anonKey` cookie). Access control in `src/lib/session-auth.ts` matches either the owner ID or anonymous key.

**Streaming AI Edits**: The `/api/ai/edit` route streams responses in two parts:
1. First chunk: Block map with item IDs (`{"blockMap": [...]}\n`)
2. Remaining chunks: Streamed AI-generated structured edits

The AI returns structured operations (replace, insert-item, insert-block, delete-item, delete-block, transform-block) that target specific block items by ID.

**Chat Mode vs Inline Mode**: The editor supports two interaction modes:
- `inline`: AI directly applies edits silently
- `chat`: AI provides conversational responses with edit summaries and can offer multiple options for user selection

### Directory Structure

- `src/app/` - Next.js App Router pages and API routes
  - `api/ai/edit/route.ts` - Main AI streaming endpoint
  - `api/session/` - Session and message CRUD operations
  - `[sessionId]/page.tsx` - Main workspace page
- `src/components/` - React components
  - `editor/` - EditorContext, TipTap integration, bubble toolbar
  - `chat/` - ChatContext, chat UI, message history
- `src/lib/` - Core utilities
  - `ai/` - Block map building, schemas (Zod), markdown parsing
  - `session-auth.ts` - Authentication helpers (owner/anon access)
  - `prisma.ts` - Prisma client singleton
- `prisma/schema.prisma` - Database schema with two schemas:
  - `neon_auth` - Neon Auth tables (user, session, account, etc.)
  - `public` - App tables (WorkspaceSession, Document, ChatMessage)

### Key Data Flows

**Document Editing**:
1. User types instruction in chat or selects text with bubble menu
2. Client builds block map from TipTap editor state (`buildBlockMap` in `src/lib/ai/blockMap.ts`)
3. POST to `/api/ai/edit` with instruction, block map, selection, and session ID
4. Server fetches chat history from database if session ID provided
5. Server streams: block map chunk, then AI-generated structured edits
6. Client applies edits by resolving block item IDs to absolute positions in editor

**Session Management**:
1. WorkspaceSession created with either `ownerId` (authenticated) or `anonKey` (anonymous)
2. Document content stored as JSON in separate Document table (1-to-1 relation)
3. Chat messages stored with optional `options` (multiple AI suggestions) and `selectedOptionId` tracking which option user chose

### Database Schema Notes

- `WorkspaceSession.anonKey` is indexed for fast anonymous session lookup
- `ChatMessage` has self-referencing `selectedOptionId` FK to `ChatMessageOption`
- `ChatMessageOption` allows AI to present multiple rewrite options; user selects one to continue
- Document updates use TipTap's JSON format (ProseMirror schema)

### Important Patterns

**Block Map Generation**: Two implementations exist:
- Client-side: `buildBlockMap(editor)` in `src/lib/ai/blockMap.ts` - parses TipTap/ProseMirror document
- Server-side: `buildBlockMapFromText(text)` in `src/app/api/ai/edit/route.ts` - fallback using natural library's sentence tokenizer

**Structured AI Output**: Uses `ai` SDK's `Output.object()` with Zod schemas. The `AiEditOutput` schema enforces structured responses with edits, message, options, and complete flag.

**Session Access Control**: Always use `requireSessionAccess(sessionId)` before database operations. It verifies user can access session via either authentication method.

**Path Aliases**: `@/` maps to `src/` (configured in tsconfig.json)
