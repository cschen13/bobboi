import { Button } from '@/components/Button';
import Head from 'next/head';

export default function Home() {
  const handleCreateGame = () => {
    // This will be implemented in a future milestone
    console.log('Create new game clicked');
  };

  const handleJoinGame = () => {
    // This will be implemented in a future milestone
    console.log('Join game clicked');
  };

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
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-2">Bobboi</h1>
            <p className="text-gray-300">Create a new game or join an existing one</p>
          </div>
          
          <div className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
              <h2 className="text-xl font-semibold mb-4">Ready to Play?</h2>
              <div className="space-y-4">
                <div className="w-full">
                  <Button 
                    variant="primary" 
                    onClick={handleCreateGame}
                  >
                    Create New Game
                  </Button>
                </div>
                
                <div className="w-full">
                  <Button 
                    variant="secondary" 
                    onClick={handleJoinGame}
                  >
                    Join Game
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
} 