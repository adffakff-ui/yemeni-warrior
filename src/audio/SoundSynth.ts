/**
 * Procedural Web Audio API Sound Synthesizer for Yemeni Warrior
 * Zero external audio assets required; highly responsive and zero latency.
 */
class SoundSynth {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.6, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.6, this.ctx.currentTime);
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  // Snappy battle rifle / musket shot with noise burst and transient body
  public playShoot() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;

    // 1. Noise burst for gunpowder crack
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.12);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, t);
    filter.frequency.exponentialRampToValueAtTime(100, t + 0.12);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.7, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start(t);

    // 2. Transient body oscillator
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.1);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  // Weapon reload mechanism sound (bolt slide, mag lock)
  public playReload() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    
    // First click: Magazine out
    const click1 = this.ctx.createOscillator();
    const click1Gain = this.ctx.createGain();
    click1.type = 'sawtooth';
    click1.frequency.setValueAtTime(800, t);
    click1.frequency.exponentialRampToValueAtTime(200, t + 0.06);
    click1Gain.gain.setValueAtTime(0.3, t);
    click1Gain.gain.exponentialRampToValueAtTime(0.01, t + 0.06);
    click1.connect(click1Gain);
    click1Gain.connect(this.masterGain);
    click1.start(t);
    click1.stop(t + 0.06);

    // Second click: Magazine insertion
    const t2 = t + 0.25;
    const click2 = this.ctx.createOscillator();
    const click2Gain = this.ctx.createGain();
    click2.type = 'square';
    click2.frequency.setValueAtTime(450, t2);
    click2.frequency.exponentialRampToValueAtTime(150, t2 + 0.09);
    click2Gain.gain.setValueAtTime(0.4, t2);
    click2Gain.gain.exponentialRampToValueAtTime(0.01, t2 + 0.09);
    click2.connect(click2Gain);
    click2Gain.connect(this.masterGain);
    click2.start(t2);
    click2.stop(t2 + 0.09);

    // Third click: Bolt release latch
    const t3 = t + 0.45;
    const click3 = this.ctx.createOscillator();
    const click3Gain = this.ctx.createGain();
    click3.type = 'sine';
    click3.frequency.setValueAtTime(1100, t3);
    click3.frequency.exponentialRampToValueAtTime(300, t3 + 0.08);
    click3Gain.gain.setValueAtTime(0.35, t3);
    click3Gain.gain.exponentialRampToValueAtTime(0.01, t3 + 0.08);
    click3.connect(click3Gain);
    click3Gain.connect(this.masterGain);
    click3.start(t3);
    click3.stop(t3 + 0.08);
  }

  // Janbiya curved dagger blade slash swoosh
  public playSlash() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.exponentialRampToValueAtTime(2400, t + 0.08);
    filter.Q.setValueAtTime(3, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.14);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(t);
  }

  // Impact on enemy
  public playHit() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.18);

    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.18);
  }

  // Player hurt
  public playPlayerHurt() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.25);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.25);
  }

  // Enemy defeated / explosion
  public playEnemyExplode() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.3);

    gain.gain.setValueAtTime(0.55, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.3);
  }

  // Dash whoosh
  public playDash() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(350, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.15);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.15);
  }

  // Warrior's Roar / Shockwave ability
  public playRoar() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    // Layer 1: Deep low frequency power rumble
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(160, t);
    osc1.frequency.linearRampToValueAtTime(260, t + 0.2);
    osc1.frequency.exponentialRampToValueAtTime(40, t + 0.6);
    gain1.gain.setValueAtTime(0.5, t);
    gain1.gain.exponentialRampToValueAtTime(0.01, t + 0.6);

    osc1.connect(gain1);
    gain1.connect(this.masterGain);
    osc1.start(t);
    osc1.stop(t + 0.6);

    // Layer 2: Shimmering horn harmonic
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(320, t);
    osc2.frequency.linearRampToValueAtTime(520, t + 0.2);
    osc2.frequency.exponentialRampToValueAtTime(80, t + 0.5);
    gain2.gain.setValueAtTime(0.3, t);
    gain2.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(t);
    osc2.stop(t + 0.5);
  }

  // Yemeni Pentatonic Relic Pickup Chord (D4 -> F4 -> G4 -> A4 -> C5)
  public playLoot() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const notes = [293.66, 349.23, 392.0, 440.0, 523.25];
    const t = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const noteStart = t + idx * 0.05;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteStart);

      gain.gain.setValueAtTime(0.001, noteStart);
      gain.gain.linearRampToValueAtTime(0.25, noteStart + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.28);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(noteStart);
      osc.stop(noteStart + 0.28);
    });
  }

  // Triumphant Victory Melodic Fanfare
  public playVictory() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    // Oriental triumphant fanfare motif
    const notes = [
      { f: 293.66, d: 0.15 }, // D4
      { f: 349.23, d: 0.15 }, // F4
      { f: 440.0, d: 0.2 },  // A4
      { f: 392.0, d: 0.15 }, // G4
      { f: 523.25, d: 0.45 }, // C5
      { f: 587.33, d: 0.7 }  // D5 high sustain
    ];

    let timeAcc = this.ctx.currentTime;
    notes.forEach((n) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, timeAcc);

      gain.gain.setValueAtTime(0.01, timeAcc);
      gain.gain.linearRampToValueAtTime(0.35, timeAcc + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, timeAcc + n.d);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(timeAcc);
      osc.stop(timeAcc + n.d);

      timeAcc += n.d * 0.85;
    });
  }

  // Solemn Defeat Chord
  public playGameOver() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const chords = [
      [220, 261.63, 329.63], // Am
      [196, 246.94, 293.66], // G
      [146.83, 174.61, 220]  // Dm low
    ];

    let t = this.ctx.currentTime;
    chords.forEach((chord, i) => {
      const chordStart = t + i * 0.35;
      chord.forEach((freq) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, chordStart);

        gain.gain.setValueAtTime(0.01, chordStart);
        gain.gain.linearRampToValueAtTime(0.2, chordStart + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, chordStart + 0.5);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(chordStart);
        osc.stop(chordStart + 0.5);
      });
    });
  }

  // Clean UI click feedback
  public playClick() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.04);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.04);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.04);
  }

  // Subtle tactical footstep sound on sand/stone
  public playFootstep() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const bufSize = Math.floor(this.ctx.sampleRate * 0.05);
    const buffer = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(t);
  }
}

export const soundSynth = new SoundSynth();
