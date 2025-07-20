import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useSocket } from '../../../hooks/useSocket';
import { GameState, GameAction } from '../../../lib/types';
import { getSavedGameSession } from '../../../lib/socketUtils';
import GameBoard, { RoundState } from '../../../components/GameBoard';

const GamePlayPage: React.FC = () => {
  const router = useRouter();
  const { gameId: routeGameId } = router.query;
  
  const {
    connected,
    game,
    gameId,
    playerId,
    error,
    reconnectGame,
    setPlayerIdManually,
    declareRound1,
    declareRound2,
    declareRound3,
  } = useSocket();
  
  // Effect to handle reconnection or redirection
  useEffect(() => {
    if (!router.isReady) return;
    
    const gameIdString = routeGameId as string;
    console.log('🎲 PLAY PAGE: Reconnection effect triggered:', {
      gameIdString,
      hasGame: !!game,
      connected
    });
    
    // If we have game ID in URL but no active game, try to reconnect
    if (gameIdString && !game && connected) {
      console.log('🎲 PLAY PAGE: Need to reconnect, checking saved session...');
      const savedSession = getSavedGameSession();
      
      if (savedSession) {
        console.log('🎲 PLAY PAGE: Found saved session:', savedSession);
        console.log('🎲 PLAY PAGE: Session details:', {
          sessionGameId: savedSession.gameId,
          sessionPlayerId: savedSession.playerId,
          sessionPlayerName: savedSession.playerName,
          urlGameId: gameIdString
        });
        if (savedSession.gameId === gameIdString) {
          console.log('🎲 PLAY PAGE: Reconnecting to game with:', { gameId: savedSession.gameId, playerId: savedSession.playerId });
          reconnectGame(savedSession.gameId, savedSession.playerId);
          
          // WORKAROUND: Set playerId from saved session since server doesn't send it back
          // This is a temporary fix until server changes take effect
          setTimeout(() => {
            console.log('🎲 PLAY PAGE: Setting playerId from saved session as workaround:', savedSession.playerId);
            setPlayerIdManually(savedSession.playerId);
          }, 1000);
        } else {
          console.log('🎲 PLAY PAGE: Session mismatch, redirecting to join');
          router.replace(`/join?gameId=${gameIdString}`);
        }
      } else {
        console.log('🎲 PLAY PAGE: No saved session, redirecting to join');
        router.replace(`/join?gameId=${gameIdString}`);
      }
    }
  }, [router.isReady, routeGameId, game, reconnectGame, router, connected]);
  
  // Effect to redirect to lobby if game not started (but only after we have a game object)
  useEffect(() => {
    console.log('🎲 PLAY PAGE: Game state check:', {
      gameState: game?.gameState,
      gameId: gameId,
      shouldRedirectToLobby: game && game.gameState !== GameState.PLAYING,
      hasGame: !!game
    });
    
    // Only redirect if we have a game object AND it's not in PLAYING state
    // This prevents redirecting during the initial load/reconnection phase
    if (game && game.gameState !== GameState.PLAYING && gameId) {
      console.log('🎲 PLAY PAGE: Game not PLAYING, redirecting to lobby:', `/game/${gameId}`);
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
  console.log('🔍 DEBUG: useSocket data:', { 
    playerId, 
    gameId, 
    gameObject: game,
    gameState: game?.gameState,
    players: game?.players 
  });
  const currentPlayer = game.players.find(p => p.id === playerId);

  // Map players to GameBoard format
  const boardPlayers = game.players.map(p => {
    console.log('🃏 Player mapping:', {
      playerId: p.id,
      playerName: p.name,
      currentPlayerId: playerId,
      isCurrentPlayer: p.id === playerId,
      cardData: p.card,
      cardRank: p.card?.rank
    });
    
    // Determine if we should reveal this player's card to themselves
    let cardDisplay = '?';
    
    if (p.id === playerId) {
      // This is the current player viewing their own card
      if (game.roundPhase === 'round3') {
        // In Round 3, check if this player has made their guess
        const hasGuessed = game.round3Guesses?.some(guess => guess.playerId === p.id);
        
        if (hasGuessed && p.card) {
          // Reveal the actual card after they've guessed
          cardDisplay = p.card.rank;
        } else {
          // Haven't guessed yet, keep it hidden
          cardDisplay = '?';
        }
      } else if (game.roundPhase === 'revealing' || game.roundPhase === 'complete') {
        // During revealing phase, show all cards
        cardDisplay = p.card ? p.card.rank : '?';
      } else {
        // In Round 1 and 2, always hide own card
        cardDisplay = '?';
      }
    } else {
      // Other players' cards are always visible
      cardDisplay = p.card ? p.card.rank : '?';
    }
    
    return {
      id: p.id,
      name: p.name,
      card: cardDisplay,
    };
  });

  // Determine current turn player ID
  const currentTurnPlayerId = game.currentTurnPlayerId || game.players[game.turn]?.id || '';

  // Derive roundState for GameBoard based on game phase
  let roundState: RoundState;
  if (game.roundPhase === 'round1') {
    roundState = { round: 1 };
  } else if (game.roundPhase === 'round2') {
    roundState = { round: 2, totalPlayers: game.players.length };
  } else if (game.roundPhase === 'round3') {
    roundState = { round: 3 };
  } else {
    // Fallback to legacy round number
    if (game.round === 2) {
      roundState = { round: 2, totalPlayers: game.players.length };
    } else if (game.round === 3) {
      roundState = { round: 3 };
    } else {
      // Default to round 1 for any other value
      roundState = { round: 1 };
    }
  }

  // Use real action log from game state
  const actionLog: GameAction[] = game.actionLog || [];

  // Handle player actions
  const handleAction = (action: { type: string; value: boolean | string | number }) => {
    console.log('🎯 Action submitted:', action);
    
    if (!gameId || !playerId) {
      console.error('Missing gameId or playerId');
      return;
    }
    
    // Handle Round 1 declarations
    if (action.type === 'pair' && game.roundPhase === 'round1') {
      console.log('🎯 Making Round 1 declaration:', { seesPair: action.value });
      declareRound1(gameId, playerId, action.value as boolean);
    }
    // Handle Round 2 ranking declarations
    else if (action.type === 'perceivedRank' && game.roundPhase === 'round2') {
      console.log('🎯 Making Round 2 ranking:', { perceivedRank: action.value });
      declareRound2(gameId, playerId, Number(action.value));
    }
    // Handle Round 3 guess declarations
    else if (action.type === 'guess' && game.roundPhase === 'round3') {
      console.log('🎯 Making Round 3 guess:', { guessedRank: action.value });
      declareRound3(gameId, playerId, String(action.value));
    }
    else {
      console.log('🎯 Action type not implemented yet:', action.type);
    }
  };

  return (
    <>
      <Head>
        <title>Playing Game | Bobboi</title>
        <meta name="description" content="Playing Bobboi card game" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Poppins:wght@400;500;600&display=swap" rel="stylesheet" />
      </Head>
      <div className="min-h-screen flex flex-col bg-[#f2bf27] w-full">
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
        
        <main className="flex-grow">
          <div className="w-full max-w-2xl mx-auto px-4 py-6">
            {error && (
              <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg border border-red-200">
                <p className="font-bold">Error:</p>
                <p>{error}</p>
              </div>
            )}
            
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Game info panel */}
              <div className="lg:w-64 flex-shrink-0">
                <div className="bg-white rounded-xl shadow-xl overflow-hidden">
                  <div className="p-4 border-b border-[#f2bf27]">
                    <h2 className="font-bold text-lg text-[#651c1d] mb-2">Game Info</h2>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between bg-[#f8f8f8] p-2 rounded text-sm">
                        <span className="text-gray-600">Game ID:</span>
                        <span className="font-mono font-bold text-[#651c1d]">{gameId}</span>
                      </div>
                      <div className="flex items-center justify-between bg-[#f8f8f8] p-2 rounded text-sm">
                        <span className="text-gray-600">Players:</span>
                        <span className="font-bold text-[#651c1d]">{game.players.length}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Player list */}
                  <div className="p-4 bg-[#fffaf0]">
                    <h3 className="font-bold text-md mb-3 text-[#651c1d]">Players</h3>
                    <ul className="space-y-2">
                      {game.players.map((player) => (
                        <li 
                          key={player.id} 
                          className={`p-2 rounded-lg flex items-center justify-between text-sm ${
                            player.id === playerId 
                              ? 'bg-[#651c1d]/10 border border-[#651c1d]/30' 
                              : 'bg-white border border-[#f2bf27]/30'
                          }`}
                        >
                          <div className="flex items-center">
                            <div className="h-6 w-6 rounded-full bg-[#f2bf27] flex items-center justify-center mr-2 text-[#651c1d] font-bold text-xs">
                              {player.name.charAt(0).toUpperCase()}
                            </div>
                            <span className={`${player.id === playerId ? 'font-bold' : ''} text-[#651c1d] text-sm`}>
                              {player.name} {player.id === playerId ? '(You)' : ''}
                            </span>
                          </div>
                          {player.id === game.players[0].id && (
                            <span className="bg-[#651c1d] text-white text-xs px-1 py-0.5 rounded">
                              Host
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              
              {/* Game board */}
              <div className="flex-1 min-w-0">
                <GameBoard
                  players={boardPlayers}
                  currentRound={game.roundPhase === 'round1' ? 1 : game.roundPhase === 'round2' ? 2 : game.roundPhase === 'round3' ? 3 : game.round}
                  currentTurnPlayerId={currentTurnPlayerId}
                  actionLog={actionLog.map(action => {
                    if (action.type === 'round1_declaration') {
                      return {
                        playerId: action.playerId,
                        playerName: action.playerName,
                        round: action.round,
                        type: 'pair' as const,
                        value: action.content.includes('see a pair')
                      };
                    } else if (action.type === 'round2_ranking') {
                      // Extract the rank number from content like "I think I am 2nd highest"
                      const rankMatch = action.content.match(/I think I am (\d+)/);
                      const rank = rankMatch ? rankMatch[1] : action.content;
                      return {
                        playerId: action.playerId,
                        playerName: action.playerName,
                        round: action.round,
                        type: 'perceivedRank' as const,
                        value: rank
                      };
                    } else if (action.type === 'round3_guess') {
                      // Extract the guessed rank from content like "I think my card is A (actual: K) - WRONG"
                      const guessMatch = action.content.match(/I think my card is (\w+)/);
                      const guess = guessMatch ? guessMatch[1] : action.content;
                      return {
                        playerId: action.playerId,
                        playerName: action.playerName,
                        round: action.round,
                        type: 'guess' as const,
                        value: guess
                      };
                    } else {
                      return {
                        playerId: action.playerId,
                        playerName: action.playerName,
                        round: action.round,
                        type: action.type as 'pair' | 'perceivedRank' | 'guess',
                        value: action.content
                      };
                    }
                  })}
                  selfPlayerId={playerId || ''}
                  roundState={roundState}
                  onAction={handleAction}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default GamePlayPage; 