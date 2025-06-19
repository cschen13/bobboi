import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSocket } from '../hooks/useSocket';
import { generateGameLink, getGameIdFromUrl } from '../lib/socketUtils';

interface GameLobbyProps {
  initialMode?: 'create' | 'join';
}

const GameLobby: React.FC<GameLobbyProps> = ({ initialMode = 'create' }) => {
  const router = useRouter();
  const [playerName, setPlayerName] = useState('');
  const [gameIdInput, setGameIdInput] = useState('');
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  const [activeMode, setActiveMode] = useState<'create' | 'join'>(initialMode);
  
  const {
    createGame,
    joinGame,
    game,
    gameId,
    playerId,
    error,
    connected
  } = useSocket();
  
  // Effect to redirect to game lobby when game is created or joined
  useEffect(() => {
    if (game && gameId) {
      router.push(`/game/${gameId}`);
    }
  }, [game, gameId, router]);
  
  // Handle creating a new game
  const handleCreateGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) {
      createGame([playerName.trim()]);
    }
  };
  
  // Handle joining an existing game
  const handleJoinGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim() && gameIdInput.trim()) {
      joinGame(gameIdInput.trim(), playerName.trim());
    }
  };
  
  // Copy game link to clipboard
  const copyGameLink = () => {
    if (gameId) {
      const link = generateGameLink(gameId);
      navigator.clipboard.writeText(link);
      setShowCopiedMessage(true);
      setTimeout(() => setShowCopiedMessage(false), 2000);
    }
  };
  
  // Check if we're in a game
  const isInGame = game !== null && gameId !== null && playerId !== null;
  
  // Check if there's a game ID in the URL
  const urlGameId = getGameIdFromUrl();
  
  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center text-[#651c1d]">Bobboi Card Game</h1>
      
      {!connected && (
        <div className="mb-4 p-3 bg-[#f2bf27]/20 text-[#651c1d] rounded-lg border border-[#f2bf27]">
          <p className="font-bold">Connecting to server...</p>
          <p className="text-sm mt-1">This may take a few moments. If it doesn't connect, try refreshing the page.</p>
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg border border-red-200">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
        </div>
      )}
      
      {!isInGame ? (
        <>
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-[#651c1d]">
              Your Name:
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full p-3 border-2 border-[#f2bf27] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#651c1d] focus:border-[#651c1d] transition-colors"
              placeholder="Enter your name"
            />
          </div>
          
          {activeMode === 'join' ? (
            <form onSubmit={handleJoinGame} className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-[#651c1d]">
                  Game Code:
                </label>
                <input
                  type="text"
                  value={gameIdInput || urlGameId || ''}
                  onChange={(e) => setGameIdInput(e.target.value)}
                  className="w-full p-3 border-2 border-[#f2bf27] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#651c1d] focus:border-[#651c1d] transition-colors"
                  placeholder="Enter game code (e.g. ABCD-1234)"
                />
              </div>
              <button
                type="submit"
                disabled={!connected || !playerName.trim() || !(gameIdInput || urlGameId)}
                className={`w-full p-4 rounded-lg font-bold text-lg transition-colors ${
                  !connected || !playerName.trim() || !(gameIdInput || urlGameId)
                    ? 'bg-gray-200 text-gray-500'
                    : 'bg-[#651c1d] text-white hover:bg-[#7a2324]'
                }`}
              >
                Join Game
              </button>
              
              <div className="text-center mt-4">
                <button 
                  type="button" 
                  onClick={() => setActiveMode('create')}
                  className="text-[#651c1d] hover:text-[#7a2324] font-medium hover:underline"
                >
                  Or create a new game instead
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 gap-5 mb-6">
              <button
                onClick={handleCreateGame}
                disabled={!connected || !playerName.trim()}
                className={`p-4 rounded-lg font-bold text-lg transition-colors ${
                  !connected || !playerName.trim()
                    ? 'bg-gray-200 text-gray-500'
                    : 'bg-[#f2bf27] text-[#651c1d] hover:bg-[#e5b01c]'
                }`}
              >
                Create New Game
              </button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-[#f2bf27]/30"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 bg-white text-sm text-[#651c1d]">OR</span>
                </div>
              </div>
              
              <div>
                <button
                  type="button" 
                  onClick={() => setActiveMode('join')}
                  className="w-full p-4 rounded-lg font-bold text-lg bg-white border-2 border-[#651c1d] text-[#651c1d] hover:bg-[#651c1d]/10 transition-colors"
                >
                  Join Existing Game
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-4 border-[#f2bf27] border-t-[#651c1d] rounded-full animate-spin mx-auto"></div>
          <p className="text-[#651c1d]">Connecting to game...</p>
        </div>
      )}
    </div>
  );
};

export default GameLobby; 