// Web Audio API Synthesizer and Audio Engine for NEON RUSH

class AudioManager {
  constructor() {
    this.ctx = null;
    this.bgmVolume = 0.7;
    this.sfxVolume = 0.85;
    this.isMuted = false;
    this.isInitialized = false;

    // Music playback state
    this.isMusicPlaying = false;
    this.bgmTimer = null;
    this.musicStep = 0;
    this.tempo = 126; // Cyberpunk BPM

    // Coin combo pitch progression
    this.coinCombo = 0;
    this.lastCoinTime = 0;

    // Jetpack continuous sound node
    this.jetpackSource = null;
    this.jetpackGain = null;
  }

  init() {
    if (this.isInitialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.isInitialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported', e);
    }
  }

  ensureContext() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  setBgmVolume(val) {
    this.bgmVolume = Math.max(0, Math.min(1, val));
  }

  setSfxVolume(val) {
    this.sfxVolume = Math.max(0, Math.min(1, val));
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted && this.isMusicPlaying) {
      this.stopBGM();
    } else if (!this.isMuted && !this.isMusicPlaying) {
      this.startBGM();
    }
    return !this.isMuted;
  }

  // --- Sound Effects Synthesis ---

  playJump() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(520, t + 0.16);

    gain.gain.setValueAtTime(0.28 * this.sfxVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.22);
  }

  playSuperJump() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    [330, 495, 660].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t + i * 0.04);
      osc.frequency.exponentialRampToValueAtTime(freq * 2.2, t + 0.25 + i * 0.04);

      gain.gain.setValueAtTime(0.18 * this.sfxVolume, t + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + i * 0.04);
      osc.stop(t + 0.35);
    });
  }

  playLand() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);

    gain.gain.setValueAtTime(0.35 * this.sfxVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.14);
  }

  playSlide() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.ensureContext();
    if (!this.ctx) return;

    // Filtered noise swoop
    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.25;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, t);
    filter.frequency.exponentialRampToValueAtTime(300, t + 0.24);
    filter.Q.value = 3.0;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3 * this.sfxVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(t);
    noise.stop(t + 0.25);
  }

  playCoin() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = performance.now();
    if (now - this.lastCoinTime < 350) {
      this.coinCombo = Math.min(this.coinCombo + 1, 8);
    } else {
      this.coinCombo = 0;
    }
    this.lastCoinTime = now;

    const t = this.ctx.currentTime;
    // Scale notes: B5, C#6, D#6, E6, F#6, G#6, A#6, B6
    const baseFreqs = [987.77, 1108.73, 1244.51, 1318.51, 1479.98, 1661.22, 1864.66, 1975.53];
    const freq1 = baseFreqs[this.coinCombo % baseFreqs.length];
    const freq2 = freq1 * 1.5; // Perfect fifth harmonic

    [freq1, freq2].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = idx === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      const amp = (idx === 0 ? 0.22 : 0.08) * this.sfxVolume;
      gain.gain.setValueAtTime(amp, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.18);
    });
  }

  playPowerUp() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const chords = [523.25, 659.25, 783.99, 1046.50]; // C Major 7th
    chords.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.06);

      gain.gain.setValueAtTime(0.2 * this.sfxVolume, t + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.06 + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + idx * 0.06);
      osc.stop(t + idx * 0.06 + 0.35);
    });
  }

  playPowerDown() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    [600, 450, 300].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);

      gain.gain.setValueAtTime(0.15 * this.sfxVolume, t + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 0.12);
    });
  }

  playShieldHit() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Resonant shield bounce/shatter
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(150, t + 0.3);

    gain.gain.setValueAtTime(0.4 * this.sfxVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.35);
  }

  playCrash() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // Sub explosion thump
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(25, t + 0.5);

    oscGain.gain.setValueAtTime(0.55 * this.sfxVolume, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.6);

    // Crunch noise
    const bufferSize = this.ctx.sampleRate * 0.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.15));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.linearRampToValueAtTime(100, t + 0.5);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.45 * this.sfxVolume, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start(t);
    noise.stop(t + 0.55);
  }

  playClick() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.04);

    gain.gain.setValueAtTime(0.2 * this.sfxVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.05);
  }

  playTrainHorn() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    [277.18, 329.63].forEach(freq => { // C#4 + E4 discordant train horn
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.18 * this.sfxVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.7);
    });
  }

  // --- Background Music Synthesizer (Cyberpunk Synthwave Loop) ---

  startBGM() {
    if (this.isMusicPlaying || this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    this.isMusicPlaying = true;
    this.musicStep = 0;

    const secondsPerBeat = 60.0 / this.tempo;
    const stepDuration = secondsPerBeat / 4; // 16th notes

    // Bassline note scale (C2, D#2, F2, G2, A#2, C3)
    const bassline = [
      65.41, 65.41, 77.78, 65.41,
      65.41, 87.31, 65.41, 98.00,
      58.27, 58.27, 65.41, 58.27,
      58.27, 87.31, 77.78, 65.41
    ];

    // Arpeggiated melody line (C4, D#4, G4, A#4, C5, D#5)
    const leadNotes = [
      261.63, 0, 311.13, 392.00, 0, 466.16, 523.25, 0,
      622.25, 523.25, 0, 466.16, 392.00, 0, 311.13, 261.63
    ];

    const playStep = () => {
      if (!this.isMusicPlaying || this.isMuted) return;
      const t = this.ctx.currentTime;
      const step16 = this.musicStep % 16;
      const beat = Math.floor(step16 / 4);

      // Kick drum on beats 0, 1, 2, 3 (every 4th 16th note)
      if (step16 % 4 === 0) {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(140, t);
        kickOsc.frequency.exponentialRampToValueAtTime(35, t + 0.12);

        kickGain.gain.setValueAtTime(0.35 * this.bgmVolume, t);
        kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

        kickOsc.connect(kickGain);
        kickGain.connect(this.ctx.destination);
        kickOsc.start(t);
        kickOsc.stop(t + 0.14);
      }

      // Snare / Clap on beats 1 and 3 (step 4 and 12)
      if (step16 === 4 || step16 === 12) {
        const snareNoise = this.ctx.createBufferSource();
        const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.15), this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        snareNoise.buffer = buf;

        const snareFilter = this.ctx.createBiquadFilter();
        snareFilter.type = 'highpass';
        snareFilter.frequency.value = 800;

        const snareGain = this.ctx.createGain();
        snareGain.gain.setValueAtTime(0.22 * this.bgmVolume, t);
        snareGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

        snareNoise.connect(snareFilter);
        snareFilter.connect(snareGain);
        snareGain.connect(this.ctx.destination);
        snareNoise.start(t);
        snareNoise.stop(t + 0.15);
      }

      // Hi-hat on every 2nd 16th note
      if (step16 % 2 === 0) {
        const hatOsc = this.ctx.createOscillator();
        const hatGain = this.ctx.createGain();
        hatOsc.type = 'triangle';
        hatOsc.frequency.setValueAtTime(9000, t);

        hatGain.gain.setValueAtTime((step16 % 4 === 2 ? 0.08 : 0.04) * this.bgmVolume, t);
        hatGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);

        hatOsc.connect(hatGain);
        hatGain.connect(this.ctx.destination);
        hatOsc.start(t);
        hatOsc.stop(t + 0.04);
      }

      // Synth Bassline note
      const bassFreq = bassline[step16];
      if (bassFreq > 0) {
        const bassOsc = this.ctx.createOscillator();
        const bassFilter = this.ctx.createBiquadFilter();
        const bassGain = this.ctx.createGain();

        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(bassFreq, t);

        bassFilter.type = 'lowpass';
        bassFilter.frequency.setValueAtTime(450, t);
        bassFilter.frequency.exponentialRampToValueAtTime(150, t + stepDuration * 0.9);

        bassGain.gain.setValueAtTime(0.25 * this.bgmVolume, t);
        bassGain.gain.exponentialRampToValueAtTime(0.01, t + stepDuration * 0.95);

        bassOsc.connect(bassFilter);
        bassFilter.connect(bassGain);
        bassGain.connect(this.ctx.destination);

        bassOsc.start(t);
        bassOsc.stop(t + stepDuration);
      }

      // Lead Arpeggio note
      const leadFreq = leadNotes[step16];
      if (leadFreq > 0) {
        const leadOsc = this.ctx.createOscillator();
        const leadGain = this.ctx.createGain();
        leadOsc.type = 'sine';
        leadOsc.frequency.setValueAtTime(leadFreq, t);

        leadGain.gain.setValueAtTime(0.12 * this.bgmVolume, t);
        leadGain.gain.exponentialRampToValueAtTime(0.001, t + stepDuration * 0.8);

        leadOsc.connect(leadGain);
        leadGain.connect(this.ctx.destination);

        leadOsc.start(t);
        leadOsc.stop(t + stepDuration * 0.85);
      }

      this.musicStep++;
      this.bgmTimer = setTimeout(playStep, stepDuration * 1000);
    };

    playStep();
  }

  stopBGM() {
    this.isMusicPlaying = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}

export const audioManager = new AudioManager();
