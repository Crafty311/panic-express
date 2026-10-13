import React, { useState, useEffect, useRef } from 'react';
import { MicrogameInstance } from '../data/microgames';
import { audioEngine } from '../services/audioService';
import { Heart, CheckCircle2, XCircle, X } from 'lucide-react';

interface MicrogameOverlayProps {
  microgame: MicrogameInstance;
  speedMultiplier: number;
  onSuccess: (scoreEarned: number) => void;
  onFailure: () => void;
  onDismiss: () => void;
  hearts: number;
  maxHearts: number;
  roundNumber: number;
  isNightMode?: boolean;
}

export const MicrogameOverlay: React.FC<MicrogameOverlayProps> = ({
  microgame,
  speedMultiplier,
  onSuccess,
  onFailure,
  onDismiss,
  hearts,
  maxHearts,
  roundNumber,
  isNightMode = false,
}) => {
  const totalDuration = Math.max(2.4, microgame.durationSec / speedMultiplier);
  const [timeLeft, setTimeLeft] = useState(totalDuration);
  const [outcome, setOutcome] = useState<'playing' | 'won' | 'lost'>('playing');

  // Interactive mechanic states
  // 1. Duck
  const [isDucking, setIsDucking] = useState(false);
  const [hazardProgress, setHazardProgress] = useState(0);

  // 2. Balance
  const [balanceX, setBalanceX] = useState(0);

  // 3. Stamp Ticket
  const [stampPos, setStampPos] = useState(10);
  const [stampDone, setStampDone] = useState(false);

  // 4. Wipe Splat
  const [splatsRemaining, setSplatsRemaining] = useState<number[]>([1, 1, 1]);

  // 5. Catch Item
  const [itemCaught, setItemCaught] = useState(false);
  const [itemX, setItemX] = useState(30);

  // 6. Wake Passenger
  const [currentTaps, setCurrentTaps] = useState(0);

  // 7. Track Switch
  const [switchDone, setSwitchDone] = useState(false);

  // 8. Feed Furnace
  const [furnaceFed, setFurnaceFed] = useState(false);

  const timerRef = useRef<number | null>(null);

  // Reset state on new microgame
  useEffect(() => {
    setTimeLeft(totalDuration);
    setOutcome('playing');
    setIsDucking(false);
    setHazardProgress(0);
    setBalanceX(0);
    setStampPos(10);
    setStampDone(false);
    setSplatsRemaining([1, 1, 1]);
    setItemCaught(false);
    setItemX(25 + Math.random() * 45);
    setCurrentTaps(0);
    setSwitchDone(false);
    setFurnaceFed(false);
  }, [microgame, totalDuration]);

  // Countdown timer loop
  useEffect(() => {
    if (outcome !== 'playing') return;

    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        const next = Math.max(0, prev - 0.1);
        const progress = next / totalDuration;

        if (next > 0) {
          audioEngine.playTimerTick(1 - progress);
        }

        if (next <= 0) {
          handleTimeExpired();
        }
        return next;
      });
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [outcome, totalDuration, isDucking, balanceX, splatsRemaining]);

  // Duck progress simulation
  useEffect(() => {
    if (microgame.category !== 'duck_tunnel' || outcome !== 'playing') return;
    const interval = setInterval(() => {
      setHazardProgress((prev) => {
        const next = prev + 3.8 * speedMultiplier;
        if (next >= 65 && next <= 85) {
          if (!isDucking) {
            triggerFail();
          }
        }
        return next;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [microgame.category, outcome, isDucking, speedMultiplier]);

  // Balance jitter simulation
  useEffect(() => {
    if (microgame.category !== 'balance_coffee' || outcome !== 'playing') return;
    const interval = setInterval(() => {
      setBalanceX((prev) => {
        const delta = (Math.random() - 0.5) * 16 * speedMultiplier;
        const next = prev + delta;
        if (Math.abs(next) > 85) {
          triggerFail();
        }
        return next;
      });
    }, 90);
    return () => clearInterval(interval);
  }, [microgame.category, outcome, speedMultiplier]);

  // Moving stamp reticle
  useEffect(() => {
    if (microgame.category !== 'stamp_ticket' || outcome !== 'playing' || stampDone) return;
    let dir = 1;
    const interval = setInterval(() => {
      setStampPos((prev) => {
        let next = prev + dir * 5.5 * speedMultiplier;
        if (next >= 92) dir = -1;
        if (next <= 8) dir = 1;
        return next;
      });
    }, 30);
    return () => clearInterval(interval);
  }, [microgame.category, outcome, stampDone, speedMultiplier]);

  // Moving catchable item
  useEffect(() => {
    if (microgame.category !== 'catch_item' || outcome !== 'playing' || itemCaught) return;
    const interval = setInterval(() => {
      setItemX((prev) => (prev > 80 ? 15 : prev + 12 * speedMultiplier));
    }, 200);
    return () => clearInterval(interval);
  }, [microgame.category, outcome, itemCaught, speedMultiplier]);

  const handleTimeExpired = () => {
    if (microgame.category === 'duck_tunnel' || microgame.category === 'balance_coffee') {
      triggerWin();
    } else {
      triggerFail();
    }
  };

  const triggerWin = () => {
    if (outcome !== 'playing') return;
    setOutcome('won');
    audioEngine.playWin();
    setTimeout(() => {
      onSuccess(100 * Math.round(speedMultiplier * 10) / 10);
    }, 750);
  };

  const triggerFail = () => {
    if (outcome !== 'playing') return;
    setOutcome('lost');
    audioEngine.playFail();
    setTimeout(() => {
      onFailure();
    }, 900);
  };

  // Interaction handlers
  const handleStampPress = () => {
    if (outcome !== 'playing' || stampDone) return;
    setStampDone(true);
    const range = microgame.params.targetRange || [40, 60];
    if (stampPos >= range[0] && stampPos <= range[1]) {
      triggerWin();
    } else {
      triggerFail();
    }
  };

  const handleWipeSpot = (idx: number) => {
    const updated = [...splatsRemaining];
    updated[idx] = 0;
    setSplatsRemaining(updated);
    audioEngine.playPop();
    if (updated.every((s) => s === 0)) {
      triggerWin();
    }
  };

  const handleCatchPress = () => {
    if (outcome !== 'playing' || itemCaught) return;
    setItemCaught(true);
    triggerWin();
  };

  const handleWakeTap = () => {
    if (outcome !== 'playing') return;
    audioEngine.playPop();
    const next = currentTaps + 1;
    setCurrentTaps(next);
    const required = microgame.params.requiredTaps || 5;
    if (next >= required) {
      triggerWin();
    }
  };

  const handleSwitchPress = (color: 'red' | 'blue' | 'green' | 'amber') => {
    if (outcome !== 'playing' || switchDone) return;
    setSwitchDone(true);
    if (color === microgame.params.targetColor) {
      triggerWin();
    } else {
      triggerFail();
    }
  };

  const handleFeedCoal = () => {
    if (outcome !== 'playing' || furnaceFed) return;
    setFurnaceFed(true);
    triggerWin();
  };

  const progressRatio = Math.max(0, Math.min(1, timeLeft / totalDuration));

  return (
    <div className="fixed inset-0 z-50 pointer-events-auto flex items-center justify-center p-4 bg-[#1c1917]/50 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* Editorial Modal Window */}
      <div className={`relative w-full max-w-xl border rounded-3xl p-6 sm:p-8 shadow-[0_30px_60px_rgba(0,0,0,0.25)] flex flex-col items-center gap-5 transition-colors duration-300 ${
        isNightMode
          ? 'bg-stone-900/95 border-[#f8f7f4]/20 text-[#f8f7f4]'
          : 'bg-white/95 border-[#1c1917]/15 text-[#1c1917]'
      }`}>
        
        {/* Close / Dismiss milestone button */}
        <button
          onClick={onDismiss}
          className={`absolute top-5 right-5 p-1.5 rounded-full transition-colors ${
            isNightMode ? 'hover:bg-[#f8f7f4]/10 text-[#f8f7f4]/60 hover:text-[#f8f7f4]' : 'hover:bg-[#1c1917]/10 text-[#1c1917]/60 hover:text-[#1c1917]'
          }`}
          title="Dismiss Challenge"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header: Badge, Prompt & Lives */}
        <div className="flex flex-col items-center w-full text-center">
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono-space text-[10px] uppercase tracking-[0.15em] text-[#d97706] font-semibold">
              Signal Milestone · Round {roundNumber}
            </span>
            <div className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full border ${
              isNightMode ? 'bg-stone-800 border-[#f8f7f4]/10' : 'bg-[#f8f7f4] border-[#1c1917]/10'
            }`}>
              {Array.from({ length: maxHearts }).map((_, i) => (
                <Heart
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i < hearts ? 'text-rose-500 fill-rose-500' : isNightMode ? 'text-[#f8f7f4]/20' : 'text-[#1c1917]/20'
                  }`}
                />
              ))}
            </div>
          </div>

          <h2 className="font-serif-cormorant italic text-3xl sm:text-4xl font-semibold flex items-center gap-2.5">
            <span>{microgame.icon}</span>
            <span>{microgame.instruction}</span>
          </h2>
          <p className="font-sans-inter text-xs text-[#1c1917]/60 mt-0.5">
            {microgame.title} · {microgame.params.subType}
          </p>

          {/* Precision Countdown Progress Bar */}
          <div className="w-full mt-4">
            <div className="flex justify-between items-center font-mono-space text-[10px] uppercase text-[#1c1917]/60 mb-1">
              <span>Time Remaining</span>
              <span>{timeLeft.toFixed(1)}s</span>
            </div>
            <div className="w-full bg-[#1c1917]/10 h-[2px] rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-100 ${
                  progressRatio > 0.35 ? 'bg-[#1c1917]' : 'bg-rose-600'
                }`}
                style={{ width: `${progressRatio * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Interactive Game Stage */}
        <div className="w-full min-h-[220px] flex items-center justify-center p-4 bg-[#f8f7f4] rounded-2xl border border-[#1c1917]/10 relative overflow-hidden">
          
          {/* 1. DUCK TUNNEL */}
          {microgame.category === 'duck_tunnel' && (
            <div className="w-full h-48 flex flex-col items-center justify-end relative">
              <div
                className="absolute top-0 left-0 right-0 h-16 bg-[#1c1917] border-b-2 border-[#d97706] rounded-b-xl flex items-center justify-center shadow-md transition-all text-[#f8f7f4]"
                style={{
                  transform: `translateY(${Math.min(0, -60 + hazardProgress)}px)`,
                }}
              >
                <span className="font-mono-space text-[10px] uppercase tracking-widest text-amber-300 font-bold">
                  {microgame.params.hazardLabel || 'LOW CLEARANCE ARCH'}
                </span>
              </div>

              <div className={`transition-all duration-150 flex flex-col items-center ${isDucking ? 'translate-y-16 scale-90' : 'translate-y-0'}`}>
                <div className="w-16 h-16 rounded-full bg-white border-2 border-[#1c1917]/20 flex items-center justify-center text-3xl shadow-sm">
                  {isDucking ? '😌' : '😮'}
                </div>
                <div className="w-20 h-10 bg-[#1c1917] rounded-t-xl mt-1 border border-[#1c1917]/20" />
              </div>

              <button
                onMouseDown={() => setIsDucking(true)}
                onMouseUp={() => setIsDucking(false)}
                onTouchStart={() => setIsDucking(true)}
                onTouchEnd={() => setIsDucking(false)}
                className={`mt-4 px-8 py-2.5 rounded-full font-mono-space text-xs uppercase tracking-wider transition-all border ${
                  isDucking
                    ? 'bg-emerald-600 border-emerald-500 text-white scale-95 shadow-sm'
                    : 'bg-[#1c1917] hover:bg-stone-800 border-[#1c1917] text-[#f8f7f4]'
                }`}
              >
                {isDucking ? 'Holding Down' : 'Hold to Duck'}
              </button>
            </div>
          )}

          {/* 2. BALANCE COFFEE */}
          {microgame.category === 'balance_coffee' && (
            <div className="w-full flex flex-col items-center gap-5">
              <div className="relative w-72 h-28 bg-white border border-[#1c1917]/15 rounded-2xl flex items-center justify-center overflow-hidden shadow-inner">
                <div className="absolute inset-y-0 w-24 bg-emerald-500/15 border-x border-emerald-500/30" />
                <div
                  className="transition-transform duration-75 flex flex-col items-center"
                  style={{ transform: `translateX(${balanceX * 1.2}px) rotate(${balanceX * 0.25}deg)` }}
                >
                  <span className="text-4xl drop-shadow">{microgame.params.itemEmoji || '☕'}</span>
                  <div className="w-16 h-2 bg-[#1c1917] rounded-full mt-1" />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setBalanceX((x) => Math.max(-75, x - 18))}
                  className="px-5 py-2 rounded-full bg-[#1c1917] hover:bg-stone-800 text-[#f8f7f4] font-mono-space text-xs uppercase tracking-wider shadow-sm transition-all active:scale-95"
                >
                  ◀ Tilt Left
                </button>
                <button
                  onClick={() => setBalanceX((x) => Math.min(75, x + 18))}
                  className="px-5 py-2 rounded-full bg-[#1c1917] hover:bg-stone-800 text-[#f8f7f4] font-mono-space text-xs uppercase tracking-wider shadow-sm transition-all active:scale-95"
                >
                  Tilt Right ▶
                </button>
              </div>
            </div>
          )}

          {/* 3. STAMP TICKET */}
          {microgame.category === 'stamp_ticket' && (
            <div className="w-full flex flex-col items-center gap-5">
              <div className="relative w-80 h-28 bg-white border border-[#1c1917]/15 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                <div
                  className="absolute inset-y-2 w-14 border-2 border-dashed border-emerald-600 bg-emerald-50 rounded-xl flex items-center justify-center text-[10px] text-emerald-800 font-mono-space font-bold"
                  style={{ left: `${(microgame.params.targetRange || [40, 60])[0]}%` }}
                >
                  STAMP
                </div>

                <div
                  className="absolute top-2 bottom-2 w-3 bg-rose-600 rounded-full shadow-md"
                  style={{ left: `${stampPos}%` }}
                />

                <div>
                  <span className="block font-serif-cormorant text-base font-semibold text-[#1c1917] tracking-wide uppercase">
                    {microgame.params.subType} Pass
                  </span>
                  <span className="font-mono-space text-[9px] uppercase tracking-wider text-[#1c1917]/50">FIRST CLASS SCENIC</span>
                </div>
                <span className="text-2xl">🎟️</span>
              </div>

              <button
                onClick={handleStampPress}
                disabled={stampDone}
                className="px-8 py-2.5 rounded-full bg-[#1c1917] hover:bg-stone-800 text-[#f8f7f4] font-mono-space text-xs uppercase tracking-wider transition-transform active:scale-95 shadow-sm disabled:opacity-50"
              >
                {stampDone ? 'Stamped' : 'Stamp Target'}
              </button>
            </div>
          )}

          {/* 4. WIPE SPLAT */}
          {microgame.category === 'wipe_splat' && (
            <div className="w-full flex items-center justify-center gap-5">
              {splatsRemaining.map((active, i) =>
                active === 1 ? (
                  <button
                    key={i}
                    onClick={() => handleWipeSpot(i)}
                    className="w-16 h-16 rounded-full bg-white hover:bg-[#1c1917]/5 border border-[#1c1917]/20 flex items-center justify-center text-3xl transition-transform active:scale-90 shadow-sm"
                  >
                    💧
                  </button>
                ) : (
                  <div key={i} className="w-16 h-16 flex items-center justify-center text-2xl text-emerald-600">
                    ✨
                  </div>
                )
              )}
            </div>
          )}

          {/* 5. CATCH ITEM */}
          {microgame.category === 'catch_item' && (
            <div className="w-full h-36 relative flex items-center">
              {!itemCaught ? (
                <button
                  onClick={handleCatchPress}
                  className="absolute transition-all duration-150 text-4xl hover:scale-125"
                  style={{ left: `${itemX}%` }}
                >
                  {microgame.params.itemEmoji || '🍞'}
                </button>
              ) : (
                <div className="w-full flex justify-center font-serif-cormorant italic text-3xl text-emerald-800 font-semibold">
                  Captured! ✓
                </div>
              )}
            </div>
          )}

          {/* 6. WAKE PASSENGER */}
          {microgame.category === 'wake_passenger' && (
            <div className="w-full flex flex-col items-center gap-4">
              <span className="text-5xl animate-bounce">😴</span>
              <button
                onClick={handleWakeTap}
                className="px-8 py-2.5 rounded-full bg-[#1c1917] hover:bg-stone-800 text-[#f8f7f4] font-mono-space text-xs uppercase tracking-wider transition-all active:scale-95 shadow-sm"
              >
                Tap to Alert ({currentTaps} / {microgame.params.requiredTaps || 5})
              </button>
            </div>
          )}

          {/* 7. TRACK SWITCH */}
          {microgame.category === 'track_switch' && (
            <div className="w-full flex items-center justify-center gap-3">
              {(['red', 'green', 'blue', 'amber'] as const).map((color) => {
                const bg = {
                  red: 'bg-rose-700 hover:bg-rose-600',
                  green: 'bg-emerald-700 hover:bg-emerald-600',
                  blue: 'bg-sky-700 hover:bg-sky-600',
                  amber: 'bg-amber-600 hover:bg-amber-500',
                }[color];
                return (
                  <button
                    key={color}
                    onClick={() => handleSwitchPress(color)}
                    disabled={switchDone}
                    className={`px-4 py-3 rounded-xl font-mono-space font-bold text-xs uppercase tracking-wider text-white transition-transform active:scale-95 shadow-sm ${bg}`}
                  >
                    {color} Line
                  </button>
                );
              })}
            </div>
          )}

          {/* 8. FEED FURNACE */}
          {microgame.category === 'feed_furnace' && (
            <div className="w-full flex items-center justify-center gap-8">
              <div className="w-24 h-24 rounded-2xl bg-[#1c1917] border border-[#1c1917]/20 flex flex-col items-center justify-center text-white">
                <span className="text-3xl">🔥</span>
                <span className="text-[9px] uppercase tracking-wider text-amber-300 mt-1 font-mono-space">Boiler</span>
              </div>

              {!furnaceFed ? (
                <button
                  onClick={handleFeedCoal}
                  className="p-4 rounded-2xl bg-white hover:bg-stone-100 border border-[#1c1917]/20 text-3xl transition-transform active:scale-95 shadow-sm"
                  title="Deliver fuel"
                >
                  {microgame.params.itemEmoji || '🪨'}
                </button>
              ) : (
                <div className="font-serif-cormorant italic text-lg font-semibold text-emerald-800">Fueled! ✓</div>
              )}
            </div>
          )}

        </div>

        {/* Outcome result pill */}
        {outcome === 'won' && (
          <div className="flex items-center gap-2 text-emerald-800 font-mono-space text-xs uppercase tracking-wider bg-emerald-50 border border-emerald-300 px-5 py-2 rounded-full animate-bounce shadow-sm font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>Milestone Cleared! +100 Points</span>
          </div>
        )}

        {outcome === 'lost' && (
          <div className="flex items-center gap-2 text-rose-800 font-mono-space text-xs uppercase tracking-wider bg-rose-50 border border-rose-300 px-5 py-2 rounded-full shadow-sm font-semibold">
            <XCircle className="w-4 h-4 text-rose-700" />
            <span>Signal Missed</span>
          </div>
        )}

      </div>
    </div>
  );
};
