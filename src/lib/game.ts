import { Card, Game, Player, GameState } from './types';

/**
 * Creates a standard 52-card deck
 * @returns Array of Card objects
 */
export function createDeck(): Card[] {
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  
  const deck: Card[] = [];
  
  for (const suit of suits) {
    for (let i = 0; i < ranks.length; i++) {
      deck.push({
        suit,
        rank: ranks[i],
        value: i + 2, // 2 has value 2, A has value 14
      });
    }
  }
  
  return deck;
}

/**
 * Shuffles a deck of cards using the Fisher-Yates algorithm
 * @param deck Array of Card objects to shuffle
 * @returns Shuffled array of Card objects
 */
export function shuffleDeck(deck: Card[]): Card[] {
  // Create a copy of the deck to avoid mutating the original
  const shuffled = [...deck];
  
  // Fisher-Yates shuffle algorithm
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

/**
 * Generates a unique game ID
 * @returns A string ID
 */
function generateGameId(): string {
  // Generate a random alphanumeric string (uppercase letters and numbers only)
  // Format: XXXX-XXXX (where X is a letter or number)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  
  // Generate first part (4 characters)
  for (let i = 0; i < 4; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Add separator
  id += '-';
  
  // Generate second part (4 characters)
  for (let i = 0; i < 4; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return id;
}

/**
 * Creates a new game with the given player names
 * @param playerNames Array of player names
 * @returns A new Game object
 */
export function createGame(playerNames: string[]): Game {
  if (playerNames.length < 1) {
    throw new Error('At least 1 player is required');
  }
  
  // Create players with null cards initially
  const players: Player[] = playerNames.map((name, index) => ({
    id: `player-${index + 1}`,
    name,
    card: null
  }));
  
  // Create and shuffle the deck
  const deck = shuffleDeck(createDeck());
  
  // Set the initial game state based on player count
  const initialGameState = playerNames.length >= 2 ? GameState.PLAYING : GameState.WAITING_FOR_PLAYERS;
  
  // Only deal cards if we're in PLAYING state (2+ players)
  if (initialGameState === GameState.PLAYING) {
    // Deal one card to each player
    for (let i = 0; i < players.length && i < deck.length; i++) {
      const card = deck.shift(); // Take from the top of the deck
      if (card) {
        // Use type assertion to assign the card
        (players[i] as any).card = card;
      }
    }
  }
  
  // Create the game object
  const game: Game = {
    id: generateGameId(),
    players,
    deck,
    round: 1,
    turn: 0, // First player starts
    gameState: initialGameState
  };
  
  return game;
}

/**
 * Restarts the game with the same players, rotating the starting player
 * @param game Current game object
 * @returns A new Game object with reset state
 */
export function restartGame(game: Game): Game {
  // Create and shuffle a new deck
  const deck = shuffleDeck(createDeck());
  
  // Reset player cards
  const players = game.players.map(player => ({
    ...player,
    card: null
  } as Player));
  
  // Calculate the new starting player (rotate)
  const newStartingPlayerIndex = (game.turn + 1) % game.players.length;
  
  // Deal one card to each player
  for (let i = 0; i < players.length && i < deck.length; i++) {
    const card = deck.shift(); // Take from the top of the deck
    if (card) {
      players[i].card = card;
    }
  }
  
  // Create the new game object
  const newGame: Game = {
    ...game,
    players,
    deck,
    round: game.round + 1,
    turn: newStartingPlayerIndex,
    gameState: GameState.PLAYING
  };
  
  return newGame;
} 