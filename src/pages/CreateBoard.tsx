import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Upload, X, PlusCircle, Images, Loader2, Check, Crop } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Cropper from 'react-easy-crop';
import { saveBoard, getBoard, BoardSlot } from '../lib/db';
import { resizeImage } from '../lib/imageUtils';
import getCroppedImg from '../lib/cropImage';

const RANDOM_NAMES = [
  "Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Jamie", "Charlie", "Quinn", "Avery",
  "Skyler", "Sam", "Drew", "Jesse", "Harper", "Rowan", "Blake", "Finley", "Emerson", "Dakota",
  "Hayden", "Parker", "Dallas", "Eden", "Rory", "Logan", "Cameron", "Elliott", "Spencer", "Ellis",
  "Reese", "River", "Phoenix", "Sage", "Kendall", "Peyton", "Sawyer", "Teagan", "Micah", "Sutton",
  "Tatum", "Milan", "Lennon", "Oakley", "Armani", "Remy", "Ari", "Amari", "Kamryn", "Makhi"
];

export default function CreateBoard() {
  const navigate = useNavigate();
  const { boardId } = useParams<{ boardId: string }>();
  const [boardName, setBoardName] = useState('');
  const [slots, setSlots] = useState<BoardSlot[]>(
    Array.from({ length: 49 }, (_, i) => ({ id: i, image: null, name: '' }))
  );
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(!!boardId);
  const [originalImages, setOriginalImages] = useState<Record<number, string>>({});
  
  useEffect(() => {
    if (boardId) {
      const loadBoard = async () => {
        try {
          const board = await getBoard(boardId);
          if (board) {
            setBoardName(board.name);
            setSlots(board.slots);
          } else {
            alert("Board not found");
            navigate('/start');
          }
        } catch (error) {
          console.error("Error loading board", error);
        } finally {
          setIsInitialLoading(false);
        }
      };
      loadBoard();
    }
  }, [boardId, navigate]);
  
  // Cropper state
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkInputRef = useRef<HTMLInputElement>(null);

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files).slice(0, 49) as File[];
    setIsLoading(true);
    
    try {
      const processedImages = await Promise.all(files.map((f: File) => resizeImage(f)));
      const newOriginals: Record<number, string> = {};
      
      setSlots(prev => {
        const next = [...prev];
        let imgIdx = 0;
        for (let i = 0; i < 49; i++) {
          if (imgIdx < processedImages.length) {
            const randomName = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
            next[i] = { ...next[i], image: processedImages[imgIdx], name: randomName };
            newOriginals[i] = URL.createObjectURL(files[imgIdx]);
            imgIdx++;
          }
        }
        return next;
      });
      setOriginalImages(prev => ({ ...prev, ...newOriginals }));
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
    const url = URL.createObjectURL(file);
    
    setOriginalImages(prev => ({ ...prev, [selectedSlot]: url }));
    setCropImageSrc(url);
    
    // Reset input so the same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirmCrop = async () => {
    if (!cropImageSrc || !croppedAreaPixels || selectedSlot === null) return;
    
    try {
      setIsLoading(true);
      const croppedImageBase64 = await getCroppedImg(cropImageSrc, croppedAreaPixels);
      
      // Convert base64 back to file for resizeImage to keep it consistent and small
      const res = await fetch(croppedImageBase64);
      const blob = await res.blob();
      const file = new File([blob], "cropped.jpg", { type: "image/jpeg" });
      
      const resizedImage = await resizeImage(file);
      setSlots(prev => prev.map(s => s.id === selectedSlot ? { ...s, image: resizedImage } : s));
      setCropImageSrc(null);
    } catch (error) {
      console.error("Error cropping image", error);
      alert("Failed to crop image");
    } finally {
      setIsLoading(false);
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
      id: boardId || Math.random().toString(36).substring(2, 9),
      name: boardName,
      slots,
      createdAt: boardId ? (await getBoard(boardId))?.createdAt || Date.now() : Date.now()
    };

    await saveBoard(newBoard);
    navigate('/start');
  };

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <Loader2 size={48} className="animate-spin text-indigo-600" />
      </div>
    );
  }

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
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {slots.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => setSelectedSlot(slot.id)}
                  className={`relative aspect-[3/4] rounded-md overflow-hidden border-2 transition-all ${
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
                  className="aspect-[3/4] w-full max-w-[200px] mx-auto bg-neutral-100 rounded-xl border-2 border-dashed border-neutral-300 flex flex-col items-center justify-center cursor-pointer hover:bg-neutral-50 overflow-hidden relative"
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
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setCropImageSrc(originalImages[selectedSlot] || slots[selectedSlot].image!)}
                      className="flex-1 flex items-center justify-center gap-2 text-indigo-600 font-medium py-2 hover:bg-indigo-50 rounded-xl transition-colors border border-indigo-100"
                    >
                      <Crop size={18} />
                      Adjust
                    </button>
                    <button 
                      onClick={() => {
                        setSlots(prev => prev.map(s => s.id === selectedSlot ? { ...s, image: null, name: '' } : s));
                        setOriginalImages(prev => {
                          const next = { ...prev };
                          delete next[selectedSlot];
                          return next;
                        });
                      }}
                      className="flex-1 flex items-center justify-center gap-2 text-red-500 font-medium py-2 hover:bg-red-50 rounded-xl transition-colors border border-red-100"
                    >
                      <X size={18} />
                      Clear
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </main>

      {/* Crop Modal */}
      <AnimatePresence>
        {cropImageSrc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col bg-black"
          >
            <div className="flex items-center justify-between p-4 bg-black/50 text-white z-10">
              <button 
                onClick={() => setCropImageSrc(null)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
              <h3 className="font-bold text-lg">Adjust Image</h3>
              <button 
                onClick={handleConfirmCrop}
                disabled={isLoading}
                className="flex items-center gap-2 bg-indigo-600 px-4 py-2 rounded-full font-bold hover:bg-indigo-700 disabled:opacity-50"
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                Save
              </button>
            </div>
            
            <div className="flex-1 relative">
              <Cropper
                image={cropImageSrc}
                crop={crop}
                zoom={zoom}
                aspect={3 / 4}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            
            <div className="p-6 bg-black/50 z-10">
              <div className="max-w-md mx-auto flex items-center gap-4">
                <span className="text-white text-sm">Zoom</span>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>
              <p className="text-center text-white/50 text-xs mt-4">Pinch or drag to adjust the image</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
