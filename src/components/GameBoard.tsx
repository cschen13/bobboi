import React, { useState } from 'react';

// Updated types for player and props
type Player = {
  id: string;
  name: string;
  card: string; // e.g., 'A', '2', ..., 'K'
};

type RoundState =
  | { round: 1 }
  | { round: 2; totalPlayers: number }
  | { round: 3 };

type ActionLogEntry = {
  playerId: string;
  playerName: string;
  round: number;
  type: 'pair' | 'perceivedRank' | 'guess';
  value: any;
};

type GameBoardProps = {
  players: Player[];
  currentRound: number;
  currentTurnPlayerId: string;
  actionLog: ActionLogEntry[];
  selfPlayerId: string;
  roundState: RoundState;
  onAction: (action: any) => void; // Replace 'any' with specific action types as needed
};

const GameBoard: React.FC<GameBoardProps> = ({
  players,
  currentRound,
  currentTurnPlayerId,
  actionLog,
  selfPlayerId,
  roundState,
  onAction,
}) => {
  // Local state for round 2 and 3 inputs
  const [perceivedRank, setPerceivedRank] = useState('1');
  const [guessedRank, setGuessedRank] = useState('');

  const isMyTurn = selfPlayerId === currentTurnPlayerId;

  // Helper for round 2 options
  const getRankOptions = (total: number) =>
    Array.from({ length: total }, (_, i) => `${i + 1}`);

  // Action UI rendering
  let actionUI = null;
  if (roundState.round === 1) {
    actionUI = (
      <div className="flex gap-2">
        <button
          className="bg-green-600 text-white rounded px-4 py-2 disabled:opacity-50"
          disabled={!isMyTurn}
          onClick={() => isMyTurn && onAction({ type: 'pair', value: true })}
        >
          Yes
        </button>
        <button
          className="bg-red-600 text-white rounded px-4 py-2 disabled:opacity-50"
          disabled={!isMyTurn}
          onClick={() => isMyTurn && onAction({ type: 'pair', value: false })}
        >
          No
        </button>
      </div>
    );
  } else if (roundState.round === 2) {
    const total = roundState.totalPlayers;
    actionUI = (
      <form
        className="flex gap-2 items-center"
        onSubmit={e => {
          e.preventDefault();
          if (isMyTurn) onAction({ type: 'perceivedRank', value: perceivedRank });
        }}
      >
        <label htmlFor="perceived-rank" className="text-sm">Rank:</label>
        <select
          id="perceived-rank"
          className="rounded border px-2 py-1"
          value={perceivedRank}
          disabled={!isMyTurn}
          onChange={e => setPerceivedRank(e.target.value)}
        >
          {getRankOptions(total).map(opt => (
            <option key={opt} value={opt}>{opt}{getOrdinalSuffix(Number(opt))}</option>
          ))}
        </select>
        <button
          type="submit"
          className="bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-50"
          disabled={!isMyTurn}
        >
          Submit
        </button>
      </form>
    );
  } else if (roundState.round === 3) {
    actionUI = (
      <form
        className="flex gap-2 items-center"
        onSubmit={e => {
          e.preventDefault();
          if (isMyTurn && guessedRank.trim()) onAction({ type: 'guess', value: guessedRank.trim().toUpperCase() });
        }}
      >
        <label htmlFor="guess-rank" className="text-sm">Your Guess:</label>
        <input
          id="guess-rank"
          className="rounded border px-2 py-1 w-16 text-center uppercase"
          type="text"
          maxLength={2}
          placeholder="A, 2...K"
          value={guessedRank}
          disabled={!isMyTurn}
          onChange={e => setGuessedRank(e.target.value)}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-50"
          disabled={!isMyTurn || !guessedRank.trim()}
        >
          Submit
        </button>
      </form>
    );
  }

  // Helper for ordinal suffix
  function getOrdinalSuffix(n: number) {
    if (n % 100 >= 11 && n % 100 <= 13) return 'th';
    switch (n % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  }

  return (
    <div className="flex flex-col min-h-screen w-full max-w-md mx-auto bg-white dark:bg-gray-900 p-2 sm:p-4">
      {/* Game Status */}
      <section className="mb-4">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold">Round: {currentRound}</span>
          <span className="text-sm text-gray-500 dark:text-gray-300">Current Turn: {players.find(p => p.id === currentTurnPlayerId)?.name || '—'}</span>
        </div>
      </section>

      {/* Player Hands */}
      <section className="mb-4">
        <h2 className="text-md font-semibold mb-2">Player Hands</h2>
        <div className="flex flex-wrap gap-2 justify-center">
          {players.map((player) => {
            const isCurrentTurn = player.id === currentTurnPlayerId;
            return (
              <div
                key={player.id}
                className={`flex flex-col items-center rounded p-2 min-w-[60px] bg-gray-100 dark:bg-gray-800 relative transition-all duration-200
                  ${isCurrentTurn ? 'border-2 border-blue-500 shadow-lg bg-blue-50 dark:bg-blue-900' : ''}`}
                aria-current={isCurrentTurn ? 'true' : undefined}
              >
                <span className="text-xs font-medium mb-1 flex items-center gap-1">
                  {player.name}
                  {isCurrentTurn && (
                    <span title="Current Turn" className="inline-block align-middle text-blue-500">★</span>
                  )}
                </span>
                <div className="w-10 h-14 bg-gray-300 dark:bg-gray-700 rounded shadow-inner flex items-center justify-center">
                  <span className="text-lg text-gray-500">
                    {player.id === selfPlayerId ? '?' : player.card}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Action UI */}
      <section className="mb-4">
        <h2 className="text-md font-semibold mb-2">Your Action</h2>
        <div className="flex flex-col gap-2">
          {actionUI}
        </div>
      </section>

      {/* Action Log */}
      <section className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-800 rounded p-2">
        <h2 className="text-md font-semibold mb-2">Action Log</h2>
        <ul className="space-y-1 text-sm">
          {actionLog.length === 0 ? (
            <li className="text-gray-400">No actions yet.</li>
          ) : (
            actionLog.map((entry, idx) => (
              <li key={idx} className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                <span className="font-semibold">{entry.playerName}</span>
                <span className="text-xs text-gray-400">(Round {entry.round})</span>
                {entry.type === 'pair' && (
                  <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400">
                    <span title="Pair Declaration">🔗</span>
                    <span>{entry.value ? 'saw a pair' : 'did not see a pair'}</span>
                  </span>
                )}
                {entry.type === 'perceivedRank' && (
                  <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                    <span title="Perceived Rank">🏅</span>
                    <span>declared {entry.value}{getOrdinalSuffix(Number(entry.value))} highest</span>
                  </span>
                )}
                {entry.type === 'guess' && (
                  <span className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400">
                    <span title="Guess">🎴</span>
                    <span>guessed <span className="font-mono font-bold">{entry.value}</span></span>
                  </span>
                )}
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
};

export default GameBoard; 