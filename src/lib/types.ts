import { z } from 'zod';

export const PointSchema = z.object({ x: z.number(), y: z.number() });
export const StrokeSchema = z.object({
  id: z.string().uuid(), type: z.literal('stroke'), points: z.array(PointSchema).min(1),
  color: z.string().max(32), width: z.number().min(1).max(40), tool: z.enum(['pen', 'eraser']),
});
export const StickerSchema = z.object({
  id: z.string().uuid(), type: z.literal('sticker'), x: z.number(), y: z.number(), emoji: z.string().max(16),
});
export const TextSchema = z.object({
  id: z.string().uuid(), type: z.literal('text'), x: z.number(), y: z.number(), text: z.string().max(500), color: z.string().max(32),
});
export const BoardObjectSchema = z.discriminatedUnion('type', [StrokeSchema, StickerSchema, TextSchema]);
export type Point = z.infer<typeof PointSchema>;
export type Stroke = z.infer<typeof StrokeSchema>;
export type Sticker = z.infer<typeof StickerSchema>;
export type BoardText = z.infer<typeof TextSchema>;
export type BoardObject = z.infer<typeof BoardObjectSchema>;
export type Tool = 'pen' | 'eraser' | 'text' | 'select';
