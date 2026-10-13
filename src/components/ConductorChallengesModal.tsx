import React, { useState, useEffect } from 'react';
import { Challenge, ChallengeType } from '../types/game';
import { AVAILABLE_CHALLENGES } from '../data/stations';
import { 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Flame, 
  Split, 
  FileCheck, 
  Radio, 
  Camera, 
  Sparkles,
  Zap
} from 'lucide-react';
import { audioEngine } from '../services/audioService';

interface ConductorChallengesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleteChallenge: (challenge: Challenge, bonusDistanceKm: number) => void;
  currentStationName: string;
  nextStationName: string;
}

export const ConductorChallengesModal: React.FC<ConductorChallengesModalProps> = ({
  isOpen,
  onClose,
  onCompleteChallenge,
  currentStationName,
  nextStationName,
}) => {
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);

  // Challenge 1 State: Track Switch
  const [switches, setSwitches] = useState<[boolean, boolean, boolean]>([false, false, false]);
  const [trackTarget, setTrackTarget] = useState<[boolean, boolean, boolean]>([true, false, true]);
  const [trackTimer, setTrackTimer] = useState<number>(12);

  // Challenge 2 State: Boiler Rhythm
  const [boilerPressure, setBoilerPressure] = useState<number>(50);
  const [holdTimeInZone, setHoldTimeInZone] = useState<number>(0);
  const targetHoldTime = 4.0; // 4 seconds in the 65-85 sweet zone

  // Challenge 3 State: Ticket Check
  const [ticketIndex, setTicketIndex] = useState<number>(0);
  const tickets = [
    {
      passenger: 'Lady Genevieve',
      destination: nextStationName,
      correctDestination: true,
      validStamp: true,
      ticketType: 'First Class Salon',
      isLegit: true,
    },
    {
      passenger: 'The Mysterious Count',
      destination: 'Port Nowhere (Not on Route)',
      correctDestination: false,
      validStamp: true,
      ticketType: 'Expired Standard',
      isLegit: false,
    },
    {
      passenger: 'Professor Archambault',
      destination: nextStationName,
      correctDestination: true,
      validStamp: true,
      ticketType: 'Academic Diplomat Pass',
      isLegit: true,
    },
  ];

  // Challenge 4 State: Telegraph Dispatch
  const [telegraphSequence, setTelegraphSequence] = useState<string[]>(['DOT', 'DASH', 'DOT']);
  const [playerMorse, setPlayerMorse] = useState<string[]>([]);

  // Challenge completion feedback
  const [completedSuccess, setCompletedSuccess] = useState<boolean>(false);

  // Reset or initialize minigame when challenge changes
  useEffect(() => {
    if (!selectedChallenge) return;
    setCompletedSuccess(false);

    if (selectedChallenge.type === 'track_switch') {
      const t1 = Math.random() > 0.5;
      const t2 = Math.random() > 0.5;
      const t3 = !t1; // ensure not all false
      setTrackTarget([t1, t2, t3]);
      setSwitches([!t1, !t2, !t3]);
      setTrackTimer(14);
    } else if (selectedChallenge.type === 'boiler_rhythm') {
      setBoilerPressure(45);
      setHoldTimeInZone(0);
    } else if (selectedChallenge.type === 'telegraph_morse') {
      const patterns = [
        ['DOT', 'DASH', 'DOT'],
        ['DASH', 'DOT', 'DASH'],
        ['DOT', 'DOT', 'DASH', 'DOT'],
      ];
      setTelegraphSequence(patterns[Math.floor(Math.random() * patterns.length)]);
      setPlayerMorse([]);
    }
  }, [selectedChallenge]);

  // Boiler loop
  useEffect(() => {
    if (!selectedChallenge || selectedChallenge.type !== 'boiler_rhythm' || completedSuccess) return;

    const interval = setInterval(() => {
      setBoilerPressure((prev) => {
        // Natural pressure drop
        const next = Math.max(10, prev - 2.8);
        if (next >= 65 && next <= 85) {
          setHoldTimeInZone((ht) => {
            const updated = ht + 0.1;
            if (updated >= targetHoldTime) {
              handleFinishSuccess(selectedChallenge);
            }
            return updated;
          });
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [selectedChallenge, completedSuccess]);

  // Track switch countdown timer
  useEffect(() => {
    if (!selectedChallenge || selectedChallenge.type !== 'track_switch' || completedSuccess) return;

    const interval = setInterval(() => {
      setTrackTimer((prev) => {
        if (prev <= 1) {
          // Failed timer
          setSelectedChallenge(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedChallenge, completedSuccess]);

  if (!isOpen) return null;

  const handleFinishSuccess = (ch: Challenge) => {
    setCompletedSuccess(true);
    audioEngine.playSuccess();
    audioEngine.playCoin();
    setTimeout(() => {
      onCompleteChallenge(ch, 5.0); // Grants 5km forward boost!
      setSelectedChallenge(null);
      setCompletedSuccess(false);
    }, 1200);
  };

  const handleTrackToggle = (idx: 0 | 1 | 2) => {
    const updated: [boolean, boolean, boolean] = [...switches];
    updated[idx] = !updated[idx];
    setSwitches(updated);

    if (
      updated[0] === trackTarget[0] &&
      updated[1] === trackTarget[1] &&
      updated[2] === trackTarget[2]
    ) {
      if (selectedChallenge) handleFinishSuccess(selectedChallenge);
    }
  };

  const handleStokeBoiler = () => {
    setBoilerPressure((prev) => Math.min(100, prev + 14));
  };

  const handleVentSteam = () => {
    setBoilerPressure((prev) => Math.max(0, prev - 15));
  };

  const handleTicketDecision = (approve: boolean) => {
    const currentTicket = tickets[ticketIndex % tickets.length];
    const isCorrect = approve === currentTicket.isLegit;

    if (isCorrect) {
      if (selectedChallenge) handleFinishSuccess(selectedChallenge);
    } else {
      audioEngine.playWhistle();
      setSelectedChallenge(null);
    }
  };

  const handleAddMorse = (code: 'DOT' | 'DASH') => {
    const nextSeq = [...playerMorse, code];
    setPlayerMorse(nextSeq);

    // Check match
    const isCorrectSoFar = nextSeq.every((c, i) => c === telegraphSequence[i]);
    if (!isCorrectSoFar) {
      setPlayerMorse([]);
      return;
    }

    if (nextSeq.length === telegraphSequence.length) {
      if (selectedChallenge) handleFinishSuccess(selectedChallenge);
    }
  };

  const handleSnapshotCapture = () => {
    if (selectedChallenge) handleFinishSuccess(selectedChallenge);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#2a1b14] via-[#1c120d] to-[#0f0907] border-2 border-amber-500/70 rounded-xl shadow-[0_0_40px_rgba(245,158,11,0.25)] overflow-hidden text-stone-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-950 via-amber-900 to-stone-900 border-b border-amber-600/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📋</span>
            <div>
              <h2 className="font-serif-vintage text-lg font-bold text-amber-200 tracking-wider">
                Conductor&apos;s Dispatch Clipboard
              </h2>
              <p className="text-xs text-amber-400/80">
                Solve operational railway challenges to earn points, coins, and high-speed station jumps
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {completedSuccess && (
            <div className="mb-6 p-4 rounded-lg bg-emerald-950/80 border border-emerald-500/80 text-center flex flex-col items-center gap-2 animate-bounce">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              <div className="font-serif-vintage text-base font-bold text-emerald-200">
                Challenge Accomplished!
              </div>
              <p className="text-xs text-emerald-300">
                Granted +{selectedChallenge?.rewardPoints} Points, +{selectedChallenge?.rewardCoins}g Coins, and a +5km High-Speed Boost toward {nextStationName}!
              </p>
            </div>
          )}

          {!selectedChallenge ? (
            // Challenge List Selection
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs text-amber-300 font-semibold mb-2">
                <span>Select an active challenge for this stretch of track:</span>
                <span>Active Route: {currentStationName} → {nextStationName}</span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {AVAILABLE_CHALLENGES.map((ch) => (
                  <div
                    key={ch.id}
                    onClick={() => setSelectedChallenge(ch)}
                    className="group cursor-pointer p-4 rounded-lg bg-black/40 hover:bg-amber-950/40 border border-amber-800/40 hover:border-amber-400/80 transition-all flex items-center justify-between shadow hover:shadow-lg"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="p-2.5 rounded-lg bg-amber-900/50 border border-amber-600/40 text-amber-300 group-hover:scale-110 transition-transform">
                        {ch.type === 'track_switch' && <Split className="w-5 h-5" />}
                        {ch.type === 'boiler_rhythm' && <Flame className="w-5 h-5" />}
                        {ch.type === 'ticket_check' && <FileCheck className="w-5 h-5" />}
                        {ch.type === 'telegraph_morse' && <Radio className="w-5 h-5" />}
                        {ch.type === 'vista_snapshot' && <Camera className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-serif-vintage text-sm font-bold text-amber-200 group-hover:text-amber-100">
                            {ch.title}
                          </h3>
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-black/50 text-stone-300 border border-stone-700">
                            {ch.difficulty}
                          </span>
                        </div>
                        <p className="text-xs text-stone-400 mt-1 max-w-md">
                          {ch.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 text-xs">
                      <div className="flex items-center gap-2 text-amber-300 font-mono font-semibold">
                        <span>+{ch.rewardPoints} pts</span>
                        <span>·</span>
                        <span>+{ch.rewardCoins}g</span>
                      </div>
                      <div className="flex items-center gap-1 text-emerald-400 text-[11px] font-medium">
                        <Zap className="w-3 h-3" />
                        <span>+{ch.rewardSpeedKmBoost} km/h Boost</span>
                      </div>
                      <button className="mt-1 px-3 py-1 rounded bg-amber-600 group-hover:bg-amber-500 text-stone-950 text-xs font-bold shadow-sm transition-colors">
                        Begin
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Active Interactive Minigame View
            <div className="p-4 rounded-lg bg-black/50 border border-amber-700/60 flex flex-col gap-5">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-serif-vintage text-base font-bold text-amber-200">
                    {selectedChallenge.title}
                  </h3>
                  <p className="text-xs text-stone-400 mt-0.5">{selectedChallenge.description}</p>
                </div>
                <button
                  onClick={() => setSelectedChallenge(null)}
                  className="text-xs text-stone-400 hover:text-stone-200 underline"
                >
                  Cancel Challenge
                </button>
              </div>

              {/* MINIGAME 1: TRACK SWITCH */}
              {selectedChallenge.type === 'track_switch' && (
                <div className="flex flex-col items-center gap-4 py-2">
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="text-red-400 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      Approaching Junction: {trackTimer}s
                    </span>
                    <span className="text-stone-300">
                      Target Signal Alignment: [{trackTarget.map((t) => (t ? 'RIGHT' : 'LEFT')).join(' · ')}]
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-6 w-full max-w-md">
                    {[0, 1, 2].map((idx) => {
                      const active = switches[idx as 0 | 1 | 2];
                      const matched = active === trackTarget[idx as 0 | 1 | 2];
                      return (
                        <div key={idx} className="flex flex-col items-center gap-2 bg-stone-900/80 p-3 rounded-lg border border-amber-900">
                          <span className="text-xs font-mono font-bold text-amber-300">Switch #{idx + 1}</span>
                          <button
                            onClick={() => handleTrackToggle(idx as 0 | 1 | 2)}
                            className={`w-14 h-14 rounded-full font-bold text-xs shadow-lg transition-transform active:scale-90 border-2 ${
                              matched
                                ? 'bg-emerald-600 border-emerald-300 text-white shadow-emerald-600/40'
                                : 'bg-red-800 border-red-500 text-stone-200'
                            }`}
                          >
                            {active ? 'RIGHT' : 'LEFT'}
                          </button>
                          <span className={`text-[10px] ${matched ? 'text-emerald-400 font-bold' : 'text-stone-400'}`}>
                            {matched ? 'ALIGNED ✓' : 'MISALIGNED'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* MINIGAME 2: BOILER RHYTHM */}
              {selectedChallenge.type === 'boiler_rhythm' && (
                <div className="flex flex-col items-center gap-4 py-2">
                  <div className="text-xs text-amber-300 text-center">
                    Keep boiler steam inside the <strong className="text-emerald-400">Green Sweet Zone (65 - 85 PSI)</strong> for {targetHoldTime} seconds!
                  </div>

                  {/* Pressure gauge bar */}
                  <div className="w-full max-w-md bg-stone-900 h-8 rounded-lg overflow-hidden border-2 border-amber-600 relative p-1">
                    {/* Sweet zone highlight */}
                    <div className="absolute top-0 bottom-0 left-[65%] w-[20%] bg-emerald-500/30 border-x-2 border-emerald-400" />
                    {/* Current pressure marker */}
                    <div 
                      className={`h-full rounded transition-all duration-100 ${
                        boilerPressure >= 65 && boilerPressure <= 85 ? 'bg-emerald-500' : 'bg-amber-600'
                      }`}
                      style={{ width: `${boilerPressure}%` }}
                    />
                  </div>

                  <div className="flex justify-between w-full max-w-md text-xs font-mono text-stone-400">
                    <span>Pressure: {Math.round(boilerPressure)} PSI</span>
                    <span className="text-emerald-300 font-bold">
                      Hold: {holdTimeInZone.toFixed(1)}s / {targetHoldTime}s
                    </span>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={handleStokeBoiler}
                      className="px-5 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md active:scale-95 flex items-center gap-1.5"
                    >
                      <Flame className="w-4 h-4" />
                      Stoke Furnace (+14 PSI)
                    </button>
                    <button
                      onClick={handleVentSteam}
                      className="px-4 py-2.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs border border-stone-600 active:scale-95"
                    >
                      Vent Valve (-15 PSI)
                    </button>
                  </div>
                </div>
              )}

              {/* MINIGAME 3: TICKET INSPECTION */}
              {selectedChallenge.type === 'ticket_check' && (
                <div className="flex flex-col items-center gap-4 py-2">
                  {(() => {
                    const t = tickets[ticketIndex % tickets.length];
                    return (
                      <div className="w-full max-w-md bg-amber-50 text-stone-900 p-4 rounded-lg shadow-xl border-2 border-amber-700 flex flex-col gap-2 font-serif">
                        <div className="flex justify-between border-b border-amber-300 pb-2">
                          <span className="font-bold text-xs tracking-wider uppercase text-amber-900">
                            PANIC EXPRESS TRANSIT PASS
                          </span>
                          <span className="text-xs font-mono font-bold text-red-700">№ 84192</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs py-1">
                          <div>
                            <span className="block text-[10px] text-stone-500 uppercase">Passenger Name</span>
                            <strong>{t.passenger}</strong>
                          </div>
                          <div>
                            <span className="block text-[10px] text-stone-500 uppercase">Assigned Destination</span>
                            <strong className={t.correctDestination ? 'text-stone-900' : 'text-red-600'}>
                              {t.destination}
                            </strong>
                          </div>
                          <div>
                            <span className="block text-[10px] text-stone-500 uppercase">Class Tier</span>
                            <span>{t.ticketType}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] text-stone-500 uppercase">Next Station Expected</span>
                            <span className="font-bold text-emerald-800">{nextStationName}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="flex gap-4">
                    <button
                      onClick={() => handleTicketDecision(true)}
                      className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md active:scale-95"
                    >
                      Stamp & Approve Pass ✓
                    </button>
                    <button
                      onClick={() => handleTicketDecision(false)}
                      className="px-6 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white font-bold text-xs shadow-md active:scale-95"
                    >
                      Reject Counterfeit ✗
                    </button>
                  </div>
                </div>
              )}

              {/* MINIGAME 4: TELEGRAPH MORSE */}
              {selectedChallenge.type === 'telegraph_morse' && (
                <div className="flex flex-col items-center gap-4 py-2">
                  <div className="text-xs text-amber-300">
                    Dispatch order code received: <strong className="font-mono text-emerald-300">[{telegraphSequence.join(' - ')}]</strong>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-stone-950 rounded border border-amber-900 font-mono text-sm">
                    <span className="text-stone-400 text-xs">Entered:</span>
                    <span className="text-amber-300 font-bold">
                      {playerMorse.length > 0 ? playerMorse.join(' - ') : '(Enter sequence below)'}
                    </span>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => handleAddMorse('DOT')}
                      className="px-5 py-2.5 rounded-lg bg-amber-700 hover:bg-amber-600 text-white font-bold text-xs shadow active:scale-95"
                    >
                      Tap DOT (•)
                    </button>
                    <button
                      onClick={() => handleAddMorse('DASH')}
                      className="px-5 py-2.5 rounded-lg bg-amber-800 hover:bg-amber-700 text-white font-bold text-xs shadow active:scale-95"
                    >
                      Hold DASH (—)
                    </button>
                  </div>
                </div>
              )}

              {/* MINIGAME 5: VISTA SNAPSHOT */}
              {selectedChallenge.type === 'vista_snapshot' && (
                <div className="flex flex-col items-center gap-4 py-2">
                  <p className="text-xs text-stone-300 text-center max-w-sm">
                    Frame the passing landscape through the train compartment window and trigger the vintage focal shutter!
                  </p>
                  <button
                    onClick={handleSnapshotCapture}
                    className="px-6 py-3 rounded-lg bg-gradient-to-r from-amber-600 to-yellow-600 text-stone-950 font-bold text-xs shadow-lg active:scale-95 flex items-center gap-2"
                  >
                    <Camera className="w-5 h-5" />
                    <span>Capture Scenic Photograph</span>
                  </button>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
};
