import { useState, useEffect, useRef } from 'react';
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
  
  const [eliminated, setEliminated] = useState<Set<number | string>>(new Set());
  const [showCharacter, setShowCharacter] = useState(false);
  const [myCharacter, setMyCharacter] = useState<BoardSlot | null>(null);
  
  const [zoomedSlot, setZoomedSlot] = useState<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);

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

  const toggleEliminated = (id: number | string) => {
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

  const handlePointerDown = (slot: any) => {
    isLongPressRef.current = false;
    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setZoomedSlot(slot);
    }, 400); // 400ms for long press
  };

  const handlePointerUp = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (zoomedSlot) {
      setZoomedSlot(null);
    }
  };

  const handlePointerLeave = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (zoomedSlot) {
      setZoomedSlot(null);
    }
  };

  const handleClick = (slot: any) => {
    if (!isLongPressRef.current) {
      toggleEliminated(slot.id);
    }
  };

  // Prevent context menu on long press for mobile
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
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

  // Ensure we always have 49 slots to render a perfect 7x7 grid
  const displaySlots = [...room.board.slots];
  while (displaySlots.length < 49) {
    displaySlots.push({ id: `empty-${displaySlots.length}`, name: '', image: '' });
  }
  const finalSlots = displaySlots.slice(0, 49);

  return (
    <div className="min-h-screen bg-neutral-100 pb-2 flex flex-col">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-4xl mx-auto px-2 sm:px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-1 sm:gap-2">
            <button onClick={() => navigate('/')} className="p-2 -ml-2 text-neutral-500 hover:text-neutral-900">
              <ArrowLeft size={20} />
            </button>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-neutral-400 uppercase leading-tight">Room {roomId}</span>
              <span className="text-sm font-medium leading-tight truncate max-w-[150px] sm:max-w-xs">{room.board.name}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <button 
              onClick={resetBoard}
              className="p-2 text-neutral-500 hover:text-indigo-600 bg-neutral-50 rounded-full transition-colors"
              title="Reset Marks"
            >
              <RotateCcw size={18} />
            </button>
            {isHost && (
              <button 
                onClick={handleRestart}
                className="p-2 text-neutral-500 hover:text-amber-600 bg-neutral-50 rounded-full transition-colors"
                title="Restart Game"
              >
                <RefreshCw size={18} />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-1 py-2 flex flex-col gap-2">
        {/* Secret Character Card */}
        <div className="flex justify-center mt-1">
          <div 
            className="w-14 h-20 sm:w-24 sm:h-32 perspective-1000 cursor-pointer"
            onClick={() => setShowCharacter(!showCharacter)}
          >
            <motion.div
              className="w-full h-full relative preserve-3d transition-transform duration-500"
              animate={{ rotateY: showCharacter ? 180 : 0 }}
            >
              {/* Front (Hidden) */}
              <div className="absolute inset-0 backface-hidden bg-indigo-600 rounded-xl shadow-md border-2 border-white flex flex-col items-center justify-center text-white p-1 text-center">
                <span className="text-xl sm:text-2xl mb-0.5">?</span>
                <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider leading-tight">Your<br/>Card</span>
              </div>
              
              {/* Back (Revealed) */}
              <div className="absolute inset-0 backface-hidden bg-white rounded-xl shadow-md border-2 border-indigo-500 overflow-hidden flex flex-col rotate-y-180">
                {myCharacter?.image ? (
                  <img src={myCharacter.image} alt={myCharacter.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex-1 bg-neutral-100 flex items-center justify-center text-neutral-400 text-[10px]">
                    No Image
                  </div>
                )}
                {myCharacter?.name && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] sm:text-xs font-bold text-center py-0.5 truncate px-1">
                    {myCharacter.name}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Game Board */}
        <div className="bg-white p-1 sm:p-4 rounded-xl shadow-sm border border-neutral-200 flex-1 flex flex-col">
          <div className="grid grid-cols-7 gap-0.5 sm:gap-2 w-full max-w-full mx-auto">
            {finalSlots.map((slot: any) => (
              <button
                key={slot.id}
                onPointerDown={() => handlePointerDown(slot)}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerLeave}
                onPointerCancel={handlePointerLeave}
                onClick={() => handleClick(slot)}
                onContextMenu={handleContextMenu}
                className="relative aspect-[3/4] rounded-md sm:rounded-xl overflow-hidden border border-neutral-200 transition-all touch-none select-none"
              >
                {slot.image ? (
                  <img 
                    src={slot.image} 
                    alt={slot.name} 
                    className={`w-full h-full object-cover transition-all duration-300 ${eliminated.has(slot.id) ? 'grayscale opacity-30 scale-95' : ''}`} 
                    draggable={false}
                  />
                ) : (
                  <div className={`w-full h-full bg-neutral-50 transition-all duration-300 ${eliminated.has(slot.id) ? 'opacity-30' : ''}`} />
                )}
                
                {slot.name && (
                  <div className={`absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[8px] sm:text-xs font-medium truncate px-0.5 py-0.5 text-center transition-all duration-300 ${eliminated.has(slot.id) ? 'opacity-30' : ''}`}>
                    {slot.name}
                  </div>
                )}

                <AnimatePresence>
                  {eliminated.has(slot.id) && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center bg-black/10"
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

      {/* Zoom Modal */}
      <AnimatePresence>
        {zoomedSlot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-sm w-full border-4 border-white"
            >
              {zoomedSlot.image ? (
                <img src={zoomedSlot.image} alt={zoomedSlot.name} className="w-full aspect-[3/4] object-cover" />
              ) : (
                <div className="w-full aspect-[3/4] bg-neutral-100 flex items-center justify-center text-neutral-400">
                  No Image
                </div>
              )}
              {zoomedSlot.name && (
                <div className="bg-white p-4 text-center">
                  <h3 className="text-2xl font-black text-neutral-900">{zoomedSlot.name}</h3>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
