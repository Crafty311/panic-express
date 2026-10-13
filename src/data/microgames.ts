import { Station, Passenger } from '../types/game';

export type MicrogameCategory = 
  | 'train_tasks'
  | 'arcade_reflex'
  | 'puzzle_logic'
  | 'word_board'
  | 'rhythm_aim';

export interface MicrogameInstance {
  id: string;
  category: MicrogameCategory;
  title: string;
  instruction: string;
  icon: string;
  durationSec: number;
  params: {
    variantIndex: number;
    subType: string;
    targetValue?: number;
    targetRange?: [number, number];
    speedMultiplier?: number;
    requiredTaps?: number;
    hazardLabel?: string;
    itemEmoji?: string;
    targetColor?: 'red' | 'blue' | 'green' | 'amber';
    options?: string[];
    correctOption?: string;
  };
}

// Full comprehensive catalog of 60 unique minigames across 5 categories
export function getAllMicrogameDefinitions(): MicrogameInstance[] {
  const games: MicrogameInstance[] = [];

  // 1. Train-Themed Tasks & Travel Quirks (12 games)
  const trainTasks = [
    { title: 'Junction Alignment', inst: 'SWITCH TO GREEN TRACK!', icon: '🔀', sub: 'Alpha Fork', color: 'green' as const },
    { title: 'Transit Pass Stamp', inst: 'STAMP CENTRAL TICKET!', icon: '🎟️', sub: 'Central Terminal' },
    { title: 'Low Clearance Warning', inst: 'DUCK UNDER VIADUCT!', icon: '⚠️', sub: 'Alpine Viaduct', hazard: 'LOW VIADUCT ARCH' },
    { title: 'Beverage Stabilizer', inst: 'KEEP ESPRESSO LEVEL!', icon: '☕', sub: 'Hot Espresso', emoji: '☕' },
    { title: 'Windshield Cleanser', inst: 'CLEAR RAIN SPRAY!', icon: '🧽', sub: 'Rain Spray', count: 3 },
    { title: 'Reflex Cargo Catch', inst: 'CATCH CRISPY TOAST!', icon: '🍞', sub: 'Crispy Toast', emoji: '🍞' },
    { title: 'Station Passenger Wake', inst: 'WAKE TIRED SCHOLAR!', icon: '⏰', sub: 'Tired Scholar', taps: 5 },
    { title: 'Boiler Furnace Stoking', inst: 'FEED ANTHRACITE COAL!', icon: '🔥', sub: 'Anthracite Coal', emoji: '🪨' },
    { title: 'Emergency Brake Pull', inst: 'PULL BRAKE LEVER!', icon: '🛑', sub: 'Brake Release', taps: 4 },
    { title: 'Steam Whistle Blow', inst: 'PULL STEAM CORD!', icon: '📢', sub: 'Signal Whistle', taps: 3 },
    { title: 'Luggage Rack Sort', inst: 'ORGANIZE TRUNKS!', icon: '🧳', sub: 'Leather Trunks', count: 4 },
    { title: 'Conductor Badge Polish', inst: 'POLISH GOLD STAR!', icon: '✨', sub: 'Brass Star', taps: 6 },
  ];

  trainTasks.forEach((t, i) => {
    games.push({
      id: `train_task_${i}`,
      category: 'train_tasks',
      title: t.title,
      instruction: t.inst,
      icon: t.icon,
      durationSec: 4.5,
      params: {
        variantIndex: i,
        subType: t.sub,
        targetColor: t.color || 'green',
        targetRange: [35, 65],
        hazardLabel: t.hazard || 'LOW CLEARANCE',
        itemEmoji: t.emoji || '📦',
        targetValue: t.count || 3,
        requiredTaps: t.taps || 5,
      },
    });
  });

  // 2. Classic Arcade, Reaction & Timing Challenges (12 games)
  const arcadeReflex = [
    { title: 'Stopwatch Precision', inst: 'STOP EXACTLY ON 3.0S!', icon: '⏱️', sub: 'Chrono Test' },
    { title: 'Wire Cut Challenge', inst: 'CUT THE BLUE WIRE!', icon: '✂️', sub: 'Circuit Disarm' },
    { title: 'Coin Flip Catch', inst: 'CATCH GOLDEN COIN!', icon: '🪙', sub: 'Toss Reflex' },
    { title: 'Laser Barrier Dodge', inst: 'DODGE THE LASER!', icon: '⚡', sub: 'Security Grid' },
    { title: 'Balloon Pop Rush', inst: 'POP 3 RED BALLOONS!', icon: '🎈', sub: 'Balloon Burst', count: 3 },
    { title: 'Target Tap Speed', inst: 'HIT BULLSEYE TAP!', icon: '🎯', sub: 'Precision Target' },
    { title: 'Speed Tap Frenzy', inst: 'TAP 10 TIMES FAST!', icon: '💨', sub: 'Velocity Rush', taps: 10 },
    { title: 'Quick Draw Duel', inst: 'DRAW WHEN READY!', icon: '🤠', sub: 'Western Duel' },
    { title: 'Button Mash Reactor', inst: 'MASH TO POWER UP!', icon: '⚡', sub: 'Dynamo Generator', taps: 12 },
    { title: 'Meteor Dodger', inst: 'EVADE FALLING DEBRIS!', icon: '☄️', sub: 'Asteroid Belt' },
    { title: 'Shadow Reflex', inst: 'CATCH THE PHANTOM!', icon: '👥', sub: 'Specter Chase' },
    { title: 'Chrono Trigger', inst: 'TRIGGER AT ZERO!', icon: '⌛', sub: 'Time Sync' },
  ];

  arcadeReflex.forEach((t, i) => {
    games.push({
      id: `arcade_reflex_${i}`,
      category: 'arcade_reflex',
      title: t.title,
      instruction: t.inst,
      icon: t.icon,
      durationSec: 4.0,
      params: {
        variantIndex: i,
        subType: t.sub,
        requiredTaps: t.taps || 8,
        targetValue: t.count || 3,
      },
    });
  });

  // 3. Puzzle, Memory, Pattern & Logic Games (12 games)
  const puzzleLogic = [
    { title: 'Circuit Connection', inst: 'CONNECT THE TERMINALS!', icon: '🔌', sub: 'Power Grid' },
    { title: 'Vault Safe Combo', inst: 'CRACK 3-DIGIT LOCK!', icon: '🔐', sub: 'Secure Vault' },
    { title: 'Memory Sequence', inst: 'REPEAT THE FLASH!', icon: '💡', sub: 'Pattern Memory' },
    { title: 'Color Match Grid', inst: 'MATCH 3 AMBER TILES!', icon: '🟨', sub: 'Color Matrix' },
    { title: 'Pipe Flow Waterway', inst: 'ALIGN THE WATER PIPE!', icon: '🚰', sub: 'Hydraulic Flow' },
    { title: 'Gear Alignment', inst: 'MESH THE BRASS GEARS!', icon: '⚙️', sub: 'Clockwork Gear' },
    { title: 'Light Bulb Circuit', inst: 'SCREW IN LIGHT BULB!', icon: '💡', sub: 'Illumination' },
    { title: 'Slider Tile Puzzle', inst: 'SLIDE TO COMPLETE!', icon: '🧩', sub: 'Mosaic Tile' },
    { title: 'Symbol Cipher Decode', inst: 'DECODE RUNIC SYMBOL!', icon: '🔤', sub: 'Secret Cipher' },
    { title: 'Memory Card Pair', inst: 'MATCH PAIR OF CARDS!', icon: '🃏', sub: 'Memory Match' },
    { title: 'Fuse Box Rewire', inst: 'REPLACE BLOWN FUSE!', icon: '⚡', sub: 'Fuse Panel' },
    { title: 'Compass Rose Navigation', inst: 'ALIGN NORTH POINTER!', icon: '🧭', sub: 'Magnetic Compass' },
  ];

  puzzleLogic.forEach((t, i) => {
    games.push({
      id: `puzzle_logic_${i}`,
      category: 'puzzle_logic',
      title: t.title,
      instruction: t.inst,
      icon: t.icon,
      durationSec: 5.0,
      params: {
        variantIndex: i,
        subType: t.sub,
        requiredTaps: 4,
      },
    });
  });

  // 4. Word, Trivia, Card & Board Classics (12 games)
  const wordBoard = [
    { title: 'Rock Paper Scissors', inst: 'BEAT CONDUCTOR HAND!', icon: '✊', sub: 'RPS Duel', options: ['Rock', 'Paper', 'Scissors'], correctOption: 'Paper' },
    { title: 'Train Route Trivia', inst: 'CAPITAL OF MEADOWS?', icon: '🧠', sub: 'Geography Quiz', options: ['Meadowbrook', 'Vienna', 'London'], correctOption: 'Meadowbrook' },
    { title: 'Anagram Unscramble', inst: 'UNSCRAMBLE "TRAIN"!', icon: '🔤', sub: 'Word Logic', options: ['T-R-A-I-N', 'T-I-R-A-N', 'N-I-A-R-T'], correctOption: 'T-R-A-I-N' },
    { title: 'Domino Pair Match', inst: 'MATCH 6-6 DOMINO!', icon: '🁣', sub: 'Domino Classic' },
    { title: 'Chess Checkmate Move', inst: 'QUEEN TO E8 MATE!', icon: '♟️', sub: 'Chess Puzzle' },
    { title: 'Checker Jump Master', inst: 'DOUBLE JUMP CROWN!', icon: '🔴', sub: 'Checker Classic' },
    { title: 'Lucky Dice Roll', inst: 'ROLL A 6 TO WIN!', icon: '🎲', sub: 'Dice Probability' },
    { title: 'Vocabulary Guess', inst: 'GUESS LOFI RHYTHM!', icon: '📖', sub: 'Lexicon Test' },
    { title: 'Blackjack 21', inst: 'STAND AT 21!', icon: '🃏', sub: 'Card 21' },
    { title: 'Meridian Quiz', inst: 'WHICH WAY IS WEST?', icon: '🗺️', sub: 'Navigation Trivia' },
    { title: 'Telegraph Morse Decode', inst: 'TAP SOS IN MORSE!', icon: '📟', sub: 'Morse Code' },
    { title: 'Zodiac Constellation', inst: 'FIND URSA MAJOR!', icon: '✨', sub: 'Starlight Chart' },
  ];

  wordBoard.forEach((t, i) => {
    games.push({
      id: `word_board_${i}`,
      category: 'word_board',
      title: t.title,
      instruction: t.inst,
      icon: t.icon,
      durationSec: 5.0,
      params: {
        variantIndex: i,
        subType: t.sub,
        options: t.options,
        correctOption: t.correctOption,
      },
    });
  });

  // 5. Rhythm, Quick-Draw & Aiming Mini-Contests (12 games)
  const rhythmAim = [
    { title: 'Rhythm Beat Tap', inst: 'TAP ON THE BEAT!', icon: '🎵', sub: 'Chillhop Groove', taps: 6 },
    { title: 'Bullseye Target Shoot', inst: 'HIT THE BULLSEYE!', icon: '🎯', sub: 'Marksmanship' },
    { title: 'Bouncing Ball Catch', inst: 'CATCH BOUNCING ORB!', icon: '⚽', sub: 'Physics Arc' },
    { title: 'Acoustic Guitar Strum', inst: 'STRUM CHORD G7!', icon: '🎸', sub: 'Jazz Strum' },
    { title: 'Cymbal Crash Sync', inst: 'CRASH ON BEAT 4!', icon: '🥁', sub: 'Drummer Sync' },
    { title: 'Arrow Wind Aim', inst: 'AIM AGAINST WIND!', icon: '🏹', sub: 'Archery Range' },
    { title: 'Pendulum Timing', inst: 'STOP SWING AT CENTER!', icon: '🕰️', sub: 'Pendulum Beat' },
    { title: 'Bubble Pop Arcade', inst: 'POP 5 FLOATING BUBBLES!', icon: '🫧', sub: 'Bubble Float', count: 5 },
    { title: 'Carnival Ring Toss', inst: 'TOSS RING ON PEG!', icon: '🎪', sub: 'Carnival Game' },
    { title: 'Hoops Slam Dunk', inst: 'SWISH BASKETBALL!', icon: '🏀', sub: 'Slam Dunk' },
    { title: 'Metronome Synchronizer', inst: 'SYNC WITH 80 BPM!', icon: '⏲️', sub: 'Tempo Sync' },
    { title: 'Chime Bell Harmony', inst: 'RING BRASS CHIME!', icon: '🔔', sub: 'Harmonic Bell' },
  ];

  rhythmAim.forEach((t, i) => {
    games.push({
      id: `rhythm_aim_${i}`,
      category: 'rhythm_aim',
      title: t.title,
      instruction: t.inst,
      icon: t.icon,
      durationSec: 4.5,
      params: {
        variantIndex: i,
        subType: t.sub,
        requiredTaps: t.taps || 6,
        targetValue: t.count || 5,
      },
    });
  });

  return games;
}

