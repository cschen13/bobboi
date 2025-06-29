import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Game } from '../lib/types';
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
  getAllGames: () => Promise<{ games: Game[], count: number }>;
  game: Game | null;
  playerId: string | null;
  gameId: string | null;
  error: string | null;
};

export const useSocket = (): SocketHookReturn => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [game, setGame] = useState<Game | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
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
          transports: ['polling', 'websocket'],
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          autoConnect: true,
          forceNew: true,
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
        
        socketInstance.on('game_state', (gameData: Game) => {
          console.log('Game state received:', gameData);
          setGame(gameData);
          setError(null);
        });

        socketInstance.on('player_joined', (data: PlayerJoinedEvent) => {
          console.log(`Player ${data.playerName} joined the game`);
          setGame(data.game);
          setError(null);
        });

        socketInstance.on('player_left', (data: PlayerLeftEvent) => {
          console.log(`Player ${data.playerName} left the game`);
          setGame(data.game);
          setError(null);
        });

        socketInstance.on('game_restarted', (gameData: Game) => {
          console.log('Game restarted:', gameData);
          setGame(gameData);
          setError(null);
        });

        socketInstance.on('game_ended', ({ gameId }: { gameId: string }) => {
          console.log(`Game ended: ${gameId}`);
          setGame(null);
          setGameId(null);
          setPlayerId(null);
          setError(null);
        });
        
        socketInstance.on('game_started', (data: GameStartedEvent) => {
          console.log('Game started:', data);
          setGame(data.game);
          setError(null);
        });
        
        socketInstance.on('game_state_update', (gameData: Game) => {
          console.log('Game state updated:', gameData);
          setGame(gameData);
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
    if (socket && connected) {
      socket.emit('create_game', { playerNames });
    } else {
      setError('Socket not connected');
    }
  }, [socket, connected]);

  // Function to join an existing game
  const joinGame = useCallback((gameId: string, playerName: string) => {
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
      socket.emit('reconnect_game', { gameId, playerId });
    } else {
      setError('Socket not connected');
    }
  }, [socket, connected]);
  
  // Function to start a game
  const startGame = useCallback((gameId: string) => {
    if (socket && connected) {
      socket.emit('start_game', { gameId });
    } else {
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
    getAllGames,
    game,
    playerId,
    gameId,
    error,
  };
}; 