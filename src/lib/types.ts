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
 * Represents a Round 1 declaration by a player
 */
export interface Round1Declaration {
  playerId: string;
  playerName: string;
  seesPair: boolean;
  timestamp: number;
}

/**
 * Represents a Round 2 ranking declaration by a player
 */
export interface Round2Ranking {
  playerId: string;
  playerName: string;
  perceivedRank: number;
  timestamp: number;
}

/**
 * Represents an action taken during the game
 */
export interface GameAction {
  id: string;
  playerId: string;
  playerName: string;
  type: 'round1_declaration' | 'round2_ranking' | 'round3_guess';
  content: string;
  timestamp: number;
  round: number;
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
  currentTurnPlayerId?: string;
  round1Declarations: Round1Declaration[];
  round2Rankings: Round2Ranking[];
  actionLog: GameAction[];
  roundPhase: 'waiting' | 'round1' | 'round2' | 'round3' | 'revealing' | 'complete';
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

/**
 * Socket event payload for Round 1 declarations
 */
export interface Round1DeclarationPayload {
  gameId: string;
  playerId: string;
  seesPair: boolean;
}

/**
 * Socket event payload for Round 2 rankings
 */
export interface Round2RankingPayload {
  gameId: string;
  playerId: string;
  perceivedRank: number;
} 