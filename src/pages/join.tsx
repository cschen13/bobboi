import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useSocket } from '../hooks/useSocket';

const JoinPage: React.FC = () => {
  const router = useRouter();
  const { gameId: routeGameId } = router.query;
  const [gameId, setGameId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  
  const { socket, connected, joinGame } = useSocket();
  
  // Set the game ID from the URL if provided
  useEffect(() => {
    if (routeGameId && typeof routeGameId === 'string') {
      setGameId(routeGameId);
    }
  }, [routeGameId]);
  
  // Effect to listen for game_joined event
  useEffect(() => {
    if (!socket) return;
    
    const handleGameJoined = () => {
      router.push(`/game/${gameId}`);
    };
    
    socket.on('game_joined', handleGameJoined);
    
    return () => {
      socket.off('game_joined', handleGameJoined);
    };
  }, [socket, gameId, router]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!gameId.trim()) {
      setError('Please enter a game ID');
      return;
    }
    
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    
    setIsJoining(true);
    setError('');
    
    try {
      if (socket && connected) {
        joinGame(gameId, playerName);
        
        // Set a timeout to show error if no response after 5 seconds
        const timeoutId = setTimeout(() => {
          setError('Failed to join the game. The game might not exist or is already full.');
          setIsJoining(false);
        }, 5000);
        
        // Clear timeout when component unmounts
        return () => clearTimeout(timeoutId);
      } else {
        setError('Connection to server failed. Please try again.');
        setIsJoining(false);
      }
    } catch (err) {
      console.error('Error joining game:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsJoining(false);
    }
  };
  
  return (
    <>
      <Head>
        <title>Join Game | Bobboi</title>
        <meta name="description" content="Join a Bobboi game" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
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
            <h1 className="text-[#651c1d] text-3xl font-extrabold" style={{ fontFamily: 'Nunito, sans-serif' }}>BOBBOI</h1>
          </div>
          <button 
            onClick={() => router.push('/')}
            className="text-[#651c1d] font-medium hover:underline flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to Home
          </button>
        </header>
        
        <main className="flex-grow flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-lg mx-auto">
            {/* Page title */}
            <div className="text-center mb-6">
              <h2 className="text-4xl font-extrabold text-[#651c1d] mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>Join Game</h2>
              <p className="text-[#651c1d] text-lg">Enter your details to join a game</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-xl overflow-hidden">
              <div className="p-6">
                {error && (
                  <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg border border-red-200">
                    <p>{error}</p>
                  </div>
                )}
                
                <form onSubmit={handleSubmit}>
                  <div className="mb-6">
                    <label htmlFor="gameId" className="block text-[#651c1d] font-medium mb-2">
                      Game Code
                    </label>
                    <input
                      id="gameId"
                      type="text"
                      value={gameId}
                      onChange={(e) => setGameId(e.target.value)}
                      placeholder="Enter game code"
                      className="w-full px-4 py-3 rounded-lg border-2 border-[#f2bf27] focus:outline-none focus:ring-2 focus:ring-[#651c1d] focus:border-transparent"
                      disabled={isJoining}
                      required
                    />
                  </div>
                  
                  <div className="mb-8">
                    <label htmlFor="playerName" className="block text-[#651c1d] font-medium mb-2">
                      Your Name
                    </label>
                    <input
                      id="playerName"
                      type="text"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full px-4 py-3 rounded-lg border-2 border-[#f2bf27] focus:outline-none focus:ring-2 focus:ring-[#651c1d] focus:border-transparent"
                      disabled={isJoining}
                      required
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isJoining}
                    className="w-full bg-[#651c1d] hover:bg-[#7a2324] py-4 rounded-lg font-bold text-lg transition-colors shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
                    style={{ color: '#ffffff' }}
                  >
                    {isJoining ? (
                      <div className="flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Joining...
                      </div>
                    ) : (
                      'Join Game'
                    )}
                  </button>
                </form>
                
                <div className="mt-6 text-center">
                  <p className="text-[#651c1d]/80">
                    Don&apos;t have a game code?{' '}
                    <button 
                      onClick={() => router.push('/')}
                      className="text-[#651c1d] font-medium hover:underline"
                    >
                      Create a new game
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default JoinPage; 