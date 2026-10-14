import { describe, expect, it } from 'vitest';
import { BoardObjectSchema } from '../src/lib/types';

describe('board object validation', () => {
  it('accepts a valid sticker', () => {
    expect(BoardObjectSchema.safeParse({ id: '8f6d25f7-09c5-4a11-b8b7-1301ddf8a7d1', type: 'sticker', x: 20, y: 30, emoji: '💗' }).success).toBe(true);
  });
  it('rejects an oversized text object', () => {
    expect(BoardObjectSchema.safeParse({ id: '8f6d25f7-09c5-4a11-b8b7-1301ddf8a7d1', type: 'text', x: 20, y: 30, text: 'x'.repeat(501), color: '#222222' }).success).toBe(false);
  });
  it('rejects invalid stroke widths', () => {
    expect(BoardObjectSchema.safeParse({ id: '8f6d25f7-09c5-4a11-b8b7-1301ddf8a7d1', type: 'stroke', points: [{x:1,y:2}], color:'#222', width:100, tool:'pen' }).success).toBe(false);
  });
});
