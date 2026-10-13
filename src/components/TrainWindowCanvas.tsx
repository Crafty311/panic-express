import React, { useEffect, useRef } from 'react';
import { BiomeType, WeatherType, TimeOfDay } from '../types/game';

interface TrainWindowCanvasProps {
  speedKmH: number;
  biome: BiomeType;
  weather: WeatherType;
  timeOfDay: TimeOfDay;
  wipersActive: boolean;
  onLandmarkSpotted?: (landmarkName: string) => void;
}

interface RainDrop {
  x: number;
  y: number;
  length: number;
  speedX: number;
  speedY: number;
  size: number;
  alpha: number;
}

interface GlassDrop {
  x: number;
  y: number;
  radius: number;
  streakLength: number;
  alpha: number;
}

interface Snowflake {
  x: number;
  y: number;
  radius: number;
  speedX: number;
  speedY: number;
  opacity: number;
  wobble: number;
}

interface Landmark {
  x: number;
  y: number;
  type: 'golden_eagle' | 'vintage_train' | 'hot_air_balloon' | 'ancient_castle' | 'lighthouse';
  name: string;
  active: boolean;
}

export const TrainWindowCanvas: React.FC<TrainWindowCanvasProps> = ({
  speedKmH,
  biome,
  weather,
  timeOfDay,
  wipersActive,
  onLandmarkSpotted,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Parallax offsets
  const skyOffsetRef = useRef(0);
  const distantOffsetRef = useRef(0);
  const midgroundOffsetRef = useRef(0);
  const foregroundOffsetRef = useRef(0);
  const telegraphOffsetRef = useRef(0);

  // Rain / Snow / Glass drops state
  const rainDropsRef = useRef<RainDrop[]>([]);
  const glassDropsRef = useRef<GlassDrop[]>([]);
  const snowflakesRef = useRef<Snowflake[]>([]);
  const wiperAngleRef = useRef(0);
  const wiperDirectionRef = useRef(1);

  // Thunder flash state
  const thunderFlashRef = useRef(0);

  // Landmark state
  const currentLandmarkRef = useRef<Landmark | null>(null);
  const landmarkTimerRef = useRef(0);

  // Animation frame
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  // Initialize rain & snow particles
  useEffect(() => {
    const drops: RainDrop[] = [];
    for (let i = 0; i < 220; i++) {
      drops.push({
        x: Math.random() * 1600,
        y: Math.random() * 900,
        length: 15 + Math.random() * 25,
        speedX: -2 - Math.random() * 8,
        speedY: 15 + Math.random() * 20,
        size: 1 + Math.random() * 1.5,
        alpha: 0.3 + Math.random() * 0.4,
      });
    }
    rainDropsRef.current = drops;

    const gDrops: GlassDrop[] = [];
    for (let i = 0; i < 45; i++) {
      gDrops.push({
        x: Math.random() * 1600,
        y: Math.random() * 900,
        radius: 1.5 + Math.random() * 3.5,
        streakLength: Math.random() * 20,
        alpha: 0.4 + Math.random() * 0.4,
      });
    }
    glassDropsRef.current = gDrops;

    const flakes: Snowflake[] = [];
    for (let i = 0; i < 150; i++) {
      flakes.push({
        x: Math.random() * 1600,
        y: Math.random() * 900,
        radius: 1 + Math.random() * 3,
        speedX: -1 - Math.random() * 3,
        speedY: 1 + Math.random() * 2.5,
        opacity: 0.4 + Math.random() * 0.5,
        wobble: Math.random() * Math.PI * 2,
      });
    }
    snowflakesRef.current = flakes;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const render = (now: number) => {
      if (!isRunning) return;
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = now;

      // Dynamic speed scaling (pixels per second)
      const baseSpeed = (speedKmH / 100) * 800; // e.g. 100 km/h = 800 px/s in foreground
      const fgSpeed = baseSpeed * dt;
      const mgSpeed = baseSpeed * 0.35 * dt;
      const bgSpeed = baseSpeed * 0.08 * dt;
      const skySpeed = baseSpeed * 0.015 * dt;

      skyOffsetRef.current = (skyOffsetRef.current + skySpeed) % 4000;
      distantOffsetRef.current = (distantOffsetRef.current + bgSpeed) % 4000;
      midgroundOffsetRef.current = (midgroundOffsetRef.current + mgSpeed) % 4000;
      foregroundOffsetRef.current = (foregroundOffsetRef.current + fgSpeed) % 4000;
      telegraphOffsetRef.current = (telegraphOffsetRef.current + fgSpeed * 0.8) % 4000;

      // Handle canvas resize
      const width = canvas.width;
      const height = canvas.height;

      // Random thunder flash in storms
      if (weather === 'storm') {
        if (thunderFlashRef.current > 0) {
          thunderFlashRef.current -= dt * 3.5;
        } else if (Math.random() < 0.008) {
          thunderFlashRef.current = 1.0;
        }
      } else {
        thunderFlashRef.current = 0;
      }

      // Wiper sweep
      if (wipersActive || weather === 'rain' || weather === 'storm') {
        wiperAngleRef.current += wiperDirectionRef.current * dt * 2.8;
        if (wiperAngleRef.current > 1.1) {
          wiperAngleRef.current = 1.1;
          wiperDirectionRef.current = -1;
        } else if (wiperAngleRef.current < -1.1) {
          wiperAngleRef.current = -1.1;
          wiperDirectionRef.current = 1;
        }
      }

      // Landmark timer & spawn
      landmarkTimerRef.current += dt;
      if (landmarkTimerRef.current > 24) {
        landmarkTimerRef.current = 0;
        if (!currentLandmarkRef.current && Math.random() < 0.75) {
          const landmarkTypes: Array<'golden_eagle' | 'vintage_train' | 'hot_air_balloon' | 'ancient_castle' | 'lighthouse'> = [
            'golden_eagle',
            'vintage_train',
            'hot_air_balloon',
            'ancient_castle',
            'lighthouse',
          ];
          const chosen = landmarkTypes[Math.floor(Math.random() * landmarkTypes.length)];
          const names: Record<string, string> = {
            golden_eagle: 'Imperial Golden Eagle',
            vintage_train: 'Counter-Express Locomotive #402',
            hot_air_balloon: 'Explorer Skygazer Balloon',
            ancient_castle: 'Cragmont Citadel Ruins',
            lighthouse: 'Beacon of Cape Solitude',
          };
          currentLandmarkRef.current = {
            x: width + 100,
            y: chosen === 'golden_eagle' || chosen === 'hot_air_balloon' ? height * 0.28 : height * 0.58,
            type: chosen,
            name: names[chosen],
            active: true,
          };
          if (onLandmarkSpotted) {
            onLandmarkSpotted(names[chosen]);
          }
        }
      }

      // Update landmark position
      if (currentLandmarkRef.current) {
        currentLandmarkRef.current.x -= (mgSpeed + 40 * dt);
        if (currentLandmarkRef.current.x < -200) {
          currentLandmarkRef.current = null;
        }
      }

      // ----------------- DRAWING LAYERS -----------------
      ctx.clearRect(0, 0, width, height);

      // 1. SKY GRADIENT
      drawSky(ctx, width, height, timeOfDay, weather, thunderFlashRef.current);

      // 2. CELESTIAL BODIES (Sun, Moon, Stars, Clouds)
      drawCelestial(ctx, width, height, timeOfDay, weather, skyOffsetRef.current);

      // 3. DISTANT MOUNTAINS / HORIZON
      drawDistantLayer(ctx, width, height, biome, timeOfDay, weather, distantOffsetRef.current);

      // 4. MIDGROUND (Hills, Trees, Buildings, Windmills, Landmarks)
      drawMidgroundLayer(ctx, width, height, biome, timeOfDay, weather, midgroundOffsetRef.current);

      // Draw Landmark if present
      if (currentLandmarkRef.current) {
        drawLandmark(ctx, currentLandmarkRef.current);
      }

      // 5. TELEGRAPH POLES & PASSING WIRES
      drawTelegraphPoles(ctx, width, height, telegraphOffsetRef.current, timeOfDay);

      // 6. FOREGROUND EMBANKMENT & TRACKS
      drawForegroundTrackside(ctx, width, height, biome, foregroundOffsetRef.current, timeOfDay, speedKmH);

      // 7. WEATHER PHENOMENA (Rain, Storm lightning, Snow, Fog)
      if (weather === 'rain' || weather === 'storm') {
        drawRain(ctx, width, height, speedKmH, rainDropsRef.current, dt, weather === 'storm');
      } else if (weather === 'snow') {
        drawSnow(ctx, width, height, speedKmH, snowflakesRef.current, dt);
      } else if (weather === 'fog') {
        drawFog(ctx, width, height);
      }

      // 8. WINDOW GLASS EFFECTS (Droplets, wipe arc, subtle dust & reflections)
      drawWindowGlassEffects(ctx, width, height, weather, wipersActive, wiperAngleRef.current, glassDropsRef.current, dt, speedKmH);

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [speedKmH, biome, weather, timeOfDay, wipersActive, onLandmarkSpotted]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-black select-none pointer-events-auto">
      <canvas
        ref={canvasRef}
        width={1920}
        height={1080}
        className="w-full h-full object-cover"
      />
    </div>
  );
};

// ----------------- HELPER DRAWING FUNCTIONS -----------------

function drawSky(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  timeOfDay: TimeOfDay,
  weather: WeatherType,
  thunderFlash: number
) {
  const grad = ctx.createLinearGradient(0, 0, 0, h * 0.75);

  if (thunderFlash > 0.05) {
    grad.addColorStop(0, `rgba(240, 245, 255, ${0.85 * thunderFlash})`);
    grad.addColorStop(1, `rgba(180, 195, 220, ${0.8 * thunderFlash})`);
  } else if (weather === 'rain' || weather === 'storm') {
    grad.addColorStop(0, '#1e242d');
    grad.addColorStop(0.5, '#2f3945');
    grad.addColorStop(1, '#485563');
  } else if (weather === 'fog') {
    grad.addColorStop(0, '#5a626a');
    grad.addColorStop(0.6, '#868e96');
    grad.addColorStop(1, '#a6adb5');
  } else if (weather === 'snow') {
    grad.addColorStop(0, '#3a4454');
    grad.addColorStop(0.7, '#67758d');
    grad.addColorStop(1, '#8fa0be');
  } else {
    switch (timeOfDay) {
      case 'morning':
        grad.addColorStop(0, '#1c3d5a');
        grad.addColorStop(0.35, '#3b82f6');
        grad.addColorStop(0.7, '#93c5fd');
        grad.addColorStop(1, '#fef08a');
        break;
      case 'afternoon':
        grad.addColorStop(0, '#0284c7');
        grad.addColorStop(0.4, '#38bdf8');
        grad.addColorStop(0.8, '#bae6fd');
        grad.addColorStop(1, '#e0f2fe');
        break;
      case 'sunset':
        grad.addColorStop(0, '#31103f');
        grad.addColorStop(0.3, '#701a75');
        grad.addColorStop(0.6, '#ea580c');
        grad.addColorStop(0.85, '#f59e0b');
        grad.addColorStop(1, '#fef08a');
        break;
      case 'twilight':
        grad.addColorStop(0, '#090d16');
        grad.addColorStop(0.4, '#1e1b4b');
        grad.addColorStop(0.75, '#432874');
        grad.addColorStop(1, '#c084fc');
        break;
      case 'night':
      default:
        grad.addColorStop(0, '#030712');
        grad.addColorStop(0.5, '#090d1a');
        grad.addColorStop(0.85, '#111827');
        grad.addColorStop(1, '#1e293b');
        break;
    }
  }

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Aurora borealis for night clear/aurora weather
  if ((timeOfDay === 'night' || weather === 'night_aurora') && weather !== 'storm' && weather !== 'rain') {
    ctx.save();
    ctx.globalAlpha = 0.28;
    const auroraGrad = ctx.createLinearGradient(0, 0, w, h * 0.45);
    auroraGrad.addColorStop(0, 'rgba(16, 185, 129, 0)');
    auroraGrad.addColorStop(0.3, 'rgba(52, 211, 153, 0.4)');
    auroraGrad.addColorStop(0.6, 'rgba(168, 85, 247, 0.35)');
    auroraGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');
    ctx.fillStyle = auroraGrad;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.15);
    ctx.bezierCurveTo(w * 0.25, h * 0.05, w * 0.5, h * 0.3, w, h * 0.12);
    ctx.lineTo(w, h * 0.45);
    ctx.bezierCurveTo(w * 0.6, h * 0.35, w * 0.3, h * 0.25, 0, h * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function drawCelestial(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  timeOfDay: TimeOfDay,
  weather: WeatherType,
  skyOffset: number
) {
  if (weather === 'storm' || weather === 'fog') return;

  // Stars at night / twilight
  if (timeOfDay === 'night' || timeOfDay === 'twilight' || weather === 'night_aurora') {
    ctx.save();
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 70; i++) {
      const starX = ((i * 137.5 + skyOffset * 0.1) % w);
      const starY = (i * 93.7) % (h * 0.42);
      const starR = (i % 3 === 0) ? 1.6 : 0.9;
      const alpha = 0.4 + 0.5 * Math.sin(i * 4 + skyOffset * 0.05);
      ctx.globalAlpha = Math.max(0.2, alpha);
      ctx.beginPath();
      ctx.arc(starX, starY, starR, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Glowing Moon
    ctx.save();
    const moonX = w * 0.78;
    const moonY = h * 0.2;
    const moonGlow = ctx.createRadialGradient(moonX, moonY, 15, moonX, moonY, 70);
    moonGlow.addColorStop(0, 'rgba(254, 240, 138, 0.85)');
    moonGlow.addColorStop(0.3, 'rgba(254, 240, 138, 0.2)');
    moonGlow.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = moonGlow;
    ctx.beginPath();
    ctx.arc(moonX, moonY, 70, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fef9c3';
    ctx.beginPath();
    ctx.arc(moonX, moonY, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Sun during morning, afternoon, sunset
  if (timeOfDay === 'morning' || timeOfDay === 'afternoon' || timeOfDay === 'sunset') {
    ctx.save();
    let sunX = w * 0.65;
    let sunY = h * 0.22;
    let sunColor = '#fef08a';

    if (timeOfDay === 'morning') {
      sunX = w * 0.35;
      sunY = h * 0.32;
      sunColor = '#fde047';
    } else if (timeOfDay === 'sunset') {
      sunX = w * 0.82;
      sunY = h * 0.45;
      sunColor = '#f97316';
    }

    const sunGlow = ctx.createRadialGradient(sunX, sunY, 20, sunX, sunY, 120);
    sunGlow.addColorStop(0, sunColor);
    sunGlow.addColorStop(0.35, 'rgba(251, 146, 60, 0.35)');
    sunGlow.addColorStop(1, 'rgba(251, 146, 60, 0)');
    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 120, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fffbeb';
    ctx.beginPath();
    ctx.arc(sunX, sunY, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Drifting Clouds
  ctx.save();
  ctx.fillStyle = timeOfDay === 'sunset' ? 'rgba(251, 146, 60, 0.25)' : 'rgba(255, 255, 255, 0.22)';
  const cloudCount = 6;
  for (let c = 0; c < cloudCount; c++) {
    const cx = ((c * 420 - skyOffset * 0.5) % (w + 400)) - 100;
    const cy = h * 0.12 + (c % 3) * 45;
    drawSoftCloud(ctx, cx, cy, 140 + (c % 2) * 50);
  }
  ctx.restore();
}

function drawSoftCloud(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) {
  ctx.beginPath();
  ctx.arc(x, y, scale * 0.25, 0, Math.PI * 2);
  ctx.arc(x + scale * 0.2, y - scale * 0.1, scale * 0.32, 0, Math.PI * 2);
  ctx.arc(x + scale * 0.45, y - scale * 0.05, scale * 0.26, 0, Math.PI * 2);
  ctx.arc(x + scale * 0.65, y, scale * 0.2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fill();
}

function drawDistantLayer(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  biome: BiomeType,
  timeOfDay: TimeOfDay,
  weather: WeatherType,
  offset: number
) {
  ctx.save();
  const baseY = h * 0.62;

  // Distant Mountain / Skyline silhouettes
  let silhouetteColor = '#242a38';
  if (timeOfDay === 'sunset') silhouetteColor = '#4a154b';
  else if (timeOfDay === 'morning') silhouetteColor = '#1e3a5f';
  else if (biome === 'desert_canyons') silhouetteColor = '#7c2d12';
  else if (biome === 'ocean_coast') silhouetteColor = '#0f2f45';
  else if (biome === 'cyber_metropolis') silhouetteColor = '#111827';

  ctx.fillStyle = silhouetteColor;
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(0, baseY);

  const step = 60;
  for (let x = 0; x <= w + step; x += step) {
    const worldX = x + offset;
    let y = baseY;

    if (biome === 'alpine_mountains') {
      // Jagged sharp snowy peaks
      y = baseY - 180 * Math.sin(worldX * 0.0018) - 90 * Math.cos(worldX * 0.0042) - 40 * Math.sin(worldX * 0.009);
    } else if (biome === 'desert_canyons') {
      // Flat top mesas and canyon walls
      const mesa = Math.sin(worldX * 0.002);
      y = baseY - 120 * (mesa > 0.4 ? 1 : mesa < -0.4 ? 0.3 : 0.6) - 40 * Math.sin(worldX * 0.005);
    } else if (biome === 'ocean_coast') {
      // Soft coastal cliffs and open horizon
      y = baseY - 60 * Math.sin(worldX * 0.0015) - 30 * Math.cos(worldX * 0.0035);
    } else if (biome === 'cyber_metropolis') {
      // Skyscraper step silhouettes
      const block = Math.floor(worldX / 90);
      const randH = ((block * 197) % 180);
      y = baseY - 100 - randH;
    } else {
      // Rolling hills (autumn valley / emerald hills)
      y = baseY - 100 * Math.sin(worldX * 0.002) - 50 * Math.cos(worldX * 0.004);
    }

    ctx.lineTo(x, y);
  }

  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();

  // Draw Snow caps on alpine mountains
  if (biome === 'alpine_mountains') {
    ctx.fillStyle = weather === 'snow' ? 'rgba(255, 255, 255, 0.75)' : 'rgba(240, 248, 255, 0.55)';
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w + step; x += step) {
      const worldX = x + offset;
      const y = baseY - 180 * Math.sin(worldX * 0.0018) - 90 * Math.cos(worldX * 0.0042) - 40 * Math.sin(worldX * 0.009);
      if (y < baseY - 160) {
        ctx.lineTo(x, y);
      } else {
        ctx.lineTo(x, baseY - 140);
      }
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
  }

  // Draw shimmering sea if ocean coast
  if (biome === 'ocean_coast') {
    const seaGrad = ctx.createLinearGradient(0, baseY - 40, 0, baseY + 60);
    seaGrad.addColorStop(0, '#0c4a6e');
    seaGrad.addColorStop(1, '#0369a1');
    ctx.fillStyle = seaGrad;
    ctx.fillRect(0, baseY - 20, w, 80);
  }

  ctx.restore();
}

function drawMidgroundLayer(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  biome: BiomeType,
  timeOfDay: TimeOfDay,
  weather: WeatherType,
  offset: number
) {
  ctx.save();
  const midBaseY = h * 0.74;

  let midColor = '#1f3d2b'; // deep green
  if (biome === 'autumn_valley') midColor = '#78350f'; // amber brown
  else if (biome === 'desert_canyons') midColor = '#9a3412'; // terracotta
  else if (biome === 'ocean_coast') midColor = '#164e63';
  else if (biome === 'cyber_metropolis') midColor = '#1e293b';

  ctx.fillStyle = midColor;
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(0, midBaseY);

  const step = 40;
  for (let x = 0; x <= w + step; x += step) {
    const worldX = x + offset;
    const y = midBaseY - 60 * Math.sin(worldX * 0.0035) - 25 * Math.cos(worldX * 0.008);
    ctx.lineTo(x, y);
  }

  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();

  // Dotted elements across the midground (Windmills, Pines, Saguaro Cacti, Cottages)
  const elementSpacing = 280;
  const startIdx = Math.floor(offset / elementSpacing);
  const count = Math.ceil(w / elementSpacing) + 2;

  for (let i = 0; i < count; i++) {
    const idx = startIdx + i;
    const elemX = (idx * elementSpacing) - offset;
    const worldX = idx * elementSpacing;
    const groundY = midBaseY - 60 * Math.sin(worldX * 0.0035) - 25 * Math.cos(worldX * 0.008);

    if (biome === 'alpine_mountains') {
      drawPineCluster(ctx, elemX, groundY, 45);
    } else if (biome === 'autumn_valley') {
      if (idx % 3 === 0) {
        drawWindmill(ctx, elemX, groundY, 50, offset);
      } else {
        drawAutumnTree(ctx, elemX, groundY, 40);
      }
    } else if (biome === 'desert_canyons') {
      drawSaguaroCactus(ctx, elemX, groundY, 35);
    } else if (biome === 'ocean_coast') {
      if (idx % 4 === 0) {
        drawSailboat(ctx, elemX, midBaseY - 30);
      } else {
        drawCoastalShrub(ctx, elemX, groundY);
      }
    } else if (biome === 'cyber_metropolis') {
      drawMetroPylon(ctx, elemX, groundY);
    } else {
      // Emerald hills
      drawCottage(ctx, elemX, groundY, 35);
    }
  }

  ctx.restore();
}

function drawPineCluster(ctx: CanvasRenderingContext2D, x: number, y: number, height: number) {
  ctx.save();
  ctx.fillStyle = '#0f291e';
  // 2-3 overlapping pines
  [-12, 0, 14].forEach((xOff, i) => {
    const h = height * (0.8 + (i % 2) * 0.3);
    ctx.beginPath();
    ctx.moveTo(x + xOff, y);
    ctx.lineTo(x + xOff - 14, y);
    ctx.lineTo(x + xOff, y - h);
    ctx.lineTo(x + xOff + 14, y);
    ctx.closePath();
    ctx.fill();
  });
  ctx.restore();
}

function drawAutumnTree(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  // Trunk
  ctx.fillStyle = '#451a03';
  ctx.fillRect(x - 3, y - size * 0.8, 6, size * 0.8);

  // Golden / Amber foliage
  ctx.fillStyle = '#d97706';
  ctx.beginPath();
  ctx.arc(x, y - size * 0.9, size * 0.5, 0, Math.PI * 2);
  ctx.arc(x - size * 0.3, y - size * 0.7, size * 0.35, 0, Math.PI * 2);
  ctx.arc(x + size * 0.3, y - size * 0.7, size * 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawWindmill(ctx: CanvasRenderingContext2D, x: number, y: number, height: number, timeRef: number) {
  ctx.save();
  // Tower
  ctx.fillStyle = '#fef3c7';
  ctx.beginPath();
  ctx.moveTo(x - 14, y);
  ctx.lineTo(x - 7, y - height);
  ctx.lineTo(x + 7, y - height);
  ctx.lineTo(x + 14, y);
  ctx.closePath();
  ctx.fill();

  // Blades rotation
  const bladeAngle = (timeRef * 0.02) % (Math.PI * 2);
  const cx = x;
  const cy = y - height + 4;
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 3;

  for (let b = 0; b < 4; b++) {
    const a = bladeAngle + (b * Math.PI) / 2;
    const bx = cx + Math.cos(a) * 32;
    const by = cy + Math.sin(a) * 32;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(bx, by);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSaguaroCactus(ctx: CanvasRenderingContext2D, x: number, y: number, height: number) {
  ctx.save();
  ctx.strokeStyle = '#365314';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  // Main stem
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - height);
  ctx.stroke();
  // Left arm
  ctx.beginPath();
  ctx.moveTo(x, y - height * 0.4);
  ctx.lineTo(x - 12, y - height * 0.4);
  ctx.lineTo(x - 12, y - height * 0.75);
  ctx.stroke();
  // Right arm
  ctx.beginPath();
  ctx.moveTo(x, y - height * 0.55);
  ctx.lineTo(x + 10, y - height * 0.55);
  ctx.lineTo(x + 10, y - height * 0.85);
  ctx.stroke();
  ctx.restore();
}

function drawSailboat(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  // Hull
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(x - 16, y);
  ctx.lineTo(x + 16, y);
  ctx.lineTo(x + 10, y + 6);
  ctx.lineTo(x - 12, y + 6);
  ctx.closePath();
  ctx.fill();
  // Sail
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.moveTo(x - 2, y);
  ctx.lineTo(x - 2, y - 24);
  ctx.lineTo(x + 14, y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawCoastalShrub(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.fillStyle = '#065f46';
  ctx.beginPath();
  ctx.arc(x, y - 10, 16, 0, Math.PI * 2);
  ctx.arc(x - 10, y - 6, 12, 0, Math.PI * 2);
  ctx.arc(x + 10, y - 6, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawMetroPylon(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.fillStyle = '#334155';
  ctx.fillRect(x - 6, y - 60, 12, 60);
  // Glowing blue/amber light
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(x, y - 64, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCottage(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  // Walls
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(x - size * 0.6, y - size * 0.5, size * 1.2, size * 0.5);
  // Roof
  ctx.fillStyle = '#991b1b';
  ctx.beginPath();
  ctx.moveTo(x - size * 0.7, y - size * 0.5);
  ctx.lineTo(x, y - size * 0.95);
  ctx.lineTo(x + size * 0.7, y - size * 0.5);
  ctx.closePath();
  ctx.fill();
  // Window glow
  ctx.fillStyle = '#fde047';
  ctx.fillRect(x - 6, y - size * 0.35, 12, 10);
  ctx.restore();
}

function drawTelegraphPoles(ctx: CanvasRenderingContext2D, w: number, h: number, offset: number, timeOfDay: TimeOfDay) {
  ctx.save();
  const poleSpacing = 420;
  const startIdx = Math.floor(offset / poleSpacing);
  const count = Math.ceil(w / poleSpacing) + 2;
  const poleY = h * 0.82;

  const poles: { x: number; crossY: number }[] = [];

  for (let i = 0; i < count; i++) {
    const idx = startIdx + i;
    const px = (idx * poleSpacing) - offset;
    const crossY = poleY - 140;

    // Draw Pole
    ctx.fillStyle = timeOfDay === 'night' ? '#0f172a' : '#271c19';
    ctx.fillRect(px - 4, poleY - 150, 8, 150);

    // Cross beam
    ctx.fillRect(px - 36, crossY, 72, 6);

    // Insulators
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(px - 32, crossY - 4, 6, 4);
    ctx.fillRect(px + 26, crossY - 4, 6, 4);

    poles.push({ x: px, crossY });
  }

  // Draw dipping wire catenary between poles
  ctx.strokeStyle = timeOfDay === 'night' ? 'rgba(15, 23, 42, 0.7)' : 'rgba(40, 30, 25, 0.75)';
  ctx.lineWidth = 1.6;

  for (let i = 0; i < poles.length - 1; i++) {
    const p1 = poles[i];
    const p2 = poles[i + 1];

    [-32, 26].forEach((wireOffset) => {
      ctx.beginPath();
      ctx.moveTo(p1.x + wireOffset, p1.crossY - 3);
      const midX = (p1.x + p2.x) / 2;
      const sagY = p1.crossY + 28;
      ctx.quadraticCurveTo(midX + wireOffset, sagY, p2.x + wireOffset, p2.crossY - 3);
      ctx.stroke();
    });
  }

  ctx.restore();
}

function drawForegroundTrackside(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  biome: BiomeType,
  offset: number,
  timeOfDay: TimeOfDay,
  speedKmH: number
) {
  ctx.save();
  const trackBaseY = h * 0.82;

  // Gravel ballast embankment
  const ballastGrad = ctx.createLinearGradient(0, trackBaseY, 0, h);
  ballastGrad.addColorStop(0, timeOfDay === 'night' ? '#090d16' : '#3e342b');
  ballastGrad.addColorStop(1, timeOfDay === 'night' ? '#020617' : '#231d18');
  ctx.fillStyle = ballastGrad;
  ctx.fillRect(0, trackBaseY, w, h - trackBaseY);

  // Fast passing sleepers / ties (creating realistic blur)
  const tieSpacing = 45;
  const startIdx = Math.floor(offset / tieSpacing);
  const count = Math.ceil(w / tieSpacing) + 2;

  ctx.fillStyle = timeOfDay === 'night' ? '#020617' : '#1c1511';
  for (let i = 0; i < count; i++) {
    const idx = startIdx + i;
    const tx = (idx * tieSpacing) - offset;
    ctx.fillRect(tx, trackBaseY + 65, 24, 18);
  }

  // Steel rail lines with metallic sheen
  const railY = trackBaseY + 70;
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(0, railY);
  ctx.lineTo(w, railY);
  ctx.stroke();

  // Rail highlight
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(0, railY - 2);
  ctx.lineTo(w, railY - 2);
  ctx.stroke();

  // High speed shrubs & mile posts in immediate foreground
  const shrubSpacing = 160;
  const sStart = Math.floor(offset / shrubSpacing);
  const sCount = Math.ceil(w / shrubSpacing) + 2;

  ctx.fillStyle = timeOfDay === 'night' ? '#060e0a' : '#143820';
  for (let i = 0; i < sCount; i++) {
    const idx = sStart + i;
    const sx = (idx * shrubSpacing) - offset;
    // Streak horizontally with speed
    const blurLen = Math.min(80, speedKmH * 0.4);
    ctx.beginPath();
    ctx.ellipse(sx, trackBaseY + 30, 25 + blurLen, 16, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawLandmark(ctx: CanvasRenderingContext2D, landmark: Landmark) {
  ctx.save();
  ctx.translate(landmark.x, landmark.y);

  if (landmark.type === 'golden_eagle') {
    ctx.fillStyle = '#b45309';
    // Soaring wings
    ctx.beginPath();
    ctx.moveTo(-35, -5);
    ctx.quadraticCurveTo(-15, -20, 0, 0);
    ctx.quadraticCurveTo(15, -20, 35, -5);
    ctx.quadraticCurveTo(15, 8, 0, 4);
    ctx.quadraticCurveTo(-15, 8, -35, -5);
    ctx.closePath();
    ctx.fill();
  } else if (landmark.type === 'hot_air_balloon') {
    // Striped balloon
    const bGrad = ctx.createLinearGradient(-25, 0, 25, 0);
    bGrad.addColorStop(0, '#ef4444');
    bGrad.addColorStop(0.5, '#f59e0b');
    bGrad.addColorStop(1, '#3b82f6');
    ctx.fillStyle = bGrad;
    ctx.beginPath();
    ctx.arc(0, -30, 32, 0, Math.PI * 2);
    ctx.fill();

    // Basket
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-8, 8, 16, 12);
  } else if (landmark.type === 'vintage_train') {
    // Opposing train passing on secondary tracks
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-70, -25, 140, 30);
    // Steam puff
    ctx.fillStyle = 'rgba(240, 240, 240, 0.45)';
    ctx.beginPath();
    ctx.arc(45, -40, 18, 0, Math.PI * 2);
    ctx.arc(25, -48, 24, 0, Math.PI * 2);
    ctx.arc(0, -55, 30, 0, Math.PI * 2);
    ctx.fill();
  } else if (landmark.type === 'ancient_castle') {
    // Castle Turrets
    ctx.fillStyle = '#475569';
    ctx.fillRect(-40, -50, 20, 50);
    ctx.fillRect(20, -50, 20, 50);
    ctx.fillRect(-25, -35, 50, 35);
  } else if (landmark.type === 'lighthouse') {
    // Lighthouse
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(-16, 0);
    ctx.lineTo(-8, -75);
    ctx.lineTo(8, -75);
    ctx.lineTo(16, 0);
    ctx.closePath();
    ctx.fill();

    // Red stripes
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(-12, -45, 24, 15);

    // Glowing beam
    const beam = ctx.createRadialGradient(0, -75, 4, 120, -90, 200);
    beam.addColorStop(0, 'rgba(254, 240, 138, 0.7)');
    beam.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(0, -75);
    ctx.lineTo(240, -120);
    ctx.lineTo(240, -40);
    ctx.closePath();
    ctx.fill();
  }

  // Label tag
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(-landmark.name.length * 4.5, 18, landmark.name.length * 9, 20);
  ctx.fillStyle = '#fef08a';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(landmark.name, 0, 32);

  ctx.restore();
}

function drawRain(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  speedKmH: number,
  drops: RainDrop[],
  dt: number,
  isStorm: boolean
) {
  ctx.save();
  ctx.strokeStyle = isStorm ? 'rgba(200, 225, 255, 0.55)' : 'rgba(210, 230, 250, 0.4)';

  const horizVelocity = -((speedKmH / 100) * 450 + 150);

  drops.forEach((d) => {
    d.x += (d.speedX + horizVelocity * 0.1) * dt * 60;
    d.y += d.speedY * dt * 60;

    if (d.x < -50) d.x = w + 50;
    if (d.y > h + 50) {
      d.y = -20;
      d.x = Math.random() * (w + 200);
    }

    ctx.lineWidth = d.size;
    ctx.beginPath();
    ctx.moveTo(d.x, d.y);
    // Angle backward according to train speed
    const slantX = (horizVelocity / 100) * 12;
    ctx.lineTo(d.x + slantX, d.y + d.length);
    ctx.stroke();
  });

  ctx.restore();
}

function drawSnow(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  speedKmH: number,
  snowflakes: Snowflake[],
  dt: number
) {
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';

  const horizVelocity = -((speedKmH / 100) * 250 + 60);

  snowflakes.forEach((f) => {
    f.wobble += dt * 3;
    f.x += (horizVelocity * 0.08 + Math.sin(f.wobble) * 2) * dt * 60;
    f.y += f.speedY * dt * 60;

    if (f.x < -20) f.x = w + 20;
    if (f.y > h + 20) {
      f.y = -10;
      f.x = Math.random() * (w + 100);
    }

    ctx.globalAlpha = f.opacity;
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}

function drawFog(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.fillStyle = 'rgba(200, 210, 220, 0.45)';
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function drawWindowGlassEffects(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  weather: WeatherType,
  wipersActive: boolean,
  wiperAngle: number,
  glassDrops: GlassDrop[],
  dt: number,
  speedKmH: number
) {
  ctx.save();

  // Glass water droplets (streak sideways and down)
  if (weather === 'rain' || weather === 'storm') {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';

    glassDrops.forEach((gd) => {
      // Wind speed pushes drops backwards & down
      gd.x -= (speedKmH * 0.08 + 0.3) * dt * 60;
      gd.y += 0.4 * dt * 60;

      if (gd.x < -10) gd.x = w + 20;
      if (gd.y > h + 10) gd.y = Math.random() * h;

      // Small round water droplet with streak trail
      ctx.beginPath();
      ctx.arc(gd.x, gd.y, gd.radius, 0, Math.PI * 2);
      ctx.fill();

      // Streak line behind
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(gd.x, gd.y);
      ctx.lineTo(gd.x + gd.streakLength + (speedKmH * 0.1), gd.y - 4);
      ctx.stroke();
    });
  }

  // Cold Frost vignette during snow
  if (weather === 'snow') {
    const frost = ctx.createRadialGradient(w / 2, h / 2, h * 0.35, w / 2, h / 2, h * 0.65);
    frost.addColorStop(0, 'rgba(255, 255, 255, 0)');
    frost.addColorStop(0.85, 'rgba(240, 248, 255, 0.2)');
    frost.addColorStop(1, 'rgba(240, 248, 255, 0.55)');
    ctx.fillStyle = frost;
    ctx.fillRect(0, 0, w, h);
  }

  // Train Window Wiper Arm and rubber blade
  if (wipersActive || weather === 'rain' || weather === 'storm') {
    const pivotX = w * 0.5;
    const pivotY = h * 0.98;
    const armLen = h * 0.68;

    const angle = -Math.PI / 2 + wiperAngle * 0.75;
    const endX = pivotX + Math.cos(angle) * armLen;
    const endY = pivotY + Math.sin(angle) * armLen;

    // Wiper steel arm
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Wiper blade perpendicular
    const bladeHalf = 70;
    const perpAngle = angle + Math.PI / 2;
    const bx1 = endX - Math.cos(perpAngle) * bladeHalf;
    const by1 = endY - Math.sin(perpAngle) * bladeHalf;
    const bx2 = endX + Math.cos(perpAngle) * bladeHalf;
    const by2 = endY + Math.sin(perpAngle) * bladeHalf;

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(bx1, by1);
    ctx.lineTo(bx2, by2);
    ctx.stroke();
  }

  // Subtle interior glass glare reflection (diagonal sheer)
  const glare = ctx.createLinearGradient(0, 0, w, h);
  glare.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
  glare.addColorStop(0.35, 'rgba(255, 255, 255, 0.01)');
  glare.addColorStop(0.65, 'rgba(255, 255, 255, 0.04)');
  glare.addColorStop(1, 'rgba(255, 255, 255, 0.02)');
  ctx.fillStyle = glare;
  ctx.fillRect(0, 0, w, h);

  ctx.restore();
}
