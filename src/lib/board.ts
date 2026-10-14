import type { BoardObject, Point, Stroke } from './types';

export function drawBoard(
  ctx: CanvasRenderingContext2D,
  objects: BoardObject[],
  width: number,
  height: number,
  animationTime = 0
) {
  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = '#fffdf9';
  ctx.fillRect(0, 0, width, height);

  // Subtle paper grid
  ctx.save();
  ctx.strokeStyle = '#eeeae3';
  ctx.lineWidth = 1;

  for (let x = 24; x < width; x += 24) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  for (let y = 24; y < height; y += 24) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.restore();

  for (const object of objects) {
    if (object.type === 'stroke') {
      drawStroke(ctx, object);
    }

    if (object.type === 'sticker') {
      // Give each sticker its own animation phase.
      const phase = Array.from(object.id).reduce(
        (sum, char) => sum + char.charCodeAt(0),
        0
      );

      const seconds = animationTime / 1000;
      const floatY = animationTime
        ? Math.sin(seconds * 2.2 + phase) * 4
        : 0;
      const rotation = animationTime
        ? Math.sin(seconds * 1.5 + phase) * 0.045
        : 0;

      ctx.save();
      ctx.translate(object.x, object.y + floatY);
      ctx.rotate(rotation);
      ctx.font = '34px system-ui, Apple Color Emoji, Segoe UI Emoji';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(object.emoji, 0, 0);
      ctx.restore();
    }

    if (object.type === 'text') {
      ctx.save();
      ctx.fillStyle = object.color;
      ctx.font = '600 20px system-ui, sans-serif';
      ctx.textBaseline = 'top';

      object.text.split('\n').forEach((line, i) => {
        ctx.fillText(line, object.x, object.y + i * 25);
      });

      ctx.restore();
    }
  }
}

function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  if (!stroke.points.length) return;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle =
    stroke.tool === 'eraser' ? '#fffdf9' : stroke.color;
  ctx.lineWidth =
    stroke.tool === 'eraser'
      ? Math.max(18, stroke.width * 3)
      : stroke.width;

  ctx.beginPath();
  ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

  if (stroke.points.length === 1) {
    ctx.lineTo(
      stroke.points[0].x + 0.01,
      stroke.points[0].y + 0.01
    );
  } else {
    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }
  }

  ctx.stroke();
  ctx.restore();
}

export function makeStroke(
  points: Point[],
  color: string,
  width: number,
  tool: 'pen' | 'eraser'
): Stroke {
  return {
    id: crypto.randomUUID(),
    type: 'stroke',
    points,
    color,
    width,
    tool,
  };
}