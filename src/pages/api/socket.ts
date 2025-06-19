import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import type { NextApiRequest, NextApiResponse } from 'next';
import { Game, GameState } from '../../lib/types';
import { createGame, restartGame } from '../../lib/game';

// Define a custom NextApiResponse type that includes Socket.IO
type SocketIONextApiResponse = NextApiResponse & {
  socket: {
    server: HTTPServer & {
      io?: SocketIOServer;
    };
  };
};

// In-memory store for games
const games: Record<string, Game> = {};

const SocketHandler = (req: NextApiRequest, res: SocketIONextApiResponse) => {
  if (!res.socket.server.io) {
    console.log('Initializing Socket.IO server...');
    
    // Create a new Socket.IO server instance
    const io = new SocketIOServer(res.socket.server);
    res.socket.server.io = io;
    
    // Socket.IO event handlers
    io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);
      
      // Handle creating a new game
      socket.on('create_game', ({ playerNames }: { playerNames: string[] }) => {
        try {
          const game = createGame(playerNames);
          games[game.id] = game;
          
          // Join the game room
          socket.join(game.id);
          
          // Send the game state back to the client
          io.to(game.id).emit('game_created', game);
          
          console.log(`Game created: ${game.id}`);
        } catch (error) {
          socket.emit('error', { message: (error as Error).message });
        }
      });
      
      // Handle joining an existing game
      socket.on('join_game', ({ gameId, playerName }: { gameId: string, playerName: string }) => {
        const game = games[gameId];
        
        if (!game) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }
        
        // Join the game room
        socket.join(gameId);
        
        // Send the current game state to the new player
        socket.emit('game_state', game);
        
        console.log(`Player ${playerName} joined game: ${gameId}`);
      });
      
      // Handle restarting a game
      socket.on('restart_game', ({ gameId }: { gameId: string }) => {
        const game = games[gameId];
        
        if (!game) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }
        
        // Restart the game
        const newGame = restartGame(game);
        games[gameId] = newGame;
        
        // Broadcast the new game state to all players in the room
        io.to(gameId).emit('game_restarted', newGame);
        
        console.log(`Game restarted: ${gameId}`);
      });
      
      // Handle player disconnection
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        // Additional cleanup could be implemented here if needed
      });
    });
  }
  
  // Return a response to acknowledge the connection
  res.end();
};

export default SocketHandler;

// Disable body parsing, as we're not using it for WebSocket connections
export const config = {
  api: {
    bodyParser: false,
  },
}; 