export function generateProceduralMicrogame(roundNumber: number): MicrogameInstance {
  const all = getAllMicrogameDefinitions();
  const randomIndex = Math.floor(Math.random() * all.length);
  const base = all[randomIndex];
  // return with a unique id
  return {
    ...base,
    id: `${base.id}_${Date.now()}_${Math.random()}`,
    durationSec: Math.max(3.0, 5.0 - Math.min(1.8, roundNumber * 0.08)),
  };
}

export const MODERN_STATIONS: Station[] = [
  {
    id: 'meadowbrook_junction',
    name: 'Meadowbrook Junction',
    distanceKm: 20,
    landmark: 'Sunlit Windmills & Meadow Viaduct',
    rewardCoins: 80,
    description: 'Serene pastures of golden clover, peaceful wind turbines, and morning sunlight reflecting across clear streams.',
    biome: 'meadow_plain',
    stationVariant: 'meadowbrook_whistlestop',
  },
  {
    id: 'emerald_gorge_viaduct',
    name: 'Emerald Gorge Viaduct',
    distanceKm: 24,
    landmark: 'Arched Roman Viaduct & Rushing Waters',
    rewardCoins: 95,
    description: 'A breathtaking high mountain gorge spanned by a monumental stone arch railway viaduct above turquoise waters.',
    biome: 'river_viaduct',
    stationVariant: 'riverside_brick_depot',
  },
  {
    id: 'pineridge_summit',
    name: 'Pineridge Summit',
    distanceKm: 26,
    landmark: 'Snowy Matterhorn Peaks & Timber Chalets',
    rewardCoins: 110,
    description: 'Crisp alpine mountain air, suspension bridges over deep valleys, and evergreen forests dusted in fresh powder.',
    biome: 'alpine_foothills',
    stationVariant: 'alpine_timber_chalet',
  },
  {
    id: 'saint_alden_village',
    name: 'St. Alden Old Village',
    distanceKm: 22,
    landmark: 'Gothic Spire, Half-Timbered Inns & Watermill',
    rewardCoins: 125,
    description: 'A postcard-perfect historic settlement with cobblestone lanes, working watermills, and smoking stone chimneys.',
    biome: 'heritage_village',
    stationVariant: 'cobblestone_village_station',
  },
  {
    id: 'golden_cove_pier',
    name: 'Golden Cove Pier',
    distanceKm: 25,
    landmark: 'Coastal Sea Cliffs & White Lighthouse',
    rewardCoins: 135,
    description: 'Azure ocean waves crashing against granite sea cliffs, vintage lighthouses, and sailboats gliding on the horizon.',
    biome: 'lakeside_harbor',
    stationVariant: 'coastal_harbor_pier',
  },
  {
    id: 'valkyrie_crag_fortress',
    name: 'Highland Crag Fortress',
    distanceKm: 28,
    landmark: 'Cliffside Castle Ruins & Stone Aqueduct',
    rewardCoins: 150,
    description: 'Centuries-old fortress battlements perched atop jagged limestone cliffs alongside a historic mountain aqueduct.',
    biome: 'ancient_castle_ruins',
    stationVariant: 'highland_castle_junction',
  },
  {
    id: 'maple_valley_gorge',
    name: 'Maple Valley Orchard',
    distanceKm: 24,
    landmark: 'Autumn Amber Forest & Rustic Apple Barns',
    rewardCoins: 165,
    description: 'Fiery crimson and golden birch canopies arching over quiet ravines and rustic countryside stone walls.',
    biome: 'autumn_orchard',
    stationVariant: 'autumn_orchard_station',
  },
  {
    id: 'starfall_grand_terminal',
    name: 'Starfall Grand Terminal',
    distanceKm: 30,
    landmark: 'Art-Deco Spire, Suspension Bridge & Starlit Skyline',
    rewardCoins: 190,
    description: 'Modern illuminated glass skyscrapers, gleaming steel transit overpasses, and welcoming grand terminal concourses.',
    biome: 'metropolis_skyline',
    stationVariant: 'grand_victorian_terminal',
  },
];

export const COZY_PASSENGERS: Passenger[] = [
  { id: 'pass_1', name: 'Dr. Evelyn Ward', role: 'Astronomer', avatar: '🔭', quirk: 'Tracking the constellations through the panorama glass.' },
  { id: 'pass_2', name: 'Julian Vance', role: 'Novel Essayist', avatar: '🖋️', quirk: 'Penning chapters while listening to the chillhop rhythm.' },
  { id: 'pass_3', name: 'Isla Sterling', role: 'Marine Botanist', avatar: '🌿', quirk: 'Cataloging rare sea moss collected at the coastal pier.' },
  { id: 'pass_4', name: 'Marcus Thorne', role: 'Horologist', avatar: '⏱️', quirk: 'Calibrating tourbillon pocket watches with the train speed.' },
  { id: 'pass_5', name: 'Claire Dubois', role: 'Concert Cellist', avatar: '🎻', quirk: 'Composing gentle melodies inspired by the mountain pass.' },
];
