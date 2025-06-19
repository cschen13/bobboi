import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useSocket } from '../../hooks/useSocket';
import { getSavedGameSession, generateGameLink } from '../../lib/socketUtils';
import { GameState } from '../../lib/types';

const GameLobbyPage: React.FC = () => {
  const router = useRouter();
  const { gameId: routeGameId } = router.query;
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  
  const {
    socket,
    connected,
    game,
    gameId,
    playerId,
    error,
    reconnectGame,
  } = useSocket();
  
  // Check if current player is the creator (first player)
  const isCreator = game?.players.length ? game.players[0].id === playerId : false;
  
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
  
  // Effect to redirect to game page when game starts
  useEffect(() => {
    if (game?.gameState === GameState.PLAYING && gameId) {
      router.push(`/game/${gameId}/play`);
    }
  }, [game?.gameState, gameId, router]);
  
  // Copy game link to clipboard
  const copyGameLink = () => {
    if (gameId) {
      const link = generateGameLink(gameId);
      navigator.clipboard.writeText(link);
      setShowCopiedMessage(true);
      setTimeout(() => setShowCopiedMessage(false), 2000);
    }
  };
  
  // Handle starting the game
  const handleStartGame = () => {
    if (socket && connected && gameId) {
      socket.emit('start_game', { gameId });
    }
  };
  
  // If no game data yet, show loading
  if (!game || !gameId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading game...</p>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <Head>
        <title>Game Lobby | Bobboi</title>
        <meta name="description" content="Bobboi game lobby" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="min-h-screen flex flex-col bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4">
        <div className="max-w-md mx-auto w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Game Lobby</h1>
            <p className="text-gray-300">Waiting for players to join</p>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              Error: {error}
            </div>
          )}
          
          <div className="bg-white text-gray-900 p-6 rounded-lg shadow-lg mb-6">
            <div className="mb-6">
              <h2 className="font-bold text-xl mb-2">Game Code</h2>
              <div className="flex items-center justify-between bg-gray-100 p-3 rounded">
                <span className="font-mono font-bold text-xl">{gameId}</span>
                <button
                  onClick={copyGameLink}
                  className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
                >
                  {showCopiedMessage ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Share this code with other players to join
              </p>
            </div>
            
            <div className="mb-6">
              <h2 className="font-bold text-xl mb-4">Players</h2>
              <ul className="divide-y divide-gray-200">
                {game.players.map((player) => (
                  <li 
                    key={player.id} 
                    className="py-3 flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                        {player.name.charAt(0).toUpperCase()}
                      </div>
                      <span className={player.id === playerId ? 'font-bold' : ''}>
                        {player.name} {player.id === playerId ? '(You)' : ''}
                      </span>
                    </div>
                    {player.id === game.players[0].id && (
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                        Host
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            
            {isCreator && (
              <div className="mt-6">
                <button
                  onClick={handleStartGame}
                  disabled={game.players.length < 2}
                  className={`w-full p-3 rounded font-medium ${
                    game.players.length < 2
                      ? 'bg-gray-300 text-gray-500'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {game.players.length < 2 
                    ? 'Need at least 2 players to start' 
                    : 'Start Game'}
                </button>
              </div>
            )}
            
            {!isCreator && (
              <div className="mt-6 text-center text-gray-500">
                Waiting for the host to start the game...
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
};

export default GameLobbyPage; 