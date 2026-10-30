'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { AVATARS, type BoardIdentity } from '@/lib/identity';

type Props = {
  initial: BoardIdentity;
  onSave: (identity: BoardIdentity) => void;
  onCancel?: () => void;
};

export default function ProfilePicker({ initial, onSave, onCancel }: Props) {
  const [name, setName] = useState(initial.name);
  const [emoji, setEmoji] = useState(initial.emoji);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#252820]/25 px-4 py-6 backdrop-blur-sm">
      <div className="sticker-enter w-full max-w-sm rounded-3xl border border-[#e8e5dd] bg-white p-6 shadow-[0_24px_70px_rgba(43,43,33,0.18)]">
        <div className="text-center">
          <div className="sticker-float mx-auto mb-3 grid h-16 w-16 place-items-center rounded-2xl bg-[#f2f7e2] text-4xl">
            {emoji}
          </div>

          <h2 className="text-xl font-extrabold tracking-tight">
            Who&apos;s doodling?
          </h2>

          <p className="mt-1 text-xs text-[#888a80]">
            Pick a sticker. No account, no email — just vibes.
          </p>
        </div>

        <label
          htmlFor="doodler-name"
          className="mt-5 block text-[11px] font-bold uppercase tracking-wide text-[#9a9c92]"
        >
          Your name
        </label>

        <input
          id="doodler-name"
          value={name}
          maxLength={24}
          onChange={event => setName(event.target.value)}
          placeholder="Doodler 42"
          className="mt-1 w-full rounded-xl border border-[#e7e5de] bg-[#fbfaf7] px-3 py-2.5 text-sm outline-none focus:border-[#bdc99a]"
        />

        <div className="mt-4 text-[11px] font-bold uppercase tracking-wide text-[#9a9c92]">
          Your sticker
        </div>

        <div className="mt-2 grid grid-cols-6 gap-1.5">
          {AVATARS.map(option => (
            <button
              key={option}
              type="button"
              aria-label={`Use ${option} as your sticker`}
              aria-pressed={emoji === option}
              onClick={() => setEmoji(option)}
              className={`grid h-10 place-items-center rounded-xl border text-xl transition hover:-translate-y-0.5 ${
                emoji === option
                  ? 'border-[#c6d99a] bg-[#f2f7e2]'
                  : 'border-transparent hover:border-[#e7e5de]'
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() =>
            onSave({
              ...initial,
              name: name.trim().slice(0, 24) || initial.name,
              emoji,
            })
          }
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#dff77a] px-4 py-3 text-sm font-bold text-[#273018] transition hover:brightness-95 active:translate-y-px"
        >
          <Check size={16} />
          {onCancel ? 'Save sticker' : 'Jump in'}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="mt-2 w-full py-1 text-xs text-[#888a80] hover:text-[#4b4e45]"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
