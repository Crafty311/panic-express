import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Station, 
  Passenger, 
  CompartmentCustomization, 
  TrainUpgrades, 
  WeatherType, 
  TimeOfDay, 
  BiomeType, 
  Challenge 
} from './types/game';
import { STATIONS, PASSENGER_TEMPLATES } from './data/stations';
import { audioEngine } from './services/audioService';
import { TrainWindowCanvas } from './components/TrainWindowCanvas';
import { CompartmentInterior } from './components/CompartmentInterior';
import { ConductorChallengesModal } from './components/ConductorChallengesModal';
import { StationArrivalModal } from './components/StationArrivalModal';
import { UpgradeShopModal } from './components/UpgradeShopModal';
import { WeatherControls } from './components/WeatherControls';

export default function App() {
  // Station & Route Progression
  const [stationIndex, setStationIndex] = useState<number>(0);
  const currentStation = STATIONS[stationIndex % STATIONS.length];
  const nextStation = STATIONS[(stationIndex + 1) % STATIONS.length];
  const [distanceToNextKm, setDistanceToNextKm] = useState<number>(nextStation.distanceKm);
  const [currentBiome, setCurrentBiome] = useState<BiomeType>(currentStation.biome);

  // Train Physics & Propulsion
  const [speedKmH, setSpeedKmH] = useState<number>(75);
  const [speedBoostDuration, setSpeedBoostDuration] = useState<number>(0);
  const [fuel, setFuel] = useState<number>(85);
  const maxFuel = 100;

  // Economy & Progression
  const [coins, setCoins] = useState<number>(140);
  const [conductorPoints, setConductorPoints] = useState<number>(180);

  // Upgrades
  const [upgrades, setUpgrades] = useState<TrainUpgrades>({
    engineLevel: 1,
    fuelEfficiencyLevel: 1,
    comfortRating: 1,
    wiperSystem: false,
    aerodynamicCowling: false,
  });

  // Passengers
  const [passengers, setPassengers] = useState<Passenger[]>([
    {
      id: 'pass_1',
      name: 'Madame Celeste',
      role: 'Antiquarian Scholar',
      avatar: '📜',
      destinationStationId: nextStation.id,
      farePaid: 45,
      tipPaid: 15,
      dialogue: 'The golden light outside our cabin is truly picturesque.',
      luggage: 'Embossed leather travel trunk',
    },
    {
      id: 'pass_2',
      name: 'Alpinist Marco',
      role: 'Botanist Explorer',
      avatar: '🌿',
      destinationStationId: nextStation.id,
      farePaid: 50,
      tipPaid: 20,
      dialogue: 'The speed of this express is magnificent across the mountain passes.',
      luggage: 'Alpine brass rucksack',
    },
  ]);

  // Passengers settlement for station arrival
  const [arrivedPassengers, setArrivedPassengers] = useState<Passenger[]>([]);
  const [boardingPassengers, setBoardingPassengers] = useState<Passenger[]>([]);
  const [arrivalEarnings, setArrivalEarnings] = useState<number>(0);

  // Compartment Customization
  const [customization, setCustomization] = useState<CompartmentCustomization>({
    woodFinish: 'vintage_mahogany',
    upholstery: 'crimson_velvet',
    windowFrame: 'polished_brass',
    curtainColor: 'burgundy',
    tableTrinket: 'earl_grey',
    ambientLightWarmth: 0.85,
    curtainsOpen: true,
  });

  // Weather & Atmosphere
  const [weather, setWeather] = useState<WeatherType>('clear_day');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('afternoon');
  const [realTimeSync, setRealTimeSync] = useState<boolean>(true);
  const [wipersActive, setWipersActive] = useState<boolean>(false);

  // Landmark toast alert
  const [landmarkToast, setLandmarkToast] = useState<string | null>(null);

  // Tea sip feedback
  const [sipFeedback, setSipFeedback] = useState<boolean>(false);

  // Modals
  const [isChallengesOpen, setIsChallengesOpen] = useState<boolean>(false);
  const [isStationArrivalOpen, setIsStationArrivalOpen] = useState<boolean>(false);
  const [isUpgradeShopOpen, setIsUpgradeShopOpen] = useState<boolean>(false);
  const [isWeatherControlsOpen, setIsWeatherControlsOpen] = useState<boolean>(false);

  // Compute maximum engine speed based on upgrades
  const maxSpeedKmH = 90 + upgrades.engineLevel * 25 + (upgrades.aerodynamicCowling ? 15 : 0);

  // Handle Real-Time Clock Sync
  useEffect(() => {
    if (!realTimeSync) return;

    const syncClock = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 11) {
        setTimeOfDay('morning');
      } else if (hour >= 11 && hour < 17) {
        setTimeOfDay('afternoon');
      } else if (hour >= 17 && hour < 20) {
        setTimeOfDay('sunset');
      } else if (hour >= 20 && hour < 22) {
        setTimeOfDay('twilight');
      } else {
        setTimeOfDay('night');
      }
    };

    syncClock();
    const timer = setInterval(syncClock, 60000);
    return () => clearInterval(timer);
  }, [realTimeSync]);

  // Main Simulation Tick (Distance traveled, fuel burn, speed dynamics)
  useEffect(() => {
    const tickInterval = 200; // ms
    const dt = tickInterval / 1000;

    const interval = setInterval(() => {
      // If at station, speed is zero
      if (isStationArrivalOpen) {
        setSpeedKmH(0);
        audioEngine.updateRailSpeed(0);
        return;
      }

      // Calculate Target Speed
      setSpeedKmH((prevSpeed) => {
        let baseCruise = 70 + upgrades.engineLevel * 18;
        if (upgrades.aerodynamicCowling) baseCruise += 12;

        // Out of fuel penalty: slows down to emergency coast
        if (fuel <= 0) {
          baseCruise = 12;
        }

        // Boost active
        if (speedBoostDuration > 0) {
          baseCruise = maxSpeedKmH;
          setSpeedBoostDuration((b) => Math.max(0, b - dt));
        }

        // Smooth acceleration / deceleration toward cruise
        const diff = baseCruise - prevSpeed;
        const newSpeed = Math.max(0, prevSpeed + diff * 0.1);

        audioEngine.updateRailSpeed(newSpeed);
        return newSpeed;
      });

      // Fuel consumption
      setFuel((prevFuel) => {
        if (prevFuel <= 0) return 0;
        const baseBurn = 0.04;
        const speedFactor = speedKmH / 100;
        const efficiencyDiscount = 1 - (upgrades.fuelEfficiencyLevel * 0.12);
        const burnRate = baseBurn * speedFactor * efficiencyDiscount * dt;
        return Math.max(0, prevFuel - burnRate);
      });

      // Distance advancement: distance = speed * time
      // speedKmH * (dt / 3600)
      const kmTraveled = (speedKmH / 3600) * dt * 8; // Slight acceleration for fun arcade progression
      setDistanceToNextKm((prevDist) => {
        const nextDist = prevDist - kmTraveled;
        if (nextDist <= 0) {
          // Reached Station!
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
    fuel,
    speedBoostDuration,
    maxSpeedKmH,
    upgrades,
  ]);

  // Trigger Station Arrival
  const triggerStationArrival = useCallback(() => {
    audioEngine.playStationBell();

    // Settle arriving passengers
    const disembarking = passengers.filter(
      (p) => p.destinationStationId === nextStation.id || Math.random() < 0.6
    );

    const comfortMultiplier = 1 + upgrades.comfortRating * 0.25;
    const totalEarned = disembarking.reduce(
      (acc, p) => acc + Math.round((p.farePaid + p.tipPaid) * comfortMultiplier),
      0
    );

    // Generate 2 new passengers
    const newBoarders: Passenger[] = [0, 1].map((idx) => {
      const template = PASSENGER_TEMPLATES[(stationIndex + idx) % PASSENGER_TEMPLATES.length];
      const futureStation = STATIONS[(stationIndex + 2) % STATIONS.length];
      return {
        id: `pass_${Date.now()}_${idx}`,
        name: `${template.role} ${['Valerie', 'Julian', 'Amara', 'Bartholomew'][Math.floor(Math.random() * 4)]}`,
        role: template.role,
        avatar: template.avatar,
        destinationStationId: futureStation.id,
        farePaid: Math.round(40 + Math.random() * 30),
        tipPaid: Math.round(15 + Math.random() * 20),
        dialogue: template.dialogues[Math.floor(Math.random() * template.dialogues.length)],
        luggage: template.luggage,
      };
    });

    setArrivedPassengers(disembarking);
    setBoardingPassengers(newBoarders);
    setArrivalEarnings(totalEarned);
    setCoins((c) => c + totalEarned);

    setIsStationArrivalOpen(true);
  }, [passengers, nextStation, upgrades.comfortRating, stationIndex]);

  // Depart Station & Transition Route
  const handleDepartStation = () => {
    setIsStationArrivalOpen(false);

    // Advance station
    const nextIdx = (stationIndex + 1) % STATIONS.length;
    setStationIndex(nextIdx);

    const upcomingStation = STATIONS[(nextIdx + 1) % STATIONS.length];
    setDistanceToNextKm(upcomingStation.distanceKm);

    // Update active passengers
    const remaining = passengers.filter(
      (p) => !arrivedPassengers.some((arr) => arr.id === p.id)
    );
    setPassengers([...remaining, ...boardingPassengers]);

    // Transition scenic biome to match upcoming landscape
    setCurrentBiome(STATIONS[nextIdx].biome);

    // Initial departure speed
    setSpeedKmH(45);
    audioEngine.startRailLoop(45);
  };

  // Complete a conductor challenge
  const handleCompleteChallenge = (ch: Challenge, bonusDistanceKm: number) => {
    setConductorPoints((pts) => pts + ch.rewardPoints);
    setCoins((c) => c + ch.rewardCoins);

    // Immediate forward station jump & high speed overdrive
    setDistanceToNextKm((dist) => Math.max(0.2, dist - bonusDistanceKm));
    setSpeedBoostDuration(15); // 15 seconds of max turbo speed!
    setSpeedKmH(maxSpeedKmH);

    // Reward sound
    audioEngine.playWhistle();
  };

  // Steam whistle button click
  const handleWhistleClick = () => {
    audioEngine.playWhistle();
    // Whistling gives a little blast of steam boost
    setSpeedKmH((s) => Math.min(maxSpeedKmH, s + 10));
  };

  // Refuel boiler
  const handleRefuel = () => {
    if (fuel >= maxFuel) return;
    const cost = 15;
    if (coins >= cost) {
      setCoins((c) => c - cost);
      setFuel(maxFuel);
      audioEngine.playCoin();
    }
  };

  // Purchase upgrade in shop
  const handleBuyUpgrade = (
    type: 'engine' | 'fuelEfficiency' | 'comfort' | 'wipers' | 'aerodynamics',
    cost: number
  ) => {
    if (coins < cost) return;
    setCoins((c) => c - cost);

    setUpgrades((prev) => {
      if (type === 'engine') return { ...prev, engineLevel: prev.engineLevel + 1 };
      if (type === 'fuelEfficiency') return { ...prev, fuelEfficiencyLevel: prev.fuelEfficiencyLevel + 1 };
      if (type === 'comfort') return { ...prev, comfortRating: prev.comfortRating + 1 };
      if (type === 'wipers') return { ...prev, wiperSystem: true };
      if (type === 'aerodynamics') return { ...prev, aerodynamicCowling: true };
      return prev;
    });
  };

  // Update compartment customizations
  const handleUpdateCustomization = (custom: Partial<CompartmentCustomization>) => {
    setCustomization((prev) => ({ ...prev, ...custom }));
  };

  // Take a sip of tea
  const handleTakeSip = () => {
    setSipFeedback(true);
    setTimeout(() => setSipFeedback(false), 2200);
  };

  // Landmark alert handler
  const handleLandmarkSpotted = (landmarkName: string) => {
    setLandmarkToast(landmarkName);
    setTimeout(() => setLandmarkToast(null), 6000);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none font-sans">
      
      {/* 1. SCENIC MOVING TRAIN WINDOW BACKGROUND (PARALLAX + WEATHER + BIOMES) */}
      <TrainWindowCanvas
        speedKmH={speedKmH}
        biome={currentBiome}
        weather={weather}
        timeOfDay={timeOfDay}
        wipersActive={wipersActive || upgrades.wiperSystem}
        onLandmarkSpotted={handleLandmarkSpotted}
      />

      {/* 2. THE LUXURY TRAIN COMPARTMENT INTERIOR FRAME & CONTROLS */}
      <CompartmentInterior
        customization={customization}
        speedKmH={speedKmH}
        maxSpeedKmH={maxSpeedKmH}
        fuel={fuel}
        maxFuel={maxFuel}
        currentStation={currentStation}
        nextStation={nextStation}
        distanceToNextKm={distanceToNextKm}
        coins={coins}
        conductorPoints={conductorPoints}
        passengersCount={passengers.length}
        weather={weather}
        timeOfDay={timeOfDay}
        onWhistleClick={handleWhistleClick}
        onOpenChallenges={() => setIsChallengesOpen(true)}
        onOpenDepotUpgrades={() => setIsUpgradeShopOpen(true)}
        onOpenWeatherControls={() => setIsWeatherControlsOpen(true)}
        onRefuel={handleRefuel}
        onToggleCurtains={() =>
          setCustomization((prev) => ({ ...prev, curtainsOpen: !prev.curtainsOpen }))
        }
        onToggleWipers={() => setWipersActive(!wipersActive)}
        wipersActive={wipersActive || upgrades.wiperSystem}
        onTakeSip={handleTakeSip}
        sipFeedback={sipFeedback}
      />

      {/* 3. LANDMARK SPOTTED NOTIFICATION TOAST */}
      {landmarkToast && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-40 bg-amber-950/90 border-2 border-amber-400 text-amber-200 px-4 py-2 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.5)] flex items-center gap-2.5 animate-bounce">
          <span className="text-lg">🔭</span>
          <div className="text-xs font-serif-vintage">
            <strong className="text-amber-100 font-bold">Landmark Outside: </strong>
            {landmarkToast}!
          </div>
          <button
            onClick={() => setIsChallengesOpen(true)}
            className="text-[10px] bg-amber-500 text-stone-950 px-2 py-0.5 rounded font-bold uppercase hover:bg-amber-400"
          >
            Snap Photo
          </button>
        </div>
      )}

      {/* 4. MODALS */}

      {/* Conductor Challenges Clipboard Modal */}
      <ConductorChallengesModal
        isOpen={isChallengesOpen}
        onClose={() => setIsChallengesOpen(false)}
        onCompleteChallenge={handleCompleteChallenge}
        currentStationName={currentStation.name}
        nextStationName={nextStation.name}
      />

      {/* Station Arrival & Passenger Boarding Modal */}
      <StationArrivalModal
        isOpen={isStationArrivalOpen}
        station={nextStation}
        nextStation={STATIONS[(stationIndex + 2) % STATIONS.length]}
        disembarkingPassengers={arrivedPassengers}
        newPassengers={boardingPassengers}
        totalEarnings={arrivalEarnings}
        fuel={fuel}
        maxFuel={maxFuel}
        onRefuel={handleRefuel}
        onDepartStation={handleDepartStation}
      />

      {/* Depot Upgrades & Interior Customization Modal */}
      <UpgradeShopModal
        isOpen={isUpgradeShopOpen}
        onClose={() => setIsUpgradeShopOpen(false)}
        coins={coins}
        upgrades={upgrades}
        customization={customization}
        onBuyUpgrade={handleBuyUpgrade}
        onUpdateCustomization={handleUpdateCustomization}
      />

      {/* Weather & Scenic Atmosphere Controls Modal */}
      <WeatherControls
        isOpen={isWeatherControlsOpen}
        onClose={() => setIsWeatherControlsOpen(false)}
        weather={weather}
        timeOfDay={timeOfDay}
        biome={currentBiome}
        realTimeSync={realTimeSync}
        onSetWeather={setWeather}
        onSetTimeOfDay={setTimeOfDay}
        onSetBiome={setCurrentBiome}
        onToggleRealTimeSync={() => setRealTimeSync(!realTimeSync)}
      />

    </div>
  );
}
