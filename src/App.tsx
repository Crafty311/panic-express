import React, { useState, useEffect, useRef } from 'react';
import { 
  Station, 
  Passenger, 
  CompartmentCustomization, 
  TrainUpgrades 
} from './types/game';
import { 
  MODERN_STATIONS, 
  COZY_PASSENGERS, 
  MicrogameInstance, 
  generateProceduralMicrogame 
} from './data/microgames';
import { audioEngine } from './services/audioService';
import { TrainWindowCanvas } from './components/TrainWindowCanvas';
import { CompartmentInterior } from './components/CompartmentInterior';
import { MicrogameOverlay } from './components/MicrogameOverlay';
import { StationArrivalModal } from './components/StationArrivalModal';
import { UpgradeShopModal } from './components/UpgradeShopModal';

export default function App() {
  // Station & Route
  const [stationIndex, setStationIndex] = useState<number>(0);
  const currentStation = MODERN_STATIONS[stationIndex % MODERN_STATIONS.length];
  const nextStation = MODERN_STATIONS[(stationIndex + 1) % MODERN_STATIONS.length];
  const [distanceToNextKm, setDistanceToNextKm] = useState<number>(nextStation.distanceKm);

  // Day / Night Atmosphere State
  const [isNightMode, setIsNightMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('panic_express_night_mode') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleNightMode = () => {
    setIsNightMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('panic_express_night_mode', String(next));
      } catch {}
      return next;
    });
  };

  // Sectional Tunnel Transition (triggers when entering new biomes or departing stations)
  const [isTunnelTransition, setIsTunnelTransition] = useState<boolean>(false);

  // Economy & Scores
  const [score, setScore] = useState<number>(0);
  const [coins, setCoins] = useState<number>(120);
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);

  // Upgrades
  const [upgrades, setUpgrades] = useState<TrainUpgrades>({
    maxSpeedLevel: 1,
    extraHeartUnlocked: false,
    bentoBoxLevel: 1,
    streamlinedAerodynamics: false,
  });

  const maxHearts = upgrades.extraHeartUnlocked ? 4 : 3;
  const [hearts, setHearts] = useState<number>(3);

  // Cabin Customization
  const [customization, setCustomization] = useState<CompartmentCustomization>({
    woodStyle: 'warm_oak',
    seatColor: 'emerald_velvet',
    tableTrinket: 'hot_coffee',
    curtainStyle: 'open',
  });

  // Scheduled Signal Post Milestone State (Side Feature)
  const [signalPostAvailable, setSignalPostAvailable] = useState<boolean>(false);
  const distanceSinceLastSignalRef = useRef<number>(0);

  // Active Microgame (on-demand or milestone accepted)
  const [activeMicrogame, setActiveMicrogame] = useState<MicrogameInstance | null>(null);
  const [isPlayingMicrogame, setIsPlayingMicrogame] = useState<boolean>(false);

  // Modals
  const [isStationArrivalOpen, setIsStationArrivalOpen] = useState<boolean>(false);
  const [isUpgradeShopOpen, setIsUpgradeShopOpen] = useState<boolean>(false);

  // Current passenger aboard
  const [currentPassenger, setCurrentPassenger] = useState<Passenger>(COZY_PASSENGERS[0]);

  // Train Speed
  const maxSpeedKmH = 90 + upgrades.maxSpeedLevel * 25;
  const [speedKmH, setSpeedKmH] = useState<number>(85);

  // Start Background Chillhop automatically on first user click anywhere
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!audioEngine.getIsBgmPlaying()) {
        audioEngine.playBgm();
      }
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('keydown', handleFirstInteraction);
    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, []);

  // Main Scenic Train Physics & Distance Loop
  useEffect(() => {
    const tickInterval = 250; // ms
    const dt = tickInterval / 1000;

    const interval = setInterval(() => {
      if (isStationArrivalOpen) return;

      // Distance advancement: distance = speed * dt
      const kmPerSec = (speedKmH * speedMultiplier) / 3600;
      const kmTraveled = kmPerSec * dt * 8; // slight arcade progression scaling

      distanceSinceLastSignalRef.current += kmTraveled;

      // Every ~4.5 km of scenic travel, a railway signal post milestone appears!
      if (
        distanceSinceLastSignalRef.current >= 4.5 &&
        !signalPostAvailable &&
        !isPlayingMicrogame
      ) {
        distanceSinceLastSignalRef.current = 0;
        setSignalPostAvailable(true);
        audioEngine.playSignalAlert();
      }

      setDistanceToNextKm((prevDist) => {
        const nextDist = prevDist - kmTraveled;
        if (nextDist <= 0) {
          triggerStationArrival();
          return 0;
        }
        return nextDist;
      });
    }, tickInterval);

    return () => clearInterval(interval);
  }, [
    isStationArrivalOpen,
    speedKmH,
    speedMultiplier,
    signalPostAvailable,
    isPlayingMicrogame,
  ]);

  // Trigger Station Arrival
  const triggerStationArrival = () => {
    audioEngine.playStationArrival();
    setSignalPostAvailable(false);
    setIsPlayingMicrogame(false);
    setActiveMicrogame(null);
    setHearts(maxHearts); // Station refills all lives!
    setCoins((c) => c + nextStation.rewardCoins);

    const randomPassenger = COZY_PASSENGERS[(stationIndex + 1) % COZY_PASSENGERS.length];
    setCurrentPassenger(randomPassenger);

    setIsStationArrivalOpen(true);
  };

  // Depart Station with Sectional Mountain Tunnel Biome Transition
  const handleDepartStation = () => {
    setIsStationArrivalOpen(false);
    const nextIdx = (stationIndex + 1) % MODERN_STATIONS.length;
    setStationIndex(nextIdx);
    setDistanceToNextKm(MODERN_STATIONS[(nextIdx + 1) % MODERN_STATIONS.length].distanceKm);
    distanceSinceLastSignalRef.current = 0;

    // Trigger atmospheric 2.8s mountain tunnel transition between regions
    setIsTunnelTransition(true);
    setTimeout(() => {
      setIsTunnelTransition(false);
    }, 2800);
  };

  // Accept Signal Milestone Challenge
  const handleAcceptSignalChallenge = () => {
    setSignalPostAvailable(false);
    const newChallenge = generateProceduralMicrogame(roundNumber);
    setActiveMicrogame(newChallenge);
    setIsPlayingMicrogame(true);
  };

  // Dismiss Signal Post
  const handleDismissSignalPost = () => {
    setSignalPostAvailable(false);
  };

  // Request Manual Challenge from Console anytime
  const handleRequestManualChallenge = () => {
    const newChallenge = generateProceduralMicrogame(roundNumber);
    setActiveMicrogame(newChallenge);
    setIsPlayingMicrogame(true);
  };

  // Microgame Win Handler
  const handleMicrogameSuccess = (pointsEarned: number) => {
    const bentoBonus = upgrades.bentoBoxLevel * 15;
    const earnedCoins = 30 + bentoBonus;
    setScore((s) => s + pointsEarned);
    setCoins((c) => c + earnedCoins);
    setRoundNumber((r) => r + 1);

    // Minor health recovery reward on success
    setHearts((h) => Math.min(maxHearts, h + 1));

    // High speed forward boost toward upcoming station!
    setDistanceToNextKm((prev) => Math.max(0.5, prev - 3.0));

    setIsPlayingMicrogame(false);
    setActiveMicrogame(null);
  };

  // Microgame Failure Handler
  const handleMicrogameFailure = () => {
    setHearts((prev) => Math.max(1, prev - 1));
    setIsPlayingMicrogame(false);
    setActiveMicrogame(null);
  };

  // Whistle Chime
  const handleWhistleClick = () => {
    audioEngine.playWhistle();
  };

  // Upgrades purchases
  const handleBuySpeed = (cost: number) => {
    if (coins < cost) return;
    setCoins((c) => c - cost);
    setUpgrades((u) => ({ ...u, maxSpeedLevel: u.maxSpeedLevel + 1 }));
    setSpeedKmH((s) => s + 15);
  };

  const handleBuyBento = (cost: number) => {
    if (coins < cost) return;
    setCoins((c) => c - cost);
    setUpgrades((u) => ({ ...u, bentoBoxLevel: u.bentoBoxLevel + 1 }));
  };

  const handleBuyExtraHeart = (cost: number) => {
    if (coins < cost) return;
    setCoins((c) => c - cost);
    setUpgrades((u) => ({ ...u, extraHeartUnlocked: true }));
    setHearts(4);
  };

  const currentBiome = currentStation.biome || 'meadow_plain';
  const stationVariant = nextStation.stationVariant || 'meadowbrook_whistlestop';

  return (
    <div className={`relative w-screen h-screen overflow-hidden select-none font-sans-inter transition-colors duration-700 ${
      isNightMode ? 'bg-[#090d16] text-[#f8f7f4]' : 'bg-[#f8f7f4] text-[#1c1917]'
    }`}>
      
      {/* 1. PANORAMIC OBSERVATION SCENERY CANVAS (MULTI-BIOME, DAY/NIGHT & 10 STATIONS) */}
      <TrainWindowCanvas
        speedKmH={speedKmH * speedMultiplier}
        tunnelActive={activeMicrogame?.category === 'duck_tunnel' || isTunnelTransition}
        isNightMode={isNightMode}
        currentBiome={currentBiome}
        stationVariant={stationVariant}
        stationName={nextStation.name}
        distanceToNextKm={distanceToNextKm}
      />

      {/* 2. MODERN SLEEK GLASSMORPHIC OBSERVATION SALON COMPARTMENT */}
      <CompartmentInterior
        customization={customization}
        speedKmH={speedKmH * speedMultiplier}
        maxSpeedKmH={maxSpeedKmH}
        currentStation={currentStation}
        nextStation={nextStation}
        distanceToNextKm={distanceToNextKm}
        coins={coins}
        score={score}
        isNightMode={isNightMode}
        currentBiome={currentBiome}
        onToggleNightMode={handleToggleNightMode}
        onWhistleClick={handleWhistleClick}
        onOpenDepot={() => setIsUpgradeShopOpen(true)}
        signalPostAvailable={signalPostAvailable}
        onAcceptSignalChallenge={handleAcceptSignalChallenge}
        onDismissSignalPost={handleDismissSignalPost}
        onRequestManualChallenge={handleRequestManualChallenge}
        isPlayingMicrogame={isPlayingMicrogame}
      />

      {/* 3. SIGNAL POST PROCEDURAL MICROGAME MODAL */}
      {isPlayingMicrogame && activeMicrogame && (
        <MicrogameOverlay
          key={activeMicrogame.id}
          microgame={activeMicrogame}
          speedMultiplier={speedMultiplier}
          onSuccess={handleMicrogameSuccess}
          onFailure={handleMicrogameFailure}
          onDismiss={() => {
            audioEngine.playMechanicalClick();
            setIsPlayingMicrogame(false);
            setActiveMicrogame(null);
          }}
          hearts={hearts}
          maxHearts={maxHearts}
          roundNumber={roundNumber}
          isNightMode={isNightMode}
        />
      )}

      {/* 4. STATION ARRIVAL MODAL */}
      <StationArrivalModal
        isOpen={isStationArrivalOpen}
        station={nextStation}
        nextStation={MODERN_STATIONS[(stationIndex + 2) % MODERN_STATIONS.length]}
        rewardCoins={nextStation.rewardCoins}
        newPassenger={currentPassenger}
        isNightMode={isNightMode}
        onContinue={handleDepartStation}
      />

      {/* 5. MODERN UPGRADES DEPOT MODAL */}
      <UpgradeShopModal
        isOpen={isUpgradeShopOpen}
        onClose={() => setIsUpgradeShopOpen(false)}
        coins={coins}
        upgrades={upgrades}
        customization={customization}
        isNightMode={isNightMode}
        onBuySpeed={handleBuySpeed}
        onBuyBento={handleBuyBento}
        onBuyExtraHeart={handleBuyExtraHeart}
        onUpdateCustomization={(c) => setCustomization((prev) => ({ ...prev, ...c }))}
      />

    </div>
  );
}
