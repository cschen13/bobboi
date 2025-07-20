import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Game, GameResult } from '../lib/types';
import { saveGameSession } from '../lib/socketUtils';

type PlayerJoinedEvent = {
  game: Game;
  playerName: string;
  playerId: string;
};

type PlayerLeftEvent = {
  game: Game;
  playerId: string;
  playerName: string | undefined;
};

type GameCreatedEvent = {
  game: Game;
  playerId: string;
  gameId: string;
};

type GameJoinedEvent = {
  game: Game;
  playerId: string;
  gameId: string;
};

type GameStartedEvent = {
  game: Game;
};

type SocketHookReturn = {
  socket: Socket | null;
  connected: boolean;
  createGame: (playerNames: string[]) => void;
  joinGame: (gameId: string, playerName: string) => void;
  leaveGame: (gameId: string, playerId: string) => void;
  restartGame: (gameId: string) => void;
  endGame: (gameId: string) => void;
  reconnectGame: (gameId: string, playerId: string) => void;
  startGame: (gameId: string) => void;
  declareRound1: (gameId: string, playerId: string, seesPair: boolean) => void;
  declareRound2: (gameId: string, playerId: string, perceivedRank: number) => void;
  declareRound3: (gameId: string, playerId: string, guessedRank: string) => void;
  getAllGames: () => Promise<{ games: Game[], count: number }>;
  game: Game | null;
  playerId: string | null;
  gameId: string | null;
  error: string | null;
  gameResult: GameResult | null;
  setPlayerIdManually: (playerId: string | null) => void;
};

