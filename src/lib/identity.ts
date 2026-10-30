// Anonymous, account-free identity. Stored per browser so a doodler keeps the
// same name and sticker across reloads, but nothing is sent anywhere except the
// room's presence channel.

export type BoardIdentity = {
  id: string;
  name: string;
  emoji: string;
};

const STORAGE_KEY = 'pingboard:me';

export const AVATARS = [
  '🦊',
  '🐼',
  '🐸',
  '🐙',
  '🦄',
  '🐨',
  '🐯',
  '🐧',
  '🌻',
  '🍄',
  '🪐',
  '🍋',
];

function randomName() {
  return `Doodler ${Math.floor(Math.random() * 90 + 10)}`;
}

export function newIdentity(): BoardIdentity {
  return {
    id:
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: randomName(),
    emoji: AVATARS[Math.floor(Math.random() * AVATARS.length)],
  };
}

export function loadIdentity(): BoardIdentity | null {
  try {
    const raw: unknown = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || 'null'
    );

    if (!raw || typeof raw !== 'object') return null;

    const value = raw as Partial<BoardIdentity>;

    if (
      typeof value.id !== 'string' ||
      typeof value.name !== 'string' ||
      typeof value.emoji !== 'string' ||
      !value.id
    ) {
      return null;
    }

    return {
      id: value.id,
      name: value.name.slice(0, 24) || randomName(),
      emoji: value.emoji.slice(0, 8) || AVATARS[0],
    };
  } catch {
    return null;
  }
}

export function saveIdentity(identity: BoardIdentity) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
  } catch {
    // Local cache is best-effort.
  }
}
