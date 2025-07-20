import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import type { NextApiRequest, NextApiResponse } from 'next';
import { Round1DeclarationPayload, Round2RankingPayload, Round3GuessPayload } from '../../lib/types';
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
  if (res.socket.server.io) {
    console.log('Socket is already running');
    res.end();
    return;
  }

  console.log('Initializing Socket.IO server...');
  
  // Create a new Socket.IO server instance with proper configuration
  const io = new SocketIOServer(res.socket.server, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      allowedHeaders: ['content-type'],
    },
    // Explicitly allow WebSocket transport
    transports: ['polling', 'websocket'],
  });
  
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
    
    // Add a simple ping handler for testing
    socket.on('ping', (data, callback) => {
      console.log('Received ping:', data);
      callback({ pong: true, received: data, time: new Date().toISOString() });
    });
    
    // Handle creating a new game
    socket.on('create_game', ({ playerNames }: { playerNames: string[] }) => {
      try {
        // Validate player names
        if (!playerNames || playerNames.length === 0) {
          socket.emit('error', { message: 'At least one player name is required' });
          return;
        }
        
        // Validate each player name
        for (const name of playerNames) {
          if (!name || name.trim() === '') {
            socket.emit('error', { message: 'Player names cannot be empty' });
            return;
          }
        }
        
        // Create the game
        const game = gameSessionManager.createGame(playerNames);
        
        // Create a dedicated room for this game
        socket.join(game.id);
        
        // Map this socket to the first player
        const firstPlayer = game.players[0];
        socketPlayerMap.addMapping(socket.id, firstPlayer.id, game.id);
        
        // Send the game state back to the client
        socket.emit('game_created', {
          game,
          playerId: firstPlayer.id,
          gameId: game.id
        });
        
        console.log(`Game created: ${game.id} with players: ${playerNames.join(', ')}`);
        console.log(`Active games: ${gameSessionManager.getActiveGameCount()}`);
      } catch (error) {
        socket.emit('error', { message: (error as Error).message });
      }
    });
    
    // Handle joining an existing game
    socket.on('join_game', ({ gameId, playerName }: { gameId: string, playerName: string }) => {
      // Validate game ID
      if (!gameId || gameId.trim() === '') {
        socket.emit('error', { message: 'Game ID is required' });
        return;
      }
      
      // Validate player name
      if (!playerName || playerName.trim() === '') {
        socket.emit('error', { message: 'Player name is required' });
        return;
      }
      
      // Check if game exists
      if (!gameSessionManager.gameExists(gameId)) {
        socket.emit('error', { message: `Game with ID ${gameId} not found` });
        return;
      }
      
      // Get the game to check player count
      const existingGame = gameSessionManager.getGame(gameId);
      if (!existingGame) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }
      
      // Check if the game already has too many players (optional limit)
      const MAX_PLAYERS = 8; // Set a reasonable limit
      if (existingGame.players.length >= MAX_PLAYERS) {
        socket.emit('error', { message: `Game is full (maximum ${MAX_PLAYERS} players)` });
        return;
      }
      
      // Check if player name is already taken in this game
      if (existingGame.players.some(p => p.name === playerName)) {
        socket.emit('error', { message: 'Player name is already taken in this game' });
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
      
      // Send confirmation to the joining player
      socket.emit('game_joined', {
        game: updatedGame,
        playerId: newPlayer.id,
        gameId
      });
      
      // Notify other players in the room
      socket.to(gameId).emit('player_joined', {
        game: updatedGame,
        playerName,
        playerId: newPlayer.id
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
      socket.emit('reconnect_success', { game, playerId });
      
      console.log(`Player ${playerId} reconnected to game: ${gameId}`);
    });
    
    // Handle starting a game
    socket.on('start_game', ({ gameId }: { gameId: string }) => {
      // Check if game exists
      if (!gameSessionManager.gameExists(gameId)) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }
      
      // Get the game
      const game = gameSessionManager.getGame(gameId);
      if (!game) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }
      
      // Check if there are at least 2 players
      if (game.players.length < 2) {
        socket.emit('error', { message: 'Need at least 2 players to start the game' });
        return;
      }
      
      // Check if the requesting player is in the game
      const playerInfo = socketPlayerMap.getPlayerInfo(socket.id);
      if (!playerInfo) {
        socket.emit('error', { message: 'Player information not found' });
        return;
      }
      const isPlayerInGame = game.players.some(p => p.id === playerInfo.playerId);
      if (!isPlayerInGame) {
        socket.emit('error', { message: 'You must be a player in the game to start it' });
        return;
      }
      
      // Start the game (change state to PLAYING and deal cards)
      const updatedGame = gameSessionManager.startGame(gameId);
      if (!updatedGame) {
        socket.emit('error', { message: 'Failed to start game' });
        return;
      }
      
      // Broadcast to all players that the game has started
      io.to(gameId).emit('game_started', { game: updatedGame });
      
      // Also broadcast the initial game state update
      io.to(gameId).emit('game_state_update', updatedGame);
      
      console.log(`Game started: ${gameId}`);
    });
    
    // Handle Round 1 declarations
    socket.on('declare_round1', ({ gameId, playerId, seesPair }: Round1DeclarationPayload) => {
      console.log(`Round 1 declaration from ${playerId} in game ${gameId}: ${seesPair ? 'sees pair' : 'no pair'}`);
      
      // Validate game exists
      if (!gameSessionManager.gameExists(gameId)) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }
      
      // Validate player is in game and it's their turn
      const playerInfo = socketPlayerMap.getPlayerInfo(socket.id);
      if (!playerInfo || playerInfo.playerId !== playerId || playerInfo.gameId !== gameId) {
        socket.emit('error', { message: 'Invalid player or not your turn' });
        return;
      }
      
      // Process the declaration
      const updatedGame = gameSessionManager.handleRound1Declaration(gameId, playerId, seesPair);
      
      if (!updatedGame) {
        socket.emit('error', { message: 'Invalid declaration or not your turn' });
        return;
      }
      
      // Broadcast the updated game state to all players in the room
      io.to(gameId).emit('round1_declaration_made', {
        game: updatedGame,
        declaration: {
          playerId,
          playerName: updatedGame.players.find(p => p.id === playerId)?.name,
          seesPair,
          timestamp: Date.now()
        }
      });
      
      // Also send general game state update
      io.to(gameId).emit('game_state_update', updatedGame);
      
      console.log(`Round 1 declaration processed. Round phase: ${updatedGame.roundPhase}, Current turn: ${updatedGame.currentTurnPlayerId}`);
    });
    
    // Handle Round 2 ranking declarations
    socket.on('declare_round2', ({ gameId, playerId, perceivedRank }: Round2RankingPayload) => {
      console.log(`Round 2 ranking from ${playerId} in game ${gameId}: ${perceivedRank}`);
      
      // Validate game exists
      if (!gameSessionManager.gameExists(gameId)) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }
      
      // Validate player is in game and it's their turn
      const playerInfo = socketPlayerMap.getPlayerInfo(socket.id);
      if (!playerInfo || playerInfo.playerId !== playerId || playerInfo.gameId !== gameId) {
        socket.emit('error', { message: 'Invalid player or not your turn' });
        return;
      }
      
      // Process the ranking declaration
      const updatedGame = gameSessionManager.handleRound2Ranking(gameId, playerId, perceivedRank);
      
      if (!updatedGame) {
        socket.emit('error', { message: 'Invalid ranking declaration or not your turn' });
        return;
      }
      
      // Broadcast the updated game state to all players in the room
      io.to(gameId).emit('round2_ranking_made', {
        game: updatedGame,
        ranking: {
          playerId,
          playerName: updatedGame.players.find(p => p.id === playerId)?.name,
          perceivedRank,
          timestamp: Date.now()
        }
      });
      
      // Also send general game state update
      io.to(gameId).emit('game_state_update', updatedGame);
      
      console.log(`Round 2 ranking processed. Round phase: ${updatedGame.roundPhase}, Current turn: ${updatedGame.currentTurnPlayerId}`);
    });
    
    // Handle Round 3 guess declarations
    socket.on('declare_round3', ({ gameId, playerId, guessedRank }: Round3GuessPayload) => {
      console.log(`Round 3 guess from ${playerId} in game ${gameId}: ${guessedRank}`);
      
      // Validate game exists
      if (!gameSessionManager.gameExists(gameId)) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }
      
      // Validate player is in game and it's their turn
      const playerInfo = socketPlayerMap.getPlayerInfo(socket.id);
      if (!playerInfo || playerInfo.playerId !== playerId || playerInfo.gameId !== gameId) {
        socket.emit('error', { message: 'Invalid player or not your turn' });
        return;
      }
      
      // Process the guess
      const updatedGame = gameSessionManager.handleRound3Guess(gameId, playerId, guessedRank);
      
      if (!updatedGame) {
        socket.emit('error', { message: 'Invalid guess or not your turn' });
        return;
      }
      
      // Get the guess that was just made
      const latestGuess = updatedGame.round3Guesses[updatedGame.round3Guesses.length - 1];
      
      // Broadcast the updated game state to all players in the room
      io.to(gameId).emit('round3_guess_made', {
        game: updatedGame,
        guess: {
          playerId,
          playerName: updatedGame.players.find(p => p.id === playerId)?.name,
          guessedRank,
          actualRank: latestGuess.actualRank,
          isCorrect: latestGuess.isCorrect,
          timestamp: Date.now()
        }
      });
      
      // Also send general game state update
      io.to(gameId).emit('game_state_update', updatedGame);
      
      console.log(`Round 3 guess processed. Round phase: ${updatedGame.roundPhase}, Current turn: ${updatedGame.currentTurnPlayerId}`);
    });
  });
  
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