'use client';
import { useState } from 'react';
import { ArrowUpRight, Heart, Link2, Sparkles, Trash2, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { gsap } from 'gsap';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase/client';

type RecentBoard = {
  id: string;
  name: string;
  url: string;
};

const OWNER_KEYS_STORAGE = 'pingboard:owner-keys';

function saveOwnerKey(roomId: string, token: string) {
  const saved = localStorage.getItem(OWNER_KEYS_STORAGE);
  const parsed: unknown = saved ? JSON.parse(saved) : {};
  const keys =
    parsed !== null &&
      typeof parsed === 'object' &&
      !Array.isArray(parsed)
      ? (parsed as Record<string, string>)
      : {};

  keys[roomId] = token;
  localStorage.setItem(OWNER_KEYS_STORAGE, JSON.stringify(keys));
}


export default function HomePage() {
  const [roomName, setRoomName] = useState('little-ideas');
  const [recentBoards, setRecentBoards] = useState<RecentBoard[]>([]);
  const [ownedBoardIds, setOwnedBoardIds] = useState<string[]>([]);
  const router = useRouter(); const hero = useRef<HTMLDivElement>(null);

  async function deleteBoard(board: RecentBoard) {
    const confirmed = window.confirm(
      `Delete "${board.name}" permanently? This cannot be undone.`
    );

    if (!confirmed) return;

    try {
      const savedKeys = localStorage.getItem('pingboard:owner-keys');
      const parsed: unknown = savedKeys ? JSON.parse(savedKeys) : {};

      if (
        parsed === null ||
        typeof parsed !== 'object' ||
        Array.isArray(parsed)
      ) {
        throw new Error('Invalid owner keys.');
      }

      const ownerToken = (
        parsed as Record<string, unknown>
      )[board.id];

      if (typeof ownerToken !== 'string' || ownerToken.length < 32) {
        alert('Owner key not found in this browser.');
        return;
      }

      const supabase = getSupabase();

      if (!supabase) {
        throw new Error('Supabase client is not configured.');
      }

      const { data, error } = await supabase.rpc(
        'delete_room_with_owner_token',
        {
          p_room_id: board.id,
          p_owner_token: ownerToken,
        }
      );

      if (error) throw error;

      if (data !== true) {
        alert('Could not delete this board. Owner verification failed.');
        return;
      }

      const keys = { ...(parsed as Record<string, string>) };
      delete keys[board.id];

      localStorage.setItem('pingboard:owner-keys', JSON.stringify(keys));

      const next = recentBoards.filter(item => item.id !== board.id);

      localStorage.setItem('pingboard:recent-boards', JSON.stringify(next));
      setRecentBoards(next);
      setOwnedBoardIds(ids => ids.filter(id => id !== board.id));
    } catch (error) {
      console.error('Failed to delete board:', error);
      alert('Could not delete the board. Please try again.');
    }
  }
  useEffect(() => {
    try {
      // Load boards owned by this browser
      const ownerData = localStorage.getItem('pingboard:owner-keys');
      const ownerParsed: unknown = ownerData ? JSON.parse(ownerData) : {};

      if (
        ownerParsed !== null &&
        typeof ownerParsed === 'object' &&
        !Array.isArray(ownerParsed)
      ) {
        setOwnedBoardIds(
          Object.entries(ownerParsed)
            .filter(
              ([, token]) =>
                typeof token === 'string' && token.length >= 32
            )
            .map(([id]) => id)
        );
      }

      // Load recently visited boards
      const saved = localStorage.getItem('pingboard:recent-boards');
      if (!saved) return;

      const parsed: unknown = JSON.parse(saved);

      if (Array.isArray(parsed)) {
        setRecentBoards(
          parsed.filter(
            (item): item is RecentBoard =>
              item !== null &&
              typeof item === 'object' &&
              typeof item.id === 'string' &&
              typeof item.name === 'string' &&
              typeof item.url === 'string'
          )
        );
      }
    } catch {
      // Ignore invalid local data.
    }
  }, []);
  useEffect(() => { if (hero.current) gsap.fromTo(hero.current.children, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: .65, stagger: .1, ease: 'power3.out' }); }, []);

  async function createRoom() {
    const name = roomName.trim().slice(0, 48) || 'little-ideas';

    const slug =
      name
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 36) || crypto.randomUUID().slice(0, 8);

    const id = `${slug}-${crypto.randomUUID().slice(0, 5)}`;
    const ownerToken = crypto.randomUUID() + crypto.randomUUID();

    try {

      const supabase = getSupabase();

      if (!supabase) {
        throw new Error('Supabase client is not configured.');
      }

      const { data, error } = await supabase.rpc(
        'create_room_with_owner_token',
        {
          p_room_id: id,
          p_title: name,
          p_owner_token: ownerToken,
        }
      );


      if (error) throw error;

      if (data !== true) {
        throw new Error('Could not create the board.');
      }

      saveOwnerKey(id, ownerToken);

      const board: RecentBoard = {
        id,
        name,
        url: `/board/${id}`,
      };

      const saved = localStorage.getItem('pingboard:recent-boards');
      const parsed: unknown = saved ? JSON.parse(saved) : [];

      const previous: RecentBoard[] = Array.isArray(parsed)
        ? parsed.filter(
          (item): item is RecentBoard =>
            item !== null &&
            typeof item === 'object' &&
            typeof item.id === 'string' &&
            typeof item.name === 'string' &&
            typeof item.url === 'string'
        )
        : [];

      const next = [board, ...previous.filter(item => item.id !== id)]
        .slice(0, 30);

      localStorage.setItem('pingboard:recent-boards', JSON.stringify(next));
      setRecentBoards(next);

      router.push(board.url);
    } catch (error) {
      console.error('Failed to create board:', error);
      alert('Could not create your board. Please try again.');
    }
  }



  return <main className="min-h-screen overflow-hidden px-5 py-6 md:px-10 md:py-8">
    <nav className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6 lg:px-8">
      <a
        href="/"
        className="flex shrink-0 items-center gap-2 self-start font-extrabold tracking-tight"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#dff77a]">
          <Sparkles size={19} />
        </span>

        <span className="text-xl">
          pingboard<span className="text-[#8aa83a]">.</span>
        </span>
      </a>

      <div className="inline-flex max-w-full items-center gap-2 self-start rounded-full bg-white px-3 py-2 text-xs text-[#63665b] shadow-sm sm:self-auto sm:text-sm">
        <span className="h-2 w-2 shrink-0 rounded-full bg-[#a7d346]" />
        <span>No sign-up. Just share a link.</span>
      </div>
    </nav>
    <section ref={hero} className="mx-auto grid max-w-7xl items-center gap-12 pb-16 pt-14 md:grid-cols-[1.02fr_.98fr] md:pb-24 md:pt-24">
      <div>
        <h1 className="max-w-2xl font-[Manrope] text-5xl font-extrabold leading-[1.06] tracking-[-.055em] md:text-7xl">Good ideas are <span className="relative inline-block">better <span className="absolute -bottom-1 left-0 -z-10 h-3 w-full -rotate-2 rounded-full bg-[#dff77a]" /></span> together.</h1>
        <p className="mt-6 max-w-lg text-lg leading-8 text-[#74766d]">A little shared canvas for doodles, thoughts and the occasional dramatic heart. Invite someone in and make a mess together.</p>
        <form onSubmit={event => { event.preventDefault(); createRoom(); }} className="mt-8 flex max-w-lg flex-col gap-3 sm:flex-row"><label className="sr-only" htmlFor="room-name">Name your board</label><input id="room-name" name="roomName" autoComplete="off" maxLength={48} value={roomName} onChange={e => setRoomName(e.target.value)} placeholder="Name your little space" className="min-h-14 min-w-0 flex-1 rounded-2xl border border-[#e5e3db] bg-white px-5 outline-none transition focus:border-[#a5c94a]" /><button type="submit" className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#252820] px-6 font-semibold text-white transition hover:bg-[#414537]">Create a board <ArrowUpRight size={18} /></button></form>
        {recentBoards.length > 0 && (
          <section
            aria-labelledby="recent-boards-title"
            className="mt-8 max-w-lg"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2
                id="recent-boards-title"
                className="font-bold text-[#252820]"
              >
                My Boards
              </h2>

              <span className="text-xs text-[#898b81]">
                {recentBoards.length} saved
              </span>
            </div>

            <ul className="space-y-2">
              {recentBoards.map(board => (

                <li
                  key={board.id}
                  className="flex items-center gap-2"
                >
                  <Link
                    href={board.url}
                    className="flex min-h-14 min-w-0 flex-1 items-center
      justify-between rounded-2xl border border-[#e5e3db]
      bg-white px-4 py-3 transition hover:border-[#a5c94a]"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-[#252820]">
                        {board.name}
                      </span>
                      <span className="block text-xs text-[#898b81]">
                        Open shared board
                      </span>
                    </span>

                    <ArrowUpRight
                      size={18}
                      aria-hidden="true"
                      className="shrink-0"
                    />
                  </Link>

                  {ownedBoardIds.includes(board.id) && (
                    <button
                      type="button"
                      aria-label={`Delete ${board.name}`}
                      title="Delete board"
                      onClick={() => void deleteBoard(board)}
                      className="grid h-11 w-11 shrink-0 place-items-center
        rounded-xl border border-[#f0d8d5] bg-white
        text-[#c45e54] transition hover:bg-[#fff0ee]"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </li>

              ))}
            </ul>
          </section>
        )}
        <div className="mt-5 flex flex-wrap gap-5 text-sm text-[#898b81]"><span className="flex items-center gap-2"><Users size={16} /> Made for two (or more)</span><span className="flex items-center gap-2"><Link2 size={16} /> Share by link</span><span className="flex items-center gap-2"><Heart size={16} /> Extra heart energy</span></div>
      </div>
      <div className="relative mx-auto w-full max-w-[560px] rotate-[1deg]">
        <div className="board-shell overflow-hidden rounded-[28px]"><div className="flex items-center justify-between border-b border-[#eeeae3] px-5 py-4"><div className="flex gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[#ff9b8f]" /><i className="h-2.5 w-2.5 rounded-full bg-[#f5d76e]" /><i className="h-2.5 w-2.5 rounded-full bg-[#b8db6a]" /></div><span className="text-xs font-semibold text-[#a2a297]">our little corner</span><div className="flex -space-x-2"><span className="grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-[#f7d4c5] text-xs">🌞</span><span className="grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-[#dce8ff] text-xs">🐸</span></div></div>
          <div className="relative aspect-[1.08] overflow-hidden bg-[#fffdf9]" style={{ backgroundImage: 'radial-gradient(#e8e5dc 1px, transparent 1px)', backgroundSize: '22px 22px' }}><div className="absolute left-[12%] top-[13%] -rotate-6 rounded-2xl bg-[#e5f6a8] px-5 py-4 shadow-sm"><span className="text-xs font-bold uppercase tracking-wider text-[#78932d]">remember</span><p className="mt-1 font-[Manrope] text-xl font-extrabold">Have fun ✨</p></div><svg className="absolute inset-0 h-full w-full" viewBox="0 0 500 460" fill="none"><path d="M95 210 C135 165 172 255 211 208 S273 177 300 219 S361 255 389 205" stroke="#ef8377" strokeWidth="7" strokeLinecap="round" /><path d="M85 320 Q150 260 215 322 T365 313" stroke="#8daee8" strokeWidth="6" strokeLinecap="round" /><path d="M305 100 l8 19 20 2 -15 13 5 20 -18 -11 -18 11 5 -20 -15 -13 20 -2z" fill="#f7d96c" /><path d="M385 115 C360 90 330 121 385 165 C440 121 410 90 385 115Z" fill="#ffb7b1" /><circle cx="115" cy="335" r="10" fill="#b5d77c" /><circle cx="143" cy="348" r="5" fill="#b5d77c" /><path d="M272 350 Q291 325 310 350 Q291 370 272 350Z" fill="#c3b2f1" /><path d="M291 331 L291 369" stroke="#fffdf9" strokeWidth="3" /></svg><div className="absolute bottom-[12%] right-[10%] rotate-6 rounded-2xl bg-[#f1e9ff] px-4 py-3 shadow-sm"><p className="text-sm font-bold">u got this!!</p><p className="mt-1 text-xs text-[#8980a0]">— your hype person</p></div><div className="absolute bottom-[8%] left-[9%] rounded-full border border-[#eeeae3] bg-white px-3 py-2 text-xs text-[#85877e] shadow-sm">✏️ someone is doodling...</div></div></div>
      </div>
    </section>
    <footer className="mx-auto flex max-w-7xl flex-col justify-between gap-2 border-t border-[#e8e6df] pt-5 text-xs text-[#92948a] sm:flex-row"><span>Small canvas. Big feelings.</span><span>Built for the joy of making things together.</span></footer>
  </main>;
}
