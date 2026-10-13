import React, { useState } from 'react';
import { 
  CompartmentCustomization, 
  TrainUpgrades 
} from '../types/game';
import { 
  X, 
  Zap, 
  Gauge, 
  Sparkles, 
  Coins, 
  Flame, 
  Paintbrush, 
  Check, 
  Layers
} from 'lucide-react';
import { audioEngine } from '../services/audioService';

interface UpgradeShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  coins: number;
  upgrades: TrainUpgrades;
  customization: CompartmentCustomization;
  onBuyUpgrade: (type: 'engine' | 'fuelEfficiency' | 'comfort' | 'wipers' | 'aerodynamics', cost: number) => void;
  onUpdateCustomization: (custom: Partial<CompartmentCustomization>) => void;
}

export const UpgradeShopModal: React.FC<UpgradeShopModalProps> = ({
  isOpen,
  onClose,
  coins,
  upgrades,
  customization,
  onBuyUpgrade,
  onUpdateCustomization,
}) => {
  const [activeTab, setActiveTab] = useState<'mechanical' | 'interior'>('mechanical');

  if (!isOpen) return null;

  // Upgrade catalog
  const engineCost = (upgrades.engineLevel + 1) * 90;
  const fuelCost = (upgrades.fuelEfficiencyLevel + 1) * 70;
  const comfortCost = (upgrades.comfortRating + 1) * 85;
  const wiperCost = 120;
  const aeroCost = 250;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#251711] via-[#1a0e08] to-[#0c0604] border-2 border-amber-500/70 rounded-xl shadow-[0_0_40px_rgba(245,158,11,0.25)] overflow-hidden text-stone-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-950 via-stone-900 to-amber-950 border-b border-amber-600/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🛠️</span>
            <div>
              <h2 className="font-serif-vintage text-lg font-bold text-amber-200 tracking-wider">
                Locomotive Depot & Interior Atelier
              </h2>
              <p className="text-xs text-amber-400/80">
                Upgrade engine speed & customize your compartment&apos;s luxury wood and velvet
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-black/60 border border-amber-500/40 px-3 py-1 rounded text-xs font-mono font-bold text-amber-300">
              <Coins className="w-3.5 h-3.5" />
              <span>{coins}g</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded text-stone-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="px-6 pt-3 pb-1 flex gap-2 border-b border-amber-900/40 bg-black/30">
          <button
            onClick={() => setActiveTab('mechanical')}
            className={`px-4 py-1.5 rounded-t-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border-t border-x ${
              activeTab === 'mechanical'
                ? 'bg-[#251711] border-amber-500/70 text-amber-200'
                : 'bg-transparent border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Gauge className="w-3.5 h-3.5 text-amber-400" />
            <span>Speed & Performance Engine</span>
          </button>
          <button
            onClick={() => setActiveTab('interior')}
            className={`px-4 py-1.5 rounded-t-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border-t border-x ${
              activeTab === 'interior'
                ? 'bg-[#251711] border-amber-500/70 text-amber-200'
                : 'bg-transparent border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Paintbrush className="w-3.5 h-3.5 text-amber-400" />
            <span>Interior Aesthetics & Customization</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
          {activeTab === 'mechanical' ? (
            // MECHANICAL & SPEED UPGRADES
            <div className="space-y-3">
              {/* 1. Engine Overdrive */}
              <div className="p-3.5 rounded-lg bg-black/40 border border-amber-800/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-amber-900/40 text-amber-300 border border-amber-600/30">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-serif-vintage text-sm font-bold text-amber-200">
                      Steam Boiler Turbo Overdrive (Lvl {upgrades.engineLevel})
                    </h4>
                    <p className="text-xs text-stone-400">
                      Increases top cruising speed (+25 km/h per level). Current max: {100 + upgrades.engineLevel * 25} km/h.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (coins >= engineCost) {
                      audioEngine.playCoin();
                      onBuyUpgrade('engine', engineCost);
                    }
                  }}
                  disabled={coins < engineCost}
                  className={`px-3 py-1.5 rounded text-xs font-bold border transition-all ${
                    coins >= engineCost
                      ? 'bg-amber-600 hover:bg-amber-500 text-stone-950 border-amber-400 active:scale-95'
                      : 'bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed'
                  }`}
                >
                  Upgrade ({engineCost}g)
                </button>
              </div>

              {/* 2. Fuel Efficiency */}
              <div className="p-3.5 rounded-lg bg-black/40 border border-amber-800/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-orange-900/40 text-orange-300 border border-orange-600/30">
                    <Flame className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-serif-vintage text-sm font-bold text-amber-200">
                      High-Yield Furnace Stoker (Lvl {upgrades.fuelEfficiencyLevel})
                    </h4>
                    <p className="text-xs text-stone-400">
                      Burns coal slower and extends fuel tank capacity.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (coins >= fuelCost) {
                      audioEngine.playCoin();
                      onBuyUpgrade('fuelEfficiency', fuelCost);
                    }
                  }}
                  disabled={coins < fuelCost}
                  className={`px-3 py-1.5 rounded text-xs font-bold border transition-all ${
                    coins >= fuelCost
                      ? 'bg-amber-600 hover:bg-amber-500 text-stone-950 border-amber-400 active:scale-95'
                      : 'bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed'
                  }`}
                >
                  Upgrade ({fuelCost}g)
                </button>
              </div>

              {/* 3. Luxury Coach Comfort */}
              <div className="p-3.5 rounded-lg bg-black/40 border border-amber-800/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-amber-900/40 text-amber-300 border border-amber-600/30">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-serif-vintage text-sm font-bold text-amber-200">
                      First-Class Hospitality Rating (Lvl {upgrades.comfortRating})
                    </h4>
                    <p className="text-xs text-stone-400">
                      Passengers award +25% higher fares and generous gold tips upon arrival.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (coins >= comfortCost) {
                      audioEngine.playCoin();
                      onBuyUpgrade('comfort', comfortCost);
                    }
                  }}
                  disabled={coins < comfortCost}
                  className={`px-3 py-1.5 rounded text-xs font-bold border transition-all ${
                    coins >= comfortCost
                      ? 'bg-amber-600 hover:bg-amber-500 text-stone-950 border-amber-400 active:scale-95'
                      : 'bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed'
                  }`}
                >
                  Upgrade ({comfortCost}g)
                </button>
              </div>

              {/* 4. Automated Wiper System */}
              <div className="p-3.5 rounded-lg bg-black/40 border border-amber-800/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-blue-900/40 text-blue-300 border border-blue-600/30">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-serif-vintage text-sm font-bold text-amber-200">
                      Pneumatic Window Wipers
                    </h4>
                    <p className="text-xs text-stone-400">
                      Automated high-speed glass sweepers that sweep away rain drops in storms.
                    </p>
                  </div>
                </div>
                {upgrades.wiperSystem ? (
                  <span className="text-xs text-emerald-400 font-semibold px-2 py-1 bg-emerald-950/60 rounded border border-emerald-600/40">
                    Installed ✓
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      if (coins >= wiperCost) {
                        audioEngine.playCoin();
                        onBuyUpgrade('wipers', wiperCost);
                      }
                    }}
                    disabled={coins < wiperCost}
                    className={`px-3 py-1.5 rounded text-xs font-bold border transition-all ${
                      coins >= wiperCost
                        ? 'bg-amber-600 hover:bg-amber-500 text-stone-950 border-amber-400 active:scale-95'
                        : 'bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed'
                    }`}
                  >
                    Install ({wiperCost}g)
                  </button>
                )}
              </div>

              {/* 5. Aerodynamic Cowling */}
              <div className="p-3.5 rounded-lg bg-black/40 border border-amber-800/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-indigo-900/40 text-indigo-300 border border-indigo-600/30">
                    <Gauge className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-serif-vintage text-sm font-bold text-amber-200">
                      Streamlined Express Cowling
                    </h4>
                    <p className="text-xs text-stone-400">
                      Streamlined bronze nose cone granting +15 km/h passive baseline speed boost.
                    </p>
                  </div>
                </div>
                {upgrades.aerodynamicCowling ? (
                  <span className="text-xs text-emerald-400 font-semibold px-2 py-1 bg-emerald-950/60 rounded border border-emerald-600/40">
                    Installed ✓
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      if (coins >= aeroCost) {
                        audioEngine.playCoin();
                        onBuyUpgrade('aerodynamics', aeroCost);
                      }
                    }}
                    disabled={coins < aeroCost}
                    className={`px-3 py-1.5 rounded text-xs font-bold border transition-all ${
                      coins >= aeroCost
                        ? 'bg-amber-600 hover:bg-amber-500 text-stone-950 border-amber-400 active:scale-95'
                        : 'bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed'
                    }`}
                  >
                    Install ({aeroCost}g)
                  </button>
                )}
              </div>
            </div>
          ) : (
            // INTERIOR AESTHETIC CUSTOMIZATION
            <div className="space-y-5">
              {/* Wood Finishes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-300 mb-2">
                  Carriage Wood Panelling
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'vintage_mahogany', name: 'Vintage Mahogany', desc: 'Classic Orient Express warm red-brown' },
                    { id: 'nordic_birch', name: 'Nordic Birch', desc: 'Light golden grain alpine look' },
                    { id: 'midnight_walnut', name: 'Midnight Slate Walnut', desc: 'Modern deep obsidian noir' },
                    { id: 'art_deco_rosewood', name: 'Art-Deco Rosewood', desc: 'Polished ruby luxury veneer' },
                  ].map((w) => (
                    <button
                      key={w.id}
                      onClick={() => onUpdateCustomization({ woodFinish: w.id as CompartmentCustomization['woodFinish'] })}
                      className={`p-2.5 rounded-lg text-left border transition-all flex items-start justify-between ${
                        customization.woodFinish === w.id
                          ? 'bg-amber-900/60 border-amber-400 text-amber-100 shadow'
                          : 'bg-black/40 border-stone-800 text-stone-300 hover:border-amber-800'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold">{w.name}</div>
                        <div className="text-[10px] text-stone-400">{w.desc}</div>
                      </div>
                      {customization.woodFinish === w.id && <Check className="w-4 h-4 text-amber-300" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Booth Upholstery */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-300 mb-2">
                  Plush Booth Upholstery
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'crimson_velvet', name: 'Imperial Crimson Velvet', colorClass: 'bg-red-900' },
                    { id: 'forest_tweed', name: 'Highland Forest Tweed', colorClass: 'bg-emerald-900' },
                    { id: 'royal_navy', name: 'Royal Navy Blue', colorClass: 'bg-blue-900' },
                    { id: 'golden_brocade', name: 'Emperor Golden Brocade', colorClass: 'bg-yellow-800' },
                  ].map((u) => (
                    <button
                      key={u.id}
                      onClick={() => onUpdateCustomization({ upholstery: u.id as CompartmentCustomization['upholstery'] })}
                      className={`p-2 rounded-lg text-left border transition-all flex items-center justify-between ${
                        customization.upholstery === u.id
                          ? 'bg-amber-900/60 border-amber-400 text-amber-100'
                          : 'bg-black/40 border-stone-800 text-stone-300 hover:border-amber-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-3.5 h-3.5 rounded-full ${u.colorClass} border border-white/20`} />
                        <span className="text-xs font-medium">{u.name}</span>
                      </div>
                      {customization.upholstery === u.id && <Check className="w-3.5 h-3.5 text-amber-300" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Window Frame Material */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-300 mb-2">
                  Window Bevel Frame
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'polished_brass', name: 'Polished Brass' },
                    { id: 'dark_walnut', name: 'Dark Walnut Wood' },
                    { id: 'riveted_steel', name: 'Riveted Industrial Steel' },
                    { id: 'gilded_pullman', name: 'Gilded Pullman Gold' },
                  ].map((wf) => (
                    <button
                      key={wf.id}
                      onClick={() => onUpdateCustomization({ windowFrame: wf.id as CompartmentCustomization['windowFrame'] })}
                      className={`p-2 rounded-lg text-left border transition-all flex items-center justify-between ${
                        customization.windowFrame === wf.id
                          ? 'bg-amber-900/60 border-amber-400 text-amber-100'
                          : 'bg-black/40 border-stone-800 text-stone-300 hover:border-amber-800'
                      }`}
                    >
                      <span className="text-xs font-medium">{wf.name}</span>
                      {customization.windowFrame === wf.id && <Check className="w-3.5 h-3.5 text-amber-300" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Curtain Color */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-300 mb-2">
                  Velvet Drapery Color
                </label>
                <div className="flex gap-2">
                  {(['burgundy', 'emerald', 'sapphire', 'amber'] as const).map((color) => (
                    <button
                      key={color}
                      onClick={() => onUpdateCustomization({ curtainColor: color })}
                      className={`flex-1 py-1.5 rounded capitalize text-xs font-medium border text-center transition-all ${
                        customization.curtainColor === color
                          ? 'bg-amber-500 text-stone-950 border-amber-300 font-bold'
                          : 'bg-black/40 border-stone-800 text-stone-300 hover:border-amber-700'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
