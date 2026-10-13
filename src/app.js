
import {
  CHALLENGES,
  MECHANICS,
  SAVE_KEY,
  MEMORY_SYMBOLS,
  STATIONS,
  UPGRADES,
  freshSave,
  validSave,
  normalizeSave,
  updateAfterRound,
  advanceRoute,
  pickupPassengers,
  consumeFuel,
  refuelTrain,
  upgradeCost,
  buyUpgrade,
  makeChoiceOptions,
  makeMemorySequence,
  shuffleChallenges
} from './game-core.js';

const $ = id => document.getElementById(id);

let save = loadSave();
let mode = 'endless';
let queue = [];
let queueIndex = 0;
let score = 0;
let streak = 0;
let bestRunStreak = 0;
let lives = 3;
let roundTimer = null;
let raf = null;
let startedAt = 0;
let remaining = 0;
let current = null;
let locked = false;
let paused = false;
let roundsPlayed = 0;
let runCoins = 0;
let timeoutIds = [];
let sequenceInput = [];
let memoryShown = true;
let timingPos = 0;
let timingDirection = 1;
let timingLoop = null;
let holdTimer = null;
let reactionReady = false;
let reactionStart = 0;
let soundContext = null;
let lastWon = false;
let fuelStopped = false;
let boardedStationIndex = Number.isInteger(save.lastBoardedStation)
  ? save.lastBoardedStation
  : null;

const ROUTE_LENGTH = 1000;
const FUEL_PER_CHALLENGE = 1;

function loadSave() {
  try {
    const data = JSON.parse(localStorage.getItem(SAVE_KEY));
    return validSave(data) ? normalizeSave(data) : freshSave();
  } catch {
    return freshSave();
  }
}

function persist() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {}
  renderStats();
  renderJourney();
}

function applySaveResult(result) {
  if (result && result.save && typeof result.save === 'object') {
    save = result.save;
  } else if (
    result &&
    typeof result === 'object' &&
    Array.isArray(result.completed) &&
    'coins' in result
  ) {
    save = result;
  }
  return result;
}

function renderStats() {
  $('best-score').textContent = save.highScore;
  $('hero-best').textContent = `${save.highScore} pts`;
  $('completed-count').textContent = `${save.completed.length} / 100`;
  $('campaign-progress').textContent = `${save.completed.length}/100`;
  $('sound-toggle').setAttribute('aria-pressed', String(save.sound));
}

function toast(message) {
  const element = $('toast');
  if (!element) return;

  element.textContent = message;
  element.classList.add('show');
  clearTimeout(element._timer);

  element._timer = setTimeout(
    () => element.classList.remove('show'),
    2600
  );
}

function tone(frequency = 440, duration = 0.07) {
  if (!save.sound) return;

  try {
    soundContext ||= new (
      window.AudioContext || window.webkitAudioContext
    )();

    if (soundContext.state === 'suspended') {
      soundContext.resume();
    }

    const oscillator = soundContext.createOscillator();
    const gain = soundContext.createGain();

    oscillator.type = 'triangle';
    oscillator.frequency.value = frequency;

    gain.gain.setValueAtTime(0.0001, soundContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.035,
      soundContext.currentTime + 0.012
    );
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      soundContext.currentTime + duration
    );

    oscillator.connect(gain);
    gain.connect(soundContext.destination);

    oscillator.start();
    oscillator.stop(soundContext.currentTime + duration + 0.02);
  } catch {}
}

function clearTimers() {
  clearInterval(roundTimer);
  cancelAnimationFrame(raf);
  clearInterval(timingLoop);
  clearInterval(holdTimer);

  timeoutIds.forEach(clearTimeout);
  timeoutIds = [];

  roundTimer = null;
  raf = null;
  timingLoop = null;
  holdTimer = null;
}

