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
  isNightMode?: boolean;
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
  isNightMode = false,
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

  const handleClose = () => {
    audioEngine.playMechanicalClick();
    onClose();
  };

  const handleTabChange = (t: 'train' | 'cabin') => {
    audioEngine.playMechanicalClick();
    setTab(t);
  };

  const handlePurchase = (fn: () => void, cost: number) => {
    if (coins >= cost) {
      audioEngine.playWin();
      fn();
    } else {
      audioEngine.playFail();
    }
  };

  const handleCustomSelect = (partial: Partial<CompartmentCustomization>) => {
    audioEngine.playMechanicalClick();
    onUpdateCustomization(partial);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`relative w-full max-w-xl border rounded-3xl p-6 sm:p-8 shadow-[0_30px_60px_rgba(0,0,0,0.25)] flex flex-col gap-5 transition-colors duration-300 ${
        isNightMode
          ? 'bg-stone-900/95 border-[#f8f7f4]/20 text-[#f8f7f4]'
          : 'bg-white/95 border-[#1c1917]/15 text-[#1c1917]'
      }`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between border-b pb-4 ${isNightMode ? 'border-[#f8f7f4]/10' : 'border-[#1c1917]/10'}`}>
          <div>
            <span className="font-mono-space text-[10px] uppercase tracking-[0.15em] text-[#d97706] font-semibold block">
              Rolling Stock Atelier & Depot
            </span>
            <h2 className="font-serif-cormorant italic text-3xl font-semibold leading-tight">
              Locomotive Modifications
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono-space font-semibold border ${
              isNightMode ? 'bg-stone-800 border-[#f8f7f4]/15 text-[#f8f7f4]' : 'bg-[#f8f7f4] border-[#1c1917]/10 text-[#1c1917]'
            }`}>
              <span>🪙</span>
              <span>{coins} Coins</span>
            </div>
            <button
              onClick={handleClose}
              className={`p-1.5 rounded-full transition-colors ${
                isNightMode ? 'hover:bg-[#f8f7f4]/10 text-[#f8f7f4]/60 hover:text-[#f8f7f4]' : 'hover:bg-[#1c1917]/10 text-[#1c1917]/60 hover:text-[#1c1917]'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2">
          <button
            onClick={() => handleTabChange('train')}
            className={`flex-1 py-2.5 rounded-full text-xs font-mono-space uppercase tracking-wider border transition-all flex items-center justify-center gap-2 ${
              tab === 'train'
                ? isNightMode ? 'bg-[#f8f7f4] text-[#1c1917] border-transparent font-bold' : 'bg-[#1c1917] text-[#f8f7f4] border-transparent font-bold'
                : isNightMode ? 'border-[#f8f7f4]/20 hover:bg-[#f8f7f4]/10' : 'border-[#1c1917]/20 hover:bg-[#1c1917]/5'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>Locomotive Upgrades</span>
          </button>
          <button
            onClick={() => handleTabChange('cabin')}
            className={`flex-1 py-2.5 rounded-full text-xs font-mono-space uppercase tracking-wider border transition-all flex items-center justify-center gap-2 ${
              tab === 'cabin'
                ? isNightMode ? 'bg-[#f8f7f4] text-[#1c1917] border-transparent font-bold' : 'bg-[#1c1917] text-[#f8f7f4] border-transparent font-bold'
                : isNightMode ? 'border-[#f8f7f4]/20 hover:bg-[#f8f7f4]/10' : 'border-[#1c1917]/20 hover:bg-[#1c1917]/5'
            }`}
          >
            <Paintbrush className="w-3.5 h-3.5" />
            <span>Salon Customization</span>
          </button>
        </div>

        {/* Tab 1: Locomotive Upgrades */}
        {tab === 'train' && (
          <div className="flex flex-col gap-3 py-1">
            {/* Speed */}
            <div className={`p-4 border rounded-2xl flex items-center justify-between gap-4 ${
              isNightMode ? 'bg-stone-800/60 border-[#f8f7f4]/10' : 'bg-[#f8f7f4] border-[#1c1917]/10'
            }`}>
              <div>
                <div className="font-serif-cormorant text-xl font-semibold">Traction Motor Overdrive</div>
                <div className={`text-xs mt-0.5 ${isNightMode ? 'text-[#f8f7f4]/60' : 'text-[#1c1917]/60'}`}>
                  Current Tier {upgrades.maxSpeedLevel} · Increases cruising speed by +15 km/h
                </div>
              </div>
              <button
                onClick={() => handlePurchase(() => onBuySpeed(speedCost), speedCost)}
                disabled={coins < speedCost}
                className={`px-4 py-2 rounded-full font-mono-space text-xs uppercase tracking-wider font-semibold transition-all active:scale-95 ${
                  coins >= speedCost
                    ? isNightMode ? 'bg-amber-400 text-stone-950 hover:bg-amber-300' : 'bg-[#1c1917] hover:bg-stone-800 text-[#f8f7f4]'
                    : 'bg-stone-400/20 text-stone-400 cursor-not-allowed'
                }`}
              >
                🪙 {speedCost} Coins
              </button>
            </div>

            {/* Bento */}
            <div className={`p-4 border rounded-2xl flex items-center justify-between gap-4 ${
              isNightMode ? 'bg-stone-800/60 border-[#f8f7f4]/10' : 'bg-[#f8f7f4] border-[#1c1917]/10'
            }`}>
              <div>
                <div className="font-serif-cormorant text-xl font-semibold">Gourmet Bento Refreshment</div>
                <div className={`text-xs mt-0.5 ${isNightMode ? 'text-[#f8f7f4]/60' : 'text-[#1c1917]/60'}`}>
                  Level {upgrades.bentoBoxLevel} · Grants +15 bonus coins on all semaphore challenges
                </div>
              </div>
              <button
                onClick={() => handlePurchase(() => onBuyBento(bentoCost), bentoCost)}
                disabled={coins < bentoCost}
                className={`px-4 py-2 rounded-full font-mono-space text-xs uppercase tracking-wider font-semibold transition-all active:scale-95 ${
                  coins >= bentoCost
                    ? isNightMode ? 'bg-amber-400 text-stone-950 hover:bg-amber-300' : 'bg-[#1c1917] hover:bg-stone-800 text-[#f8f7f4]'
                    : 'bg-stone-400/20 text-stone-400 cursor-not-allowed'
                }`}
              >
                🪙 {bentoCost} Coins
              </button>
            </div>

            {/* Extra Heart */}
            <div className={`p-4 border rounded-2xl flex items-center justify-between gap-4 ${
              isNightMode ? 'bg-stone-800/60 border-[#f8f7f4]/10' : 'bg-[#f8f7f4] border-[#1c1917]/10'
            }`}>
              <div>
                <div className="font-serif-cormorant text-xl font-semibold">Emergency Brake Boiler (4th Heart)</div>
                <div className={`text-xs mt-0.5 ${isNightMode ? 'text-[#f8f7f4]/60' : 'text-[#1c1917]/60'}`}>
                  {upgrades.extraHeartUnlocked ? 'Unlocked · Maximum safety boiler active' : 'Expands maximum journey resilience to 4 hearts'}
                </div>
              </div>
              {upgrades.extraHeartUnlocked ? (
                <span className="font-mono-space text-xs text-emerald-400 font-semibold px-4 py-2 border border-emerald-400/30 rounded-full flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Equipped
                </span>
              ) : (
                <button
                  onClick={() => handlePurchase(() => onBuyExtraHeart(heartCost), heartCost)}
                  disabled={coins < heartCost}
                  className={`px-4 py-2 rounded-full font-mono-space text-xs uppercase tracking-wider font-semibold transition-all active:scale-95 ${
                    coins >= heartCost
                      ? isNightMode ? 'bg-amber-400 text-stone-950 hover:bg-amber-300' : 'bg-[#1c1917] hover:bg-stone-800 text-[#f8f7f4]'
                      : 'bg-stone-400/20 text-stone-400 cursor-not-allowed'
                  }`}
                >
                  🪙 {heartCost} Coins
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Salon Customization */}
        {tab === 'cabin' && (
          <div className="flex flex-col gap-4 py-1">
            {/* Table Companion Trinket */}
            <div>
              <span className="font-mono-space text-[10px] uppercase tracking-wider text-[#d97706] font-semibold block mb-2">
                Observation Salon Table Trinket
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'hot_coffee' as const, label: 'Espresso Roast', icon: '☕' },
                  { id: 'modern_succulent' as const, label: 'Highland Moss', icon: '🪴' },
                  { id: 'brass_chronometer' as const, label: 'Chronometer', icon: '⏱️' },
                  { id: 'designer_headphones' as const, label: 'Monitor Phones', icon: '🎧' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleCustomSelect({ tableTrinket: item.id })}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      customization.tableTrinket === item.id
                        ? isNightMode ? 'border-amber-400 bg-amber-400/15' : 'border-[#1c1917] bg-[#1c1917]/5'
                        : isNightMode ? 'border-[#f8f7f4]/15 hover:border-[#f8f7f4]/40' : 'border-[#1c1917]/15 hover:border-[#1c1917]/40'
                    }`}
                  >
                    <div className="text-2xl mb-1">{item.icon}</div>
                    <div className="text-xs font-semibold">{item.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Coach Velvet Seat Color */}
            <div>
              <span className="font-mono-space text-[10px] uppercase tracking-wider text-[#d97706] font-semibold block mb-2">
                Upholstery Material
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'emerald_velvet' as const, label: 'Emerald Velvet', color: 'bg-emerald-700' },
                  { id: 'deep_navy' as const, label: 'Deep Navy', color: 'bg-indigo-900' },
                  { id: 'cognac_leather' as const, label: 'Cognac Leather', color: 'bg-amber-800' },
                  { id: 'charcoal_slate' as const, label: 'Charcoal Slate', color: 'bg-stone-800' },
                ].map((seat) => (
                  <button
                    key={seat.id}
                    onClick={() => handleCustomSelect({ seatColor: seat.id })}
                    className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-all ${
                      customization.seatColor === seat.id
                        ? isNightMode ? 'border-amber-400 bg-amber-400/15' : 'border-[#1c1917] bg-[#1c1917]/5'
                        : isNightMode ? 'border-[#f8f7f4]/15 hover:border-[#f8f7f4]/40' : 'border-[#1c1917]/15 hover:border-[#1c1917]/40'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full ${seat.color} border border-white/20 shrink-0`} />
                    <span className="text-xs font-semibold">{seat.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
