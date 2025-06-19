/**
 * Utility functions for managing socket connections and player sessions
 */

// Local storage keys
const GAME_ID_KEY = 'bobboi_game_id';
const PLAYER_ID_KEY = 'bobboi_player_id';
const PLAYER_NAME_KEY = 'bobboi_player_name';

/**
 * Save game session information to local storage
 * @param gameId The game ID
 * @param playerId The player ID
 * @param playerName The player name
 */
export function saveGameSession(gameId: string, playerId: string, playerName: string): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(GAME_ID_KEY, gameId);
  localStorage.setItem(PLAYER_ID_KEY, playerId);
  localStorage.setItem(PLAYER_NAME_KEY, playerName);
}

/**
 * Get saved game session information from local storage
 * @returns Object containing game session information or null if not found
 */
export function getSavedGameSession(): { gameId: string; playerId: string; playerName: string } | null {
  if (typeof window === 'undefined') return null;
  
  const gameId = localStorage.getItem(GAME_ID_KEY);
  const playerId = localStorage.getItem(PLAYER_ID_KEY);
  const playerName = localStorage.getItem(PLAYER_NAME_KEY);
  
  if (gameId && playerId && playerName) {
    return { gameId, playerId, playerName };
  }
  
  return null;
}

/**
 * Clear saved game session information from local storage
 */
export function clearGameSession(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(GAME_ID_KEY);
  localStorage.removeItem(PLAYER_ID_KEY);
  localStorage.removeItem(PLAYER_NAME_KEY);
}

/**
 * Generate a shareable game link
 * @param gameId The game ID
 * @returns A URL that can be shared to join the game
 */
export function generateGameLink(gameId: string): string {
  if (typeof window === 'undefined') return '';
  
  const baseUrl = window.location.origin;
  return `${baseUrl}/join?gameId=${gameId}`;
}

/**
 * Extract game ID from URL query parameters
 * @returns The game ID if present in the URL, otherwise null
 */
export function getGameIdFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('gameId');
}

/**
 * Map socket ID to player information
 * Used to track which socket belongs to which player
 */
export class SocketPlayerMap {
  private socketToPlayer: Map<string, { playerId: string; gameId: string }>;
  
  constructor() {
    this.socketToPlayer = new Map();
  }
  
  /**
   * Associate a socket with a player
   * @param socketId The socket ID
   * @param playerId The player ID
   * @param gameId The game ID
   */
  addMapping(socketId: string, playerId: string, gameId: string): void {
    this.socketToPlayer.set(socketId, { playerId, gameId });
  }
  
  /**
   * Get player information associated with a socket
   * @param socketId The socket ID
   * @returns The player information or null if not found
   */
  getPlayerInfo(socketId: string): { playerId: string; gameId: string } | null {
    return this.socketToPlayer.get(socketId) || null;
  }
  
  /**
   * Remove a socket mapping
   * @param socketId The socket ID to remove
   */
  removeMapping(socketId: string): void {
    this.socketToPlayer.delete(socketId);
  }
} 