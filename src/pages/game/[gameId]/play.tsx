import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useSocket } from '../../../hooks/useSocket';
import { GameState } from '../../../lib/types';

const GamePlayPage: React.FC = () => {
  const router = useRouter();
  const { gameId: routeGameId } = router.query;
  
  const {
    socket,
    connected,
    game,
    gameId,
    playerId,
    error,
    reconnectGame,
  } = useSocket();
  
  // Effect to handle reconnection or redirection
  useEffect(() => {
    if (!router.isReady) return;
    
    const gameIdString = routeGameId as string;
    
    // If we have game ID in URL but no active game, try to reconnect
    if (gameIdString && !game) {
      const savedSession = localStorage.getItem('gameSession');
      
      if (savedSession) {
        const session = JSON.parse(savedSession);
        if (session.gameId === gameIdString) {
          reconnectGame(session.gameId, session.playerId);
        } else {
          // No saved session for this game, redirect to join page
          router.replace(`/join?gameId=${gameIdString}`);
        }
      } else {
        // No saved session at all, redirect to join page
        router.replace(`/join?gameId=${gameIdString}`);
      }
    }
  }, [router.isReady, routeGameId, game, reconnectGame, router]);
  
  // Effect to redirect to lobby if game not started
  useEffect(() => {
    if (game && game.gameState !== GameState.PLAYING && gameId) {
      router.replace(`/game/${gameId}`);
    }
  }, [game?.gameState, gameId, router]);
  
  // If no game data yet, show loading
  if (!game || !gameId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f2bf27]">
        <div className="text-center p-8 bg-white rounded-lg shadow-xl">
          <div className="w-16 h-16 border-4 border-[#651c1d] border-t-[#f2bf27] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#651c1d] font-medium text-lg">Loading your game...</p>
        </div>
      </div>
    );
  }
  
  // Get current player
  const currentPlayer = game.players.find(p => p.id === playerId);
  
  return (
    <>
      <Head>
        <title>Playing Game | Bobboi</title>
        <meta name="description" content="Playing Bobboi card game" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Poppins:wght@400;500;600&display=swap" rel="stylesheet" />
      </Head>
      <div className="min-h-screen flex flex-col bg-[#f2bf27]">
        {/* Header */}
        <header className="w-full bg-[#f2bf27] py-4 px-4 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mr-3">
              <svg viewBox="0 0 100 100" className="w-12 h-12 text-[#651c1d]" fill="currentColor">
                <path d="M30,30 C40,20 60,20 70,30 C80,40 80,60 70,70 C60,80 40,80 30,70 C20,60 20,40 30,30 Z" fillOpacity="0" strokeWidth="8" stroke="currentColor" />
                <circle cx="35" cy="40" r="8" />
                <circle cx="65" cy="40" r="8" />
                <circle cx="50" cy="65" r="8" />
              </svg>
            </div>
            <h1 className="text-[#651c1d] font-serif text-3xl font-bold">BOBBOI</h1>
          </div>
          <div className="flex items-center">
            <div className="hidden md:flex items-center mr-6">
              <div className="h-8 w-8 rounded-full bg-[#651c1d] flex items-center justify-center mr-2 text-white font-bold">
                {currentPlayer?.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-[#651c1d] font-medium">{currentPlayer?.name}</span>
            </div>
            <button 
              onClick={() => router.push('/')}
              className="bg-white hover:bg-gray-100 text-[#651c1d] px-4 py-2 rounded-md font-medium transition-colors flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Exit Game
            </button>
          </div>
        </header>
        
        <main className="flex-grow flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-5xl mx-auto">
            {error && (
              <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg border border-red-200">
                <p className="font-bold">Error:</p>
                <p>{error}</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Game info panel */}
              <div className="bg-white rounded-xl shadow-xl overflow-hidden">
                <div className="p-6 border-b border-[#f2bf27]">
                  <h2 className="font-bold text-xl text-[#651c1d] mb-2">Game Info</h2>
                  <div className="flex items-center justify-between bg-[#f8f8f8] p-3 rounded-lg mb-3">
                    <span className="text-gray-600">Game ID:</span>
                    <span className="font-mono font-bold text-[#651c1d]">{gameId}</span>
                  </div>
                  <div className="flex items-center justify-between bg-[#f8f8f8] p-3 rounded-lg">
                    <span className="text-gray-600">Players:</span>
                    <span className="font-bold text-[#651c1d]">{game.players.length}</span>
                  </div>
                </div>
                
                {/* Player list */}
                <div className="p-6 bg-[#fffaf0]">
                  <h3 className="font-bold text-lg mb-3 text-[#651c1d]">Players</h3>
                  <ul className="space-y-2">
                    {game.players.map((player) => (
                      <li 
                        key={player.id} 
                        className={`p-3 rounded-lg flex items-center justify-between ${
                          player.id === playerId 
                            ? 'bg-[#651c1d]/10 border border-[#651c1d]/30' 
                            : 'bg-white border border-[#f2bf27]/30'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-[#f2bf27] flex items-center justify-center mr-2 text-[#651c1d] font-bold">
                            {player.name.charAt(0).toUpperCase()}
                          </div>
                          <span className={`${player.id === playerId ? 'font-bold' : ''} text-[#651c1d]`}>
                            {player.name} {player.id === playerId ? '(You)' : ''}
                          </span>
                        </div>
                        {player.id === game.players[0].id && (
                          <span className="bg-[#651c1d] text-white text-xs px-2 py-1 rounded-full">
                            Host
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              {/* Game board */}
              <div className="md:col-span-2">
                <div className="bg-white rounded-xl shadow-xl overflow-hidden h-full">
                  <div className="p-6 border-b border-[#f2bf27]">
                    <h2 className="font-bold text-xl text-[#651c1d]">Game Board</h2>
                  </div>
                  
                  <div className="p-6 flex flex-col items-center justify-center h-[400px] bg-[#fffaf0]">
                    {/* Placeholder for actual game UI */}
                    <div className="text-center">
                      <div className="inline-block mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-[#651c1d]">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-bold text-[#651c1d] mb-2">Game in Progress</h3>
                      <p className="text-gray-600 mb-6">
                        The game interface is currently being developed. 
                        Stay tuned for the full gameplay experience!
                      </p>
                      <div className="flex flex-wrap justify-center gap-4">
                        {/* Sample cards */}
                        {[1, 2, 3, 4, 5].map((card) => (
                          <div 
                            key={card} 
                            className="w-20 h-28 bg-white rounded-lg shadow-md border-2 border-[#651c1d]/20 flex items-center justify-center hover:border-[#651c1d] transition-colors cursor-pointer"
                          >
                            <div className="text-[#651c1d] font-bold text-xl">
                              {card}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default GamePlayPage; 