function showOnly(id) {
  ['play-panel', 'result-panel', 'campaign-panel'].forEach(panelId => {
    $(panelId).classList.toggle('hidden', panelId !== id);
  });

  $('home').querySelector('.hero').classList.toggle('hidden', id !== 'home');
  $('home').querySelector('.lower-grid').classList.toggle('hidden', id !== 'home');
  $('home').querySelector('.footer').classList.toggle(
    'hidden',
    id === 'play-panel'
  );

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* -------------------------------------------------------
   TRAIN INTERFACE
   The interface is generated here, so index.html does
   not need extra train-specific elements.
------------------------------------------------------- */

function installTrainStyles() {
  if ($('train-extra-styles')) return;

  const style = document.createElement('style');
  style.id = 'train-extra-styles';

  style.textContent = `
    .journey-panel {
      margin-bottom: 22px;
      padding: 15px;
      border: 1px solid #ffffff19;
      border-radius: 19px;
      background: linear-gradient(145deg,#14242d,#1b303a);
      overflow: hidden;
    }

    .journey-heading {
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:12px;
      margin-bottom:12px;
    }

    .journey-heading h3 {
      margin:5px 0 0;
      font:700 18px 'Space Grotesk',sans-serif;
    }

    .journey-heading p {
      margin:4px 0 0;
      color:var(--muted);
      font-size:11px;
    }

    .journey-chip {
      border:1px solid #526b70;
      background:#263d45;
      color:var(--mint);
      padding:8px 10px;
      border-radius:10px;
      font:500 9px 'DM Mono',monospace;
      white-space:nowrap;
    }

    .train-window-frame {
      position:relative;
      height:clamp(155px,25vw,245px);
      min-height:155px;
      border:9px solid #26353a;
      border-bottom-width:15px;
      border-radius:22px 22px 13px 13px;
      overflow:hidden;
      background:#92c5d2;
      box-shadow:inset 0 0 0 3px #71888a,0 8px 0 #0e1b22;
      isolation:isolate;
    }

    .train-window-frame:before {
      content:'';
      position:absolute;
      z-index:4;
      inset:0;
      pointer-events:none;
      border:3px solid #61777b;
      border-radius:12px;
      box-shadow:inset 0 0 25px #0c1d2550;
    }

    .train-sky {
      position:absolute;
      inset:0;
      overflow:hidden;
      background:linear-gradient(
        180deg,#84c9e0 0%,#b8e1df 48%,#e6d5a0 49%,#8fae7e 100%
      );
    }

    .train-sun {
      position:absolute;
      width:45px;
      height:45px;
      right:13%;
      top:12%;
      border-radius:50%;
      background:#ffe5a0;
      box-shadow:0 0 0 12px #ffe5a022,0 0 30px #ffe5a044;
    }

    .train-cloud {
      position:absolute;
      width:75px;
      height:16px;
      border-radius:30px;
      background:#f3fbf1d9;
      top:25%;
      left:14%;
      animation:trainCloudMove 28s linear infinite;
    }

    .train-cloud:before,.train-cloud:after {
      content:'';
      position:absolute;
      bottom:5px;
      width:29px;
      height:24px;
      border-radius:50%;
      background:inherit;
    }

    .train-cloud:before {left:13px}
    .train-cloud:after {right:10px;width:23px;height:20px}

    .train-cloud.cloud-two {
      left:66%;
      top:15%;
      transform:scale(.72);
      animation-duration:37s;
      animation-delay:-17s;
    }

    .train-hills {
      position:absolute;
      bottom:21%;
      left:-5%;
      width:115%;
      height:40%;
      background:#82a98b;
      clip-path:polygon(0 75%,12% 22%,25% 65%,38% 12%,52% 70%,68% 23%,82% 61%,93% 17%,100% 60%,100% 100%,0 100%);
      animation:trainHillMove 32s linear infinite;
    }

    .train-hills.far {
      bottom:27%;
      opacity:.55;
      background:#5e9586;
      transform:translateX(18%);
      animation-duration:46s;
      animation-direction:reverse;
    }

    .train-field {
      position:absolute;
      bottom:0;
      left:-5%;
      width:115%;
      height:37%;
      background:linear-gradient(180deg,#8caa6f,#4f8264);
      animation:trainFieldMove 12s linear infinite;
    }

    .train-track {
      position:absolute;
      z-index:2;
      left:-10%;
      bottom:5%;
      width:120%;
      height:16%;
      border-top:5px solid #d3c4a0;
      background:repeating-linear-gradient(
        90deg,transparent 0 23px,#5b5145 23px 30px,transparent 30px 45px
      );
      transform:perspective(90px) rotateX(18deg);
    }

    .train-pole {
      position:absolute;
      z-index:3;
      bottom:8%;
      left:25%;
      height:69%;
      width:5px;
      background:#3b5d59;
      box-shadow:4px 0 0 #c5b68a;
      animation:trainPoleMove 8s linear infinite;
    }

    .train-pole:after {
      content:'';
      position:absolute;
      top:12%;
      left:-20px;
      width:45px;
      height:4px;
      background:#3b5d59;
    }

    .train-tree {
      position:absolute;
      z-index:2;
      bottom:18%;
      left:42%;
      width:9px;
      height:63px;
      background:#5a5940;
      transform-origin:bottom;
      animation:trainTreeMove 10s linear infinite;
    }

    .train-tree:before {
      content:'';
      position:absolute;
      width:0;
      height:0;
      left:-23px;
      top:-39px;
      border-left:27px solid transparent;
      border-right:27px solid transparent;
      border-bottom:48px solid #396f59;
    }

    .train-tree.tree-two {
      left:79%;
      transform:scale(.72);
      animation-delay:-5s;
      animation-duration:7s;
    }

    .train-window-label {
      position:absolute;
      z-index:5;
      left:13px;
      top:12px;
      padding:7px 9px;
      border-radius:8px;
      background:#11242dbb;
      color:#fff2cf;
      font:500 9px 'DM Mono',monospace;
      letter-spacing:.08em;
    }

    .train-window-speed {
      position:absolute;
      z-index:5;
      right:13px;
      bottom:12px;
      padding:7px 9px;
      border-radius:8px;
      background:#11242dbb;
      color:#e1f4e7;
      font:500 9px 'DM Mono',monospace;
    }

    .journey-metrics {
      display:grid;
      grid-template-columns:repeat(4,minmax(0,1fr));
      gap:8px;
      margin-top:14px;
    }

    .journey-metric {
      min-width:0;
      border:1px solid #ffffff13;
      border-radius:11px;
      background:#0e2029a8;
      padding:10px;
    }

    .journey-metric small {
      display:block;
      color:var(--muted);
      font:500 8px 'DM Mono',monospace;
      letter-spacing:.07em;
      text-transform:uppercase;
    }

    .journey-metric strong {
      display:block;
      margin-top:6px;
      font:700 16px 'Space Grotesk',sans-serif;
      color:var(--mint);
      overflow-wrap:anywhere;
    }

    .journey-metric strong.fuel-low {color:var(--coral)}

    .journey-bar {
      height:7px;
      margin-top:8px;
      overflow:hidden;
      border-radius:20px;
      background:#0b171e;
    }

    .journey-bar span {
      display:block;
      height:100%;
      border-radius:20px;
      background:var(--mint);
      transition:width .25s;
    }

    .journey-bar.fuel-track span {background:var(--yellow)}
    .journey-bar.fuel-track.low span {background:var(--coral)}

    .journey-subsection {
      margin-top:14px;
      padding-top:13px;
      border-top:1px solid #ffffff12;
    }

    .journey-subheading {
      display:flex;
      justify-content:space-between;
      align-items:center;
      gap:8px;
      margin-bottom:9px;
      font:500 9px 'DM Mono',monospace;
      color:var(--muted);
      letter-spacing:.08em;
      text-transform:uppercase;
    }

    .passenger-list {
      display:flex;
      flex-wrap:wrap;
      gap:7px;
      min-height:24px;
    }

    .passenger-ticket {
      display:flex;
      align-items:center;
      gap:7px;
      border:1px solid #3f625c;
      border-radius:9px;
      background:#1d3938;
      color:#e2f6e7;
      padding:7px 9px;
      font-size:10px;
    }

    .passenger-ticket strong {color:var(--yellow)}

    .journey-actions {
      display:flex;
      flex-wrap:wrap;
      gap:8px;
      margin-top:12px;
    }

    .journey-action {
      border:1px solid #50666d;
      border-radius:10px;
      background:#263d46;
      color:var(--ink);
      padding:10px 12px;
      font-size:11px;
      font-weight:800;
    }

    .journey-action.primary {
      border-color:var(--mint);
      background:var(--mint);
      color:#14272b;
    }

    .journey-action:disabled {
      opacity:.4;
      cursor:not-allowed;
    }

    .upgrade-grid {
      display:grid;
      grid-template-columns:repeat(3,minmax(0,1fr));
      gap:8px;
      margin-top:10px;
    }

    .upgrade-card {
      min-width:0;
      padding:10px;
      border:1px solid #ffffff16;
      border-radius:11px;
      background:#122630;
    }

    .upgrade-card strong {
      display:block;
      font:700 11px 'Space Grotesk',sans-serif;
      line-height:1.35;
    }

    .upgrade-card p {
      min-height:29px;
      margin:6px 0;
      color:var(--muted);
      font-size:9px;
      line-height:1.45;
    }

    .upgrade-level {
      display:block;
      margin-bottom:8px;
      color:var(--mint);
      font:500 9px 'DM Mono',monospace;
    }

    .upgrade-card .journey-action {
      width:100%;
      padding:8px 4px;
      font-size:9px;
    }

    .journey-message {
      margin-top:10px;
      padding:10px 12px;
      border:1px solid #8d7545;
      border-radius:10px;
      background:#433b25;
      color:#ffedb7;
      font-size:11px;
      line-height:1.5;
    }

    .journey-message:empty {display:none}

    .fuel-stop {
      margin:12px 0;
      padding:22px 15px;
      border:1px solid #a65d52;
      border-radius:16px;
      background:linear-gradient(140deg,#402d2e,#252c32);
      text-align:center;
    }

    .fuel-stop h3 {
      margin:0 0 8px;
      font:700 23px 'Space Grotesk',sans-serif;
      color:#ffb0a3;
    }

    .fuel-stop p {
      margin:0;
      color:#e0c9c4;
      font-size:12px;
      line-height:1.6;
    }

    @keyframes trainHillMove {
      from {transform:translateX(0)}
      to {transform:translateX(-18%)}
    }

    @keyframes trainFieldMove {
      from {background-position:0 0}
      to {background-position:-350px 0}
    }

    @keyframes trainPoleMove {
      from {left:110%}
      to {left:-15%}
    }

    @keyframes trainTreeMove {
      from {left:115%}
      to {left:-20%}
    }

    @keyframes trainCloudMove {
      from {left:110%}
      to {left:-30%}
    }

    @media(max-width:650px) {
      .journey-panel {padding:10px;border-radius:15px}
      .train-window-frame {border-width:7px;border-bottom-width:12px}
      .journey-metrics {grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}
      .journey-metric {padding:9px}
      .upgrade-grid {grid-template-columns:1fr}
      .upgrade-card {display:grid;grid-template-columns:1fr auto;gap:4px 10px}
      .upgrade-card p {grid-column:1;min-height:0;margin:0}
      .upgrade-level {grid-column:1}
      .upgrade-card .journey-action {grid-column:2;grid-row:1 / span 3;align-self:center;min-width:95px}
      .journey-heading h3 {font-size:16px}
      .journey-chip {font-size:8px;padding:7px}
    }

    @media(prefers-reduced-motion:reduce) {
      .train-cloud,.train-hills,.train-field,.train-pole,.train-tree {
        animation:none!important;
      }
    }
  `;

  document.head.appendChild(style);
}

function ensureJourneyUI() {
  installTrainStyles();

  const panel = $('play-panel');
  if (!panel || $('journey-panel')) return;

  const journey = document.createElement('section');
  journey.id = 'journey-panel';
  journey.className = 'journey-panel';

  journey.innerHTML = `
    <div class="journey-heading">
      <div>
        <div class="eyebrow"><span class="live-dot"></span> LIVE RAIL JOURNEY</div>
        <h3 id="journey-station-title">Central Terminal</h3>
        <p id="journey-station-subtitle">Your trip home starts here.</p>
      </div>
      <div class="journey-chip" id="journey-station-count">STATION 01</div>
    </div>

    <div class="train-window-frame" aria-label="Moving countryside seen through a train window">
      <div class="train-sky">
        <div class="train-sun"></div>
        <div class="train-cloud"></div>
        <div class="train-cloud cloud-two"></div>
        <div class="train-hills far"></div>
        <div class="train-hills"></div>
        <div class="train-field"></div>
        <div class="train-pole"></div>
        <div class="train-tree"></div>
        <div class="train-tree tree-two"></div>
        <div class="train-track"></div>
      </div>
      <div class="train-window-label">PANIC EXPRESS · WINDOW VIEW</div>
      <div class="train-window-speed" id="journey-window-status">TRAIN IN MOTION</div>
    </div>

    <div class="journey-metrics">
      <div class="journey-metric">
        <small>Next station</small>
        <strong id="journey-next-station">Willow Creek</strong>
      </div>
      <div class="journey-metric">
        <small>Wallet</small>
        <strong id="journey-wallet">0 coins</strong>
      </div>
      <div class="journey-metric">
        <small>Fuel</small>
        <strong id="journey-fuel-label">100%</strong>
        <div class="journey-bar fuel-track" id="journey-fuel-track"><span></span></div>
      </div>
      <div class="journey-metric">
        <small>Passengers</small>
        <strong id="journey-passenger-count">0 / 4</strong>
      </div>
    </div>

    <div class="journey-subsection">
      <div class="journey-subheading">
        <span>Route to the next station</span>
        <span id="journey-route-label">0 / 1000</span>
      </div>
      <div class="journey-bar"><span id="journey-route-bar"></span></div>
    </div>

    <div class="journey-subsection">
      <div class="journey-subheading">
        <span>Passenger tickets</span>
        <span id="journey-delivered">0 delivered</span>
      </div>
      <div class="passenger-list" id="journey-passengers"></div>
      <div class="journey-actions">
        <button class="journey-action primary" id="board-passengers">＋ Board passengers</button>
        <button class="journey-action" id="refuel-train">⛽ Refuel train</button>
      </div>
    </div>

    <div class="journey-subsection">
      <div class="journey-subheading">
        <span>Train workshop</span>
        <span>Permanent upgrades</span>
      </div>
      <div class="upgrade-grid" id="journey-upgrades"></div>
    </div>

    <div class="journey-message" id="journey-message" aria-live="polite"></div>
    <div class="fuel-stop hidden" id="fuel-stop-screen">
      <h3>⛽ The train needs fuel.</h3>
      <p>Refuel the engine to continue your challenges and move toward the next station.</p>
      <div class="journey-actions" style="justify-content:center">
        <button class="journey-action primary" id="fuel-stop-refuel">Refuel and continue</button>
      </div>
    </div>
  `;

  const playTop = panel.querySelector('.play-top');
  if (playTop) panel.insertBefore(journey, playTop);
  else panel.prepend(journey);

  $('board-passengers').addEventListener('click', boardPassengers);
  $('refuel-train').addEventListener('click', refuel);
  $('fuel-stop-refuel').addEventListener('click', refuel);

  $('journey-upgrades').addEventListener('click', event => {
    const button = event.target.closest('[data-upgrade]');
    if (!button) return;
    purchaseUpgrade(button.dataset.upgrade);
  });

  renderJourney();
}

function stationName(index) {
  const list = Array.isArray(STATIONS) && STATIONS.length
    ? STATIONS
    : ['Central Terminal', 'Willow Creek', 'Meadow Junction', 'Riverbend', 'Home Terminal'];

  return list[((index % list.length) + list.length) % list.length];
}

function getCapacity() {
  return 4 + (save.upgrades?.capacity || 0) * 2;
}

function getPassengerDestination(passenger) {
  return stationName(Number(passenger.destinationStation) || 0);
}

function renderJourney() {
  if (!$('journey-panel')) return;

  const index = Number(save.stationIndex) || 0;
  const station = stationName(index);
  const nextStation = stationName(index + 1);
  const fuel = Math.max(0, Math.min(100, Number(save.fuel) || 0));
  const routePoints = Math.max(0, Math.min(ROUTE_LENGTH - 1, Number(save.routePoints) || 0));
  const passengers = Array.isArray(save.passengers) ? save.passengers : [];
  const capacity = getCapacity();

  $('journey-station-title').textContent = station;
  $('journey-station-subtitle').textContent =
    index === 0 ? 'Your trip home starts here.' : 'Keep the train moving toward home.';
  $('journey-station-count').textContent =
    `STATION ${String(index + 1).padStart(2, '0')}`;
  $('journey-next-station').textContent = nextStation;
  $('journey-wallet').textContent = `${Math.floor(Number(save.coins) || 0)} coins`;
  $('journey-fuel-label').textContent = `${Math.round(fuel)}%`;
  $('journey-passenger-count').textContent = `${passengers.length} / ${capacity}`;
  $('journey-route-label').textContent = `${routePoints} / ${ROUTE_LENGTH}`;
  $('journey-delivered').textContent = `${Number(save.passengersDelivered) || 0} delivered`;

  $('journey-route-bar').style.width = `${routePoints / ROUTE_LENGTH * 100}%`;

  const fuelTrack = $('journey-fuel-track');
  fuelTrack.classList.toggle('low', fuel <= 20);
  fuelTrack.querySelector('span').style.width = `${fuel}%`;
  $('journey-fuel-label').classList.toggle('fuel-low', fuel <= 20);

  $('journey-window-status').textContent = fuelStopped
    ? 'TRAIN STOPPED'
    : paused
      ? 'TRAIN PAUSED'
      : 'TRAIN IN MOTION';

  const passengerContainer = $('journey-passengers');

  if (!passengers.length) {
    passengerContainer.innerHTML =
      '<span class="passenger-ticket">🧍 No passengers on board</span>';
  } else {
    passengerContainer.innerHTML = passengers.map((passenger, index) => `
      <div class="passenger-ticket">
        <span>🎫</span>
        <span>${escapeHTML(passenger.name || `Passenger ${index + 1}`)} → ${escapeHTML(getPassengerDestination(passenger))}</span>
        <strong>${Math.floor(Number(passenger.fare) || 0)}c</strong>
      </div>
    `).join('');
  }

  const alreadyBoarded = boardedStationIndex === index;
  const full = passengers.length >= capacity;

  $('board-passengers').disabled = alreadyBoarded || full;
  $('board-passengers').textContent = alreadyBoarded
    ? '✓ Passengers boarded here'
    : full
      ? 'Coach is full'
      : `＋ Board passengers (${Math.min(2, capacity - passengers.length)} max)`;

  $('refuel-train').disabled = fuel >= 100;
  $('fuel-stop-screen').classList.toggle('hidden', !fuelStopped);

  const upgradesContainer = $('journey-upgrades');
  upgradesContainer.innerHTML = Object.entries(UPGRADES || {}).map(([key, upgrade]) => {
    const level = Number(save.upgrades?.[key]) || 0;
    const max = Number(upgrade.max) || 5;
    const cost = upgradeCost(save, key);
    const name = upgrade.name || upgrade.title || key;
    const description = upgrade.description || upgrade.benefit || 'Improve your train.';

    return `
      <div class="upgrade-card">
        <strong>${escapeHTML(name)}</strong>
        <p>${escapeHTML(description)}</p>
        <span class="upgrade-level">LEVEL ${level} / ${max}</span>
        <button
          class="journey-action"
          data-upgrade="${escapeHTML(key)}"
          ${cost === null || cost === undefined || save.coins < cost ? 'disabled' : ''}
        >${level >= max ? 'MAX LEVEL' : `⬆ ${Math.floor(cost)} coins`}</button>
      </div>
    `;
  }).join('');

  if (!Object.keys(UPGRADES || {}).length) {
    upgradesContainer.innerHTML =
      '<p style="color:var(--muted);font-size:11px">The workshop is unavailable.</p>';
  }
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

function boardPassengers() {
  const index = Number(save.stationIndex) || 0;

  if (boardedStationIndex === index) {
    toast('You have already boarded passengers at this station.');
    return;
  }

  const passengers = Array.isArray(save.passengers) ? save.passengers : [];
  const availableSeats = getCapacity() - passengers.length;

  if (availableSeats <= 0) {
    toast('The passenger coach is full. Upgrade your capacity for more seats.');
    return;
  }

  const before = passengers.length;

  try {
    applySaveResult(pickupPassengers(save, Math.min(2, availableSeats)));
  } catch (error) {
    console.error('Passenger pickup failed:', error);
    toast('Passengers could not board. Check game-core.js.');
    return;
  }

  const after = Array.isArray(save.passengers) ? save.passengers.length : before;

  if (after <= before) {
    toast('No passengers could board at this station.');
    renderJourney();
    return;
  }

  boardedStationIndex = index;
  save.lastBoardedStation = index;
  persist();
  tone(620, 0.08);
  toast(`${after - before} passenger${after - before === 1 ? '' : 's'} boarded. Deliver them for fares!`);
}

function refuel() {
  const beforeFuel = Number(save.fuel) || 0;
  const beforeCoins = Number(save.coins) || 0;

  if (beforeFuel >= 100) {
    toast('Your fuel tank is already full.');
    return;
  }

  try {
    const result = refuelTrain(save);
    applySaveResult(result);
  } catch (error) {
    console.error('Refuelling failed:', error);
    toast('Refuelling failed. Check the refuelTrain function in game-core.js.');
    return;
  }

  const afterFuel = Number(save.fuel) || 0;
  const afterCoins = Number(save.coins) || 0;

  if (afterFuel <= beforeFuel) {
    toast(beforeCoins <= 0
      ? 'You need more coins to buy fuel.'
      : 'You cannot afford the fuel refill yet.');
    renderJourney();
    return;
  }

  fuelStopped = false;
  persist();
  tone(410, 0.12);
  toast(`Fuel restored to ${Math.round(afterFuel)}%.`);

  if (
    $('play-panel') &&
    !$('play-panel').classList.contains('hidden') &&
    !locked &&
    !paused &&
    !roundTimer &&
    !raf
  ) {
    nextRound();
  }
}

function purchaseUpgrade(key) {
  const beforeCoins = Number(save.coins) || 0;
  const beforeLevel = Number(save.upgrades?.[key]) || 0;

  try {
    applySaveResult(buyUpgrade(save, key));
  } catch (error) {
    console.error('Upgrade purchase failed:', error);
    toast('Upgrade purchase failed. Check buyUpgrade in game-core.js.');
    return;
  }

  const afterCoins = Number(save.coins) || 0;
  const afterLevel = Number(save.upgrades?.[key]) || 0;

  if (afterLevel <= beforeLevel || afterCoins >= beforeCoins) {
    toast('Not enough coins, or this upgrade is already at its maximum level.');
    renderJourney();
    return;
  }

  persist();
  tone(700, 0.12);
  toast(`${UPGRADES[key]?.name || UPGRADES[key]?.title || key} upgraded!`);
}

/* -------------------------------------------------------
   CHALLENGE RUNS
------------------------------------------------------- */

function startRun(kind = 'endless', challengeId = null) {
  clearTimers();

  mode = kind;
  score = 0;
  streak = 0;
  bestRunStreak = 0;
  lives = 3;
  roundsPlayed = 0;
  runCoins = 0;
  queueIndex = 0;
  paused = false;
  locked = false;
  lastWon = false;
  fuelStopped = false;

  if (kind === 'single') {
    queue = [CHALLENGES.find(c => c.id === challengeId) || CHALLENGES[0]];
  } else if (kind === 'campaign') {
    queue = [
      ...CHALLENGES.filter(c => !save.completed.includes(c.id)),
      ...CHALLENGES.filter(c => save.completed.includes(c.id))
    ];
  } else {
    queue = shuffleChallenges();
  }

  showOnly('play-panel');
  ensureJourneyUI();
  renderJourney();
  nextRound();
}

function pickChallenge() {
  if (queue.length) return queue[queueIndex % queue.length];

  const pool = CHALLENGES;
  let challenge = pool[Math.floor(Math.random() * pool.length)];

  if (challenge.id === current?.id && pool.length > 1) {
    challenge = pool[current.number % pool.length];
  }

  return challenge;
}

function showFuelStop() {
  fuelStopped = true;
  locked = false;
  current = null;

  $('round-title').textContent = '⛽ Refuel stop';
  $('round-subtitle').textContent = 'The train needs fuel before the next challenge.';
  $('round-count').textContent = String(roundsPlayed).padStart(2, '0');
  $('challenge-theme').textContent = 'ENGINE CHECK';
  $('difficulty').textContent = '—';
  $('challenge-icon').textContent = '⛽';
  $('challenge-name').textContent = 'The train has run out of fuel.';
  $('challenge-prompt').textContent =
    'Refuel using your coins, then continue your journey.';
  $('feedback').textContent = 'Your route progress and passengers have been saved.';
  $('feedback').className = 'feedback bad';
  $('interaction-area').innerHTML = `
    <button class="big-action tap-action" id="fuel-stop-main-action">
      <span class="action-emoji">⛽</span>
      <strong>REFUEL TRAIN</strong>
      <small>Use your saved coins</small>
    </button>
  `;
  $('fuel-stop-main-action').onclick = refuel;
  $('timer-bar').style.width = '0%';
  $('timer-bar').classList.add('urgent');
  $('mini-progress').textContent = 'TRAIN STOPPED · REFUEL TO CONTINUE';
  $('journey-window-status').textContent = 'TRAIN STOPPED';
  $('fuel-stop-screen').classList.remove('hidden');
  renderJourney();
}

function nextRound() {
  clearTimers();

  if ((Number(save.fuel) || 0) <= 0) {
    showFuelStop();
    return;
  }

  fuelStopped = false;

  if (lives <= 0 || (mode === 'single' && roundsPlayed > 0)) {
    finishRun();
    return;
  }

  if (mode === 'campaign' && queueIndex >= queue.length) {
    finishRun(true);
    return;
  }

  if (mode === 'endless' && queueIndex >= queue.length) {
    queue = shuffleChallenges();
    queueIndex = 0;
  }

  locked = false;

  $('challenge-card').classList.remove('success-flash', 'fail-shake');
  current = pickChallenge();

  if (queue.length) queueIndex++;

  roundsPlayed++;

  $('round-mode').textContent =
    mode === 'single'
      ? 'PRACTICE CHALLENGE'
      : mode === 'campaign'
        ? 'CAMPAIGN RUN'
        : 'ENDLESS PANIC';

  $('round-title').textContent = `${current.themeIcon} ${current.theme}`;
  $('round-subtitle').textContent = 'Read fast. React faster.';
  $('round-count').textContent = String(roundsPlayed).padStart(2, '0');
  $('challenge-theme').textContent = current.theme.toUpperCase();
  $('difficulty').textContent =
    '●'.repeat(Math.min(5, Math.ceil(current.difficulty / 2))) +
    '○'.repeat(Math.max(0, 5 - Math.min(5, Math.ceil(current.difficulty / 2))));
  $('challenge-icon').textContent = current.icon;
  $('challenge-name').textContent = current.name;
  $('challenge-prompt').textContent = current.prompt;
  $('feedback').textContent = current.flavor;
  $('feedback').className = 'feedback';
  $('score').textContent = score;
  $('streak').textContent = streak;

  $('mini-progress').textContent =
    mode === 'single'
      ? 'Practice · 1 challenge'
      : mode === 'campaign'
        ? `Campaign · ${save.completed.length}/100 cleared`
        : `Challenge ${roundsPlayed} · 100 in the manual`;

  $('lives').innerHTML = [0, 1, 2]
    .map(i => `<span class="${i >= lives ? 'lost' : ''}">♥</span>`)
    .join('');

  $('timer-bar').classList.remove('urgent');
  $('challenge-card').classList.remove('hidden');

  remaining = current.timeLimit * 1000;
  startedAt = performance.now();

  renderInteraction();
  renderJourney();
  runTimer();
  tone(300 + current.number % 7 * 45, 0.055);
}

function renderInteraction() {
  const area = $('interaction-area');

  area.innerHTML = '';
  sequenceInput = [];
  memoryShown = true;
  reactionReady = false;

  const btn = (text, cls = 'action-btn', attrs = '') =>
    `<button class="${cls}" ${attrs}>${text}</button>`;

  if (current.mechanic === 'tap') {
    area.innerHTML = `
      <button class="big-action tap-action" id="main-action">
        <span class="action-emoji">${current.icon}</span>
        <strong>DO IT!</strong>
        <small>tap once</small>
      </button>
    `;
    $('main-action').onclick = () => resolve(true);
  }

  if (current.mechanic === 'mash') {
    const goal = 4 + current.difficulty;

    area.innerHTML = `
      <div class="mash-wrap">
        <div class="mash-count"><strong id="mash-count">0</strong><span> / ${goal}</span></div>
        <div class="mash-track"><span id="mash-bar"></span></div>
        ${btn('TAP! TAP! TAP!', 'big-action mash-action', 'id="mash-button"')}
        <small>Tap quickly!</small>
      </div>
    `;

    let count = 0;

    $('mash-button').onclick = () => {
      if (locked) return;

      count++;
      $('mash-count').textContent = count;
      $('mash-bar').style.width = `${Math.min(100, count / goal * 100)}%`;

      tone(240 + count * 20, 0.025);

      if (count >= goal) resolve(true);
    };
  }

  if (current.mechanic === 'hold') {
    area.innerHTML = `
      <div class="hold-wrap">
        <div class="hold-ring" id="hold-ring"><span>HOLD</span></div>
        <p>Keep pressing until the ring fills!</p>
      </div>
    `;

    const element = $('hold-ring');
    let down = false;

    const end = () => {
      if (!down || locked) return;
      down = false;
      clearInterval(holdTimer);
      resolve(false, 'You let go too soon!');
    };

    element.addEventListener('pointerdown', event => {
      event.preventDefault();
      if (locked || down) return;

      down = true;
      element.classList.add('holding');

      let percent = 0;

      holdTimer = setInterval(() => {
        percent += 8;
        element.style.setProperty('--hold', `${percent}%`);

        if (percent >= 100) {
          clearInterval(holdTimer);
          down = false;
          resolve(true);
        }
      }, Math.max(18, 36 - current.difficulty * 2));
    });

    element.addEventListener('pointerup', end);
    element.addEventListener('pointerleave', end);
    element.addEventListener('pointercancel', end);
  }

  if (current.mechanic === 'choice') {
    const options = makeChoiceOptions(current.number, current.difficulty);
    const answer = options.find(option => option.ok)?.label || 'STOP';

    $('challenge-prompt').textContent =
      `The station sign says “${answer}”. Choose that exact action.`;

    area.innerHTML = `
      <div class="choice-grid">
        ${options.map(option =>
          btn(option.label, 'choice-btn', `data-choice="${option.ok}"`)
        ).join('')}
      </div>
    `;

    area.querySelectorAll('[data-choice]').forEach(button => {
      button.onclick = () => {
        const correct = button.dataset.choice === 'true';
        resolve(correct, correct ? 'Good eye!' : 'Wrong choice!');
      };
    });
  }

  if (current.mechanic === 'sequence') {
    const sequence = makeSequence(
      current,
      Math.min(5, 2 + Math.floor(current.difficulty / 2))
    );

    area.innerHTML = `
      <div class="sequence-display" id="sequence-display">
        ${sequence.map(symbol => `<span>${symbol}</span>`).join('')}
      </div>
      <div class="direction-pad">
        ${['←', '↑', '↓', '→'].map(direction =>
          btn(direction, 'direction-btn', `data-dir="${direction}"`)
        ).join('')}
      </div>
      <small>Repeat the arrows in order.</small>
    `;

    let position = 0;

    area.querySelectorAll('[data-dir]').forEach(button => {
      button.onclick = () => {
        if (locked) return;

        const correct = button.dataset.dir === sequence[position];

        if (!correct) {
          resolve(false, 'Wrong arrow!');
          return;
        }

        position++;
        button.classList.add('pressed');

        setTimeout(() => button.classList.remove('pressed'), 120);

        if (position === sequence.length) resolve(true);
      };
    });
  }

  if (current.mechanic === 'timing') {
    area.innerHTML = `
      <div class="timing-game">
        <div class="timing-track">
          <span class="target-zone" style="left:${30 + (current.number % 3) * 10}%"></span>
          <span class="timing-marker" id="timing-marker"></span>
        </div>
        ${btn('STOP!', 'big-action stop-action', 'id="stop-timing"')}
        <small>Stop the marker inside the green zone.</small>
      </div>
    `;

    timingPos = 0;
    timingDirection = 1;

    const marker = $('timing-marker');
    const zone = area.querySelector('.target-zone');
    const left = parseFloat(zone.style.left);

    timingLoop = setInterval(() => {
      timingPos += timingDirection * (1.8 + current.difficulty * 0.3);

      if (timingPos > 100 || timingPos < 0) {
        timingDirection *= -1;
      }

      marker.style.left = `${Math.max(0, Math.min(100, timingPos))}%`;
    }, 24);

    $('stop-timing').onclick = () => {
      const center = left + 10;
      resolve(
        Math.abs(timingPos - center) <= Math.min(10, 13 - current.difficulty * 0.6),
        'Too early or too late!'
      );
    };
  }

  if (current.mechanic === 'swipe') {
    const directions = ['←', '↑', '↓', '→'];
    const needed = directions[(current.number * 7) % 4];

    area.innerHTML = `
      <div class="swipe-cue">${needed}</div>
      <div class="swipe-buttons">
        ${directions.map(direction =>
          btn(direction, 'direction-btn', `data-swipe="${direction}"`)
        ).join('')}
      </div>
      <small>Choose the matching direction.</small>
    `;

    area.querySelectorAll('[data-swipe]').forEach(button => {
      button.onclick = () => {
        const correct = button.dataset.swipe === needed;
        resolve(correct, correct ? 'Nailed the direction!' : 'Wrong way!');
      };
    });
  }

  if (current.mechanic === 'avoid') {
    const safe = (current.number + current.difficulty) % 3;
    const lanes = ['LEFT', 'MIDDLE', 'RIGHT'];

    area.innerHTML = `
      <div class="lane-hazards">
        ${lanes.map((label, index) => `
          <button class="lane-btn ${index === safe ? 'safe-lane' : ''}" data-lane="${index}">
            <span>${index === safe ? '✧' : '⚠'}</span>
            <strong>${label}</strong>
            <small>LANE ${String.fromCharCode(65 + index)}</small>
          </button>
        `).join('')}
      </div>
      <small>Pick a clear lane before the trolley rolls through.</small>
    `;

    area.querySelectorAll('[data-lane]').forEach(button => {
      button.onclick = () => {
        const correct = Number(button.dataset.lane) === safe;
        resolve(correct, correct ? 'Clear track!' : 'Blocked lane!');
      };
    });
  }

  if (current.mechanic === 'memory') {
    const symbols = MEMORY_SYMBOLS;
    const length = Math.min(5, 2 + Math.floor(current.difficulty / 2));
    const sequence = makeMemorySequence(current.number, current.difficulty);

    area.innerHTML = `
      <div class="memory-sequence" id="memory-sequence">
        ${sequence.map(symbol => `<span>${symbol}</span>`).join('')}
      </div>
      <div class="memory-pad">
        ${symbols.map(symbol =>
          btn(symbol, 'memory-btn', `data-symbol="${symbol}"`)
        ).join('')}
      </div>
      <small id="memory-hint">Memorize the symbols…</small>
    `;

    let position = 0;
    const delay = Math.max(600, 1450 - current.difficulty * 100);

    timeoutIds.push(setTimeout(() => {
      if (locked) return;

      $('memory-sequence').innerHTML =
        '<span class="question-mark">?</span>'.repeat(length);

      $('memory-hint').textContent = 'Now repeat them in order!';
      memoryShown = false;
    }, delay));

    area.querySelectorAll('[data-symbol]').forEach(button => {
      button.onclick = () => {
        if (locked || memoryShown) return;

        const correct = button.dataset.symbol === sequence[position];

        if (!correct) {
          resolve(false, 'Memory slip!');
          return;
        }

        position++;

        if (position === sequence.length) resolve(true);
      };
    });
  }

  if (current.mechanic === 'slider') {
    const target = 20 + (current.number * 17) % 60;
    let start = (current.number * 11) % 100;

    if (start >= target - 8 && start <= target + 8) {
      start = target < 50 ? 90 : 10;
    }

    area.innerHTML = `
      <div class="slider-wrap">
        <div class="slider-labels">
          <span>TOO LOW</span><span>JUST RIGHT</span><span>TOO HIGH</span>
        </div>
        <input id="aim-slider" type="range" min="0" max="100" value="${start}">
        <div class="target-readout">TARGET ZONE <strong>${target - 8}–${target + 8}</strong></div>
        ${btn('LOCK IT IN', 'big-action lock-action', 'id="lock-slider"')}
      </div>
    `;

    $('lock-slider').onclick = () => {
      const value = Number($('aim-slider').value);

      resolve(
        value >= target - 8 && value <= target + 8,
        value < target - 8 ? 'A little too low!' : 'A little too high!'
      );
    };
  }
}

function makeSequence(challenge, length) {
  const arrows = ['←', '↑', '↓', '→'];

  return Array.from(
    { length },
    (_, index) => arrows[
      (challenge.number * 3 + index * 2 + challenge.difficulty) % 4
    ]
  );
}

function runTimer() {
  const duration = current.timeLimit * 1000;

  function tick(now) {
    if (locked || paused || !current) return;

    const elapsed = now - startedAt;
    remaining = Math.max(0, duration - elapsed);

    $('timer-bar').style.width = `${remaining / duration * 100}%`;
    $('timer-bar').classList.toggle('urgent', remaining < duration * 0.3);

    if (remaining <= 0) {
      resolve(false, 'Time is up!');
      return;
    }

    raf = requestAnimationFrame(tick);
  }

  raf = requestAnimationFrame(tick);
}

function resolve(success, why = '') {
  if (locked || !current) return;

  locked = true;
  lastWon = !!success;

  clearTimers();

  const area = $('interaction-area');
  area.querySelectorAll('button,input').forEach(element => {
    element.disabled = true;
  });

  const feedback = $('feedback');
  let earnedPoints = 0;

  // Fuel is consumed for every attempted challenge.
  try {
    applySaveResult(consumeFuel(save, FUEL_PER_CHALLENGE));
  } catch (error) {
    console.error('Fuel consumption failed:', error);
  }

  if (success) {
    streak++;
    bestRunStreak = Math.max(bestRunStreak, streak);

    earnedPoints = 100 + current.difficulty * 15 + Math.min(streak, 10) * 8;
    score += earnedPoints;

    const challengeCoins = 2 + Math.min(8, current.difficulty);
    runCoins += challengeCoins;

    feedback.textContent = `${current.success} +${earnedPoints} points`;
    feedback.className = 'feedback good';

    $('challenge-card').classList.add('success-flash');
    tone(540 + Math.min(streak, 8) * 35, 0.11);

    save = updateAfterRound(save, current, true, score, streak);

    // Successful challenge points move the train along the route.
    try {
      const routeResult = advanceRoute(save, earnedPoints);

      if (routeResult && routeResult.save) {
        save = routeResult.save;
      }

      const fareEarned = Number(routeResult?.fareEarned) || 0;
      const arrivals = Number(routeResult?.stationsArrived) || 0;

      if (fareEarned > 0) {
        runCoins += fareEarned;
        toast(`Passengers arrived! You earned ${fareEarned} coins in fares.`);
        tone(760, 0.12);
      }

      if (arrivals > 0 || routeResult?.arrived) {
        boardedStationIndex = null;
        save.lastBoardedStation = null;

        const arrivalCount = Math.max(1, arrivals);
        toast(
          `🚉 Arrived at ${stationName(save.stationIndex)}! ` +
          `${arrivalCount > 1 ? `${arrivalCount} stations passed. ` : ''}` +
          'Board passengers for the next leg.'
        );

        tone(680, 0.18);
      }
    } catch (error) {
      console.error('Route progression failed:', error);
      toast('Challenge cleared, but route progress failed. Check game-core.js.');
    }
  } else {
    lives--;
    streak = 0;

    feedback.textContent = why || current.fail;
    feedback.className = 'feedback bad';

    $('challenge-card').classList.add('fail-shake');
    tone(150, 0.18);

    $('lives').innerHTML = [0, 1, 2]
      .map(i => `<span class="${i >= lives ? 'lost' : ''}">♥</span>`)
      .join('');

    save = updateAfterRound(save, current, false, score, streak);
  }

  persist();

  $('score').textContent = score;
  $('streak').textContent = streak;
  $('mini-progress').textContent = `${success ? 'CLEARED' : 'MISSED'} · ${roundsPlayed} played`;

  const delay = success ? 850 : 1000;

  timeoutIds.push(setTimeout(() => {
    if (mode === 'single' || lives <= 0) {
      finishRun();
    } else {
      nextRound();
    }
  }, delay));
}

function finishRun(campaignComplete = false, quit = false) {
  clearTimers();

  showOnly('result-panel');

  const single = mode === 'single';
  let stamp;
  let title;
  let copy;

  if (campaignComplete) {
    stamp = '🏆';
    title = 'Manual mastered!';
    copy = 'Every single emergency handled. The conductor owes you a holiday.';
  } else if (quit) {
    stamp = '🏁';
    title = single ? 'Practice ended' : 'Run ended';
    copy = 'You pulled the brake. Jump back in whenever you are ready.';
  } else if (fuelStopped) {
    stamp = '⛽';
    title = 'The train needs fuel.';
    copy = 'Your route and passenger progress are saved. Refuel from the journey panel before starting again.';
  } else if (single && lastWon) {
    stamp = '✦';
    title = 'Challenge complete!';
    copy = 'Cleared! Move on to the next emergency or run this one again.';
  } else if (single) {
    stamp = '💥';
    title = 'Challenge failed';
    copy = 'So close. Give it another go.';
  } else {
    stamp = '💥';
    title = 'The chaos wins.';
    copy = 'The station is still standing. The pigeon is absolutely insufferable.';
  }

  $('result-stamp').textContent = stamp;
  $('result-title').textContent = title;
  $('result-copy').textContent = copy;
  $('final-score').textContent = score;
  $('final-streak').textContent = bestRunStreak;
  $('final-rounds').textContent = roundsPlayed;
  $('final-coins').textContent = runCoins;

  $('next-challenge').classList.toggle(
    'hidden',
    !(single && lastWon && !quit && current && current.number < CHALLENGES.length)
  );

  save.highScore = Math.max(save.highScore, score);
  save.bestStreak = Math.max(save.bestStreak, bestRunStreak);

  persist();
}

/* -------------------------------------------------------
   CAMPAIGN, SAVE BACKUP, AND MAIN CONTROLS
------------------------------------------------------- */

function openCampaign() {
  clearTimers();
  showOnly('campaign-panel');

  const grid = $('challenge-grid');

  grid.innerHTML = CHALLENGES.map(challenge => {
    const done = save.completed.includes(challenge.id);

    return `
      <button class="challenge-tile ${done ? 'cleared' : ''}" data-challenge="${escapeHTML(challenge.id)}">
        <span class="tile-number">${String(challenge.number).padStart(3, '0')}</span>
        <span class="tile-icon">${challenge.icon}</span>
        <strong>${escapeHTML(challenge.name)}</strong>
        <small>${escapeHTML(challenge.theme)}</small>
        <span class="tile-status">${done ? '✓ CLEARED' : `LEVEL ${challenge.difficulty}`}</span>
      </button>
    `;
  }).join('');

  grid.querySelectorAll('[data-challenge]').forEach(button => {
    button.onclick = () => startRun('single', button.dataset.challenge);
  });
}

$('start-run').onclick = () => startRun('endless');

$('retry-run').onclick = () => {
  if (fuelStopped || (Number(save.fuel) || 0) <= 0) {
    showOnly('play-panel');
    ensureJourneyUI();
    showFuelStop();
    return;
  }

  if (mode === 'single' && current) {
    startRun('single', current.id);
  } else {
    startRun(mode === 'campaign' ? 'campaign' : 'endless');
  }
};

$('next-challenge').onclick = () => {
  if (current && current.number < CHALLENGES.length) {
    startRun('single', CHALLENGES[current.number].id);
  }
};

$('home-btn').onclick = () => {
  clearTimers();
  paused = false;
  showOnly('home');
};

$('campaign-btn').onclick = openCampaign;
$('close-campaign').onclick = () => showOnly('home');

$('sound-toggle').onclick = () => {
  save.sound = !save.sound;
  persist();
  tone(440, 0.1);
  toast(save.sound ? 'Sound effects on' : 'Sound muted');
};

$('backup-btn').onclick = () => $('backup-dialog').showModal();

$('export-save').onclick = () => {
  const blob = new Blob(
    [JSON.stringify(save, null, 2)],
    { type: 'application/json' }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = 'panic-express-backup.json';
  link.click();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast('Backup exported.');
};

$('import-save').onchange = async event => {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    if (file.size > 1000000) {
      throw Error('Backup is too large.');
    }

    const imported = JSON.parse(await file.text());

    if (!validSave(imported)) {
      throw Error('That is not a valid Panic Express backup.');
    }

    save = normalizeSave(imported);
    boardedStationIndex = Number.isInteger(save.lastBoardedStation)
      ? save.lastBoardedStation
      : null;

    persist();
    $('backup-dialog').close();
    toast('Progress restored.');
  } catch (error) {
    toast(error.message || 'Import failed.');
  }

  event.target.value = '';
};

$('reset-save').onclick = () => $('reset-dialog').showModal();

$('confirm-reset').onclick = () => {
  save = freshSave();
  boardedStationIndex = null;
  fuelStopped = false;

  persist();
  $('reset-dialog').close();
  toast('Fresh start. Keep your wits about you!');
};

/* -------------------------------------------------------
   PAUSE AND RESUME
------------------------------------------------------- */

function pauseRun() {
  if (
    paused ||
    locked ||
    !current ||
    $('play-panel').classList.contains('hidden') ||
    $('pause-dialog').open
  ) {
    return;
  }

  remaining = Math.max(
    0,
    current.timeLimit * 1000 - (performance.now() - startedAt)
  );

  if (remaining <= 0) {
    resolve(false, 'Time is up!');
    return;
  }

  paused = true;
  clearTimers();

  $('timer-bar').style.width =
    `${remaining / (current.timeLimit * 1000) * 100}%`;

  renderJourney();
  $('pause-dialog').showModal();
}

function resumeRun() {
  if (!$('pause-dialog').open || !paused || locked) return;

  $('pause-dialog').close();
  paused = false;

  renderInteraction();

  startedAt = performance.now() - (current.timeLimit * 1000 - remaining);

  $('timer-bar').style.width =
    `${remaining / (current.timeLimit * 1000) * 100}%`;

  renderJourney();
  runTimer();

  toast('Resumed — this challenge restarts with your remaining time.');
}

$('resume-run').onclick = resumeRun;

$('quit-run').onclick = () => {
  if ($('pause-dialog').open) $('pause-dialog').close();

  paused = false;
  finishRun(false, true);
};

$('pause-dialog').addEventListener('cancel', event => {
  event.preventDefault();
});

document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;

  if ($('pause-dialog').open) {
    event.preventDefault();
    return;
  }

  if (!$('play-panel').classList.contains('hidden') && !locked) {
    event.preventDefault();
    pauseRun();
  }
});

document.addEventListener('visibilitychange', () => {
  if (
    document.hidden &&
    !paused &&
    !locked &&
    !$('play-panel').classList.contains('hidden')
  ) {
    pauseRun();
  }
});

/* -------------------------------------------------------
   BOOT
------------------------------------------------------- */

ensureJourneyUI();
renderStats();
renderJourney();
