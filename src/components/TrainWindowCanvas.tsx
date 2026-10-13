import React, { useEffect, useRef } from 'react';
import { BiomeType, StationVariant, BIOME_CONFIGS } from '../types/scenery';

interface TrainWindowCanvasProps {
  speedKmH: number;
  tunnelActive?: boolean;
  isNightMode?: boolean;
  currentBiome?: BiomeType;
  stationVariant?: StationVariant;
  stationName?: string;
  distanceToNextKm?: number;
}

interface Cloud {
  x: number;
  y: number;
  size: number;
  speed: number;
}

interface Star {
  x: number;
  y: number;
  radius: number;
  baseAlpha: number;
  twinkleSpeed: number;
}

interface Firefly {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
}

interface SmokeParticle {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  vx: number;
  vy: number;
}

export const TrainWindowCanvas: React.FC<TrainWindowCanvasProps> = ({
  speedKmH,
  tunnelActive = false,
  isNightMode = false,
  currentBiome = 'meadow_plain',
  stationVariant = 'meadowbrook_whistlestop',
  stationName = 'Meadowbrook Junction',
  distanceToNextKm = 15,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Parallax offsets
  const skyOffsetRef = useRef(0);
  const mountainOffsetRef = useRef(0);
  const midHillOffsetRef = useRef(0);
  const foreHillOffsetRef = useRef(0);
  const trackOffsetRef = useRef(0);

  // Night mode smooth transition interpolation factor (0 = day, 1 = night)
  const nightFactorRef = useRef(isNightMode ? 1 : 0);

  // Tunnel darkness overlay animation (0 = bright outside, 1 = inside dark tunnel)
  const tunnelDarknessRef = useRef(0);

  // Weather / Celestial elements
  const cloudsRef = useRef<Cloud[]>([]);
  const starsRef = useRef<Star[]>([]);
  const firefliesRef = useRef<Firefly[]>([]);
  const smokeParticlesRef = useRef<SmokeParticle[]>([]);

  // Windmill & watermill rotation
  const wheelAngleRef = useRef(0);

  // Animation frame
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  // Initialize atmospheric particles
  useEffect(() => {
    // 1. Clouds
    const clouds: Cloud[] = [];
    for (let i = 0; i < 9; i++) {
      clouds.push({
        x: Math.random() * 2200,
        y: 40 + Math.random() * 140,
        size: 70 + Math.random() * 90,
        speed: 12 + Math.random() * 18,
      });
    }
    cloudsRef.current = clouds;

    // 2. Night Stars
    const stars: Star[] = [];
    for (let i = 0; i < 110; i++) {
      stars.push({
        x: Math.random() * 2400,
        y: Math.random() * 500,
        radius: 0.8 + Math.random() * 1.6,
        baseAlpha: 0.3 + Math.random() * 0.7,
        twinkleSpeed: 1 + Math.random() * 3,
      });
    }
    starsRef.current = stars;

    // 3. Fireflies
    const fireflies: Firefly[] = [];
    for (let i = 0; i < 18; i++) {
      fireflies.push({
        x: Math.random() * 1800,
        y: 400 + Math.random() * 300,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 10,
        alpha: Math.random(),
      });
    }
    firefliesRef.current = fireflies;
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

      const width = canvas.width;
      const height = canvas.height;

      // Smoothly interpolate Day <-> Night
      const targetNight = isNightMode ? 1 : 0;
      nightFactorRef.current += (targetNight - nightFactorRef.current) * Math.min(1, dt * 5);
      const night = nightFactorRef.current;

      // Parallax scroll speeds based on train speed
      const pxPerSec = (speedKmH / 100) * 850;
      const fgSpeed = pxPerSec * dt;
      const midSpeed = pxPerSec * 0.38 * dt;
      const mtSpeed = pxPerSec * 0.12 * dt;
      const skySpeed = pxPerSec * 0.02 * dt;

      trackOffsetRef.current = (trackOffsetRef.current + fgSpeed) % 8000;
      foreHillOffsetRef.current = (foreHillOffsetRef.current + fgSpeed * 0.7) % 8000;
      midHillOffsetRef.current = (midHillOffsetRef.current + midSpeed) % 8000;
      mountainOffsetRef.current = (mountainOffsetRef.current + mtSpeed) % 8000;
      skyOffsetRef.current = (skyOffsetRef.current + skySpeed) % 8000;

      wheelAngleRef.current += dt * (0.8 + (speedKmH / 100) * 0.5);

      // Sectional Mountain Tunnel effect
      const targetDarkness = tunnelActive ? 0.96 : 0;
      tunnelDarknessRef.current += (targetDarkness - tunnelDarknessRef.current) * Math.min(1, dt * 8);

      // Clear Canvas
      ctx.clearRect(0, 0, width, height);

      const biomeConfig = BIOME_CONFIGS[currentBiome] || BIOME_CONFIGS.meadow_plain;

      // 1. SKY GRADIENT (Smooth Day & Night blending)
      drawAtmosphericSky(ctx, width, height, night, biomeConfig);

      // 2. CELESTIAL BODIES (Sun in daytime, Stars & Moon in night)
      if (night < 0.98) {
        drawCozySun(ctx, width, height, 1 - night);
      }
      if (night > 0.02) {
        drawTwinklingStars(ctx, width, height, starsRef.current, night, now);
        drawCrescentMoon(ctx, width, height, night);
      }

      // 3. CLOUDS (Soft drifting puffy clouds)
      drawCozyClouds(ctx, width, cloudsRef.current, dt, skySpeed, night);

      // 4. DISTANT PARALLAX MOUNTAINS & HORIZON
      drawDistantLandscape(ctx, width, height, mountainOffsetRef.current, night, currentBiome);

      // 5. MIDGROUND BIOME SCENERY (Windmills, rivers, castles, trees, skyline)
      drawMidgroundBiome(
        ctx,
        width,
        height,
        midHillOffsetRef.current,
        wheelAngleRef.current,
        night,
        currentBiome
      );

      // 6. FOREGROUND BIOME ROLLING HILLS / RIVER / ORCHARD
      drawForegroundBiome(
        ctx,
        width,
        height,
        foreHillOffsetRef.current,
        dt,
        night,
        currentBiome,
        firefliesRef.current
      );

      // 7. APPROACHING / REACHED STATION ARCHITECTURE (10 Handcrafted Platform Variants)
      drawStationPlatformIfNear(
        ctx,
        width,
        height,
        trackOffsetRef.current,
        distanceToNextKm,
        stationVariant,
        stationName,
        night
      );

      // 8. HIGH-SPEED RAILWAY TRACK & BALLAST BED
      drawRailwayTrack(ctx, width, height, trackOffsetRef.current, speedKmH, night);

      // 9. SECTIONAL TUNNEL TRANSITION (Passing illuminated brick tunnel lanterns)
      if (tunnelDarknessRef.current > 0.01) {
        drawTunnelTransition(ctx, width, height, tunnelDarknessRef.current, trackOffsetRef.current);
      }

      // 10. GENTLE GLASS CABIN VIGNETTE (Atmospheric soft coach depth)
      drawGlassVignette(ctx, width, height, night);

      animFrameRef.current = requestAnimationFrame(render);
    };

    const handleResize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [speedKmH, tunnelActive, isNightMode, currentBiome, stationVariant, stationName, distanceToNextKm]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-[#090d16] select-none pointer-events-auto">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />
    </div>
  );
};

// ============================================================================
// CANVAS RENDER HELPERS: ATMOSPHERE & CELESTIAL
// ============================================================================

function drawAtmosphericSky(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  night: number,
  biome: typeof BIOME_CONFIGS[BiomeType]
) {
  const grad = ctx.createLinearGradient(0, 0, 0, h * 0.72);

  if (night <= 0.01) {
    // Day sky
    grad.addColorStop(0, biome.skyDay[0]);
    grad.addColorStop(0.5, biome.skyDay[1]);
    grad.addColorStop(1, biome.skyDay[2]);
  } else if (night >= 0.99) {
    // Night sky
    grad.addColorStop(0, biome.skyNight[0]);
    grad.addColorStop(0.55, biome.skyNight[1]);
    grad.addColorStop(1, biome.skyNight[2]);
  } else {
    // Smooth crossfade using canvas composition
    grad.addColorStop(0, biome.skyDay[0]);
    grad.addColorStop(0.5, biome.skyDay[1]);
    grad.addColorStop(1, biome.skyDay[2]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const nightGrad = ctx.createLinearGradient(0, 0, 0, h * 0.72);
    nightGrad.addColorStop(0, biome.skyNight[0]);
    nightGrad.addColorStop(0.55, biome.skyNight[1]);
    nightGrad.addColorStop(1, biome.skyNight[2]);
    ctx.save();
    ctx.globalAlpha = night;
    ctx.fillStyle = nightGrad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
    return;
  }

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

function drawCozySun(ctx: CanvasRenderingContext2D, w: number, h: number, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const sunX = w * 0.78;
  const sunY = h * 0.18;

  // Warm radiant aura
  const aura = ctx.createRadialGradient(sunX, sunY, 15, sunX, sunY, 90);
  aura.addColorStop(0, 'rgba(254, 240, 138, 0.9)');
  aura.addColorStop(0.4, 'rgba(251, 191, 36, 0.3)');
  aura.addColorStop(1, 'rgba(251, 191, 36, 0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 90, 0, Math.PI * 2);
  ctx.fill();

  // Solid golden disc
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(sunX, sunY, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCrescentMoon(ctx: CanvasRenderingContext2D, w: number, h: number, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const moonX = w * 0.82;
  const moonY = h * 0.16;

  // Luminous moon glow
  const moonGlow = ctx.createRadialGradient(moonX, moonY, 12, moonX, moonY, 70);
  moonGlow.addColorStop(0, 'rgba(254, 243, 199, 0.6)');
  moonGlow.addColorStop(0.5, 'rgba(217, 249, 157, 0.15)');
  moonGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = moonGlow;
  ctx.beginPath();
  ctx.arc(moonX, moonY, 70, 0, Math.PI * 2);
  ctx.fill();

  // Crescent Moon
  ctx.fillStyle = '#fef3c7';
  ctx.beginPath();
  ctx.arc(moonX, moonY, 22, 0, Math.PI * 2);
  ctx.fill();

  // Shadow bite to create crisp crescent
  ctx.fillStyle = '#090d16';
  ctx.beginPath();
  ctx.arc(moonX - 9, moonY - 5, 19, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawTwinklingStars(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  stars: Star[],
  alpha: number,
  timeMs: number
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const t = timeMs / 1000;

  stars.forEach((s) => {
    const twinkle = Math.sin(t * s.twinkleSpeed + s.x) * 0.35 + 0.65;
    ctx.fillStyle = `rgba(248, 250, 252, ${s.baseAlpha * twinkle})`;
    ctx.beginPath();
    ctx.arc(s.x % w, s.y, s.radius, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawCozyClouds(
  ctx: CanvasRenderingContext2D,
  w: number,
  clouds: Cloud[],
  dt: number,
  skySpeed: number,
  night: number
) {
  ctx.save();
  ctx.fillStyle = night > 0.5 ? 'rgba(30, 41, 59, 0.45)' : 'rgba(255, 255, 255, 0.9)';

  clouds.forEach((c) => {
    c.x -= (c.speed * dt + skySpeed * 0.4);
    if (c.x < -220) {
      c.x = w + 220;
      c.y = 35 + Math.random() * 130;
    }

    const s = c.size;
    ctx.beginPath();
    ctx.arc(c.x, c.y, s * 0.35, 0, Math.PI * 2);
    ctx.arc(c.x + s * 0.35, c.y - s * 0.12, s * 0.44, 0, Math.PI * 2);
    ctx.arc(c.x + s * 0.72, c.y, s * 0.36, 0, Math.PI * 2);
    ctx.arc(c.x + s * 0.35, c.y + s * 0.08, s * 0.32, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

// ============================================================================
// CANVAS RENDER HELPERS: DISTANT LANDSCAPES
// ============================================================================

function drawDistantLandscape(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  offset: number,
  night: number,
  biome: BiomeType
) {
  ctx.save();
  const baseY = h * 0.52;

  // Distant Mountain ridge
  const mtColor = night > 0.5 ? '#111827' : '#94a3b8';
  ctx.fillStyle = mtColor;
  ctx.beginPath();
  ctx.moveTo(0, baseY);

  const peakSpacing = 280;
  const startIdx = Math.floor(offset / peakSpacing);
  const count = Math.ceil(w / peakSpacing) + 3;

  for (let i = -1; i <= count; i++) {
    const idx = startIdx + i;
    const px = (idx * peakSpacing) - offset;
    const heightVariation = ((idx * 9301 + 49297) % 233280) / 233280;
    const py = baseY - (80 + heightVariation * 130);

    ctx.lineTo(px - 140, baseY);
    ctx.lineTo(px, py);

    // Snow caps for Alpine Foothills
    if (biome === 'alpine_foothills' && py < baseY - 120) {
      // Will be filled underneath
    }
  }

  ctx.lineTo(w, baseY);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  // Snowy caps if alpine
  if (biome === 'alpine_foothills') {
    ctx.fillStyle = night > 0.5 ? '#e2e8f0' : '#ffffff';
    for (let i = -1; i <= count; i++) {
      const idx = startIdx + i;
      const px = (idx * peakSpacing) - offset;
      const heightVariation = ((idx * 9301 + 49297) % 233280) / 233280;
      const py = baseY - (80 + heightVariation * 130);

      if (py < baseY - 110) {
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px - 25, py + 35);
        ctx.lineTo(px + 25, py + 35);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  // Skyline silhouette if Metropolis
  if (biome === 'metropolis_skyline') {
    ctx.fillStyle = night > 0.5 ? '#0f172a' : '#475569';
    const bldSpacing = 85;
    const bStart = Math.floor(offset / bldSpacing);
    const bCount = Math.ceil(w / bldSpacing) + 2;

    for (let i = 0; i < bCount; i++) {
      const idx = bStart + i;
      const bx = (idx * bldSpacing) - offset;
      const bHeight = 70 + (((idx * 17) % 11) * 14);
      const bWidth = 55 + ((idx % 3) * 12);
      ctx.fillRect(bx, baseY - bHeight, bWidth, bHeight);

      // Illuminated skyscraper windows in night
      if (night > 0.3) {
        ctx.fillStyle = 'rgba(253, 224, 71, 0.7)';
        for (let row = 0; row < bHeight - 15; row += 14) {
          for (let col = 8; col < bWidth - 8; col += 12) {
            if ((idx + row + col) % 3 !== 0) {
              ctx.fillRect(bx + col, baseY - bHeight + row + 6, 4, 6);
            }
          }
        }
        ctx.fillStyle = night > 0.5 ? '#0f172a' : '#475569';
      }
    }
  }

  ctx.restore();
}

// ============================================================================
// CANVAS RENDER HELPERS: MIDGROUND BIOMES
// ============================================================================

function drawMidgroundBiome(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  offset: number,
  wheelAngle: number,
  night: number,
  biome: BiomeType
) {
  ctx.save();
  const midBaseY = h * 0.65;

  // Midground rolling terrain fill
  let midColor = '#86efac';
  if (night > 0.5) midColor = '#064e3b';
  if (biome === 'autumn_orchard') midColor = night > 0.5 ? '#7c2d12' : '#fb923c';
  if (biome === 'river_viaduct' || biome === 'lakeside_harbor') midColor = night > 0.5 ? '#065f46' : '#34d399';
  if (biome === 'metropolis_skyline') midColor = night > 0.5 ? '#1e293b' : '#64748b';

  ctx.fillStyle = midColor;
  ctx.beginPath();
  ctx.moveTo(0, midBaseY);

  const hillStep = 320;
  const startIdx = Math.floor(offset / hillStep);
  const count = Math.ceil(w / hillStep) + 3;

  for (let i = -1; i <= count; i++) {
    const idx = startIdx + i;
    const hx = (idx * hillStep) - offset;
    const wave = Math.sin(idx * 1.3) * 35;
    ctx.quadraticCurveTo(hx - hillStep * 0.5, midBaseY - 45 + wave, hx, midBaseY + wave * 0.3);
  }
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  // Biome-specific midground structures & landmarks:
  switch (biome) {
    case 'meadow_plain':
      // Historic Dutch Windmills
      drawWindmills(ctx, w, midBaseY, offset, wheelAngle, night);
      break;

    case 'river_viaduct':
      // Arched stone viaduct spanning the gorge
      drawStoneViaductArches(ctx, w, midBaseY, offset, night);
      break;

    case 'heritage_village':
      // Half-timbered cottages & cathedral bell tower
      drawVillageCottages(ctx, w, midBaseY, offset, night);
      break;

    case 'ancient_castle_ruins':
      // Mountain Fortress & Roman Aqueduct
      drawCastleFortress(ctx, w, midBaseY, offset, night);
      break;

    case 'lakeside_harbor':
      // Shimmering Lake with Sailboats & Coastal Lighthouse
      drawLighthouseAndSailboats(ctx, w, midBaseY, offset, night);
      break;

    case 'autumn_orchard':
      // Red apple barns & stone walls
      drawAutumnBarns(ctx, w, midBaseY, offset, night);
      break;

    case 'alpine_foothills':
      // Alpine Pine Groves & Wood Chalets
      drawAlpineChalets(ctx, w, midBaseY, offset, night);
      break;

    case 'metropolis_skyline':
      // Suspension Bridge Towers & City Overpasses
      drawSuspensionBridge(ctx, w, midBaseY, offset, night);
      break;
  }

  ctx.restore();
}

function drawWindmills(
  ctx: CanvasRenderingContext2D,
  w: number,
  baseY: number,
  offset: number,
  angle: number,
  night: number
) {
  const spacing = 650;
  const startIdx = Math.floor(offset / spacing);
  const count = Math.ceil(w / spacing) + 2;

  for (let i = 0; i < count; i++) {
    const idx = startIdx + i;
    const wx = (idx * spacing) - offset;
    const wy = baseY - 25;

    // Windmill conical stone tower
    ctx.fillStyle = night > 0.5 ? '#1f2937' : '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(wx - 16, wy);
    ctx.lineTo(wx - 9, wy - 55);
    ctx.lineTo(wx + 9, wy - 55);
    ctx.lineTo(wx + 16, wy);
    ctx.closePath();
    ctx.fill();

    // Thatched cap roof
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.arc(wx, wy - 55, 12, Math.PI, 0);
    ctx.fill();

    // Warm lighted window in night
    if (night > 0.4) {
      ctx.fillStyle = '#fde047';
      ctx.fillRect(wx - 3, wy - 30, 6, 8);
    }

    // 4 Rotating sail blades
    ctx.save();
    ctx.translate(wx, wy - 55);
    ctx.rotate(angle);
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2.5;

    for (let b = 0; b < 4; b++) {
      ctx.rotate(Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, 36);
      ctx.stroke();

      // Canvas sail mesh
      ctx.fillStyle = 'rgba(254, 243, 199, 0.7)';
      ctx.fillRect(2, 10, 8, 22);
    }
    ctx.restore();
  }
}

function drawStoneViaductArches(
  ctx: CanvasRenderingContext2D,
  w: number,
  baseY: number,
  offset: number,
  night: number
) {
  const archSpacing = 160;
  const startIdx = Math.floor(offset / archSpacing);
  const count = Math.ceil(w / archSpacing) + 2;

  ctx.fillStyle = night > 0.5 ? '#1e293b' : '#cbd5e1';

  for (let i = 0; i < count; i++) {
    const idx = startIdx + i;
    const ax = (idx * archSpacing) - offset;
    const ay = baseY - 15;

    // Pillar
    ctx.fillRect(ax, ay, 28, 65);
    // Arch vault
    ctx.beginPath();
    ctx.arc(ax + archSpacing * 0.5, ay + 10, archSpacing * 0.38, Math.PI, 0, false);
    ctx.fill();
  }

  // Sparkling river below
  ctx.fillStyle = night > 0.5 ? '#0c4a6e' : '#38bdf8';
  ctx.fillRect(0, baseY + 45, w, 30);

  // Water reflections shimmer
  ctx.fillStyle = night > 0.5 ? '#38bdf8' : '#e0f2fe';
  for (let rx = 0; rx < w; rx += 45) {
    const gx = ((rx - offset * 0.5) % w + w) % w;
    ctx.fillRect(gx, baseY + 55, 20, 2);
  }
}

function drawVillageCottages(
  ctx: CanvasRenderingContext2D,
  w: number,
  baseY: number,
  offset: number,
  night: number
) {
  const spacing = 480;
  const startIdx = Math.floor(offset / spacing);
  const count = Math.ceil(w / spacing) + 2;

  for (let i = 0; i < count; i++) {
    const idx = startIdx + i;
    const cx = (idx * spacing) - offset;
    const cy = baseY - 20;

    // Cottage body
    ctx.fillStyle = night > 0.5 ? '#292524' : '#fef3c7';
    ctx.fillRect(cx, cy - 35, 48, 35);

    // Half-timbered beams
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx, cy - 35, 48, 35);

    // Steep pitched roof
    ctx.fillStyle = '#991b1b'; // Terracotta
    ctx.beginPath();
    ctx.moveTo(cx - 6, cy - 35);
    ctx.lineTo(cx + 24, cy - 60);
    ctx.lineTo(cx + 54, cy - 35);
    ctx.closePath();
    ctx.fill();

    // Chimney with smoke
    ctx.fillStyle = '#44403c';
    ctx.fillRect(cx + 34, cy - 68, 8, 18);

    // Warm lighted windows in night
    if (night > 0.3) {
      ctx.fillStyle = '#fde047';
      ctx.fillRect(cx + 8, cy - 26, 12, 12);
      ctx.fillRect(cx + 28, cy - 26, 12, 12);
    }
  }
}

function drawCastleFortress(
  ctx: CanvasRenderingContext2D,
  w: number,
  baseY: number,
  offset: number,
  night: number
) {
  const spacing = 720;
  const startIdx = Math.floor(offset / spacing);
  const count = Math.ceil(w / spacing) + 2;

  for (let i = 0; i < count; i++) {
    const idx = startIdx + i;
    const cx = (idx * spacing) - offset;
    const cy = baseY - 35;

    ctx.fillStyle = night > 0.5 ? '#1c1917' : '#78716c';

    // Main Keep Tower
    ctx.fillRect(cx, cy - 70, 50, 70);

    // Battlements / Crenellations
    for (let c = 0; c < 50; c += 14) {
      ctx.fillRect(cx + c, cy - 82, 8, 12);
    }

    // Flanking Round Turret
    ctx.fillRect(cx + 50, cy - 50, 28, 50);
    ctx.beginPath();
    ctx.moveTo(cx + 46, cy - 50);
    ctx.lineTo(cx + 64, cy - 75);
    ctx.lineTo(cx + 82, cy - 50);
    ctx.closePath();
    ctx.fill();

    // Narrow arrow loop windows
    ctx.fillStyle = night > 0.4 ? '#fbbf24' : '#1c1917';
    ctx.fillRect(cx + 22, cy - 50, 6, 16);
    ctx.fillRect(cx + 60, cy - 36, 5, 12);
  }
}

function drawLighthouseAndSailboats(
  ctx: CanvasRenderingContext2D,
  w: number,
  baseY: number,
  offset: number,
  night: number
) {
  const spacing = 750;
  const startIdx = Math.floor(offset / spacing);
  const count = Math.ceil(w / spacing) + 2;

  for (let i = 0; i < count; i++) {
    const idx = startIdx + i;
    const lx = (idx * spacing) - offset;
    const ly = baseY - 20;

    // White coastal lighthouse tower
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(lx - 12, ly);
    ctx.lineTo(lx - 7, ly - 75);
    ctx.lineTo(lx + 7, ly - 75);
    ctx.lineTo(lx + 12, ly);
    ctx.closePath();
    ctx.fill();

    // Red stripes
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(lx - 10, ly - 50, 20, 14);
    ctx.fillRect(lx - 8, ly - 22, 16, 12);

    // Lantern room & domed cap
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(lx - 9, ly - 88, 18, 13);

    // Rotating lighthouse lantern beam in night mode
    if (night > 0.2) {
      ctx.save();
      ctx.fillStyle = 'rgba(254, 240, 138, 0.35)';
      ctx.beginPath();
      ctx.moveTo(lx, ly - 82);
      ctx.lineTo(lx - 220, ly - 120);
      ctx.lineTo(lx - 200, ly - 40);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Little Sailboat nearby
    const bx = lx + 120;
    const by = ly + 25;
    ctx.fillStyle = '#78350f'; // Hull
    ctx.beginPath();
    ctx.moveTo(bx - 16, by);
    ctx.lineTo(bx + 16, by);
    ctx.lineTo(bx + 10, by + 8);
    ctx.lineTo(bx - 10, by + 8);
    ctx.closePath();
    ctx.fill();

    // White Triangle Sail
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx, by - 26);
    ctx.lineTo(bx + 14, by - 6);
    ctx.closePath();
    ctx.fill();
  }
}

function drawAutumnBarns(
  ctx: CanvasRenderingContext2D,
  w: number,
  baseY: number,
  offset: number,
  night: number
) {
  const spacing = 520;
  const startIdx = Math.floor(offset / spacing);
  const count = Math.ceil(w / spacing) + 2;

  for (let i = 0; i < count; i++) {
    const idx = startIdx + i;
    const bx = (idx * spacing) - offset;
    const by = baseY - 20;

    // Classic Country Red Barn
    ctx.fillStyle = night > 0.5 ? '#450a0a' : '#991b1b';
    ctx.fillRect(bx, by - 40, 52, 40);

    // Gambrel roof
    ctx.fillStyle = night > 0.5 ? '#1c1917' : '#78350f';
    ctx.beginPath();
    ctx.moveTo(bx - 6, by - 40);
    ctx.lineTo(bx + 12, by - 62);
    ctx.lineTo(bx + 40, by - 62);
    ctx.lineTo(bx + 58, by - 40);
    ctx.closePath();
    ctx.fill();

    // White Barn Doors with X brace
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bx + 16, by - 26, 20, 26);
    ctx.beginPath();
    ctx.moveTo(bx + 16, by - 26);
    ctx.lineTo(bx + 36, by);
    ctx.moveTo(bx + 36, by - 26);
    ctx.lineTo(bx + 16, by);
    ctx.stroke();
  }
}

function drawAlpineChalets(
  ctx: CanvasRenderingContext2D,
  w: number,
  baseY: number,
  offset: number,
  night: number
) {
  const spacing = 540;
  const startIdx = Math.floor(offset / spacing);
  const count = Math.ceil(w / spacing) + 2;

  for (let i = 0; i < count; i++) {
    const idx = startIdx + i;
    const cx = (idx * spacing) - offset;
    const cy = baseY - 22;

    // Heavy Timber Log walls
    ctx.fillStyle = night > 0.5 ? '#1c1917' : '#78350f';
    ctx.fillRect(cx, cy - 35, 45, 35);

    // Broad overhang alpine roof with snow
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(cx - 14, cy - 35);
    ctx.lineTo(cx + 22, cy - 58);
    ctx.lineTo(cx + 59, cy - 35);
    ctx.closePath();
    ctx.fill();

    // Cozy yellow window glow in night
    if (night > 0.3) {
      ctx.fillStyle = '#fde047';
      ctx.fillRect(cx + 14, cy - 24, 14, 12);
    }
  }
}

function drawSuspensionBridge(
  ctx: CanvasRenderingContext2D,
  w: number,
  baseY: number,
  offset: number,
  night: number
) {
  const spacing = 800;
  const startIdx = Math.floor(offset / spacing);
  const count = Math.ceil(w / spacing) + 2;

  for (let i = 0; i < count; i++) {
    const idx = startIdx + i;
    const bx = (idx * spacing) - offset;
    const by = baseY - 10;

    // Twin Steel Pylons
    ctx.fillStyle = night > 0.5 ? '#1e293b' : '#334155';
    ctx.fillRect(bx, by - 120, 18, 120);
    ctx.fillRect(bx + 180, by - 120, 18, 120);

    // Cross brace
    ctx.fillRect(bx, by - 70, 198, 10);

    // Suspension Main Cables
    ctx.strokeStyle = night > 0.5 ? '#e2e8f0' : '#64748b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(bx + 9, by - 120);
    ctx.quadraticCurveTo(bx + 99, by - 25, bx + 189, by - 120);
    ctx.stroke();

    // Red Aviation beacons on top of pylons
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(bx + 9, by - 122, 3, 0, Math.PI * 2);
    ctx.arc(bx + 189, by - 122, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ============================================================================
// CANVAS RENDER HELPERS: FOREGROUND BIOMES & SHEEP/TREES
// ============================================================================

function drawForegroundBiome(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  offset: number,
  dt: number,
  night: number,
  biome: BiomeType,
  fireflies: Firefly[]
) {
  ctx.save();
  const fgBaseY = h * 0.77;

  // Foreground rolling pastures
  let fgColor = '#22c55e';
  if (night > 0.5) fgColor = '#022c22';
  if (biome === 'autumn_orchard') fgColor = night > 0.5 ? '#431407' : '#ea580c';
  if (biome === 'river_viaduct') fgColor = night > 0.5 ? '#022c22' : '#059669';
  if (biome === 'metropolis_skyline') fgColor = night > 0.5 ? '#020617' : '#334155';

  ctx.fillStyle = fgColor;
  ctx.beginPath();
  ctx.moveTo(0, fgBaseY);

  const fgStep = 240;
  const startIdx = Math.floor(offset / fgStep);
  const count = Math.ceil(w / fgStep) + 3;

  for (let i = -1; i <= count; i++) {
    const idx = startIdx + i;
    const fx = (idx * fgStep) - offset;
    const wave = Math.sin(idx * 1.8) * 25;
    ctx.quadraticCurveTo(fx - fgStep * 0.5, fgBaseY - 30 + wave, fx, fgBaseY + wave * 0.2);
  }
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  // Biome Foreground Flora & Grazing Fauna:
  if (biome === 'meadow_plain' || biome === 'heritage_village') {
    // Cute fluffy grazing sheep
    drawGrazingSheep(ctx, w, fgBaseY, offset, night);
  } else if (biome === 'alpine_foothills') {
    // Pine trees
    drawPineTrees(ctx, w, fgBaseY, offset, night);
  } else if (biome === 'autumn_orchard') {
    // Golden & amber autumn maples
    drawAutumnTrees(ctx, w, fgBaseY, offset, night);
  } else {
    // Pleasant oak trees
    drawCozyOakTrees(ctx, w, fgBaseY, offset, night);
  }

  // Twinkling Fireflies in Night Mode
  if (night > 0.3) {
    ctx.save();
    fireflies.forEach((f) => {
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      if (f.x < 0) f.x = w;
      if (f.x > w) f.x = 0;
      if (f.y < fgBaseY - 100) f.y = fgBaseY + 40;
      if (f.y > fgBaseY + 60) f.y = fgBaseY - 80;

      const glow = ctx.createRadialGradient(f.x, f.y, 1, f.x, f.y, 8);
      glow.addColorStop(0, 'rgba(250, 204, 21, 0.9)');
      glow.addColorStop(1, 'rgba(250, 204, 21, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(f.x, f.y, 8, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  ctx.restore();
}

function drawGrazingSheep(
  ctx: CanvasRenderingContext2D,
  w: number,
  baseY: number,
  offset: number,
  night: number
) {
  const spacing = 360;
  const startIdx = Math.floor(offset / spacing);
  const count = Math.ceil(w / spacing) + 2;

  for (let i = 0; i < count; i++) {
    const idx = startIdx + i;
    const sx = (idx * spacing) - offset;
    const sy = baseY - 12 + Math.sin(idx) * 8;

    // Sheep wool puff body
    ctx.fillStyle = night > 0.5 ? '#cbd5e1' : '#ffffff';
    ctx.beginPath();
    ctx.arc(sx, sy, 11, 0, Math.PI * 2);
    ctx.arc(sx + 8, sy - 4, 10, 0, Math.PI * 2);
    ctx.arc(sx + 15, sy, 9, 0, Math.PI * 2);
    ctx.fill();

    // Black Head & cute ears
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.ellipse(sx + 22, sy + 3, 5, 4, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // 4 Little matchstick legs
    ctx.strokeStyle = '#1c1917';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx - 3, sy + 8);
    ctx.lineTo(sx - 3, sy + 18);
    ctx.moveTo(sx + 4, sy + 8);
    ctx.lineTo(sx + 4, sy + 18);
    ctx.moveTo(sx + 10, sy + 8);
    ctx.lineTo(sx + 10, sy + 18);
    ctx.moveTo(sx + 16, sy + 8);
    ctx.lineTo(sx + 16, sy + 18);
    ctx.stroke();
  }
}

function drawPineTrees(
  ctx: CanvasRenderingContext2D,
  w: number,
  baseY: number,
  offset: number,
  night: number
) {
  const spacing = 190;
  const startIdx = Math.floor(offset / spacing);
  const count = Math.ceil(w / spacing) + 2;

  for (let i = 0; i < count; i++) {
    const idx = startIdx + i;
    const tx = (idx * spacing) - offset;
    const ty = baseY - 8;

    // Trunk
    ctx.fillStyle = '#451a03';
    ctx.fillRect(tx - 3, ty - 15, 6, 18);

    // 3 Tiered Pine Needle Cones
    ctx.fillStyle = night > 0.5 ? '#064e3b' : '#15803d';
    for (let tier = 0; tier < 3; tier++) {
      const cy = ty - 18 - tier * 16;
      ctx.beginPath();
      ctx.moveTo(tx - 18 + tier * 3, cy + 12);
      ctx.lineTo(tx, cy - 14);
      ctx.lineTo(tx + 18 - tier * 3, cy + 12);
      ctx.closePath();
      ctx.fill();
    }
  }
}

function drawAutumnTrees(
  ctx: CanvasRenderingContext2D,
  w: number,
  baseY: number,
  offset: number,
  night: number
) {
  const spacing = 220;
  const startIdx = Math.floor(offset / spacing);
  const count = Math.ceil(w / spacing) + 2;

  for (let i = 0; i < count; i++) {
    const idx = startIdx + i;
    const tx = (idx * spacing) - offset;
    const ty = baseY - 8;

    // Trunk
    ctx.fillStyle = '#78350f';
    ctx.fillRect(tx - 4, ty - 22, 8, 25);

    // Warm Maple foliage
    const foliageColors = ['#dc2626', '#ea580c', '#d97706', '#b45309'];
    ctx.fillStyle = foliageColors[idx % foliageColors.length];
    ctx.beginPath();
    ctx.arc(tx, ty - 38, 24, 0, Math.PI * 2);
    ctx.arc(tx - 12, ty - 32, 18, 0, Math.PI * 2);
    ctx.arc(tx + 12, ty - 32, 18, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCozyOakTrees(
  ctx: CanvasRenderingContext2D,
  w: number,
  baseY: number,
  offset: number,
  night: number
) {
  const spacing = 260;
  const startIdx = Math.floor(offset / spacing);
  const count = Math.ceil(w / spacing) + 2;

  for (let i = 0; i < count; i++) {
    const idx = startIdx + i;
    const tx = (idx * spacing) - offset;
    const ty = baseY - 8;

    ctx.fillStyle = '#78350f';
    ctx.fillRect(tx - 4, ty - 22, 8, 24);

    ctx.fillStyle = night > 0.5 ? '#065f46' : '#16a34a';
    ctx.beginPath();
    ctx.arc(tx, ty - 36, 22, 0, Math.PI * 2);
    ctx.arc(tx - 10, ty - 30, 16, 0, Math.PI * 2);
    ctx.arc(tx + 10, ty - 30, 16, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ============================================================================
// CANVAS RENDER HELPERS: DYNAMIC STATION PLATFORMS (10 VARIANTS)
// ============================================================================

function drawStationPlatformIfNear(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  offset: number,
  distanceToNextKm: number,
  variant: StationVariant,
  stationName: string,
  night: number
) {
  // Station appears when distance is under 3.5 km
  if (distanceToNextKm > 3.5) return;

  ctx.save();
  const trackBaseY = h * 0.84;
  const platformY = trackBaseY - 28;
  const platformHeight = 28;

  // Station platform scrolls across the window smoothly as distance approaches 0
  const normalizedDistance = Math.max(0, distanceToNextKm) / 3.5; // 1 = far, 0 = at station
  const platformX = (1 - normalizedDistance) * (w * 0.5) - 100;
  const platformWidth = w * 0.85 + 200;

  // 1. Concrete & Brick Platform Slab
  ctx.fillStyle = night > 0.5 ? '#1f2937' : '#e2e8f0';
  ctx.fillRect(platformX, platformY, platformWidth, platformHeight);

  // Yellow tactile warning edge
  ctx.fillStyle = '#eab308';
  ctx.fillRect(platformX, platformY, platformWidth, 4);

  // Platform tactile tiles hatch
  ctx.fillStyle = '#ca8a04';
  for (let tx = platformX; tx < platformX + platformWidth; tx += 18) {
    ctx.fillRect(tx, platformY, 3, 4);
  }

  // 2. Station Architectural Canopy / Building based on 10 variants
  drawStationArchitecture(ctx, platformX, platformY, platformWidth, variant, stationName, night);

  // 3. Waiting Passenger Silhouettes & Luggage Stacks
  drawStationPassengersAndLuggage(ctx, platformX, platformY, night);

  ctx.restore();
}

function drawStationArchitecture(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  pWidth: number,
  variant: StationVariant,
  stationName: string,
  night: number
) {
  const canopyHeight = 90;

  // Platform Support Pillars
  ctx.fillStyle = night > 0.5 ? '#334155' : '#475569';
  const pillarSpacing = 160;
  for (let col = px + 40; col < px + pWidth; col += pillarSpacing) {
    ctx.fillRect(col, py - canopyHeight, 8, canopyHeight);

    // Decorative corbel brackets
    ctx.beginPath();
    ctx.moveTo(col - 12, py - canopyHeight);
    ctx.lineTo(col + 20, py - canopyHeight);
    ctx.lineTo(col + 4, py - canopyHeight + 16);
    ctx.closePath();
    ctx.fill();

    // Warm Platform Lanterns hanging from pillars
    drawPlatformLantern(ctx, col + 12, py - canopyHeight + 25, night);
  }

  // Variant-specific canopy styling:
  switch (variant) {
    case 'grand_victorian_terminal': {
      // Arched glass canopy
      ctx.fillStyle = night > 0.5 ? 'rgba(30, 41, 59, 0.9)' : 'rgba(241, 245, 249, 0.9)';
      ctx.fillRect(px, py - canopyHeight - 15, pWidth, 16);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3;
      for (let arcX = px; arcX < px + pWidth; arcX += 90) {
        ctx.beginPath();
        ctx.arc(arcX + 45, py - canopyHeight - 15, 45, Math.PI, 0);
        ctx.stroke();
      }
      break;
    }

    case 'alpine_timber_chalet': {
      // Carved wood gabled roof
      ctx.fillStyle = '#78350f';
      ctx.fillRect(px, py - canopyHeight - 12, pWidth, 14);
      ctx.fillStyle = '#ffffff'; // snow crest
      ctx.fillRect(px, py - canopyHeight - 16, pWidth, 4);
      break;
    }

    case 'coastal_harbor_pier': {
      // Weathered boardwalk wood slats
      ctx.fillStyle = '#713f12';
      ctx.fillRect(px, py - canopyHeight - 10, pWidth, 12);
      break;
    }

    case 'modern_metro_spire': {
      // Cantilevered futuristic glass and white steel
      ctx.fillStyle = night > 0.5 ? '#0f172a' : '#f8fafc';
      ctx.fillRect(px, py - canopyHeight - 20, pWidth, 18);
      ctx.fillStyle = '#38bdf8'; // Glowing neon route trim
      ctx.fillRect(px, py - canopyHeight - 2, pWidth, 3);
      break;
    }

    default: {
      // Classic red brick country canopy
      ctx.fillStyle = '#b45309';
      ctx.fillRect(px, py - canopyHeight - 14, pWidth, 15);
      break;
    }
  }

  // Station Nameboard Sign (Prominently displays the authentic station name!)
  const signX = px + 120;
  const signY = py - canopyHeight + 40;
  ctx.fillStyle = '#1c1917';
  ctx.fillRect(signX - 10, signY - 14, 180, 28);
  ctx.strokeStyle = '#f8f7f4';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(signX - 10, signY - 14, 180, 28);

  ctx.fillStyle = '#f8f7f4';
  ctx.font = 'bold 11px "Space Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(stationName.toUpperCase(), signX + 80, signY + 4);

  // Station Platform Clock
  const clockX = px + 340;
  const clockY = py - canopyHeight + 40;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(clockX, clockY, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#1c1917';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Clock hands
  ctx.beginPath();
  ctx.moveTo(clockX, clockY);
  ctx.lineTo(clockX, clockY - 8);
  ctx.moveTo(clockX, clockY);
  ctx.lineTo(clockX + 6, clockY);
  ctx.stroke();
}

function drawPlatformLantern(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  night: number
) {
  // Brass lantern fixture
  ctx.fillStyle = '#d97706';
  ctx.fillRect(x - 3, y - 8, 6, 12);

  // Warm glowing radial halo in night mode
  if (night > 0.2) {
    const lampGlow = ctx.createRadialGradient(x, y, 2, x, y, 40);
    lampGlow.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
    lampGlow.addColorStop(0.5, 'rgba(245, 158, 11, 0.35)');
    lampGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = lampGlow;
    ctx.beginPath();
    ctx.arc(x, y, 40, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawStationPassengersAndLuggage(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  night: number
) {
  // Silhouette passenger figures waiting on platform
  const people = [
    { x: px + 80, hat: true },
    { x: px + 105, hat: false },
    { x: px + 260, hat: true },
    { x: px + 440, hat: false },
  ];

  ctx.fillStyle = night > 0.5 ? '#0f172a' : '#1e293b';

  people.forEach((p) => {
    // Body
    ctx.fillRect(p.x - 3, py - 26, 6, 26);
    // Head
    ctx.beginPath();
    ctx.arc(p.x, py - 31, 4, 0, Math.PI * 2);
    ctx.fill();
    // Hat
    if (p.hat) {
      ctx.fillRect(p.x - 6, py - 36, 12, 2.5);
      ctx.fillRect(p.x - 4, py - 40, 8, 4);
    }
  });

  // Vintage Luggage stack
  ctx.fillStyle = '#78350f';
  ctx.fillRect(px + 140, py - 10, 16, 10);
  ctx.fillStyle = '#92400e';
  ctx.fillRect(px + 142, py - 18, 12, 8);
}

// ============================================================================
// CANVAS RENDER HELPERS: RAILWAY TRACK & GRAVEL BALLAST
// ============================================================================

function drawRailwayTrack(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  offset: number,
  speedKmH: number,
  night: number
) {
  ctx.save();
  const trackBaseY = h * 0.84;

  // Gravel Ballast Bed
  ctx.fillStyle = night > 0.5 ? '#0f172a' : '#334155';
  ctx.fillRect(0, trackBaseY, w, h - trackBaseY);

  // Ballast stone texture speckles
  ctx.fillStyle = night > 0.5 ? '#020617' : '#1e293b';
  for (let i = 0; i < w; i += 34) {
    const gx = ((i - offset * 1.8) % w + w) % w;
    ctx.fillRect(gx, trackBaseY + 6, 7, 4);
    ctx.fillRect((gx + 17) % w, trackBaseY + 24, 8, 5);
  }

  // Wooden Sleepers / Ties passing rapidly
  const tieSpacing = 44;
  const startIdx = Math.floor(offset / tieSpacing);
  const count = Math.ceil(w / tieSpacing) + 2;

  ctx.fillStyle = night > 0.5 ? '#1e293b' : '#64748b';
  for (let i = 0; i < count; i++) {
    const idx = startIdx + i;
    const tx = (idx * tieSpacing) - offset;
    ctx.fillRect(tx, trackBaseY + 48, 22, 14);
  }

  // Dual Steel Rails
  const rail1Y = trackBaseY + 54;
  const rail2Y = trackBaseY + 62;
  ctx.strokeStyle = night > 0.5 ? '#475569' : '#94a3b8';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, rail1Y);
  ctx.lineTo(w, rail1Y);
  ctx.moveTo(0, rail2Y);
  ctx.lineTo(w, rail2Y);
  ctx.stroke();

  // Passing trackside wildflowers in daytime
  if (night < 0.5) {
    const flowerSpacing = 110;
    const fStart = Math.floor(offset / flowerSpacing);
    const fCount = Math.ceil(w / flowerSpacing) + 2;

    ctx.fillStyle = '#fbbf24';
    for (let i = 0; i < fCount; i++) {
      const idx = fStart + i;
      const fx = (idx * flowerSpacing) - offset;
      const blur = Math.min(50, speedKmH * 0.35);
      ctx.beginPath();
      ctx.ellipse(fx, trackBaseY + 22, 12 + blur, 7, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

// ============================================================================
// CANVAS RENDER HELPERS: SECTIONAL TUNNEL TRANSITION
// ============================================================================

function drawTunnelTransition(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  darkness: number,
  trackOffset: number
) {
  ctx.save();
  ctx.fillStyle = `rgba(10, 8, 16, ${darkness})`;
  ctx.fillRect(0, 0, w, h);

  // Passing illuminated brick tunnel lanterns & masonry ribs
  if (darkness > 0.4) {
    const lightSpacing = 320;
    const lightX = w - ((trackOffset * 1.6) % (w + lightSpacing));

    // Radial amber glow
    const lanternGlow = ctx.createRadialGradient(lightX, h * 0.38, 8, lightX, h * 0.38, 140);
    lanternGlow.addColorStop(0, 'rgba(253, 224, 71, 0.9)');
    lanternGlow.addColorStop(0.4, 'rgba(234, 179, 8, 0.3)');
    lanternGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = lanternGlow;
    ctx.beginPath();
    ctx.arc(lightX, h * 0.38, 140, 0, Math.PI * 2);
    ctx.fill();

    // Solid lantern lamp
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(lightX - 8, h * 0.36, 16, 22);

    // Stone Tunnel Arch Ring overhead
    ctx.strokeStyle = 'rgba(75, 85, 99, 0.35)';
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.ellipse(w / 2, h * 0.4, w * 0.6, h * 0.45, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawGlassVignette(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  night: number
) {
  ctx.save();
  const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.45, w / 2, h / 2, Math.max(w, h) * 0.75);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
  grad.addColorStop(1, night > 0.5 ? 'rgba(0, 0, 0, 0.45)' : 'rgba(0, 0, 0, 0.12)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}
