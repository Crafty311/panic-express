class TrainAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  
  // Ambient track state
  private radioGain: GainNode | null = null;
  private radioInterval: number | null = null;
  private radioPlaying: boolean = false;
  private currentRadioTrack: number = 0; // 0 = Lofi Voyage, 1 = Rain Reverie, 2 = Midnight Express

  // Rail clack engine
  private railClackTimeout: number | null = null;
  private isRailAudioActive: boolean = false;

  // Rain noise node
  private rainGainNode: GainNode | null = null;
  private rainSourceNode: AudioNode | null = null;

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.6;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.6, this.ctx.currentTime);
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number) {
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime);
    }
  }

  // Play realistic train steam whistle
  public playWhistle() {
    this.init();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const tones = [587.33, 739.99, 880.0]; // D5, F#5, A5 classic chord

    tones.forEach((freq) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const filter = this.ctx!.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      // Slight pitch bend for steam pressure realism
      osc.frequency.exponentialRampToValueAtTime(freq * 1.03, now + 0.2);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.98, now + 1.2);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.15);
      gain.gain.setValueAtTime(0.08, now + 1.0);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(now);
      osc.stop(now + 1.6);
    });
  }

  // Station arrival bell
  public playStationBell() {
    this.init();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, now); // B5

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 1.8);
  }

  // Coin clink / cash reward
  public playCoin() {
    this.init();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    [1567.98, 2093.0].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);

      gain.gain.setValueAtTime(0, now + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.15, now + i * 0.08 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.08 + 0.4);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.4);
    });
  }

  // Challenge success sound
  public playSuccess() {
    this.init();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);

      gain.gain.setValueAtTime(0, now + idx * 0.09);
      gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.09 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.09 + 0.5);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.5);
    });
  }

  // Clickety-clack of the railway tracks based on train speed
  public startRailLoop(speedKmH: number) {
    this.isRailAudioActive = true;
    this.scheduleNextRailClack(speedKmH);
  }

  public updateRailSpeed(speedKmH: number) {
    if (speedKmH <= 5) {
      if (this.railClackTimeout) {
        clearTimeout(this.railClackTimeout);
        this.railClackTimeout = null;
      }
      return;
    }
    if (!this.railClackTimeout && this.isRailAudioActive) {
      this.scheduleNextRailClack(speedKmH);
    }
  }

  public stopRailLoop() {
    this.isRailAudioActive = false;
    if (this.railClackTimeout) {
      clearTimeout(this.railClackTimeout);
      this.railClackTimeout = null;
    }
  }

  private scheduleNextRailClack(speedKmH: number) {
    if (!this.isRailAudioActive) return;

    // Interval between joint hits shrinks with higher speed
    // e.g. at 120 km/h -> interval ~ 550ms; at 40 km/h -> interval ~ 1400ms
    const interval = Math.max(300, Math.min(2200, 48000 / Math.max(15, speedKmH)));

    this.playRailClickClackSound();

    this.railClackTimeout = window.setTimeout(() => {
      this.scheduleNextRailClack(speedKmH);
    }, interval);
  }

  private playRailClickClackSound() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    // Double tap rhythm "clack-clack"
    const hits = [0, 0.08];

    hits.forEach((offset, idx) => {
      // Low thud
      const osc = this.ctx!.createOscillator();
      const oscGain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(idx === 0 ? 82 : 75, now + offset);
      osc.frequency.exponentialRampToValueAtTime(35, now + offset + 0.07);

      oscGain.gain.setValueAtTime(0.06, now + offset);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.07);

      osc.connect(oscGain);
      oscGain.connect(this.masterGain!);

      osc.start(now + offset);
      osc.stop(now + offset + 0.08);

      // Metal clack noise burst
      const bufferSize = this.ctx!.sampleRate * 0.04;
      const noiseBuffer = this.ctx!.createBuffer(1, bufferSize, this.ctx!.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }

      const noise = this.ctx!.createBufferSource();
      noise.buffer = noiseBuffer;

      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = idx === 0 ? 420 : 380;
      filter.Q.value = 3.5;

      const noiseGain = this.ctx!.createGain();
      noiseGain.gain.setValueAtTime(0.04, now + offset);
      noiseGain.gain.exponentialRampToValueAtTime(0.0005, now + offset + 0.04);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.masterGain!);

      noise.start(now + offset);
      noise.stop(now + offset + 0.05);
    });
  }

  // Dynamic rain ambient audio
  public updateRainAmbience(isRaining: boolean, intensity: number = 0.5) {
    this.init();
    if (!this.ctx || !this.masterGain) return;

    if (!isRaining) {
      if (this.rainGainNode) {
        this.rainGainNode.gain.setTargetAtTime(0, this.ctx.currentTime, 0.3);
      }
      return;
    }

    if (!this.rainGainNode) {
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      // Pink/Brownish noise for rain
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        data[i] = (b0 + b1 + b2) * 0.18;
      }

      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1100;

      this.rainGainNode = this.ctx.createGain();
      this.rainGainNode.gain.setValueAtTime(0, this.ctx.currentTime);

      source.connect(filter);
      filter.connect(this.rainGainNode);
      this.rainGainNode.connect(this.masterGain);

      source.start();
      this.rainSourceNode = source;
    }

    const targetGain = this.isMuted ? 0 : Math.min(0.22, intensity * 0.2);
    this.rainGainNode.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.4);
  }

  // Compartment Radio Player (Procedural Cozy Lo-fi chords)
  public toggleRadio(): boolean {
    this.init();
    this.radioPlaying = !this.radioPlaying;

    if (this.radioPlaying) {
      this.startLofiRadio();
    } else {
      this.stopLofiRadio();
    }
    return this.radioPlaying;
  }

  public setRadioTrack(trackIdx: number) {
    this.currentRadioTrack = trackIdx;
    if (this.radioPlaying) {
      this.stopLofiRadio();
      this.startLofiRadio();
    }
  }

  public getRadioPlaying(): boolean {
    return this.radioPlaying;
  }

  private startLofiRadio() {
    if (!this.ctx || !this.masterGain) return;

    if (!this.radioGain) {
      this.radioGain = this.ctx.createGain();
      this.radioGain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      this.radioGain.connect(this.masterGain);
    }

    const chordSets = [
      // Track 0: Lo-fi Steam Chords (Ebmaj7 - Gm7 - Fm7 - Bb7)
      [
        [155.56, 196.00, 233.08, 293.66], // Ebmaj7
        [196.00, 233.08, 293.66, 349.23], // Gm7
        [174.61, 207.65, 261.63, 311.13], // Fm7
        [233.08, 293.66, 349.23, 415.30], // Bb7
      ],
      // Track 1: Rain Reverie (Fmaj9 - Am7 - Dm9 - Cmaj7)
      [
        [174.61, 220.00, 261.63, 329.63, 392.00],
        [220.00, 261.63, 329.63, 392.00],
        [146.83, 174.61, 220.00, 261.63, 329.63],
        [130.81, 164.81, 196.00, 246.94],
      ],
      // Track 2: Midnight Pullman (Dbmaj7 - Gbmaj7 - Bbm7 - Ab6)
      [
        [138.59, 174.61, 207.65, 261.63],
        [185.00, 233.08, 277.18, 349.23],
        [233.08, 277.18, 349.23, 415.30],
        [207.65, 261.63, 311.13, 369.99],
      ]
    ];

    let chordStep = 0;
    const playCurrentChord = () => {
      if (!this.ctx || !this.radioGain || !this.radioPlaying) return;
      const chords = chordSets[this.currentRadioTrack % chordSets.length];
      const chord = chords[chordStep % chords.length];
      chordStep++;

      const now = this.ctx.currentTime;
      const duration = 3.6;

      chord.forEach((freq) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const filter = this.ctx!.createBiquadFilter();

        // Warm tape electric piano vibe
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(750, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.04, now + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.radioGain!);

        osc.start(now);
        osc.stop(now + duration);
      });
    };

    playCurrentChord();
    this.radioInterval = window.setInterval(playCurrentChord, 3800);
  }

  private stopLofiRadio() {
    if (this.radioInterval) {
      clearInterval(this.radioInterval);
      this.radioInterval = null;
    }
  }
}

export const audioEngine = new TrainAudioEngine();
