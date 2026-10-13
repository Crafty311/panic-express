import React, { useState } from 'react';
import { MicrogameInstance, getAllMicrogameDefinitions, MicrogameCategory } from '../data/microgames';
import { audioEngine } from '../services/audioService';
import { X, Play, Trophy, Sparkles, Gamepad2 } from 'lucide-react';

interface ArcadeCatalogModalProps {
  onClose: () => void;
  onPlayGame: (game: MicrogameInstance) => void;
  isNightMode: boolean;
  coins: number;
}

export const ArcadeCatalogModal: React.FC<ArcadeCatalogModalProps> = ({
  onClose,
  onPlayGame,
  isNightMode,
  coins,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const allGames = getAllMicrogameDefinitions();

  const categories: { id: string; label: string; icon: string }[] = [
    { id: 'all', label: 'All 60 Games', icon: '🌟' },
    { id: 'train_tasks', label: 'Train & Travel Tasks', icon: '🚂' },
    { id: 'arcade_reflex', label: 'Arcade & Reflex', icon: '⚡' },
    { id: 'puzzle_logic', label: 'Puzzle & Logic', icon: '🧩' },
    { id: 'word_board', label: 'Word & Board Classics', icon: '♟️' },
    { id: 'rhythm_aim', label: 'Rhythm & Aiming', icon: '🎯' },
  ];

  const filteredGames = allGames.filter((g) => {
    const matchesCat = selectedCategory === 'all' || g.category === selectedCategory;
    const matchesSearch = g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          g.instruction.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          g.params.subType.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleSelectGame = (game: MicrogameInstance) => {
    audioEngine.playMechanicalClick();
    onPlayGame(game);
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-auto flex items-center justify-center p-4 bg-[#1c1917]/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`relative w-full max-w-4xl max-h-[85vh] border rounded-3xl p-6 sm:p-8 shadow-[0_30px_60px_rgba(0,0,0,0.3)] flex flex-col gap-6 overflow-hidden ${
        isNightMode ? 'bg-stone-900/95 border-[#f8f7f4]/20 text-[#f8f7f4]' : 'bg-white/95 border-[#1c1917]/15 text-[#1c1917]'
      }`}>
        
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-4 border-current/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-serif-cormorant italic text-3xl font-semibold tracking-wide">
                Panic Express Arcade Parlor
              </h2>
              <p className="font-sans-inter text-xs opacity-70">
                Browse and practice any of the 60 unique passenger journey minigames.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className={`px-4 py-1.5 rounded-full border text-xs font-mono-space flex items-center gap-1.5 ${
              isNightMode ? 'bg-stone-800 border-amber-400/30 text-amber-300' : 'bg-amber-50 border-amber-300 text-amber-800'
            }`}>
              <span>🪙</span>
              <span className="font-bold">{coins} Coins</span>
            </div>

            <button
              onClick={() => { audioEngine.playMechanicalClick(); onClose(); }}
              className="p-2 rounded-full hover:bg-current/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { audioEngine.playMechanicalClick(); setSelectedCategory(cat.id); }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-mono-space tracking-wider transition-all border ${
                  selectedCategory === cat.id
                    ? 'bg-[#d97706] text-white border-[#d97706] shadow-sm'
                    : isNightMode ? 'bg-stone-800 border-white/10 text-stone-300 hover:bg-stone-700' : 'bg-stone-100 border-stone-200 text-stone-700 hover:bg-stone-200'
                }`}
              >
                <span>{cat.icon}</span> <span className="ml-1">{cat.label}</span>
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Search 60 minigames..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`px-4 py-2 rounded-xl text-xs font-sans-inter border outline-none w-64 transition-all ${
              isNightMode ? 'bg-stone-800 border-white/20 text-white placeholder-stone-400 focus:border-amber-400' : 'bg-stone-50 border-stone-300 text-stone-900 placeholder-stone-500 focus:border-[#d97706]'
            }`}
          />
        </div>

        {/* Games Grid */}
        <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[50vh]">
          {filteredGames.map((game, index) => (
            <div
              key={game.id + index}
              onClick={() => handleSelectGame(game)}
              className={`group relative p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                isNightMode
                  ? 'bg-stone-800/60 border-white/10 hover:border-amber-400/50 hover:bg-stone-800'
                  : 'bg-stone-50/80 border-stone-200 hover:border-[#d97706]/50 hover:bg-white shadow-sm hover:shadow'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl p-2 rounded-xl bg-current/5 border border-current/10">
                    {game.icon}
                  </span>
                  <div>
                    <span className="font-mono-space text-[10px] uppercase tracking-wider text-amber-600 font-semibold block">
                      {game.category.replace('_', ' ')}
                    </span>
                    <h3 className="font-serif-cormorant font-bold text-lg leading-tight">
                      {game.title}
                    </h3>
                  </div>
                </div>
              </div>

              <p className="font-sans-inter text-xs opacity-75 font-medium">
                {game.instruction}
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-current/10 text-[10px] font-mono-space opacity-80">
                <span>Variant: {game.params.subType}</span>
                <span className="flex items-center gap-1 text-amber-600 font-bold group-hover:underline">
                  <Play className="w-3 h-3 fill-amber-600" /> Play Now
                </span>
              </div>
            </div>
          ))}

          {filteredGames.length === 0 && (
            <div className="col-span-full py-16 text-center opacity-60 font-mono-space text-xs">
              No minigames matched your search.
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-current/10 flex justify-between items-center text-xs opacity-70 font-mono-space">
          <span>Total catalog: {allGames.length} handcrafted minigames</span>
          <span>Click any card to launch challenge</span>
        </div>

      </div>
    </div>
  );
};
