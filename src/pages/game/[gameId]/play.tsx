import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useSocket } from '../../../hooks/useSocket';
import { getSavedGameSession } from '../../../lib/socketUtils';
import { GameState } from '../../../lib/types';

const GamePlayPage: React.FC = () => {
  const router = useRouter();
  const { gameId: routeGameId } = router.query;
  
  const {
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
      const savedSession = getSavedGameSession();
      
      if (savedSession && savedSession.gameId === gameIdString) {
        reconnectGame(savedSession.gameId, savedSession.playerId);
      } else {
        // No saved session for this game, redirect to join page
        router.replace(`/join?gameId=${gameIdString}`);
      }
    }
  }, [router.isReady, routeGameId, game, reconnectGame, router]);
  
  // Effect to redirect back to lobby if game is not in PLAYING state
  useEffect(() => {
    if (game && game.gameState !== GameState.PLAYING && gameId) {
      router.replace(`/game/${gameId}`);
    }
  }, [game?.gameState, gameId, router]);
  
  // If no game data yet, show loading
  if (!game || !gameId || !playerId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading game...</p>
        </div>
      </div>
    );
  }
  
  // Find the current player's card
  const currentPlayer = game.players.find(p => p.id === playerId);
  
  return (
    <>
      <Head>
        <title>Playing Bobboi</title>
        <meta name="description" content="Playing Bobboi card game" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="min-h-screen flex flex-col bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4">
        <div className="max-w-md mx-auto w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Bobboi</h1>
            <p className="text-gray-300">Round {game.round}</p>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              Error: {error}
            </div>
          )}
          
          <div className="bg-white text-gray-900 p-6 rounded-lg shadow-lg mb-6">
            <h2 className="font-bold text-xl mb-4 text-center">Game Started!</h2>
            <p className="text-center mb-6">
              This is a placeholder for the actual game UI.
            </p>
            
            <div className="mb-6">
              <h3 className="font-bold text-lg mb-2">Players:</h3>
              <div className="grid grid-cols-2 gap-4">
                {game.players.map((player) => (
                  <div 
                    key={player.id}
                    className={`p-3 rounded-lg ${player.id === playerId ? 'bg-blue-100' : 'bg-gray-100'}`}
                  >
                    <div className="font-medium">{player.name} {player.id === playerId ? '(You)' : ''}</div>
                    {player.id !== playerId && player.card && (
                      <div className="mt-2 text-center">
                        <span className="inline-block bg-white border border-gray-300 rounded px-3 py-1 font-bold">
                          {player.card.rank}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="text-center text-gray-500">
              <p>You can see everyone's cards except your own.</p>
              <p>Try to guess your card based on the information.</p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default GamePlayPage; 