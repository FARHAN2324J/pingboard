
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Circle,
  Eraser,
  Link2,
  MousePointer2,
  Palette,
  Pencil,
  RotateCcw,
  RotateCw,
  Trash2,
  Type,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { getSupabase } from '@/lib/supabase/client';
import {
  BoardObject,
  BoardObjectSchema,
  Point,
  Stroke,
  Tool,
} from '@/lib/types';
import { drawBoard, makeStroke } from '@/lib/board';

const COLORS = [
  '#252820',
  '#ef8377',
  '#8daee8',
  '#8fb34a',
  '#b49be9',
  '#f2c94c',
];

type PresenceUser = {
  id: string;
  name: string;
  color: string;
};

export default function Board({ roomId }: { roomId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);
  const localChannelRef = useRef<BroadcastChannel | null>(null);

  const objectsRef = useRef<BoardObject[]>([]);
  const draftRef = useRef<Stroke | null>(null);
  const drawingRef = useRef(false);
  const historyRef = useRef<BoardObject[][]>([]);
  const redoRef = useRef<BoardObject[][]>([]);
  const pointerCount = useRef(0);

  const [objects, setObjects] = useState<BoardObject[]>([]);
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState(COLORS[0]);
  const [width, setWidth] = useState(4);
  const [online, setOnline] = useState<PresenceUser[]>([]);
  const [connected, setConnected] = useState(false);
  const [copied, setCopied] = useState(false);
  const [roomLabel] = useState('our little corner');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const supabase = getSupabase();

  const syncState = useCallback((next: BoardObject[]) => {
    objectsRef.current = next;
    setObjects(next);
  }, []);


  const editSelectedText = () => {
    if (!selectedId) return;

    const target = objectsRef.current.find(
      object => object.id === selectedId
    );

    if (!target || target.type !== 'text') return;

    const value = window.prompt('Edit your text:', target.text);

    if (value === null) return;

    const nextText = value.trim().slice(0, 500);

    if (!nextText) {
      alert('Text cannot be empty.');
      return;
    }

    if (nextText === target.text) return;

    const updated: BoardObject = {
      ...target,
      text: nextText,
    };

    historyRef.current.push(objectsRef.current);

    if (historyRef.current.length > 40) {
      historyRef.current.shift();
    }

    redoRef.current = [];

    const next = objectsRef.current.map(object =>
      object.id === selectedId ? updated : object
    );

    syncState(next);
    void publish(updated);
  };


  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(1, Math.floor(rect.width * dpr));
    const h = Math.max(1, Math.floor(rect.height * dpr));

    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const list = draftRef.current
      ? [
        ...objectsRef.current.filter(
          object => object.id !== draftRef.current?.id
        ),
        draftRef.current,
      ]
      : objectsRef.current;

    drawBoard(ctx, list, rect.width, rect.height, performance.now());

    // Draw a selection outline for stickers and text.
    const selected = objectsRef.current.find(
      object => object.id === selectedId
    );

    if (
      selected &&
      (selected.type === 'sticker' || selected.type === 'text')
    ) {
      let x = selected.x;
      let y = selected.y;
      let w = 48;
      let h = 48;

      if (selected.type === 'text') {
        const lines = selected.text.split('\n');
        ctx.save();
        ctx.font = '600 20px system-ui, sans-serif';
        w = Math.max(
          30,
          ...lines.map(line => ctx.measureText(line).width)
        );
        h = Math.max(25, lines.length * 25);
        ctx.restore();
      }

      ctx.save();
      ctx.strokeStyle = '#8fb34a';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(x - 5, y - 5, w + 10, h + 10);
      ctx.restore();
    }
  }, [selectedId]);

  useEffect(() => {
    const el = shellRef.current;

    if (el) {
      gsap.fromTo(
        el,
        { opacity: 0, y: 12, scale: 0.99 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.5,
          ease: 'power2.out',
        }
      );
    }
  }, []);

  useEffect(() => {
    paint();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new ResizeObserver(paint);
    observer.observe(canvas);

    return () => observer.disconnect();
  }, [paint, objects]);

  useEffect(() => {
    let alive = true;

    const user: PresenceUser = {
      id: crypto.randomUUID(),
      name: `Doodler ${Math.floor(Math.random() * 90 + 10)}`,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    };

    const storageKey = `pingboard:${roomId}`;

    const accept = (value: unknown) => {
      const parsed = BoardObjectSchema.safeParse(value);
      if (!parsed.success) return;

      const item = parsed.data;
      const next = [
        ...objectsRef.current.filter(object => object.id !== item.id),
        item,
      ];

      syncState(next);
    };

    const acceptDelete = (id: unknown) => {
      if (typeof id !== 'string') return;

      syncState(
        objectsRef.current.filter(object => object.id !== id)
      );

      setSelectedId(current => (current === id ? null : current));
    };

    if (!supabase) {
      try {
        const saved: unknown = JSON.parse(
          localStorage.getItem(storageKey) || '[]'
        );

        if (Array.isArray(saved)) {
          syncState(
            saved.filter(
              (item: unknown) => BoardObjectSchema.safeParse(item).success
            )
          );
        }
      } catch {
        // Ignore invalid local cache.
      }

      if ('BroadcastChannel' in window) {
        const bc = new BroadcastChannel(storageKey);
        localChannelRef.current = bc;

        bc.onmessage = event => {
          if (event.data?.type === 'object') {
            accept(event.data.object);
          }

          if (event.data?.type === 'delete') {
            acceptDelete(event.data.id);
            try {
              const saved: unknown[] = JSON.parse(
                localStorage.getItem(storageKey) || '[]'
              );

              localStorage.setItem(
                storageKey,
                JSON.stringify(
                  saved.filter(item => {
                    const parsed = BoardObjectSchema.safeParse(item);
                    return !parsed.success || parsed.data.id !== event.data.id;
                  })
                )
              );
            } catch {
              // Local cache is best-effort.
            }
          }

          if (event.data?.type === 'presence') {
            setOnline(previous => [
              ...previous.filter(item => item.id !== event.data.user.id),
              event.data.user,
            ]);
          }

          if (event.data?.type === 'clear') {
            syncState([]);
            setSelectedId(null);
            localStorage.removeItem(storageKey);
          }
        };

        bc.postMessage({ type: 'presence', user });
      }

      setOnline([user]);
      setConnected(true);

      return () => {
        alive = false;
        localChannelRef.current?.close();
        localChannelRef.current = null;
      };
    }

    const channel = supabase.channel(`board:${roomId}`, {
      config: {
        broadcast: { self: false },
        presence: { key: user.id },
      },
    });

    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'object' }, ({ payload }: any) => {
        if (payload?.object) accept(payload.object);
      })
      .on('broadcast', { event: 'delete' }, ({ payload }: any) => {
        acceptDelete(payload?.id);
      })
      .on('broadcast', { event: 'clear' }, () => {
        syncState([]);
        setSelectedId(null);
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresenceUser>();
        setOnline(Object.values(state).flat());
      });


    channel.subscribe(async (status: string) => {
      if (status === 'SUBSCRIBED') {
        if (!alive) return;

        setConnected(true);
        await channel.track(user);

        const { data: room, error: roomError } = await supabase
          .from('rooms')
          .select('id')
          .eq('id', roomId)
          .maybeSingle();

        if (!alive) return;

        if (roomError || !room) {
          console.error('Room not found:', roomError);
          setConnected(false);
          return;
        }

        const { data, error } = await supabase
          .from('board_objects')
          .select('id, data')
          .eq('room_id', roomId)
          .order('created_at', { ascending: true })
          .limit(2000);

        if (!alive) return;

        if (error) {
          console.error('Failed to load board objects:', error);
          return;
        }

        if (data) {
          const loaded = data
            .map(row => BoardObjectSchema.safeParse(row.data))
            .filter(result => result.success)
            .map(result => (result as {
              success: true;
              data: BoardObject;
            }).data);

          syncState(loaded);
        }
      } else if (
        status === 'CHANNEL_ERROR' ||
        status === 'TIMED_OUT'
      ) {
        setConnected(false);
      }
    });


    return () => {
      alive = false;
      setConnected(false);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);
  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas || !objects.some(object => object.type === 'sticker')) {
      return;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    let frameId = 0;

    const animate = () => {
      paint();
      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameId);
  }, [objects, paint]);
  const publish = useCallback(async (object: BoardObject) => {
    const parsed = BoardObjectSchema.safeParse(object);
    if (!parsed.success) return;

    if (supabase && channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'object',
        payload: { object: parsed.data },
      });

      const { error } = await supabase
        .from('board_objects')
        .upsert(
          {
            id: parsed.data.id,
            room_id: roomId,
            data: parsed.data,
          },
          { onConflict: 'id' }
        );

      if (error) {
        console.warn('Could not save board object:', error.message);
      }
    } else {
      try {
        localStorage.setItem(
          `pingboard:${roomId}`,
          JSON.stringify(objectsRef.current)
        );
      } catch {
        // Local cache is best-effort.
      }

      localChannelRef.current?.postMessage({
        type: 'object',
        object: parsed.data,
      });
    }
  }, [roomId, supabase]);

  const position = (
    event: React.PointerEvent<HTMLCanvasElement>
  ): Point => {
    const rect = event.currentTarget.getBoundingClientRect();

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const onPointerDown = (
    event: React.PointerEvent<HTMLCanvasElement>
  ) => {
    if (tool === 'select') {
      const { x, y } = position(event);

      const hit = [...objectsRef.current].reverse().find(object => {
        if (object.type === 'sticker') {
          return (
            x >= object.x - 20 &&
            x <= object.x + 36 &&
            y >= object.y - 20 &&
            y <= object.y + 36
          );
        }

        if (object.type === 'text') {
          const ctx = canvasRef.current?.getContext('2d');
          if (!ctx) return false;

          ctx.save();
          ctx.font = '600 20px system-ui, sans-serif';

          const textWidth = Math.max(
            20,
            ...object.text
              .split('\n')
              .map(line => ctx.measureText(line).width)
          );

          ctx.restore();

          return (
            x >= object.x - 5 &&
            x <= object.x + textWidth + 5 &&
            y >= object.y - 5 &&
            y <= object.y + object.text.split('\n').length * 25 + 5
          );
        }

        return false;
      });

      setSelectedId(hit?.id ?? null);
      return;
    }

    if (tool === 'text') {
      const text = window.prompt('What would you like to write?');

      if (!text?.trim()) return;

      const obj: BoardObject = {
        id: crypto.randomUUID(),
        type: 'text',
        ...position(event),
        text: text.trim().slice(0, 500),
        color,
      };

      historyRef.current.push(objectsRef.current);
      redoRef.current = [];

      syncState([...objectsRef.current, obj]);
      void publish(obj);
      setTool('pen');
      setSelectedId(null);
      return;
    }

    drawingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);

    const p = position(event);

    draftRef.current = makeStroke(
      [p],
      color,
      width,
      tool === 'eraser' ? 'eraser' : 'pen'
    );

    paint();
  };

  const onPointerMove = (
    event: React.PointerEvent<HTMLCanvasElement>
  ) => {
    if (!drawingRef.current || !draftRef.current) return;

    const p = position(event);
    draftRef.current.points.push(p);
    pointerCount.current++;

    paint();

    if (
      pointerCount.current % 5 === 0 &&
      supabase &&
      channelRef.current
    ) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'object',
        payload: { object: draftRef.current },
      });
    }
  };

  const finishStroke = () => {
    if (!drawingRef.current || !draftRef.current) return;

    drawingRef.current = false;

    const stroke = draftRef.current;
    draftRef.current = null;
    pointerCount.current = 0;

    historyRef.current.push(objectsRef.current);

    if (historyRef.current.length > 40) {
      historyRef.current.shift();
    }

    redoRef.current = [];

    syncState([...objectsRef.current, stroke]);
    paint();
    void publish(stroke);
  };

  const addSticker = (emoji: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();

    const obj: BoardObject = {
      id: crypto.randomUUID(),
      type: 'sticker',
      x: rect.width * (0.3 + Math.random() * 0.4),
      y: rect.height * (0.3 + Math.random() * 0.4),
      emoji,
    };

    historyRef.current.push(objectsRef.current);
    redoRef.current = [];

    syncState([...objectsRef.current, obj]);
    void publish(obj);

    gsap.fromTo(
      canvas,
      { scale: 0.995 },
      { scale: 1, duration: 0.35, ease: 'elastic.out(1, .4)' }
    );
  };

  const deleteSelected = async () => {
    if (!selectedId || deleting) return;

    const id = selectedId;

    const target = objectsRef.current.find(object => object.id === id);

    if (!target || target.type === 'stroke') {
      setSelectedId(null);
      return;
    }

    setDeleting(true);

    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('board_objects')
          .delete()
          .eq('id', id)
          .eq('room_id', roomId)
          .select('id');

        if (error) throw error;

        // RLS can allow a request to succeed while deleting zero rows.
        if (!data || data.length === 0) {
          throw new Error(
            'No row was deleted. Check the Supabase DELETE policy.'
          );
        }

        channelRef.current?.send({
          type: 'broadcast',
          event: 'delete',
          payload: { id },
        });
      } else {
        localChannelRef.current?.postMessage({
          type: 'delete',
          id,
        });
      }

      const next = objectsRef.current.filter(object => object.id !== id);

      historyRef.current.push(objectsRef.current);

      if (historyRef.current.length > 40) {
        historyRef.current.shift();
      }

      redoRef.current = [];
      syncState(next);
      setSelectedId(null);

      if (!supabase) {
        try {
          localStorage.setItem(
            `pingboard:${roomId}`,
            JSON.stringify(next)
          );
        } catch {
          // Local cache is best-effort.
        }
      }
    } catch (error) {
      console.error('Could not delete board object:', error);
      alert(
        'Could not delete this item. Check your Supabase DELETE policy and try again.'
      );
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Delete' && event.key !== 'Backspace') return;
      if (!selectedId || tool !== 'select') return;

      const target = event.target;

      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
      ) {
        return;
      }

      event.preventDefault();
      void deleteSelected();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, tool, deleting, objects]);

  const clearBoard = async () => {
    if (!window.confirm('Clear the board for everyone in this room?')) return;

    if (supabase) {
      const { error } = await supabase
        .from('board_objects')
        .delete()
        .eq('room_id', roomId);

      if (error) {
        alert('Could not clear the board. Please check Supabase policies.');
        return;
      }

      channelRef.current?.send({
        type: 'broadcast',
        event: 'clear',
        payload: {},
      });
    } else {
      localStorage.removeItem(`pingboard:${roomId}`);

      localChannelRef.current?.postMessage({ type: 'clear' });
    }

    historyRef.current.push(objectsRef.current);
    syncState([]);
    setSelectedId(null);
    redoRef.current = [];
  };

  const undo = () => {
    const prev = historyRef.current.pop();
    if (!prev) return;

    redoRef.current.push(objectsRef.current);
    syncState(prev);

    if (supabase) {
      console.info(
        'Undo updates this view only. Shared operation history is not enabled.'
      );
    } else {
      try {
        localStorage.setItem(
          `pingboard:${roomId}`,
          JSON.stringify(prev)
        );
      } catch {
        // Local cache is best-effort.
      }
    }

    setSelectedId(null);
  };

  const redo = () => {
    const next = redoRef.current.pop();
    if (!next) return;

    historyRef.current.push(objectsRef.current);
    syncState(next);

    if (!supabase) {
      try {
        localStorage.setItem(
          `pingboard:${roomId}`,
          JSON.stringify(next)
        );
      } catch {
        // Local cache is best-effort.
      }
    }

    setSelectedId(null);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt('Copy your board link:', window.location.href);
    }
  };

  return (
    <main className="min-h-screen px-3 py-4 md:px-7 md:py-6">
      <header className="mx-auto mb-5 flex max-w-[1500px] flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            aria-label="Back home"
            className="grid h-10 w-10 place-items-center rounded-xl border border-[#e5e3db] bg-white transition hover:-translate-x-0.5"
          >
            <ArrowLeft size={18} />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold tracking-tight">
                pingboard<span className="text-[#8aa83a]">.</span>
              </span>

              <span className="rounded-full bg-[#e7f6bd] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#526b1e]">
                beta
              </span>
            </div>

            <div className="text-xs text-[#888a80]">
              {roomLabel} · {roomId.slice(0, 20)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold ${connected
              ? 'bg-[#e7f6bd] text-[#526b1e]'
              : 'bg-[#f6e8d4] text-[#8a612b]'
              }`}
          >
            {connected ? <Wifi size={14} /> : <WifiOff size={14} />}
            {supabase
              ? connected
                ? 'Connected'
                : 'Connecting…'
              : 'Local demo'}
          </span>
          <button className="tool-button" onClick={copyLink}>
            <Link2 size={16} />
            {copied ? (
              <>
                <Check size={15} /> Copied
              </>
            ) : (
              'Invite'
            )}
          </button>
        </div>
      </header>

      <section ref={shellRef} className="mx-auto max-w-[1500px]">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              className={`tool-button ${tool === 'pen' ? 'active' : ''}`}
              onClick={() => setTool('pen')}
            >
              <Pencil size={16} /> Pen
            </button>

            <button
              className={`tool-button ${tool === 'eraser' ? 'active' : ''}`}
              onClick={() => setTool('eraser')}
            >
              <Eraser size={16} /> Eraser
            </button>

            <button
              className={`tool-button ${tool === 'text' ? 'active' : ''}`}
              onClick={() => setTool('text')}
            >
              <Type size={17} /> Text
            </button>

            <button
              className={`tool-button ${tool === 'select' ? 'active' : ''}`}
              onClick={() => setTool('select')}
            >
              <MousePointer2 size={16} /> Select
            </button>

            <span className="mx-1 hidden h-7 w-px bg-[#e4e1d9] sm:block" />

            <span className="flex items-center gap-2 rounded-xl border border-[#e7e5de] bg-white px-3 py-2">
              <Palette size={15} className="text-[#77796f]" />

              {COLORS.map(value => (
                <button
                  key={value}
                  aria-label={`Use color ${value}`}
                  onClick={() => setColor(value)}
                  className={`h-5 w-5 rounded-full ring-offset-2 ${color === value ? 'ring-2 ring-[#8c9d60]' : ''
                    }`}
                  style={{ background: value }}
                />
              ))}
            </span>

            <label className="flex h-[42px] items-center gap-2 rounded-xl border border-[#e7e5de] bg-white px-3 text-xs text-[#77796f]">
              <Circle size={13} />

              <input
                aria-label="Brush size"
                type="range"
                min="2"
                max="16"
                value={width}
                onChange={event => setWidth(Number(event.target.value))}
                className="w-16 accent-[#8fb34a]"
              />
            </label>
          </div>

          <div className="flex items-center gap-2">
            {objects.some(
              object => object.id === selectedId && object.type === 'text'
            ) && (
                <button
                  className="tool-button"
                  onClick={editSelectedText}
                  title="Edit selected text"
                >
                  <Pencil size={16} />
                  Edit text
                </button>
              )}

            <button
              className="tool-button"
              onClick={() => void deleteSelected()}
              disabled={!selectedId || deleting}
              title="Delete selected item"
            >
              <Trash2 size={16} />
              {deleting ? 'Deleting…' : 'Delete selected'}
            </button>

            <button
              className="tool-button"
              onClick={() => void clearBoard()}
            >
              <span className="text-sm">Clear board</span>
            </button>
          </div>
        </div>

        <div
          className="board-shell relative overflow-hidden rounded-[22px]"
          style={{ height: 'min(68vh, 760px)', minHeight: '390px' }}
        >
          <canvas
            ref={canvasRef}
            aria-label="Shared drawing canvas"
            className={`h-full w-full touch-none ${tool === 'text'
              ? 'cursor-text'
              : tool === 'select'
                ? 'cursor-pointer'
                : 'cursor-crosshair'
              }`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={finishStroke}
            onPointerCancel={finishStroke}
            onLostPointerCapture={finishStroke}
          />

          <div className="pointer-events-none absolute left-4 top-4 rounded-full border border-[#efede6] bg-white/90 px-3 py-1.5 text-xs text-[#8a8c82] backdrop-blur">
            {tool === 'pen'
              ? '✏️ Draw something'
              : tool === 'eraser'
                ? '⌫ Erase something'
                : tool === 'text'
                  ? 'T Click to place text'
                  : 'Click a sticker or text to select it'}
          </div>

          <div className="pointer-events-none absolute bottom-4 right-4 rounded-full border border-[#efede6] bg-white/90 px-3 py-1.5 text-xs text-[#8a8c82] backdrop-blur">
            {objects.length} {objects.length === 1 ? 'object' : 'objects'}
          </div>
        </div>

        <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">


          <div className="flex flex-wrap gap-2">
            {['💗', '✨', '🌼', '🔥', '😂', '🫶', '🐸'].map(emoji => (
              <button
                key={emoji}
                onClick={() => addSticker(emoji)}
                aria-label={`Add ${emoji} sticker`}
                className="grid h-11 w-11 place-items-center rounded-2xl border border-[#e7e5de] bg-white text-xl transition hover:-translate-y-1 hover:rotate-3 hover:border-[#c6d99a] hover:shadow-sm"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </section>

      <footer className="mx-auto mt-7 flex max-w-[1500px] items-center justify-between border-t border-[#e8e6df] pt-4 text-xs text-[#92948a]">
        <span>Make a mess. Make it together.</span>

        <span className="flex items-center gap-1">
          <MousePointer2 size={13} />
          Built for playful collaboration
        </span>
      </footer>
    </main>
  );
}
