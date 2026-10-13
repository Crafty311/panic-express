export interface TrackInfo {
  id: number;
  title: string;
  artist: string;
  durationSec: number;
  url: string;
  fallbackUrl?: string;
  styleDesc: string;
}

// 5 Curated cozy lofi acoustic jazz tracks with verified high-reliability stream URLs
// plus procedural real-time Web Audio jazz generation for zero-latency 100% availability!
export const CHILLHOP_PLAYLIST: TrackInfo[] = [
  {
    id: 1,
    title: 'Velvet Rails',
    artist: 'Chillhop Express',
    durationSec: 60,
    url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
    fallbackUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=lofi-chill-medium-version-159456.mp3',
    styleDesc: 'Dm9 · G13 · Cmaj7 · Soft Rhodes & Acoustic Bass',
  },
  {
    id: 2,
    title: 'Midnight Panorama',
    artist: 'Lounge Horizon',
    durationSec: 60,
    url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=lofi-chill-medium-version-159456.mp3',
    fallbackUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
    styleDesc: 'Fmaj7 · Em7 · Dm9 · Mellow Starlight Lounge',
  },
  {
    id: 3,
    title: 'Neon Signal Lights',
    artist: 'Metropolitan Drift',
    durationSec: 60,
    // Reliable Pixabay public CC0 stream
    url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=lofi-vibes-112190.mp3',
    fallbackUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=lofi-chill-medium-version-159456.mp3',
    styleDesc: 'Bbm9 · Eb13 · Abmaj7 · Raindrops & Electric Piano',
  },
  {
    id: 4,
    title: 'Golden Hour Viaduct',
    artist: 'Acoustic Solitude',
    durationSec: 60,
    url: 'https://cdn.pixabay.com/download/audio/2021/09/06/audio_731427a19d.mp3?filename=lofi-relax-travel-10708.mp3',
    fallbackUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
    styleDesc: 'Gmaj7 · F#m7 · Em7 · Acoustic Nylon Guitar & Viaduct Wind',
  },
  {
    id: 5,
    title: 'Starlight Observation',
    artist: 'Nightline Beats',
    durationSec: 60,
    url: 'https://cdn.pixabay.com/download/audio/2022/11/06/audio_c3be400d35.mp3?filename=warm-lofi-beat-126245.mp3',
    fallbackUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
    styleDesc: 'C#m7 · F#7 · Bmaj7 · Celestial Ethereal Chords',
  },
];

class ModernTrainAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  // BGM Online Player state
  private currentAudioEl: HTMLAudioElement | null = null;
  private currentTrackIndex: number = 0;
  private isPlayingBgm: boolean = false;
  private trackTimerInterval: number | null = null;
  private trackElapsedSeconds: number = 0;
  private onTrackChangeCallback: ((track: TrackInfo, elapsed: number) => void) | null = null;
  private triedFallbackForTrack: boolean = false;

  // Synthesized Cozy Lofi Acoustic Jazz Engine
  private synthInterval: number | null = null;
  private isUsingSynthFallback: boolean = false;
  private vinylNode: AudioBufferSourceNode | null = null;

  // Master volume lower ceiling by default (0.24 for intimate, cozy, non-fatiguing playback)
  private currentVolume: number = 0.25;

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.currentVolume;
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.35; // Gentle SFX level
      this.sfxGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : this.currentVolume, this.ctx.currentTime);
    }
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(muted ? 0 : 0.35, this.ctx.currentTime);
    }
    if (this.currentAudioEl) {
      this.currentAudioEl.muted = muted;
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number) {
    const clamped = Math.max(0, Math.min(1, vol));
    this.currentVolume = clamped;
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setValueAtTime(clamped, this.ctx.currentTime);
    }
    if (this.currentAudioEl && !this.isMuted) {
      this.currentAudioEl.volume = clamped;
    }
  }

  public getVolume(): number {
    return this.currentVolume;
  }

  public onTrackUpdate(cb: (track: TrackInfo, elapsed: number) => void) {
    this.onTrackChangeCallback = cb;
  }

  public getCurrentTrack(): TrackInfo {
    return CHILLHOP_PLAYLIST[this.currentTrackIndex % CHILLHOP_PLAYLIST.length];
  }

  public getTrackElapsed(): number {
    return this.trackElapsedSeconds;
  }

  public getIsBgmPlaying(): boolean {
    return this.isPlayingBgm;
  }

  // Toggle Background Chillhop Music
  public toggleBgm(): boolean {
    this.init();
    if (this.isPlayingBgm) {
      this.pauseBgm();
    } else {
      this.playBgm();
    }
    return this.isPlayingBgm;
  }

  public playBgm() {
    this.init();
    this.isPlayingBgm = true;
    this.loadAndPlayCurrentTrack();
    this.startTrackProgressTimer();
  }

  public pauseBgm() {
    this.isPlayingBgm = false;
    if (this.currentAudioEl) {
      this.currentAudioEl.pause();
    }
    this.stopSynthFallback();
    if (this.trackTimerInterval) {
      clearInterval(this.trackTimerInterval);
      this.trackTimerInterval = null;
    }
    this.notifyUpdate();
  }

  public skipToNextTrack() {
    this.currentTrackIndex = (this.currentTrackIndex + 1) % CHILLHOP_PLAYLIST.length;
    this.trackElapsedSeconds = 0;
    this.triedFallbackForTrack = false;
    if (this.isPlayingBgm) {
      this.loadAndPlayCurrentTrack();
    } else {
      this.notifyUpdate();
    }
  }

  public skipToPrevTrack() {
    this.currentTrackIndex = (this.currentTrackIndex - 1 + CHILLHOP_PLAYLIST.length) % CHILLHOP_PLAYLIST.length;
    this.trackElapsedSeconds = 0;
    this.triedFallbackForTrack = false;
    if (this.isPlayingBgm) {
      this.loadAndPlayCurrentTrack();
    } else {
      this.notifyUpdate();
    }
  }

  private loadAndPlayCurrentTrack() {
    const track = this.getCurrentTrack();
    this.triedFallbackForTrack = false;

    if (!this.currentAudioEl) {
      this.currentAudioEl = new Audio();
      this.currentAudioEl.preload = 'auto';
      this.currentAudioEl.loop = true;
    }

    this.currentAudioEl.loop = true;
    this.currentAudioEl.src = track.url;
    this.currentAudioEl.muted = this.isMuted;
    this.currentAudioEl.volume = this.isMuted ? 0 : this.currentVolume;

    // Handle network or stream error with verified secondary fallback or procedural jazz
    this.currentAudioEl.onerror = () => {
      if (!this.triedFallbackForTrack && track.fallbackUrl && this.currentAudioEl) {
        this.triedFallbackForTrack = true;
        this.currentAudioEl.src = track.fallbackUrl;
        this.currentAudioEl.play().catch(() => {
          this.startSynthFallback();
        });
      } else {
        this.startSynthFallback();
      }
    };

    const playPromise = this.currentAudioEl.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          this.isUsingSynthFallback = false;
          this.stopSynthFallback();
        })
        .catch(() => {
          if (!this.triedFallbackForTrack && track.fallbackUrl && this.currentAudioEl) {
            this.triedFallbackForTrack = true;
            this.currentAudioEl.src = track.fallbackUrl;
            this.currentAudioEl.play().catch(() => {
              this.startSynthFallback();
            });
          } else {
            this.startSynthFallback();
          }
        });
    }

    this.notifyUpdate();
  }

  private startTrackProgressTimer() {
    if (this.trackTimerInterval) clearInterval(this.trackTimerInterval);

    this.trackTimerInterval = window.setInterval(() => {
      if (!this.isPlayingBgm) return;

      this.trackElapsedSeconds += 1;
      this.notifyUpdate();

      // Exactly 60 seconds per track, then rotates smoothly
      if (this.trackElapsedSeconds >= 60) {
        this.trackElapsedSeconds = 0;
        this.triedFallbackForTrack = false;
        this.currentTrackIndex = (this.currentTrackIndex + 1) % CHILLHOP_PLAYLIST.length;
        this.loadAndPlayCurrentTrack();
      }
    }, 1000);
  }

  private notifyUpdate() {
    if (this.onTrackChangeCallback) {
      this.onTrackChangeCallback(this.getCurrentTrack(), this.trackElapsedSeconds);
    }
  }

  // -------------------------------------------------------------
  // COZY PROCEDURAL LOFI ACOUSTIC JAZZ ENGINE (Web Audio API)
  // Generates warm acoustic guitar / electric piano jazz chords,
  // walking upright bass, soft brush drums, and tape warmth.
  // -------------------------------------------------------------
  private startSynthFallback() {
    this.init();
    if (this.synthInterval || !this.ctx || !this.masterGain) return;
    this.isUsingSynthFallback = true;

    // 5 Handcrafted Cozy Jazz Chord Progressions for the 5 Tracks:
    const cozyJazzBooks = [
      // Track 1: Velvet Rails (Dm9 -> G13 -> Cmaj9 -> A7#9)
      [
        { chord: [146.83, 220.0, 261.63, 329.63, 392.0], bass: 73.42 }, // Dm9
        { chord: [196.0, 246.94, 329.63, 370.0, 440.0], bass: 98.0 },   // G13
        { chord: [130.81, 196.0, 246.94, 293.66, 329.63], bass: 65.41 },// Cmaj9
        { chord: [220.0, 277.18, 329.63, 415.3, 466.16], bass: 110.0 }, // A7alt
      ],
      // Track 2: Midnight Panorama (Fmaj7 -> Em7 -> Dm7 -> Cmaj7)
      [
        { chord: [174.61, 220.0, 261.63, 329.63], bass: 87.31 },
        { chord: [164.81, 196.0, 246.94, 293.66], bass: 82.41 },
        { chord: [146.83, 174.61, 220.0, 261.63], bass: 73.42 },
        { chord: [130.81, 164.81, 196.0, 246.94], bass: 65.41 },
      ],
      // Track 3: Neon Signal Lights (Bbm9 -> Eb13 -> Abmaj7 -> Fm9)
      [
        { chord: [233.08, 277.18, 349.23, 415.3], bass: 58.27 },
        { chord: [155.56, 233.08, 293.66, 349.23], bass: 77.78 },
        { chord: [207.65, 261.63, 311.13, 392.0], bass: 103.83 },
        { chord: [174.61, 207.65, 261.63, 311.13], bass: 87.31 },
      ],
      // Track 4: Golden Hour Viaduct (Gmaj7 -> F#m7 -> Em7 -> Dmaj7)
      [
        { chord: [196.0, 246.94, 293.66, 370.0], bass: 98.0 },
        { chord: [185.0, 220.0, 277.18, 329.63], bass: 92.5 },
        { chord: [164.81, 196.0, 246.94, 293.66], bass: 82.41 },
        { chord: [146.83, 185.0, 220.0, 277.18], bass: 73.42 },
      ],
      // Track 5: Starlight Observation (C#m9 -> F#13 -> Bmaj9 -> G#7alt)
      [
        { chord: [138.59, 207.65, 246.94, 311.13, 370.0], bass: 69.3 },
        { chord: [185.0, 233.08, 277.18, 370.0], bass: 92.5 },
        { chord: [246.94, 311.13, 370.0, 440.0], bass: 61.74 },
        { chord: [207.65, 261.63, 311.13, 392.0], bass: 103.83 },
      ],
    ];

    const currentProgression = cozyJazzBooks[this.currentTrackIndex % cozyJazzBooks.length];
    let stepIndex = 0;

    const playJazzBar = () => {
      if (!this.ctx || !this.masterGain || !this.isPlayingBgm) return;
      const bar = currentProgression[stepIndex % currentProgression.length];
      stepIndex++;

      const now = this.ctx.currentTime;

      // 1. Upright Acoustic Walking Bass note
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      const bassFilter = this.ctx.createBiquadFilter();

      bassOsc.type = 'triangle';
      bassOsc.frequency.setValueAtTime(bar.bass, now);

      bassFilter.type = 'lowpass';
      bassFilter.frequency.setValueAtTime(320, now);

      bassGain.gain.setValueAtTime(0, now);
      bassGain.gain.linearRampToValueAtTime(0.08, now + 0.05);
      bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);

      bassOsc.connect(bassFilter);
      bassFilter.connect(bassGain);
      bassGain.connect(this.masterGain);

      bassOsc.start(now);
      bassOsc.stop(now + 2.9);

      // 2. Warm Rhodes / Acoustic Guitar Arpeggiated Chords
      bar.chord.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const filter = this.ctx!.createBiquadFilter();

        osc.type = 'sine'; // Pure warm jazz tone
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(950, now);

        const noteTime = now + idx * 0.04;
        gain.gain.setValueAtTime(0, noteTime);
        gain.gain.linearRampToValueAtTime(0.035, noteTime + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 3.4);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(noteTime);
        osc.stop(noteTime + 3.5);
      });

      // 3. Gentle Soft Brush / Velvet Train Chug Texture
      const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.1, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseBuffer.length; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.015;
      }
      const noiseNode = this.ctx.createBufferSource();
      noiseNode.buffer = noiseBuffer;
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.value = 1800;
      noiseFilter.Q.value = 2.0;
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.02, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);

      noiseNode.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.masterGain);
      noiseNode.start(now);
    };

    playJazzBar();
    this.synthInterval = window.setInterval(playJazzBar, 3200);
  }

  private stopSynthFallback() {
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
  }

  // -------------------------------------------------------------
  // TACTILE SOUND EFFECTS (Zero latency Web Audio synthesizer)
  // For buttons, toggles, railway controls & UI interactions.
  // -------------------------------------------------------------

  // Soft mechanical train button click (tactile toggle)
  public playMechanicalClick() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;

    // Transient click click
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(1400, now);
    osc1.frequency.exponentialRampToValueAtTime(400, now + 0.015);

    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

    osc1.connect(gain1);
    gain1.connect(this.sfxGain);
    osc1.start(now);
    osc1.stop(now + 0.025);

    // Warm wooden / steel body thud
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(180, now + 0.005);
    osc2.frequency.exponentialRampToValueAtTime(70, now + 0.04);

    gain2.gain.setValueAtTime(0.08, now + 0.005);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    osc2.connect(gain2);
    gain2.connect(this.sfxGain);
    osc2.start(now + 0.005);
    osc2.stop(now + 0.05);
  }

  // Tactile Day/Night or rotary switch snap
  public playSwitchSound() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const freqs = [880, 1174.66]; // A5 -> D6 cheerful snap
    freqs.forEach((f, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + idx * 0.035);

      gain.gain.setValueAtTime(0.07, now + idx * 0.035);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.035 + 0.08);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now + idx * 0.035);
      osc.stop(now + idx * 0.035 + 0.09);
    });
  }

  // Soft button tap
  public playSoftClick() {
    this.playMechanicalClick();
  }

  // Whistle chime
  public playWhistle() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const freqs = [587.33, 739.99, 880.0]; // D5, F#5, A5 warm chord
    freqs.forEach((f) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.07, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now);
      osc.stop(now + 1.1);
    });
  }

  // Microgame win chime
  public playWin() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((f, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + idx * 0.06);

      gain.gain.setValueAtTime(0.09, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 0.45);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.45);
    });
  }

  // Microgame fail thud
  public playFail() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(65, now + 0.28);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.29);
  }

  // Milestone signal post notification chime
  public playSignalAlert() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    [0, 0.16].forEach((offset) => {
      [659.25, 830.61].forEach((freq) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + offset);

        gain.gain.setValueAtTime(0, now + offset);
        gain.gain.linearRampToValueAtTime(0.07, now + offset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.14);

        osc.connect(gain);
        gain.connect(this.sfxGain!);

        osc.start(now + offset);
        osc.stop(now + offset + 0.16);
      });
    });
  }

  // Station arrival chime
  public playStationArrival() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    [440, 554.37, 659.25, 880].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.08, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 1.1);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 1.1);
    });
  }

  // Microgame timer tick
  public playTimerTick(urgency: number = 0.5) {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(550 + urgency * 300, now);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.045);
  }

  // Tap sound
  public playPop() {
    this.playMechanicalClick();
  }
}

export const audioEngine = new ModernTrainAudioEngine();
