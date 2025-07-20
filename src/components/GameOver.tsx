import React from 'react';
import { GameResult } from '../lib/types';
import { Button } from './Button';

interface GameOverProps {
  result: GameResult;
  onPlayAgain: () => void;
  onExitGame: () => void;
}

const GameOver: React.FC<GameOverProps> = ({ result, onPlayAgain, onExitGame }) => {
  const { isWin, playerResults } = result;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4" 
      style={{ 
        zIndex: 999999, 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)' 
      }}
    >
      <div 
        className="rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative border-4 border-[#651c1d]"
        style={{ backgroundColor: '#ffffff' }}
      >
        {/* Header */}
        <div 
          className={`p-6 text-center rounded-t-xl`}
          style={{ backgroundColor: isWin ? '#dcfce7' : '#fee2e2' }}
        >
          <div className="text-6xl mb-4">
            {isWin ? '🎉' : '😔'}
          </div>
          <h1 className={`text-4xl font-black ${isWin ? 'text-green-900' : 'text-red-900'} mb-3 drop-shadow-sm`}>
            {isWin ? 'Team Victory!' : 'Better Luck Next Time!'}
          </h1>
          <p className={`text-xl font-bold ${isWin ? 'text-green-900' : 'text-red-900'} drop-shadow-sm`}>
            {isWin 
              ? 'Congratulations! Everyone guessed their card correctly!' 
              : 'Not everyone guessed correctly, but great teamwork!'
            }
          </p>
        </div>

        {/* Results Table */}
        <div className="p-6" style={{ backgroundColor: '#ffffff' }}>
          <h2 className="text-2xl font-bold text-[#651c1d] mb-6 text-center">Game Results</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse shadow-lg">
              <thead>
                <tr className="bg-[#f2bf27]">
                  <th className="border-2 border-[#651c1d] px-4 py-3 text-left font-bold text-[#651c1d] text-lg">Player</th>
                  <th className="border-2 border-[#651c1d] px-4 py-3 text-center font-bold text-[#651c1d] text-lg">Guessed</th>
                  <th className="border-2 border-[#651c1d] px-4 py-3 text-center font-bold text-[#651c1d] text-lg">Actual</th>
                  <th className="border-2 border-[#651c1d] px-4 py-3 text-center font-bold text-[#651c1d] text-lg">Result</th>
                </tr>
              </thead>
              <tbody>
                {playerResults.map((player, index) => (
                  <tr key={player.playerId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border-2 border-[#651c1d] px-4 py-4 bg-white">
                      <div className="flex items-center">
                        <span className="font-black text-[#651c1d] text-xl">{player.playerName}</span>
                      </div>
                    </td>
                    <td className="border-2 border-[#651c1d] px-4 py-4 text-center bg-white">
                      <span className="inline-block w-12 h-14 bg-blue-400 border-3 border-blue-800 rounded text-blue-900 font-black text-2xl flex items-center justify-center shadow-lg">
                        {player.guessedRank}
                      </span>
                    </td>
                    <td className="border-2 border-[#651c1d] px-4 py-4 text-center bg-white">
                      <span className="inline-block w-12 h-14 bg-gray-300 border-3 border-[#651c1d] rounded text-[#651c1d] font-black text-2xl flex items-center justify-center shadow-lg">
                        {player.actualCard.rank}
                      </span>
                    </td>
                    <td className="border-2 border-[#651c1d] px-4 py-4 text-center bg-white">
                      <span className={`inline-flex items-center px-4 py-3 rounded-full text-xl font-black border-3 shadow-lg ${
                        player.isCorrect 
                          ? 'bg-green-400 text-green-900 border-green-800' 
                          : 'bg-red-400 text-red-900 border-red-800'
                      }`}>
                        {player.isCorrect ? '✅ Correct' : '❌ Wrong'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 rounded-b-xl flex flex-col sm:flex-row gap-3 justify-center" style={{ backgroundColor: '#f9fafb' }}>
          <Button 
            variant="primary"
            onClick={onPlayAgain}
          >
            🎮 Play Again
          </Button>
          <Button 
            variant="secondary"
            onClick={onExitGame}
          >
            🚪 Exit Game
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GameOver;