/**
 * STRESS ZOMBIE APOCALYPSE - Procedural Web Audio Sound Synthesizer
 * High-performance sound generator using the browser's Web Audio API.
 * Includes laser slicing, sub-bass impacts, hydro-water jets, metallic deflection clangs,
 * combo fanfares, and ambient cyberpunk synth audio.
 */

class SoundController {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.musicEnabled = true;
        this.isBgPlaying = false;
        this.bgmMode = "ambient"; // "ambient" (Welcome/Map/Report) or "combat" (Active Levels)
        this.bgmTempo = 74;
        this.bgmStep = 0;
        this.nextNoteTime = 0;
        this.bgmTimer = null;
        this.bgmMasterGain = null;
        this.bgmDuckGain = null;
        this.bgmDelay = null;
        this._bgmNoiseBuffer = null;
        this._bgmWindBuffer = null;
        this.duckTimeout = null;
        this.welcomeNodes = [];
        this.welcomeMasterGain = null;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    _updateBgmOutputGain() {
        if (this.bgmMasterGain && this.ctx) {
            const now = this.ctx.currentTime;
            const target = (this.muted || !this.musicEnabled) ? 0 : 0.72;
            this.bgmMasterGain.gain.setTargetAtTime(target, now, 0.05);
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        if (this.muted) {
            this.stopWelcomeRoar();
        }
        this._updateBgmOutputGain();
        return this.muted;
    }

    toggleMusic() {
        this.init();
        this.musicEnabled = !this.musicEnabled;
        if (this.musicEnabled && !this.isBgPlaying) {
            this.startBackgroundMusic(this.bgmMode);
        }
        this._updateBgmOutputGain();
        return this.musicEnabled;
    }

    /**
     * Play laser blade cutting sweep
     */
    playSlice(isCrit = false) {
        if (this.muted) return;
        this.init();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = isCrit ? 'sawtooth' : 'triangle';
        const now = this.ctx.currentTime;

        const startFreq = isCrit ? 1400 : 800;
        const endFreq = isCrit ? 100 : 180;
        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.exponentialRampToValueAtTime(endFreq, now + (isCrit ? 0.38 : 0.22));

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(isCrit ? 4000 : 2200, now);
        filter.frequency.exponentialRampToValueAtTime(150, now + 0.3);

        gain.gain.setValueAtTime(isCrit ? 0.4 : 0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (isCrit ? 0.38 : 0.22));

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.4);

        if (isCrit) {
            this.playImpactBass();
        }
    }

    /**
     * Rapid Heavy Machine Gun Bullet Burst Sound (multiple staggered shots)
     */
    playMachineGunBurst(isCrit = false, shots = 4) {
        if (this.muted) return;
        this.init();

        const now = this.ctx.currentTime;
        const shotGap = 0.044;

        for (let s = 0; s < shots; s++) {
            const t = now + s * shotGap;

            // 1. Crisp explosive gunshot crack (filtered noise transient)
            const dur = 0.075;
            const bufSize = Math.floor(this.ctx.sampleRate * dur);
            const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
            const ch = buf.getChannelData(0);
            for (let i = 0; i < bufSize; i++) {
                const env = Math.exp(-i / (bufSize * 0.22));
                ch[i] = (Math.random() * 2 - 1) * env;
            }

            const noise = this.ctx.createBufferSource();
            noise.buffer = buf;

            const bp = this.ctx.createBiquadFilter();
            bp.type = 'bandpass';
            bp.frequency.setValueAtTime(isCrit ? 1900 : 1450, t);
            bp.Q.setValueAtTime(1.1, t);

            const nGain = this.ctx.createGain();
            nGain.gain.setValueAtTime(isCrit ? 0.34 : 0.24, t);
            nGain.gain.exponentialRampToValueAtTime(0.001, t + dur);

            noise.connect(bp);
            bp.connect(nGain);
            nGain.connect(this.ctx.destination);
            noise.start(t);
            noise.stop(t + dur);

            // 2. Heavy chamber punch thump
            const punch = this.ctx.createOscillator();
            const pGain = this.ctx.createGain();
            punch.type = 'triangle';
            punch.frequency.setValueAtTime(175, t);
            punch.frequency.exponentialRampToValueAtTime(42, t + 0.055);
            pGain.gain.setValueAtTime(isCrit ? 0.26 : 0.18, t);
            pGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
            punch.connect(pGain);
            pGain.connect(this.ctx.destination);
            punch.start(t);
            punch.stop(t + 0.062);
        }

        if (isCrit) {
            this.playImpactBass();
        }
    }

    /**
     * Mechanical trigger safety lock click when gun handle is misaligned with Mohr's Circle
     */
    playTriggerLock() {
        if (this.muted) return;
        this.init();

        const now = this.ctx.currentTime;
        const click1 = this.ctx.createOscillator();
        const g1 = this.ctx.createGain();
        click1.type = 'square';
        click1.frequency.setValueAtTime(1500, now);
        click1.frequency.exponentialRampToValueAtTime(480, now + 0.025);
        g1.gain.setValueAtTime(0.14, now);
        g1.gain.exponentialRampToValueAtTime(0.001, now + 0.028);
        click1.connect(g1);
        g1.connect(this.ctx.destination);
        click1.start(now);
        click1.stop(now + 0.03);

        const click2 = this.ctx.createOscillator();
        const g2 = this.ctx.createGain();
        click2.type = 'triangle';
        click2.frequency.setValueAtTime(720, now + 0.036);
        click2.frequency.exponentialRampToValueAtTime(220, now + 0.065);
        g2.gain.setValueAtTime(0.11, now + 0.036);
        g2.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
        click2.connect(g2);
        g2.connect(this.ctx.destination);
        click2.start(now + 0.036);
        click2.stop(now + 0.072);
    }

