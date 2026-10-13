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
  const totalDuration = Math.max(3.0, microgame.durationSec / speedMultiplier);
  const [timeLeft, setTimeLeft] = useState(totalDuration);
  const [outcome, setOutcome] = useState<'playing' | 'won' | 'lost'>('playing');

  // Interactive mechanic states
  // 1. Duck
  const [isDucking, setIsDucking] = useState(false);
  const [hazardProgress, setHazardProgress] = useState(0);

  // 2. Overhauled Balance / Tilt Physics (Smooth inertia, damping, visual meter)
  const [balanceAngle, setBalanceAngle] = useState(0); // -100 to 100
  const [balanceVelocity, setBalanceVelocity] = useState(0);

  // 3. Stamp Ticket
  const [stampPos, setStampPos] = useState(10);
  const [stampDone, setStampDone] = useState(false);

  // 4. Wipe Splat / Multi-tap
  const [splatsRemaining, setSplatsRemaining] = useState<number[]>([1, 1, 1]);

  // 5. Catch Item
  const [itemCaught, setItemCaught] = useState(false);

  // 6. Taps / Mash / Wake
  const [currentTaps, setCurrentTaps] = useState(0);

  // 7. Track Switch / Color Select
  const [switchDone, setSwitchDone] = useState(false);

  // 8. Rock Paper Scissors
  const [rpsChoice, setRpsChoice] = useState<string | null>(null);
  const [rpsResult, setRpsResult] = useState<string | null>(null);

  // 9. Stopwatch exact stop
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [stopwatchStopped, setStopwatchStopped] = useState(false);

  const timerRef = useRef<number | null>(null);

  // Reset state on new microgame
  useEffect(() => {
    setTimeLeft(totalDuration);
    setOutcome('playing');
    setIsDucking(false);
    setHazardProgress(0);
    setBalanceAngle(0);
    setBalanceVelocity(0);
    setStampPos(10);
    setStampDone(false);
    setSplatsRemaining([1, 1, 1]);
    setItemCaught(false);
    setCurrentTaps(0);
    setSwitchDone(false);
    setRpsChoice(null);
    setRpsResult(null);
    setStopwatchTime(0);
    setStopwatchStopped(false);
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
  }, [outcome, totalDuration, balanceAngle]);

  // Stopwatch timer increment
  useEffect(() => {
    if (microgame.title !== 'Stopwatch Precision' || outcome !== 'playing' || stopwatchStopped) return;
    const interval = setInterval(() => {
      setStopwatchTime((prev) => prev + 0.1);
    }, 100);
    return () => clearInterval(interval);
  }, [microgame.title, outcome, stopwatchStopped]);

  // Overhauled Balance / Tilt Physics Simulation with Smooth Inertia & Damping
  useEffect(() => {
    if (microgame.title !== 'Beverage Stabilizer' && microgame.instruction.indexOf('LEVEL') === -1) {
      return;
    }
    if (outcome !== 'playing') return;

    const interval = setInterval(() => {
      setBalanceAngle((angle) => {
        setBalanceVelocity((vel) => {
          // random train jolt acceleration
          const jolt = (Math.random() - 0.5) * 4.5 * speedMultiplier;
          const nextVel = (vel + jolt) * 0.92; // damping friction
          const nextAngle = angle + nextVel;

          if (Math.abs(nextAngle) > 78) {
            triggerFail();
          }
          return nextVel;
        });

        const nextAngle = angle + balanceVelocity;
        return Math.max(-80, Math.min(80, nextAngle));
      });
    }, 50);

    return () => clearInterval(interval);
  }, [microgame, outcome, speedMultiplier, balanceVelocity]);

  const handleTimeExpired = () => {
    if (microgame.category === 'train_tasks' || microgame.category === 'rhythm_aim') {
      // If time expires on certain puzzles, check if passed or fail
      if (currentTaps >= (microgame.params.requiredTaps || 4)) {
        triggerWin();
      } else {
        triggerFail();
      }
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
    const range = microgame.params.targetRange || [35, 65];
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

  const handleGenericTap = () => {
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

  const handleRpsChoice = (choice: string) => {
    if (outcome !== 'playing' || rpsChoice) return;
    setRpsChoice(choice);
    audioEngine.playMechanicalClick();
    const conductorChoices = ['Rock', 'Paper', 'Scissors'];
    const comp = conductorChoices[Math.floor(Math.random() * conductorChoices.length)];
    setRpsResult(comp);

    // Win condition: Player beats comp or draws
    if (choice === comp || (choice === 'Rock' && comp === 'Scissors') || (choice === 'Paper' && comp === 'Rock') || (choice === 'Scissors' && comp === 'Paper')) {
      setTimeout(() => triggerWin(), 400);
    } else {
      setTimeout(() => triggerFail(), 400);
    }
  };

  const handleStopwatchStop = () => {
    if (outcome !== 'playing' || stopwatchStopped) return;
    setStopwatchStopped(true);
    audioEngine.playMechanicalClick();
    // target is around 3.0s (2.8 to 3.4)
    if (stopwatchTime >= 2.6 && stopwatchTime <= 3.4) {
      triggerWin();
    } else {
      triggerFail();
    }
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
              Signal Challenge · Round {roundNumber}
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
        <div className="w-full min-h-[220px] flex items-center justify-center p-4 bg-[#f8f7f4] rounded-2xl border border-[#1c1917]/10 relative overflow-hidden text-[#1c1917]">
          
          {/* 1. DUCK TUNNEL */}
          {microgame.instruction.indexOf('DUCK') !== -1 && (
            <div className="w-full h-48 flex flex-col items-center justify-end relative">
              <div
                className="absolute top-0 left-0 right-0 h-16 bg-[#1c1917] border-b-2 border-[#d97706] rounded-b-xl flex items-center justify-center shadow-md transition-all text-[#f8f7f4]"
                style={{ transform: `translateY(${Math.min(0, -60 + hazardProgress)}px)` }}
              >
                <span className="font-mono-space text-[10px] uppercase tracking-widest text-amber-300 font-bold">
                  {microgame.params.subType}
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
                  isDucking ? 'bg-emerald-600 border-emerald-500 text-white scale-95 shadow-sm' : 'bg-[#1c1917] hover:bg-stone-800 border-[#1c1917] text-[#f8f7f4]'
                }`}
              >
                {isDucking ? 'Holding Down' : 'Hold to Duck'}
              </button>
            </div>
          )}

          {/* 2. OVERHAULED TILT BALANCE (COFFEE / TRAY STABILIZER) */}
          {(microgame.title.includes('Stabilizer') || microgame.instruction.includes('LEVEL') || microgame.instruction.includes('BALANCE')) && (
            <div className="w-full flex flex-col items-center gap-4">
              <div className="relative w-80 h-28 bg-white border border-[#1c1917]/15 rounded-2xl flex items-center justify-center overflow-hidden shadow-inner">
                {/* Safe zone indicator */}
                <div className="absolute inset-y-0 w-24 bg-emerald-500/15 border-x border-emerald-500/30" />
                
                {/* Visual tilt meter bar */}
                <div className="absolute top-2 left-4 right-4 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-600 transition-all duration-75"
                    style={{ width: `${50 + (balanceAngle / 80) * 50}%` }}
                  />
                </div>

                <div
                  className="transition-transform duration-75 flex flex-col items-center"
                  style={{ transform: `translateX(${balanceAngle * 1.4}px) rotate(${balanceAngle * 0.3}deg)` }}
                >
                  <span className="text-4xl drop-shadow">{microgame.params.itemEmoji || '☕'}</span>
                  <div className="w-16 h-2 bg-[#1c1917] rounded-full mt-1" />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    audioEngine.playMechanicalClick();
                    setBalanceVelocity((v) => v - 12);
                  }}
                  className="px-5 py-2.5 rounded-full bg-[#1c1917] hover:bg-stone-800 text-[#f8f7f4] font-mono-space text-xs uppercase tracking-wider shadow-sm transition-all active:scale-95"
                >
                  ◀ Nudge Left
                </button>
                <button
                  onClick={() => {
                    audioEngine.playMechanicalClick();
                    setBalanceVelocity((v) => v + 12);
                  }}
                  className="px-5 py-2.5 rounded-full bg-[#1c1917] hover:bg-stone-800 text-[#f8f7f4] font-mono-space text-xs uppercase tracking-wider shadow-sm transition-all active:scale-95"
                >
                  Nudge Right ▶
                </button>
              </div>
            </div>
          )}

          {/* 3. ROCK PAPER SCISSORS DUEL */}
          {microgame.title === 'Rock Paper Scissors' && (
            <div className="w-full flex flex-col items-center gap-4">
              <p className="font-serif-cormorant text-sm font-semibold">
                {rpsChoice ? `Conductor chose: ${rpsResult}` : 'Select your move against the conductor!'}
              </p>

              <div className="flex gap-4">
                {['Rock', 'Paper', 'Scissors'].map((opt) => (
                  <button
                    key={opt}
                    disabled={Boolean(rpsChoice)}
                    onClick={() => handleRpsChoice(opt)}
                    className={`px-5 py-3 rounded-2xl border font-mono-space text-xs uppercase tracking-wider transition-all shadow-sm ${
                      rpsChoice === opt
                        ? 'bg-emerald-600 text-white border-emerald-500 scale-105'
                        : 'bg-white hover:bg-stone-100 border-[#1c1917]/20 text-[#1c1917]'
                    }`}
                  >
                    <span className="text-2xl block mb-1">
                      {opt === 'Rock' ? '✊' : opt === 'Paper' ? '📄' : '✌️'}
                    </span>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 4. STOPWATCH PRECISION */}
          {microgame.title === 'Stopwatch Precision' && (
            <div className="w-full flex flex-col items-center gap-4">
              <div className="w-36 h-36 rounded-full border-4 border-[#1c1917] bg-white flex flex-col items-center justify-center shadow-md">
                <span className="font-mono-space text-2xl font-bold">
                  {stopwatchTime.toFixed(1)}s
                </span>
                <span className="font-mono-space text-[10px] opacity-60">Target: 3.0s</span>
              </div>

              <button
                disabled={stopwatchStopped}
                onClick={handleStopwatchStop}
                className="px-8 py-2.5 rounded-full bg-[#1c1917] hover:bg-stone-800 text-[#f8f7f4] font-mono-space text-xs uppercase tracking-wider shadow-sm transition-all active:scale-95"
              >
                {stopwatchStopped ? 'Stopped!' : 'STOP AT 3.0S'}
              </button>
            </div>
          )}

          {/* 5. TICKET STAMP */}
          {microgame.instruction.includes('STAMP') && microgame.title !== 'Rock Paper Scissors' && (
            <div className="w-full flex flex-col items-center gap-4">
              <div className="relative w-80 h-28 bg-white border border-[#1c1917]/15 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                <div
                  className="absolute inset-y-2 w-14 border-2 border-dashed border-emerald-600 bg-emerald-50 rounded-xl flex items-center justify-center text-[10px] text-emerald-800 font-mono-space font-bold"
                  style={{ left: `${(microgame.params.targetRange || [35, 65])[0]}%` }}
                >
                  ZONE
                </div>

                <div
                  className="absolute top-2 bottom-2 w-3 bg-rose-600 rounded-full shadow-md transition-all"
                  style={{ left: `${stampPos}%` }}
                />

                <span className="font-serif-cormorant text-sm font-semibold uppercase">
                  {microgame.params.subType}
                </span>
              </div>

              <button
                onClick={handleStampPress}
                className="px-8 py-2.5 rounded-full bg-[#1c1917] hover:bg-stone-800 text-[#f8f7f4] font-mono-space text-xs uppercase tracking-wider shadow-sm transition-all active:scale-95"
              >
                STAMP NOW! 🎟️
              </button>
            </div>
          )}

          {/* 6. TRACK SWITCH / COLOR MATCH */}
          {microgame.category === 'train_tasks' && microgame.instruction.includes('SWITCH') && (
            <div className="w-full flex flex-col items-center gap-4">
              <p className="font-serif-cormorant text-sm font-semibold">
                Select the correct junction switch color:
              </p>
              <div className="flex gap-3">
                {(['green', 'blue', 'amber', 'red'] as const).map((color) => (
                  <button
                    key={color}
                    onClick={() => handleSwitchPress(color)}
                    className={`w-12 h-12 rounded-2xl border-2 shadow-md transition-transform active:scale-95 uppercase font-mono-space text-xs font-bold ${
                      color === 'green' ? 'bg-emerald-500 border-emerald-700 text-white' :
                      color === 'blue' ? 'bg-blue-500 border-blue-700 text-white' :
                      color === 'amber' ? 'bg-amber-500 border-amber-700 text-white' :
                      'bg-rose-500 border-rose-700 text-white'
                    }`}
                  >
                    {color[0].toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 7. WINDSHIELD WIPER / CLEANSER */}
          {microgame.instruction.includes('CLEAR') && (
            <div className="w-full flex flex-col items-center gap-4">
              <p className="font-serif-cormorant text-sm font-semibold">
                Tap all spots to clean the windshield:
              </p>
              <div className="flex gap-4">
                {splatsRemaining.map((val, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleWipeSpot(idx)}
                    className={`w-14 h-14 rounded-2xl border flex items-center justify-center text-2xl transition-all shadow-sm ${
                      val === 1 ? 'bg-white border-[#1c1917]/20 hover:scale-105' : 'bg-emerald-100 border-emerald-300 opacity-40 scale-95'
                    }`}
                  >
                    {val === 1 ? '🍂' : '✨'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 8. GENERAL MASH / TAP CHALLENGE (Default Fallback for Taps) */}
          {microgame.params.requiredTaps && !microgame.instruction.includes('DUCK') && (
            <div className="w-full flex flex-col items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="font-mono-space text-xs font-bold">
                  Taps: {currentTaps} / {microgame.params.requiredTaps || 5}
                </span>
              </div>

              <button
                onClick={handleGenericTap}
                className="px-10 py-3 rounded-2xl bg-[#1c1917] hover:bg-stone-800 text-[#f8f7f4] font-mono-space text-sm uppercase tracking-wider shadow-md transition-all active:scale-95"
              >
                TAP RAPIDLY! ⚡
              </button>
            </div>
          )}

          {/* Outcome Overlays */}
          {outcome === 'won' && (
            <div className="absolute inset-0 bg-emerald-600/90 backdrop-blur-sm flex flex-col items-center justify-center text-white animate-in zoom-in duration-200">
              <CheckCircle2 className="w-16 h-16 mb-2 animate-bounce" />
              <h3 className="font-serif-cormorant italic text-3xl font-bold">Challenge Cleared!</h3>
              <p className="font-mono-space text-xs uppercase tracking-widest mt-1">Reward +100 Coins</p>
            </div>
          )}

          {outcome === 'lost' && (
            <div className="absolute inset-0 bg-rose-600/90 backdrop-blur-sm flex flex-col items-center justify-center text-white animate-in zoom-in duration-200">
              <XCircle className="w-16 h-16 mb-2 animate-pulse" />
              <h3 className="font-serif-cormorant italic text-3xl font-bold">Missed Milestone!</h3>
              <p className="font-mono-space text-xs uppercase tracking-widest mt-1">Heart Lost</p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
