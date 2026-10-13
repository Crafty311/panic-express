import React from 'react';
import { Station, Passenger } from '../types/game';
import { 
  X, 
  MapPin, 
  Coins, 
  Users, 
  Wind, 
  Flame, 
  ChevronRight,
  Sparkles,
  Mountain
} from 'lucide-react';
import { audioEngine } from '../services/audioService';

interface StationArrivalModalProps {
  isOpen: boolean;
  station: Station;
  nextStation: Station;
  disembarkingPassengers: Passenger[];
  newPassengers: Passenger[];
  totalEarnings: number;
  fuel: number;
  maxFuel: number;
  onRefuel: () => void;
  onDepartStation: () => void;
}

export const StationArrivalModal: React.FC<StationArrivalModalProps> = ({
  isOpen,
  station,
  nextStation,
  disembarkingPassengers,
  newPassengers,
  totalEarnings,
  fuel,
  maxFuel,
  onRefuel,
  onDepartStation,
}) => {
  if (!isOpen) return null;

  const fuelPercentage = Math.round((fuel / maxFuel) * 100);

  const handleDepart = () => {
    audioEngine.playWhistle();
    onDepartStation();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#2a1711] via-[#1c0f0a] to-[#0c0604] border-2 border-amber-500/80 rounded-xl shadow-[0_0_50px_rgba(245,158,11,0.35)] overflow-hidden text-stone-200">
        
        {/* Vintage Station Signboard Header */}
        <div className="p-6 bg-gradient-to-r from-amber-950 via-stone-900 to-amber-950 border-b-2 border-amber-600/60 text-center relative">
          <div className="inline-block px-4 py-1 rounded bg-black/60 border border-amber-400/40 text-[10px] tracking-widest text-amber-300 uppercase mb-2">
            TERMINAL ARRIVAL PLATFORM
          </div>
          <h2 className="font-serif-vintage text-2xl sm:text-3xl font-extrabold text-amber-200 tracking-wider">
            {station.name}
          </h2>
          <div className="flex items-center justify-center gap-3 text-xs text-stone-400 mt-1">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              {station.region}
            </span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1">
              <Mountain className="w-3.5 h-3.5 text-amber-400" />
              Elevation: {station.elevationMeters}m
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Station Lore & Landmark */}
          <div className="p-3.5 rounded-lg bg-black/40 border border-amber-900/60 text-xs text-stone-300 leading-relaxed">
            <span className="text-amber-300 font-semibold">Scenic Panorama: </span>
            {station.description} (Notable landmark: <strong className="text-amber-200">{station.landmark}</strong>).
          </div>

          {/* Passenger Earnings & Disembarkation */}
          <div className="p-4 rounded-lg bg-amber-950/40 border border-amber-600/50 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-300" />
                <h3 className="font-serif-vintage text-sm font-bold text-amber-200">
                  Passenger Ticket Settlements & Fares
                </h3>
              </div>
              <div className="flex items-center gap-1 text-sm font-mono font-bold text-amber-400 bg-black/60 px-2.5 py-1 rounded border border-amber-500/40">
                <Coins className="w-4 h-4" />
                <span>+{totalEarnings}g Earned</span>
              </div>
            </div>

            {disembarkingPassengers.length > 0 ? (
              <div className="space-y-2 mt-1">
                <span className="text-[11px] text-stone-400">Disembarking passengers gave their parting thoughts:</span>
                {disembarkingPassengers.map((p) => (
                  <div key={p.id} className="p-2.5 rounded bg-black/50 border border-stone-800 flex items-start gap-3 text-xs">
                    <span className="text-xl">{p.avatar}</span>
                    <div className="flex-1">
                      <div className="flex justify-between items-baseline">
                        <span className="font-semibold text-amber-300">{p.name} ({p.role})</span>
                        <span className="text-emerald-400 font-mono text-[11px]">+{p.farePaid + p.tipPaid}g</span>
                      </div>
                      <p className="text-stone-300 italic mt-0.5">&ldquo;{p.dialogue}&rdquo;</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-400 italic">No passengers disembarking at this terminal.</p>
            )}
          </div>

          {/* New Boarding Passengers */}
          <div className="p-4 rounded-lg bg-stone-900/50 border border-stone-800 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎟️</span>
                <h3 className="font-serif-vintage text-sm font-bold text-amber-200">
                  New Passengers Boarding the Express ({newPassengers.length})
                </h3>
              </div>
              <span className="text-[11px] text-stone-400">Heading to {nextStation.name}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
              {newPassengers.map((np) => (
                <div key={np.id} className="p-2 rounded bg-black/40 border border-amber-950 flex items-center gap-2.5 text-xs">
                  <span className="text-xl">{np.avatar}</span>
                  <div>
                    <span className="font-medium text-amber-200">{np.name}</span>
                    <span className="block text-[10px] text-stone-400">{np.role} · Luggage: {np.luggage}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Locomotive Refueling Section */}
          <div className="p-4 rounded-lg bg-stone-950/70 border border-amber-900/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-900/30 text-orange-400 border border-orange-500/30">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <span className="font-serif-vintage text-xs font-bold text-amber-200">Boiler Fuel Reserve</span>
                <span className="block text-[11px] text-stone-400">Current level: {fuelPercentage}%</span>
              </div>
            </div>
            <button
              onClick={onRefuel}
              disabled={fuelPercentage >= 95}
              className={`px-3 py-1.5 rounded text-xs font-semibold border transition-all ${
                fuelPercentage >= 95 
                  ? 'bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed'
                  : 'bg-amber-700 hover:bg-amber-600 text-white border-amber-500 active:scale-95'
              }`}
            >
              Refuel Tank (15g)
            </button>
          </div>
        </div>

        {/* Modal Footer with Departure CTA */}
        <div className="p-4 bg-gradient-to-t from-black via-stone-950 to-stone-900 border-t border-amber-700/60 flex items-center justify-between">
          <div className="text-xs text-stone-400">
            Next Stop: <strong className="text-amber-300">{nextStation.name}</strong> ({nextStation.distanceKm} km)
          </div>
          <button
            onClick={handleDepart}
            className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-stone-950 font-extrabold text-sm shadow-xl active:scale-95 transition-all flex items-center gap-2"
          >
            <span>All Aboard · Depart Platform</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
