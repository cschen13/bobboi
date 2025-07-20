import { Game, Player, GameState, Round1Declaration, Round2Ranking, GameAction } from './types';
import { createGame, restartGame, shuffleDeck, createDeck } from './game';

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
   * Start a game by changing state to PLAYING and dealing cards
   * @param gameId The ID of the game to start
   * @returns The updated game or null if not found
   */
  startGame(gameId: string): Game | null {
    const game = this.games.get(gameId);
    if (!game) return null;
    
    // Change state to PLAYING
    game.gameState = GameState.PLAYING;
    
    // Initialize Round 1 state
    game.roundPhase = 'round1';
    game.currentTurnPlayerId = game.players[0]?.id;
    game.round1Declarations = [];
    game.round2Rankings = [];
    game.actionLog = [];
    
    // Create and shuffle a new deck
    const deck = shuffleDeck(createDeck());
    game.deck = deck;
    
    // Deal one card to each player
    for (let i = 0; i < game.players.length && i < deck.length; i++) {
      const card = deck.shift(); // Take from the top of the deck
      if (card) {
        game.players[i].card = card;
      }
    }
    
    console.log(`Cards dealt to ${game.players.length} players in game ${gameId}`);
    game.players.forEach(player => {
      console.log(`Player ${player.name} (${player.id}) got card: ${player.card?.rank} of ${player.card?.suit}`);
    });
    
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

  /**
   * Handle a Round 1 declaration from a player
   * @param gameId The game ID
   * @param playerId The player making the declaration
   * @param seesPair Whether the player sees a pair
   * @returns The updated game or null if invalid
   */
  handleRound1Declaration(gameId: string, playerId: string, seesPair: boolean): Game | null {
    const game = this.games.get(gameId);
    if (!game) return null;

    // Validate game state
    if (game.gameState !== GameState.PLAYING || game.roundPhase !== 'round1') {
      return null;
    }

    // Validate it's the player's turn
    if (game.currentTurnPlayerId !== playerId) {
      return null;
    }

    // Check if player already declared
    if (game.round1Declarations.some(d => d.playerId === playerId)) {
      return null;
    }

    // Find the player
    const player = game.players.find(p => p.id === playerId);
    if (!player) return null;

    // Create the declaration
    const declaration: Round1Declaration = {
      playerId,
      playerName: player.name,
      seesPair,
      timestamp: Date.now()
    };

    // Add to declarations
    game.round1Declarations.push(declaration);

    // Create action log entry
    const action: GameAction = {
      id: `action-${Date.now()}-${playerId}`,
      playerId,
      playerName: player.name,
      type: 'round1_declaration',
      content: seesPair ? 'I see a pair among the other players' : 'I don\'t see any pairs among the other players',
      timestamp: Date.now(),
      round: game.round
    };

    game.actionLog.push(action);

    // Advance to next player's turn
    const currentPlayerIndex = game.players.findIndex(p => p.id === playerId);
    const nextPlayerIndex = (currentPlayerIndex + 1) % game.players.length;
    
    // Check if all players have declared
    if (game.round1Declarations.length >= game.players.length) {
      // Round 1 complete, advance to Round 2
      game.roundPhase = 'round2';
      game.currentTurnPlayerId = game.players[0].id; // Start Round 2 with first player
    } else {
      // Set next player's turn
      game.currentTurnPlayerId = game.players[nextPlayerIndex].id;
    }

    console.log(`Round 1 declaration by ${player.name}: ${seesPair ? 'sees pair' : 'no pair'}`);
    console.log(`Turn advanced to: ${game.currentTurnPlayerId}`);
    console.log(`Round phase: ${game.roundPhase}`);

    return game;
  }

  /**
   * Handle a Round 2 ranking declaration from a player
   * @param gameId The game ID
   * @param playerId The player making the ranking declaration
   * @param perceivedRank The rank the player thinks they are (1 = highest)
   * @returns The updated game or null if invalid
   */
  handleRound2Ranking(gameId: string, playerId: string, perceivedRank: number): Game | null {
    const game = this.games.get(gameId);
    if (!game) return null;

    // Validate game state
    if (game.gameState !== GameState.PLAYING || game.roundPhase !== 'round2') {
      return null;
    }

    // Validate it's the player's turn
    if (game.currentTurnPlayerId !== playerId) {
      return null;
    }

    // Validate perceived rank is within valid range
    if (perceivedRank < 1 || perceivedRank > game.players.length) {
      return null;
    }

    // Check if player already declared in Round 2
    if (game.round2Rankings.some(r => r.playerId === playerId)) {
      return null;
    }

    // Find the player
    const player = game.players.find(p => p.id === playerId);
    if (!player) return null;

    // Create the ranking declaration
    const ranking: Round2Ranking = {
      playerId,
      playerName: player.name,
      perceivedRank,
      timestamp: Date.now()
    };

    // Add to rankings
    game.round2Rankings.push(ranking);

    // Create action log entry
    const action: GameAction = {
      id: `action-${Date.now()}-${playerId}`,
      playerId,
      playerName: player.name,
      type: 'round2_ranking',
      content: `I think I am ${perceivedRank}${getOrdinalSuffix(perceivedRank)} highest`,
      timestamp: Date.now(),
      round: 2
    };

    game.actionLog.push(action);

    // Advance to next player's turn
    const currentPlayerIndex = game.players.findIndex(p => p.id === playerId);
    const nextPlayerIndex = (currentPlayerIndex + 1) % game.players.length;
    
    // Check if all players have declared their ranking
    if (game.round2Rankings.length >= game.players.length) {
      // Round 2 complete, advance to Round 3
      game.roundPhase = 'round3';
      game.currentTurnPlayerId = game.players[0].id; // Start Round 3 with first player
    } else {
      // Set next player's turn
      game.currentTurnPlayerId = game.players[nextPlayerIndex].id;
    }

    console.log(`Round 2 ranking by ${player.name}: ${perceivedRank}${getOrdinalSuffix(perceivedRank)} highest`);
    console.log(`Turn advanced to: ${game.currentTurnPlayerId}`);
    console.log(`Round phase: ${game.roundPhase}`);

    return game;
  }
}

/**
 * Helper function to get ordinal suffix for numbers
 */
function getOrdinalSuffix(n: number): string {
  if (n % 100 >= 11 && n % 100 <= 13) return 'th';
  switch (n % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
} 