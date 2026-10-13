export type BiomeType = 
  | 'alpine_mountains' 
  | 'autumn_valley' 
  | 'emerald_hills' 
  | 'desert_canyons' 
  | 'ocean_coast' 
  | 'cyber_metropolis';

export type WeatherType = 
  | 'clear_day' 
  | 'sunset' 
  | 'rain' 
  | 'storm' 
  | 'snow' 
  | 'fog' 
  | 'night_aurora';

export type TimeOfDay = 'morning' | 'afternoon' | 'sunset' | 'twilight' | 'night';

export interface Station {
  id: string;
  name: string;
  region: string;
  distanceKm: number; // Distance from previous station
  landmark: string;
  biome: BiomeType;
  passengerNames: string[];
  description: string;
  elevationMeters: number;
}

export interface Passenger {
  id: string;
  name: string;
  role: string;
  avatar: string;
  destinationStationId: string;
  farePaid: number;
  tipPaid: number;
  dialogue: string;
  luggage: string;
}

export interface CompartmentCustomization {
  woodFinish: 'vintage_mahogany' | 'nordic_birch' | 'midnight_walnut' | 'art_deco_rosewood';
  upholstery: 'crimson_velvet' | 'forest_tweed' | 'royal_navy' | 'golden_brocade';
  windowFrame: 'polished_brass' | 'dark_walnut' | 'riveted_steel' | 'gilded_pullman';
  curtainColor: 'burgundy' | 'emerald' | 'sapphire' | 'amber';
  tableTrinket: 'brass_lamp' | 'earl_grey' | 'pocketwatch_compass' | 'mini_bonsai';
  ambientLightWarmth: number; // 0 to 1
  curtainsOpen: boolean;
}

export interface TrainUpgrades {
  engineLevel: number;        // increases max speed
  fuelEfficiencyLevel: number; // lowers fuel burn rate
  comfortRating: number;      // increases passenger tips and ticket payouts
  wiperSystem: boolean;       // automated wipers on rain
  aerodynamicCowling: boolean;// extra boost
}

export type ChallengeType = 
  | 'track_switch' 
  | 'boiler_rhythm' 
  | 'ticket_check' 
  | 'telegraph_morse' 
  | 'vista_snapshot';

export interface Challenge {
  id: string;
  type: ChallengeType;
  title: string;
  description: string;
  rewardPoints: number;
  rewardCoins: number;
  rewardSpeedKmBoost: number;
  difficulty: 'Easy' | 'Moderate' | 'Hard';
}

export interface GameStats {
  totalDistanceTraveledKm: number;
  passengersTransported: number;
  challengesCompleted: number;
  stationsVisited: number;
  fuelConsumed: number;
}
