import { Station, Passenger } from '../types/game';

export type MicrogameCategory = 
  | 'track_switch'
  | 'stamp_ticket'
  | 'duck_tunnel'
  | 'balance_coffee'
  | 'wipe_splat'
  | 'catch_item'
  | 'wake_passenger'
  | 'feed_furnace';

export interface MicrogameInstance {
  id: string;
  category: MicrogameCategory;
  title: string;
  instruction: string;
  icon: string;
  durationSec: number;
  params: {
    // Parameter variations
    variantIndex: number;
    subType: string;
    targetValue?: number;
    targetRange?: [number, number];
    speedMultiplier?: number;
    requiredTaps?: number;
    hazardLabel?: string;
    itemEmoji?: string;
    targetColor?: 'red' | 'blue' | 'green' | 'amber';
  };
}

// Procedural generator producing 100+ distinct microgame scenarios!
export function generateProceduralMicrogame(roundNumber: number): MicrogameInstance {
  const categories: MicrogameCategory[] = [
    'track_switch',
    'stamp_ticket',
    'duck_tunnel',
    'balance_coffee',
    'wipe_splat',
    'catch_item',
    'wake_passenger',
    'feed_furnace',
  ];

  const category = categories[Math.floor(Math.random() * categories.length)];
  const variantIndex = Math.floor(Math.random() * 15);
  const baseDuration = Math.max(3.0, 4.8 - Math.min(1.6, roundNumber * 0.08));

  switch (category) {
    case 'track_switch': {
      const switchTypes = [
        { label: 'ALPHA EXPRESS FORK', safe: 'GREEN', target: 'green' as const },
        { label: 'BETA CARGO JUNCTION', safe: 'BLUE', target: 'blue' as const },
        { label: 'NORTHERN MAINLINE', safe: 'AMBER', target: 'amber' as const },
        { label: 'HIGH-SPEED BYPASS', safe: 'RED', target: 'red' as const },
        { label: 'SUMMIT DIVERSION', safe: 'GREEN', target: 'green' as const },
      ];
      const selected = switchTypes[variantIndex % switchTypes.length];
      return {
        id: `switch_${variantIndex}_${Date.now()}`,
        category,
        title: 'Junction Alignment',
        instruction: `SWITCH TO ${selected.safe}!`,
        icon: '🔀',
        durationSec: baseDuration,
        params: {
          variantIndex,
          subType: selected.label,
          targetColor: selected.target,
        },
      };
    }

    case 'stamp_ticket': {
      const destinations = [
        'Central Terminal', 'Meadowbrook', 'Pineridge Summit',
        'Golden Cove Bay', 'Maple Valley', 'Silver River',
        'Starlight Vista', 'Whispering Pines', 'Cap Solitude',
      ];
      const dest = destinations[variantIndex % destinations.length];
      const targetMin = 35 + (variantIndex % 5) * 6;
      return {
        id: `stamp_${variantIndex}_${Date.now()}`,
        category,
        title: 'Transit Pass Stamp',
        instruction: `STAMP FOR ${dest.toUpperCase()}!`,
        icon: '🎟️',
        durationSec: baseDuration + 0.3,
        params: {
          variantIndex,
          subType: dest,
          targetRange: [targetMin, targetMin + 18],
        },
      };
    }

    case 'duck_tunnel': {
      const hazards = [
        'LOW VIADUCT ARCH',
        'ALPINE SNOW CHUTE',
        'MOUNTAIN BORE TUNNEL',
        'LOW SIGNAL CABLE',
        'CANOPY BRANCHES',
        'OLD TIMBER TRESTLE',
      ];
      const hazard = hazards[variantIndex % hazards.length];
      return {
        id: `duck_${variantIndex}_${Date.now()}`,
        category,
        title: 'Low Clearance Warning',
        instruction: `DUCK UNDER ${hazard}!`,
        icon: '⚠️',
        durationSec: baseDuration,
        params: {
          variantIndex,
          subType: hazard,
          hazardLabel: hazard,
        },
      };
    }

    case 'balance_coffee': {
      const drinks = [
        { name: 'HOT ESPRESSO', emoji: '☕' },
        { name: 'EARL GREY TEA', emoji: '🫖' },
        { name: 'HONEY LATTE', emoji: '🥛' },
        { name: 'HERBAL INFUSION', emoji: '🍵' },
        { name: 'HOT CHOCOLATE', emoji: '☕' },
      ];
      const drink = drinks[variantIndex % drinks.length];
      return {
        id: `balance_${variantIndex}_${Date.now()}`,
        category,
        title: 'Beverage Stabilizer',
        instruction: `KEEP ${drink.name} LEVEL!`,
        icon: drink.emoji,
        durationSec: baseDuration + 0.6,
        params: {
          variantIndex,
          subType: drink.name,
          itemEmoji: drink.emoji,
        },
      };
    }

    case 'wipe_splat': {
      const splatTypes = [
        { name: 'RAIN SPRAY', count: 3 },
        { name: 'AUTUMN LEAVES', count: 4 },
        { name: 'MUD SPLATTER', count: 3 },
        { name: 'FROST PATCH', count: 3 },
        { name: 'RIVER MIST', count: 4 },
      ];
      const splat = splatTypes[variantIndex % splatTypes.length];
      return {
        id: `wipe_${variantIndex}_${Date.now()}`,
        category,
        title: 'Windshield Cleanser',
        instruction: `CLEAR THE ${splat.name}!`,
        icon: '🧽',
        durationSec: baseDuration,
        params: {
          variantIndex,
          subType: splat.name,
          targetValue: splat.count,
        },
      };
    }

    case 'catch_item': {
      const items = [
        { name: 'CRISPY TOAST', emoji: '🍞' },
        { name: 'ESCAPED HAMSTER', emoji: '🐹' },
        { name: 'DISPATCH TELEGRAM', emoji: '📜' },
        { name: 'POCKET CHRONOMETER', emoji: '⏱️' },
        { name: 'GOLDEN TICKET', emoji: '🎫' },
      ];
      const item = items[variantIndex % items.length];
      return {
        id: `catch_${variantIndex}_${Date.now()}`,
        category,
        title: 'Reflex Catch',
        instruction: `CATCH THE ${item.name}!`,
        icon: item.emoji,
        durationSec: baseDuration,
        params: {
          variantIndex,
          subType: item.name,
          itemEmoji: item.emoji,
        },
      };
    }

    case 'wake_passenger': {
      const passengerTypes = [
        'TIRED SCHOLAR',
        'SLEEPY BOTANIST',
        'CHIEF ARCHITECT',
        'DREAMING POET',
        'RESTING CONDUCTOR',
      ];
      const passenger = passengerTypes[variantIndex % passengerTypes.length];
      const reqTaps = 4 + (variantIndex % 3);
      return {
        id: `wake_${variantIndex}_${Date.now()}`,
        category,
        title: 'Station Reminder',
        instruction: `WAKE THE ${passenger}!`,
        icon: '⏰',
        durationSec: baseDuration + 0.2,
        params: {
          variantIndex,
          subType: passenger,
          requiredTaps: reqTaps,
        },
      };
    }

    case 'feed_furnace': {
      const fuels = [
        { name: 'ANTHRACITE COAL', emoji: '🪨' },
        { name: 'BIOFUEL BRIQUETTE', emoji: '🪵' },
        { name: 'ENERGY CORE', emoji: '🔋' },
        { name: 'PEAT BLOCK', emoji: '🧱' },
      ];
      const fuel = fuels[variantIndex % fuels.length];
      return {
        id: `furnace_${variantIndex}_${Date.now()}`,
        category,
        title: 'Boiler Stoking',
        instruction: `FEED ${fuel.name}!`,
        icon: '🔥',
        durationSec: baseDuration,
        params: {
          variantIndex,
          subType: fuel.name,
          itemEmoji: fuel.emoji,
        },
      };
    }
  }
}

