# Pingboard 🎨

**A playful, real-time collaborative whiteboard — no sign-up, just a link.**

Pingboard is a shared canvas for doodles, notes, and emoji stickers. Create a board, send the link, and everyone who opens it draws on the same surface in real time.

---

## Overview

Pingboard is a Next.js application built around a single idea: collaborating on a whiteboard should be as easy as sharing a URL. There are no accounts, no invites to accept, and no setup for your guests — open the link and start drawing.

Every board is a list of simple, validated objects (strokes, text notes, and stickers) rendered to an HTML canvas. Changes sync between participants through Supabase Realtime, while presence tracks who is currently in the room. When Supabase isn't configured, the app automatically falls back to a **local demo mode** powered by `localStorage` and `BroadcastChannel`, so the full experience works on a single machine with zero backend.

## Features

**Drawing & content**
- ✏️ Freehand drawing with adjustable brush size and a curated color palette
- 🧽 Eraser tool for removing strokes
- 📝 Text notes you can place, edit, and style
- 🌈 Emoji stickers that float and rotate gently on the canvas
- 🖱️ Selection tool — pick an object, edit its text, or delete it
- ↩️ Undo and redo — toolbar buttons plus `Ctrl/Cmd+Z` and `Ctrl/Cmd+Shift+Z`
- 🧹 One-click clear board

**Collaboration**
- ⚡ Real-time sync — every stroke appears for everyone instantly
- 👥 Live presence — every doodler gets an anonymous name and emoji sticker (no signup), shown as avatars plus an online count
- 🎭 Sticker picker on first visit, editable later by clicking your own avatar
- 🔗 One-click invite link with copy-to-clipboard
- 📴 Local demo mode — run without Supabase using browser storage and BroadcastChannel (presence via heartbeats)

**Boards & ownership**
- 🔖 Shareable room URLs with readable slugs (`/board/my-idea-a1b2c`)
- 🕘 Recent boards list, saved in your browser
- 🗑️ Owner-token deletion — only the browser that created a board can delete it

**Experience**
- 🖌️ Paper-style canvas with a subtle grid
- 📱 Pointer-event based input, works with touch and stylus
- 🎞️ Lightweight GSAP entrance animations
- 🌗 Clean, warm, hand-crafted visual design

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | [Next.js 15](https://nextjs.org/) (App Router) · [React 19](https://react.dev/) |
| Language | [TypeScript](https://www.typescriptlang.org/) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) |
| Validation | [Zod](https://zod.dev/) |
| Backend & Realtime | [Supabase](https://supabase.com/) (Postgres, RLS, Broadcast, Presence) |
| Animation | [GSAP](https://gsap.com/) |
| Icons | [Lucide React](https://lucide.dev/) |
| Testing | [Vitest](https://vitest.dev/) |

## How It Works

```text
┌──────────────┐        Broadcast / Postgres        ┌──────────────┐
│  Browser A   │ ◄────────────────────────────────► │  Browser B   │
│  canvas + UI │        Supabase Realtime           │  canvas + UI │
└──────┬───────┘                                    └──────┬───────┘
       │                                                   │
       └─────────────────►  Supabase  ◄────────────────────┘
                        rooms · board_objects
```

1. A board is created with a slug-based room ID and a secret **owner token** stored in `localStorage`.
2. Every object on the canvas is a Zod-validated `BoardObject` — a discriminated union of `stroke`, `text`, or `sticker`.
3. Objects are persisted as JSONB rows in `board_objects`, keyed by room.
4. Edits, deletions, and presence events are broadcast to everyone connected to the room.
5. Without Supabase credentials, the same flows run locally via `BroadcastChannel`.

## Project Structure

```text
src/
├── app/
│   ├── page.tsx              # Landing page — create a board, recent boards
│   └── board/[roomId]/page.tsx  # Room route
├── components/
│   └── Board.tsx             # Canvas rendering, tools, sync, presence
├── lib/
│   ├── board.ts              # Canvas drawing routines
│   ├── types.ts              # Zod schemas & shared types
│   └── supabase/client.ts    # Lazily-initialized Supabase client
supabase/
└── migrations/001_initial.sql  # Database schema & RLS policies
tests/
└── board.test.ts             # Schema validation tests
```

## Getting Started

### Prerequisites

- Node.js (compatible with the project's Next.js version)
- npm
- A [Supabase](https://supabase.com) project — *optional*; skip it to use local demo mode

### Installation

**1. Install dependencies**

```bash
npm install
```

**2. Configure environment variables**

Create a `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_publishable_or_anon_key
```

> Leave these out to run in **local demo mode** — boards sync across tabs on the same machine.

**3. Set up the database**

Apply the migration in `supabase/migrations/001_initial.sql` (Supabase Dashboard → SQL Editor, or `supabase db push`). It creates the `rooms` and `board_objects` tables with Row Level Security.

> **Note:** the app also calls two Postgres RPC functions, `create_room_with_owner_token` and `delete_room_with_owner_token`. They are not part of the migration file, so make sure they exist in your project before creating or deleting boards online.

**4. Start the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), name a board, and share the link.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` / `npm run typecheck` | Type-check the project |
| `npm test` | Run the test suite once |
| `npm run test:watch` | Run tests in watch mode |

## Data Model

```ts
BoardObject = Stroke | Text | Sticker

Stroke { id, type: 'stroke', points: Point[], color, width, tool: 'pen' | 'eraser' }
Text   { id, type: 'text',   x, y, text, color }
Sticker{ id, type: 'sticker', x, y, emoji }
```

Schemas are defined once in `src/lib/types.ts` and drive both runtime validation and the TypeScript types used throughout the app.

## Security Note

The starter RLS policies in `001_initial.sql` are **intentionally permissive** to make link-based prototyping frictionless: anyone with a link can read and write a room. Before storing private content, replace them with room-token or membership checks; the owner-token approach used for board deletion is a good starting point.

## Contributing

Contributions, suggestions, and bug reports are welcome. Open an issue or submit a pull request.

---

*Small canvas. Big feelings.* 🌱
