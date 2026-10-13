import React from 'react';
import { WeatherType, TimeOfDay, BiomeType } from '../types/game';
import { 
  X, 
  Sun, 
  Sunset, 
  CloudRain, 
  CloudLightning, 
  Snowflake, 
  CloudFog, 
  Moon, 
  Clock, 
  Compass
} from 'lucide-react';
import { audioEngine } from '../services/audioService';

interface WeatherControlsProps {
  isOpen: boolean;
  onClose: () => void;
  weather: WeatherType;
  timeOfDay: TimeOfDay;
  biome: BiomeType;
  realTimeSync: boolean;
  onSetWeather: (w: WeatherType) => void;
  onSetTimeOfDay: (t: TimeOfDay) => void;
  onSetBiome: (b: BiomeType) => void;
  onToggleRealTimeSync: () => void;
}

export const WeatherControls: React.FC<WeatherControlsProps> = ({
  isOpen,
  onClose,
  weather,
  timeOfDay,
  biome,
  realTimeSync,
  onSetWeather,
  onSetTimeOfDay,
  onSetBiome,
  onToggleRealTimeSync,
}) => {
  if (!isOpen) return null;

  const weatherOptions: { id: WeatherType; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'clear_day', label: 'Clear Blue Sky', icon: <Sun className="w-4 h-4 text-amber-400" />, desc: 'Bright sunlight and crisp blue horizons' },
    { id: 'sunset', label: 'Golden Sunset', icon: <Sunset className="w-4 h-4 text-orange-400" />, desc: 'Amber and vermilion evening skyglow' },
    { id: 'rain', label: 'Gentle Patter Rain', icon: <CloudRain className="w-4 h-4 text-blue-400" />, desc: 'Relaxing rain droplets streaking along window glass' },
    { id: 'storm', label: 'Thunder & Lightning', icon: <CloudLightning className="w-4 h-4 text-purple-400" />, desc: 'Dramatic storm clouds with lightning flashes' },
    { id: 'snow', label: 'Alpine Snowfall', icon: <Snowflake className="w-4 h-4 text-cyan-300" />, desc: 'Whirling flakes with window frost vignettes' },
    { id: 'fog', label: 'Atmospheric Fog', icon: <CloudFog className="w-4 h-4 text-stone-300" />, desc: 'Mystical mountain mist shrouding the landscape' },
    { id: 'night_aurora', label: 'Starlight & Aurora', icon: <Moon className="w-4 h-4 text-emerald-400" />, desc: 'Emerald aurora borealis dancing across starry cosmos' },
  ];

  const timeOptions: { id: TimeOfDay; label: string }[] = [
    { id: 'morning', label: 'Dawn / Morning' },
    { id: 'afternoon', label: 'High Noon' },
    { id: 'sunset', label: 'Golden Hour' },
    { id: 'twilight', label: 'Twilight Dusk' },
    { id: 'night', label: 'Deep Midnight' },
  ];

  const biomeOptions: { id: BiomeType; label: string; emoji: string; desc: string }[] = [
    { id: 'alpine_mountains', label: 'Alpine Mountain Pass', emoji: '🏔️', desc: 'Snow-capped peaks, glacier bridges, and pine forests' },
    { id: 'autumn_valley', label: 'Golden Autumn Valley', emoji: '🍂', desc: 'Rolling amber hills, turning windmills, and birch groves' },
    { id: 'emerald_hills', label: 'Loch Ness Meadows', emoji: '🌿', desc: 'Lush green moors, highland lochs, and stone viaducts' },
    { id: 'desert_canyons', label: 'Red Mesa Canyon', emoji: '🏜️', desc: 'Terracotta bluffs, canyon spires, and saguaro cacti' },
    { id: 'ocean_coast', label: 'Cap St. Claire Pier', emoji: '🌊', desc: 'Sea cliffs, breaking waves, sailboats, and lighthouses' },
    { id: 'cyber_metropolis', label: 'Aethelgard Grand Terminal', emoji: '🏙️', desc: 'Illuminated skyscrapers, night neon, and suspension rails' },
  ];

  const handleSelectWeather = (w: WeatherType) => {
    onSetWeather(w);
    if (w === 'rain' || w === 'storm') {
      audioEngine.updateRainAmbience(true, w === 'storm' ? 0.9 : 0.5);
    } else {
      audioEngine.updateRainAmbience(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#251711] via-[#1a0e08] to-[#0c0604] border-2 border-amber-500/70 rounded-xl shadow-[0_0_40px_rgba(245,158,11,0.25)] overflow-hidden text-stone-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-950 via-stone-900 to-amber-950 border-b border-amber-600/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌦️</span>
            <div>
              <h2 className="font-serif-vintage text-lg font-bold text-amber-200 tracking-wider">
                Atmosphere & Scenic Biome Controls
              </h2>
              <p className="text-xs text-amber-400/80">
                Synchronize real-time weather and transition between picturesque landscape vistas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-stone-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          
          {/* Real-time System Sync toggle */}
          <div className="p-3.5 rounded-lg bg-black/50 border border-amber-800/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-400" />
              <div>
                <span className="font-serif-vintage text-xs font-bold text-amber-200">
                  Real-Time Clock & Weather Sync
                </span>
                <span className="block text-[11px] text-stone-400">
                  Sync compartment daylight and sky automatically to your actual local clock time
                </span>
              </div>
            </div>
            <button
              onClick={onToggleRealTimeSync}
              className={`px-3 py-1.5 rounded text-xs font-bold border transition-all ${
                realTimeSync
                  ? 'bg-emerald-600 border-emerald-400 text-white'
                  : 'bg-stone-800 border-stone-600 text-stone-300 hover:bg-stone-700'
              }`}
            >
              {realTimeSync ? 'Enabled (Live Sync) ✓' : 'Manual Mode'}
            </button>
          </div>

          {/* Time of Day selection */}
          {!realTimeSync && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-300 mb-2">
                Time of Day & Sun Position
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {timeOptions.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onSetTimeOfDay(t.id)}
                    className={`py-2 px-1 text-center rounded text-xs border transition-all ${
                      timeOfDay === t.id
                        ? 'bg-amber-600 text-stone-950 font-bold border-amber-300'
                        : 'bg-black/40 border-stone-800 text-stone-300 hover:border-amber-700'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Weather Patterns */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-300 mb-2">
              Weather Phenomenon on Glass & Outside
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {weatherOptions.map((w) => (
                <button
                  key={w.id}
                  onClick={() => handleSelectWeather(w.id)}
                  className={`p-2.5 rounded-lg text-left border transition-all flex items-start gap-2.5 ${
                    weather === w.id
                      ? 'bg-amber-900/60 border-amber-400 text-amber-100 shadow'
                      : 'bg-black/40 border-stone-800 text-stone-300 hover:border-amber-800'
                  }`}
                >
                  <div className="mt-0.5">{w.icon}</div>
                  <div>
                    <div className="text-xs font-bold">{w.label}</div>
                    <div className="text-[10px] text-stone-400">{w.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Scenic Biome Landscapes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-300 mb-2 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              Scenic Landscape Route Transitions
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {biomeOptions.map((b) => (
                <button
                  key={b.id}
                  onClick={() => onSetBiome(b.id)}
                  className={`p-2.5 rounded-lg text-left border transition-all flex items-start gap-2.5 ${
                    biome === b.id
                      ? 'bg-amber-900/60 border-amber-400 text-amber-100 shadow'
                      : 'bg-black/40 border-stone-800 text-stone-300 hover:border-amber-800'
                  }`}
                >
                  <span className="text-xl">{b.emoji}</span>
                  <div>
                    <div className="text-xs font-bold">{b.label}</div>
                    <div className="text-[10px] text-stone-400">{b.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
