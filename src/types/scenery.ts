export type BiomeType = 
  | 'meadow_plain'
  | 'river_viaduct'
  | 'alpine_foothills'
  | 'heritage_village'
  | 'metropolis_skyline'
  | 'ancient_castle_ruins'
  | 'lakeside_harbor'
  | 'autumn_orchard';

export type StationVariant =
  | 'grand_victorian_terminal'
  | 'alpine_timber_chalet'
  | 'coastal_harbor_pier'
  | 'modern_metro_spire'
  | 'meadowbrook_whistlestop'
  | 'riverside_brick_depot'
  | 'highland_castle_junction'
  | 'starlight_observatory_halt'
  | 'autumn_orchard_station'
  | 'cobblestone_village_station';

export interface BiomeConfig {
  id: BiomeType;
  name: string;
  tagline: string;
  skyDay: [string, string, string];
  skyNight: [string, string, string];
  mountainFarDay: string;
  mountainFarNight: string;
  hillsMidDay: string;
  hillsMidNight: string;
  foregroundDay: string;
  foregroundNight: string;
  accentDay: string;
  accentNight: string;
}

export const BIOME_CONFIGS: Record<BiomeType, BiomeConfig> = {
  meadow_plain: {
    id: 'meadow_plain',
    name: 'Meadowbrook Plains',
    tagline: 'Rolling pastures, wildflowers & historic windmills',
    skyDay: ['#38bdf8', '#7dd3fc', '#f0fdf4'],
    skyNight: ['#0f172a', '#1e1b4b', '#2e1065'],
    mountainFarDay: '#94a3b8',
    mountainFarNight: '#1e293b',
    hillsMidDay: '#86efac',
    hillsMidNight: '#064e3b',
    foregroundDay: '#22c55e',
    foregroundNight: '#022c22',
    accentDay: '#f59e0b',
    accentNight: '#fbbf24',
  },
  river_viaduct: {
    id: 'river_viaduct',
    name: 'Emerald River Viaduct',
    tagline: 'Deep rocky gorge & grand arched stone viaduct',
    skyDay: ['#0284c7', '#38bdf8', '#e0f2fe'],
    skyNight: ['#0b132b', '#1c2541', '#3a506b'],
    mountainFarDay: '#64748b',
    mountainFarNight: '#1e293b',
    hillsMidDay: '#34d399',
    hillsMidNight: '#065f46',
    foregroundDay: '#059669',
    foregroundNight: '#022c22',
    accentDay: '#38bdf8',
    accentNight: '#67e8f9',
  },
  alpine_foothills: {
    id: 'alpine_foothills',
    name: 'Alpine Pine Foothills',
    tagline: 'Snow-dusted peaks, evergreen ridges & timber chalets',
    skyDay: ['#60a5fa', '#93c5fd', '#f8fafc'],
    skyNight: ['#030712', '#111827', '#1f2937'],
    mountainFarDay: '#cbd5e1',
    mountainFarNight: '#334155',
    hillsMidDay: '#4ade80',
    hillsMidNight: '#14532d',
    foregroundDay: '#16a34a',
    foregroundNight: '#052e16',
    accentDay: '#f43f5e',
    accentNight: '#fb7185',
  },
  heritage_village: {
    id: 'heritage_village',
    name: 'Heritage Village Route',
    tagline: 'Half-timbered cottages, cathedral spires & watermills',
    skyDay: ['#f59e0b', '#fde68a', '#fefce8'],
    skyNight: ['#1e1b4b', '#312e81', '#4338ca'],
    mountainFarDay: '#a8a29e',
    mountainFarNight: '#292524',
    hillsMidDay: '#a3e635',
    hillsMidNight: '#365314',
    foregroundDay: '#65a30d',
    foregroundNight: '#1a2e05',
    accentDay: '#d97706',
    accentNight: '#f59e0b',
  },
  metropolis_skyline: {
    id: 'metropolis_skyline',
    name: 'Metropolitan Horizon',
    tagline: 'Illuminated skyscrapers, bridges & transit gantries',
    skyDay: ['#64748b', '#94a3b8', '#e2e8f0'],
    skyNight: ['#090d16', '#0f172a', '#1e293b'],
    mountainFarDay: '#475569',
    mountainFarNight: '#0f172a',
    hillsMidDay: '#64748b',
    hillsMidNight: '#1e293b',
    foregroundDay: '#334155',
    foregroundNight: '#020617',
    accentDay: '#f59e0b',
    accentNight: '#38bdf8',
  },
  ancient_castle_ruins: {
    id: 'ancient_castle_ruins',
    name: 'Highland Fortress Valley',
    tagline: 'Cliffside stone aqueducts & ancient medieval towers',
    skyDay: ['#38bdf8', '#bae6fd', '#fdf4ff'],
    skyNight: ['#180828', '#2e1065', '#4c1d95'],
    mountainFarDay: '#78716c',
    mountainFarNight: '#292524',
    hillsMidDay: '#86efac',
    hillsMidNight: '#14532d',
    foregroundDay: '#22c55e',
    foregroundNight: '#052e16',
    accentDay: '#eab308',
    accentNight: '#facc15',
  },
  lakeside_harbor: {
    id: 'lakeside_harbor',
    name: 'Lakeside Harbor & Pier',
    tagline: 'Shimmering mountain lake, white lighthouse & sailboats',
    skyDay: ['#0ea5e9', '#7dd3fc', '#ecfeff'],
    skyNight: ['#082f49', '#0c4a6e', '#164e63'],
    mountainFarDay: '#64748b',
    mountainFarNight: '#1e293b',
    hillsMidDay: '#2dd4bf',
    hillsMidNight: '#115e59',
    foregroundDay: '#0d9488',
    foregroundNight: '#042f2e',
    accentDay: '#f97316',
    accentNight: '#fb923c',
  },
  autumn_orchard: {
    id: 'autumn_orchard',
    name: 'Autumn Orchard Valley',
    tagline: 'Amber maple canopies, stone walls & rustic barns',
    skyDay: ['#f97316', '#fed7aa', '#fff7ed'],
    skyNight: ['#1c1917', '#292524', '#44403c'],
    mountainFarDay: '#a8a29e',
    mountainFarNight: '#1c1917',
    hillsMidDay: '#fb923c',
    hillsMidNight: '#7c2d12',
    foregroundDay: '#ea580c',
    foregroundNight: '#431407',
    accentDay: '#dc2626',
    accentNight: '#ef4444',
  },
};
