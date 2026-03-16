import { Link } from 'react-router-dom';
import { Users, PlusCircle, LogIn, HelpCircle, LogOut } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../AuthContext';
import { signInWithGoogle, logOut } from '../firebase';

export default function Home() {
  const { user, loading } = useAuth();

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
        {!loading && !user && (
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={signInWithGoogle}
            className="w-full bg-white border-2 border-indigo-200 p-4 rounded-2xl flex items-center justify-center gap-3 hover:border-indigo-500 hover:shadow-md transition-all text-indigo-600 font-bold"
          >
            <LogIn size={20} />
            Sign in with Google to Create Boards
          </motion.button>
        )}

        {user && (
          <>
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
          </>
        )}

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
        
        {user && (
          <div className="pt-8 text-center">
            <p className="text-sm text-neutral-500 mb-2">Logged in as {user.email}</p>
            <button 
              onClick={logOut}
              className="text-sm text-neutral-400 hover:text-neutral-700 flex items-center justify-center gap-1 mx-auto"
            >
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
