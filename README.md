# Pingboard 🎨

**A playful, real-time collaborative whiteboard.**

Pingboard is a collaborative whiteboard where people can draw, write notes, and add emoji stickers together — no account required. Create a room, share the link, and start creating.

## ✨ Features

- 🤝 **Real-time collaboration** — share a room and see updates from other participants.
- ✏️ **Freehand drawing** — draw with customizable brush sizes and colors.
- 📝 **Text notes** — add and edit text directly on the board.
- 🌈 **Emoji stickers** — make your board more expressive and fun.
- 🖱️ **Selection and deletion** — select and remove supported objects.
- 👥 **Live presence** — see who is connected to a room.
- 🔗 **Shareable room links** — invite collaborators with a URL.
- 💾 **Recent boards** — keep track of recently visited boards in your browser.
- 📴 **Local demo mode** — try the board without Supabase using browser storage and BroadcastChannel.

## 🛠️ Tech Stack

- [Next.js ](https://nextjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Supabase](https://supabase.com/)
- [Lucide React](https://lucide.dev/)
- [Vitest](https://vitest.dev/)

## 🚀 Getting Started

### Prerequisites

- Node.js compatible with the project's Next.js version
- npm
- A Supabase project for online collaboration

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/FARHAN2324J/pingboard.git
   cd pingboard
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env.local` file in the project root and add the Supabase variables expected by your client configuration:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_publishable_or_anon_key
   ```


4. Configure your Supabase database, tables, Row Level Security (RLS) policies, and required RPC functions.

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000).

## 🏗️ Production Build

Check the production build locally:

```bash
npm run build
```

Run the production server:

```bash
npm run start
```

##

## 🤝 Contributing

Contributions, suggestions, and bug reports are welcome.
