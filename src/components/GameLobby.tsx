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
      <h1 className="text-2xl font-bold mb-6 text-center">Bobboi Game</h1>
      
      {!connected && (
        <div className="mb-4 p-3 bg-yellow-100 text-yellow-700 rounded">
          <p className="font-bold">Connecting to server...</p>
          <p className="text-sm mt-1">This may take a few moments. If it doesn't connect, try refreshing the page.</p>
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
        </div>
      )}
      
      {!isInGame ? (
        <>
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium">
              Your Name:
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter your name"
            />
          </div>
          
          {activeMode === 'join' ? (
            <form onSubmit={handleJoinGame} className="space-y-3">
              <input
                type="text"
                value={gameIdInput || urlGameId || ''}
                onChange={(e) => setGameIdInput(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Enter game code (e.g. ABCD-1234)"
              />
              <button
                type="submit"
                disabled={!connected || !playerName.trim() || !(gameIdInput || urlGameId)}
                className={`w-full p-3 rounded font-medium ${
                  !connected || !playerName.trim() || !(gameIdInput || urlGameId)
                    ? 'bg-gray-300 text-gray-500'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                Join Game
              </button>
              
              <div className="text-center mt-4">
                <button 
                  type="button" 
                  onClick={() => setActiveMode('create')}
                  className="text-blue-600 hover:underline"
                >
                  Or create a new game instead
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 gap-4 mb-6">
              <button
                onClick={handleCreateGame}
                disabled={!connected || !playerName.trim()}
                className={`p-3 rounded font-medium ${
                  !connected || !playerName.trim()
                    ? 'bg-gray-300 text-gray-500'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Create New Game
              </button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-2 bg-white text-sm text-gray-500">OR</span>
                </div>
              </div>
              
              <form onSubmit={handleJoinGame} className="space-y-3">
                <input
                  type="text"
                  value={gameIdInput || urlGameId || ''}
                  onChange={(e) => setGameIdInput(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Enter game code (e.g. ABCD-1234)"
                />
                <button
                  type="submit"
                  disabled={!connected || !playerName.trim() || !(gameIdInput || urlGameId)}
                  className={`w-full p-3 rounded font-medium ${
                    !connected || !playerName.trim() || !(gameIdInput || urlGameId)
                      ? 'bg-gray-300 text-gray-500'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  Join Game
                </button>
              </form>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p>Connecting to game...</p>
        </div>
      )}
    </div>
  );
};

export default GameLobby; 