export const MODERN_STATIONS: Station[] = [
  {
    id: 'meadowbrook_junction',
    name: 'Meadowbrook Junction',
    distanceKm: 24,
    landmark: 'Sunlit Windmills & Meadow Viaduct',
    rewardCoins: 80,
    description: 'Serene pastures of golden wheat, peaceful wind turbines, and morning sunlight reflecting across clear streams.',
  },
  {
    id: 'pineridge_summit',
    name: 'Pineridge Summit',
    distanceKm: 30,
    landmark: 'Snowy Matterhorn Peaks & Glacier Canyon',
    rewardCoins: 110,
    description: 'Crisp alpine mountain air, suspension bridges over deep valleys, and evergreen forests dusted in fresh powder.',
  },
  {
    id: 'golden_cove_pier',
    name: 'Golden Cove Pier',
    distanceKm: 28,
    landmark: 'Coastal Sea Cliffs & White Lighthouse',
    rewardCoins: 130,
    description: 'Azure ocean waves crashing against granite sea cliffs, vintage lighthouses, and sailboats gliding in the horizon.',
  },
  {
    id: 'maple_valley_gorge',
    name: 'Maple Valley Gorge',
    distanceKm: 32,
    landmark: 'Autumn Amber Forest & Stone Viaduct',
    rewardCoins: 150,
    description: 'Fiery crimson and golden birch canopies arching over quiet ravines and rustic countryside stone bridges.',
  },
  {
    id: 'starfall_grand_terminal',
    name: 'Starfall Grand Terminal',
    distanceKm: 36,
    landmark: 'Art-Deco Spire & Starlit Skyline',
    rewardCoins: 180,
    description: 'Modern illuminated glass skyscrapers, gleaming steel transit overpasses, and welcoming grand terminal concourses.',
  },
];

export const COZY_PASSENGERS: Passenger[] = [
  { id: 'pass_1', name: 'Dr. Evelyn Ward', role: 'Astronomer', avatar: '🔭', quirk: 'Tracking the constellations through the panorama glass.' },
  { id: 'pass_2', name: 'Julian Vance', role: 'Novel Essayist', avatar: '🖋️', quirk: 'Penning chapters while listening to the chillhop rhythm.' },
  { id: 'pass_3', name: 'Isla Sterling', role: 'Marine Botanist', avatar: '🌿', quirk: 'Cataloging rare sea moss collected at the coastal pier.' },
  { id: 'pass_4', name: 'Marcus Thorne', role: 'Horologist', avatar: '⏱️', quirk: 'Calibrating tourbillon pocket watches with the train speed.' },
  { id: 'pass_5', name: 'Claire Dubois', role: 'Concert Cellist', avatar: '🎻', quirk: 'Composing gentle melodies inspired by the mountain pass.' },
];
