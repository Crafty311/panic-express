import React, { useState, useEffect } from 'react';
import { Station, CompartmentCustomization } from '../types/game';
import { TrackInfo, audioEngine } from '../services/audioService';
import { 
  Volume2, 
  VolumeX, 
  Wind, 
  Play, 
  Pause, 
  SkipForward, 
  Radio, 
  Compass,
  Sparkles
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
    const playing = audioEngine.toggleBgm();
    setIsBgmPlaying(playing);
  };

  const handleSkipTrack = () => {
    audioEngine.skipToNextTrack();
    setCurrentTrack(audioEngine.getCurrentTrack());
  };

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    audioEngine.setMuted(next);
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

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between overflow-hidden">
      
      {/* ARCHITECTURAL FRAME OVERLAY - VARIATION 3 INSET BORDER */}
      <div className="absolute inset-3 sm:inset-8 border border-[#1c1917]/20 pointer-events-none flex flex-col justify-between z-10">
        
        {/* HEADER SECTION */}
        <header className="pointer-events-auto p-4 sm:p-7 flex flex-wrap justify-between items-start gap-4">
          
          {/* TITLE BLOCK & PROGRESS */}
          <div className="flex flex-col">
            <span className="font-mono-space text-[10px] sm:text-[11px] uppercase tracking-[0.15em] text-[#d97706] font-semibold">
              Observation Salon · Route No. 4
            </span>
            <h1 className="font-serif-cormorant italic text-3xl sm:text-5xl lg:text-6xl text-[#1c1917] font-semibold tracking-tight leading-none my-1">
              Panic Express
            </h1>
            
            {/* MINIMALIST 1PX ARCHITECTURAL PROGRESS BAR */}
            <div className="w-56 sm:w-80 mt-2">
              <div className="flex justify-between items-center text-[10px] font-mono-space uppercase text-[#1c1917]/70 tracking-wider">
                <span className="truncate max-w-[120px]">{currentStation.name}</span>
                <span>{distanceToNextKm.toFixed(1)} km to {nextStation.name}</span>
              </div>
              <div className="w-full h-[1px] bg-[#1c1917]/15 my-1.5 relative overflow-hidden">
                <div 
                  className="h-full bg-[#1c1917] transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* ACTION TRAY & STATS */}
          <div className="flex items-center gap-5 sm:gap-7 pointer-events-auto">
            
            {/* Stat: Velocity */}
            <div className="text-right">
              <span className="font-serif-cormorant text-2xl sm:text-3xl text-[#1c1917] font-semibold leading-none block">
                {Math.round(speedKmH)}
              </span>
              <span className="font-mono-space text-[9px] uppercase tracking-wider text-[#d97706] font-medium">
                KM/H Velocity
              </span>
            </div>

            {/* Stat: Coin Reserve */}
            <div className="text-right">
              <span className="font-serif-cormorant text-2xl sm:text-3xl text-[#1c1917] font-semibold leading-none block">
                {coins}
              </span>
              <span className="font-mono-space text-[9px] uppercase tracking-wider text-[#d97706] font-medium">
                Coin Reserve
              </span>
            </div>

            {/* Stat: Score */}
            <div className="text-right hidden sm:block">
              <span className="font-serif-cormorant text-2xl sm:text-3xl text-[#1c1917] font-semibold leading-none block">
                {score}
              </span>
              <span className="font-mono-space text-[9px] uppercase tracking-wider text-[#d97706] font-medium">
                Experience Pts
              </span>
            </div>

            {/* Depot Pill Button */}
            <button
              onClick={onOpenDepot}
              className="bg-[#1c1917] hover:bg-stone-800 text-[#f8f7f4] px-5 sm:px-7 py-2.5 sm:py-3 rounded-full font-mono-space text-xs uppercase tracking-wider transition-all shadow-sm active:scale-95"
              title="Open Locomotive Depot & Atelier"
            >
              Atelier & Depot
            </button>

            {/* Sound Effects & Whistle */}
            <div className="flex items-center gap-2">
              <button
                onClick={onWhistleClick}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-[#1c1917]/20 hover:border-[#1c1917] bg-white/70 hover:bg-white text-[#1c1917] flex items-center justify-center transition-colors shadow-sm"
                title="Locomotive Whistle"
              >
                <Wind className="w-4 h-4 text-[#d97706]" />
              </button>
              
              <button
                onClick={handleToggleMute}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-[#1c1917]/20 hover:border-[#1c1917] bg-white/70 hover:bg-white text-[#1c1917] flex items-center justify-center transition-colors shadow-sm"
                title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-rose-600" />
                ) : (
                  <Volume2 className="w-4 h-4 text-[#1c1917]" />
                )}
              </button>
            </div>

          </div>

        </header>

        {/* CENTER COMPONENT - VARIATION 3 CENTER ALERT */}
        {signalPostAvailable && !isPlayingMicrogame && (
          <div className="pointer-events-auto self-center bg-white/95 backdrop-blur-md p-7 sm:p-10 border border-[#1c1917]/15 max-w-[440px] shadow-[0_30px_60px_rgba(0,0,0,0.08)] text-center animate-in zoom-in-95 duration-200">
            <span className="font-mono-space text-[10px] uppercase tracking-[0.15em] text-[#d97706] font-semibold block mb-2">
              Railway Signal Post Milestone
            </span>
            <h2 className="font-serif-cormorant italic text-3xl sm:text-4xl text-[#1c1917] font-semibold leading-tight mb-2">
              Signal Verification Ahead
            </h2>
            <p className="font-sans-inter text-xs text-[#1c1917]/75 leading-relaxed mb-6">
              Track semaphore requires conductor clearance. Complete the scheduled signal challenge to maintain line velocity and earn +100 Conductor Points.
            </p>
            <div className="flex gap-3 justify-center items-center">
              <button
                onClick={onAcceptSignalChallenge}
                className="bg-[#1c1917] hover:bg-stone-800 text-[#f8f7f4] px-6 py-2.5 rounded-full font-mono-space text-xs uppercase tracking-wider transition-all active:scale-95 shadow-sm"
              >
                Accept Challenge
              </button>
              <button
                onClick={onDismissSignalPost}
                className="bg-transparent hover:bg-[#1c1917]/5 text-[#1c1917] border border-[#1c1917]/20 px-6 py-2.5 rounded-full font-mono-space text-xs uppercase tracking-wider transition-all"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* FOOTER SECTION */}
        <footer className="pointer-events-auto p-4 sm:p-7 flex flex-wrap justify-between items-end gap-4">
          
          {/* ROTATING 5-TRACK CHILLHOP LOUNGE PLAYER */}
          <div className="backdrop-blur-md bg-white/85 border border-[#1c1917]/15 rounded-2xl px-4 py-2.5 shadow-sm flex items-center gap-3.5">
            <Radio className="w-4 h-4 text-[#d97706] shrink-0" />
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-2">
                <span className="font-serif-cormorant italic font-semibold text-sm sm:text-base text-[#1c1917] truncate max-w-[130px]">
                  {currentTrack.title}
                </span>
                <span className="font-mono-space text-[10px] text-[#d97706] font-semibold tabular-nums">
                  {formatSeconds(trackElapsed)} / 1:00
                </span>
              </div>
              <span className="text-[10px] font-mono-space uppercase text-[#1c1917]/60 truncate max-w-[150px]">
                {currentTrack.artist} · Track 0{currentTrack.id}/05
              </span>
            </div>

            <div className="flex items-center gap-1.5 ml-1">
              <button
                onClick={handleToggleBgm}
                className="w-7 h-7 rounded-full bg-[#1c1917]/10 hover:bg-[#1c1917] text-[#1c1917] hover:text-[#f8f7f4] flex items-center justify-center transition-colors"
                title={isBgmPlaying ? 'Pause Chillhop' : 'Play Chillhop'}
              >
                {isBgmPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
              </button>
              <button
                onClick={handleSkipTrack}
                className="w-7 h-7 rounded-full bg-[#1c1917]/10 hover:bg-[#1c1917] text-[#1c1917] hover:text-[#f8f7f4] flex items-center justify-center transition-colors"
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
                onClick={onRequestManualChallenge}
                className="bg-white/80 hover:bg-white text-[#1c1917] border border-[#1c1917]/20 px-6 py-2.5 rounded-full font-mono-space text-xs uppercase tracking-wider transition-all shadow-sm active:scale-95 flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#d97706]" />
                <span>Practice Signal Challenge</span>
              </button>
            </div>
          )}

          {/* TABLE COMPANION & WAYPOINT */}
          <div className="flex items-center gap-3">
            <div className="backdrop-blur-md bg-white/85 border border-[#1c1917]/15 rounded-2xl px-3.5 py-2 shadow-sm flex items-center gap-2.5">
              <span className="text-xl">{trinketEmoji}</span>
              <div className="flex flex-col text-left">
                <span className="font-mono-space text-[9px] uppercase tracking-wider text-[#d97706] font-semibold">
                  Table Companion
                </span>
                <span className="font-serif-cormorant italic text-xs font-semibold text-[#1c1917]">
                  {trinketName}
                </span>
              </div>
            </div>

            <div className="hidden md:flex backdrop-blur-md bg-white/85 border border-[#1c1917]/15 rounded-2xl px-3.5 py-2 shadow-sm items-center gap-2">
              <Compass className="w-4 h-4 text-[#d97706]" />
              <div className="flex flex-col text-left">
                <span className="font-mono-space text-[9px] uppercase tracking-wider text-[#1c1917]/50 font-semibold">
                  Upcoming Waypoint
                </span>
                <span className="font-sans-inter text-xs font-semibold text-[#1c1917]">
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
