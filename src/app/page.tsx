'use client';

import dynamic from 'next/dynamic';

// Dynamically import the SnakeGame component to avoid SSR issues
const SnakeGame = dynamic(() => import('../components/SnakeGame'), {
  ssr: false,
  loading: () => <p>Loading game...</p>
});

export default function Home() {
  return (
    <div style={{ height: '100vh', width: '100vw', padding: 0, margin: 0, overflow: 'hidden' }}>
      <SnakeGame />
    </div>
  );
}