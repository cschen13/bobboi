import React, { useState } from 'react';

// Updated types for player and props
type Player = {
  id: string;
  name: string;
  card: string; // e.g., 'A', '2', ..., 'K'
};

export type RoundState =
  | { round: 1 }
  | { round: 2; totalPlayers: number }
  | { round: 3 };

type ActionLogEntry = {
  playerId: string;
  playerName: string;
  round: number;
  type: 'pair' | 'perceivedRank' | 'guess';
  value: boolean | string | number;
};

type GameBoardProps = {
  players: Player[];
  currentRound: number;
  currentTurnPlayerId: string;
  actionLog: ActionLogEntry[];
  selfPlayerId: string;
  roundState: RoundState;
  onAction: (action: { type: string; value: boolean | string | number }) => void;
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
      <div className="flex gap-3">
        <button
          className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-6 py-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          disabled={!isMyTurn}
          onClick={() => isMyTurn && onAction({ type: 'pair', value: true })}
        >
          Yes
        </button>
        <button
          className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-6 py-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
        className="flex gap-3 items-center flex-wrap"
        onSubmit={e => {
          e.preventDefault();
          if (isMyTurn) onAction({ type: 'perceivedRank', value: perceivedRank });
        }}
      >
        <div className="flex items-center gap-2">
          <label htmlFor="perceived-rank" className="text-sm font-medium text-[#651c1d]">Rank:</label>
          <select
            id="perceived-rank"
            className="rounded-lg border border-[#f2bf27]/50 px-3 py-2 text-[#651c1d] focus:outline-none focus:ring-2 focus:ring-[#f2bf27]"
            value={perceivedRank}
            disabled={!isMyTurn}
            onChange={e => setPerceivedRank(e.target.value)}
          >
            {getRankOptions(total).map(opt => (
              <option key={opt} value={opt}>{opt}{getOrdinalSuffix(Number(opt))}</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="bg-[#651c1d] hover:bg-[#7a2324] rounded-lg px-6 py-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          style={{ color: '#ffffff' }}
          disabled={!isMyTurn}
        >
          Submit
        </button>
      </form>
    );
  } else if (roundState.round === 3) {
    const cardRanks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    
    actionUI = (
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-[#651c1d] block mb-2">Select your card rank:</label>
          <div className="grid grid-cols-7 gap-1">
            {cardRanks.map(rank => (
              <button
                key={rank}
                type="button"
                disabled={!isMyTurn}
                onClick={() => {
                  if (isMyTurn) {
                    onAction({ type: 'guess', value: rank });
                  }
                }}
                className={`w-8 h-8 rounded border-2 font-bold text-xs transition-all duration-200 ${
                  !isMyTurn 
                    ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                    : 'bg-white border-[#f2bf27] text-[#651c1d] hover:bg-[#f2bf27]/20 hover:border-[#651c1d] hover:shadow-sm'
                }`}
              >
                {rank}
              </button>
            ))}
          </div>
        </div>
      </div>
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
    <div className="bg-white rounded-xl shadow-xl overflow-hidden h-full">
      {/* Header */}
      <div className="p-4 border-b border-[#f2bf27] bg-[#f2bf27]">
        <div className="flex justify-between items-center">
          <h2 className="font-bold text-lg text-[#651c1d]">Round {currentRound}</h2>
          <span className="text-sm text-[#651c1d] font-medium">
            Turn: {players.find(p => p.id === currentTurnPlayerId)?.name || '—'}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-6 bg-[#fffaf0] h-full">
        {/* Player Hands */}
        <section>
          <h3 className="text-md font-semibold mb-3 text-[#651c1d]">Player Cards</h3>
          <div className="grid grid-cols-2 gap-3">
            {players.map((player) => {
              const isCurrentTurn = player.id === currentTurnPlayerId;
              return (
                <div
                  key={player.id}
                  className={`flex flex-col items-center rounded-lg p-3 bg-white border-2 transition-all duration-200 ${
                    isCurrentTurn 
                      ? 'border-[#f2bf27] shadow-lg ring-2 ring-[#f2bf27]/30' 
                      : 'border-gray-200 hover:border-[#f2bf27]/50'
                  }`}
                >
                  <span className="text-xs font-medium mb-2 text-[#651c1d] flex items-center gap-1">
                    {player.name}
                    {isCurrentTurn && (
                      <span title="Current Turn" className="text-[#f2bf27]">★</span>
                    )}
                  </span>
                  <div className="w-12 h-16 bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-300 rounded-lg shadow-inner flex items-center justify-center">
                    <span className="text-xl font-bold text-[#651c1d]">
                      {player.card}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Action UI */}
        <section>
          <h3 className="text-md font-semibold mb-3 text-[#651c1d]">Your Action</h3>
          <div className="bg-white rounded-lg p-4 border border-[#f2bf27]/30">
            {isMyTurn ? (
              <div className="space-y-3">
                {roundState.round === 1 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-3">Do you see a pair among the other players&apos; cards?</p>
                    {actionUI}
                  </div>
                )}
                {roundState.round === 2 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-3">What do you think your ranking is?</p>
                    {actionUI}
                  </div>
                )}
                {roundState.round === 3 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-3">What rank do you think your card is?</p>
                    {actionUI}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Waiting for {players.find(p => p.id === currentTurnPlayerId)?.name}&apos;s turn...</p>
            )}
          </div>
        </section>

        {/* Action Log */}
        <section className="flex-1 min-h-0">
          <h3 className="text-md font-semibold mb-3 text-[#651c1d]">Action Log</h3>
          <div className="bg-white rounded-lg border border-[#f2bf27]/30 p-3 h-48 overflow-y-auto">
            <ul className="space-y-2 text-sm">
              {actionLog.length === 0 ? (
                <li className="text-gray-400 italic">No actions yet.</li>
              ) : (
                actionLog.map((entry, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-700 p-2 bg-gray-50 rounded">
                    <span className="font-semibold text-[#651c1d]">{entry.playerName}</span>
                    <span className="text-xs text-gray-400 mt-0.5">(Round {entry.round})</span>
                    <div className="flex-1">
                      {entry.type === 'pair' && (
                        <span className="text-blue-600">
                          {entry.value ? 'saw a pair' : 'did not see a pair'}
                        </span>
                      )}
                      {entry.type === 'perceivedRank' && (
                        <span className="text-green-600">
                          declared {entry.value}{getOrdinalSuffix(Number(entry.value))} highest
                        </span>
                      )}
                      {entry.type === 'guess' && (
                        <span className="text-purple-600">
                          guessed <span className="font-mono font-bold">{entry.value}</span>
                        </span>
                      )}
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
};

export default GameBoard; 