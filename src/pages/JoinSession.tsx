import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, LogIn } from 'lucide-react';
import { motion } from 'motion/react';
import { socket } from '../lib/socket';

export default function JoinSession() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState(searchParams.get('code') || '');
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    socket.on('joinedRoom', (data) => {
      navigate(`/game/${data.roomId}`, { state: { room: data.room, isHost: false, playerName } });
    });

    socket.on('error', (data) => {
      setError(data.message);
    });

    return () => {
      socket.off('joinedRoom');
      socket.off('error');
    };
  }, [navigate, playerName]);

  const handleJoin = () => {
    if (!code.trim()) return setError('Enter a session code');
    if (!playerName.trim()) return setError('Enter your name');
    
    setError('');
    socket.connect();
    socket.emit('joinRoom', {
      roomId: code.toUpperCase(),
      playerName
    });
  };

  return (
    <div className="min-h-screen bg-neutral-100 pb-24">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-neutral-500 hover:text-neutral-900">
            <ArrowLeft size={24} />
          </button>
          <h1 className="font-bold text-lg ml-2">Join Session</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto p-6 mt-8">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white p-8 rounded-3xl shadow-sm border border-neutral-200"
        >
          <div className="mb-6">
            <label className="block text-sm font-bold text-neutral-700 mb-2 uppercase tracking-wider">Session Code</label>
            <input 
              type="text" 
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. A1B2C3"
              className="w-full bg-neutral-100 border-none rounded-xl px-4 py-4 text-2xl font-mono font-black tracking-widest text-center text-indigo-600 focus:ring-2 focus:ring-indigo-500 outline-none uppercase"
              maxLength={6}
            />
          </div>

          <div className="mb-8">
            <label className="block text-sm font-bold text-neutral-700 mb-2 uppercase tracking-wider">Your Name</label>
            <input 
              type="text" 
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              className="w-full bg-neutral-100 border-none rounded-xl px-4 py-4 text-lg font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
              {error}
            </div>
          )}

          <button 
            onClick={handleJoin}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
          >
            <LogIn size={20} />
            Join Game
          </button>
        </motion.div>
      </main>
    </div>
  );
}
