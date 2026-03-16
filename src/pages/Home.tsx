import { Link } from 'react-router-dom';
import { Users, PlusCircle, LogIn, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 max-w-md mx-auto">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center mb-12"
      >
        <div className="bg-indigo-600 text-white w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
          <HelpCircle size={48} />
        </div>
        <h1 className="text-4xl font-black tracking-tight text-neutral-900">Guess Who?</h1>
        <p className="text-neutral-500 mt-2 font-medium">Custom multiplayer edition</p>
      </motion.div>

      <div className="w-full space-y-4">
        <Link to="/create" className="block">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-white border-2 border-neutral-200 p-4 rounded-2xl flex items-center gap-4 hover:border-indigo-500 hover:shadow-md transition-all"
          >
            <div className="bg-emerald-100 text-emerald-600 p-3 rounded-xl">
              <PlusCircle size={24} />
            </div>
            <div className="text-left">
              <h2 className="font-bold text-lg">Create Board</h2>
              <p className="text-sm text-neutral-500">Make a custom 7x7 character grid</p>
            </div>
          </motion.button>
        </Link>

        <Link to="/start" className="block">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-white border-2 border-neutral-200 p-4 rounded-2xl flex items-center gap-4 hover:border-indigo-500 hover:shadow-md transition-all"
          >
            <div className="bg-indigo-100 text-indigo-600 p-3 rounded-xl">
              <Users size={24} />
            </div>
            <div className="text-left">
              <h2 className="font-bold text-lg">Start Session</h2>
              <p className="text-sm text-neutral-500">Host a game with a saved board</p>
            </div>
          </motion.button>
        </Link>

        <Link to="/join" className="block">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-white border-2 border-neutral-200 p-4 rounded-2xl flex items-center gap-4 hover:border-indigo-500 hover:shadow-md transition-all"
          >
            <div className="bg-amber-100 text-amber-600 p-3 rounded-xl">
              <LogIn size={24} />
            </div>
            <div className="text-left">
              <h2 className="font-bold text-lg">Join Session</h2>
              <p className="text-sm text-neutral-500">Enter a code or scan QR to play</p>
            </div>
          </motion.button>
        </Link>
      </div>
    </div>
  );
}
