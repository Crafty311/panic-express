import React, { useEffect, useRef } from 'react';

interface TrainWindowCanvasProps {
  speedKmH: number;
  tunnelActive?: boolean;
  weather?: 'sunny' | 'sunset' | 'rainy' | 'starlit';
}

interface Cloud {
  x: number;
  y: number;
  size: number;
  speed: number;
}

interface Sheep {
  worldX: number;
  yOffset: number;
  chewingTimer: number;
}

export const TrainWindowCanvas: React.FC<TrainWindowCanvasProps> = ({
  speedKmH,
  tunnelActive = false,
  weather = 'sunny',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Parallax offsets
  const skyOffsetRef = useRef(0);
  const mountainOffsetRef = useRef(0);
  const midHillOffsetRef = useRef(0);
  const foreHillOffsetRef = useRef(0);
  const trackOffsetRef = useRef(0);

  // Tunnel darkness overlay animation (0 = bright outside, 1 = inside dark tunnel)
  const tunnelDarknessRef = useRef(0);

  // Clouds & Sheep
  const cloudsRef = useRef<Cloud[]>([]);
  const sheepRef = useRef<Sheep[]>([]);

  // Animation frame
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  // Setup initial clouds and sheep
  useEffect(() => {
    const clouds: Cloud[] = [];
    for (let i = 0; i < 7; i++) {
      clouds.push({
        x: Math.random() * 2000,
        y: 60 + Math.random() * 120,
        size: 80 + Math.random() * 90,
        speed: 15 + Math.random() * 20,
      });
    }
    cloudsRef.current = clouds;

    const sheepList: Sheep[] = [];
    for (let i = 0; i < 12; i++) {
      sheepList.push({
        worldX: i * 380 + Math.random() * 150,
        yOffset: Math.random() * 25,
        chewingTimer: Math.random() * Math.PI * 2,
      });
    }
    sheepRef.current = sheepList;
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

      // Parallax scroll speeds based on train speed
      const pxPerSec = (speedKmH / 100) * 850;
      const fgSpeed = pxPerSec * dt;
      const midSpeed = pxPerSec * 0.4 * dt;
      const mtSpeed = pxPerSec * 0.12 * dt;
      const skySpeed = pxPerSec * 0.02 * dt;

      trackOffsetRef.current = (trackOffsetRef.current + fgSpeed) % 4000;
      foreHillOffsetRef.current = (foreHillOffsetRef.current + fgSpeed * 0.7) % 4000;
      midHillOffsetRef.current = (midHillOffsetRef.current + midSpeed) % 4000;
      mountainOffsetRef.current = (mountainOffsetRef.current + mtSpeed) % 4000;
      skyOffsetRef.current = (skyOffsetRef.current + skySpeed) % 4000;

      // Update tunnel darkness transition
      const targetDarkness = tunnelActive ? 0.94 : 0;
      tunnelDarknessRef.current += (targetDarkness - tunnelDarknessRef.current) * Math.min(1, dt * 10);

      // Clear Canvas
      ctx.clearRect(0, 0, width, height);

      // 1. SKY GRADIENT (Soft cozy itch.io palette)
      drawCozySky(ctx, width, height, weather);

      // 2. FLUFFY DRIFTING CLOUDS
      drawFluffyClouds(ctx, width, cloudsRef.current, dt, skySpeed);

      // 3. DISTANT PASTEL MOUNTAINS
      drawDistantMountains(ctx, width, height, mountainOffsetRef.current, weather);

      // 4. MIDGROUND ROLLING HILLS & WINDMILLS
      drawMidgroundHills(ctx, width, height, midHillOffsetRef.current, weather);

      // 5. FOREGROUND LUSH GREEN HILLS WITH SHEEP & COZY TREES
      drawForegroundHills(ctx, width, height, foreHillOffsetRef.current, sheepRef.current, dt);

      // 6. SPEEDING RAILWAY TRACK & GRAVEL BALLAST
      drawTrackside(ctx, width, height, trackOffsetRef.current, speedKmH);

      // 7. TUNNEL TRANSITION OVERLAY
      if (tunnelDarknessRef.current > 0.01) {
        ctx.fillStyle = `rgba(18, 14, 28, ${tunnelDarknessRef.current})`;
        ctx.fillRect(0, 0, width, height);

        // Brick tunnel lights passing
        if (tunnelDarknessRef.current > 0.5) {
          const lightSpacing = 280;
          const lightX = width - ((trackOffsetRef.current * 1.5) % (width + lightSpacing));
          ctx.save();
          const lanternGlow = ctx.createRadialGradient(lightX, height * 0.35, 10, lightX, height * 0.35, 120);
          lanternGlow.addColorStop(0, 'rgba(253, 224, 71, 0.85)');
          lanternGlow.addColorStop(0.5, 'rgba(234, 179, 8, 0.3)');
          lanternGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = lanternGlow;
          ctx.beginPath();
          ctx.arc(lightX, height * 0.35, 120, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#fef08a';
          ctx.fillRect(lightX - 8, height * 0.33, 16, 22);
          ctx.restore();
        }
      }

      // 8. COZY GLASS VIGNETTE (Gentle rounded corner glare)
      drawWindowVignette(ctx, width, height);

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [speedKmH, tunnelActive, weather]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-[#86efac] select-none pointer-events-auto">
      <canvas
        ref={canvasRef}
        width={1920}
        height={1080}
        className="w-full h-full object-cover"
      />
    </div>
  );
};

// ----------------- COZY RENDER HELPERS -----------------

function drawCozySky(ctx: CanvasRenderingContext2D, w: number, h: number, weather: string) {
  const grad = ctx.createLinearGradient(0, 0, 0, h * 0.7);

  if (weather === 'sunset') {
    grad.addColorStop(0, '#f43f5e'); // Rose
    grad.addColorStop(0.35, '#fb923c'); // Warm peach
    grad.addColorStop(0.7, '#fef08a'); // Soft yellow
    grad.addColorStop(1, '#fed7aa');
  } else if (weather === 'rainy') {
    grad.addColorStop(0, '#64748b');
    grad.addColorStop(0.5, '#94a3b8');
    grad.addColorStop(1, '#cbd5e1');
  } else if (weather === 'starlit') {
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.6, '#1e1b4b');
    grad.addColorStop(1, '#312e81');
  } else {
    // Sunny & delightful
    grad.addColorStop(0, '#38bdf8'); // Sky blue
    grad.addColorStop(0.45, '#7dd3fc');
    grad.addColorStop(0.85, '#bae6fd');
    grad.addColorStop(1, '#f0fdf4');
  }

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Cheerful Sun
  if (weather !== 'rainy' && weather !== 'starlit') {
    ctx.save();
    const sunX = w * 0.78;
    const sunY = h * 0.2;

    // Sun warm aura
    const sunGlow = ctx.createRadialGradient(sunX, sunY, 20, sunX, sunY, 80);
    sunGlow.addColorStop(0, 'rgba(254, 240, 138, 0.85)');
    sunGlow.addColorStop(0.5, 'rgba(253, 224, 71, 0.25)');
    sunGlow.addColorStop(1, 'rgba(253, 224, 71, 0)');
    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 80, 0, Math.PI * 2);
    ctx.fill();

    // Cute solid sun circle
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(sunX, sunY, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawFluffyClouds(
  ctx: CanvasRenderingContext2D,
  w: number,
  clouds: Cloud[],
  dt: number,
  trainSpeed: number
) {
  ctx.save();
  ctx.fillStyle = '#ffffff';

  clouds.forEach((c) => {
    c.x -= (c.speed * dt + trainSpeed * 0.5);
    if (c.x < -200) {
      c.x = w + 200;
      c.y = 50 + Math.random() * 140;
    }

    // Kenney / neal.fun fluffy cloud shapes
    const s = c.size;
    ctx.beginPath();
    ctx.arc(c.x, c.y, s * 0.35, 0, Math.PI * 2);
    ctx.arc(c.x + s * 0.35, c.y - s * 0.12, s * 0.45, 0, Math.PI * 2);
    ctx.arc(c.x + s * 0.75, c.y, s * 0.38, 0, Math.PI * 2);
    ctx.arc(c.x + s * 0.35, c.y + s * 0.1, s * 0.35, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
  });

  ctx.restore();
}

function drawDistantMountains(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  offset: number,
  weather: string
) {
  ctx.save();
  const baseY = h * 0.62;

  let mtColor = '#93c5fd';
  if (weather === 'sunset') mtColor = '#c084fc';

  ctx.fillStyle = mtColor;
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(0, baseY);

  const step = 60;
  for (let x = 0; x <= w + step; x += step) {
    const worldX = x + offset;
    const y = baseY - 110 * Math.sin(worldX * 0.0022) - 45 * Math.cos(worldX * 0.005);
    ctx.lineTo(x, y);
  }

  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();

  // White snowy mountain peaks
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(0, h);
  for (let x = 0; x <= w + step; x += step) {
    const worldX = x + offset;
    const y = baseY - 110 * Math.sin(worldX * 0.0022) - 45 * Math.cos(worldX * 0.005);
    if (y < baseY - 90) {
      ctx.lineTo(x, y);
    } else {
      ctx.lineTo(x, baseY - 75);
    }
  }
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawMidgroundHills(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  offset: number,
  weather: string
) {
  ctx.save();
  const midBaseY = h * 0.74;

  let hillColor = '#86efac'; // Fresh pastel green
  if (weather === 'sunset') hillColor = '#f59e0b'; // Amber

  ctx.fillStyle = hillColor;
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

  // Draw Cute Windmills turning on the hilltops
  const spacing = 360;
  const startIdx = Math.floor(offset / spacing);
  const count = Math.ceil(w / spacing) + 2;

  for (let i = 0; i < count; i++) {
    const idx = startIdx + i;
    const wx = (idx * spacing) - offset;
    const worldX = idx * spacing;
    const wy = midBaseY - 60 * Math.sin(worldX * 0.0035) - 25 * Math.cos(worldX * 0.008);

    drawCuteWindmill(ctx, wx, wy, 44, offset);
  }

  ctx.restore();
}

function drawCuteWindmill(ctx: CanvasRenderingContext2D, x: number, y: number, height: number, timeRef: number) {
  ctx.save();
  // White tower body
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(x - 12, y);
  ctx.lineTo(x - 6, y - height);
  ctx.lineTo(x + 6, y - height);
  ctx.lineTo(x + 12, y);
  ctx.closePath();
  ctx.fill();

  // Orange cone roof
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.moveTo(x - 8, y - height);
  ctx.lineTo(x, y - height - 12);
  ctx.lineTo(x + 8, y - height);
  ctx.closePath();
  ctx.fill();

  // Spinning blades
  const angle = (timeRef * 0.025) % (Math.PI * 2);
  const cx = x;
  const cy = y - height + 4;

  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';

  for (let b = 0; b < 4; b++) {
    const a = angle + (b * Math.PI) / 2;
    const bx = cx + Math.cos(a) * 26;
    const by = cy + Math.sin(a) * 26;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(bx, by);
    ctx.stroke();
  }

  ctx.restore();
}

function drawForegroundHills(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  offset: number,
  sheepList: Sheep[],
  dt: number
) {
  ctx.save();
  const fgBaseY = h * 0.82;

  // Lush vibrant foreground green
  ctx.fillStyle = '#4ade80';
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(0, fgBaseY);

  const step = 30;
  for (let x = 0; x <= w + step; x += step) {
    const worldX = x + offset;
    const y = fgBaseY - 45 * Math.sin(worldX * 0.004) - 15 * Math.cos(worldX * 0.009);
    ctx.lineTo(x, y);
  }

  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();

  // Draw Cute Fluffy Sheep grazing on the pasture
  sheepList.forEach((s) => {
    s.chewingTimer += dt * 3;
    const screenX = s.worldX - offset;
    if (screenX > -50 && screenX < w + 50) {
      const hillY = fgBaseY - 45 * Math.sin(s.worldX * 0.004) - 15 * Math.cos(s.worldX * 0.009);
      drawCuteSheep(ctx, screenX, hillY - 8 + s.yOffset, s.chewingTimer);
    }
  });

  // Draw Round Cozy Trees
  const treeSpacing = 240;
  const tStart = Math.floor(offset / treeSpacing);
  const tCount = Math.ceil(w / treeSpacing) + 2;

  for (let i = 0; i < tCount; i++) {
    const idx = tStart + i;
    const tx = (idx * treeSpacing) - offset;
    const worldX = idx * treeSpacing;
    const ty = fgBaseY - 45 * Math.sin(worldX * 0.004) - 15 * Math.cos(worldX * 0.009);

    drawCozyTree(ctx, tx, ty, 42);
  }

  ctx.restore();
}

function drawCuteSheep(ctx: CanvasRenderingContext2D, x: number, y: number, chewTimer: number) {
  ctx.save();
  // Fluffy white body
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x, y, 10, 0, Math.PI * 2);
  ctx.arc(x + 8, y - 2, 8, 0, Math.PI * 2);
  ctx.arc(x - 7, y - 2, 8, 0, Math.PI * 2);
  ctx.fill();

  // Little black face
  ctx.fillStyle = '#1e293b';
  const chewOffset = Math.sin(chewTimer) * 1.5;
  ctx.beginPath();
  ctx.arc(x + 14, y - 3 + chewOffset, 5, 0, Math.PI * 2);
  ctx.fill();

  // Little black legs
  ctx.fillRect(x - 6, y + 8, 2.5, 6);
  ctx.fillRect(x + 4, y + 8, 2.5, 6);
  ctx.restore();
}

function drawCozyTree(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  // Trunk
  ctx.fillStyle = '#78350f';
  ctx.fillRect(x - 3, y - size * 0.7, 6, size * 0.7);

  // Round Kenney / neal.fun canopy
  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.arc(x, y - size * 0.8, size * 0.45, 0, Math.PI * 2);
  ctx.fill();

  // Highlight
  ctx.fillStyle = '#86efac';
  ctx.beginPath();
  ctx.arc(x - size * 0.1, y - size * 0.9, size * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawTrackside(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  offset: number,
  speedKmH: number
) {
  ctx.save();
  const trackBaseY = h * 0.84;

  // Track gravel bed
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(0, trackBaseY, w, h - trackBaseY);

  // Ties / Sleepers passing fast
  const tieSpacing = 44;
  const startIdx = Math.floor(offset / tieSpacing);
  const count = Math.ceil(w / tieSpacing) + 2;

  ctx.fillStyle = '#64748b';
  for (let i = 0; i < count; i++) {
    const idx = startIdx + i;
    const tx = (idx * tieSpacing) - offset;
    ctx.fillRect(tx, trackBaseY + 50, 22, 14);
  }

  // Steel Rail
  const railY = trackBaseY + 56;
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(0, railY);
  ctx.lineTo(w, railY);
  ctx.stroke();

  // Fast passing wildflowers in immediate foreground
  const flowerSpacing = 120;
  const fStart = Math.floor(offset / flowerSpacing);
  const fCount = Math.ceil(w / flowerSpacing) + 2;

  ctx.fillStyle = '#fbbf24';
  for (let i = 0; i < fCount; i++) {
    const idx = fStart + i;
    const fx = (idx * flowerSpacing) - offset;
    const blur = Math.min(60, speedKmH * 0.35);
    ctx.beginPath();
    ctx.ellipse(fx, trackBaseY + 22, 12 + blur, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawWindowVignette(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  // Soft gentle glass corner sheen (barely visible, creates comfortable depth)
  const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.45, w / 2, h / 2, Math.max(w, h) * 0.7);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.08)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}
