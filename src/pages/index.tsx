import Head from 'next/head';
import GameLobby from '../components/GameLobby';
import Image from 'next/image';

export default function Home() {
  return (
    <>
      <Head>
        <title>Bobboi Card Game</title>
        <meta name="description" content="Create or join a game" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Poppins:wght@400;500;600&display=swap" rel="stylesheet" />
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
            <h1 className="text-[#651c1d] font-serif text-3xl font-bold">BOBBOI</h1>
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
              <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-[#651c1d] mb-4 leading-tight">
                San Diego's<br />Favorite Card Game
              </h2>
              <p className="text-[#651c1d] text-lg md:text-xl mb-8 max-w-lg">
                Join friends and family for a delightful game of Bobboi - a cooperative card game for everyone to enjoy.
              </p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
} 