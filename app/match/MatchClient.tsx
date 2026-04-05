'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import PlayClient from '../components/PlayClient';

export default function MatchClient() {
  const searchParams = useSearchParams();
  const [hashRoomId, setHashRoomId] = useState('');

  useEffect(() => {
    const syncHashRoomId = () => {
      const hash = window.location.hash.replace(/^#/, '');
      const params = new URLSearchParams(hash);
      setHashRoomId(params.get('roomId') ?? '');
    };

    syncHashRoomId();
    window.addEventListener('hashchange', syncHashRoomId);
    return () => window.removeEventListener('hashchange', syncHashRoomId);
  }, []);

  const roomId = searchParams.get('roomId') ?? hashRoomId;
  return <PlayClient roomId={roomId} />;
}
