import React, { useState, useEffect } from 'react';
import { Station, CompartmentCustomization } from '../types/game';
import { TrackInfo, audioEngine } from '../services/audioService';
import { BiomeType, BIOME_CONFIGS } from '../types/scenery';
import { 
  Volume2, 
  VolumeX, 
  Wind, 
  Play, 
  Pause, 
  SkipForward, 
  Radio, 
  Compass,
  Sparkles,
  Sun,
  Moon
} from 'lucide-react';

interface CompartmentInteriorProps {
  customization: CompartmentCustomization;
  speedKmH: number;
  maxSpeedKmH: number;
  currentStation: Station;
  nextStation: Station;
  distanceToNextKm: number;
  coins: number;
  score: number;
  isNightMode: boolean;
  currentBiome: BiomeType;
  onToggleNightMode: () => void;
  onWhistleClick: () => void;
  onOpenDepot: () => void;
  signalPostAvailable: boolean;
  onAcceptSignalChallenge: () => void;
  onDismissSignalPost: () => void;
  onRequestManualChallenge: () => void;
  isPlayingMicrogame: boolean;
}

export const CompartmentInterior: React.FC<CompartmentInteriorProps> = ({
  customization,
  speedKmH,
  currentStation,
  nextStation,
  distanceToNextKm,
  coins,
  score,
  isNightMode,
  currentBiome,
  onToggleNightMode,
  onWhistleClick,
  onOpenDepot,
  signalPostAvailable,
  onAcceptSignalChallenge,
  onDismissSignalPost,
  onRequestManualChallenge,
  isPlayingMicrogame,
}) => {
  const [isMuted, setIsMuted] = useState(audioEngine.getIsMuted());
  const [currentTrack, setCurrentTrack] = useState<TrackInfo>(audioEngine.getCurrentTrack());
  const [trackElapsed, setTrackElapsed] = useState<number>(audioEngine.getTrackElapsed());
  const [isBgmPlaying, setIsBgmPlaying] = useState<boolean>(audioEngine.getIsBgmPlaying());

  // Subscribe to audio engine track timer updates
  useEffect(() => {
    audioEngine.onTrackUpdate((track, elapsed) => {
      setCurrentTrack(track);
      setTrackElapsed(elapsed);
      setIsBgmPlaying(audioEngine.getIsBgmPlaying());
    });
  }, []);

  const handleToggleBgm = () => {
    audioEngine.playMechanicalClick();
    const playing = audioEngine.toggleBgm();
    setIsBgmPlaying(playing);
  };

  const handleSkipTrack = () => {
    audioEngine.playMechanicalClick();
    audioEngine.skipToNextTrack();
    setCurrentTrack(audioEngine.getCurrentTrack());
  };

  const handleToggleMute = () => {
    audioEngine.playMechanicalClick();
    const next = !isMuted;
    setIsMuted(next);
    audioEngine.setMuted(next);
  };

  const handleNightToggle = () => {
    audioEngine.playSwitchSound();
    onToggleNightMode();
  };

  const handleOpenDepotClick = () => {
    audioEngine.playMechanicalClick();
    onOpenDepot();
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const trinketEmoji = {
    hot_coffee: '☕',
    modern_succulent: '🪴',
    brass_chronometer: '⏱️',
    designer_headphones: '🎧',
  }[customization.tableTrinket] || '☕';

  const trinketName = {
    hot_coffee: 'Espresso Roast',
    modern_succulent: 'Highland Moss',
    brass_chronometer: 'Rail Chronometer',
    designer_headphones: 'Monitor Phones',
  }[customization.tableTrinket] || 'Espresso';

  // Navigation completion percentage
  const progressPercent = Math.max(
    2,
    Math.min(
      100,
      ((nextStation.distanceKm - distanceToNextKm) / nextStation.distanceKm) * 100
    )
  );

  const biomeConfig = BIOME_CONFIGS[currentBiome] || BIOME_CONFIGS.meadow_plain;

  return (
    <div className={`absolute inset-0 pointer-events-none select-none flex flex-col justify-between overflow-hidden transition-colors duration-700 ${isNightMode ? 'text-[#f8f7f4]' : 'text-[#1c1917]'}`}>
      
      {/* ARCHITECTURAL FRAME OVERLAY - INSET BORDER (ADAPTS TO NIGHT / DAY) */}
      <div className={`absolute inset-3 sm:inset-8 border pointer-events-none flex flex-col justify-between z-10 transition-colors duration-500 ${isNightMode ? 'border-[#f8f7f4]/15' : 'border-[#1c1917]/20'}`}>
        
        {/* HEADER SECTION */}
        <header className="pointer-events-auto p-4 sm:p-7 flex flex-wrap justify-between items-start gap-4">
          
          {/* TITLE BLOCK & PROGRESS */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-mono-space text-[10px] sm:text-[11px] uppercase tracking-[0.15em] text-[#d97706] font-semibold">
                {biomeConfig.name} · Route No. 4
              </span>
              <span className={`text-[10px] font-mono-space px-2 py-0.5 rounded-full border ${isNightMode ? 'bg-amber-400/10 border-amber-400/30 text-amber-300' : 'bg-stone-200/60 border-stone-300 text-stone-700'}`}>
                {isNightMode ? '🌙 Twilight Journey' : '☀️ Golden Day'}
              </span>
            </div>

            <h1 className="font-serif-cormorant italic text-3xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-none my-1">
              Panic Express
            </h1>
            
            {/* MINIMALIST 1PX ARCHITECTURAL PROGRESS BAR */}
            <div className="w-56 sm:w-80 mt-2">
              <div className={`flex justify-between items-center text-[10px] font-mono-space uppercase tracking-wider ${isNightMode ? 'text-[#f8f7f4]/70' : 'text-[#1c1917]/70'}`}>
                <span className="truncate max-w-[120px]">{currentStation.name}</span>
                <span>{distanceToNextKm.toFixed(1)} km to {nextStation.name}</span>
              </div>
              <div className={`w-full h-[1px] my-1.5 relative overflow-hidden ${isNightMode ? 'bg-[#f8f7f4]/15' : 'bg-[#1c1917]/15'}`}>
                <div 
                  className={`h-full transition-all duration-300 ${isNightMode ? 'bg-amber-400' : 'bg-[#1c1917]'}`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* ACTION TRAY & STATS */}
          <div className="flex items-center gap-4 sm:gap-6 pointer-events-auto">
            
            {/* Stat: Velocity */}
            <div className="text-right">
              <span className="font-serif-cormorant text-2xl sm:text-3xl font-semibold leading-none block">
                {Math.round(speedKmH)}
              </span>
              <span className="font-mono-space text-[9px] uppercase tracking-wider text-[#d97706] font-medium">
                KM/H Velocity
              </span>
            </div>

            {/* Stat: Coin Reserve */}
            <div className="text-right">
              <span className="font-serif-cormorant text-2xl sm:text-3xl font-semibold leading-none block">
                {coins}
              </span>
              <span className="font-mono-space text-[9px] uppercase tracking-wider text-[#d97706] font-medium">
                Coin Reserve
              </span>
            </div>

            {/* Stat: Score */}
            <div className="text-right hidden sm:block">
              <span className="font-serif-cormorant text-2xl sm:text-3xl font-semibold leading-none block">
                {score}
              </span>
              <span className="font-mono-space text-[9px] uppercase tracking-wider text-[#d97706] font-medium">
                Experience Pts
              </span>
            </div>

            {/* NIGHT / DAY MODE TOGGLE BUTTON */}
            <button
              onClick={handleNightToggle}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full border font-mono-space text-xs uppercase tracking-wider transition-all shadow-sm active:scale-95 ${
                isNightMode
                  ? 'bg-amber-500/15 border-amber-400/40 text-amber-300 hover:bg-amber-500/25'
                  : 'bg-white/80 border-[#1c1917]/20 text-[#1c1917] hover:bg-white'
              }`}
              title={isNightMode ? 'Switch to Daytime' : 'Switch to Night Mode (Moonlit Starlight & Stars)'}
            >
              {isNightMode ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  <span className="hidden md:inline">Night</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                  <span className="hidden md:inline">Day</span>
                </>
              )}
            </button>

            {/* Depot Pill Button */}
            <button
              onClick={handleOpenDepotClick}
              className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-full font-mono-space text-xs uppercase tracking-wider transition-all shadow-sm active:scale-95 ${
                isNightMode
                  ? 'bg-[#f8f7f4] text-[#1c1917] hover:bg-white'
                  : 'bg-[#1c1917] hover:bg-stone-800 text-[#f8f7f4]'
              }`}
              title="Open Locomotive Depot & Atelier"
            >
              Atelier & Depot
            </button>

            {/* Sound Effects & Whistle */}
            <div className="flex items-center gap-2">
              <button
                onClick={onWhistleClick}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border flex items-center justify-center transition-colors shadow-sm active:scale-95 ${
                  isNightMode
                    ? 'border-[#f8f7f4]/20 bg-stone-900/80 hover:bg-stone-800 text-[#f8f7f4]'
                    : 'border-[#1c1917]/20 bg-white/70 hover:bg-white text-[#1c1917]'
                }`}
                title="Locomotive Whistle"
              >
                <Wind className="w-4 h-4 text-[#d97706]" />
              </button>
              
              <button
                onClick={handleToggleMute}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border flex items-center justify-center transition-colors shadow-sm active:scale-95 ${
                  isNightMode
                    ? 'border-[#f8f7f4]/20 bg-stone-900/80 hover:bg-stone-800 text-[#f8f7f4]'
                    : 'border-[#1c1917]/20 bg-white/70 hover:bg-white text-[#1c1917]'
                }`}
                title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-rose-500" />
                ) : (
                  <Volume2 className="w-4 h-4 text-current" />
                )}
              </button>
            </div>

          </div>

        </header>

        {/* NON-INTRUSIVE SCENIC HUD: FLOATING MILESTONE PILL (KEEPS THE ENTIRE OUTSIDE SCENERY OPEN & UNOBSTRUCTED - NO WHITE BOX) */}
        {signalPostAvailable && !isPlayingMicrogame && (
          <div className={`pointer-events-auto self-center mt-2 z-20 backdrop-blur-xl border px-5 sm:px-6 py-2 sm:py-2.5 rounded-full shadow-[0_12px_32px_rgba(0,0,0,0.15)] flex items-center gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-300 ${
            isNightMode 
              ? 'bg-stone-900/85 border-[#f8f7f4]/20 text-[#f8f7f4]' 
              : 'bg-white/90 border-[#1c1917]/20 text-[#1c1917]'
          }`}>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <span className="font-mono-space text-[10px] uppercase tracking-wider text-[#d97706] font-bold">
                Railway Semaphore Ahead
              </span>
            </div>

            <div className={`hidden md:block h-3.5 w-[1px] ${isNightMode ? 'bg-[#f8f7f4]/20' : 'bg-[#1c1917]/20'}`} />
            <span className={`hidden md:inline font-sans-inter text-xs ${isNightMode ? 'text-[#f8f7f4]/80' : 'text-[#1c1917]/80'}`}>
              Engage challenge for +100 Pts
            </span>

            <div className="flex items-center gap-2 ml-1">
              <button
                onClick={() => {
                  audioEngine.playMechanicalClick();
                  onAcceptSignalChallenge();
                }}
                className={`px-4 py-1.5 rounded-full font-mono-space text-[11px] uppercase tracking-wider transition-all active:scale-95 shadow-sm ${
                  isNightMode
                    ? 'bg-amber-400 text-stone-950 hover:bg-amber-300 font-bold'
                    : 'bg-[#1c1917] hover:bg-stone-800 text-[#f8f7f4]'
                }`}
              >
                Accept Challenge
              </button>
              <button
                onClick={() => {
                  audioEngine.playMechanicalClick();
                  onDismissSignalPost();
                }}
                className={`px-2.5 py-1.5 rounded-full font-mono-space text-[11px] uppercase tracking-wider transition-all ${
                  isNightMode
                    ? 'text-[#f8f7f4]/60 hover:text-[#f8f7f4] hover:bg-[#f8f7f4]/10'
                    : 'text-[#1c1917]/60 hover:text-[#1c1917] hover:bg-[#1c1917]/5'
                }`}
                title="Dismiss and enjoy view"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* FOOTER SECTION */}
        <footer className="pointer-events-auto p-4 sm:p-7 flex flex-wrap justify-between items-end gap-4">
          
          {/* ROTATING 5-TRACK COZY LOFI ACOUSTIC JAZZ PLAYER */}
          <div className={`backdrop-blur-md border rounded-2xl px-4 py-2.5 shadow-sm flex items-center gap-3.5 transition-colors duration-500 ${
            isNightMode 
              ? 'bg-stone-900/80 border-[#f8f7f4]/15' 
              : 'bg-white/85 border-[#1c1917]/15'
          }`}>
            <Radio className="w-4 h-4 text-[#d97706] shrink-0" />
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-2">
                <span className="font-serif-cormorant italic font-semibold text-sm sm:text-base truncate max-w-[140px]">
                  {currentTrack.title}
                </span>
                <span className="font-mono-space text-[10px] text-[#d97706] font-semibold tabular-nums">
                  {formatSeconds(trackElapsed)} / 1:00
                </span>
              </div>
              <span className={`text-[10px] font-mono-space uppercase truncate max-w-[160px] ${isNightMode ? 'text-[#f8f7f4]/60' : 'text-[#1c1917]/60'}`}>
                {currentTrack.artist} · Track 0{currentTrack.id}/05
              </span>
            </div>

            <div className="flex items-center gap-1.5 ml-1">
              <button
                onClick={handleToggleBgm}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                  isNightMode 
                    ? 'bg-[#f8f7f4]/10 hover:bg-[#f8f7f4] text-[#f8f7f4] hover:text-[#1c1917]' 
                    : 'bg-[#1c1917]/10 hover:bg-[#1c1917] text-[#1c1917] hover:text-[#f8f7f4]'
                }`}
                title={isBgmPlaying ? 'Pause Cozy Jazz' : 'Play Cozy Jazz'}
              >
                {isBgmPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
              </button>
              <button
                onClick={handleSkipTrack}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                  isNightMode 
                    ? 'bg-[#f8f7f4]/10 hover:bg-[#f8f7f4] text-[#f8f7f4] hover:text-[#1c1917]' 
                    : 'bg-[#1c1917]/10 hover:bg-[#1c1917] text-[#1c1917] hover:text-[#f8f7f4]'
                }`}
                title="Skip Track (Rotates Every 60s)"
              >
                <SkipForward className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* CENTER: OPTIONAL PRACTICE CHALLENGE ON-DEMAND */}
          {!isPlayingMicrogame && !signalPostAvailable && (
            <div className="hidden sm:block">
              <button
                onClick={() => {
                  audioEngine.playMechanicalClick();
                  onRequestManualChallenge();
                }}
                className={`backdrop-blur-md border px-5 py-2.5 rounded-full font-mono-space text-xs uppercase tracking-wider transition-all shadow-sm active:scale-95 flex items-center gap-2 ${
                  isNightMode
                    ? 'bg-stone-900/70 hover:bg-stone-900 border-[#f8f7f4]/20 text-[#f8f7f4]'
                    : 'bg-white/80 hover:bg-white text-[#1c1917] border-[#1c1917]/20'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#d97706]" />
                <span>Practice Semaphore</span>
              </button>
            </div>
          )}

          {/* TABLE COMPANION & WAYPOINT */}
          <div className="flex items-center gap-3">
            <div className={`backdrop-blur-md border rounded-2xl px-3.5 py-2 shadow-sm flex items-center gap-2.5 transition-colors duration-500 ${
              isNightMode 
                ? 'bg-stone-900/80 border-[#f8f7f4]/15' 
                : 'bg-white/85 border-[#1c1917]/15'
            }`}>
              <span className="text-xl">{trinketEmoji}</span>
              <div className="flex flex-col text-left">
                <span className="font-mono-space text-[9px] uppercase tracking-wider text-[#d97706] font-semibold">
                  Table Companion
                </span>
                <span className="font-serif-cormorant italic text-xs font-semibold">
                  {trinketName}
                </span>
              </div>
            </div>

            <div className={`hidden md:flex backdrop-blur-md border rounded-2xl px-3.5 py-2 shadow-sm items-center gap-2 transition-colors duration-500 ${
              isNightMode 
                ? 'bg-stone-900/80 border-[#f8f7f4]/15' 
                : 'bg-white/85 border-[#1c1917]/15'
            }`}>
              <Compass className="w-4 h-4 text-[#d97706]" />
              <div className="flex flex-col text-left">
                <span className={`font-mono-space text-[9px] uppercase tracking-wider font-semibold ${isNightMode ? 'text-[#f8f7f4]/50' : 'text-[#1c1917]/50'}`}>
                  Upcoming Waypoint
                </span>
                <span className="font-sans-inter text-xs font-semibold">
                  {nextStation.name}
                </span>
              </div>
            </div>
          </div>

        </footer>

      </div>

    </div>
  );
};
