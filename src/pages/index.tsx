import Head from 'next/head';
import GameLobby from '../components/GameLobby';

export default function Home() {
  return (
    <>
      <Head>
        <title>Bobboi Game</title>
        <meta name="description" content="Create or join a game" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Bobboi</h1>
            <p className="text-gray-300">Create a new game or join an existing one</p>
          </div>
          
          <div className="bg-white text-gray-900 p-6 rounded-lg shadow-lg">
            <GameLobby />
          </div>
        </div>
      </main>
    </>
  );
} 