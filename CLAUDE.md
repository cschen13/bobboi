# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start the Next.js development server with Turbopack (runs on http://localhost:3000)
- `npm run build` - Build the application for production
- `npm start` - Start the production server
- `npm run lint` - Run ESLint for code quality checks

## Project Architecture

This is a real-time multiplayer card game called "Bobboi" built with Next.js, Socket.IO, and TypeScript.

### Core Architecture Components

**Game Logic (`src/lib/`)**
- `types.ts` - Core game data structures (Card, Player, Game, GameState enum)
- `game.ts` - Game creation, deck management, shuffling, and restart logic
- `gameSessionManager.ts` - Server-side game session management and state
- `socketUtils.ts` - Socket-to-player mapping utilities

**Socket.IO Server (`src/pages/api/socket.ts`)**
- Real-time WebSocket server handling all game events
- Game lifecycle: create_game, join_game, start_game, restart_game, end_game
- Player management: leave_game, reconnect_game, disconnect handling
- Events: player_joined, player_left, game_started, game_state_update

**Frontend Components (`src/components/`)**
- `GameBoard.tsx` - Main game interface and card display
- `GameLobby.tsx` - Pre-game player management and game starting
- `Button.tsx` - Reusable UI component

**Key Game States**
- `WAITING_FOR_PLAYERS` - Lobby state, need 2+ players to start
- `PLAYING` - Active game with cards dealt
- `ROUND_ENDED` - Round complete, can restart
- `GAME_ENDED` - Game finished

### Socket.IO Integration

The application uses Socket.IO for real-time communication with:
- Custom Socket.IO server integration in Next.js API routes
- Room-based game sessions (each game has its own room)
- Player-socket mapping for reconnection handling
- Automatic cleanup on player disconnect

### Game Flow

1. Player creates game with initial player list
2. Other players can join using game ID (format: XXXX-XXXX)
3. Game starts when 2+ players present and host initiates
4. Cards are dealt from a shuffled 52-card deck
5. Game can be restarted with player rotation
6. Automatic cleanup when all players leave

### Development Notes

- Uses Next.js Pages Router (not App Router)
- Socket.IO server initializes on first API call to `/api/socket`
- Game sessions are managed in-memory (will reset on server restart)
- Maximum 8 players per game
- TypeScript strict mode enabled
- Tailwind CSS for styling