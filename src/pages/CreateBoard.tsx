import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Upload, X, PlusCircle, Images, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { saveBoard, BoardSlot } from '../lib/db';
import { resizeImage } from '../lib/imageUtils';

const RANDOM_NAMES = [
  "Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Jamie", "Charlie", "Quinn", "Avery",
  "Skyler", "Sam", "Drew", "Jesse", "Harper", "Rowan", "Blake", "Finley", "Emerson", "Dakota",
  "Hayden", "Parker", "Dallas", "Eden", "Rory", "Logan", "Cameron", "Elliott", "Spencer", "Ellis",
  "Reese", "River", "Phoenix", "Sage", "Kendall", "Peyton", "Sawyer", "Teagan", "Micah", "Sutton",
  "Tatum", "Milan", "Lennon", "Oakley", "Armani", "Remy", "Ari", "Amari", "Kamryn", "Makhi"
];

export default function CreateBoard() {
  const navigate = useNavigate();
  const [boardName, setBoardName] = useState('');
  const [slots, setSlots] = useState<BoardSlot[]>(
    Array.from({ length: 49 }, (_, i) => ({ id: i, image: null, name: '' }))
  );
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkInputRef = useRef<HTMLInputElement>(null);

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files).slice(0, 49) as File[];
    setIsLoading(true);
    
    try {
      const processedImages = await Promise.all(files.map((f: File) => resizeImage(f)));
      
      setSlots(prev => {
        const next = [...prev];
        let imgIdx = 0;
        for (let i = 0; i < 49; i++) {
          if (imgIdx < processedImages.length) {
            const randomName = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
            next[i] = { ...next[i], image: processedImages[imgIdx], name: randomName };
            imgIdx++;
          }
        }
        return next;
      });
    } catch (error) {
      console.error("Bulk upload error", error);
      alert("Error processing images");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedSlot === null || !e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    try {
      const resizedImage = await resizeImage(file);
      setSlots(prev => prev.map(s => s.id === selectedSlot ? { ...s, image: resizedImage } : s));
    } catch (error) {
      console.error("Error resizing image", error);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedSlot === null) return;
    setSlots(prev => prev.map(s => s.id === selectedSlot ? { ...s, name: e.target.value } : s));
  };

  const handleSave = async () => {
    if (!boardName.trim()) {
      alert("Please enter a board name");
      return;
    }
    const filledSlots = slots.filter(s => s.image);
    if (filledSlots.length < 2) {
      alert("Please add at least 2 characters to play");
      return;
    }

    const newBoard = {
      id: Math.random().toString(36).substring(2, 9),
      name: boardName,
      slots,
      createdAt: Date.now()
    };

    await saveBoard(newBoard);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-neutral-100 pb-24">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-neutral-500 hover:text-neutral-900">
            <ArrowLeft size={24} />
          </button>
          <input 
            type="text" 
            placeholder="Board Name" 
            value={boardName}
            onChange={(e) => setBoardName(e.target.value)}
            className="font-bold text-lg text-center bg-transparent border-none focus:ring-0 outline-none w-1/2"
          />
          <div className="flex items-center gap-2">
            <input 
              type="file" 
              ref={bulkInputRef} 
              onChange={handleBulkUpload} 
              accept="image/*" 
              multiple 
              className="hidden" 
            />
            <button 
              onClick={() => bulkInputRef.current?.click()} 
              disabled={isLoading}
              className="flex items-center gap-2 bg-neutral-200 text-neutral-700 px-4 py-2 rounded-full font-medium text-sm hover:bg-neutral-300 disabled:opacity-50"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Images size={16} />}
              <span className="hidden sm:inline">Bulk Load</span>
            </button>
            <button onClick={handleSave} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-full font-medium text-sm hover:bg-indigo-700">
              <Save size={16} />
              <span className="hidden sm:inline">Save</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 flex flex-col md:flex-row gap-6 mt-4">
        {/* Grid Preview */}
        <div className="flex-1">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-neutral-200">
            <div className="grid grid-cols-7 gap-1 sm:gap-2 aspect-square">
              {slots.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => setSelectedSlot(slot.id)}
                  className={`relative aspect-square rounded-md overflow-hidden border-2 transition-all ${
                    selectedSlot === slot.id ? 'border-indigo-500 shadow-md scale-105 z-10' : 'border-neutral-200 hover:border-indigo-300'
                  }`}
                >
                  {slot.image ? (
                    <img src={slot.image} alt={slot.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-neutral-50 flex items-center justify-center">
                      <PlusCircle size={16} className="text-neutral-300" />
                    </div>
                  )}
                  {slot.name && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[8px] sm:text-[10px] truncate px-1 py-0.5 text-center">
                      {slot.name}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Editor Panel */}
        <div className="w-full md:w-80 shrink-0">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 sticky top-24">
            <h2 className="font-bold text-lg mb-4">Edit Slot {selectedSlot !== null ? selectedSlot + 1 : ''}</h2>
            
            {selectedSlot === null ? (
              <div className="text-center text-neutral-500 py-8">
                Select a slot on the grid to add a character.
              </div>
            ) : (
              <motion.div 
                key={selectedSlot}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div 
                  className="aspect-square w-full max-w-[200px] mx-auto bg-neutral-100 rounded-xl border-2 border-dashed border-neutral-300 flex flex-col items-center justify-center cursor-pointer hover:bg-neutral-50 overflow-hidden relative"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {slots[selectedSlot].image ? (
                    <>
                      <img src={slots[selectedSlot].image!} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                        <Upload size={24} />
                      </div>
                    </>
                  ) : (
                    <>
                      <Upload size={32} className="text-neutral-400 mb-2" />
                      <span className="text-sm font-medium text-neutral-500">Upload Image</span>
                    </>
                  )}
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  accept="image/*" 
                  className="hidden" 
                />

                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Character Name (Optional)</label>
                  <input 
                    type="text" 
                    value={slots[selectedSlot].name}
                    onChange={handleNameChange}
                    placeholder="e.g. Maria"
                    className="w-full bg-neutral-100 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                {slots[selectedSlot].image && (
                  <button 
                    onClick={() => setSlots(prev => prev.map(s => s.id === selectedSlot ? { ...s, image: null, name: '' } : s))}
                    className="w-full flex items-center justify-center gap-2 text-red-500 font-medium py-2 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <X size={18} />
                    Clear Slot
                  </button>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
