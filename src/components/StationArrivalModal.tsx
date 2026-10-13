import React from 'react';
import { Station, Passenger } from '../types/game';
import { ArrowRight, Heart, Compass } from 'lucide-react';
import { audioEngine } from '../services/audioService';

interface StationArrivalModalProps {
  isOpen: boolean;
  station: Station;
  nextStation: Station;
  rewardCoins: number;
  newPassenger: Passenger;
  onContinue: () => void;
}

export const StationArrivalModal: React.FC<StationArrivalModalProps> = ({
  isOpen,
  station,
  nextStation,
  rewardCoins,
  newPassenger,
  onContinue,
}) => {
  if (!isOpen) return null;

  const handleNext = () => {
    audioEngine.playWhistle();
    onContinue();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1c1917]/50 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white/95 backdrop-blur-xl border border-[#1c1917]/15 rounded-3xl p-6 sm:p-9 shadow-[0_30px_60px_rgba(0,0,0,0.12)] flex flex-col items-center gap-6 text-[#1c1917] text-center">
        
        {/* Terminal Header */}
        <div className="flex flex-col items-center">
          <span className="font-mono-space text-[10px] uppercase tracking-[0.15em] text-[#d97706] font-semibold mb-1">
            Terminal Platform Reached
          </span>
          <h2 className="font-serif-cormorant italic text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#1c1917] leading-none my-1">
            {station.name}
          </h2>
          <p className="font-sans-inter text-xs text-[#1c1917]/70 mt-1 max-w-md leading-relaxed">
            {station.description}
          </p>
        </div>

        {/* Rewards Box */}
        <div className="w-full grid grid-cols-2 gap-3 text-left">
          <div className="p-4 bg-[#f8f7f4] border border-[#1c1917]/10 rounded-2xl flex items-center gap-3.5">
            <span className="text-3xl">🪙</span>
            <div>
              <span className="font-mono-space text-[9px] uppercase tracking-wider text-[#d97706] font-medium block">
                Fare Settlement
              </span>
              <div className="font-serif-cormorant text-2xl font-semibold text-[#1c1917] leading-tight">
                +{rewardCoins} Coins
              </div>
            </div>
          </div>

          <div className="p-4 bg-[#f8f7f4] border border-[#1c1917]/10 rounded-2xl flex items-center gap-3.5">
            <Heart className="w-7 h-7 text-rose-600 fill-rose-600 shrink-0" />
            <div>
              <span className="font-mono-space text-[9px] uppercase tracking-wider text-[#d97706] font-medium block">
                Terminal Respite
              </span>
              <div className="font-serif-cormorant text-lg font-semibold text-emerald-800 leading-tight">
                Lives Refilled
              </div>
            </div>
          </div>
        </div>

        {/* Boarding Passenger */}
        <div className="w-full p-4 bg-[#f8f7f4] border border-[#1c1917]/10 rounded-2xl flex items-center gap-3.5 text-left">
          <span className="text-4xl shrink-0">{newPassenger.avatar}</span>
          <div className="flex-1">
            <div className="text-sm font-semibold text-[#1c1917] flex items-center gap-2">
              <span className="font-serif-cormorant text-base">{newPassenger.name}</span>
              <span className="font-mono-space text-[10px] text-[#1c1917]/60">({newPassenger.role})</span>
            </div>
            <div className="text-xs text-[#d97706] italic font-serif-cormorant mt-0.5">&ldquo;{newPassenger.quirk}&rdquo;</div>
          </div>
        </div>

        {/* Next Destination info */}
        <div className="text-xs text-[#1c1917]/70 flex items-center gap-1.5 font-mono-space">
          <Compass className="w-3.5 h-3.5 text-[#d97706]" />
          <span>Next Route Leg: <strong className="text-[#1c1917]">{nextStation.name}</strong> ({nextStation.distanceKm} km)</span>
        </div>

        {/* Depart Button */}
        <button
          onClick={handleNext}
          className="w-full py-3.5 rounded-full bg-[#1c1917] hover:bg-stone-800 text-[#f8f7f4] font-mono-space text-xs uppercase tracking-wider shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <span>Depart Platform · Continue Journey</span>
          <ArrowRight className="w-4 h-4" />
        </button>

      </div>
    </div>
  );
};
