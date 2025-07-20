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
    startGame,
  } = useSocket();
  
  // Check if current player is the creator (first player)
  const isCreator = game?.players.length ? game.players[0].id === playerId : false;
  
  // Effect to handle reconnection or redirection
  useEffect(() => {
    if (!router.isReady) return;
    
    const gameIdString = routeGameId as string;
    console.log('🔄 LOBBY RECONNECTION EFFECT:', {
      routeGameId,
      gameIdString,
      hasGame: !!game,
      gameState: game?.gameState
    });
    const savedSession = getSavedGameSession();
    console.log('🔄 savedSession:', savedSession);
    
    // If we have game ID in URL but no active game, try to reconnect
    if (gameIdString && !game) {
      if (savedSession && savedSession.gameId === gameIdString) {
        console.log('🔄 Reconnecting to game...');
        reconnectGame(savedSession.gameId, savedSession.playerId);
      } else {
        console.log('🔄 No session, redirecting to join');
        router.replace(`/join?gameId=${gameIdString}`);
      }
    }
  }, [router.isReady, routeGameId, game, reconnectGame, router]);
  
  // Effect to redirect to game page when game starts
  useEffect(() => {
    console.log('🎮 Game state effect triggered:', {
      gameState: game?.gameState,
      gameId: gameId,
      isPlaying: game?.gameState === GameState.PLAYING
    });
    
    if (game?.gameState === GameState.PLAYING && gameId) {
      console.log('🎮 REDIRECTING TO PLAY PAGE:', `/game/${gameId}/play`);
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
    console.log('🚀 START GAME CLICKED:', { connected, gameId, game: game?.gameState });
    if (connected && gameId) {
      console.log('🚀 EMITTING start_game event for gameId:', gameId);
      startGame(gameId);
    } else {
      console.log('🚀 CANNOT START GAME:', { connected, gameId });
    }
  };
  
  // If no game data yet, show loading
  if (!game || !gameId) {
    console.log('no game or gameId', game, gameId);
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f2bf27]">
        <div className="text-center p-8 bg-white rounded-lg shadow-xl">
          <div className="w-16 h-16 border-4 border-[#651c1d] border-t-[#f2bf27] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#651c1d] font-medium text-lg">Loading your game...</p>
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
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Poppins:wght@400;500;600&display=swap" rel="stylesheet" />
      </Head>
      <div className="min-h-screen flex flex-col bg-[#f2bf27]">
        {/* Header */}
        <header className="w-full bg-[#f2bf27] py-4 px-4 flex items-center justify-between border-b border-[#651c1d]/10">
          <div className="flex items-center">
            <span className="text-[#651c1d] font-serif text-2xl font-bold tracking-wide">BOBBOI</span>
          </div>
          <button 
            onClick={() => router.push('/')} 
            className="text-[#651c1d] font-medium hover:underline flex items-center gap-1 bg-white rounded px-3 py-1 shadow-sm border border-[#651c1d]/10"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to Home
          </button>
        </header>
        <main className="flex-grow flex flex-col items-center justify-center px-2 py-6">
          <div className="w-full max-w-md mx-auto space-y-6">
            {/* Page title */}
            <div className="text-center mb-2">
              <h2 className="font-serif text-3xl font-bold text-[#651c1d] mb-1">Game Lobby</h2>
              <p className="text-[#651c1d] text-base">Waiting for friends to join your game</p>
            </div>
            {error && (
              <div className="p-3 bg-red-100 text-red-700 rounded-lg border border-red-200 text-center">
                <p className="font-bold">Error:</p>
                <p>{error}</p>
              </div>
            )}
            {/* Game code section */}
            <div className="bg-white rounded-xl shadow border border-[#f2bf27]/40 p-4 flex flex-col items-center">
              <h3 className="font-bold text-lg mb-2 text-[#651c1d] flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3A5.25 5.25 0 0012 1.5zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
                </svg>
                Game Code
              </h3>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono font-bold text-xl tracking-wider text-[#651c1d] bg-[#f2bf27]/30 px-3 py-1 rounded">{gameId}</span>
                <button
                  onClick={copyGameLink}
                  className="bg-[#f2bf27] hover:bg-[#e5b01c] text-[#651c1d] px-2 py-1 rounded-md font-medium transition-colors flex items-center gap-1 border border-[#651c1d]/10"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                  </svg>
                  {showCopiedMessage ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
              <p className="text-xs text-gray-500">Share this code with friends to join your game</p>
            </div>
            {/* Players section */}
            <div className="bg-white rounded-xl shadow border border-[#f2bf27]/40 p-4 flex flex-col items-center">
              <h3 className="font-bold text-lg mb-3 text-[#651c1d] flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M8.25 6.75a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0zM15.75 9.75a3 3 0 116 0 3 3 0 01-6 0zM2.25 9.75a3 3 0 116 0 3 3 0 01-6 0zM6.31 15.117A6.745 6.745 0 0112 12a6.745 6.745 0 016.709 7.498.75.75 0 01-.372.568A12.696 12.696 0 0112 21.75c-2.305 0-4.47-.612-6.337-1.684a.75.75 0 01-.372-.568 6.787 6.787 0 011.019-4.38z" clipRule="evenodd" />
                  <path d="M5.082 14.254a8.287 8.287 0 00-1.308 5.135 9.687 9.687 0 01-1.764-.44l-.115-.04a.563.563 0 01-.373-.487l-.01-.121a3.75 3.75 0 013.57-4.047zM20.226 19.389a8.287 8.287 0 00-1.308-5.135 3.75 3.75 0 013.57 4.047l-.01.121a.563.563 0 01-.373.486l-.115.04c-.567.2-1.156.349-1.764.441z" />
                </svg>
                Players <span className="text-sm font-normal">({game.players.length})</span>
              </h3>
              <ul className="space-y-2 w-full">
                {game.players.map((player) => (
                  <li 
                    key={player.id} 
                    className="flex items-center gap-3 p-2 rounded-lg border border-[#f2bf27]/20 bg-[#f2bf27]/10"
                  >
                    <span className={`text-[#651c1d] ${player.id === playerId ? 'font-bold' : ''}`}>
                      {player.name} {player.id === playerId ? '(You)' : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            {/* Start game button section */}
            <div className="bg-white rounded-xl shadow border border-[#f2bf27]/40 p-4 flex flex-col items-center">
              <button
                onClick={handleStartGame}
                disabled={game.players.length < 2}
                className={`w-full py-3 rounded-lg font-bold text-lg transition-colors mt-2 ${
                  game.players.length < 2
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-[#651c1d] hover:bg-[#7a2324] shadow-lg'
                }`}
                style={game.players.length < 2 ? {} : { color: '#ffffff' }}
              >
                {game.players.length < 2 
                  ? 'Need at least 2 players to start' 
                  : 'Start Game'}
              </button>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default GameLobbyPage; 