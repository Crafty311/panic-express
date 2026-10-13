export interface TrackInfo {
  id: number;
  title: string;
  artist: string;
  durationSec: number;
  url: string;
}

// 5 Curated upbeat chillhop & modern lounge audio tracks
export const CHILLHOP_PLAYLIST: TrackInfo[] = [
  {
    id: 1,
    title: 'Velvet Rails',
    artist: 'Chillhop Express',
    durationSec: 60,
    // Free high-quality royalty-free chill tracks
    url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
  },
  {
    id: 2,
    title: 'Midnight Panorama',
    artist: 'Lounge Horizon',
    durationSec: 60,
    url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=lofi-chill-medium-version-159456.mp3',
  },
  {
    id: 3,
    title: 'Neon Signal Lights',
    artist: 'Metropolitan Drift',
    durationSec: 60,
    url: 'https://cdn.pixabay.com/download/audio/2023/07/04/audio_34b7f94119.mp3?filename=chillhop-beat-154944.mp3',
  },
  {
    id: 4,
    title: 'Golden Hour Viaduct',
    artist: 'Acoustic Solitude',
    durationSec: 60,
    url: 'https://cdn.pixabay.com/download/audio/2022/11/06/audio_c9e8a71932.mp3?filename=lofi-orchestra-16230.mp3',
  },
  {
    id: 5,
    title: 'Starlight Observation',
    artist: 'Nightline Beats',
    durationSec: 60,
    url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73514.mp3?filename=lofi-vintage-110034.mp3',
  },
];

class ModernTrainAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;

  // BGM Online Player state
  private currentAudioEl: HTMLAudioElement | null = null;
  private currentTrackIndex: number = 0;
  private isPlayingBgm: boolean = false;
  private trackTimerInterval: number | null = null;
  private trackElapsedSeconds: number = 0;
  private onTrackChangeCallback: ((track: TrackInfo, elapsed: number) => void) | null = null;

  // Synthesized fallback engine state
  private synthInterval: number | null = null;
  private isUsingSynthFallback: boolean = false;

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.55;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.55, this.ctx.currentTime);
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
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setValueAtTime(clamped, this.ctx.currentTime);
    }
    if (this.currentAudioEl && !this.isMuted) {
      this.currentAudioEl.volume = clamped;
    }
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
    if (this.isPlayingBgm) {
      this.loadAndPlayCurrentTrack();
    } else {
      this.notifyUpdate();
    }
  }

  public skipToPrevTrack() {
    this.currentTrackIndex = (this.currentTrackIndex - 1 + CHILLHOP_PLAYLIST.length) % CHILLHOP_PLAYLIST.length;
    this.trackElapsedSeconds = 0;
    if (this.isPlayingBgm) {
      this.loadAndPlayCurrentTrack();
    } else {
      this.notifyUpdate();
    }
  }

  private loadAndPlayCurrentTrack() {
    const track = this.getCurrentTrack();

    if (!this.currentAudioEl) {
      this.currentAudioEl = new Audio();
      this.currentAudioEl.crossOrigin = 'anonymous';
      this.currentAudioEl.preload = 'auto';
    }

    this.currentAudioEl.src = track.url;
    this.currentAudioEl.muted = this.isMuted;
    this.currentAudioEl.volume = 0.55;

    const playPromise = this.currentAudioEl.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          this.isUsingSynthFallback = false;
          this.stopSynthFallback();
        })
        .catch(() => {
          // If network / policy blocks external streaming audio, seamlessly fallback to procedural synthesized chillhop!
          this.startSynthFallback();
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

      // Exactly 60 seconds (1 minute) per track as requested!
      if (this.trackElapsedSeconds >= 60) {
        this.trackElapsedSeconds = 0;
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

  // Synthesized Chillhop Fallback (Guaranteed to work in all browser sandbox environments)
  private startSynthFallback() {
    if (this.synthInterval || !this.ctx || !this.masterGain) return;
    this.isUsingSynthFallback = true;

    // Upbeat modern lounge chord cycles (Fmaj7 - Em7 - Dm7 - Cmaj7)
    const chords = [
      [174.61, 220.0, 261.63, 329.63], // Fmaj7
      [164.81, 196.0, 246.94, 293.66], // Em7
      [146.83, 174.61, 220.0, 261.63], // Dm7
      [130.81, 164.81, 196.0, 246.94], // Cmaj7
    ];

    let chordIdx = 0;
    const playChordStep = () => {
      if (!this.ctx || !this.masterGain || !this.isPlayingBgm) return;
      const notes = chords[chordIdx % chords.length];
      chordIdx++;

      const now = this.ctx.currentTime;
      notes.forEach((freq) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const filter = this.ctx!.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(750, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.04, now + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(now);
        osc.stop(now + 3.2);
      });
    };

    playChordStep();
    this.synthInterval = window.setInterval(playChordStep, 3500);
  }

  private stopSynthFallback() {
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
  }

  // SOUND EFFECTS

  // Microgame timer tick
  public playTimerTick(urgency: number = 0.5) {
    this.init();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600 + urgency * 350, now);

    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  // Microgame Win
  public playWin() {
    this.init();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);

      gain.gain.setValueAtTime(0, now + idx * 0.07);
      gain.gain.linearRampToValueAtTime(0.14, now + idx * 0.07 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.07 + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.38);
    });
  }

  // Microgame Fail (Clean modern acoustic fail)
  public playFail() {
    this.init();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.3);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.32);
  }

  // Signal post chime alert
  public playSignalAlert() {
    this.init();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    [659.25, 880.0].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.1);

      gain.gain.setValueAtTime(0, now + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.12, now + i * 0.1 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.1 + 0.4);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.42);
    });
  }

  // Train whistle
  public playWhistle() {
    this.init();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    [0, 0.2].forEach((offset) => {
      [587.33, 739.99].forEach((freq) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + offset);

        gain.gain.setValueAtTime(0, now + offset);
        gain.gain.linearRampToValueAtTime(0.1, now + offset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.16);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(now + offset);
        osc.stop(now + offset + 0.18);
      });
    });
  }

  // Station arrival
  public playStationArrival() {
    this.init();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.1, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 1.2);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 1.2);
    });
  }

  // Tap sound
  public playPop() {
    this.init();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(750, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.06);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.07);
  }
}

export const audioEngine = new ModernTrainAudioEngine();
