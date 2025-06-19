/**
 * Core game data structures for Bobboi
 */

/**
 * Represents a playing card
 */
export interface Card {
  suit: string;
  rank: string;
  value: number;
}

/**
 * Represents a player in the game
 */
export interface Player {
  id: string;
  name: string;
  card: Card | null;
}

/**
 * Represents the game state
 */
export interface Game {
  id: string;
  players: Player[];
  deck: Card[];
  round: number;
  turn: number;
  gameState: GameState;
}

/**
 * Enum for the different states of the game
 */
export enum GameState {
  WAITING_FOR_PLAYERS = 'WAITING_FOR_PLAYERS',
  PLAYING = 'PLAYING',
  ROUND_ENDED = 'ROUND_ENDED',
  GAME_ENDED = 'GAME_ENDED'
} 