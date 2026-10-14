import type { Metadata } from 'next';
import Board from '@/components/Board';

type BoardPageProps = { params: Promise<{ roomId: string }> };

export async function generateMetadata({ params }: BoardPageProps): Promise<Metadata> {
  const { roomId } = await params;
  return {
    title: `Shared board ${roomId.slice(0, 12)}`,
    description: 'A shared Pingboard canvas for doodles, notes and playful ideas.',
    robots: { index: false, follow: false },
  };
}

export default async function BoardPage({ params }: BoardPageProps) {
  const { roomId } = await params;
  return <Board roomId={roomId} />;
}
