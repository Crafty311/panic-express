import React, { useState } from 'react';
import { 
  CompartmentCustomization, 
  Station, 
  WeatherType, 
  TimeOfDay 
} from '../types/game';
import { 
  Volume2, 
  VolumeX, 
  Music, 
  Coffee, 
  Compass, 
  Sparkles,
  Wind,
  Flame,
  Radio,
  BookOpen,
  ShoppingBag,
  CloudSun
} from 'lucide-react';
import { audioEngine } from '../services/audioService';

interface CompartmentInteriorProps {
  customization: CompartmentCustomization;
  speedKmH: number;
  maxSpeedKmH: number;
  fuel: number;
  maxFuel: number;
  currentStation: Station;
  nextStation: Station;
  distanceToNextKm: number;
  coins: number;
  conductorPoints: number;
  passengersCount: number;
  weather: WeatherType;
  timeOfDay: TimeOfDay;
  onWhistleClick: () => void;
  onOpenChallenges: () => void;
  onOpenDepotUpgrades: () => void;
  onOpenWeatherControls: () => void;
  onRefuel: () => void;
  onToggleCurtains: () => void;
  onToggleWipers: () => void;
  wipersActive: boolean;
  onTakeSip: () => void;
  sipFeedback: boolean;
}

export const CompartmentInterior: React.FC<CompartmentInteriorProps> = ({
  customization,
  speedKmH,
  maxSpeedKmH,
  fuel,
  maxFuel,
  currentStation,
  nextStation,
  distanceToNextKm,
  coins,
  conductorPoints,
  passengersCount,
  weather,
  timeOfDay,
  onWhistleClick,
  onOpenChallenges,
  onOpenDepotUpgrades,
  onOpenWeatherControls,
  onRefuel,
  onToggleCurtains,
  onToggleWipers,
  wipersActive,
  onTakeSip,
  sipFeedback,
}) => {
  const [lampOn, setLampOn] = useState(true);
  const [radioOn, setRadioOn] = useState(false);
  const [radioTrack, setRadioTrack] = useState(0);
  const [isMuted, setIsMuted] = useState(audioEngine.getIsMuted());

  // Radio toggle
  const handleRadioClick = () => {
    const newState = audioEngine.toggleRadio();
    setRadioOn(newState);
  };

  const handleNextTrack = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextT = (radioTrack + 1) % 3;
    setRadioTrack(nextT);
    audioEngine.setRadioTrack(nextT);
  };

  const handleMuteToggle = () => {
    const newMute = !isMuted;
    setIsMuted(newMute);
    audioEngine.setMuted(newMute);
  };

  // Speedometer needle angle calculation (-120deg at 0 to +120deg at maxSpeed)
  const speedPercentage = Math.min(1, Math.max(0, speedKmH / maxSpeedKmH));
  const needleDeg = -120 + speedPercentage * 240;

  // Fuel percentage
  const fuelPercentage = Math.round((fuel / maxFuel) * 100);

  // Styling based on customization
  const woodThemeStyles = {
    vintage_mahogany: 'from-[#2e130c] via-[#451e12] to-[#1a0a07] border-[#5c2a1a]',
    nordic_birch: 'from-[#423125] via-[#5c4637] to-[#2b1f16] border-[#785c47]',
    midnight_walnut: 'from-[#141215] via-[#201c22] to-[#0a090c] border-[#38333e]',
    art_deco_rosewood: 'from-[#3a101d] via-[#57192d] to-[#200910] border-[#6b253b]',
  }[customization.woodFinish];

  const upholsteryStyles = {
    crimson_velvet: 'bg-[#5e121e] border-[#881c2d] shadow-[#3a0810]',
    forest_tweed: 'bg-[#153422] border-[#225438] shadow-[#0d2216]',
    royal_navy: 'bg-[#10223f] border-[#1d3d6e] shadow-[#091527]',
    golden_brocade: 'bg-[#574213] border-[#7d601f] shadow-[#382b0b]',
  }[customization.upholstery];

  const windowFrameStyles = {
    polished_brass: 'border-[#b48a47] shadow-[inset_0_0_20px_rgba(180,138,71,0.4)]',
    dark_walnut: 'border-[#3d2314] shadow-[inset_0_0_25px_rgba(20,10,5,0.8)]',
    riveted_steel: 'border-[#475569] shadow-[inset_0_0_20px_rgba(15,23,42,0.8)]',
    gilded_pullman: 'border-[#eab308] shadow-[inset_0_0_25px_rgba(234,179,8,0.5)]',
  }[customization.windowFrame];

  const curtainColors = {
    burgundy: 'from-[#600f1d] to-[#3a0610]',
    emerald: 'from-[#0d472b] to-[#062415]',
    sapphire: 'from-[#122854] to-[#09152e]',
    amber: 'from-[#784d12] to-[#452b09]',
  }[customization.curtainColor];

  const radioTrackNames = ['Lofi Steam Voyage', 'Rain Reverie', 'Midnight Pullman'];

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between overflow-hidden">
      {/* 1. TOP CARRIAGE CANOPY & LUGGAGE RACK */}
      <div className={`relative w-full z-20 pointer-events-auto bg-gradient-to-b ${woodThemeStyles} border-b-4 shadow-2xl px-6 py-3.5 flex items-center justify-between transition-colors duration-500`}>
        {/* Brass rivets along top beam */}
        <div className="absolute top-1 left-0 right-0 flex justify-around opacity-40 pointer-events-none">
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-sm" />
          ))}
        </div>

        {/* Left: Express Branding & Carriage Plaque */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-serif-vintage tracking-widest text-amber-200 text-lg font-bold drop-shadow-md">
                PANIC EXPRESS
              </span>
              <span className="text-xs text-amber-400/80 font-mono tracking-wider bg-black/40 px-2 py-0.5 rounded border border-amber-500/30">
                NO. 402 · FIRST CLASS
              </span>
            </div>
            <div className="text-xs text-stone-300/80 flex items-center gap-2 mt-0.5">
              <span>{currentStation.region}</span>
              <span aria-hidden="true">·</span>
              <span>Alt: {currentStation.elevationMeters}m</span>
              <span aria-hidden="true">·</span>
              <span className="text-amber-300 font-medium">Route: Trans-Continental</span>
            </div>
          </div>
        </div>

        {/* Center: Journey Progress to Next Station */}
        <div className="hidden md:flex flex-col items-center w-80">
          <div className="flex justify-between w-full text-xs mb-1">
            <span className="text-stone-300 font-medium">{currentStation.name}</span>
            <span className="text-amber-300 font-bold font-mono">
              {distanceToNextKm.toFixed(1)} km to {nextStation.name}
            </span>
          </div>
          <div className="w-full bg-black/60 h-2.5 rounded-full overflow-hidden border border-amber-900/60 p-0.5">
            <div 
              className="bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-300 h-full rounded-full transition-all duration-300 shadow-sm"
              style={{
                width: `${Math.max(5, Math.min(100, ((nextStation.distanceKm - distanceToNextKm) / nextStation.distanceKm) * 100))}%`
              }}
            />
          </div>
          <span className="text-[10px] text-amber-200/70 mt-0.5 truncate max-w-full">
            Landmark: {nextStation.landmark}
          </span>
        </div>

        {/* Right: Currency & Conductor Metrics & Quick Nav Buttons */}
        <div className="flex items-center gap-3">
          {/* Conductor Points */}
          <div className="flex items-center gap-1.5 bg-black/40 border border-amber-600/40 px-3 py-1 rounded-md text-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <div className="flex flex-col items-end">
              <span className="text-[9px] uppercase tracking-wider text-stone-400">Points</span>
              <span className="font-mono font-bold text-amber-200">{conductorPoints}</span>
            </div>
          </div>

          {/* Gold Coins */}
          <div className="flex items-center gap-1.5 bg-black/40 border border-amber-600/40 px-3 py-1 rounded-md text-xs">
            <span className="text-sm">🪙</span>
            <div className="flex flex-col items-end">
              <span className="text-[9px] uppercase tracking-wider text-stone-400">Funds</span>
              <span className="font-mono font-bold text-amber-400">{coins}g</span>
            </div>
          </div>

          {/* Passengers on board */}
          <div className="hidden sm:flex items-center gap-1.5 bg-black/40 border border-amber-600/40 px-2.5 py-1 rounded-md text-xs">
            <span className="text-sm">👥</span>
            <div className="flex flex-col items-end">
              <span className="text-[9px] uppercase tracking-wider text-stone-400">Travelers</span>
              <span className="font-mono font-bold text-stone-200">{passengersCount}</span>
            </div>
          </div>

          {/* Depot Shop Modal trigger */}
          <button
            onClick={onOpenDepotUpgrades}
            className="flex items-center gap-1.5 bg-amber-700/80 hover:bg-amber-600 text-stone-100 px-3 py-1.5 rounded-md text-xs font-medium border border-amber-500/50 transition-all hover:scale-105 active:scale-95 shadow-md"
            title="Open Upgrades & Carriage Depot"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-amber-200" />
            <span className="hidden sm:inline">Depot & Upgrades</span>
          </button>

          {/* Audio Mute button */}
          <button
            onClick={handleMuteToggle}
            className="p-1.5 rounded-md bg-stone-900/60 hover:bg-stone-800 text-stone-300 border border-stone-700 transition-colors"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* 2. THE GRAND WINDOW BEVEL & CURTAIN BORDERS */}
      <div className="relative flex-1 w-full flex items-center justify-between pointer-events-none">
        {/* Left Booth Cushion & Drapery */}
        <div className="relative h-full flex items-center z-10">
          {/* Booth Backrest slice */}
          <div className={`w-8 md:w-16 h-full ${upholsteryStyles} border-r-4 shadow-2xl relative`}>
            {/* Velvet tufting buttons */}
            <div className="absolute inset-y-0 right-2 flex flex-col justify-around py-12 opacity-50">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-black/60 border border-amber-500/20" />
              ))}
            </div>
          </div>

          {/* Left Velvet Curtain (toggleable) */}
          <div 
            onClick={onToggleCurtains}
            className={`pointer-events-auto cursor-pointer transition-all duration-700 h-full bg-gradient-to-r ${curtainColors} border-r-2 border-amber-600/60 shadow-2xl relative ${
              customization.curtainsOpen ? 'w-10 md:w-16' : 'w-48 md:w-80'
            }`}
            title="Click to draw or open curtains"
          >
            {/* Curtain folds shading */}
            <div className="w-full h-full opacity-30 bg-[repeating-linear-gradient(90deg,transparent,transparent_8px,rgba(0,0,0,0.5)_8px,rgba(0,0,0,0.5)_16px)]" />
            {/* Brass tieback rope */}
            <div className="absolute top-1/2 -right-2 transform -translate-y-1/2 w-4 h-12 bg-amber-600 rounded-full border border-amber-300 shadow-md flex items-center justify-center">
              <span className="text-[8px] text-amber-100 font-bold">||</span>
            </div>
          </div>
        </div>

        {/* Window Center Bevel Frame Overlay */}
        <div className={`absolute inset-4 md:inset-8 border-[12px] md:border-[18px] ${windowFrameStyles} rounded-xl pointer-events-none transition-all duration-500`}>
          {/* Subtle brass screw corners */}
          <div className="absolute top-2 left-2 w-3 h-3 rounded-full bg-amber-400/80 shadow border border-amber-700" />
          <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-amber-400/80 shadow border border-amber-700" />
          <div className="absolute bottom-2 left-2 w-3 h-3 rounded-full bg-amber-400/80 shadow border border-amber-700" />
          <div className="absolute bottom-2 right-2 w-3 h-3 rounded-full bg-amber-400/80 shadow border border-amber-700" />
        </div>

        {/* Right Booth Cushion & Drapery */}
        <div className="relative h-full flex items-center z-10 flex-row-reverse">
          {/* Booth Backrest slice */}
          <div className={`w-8 md:w-16 h-full ${upholsteryStyles} border-l-4 shadow-2xl relative`}>
            <div className="absolute inset-y-0 left-2 flex flex-col justify-around py-12 opacity-50">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-black/60 border border-amber-500/20" />
              ))}
            </div>
          </div>

          {/* Right Velvet Curtain (toggleable) */}
          <div 
            onClick={onToggleCurtains}
            className={`pointer-events-auto cursor-pointer transition-all duration-700 h-full bg-gradient-to-l ${curtainColors} border-l-2 border-amber-600/60 shadow-2xl relative ${
              customization.curtainsOpen ? 'w-10 md:w-16' : 'w-48 md:w-80'
            }`}
            title="Click to draw or open curtains"
          >
            <div className="w-full h-full opacity-30 bg-[repeating-linear-gradient(90deg,transparent,transparent_8px,rgba(0,0,0,0.5)_8px,rgba(0,0,0,0.5)_16px)]" />
            <div className="absolute top-1/2 -left-2 transform -translate-y-1/2 w-4 h-12 bg-amber-600 rounded-full border border-amber-300 shadow-md flex items-center justify-center">
              <span className="text-[8px] text-amber-100 font-bold">||</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. FOREGROUND COMPARTMENT TABLE & CONSOLE INSTRUMENTS */}
      <div className={`relative w-full z-30 pointer-events-auto bg-gradient-to-t ${woodThemeStyles} border-t-8 border-amber-950/80 shadow-[0_-15px_30px_rgba(0,0,0,0.9)] px-4 sm:px-8 py-3.5 transition-colors duration-500`}>
        {/* Subtle wood grain sheen overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent pointer-events-none" />

        {/* Warm Ambient Lamp Glow overlay across the table */}
        {lampOn && (
          <div 
            className="absolute -top-32 left-1/4 w-96 h-48 bg-amber-500/10 blur-3xl pointer-events-none rounded-full"
            style={{ opacity: customization.ambientLightWarmth }}
          />
        )}

        <div className="relative max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 sm:gap-6">
          
          {/* GROUP A: SPEEDOMETER & THROTTLE GAUGE */}
          <div className="flex items-center gap-3">
            {/* Vintage Analog Speedometer */}
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-stone-900 via-stone-800 to-black border-4 border-amber-500/80 shadow-2xl flex items-center justify-center">
              {/* Dial tick marks */}
              <div className="absolute inset-1 rounded-full border border-amber-400/20" />
              {/* Needle pivot */}
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400 z-10 shadow" />
              {/* Needle */}
              <div 
                className="absolute top-1/2 left-1/2 w-7 h-0.5 bg-gradient-to-r from-red-500 to-amber-300 origin-left transform -translate-y-1/2 transition-transform duration-300 shadow-sm"
                style={{ transform: `translateY(-50%) rotate(${needleDeg}deg)` }}
              />
              {/* Digital Readout inside dial */}
              <div className="absolute bottom-2 flex flex-col items-center">
                <span className="text-[12px] font-mono font-bold text-amber-200 leading-none">
                  {Math.round(speedKmH)}
                </span>
                <span className="text-[7px] text-amber-400/80 uppercase font-mono">km/h</span>
              </div>
            </div>

            {/* Fuel Steam Gauge & Quick Stoke/Refuel */}
            <div className="flex flex-col gap-1 w-28 sm:w-32">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[10px] uppercase font-bold text-amber-200/90 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-orange-400" />
                  Boiler Fuel
                </span>
                <span className={`text-[11px] font-mono font-bold ${fuelPercentage < 25 ? 'text-red-400 animate-pulse' : 'text-amber-300'}`}>
                  {fuelPercentage}%
                </span>
              </div>
              <div className="w-full bg-stone-950 h-2 rounded-full overflow-hidden border border-amber-700/50 p-0.5">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    fuelPercentage < 25 
                      ? 'bg-red-500' 
                      : fuelPercentage < 55 
                      ? 'bg-amber-500' 
                      : 'bg-gradient-to-r from-amber-400 to-emerald-400'
                  }`}
                  style={{ width: `${fuelPercentage}%` }}
                />
              </div>
              <button
                onClick={onRefuel}
                className="mt-0.5 text-[10px] bg-stone-800/80 hover:bg-stone-700 text-amber-200 border border-amber-600/40 py-0.5 px-1.5 rounded flex items-center justify-center gap-1 transition-colors"
                title="Stoke coal furnace & refuel (Costs 15 coins for full tank)"
              >
                <span>Stoke Furnace (15g)</span>
              </button>
            </div>
          </div>

          {/* GROUP B: CONDUCTOR DISPATCH CHALLENGES (Main Gameplay Button) */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenChallenges}
              className="relative group bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-stone-950 font-bold px-4 py-2.5 rounded-lg border-2 border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.35)] transition-all hover:scale-105 active:scale-95 flex items-center gap-2.5"
            >
              <div className="p-1 rounded bg-stone-900/10 text-stone-950">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="flex flex-col items-start text-left">
                <span className="font-serif-vintage text-xs uppercase tracking-wider leading-none">
                  Conductor Clipboard
                </span>
                <span className="text-[11px] font-semibold text-stone-900">
                  Solve Challenges · Earn Progress
                </span>
              </div>
              {/* Animated challenge alert pulse */}
              <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-white animate-ping" />
              <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-white" />
            </button>

            {/* Locomotive Whistle Button */}
            <button
              onClick={onWhistleClick}
              className="flex items-center gap-1.5 bg-gradient-to-b from-amber-800 to-amber-950 hover:from-amber-700 hover:to-amber-900 text-amber-200 border border-amber-500/60 px-3 py-2 rounded-lg text-xs font-semibold shadow-md active:scale-95 transition-transform"
              title="Pull the Steam Whistle Chime!"
            >
              <Wind className="w-4 h-4 text-amber-300" />
              <span>Blow Whistle</span>
            </button>
          </div>

          {/* GROUP C: COMPARTMENT TABLE INTERACTIVES (Tea cup, Radio, Lamp, Weather) */}
          <div className="flex items-center gap-3">
            {/* Steaming Tea Cup */}
            <button
              onClick={onTakeSip}
              className="relative p-2 rounded-lg bg-stone-900/60 hover:bg-stone-800 text-amber-200 border border-amber-800/40 transition-transform active:scale-90 flex flex-col items-center"
              title="Take a sip of hot Earl Grey Tea"
            >
              <Coffee className="w-5 h-5 text-amber-300" />
              <span className="text-[8px] uppercase tracking-wider text-stone-400 mt-0.5">Sip Tea</span>
              {sipFeedback && (
                <span className="absolute -top-6 bg-amber-950 text-amber-200 border border-amber-500 text-[10px] px-1.5 py-0.5 rounded shadow animate-bounce">
                  Ah, splendid!
                </span>
              )}
            </button>

            {/* Vintage Radio */}
            <div 
              onClick={handleRadioClick}
              className={`cursor-pointer p-2 rounded-lg border transition-all flex flex-col items-center ${
                radioOn 
                  ? 'bg-amber-950/80 border-amber-400 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.3)]' 
                  : 'bg-stone-900/60 border-stone-700 text-stone-400 hover:text-stone-200'
              }`}
              title="Toggle Compartment Lo-fi Radio"
            >
              <div className="flex items-center gap-1">
                <Radio className={`w-4 h-4 ${radioOn ? 'text-amber-300 animate-pulse' : ''}`} />
                {radioOn && (
                  <button 
                    onClick={handleNextTrack}
                    className="p-0.5 hover:text-white rounded bg-amber-900/80" 
                    title="Next Track"
                  >
                    <Music className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
              <span className="text-[8px] uppercase tracking-wider mt-0.5 truncate max-w-[65px]">
                {radioOn ? radioTrackNames[radioTrack] : 'Radio Off'}
              </span>
            </div>

            {/* Desk Lamp Warm Glow Toggle */}
            <button
              onClick={() => setLampOn(!lampOn)}
              className={`p-2 rounded-lg border transition-all flex flex-col items-center ${
                lampOn 
                  ? 'bg-amber-900/60 border-amber-400 text-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.3)]' 
                  : 'bg-stone-900/60 border-stone-700 text-stone-400'
              }`}
              title="Toggle Compartment Brass Lamp"
            >
              <div className="w-4 h-4 rounded-full border border-amber-400 flex items-center justify-center">
                <div className={`w-2 h-2 rounded-full ${lampOn ? 'bg-amber-300' : 'bg-transparent'}`} />
              </div>
              <span className="text-[8px] uppercase tracking-wider mt-0.5">Lamp</span>
            </button>

            {/* Window Wipers toggle */}
            <button
              onClick={onToggleWipers}
              className={`p-2 rounded-lg border transition-all flex flex-col items-center ${
                wipersActive 
                  ? 'bg-blue-950/80 border-blue-400 text-blue-200 shadow-[0_0_8px_rgba(59,130,246,0.3)]' 
                  : 'bg-stone-900/60 border-stone-700 text-stone-400'
              }`}
              title="Toggle Window Wipers"
            >
              <Wind className="w-4 h-4 text-blue-300" />
              <span className="text-[8px] uppercase tracking-wider mt-0.5">Wipers</span>
            </button>

            {/* Weather & Scenic Controls Modal */}
            <button
              onClick={onOpenWeatherControls}
              className="p-2 rounded-lg bg-stone-900/60 hover:bg-stone-800 text-amber-200 border border-amber-800/40 transition-colors flex flex-col items-center"
              title="Real-time Weather & Scenic Biomes"
            >
              <CloudSun className="w-5 h-5 text-amber-300" />
              <span className="text-[8px] uppercase tracking-wider text-stone-400 mt-0.5">Atmosphere</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
