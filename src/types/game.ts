export interface Station {
  id: string;
  name: string;
  distanceKm: number;
  landmark: string;
  rewardCoins: number;
  description: string;
}

export interface Passenger {
  id: string;
  name: string;
  role: string;
  avatar: string;
  quirk: string;
}

export interface CompartmentCustomization {
  woodStyle: 'warm_oak' | 'nordic_birch' | 'midnight_walnut' | 'smoked_eucalyptus';
  seatColor: 'emerald_velvet' | 'deep_navy' | 'cognac_leather' | 'charcoal_slate';
  tableTrinket: 'hot_coffee' | 'modern_succulent' | 'brass_chronometer' | 'designer_headphones';
  curtainStyle: 'open' | 'sheer_minimal';
}

export interface TrainUpgrades {
  maxSpeedLevel: number;
  extraHeartUnlocked: boolean;
  bentoBoxLevel: number;
  streamlinedAerodynamics: boolean;
}
