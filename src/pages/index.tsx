import Head from 'next/head';
import GameLobby from '../components/GameLobby';

export default function Home() {
  return (
    <>
      <Head>
        <title>Bobboi Card Game</title>
        <meta name="description" content="Create or join a game" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      <div className="min-h-screen flex flex-col bg-[#f2bf27]">
        {/* Header */}
        <header className="w-full bg-[#f2bf27] py-4 px-4 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mr-3">
              <svg viewBox="0 0 100 100" className="w-12 h-12 text-[#651c1d]" fill="currentColor">
                <path d="M30,30 C40,20 60,20 70,30 C80,40 80,60 70,70 C60,80 40,80 30,70 C20,60 20,40 30,30 Z" fillOpacity="0" strokeWidth="8" stroke="currentColor" />
                <circle cx="35" cy="40" r="8" />
                <circle cx="65" cy="40" r="8" />
                <circle cx="50" cy="65" r="8" />
              </svg>
            </div>
            <h1 className="text-[#651c1d] text-3xl font-extrabold" style={{ fontFamily: 'Nunito, sans-serif' }}>BOBBOI</h1>
          </div>
          <nav className="hidden md:flex space-x-6">
            <a href="#" className="text-[#651c1d] font-medium">Home</a>
            <a href="#" className="text-[#651c1d] font-medium">About</a>
            <a href="#" className="text-[#651c1d] font-medium">How to Play</a>
          </nav>
        </header>
        
        <main className="flex-grow flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-5xl mx-auto grid md:grid-cols-2 gap-8 items-center">
            <div className="order-2 md:order-1">
              <div className="bg-white rounded-xl shadow-xl overflow-hidden border-2 border-[#651c1d]/10">
                <div className="p-6">
                  <GameLobby />
                </div>
              </div>
            </div>
            
            <div className="text-center md:text-left order-1 md:order-2">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#651c1d] mb-4 leading-tight" style={{ fontFamily: 'Nunito, sans-serif' }}>
                San Diego&apos;s<br />Favorite Card Game
              </h2>
              <p className="text-[#651c1d] text-lg md:text-xl mb-8 max-w-lg">
                Join friends and family for a delightful game of Bobboi - a cooperative card game for everyone to enjoy.
              </p>
            </div>
          </div>
        </main>
        
        {/* Rules Section */}
        <section className="bg-white py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#651c1d] text-center mb-8" style={{ fontFamily: 'Nunito, sans-serif' }}>
              How to Play Bobboi
            </h2>
            
            <div className="bg-[#f2bf27]/10 rounded-xl p-6 mb-8">
              <h3 className="text-xl font-bold text-[#651c1d] mb-3">🎯 Objective</h3>
              <p className="text-[#651c1d]">
                Bobboi is a <strong>cooperative card game</strong> where all players win together or lose together. 
                Each player gets one card (visible to others, hidden from themselves) and must correctly guess their own card&apos;s rank. 
                <strong> Everyone must guess correctly to win!</strong>
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {/* Round 1 */}
              <div className="bg-white border-2 border-[#f2bf27] rounded-xl p-6 shadow-lg">
                <div className="text-center mb-4">
                  <div className="w-12 h-12 bg-[#651c1d] rounded-full flex items-center justify-center mx-auto mb-2 font-bold text-xl" style={{ color: '#ffffff' }}>
                    1
                  </div>
                  <h3 className="text-lg font-bold text-[#651c1d]">Pair Detection</h3>
                </div>
                <p className="text-sm text-[#651c1d] mb-3">
                  Going in turn order, each player declares if they see <strong>one pair</strong> among the <em>other players&apos;</em> cards 
                  that previous players could not have conceivably declared.
                </p>
                <div className="bg-[#f2bf27]/20 rounded-lg p-3">
                  <p className="text-xs text-[#651c1d] font-medium mb-2">
                    💡 <strong>Sequential logic:</strong> Player 1 declares any pair they see. Player 2 must declare 
                    a <em>different</em> pair that Player 1 could not have conceivably declared.
                  </p>
                  <p className="text-xs text-[#651c1d] font-medium mb-1">
                    <strong>Example:</strong> If there are two different pairs visible, Player 1 declares one, Player 2 can declare the other.
                  </p>
                  <p className="text-xs text-[#651c1d] font-medium">
                    <strong>Tricky case:</strong> Three 7s = 3 possible pairs, but each player can only declare one!
                  </p>
                </div>
              </div>
              
              {/* Round 2 */}
              <div className="bg-white border-2 border-[#f2bf27] rounded-xl p-6 shadow-lg">
                <div className="text-center mb-4">
                  <div className="w-12 h-12 bg-[#651c1d] rounded-full flex items-center justify-center mx-auto mb-2 font-bold text-xl" style={{ color: '#ffffff' }}>
                    2
                  </div>
                  <h3 className="text-lg font-bold text-[#651c1d]">Rank Yourself</h3>
                </div>
                <p className="text-sm text-[#651c1d] mb-3">
                  Based on what you see, declare your perceived ranking among all players.
                </p>
                <div className="bg-[#f2bf27]/20 rounded-lg p-3">
                  <p className="text-xs text-[#651c1d]">
                    <strong>Example:</strong> &quot;I think I&apos;m 3rd highest&quot; means you believe two players have higher cards than you.
                  </p>
                </div>
              </div>
              
              {/* Round 3 */}
              <div className="bg-white border-2 border-[#f2bf27] rounded-xl p-6 shadow-lg">
                <div className="text-center mb-4">
                  <div className="w-12 h-12 bg-[#651c1d] rounded-full flex items-center justify-center mx-auto mb-2 font-bold text-xl" style={{ color: '#ffffff' }}>
                    3
                  </div>
                  <h3 className="text-lg font-bold text-[#651c1d]">Final Guess</h3>
                </div>
                <p className="text-sm text-[#651c1d] mb-3">
                  Guess your exact card rank (2, 3, 4... J, Q, K, A) and then reveal your actual card.
                </p>
                <div className="bg-[#f2bf27]/20 rounded-lg p-3">
                  <p className="text-xs text-[#651c1d]">
                    This is it! Use all the information from previous rounds to make your best guess.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <div className="bg-[#651c1d] rounded-xl p-6 shadow-lg" style={{ color: '#ffffff' }}>
                <h3 className="text-xl font-bold mb-2" style={{ color: '#ffffff' }}>🏆 Win Condition</h3>
                <p className="text-lg" style={{ color: '#ffffff' }}>
                  <strong>ALL players must guess their card correctly</strong> for the team to win. 
                  If even one player guesses wrong, everyone loses together!
                </p>
              </div>
            </div>
            
            <div className="mt-6 text-center text-sm text-[#651c1d]/70">
              <p>Recommended for 4-6 players • Uses standard 52-card deck • Suits don&apos;t matter</p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
} 