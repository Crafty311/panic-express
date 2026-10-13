import React, { useState } from 'react';
import { TrainUpgrades, CompartmentCustomization } from '../types/game';
import { X, Gauge, Paintbrush, Check } from 'lucide-react';
import { audioEngine } from '../services/audioService';

interface UpgradeShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  coins: number;
  upgrades: TrainUpgrades;
  customization: CompartmentCustomization;
  onBuySpeed: (cost: number) => void;
  onBuyBento: (cost: number) => void;
  onBuyExtraHeart: (cost: number) => void;
  onUpdateCustomization: (custom: Partial<CompartmentCustomization>) => void;
}

export const UpgradeShopModal: React.FC<UpgradeShopModalProps> = ({
  isOpen,
  onClose,
  coins,
  upgrades,
  customization,
  onBuySpeed,
  onBuyBento,
  onBuyExtraHeart,
  onUpdateCustomization,
}) => {
  const [tab, setTab] = useState<'train' | 'cabin'>('train');

  if (!isOpen) return null;

  const speedCost = (upgrades.maxSpeedLevel + 1) * 75;
  const bentoCost = (upgrades.bentoBoxLevel + 1) * 60;
  const heartCost = 150;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1c1917]/50 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white/95 backdrop-blur-xl border border-[#1c1917]/15 rounded-3xl p-6 sm:p-8 shadow-[0_30px_60px_rgba(0,0,0,0.12)] flex flex-col gap-5 text-[#1c1917]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1c1917]/10 pb-4">
          <div>
            <span className="font-mono-space text-[10px] uppercase tracking-[0.15em] text-[#d97706] font-semibold block">
              Rolling Stock Atelier & Depot
            </span>
            <h2 className="font-serif-cormorant italic text-3xl font-semibold text-[#1c1917] leading-tight">
              Locomotive Modifications
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-[#f8f7f4] border border-[#1c1917]/10 px-3.5 py-1.5 rounded-full text-xs font-mono-space font-semibold text-[#1c1917]">
              <span>🪙</span>
              <span>{coins} Coins</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-[#1c1917]/10 text-[#1c1917]/60 hover:text-[#1c1917] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2">
          <button
            onClick={() => setTab('train')}
            className={`flex-1 py-2.5 rounded-full text-xs font-mono-space uppercase tracking-wider border transition-all flex items-center justify-center gap-2 ${
              tab === 'train'
                ? 'bg-[#1c1917] text-[#f8f7f4] border-[#1c1917]'
                : 'bg-[#f8f7f4] border-[#1c1917]/10 text-[#1c1917]/70 hover:text-[#1c1917]'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>Locomotive Performance</span>
          </button>
          <button
            onClick={() => setTab('cabin')}
            className={`flex-1 py-2.5 rounded-full text-xs font-mono-space uppercase tracking-wider border transition-all flex items-center justify-center gap-2 ${
              tab === 'cabin'
                ? 'bg-[#1c1917] text-[#f8f7f4] border-[#1c1917]'
                : 'bg-[#f8f7f4] border-[#1c1917]/10 text-[#1c1917]/70 hover:text-[#1c1917]'
            }`}
          >
            <Paintbrush className="w-3.5 h-3.5" />
            <span>Salon Interior Finishes</span>
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[55vh] overflow-y-auto space-y-3 py-1 pr-1">
          {tab === 'train' ? (
            <>
              {/* Speed upgrade */}
              <div className="p-4 bg-[#f8f7f4] border border-[#1c1917]/10 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="font-serif-cormorant text-lg font-semibold text-[#1c1917]">
                    Turbo Overdrive (Tier {upgrades.maxSpeedLevel})
                  </div>
                  <div className="text-xs font-sans-inter text-[#1c1917]/65">
                    Expands maximum velocity and station arrival tempo.
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (coins >= speedCost) {
                      audioEngine.playPop();
                      onBuySpeed(speedCost);
                    }
                  }}
                  disabled={coins < speedCost}
                  className={`px-5 py-2 rounded-full text-xs font-mono-space uppercase tracking-wider transition-all border ${
                    coins >= speedCost
                      ? 'bg-[#1c1917] hover:bg-stone-800 text-[#f8f7f4] border-[#1c1917] active:scale-95 shadow-sm'
                      : 'bg-[#1c1917]/5 text-[#1c1917]/30 border-transparent cursor-not-allowed'
                  }`}
                >
                  {speedCost} 🪙
                </button>
              </div>

              {/* Bento Box Bonus */}
              <div className="p-4 bg-[#f8f7f4] border border-[#1c1917]/10 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="font-serif-cormorant text-lg font-semibold text-[#1c1917]">
                    Dining Car Hospitality (Tier {upgrades.bentoBoxLevel})
                  </div>
                  <div className="text-xs font-sans-inter text-[#1c1917]/65">
                    Awards +15 bonus coins for each completed signal milestone.
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (coins >= bentoCost) {
                      audioEngine.playPop();
                      onBuyBento(bentoCost);
                    }
                  }}
                  disabled={coins < bentoCost}
                  className={`px-5 py-2 rounded-full text-xs font-mono-space uppercase tracking-wider transition-all border ${
                    coins >= bentoCost
                      ? 'bg-[#1c1917] hover:bg-stone-800 text-[#f8f7f4] border-[#1c1917] active:scale-95 shadow-sm'
                      : 'bg-[#1c1917]/5 text-[#1c1917]/30 border-transparent cursor-not-allowed'
                  }`}
                >
                  {bentoCost} 🪙
                </button>
              </div>

              {/* Extra Heart */}
              <div className="p-4 bg-[#f8f7f4] border border-[#1c1917]/10 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="font-serif-cormorant text-lg font-semibold text-[#1c1917]">
                    Life Reserve Capacity (4th Heart)
                  </div>
                  <div className="text-xs font-sans-inter text-[#1c1917]/65">
                    Grants a permanent 4th safety life for conductor challenges.
                  </div>
                </div>
                {upgrades.extraHeartUnlocked ? (
                  <span className="text-xs font-mono-space uppercase tracking-wider text-emerald-800 bg-emerald-100 border border-emerald-300 px-3.5 py-1.5 rounded-full font-semibold">
                    Equipped ✓
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      if (coins >= heartCost) {
                        audioEngine.playPop();
                        onBuyExtraHeart(heartCost);
                      }
                    }}
                    disabled={coins < heartCost}
                    className={`px-5 py-2 rounded-full text-xs font-mono-space uppercase tracking-wider transition-all border ${
                      coins >= heartCost
                        ? 'bg-[#1c1917] hover:bg-stone-800 text-[#f8f7f4] border-[#1c1917] active:scale-95 shadow-sm'
                        : 'bg-[#1c1917]/5 text-[#1c1917]/30 border-transparent cursor-not-allowed'
                    }`}
                  >
                    {heartCost} 🪙
                  </button>
                )}
              </div>
            </>
          ) : (
            // Salon Customization
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono-space tracking-widest uppercase text-[#d97706] font-semibold mb-2">
                  Carriage Wood Finish
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'warm_oak', label: 'Warm Honey Oak' },
                    { id: 'nordic_birch', label: 'Nordic White Birch' },
                    { id: 'midnight_walnut', label: 'Midnight Slate Walnut' },
                    { id: 'smoked_eucalyptus', label: 'Smoked Eucalyptus' },
                  ].map((w) => (
                    <button
                      key={w.id}
                      onClick={() => onUpdateCustomization({ woodStyle: w.id as any })}
                      className={`p-3 rounded-2xl border text-left text-xs font-medium transition-all flex items-center justify-between ${
                        customization.woodStyle === w.id
                          ? 'bg-[#1c1917] text-[#f8f7f4] border-[#1c1917]'
                          : 'bg-[#f8f7f4] border-[#1c1917]/10 text-[#1c1917] hover:border-[#1c1917]/30'
                      }`}
                    >
                      <span className="font-serif-cormorant text-sm">{w.label}</span>
                      {customization.woodStyle === w.id && <Check className="w-4 h-4 text-[#d97706]" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono-space tracking-widest uppercase text-[#d97706] font-semibold mb-2">
                  Booth Velvet Upholstery
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'emerald_velvet', label: 'Emerald Velvet', color: 'bg-emerald-700' },
                    { id: 'deep_navy', label: 'Royal Navy', color: 'bg-sky-800' },
                    { id: 'cognac_leather', label: 'Cognac Saddle', color: 'bg-amber-800' },
                    { id: 'charcoal_slate', label: 'Charcoal Slate', color: 'bg-stone-700' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => onUpdateCustomization({ seatColor: s.id as any })}
                      className={`p-3 rounded-2xl border text-left text-xs font-medium transition-all flex items-center justify-between ${
                        customization.seatColor === s.id
                          ? 'bg-[#1c1917] text-[#f8f7f4] border-[#1c1917]'
                          : 'bg-[#f8f7f4] border-[#1c1917]/10 text-[#1c1917] hover:border-[#1c1917]/30'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-3.5 h-3.5 rounded-full ${s.color}`} />
                        <span className="font-serif-cormorant text-sm">{s.label}</span>
                      </div>
                      {customization.seatColor === s.id && <Check className="w-4 h-4 text-[#d97706]" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono-space tracking-widest uppercase text-[#d97706] font-semibold mb-2">
                  Observation Table Accents
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'hot_coffee', label: 'Espresso Roast', icon: '☕' },
                    { id: 'modern_succulent', label: 'Highland Moss', icon: '🪴' },
                    { id: 'brass_chronometer', label: 'Rail Chronometer', icon: '⏱️' },
                    { id: 'designer_headphones', label: 'Studio Phones', icon: '🎧' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => onUpdateCustomization({ tableTrinket: t.id as any })}
                      className={`p-3 rounded-2xl border text-left text-xs font-medium transition-all flex items-center justify-between ${
                        customization.tableTrinket === t.id
                          ? 'bg-[#1c1917] text-[#f8f7f4] border-[#1c1917]'
                          : 'bg-[#f8f7f4] border-[#1c1917]/10 text-[#1c1917] hover:border-[#1c1917]/30'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{t.icon}</span>
                        <span className="font-serif-cormorant text-sm">{t.label}</span>
                      </div>
                      {customization.tableTrinket === t.id && <Check className="w-4 h-4 text-[#d97706]" />}
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
