import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import type { NextApiRequest, NextApiResponse } from 'next';
import { Game, GameState } from '../../lib/types';
import { GameSessionManager } from '../../lib/gameSessionManager';
import { SocketPlayerMap } from '../../lib/socketUtils';

// Define a custom NextApiResponse type that includes Socket.IO
type SocketIONextApiResponse = NextApiResponse & {
  socket: {
    server: HTTPServer & {
      io?: SocketIOServer;
      gameSessionManager?: GameSessionManager;
      socketPlayerMap?: SocketPlayerMap;
    };
  };
};

const SocketHandler = (req: NextApiRequest, res: SocketIONextApiResponse) => {
  // Initialize Socket.IO server if it doesn't exist yet
  if (!res.socket.server.io) {
    console.log('Initializing Socket.IO server...');
    
    // Create a new Socket.IO server instance
    const io = new SocketIOServer(res.socket.server);
    res.socket.server.io = io;
    
    // Create a new GameSessionManager instance
    const gameSessionManager = new GameSessionManager();
    res.socket.server.gameSessionManager = gameSessionManager;
    
    // Create a new SocketPlayerMap instance
    const socketPlayerMap = new SocketPlayerMap();
    res.socket.server.socketPlayerMap = socketPlayerMap;
    
    // Socket.IO event handlers
    io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);
      
      // Handle creating a new game
      socket.on('create_game', ({ playerNames }: { playerNames: string[] }) => {
        try {
          const game = gameSessionManager.createGame(playerNames);
          
          // Join the game room
          socket.join(game.id);
          
          // Map this socket to the first player
          const firstPlayer = game.players[0];
          socketPlayerMap.addMapping(socket.id, firstPlayer.id, game.id);
          
          // Send the game state back to the client
          io.to(game.id).emit('game_created', game);
          
          console.log(`Game created: ${game.id} with players: ${playerNames.join(', ')}`);
          console.log(`Active games: ${gameSessionManager.getActiveGameCount()}`);
        } catch (error) {
          socket.emit('error', { message: (error as Error).message });
        }
      });
      
      // Handle joining an existing game
      socket.on('join_game', ({ gameId, playerName }: { gameId: string, playerName: string }) => {
        if (!gameSessionManager.gameExists(gameId)) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }
        
        // Add player to the game
        const updatedGame = gameSessionManager.addPlayerToGame(gameId, playerName);
        
        if (!updatedGame) {
          socket.emit('error', { message: 'Failed to join game' });
          return;
        }
        
        // Get the newly added player (last in the array)
        const newPlayer = updatedGame.players[updatedGame.players.length - 1];
        
        // Map this socket to the new player
        socketPlayerMap.addMapping(socket.id, newPlayer.id, gameId);
        
        // Join the game room
        socket.join(gameId);
        
        // Send the current game state to all players in the room
        io.to(gameId).emit('player_joined', {
          game: updatedGame,
          playerName
        });
        
        console.log(`Player ${playerName} joined game: ${gameId}`);
      });
      
      // Handle restarting a game
      socket.on('restart_game', ({ gameId }: { gameId: string }) => {
        if (!gameSessionManager.gameExists(gameId)) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }
        
        // Restart the game
        const newGame = gameSessionManager.restartGame(gameId);
        
        if (!newGame) {
          socket.emit('error', { message: 'Failed to restart game' });
          return;
        }
        
        // Broadcast the new game state to all players in the room
        io.to(gameId).emit('game_restarted', newGame);
        
        console.log(`Game restarted: ${gameId}`);
      });
      
      // Handle ending a game
      socket.on('end_game', ({ gameId }: { gameId: string }) => {
        if (!gameSessionManager.gameExists(gameId)) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }
        
        // Get the game before ending it
        const game = gameSessionManager.getGame(gameId);
        if (!game) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }
        
        // Remove socket mappings for all players in this game
        io.sockets.sockets.forEach((s) => {
          const playerInfo = socketPlayerMap.getPlayerInfo(s.id);
          if (playerInfo && playerInfo.gameId === gameId) {
            socketPlayerMap.removeMapping(s.id);
          }
        });
        
        // End the game
        const success = gameSessionManager.endGame(gameId);
        
        if (success) {
          // Notify all players in the room that the game has ended
          io.to(gameId).emit('game_ended', { gameId });
          
          // Make all sockets leave the room
          io.in(gameId).socketsLeave(gameId);
          
          console.log(`Game ended: ${gameId}`);
          console.log(`Active games: ${gameSessionManager.getActiveGameCount()}`);
        } else {
          socket.emit('error', { message: 'Failed to end game' });
        }
      });
      
      // Handle player leaving a game
      socket.on('leave_game', ({ gameId, playerId }: { gameId: string, playerId: string }) => {
        if (!gameSessionManager.gameExists(gameId)) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }
        
        // Get the game before removing the player
        const game = gameSessionManager.getGame(gameId);
        if (!game) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }
        
        // Find the player name before removing
        const playerName = game.players.find(p => p.id === playerId)?.name;
        
        // Remove the player from the game
        const updatedGame = gameSessionManager.removePlayerFromGame(playerId);
        
        // Remove the socket mapping
        socketPlayerMap.removeMapping(socket.id);
        
        // Leave the game room
        socket.leave(gameId);
        
        if (updatedGame) {
          // Notify remaining players
          io.to(gameId).emit('player_left', {
            game: updatedGame,
            playerId,
            playerName
          });
          
          console.log(`Player ${playerName} (${playerId}) left game: ${gameId}`);
        } else {
          // Game was deleted because no players left
          console.log(`Game ${gameId} ended because all players left`);
          console.log(`Active games: ${gameSessionManager.getActiveGameCount()}`);
        }
      });
      
      // Handle player disconnection
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        
        // Get player info for this socket
        const playerInfo = socketPlayerMap.getPlayerInfo(socket.id);
        
        if (playerInfo) {
          const { playerId, gameId } = playerInfo;
          
          // Get the game
          const game = gameSessionManager.getGame(gameId);
          if (game) {
            // Find the player name
            const playerName = game.players.find(p => p.id === playerId)?.name;
            
            // Remove the player from the game
            const updatedGame = gameSessionManager.removePlayerFromGame(playerId);
            
            // Remove the socket mapping
            socketPlayerMap.removeMapping(socket.id);
            
            if (updatedGame) {
              // Notify remaining players
              io.to(gameId).emit('player_left', {
                game: updatedGame,
                playerId,
                playerName
              });
              
              console.log(`Player ${playerName} (${playerId}) disconnected from game: ${gameId}`);
            } else {
              // Game was deleted because no players left
              console.log(`Game ${gameId} ended because all players left`);
              console.log(`Active games: ${gameSessionManager.getActiveGameCount()}`);
            }
          }
        }
      });
      
      // Handle getting all active games (for admin or debugging purposes)
      socket.on('get_all_games', (callback) => {
        const games = gameSessionManager.getAllGames();
        callback({
          games,
          count: games.length
        });
      });
      
      // Handle reconnecting to a game
      socket.on('reconnect_game', ({ gameId, playerId }: { gameId: string, playerId: string }) => {
        const game = gameSessionManager.getGame(gameId);
        
        if (!game) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }
        
        // Check if player exists in the game
        const playerExists = game.players.some(p => p.id === playerId);
        
        if (!playerExists) {
          socket.emit('error', { message: 'Player not found in this game' });
          return;
        }
        
        // Map this socket to the player
        socketPlayerMap.addMapping(socket.id, playerId, gameId);
        
        // Join the game room
        socket.join(gameId);
        
        // Send the current game state to the reconnected player
        socket.emit('game_state', game);
        
        console.log(`Player ${playerId} reconnected to game: ${gameId}`);
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