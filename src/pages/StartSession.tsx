import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Trash2, Users } from 'lucide-react';
import QRCode from 'react-qr-code';
import { motion } from 'motion/react';
import { getAllBoards, deleteBoard, Board } from '../lib/db';
import { socket } from '../lib/socket';

export default function StartSession() {
  const navigate = useNavigate();
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [room, setRoom] = useState<any>(null);

  useEffect(() => {
    loadBoards();

    socket.on('roomCreated', (data) => {
      setRoom(data.room);
    });

    socket.on('roomUpdated', (data) => {
      setRoom(data);
    });

    socket.on('gameStarted', (data) => {
      navigate(`/game/${data.roomId}`, { state: { room: data, isHost: true, playerName } });
    });

    return () => {
      socket.off('roomCreated');
      socket.off('roomUpdated');
      socket.off('gameStarted');
    };
  }, [navigate, playerName]);

  const loadBoards = async () => {
    const b = await getAllBoards();
    setBoards(b);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this board?")) {
      await deleteBoard(id);
      loadBoards();
    }
  };

  const handleCreateRoom = () => {
    if (!selectedBoard) return alert("Select a board first");
    if (!playerName.trim()) return alert("Enter your name");
    
    socket.connect();
    socket.emit('createRoom', {
      board: selectedBoard,
      playerName
    });
  };

  const handleStartGame = () => {
    if (room && room.roomId) {
      socket.emit('startGame', { roomId: room.roomId });
    }
  };

  if (room) {
    const joinUrl = `${window.location.origin}/join?code=${room.roomId}`;
    
    return (
      <div className="min-h-screen bg-neutral-100 p-6 flex flex-col items-center justify-center">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-8 rounded-3xl shadow-lg max-w-md w-full text-center"
        >
          <h2 className="text-2xl font-black mb-2">Room Created!</h2>
          <p className="text-neutral-500 mb-6">Waiting for players to join...</p>
          
          <div className="bg-neutral-100 p-6 rounded-2xl flex justify-center mb-6">
            <QRCode value={joinUrl} size={200} />
          </div>
          
          <div className="mb-6">
            <p className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-2">Session Code</p>
            <div className="text-4xl font-mono font-black tracking-widest text-indigo-600 bg-indigo-50 py-3 rounded-xl">
              {room.roomId}
            </div>
          </div>

          <div className="text-left mb-8">
            <h3 className="font-bold flex items-center gap-2 mb-3">
              <Users size={18} />
              Players ({room.players.length})
            </h3>
            <ul className="space-y-2">
              {room.players.map((p: any) => (
                <li key={p.id} className="bg-neutral-50 px-4 py-2 rounded-lg flex items-center justify-between">
                  <span className="font-medium">{p.name}</span>
                  {p.isHost && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-bold">HOST</span>}
                </li>
              ))}
            </ul>
          </div>

          <button 
            onClick={handleStartGame}
            disabled={room.players.length < 2}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            <Play size={20} />
            Start Game
          </button>
          {room.players.length < 2 && (
            <p className="text-xs text-neutral-500 mt-3">Waiting for at least 1 more player...</p>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 pb-24">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-neutral-500 hover:text-neutral-900">
            <ArrowLeft size={24} />
          </button>
          <h1 className="font-bold text-lg ml-2">Start Session</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 mt-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 mb-6">
          <label className="block text-sm font-bold text-neutral-700 mb-2">Your Name</label>
          <input 
            type="text" 
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            className="w-full bg-neutral-100 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <h2 className="font-bold text-lg mb-4 px-2">Select a Board</h2>
        
        {boards.length === 0 ? (
          <div className="text-center p-8 bg-neutral-50 rounded-2xl border-2 border-dashed border-neutral-200">
            <p className="text-neutral-500 mb-4">You haven't created any boards yet.</p>
            <button 
              onClick={() => navigate('/create')}
              className="bg-indigo-100 text-indigo-700 px-6 py-2 rounded-full font-medium"
            >
              Create One Now
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {boards.map(board => (
              <motion.div 
                key={board.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedBoard(board)}
                className={`bg-white p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  selectedBoard?.id === board.id ? 'border-indigo-500 shadow-md' : 'border-neutral-200 hover:border-indigo-300'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg">{board.name}</h3>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(board.id); }}
                    className="text-neutral-400 hover:text-red-500 p-1"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <p className="text-sm text-neutral-500">
                  {board.slots.filter(s => s.image).length} characters
                </p>
                <p className="text-xs text-neutral-400 mt-1">
                  Created {new Date(board.createdAt).toLocaleDateString()}
                </p>
              </motion.div>
            ))}
          </div>
        )}

        {selectedBoard && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-neutral-200 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-20">
            <div className="max-w-2xl mx-auto flex gap-4">
              <button 
                onClick={handleCreateRoom}
                className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-colors"
              >
                Create Room
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
