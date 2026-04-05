'use client';

import { useSearchParams } from 'next/navigation';
import PlayClient from '../components/PlayClient';

export default function MatchClient() {
  const roomId = useSearchParams().get('roomId') ?? '';
  return <PlayClient roomId={roomId} />;
}