export const useSocket = (): SocketHookReturn => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [game, setGame] = useState<Game | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  // Initialize socket connection
  useEffect(() => {
    // Don't initialize socket on server-side
    if (typeof window === 'undefined') return;
    
    // Prevent multiple connection attempts
    if (isConnecting) return;
    setIsConnecting(true);
    
    // First fetch the API route to ensure the server is initialized
    fetch('/api/socket')
      .then(() => {
        console.log('API route fetched, initializing socket...');
        
        // Create socket connection with proper configuration
        const socketInstance = io('/', {
          path: '/api/socket',
          transports: ['polling'], // Force polling for Vercel compatibility
          reconnectionAttempts: 10,
          reconnectionDelay: 2000,
          reconnectionDelayMax: 5000,
          autoConnect: true,
          forceNew: true,
          timeout: 20000,
        });
    
        console.log('Socket instance created');
    
        // Set up event listeners
        socketInstance.on('connect', () => {
          console.log('Socket connected successfully');
          setConnected(true);
          setError(null);
          setIsConnecting(false);
        });
    
        socketInstance.on('connect_error', (err) => {
          console.error('Socket connection error:', err);
          setConnected(false);
          setError(`Connection error: ${err.message}`);
          setIsConnecting(false);
        });
    
        socketInstance.on('disconnect', () => {
          console.log('Socket disconnected');
          setConnected(false);
        });
    
        socketInstance.on('error', (data: { message: string }) => {
          console.error('Socket error:', data.message);
          setError(data.message);
        });
    
        socketInstance.on('game_created', (data: GameCreatedEvent) => {
          console.log('Game created:', data);
          setGame(data.game);
          setPlayerId(data.playerId);
          setGameId(data.gameId);
          setError(null);
          
          // Save session information to local storage
          saveGameSession(data.gameId, data.playerId, data.game.players.find(p => p.id === data.playerId)?.name || '');
        });
        
        socketInstance.on('game_joined', (data: GameJoinedEvent) => {
          console.log('Game joined:', data);
          setGame(data.game);
          setPlayerId(data.playerId);
          setGameId(data.gameId);
          setError(null);
          
          // Save session information to local storage
          saveGameSession(data.gameId, data.playerId, data.game.players.find(p => p.id === data.playerId)?.name || '');
        });
        
        socketInstance.on('reconnect_success', (data: { game: Game, playerId: string }) => {
          console.log('🔄 RECONNECT_SUCCESS: Reconnection successful:', data);
          console.log('🔄 RECONNECT_SUCCESS: Setting playerId to:', data.playerId);
          setGame(data.game);
          setGameId(data.game.id);
          setPlayerId(data.playerId);
          setError(null);
          
          // Save session with the reconnected player info
          const playerName = data.game.players.find(p => p.id === data.playerId)?.name || '';
          saveGameSession(data.game.id, data.playerId, playerName);
        });

        socketInstance.on('game_state', (gameData: Game) => {
          console.log('🔄 RECONNECT: Game state received (legacy):', gameData);
          setGame(gameData);
          setGameId(gameData.id);
          setError(null);
        });

        socketInstance.on('player_joined', (data: PlayerJoinedEvent) => {
          console.log(`Player ${data.playerName} joined the game`);
          setGame(data.game);
          setGameId(data.game.id);
          setError(null);
        });

        socketInstance.on('player_left', (data: PlayerLeftEvent) => {
          console.log(`Player ${data.playerName} left the game`);
          setGame(data.game);
          setGameId(data.game.id);
          setError(null);
        });

        socketInstance.on('game_restarted', (gameData: Game) => {
          console.log('Game restarted:', gameData);
          setGame(gameData);
          setGameId(gameData.id);
          setGameResult(null); // Reset game result on restart
          setError(null);
        });

        socketInstance.on('game_ended', ({ gameId }: { gameId: string }) => {
          console.log(`Game ended: ${gameId}`);
          setGame(null);
          setGameId(null);
          setPlayerId(null);
          setGameResult(null);
          setError(null);
        });
        
        socketInstance.on('game_started', (data: GameStartedEvent) => {
          console.log('🎮 GAME_STARTED EVENT RECEIVED:', data);
          console.log('🎮 New game state:', data.game.gameState);
          console.log('🎮 Setting game state in useSocket...');
          setGame(data.game);
          setGameId(data.game.id);
          setGameResult(null); // Reset game result on new game start
          setError(null);
        });
        
        socketInstance.on('game_state_update', (gameData: Game) => {
          console.log('Game state updated:', gameData);
          setGame(gameData);
          setGameId(gameData.id);
          setError(null);
        });
        
        socketInstance.on('round1_declaration_made', (data: { game: Game, declaration: { playerId: string, playerName: string, seesPair: boolean, timestamp: number } }) => {
          console.log('Round 1 declaration made:', data);
          setGame(data.game);
          setGameId(data.game.id);
          setError(null);
        });
        
        socketInstance.on('round2_ranking_made', (data: { game: Game, ranking: { playerId: string, playerName: string, perceivedRank: number, timestamp: number } }) => {
          console.log('Round 2 ranking made:', data);
          setGame(data.game);
          setGameId(data.game.id);
          setError(null);
        });
        
        socketInstance.on('round3_guess_made', (data: { game: Game, guess: { playerId: string, playerName: string, guessedRank: string, actualRank: string, isCorrect: boolean, timestamp: number } }) => {
          console.log('Round 3 guess made:', data);
          setGame(data.game);
          setGameId(data.game.id);
          setError(null);
        });
        
        socketInstance.on('game_over', (data: { game: Game, result: GameResult }) => {
          console.log('Game over:', data);
          setGame(data.game);
          setGameId(data.game.id);
          setGameResult(data.result);
          setError(null);
        });

        // Save socket instance
        setSocket(socketInstance);
    
        // Clean up on unmount
        return () => {
          socketInstance.disconnect();
        };
      })
      .catch((err) => {
        console.error('Error fetching socket API route:', err);
        setError(`Failed to initialize socket: ${err.message}`);
        setIsConnecting(false);
      });
  }, []);

  // Function to create a new game
  const createGame = useCallback((playerNames: string[]) => {
    console.log('Creating game with player names:', playerNames);
    if (socket && connected) {
      socket.emit('create_game', { playerNames });
    } else {
      setError('Socket not connected');
    }
  }, [socket, connected]);

  // Function to join an existing game
  const joinGame = useCallback((gameId: string, playerName: string) => {
    console.log('Joining game with ID:', gameId, 'and player name:', playerName);
    if (socket && connected) {
      socket.emit('join_game', { gameId, playerName });
    } else {
      setError('Socket not connected');
    }
  }, [socket, connected]);

  // Function to leave a game
  const leaveGame = useCallback((gameId: string, playerId: string) => {
    if (socket && connected) {
      socket.emit('leave_game', { gameId, playerId });
      setGame(null);
      setGameId(null);
      setPlayerId(null);
    } else {
      setError('Socket not connected');
    }
  }, [socket, connected]);

  // Function to restart a game
  const restartGame = useCallback((gameId: string) => {
    if (socket && connected) {
      socket.emit('restart_game', { gameId });
    } else {
      setError('Socket not connected');
    }
  }, [socket, connected]);

  // Function to end a game
  const endGame = useCallback((gameId: string) => {
    if (socket && connected) {
      socket.emit('end_game', { gameId });
      setGame(null);
      setGameId(null);
      setPlayerId(null);
    } else {
      setError('Socket not connected');
    }
  }, [socket, connected]);
  
  // Function to reconnect to a game
  const reconnectGame = useCallback((gameId: string, playerId: string) => {
    if (socket && connected) {
      console.log('🔄 useSocket.reconnectGame: Sending reconnect_game event:', { gameId, playerId });
      socket.emit('reconnect_game', { gameId, playerId });
    } else {
      console.log('🔄 useSocket.reconnectGame: Socket not connected!', { socket: !!socket, connected });
      setError('Socket not connected');
    }
  }, [socket, connected]);
  
  // Function to start a game
  const startGame = useCallback((gameId: string) => {
    if (socket && connected) {
      console.log('🚀 useSocket.startGame: Starting game with ID:', gameId);
      socket.emit('start_game', { gameId });
    } else {
      console.log('🚀 useSocket.startGame: Socket not connected!', { socket: !!socket, connected });
      setError('Socket not connected');
    }
  }, [socket, connected]);
  
  // Function to make a Round 1 declaration
  const declareRound1 = useCallback((gameId: string, playerId: string, seesPair: boolean) => {
    if (socket && connected) {
      console.log('🎯 useSocket.declareRound1:', { gameId, playerId, seesPair });
      socket.emit('declare_round1', { gameId, playerId, seesPair });
    } else {
      console.log('🎯 useSocket.declareRound1: Socket not connected!', { socket: !!socket, connected });
      setError('Socket not connected');
    }
  }, [socket, connected]);
  
  // Function to make a Round 2 ranking declaration
  const declareRound2 = useCallback((gameId: string, playerId: string, perceivedRank: number) => {
    if (socket && connected) {
      console.log('🎯 useSocket.declareRound2:', { gameId, playerId, perceivedRank });
      socket.emit('declare_round2', { gameId, playerId, perceivedRank });
    } else {
      console.log('🎯 useSocket.declareRound2: Socket not connected!', { socket: !!socket, connected });
      setError('Socket not connected');
    }
  }, [socket, connected]);
  
  // Function to make a Round 3 guess
  const declareRound3 = useCallback((gameId: string, playerId: string, guessedRank: string) => {
    if (socket && connected) {
      console.log('🎯 useSocket.declareRound3:', { gameId, playerId, guessedRank });
      socket.emit('declare_round3', { gameId, playerId, guessedRank });
    } else {
      console.log('🎯 useSocket.declareRound3: Socket not connected!', { socket: !!socket, connected });
      setError('Socket not connected');
    }
  }, [socket, connected]);

  // Function to get all active games (admin/debug feature)
  const getAllGames = useCallback((): Promise<{ games: Game[], count: number }> => {
    return new Promise((resolve, reject) => {
      if (socket && connected) {
        socket.emit('get_all_games', (response: { games: Game[], count: number }) => {
          resolve(response);
        });
      } else {
        const error = new Error('Socket not connected');
        setError(error.message);
        reject(error);
      }
    });
  }, [socket, connected]);

  return {
    socket,
    connected,
    createGame,
    joinGame,
    leaveGame,
    restartGame,
    endGame,
    reconnectGame,
    startGame,
    declareRound1,
    declareRound2,
    declareRound3,
    getAllGames,
    game,
    playerId,
    gameId,
    error,
    gameResult,
    setPlayerIdManually: setPlayerId,
  };
}; 