    /**
     * Metallic deflection clang when blade hits at wrong angle!
     */
    playDeflection() {
        if (this.muted) return;
        this.init();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Metallic bell / clang tone
        osc.type = 'square';
        osc.frequency.setValueAtTime(620, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.22);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.26);
    }

    /**
     * Lock-on chime when blade aligns with failure plane
     */
    playLockOnTone() {
        if (this.muted) return;
        this.init();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.linearRampToValueAtTime(1320, now + 0.08);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.11);
    }

    /**
     * High-Pressure Hydrostatic Water Jet Cannon sound
     */
    playWaterJet() {
        if (this.muted) return;
        this.init();

        const now = this.ctx.currentTime;
        const dur = 0.8;

        const bufferSize = this.ctx.sampleRate * dur;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(450, now);
        filter.frequency.linearRampToValueAtTime(1200, now + 0.3);
        filter.frequency.exponentialRampToValueAtTime(300, now + dur);
        filter.Q.setValueAtTime(4.0, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start(now);
        noise.stop(now + dur);

        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(360, now + 0.4);
        osc.frequency.exponentialRampToValueAtTime(60, now + dur);

        oscGain.gain.setValueAtTime(0.25, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

        osc.connect(oscGain);
        oscGain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + dur);
    }

    /**
     * Sub-bass impact thump on critical hits
     */
    playImpactBass() {
        if (this.muted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.45);

        gain.gain.setValueAtTime(0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.52);
    }

    /**
     * Zombie damage hit sound
     */
    playHit() {
        if (this.muted) return;
        this.init();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.16);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.18);
    }

    /**
     * Zombie disintegrating / shattered kill sound
     */
    playZombieDeath(type = 'brittle') {
        if (this.muted) return;
        this.init();

        const now = this.ctx.currentTime;
        const dur = 0.45;

        const bufferSize = this.ctx.sampleRate * dur;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = type === 'brittle' ? 'highpass' : 'bandpass';
        filter.frequency.setValueAtTime(type === 'brittle' ? 1400 : 500, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start(now);
        noise.stop(now + dur);
    }

    /**
     * Dial rotation tick sound with proximity pitch modulation
     */
    playDialTick(proximity = 0) {
        if (this.muted) return;
        this.init();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const baseFreq = 440 + proximity * 520;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, now);

        gain.gain.setValueAtTime(0.03 + proximity * 0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.05);
    }

    /**
     * Power-up activation sound
     */
    playPowerUp(powerType) {
        if (this.muted) return;
        this.init();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        if (powerType === 'slowmo') {
            osc.frequency.setValueAtTime(900, now);
            osc.frequency.exponentialRampToValueAtTime(140, now + 0.6);
        } else if (powerType === 'hint') {
            osc.frequency.setValueAtTime(523.25, now);
            osc.frequency.linearRampToValueAtTime(880, now + 0.25);
        } else if (powerType === 'shield') {
            osc.frequency.setValueAtTime(240, now);
            osc.frequency.linearRampToValueAtTime(650, now + 0.45);
        } else {
            osc.frequency.setValueAtTime(1046.5, now);
            osc.frequency.exponentialRampToValueAtTime(523.25, now + 0.3);
        }

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.6);
    }

    /**
     * Combo multiplier fanfare
     */
    playComboFanfare(streak = 2) {
        if (this.muted) return;
        this.init();

        const notes = [523.25, 659.25, 783.99, 1046.5];
        const baseNote = notes[Math.min(streak - 1, notes.length - 1)];
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(baseNote, now);
        osc.frequency.linearRampToValueAtTime(baseNote * 1.5, now + 0.15);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.26);
    }

    /**
     * Boss warning siren
     */
    playBossAlarm() {
        if (this.muted) return;
        this.init();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.linearRampToValueAtTime(640, now + 0.3);
        osc.frequency.linearRampToValueAtTime(320, now + 0.6);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.95);
    }

    _ensureBgmResources() {
        this.init();
        const now = this.ctx.currentTime;

        if (!this.bgmMasterGain) {
            const comp = this.ctx.createDynamicsCompressor();
            comp.threshold.setValueAtTime(-14, now);
            comp.knee.setValueAtTime(16, now);
            comp.ratio.setValueAtTime(4, now);
            comp.attack.setValueAtTime(0.008, now);
            comp.release.setValueAtTime(0.25, now);
            comp.connect(this.ctx.destination);

            this.bgmMasterGain = this.ctx.createGain();
            const target = (this.muted || !this.musicEnabled) ? 0 : 0.72;
            this.bgmMasterGain.gain.setValueAtTime(target, now);

            this.bgmDuckGain = this.ctx.createGain();
            this.bgmDuckGain.gain.setValueAtTime(1.0, now);

            this.bgmDuckGain.connect(this.bgmMasterGain);
            this.bgmMasterGain.connect(comp);

            // Cavernous Haunted Corridor Delay Send (eerie reverberating echoes)
            this.bgmDelay = this.ctx.createDelay(1.0);
            this.bgmDelay.delayTime.setValueAtTime(0.42, now);
            const delayFilter = this.ctx.createBiquadFilter();
            delayFilter.type = 'lowpass';
            delayFilter.frequency.setValueAtTime(880, now);
            const delayFeedback = this.ctx.createGain();
            delayFeedback.gain.setValueAtTime(0.48, now);
            const delayWet = this.ctx.createGain();
            delayWet.gain.setValueAtTime(0.48, now);

            this.bgmDelay.connect(delayFilter);
            delayFilter.connect(delayFeedback);
            delayFeedback.connect(this.bgmDelay);
            delayFilter.connect(delayWet);
            delayWet.connect(this.bgmDuckGain);
        }

        if (!this._bgmNoiseBuffer) {
            const len = Math.floor(this.ctx.sampleRate * 0.25);
            const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
            const ch = buf.getChannelData(0);
            for (let i = 0; i < len; i++) {
                ch[i] = Math.random() * 2 - 1;
            }
            this._bgmNoiseBuffer = buf;
        }

        if (!this._bgmWindBuffer) {
            const wlen = Math.floor(this.ctx.sampleRate * 2.5);
            const wbuf = this.ctx.createBuffer(1, wlen, this.ctx.sampleRate);
            const wch = wbuf.getChannelData(0);
            let prev = 0;
            for (let i = 0; i < wlen; i++) {
                const white = Math.random() * 2 - 1;
                prev = (prev + 0.04 * white) / 1.04;
                wch[i] = prev * 2.4 + white * 0.12;
            }
            this._bgmWindBuffer = wbuf;
        }
    }

    setMusicMode(mode = "combat") {
        this.bgmMode = mode;
        this.bgmTempo = mode === "ambient" ? 74 : this.bgmTempo;
        if (this.isBgPlaying) {
            this._updateBgmOutputGain();
        }
    }

    setTempo(bpm = 84) {
        this.bgmTempo = Math.max(60, Math.min(140, bpm));
    }

    duckBackgroundMusic(durationSec = 3.7) {
        if (!this.bgmDuckGain || !this.ctx) return;
        const now = this.ctx.currentTime;
        this.bgmDuckGain.gain.cancelScheduledValues(now);
        this.bgmDuckGain.gain.setTargetAtTime(0.14, now, 0.08);
        clearTimeout(this.duckTimeout);
        this.duckTimeout = setTimeout(() => {
            if (this.bgmDuckGain && this.ctx) {
                this.bgmDuckGain.gain.setTargetAtTime(1.0, this.ctx.currentTime, 0.35);
            }
        }, durationSec * 1000);
    }

    startBackgroundMusic(mode = "combat") {
        this._ensureBgmResources();
        this.bgmMode = mode;
        if (mode === "ambient") {
            this.bgmTempo = 74;
        } else if (this.bgmTempo < 80) {
            this.bgmTempo = 84;
        }
        this._updateBgmOutputGain();

        if (this.isBgPlaying) return;

        this.isBgPlaying = true;
        this.bgmStep = 0;
        this.nextNoteTime = this.ctx.currentTime + 0.05;

        this.bgmTimer = setInterval(() => this._schedulerTick(), 45);
    }

    stopBackgroundMusic() {
        if (this.bgmTimer) {
            clearInterval(this.bgmTimer);
            this.bgmTimer = null;
        }
        this.isBgPlaying = false;
    }

    _schedulerTick() {
        if (!this.isBgPlaying || !this.ctx) return;
        if (this.ctx.state !== 'running') return;

        // Guard against catching up huge burst after tab switch or pause
        if (this.nextNoteTime < this.ctx.currentTime - 0.08) {
            this.nextNoteTime = this.ctx.currentTime + 0.02;
        }

        const stepDur = 60.0 / this.bgmTempo / 4.0;
        while (this.nextNoteTime < this.ctx.currentTime + 0.15) {
            this._scheduleBgmStep(this.bgmStep, this.nextNoteTime, stepDur);
            this.nextNoteTime += stepDur;
            this.bgmStep = (this.bgmStep + 1) % 64;
        }
    }

    _scheduleBgmStep(step, t, stepDur) {
        if (this.muted || !this.musicEnabled) return;

        // Dark Survival Horror Harmony: Dissonant Minor-Second Clashes & Tritones (4 Bars x 16 steps)
        const horrorBars = [
            {
                root: 36.71, // D1 sub
                pad: [146.83, 155.56, 207.65], // D3 + Eb3 (minor 2nd clash) + Ab3 (tritone)
                motif: { 0: 587.33, 3: 622.25, 6: 440.00, 10: 415.30, 14: 349.23 }
            },
            {
                root: 38.89, // Eb1 sinister half-step rise
                pad: [155.56, 220.00, 277.18], // Eb3 + A3 (tritone) + C#4
                motif: { 0: 554.37, 4: 587.33, 8: 466.16, 12: 440.00 }
            },
            {
                root: 34.65, // C#1 sub dread
                pad: [138.59, 146.83, 196.00], // C#3 + D3 (minor 2nd) + G3 (tritone)
                motif: { 0: 523.25, 3: 554.37, 6: 392.00, 11: 369.99 }
            },
            {
                root: 49.00, // G1 -> Ab1 eerie augmented tension
                pad: [130.81, 164.81, 207.65], // C3 + E3 + Ab3 (augmented horror cluster)
                motif: { 0: 622.25, 5: 587.33, 9: 440.00, 13: 311.13 }
            }
        ];

        const bar = Math.floor(step / 16);
        const s = step % 16;
        const harm = horrorBars[bar];

        // -----------------------------------------------------------------
        // 1. HAUNTED DETUNED PITCH-SAGGING HORROR STRINGS PAD (Plays every bar)
        // -----------------------------------------------------------------
        if (s === 0) {
            const padDur = stepDur * 16;
            const padFilter = this.ctx.createBiquadFilter();
            padFilter.type = 'lowpass';
            padFilter.frequency.setValueAtTime(this.bgmMode === "combat" ? 460 : 380, t);
            padFilter.frequency.linearRampToValueAtTime(210, t + padDur);
            padFilter.Q.setValueAtTime(2.5, t);

            const padGain = this.ctx.createGain();
            const padPeak = this.bgmMode === "combat" ? 0.05 : 0.065;
            padGain.gain.setValueAtTime(0.0001, t);
            padGain.gain.linearRampToValueAtTime(padPeak, t + 0.65);
            padGain.gain.setValueAtTime(padPeak * 0.85, t + padDur - 0.5);
            padGain.gain.exponentialRampToValueAtTime(0.0001, t + padDur);

            padFilter.connect(padGain);
            padGain.connect(this.bgmDuckGain);
            padGain.connect(this.bgmDelay);

            harm.pad.forEach((freq) => {
                // Warped detuned pair creating chilling horror cluster shimmer
                [freq * 0.994, freq * 1.006].forEach((df, i) => {
                    const osc = this.ctx.createOscillator();
                    osc.type = i === 0 ? 'sawtooth' : 'triangle';
                    osc.frequency.setValueAtTime(df, t);
                    osc.frequency.linearRampToValueAtTime(df * 0.985, t + padDur); // Eerie tape pitch sag
                    osc.connect(padFilter);
                    osc.start(t);
                    osc.stop(t + padDur + 0.05);
                });
            });
        }

        // -----------------------------------------------------------------
        // 2. DISTANT GHOST MOAN / BUNKER FOG WIND SWEEP (Every even bar)
        // -----------------------------------------------------------------
        if (bar % 2 === 0 && s === 2 && this._bgmWindBuffer) {
            const wind = this.ctx.createBufferSource();
            wind.buffer = this._bgmWindBuffer;
            const wFilter = this.ctx.createBiquadFilter();
            wFilter.type = 'bandpass';
            wFilter.Q.setValueAtTime(4.5, t);
            wFilter.frequency.setValueAtTime(240, t);
            wFilter.frequency.exponentialRampToValueAtTime(560, t + 0.95);
            wFilter.frequency.exponentialRampToValueAtTime(190, t + 2.3);

            const wGain = this.ctx.createGain();
            wGain.gain.setValueAtTime(0.0001, t);
            wGain.gain.linearRampToValueAtTime(0.085, t + 0.85);
            wGain.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);

            wind.connect(wFilter);
            wFilter.connect(wGain);
            wGain.connect(this.bgmDuckGain);
            wGain.connect(this.bgmDelay);
            wind.start(t);
            wind.stop(t + 2.45);
        }

        // -----------------------------------------------------------------
        // 3. EERIE CREAKING HORROR PIANO / CURSED MUSIC BOX (Both modes!)
        // -----------------------------------------------------------------
        const motifNote = harm.motif[s];
        if (motifNote) {
            const pOsc = this.ctx.createOscillator();
            const pHarm = this.ctx.createOscillator();
            const pGain = this.ctx.createGain();

            pOsc.type = 'sine';
            pHarm.type = 'triangle';
            // Subtle eerie detune & downward ghostly pitch droop
            pOsc.frequency.setValueAtTime(motifNote, t);
            pOsc.frequency.exponentialRampToValueAtTime(motifNote * 0.988, t + 1.15);
            pHarm.frequency.setValueAtTime(motifNote * 2.005, t);
            pHarm.frequency.exponentialRampToValueAtTime(motifNote * 1.98, t + 0.8);

            const peak = this.bgmMode === "combat" ? 0.065 : 0.055;
            pGain.gain.setValueAtTime(0.0001, t);
            pGain.gain.linearRampToValueAtTime(peak, t + 0.015);
            pGain.gain.exponentialRampToValueAtTime(0.0001, t + 1.35);

            pOsc.connect(pGain);
            pHarm.connect(pGain);
            pGain.connect(this.bgmDuckGain);
            pGain.connect(this.bgmDelay);

            pOsc.start(t);
            pHarm.start(t);
            pOsc.stop(t + 1.4);
            pHarm.stop(t + 1.4);
        }

        // -----------------------------------------------------------------
        // 4. AMBIENT MODE: SLOW HEARTBEAT + METALLIC CLOCK TICK DREAD
        // -----------------------------------------------------------------
        if (this.bgmMode === "ambient") {
            if (s === 0 || s === 3 || s === 8 || s === 11) {
                const hb = this.ctx.createOscillator();
                const hbG = this.ctx.createGain();
                hb.type = 'sine';
                hb.frequency.setValueAtTime((s === 0 || s === 8) ? 56 : 48, t);
                hb.frequency.exponentialRampToValueAtTime(28, t + 0.22);
                const thump = (s === 0 || s === 8) ? 0.16 : 0.10;
                hbG.gain.setValueAtTime(thump, t);
                hbG.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
                hb.connect(hbG);
                hbG.connect(this.bgmDuckGain);
                hb.start(t);
                hb.stop(t + 0.25);
            }
            if ((s === 6 || s === 14) && this._bgmNoiseBuffer) {
                const tick = this.ctx.createBufferSource();
                tick.buffer = this._bgmNoiseBuffer;
                const tF = this.ctx.createBiquadFilter();
                tF.type = 'bandpass';
                tF.frequency.setValueAtTime(s === 6 ? 3200 : 2600, t);
                tF.Q.setValueAtTime(8.0, t);
                const tG = this.ctx.createGain();
                tG.gain.setValueAtTime(0.025, t);
                tG.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
                tick.connect(tF);
                tF.connect(tG);
                tG.connect(this.bgmDuckGain);
                tG.connect(this.bgmDelay);
                tick.start(t);
                tick.stop(t + 0.06);
            }
            return;
        }

        // -----------------------------------------------------------------
        // 5. COMBAT MODE: CREEPING SUB BASS + HORROR SLAM PERCUSSION + STINGS
        // -----------------------------------------------------------------
        const horrorBassSteps = [1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 1, 0];
        if (horrorBassSteps[s]) {
            const bFreq = s === 13 ? harm.root * 2.118 : harm.root * 2; // sinister minor-second crawl on step 13
            const bSaw = this.ctx.createOscillator();
            const bSub = this.ctx.createOscillator();
            const bFilter = this.ctx.createBiquadFilter();
            const bGain = this.ctx.createGain();

            bSaw.type = 'sawtooth';
            bSub.type = 'triangle';
            bSaw.frequency.setValueAtTime(bFreq, t);
            bSub.frequency.setValueAtTime(harm.root, t);

            bFilter.type = 'lowpass';
            bFilter.Q.setValueAtTime(3.8, t);
            bFilter.frequency.setValueAtTime(480, t);
            bFilter.frequency.exponentialRampToValueAtTime(115, t + stepDur * 1.4);

            bGain.gain.setValueAtTime(0.15, t);
            bGain.gain.exponentialRampToValueAtTime(0.0001, t + stepDur * 1.45);

            bSaw.connect(bFilter);
            bSub.connect(bFilter);
            bFilter.connect(bGain);
            bGain.connect(this.bgmDuckGain);

            bSaw.start(t);
            bSub.start(t);
            bSaw.stop(t + stepDur * 1.5);
            bSub.stop(t + stepDur * 1.5);
        }

        // Ominous Double Heartbeat + Cavern Sub Slam
        if (s === 0 || s === 3 || s === 8 || s === 11) {
            const kick = this.ctx.createOscillator();
            const kGain = this.ctx.createGain();
            kick.type = 'sine';
            kick.frequency.setValueAtTime((s === 0 || s === 8) ? 95 : 72, t);
            kick.frequency.exponentialRampToValueAtTime(30, t + 0.19);
            kGain.gain.setValueAtTime((s === 0 || s === 8) ? 0.30 : 0.16, t);
            kGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
            kick.connect(kGain);
            kGain.connect(this.bgmDuckGain);
            kick.start(t);
            kick.stop(t + 0.24);
        }

        // Reverberating Dark Industrial Cage Slam (beats 2 & 4)
        if (s === 4 || s === 12) {
            const slam = this.ctx.createOscillator();
            const slamG = this.ctx.createGain();
            slam.type = 'triangle';
            slam.frequency.setValueAtTime(135, t);
            slam.frequency.exponentialRampToValueAtTime(52, t + 0.14);
            slamG.gain.setValueAtTime(0.14, t);
            slamG.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
            slam.connect(slamG);
            slamG.connect(this.bgmDuckGain);
            slam.start(t);
            slam.stop(t + 0.18);

            if (this._bgmNoiseBuffer) {
                const sn = this.ctx.createBufferSource();
                sn.buffer = this._bgmNoiseBuffer;
                const snF = this.ctx.createBiquadFilter();
                snF.type = 'bandpass';
                snF.frequency.setValueAtTime(950, t);
                snF.Q.setValueAtTime(2.2, t);
                const snG = this.ctx.createGain();
                snG.gain.setValueAtTime(0.13, t);
                snG.gain.exponentialRampToValueAtTime(0.0001, t + 0.19);
                sn.connect(snF);
                snF.connect(snG);
                snG.connect(this.bgmDuckGain);
                snG.connect(this.bgmDelay);
                sn.start(t);
                sn.stop(t + 0.20);
            }
        }

        // Rusty Metallic Horror Scrape / Clock Ticks
        if ((s === 2 || s === 6 || s === 10 || s === 14 || s === 15) && this._bgmNoiseBuffer) {
            const hh = this.ctx.createBufferSource();
            hh.buffer = this._bgmNoiseBuffer;
            const hhF = this.ctx.createBiquadFilter();
            hhF.type = 'bandpass';
            hhF.frequency.setValueAtTime(s === 15 ? 4200 : 2800, t);
            hhF.Q.setValueAtTime(5.5, t);
            const hhG = this.ctx.createGain();
            hhG.gain.setValueAtTime(s === 6 || s === 14 ? 0.045 : 0.025, t);
            hhG.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
            hh.connect(hhF);
            hhF.connect(hhG);
            hhG.connect(this.bgmDuckGain);
            hhG.connect(this.bgmDelay);
            hh.start(t);
            hh.stop(t + 0.07);
        }

        // Spine-Chilling "Psycho" Dissonant Horror String Sting on Bar 4 Turnaround
        if (bar === 3 && s === 12) {
            [830.61, 880.00].forEach((f) => { // Ab5 + A5 razor minor-second cluster!
                const st = this.ctx.createOscillator();
                const stF = this.ctx.createBiquadFilter();
                const stG = this.ctx.createGain();
                st.type = 'sawtooth';
                st.frequency.setValueAtTime(f, t);
                st.frequency.exponentialRampToValueAtTime(f * 0.94, t + 0.55);
                stF.type = 'bandpass';
                stF.frequency.setValueAtTime(1400, t);
                stF.Q.setValueAtTime(3.0, t);
                stG.gain.setValueAtTime(0.035, t);
                stG.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
                st.connect(stF);
                stF.connect(stG);
                stG.connect(this.bgmDuckGain);
                stG.connect(this.bgmDelay);
                st.start(t);
                st.stop(t + 0.58);
            });
        }
    }

    /**
     * Soft-saturation waveshaper curve for guttural zombie vocal-cord grit
     */
    _createDistortionCurve(amount = 65) {
        const samples = 256;
        const curve = new Float32Array(samples);
        const deg = Math.PI / 180;
        for (let i = 0; i < samples; ++i) {
            const x = (i * 2) / samples - 1;
            curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
        }
        return curve;
    }

    /**
     * Immediately silence any active welcome horror roar nodes cleanly
     */
    stopWelcomeRoar() {
        if (this.welcomeMasterGain && this.ctx) {
            try {
                const t = this.ctx.currentTime;
                this.welcomeMasterGain.gain.cancelScheduledValues(t);
                this.welcomeMasterGain.gain.setValueAtTime(this.welcomeMasterGain.gain.value, t);
                this.welcomeMasterGain.gain.linearRampToValueAtTime(0.0001, t + 0.08);
            } catch (e) {}
        }
        const nodes = this.welcomeNodes || [];
        setTimeout(() => {
            for (const n of nodes) {
                try { if (typeof n.stop === 'function') n.stop(); } catch (e) {}
                try { if (typeof n.disconnect === 'function') n.disconnect(); } catch (e) {}
            }
        }, 100);
        this.welcomeNodes = [];
        this.welcomeMasterGain = null;
    }

    /**
     * Intercepted Horror Bio-Hazard Zombie Call Synthesizer (~3.7s multi-layered horror roar)
     * Combines sub-bass tritone dread drone, glottal AM/FM rattling vocal formants,
     * blood-curdling horror screech harmonics, wet breath hiss, and cavernous bunker echo.
     */
    playZombieWelcomeRoar() {
        this.init();
        if (this.muted) return;
        this.stopWelcomeRoar();
        this.duckBackgroundMusic(3.8);

        const now = this.ctx.currentTime;
        const totalDur = 3.7;
        const activeNodes = [];

        // Master Compressor & Bus
        const compressor = this.ctx.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-16, now);
        compressor.knee.setValueAtTime(14, now);
        compressor.ratio.setValueAtTime(6, now);
        compressor.attack.setValueAtTime(0.005, now);
        compressor.release.setValueAtTime(0.25, now);

        const masterGain = this.ctx.createGain();
        masterGain.gain.setValueAtTime(0.85, now);
        masterGain.gain.setValueAtTime(0.85, now + 3.1);
        masterGain.gain.exponentialRampToValueAtTime(0.0001, now + totalDur);

        masterGain.connect(compressor);
        compressor.connect(this.ctx.destination);
        this.welcomeMasterGain = masterGain;
        activeNodes.push(masterGain, compressor);

        // Cavernous Dark Bunker Echo Send
        const echoDelay = this.ctx.createDelay(1.0);
        echoDelay.delayTime.setValueAtTime(0.19, now);
        const echoFeedback = this.ctx.createGain();
        echoFeedback.gain.setValueAtTime(0.42, now);
        const echoFilter = this.ctx.createBiquadFilter();
        echoFilter.type = 'lowpass';
        echoFilter.frequency.setValueAtTime(680, now);
        const echoWetGain = this.ctx.createGain();
        echoWetGain.gain.setValueAtTime(0.45, now);

        echoDelay.connect(echoFilter);
        echoFilter.connect(echoFeedback);
        echoFeedback.connect(echoDelay);
        echoFilter.connect(echoWetGain);
        echoWetGain.connect(masterGain);
        activeNodes.push(echoDelay, echoFeedback, echoFilter, echoWetGain);

        // -----------------------------------------------------------------
        // LAYER 1: Eerie Crypt Bell Sting + Sub-Bass Tritone Horror Dread
        // -----------------------------------------------------------------
        [740, 785].forEach((freq) => {
            const ping = this.ctx.createOscillator();
            const pingGain = this.ctx.createGain();
            ping.type = 'sine';
            ping.frequency.setValueAtTime(freq, now);
            ping.frequency.exponentialRampToValueAtTime(freq * 0.96, now + 2.2);
            pingGain.gain.setValueAtTime(0.055, now + 0.02);
            pingGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.3);
            ping.connect(pingGain);
            pingGain.connect(masterGain);
            pingGain.connect(echoDelay);
            ping.start(now + 0.02);
            ping.stop(now + 2.35);
            activeNodes.push(ping, pingGain);
        });

        const subFilter = this.ctx.createBiquadFilter();
        subFilter.type = 'lowpass';
        subFilter.frequency.setValueAtTime(175, now);
        subFilter.frequency.linearRampToValueAtTime(85, now + 3.4);

        const subGain = this.ctx.createGain();
        subGain.gain.setValueAtTime(0.001, now);
        subGain.gain.linearRampToValueAtTime(0.32, now + 0.35);
        subGain.gain.setValueAtTime(0.28, now + 2.0);
        subGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.55);

        subFilter.connect(subGain);
        subGain.connect(masterGain);

        // Sinister D#1 (38.9 Hz) + A1 (55 Hz) tritone rumble
        [38.9, 55.0].forEach((f, idx) => {
            const subOsc = this.ctx.createOscillator();
            subOsc.type = idx === 0 ? 'sawtooth' : 'triangle';
            subOsc.frequency.setValueAtTime(f, now);
            subOsc.frequency.linearRampToValueAtTime(f * 0.78, now + 3.5);
            subOsc.connect(subFilter);
            subOsc.start(now);
            subOsc.stop(now + 3.6);
            activeNodes.push(subOsc);
        });
        activeNodes.push(subFilter, subGain);

        // -----------------------------------------------------------------
        // LAYER 2: Multi-Formant Guttural Zombie Throat Growl & Glottal Rasp
        // -----------------------------------------------------------------
        const shaper = this.ctx.createWaveShaper();
        shaper.curve = this._createDistortionCurve(70);
        shaper.oversample = '2x';

        const formant1 = this.ctx.createBiquadFilter();
        formant1.type = 'bandpass';
        formant1.frequency.setValueAtTime(190, now + 0.1);
        formant1.frequency.exponentialRampToValueAtTime(420, now + 0.95);
        formant1.frequency.exponentialRampToValueAtTime(210, now + 3.1);
        formant1.Q.setValueAtTime(4.2, now);

        const formant2 = this.ctx.createBiquadFilter();
        formant2.type = 'bandpass';
        formant2.frequency.setValueAtTime(620, now + 0.1);
        formant2.frequency.exponentialRampToValueAtTime(1240, now + 0.95);
        formant2.frequency.exponentialRampToValueAtTime(490, now + 3.1);
        formant2.Q.setValueAtTime(5.0, now);

        const throatGain = this.ctx.createGain();
        throatGain.gain.setValueAtTime(0.001, now);
        throatGain.gain.linearRampToValueAtTime(0.18, now + 0.25);
        throatGain.gain.linearRampToValueAtTime(0.62, now + 0.85);
        throatGain.gain.linearRampToValueAtTime(0.45, now + 1.85);
        throatGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.25);

        shaper.connect(formant1);
        shaper.connect(formant2);
        formant1.connect(throatGain);
        formant2.connect(throatGain);
        throatGain.connect(masterGain);
        throatGain.connect(echoDelay);

        // Detuned monstrous vocal cord oscillators
        const growl1 = this.ctx.createOscillator();
        const growl2 = this.ctx.createOscillator();
        const growlSub = this.ctx.createOscillator();

        growl1.type = 'sawtooth';
        growl2.type = 'sawtooth';
        growlSub.type = 'triangle';

        const shapePitch = (osc, scale) => {
            osc.frequency.setValueAtTime(52 * scale, now + 0.1);
            osc.frequency.exponentialRampToValueAtTime(42 * scale, now + 0.35);
            osc.frequency.exponentialRampToValueAtTime(92 * scale, now + 0.85);
            osc.frequency.exponentialRampToValueAtTime(68 * scale, now + 1.65);
            osc.frequency.exponentialRampToValueAtTime(44 * scale, now + 2.45);
            osc.frequency.exponentialRampToValueAtTime(24 * scale, now + 3.25);
        };
        shapePitch(growl1, 1.0);
        shapePitch(growl2, 1.045);
        shapePitch(growlSub, 0.5);

        // Rattle FM LFO (wet throaty vocal cord crackle ~27 Hz -> 16 Hz)
        const rattleLfo = this.ctx.createOscillator();
        rattleLfo.type = 'sine';
        rattleLfo.frequency.setValueAtTime(28, now + 0.1);
        rattleLfo.frequency.linearRampToValueAtTime(16, now + 3.1);

        const fmGain = this.ctx.createGain();
        fmGain.gain.setValueAtTime(14, now);
        rattleLfo.connect(fmGain);
        fmGain.connect(growl1.frequency);
        fmGain.connect(growl2.frequency);

        // Glottal AM flutter
        const amGain = this.ctx.createGain();
        amGain.gain.setValueAtTime(0.14, now);
        rattleLfo.connect(amGain);
        amGain.connect(throatGain.gain);

        growl1.connect(shaper);
        growl2.connect(shaper);
        growlSub.connect(shaper);

        growl1.start(now + 0.1);
        growl2.start(now + 0.1);
        growlSub.start(now + 0.1);
        rattleLfo.start(now + 0.1);

        growl1.stop(now + 3.3);
        growl2.stop(now + 3.3);
        growlSub.stop(now + 3.3);
        rattleLfo.stop(now + 3.3);
        activeNodes.push(shaper, formant1, formant2, throatGain, growl1, growl2, growlSub, rattleLfo, fmGain, amGain);

        // -----------------------------------------------------------------
        // LAYER 3: Possessed Horror Screech Harmonics (0.55s -> 2.35s)
        // -----------------------------------------------------------------
        const screechFilter = this.ctx.createBiquadFilter();
        screechFilter.type = 'bandpass';
        screechFilter.frequency.setValueAtTime(980, now + 0.55);
        screechFilter.frequency.exponentialRampToValueAtTime(1850, now + 1.05);
        screechFilter.frequency.exponentialRampToValueAtTime(680, now + 2.3);
        screechFilter.Q.setValueAtTime(6.5, now);

        const screechGain = this.ctx.createGain();
        screechGain.gain.setValueAtTime(0.0001, now + 0.55);
        screechGain.gain.linearRampToValueAtTime(0.16, now + 0.92);
        screechGain.gain.linearRampToValueAtTime(0.12, now + 1.45);
        screechGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.35);

        screechFilter.connect(screechGain);
        screechGain.connect(masterGain);
        screechGain.connect(echoDelay);

        const screechVib = this.ctx.createOscillator();
        screechVib.frequency.setValueAtTime(18, now + 0.55);
        const screechVibDepth = this.ctx.createGain();
        screechVibDepth.gain.setValueAtTime(16, now);
        screechVib.connect(screechVibDepth);

        [345, 368].forEach((f, idx) => {
            const sOsc = this.ctx.createOscillator();
            sOsc.type = 'sawtooth';
            sOsc.frequency.setValueAtTime(f, now + 0.55);
            sOsc.frequency.exponentialRampToValueAtTime(f * 1.42, now + 1.0);
            sOsc.frequency.exponentialRampToValueAtTime(f * 0.72, now + 2.3);
            screechVibDepth.connect(sOsc.frequency);
            sOsc.connect(screechFilter);
            sOsc.start(now + 0.55);
            sOsc.stop(now + 2.4);
            activeNodes.push(sOsc);
        });
        screechVib.start(now + 0.55);
        screechVib.stop(now + 2.4);
        activeNodes.push(screechFilter, screechGain, screechVib, screechVibDepth);

        // -----------------------------------------------------------------
        // LAYER 4: Wet Flesh Inhale/Exhale Hiss & Radio Transmission Static
        // -----------------------------------------------------------------
        const noiseDur = 3.55;
        const bufferSize = Math.floor(this.ctx.sampleRate * noiseDur);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            // Warm brownish-pink texture blends breath hiss + radio crackle
            lastOut = (lastOut + 0.08 * white) / 1.08;
            data[i] = white * 0.45 + lastOut * 1.6;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(2200, now);
        noiseFilter.frequency.linearRampToValueAtTime(1100, now + 0.5);
        noiseFilter.frequency.exponentialRampToValueAtTime(2600, now + 1.1);
        noiseFilter.frequency.exponentialRampToValueAtTime(650, now + 3.4);
        noiseFilter.Q.setValueAtTime(1.8, now);

        const noiseGain = this.ctx.createGain();
        // Walkie-talkie squelch click -> wet inhale -> roaring exhale -> ragged dying hiss -> static drop
        noiseGain.gain.setValueAtTime(0.24, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.03, now + 0.09);
        noiseGain.gain.linearRampToValueAtTime(0.18, now + 0.35);
        noiseGain.gain.linearRampToValueAtTime(0.32, now + 0.95);
        noiseGain.gain.linearRampToValueAtTime(0.15, now + 2.1);
        noiseGain.gain.linearRampToValueAtTime(0.19, now + 2.55);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.5);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(masterGain);
        noiseGain.connect(echoDelay);

        noise.start(now);
        noise.stop(now + noiseDur);
        activeNodes.push(noise, noiseFilter, noiseGain);

        this.welcomeNodes = activeNodes;
    }
}

window.soundController = new SoundController();
