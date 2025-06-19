import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import GameLobby from '../components/GameLobby';

const JoinGamePage: React.FC = () => {
  const router = useRouter();
  const { gameId } = router.query;
  
  useEffect(() => {
    // If no gameId is provided, redirect to home
    if (router.isReady && !gameId) {
      router.replace('/');
    }
  }, [router.isReady, gameId, router]);
  
  return (
    <>
      <Head>
        <title>Join Bobboi Game</title>
        <meta name="description" content="Join an existing Bobboi game" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Join Game</h1>
            <p className="text-gray-300">Enter your name and join the game</p>
          </div>
          
          <div className="bg-white text-gray-900 p-6 rounded-lg shadow-lg">
            <GameLobby initialMode="join" />
          </div>
        </div>
      </main>
    </>
  );
};

export default JoinGamePage; 