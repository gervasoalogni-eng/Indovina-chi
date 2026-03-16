import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, RotateCcw, Users, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { socket } from '../lib/socket';
import { BoardSlot } from '../lib/db';

export default function Game() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [room, setRoom] = useState<any>(location.state?.room);
  const [playerName] = useState(location.state?.playerName || '');
  
  const isHost = room?.host === socket.id;
  
  const [eliminated, setEliminated] = useState<Set<number>>(new Set());
  const [showCharacter, setShowCharacter] = useState(false);
  const [myCharacter, setMyCharacter] = useState<BoardSlot | null>(null);

  useEffect(() => {
    if (!room) {
      navigate('/');
      return;
    }

    const playerId = socket.id;
    if (room.assignments && playerId && room.assignments[playerId]) {
      setMyCharacter(room.assignments[playerId]);
    }

    socket.on('roomUpdated', (data) => {
      setRoom(data);
    });

    socket.on('gameStarted', (data) => {
      setRoom(data);
      setEliminated(new Set());
      setShowCharacter(false);
      const newPlayerId = socket.id;
      if (data.assignments && newPlayerId && data.assignments[newPlayerId]) {
        setMyCharacter(data.assignments[newPlayerId]);
      }
    });

    return () => {
      socket.off('roomUpdated');
      socket.off('gameStarted');
    };
  }, [navigate, room]);

  const toggleEliminated = (id: number) => {
    setEliminated(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const resetBoard = () => {
    setEliminated(new Set());
  };

  const handleRestart = () => {
    if (isHost && roomId) {
      socket.emit('restartGame', { roomId });
    }
  };

  if (!room) return null;

  if (room.status === 'waiting') {
    return (
      <div className="min-h-screen bg-neutral-100 p-6 flex flex-col items-center justify-center">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-8 rounded-3xl shadow-lg max-w-md w-full text-center"
        >
          <h2 className="text-2xl font-black mb-2">Waiting for Host</h2>
          <p className="text-neutral-500 mb-6">The game will start soon...</p>
          
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
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 pb-24 flex flex-col">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/')} className="p-2 -ml-2 text-neutral-500 hover:text-neutral-900">
              <ArrowLeft size={24} />
            </button>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-neutral-400 uppercase">Room {roomId}</span>
              <span className="text-sm font-medium">{room.board.name}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={resetBoard}
              className="p-2 text-neutral-500 hover:text-indigo-600 bg-neutral-50 rounded-full transition-colors"
              title="Reset Marks"
            >
              <RotateCcw size={20} />
            </button>
            {isHost && (
              <button 
                onClick={handleRestart}
                className="p-2 text-neutral-500 hover:text-amber-600 bg-neutral-50 rounded-full transition-colors"
                title="Restart Game"
              >
                <RefreshCw size={20} />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-4 flex flex-col gap-6">
        {/* Secret Character Card */}
        <div className="flex justify-center">
          <div 
            className="w-32 h-32 perspective-1000 cursor-pointer"
            onClick={() => setShowCharacter(!showCharacter)}
          >
            <motion.div
              className="w-full h-full relative preserve-3d transition-transform duration-500"
              animate={{ rotateY: showCharacter ? 180 : 0 }}
            >
              {/* Front (Hidden) */}
              <div className="absolute inset-0 backface-hidden bg-indigo-600 rounded-2xl shadow-lg border-4 border-white flex flex-col items-center justify-center text-white p-2 text-center">
                <span className="text-3xl mb-1">?</span>
                <span className="text-xs font-bold uppercase tracking-wider">Your<br/>Character</span>
              </div>
              
              {/* Back (Revealed) */}
              <div className="absolute inset-0 backface-hidden bg-white rounded-2xl shadow-lg border-4 border-indigo-500 overflow-hidden flex flex-col rotate-y-180">
                {myCharacter?.image ? (
                  <img src={myCharacter.image} alt={myCharacter.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex-1 bg-neutral-100 flex items-center justify-center text-neutral-400">
                    No Image
                  </div>
                )}
                {myCharacter?.name && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs font-bold text-center py-1 truncate px-1">
                    {myCharacter.name}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Game Board */}
        <div className="bg-white p-2 sm:p-4 rounded-3xl shadow-sm border border-neutral-200">
          <div className="grid grid-cols-7 gap-1 sm:gap-2 aspect-square">
            {room.board.slots.map((slot: BoardSlot) => (
              <button
                key={slot.id}
                onClick={() => toggleEliminated(slot.id)}
                className="relative aspect-square rounded-md sm:rounded-xl overflow-hidden border-2 border-neutral-200 transition-all"
              >
                {slot.image ? (
                  <img 
                    src={slot.image} 
                    alt={slot.name} 
                    className={`w-full h-full object-cover transition-all duration-300 ${eliminated.has(slot.id) ? 'grayscale opacity-30 scale-95' : ''}`} 
                  />
                ) : (
                  <div className={`w-full h-full bg-neutral-50 transition-all duration-300 ${eliminated.has(slot.id) ? 'opacity-30' : ''}`} />
                )}
                
                {slot.name && (
                  <div className={`absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[8px] sm:text-[10px] truncate px-1 py-0.5 text-center transition-all duration-300 ${eliminated.has(slot.id) ? 'opacity-30' : ''}`}>
                    {slot.name}
                  </div>
                )}

                <AnimatePresence>
                  {eliminated.has(slot.id) && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center bg-black/20"
                    >
                      <div className="w-full h-1 bg-red-500 rotate-45 absolute" />
                      <div className="w-full h-1 bg-red-500 -rotate-45 absolute" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
