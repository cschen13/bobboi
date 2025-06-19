import { Game, Player, GameState } from './types';
import { createGame, restartGame } from './game';

/**
 * GameSessionManager class to manage all active game sessions in memory
 */
export class GameSessionManager {
  private games: Map<string, Game>;
  private playerToGameMap: Map<string, string>;
  
  constructor() {
    this.games = new Map<string, Game>();
    this.playerToGameMap = new Map<string, string>();
  }
  
  /**
   * Create a new game with the given player names
   * @param playerNames Array of player names
   * @returns The newly created game
   */
  createGame(playerNames: string[]): Game {
    const game = createGame(playerNames);
    this.games.set(game.id, game);
    
    // Map each player to this game
    game.players.forEach(player => {
      this.playerToGameMap.set(player.id, game.id);
    });
    
    return game;
  }
  
  /**
   * Get a game by its ID
   * @param gameId The game ID
   * @returns The game or null if not found
   */
  getGame(gameId: string): Game | null {
    return this.games.get(gameId) || null;
  }
  
  /**
   * Get all active games
   * @returns Array of all games
   */
  getAllGames(): Game[] {
    return Array.from(this.games.values());
  }
  
  /**
   * Restart an existing game
   * @param gameId The ID of the game to restart
   * @returns The restarted game or null if not found
   */
  restartGame(gameId: string): Game | null {
    const game = this.games.get(gameId);
    if (!game) return null;
    
    const newGame = restartGame(game);
    this.games.set(gameId, newGame);
    
    return newGame;
  }
  
  /**
   * Add a player to an existing game
   * @param gameId The ID of the game to join
   * @param playerName The name of the player joining
   * @returns The updated game or null if not found
   */
  addPlayerToGame(gameId: string, playerName: string): Game | null {
    const game = this.games.get(gameId);
    if (!game) return null;
    
    // Create a new player
    const newPlayer: Player = {
      id: `player-${game.players.length + 1}`,
      name: playerName,
      card: null
    };
    
    // Add player to the game
    game.players.push(newPlayer);
    
    // Map the player to this game
    this.playerToGameMap.set(newPlayer.id, gameId);
    
    return game;
  }
  
  /**
   * Remove a player from a game
   * @param playerId The ID of the player to remove
   * @returns The updated game or null if not found
   */
  removePlayerFromGame(playerId: string): Game | null {
    const gameId = this.playerToGameMap.get(playerId);
    if (!gameId) return null;
    
    const game = this.games.get(gameId);
    if (!game) return null;
    
    // Remove the player from the game
    game.players = game.players.filter(player => player.id !== playerId);
    
    // Remove the player from the mapping
    this.playerToGameMap.delete(playerId);
    
    // If no players left, remove the game
    if (game.players.length === 0) {
      this.games.delete(gameId);
      return null;
    }
    
    return game;
  }
  
  /**
   * End a game session
   * @param gameId The ID of the game to end
   * @returns True if the game was ended, false if not found
   */
  endGame(gameId: string): boolean {
    const game = this.games.get(gameId);
    if (!game) return false;
    
    // Remove all player mappings for this game
    game.players.forEach(player => {
      this.playerToGameMap.delete(player.id);
    });
    
    // Remove the game
    this.games.delete(gameId);
    
    return true;
  }
  
  /**
   * Update the game state
   * @param gameId The ID of the game to update
   * @param gameState The new game state
   * @returns The updated game or null if not found
   */
  updateGameState(gameId: string, gameState: GameState): Game | null {
    const game = this.games.get(gameId);
    if (!game) return null;
    
    game.gameState = gameState;
    return game;
  }
  
  /**
   * Get all games a player is part of
   * @param playerId The player ID
   * @returns Array of games the player is part of
   */
  getPlayerGames(playerId: string): Game[] {
    const gameId = this.playerToGameMap.get(playerId);
    if (!gameId) return [];
    
    const game = this.games.get(gameId);
    return game ? [game] : [];
  }
  
  /**
   * Get the number of active games
   * @returns The number of active games
   */
  getActiveGameCount(): number {
    return this.games.size;
  }
  
  /**
   * Check if a game exists
   * @param gameId The game ID to check
   * @returns True if the game exists, false otherwise
   */
  gameExists(gameId: string): boolean {
    return this.games.has(gameId);
  }
} 