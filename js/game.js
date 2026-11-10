/**
 * STRESS ZOMBIE APOCALYPSE - Main Game Engine
 * Includes Hydrostatic Water Jet Cannon, Screen Shake, 10-Sector Campaign,
 * Slicing Particle FX, Combo Fanfares, and Educational Popups.
 */

function traceChamferBox(ctx, x, y, w, h, c = 6) {
    ctx.beginPath();
    ctx.moveTo(x + c, y);
    ctx.lineTo(x + w - c, y);
    ctx.lineTo(x + w, y + c);
    ctx.lineTo(x + w, y + h - c);
    ctx.lineTo(x + w - c, y + h);
    ctx.lineTo(x + c, y + h);
    ctx.lineTo(x, y + h - c);
    ctx.lineTo(x, y + c);
    ctx.closePath();
}

class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    emit(x, y, color, count = 20, speed = 4, type = "spark") {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const velocity = (0.5 + Math.random() * 0.5) * speed;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity,
                color,
                size: type === "water" ? 3 + Math.random() * 4 : 2 + Math.random() * 3,
                life: 1.0,
                decay: type === "water" ? 0.015 + Math.random() * 0.02 : 0.02 + Math.random() * 0.03,
                type
            });
        }
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            if (p.type === "water") {
                p.vy += 0.08; // Gravity on water drops
            }
            p.life -= p.decay;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        ctx.save();
        for (const p of this.particles) {
            const alpha = Math.max(0, p.life);
            ctx.globalAlpha = alpha;
            if (p.type === "water") {
                // 3D glossy anime water droplet with bright rim & catchlight
                const rad = Math.max(1.2, p.size * (0.45 + 0.55 * alpha));
                const wGrad = ctx.createRadialGradient(p.x - rad * 0.35, p.y - rad * 0.35, rad * 0.1, p.x, p.y, rad);
                wGrad.addColorStop(0, "#ffffff");
                wGrad.addColorStop(0.45, p.color);
                wGrad.addColorStop(1, "rgba(0, 110, 220, 0.35)");
                ctx.fillStyle = wGrad;
                ctx.beginPath();
                ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // High-energy anime spark streak + white-hot core
                const ang = Math.atan2(p.vy, p.vx);
                const spd = Math.min(12, Math.hypot(p.vx, p.vy) * 2.2);
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(ang);
                ctx.fillStyle = p.color;
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.moveTo(p.size + spd, 0);
                ctx.lineTo(0, p.size * 0.55);
                ctx.lineTo(-p.size - spd * 0.6, 0);
                ctx.lineTo(0, -p.size * 0.55);
                ctx.closePath();
                ctx.fill();
                ctx.shadowBlur = 0;
                ctx.fillStyle = "#ffffff";
                ctx.beginPath();
                ctx.arc(0, 0, p.size * 0.32, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }
        ctx.restore();
    }
}

const LEVEL_CONFIGS = [
    {
        id: 1,
        title: "Straight Pull",
        badge: "PURE TENSION",
        badgeColor: "rgba(0, 229, 255, 0.16)",
        textColor: "var(--cyan-glow)",
        description: "Pull along one axis only. Aim at 0° or 90° and fire.",
        icon: "⚡"
    },
    {
        id: 2,
        title: "Two-Way Pull",
        badge: "BIAXIAL σx & σy",
        badgeColor: "rgba(0, 229, 255, 0.16)",
        textColor: "var(--cyan-glow)",
        description: "Both axes pull at once. Lock onto the stronger tension σ1.",
        icon: "🧱"
    },
    {
        id: 3,
        title: "Angled Shear",
        badge: "SHEAR ROTATION",
        badgeColor: "rgba(255, 145, 0, 0.16)",
        textColor: "var(--orange-glow)",
        description: "Shear tilts the weak angle! Match Mohr's Circle to unlock your gun.",
        icon: "🌀"
    },
    {
        id: 4,
        title: "Brittle & Ductile",
        badge: "CYAN σ1 • ORANGE τmax",
        badgeColor: "rgba(0, 230, 118, 0.16)",
        textColor: "var(--green-glow)",
        description: "Cyan cracks at tension σ1; Orange melts at peak shear τmax.",
        icon: "🩸"
    },
    {
        id: 5,
        title: "Armored Wave",
        badge: "USE [5] HYDRO-JET",
        badgeColor: "rgba(0, 229, 255, 0.2)",
        textColor: "var(--cyan-glow)",
        description: "Tough orange armor! Press [5] Hydro-Jet to quench them into cyan.",
        icon: "💧"
    },
    {
        id: 6,
        title: "Color Changers",
        badge: "SHIFTING WEAKNESS",
        badgeColor: "rgba(179, 136, 255, 0.16)",
        textColor: "var(--purple-glow)",
        description: "Zombies flip Cyan ↔ Orange as they walk. Match their current glow!",
        icon: "🔮"
    },
    {
        id: 7,
        title: "Linked Twins",
        badge: "SAME ANGLE PAIRS",
        badgeColor: "rgba(0, 230, 118, 0.16)",
        textColor: "var(--green-glow)",
        description: "Twins share one weak plane. Lock once and burst both down.",
        icon: "👥"
    },
    {
        id: 8,
        title: "Speed Rush",
        badge: "USE [4] SHIELD",
        badgeColor: "rgba(255, 230, 0, 0.18)",
        textColor: "var(--yellow-glow)",
        description: "Fast horde! Press [4] Shield to block hits while you aim.",
        icon: "🛡️"
    },
    {
        id: 9,
        title: "Titan Boss",
        badge: "BOSS (600 HP)",
        badgeColor: "rgba(255, 23, 68, 0.2)",
        textColor: "var(--red-glow)",
        description: "Giant boss! Stay locked on its critical angle and hold fire.",
        icon: "☠️"
    },
    {
        id: 10,
        title: "Endless Mode",
        badge: "INFINITE WAVES",
        badgeColor: "rgba(255, 230, 0, 0.18)",
        textColor: "var(--yellow-glow)",
        description: "Random mixed waves that never end—survive for a high score!",
        icon: "♾️"
    }
];

class GameEngine {
    constructor() {
        this.canvas = document.getElementById("battleCanvas");
        this.ctx = this.canvas ? this.canvas.getContext("2d") : null;
        this.width = this.canvas ? this.canvas.width : 840;
        this.height = this.canvas ? this.canvas.height : 480;

        this.hud = new TacticalHUD("mohrCanvas");
        this.particles = new ParticleSystem();

        // Game State ("menu" on startup until user picks an unlocked sector on Level Map)
        this.state = "menu"; // menu, playing, level_clear, game_over
        this.level = 1;
        this.score = 0;
        this.baseHealth = 100;
        this.maxBaseHealth = 100;
        this.streak = 0;
        this.screenShake = 0;

        // Campaign Level Progression & Locking
        this.maxUnlockedLevel = 1;
        this.levelHighScores = {};
        this.levelStars = {};
        this.loadProgression();

        // Wave tracking
        this.zombies = [];
        this.zombiesToSpawn = [];
        this.spawnTimer = 0;

        // Visual effects & Machine Gun Ballistics
        this.bullets = [];
        this.casings = [];
        this.queuedShots = [];
        this.muzzleFlash = 0;
        this.gunRecoil = 0;
        this.fireCooldown = 0;
        this.isFiringHeld = false;
        this.lockShakeTimer = 0;
        this.waterJetEffect = null; // { progress: 0 }

        // Power-ups
        this.powerups = {
            slowmo: { count: 2, active: false, timer: 0, duration: 300 },
            hint: { count: 3, active: false, timer: 0, duration: 240 },
            scanner: { count: 2, active: false, timer: 0, duration: 360 },
            shield: { count: 1, active: false, timer: 0, duration: 300 },
            hydro: { count: 2, active: false, timer: 0, duration: 60 }
        };

        // Diagnostics
        this.diagnostics = {
            totalCuts: 0,
            perfectHits: 0,
            confusedShearForNormal: 0,
            confusedNormalForShear: 0,
            killsByType: { brittle: 0, ductile: 0, shapeshifter: 0, twin: 0, boss: 0 }
        };

        // Active Level Tactical Stats (Debriefing Report)
        this.levelStats = {
            cuts: 0,
            crits: 0,
            deflections: 0,
            kills: 0,
            killsByType: {},
            theoriesUsed: [],
            maxStreak: 0
        };

        // Per-Zombie Mechanics Reports (Live card per kill + Full Post-Level Inspector)
        this.sessionAutopsies = [];
        this.levelAutopsies = [];
        this.reportSelectedIdx = 0;
        this.reportExploreAngle = 22.5;
        this.liveKillTimer = null;

        // Cached static offscreen canvas for detailed multi-layered horror scenery
        this.bgCacheCanvas = null;
        this.bgCacheKey = "";
        this._introDismissedAt = 0;
        this.isTutorial = false;
        this.tutorialCoachKey = "";

        // Interactive 3D Zombie Level Map state
        this._levelMapRafActive = false;
        this._levelMapTutorialActor = null;
        this._levelMapDioramaActors = null;
        this._levelMapCardActors = null;
        this._levelMapNodeHits = [];
        this._hoveredMapLevel = null;
        this._mapSilCanvas = null;

        this.initEventListeners();
        this.initIntroSplash();
        this.initWelcomeCanvas();
        this.updateTutorialBadges();
        this.updateHUDStats();
    }

    initIntroSplash() {
        const overlay = document.getElementById("introSplashOverlay");
        const cvs = document.getElementById("introSplashCanvas");
        const fillEl = document.getElementById("introProgressFill");
        const welcomeModal = document.getElementById("welcomeModal");
        if (!overlay || !cvs) {
            if (welcomeModal) welcomeModal.classList.add("visible");
            return;
        }
        const ctx = cvs.getContext("2d");
        if (!ctx) {
            overlay.classList.remove("visible");
            if (welcomeModal) welcomeModal.classList.add("visible");
            return;
        }

        const resize = () => {
            cvs.width = window.innerWidth;
            cvs.height = window.innerHeight;
        };
        resize();
        window.addEventListener("resize", resize);

        const SPLASH_DURATION_MS = 10000;
        const startTime = performance.now();
        let dismissed = false;
        let rafId = null;

        // Build animated showcase zombies using existing stylized comic-horror Zombie renderers
        const createActor = (type, baseX, targetX, faceDir, scaleMul, speed, height = 92, width = 56) => ({
            zombie: new Zombie({ type, name: type, sx: 80, sy: 20, txy: 30, speed: 0.5, height, width }),
            baseX,
            targetX,
            faceDir, // -1 faces right (mirrored), +1 faces left
            scaleMul,
            speed
        });

        const actors = [
            createActor("boss", 0.50, 0.50, 1, 0.96, 0.036, 145, 95),
            createActor("twin", 0.14, 0.24, -1, 0.98, 0.052),
            createActor("shapeshifter", 0.86, 0.76, 1, 0.98, 0.050),
            createActor("brittle", 0.22, 0.34, -1, 1.24, 0.048),
            createActor("ductile", 0.78, 0.66, 1, 1.26, 0.054)
        ];

        // Rising horror embers & fog clouds
        const embers = [];
        for (let i = 0; i < 34; i++) {
            embers.push({
                x: Math.random(),
                y: 0.4 + Math.random() * 0.6,
                vy: 0.0008 + Math.random() * 0.0018,
                vx: (Math.random() - 0.5) * 0.0005,
                size: 1.5 + Math.random() * 3,
                phase: Math.random() * Math.PI * 2,
                color: i % 3 === 0 ? "0, 229, 255" : (i % 3 === 1 ? "255, 110, 40" : "255, 23, 68")
            });
        }

        const bats = [
            { x: 0.12, y: 0.20, speed: 0.00055, wing: 0 },
            { x: 0.22, y: 0.15, speed: 0.00072, wing: 1.8 },
            { x: 0.68, y: 0.17, speed: -0.00062, wing: 0.9 }
        ];

        const dismiss = () => {
            if (dismissed) return;
            dismissed = true;
            this._introDismissedAt = Date.now();
            if (fillEl) fillEl.style.width = "100%";
            overlay.classList.remove("visible");
            if (welcomeModal) {
                welcomeModal.classList.add("visible");
            }
            window.removeEventListener("resize", resize);
            setTimeout(() => {
                if (rafId) cancelAnimationFrame(rafId);
            }, 720);
        };

        this.dismissIntroSplash = dismiss;

        overlay.addEventListener("click", dismiss);
        overlay.addEventListener("touchstart", dismiss, { passive: true });

        const renderSplash = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(1, elapsed / SPLASH_DURATION_MS);
            if (!dismissed && fillEl) {
                fillEl.style.width = `${(progress * 100).toFixed(1)}%`;
            }

            if (!dismissed && elapsed >= SPLASH_DURATION_MS) {
                dismiss();
            }

            const W = cvs.width;
            const H = cvs.height;
            const t = elapsed * 0.001;
            const groundY = H * 0.80;
            const baseScale = Math.max(0.82, Math.min(1.55, Math.min(W / 860, H / 520)));

            // Periodic spooky lightning silhouette flashes across the 10s intro (~1.85s, ~4.45s, ~7.15s, ~9.05s)
            const flashWave1 = Math.max(0, 1 - Math.abs(t - 1.85) * 9);
            const flashWave2 = Math.max(0, 1 - Math.abs(t - 4.45) * 10);
            const flashWave3 = Math.max(0, 1 - Math.abs(t - 7.15) * 9);
            const flashWave4 = Math.max(0, 1 - Math.abs(t - 9.05) * 10);
            const lightning = Math.max(flashWave1, flashWave2, flashWave3, flashWave4);

            // 1. Haunted Anime Twilight Sky Gradient
            const sky = ctx.createLinearGradient(0, 0, 0, H);
            sky.addColorStop(0, "#02050d");
            sky.addColorStop(0.38, lightning > 0.1 ? `rgba(22, 52, 74, ${0.88 + lightning * 0.12})` : "#081726");
            sky.addColorStop(0.72, "#240a16");
            sky.addColorStop(1, "#03050a");
            ctx.fillStyle = sky;
            ctx.fillRect(0, 0, W, H);

            // Subtle lightning flash haze + forked anime lightning bolt
            if (lightning > 0.02) {
                ctx.fillStyle = `rgba(175, 242, 255, ${lightning * 0.24})`;
                ctx.fillRect(0, 0, W, H);
            }
            if (lightning > 0.14) {
                ctx.save();
                const boltX = (flashWave2 > 0.1 || flashWave4 > 0.1) ? W * 0.23 : W * 0.72;
                ctx.strokeStyle = `rgba(210, 248, 255, ${Math.min(1, lightning * 1.15)})`;
                ctx.shadowColor = "#00e5ff";
                ctx.shadowBlur = 18;
                ctx.lineWidth = 2.8;
                ctx.beginPath();
                ctx.moveTo(boltX, 0);
                ctx.lineTo(boltX - 18, H * 0.14);
                ctx.lineTo(boltX + 12, H * 0.25);
                ctx.lineTo(boltX - 14, H * 0.42);
                ctx.lineTo(boltX + 6, H * 0.54);
                ctx.stroke();
                ctx.lineWidth = 1.4;
                ctx.beginPath();
                ctx.moveTo(boltX + 12, H * 0.25);
                ctx.lineTo(boltX + 38, H * 0.37);
                ctx.moveTo(boltX - 14, H * 0.42);
                ctx.lineTo(boltX - 38, H * 0.51);
                ctx.stroke();
                ctx.restore();
            }

            // 2. Full 3D Shaded Horror Moon upper right behind silhouette trees
            const moonX = W * 0.77;
            const moonY = H * 0.25;
            const moonR = Math.max(42, Math.min(W, H) * 0.125);
            const moonHalo = ctx.createRadialGradient(moonX, moonY, moonR * 0.4, moonX, moonY, moonR * 3.4);
            moonHalo.addColorStop(0, "rgba(255, 224, 178, 0.42)");
            moonHalo.addColorStop(0.42, "rgba(255, 70, 90, 0.15)");
            moonHalo.addColorStop(1, "rgba(0, 0, 0, 0)");
            ctx.fillStyle = moonHalo;
            ctx.beginPath();
            ctx.arc(moonX, moonY, moonR * 3.4, 0, Math.PI * 2);
            ctx.fill();

            ctx.save();
            ctx.beginPath();
            ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
            ctx.clip();
            const moonSphere = ctx.createRadialGradient(
                moonX - moonR * 0.34, moonY - moonR * 0.32, moonR * 0.12,
                moonX + moonR * 0.12, moonY + moonR * 0.12, moonR * 1.25
            );
            moonSphere.addColorStop(0, "#fff8e8");
            moonSphere.addColorStop(0.62, "#f0dfc0");
            moonSphere.addColorStop(1, "#7c6858");
            ctx.fillStyle = moonSphere;
            ctx.fillRect(moonX - moonR, moonY - moonR, moonR * 2, moonR * 2);

            // Moon craters
            ctx.fillStyle = "rgba(155, 130, 106, 0.36)";
            ctx.beginPath();
            ctx.arc(moonX - moonR * 0.28, moonY - moonR * 0.15, moonR * 0.2, 0, Math.PI * 2);
            ctx.arc(moonX + moonR * 0.22, moonY + moonR * 0.26, moonR * 0.14, 0, Math.PI * 2);
            ctx.arc(moonX + moonR * 0.12, moonY - moonR * 0.36, moonR * 0.09, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            ctx.beginPath();
            ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(255, 245, 224, 0.45)";
            ctx.lineWidth = 1.6;
            ctx.stroke();

            // Diagonal volumetric moonlight beams slicing past cloud bank
            ctx.save();
            for (let b = 0; b < 3; b++) {
                const beamShift = Math.sin(t * 0.45 + b * 1.7) * 18;
                const bx0 = moonX - moonR * (0.4 + b * 0.9) + beamShift;
                const beamGrad = ctx.createLinearGradient(bx0, moonY, bx0 - W * 0.28, groundY + 40);
                beamGrad.addColorStop(0, "rgba(195, 238, 255, 0.075)");
                beamGrad.addColorStop(0.65, "rgba(0, 229, 255, 0.03)");
                beamGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
                ctx.fillStyle = beamGrad;
                ctx.beginPath();
                ctx.moveTo(bx0 - 22, 0);
                ctx.lineTo(bx0 + 36, 0);
                ctx.lineTo(bx0 - W * 0.22 + 95, groundY + 40);
                ctx.lineTo(bx0 - W * 0.22 - 45, groundY + 40);
                ctx.closePath();
                ctx.fill();
            }
            ctx.restore();

            // 3. 3D Tilted Spinning Mohr's Circle Gyroscope Hologram behind game title
            ctx.save();
            ctx.translate(W * 0.5, H * 0.23);
            const crestR = Math.min(W, H) * 0.21;
            for (let ring = 0; ring < 3; ring++) {
                ctx.save();
                const tilt = ring === 0 ? 0.35 : (ring === 1 ? -0.45 : 0.05);
                const spin = t * (ring === 0 ? 0.5 : (ring === 1 ? -0.68 : 0.28));
                const ryScale = ring === 2 ? 0.92 : (0.34 + 0.16 * Math.abs(Math.sin(t * 0.8 + ring)));
                ctx.rotate(tilt + Math.sin(t * 0.35 + ring) * 0.12);
                ctx.scale(1, ryScale);
                ctx.rotate(spin);
                ctx.strokeStyle = ring === 1 ? "rgba(255, 23, 68, 0.22)" : "rgba(0, 229, 255, 0.19)";
                ctx.lineWidth = 2.0;
                ctx.setLineDash(ring === 2 ? [10, 6] : []);
                ctx.beginPath();
                ctx.arc(0, 0, crestR * (1 - ring * 0.12), 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
                // 2-theta principal node bead orbiting gyroscope ring
                const nodeR = crestR * (1 - ring * 0.12);
                ctx.fillStyle = ring === 1 ? "rgba(255, 82, 82, 0.45)" : "rgba(0, 229, 255, 0.45)";
                ctx.beginPath();
                ctx.arc(nodeR, 0, 4.2, 0, Math.PI * 2);
                ctx.arc(-nodeR, 0, 4.2, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
            ctx.restore();

            // 4. Silhouette Bats gliding across night sky
            ctx.fillStyle = "#04060b";
            for (const bat of bats) {
                bat.x = (bat.x + bat.speed + 1) % 1;
                const bx = bat.x * W;
                const by = bat.y * H + Math.sin(t * 3.5 + bat.wing) * 8;
                const flap = Math.sin(t * 14 + bat.wing) * 7;
                ctx.beginPath();
                ctx.moveTo(bx, by);
                ctx.quadraticCurveTo(bx - 9, by - 7 - flap, bx - 18, by - flap);
                ctx.lineTo(bx - 7, by + 3);
                ctx.lineTo(bx, by + 1);
                ctx.lineTo(bx + 7, by + 3);
                ctx.lineTo(bx + 18, by - flap);
                ctx.quadraticCurveTo(bx + 9, by - 7 - flap, bx, by);
                ctx.fill();
            }

            // 5. Flanking Gnarled Silhouette Trees & 3D Extruded Gravestones + Perspective Stone Walk
            this.drawGnarledTree(ctx, W * 0.05, groundY + 12, H * 0.56, 0.32, Math.max(0.95, baseScale * 1.15), "#050910");
            this.drawGnarledTree(ctx, W * 0.95, groundY + 12, H * 0.48, -0.34, Math.max(0.85, baseScale * 1.05), "#050910");

            const groundGrad = ctx.createLinearGradient(0, groundY - 22, 0, H);
            groundGrad.addColorStop(0, "#09101a");
            groundGrad.addColorStop(0.55, "#050911");
            groundGrad.addColorStop(1, "#020408");
            ctx.fillStyle = groundGrad;
            ctx.beginPath();
            ctx.moveTo(0, groundY + 12);
            ctx.quadraticCurveTo(W * 0.25, groundY - 22, W * 0.5, groundY - 12);
            ctx.quadraticCurveTo(W * 0.78, groundY - 26, W, groundY + 10);
            ctx.lineTo(W, H);
            ctx.lineTo(0, H);
            ctx.closePath();
            ctx.fill();

            // 3D Perspective Cemetery Stone Walkway receding to horizon
            ctx.save();
            const vpX = W * 0.50;
            const vpY = groundY - 12;
            const pathGrad = ctx.createLinearGradient(0, vpY, 0, H);
            pathGrad.addColorStop(0, "rgba(22, 34, 48, 0.45)");
            pathGrad.addColorStop(0.55, "rgba(18, 28, 40, 0.85)");
            pathGrad.addColorStop(1, "#0c141f");
            ctx.fillStyle = pathGrad;
            ctx.beginPath();
            ctx.moveTo(vpX - W * 0.04, vpY);
            ctx.lineTo(vpX + W * 0.04, vpY);
            ctx.lineTo(vpX + W * 0.34, H);
            ctx.lineTo(vpX - W * 0.34, H);
            ctx.closePath();
            ctx.fill();

            // Perspective stone paver bands + curb highlights
            ctx.strokeStyle = "rgba(0, 229, 255, 0.14)";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(vpX - W * 0.04, vpY);
            ctx.lineTo(vpX - W * 0.34, H);
            ctx.moveTo(vpX + W * 0.04, vpY);
            ctx.lineTo(vpX + W * 0.34, H);
            ctx.stroke();

            ctx.strokeStyle = "rgba(120, 175, 200, 0.12)";
            ctx.lineWidth = 1;
            for (let row = 1; row <= 6; row++) {
                const pFrac = Math.pow(row / 6, 1.85);
                const py = vpY + (H - vpY) * pFrac;
                const halfW = W * (0.04 + 0.30 * pFrac);
                ctx.beginPath();
                ctx.moveTo(vpX - halfW, py);
                ctx.lineTo(vpX + halfW, py);
                ctx.stroke();
            }
            ctx.restore();

            // 3D Extruded Crooked Graveyard Stones along horizon (front + side depth face + rim highlight)
            const stones = [0.09, 0.19, 0.37, 0.63, 0.81, 0.91];
            stones.forEach((sxFrac, idx) => {
                const gx = sxFrac * W;
                const gy = groundY - 4;
                ctx.save();
                ctx.translate(gx, gy);
                ctx.rotate((idx % 2 === 0 ? -1 : 1) * 0.075);
                // Side 3D extrusion depth
                ctx.fillStyle = "#060a10";
                ctx.fillRect(10, -26, 6, 30);
                // Front stone face
                const sGrad = ctx.createLinearGradient(-10, -36, 10, 4);
                sGrad.addColorStop(0, "#1d293a");
                sGrad.addColorStop(1, "#0b121c");
                ctx.fillStyle = sGrad;
                ctx.fillRect(-10, -28, 20, 32);
                ctx.beginPath();
                ctx.arc(0, -28, 10, Math.PI, 0);
                ctx.fill();
                // Moonlit top/left bevel rim
                ctx.strokeStyle = "rgba(180, 225, 255, 0.25)";
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(-10, 4);
                ctx.lineTo(-10, -28);
                ctx.arc(0, -28, 10, Math.PI, -0.3);
                ctx.stroke();
                ctx.restore();
            });

            // 6. Swirling Background Graveyard Mist behind zombies
            for (let m = 0; m < 4; m++) {
                const mx = ((m * 0.35 + t * (0.04 + m * 0.012)) % 1.3 - 0.15) * W;
                const my = groundY - 12 + m * 14;
                const mistGrad = ctx.createRadialGradient(mx, my, 10, mx, my, W * 0.28);
                mistGrad.addColorStop(0, m % 2 === 0 ? "rgba(70, 175, 175, 0.18)" : "rgba(180, 35, 55, 0.14)");
                mistGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
                ctx.fillStyle = mistGrad;
                ctx.beginPath();
                ctx.ellipse(mx, my, W * 0.30, 56, 0, 0, Math.PI * 2);
                ctx.fill();
            }

            // 7. Animated 3D Cel-Shaded Horror Zombies (layered far-to-near with midground fog separation!)
            const walkCycle = Math.min(1, elapsed / (SPLASH_DURATION_MS * 0.92));
            actors.forEach((actor, idx) => {
                // Inject subtle parallax fog band right before foreground pair (idx === 3)
                if (idx === 3) {
                    const midFog = ctx.createLinearGradient(0, groundY - 50, 0, H);
                    midFog.addColorStop(0, "rgba(10, 22, 34, 0)");
                    midFog.addColorStop(0.45, "rgba(12, 32, 42, 0.22)");
                    midFog.addColorStop(1, "rgba(4, 10, 18, 0)");
                    ctx.fillStyle = midFog;
                    ctx.fillRect(0, groundY - 50, W, H - groundY + 50);
                }

                actor.zombie.animTimer += actor.speed;
                const bob = Math.abs(Math.sin(actor.zombie.animTimer * 3.0)) * -4.2;
                const stride = Math.sin(actor.zombie.animTimer * 3.0);
                const reach = Math.cos(actor.zombie.animTimer * 2.6);

                // Smoothly creep from outer mist inward toward hero formation
                const curXNorm = actor.baseX + (actor.targetX - actor.baseX) * walkCycle;
                const zx = curXNorm * W;
                const zScale = baseScale * actor.scaleMul;
                const zFootY = groundY + (idx >= 3 ? 28 : 4);
                const zY = zFootY - (actor.zombie.height * 0.44 * zScale);

                // 3D Ground contact shadow + colored bounce aura
                const sGrad = ctx.createRadialGradient(zx, zFootY, 2, zx, zFootY, 32 * zScale);
                sGrad.addColorStop(0, "rgba(0, 0, 0, 0.72)");
                sGrad.addColorStop(0.65, idx === 0 ? "rgba(255, 23, 68, 0.22)" : "rgba(0, 229, 255, 0.14)");
                sGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
                ctx.fillStyle = sGrad;
                ctx.beginPath();
                ctx.ellipse(zx, zFootY, 32 * zScale, 8.5 * zScale, 0, 0, Math.PI * 2);
                ctx.fill();

                ctx.save();
                ctx.translate(zx, zY);
                ctx.scale(actor.faceDir * zScale, zScale);
                if (idx === 0) {
                    ctx.globalAlpha = 0.85; // Towering Titan Boss looming silhouette in center
                }
                actor.zombie.drawZombieBody(ctx, bob, stride, reach);
                ctx.restore();
            });

            // 8. Foreground Low Cemetery Fog Over Boots
            for (let f = 0; f < 3; f++) {
                const fx = ((f * 0.44 - t * (0.05 + f * 0.015) + 2) % 1.4 - 0.2) * W;
                const fy = H * 0.89 + f * 16;
                const fogG = ctx.createRadialGradient(fx, fy, 12, fx, fy, W * 0.35);
                fogG.addColorStop(0, "rgba(110, 210, 200, 0.2)");
                fogG.addColorStop(1, "rgba(0, 0, 0, 0)");
                ctx.fillStyle = fogG;
                ctx.beginPath();
                ctx.ellipse(fx, fy, W * 0.36, 70, 0, 0, Math.PI * 2);
                ctx.fill();
            }

            // 9. Floating Bokeh 3D Horror Embers
            for (const em of embers) {
                em.y -= em.vy;
                em.x += em.vx + Math.sin(t * 2 + em.phase) * 0.0003;
                if (em.y < 0.05) {
                    em.y = 0.98;
                    em.x = Math.random();
                }
                const alpha = 0.3 + 0.55 * Math.abs(Math.sin(t * 2.5 + em.phase));
                const ex = em.x * W;
                const ey = em.y * H;
                const haloR = em.size * 2.6;
                const eGrad = ctx.createRadialGradient(ex, ey, 0, ex, ey, haloR);
                eGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
                eGrad.addColorStop(0.35, `rgba(${em.color}, ${alpha})`);
                eGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
                ctx.fillStyle = eGrad;
                ctx.beginPath();
                ctx.arc(ex, ey, haloR, 0, Math.PI * 2);
                ctx.fill();
            }

            // 10. Dramatic Radial Horror Vignette
            const vig = ctx.createRadialGradient(W * 0.5, H * 0.45, Math.min(W, H) * 0.2, W * 0.5, H * 0.5, Math.max(W, H) * 0.72);
            vig.addColorStop(0, "rgba(0, 0, 0, 0)");
            vig.addColorStop(1, "rgba(1, 3, 7, 0.76)");
            ctx.fillStyle = vig;
            ctx.fillRect(0, 0, W, H);

            if (!dismissed || overlay.classList.contains("visible")) {
                rafId = requestAnimationFrame(renderSplash);
            }
        };

        rafId = requestAnimationFrame(renderSplash);
    }

    initWelcomeCanvas() {
        const cvs = document.getElementById("welcomeCanvas");
        if (!cvs) return;
        const ctx = cvs.getContext("2d");
        if (!ctx) return;

        const resize = () => {
            cvs.width = window.innerWidth;
            cvs.height = window.innerHeight;
        };
        resize();
        window.addEventListener("resize", resize);

        // Drifting mathematical particles: faint Mohr circles and rotated stress elements
        const particles = [];
        const count = 22;
        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * cvs.width,
                y: Math.random() * cvs.height,
                vx: (Math.random() - 0.5) * 0.45,
                vy: (Math.random() - 0.5) * 0.45,
                rot: Math.random() * Math.PI * 2,
                vrot: (Math.random() - 0.5) * 0.012,
                size: 24 + Math.random() * 48,
                type: i % 2 === 0 ? "circle" : "square",
                color: i % 3 === 0 ? "rgba(0, 229, 255, " : (i % 3 === 1 ? "rgba(255, 145, 0, " : "rgba(255, 23, 68, ")
            });
        }

        const render = () => {
            const modal = document.getElementById("welcomeModal");
            if (!modal || !modal.classList.contains("visible")) {
                requestAnimationFrame(render);
                return;
            }

            ctx.clearRect(0, 0, cvs.width, cvs.height);

            // Creeping low graveyard fog wisps across bottom edge of welcome backdrop
            const tNow = Date.now() * 0.0005;
            for (let m = 0; m < 3; m++) {
                const mx = ((m * 0.42 + tNow * (0.04 + m * 0.015)) % 1.3 - 0.15) * cvs.width;
                const my = cvs.height * (0.83 + m * 0.05);
                const mGrad = ctx.createRadialGradient(mx, my, 10, mx, my, cvs.width * 0.34);
                mGrad.addColorStop(0, "rgba(110, 195, 200, 0.14)");
                mGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
                ctx.fillStyle = mGrad;
                ctx.beginPath();
                ctx.ellipse(mx, my, cvs.width * 0.36, 70, 0, 0, Math.PI * 2);
                ctx.fill();
            }

            for (const p of particles) {
                p.x += p.vx;
                p.y += p.vy;
                p.rot += p.vrot;

                if (p.x < -60) p.x = cvs.width + 60;
                if (p.x > cvs.width + 60) p.x = -60;
                if (p.y < -60) p.y = cvs.height + 60;
                if (p.y > cvs.height + 60) p.y = -60;

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot);

                if (p.type === "circle") {
                    // Faint Mohr's circle with center & principal axes
                    ctx.strokeStyle = p.color + "0.35)";
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                    ctx.stroke();

                    // Reference diameter (2θ line)
                    ctx.strokeStyle = p.color + "0.2)";
                    ctx.beginPath();
                    ctx.moveTo(-p.size, 0);
                    ctx.lineTo(p.size, 0);
                    ctx.moveTo(0, -p.size);
                    ctx.lineTo(0, p.size);
                    ctx.stroke();
                } else {
                    // Rotated 2D stress element square with traction vectors
                    ctx.strokeStyle = p.color + "0.3)";
                    ctx.lineWidth = 1;
                    ctx.strokeRect(-p.size / 2, -p.size / 2, p.size, p.size);

                    ctx.strokeStyle = p.color + "0.45)";
                    ctx.beginPath();
                    // Normal arrows outwards
                    ctx.moveTo(p.size / 2, 0);
                    ctx.lineTo(p.size / 2 + 8, 0);
                    ctx.moveTo(-p.size / 2, 0);
                    ctx.lineTo(-p.size / 2 - 8, 0);
                    ctx.moveTo(0, p.size / 2);
                    ctx.lineTo(0, p.size / 2 + 8);
                    ctx.moveTo(0, -p.size / 2);
                    ctx.lineTo(0, -p.size / 2 - 8);
                    ctx.stroke();
                }

                ctx.restore();
            }

            requestAnimationFrame(render);
        };
        requestAnimationFrame(render);
    }

    loadProgression() {
        try {
            const saved = localStorage.getItem("stress_zombies_max_unlocked_level");
            this.maxUnlockedLevel = saved ? Math.max(1, parseInt(saved, 10)) : 1;
            this.level = this.maxUnlockedLevel;

            const scores = localStorage.getItem("stress_zombies_level_scores");
            this.levelHighScores = scores ? JSON.parse(scores) : {};

            const stars = localStorage.getItem("stress_zombies_level_stars");
            this.levelStars = stars ? JSON.parse(stars) : {};

            // Clean up any accidental Frame-1 zero-score auto-unlock from prior build
            if (!localStorage.getItem("stress_zombies_flow_v33_migrated")) {
                if (this.maxUnlockedLevel === 2 && (this.levelHighScores[1] || 0) === 0) {
                    this.maxUnlockedLevel = 1;
                    this.level = 1;
                    this.levelHighScores = {};
                    this.levelStars = {};
                    this.saveProgression();
                }
                localStorage.setItem("stress_zombies_flow_v33_migrated", "true");
            }
        } catch (e) {
            this.maxUnlockedLevel = 1;
            this.level = 1;
            this.levelHighScores = {};
            this.levelStars = {};
        }
    }

    saveProgression() {
        try {
            localStorage.setItem("stress_zombies_max_unlocked_level", this.maxUnlockedLevel.toString());
            localStorage.setItem("stress_zombies_level_scores", JSON.stringify(this.levelHighScores));
            localStorage.setItem("stress_zombies_level_stars", JSON.stringify(this.levelStars));
        } catch (e) {}
    }

    resetProgression() {
        if (confirm("Reset campaign progress back to Level 1? All unlocked sectors and stars will be reset.")) {
            this.maxUnlockedLevel = 1;
            this.level = 1;
            this.levelHighScores = {};
            this.levelStars = {};
            this.saveProgression();
            this.updateCampaignStatusBanner();
            this.renderLevelGrid();
            this.showToast("Campaign progress reset to Level 1.", "info");
        }
    }

    updateTutorialBadges() {
        let done = false;
        try {
            done = localStorage.getItem("stress_zombies_tutorial_done") === "true";
        } catch (e) {}

        const welTag = document.getElementById("welcomeTutorialTag");
        if (welTag) {
            welTag.textContent = done ? "✔ COMPLETED" : "BEFORE LEVEL 1";
        }

        const mapBadge = document.getElementById("tutorialBannerBadge");
        if (mapBadge) {
            mapBadge.textContent = done ? "✔ DONE" : "PLAY FIRST";
        }
    }

    openLevelSelectModal() {
        const modal = document.getElementById("levelSelectModal");
        if (modal) {
            this.updateTutorialBadges();
            this.updateCampaignStatusBanner();
            this._hoveredMapLevel = this.level;
            this.renderLevelGrid();
            const closeBtn = document.getElementById("closeLevelsBtn");
            if (closeBtn) {
                closeBtn.textContent = this.state === "playing" ? "✕ RESUME" : "← HOME";
            }
            modal.classList.add("visible");
            this.startLevelMapAnimations();
        }
    }

    updateCampaignStatusBanner() {
        const banner = document.getElementById("campaignStatusBanner");
        if (!banner) return;

        const campaignLvl = Math.max(1, this.level);
        let totalStars = 0;
        let totalScore = 0;
        for (const k in this.levelStars) totalStars += this.levelStars[k] || 0;
        for (const k in this.levelHighScores) totalScore += this.levelHighScores[k] || 0;

        banner.innerHTML = `
            <span class="campaign-chip">📍 Current: <strong class="val-cyan">Level ${campaignLvl}</strong></span>
            <span class="campaign-chip">🔓 Unlocked: <strong class="val-green">${this.maxUnlockedLevel} / 10</strong></span>
            <span class="campaign-chip">⭐ Stars: <strong class="val-yellow">${totalStars} / 30</strong></span>
            ${totalScore > 0 ? `<span class="campaign-chip">🏆 Score: <strong class="val-orange">${totalScore.toLocaleString()}</strong></span>` : ''}
        `;

        const btnLevelsClose = document.getElementById("btnLevelsClose");
        if (btnLevelsClose) {
            btnLevelsClose.textContent = `▶ PLAY LEVEL ${campaignLvl}`;
        }
    }

    closeLevelSelectModal() {
        const modal = document.getElementById("levelSelectModal");
        if (modal) modal.classList.remove("visible");
        this._levelMapRafActive = false;
    }

    initLevelMapActors() {
        if (this._levelMapCardActors) return;
        this._levelMapTutorialActor = new Zombie({ type: "brittle", name: "Tutorial Dummy", sx: 80, sy: 0, txy: 0, speed: 0.5 });

        this._levelMapDioramaActors = [
            { unlockLvl: 1, label: "Scout", zoneX: 152, amp: 24, dir: -1, scale: 0.50, z: new Zombie({ type: "brittle", sx: 80, sy: 0, txy: 0, speed: 0.5 }) },
            { unlockLvl: 4, label: "Armor", zoneX: 348, amp: 22, dir: -1, scale: 0.52, z: new Zombie({ type: "ductile", sx: 80, sy: 20, txy: 30, speed: 0.5 }) },
            { unlockLvl: 6, label: "Shifter", zoneX: 495, amp: 18, dir: -1, scale: 0.52, z: new Zombie({ type: "shapeshifter", sx: 75, sy: 25, txy: 35, speed: 0.5 }) },
            { unlockLvl: 7, label: "TwinA", zoneX: 622, amp: 14, dir: -1, scale: 0.45, z: new Zombie({ type: "twin", sx: 85, sy: 15, txy: 30, speed: 0.5 }) },
            { unlockLvl: 7, label: "TwinB", zoneX: 650, amp: 14, dir: 1, scale: 0.45, z: new Zombie({ type: "twin", sx: 85, sy: 15, txy: 30, speed: 0.5 }) },
            { unlockLvl: 9, label: "Titan", zoneX: 792, amp: 10, dir: 1, scale: 0.44, z: new Zombie({ type: "boss", width: 95, height: 145, sx: 110, sy: 25, txy: 45, speed: 0.4 }) }
        ];

        this._levelMapCardActors = {
            1: [new Zombie({ type: "brittle", sx: 80, sy: 0, txy: 0 })],
            2: [new Zombie({ type: "brittle", sx: 90, sy: 30, txy: 0 })],
            3: [new Zombie({ type: "brittle", sx: 80, sy: 20, txy: 35 })],
            4: [
                new Zombie({ type: "ductile", sx: 80, sy: 20, txy: 30 }),
                new Zombie({ type: "brittle", sx: 80, sy: 30, txy: 25 })
            ],
            5: [new Zombie({ type: "ductile", sx: 90, sy: 30, txy: 45 })],
            6: [new Zombie({ type: "shapeshifter", sx: 75, sy: 25, txy: 35 })],
            7: [
                new Zombie({ type: "twin", sx: 85, sy: 15, txy: 30 }),
                new Zombie({ type: "twin", sx: 85, sy: 15, txy: 30 })
            ],
            8: [
                new Zombie({ type: "shapeshifter", sx: 85, sy: 25, txy: -30 }),
                new Zombie({ type: "ductile", sx: 80, sy: 20, txy: 35 })
            ],
            9: [new Zombie({ type: "boss", width: 95, height: 145, sx: 110, sy: 25, txy: 45 })],
            10: [
                new Zombie({ type: "boss", width: 95, height: 145, sx: 110, sy: 25, txy: 45 }),
                new Zombie({ type: "brittle", sx: 90, sy: 20, txy: 30 }),
                new Zombie({ type: "ductile", sx: 85, sy: 30, txy: 40 })
            ]
        };
    }

    drawPreviewZombieOrSilhouette(ctx, zombie, cx, cy, scaleX, scaleY, bob, stride, reach, isUnlocked, eyeColor = "#ff1744") {
        if (isUnlocked) {
            ctx.save();
            ctx.translate(cx, cy);
            ctx.scale(scaleX, scaleY);
            zombie.drawZombieBody(ctx, bob, stride, reach);
            ctx.restore();
        } else {
            if (!this._mapSilCanvas) {
                this._mapSilCanvas = document.createElement("canvas");
                this._mapSilCanvas.width = 140;
                this._mapSilCanvas.height = 150;
            }
            const sil = this._mapSilCanvas;
            const sCtx = sil.getContext("2d");
            const ox = 70;
            const oy = 86;

            sCtx.clearRect(0, 0, sil.width, sil.height);
            sCtx.save();
            sCtx.translate(ox, oy);
            sCtx.scale(scaleX, scaleY);
            zombie.drawZombieBody(sCtx, bob, stride, reach);
            sCtx.restore();

            sCtx.save();
            sCtx.globalCompositeOperation = "source-in";
            sCtx.fillStyle = "#060b14";
            sCtx.fillRect(0, 0, sil.width, sil.height);
            sCtx.restore();

            ctx.save();
            ctx.shadowColor = "rgba(255, 23, 68, 0.38)";
            ctx.shadowBlur = 10;
            ctx.drawImage(sil, cx - ox, cy - oy);
            ctx.restore();

            // Piercing glowing crimson anime eyes aligned precisely on dark silhouette skull
            ctx.save();
            ctx.translate(cx, cy);
            ctx.scale(scaleX, scaleY);
            zombie.drawHorrorEyesOnly(ctx, bob, eyeColor);
            ctx.restore();
        }
    }

    startLevelMapAnimations() {
        this.initLevelMapActors();
        if (this._levelMapRafActive) return;
        this._levelMapRafActive = true;

        const tick = (now) => {
            const modal = document.getElementById("levelSelectModal");
            if (!modal || !modal.classList.contains("visible")) {
                this._levelMapRafActive = false;
                return;
            }
            this.renderLevelMapVisuals(now * 0.001);
            requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }

    renderLevelMapVisuals(t) {
        // 1. Render Top 3D Apocalypse Campaign Route Diorama Canvas
        const dCvs = document.getElementById("levelMapDioramaCanvas");
        if (dCvs) {
            const dCtx = dCvs.getContext("2d");
            if (dCtx) {
                this.renderLevelMapDiorama(dCtx, dCvs.width, dCvs.height, t);
            }
        }

        // 2. Render Animated Tutorial Target Dummy Canvas
        const tutCvs = document.getElementById("tutorialZombieCanvas");
        if (tutCvs && this._levelMapTutorialActor) {
            const tCtx = tutCvs.getContext("2d");
            if (tCtx) {
                const tw = tutCvs.width;
                const th = tutCvs.height;
                const tz = this._levelMapTutorialActor;
                tz.animTimer = t * 1.9;
                const bob = Math.abs(Math.sin(tz.animTimer * 3.0)) * -3.5;
                const stride = Math.sin(tz.animTimer * 3.0);
                const reach = Math.cos(tz.animTimer * 2.6);

                tCtx.clearRect(0, 0, tw, th);
                const tBg = tCtx.createRadialGradient(tw * 0.5, th * 0.45, 3, tw * 0.5, th * 0.5, tw * 0.65);
                tBg.addColorStop(0, "#0b2e2e");
                tBg.addColorStop(1, "#040b14");
                tCtx.fillStyle = tBg;
                tCtx.fillRect(0, 0, tw, th);

                tCtx.fillStyle = "rgba(0, 0, 0, 0.6)";
                tCtx.beginPath();
                tCtx.ellipse(tw * 0.5, th * 0.86, 16, 4.2, 0, 0, Math.PI * 2);
                tCtx.fill();

                tCtx.save();
                tCtx.translate(tw * 0.52, th * 0.54);
                tCtx.scale(0.50, 0.50);
                tz.drawZombieBody(tCtx, bob, stride, reach);
                tCtx.restore();
            }
        }

        // 3. Render Live 3D Anime Zombie Stage inside each of the 10 Level Cards
        const cardCanvases = document.querySelectorAll(".level-zombie-canvas");
        cardCanvases.forEach((cvs) => {
            const lvl = parseInt(cvs.getAttribute("data-level"), 10);
            const cCtx = cvs.getContext("2d");
            const actors = this._levelMapCardActors ? this._levelMapCardActors[lvl] : null;
            if (!cCtx || !actors) return;

            const cw = cvs.width;
            const ch = cvs.height;
            const isUnlocked = lvl <= this.maxUnlockedLevel;
            const isHovered = this._hoveredMapLevel === lvl;
            const boost = isHovered ? 1.07 : 1.0;

            cCtx.clearRect(0, 0, cw, ch);

            // Sector-themed twilight backdrop
            const bg = cCtx.createLinearGradient(0, 0, 0, ch);
            if (!isUnlocked) {
                bg.addColorStop(0, "#0b0c14");
                bg.addColorStop(0.7, "#16070d");
                bg.addColorStop(1, "#05070c");
            } else if (lvl <= 3) {
                bg.addColorStop(0, "#071829");
                bg.addColorStop(0.68, "#0e2b3e");
                bg.addColorStop(1, "#050b14");
            } else if (lvl <= 7) {
                bg.addColorStop(0, "#0a1c17");
                bg.addColorStop(0.68, "#123225");
                bg.addColorStop(1, "#050d0c");
            } else {
                bg.addColorStop(0, "#1d0710");
                bg.addColorStop(0.68, "#330a18");
                bg.addColorStop(1, "#090408");
            }
            cCtx.fillStyle = bg;
            cCtx.fillRect(0, 0, cw, ch);

            // Glowing nocturnal moon or crimson storm orb behind zombie
            const moonR = isHovered ? 19 : 16;
            const orbX = cw * 0.72;
            const orbY = ch * 0.23;
            const mHalo = cCtx.createRadialGradient(orbX, orbY, 2, orbX, orbY, moonR * 1.9);
            if (!isUnlocked) {
                mHalo.addColorStop(0, "rgba(255, 23, 68, 0.35)");
                mHalo.addColorStop(1, "rgba(0, 0, 0, 0)");
            } else if (lvl >= 8) {
                mHalo.addColorStop(0, "rgba(255, 45, 75, 0.55)");
                mHalo.addColorStop(1, "rgba(0, 0, 0, 0)");
            } else if (lvl >= 4) {
                mHalo.addColorStop(0, "rgba(0, 230, 118, 0.45)");
                mHalo.addColorStop(1, "rgba(0, 0, 0, 0)");
            } else {
                mHalo.addColorStop(0, "rgba(0, 229, 255, 0.5)");
                mHalo.addColorStop(1, "rgba(0, 0, 0, 0)");
            }
            cCtx.fillStyle = mHalo;
            cCtx.beginPath();
            cCtx.arc(orbX, orbY, moonR * 1.9, 0, Math.PI * 2);
            cCtx.fill();

            // Perspective asphalt ground shelf
            const floorY = ch * 0.76;
            cCtx.fillStyle = "rgba(4, 8, 14, 0.85)";
            cCtx.fillRect(0, floorY, cw, ch - floorY);
            cCtx.fillStyle = isUnlocked ? (lvl >= 8 ? "rgba(255,23,68,0.35)" : "rgba(0,229,255,0.3)") : "rgba(255,23,68,0.18)";
            cCtx.fillRect(0, floorY, cw, 1.5);

            // Drifting mini anime ember sparks
            for (let e = 0; e < 3; e++) {
                const ex = ((e * 29 + t * 18) % cw);
                const ey = floorY + 12 - ((e * 37 + t * 24) % (ch * 0.75));
                cCtx.fillStyle = !isUnlocked || lvl >= 8 ? "rgba(255, 80, 95, 0.55)" : "rgba(0, 229, 255, 0.55)";
                cCtx.beginPath();
                cCtx.arc(ex, ey, 1.3, 0, Math.PI * 2);
                cCtx.fill();
            }

            // Special dynamic live behaviors showing level gimmick visually
            if (lvl === 5 && isUnlocked) {
                // Periodically demonstrate Hydro-Jet quenching turning Orange -> Cyan
                actors[0].isSoaked = Math.sin(t * 1.35) > 0.25;
            }
            if (lvl === 6 && isUnlocked) {
                // Shapeshifter alternating normal (cyan/purple) <-> shear (magenta)
                actors[0].currentPhase = Math.sin(t * 1.6) > 0 ? "shear" : "normal";
            }

            // Ground shadow & hover lock ring under zombie
            const shadowY = floorY + 12;
            cCtx.fillStyle = "rgba(0, 0, 0, 0.7)";
            cCtx.beginPath();
            cCtx.ellipse(cw * 0.5, shadowY, 26, 6.5, 0, 0, Math.PI * 2);
            cCtx.fill();
            if (isHovered && isUnlocked) {
                cCtx.strokeStyle = lvl === 9 ? "#ff1744" : "#00e5ff";
                cCtx.lineWidth = 1.6;
                cCtx.beginPath();
                cCtx.ellipse(cw * 0.5, shadowY, 29, 7.2, 0, 0, Math.PI * 2);
                cCtx.stroke();
            }

            // Draw level-specific zombie actor(s)
            if (actors.length === 1) {
                const z = actors[0];
                const speedMul = lvl === 8 ? 2.6 : 1.7;
                z.animTimer = t * speedMul + lvl * 1.1;
                const bob = Math.abs(Math.sin(z.animTimer * 3.0)) * -4.0;
                const stride = Math.sin(z.animTimer * 3.0);
                const reach = Math.cos(z.animTimer * 2.6);
                const sc = (lvl === 9 ? 0.44 : 0.65) * boost;

                // Level 3 tilted shear plane slash line cue
                if (lvl === 3 && isUnlocked) {
                    cCtx.save();
                    cCtx.strokeStyle = "rgba(255, 230, 0, 0.48)";
                    cCtx.lineWidth = 1.5;
                    cCtx.setLineDash([4, 3]);
                    cCtx.beginPath();
                    cCtx.moveTo(cw * 0.2, shadowY - 12);
                    cCtx.lineTo(cw * 0.8, shadowY - 52);
                    cCtx.stroke();
                    cCtx.setLineDash([]);
                    cCtx.restore();
                }

                this.drawPreviewZombieOrSilhouette(cCtx, z, cw * 0.52, ch * 0.54, sc, sc, bob, stride, reach, isUnlocked);
            } else if (actors.length === 2) {
                // Paired Duo (Lv 4 Brittle + Ductile, Lv 7 Linked Twins, Lv 8 Blitz Rush)
                actors.forEach((z, idx) => {
                    const speedMul = lvl === 8 ? 2.8 : 1.75;
                    z.animTimer = t * speedMul + lvl + idx * 0.9;
                    const bob = Math.abs(Math.sin(z.animTimer * 3.0)) * -3.5;
                    const stride = Math.sin(z.animTimer * 3.0);
                    const reach = Math.cos(z.animTimer * 2.6);
                    const sc = (idx === 0 ? 0.54 : 0.47) * boost;
                    const xPos = idx === 0 ? cw * 0.36 : cw * 0.67;
                    const yPos = idx === 0 ? ch * 0.58 : ch * 0.53;
                    this.drawPreviewZombieOrSilhouette(cCtx, z, xPos, yPos, sc, sc, bob, stride, reach, isUnlocked);
                });
            } else {
                // Level 10 Multi-Threat Horde Trio
                actors.forEach((z, idx) => {
                    z.animTimer = t * 1.9 + idx * 1.3;
                    const bob = Math.abs(Math.sin(z.animTimer * 3.0)) * -3.5;
                    const stride = Math.sin(z.animTimer * 3.0);
                    const reach = Math.cos(z.animTimer * 2.6);
                    const isBossActor = idx === 0;
                    const sc = (isBossActor ? 0.35 : 0.44) * boost;
                    const xPos = idx === 0 ? cw * 0.52 : (idx === 1 ? cw * 0.25 : cw * 0.77);
                    const yPos = idx === 0 ? ch * 0.52 : ch * 0.61;
                    this.drawPreviewZombieOrSilhouette(cCtx, z, xPos, yPos, sc, sc, bob, stride, reach, isUnlocked);
                });
            }
        });
    }

    renderLevelMapDiorama(ctx, w, h, t) {
        ctx.clearRect(0, 0, w, h);

        // 1. 3-Zone Apocalypse Horizon Sky Gradient (Midnight Cemetery -> Toxic Woods -> Blood Overpass)
        const skyGrad = ctx.createLinearGradient(0, 0, w, 0);
        skyGrad.addColorStop(0, "#051120");
        skyGrad.addColorStop(0.36, "#09212a");
        skyGrad.addColorStop(0.65, "#0d261d");
        skyGrad.addColorStop(1, "#2a0712");
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, w, h);

        const skyVert = ctx.createLinearGradient(0, 0, 0, h * 0.6);
        skyVert.addColorStop(0, "rgba(2, 4, 10, 0.75)");
        skyVert.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = skyVert;
        ctx.fillRect(0, 0, w, h * 0.6);

        // Glowing 3D Full Moon (West Cemetery Sector)
        const moonX = 205;
        const moonY = 38;
        const moonR = 23;
        const mAura = ctx.createRadialGradient(moonX, moonY, 4, moonX, moonY, moonR * 3.2);
        mAura.addColorStop(0, "rgba(210, 248, 255, 0.34)");
        mAura.addColorStop(0.5, "rgba(0, 229, 255, 0.08)");
        mAura.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = mAura;
        ctx.beginPath();
        ctx.arc(moonX, moonY, moonR * 3.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.beginPath();
        ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
        ctx.clip();
        const mBody = ctx.createRadialGradient(moonX - 7, moonY - 7, 2, moonX + 4, moonY + 4, moonR * 1.2);
        mBody.addColorStop(0, "#ffffff");
        mBody.addColorStop(0.6, "#cfe8f3");
        mBody.addColorStop(1, "#627d93");
        ctx.fillStyle = mBody;
        ctx.fillRect(moonX - moonR, moonY - moonR, moonR * 2, moonR * 2);
        ctx.fillStyle = "rgba(95, 118, 138, 0.35)";
        ctx.beginPath();
        ctx.arc(moonX - 6, moonY - 4, 5, 0, Math.PI * 2);
        ctx.arc(moonX + 6, moonY + 5, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Crimson storm glow over Boss Citadel (East Blood Overpass Sector)
        const bossStorm = ctx.createRadialGradient(w * 0.86, 46, 8, w * 0.86, 46, 175);
        bossStorm.addColorStop(0, "rgba(255, 23, 68, 0.28)");
        bossStorm.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = bossStorm;
        ctx.fillRect(w * 0.55, 0, w * 0.45, h * 0.7);

        // Distant silhouettes: tombstone crosses, ruined towers & gnarled horror trees
        const horizonY = 92;
        ctx.fillStyle = "#04080f";
        const bldgs = [
            { x: 25, w: 32, h: 36 }, { x: 64, w: 24, h: 48 }, { x: 102, w: 36, h: 28 },
            { x: 615, w: 34, h: 44 }, { x: 662, w: 46, h: 60 }, { x: 724, w: 30, h: 38 },
            { x: 816, w: 48, h: 66 }, { x: 870, w: 28, h: 42 }
        ];
        for (const b of bldgs) {
            ctx.fillRect(b.x, horizonY - b.h, b.w, b.h);
            ctx.fillStyle = "#020408";
            ctx.fillRect(b.x + b.w, horizonY - b.h + 4, 6, b.h - 4);
            ctx.fillStyle = "#04080f";
        }
        // Broken highway overpass arch at Boss Sector (x = 690..900)
        ctx.fillStyle = "#070b12";
        ctx.fillRect(675, horizonY - 26, 225, 7);
        for (let px = 700; px <= 875; px += 58) {
            ctx.fillRect(px, horizonY - 19, 10, 22);
        }

        // Gnarled horror trees along Toxic Woods horizon
        this.drawGnarledTree(ctx, 292, horizonY + 2, 74, 0.2, 0.42, "#050b10");
        this.drawGnarledTree(ctx, 438, horizonY + 2, 82, -0.18, 0.45, "#050d0c");
        this.drawGnarledTree(ctx, 560, horizonY + 2, 68, 0.16, 0.38, "#060e0e");

        // Tombstones silhouettes near Cemetery Sector
        ctx.fillStyle = "#08101c";
        for (const tx of [96, 128, 178, 245]) {
            ctx.fillRect(tx - 5, horizonY - 14, 10, 14);
            ctx.beginPath();
            ctx.arc(tx, horizonY - 14, 5, Math.PI, 0);
            ctx.fill();
        }

        // 2.5D Wet Apocalypse Highway Floor
        const roadGrad = ctx.createLinearGradient(0, horizonY, 0, h);
        roadGrad.addColorStop(0, "#0b131f");
        roadGrad.addColorStop(0.45, "#070c14");
        roadGrad.addColorStop(1, "#030509");
        ctx.fillStyle = roadGrad;
        ctx.fillRect(0, horizonY, w, h - horizonY);

        ctx.fillStyle = "rgba(130, 210, 240, 0.18)";
        ctx.fillRect(0, horizonY, w, 1.5);

        // Compute 10 sector node coordinates curving across the apocalypse highway
        const nodes = [];
        for (let i = 1; i <= 10; i++) {
            const nx = 54 + (i - 1) * 88;
            const ny = 132 + Math.sin((i - 1) * 0.92) * 18;
            nodes.push({ id: i, x: nx, y: ny });
        }
        this._levelMapNodeHits = nodes;

        // Draw Winding Highway Surface Ribbon underneath route nodes
        ctx.save();
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        nodes.forEach((n, idx) => {
            if (idx === 0) ctx.moveTo(n.x, n.y);
            else {
                const prev = nodes[idx - 1];
                const midX = (prev.x + n.x) * 0.5;
                ctx.bezierCurveTo(midX, prev.y, midX, n.y, n.x, n.y);
            }
        });
        ctx.strokeStyle = "rgba(18, 28, 42, 0.92)";
        ctx.lineWidth = 22;
        ctx.stroke();

        // Neon Highway Edge Borders
        ctx.strokeStyle = "rgba(0, 229, 255, 0.18)";
        ctx.lineWidth = 24;
        ctx.stroke();
        ctx.strokeStyle = "#080e18";
        ctx.lineWidth = 18;
        ctx.stroke();
        ctx.restore();

        // Connect unlocked vs locked path energy lines
        for (let i = 0; i < nodes.length - 1; i++) {
            const a = nodes[i];
            const b = nodes[i + 1];
            const midX = (a.x + b.x) * 0.5;
            const segUnlocked = b.id <= this.maxUnlockedLevel;

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.bezierCurveTo(midX, a.y, midX, b.y, b.x, b.y);
            if (segUnlocked) {
                ctx.strokeStyle = "#00e5ff";
                ctx.shadowColor = "#00e5ff";
                ctx.shadowBlur = 9;
                ctx.lineWidth = 2.8;
                ctx.stroke();
            } else {
                ctx.strokeStyle = "rgba(255, 23, 68, 0.42)";
                ctx.setLineDash([6, 5]);
                ctx.lineDashOffset = -t * 16;
                ctx.lineWidth = 2;
                ctx.stroke();
            }
            ctx.restore();
        }

        // 2. Patrolling Live 3D Anime Zombies Walking Along the Apocalypse Route!
        if (this._levelMapDioramaActors) {
            this._levelMapDioramaActors.forEach((act, idx) => {
                const z = act.z;
                z.animTimer = t * 1.85 + idx * 1.25;
                if (z.type === "shapeshifter") {
                    z.currentPhase = Math.sin(t * 1.5) > 0 ? "shear" : "normal";
                }
                const patrolShift = Math.sin(t * 0.65 + idx * 1.4) * act.amp;
                const zx = act.zoneX + patrolShift;
                const zy = act.label === "Titan" ? 76 : 86;
                const bob = Math.abs(Math.sin(z.animTimer * 3.0)) * -3.5;
                const stride = Math.sin(z.animTimer * 3.0);
                const reach = Math.cos(z.animTimer * 2.6);
                const actUnlocked = act.unlockLvl <= this.maxUnlockedLevel;

                // Ground shadow on highway shoulder
                ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
                ctx.beginPath();
                ctx.ellipse(zx, zy + (act.label === "Titan" ? 31 : 22), act.label === "Titan" ? 26 : 16, 4.8, 0, 0, Math.PI * 2);
                ctx.fill();

                if (act.label === "Titan") {
                    ctx.save();
                    const p = 0.5 + 0.5 * Math.sin(t * 4);
                    ctx.strokeStyle = `rgba(255, 23, 68, ${0.4 + p * 0.45})`;
                    ctx.lineWidth = 1.6;
                    ctx.beginPath();
                    ctx.ellipse(zx, zy + 31, 30 + p * 4, 6.2, 0, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.restore();
                }

                this.drawPreviewZombieOrSilhouette(ctx, z, zx, zy, act.dir * act.scale, act.scale, bob, stride, reach, actUnlocked);
            });
        }

        // 3. Sector Labels across sky top
        ctx.save();
        ctx.font = "bold 9px 'Consolas', monospace";
        ctx.textAlign = "left";
        ctx.fillStyle = "rgba(0, 229, 255, 0.55)";
        ctx.fillText("SECTOR I: CEMETERY", 14, 16);
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(0, 230, 118, 0.55)";
        ctx.fillText("SECTOR II: TOXIC WOODS", w * 0.48, 16);
        ctx.textAlign = "right";
        ctx.fillStyle = "rgba(255, 82, 98, 0.72)";
        ctx.fillText("SECTOR III: TITAN OVERPASS", w - 14, 16);
        ctx.restore();

        // 4. Interactive 3D Sector Node Pads (1..10)
        const focusLvl = this._hoveredMapLevel || this.level;
        nodes.forEach((n) => {
            const isUnlocked = n.id <= this.maxUnlockedLevel;
            const isCurrent = n.id === this.level;
            const isFocus = n.id === focusLvl;
            const stars = this.levelStars[n.id] || 0;
            const isBoss = n.id === 9;
            const isEndless = n.id === 10;

            // Vertical Holographic Spotlight Beam on active/hovered node
            if (isFocus) {
                ctx.save();
                const beam = ctx.createLinearGradient(n.x, n.y - 72, n.x, n.y);
                const beamCol = isUnlocked ? (isBoss ? "255, 23, 68" : "0, 229, 255") : "255, 23, 68";
                beam.addColorStop(0, `rgba(${beamCol}, 0)`);
                beam.addColorStop(1, `rgba(${beamCol}, 0.28)`);
                ctx.fillStyle = beam;
                ctx.beginPath();
                ctx.moveTo(n.x - 10, n.y - 72);
                ctx.lineTo(n.x + 10, n.y - 72);
                ctx.lineTo(n.x + 19, n.y);
                ctx.lineTo(n.x - 19, n.y);
                ctx.closePath();
                ctx.fill();

                // Spinning anime bracket ring around pad
                ctx.strokeStyle = isUnlocked ? "#ffe600" : "#ff5252";
                ctx.lineWidth = 1.8;
                const spin = t * 2.4;
                for (let q = 0; q < 4; q++) {
                    const a0 = spin + q * (Math.PI * 0.5) - 0.3;
                    ctx.beginPath();
                    ctx.ellipse(n.x, n.y, 20, 12.5, 0, a0, a0 + 0.58);
                    ctx.stroke();
                }
                ctx.restore();
            }

            // 3D Cylindrical Beveled Node Pad Base
            ctx.fillStyle = "#03060c";
            ctx.beginPath();
            ctx.ellipse(n.x, n.y + 3.5, 16, 10, 0, 0, Math.PI * 2);
            ctx.fill();

            const padGrad = ctx.createRadialGradient(n.x - 4, n.y - 3, 2, n.x, n.y, 16);
            if (!isUnlocked) {
                padGrad.addColorStop(0, "#1c1f2b");
                padGrad.addColorStop(1, "#090c14");
            } else if (stars > 0) {
                padGrad.addColorStop(0, "#0e4d3a");
                padGrad.addColorStop(1, "#051f18");
            } else if (isBoss || isEndless) {
                padGrad.addColorStop(0, "#590e22");
                padGrad.addColorStop(1, "#1e050c");
            } else {
                padGrad.addColorStop(0, "#0b3d57");
                padGrad.addColorStop(1, "#051926");
            }

            ctx.save();
            ctx.beginPath();
            ctx.ellipse(n.x, n.y, 15.5, 9.8, 0, 0, Math.PI * 2);
            ctx.fillStyle = padGrad;
            ctx.fill();
            ctx.strokeStyle = !isUnlocked
                ? "rgba(255, 23, 68, 0.45)"
                : (isCurrent ? "#ffe600" : (stars > 0 ? "#00e676" : (isBoss ? "#ff1744" : "#00e5ff")));
            ctx.lineWidth = isFocus || isCurrent ? 2.4 : 1.5;
            if (isUnlocked && (isFocus || isCurrent)) {
                ctx.shadowColor = ctx.strokeStyle;
                ctx.shadowBlur = 10;
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.restore();

            // Node Number inside pad
            ctx.font = "bold 11px 'Consolas', monospace";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = isUnlocked ? "#ffffff" : "#64748b";
            ctx.fillText(isBoss ? "☠9" : (isEndless ? "∞" : `${n.id}`), n.x, n.y);

            // Short tag underneath node
            ctx.font = "bold 8px 'Consolas', monospace";
            ctx.fillStyle = stars > 0 ? "#ffe600" : (isUnlocked ? "#94a3b8" : "#475569");
            ctx.fillText(stars > 0 ? "★".repeat(stars) : (isUnlocked ? `LVL ${n.id}` : "LOCK"), n.x, n.y + 18);
        });
    }

    renderLevelGrid() {
        const grid = document.getElementById("levelGrid");
        if (!grid) return;
        grid.innerHTML = "";

        const tipEl = document.getElementById("levelMapDioramaTip");

        LEVEL_CONFIGS.forEach((cfg) => {
            const isUnlocked = cfg.id <= this.maxUnlockedLevel;
            const isCurrent = cfg.id === this.level;
            const highScore = this.levelHighScores[cfg.id] || 0;
            const starsCount = this.levelStars[cfg.id] || 0;
            const starString = starsCount > 0 ? ("★".repeat(starsCount) + "☆".repeat(3 - starsCount)) : "";
            const sectorCls = cfg.id <= 3 ? "sector-cemetery" : (cfg.id <= 7 ? "sector-woods" : "sector-overpass");

            const card = document.createElement("div");
            card.className = `level-card ${sectorCls} ${isUnlocked ? 'unlocked' : 'locked'} ${isCurrent ? 'active-current' : ''}`;
            card.id = `level-card-${cfg.id}`;

            const stageTag = !isUnlocked
                ? `<span class="stage-tag locked">🔒 LOCKED</span>`
                : (cfg.id === 9 ? `<span class="stage-tag boss">☠️ BOSS</span>` : (cfg.id === 10 ? `<span class="stage-tag endless">♾️ HORDE</span>` : `<span class="stage-tag open">LVL ${cfg.id}</span>`));

            card.innerHTML = `
                <div class="level-zombie-stage">
                    <canvas class="level-zombie-canvas" data-level="${cfg.id}" width="92" height="112"></canvas>
                    ${stageTag}
                </div>
                <div class="level-card-body">
                    <div class="level-header">
                        <div class="level-title-group">
                            <div class="level-num-title" style="color: ${isUnlocked ? cfg.textColor : 'var(--text-muted)'};">
                                <span>${cfg.icon}</span>
                                <span>${cfg.id}. ${cfg.title}</span>
                                ${isCurrent ? `<span class="next-level-pill">NEXT</span>` : ''}
                            </div>
                            <span class="level-badge" style="background: ${cfg.badgeColor}; color: ${cfg.textColor};">
                                ${cfg.badge}
                            </span>
                        </div>
                        <div class="level-status-col">
                            ${starString ? `<span class="level-stars" title="${starsCount}/3 Stars">${starString}</span>` : (isUnlocked ? `<span class="val-green" style="font-size:0.75rem; font-family:var(--font-mono); font-weight:800;">OPEN</span>` : `<span>🔒</span>`)}
                            ${highScore > 0 ? `<span class="level-best-score">Best: ${highScore.toLocaleString()}</span>` : ''}
                        </div>
                    </div>

                    <div class="level-desc">${cfg.description}</div>

                    <button class="btn-enter-level ${isUnlocked ? 'unlocked' : 'locked'}">
                        ${isUnlocked ? `▶ PLAY LEVEL ${cfg.id}` : `🔒 CLEAR LEVEL ${cfg.id - 1}`}
                    </button>
                </div>
            `;

            card.addEventListener("mouseenter", () => {
                this._hoveredMapLevel = cfg.id;
                if (tipEl) {
                    tipEl.textContent = isUnlocked
                        ? `▶ LEVEL ${cfg.id}: ${cfg.title.toUpperCase()} — ${cfg.description}`
                        : `🔒 LEVEL ${cfg.id} LOCKED — CLEAR LEVEL ${cfg.id - 1} FIRST TO UNLOCK`;
                }
            });
            card.addEventListener("mouseleave", () => {
                if (this._hoveredMapLevel === cfg.id) {
                    this._hoveredMapLevel = null;
                }
                if (tipEl) {
                    tipEl.textContent = "☣️ CLICK ANY UNLOCKED SECTOR ON THE APOCALYPSE ROUTE OR CARDS BELOW TO PLAY";
                }
            });

            if (isUnlocked) {
                card.addEventListener("click", () => {
                    this.closeLevelSelectModal();
                    this.startLevel(cfg.id);
                });
            } else {
                card.addEventListener("click", () => {
                    card.classList.remove("shake-locked");
                    void card.offsetWidth;
                    card.classList.add("shake-locked");
                    if (window.soundController) window.soundController.playDeflection();
                    this.showToast(`🔒 Complete Level ${cfg.id - 1} first to unlock Level ${cfg.id}.`, "warning");
                });
            }

            grid.appendChild(card);
        });
    }

    initEventListeners() {
        // Angle Slider
        const slider = document.getElementById("angleSlider");
        if (slider) {
            slider.addEventListener("input", (e) => {
                this.hud.setAngle(parseFloat(e.target.value));
            });
        }

        // Fire Machine Gun Button (supports single tap & continuous hold-to-fire when aligned!)
        const fireBtn = document.getElementById("fireBtn");
        if (fireBtn) {
            let pointerHandled = false;
            const startBtnFire = (e) => {
                if (e) e.preventDefault();
                pointerHandled = true;
                this.isFiringHeld = true;
                this.firePlaneCutter(false);
            };
            const stopBtnFire = () => {
                this.isFiringHeld = false;
            };
            fireBtn.addEventListener("mousedown", startBtnFire);
            fireBtn.addEventListener("touchstart", startBtnFire, { passive: false });
            window.addEventListener("mouseup", stopBtnFire);
            window.addEventListener("touchend", stopBtnFire);
            window.addEventListener("blur", () => {
                this.isFiringHeld = false;
            });
            fireBtn.addEventListener("click", () => {
                if (pointerHandled) {
                    pointerHandled = false;
                    return;
                }
                this.firePlaneCutter(false);
            });
        }

        // Keyboard Controls
        window.addEventListener("keydown", (e) => {
            const isSpaceKey = e.code === "Space" || e.key === " " || e.key === "Spacebar";

            // Priority 1: Opening Title/Zombie Splash ("GIF" Intro) transitions smoothly into Welcome Surface
            const introSplash = document.getElementById("introSplashOverlay");
            if (introSplash && introSplash.classList.contains("visible")) {
                if (isSpaceKey || e.code === "Enter" || e.key === "Enter" || e.code === "Escape" || e.key === "Escape") {
                    e.preventDefault();
                    if (e.repeat) return;
                    if (this.dismissIntroSplash) {
                        this.dismissIntroSplash();
                    }
                }
                return;
            }

            // Spacebar in Welcome Modal transitions to Level Select Campaign Map
            const welcomeModal = document.getElementById("welcomeModal");
            if (welcomeModal && welcomeModal.classList.contains("visible") && isSpaceKey) {
                e.preventDefault();
                if (e.repeat) return;
                if (Date.now() - (this._introDismissedAt || 0) < 350) return;
                if (window.soundController && window.soundController.stopWelcomeRoar) {
                    window.soundController.stopWelcomeRoar();
                }
                const eqV = document.getElementById("eqVisualizer");
                const tBox = document.querySelector(".zombie-transmission-box");
                const cBtn = document.getElementById("btnPlayZombieCall");
                if (eqV) eqV.classList.remove("playing");
                if (tBox) tBox.classList.remove("horror-active");
                if (cBtn) cBtn.innerHTML = "▶ PLAY HORROR CALL";
                welcomeModal.classList.remove("visible");
                localStorage.setItem("stress_zombies_seen_welcome", "true");
                this.openLevelSelectModal();
                return;
            }

            // Spacebar in Level Select Campaign Modal launches active level
            const levelSelectModal = document.getElementById("levelSelectModal");
            if (levelSelectModal && levelSelectModal.classList.contains("visible") && isSpaceKey) {
                e.preventDefault();
                if (e.repeat) return;
                this.closeLevelSelectModal();
                this.startLevel(this.level);
                return;
            }

            // Spacebar in Report Modal returns to Level Select Campaign Map (unless adjusting slider/controls)
            const reportModal = document.getElementById("reportModal");
            if (reportModal && reportModal.classList.contains("visible") && isSpaceKey) {
                const activeTag = document.activeElement ? document.activeElement.tagName : "";
                if (activeTag !== "INPUT" && activeTag !== "BUTTON") {
                    e.preventDefault();
                    if (e.repeat) return;
                    this.nextLevel();
                    return;
                }
            }

            // Spacebar in Tutorial Complete Modal starts Level 1 immediately
            const tutModal = document.getElementById("tutorialCompleteModal");
            if (tutModal && tutModal.classList.contains("visible") && isSpaceKey) {
                e.preventDefault();
                if (e.repeat) return;
                tutModal.classList.remove("visible");
                this.startLevel(1);
                return;
            }

            if (this.state !== "playing") return;

            // Pause combat hotkeys while any secondary modal is open
            const isModalBlocking = ["welcomeModal", "levelSelectModal", "guideModal", "studyModal", "gameOverModal", "tutorialCompleteModal"].some((id) => {
                const el = document.getElementById(id);
                return el && el.classList.contains("visible");
            });
            if (isModalBlocking) {
                this.isFiringHeld = false;
                return;
            }

            // Spacebar = Fire Machine Gun (holdable while handle is aligned with Mohr's Circle!)
            if (isSpaceKey) {
                e.preventDefault();
                this.isFiringHeld = true;
                if (!e.repeat) {
                    this.firePlaneCutter(false);
                }
            }

            // Arrow keys or A/D for dial rotation
            if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
                let newAng = this.hud.dialAngle - (e.shiftKey ? 10 : 2);
                this.hud.setAngle(newAng);
            }
            if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
                let newAng = this.hud.dialAngle + (e.shiftKey ? 10 : 2);
                this.hud.setAngle(newAng);
            }

            // Power-up numeric hotkeys 1, 2, 3, 4, 5
            if (e.key === "1") this.activatePowerUp("slowmo");
            if (e.key === "2") this.activatePowerUp("hint");
            if (e.key === "3") this.activatePowerUp("scanner");
            if (e.key === "4") this.activatePowerUp("shield");
            if (e.key === "5") this.activatePowerUp("hydro");
        });

        window.addEventListener("keyup", (e) => {
            if (e.code === "Space" || e.key === " " || e.key === "Spacebar") {
                this.isFiringHeld = false;
            }
        });

        // Power-up HUD buttons
        const p1 = document.getElementById("powerSlowmoBtn");
        const p2 = document.getElementById("powerHintBtn");
        const p3 = document.getElementById("powerScannerBtn");
        const p4 = document.getElementById("powerShieldBtn");
        const p5 = document.getElementById("powerHydroBtn");

        if (p1) p1.addEventListener("click", () => this.activatePowerUp("slowmo"));
        if (p2) p2.addEventListener("click", () => this.activatePowerUp("hint"));
        if (p3) p3.addEventListener("click", () => this.activatePowerUp("scanner"));
        if (p4) p4.addEventListener("click", () => this.activatePowerUp("shield"));
        if (p5) p5.addEventListener("click", () => this.activatePowerUp("hydro"));

        // Sound & Background Music toggle buttons
        const soundBtn = document.getElementById("soundToggleBtn");
        if (soundBtn) {
            soundBtn.addEventListener("click", () => {
                const isMuted = window.soundController.toggleMute();
                soundBtn.textContent = isMuted ? "🔇 SFX: OFF" : "🔊 SFX: ON";
                if (!isMuted && window.soundController.musicEnabled && !window.soundController.isBgPlaying) {
                    window.soundController.startBackgroundMusic(this.state === "playing" ? "combat" : "ambient");
                }
            });
        }

        const musicBtn = document.getElementById("musicToggleBtn");
        if (musicBtn) {
            musicBtn.addEventListener("click", () => {
                if (window.soundController) {
                    const isOn = window.soundController.toggleMusic();
                    musicBtn.textContent = isOn ? "🎵 MUSIC: ON" : "🎵 MUSIC: OFF";
                }
            });
        }

        // Auto-unlock & start atmospheric background music on first user gesture anywhere in app
        const unlockAudioOnFirstGesture = (e) => {
            if (e && e.target && e.target.closest && e.target.closest("#soundToggleBtn, #musicToggleBtn")) return;
            if (window.soundController && !window.soundController.muted && window.soundController.musicEnabled) {
                const mode = this.state === "playing" ? "combat" : "ambient";
                window.soundController.startBackgroundMusic(mode);
            }
            window.removeEventListener("pointerdown", unlockAudioOnFirstGesture, true);
            window.removeEventListener("keydown", unlockAudioOnFirstGesture, true);
        };
        window.addEventListener("pointerdown", unlockAudioOnFirstGesture, true);
        window.addEventListener("keydown", unlockAudioOnFirstGesture, true);

        // Level Select Modal Buttons & Interactive Diorama Route Nodes
        const levelsBtn = document.getElementById("openLevelsBtn");
        if (levelsBtn) {
            levelsBtn.addEventListener("click", () => this.openLevelSelectModal());
        }

        const dioramaCanvas = document.getElementById("levelMapDioramaCanvas");
        if (dioramaCanvas) {
            const getDioramaHit = (e) => {
                const rect = dioramaCanvas.getBoundingClientRect();
                const mx = (e.clientX - rect.left) * (dioramaCanvas.width / Math.max(1, rect.width));
                const my = (e.clientY - rect.top) * (dioramaCanvas.height / Math.max(1, rect.height));
                let best = null;
                let bestDist = 30;
                for (const n of (this._levelMapNodeHits || [])) {
                    const d = Math.hypot(mx - n.x, my - n.y);
                    if (d < bestDist) {
                        bestDist = d;
                        best = n;
                    }
                }
                return best;
            };

            dioramaCanvas.addEventListener("mousemove", (e) => {
                const hit = getDioramaHit(e);
                const tipEl = document.getElementById("levelMapDioramaTip");
                if (hit) {
                    const isUnl = hit.id <= this.maxUnlockedLevel;
                    this._hoveredMapLevel = hit.id;
                    dioramaCanvas.style.cursor = isUnl ? "pointer" : "not-allowed";
                    const cfg = LEVEL_CONFIGS.find(c => c.id === hit.id);
                    if (tipEl && cfg) {
                        tipEl.textContent = isUnl
                            ? `▶ LEVEL ${cfg.id}: ${cfg.title.toUpperCase()} — CLICK NODE TO PLAY`
                            : `🔒 LEVEL ${cfg.id} LOCKED — CLEAR LEVEL ${cfg.id - 1} FIRST`;
                    }
                } else {
                    this._hoveredMapLevel = null;
                    dioramaCanvas.style.cursor = "default";
                    if (tipEl) {
                        tipEl.textContent = "☣️ CLICK ANY UNLOCKED SECTOR ON THE APOCALYPSE ROUTE OR CARDS BELOW TO PLAY";
                    }
                }
            });

            dioramaCanvas.addEventListener("mouseleave", () => {
                this._hoveredMapLevel = null;
                dioramaCanvas.style.cursor = "default";
            });

            dioramaCanvas.addEventListener("click", (e) => {
                const hit = getDioramaHit(e);
                if (!hit) return;
                if (hit.id <= this.maxUnlockedLevel) {
                    this.closeLevelSelectModal();
                    this.startLevel(hit.id);
                } else {
                    const cardEl = document.getElementById(`level-card-${hit.id}`);
                    if (cardEl) {
                        cardEl.classList.remove("shake-locked");
                        void cardEl.offsetWidth;
                        cardEl.classList.add("shake-locked");
                    }
                    if (window.soundController) window.soundController.playDeflection();
                    this.showToast(`🔒 Complete Level ${hit.id - 1} first to unlock Level ${hit.id}.`, "warning");
                }
            });
        }

        const closeLevelsBtn = document.getElementById("closeLevelsBtn");
        if (closeLevelsBtn) {
            closeLevelsBtn.addEventListener("click", () => {
                this.closeLevelSelectModal();
                if (this.state !== "playing") {
                    if (this.state === "level_clear") {
                        const rep = document.getElementById("reportModal");
                        if (rep) rep.classList.add("visible");
                    } else if (this.state === "tutorial_clear") {
                        const tutModal = document.getElementById("tutorialCompleteModal");
                        if (tutModal) tutModal.classList.add("visible");
                    } else {
                        const welcomeModal = document.getElementById("welcomeModal");
                        if (welcomeModal) welcomeModal.classList.add("visible");
                    }
                }
            });
        }

        const btnLevelsClose = document.getElementById("btnLevelsClose");
        if (btnLevelsClose) {
            btnLevelsClose.addEventListener("click", () => {
                this.closeLevelSelectModal();
                this.startLevel(this.level);
            });
        }

        const btnResetProg = document.getElementById("btnResetProgress");
        if (btnResetProg) {
            btnResetProg.addEventListener("click", () => this.resetProgression());
        }

        const btnGameOverLevels = document.getElementById("btnGameOverLevels");
        if (btnGameOverLevels) {
            btnGameOverLevels.addEventListener("click", () => {
                const gom = document.getElementById("gameOverModal");
                if (gom) gom.classList.remove("visible");
                this.state = "menu";
                this.zombies = [];
                this.zombiesToSpawn = [];
                this.hud.setTargetZombie(null);
                this.openLevelSelectModal();
            });
        }

        // Welcome Screen & Zombie Calling Transmission Listeners
        const callBtn = document.getElementById("btnPlayZombieCall");
        const eqVisualizer = document.getElementById("eqVisualizer");
        const transBox = document.querySelector(".zombie-transmission-box");
        let horrorTimer = null;
        const stopWelcomeVisuals = () => {
            clearTimeout(horrorTimer);
            if (eqVisualizer) eqVisualizer.classList.remove("playing");
            if (transBox) transBox.classList.remove("horror-active");
            if (callBtn) callBtn.innerHTML = "▶ PLAY HORROR CALL";
            if (window.soundController && window.soundController.stopWelcomeRoar) {
                window.soundController.stopWelcomeRoar();
            }
        };

        if (callBtn) {
            callBtn.addEventListener("click", () => {
                if (window.soundController) {
                    if (window.soundController.muted) {
                        window.soundController.toggleMute();
                        const soundBtnEl = document.getElementById("soundToggleBtn");
                        if (soundBtnEl) soundBtnEl.textContent = "🔊 SFX: ON";
                    }
                    window.soundController.playZombieWelcomeRoar();
                    clearTimeout(horrorTimer);
                    if (eqVisualizer) eqVisualizer.classList.add("playing");
                    if (transBox) transBox.classList.add("horror-active");
                    callBtn.innerHTML = "🔴 PLAYING ROAR...";
                    horrorTimer = setTimeout(() => {
                        if (eqVisualizer) eqVisualizer.classList.remove("playing");
                        if (transBox) transBox.classList.remove("horror-active");
                        callBtn.innerHTML = "▶ PLAY HORROR CALL";
                    }, 3700);
                    this.showToast("🧟 Horror zombie sound playing!", "warning");
                }
            });
        }

        const btnWelcomeGuide = document.getElementById("btnWelcomeGuide");
        if (btnWelcomeGuide) {
            btnWelcomeGuide.addEventListener("click", () => {
                stopWelcomeVisuals();
                window.guideReturnModal = "welcomeModal";
                const welcomeModal = document.getElementById("welcomeModal");
                if (welcomeModal) welcomeModal.classList.remove("visible");
                const guideModal = document.getElementById("guideModal");
                if (guideModal) guideModal.classList.add("visible");
            });
        }

        const btnWelcomeStudy = document.getElementById("btnWelcomeStudy");
        if (btnWelcomeStudy) {
            btnWelcomeStudy.addEventListener("click", () => {
                stopWelcomeVisuals();
                window.studyReturnModal = "welcomeModal";
                const welcomeModal = document.getElementById("welcomeModal");
                if (welcomeModal) welcomeModal.classList.remove("visible");
                const studyModal = document.getElementById("studyModal");
                if (studyModal) {
                    studyModal.classList.add("visible");
                    if (window.studyLab) {
                        window.studyLab.populateSlainPresets(this.levelAutopsies);
                        window.studyLab.update();
                    }
                }
            });
        }

        const btnWelcomePlay = document.getElementById("btnWelcomePlay");
        if (btnWelcomePlay) {
            btnWelcomePlay.addEventListener("click", () => {
                stopWelcomeVisuals();
                const welcomeModal = document.getElementById("welcomeModal");
                if (welcomeModal) welcomeModal.classList.remove("visible");
                localStorage.setItem("stress_zombies_seen_welcome", "true");
                this.openLevelSelectModal();
            });
        }

        const btnWelcomeTutorial = document.getElementById("btnWelcomeTutorial");
        if (btnWelcomeTutorial) {
            btnWelcomeTutorial.addEventListener("click", () => {
                stopWelcomeVisuals();
                const welcomeModal = document.getElementById("welcomeModal");
                if (welcomeModal) welcomeModal.classList.remove("visible");
                localStorage.setItem("stress_zombies_seen_welcome", "true");
                this.startTutorial();
            });
        }

        const btnMapTutorial = document.getElementById("btnMapTutorial");
        if (btnMapTutorial) {
            btnMapTutorial.addEventListener("click", () => {
                this.closeLevelSelectModal();
                this.startTutorial();
            });
        }

        const btnTutorialSkip = document.getElementById("btnTutorialSkip");
        if (btnTutorialSkip) {
            btnTutorialSkip.addEventListener("click", () => {
                this.startLevel(1);
            });
        }

        const btnTutorialStartL1 = document.getElementById("btnTutorialStartL1");
        if (btnTutorialStartL1) {
            btnTutorialStartL1.addEventListener("click", () => {
                const tm = document.getElementById("tutorialCompleteModal");
                if (tm) tm.classList.remove("visible");
                this.startLevel(1);
            });
        }

        const btnTutorialReplay = document.getElementById("btnTutorialReplay");
        if (btnTutorialReplay) {
            btnTutorialReplay.addEventListener("click", () => {
                const tm = document.getElementById("tutorialCompleteModal");
                if (tm) tm.classList.remove("visible");
                this.startTutorial();
            });
        }

        const btnTutorialMap = document.getElementById("btnTutorialMap");
        if (btnTutorialMap) {
            btnTutorialMap.addEventListener("click", () => {
                const tm = document.getElementById("tutorialCompleteModal");
                if (tm) tm.classList.remove("visible");
                this.isTutorial = false;
                this.level = 1;
                this.state = "menu";
                this.updateHUDStats();
                this.openLevelSelectModal();
            });
        }

        const btnWelcomeClose = document.getElementById("btnWelcomeClose");
        if (btnWelcomeClose) {
            btnWelcomeClose.addEventListener("click", () => {
                stopWelcomeVisuals();
                const welcomeModal = document.getElementById("welcomeModal");
                if (welcomeModal) welcomeModal.classList.remove("visible");
                localStorage.setItem("stress_zombies_seen_welcome", "true");
                this.openLevelSelectModal();
            });
        }
    }

    /**
     * Launch Guided Interactive Tutorial Mission (Before Level 1)
     */
    startTutorial() {
        const closeIds = ["welcomeModal", "levelSelectModal", "guideModal", "studyModal", "reportModal", "gameOverModal", "tutorialCompleteModal"];
        closeIds.forEach((id) => {
            const el = document.getElementById(id);
            if (el) el.classList.remove("visible");
        });

        this.isTutorial = true;
        this.level = 0;
        this.state = "playing";
        this.baseHealth = this.maxBaseHealth;
        this.score = 0;
        this.streak = 0;
        this.zombies = [];
        this.spawnTimer = 0;
        this.tutorialCoachKey = "";
        this.hud.setTargetZombie(null);
        this.particles.particles = [];
        this.bullets = [];
        this.casings = [];
        this.queuedShots = [];
        this.muzzleFlash = 0;
        this.gunRecoil = 0;
        this.fireCooldown = 0;
        this.isFiringHeld = false;
        this.lockShakeTimer = 0;
        this.waterJetEffect = null;
        this.hideLiveKillReport();

        this.levelStats = {
            cuts: 0,
            crits: 0,
            deflections: 0,
            kills: 0,
            killsByType: {},
            theoriesUsed: [],
            maxStreak: 0
        };
        this.levelAutopsies = [];
        this.reportSelectedIdx = 0;

        this.powerups.slowmo.count = 2;
        this.powerups.hint.count = 3;
        this.powerups.scanner.count = 2;
        this.powerups.shield.count = 2;
        this.powerups.hydro.count = 3;
        for (const k in this.powerups) this.powerups[k].active = false;
        this.updatePowerUpButtons();

        const coachBar = document.getElementById("tutorialCoachBar");
        if (coachBar) coachBar.style.display = "flex";

        // Offset initial gun handle so the player actively learns how to unlock it in Drill 1
        this.hud.setAngle(45);

        this.buildTutorialWave();
        this.updateHUDStats();
        this.updateTutorialCoach(true);

        if (window.soundController) {
            window.soundController.setTempo(78);
            window.soundController.startBackgroundMusic("combat");
        }

        this.showToast("🎓 TUTORIAL: Complete 4 quick drills before Level 1!", "info");
    }

    buildTutorialWave() {
        this.zombiesToSpawn = [];
        const baseY = this.height * 0.62;

        const d1 = new Zombie({ type: "brittle", name: "Drill 1: Brittle Dummy", sx: 80, sy: 0, txy: 0, x: 850, y: baseY, speed: 0.50, maxHealth: 60 });
        d1.tutorialStep = 1;

        const d2 = new Zombie({ type: "brittle", name: "Drill 2: Sheared Dummy", sx: 80, sy: 20, txy: 30, x: 850, y: baseY, speed: 0.48, maxHealth: 80 });
        d2.tutorialStep = 2;

        const d3 = new Zombie({ type: "ductile", name: "Drill 3: Ductile Armor", sx: 80, sy: 20, txy: 30, x: 850, y: baseY, speed: 0.45, maxHealth: 90 });
        d3.tutorialStep = 3;

        const d4 = new Zombie({ type: "ductile", name: "Drill 4: Quench Target", sx: 90, sy: 30, txy: 45, x: 850, y: baseY, speed: 0.44, maxHealth: 100 });
        d4.tutorialStep = 4;

        this.zombiesToSpawn.push(d1, d2, d3, d4);
        this.spawnNextZombie();
    }

    updateTutorialCoach(force = false) {
        const coachBar = document.getElementById("tutorialCoachBar");
        if (!this.isTutorial) {
            if (coachBar) coachBar.style.display = "none";
            return;
        }
        if (coachBar && coachBar.style.display !== "flex") {
            coachBar.style.display = "flex";
        }

        const primaryTarget = this.getPrimaryTarget();
        const activeZombie = primaryTarget || this.zombies[0] || this.zombiesToSpawn[0] || null;
        const step = activeZombie && activeZombie.tutorialStep ? activeZombie.tutorialStep : 4;
        const isVisible = !!primaryTarget;
        let isArmed = false;
        let optDeg = 0;
        let dirHint = "[A]";
        let diffDeg = 0;

        if (primaryTarget) {
            const evalRes = StressMechanics.evaluateAttack(primaryTarget, this.hud.dialAngle);
            isArmed = !evalRes.isDeflected;
            optDeg = evalRes.optimalAngle;
            diffDeg = optDeg - this.hud.dialAngle;
            if (diffDeg > 90) diffDeg -= 180;
            if (diffDeg < -90) diffDeg += 180;
            dirHint = diffDeg > 0 ? "[D] / Right" : "[A] / Left";
        }

        const soaked = !!(primaryTarget && primaryTarget.isSoaked);
        const hydroLeft = this.powerups && this.powerups.hydro ? this.powerups.hydro.count : 0;
        const key = `${step}|${isVisible}|${isArmed}|${soaked}|${Math.round(this.hud.dialAngle * 2)}|${hydroLeft > 0}`;
        if (!force && key === this.tutorialCoachKey) return;
        this.tutorialCoachKey = key;

        const pills = document.querySelectorAll("#tutorialCoachSteps .tut-step-pill");
        pills.forEach((pill) => {
            const pStep = parseInt(pill.getAttribute("data-step"), 10);
            pill.classList.remove("active", "done");
            if (pStep < step) pill.classList.add("done");
            else if (pStep === step) pill.classList.add("active");
        });

        const msgEl = document.getElementById("tutorialCoachMsg");
        if (!msgEl) return;

        msgEl.className = "tutorial-coach-msg";

        if (!isVisible) {
            msgEl.textContent = `⏳ DRILL ${step}/4 — Wait for zombie to walk onto the screen...`;
            return;
        }

        if (step === 4 && !soaked && hydroLeft > 0) {
            msgEl.classList.add("hydro");
            msgEl.textContent = `💧 DRILL 4/4 — Press [5] Hydro-Jet to soak armor (wipes τ = 0 → converts to Cyan)!`;
            return;
        }

        if (isArmed) {
            msgEl.classList.add("armed");
            if (step === 1) {
                msgEl.textContent = `🔥 DRILL 1/4 — ARMED! Hold [SPACE] (or FIRE GUN) to shoot!`;
            } else if (step === 2) {
                msgEl.textContent = `🔥 DRILL 2/4 — LOCKED ON AT ${this.hud.dialAngle.toFixed(1)}°! Hold [SPACE] to shred!`;
            } else if (step === 3) {
                msgEl.textContent = `🔥 DRILL 3/4 — τmax ALIGNED! Hold [SPACE] to break Ductile armor!`;
            } else {
                msgEl.textContent = `🔥 DRILL 4/4 — QUENCHED & ARMED! Hold [SPACE] to finish Tutorial!`;
            }
        } else {
            msgEl.classList.add("locked");
            if (step === 1) {
                msgEl.textContent = `🔒 DRILL 1/4 — Aim ${dirHint} to ${optDeg.toFixed(1)}° (or click Cyan dot on Mohr Radar).`;
            } else if (step === 2) {
                msgEl.textContent = `🔒 DRILL 2/4 — Shear tilted σ1! Turn ${dirHint} to ${optDeg.toFixed(1)}° (2θ = ${(optDeg * 2).toFixed(1)}°).`;
            } else if (step === 3) {
                msgEl.textContent = `🔒 DRILL 3/4 — Orange resists σ1! Turn ${dirHint} toward Orange τmax = ${optDeg.toFixed(1)}°.`;
            } else {
                msgEl.textContent = `🔒 DRILL 4/4 — Turn ${dirHint} to ${optDeg.toFixed(1)}° and finish with [SPACE]!`;
            }
        }
    }

    completeTutorial() {
        this.state = "tutorial_clear";
        this.isFiringHeld = false;
        this.queuedShots = [];
        this.hideLiveKillReport();
        try {
            localStorage.setItem("stress_zombies_tutorial_done", "true");
        } catch (e) {}
        this.updateTutorialBadges();

        const coachBar = document.getElementById("tutorialCoachBar");
        if (coachBar) coachBar.style.display = "none";

        if (window.soundController && window.soundController.isBgPlaying) {
            window.soundController.setMusicMode("ambient");
        }

        const modal = document.getElementById("tutorialCompleteModal");
        if (modal) {
            modal.classList.add("visible");
        }
        this.showToast("🎓 Tutorial complete! Level 1 ready!", "power");
    }

    /**
     * Start a game level (Enforces Campaign Level Locking)
     */
    startLevel(levelNumber = 1) {
        if (levelNumber < 1) levelNumber = 1;
        if (levelNumber > this.maxUnlockedLevel) {
            this.showToast(`🔒 Complete Level ${levelNumber - 1} first!`, "warning");
            this.openLevelSelectModal();
            return;
        }

        const wasTutorial = this.isTutorial;
        this.isTutorial = false;
        const coachBar = document.getElementById("tutorialCoachBar");
        if (coachBar) coachBar.style.display = "none";
        const tutModal = document.getElementById("tutorialCompleteModal");
        if (tutModal) tutModal.classList.remove("visible");

        if (wasTutorial) {
            this.score = 0;
            this.streak = 0;
        }

        this.level = levelNumber;
        this.state = "playing";
        this.baseHealth = this.maxBaseHealth;
        this.zombies = [];
        this.spawnTimer = 0;
        this.hud.setTargetZombie(null);
        this.particles.particles = [];
        this.bullets = [];
        this.casings = [];
        this.queuedShots = [];
        this.muzzleFlash = 0;
        this.gunRecoil = 0;
        this.fireCooldown = 0;
        this.isFiringHeld = false;
        this.lockShakeTimer = 0;
        this.waterJetEffect = null;
        this.hideLiveKillReport();

        // Reset level stats & autopsies
        this.levelStats = {
            cuts: 0,
            crits: 0,
            deflections: 0,
            kills: 0,
            killsByType: {},
            theoriesUsed: [],
            maxStreak: 0
        };
        this.levelAutopsies = [];
        this.reportSelectedIdx = 0;

        // Reset powerups
        this.powerups.slowmo.count = 2;
        this.powerups.hint.count = 3;
        this.powerups.scanner.count = 2;
        this.powerups.shield.count = 1;
        this.powerups.hydro.count = 2;
        for (const k in this.powerups) this.powerups[k].active = false;
        this.updatePowerUpButtons();

        // Build level wave
        this.buildLevelWave(levelNumber);
        this.updateHUDStats();

        if (window.soundController) {
            window.soundController.setTempo(levelNumber >= 9 ? 96 : 84);
            window.soundController.startBackgroundMusic("combat");
        }

        const cfg = LEVEL_CONFIGS.find(c => c.id === levelNumber);
        const name = cfg ? `Level ${cfg.id}: ${cfg.title}` : `Level ${levelNumber}`;
        this.showToast(`⚡ ${name}`, "info");
    }

    buildLevelWave(lvl) {
        this.zombiesToSpawn = [];
        const baseY = this.height * 0.62;

        if (lvl === 1) {
            // Level 1: Tension Outpost (Pure Uniaxial Tension)
            this.zombiesToSpawn.push(
                new Zombie({ type: "brittle", name: "Rankine Scout", sx: 80, sy: 0, txy: 0, x: 848, y: baseY, speed: 0.48, maxHealth: 90 }),
                new Zombie({ type: "brittle", name: "Brittle Biter", sx: 100, sy: 0, txy: 0, x: 855, y: baseY, speed: 0.50, maxHealth: 100 }),
                new Zombie({ type: "brittle", name: "Tension Drone", sx: 120, sy: 0, txy: 0, x: 862, y: baseY, speed: 0.54, maxHealth: 110 })
            );
        } else if (lvl === 2) {
            // Level 2: Compression Catacombs (Biaxial Tractions)
            this.zombiesToSpawn.push(
                new Zombie({ type: "brittle", name: "Biaxial Bruiser", sx: 90, sy: 30, txy: 0, x: 848, y: baseY, speed: 0.48, maxHealth: 110 }),
                new Zombie({ type: "brittle", name: "Compressive Stalker", sx: 110, sy: 40, txy: 0, x: 855, y: baseY, speed: 0.52, maxHealth: 120 }),
                new Zombie({ type: "brittle", name: "Lattice Biter", sx: 80, sy: 20, txy: 0, x: 862, y: baseY, speed: 0.56, maxHealth: 120 })
            );
        } else if (lvl === 3) {
            // Level 3: Shear Storm (Mohr's Rotation τxy ≠ 0)
            this.zombiesToSpawn.push(
                new Zombie({ type: "brittle", name: "Sheared Biter", sx: 80, sy: 20, txy: 30, x: 848, y: baseY, speed: 0.50, maxHealth: 120 }),
                new Zombie({ type: "brittle", name: "Torsion Fiend", sx: 60, sy: 20, txy: 40, x: 855, y: baseY, speed: 0.54, maxHealth: 130 }),
                new Zombie({ type: "brittle", name: "Angle-Rotator", sx: 90, sy: 10, txy: -35, x: 862, y: baseY, speed: 0.58, maxHealth: 140 })
            );
        } else if (lvl === 4) {
            // Level 4: Ductile Threat (Rankine vs Tresca)
            this.zombiesToSpawn.push(
                new Zombie({ type: "brittle", name: "Brittle Biter", sx: 80, sy: 30, txy: 25, x: 848, y: baseY, speed: 0.52, maxHealth: 120 }),
                new Zombie({ type: "ductile", name: "Ductile Dragger", sx: 80, sy: 20, txy: 30, x: 855, y: baseY, speed: 0.46, maxHealth: 130 }),
                new Zombie({ type: "ductile", name: "Shear Fiend", sx: 70, sy: 10, txy: 40, x: 860, y: baseY, speed: 0.48, maxHealth: 140 }),
                new Zombie({ type: "brittle", name: "Rankine Shard", sx: 95, sy: 25, txy: -30, x: 866, y: baseY, speed: 0.56, maxHealth: 130 })
            );
        } else if (lvl === 5) {
            // Level 5: Hydro-Quench Trench (Requires Hydro-Jet [5])
            this.zombiesToSpawn.push(
                new Zombie({ type: "ductile", name: "Armored Dragger", sx: 90, sy: 30, txy: 45, x: 848, y: baseY, speed: 0.44, maxHealth: 160 }),
                new Zombie({ type: "ductile", name: "Quench Golem", sx: 85, sy: 25, txy: 40, x: 855, y: baseY, speed: 0.45, maxHealth: 150 }),
                new Zombie({ type: "ductile", name: "Molten Fiend", sx: 75, sy: 20, txy: 35, x: 862, y: baseY, speed: 0.48, maxHealth: 140 }),
                new Zombie({ type: "brittle", name: "Reinforced Biter", sx: 100, sy: 30, txy: -25, x: 868, y: baseY, speed: 0.52, maxHealth: 140 })
            );
        } else if (lvl === 6) {
            // Level 6: Quantum Shapeshifters (Dynamic Mutation)
            this.zombiesToSpawn.push(
                new Zombie({ type: "shapeshifter", name: "Quantum Shapeshifter Alpha", sx: 75, sy: 25, txy: 35, x: 848, y: baseY, speed: 0.60, maxHealth: 150 }),
                new Zombie({ type: "brittle", name: "Matrix Drone", sx: 85, sy: 15, txy: 20, x: 855, y: baseY, speed: 0.56, maxHealth: 130 }),
                new Zombie({ type: "shapeshifter", name: "Phase Mutant Beta", sx: 70, sy: 20, txy: -30, x: 862, y: baseY, speed: 0.62, maxHealth: 160 })
            );
        } else if (lvl === 7) {
            // Level 7: Twin Resonance (Coupled Plane Cleaving)
            this.zombiesToSpawn.push(
                new Zombie({ type: "twin", name: "Alpha Twin", sx: 85, sy: 15, txy: 30, x: 848, y: baseY - 22, speed: 0.55, maxHealth: 120, isTwin: true }),
                new Zombie({ type: "twin", name: "Beta Twin", sx: 85, sy: 15, txy: 30, x: 892, y: baseY + 22, speed: 0.55, maxHealth: 120, isTwin: true }),
                new Zombie({ type: "twin", name: "Delta Twin", sx: 75, sy: 25, txy: -25, x: 860, y: baseY - 20, speed: 0.58, maxHealth: 120, isTwin: true }),
                new Zombie({ type: "twin", name: "Gamma Twin", sx: 75, sy: 25, txy: -25, x: 904, y: baseY + 20, speed: 0.58, maxHealth: 120, isTwin: true })
            );
        } else if (lvl === 8) {
            // Level 8: Invariant Citadel (Speed & Invariant Shield [4])
            this.zombiesToSpawn.push(
                new Zombie({ type: "brittle", name: "Invariant Juggernaut", sx: 110, sy: 40, txy: 35, x: 848, y: baseY, speed: 0.65, maxHealth: 170 }),
                new Zombie({ type: "ductile", name: "Blitz Drone", sx: 80, sy: 20, txy: 35, x: 855, y: baseY, speed: 0.70, maxHealth: 130 }),
                new Zombie({ type: "shapeshifter", name: "Speed Slicer", sx: 85, sy: 25, txy: -30, x: 862, y: baseY, speed: 0.72, maxHealth: 150 })
            );
        } else if (lvl === 9) {
            // Level 9: The von Mises Titan Boss!
            if (window.soundController) window.soundController.playBossAlarm();
            this.zombiesToSpawn.push(
                new Zombie({
                    type: "boss",
                    name: "VON MISES TITAN COLOSSUS",
                    sx: 110,
                    sy: 25,
                    txy: 45,
                    x: 862,
                    y: baseY - 12,
                    width: 95,
                    height: 145,
                    speed: 0.36,
                    maxHealth: 600
                })
            );
        } else {
            // Level 10+: Endless Infinite Horde
            const count = 4 + lvl;
            for (let i = 0; i < count; i++) {
                const types = ["brittle", "ductile", "shapeshifter", "twin"];
                const pickType = types[Math.floor(Math.random() * types.length)];
                this.zombiesToSpawn.push(
                    new Zombie({
                        type: pickType,
                        name: `${pickType.toUpperCase()} #${i+1}`,
                        sx: Math.round(50 + Math.random() * 85),
                        sy: Math.round(10 + Math.random() * 45),
                        txy: Math.round((Math.random() - 0.5) * 80),
                        x: 848 + (i % 3) * 14,
                        y: baseY + (Math.random() - 0.5) * 30,
                        speed: 0.55 + Math.min(0.65, lvl * 0.04),
                        maxHealth: 120 + lvl * 15
                    })
                );
            }
        }

        this.spawnNextZombie();
    }

    spawnNextZombie() {
        if (this.zombiesToSpawn.length > 0) {
            const z = this.zombiesToSpawn.shift();
            this.zombies.push(z);
            if (!this.hud.targetZombie && this.isZombieVisibleOnScreen(z)) {
                this.hud.setTargetZombie(z);
            }
        }
    }

    /**
     * Gun Visibility Gate: a zombie can ONLY be targeted/shot after entering visible canvas bounds!
     */
    isZombieVisibleOnScreen(z) {
        if (!z || z.isDying) return false;
        const enterInset = Math.max(18, Math.round((z.width || 56) * 0.34));
        return z.x >= 20 && z.x <= (this.width - enterInset);
    }

    /**
     * Primary Attack: Fire Heavy Machine Gun (ONLY fires bullets when zombie is visible on screen AND handle is aligned to Mohr's Circle!)
     */
    firePlaneCutter(isAutoHold = false) {
        if (this.state !== "playing") return;

        // Rate limiting for rapid hold-to-fire bursts vs manual trigger pulls
        if (isAutoHold && this.fireCooldown > 0) return;
        if (!isAutoHold && this.fireCooldown > 4) return;

        const target = this.getPrimaryTarget();
        if (!target || !this.isZombieVisibleOnScreen(target)) {
            if (!isAutoHold) {
                this.fireCooldown = 8;
                this.lockShakeTimer = 10;
                if (window.soundController) {
                    window.soundController.playTriggerLock();
                }
                this.spawnFloatingText("WAIT FOR ZOMBIE!", 150, this.height * 0.52, "#94a3b8");
            }
            return;
        }

        this.hud.setTargetZombie(target);

        const currentAngle = this.hud.dialAngle;
        const result = StressMechanics.evaluateAttack(target, currentAngle);

        // SAFETY LOCK SYSTEM: Machine gun ONLY fires bullets when handling part matches Mohr's Circle target!
        if (result.isDeflected) {
            if (isAutoHold) {
                // Halt continuous gunfire smoothly if target changes or handle drifts out of lock
                this.fireCooldown = 8;
                this.lockShakeTimer = 6;
                return;
            }

            this.diagnostics.totalCuts++;
            this.levelStats.cuts++;
            this.levelStats.deflections++;
            this.streak = 0;
            this.fireCooldown = 8;
            this.lockShakeTimer = 14;

            if (window.soundController) {
                window.soundController.playTriggerLock();
            }

            let angleDiff = result.optimalAngle - currentAngle;
            if (angleDiff > 90) angleDiff -= 180;
            if (angleDiff < -90) angleDiff += 180;
            const turnDir = angleDiff > 0 ? "[D]" : "[A]";

            this.spawnFloatingText(`🔒 AIM ${turnDir} → ${result.optimalAngle.toFixed(1)}°`, 148, this.height * 0.52, "#ff5252");
            this.updateHUDStats();
            return;
        }

        // Handle aligned with Mohr's Circle failure plane: Authorize rapid machine gun bullet burst!
        this.fireCooldown = 10;
        this.diagnostics.totalCuts++;
        this.levelStats.cuts++;

        if (result.isCrit) {
            this.diagnostics.perfectHits++;
            this.levelStats.crits++;
            this.screenShake = 8;
        } else {
            this.screenShake = 3.5;
        }

        target.takeDamage(result.effectiveDamage, currentAngle);

        if (window.soundController) {
            window.soundController.playMachineGunBurst(result.isCrit, 4);
            if (this.streak >= 2) window.soundController.playComboFanfare(this.streak);
        }

        this.spawnMachineGunBurst(target, result.isCrit);

        const hitColor = result.isCrit ? "#ffe600" : (target.type === "ductile" ? "#ff9100" : "#00e5ff");
        this.particles.emit(target.x, target.y - target.height * 0.12, hitColor, result.isCrit ? 28 : 16, 4.8);

        const accuracyMultiplier = result.isCrit ? 3.0 : (1.0 + result.accuracyRatio * 1.5);
        const hitScore = Math.round(result.effectiveDamage * accuracyMultiplier * (1 + this.streak * 0.1));
        this.score += hitScore;
        this.streak++;
        this.levelStats.maxStreak = Math.max(this.levelStats.maxStreak, this.streak);

        this.spawnFloatingText(`${result.effectiveDamage}${result.isCrit ? " ★ CRIT!" : ""}`, target.x, target.y - target.height * 0.5, result.isCrit ? "#ffe600" : "#ffffff");

        if (target.health <= 0) {
            if (window.soundController) {
                window.soundController.playZombieDeath(target.type);
            }
            this.diagnostics.killsByType[target.type] = (this.diagnostics.killsByType[target.type] || 0) + 1;
            this.levelStats.kills++;
            this.levelStats.killsByType[target.type] = (this.levelStats.killsByType[target.type] || 0) + 1;
            if (result.theoryName && !this.levelStats.theoriesUsed.includes(result.theoryName)) {
                this.levelStats.theoriesUsed.push(result.theoryName);
            }

            // Log stress & strain report for EVERY killed zombie and pop non-blocking Live Kill Report!
            const autopsy = StressMechanics.computeFullAutopsy(target, currentAngle, result);
            this.levelAutopsies.push(autopsy);
            this.sessionAutopsies.push(autopsy);
            this.showLiveKillReport(autopsy, hitScore, this.levelAutopsies.length);

            this.spawnFloatingText(`💥 CLEAVED! +${hitScore}`, target.x, target.y - target.height * 0.75, "#00e676");
            this.screenShake = 12;

            // Advance radar lock only to next VISIBLE living zombie on screen
            const nextLiving = this.getPrimaryTarget();
            this.hud.setTargetZombie(nextLiving);
            if (nextLiving) {
                this.fireCooldown = Math.min(this.fireCooldown, 6);
            }
        }

        this.updateHUDStats();
    }

    getPrimaryTarget() {
        let closest = null;
        let minX = Infinity;
        for (const z of this.zombies) {
            if (this.isZombieVisibleOnScreen(z) && z.x < minX) {
                minX = z.x;
                closest = z;
            }
        }
        return closest;
    }

    getGunGeometry(h, target) {
        const turretX = 120;
        const turretY = h * 0.45 + (h * 0.35) * 0.35;
        let aimRad = 0;
        if (target) {
            const tx = target.x;
            const ty = target.y - target.height * 0.12;
            aimRad = Math.atan2(ty - turretY, Math.max(40, tx - turretX));
            aimRad = Math.max(-0.55, Math.min(0.55, aimRad));
        }
        const barrelLen = 64 - this.gunRecoil;
        return {
            turretX,
            turretY,
            aimRad,
            muzzleX: turretX + Math.cos(aimRad) * barrelLen,
            muzzleY: turretY + Math.sin(aimRad) * barrelLen
        };
    }

    spawnMachineGunBurst(target, isCrit) {
        const snapX = target.x;
        const snapY = target.y - target.height * 0.12;
        this.fireSingleTracerRound(target, snapX, snapY, isCrit);
        for (let s = 1; s < 4; s++) {
            this.queuedShots.push({
                delay: s * 2,
                target,
                snapX,
                snapY,
                isCrit
            });
        }
    }

    fireSingleTracerRound(target, fallbackX, fallbackY, isCrit) {
        const aimTarget = target || { x: fallbackX, y: fallbackY + 10, height: 80 };
        const geo = this.getGunGeometry(this.height, aimTarget);
        this.muzzleFlash = 1.0;
        this.gunRecoil = isCrit ? 9 : 6.5;

        const tx = target ? target.x : fallbackX;
        const ty = (target ? (target.y - target.height * 0.12) : fallbackY) + (Math.random() - 0.5) * 8;
        const dx = tx - geo.muzzleX;
        const dy = ty - geo.muzzleY;
        const dist = Math.max(12, Math.hypot(dx, dy));
        const speed = 44;

        this.bullets.push({
            x: geo.muzzleX,
            y: geo.muzzleY,
            vx: (dx / dist) * speed,
            vy: (dy / dist) * speed,
            targetX: tx,
            targetY: ty,
            isCrit,
            age: 0
        });

        // Eject spinning brass shell casing from gun receiver
        const ejectX = geo.turretX + Math.cos(geo.aimRad) * 6;
        const ejectY = geo.turretY + Math.sin(geo.aimRad) * 6 - 7;
        this.casings.push({
            x: ejectX,
            y: ejectY,
            vx: -1.6 - Math.random() * 2.2,
            vy: -4.2 - Math.random() * 2.5,
            rot: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() > 0.5 ? 1 : -1) * (0.28 + Math.random() * 0.25),
            floorY: this.height * 0.72 + Math.random() * 14,
            bounced: false,
            life: 70
        });
    }

    updateProjectiles() {
        // 1. Staggered burst queue
        for (let i = this.queuedShots.length - 1; i >= 0; i--) {
            const q = this.queuedShots[i];
            q.delay--;
            if (q.delay <= 0) {
                this.fireSingleTracerRound(q.target, q.snapX, q.snapY, q.isCrit);
                this.queuedShots.splice(i, 1);
            }
        }

        // 2. Flying tracer bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.x += b.vx;
            b.y += b.vy;
            b.age++;

            if (b.x >= b.targetX - 8 || b.x > this.width + 20 || b.age > 30) {
                if (b.x < this.width + 10) {
                    const sparkColor = b.isCrit ? "#ffe600" : "#ffab40";
                    this.particles.emit(b.targetX, b.y, sparkColor, b.isCrit ? 6 : 3, 3.2);
                }
                this.bullets.splice(i, 1);
            }
        }

        // 3. Falling & bouncing brass shell casings
        for (let i = this.casings.length - 1; i >= 0; i--) {
            const c = this.casings[i];
            c.x += c.vx;
            c.y += c.vy;
            c.vy += 0.36;
            c.rot += c.rotSpeed;
            if (c.y >= c.floorY) {
                c.y = c.floorY;
                if (!c.bounced) {
                    c.vy = -1.6 - Math.random() * 0.9;
                    c.vx *= 0.55;
                    c.rotSpeed *= 0.4;
                    c.bounced = true;
                } else {
                    c.vy = 0;
                    c.vx *= 0.85;
                    c.rotSpeed = 0;
                }
            }
            c.life--;
            if (c.life <= 0) {
                this.casings.splice(i, 1);
            }
        }
    }

    /**
     * Power-Up Activation (Including New Hydrostatic Water Jet!)
     */
    activatePowerUp(type) {
        const p = this.powerups[type];
        if (!p || p.count <= 0 || p.active) return;

        p.count--;
        p.active = true;
        p.timer = p.duration;

        if (type === "hydro") {
            // Fire High-Pressure Hydrostatic Water Jet Cannon!
            if (window.soundController) window.soundController.playWaterJet();
            this.screenShake = 14;
            this.waterJetEffect = { progress: 0 };

            // Soak and quench only visible zombies: removes shear stresses without teleporting offscreen spawns!
            for (const z of this.zombies) {
                if (this.isZombieVisibleOnScreen(z)) {
                    z.applyHydroQuench();
                    z.x = Math.min(this.width - 60, z.x + 80); // Pushback within screen
                    this.particles.emit(z.x, z.y, "#00e5ff", 25, 6, "water");
                }
            }

            this.showToast("💧 HYDRO-JET: Shear wiped (τ = 0)! Orange converted to Cyan!", "power");
            this.hud.renderMohrRadar();
        } else if (type === "slowmo") {
            if (window.soundController) window.soundController.playPowerUp(type);
            this.showToast("⏱️ SLOW-MO: Time slowed for 5s!", "power");
        } else if (type === "hint") {
            if (window.soundController) window.soundController.playPowerUp(type);
            this.hintActive = true;
            this.showToast("🎯 HINT: Best cut angle highlighted on dial!", "power");
            this.hud.renderDial();
        } else if (type === "scanner") {
            if (window.soundController) window.soundController.playPowerUp(type);
            this.scannerActive = true;
            this.showToast("📡 SCANNER: Radar unjammed!", "power");
            this.hud.renderMohrRadar();
        } else if (type === "shield") {
            if (window.soundController) window.soundController.playPowerUp(type);
            this.shieldActive = true;
            this.showToast("🛡️ SHIELD: Barricade barrier ON!", "power");
        }

        this.updatePowerUpButtons();
    }

    updatePowerUpButtons() {
        const setBtn = (id, count, active) => {
            const btn = document.getElementById(id);
            if (!btn) return;
            const countEl = btn.querySelector(".p-count");
            if (countEl) countEl.textContent = `x${count}`;
            if (active) btn.classList.add("active");
            else btn.classList.remove("active");
            btn.disabled = count <= 0 && !active;
        };

        setBtn("powerSlowmoBtn", this.powerups.slowmo.count, this.powerups.slowmo.active);
        setBtn("powerHintBtn", this.powerups.hint.count, this.powerups.hint.active);
        setBtn("powerScannerBtn", this.powerups.scanner.count, this.powerups.scanner.active);
        setBtn("powerShieldBtn", this.powerups.shield.count, this.powerups.shield.active);
        setBtn("powerHydroBtn", this.powerups.hydro.count, this.powerups.hydro.active);
    }

    /**
     * Live Per-Zombie Kill Report (shown immediately after EACH zombie kill without freezing combat)
     */
    showLiveKillReport(autopsy, hitScore, killIndex) {
        const card = document.getElementById("liveKillCard");
        if (!card || !autopsy) return;

        const titleEl = document.getElementById("lkTitle");
        const scoreEl = document.getElementById("lkScore");
        const statsEl = document.getElementById("lkStats");
        const theoryEl = document.getElementById("lkTheory");

        if (titleEl) titleEl.textContent = `💀 #${killIndex} ${autopsy.zombieName}`;
        if (scoreEl) scoreEl.textContent = `+${hitScore}${autopsy.isCrit ? " ★" : ""}`;
        if (statsEl) {
            statsEl.innerHTML = `
                <div>Cut θ: <strong class="val-yellow">${autopsy.cutAngle.toFixed(1)}°</strong></div>
                <div>2θ: <strong class="val-cyan">${autopsy.cutAngleMohr.toFixed(1)}°</strong></div>
                <div>σθ: <strong class="val-green">${autopsy.stress.sigmaTheta.toFixed(1)}</strong></div>
                <div>τθ: <strong class="val-orange">${autopsy.stress.tauTheta.toFixed(1)}</strong></div>
            `;
        }
        if (theoryEl) {
            theoryEl.textContent = `${autopsy.failureTitle} • Opt ${autopsy.optimalAngle.toFixed(1)}°`;
        }

        card.classList.add("visible");
        clearTimeout(this.liveKillTimer);
        this.liveKillTimer = setTimeout(() => {
            card.classList.remove("visible");
        }, 4500);
    }

    hideLiveKillReport() {
        clearTimeout(this.liveKillTimer);
        this.liveKillTimer = null;
        const card = document.getElementById("liveKillCard");
        if (card) card.classList.remove("visible");
    }

    /**
     * =========================================================================
     * POST-LEVEL EVERY-ZOMBIE REPORT SPECIMEN ANALYZER (ALWAYS VISIBLE)
     * =========================================================================
     */
    selectPostLevelSpecimen(idx) {
        if (!this.levelAutopsies || this.levelAutopsies.length === 0) return;
        this.reportSelectedIdx = Math.max(0, Math.min(this.levelAutopsies.length - 1, idx));
        const a = this.levelAutopsies[this.reportSelectedIdx];
        this.reportExploreAngle = a.cutAngle;
        this.renderPostLevelSpecimenLab();
    }

    resetPostLevelExploreAngle() {
        const a = this.levelAutopsies[this.reportSelectedIdx];
        if (!a) return;
        this.reportExploreAngle = a.cutAngle;
        this.renderPostLevelSpecimenLab();
    }

    renderPostLevelSpecimenLab() {
        const wrapper = document.getElementById("reportLabWrapper");
        if (!wrapper) return;

        const autopsies = this.levelAutopsies;
        if (!autopsies || autopsies.length === 0) {
            wrapper.style.display = "none";
            return;
        }

        wrapper.style.display = "block";
        const a = autopsies[this.reportSelectedIdx] || autopsies[0];
        if (!a) return;

        // 1. Render Specimen Selector Tabs for EVERY killed zombie
        const tabsContainer = document.getElementById("reportSpecimenTabs");
        if (tabsContainer) {
            tabsContainer.innerHTML = autopsies.map((item, idx) => `
                <button class="specimen-tab-btn ${idx === this.reportSelectedIdx ? 'active' : ''}"
                        onclick="if(window.game) window.game.selectPostLevelSpecimen(${idx})">
                    #${idx + 1} ${item.zombieName} (θ=${item.cutAngle.toFixed(1)}°)
                </button>
            `).join("");
        }

        // 2. Interactive Test Angle Slider sync
        const exploreTheta = this.reportExploreAngle !== undefined ? this.reportExploreAngle : a.cutAngle;
        const slider = document.getElementById("reportAngleSlider");
        const valDisp = document.getElementById("reportAngleVal");
        if (slider) slider.value = exploreTheta;
        if (valDisp) valDisp.textContent = `${exploreTheta.toFixed(1)}°`;

        // 3. Transform Stress & Strain dynamically for exploreTheta
        const sx = a.stress.sx;
        const sy = a.stress.sy;
        const txy = a.stress.txy;

        const mohr = StressMechanics.getMohrCircle(sx, sy, txy);
        const curStress = StressMechanics.transform(sx, sy, txy, exploreTheta);
        const strains = StressMechanics.computeStrains(sx, sy, txy);
        const curStrain = StressMechanics.transformStrain(strains.epsX, strains.epsY, strains.gammaXY, exploreTheta);

        // 4. Specimen Header & Cut Meta
        const metaEl = document.getElementById("reportSpecimenMeta");
        if (metaEl) {
            const isAtActualCut = Math.abs(exploreTheta - a.cutAngle) < 0.2;
            metaEl.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 4px; margin-bottom: 4px;">
                    <strong class="val-cyan" style="font-size: 12px;">#${this.reportSelectedIdx + 1} ${a.zombieName.toUpperCase()}</strong>
                    <span class="autopsy-chip" style="padding: 1px 6px;">${a.zombieType.toUpperCase()}</span>
                </div>
                <div>
                    Your Cut: <strong class="val-yellow">θ = ${a.cutAngle.toFixed(1)}°</strong> (Best: <strong class="val-green">${a.optimalAngle.toFixed(1)}°</strong>) &bull;
                    <strong class="${a.isCrit ? 'val-green' : 'val-yellow'}">${a.isCrit ? '★ CRIT HIT' : 'CLEAVED'}</strong>
                </div>
                <div style="color: ${isAtActualCut ? '#00e676' : '#ffe600'}; font-size: 10px; margin-top: 2px;">
                    ${isAtActualCut ? '📍 Showing your winning cut state' : `🔎 Testing θ = ${exploreTheta.toFixed(1)}° (click ↺ MY CUT to reset)`}
                </div>
            `;
        }

        // 5. Render Mohr's Circle Canvas & Rotated Stress/Strain Element Canvas (using StudyLab renderers!)
        if (window.StudyLab) {
            const mohrCvs = document.getElementById("reportMohrCanvas");
            const elemCvs = document.getElementById("reportElementCanvas");
            StudyLab.drawMohrCanvas(mohrCvs, sx, sy, txy, exploreTheta, a.optimalAngle);
            StudyLab.drawElementCanvas(elemCvs, curStress, exploreTheta, curStrain);

            // Verdict Banner + Step-by-Step Mathematical Derivations (Stress + Strain)
            const verdictHtml = `
                <div class="derivation-step" style="border-left-color: #ff1744; background: rgba(255, 23, 68, 0.08); padding: 4px 6px; border-radius: 3px; margin-bottom: 8px;">
                    <span class="step-badge" style="color: #ff5252;">💥 ${a.failureTitle.toUpperCase()}</span>
                    <span style="color: var(--text-main); font-size: 11px;">${a.failureMechanism}</span><br>
                    <code style="color: var(--yellow-glow); font-size: 10px;">Law: ${a.formulaUsed}</code>
                </div>
            `;
            StudyLab.renderDerivationsInto(
                document.getElementById("reportDerivationBox"),
                sx, sy, txy, exploreTheta,
                mohr, curStress, strains, curStrain,
                verdictHtml
            );
        }

        // 6. Populate Stress & Strain Readouts Matrix
        const setTxt = (id, txt) => {
            const el = document.getElementById(id);
            if (el) el.textContent = txt;
        };

        setTxt("rep_tensorS", `[${sx.toFixed(0)}, ${sy.toFixed(0)}, ${txy.toFixed(0)}] MPa`);
        setTxt("rep_mohrCR", `C=${mohr.center.toFixed(1)} / R=${mohr.radius.toFixed(1)}`);
        setTxt("rep_principals", `${mohr.sigma1.toFixed(1)} / ${mohr.sigma2.toFixed(1)} MPa`);
        setTxt("rep_tauMax", `${mohr.tauMax.toFixed(1)} MPa (${mohr.thetaS1.toFixed(1)}°)`);
        setTxt("rep_thetaP", `${mohr.thetaP_max.toFixed(1)}°`);
        setTxt("rep_vm", `${mohr.vonMises.toFixed(1)} MPa`);
        setTxt("rep_inv", `${mohr.I1.toFixed(0)}, ${mohr.I2.toFixed(0)}`);
        setTxt("rep_cutS", `${curStress.sigmaTheta.toFixed(1)}, ${curStress.tauTheta.toFixed(1)} MPa`);

        setTxt("rep_epsXY", `${strains.epsX.toFixed(1)}, ${strains.epsY.toFixed(1)} με`);
        setTxt("rep_epsZGamma", `${strains.epsZ.toFixed(1)} με / ${strains.gammaXY.toFixed(0)} μrad`);
        setTxt("rep_eps12", `${strains.eps1.toFixed(1)} / ${strains.eps2.toFixed(1)} με`);
        setTxt("rep_gammaMax", `${strains.gammaMax.toFixed(1)} μrad`);
        setTxt("rep_dilatation", `${strains.dilatation.toFixed(1)} με`);
        setTxt("rep_cutE", `${curStrain.epsTheta.toFixed(1)} με, ${curStrain.gammaTheta.toFixed(1)} μrad`);

        // 7. Energy Density Partitioning Bar
        const uTot = Math.max(0.001, strains.u_total);
        const uVolPct = Math.max(5, Math.min(95, Math.round((strains.u_volumetric / uTot) * 100)));
        const uDistPct = 100 - uVolPct;

        const volBar = document.getElementById("repEnergyVolBar");
        const distBar = document.getElementById("repEnergyDistBar");
        if (volBar) volBar.style.width = `${uVolPct}%`;
        if (distBar) distBar.style.width = `${uDistPct}%`;

        setTxt("rep_uVol", `${strains.u_volumetric.toFixed(2)} kJ/m³ (${uVolPct}%)`);
        setTxt("rep_uDist", `${strains.u_distortion.toFixed(2)} kJ/m³ (${uDistPct}%)`);
        setTxt("rep_uTot", `${strains.u_total.toFixed(2)} kJ/m³`);
    }

    /**
     * Main Game Loop Update
     */
    update() {
        if (this.state !== "playing") return;

        // Pause wave combat whenever any full-screen overlay modal is visible
        const blockingModals = [
            "welcomeModal",
            "levelSelectModal",
            "guideModal",
            "studyModal",
            "reportModal",
            "tutorialCompleteModal",
            "gameOverModal"
        ];
        for (const id of blockingModals) {
            const m = document.getElementById(id);
            if (m && m.classList.contains("visible")) return;
        }

        // Screen Shake decay
        if (this.screenShake > 0) this.screenShake *= 0.88;
        if (this.screenShake < 0.2) this.screenShake = 0;

        const timeSlowFactor = this.powerups.slowmo.active ? 0.2 : 1.0;

        // Update powerups
        for (const key in this.powerups) {
            const p = this.powerups[key];
            if (p.active) {
                p.timer--;
                if (p.timer <= 0) {
                    p.active = false;
                    if (key === "hint") this.hintActive = false;
                    if (key === "scanner") this.scannerActive = false;
                    if (key === "shield") this.shieldActive = false;
                    this.updatePowerUpButtons();
                }
            }
        }

        // Spawn timer (tutorial waits for current drill target to finish cleanly before spawning next)
        this.spawnTimer++;
        const spawnThreshold = this.isTutorial ? 36 : (this.zombies.length === 0 ? 55 : 105);
        const canSpawnMore = this.isTutorial ? (this.zombies.length === 0) : true;
        if (canSpawnMore && this.spawnTimer > spawnThreshold && this.zombiesToSpawn.length > 0) {
            this.spawnTimer = 0;
            this.spawnNextZombie();
        }

        // Update Zombies
        for (let i = this.zombies.length - 1; i >= 0; i--) {
            const z = this.zombies[i];
            z.update(timeSlowFactor);

            // In Tutorial mode, hold practice zombies at safe training range instead of damaging barricade
            if (this.isTutorial && z.x <= 270 && !z.isDying) {
                z.x = 270;
            }

            if (!this.isTutorial && z.x <= 130 && !z.isDying) {
                if (this.shieldActive) {
                    z.x = 240;
                    this.particles.emit(130, z.y, "#00e5ff", 25, 6);
                    this.showToast("🛡️ SHIELD BLOCKED HIT!", "power");
                } else {
                    this.baseHealth -= 15;
                    this.streak = 0;
                    this.screenShake = 12;
                    this.particles.emit(130, z.y, "#ff1744", 20, 5);
                    z.isDying = true;
                    this.updateHUDStats();

                    if (this.baseHealth <= 0) {
                        this.gameOver();
                        return;
                    }
                }
            }

            if (z.isDying && z.deathProgress >= 1.0) {
                this.zombies.splice(i, 1);
            }
        }

        // Sync HUD / Mohr's Circle lock dynamically the moment a zombie enters visible screen bounds
        const activeTarget = this.getPrimaryTarget();
        if (this.hud.targetZombie !== activeTarget) {
            this.hud.setTargetZombie(activeTarget);
        }

        if (this.isTutorial) {
            this.updateTutorialCoach();
        }

        // Update Machine Gun cooldown, recoil, muzzle flash, lock shake & auto-hold bursts
        if (this.fireCooldown > 0) this.fireCooldown--;
        if (this.muzzleFlash > 0) this.muzzleFlash = Math.max(0, this.muzzleFlash - 0.35);
        if (this.gunRecoil > 0) this.gunRecoil = Math.max(0, this.gunRecoil * 0.72);
        if (this.gunRecoil < 0.1) this.gunRecoil = 0;
        if (this.lockShakeTimer > 0) this.lockShakeTimer--;

        if (this.isFiringHeld && this.fireCooldown <= 0) {
            this.firePlaneCutter(true);
        }

        this.updateProjectiles();

        // Update Water Jet visual
        if (this.waterJetEffect) {
            this.waterJetEffect.progress += 0.05;
            if (this.waterJetEffect.progress >= 1.0) this.waterJetEffect = null;
        }

        this.particles.update();

        // Level cleared
        if (this.zombies.length === 0 && this.zombiesToSpawn.length === 0) {
            this.levelCleared();
        }
    }

    levelCleared() {
        if (this.isTutorial) {
            this.completeTutorial();
            return;
        }
        this.state = "level_clear";
        this.isFiringHeld = false;
        this.queuedShots = [];
        this.hideLiveKillReport();
        if (window.soundController && window.soundController.isBgPlaying) {
            window.soundController.setMusicMode("ambient");
        }
        const modal = document.getElementById("reportModal");
        if (!modal) return;

        const levelCuts = this.levelStats.cuts;
        const levelCrits = this.levelStats.crits;
        const levelDeflections = this.levelStats.deflections;
        const levelAccuracy = levelCuts > 0
            ? Math.round((levelCrits / levelCuts) * 100)
            : 100;

        // Calculate stars earned: 3 stars for >= 80% accuracy, 2 stars for >= 50%, 1 star otherwise
        const starsEarned = levelAccuracy >= 80 ? 3 : (levelAccuracy >= 50 ? 2 : 1);
        this.levelStars[this.level] = Math.max(this.levelStars[this.level] || 0, starsEarned);
        this.levelHighScores[this.level] = Math.max(this.levelHighScores[this.level] || 0, this.score);

        // Check if next level is unlocked (out of 10 levels)
        let newlyUnlocked = false;
        const nextLvl = this.level + 1;
        if (nextLvl <= LEVEL_CONFIGS.length && this.maxUnlockedLevel < nextLvl) {
            this.maxUnlockedLevel = nextLvl;
            newlyUnlocked = true;
        }
        this.saveProgression();

        const unlockBanner = document.getElementById("reportUnlockBanner");
        if (unlockBanner) {
            if (newlyUnlocked) {
                unlockBanner.innerHTML = nextLvl === 10
                    ? `🎉 <strong>Endless Mode Unlocked!</strong>`
                    : `🔓 <strong>Level ${nextLvl} Unlocked!</strong>`;
            } else {
                unlockBanner.innerHTML = `${"★".repeat(starsEarned)}${"☆".repeat(3 - starsEarned)} Complete`;
            }
        }

        const nextBtn = document.getElementById("btnNextLevel");
        if (nextBtn) {
            nextBtn.textContent = newlyUnlocked && this.level < LEVEL_CONFIGS.length
                ? `▶ LEVEL ${this.level + 1} [SPACE] ➔`
                : `🗺️ LEVEL MAP [SPACE] ➔`;
        }

        const currConfig = LEVEL_CONFIGS.find(c => c.id === this.level) || LEVEL_CONFIGS[0];

        let mechanicsInsight = "";
        if (this.level === 1) {
            mechanicsInsight = "Zero shear (τxy = 0) kept principal planes flat at 0° / 90°.";
        } else if (this.level === 2) {
            mechanicsInsight = "Biaxial pull (σx ≠ σy): you aimed along max tension σ1.";
        } else if (this.level === 3) {
            mechanicsInsight = "Shear rotated θp — turning θ moved Mohr's circle twice as fast (2θ).";
        } else if (this.level === 4) {
            mechanicsInsight = "Cyan broke at tension σ1 while Orange yielded at peak shear τmax.";
        } else if (this.level === 5) {
            mechanicsInsight = "Hydro-Jet [5] wiped shear (τ = 0) and converted Orange into Cyan.";
        } else if (this.level === 6) {
            mechanicsInsight = "Color changers flipped weaknesses between σ1 (Cyan) and τmax (Orange).";
        } else if (this.level === 7) {
            mechanicsInsight = "Linked twins shared the same stress tensor & cut plane.";
        } else if (this.level === 8) {
            mechanicsInsight = "Shield [4] blocked impacts while I1 = σx + σy stayed conserved.";
        } else if (this.level === 9) {
            mechanicsInsight = "Boss crushed along its peak distortion-energy plane!";
        } else {
            mechanicsInsight = "Survived mixed endless stress waves!";
        }

        let autopsyTableHtml = "";
        const sectorAutopsies = this.levelAutopsies;
        if (sectorAutopsies.length > 0) {
            const rows = sectorAutopsies.map((a, idx) => `
                <tr>
                    <td><strong class="val-cyan">#${idx + 1}</strong></td>
                    <td><strong>${a.zombieName}</strong></td>
                    <td>[${a.stress.sx.toFixed(0)}, ${a.stress.sy.toFixed(0)}, <span class="val-orange">${a.stress.txy.toFixed(0)}</span>]</td>
                    <td><strong class="val-green">${a.stress.sigma1.toFixed(1)}</strong> / <span class="val-orange">${a.stress.tauMax.toFixed(1)}</span></td>
                    <td>θ = <strong class="val-yellow">${a.cutAngle.toFixed(1)}°</strong></td>
                    <td><strong class="val-cyan">${a.failureTitle}</strong></td>
                    <td>
                        <button class="autopsy-inspect-btn" onclick="if(window.game) { window.game.selectPostLevelSpecimen(${idx}); const w = document.getElementById('reportLabWrapper'); if(w) w.scrollIntoView({behavior:'smooth'}); }">
                            🔬 VIEW
                        </button>
                    </td>
                </tr>
            `).join("");

            autopsyTableHtml = `
                <div style="margin-top: 10px; background: rgba(6, 16, 26, 0.95); border: 1px solid rgba(0, 230, 118, 0.55); border-radius: 6px; padding: 10px;">
                    <div style="font-family: var(--font-mono); font-size: 11px; font-weight: bold; color: #00e676; margin-bottom: 6px;">
                        📋 ZOMBIE KILL REPORT (ALL ${sectorAutopsies.length} SLAIN)
                    </div>
                    <div class="autopsy-table-container">
                        <table class="autopsy-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>ZOMBIE</th>
                                    <th>[σx, σy, τxy]</th>
                                    <th>σ1 / τmax</th>
                                    <th>YOUR CUT θ</th>
                                    <th>FAILURE LAW</th>
                                    <th>INSPECT</th>
                                </tr>
                            </thead>
                            <tbody>${rows}</tbody>
                        </table>
                    </div>
                </div>
            `;
        }

        const feedbackReport = `
            <div class="report-metrics-grid">
                <div class="report-metric-box">
                    <span class="report-label">ACCURACY</span>
                    <strong class="report-val val-cyan">${levelAccuracy}%</strong>
                </div>
                <div class="report-metric-box">
                    <span class="report-label">CRITS</span>
                    <strong class="report-val val-green">${levelCrits} / ${levelCuts}</strong>
                </div>
                <div class="report-metric-box">
                    <span class="report-label">MISFIRES</span>
                    <strong class="report-val ${levelDeflections > 0 ? 'val-orange' : 'val-green'}">${levelDeflections}</strong>
                </div>
                <div class="report-metric-box">
                    <span class="report-label">STREAK</span>
                    <strong class="report-val val-yellow">${this.levelStats.maxStreak}x</strong>
                </div>
            </div>

            <div class="report-summary-note">
                <strong class="val-green">💡 TAKEAWAY:</strong> ${mechanicsInsight}
            </div>

            ${autopsyTableHtml}
        `;

        document.getElementById("reportTitle").textContent = `LEVEL ${this.level}: ${currConfig.title.toUpperCase()} CLEARED!`;
        document.getElementById("reportScore").textContent = `Score: ${this.score.toLocaleString()}`;
        document.getElementById("reportAccuracy").textContent = `${"★".repeat(starsEarned)}${"☆".repeat(3 - starsEarned)} • ${levelAccuracy}%`;
        document.getElementById("reportDiagnosis").innerHTML = feedbackReport;

        this.reportSelectedIdx = 0;
        if (this.levelAutopsies.length > 0) {
            this.reportExploreAngle = this.levelAutopsies[0].cutAngle;
        }
        modal.classList.add("visible");
        this.renderPostLevelSpecimenLab();
        this.saveHighScore();
    }

    nextLevel() {
        const modal = document.getElementById("reportModal");
        if (modal) modal.classList.remove("visible");

        // Always transition from Post-Level Report to the Level Selection Map (never directly into combat)
        this.state = "menu";
        this.zombies = [];
        this.zombiesToSpawn = [];
        this.bullets = [];
        this.casings = [];
        this.queuedShots = [];
        this.isFiringHeld = false;
        this.hideLiveKillReport();
        this.hud.setTargetZombie(null);

        if (this.level < LEVEL_CONFIGS.length) {
            this.level = Math.min(this.maxUnlockedLevel, this.level + 1);
        }
        this.updateHUDStats();
        this.openLevelSelectModal();

        const nextCfg = LEVEL_CONFIGS.find(c => c.id === this.level);
        if (nextCfg) {
            this.showToast(`🗺️ Level ${nextCfg.id}: ${nextCfg.title}`, "info");
        }
    }

    gameOver() {
        this.state = "game_over";
        this.isFiringHeld = false;
        this.queuedShots = [];
        this.hideLiveKillReport();
        if (window.soundController && window.soundController.isBgPlaying) {
            window.soundController.setMusicMode("ambient");
        }
        const modal = document.getElementById("gameOverModal");
        if (modal) {
            const kills = this.levelAutopsies ? this.levelAutopsies.length : 0;
            document.getElementById("finalScore").textContent = `Score: ${this.score} PTS • Kills: ${kills} (Level ${this.level})`;
            const restartBtn = document.getElementById("btnRestart");
            if (restartBtn) {
                restartBtn.textContent = `↺ RETRY LEVEL ${this.level}`;
            }
            const repBtn = document.getElementById("btnGameOverReports");
            if (repBtn) {
                repBtn.style.display = kills > 0 ? "inline-flex" : "none";
                repBtn.textContent = `🔬 ZOMBIE REPORTS (${kills})`;
            }
            modal.classList.add("visible");
        }
        this.saveHighScore();
    }

    restartGame() {
        const m1 = document.getElementById("gameOverModal");
        const m2 = document.getElementById("reportModal");
        if (m1) m1.classList.remove("visible");
        if (m2) m2.classList.remove("visible");
        this.hideLiveKillReport();
        const retryLevel = Math.max(1, Math.min(this.maxUnlockedLevel, this.level || 1));
        this.startLevel(retryLevel);
    }

    saveHighScore() {
        try {
            const key = "stress_zombie_highscore";
            const prev = parseInt(localStorage.getItem(key) || "0");
            if (this.score > prev) {
                localStorage.setItem(key, this.score.toString());
            }
        } catch(e) {}
    }

    /**
     * Battlefield Rendering
     */
    draw() {
        if (!this.ctx) return;
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;

        ctx.save();

        // Screen Shake Translation
        if (this.screenShake > 0) {
            const shakeX = (Math.random() - 0.5) * this.screenShake;
            const shakeY = (Math.random() - 0.5) * this.screenShake;
            ctx.translate(shakeX, shakeY);
        }

        ctx.clearRect(0, 0, w, h);

        // Background
        this.drawCityBackground(ctx, w, h);

        // Barricade
        this.drawBarricade(ctx, h);

        // Zombies
        const primaryTarget = this.getPrimaryTarget();
        for (const z of this.zombies) {
            z.draw(ctx, z === primaryTarget);
        }

        // Live Aiming & Failure Plane Visual Guide (or Standby Banner before zombie appears on screen)
        if (primaryTarget) {
            this.drawAimGuideReticle(ctx, primaryTarget, w, h);
        } else if (this.state === "playing" && (this.zombies.length > 0 || this.zombiesToSpawn.length > 0)) {
            ctx.save();
            const boxW = 290;
            const boxH = 24;
            const boxX = w / 2 - boxW / 2;
            const boxY = 8;
            traceChamferBox(ctx, boxX, boxY, boxW, boxH, 6);
            ctx.fillStyle = "rgba(7, 13, 22, 0.92)";
            ctx.fill();
            ctx.strokeStyle = "rgba(148, 163, 184, 0.48)";
            ctx.lineWidth = 1.2;
            ctx.stroke();
            ctx.font = "bold 11px 'Courier New', monospace";
            ctx.textAlign = "center";
            ctx.fillStyle = "#cbd5e1";
            ctx.fillText("⏳ STANDBY — WAIT FOR ZOMBIE", w / 2, boxY + 16);
            ctx.restore();
        }

        // Water Jet stream if firing
        if (this.waterJetEffect) {
            this.drawWaterJet(ctx, w, h);
        }

        // Machine Gun Tracer Bullets, Shell Casings & Muzzle Flash
        this.drawBulletsAndMuzzle(ctx);

        // Particles
        this.particles.draw(ctx);

        // Invariant Shield
        if (this.shieldActive) {
            this.drawInvariantShield(ctx, h);
        }

        // Combo Banner
        if (this.streak >= 2) {
            this.drawComboBanner(ctx, w);
        }

        ctx.restore();
    }

    /**
     * Horror Sector Atmosphere Configuration (Fuses all 3 reference horror environments)
     */
    getHorrorThemeConfig() {
        if (this.level >= 7) {
            // Sectors 7-10: Burning Overpass & Blood-Moon Apocalypse (Image 3 dusk + Image 1 moon)
            return {
                key: "blood_overpass",
                skyTop: "#0e0617",
                skyMid: "#36182f",
                skyHorizon: "#752b23",
                moonOuter: "rgba(255, 86, 62, 0.34)",
                moonCore: "#ffc59c",
                moonRim: "#e87a64",
                moonCrater: "rgba(170, 52, 46, 0.44)",
                smokeColor: "rgba(22, 10, 18, 0.56)",
                ruinColor: "#140914",
                hillBack: "#1a0c18",
                hillMid: "#100711",
                woodColor: "#060309",
                houseWin: "rgba(255, 136, 68, 0.78)",
                brickBase: "#24161a",
                brickHi: "#382125",
                mistRgb: "225, 118, 76",
                lampRgb: "255, 182, 74",
                roadTop: "#140b14",
                roadMid: "#291820",
                roadBottom: "#070409",
                horizonSheen: "rgba(255, 112, 54, 0.24)",
                emberRgb: "255, 120, 48"
            };
        }
        if (this.level >= 4) {
            // Sectors 4-6: Cursed Dead Woods & Toxic Marsh Mist (Image 2 top + Image 1)
            return {
                key: "toxic_woods",
                skyTop: "#040b06",
                skyMid: "#0f2614",
                skyHorizon: "#27471e",
                moonOuter: "rgba(205, 242, 165, 0.26)",
                moonCore: "#eff7cf",
                moonRim: "#cbe09a",
                moonCrater: "rgba(128, 162, 92, 0.42)",
                smokeColor: "rgba(10, 22, 12, 0.48)",
                ruinColor: "#09150b",
                hillBack: "#0c1b0e",
                hillMid: "#071108",
                woodColor: "#030704",
                houseWin: "rgba(134, 247, 178, 0.72)",
                brickBase: "#161d17",
                brickHi: "#263127",
                mistRgb: "105, 190, 105",
                lampRgb: "255, 210, 86",
                roadTop: "#0c130d",
                roadMid: "#191e19",
                roadBottom: "#040705",
                horizonSheen: "rgba(130, 215, 110, 0.14)",
                emberRgb: "152, 240, 82"
            };
        }
        // Sectors 1-3: Haunted Midnight Cemetery & Quarantine Highway (Image 1 + Image 2 + Image 3)
        return {
            key: "midnight_cemetery",
            skyTop: "#030a10",
            skyMid: "#0a2029",
            skyHorizon: "#1c2832",
            moonOuter: "rgba(255, 238, 195, 0.28)",
            moonCore: "#fdf1d4",
            moonRim: "#dfd0ad",
            moonCrater: "rgba(176, 146, 102, 0.42)",
            smokeColor: "rgba(10, 15, 22, 0.48)",
            ruinColor: "#09131a",
            hillBack: "#08171e",
            hillMid: "#050f15",
            woodColor: "#03070b",
            houseWin: "rgba(96, 225, 245, 0.74)",
            brickBase: "#181d26",
            brickHi: "#272e3a",
            mistRgb: "110, 192, 200",
            lampRgb: "255, 202, 96",
            roadTop: "#0b1118",
            roadMid: "#191c25",
            roadBottom: "#04060a",
            horizonSheen: "rgba(232, 162, 102, 0.14)",
            emberRgb: "255, 145, 55"
        };
    }

    drawCityBackground(ctx, w, h) {
        const time = Date.now() * 0.001;
        const theme = this.getHorrorThemeConfig();
        const cacheKey = `${theme.key}_${w}_${h}`;

        if (!this.bgCacheCanvas || this.bgCacheKey !== cacheKey) {
            this.buildHorrorBackgroundCache(w, h, theme, cacheKey);
        }

        // Blit crisp pre-rendered horror scenery cache (<0.1ms)
        ctx.drawImage(this.bgCacheCanvas, 0, 0);

        // Live animated atmospheric horror layer (fog, flickering lamps, bats, puddle glint, embers)
        this.drawHorrorAtmosphereOverlay(ctx, w, h, time, theme);
    }

    drawGnarledTree(bctx, tx, baseY, treeH, lean, scale, color) {
        bctx.save();
        bctx.translate(tx, baseY);
        bctx.fillStyle = color;
        bctx.strokeStyle = color;
        bctx.lineCap = "round";
        bctx.lineJoin = "round";

        // Flared root base & gnarled leaning trunk
        const topX = lean * treeH * 0.25;
        const topY = -treeH * 0.56;
        const trunkW = 14 * scale;

        bctx.beginPath();
        bctx.moveTo(-trunkW * 1.15, 2);
        bctx.quadraticCurveTo(-trunkW * 0.55, -treeH * 0.18, topX - trunkW * 0.34, topY);
        bctx.lineTo(topX + trunkW * 0.28, topY);
        bctx.quadraticCurveTo(trunkW * 0.5, -treeH * 0.22, trunkW * 1.1, 2);
        bctx.closePath();
        bctx.fill();

        // Recursive crooked claws & dead twigs
        const branch = (x, y, ang, len, wid, depth) => {
            if (depth <= 0 || len < 6) return;
            const mx = x + Math.cos(ang + (depth % 2 === 0 ? 0.18 : -0.18)) * len * 0.52;
            const my = y + Math.sin(ang + (depth % 2 === 0 ? 0.18 : -0.18)) * len * 0.52;
            const ex = x + Math.cos(ang) * len;
            const ey = y + Math.sin(ang) * len;

            bctx.lineWidth = Math.max(1.0, wid);
            bctx.beginPath();
            bctx.moveTo(x, y);
            bctx.quadraticCurveTo(mx, my, ex, ey);
            bctx.stroke();

            branch(ex, ey, ang - 0.42 - (depth % 2) * 0.12, len * 0.68, wid * 0.58, depth - 1);
            branch(ex, ey, ang + 0.38 + (depth % 3) * 0.1, len * 0.62, wid * 0.54, depth - 1);
        };

        branch(topX, topY + 6 * scale, -Math.PI * 0.72, treeH * 0.28, 7.2 * scale, 4);
        branch(topX, topY, -Math.PI * 0.5 + lean * 0.25, treeH * 0.34, 6.8 * scale, 4);
        branch(topX, topY + 8 * scale, -Math.PI * 0.24, treeH * 0.32, 6.4 * scale, 4);
        bctx.restore();
    }

    buildHorrorBackgroundCache(w, h, theme, cacheKey) {
        const cvs = document.createElement("canvas");
        cvs.width = w;
        cvs.height = h;
        const bctx = cvs.getContext("2d");
        const groundY = Math.round(h * 0.65); // 312px road curb line so all zombie boots walk firmly on asphalt

        // 1. SKY GRADIENT, ANIME STORM CLOUDS & DISTANT SMOLDERING HAZE
        const skyGrad = bctx.createLinearGradient(0, 0, 0, groundY + 18);
        skyGrad.addColorStop(0, theme.skyTop);
        skyGrad.addColorStop(0.55, theme.skyMid);
        skyGrad.addColorStop(1, theme.skyHorizon);
        bctx.fillStyle = skyGrad;
        bctx.fillRect(0, 0, w, groundY + 20);

        // Starry night pinpricks
        for (let s = 0; s < 48; s++) {
            const sx = ((s * 97 + 31) % w);
            const sy = ((s * 53 + 17) % (groundY * 0.58));
            const alpha = theme.key === "blood_overpass" ? 0.2 : 0.46;
            const sr = (s % 5 === 0) ? 1.6 : 0.9;
            bctx.fillStyle = `rgba(220, 238, 255, ${alpha * (0.4 + (s % 4) * 0.2)})`;
            bctx.beginPath();
            bctx.arc(sx, sy, sr, 0, Math.PI * 2);
            bctx.fill();
        }

        // Layered cel-shaded anime night clouds near horizon
        const clouds = [
            { x: 145, y: 66, rx: 115, ry: 20 },
            { x: 390, y: 50, rx: 140, ry: 22 },
            { x: 610, y: 78, rx: 120, ry: 18 }
        ];
        for (const cl of clouds) {
            const clG = bctx.createLinearGradient(cl.x, cl.y - cl.ry, cl.x, cl.y + cl.ry);
            clG.addColorStop(0, "rgba(180, 225, 245, 0.08)");
            clG.addColorStop(1, "rgba(4, 9, 16, 0.38)");
            bctx.fillStyle = clG;
            bctx.beginPath();
            bctx.ellipse(cl.x, cl.y, cl.rx, cl.ry, -0.04, 0, Math.PI * 2);
            bctx.fill();
        }

        // Apocalyptic 3D-shaded smoke column rising behind skyline
        const smkGrad = bctx.createLinearGradient(465, 65, 540, groundY - 30);
        smkGrad.addColorStop(0, "rgba(45, 58, 72, 0.24)");
        smkGrad.addColorStop(1, theme.smokeColor);
        bctx.fillStyle = smkGrad;
        bctx.beginPath();
        bctx.moveTo(490, groundY - 30);
        bctx.bezierCurveTo(500, 175, 458, 125, 474, 68);
        bctx.bezierCurveTo(486, 44, 514, 52, 522, 82);
        bctx.bezierCurveTo(516, 130, 542, 185, 536, groundY - 30);
        bctx.closePath();
        bctx.fill();

        // 2. GIANT 3D SPHERICAL CRATERED HORROR MOON IN UPPER RIGHT
        const moonX = Math.round(w * 0.80);
        const moonY = Math.round(h * 0.205);
        const moonR = 44;

        const moonHalo = bctx.createRadialGradient(moonX, moonY, moonR * 0.45, moonX, moonY, moonR * 3.3);
        moonHalo.addColorStop(0, theme.moonOuter);
        moonHalo.addColorStop(0.45, "rgba(180, 215, 220, 0.1)");
        moonHalo.addColorStop(1, "rgba(0, 0, 0, 0)");
        bctx.fillStyle = moonHalo;
        bctx.beginPath();
        bctx.arc(moonX, moonY, moonR * 3.3, 0, Math.PI * 2);
        bctx.fill();

        bctx.save();
        bctx.beginPath();
        bctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
        bctx.clip();

        const moonDisc = bctx.createRadialGradient(moonX - 16, moonY - 16, 6, moonX + 6, moonY + 6, moonR * 1.24);
        moonDisc.addColorStop(0, theme.moonCore);
        moonDisc.addColorStop(0.68, theme.moonRim);
        moonDisc.addColorStop(1, "#6f5d4b");
        bctx.fillStyle = moonDisc;
        bctx.fillRect(moonX - moonR, moonY - moonR, moonR * 2, moonR * 2);

        const craters = [
            { x: -16, y: -14, rx: 14, ry: 10, rot: -0.3 },
            { x: 14, y: -18, rx: 11, ry: 8, rot: 0.4 },
            { x: -8, y: 12, rx: 17, ry: 12, rot: 0.2 },
            { x: 18, y: 8, rx: 12, ry: 14, rot: -0.5 },
            { x: 2, y: -4, rx: 8, ry: 6, rot: 0.1 },
            { x: -24, y: 4, rx: 9, ry: 7, rot: 0.6 }
        ];
        bctx.fillStyle = theme.moonCrater;
        for (const c of craters) {
            bctx.beginPath();
            bctx.ellipse(moonX + c.x, moonY + c.y, c.rx, c.ry, c.rot, 0, Math.PI * 2);
            bctx.fill();
        }
        bctx.restore();

        bctx.beginPath();
        bctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
        bctx.strokeStyle = "rgba(255, 245, 220, 0.42)";
        bctx.lineWidth = 1.6;
        bctx.stroke();

        // 3. 3D EXTRUDED RUINED CITY TOWERS (Front face + darkened 3D perspective side return + rim)
        const ruins = [
            { x: 215, w: 50, d: 14, h: 118, notch: 14 },
            { x: 276, w: 42, d: 13, h: 148, notch: -10 },
            { x: 332, w: 56, d: 16, h: 105, notch: 8 },
            { x: 404, w: 48, d: 14, h: 132, notch: -14 },
            { x: 466, w: 62, d: 16, h: 162, notch: 18 },
            { x: 542, w: 54, d: 15, h: 140, notch: -8 }
        ];
        for (const r of ruins) {
            const topY = groundY - r.h;
            const sideYOff = 7;

            // Angled 3D Right Side Wall (deep shadow toward perspective depth)
            bctx.fillStyle = "#04080e";
            bctx.beginPath();
            bctx.moveTo(r.x + r.w, topY + (r.notch > 0 ? 4 : -6));
            bctx.lineTo(r.x + r.w + r.d, topY + (r.notch > 0 ? 4 : -6) + sideYOff);
            bctx.lineTo(r.x + r.w + r.d, groundY);
            bctx.lineTo(r.x + r.w, groundY);
            bctx.closePath();
            bctx.fill();

            // Front Skyscraper Facade
            const bldgGrad = bctx.createLinearGradient(r.x, topY, r.x + r.w, groundY);
            bldgGrad.addColorStop(0, theme.ruinColor);
            bldgGrad.addColorStop(1, "#05090f");
            bctx.fillStyle = bldgGrad;
            bctx.beginPath();
            bctx.moveTo(r.x, groundY);
            bctx.lineTo(r.x, topY);
            bctx.lineTo(r.x + r.w * 0.45, topY + r.notch);
            bctx.lineTo(r.x + r.w, topY + (r.notch > 0 ? 4 : -6));
            bctx.lineTo(r.x + r.w, groundY);
            bctx.closePath();
            bctx.fill();

            // Moonlit rooftop edge & vertical corner highlight
            bctx.strokeStyle = "rgba(145, 200, 225, 0.16)";
            bctx.lineWidth = 1.1;
            bctx.beginPath();
            bctx.moveTo(r.x + r.w, groundY);
            bctx.lineTo(r.x + r.w, topY + (r.notch > 0 ? 4 : -6));
            bctx.lineTo(r.x + r.w * 0.45, topY + r.notch);
            bctx.lineTo(r.x, topY);
            bctx.stroke();

            // Rooftop spire / antenna + crimson warning aircraft beacon
            if (r.h >= 132) {
                const antX = r.x + r.w * 0.72;
                const antTopY = topY - 18;
                bctx.strokeStyle = "rgba(140, 165, 190, 0.35)";
                bctx.lineWidth = 1.2;
                bctx.beginPath();
                bctx.moveTo(antX, topY);
                bctx.lineTo(antX, antTopY);
                bctx.stroke();
                bctx.fillStyle = "rgba(255, 42, 72, 0.8)";
                bctx.beginPath();
                bctx.arc(antX, antTopY, 2.0, 0, Math.PI * 2);
                bctx.fill();
            }

            // Shattered anime window grids
            bctx.fillStyle = theme.key === "blood_overpass" ? "rgba(255, 130, 62, 0.26)" : "rgba(110, 205, 225, 0.15)";
            for (let wy = topY + 20; wy < groundY - 60; wy += 18) {
                for (let wx = r.x + 10; wx < r.x + r.w - 12; wx += 14) {
                    if (Math.sin(wx * 13.7 + wy * 7.3) > 0.45) {
                        bctx.fillRect(wx, wy, 5, 7);
                    }
                }
            }
        }

        // 4. 3D CURVED BROKEN HIGHWAY OVERPASS (Cylindrical Piers + Extruded Box Girder)
        bctx.save();
        for (const p of [{ x: 72, y: 48, pw: 24, ph: 220 }, { x: 192, y: 82, pw: 26, ph: 195 }]) {
            // 3D cylindrical shaded concrete pier
            const pGrad = bctx.createLinearGradient(p.x, p.y, p.x + p.pw, p.y);
            pGrad.addColorStop(0, "#0b0e16");
            pGrad.addColorStop(0.55, "#1f2634");
            pGrad.addColorStop(0.85, "#2b3446");
            pGrad.addColorStop(1, "#0d111a");
            bctx.fillStyle = pGrad;
            bctx.fillRect(p.x, p.y, p.pw, p.ph);

            // Concrete pier hammerhead cap
            bctx.fillStyle = "#283040";
            bctx.fillRect(p.x - 6, p.y - 6, p.pw + 12, 10);
            bctx.strokeStyle = "rgba(255,255,255,0.12)";
            bctx.lineWidth = 1;
            bctx.strokeRect(p.x - 6, p.y - 6, p.pw + 12, 10);
        }

        // Underside deep recessed box-girder thickness (3D depth extrusion)
        bctx.beginPath();
        bctx.moveTo(-10, 2);
        bctx.quadraticCurveTo(140, 68, 322, 108);
        bctx.lineTo(312, 128);
        bctx.quadraticCurveTo(125, 92, -12, 34);
        bctx.closePath();
        bctx.fillStyle = "#0a0d14";
        bctx.fill();

        // Swooping concrete deck curving down from upper-left to shattered break
        bctx.beginPath();
        bctx.moveTo(-10, -8);
        bctx.quadraticCurveTo(145, 58, 326, 98);
        bctx.lineTo(318, 108);
        bctx.lineTo(324, 117);
        bctx.lineTo(312, 126);
        bctx.quadraticCurveTo(125, 86, -12, 26);
        bctx.closePath();
        const overGrad = bctx.createLinearGradient(0, 0, 260, 130);
        overGrad.addColorStop(0, "#1c2230");
        overGrad.addColorStop(0.6, "#2c3242");
        overGrad.addColorStop(1, "#1e222e");
        bctx.fillStyle = overGrad;
        bctx.fill();

        // Top curb bevel highlight
        bctx.strokeStyle = theme.horizonSheen;
        bctx.lineWidth = 2.4;
        bctx.beginPath();
        bctx.moveTo(-10, -6);
        bctx.quadraticCurveTo(145, 60, 326, 98);
        bctx.stroke();

        // Protruding bent steel rebar & hanging snapped cable loops
        bctx.strokeStyle = "#080b10";
        bctx.lineWidth = 1.8;
        bctx.beginPath();
        bctx.moveTo(320, 104); bctx.lineTo(338, 112); bctx.lineTo(344, 124);
        bctx.moveTo(318, 114); bctx.lineTo(335, 119);
        bctx.moveTo(315, 122); bctx.quadraticCurveTo(328, 145, 319, 168);
        bctx.moveTo(222, 84); bctx.quadraticCurveTo(260, 118, 294, 104);
        bctx.stroke();
        bctx.restore();

        // 5. HAUNTED HILL WITH 3D MANOR & WINDMILL UNDER THE MOON
        bctx.beginPath();
        bctx.moveTo(0, groundY);
        bctx.quadraticCurveTo(180, groundY - 46, 360, groundY - 34);
        bctx.quadraticCurveTo(510, groundY - 44, 650, groundY - 82);
        bctx.quadraticCurveTo(750, groundY - 102, w, groundY - 70);
        bctx.lineTo(w, groundY);
        bctx.closePath();
        bctx.fillStyle = theme.hillBack;
        bctx.fill();

        // Haunted House Silhouette at crest (with 3D dark side wall & moon-rim)
        bctx.save();
        bctx.fillStyle = "#03070c";
        bctx.fillRect(702, 190, 9, 32); // 3D side return wing
        bctx.fillStyle = theme.hillMid;
        bctx.fillRect(668, 188, 34, 34);
        bctx.fillRect(646, 200, 24, 24);
        // Steep crooked gable roof + chimney
        bctx.beginPath();
        bctx.moveTo(663, 189);
        bctx.lineTo(685, 169);
        bctx.lineTo(707, 189);
        bctx.closePath();
        bctx.fill();
        bctx.fillRect(694, 170, 5, 14);
        bctx.beginPath();
        bctx.moveTo(643, 201);
        bctx.lineTo(658, 188);
        bctx.lineTo(670, 201);
        bctx.closePath();
        bctx.fill();
        // Moonlight roof highlight
        bctx.strokeStyle = "rgba(255, 245, 220, 0.16)";
        bctx.lineWidth = 1.2;
        bctx.beginPath();
        bctx.moveTo(685, 169);
        bctx.lineTo(707, 189);
        bctx.stroke();

        // Eerie glowing windows with glow bloom
        bctx.fillStyle = theme.houseWin;
        bctx.shadowColor = theme.houseWin;
        bctx.shadowBlur = 8;
        bctx.fillRect(674, 195, 5, 8);
        bctx.fillRect(688, 195, 5, 8);
        bctx.fillRect(681, 179, 4, 6);
        bctx.fillRect(654, 206, 4, 6);
        bctx.shadowBlur = 0;

        // Windmill beside manor
        bctx.strokeStyle = theme.hillMid;
        bctx.lineWidth = 2.2;
        bctx.beginPath();
        bctx.moveTo(760, 224); bctx.lineTo(768, 185);
        bctx.moveTo(778, 224); bctx.lineTo(770, 185);
        bctx.moveTo(763, 210); bctx.lineTo(775, 210);
        bctx.moveTo(765, 197); bctx.lineTo(773, 197);
        bctx.stroke();
        bctx.lineWidth = 1.3;
        bctx.beginPath();
        bctx.arc(769, 184, 15, 0, Math.PI * 2);
        for (let a = 0; a < 8; a++) {
            const ang = (a * Math.PI) / 4 + 0.25;
            bctx.moveTo(769, 184);
            bctx.lineTo(769 + Math.cos(ang) * 16, 184 + Math.sin(ang) * 16);
        }
        bctx.stroke();
        bctx.restore();

        // 6. DEAD HAUNTED FOREST SILHOUETTES & HERO GNARLED LEFT TREE
        const bgTrees = [
            { x: 148, y: groundY - 22, h: 155, lean: 0.14, s: 0.55 },
            { x: 258, y: groundY - 28, h: 135, lean: -0.1, s: 0.48 },
            { x: 378, y: groundY - 24, h: 145, lean: 0.08, s: 0.50 },
            { x: 510, y: groundY - 26, h: 168, lean: -0.15, s: 0.60 },
            { x: 598, y: groundY - 34, h: 140, lean: 0.12, s: 0.50 }
        ];
        for (const t of bgTrees) {
            this.drawGnarledTree(bctx, t.x, t.y, t.h, t.lean, t.s, theme.hillMid);
        }

        this.drawGnarledTree(bctx, 22, groundY - 4, 295, 0.32, 1.32, theme.woodColor);
        bctx.fillStyle = theme.woodColor;
        bctx.beginPath();
        bctx.ellipse(98, 128, 4.5, 7, 0.1, 0, Math.PI * 2);
        bctx.fill();
        bctx.beginPath();
        bctx.moveTo(95, 121); bctx.lineTo(94, 117); bctx.lineTo(97, 121);
        bctx.moveTo(100, 121); bctx.lineTo(102, 117); bctx.lineTo(101, 121);
        bctx.fill();

        // 7. MISTY CEMETERY RIDGE: GRAVESTONES, CELTIC CROSSES & RISING GRAVE ARMS
        const cemFogGrad = bctx.createLinearGradient(0, groundY - 62, 0, groundY);
        cemFogGrad.addColorStop(0, "rgba(0,0,0,0)");
        cemFogGrad.addColorStop(0.55, `rgba(${theme.mistRgb}, 0.18)`);
        cemFogGrad.addColorStop(1, `rgba(${theme.mistRgb}, 0.3)`);
        bctx.fillStyle = cemFogGrad;
        bctx.fillRect(0, groundY - 62, w, 62);

        bctx.beginPath();
        bctx.moveTo(0, groundY);
        bctx.quadraticCurveTo(210, groundY - 30, 440, groundY - 22);
        bctx.quadraticCurveTo(640, groundY - 32, w, groundY - 20);
        bctx.lineTo(w, groundY);
        bctx.closePath();
        bctx.fillStyle = theme.woodColor;
        bctx.fill();

        const graves = [
            { x: 115, type: "cross", h: 24, tilt: -0.09 },
            { x: 162, type: "stone", h: 20, tilt: 0.11 },
            { x: 205, type: "celtic", h: 28, tilt: -0.05 },
            { x: 292, type: "stone", h: 18, tilt: 0.14 },
            { x: 342, type: "cross", h: 25, tilt: -0.12 },
            { x: 472, type: "celtic", h: 27, tilt: 0.08 },
            { x: 525, type: "stone", h: 21, tilt: -0.08 },
            { x: 720, type: "cross", h: 24, tilt: 0.1 },
            { x: 785, type: "stone", h: 22, tilt: -0.14 }
        ];
        bctx.fillStyle = theme.woodColor;
        bctx.strokeStyle = theme.woodColor;
        for (const g of graves) {
            bctx.save();
            bctx.translate(g.x, groundY - 19);
            bctx.rotate(g.tilt);
            if (g.type === "cross" || g.type === "celtic") {
                bctx.fillRect(-2.5, -g.h, 5, g.h);
                bctx.fillRect(-8, -g.h + 5, 16, 4);
                if (g.type === "celtic") {
                    bctx.lineWidth = 2.2;
                    bctx.beginPath();
                    bctx.arc(0, -g.h + 7, 5.5, 0, Math.PI * 2);
                    bctx.stroke();
                }
            } else {
                // 3D beveled tombstone depth shadow
                bctx.fillStyle = "#010306";
                bctx.fillRect(5, -g.h + 4, 3.5, g.h - 4);
                bctx.fillStyle = theme.woodColor;
                bctx.beginPath();
                bctx.moveTo(-7, 0);
                bctx.lineTo(-7, -g.h + 5);
                bctx.arc(0, -g.h + 5, 7, Math.PI, 0);
                bctx.lineTo(7, 0);
                bctx.closePath();
                bctx.fill();
            }
            bctx.restore();
        }

        // Skeletal zombie hands clawing out of graves
        bctx.save();
        bctx.strokeStyle = theme.woodColor;
        bctx.fillStyle = theme.woodColor;
        bctx.lineWidth = 3.2;
        bctx.beginPath();
        bctx.moveTo(414, groundY - 18); bctx.lineTo(411, groundY - 38); bctx.lineTo(405, groundY - 45);
        bctx.moveTo(411, groundY - 38); bctx.lineTo(410, groundY - 47);
        bctx.moveTo(411, groundY - 38); bctx.lineTo(416, groundY - 44);
        bctx.moveTo(431, groundY - 18); bctx.lineTo(434, groundY - 34); bctx.lineTo(429, groundY - 41);
        bctx.moveTo(434, groundY - 34); bctx.lineTo(439, groundY - 40);
        bctx.stroke();
        bctx.restore();

        // Lower-left crooked wrought-iron graveyard gate
        bctx.save();
        bctx.strokeStyle = theme.woodColor;
        bctx.lineWidth = 2;
        for (let px = 38; px <= 82; px += 7) {
            bctx.beginPath();
            bctx.moveTo(px, groundY - 14);
            bctx.lineTo(px + 2, groundY - 46 + Math.abs(px - 60) * 0.25);
            bctx.stroke();
        }
        bctx.beginPath();
        bctx.moveTo(36, groundY - 34);
        bctx.lineTo(86, groundY - 31);
        bctx.stroke();
        bctx.restore();

        // 8. 3D BEVELED BRICK MASONRY RETAINING WALL WITH STONE COPING LEDGE
        const wallTop = groundY - 22;
        const wallH = 22;
        bctx.fillStyle = theme.brickBase;
        bctx.fillRect(0, wallTop, w, wallH);

        bctx.strokeStyle = "rgba(0, 0, 0, 0.58)";
        bctx.lineWidth = 1;
        for (let row = 0; row < 3; row++) {
            const ry = wallTop + 4 + row * 6.0;
            bctx.beginPath();
            bctx.moveTo(0, ry); bctx.lineTo(w, ry);
            bctx.stroke();
            const offset = (row % 2) * 10;
            for (let bx = offset; bx < w; bx += 22) {
                if ((bx + row) % 7 !== 0) {
                    bctx.fillStyle = (bx + row) % 3 === 0 ? theme.brickHi : theme.brickBase;
                    bctx.fillRect(bx + 1, ry + 1, 19, 4.3);
                    bctx.fillStyle = "rgba(255, 255, 255, 0.04)";
                    bctx.fillRect(bx + 1, ry + 1, 19, 1.2);
                }
                bctx.beginPath();
                bctx.moveTo(bx, ry);
                bctx.lineTo(bx, ry + 6.0);
                bctx.stroke();
            }
        }
        // 3D Stone Coping Top Cap + Lip Drop Shadow onto bricks
        bctx.fillStyle = "rgba(180, 200, 220, 0.14)";
        bctx.fillRect(0, wallTop - 2, w, 3.5);
        bctx.fillStyle = "rgba(0, 0, 0, 0.45)";
        bctx.fillRect(0, wallTop + 1.5, w, 2.5);

        // 9. TORN CHAIN-LINK QUARANTINE FENCE + 3D JERSEY BARRIER & TIRE
        const fenceTopY = groundY - 88;
        const fenceBotY = groundY - 22;
        const breachL = 428;
        const breachR = 528;

        const drawChainSpan = (xStart, xEnd, isLeftSide) => {
            bctx.save();
            bctx.beginPath();
            bctx.moveTo(xStart, fenceBotY);
            bctx.lineTo(xStart, fenceTopY);
            bctx.lineTo(xEnd, fenceTopY + (isLeftSide ? 6 : 0));
            if (isLeftSide) {
                bctx.lineTo(xEnd - 12, fenceTopY + 26);
                bctx.lineTo(xEnd + 4, fenceTopY + 42);
                bctx.lineTo(xEnd - 16, fenceBotY);
            } else {
                bctx.lineTo(xEnd, fenceBotY);
                bctx.lineTo(xStart - 10, fenceBotY);
                bctx.lineTo(xStart + 6, fenceTopY + 38);
                bctx.lineTo(xStart - 6, fenceTopY + 18);
            }
            bctx.closePath();
            bctx.clip();

            bctx.strokeStyle = "rgba(18, 25, 32, 0.72)";
            bctx.lineWidth = 1.1;
            const step = 10;
            for (let x = xStart - 80; x <= xEnd + 80; x += step) {
                bctx.beginPath();
                bctx.moveTo(x, fenceTopY - 4);
                bctx.lineTo(x + 70, fenceBotY + 4);
                bctx.moveTo(x + 70, fenceTopY - 4);
                bctx.lineTo(x, fenceBotY + 4);
                bctx.stroke();
            }
            bctx.restore();

            bctx.strokeStyle = "rgba(130, 148, 165, 0.25)";
            bctx.lineWidth = 1.4;
            bctx.beginPath();
            bctx.moveTo(xStart, fenceTopY);
            bctx.lineTo(xEnd, fenceTopY + (isLeftSide ? 6 : 0));
            bctx.stroke();
        };

        drawChainSpan(118, breachL, true);
        drawChainSpan(breachR, w + 8, false);

        // 3D Cylindrical Steel Fence Posts with vertical rim shine
        const posts = [125, 225, 325, 422, 534, 645, 765];
        for (const px of posts) {
            const leanX = px === 422 ? 8 : (px === 534 ? -6 : 0);
            bctx.strokeStyle = "#141b24";
            bctx.lineWidth = 4.6;
            bctx.beginPath();
            bctx.moveTo(px, fenceBotY + 2);
            bctx.lineTo(px + leanX, fenceTopY - 12);
            bctx.stroke();
            bctx.strokeStyle = "rgba(165, 200, 225, 0.24)";
            bctx.lineWidth = 1.2;
            bctx.beginPath();
            bctx.moveTo(px + 1.2, fenceBotY + 2);
            bctx.lineTo(px + leanX + 1.2, fenceTopY - 12);
            bctx.stroke();
        }

        // Barbed wire coils above fence top
        bctx.strokeStyle = "rgba(18, 22, 28, 0.85)";
        bctx.lineWidth = 1.1;
        for (let bRow = 0; bRow < 2; bRow++) {
            const wy = fenceTopY - 9 + bRow * 5;
            bctx.beginPath();
            bctx.moveTo(120, wy); bctx.lineTo(breachL - 6, wy + 5);
            bctx.moveTo(breachR + 6, wy + 4); bctx.lineTo(w, wy);
            bctx.stroke();

            for (let bx = 135; bx < w; bx += 26) {
                if (bx > breachL - 8 && bx < breachR + 8) continue;
                bctx.beginPath();
                bctx.moveTo(bx - 3, wy - 3); bctx.lineTo(bx + 3, wy + 3);
                bctx.moveTo(bx + 3, wy - 3); bctx.lineTo(bx - 3, wy + 3);
                bctx.stroke();
            }
        }

        // Draped Tattered Torn Rag Tarp over broken fence corner
        bctx.save();
        bctx.fillStyle = "#59351e";
        bctx.strokeStyle = "#0b0e14";
        bctx.lineWidth = 1.4;
        bctx.beginPath();
        bctx.moveTo(392, fenceTopY - 2);
        bctx.quadraticCurveTo(418, fenceTopY - 14, 434, fenceTopY + 4);
        bctx.lineTo(440, fenceTopY + 52);
        bctx.lineTo(426, fenceTopY + 38);
        bctx.lineTo(417, fenceTopY + 56);
        bctx.lineTo(405, fenceTopY + 34);
        bctx.lineTo(394, fenceTopY + 46);
        bctx.closePath();
        bctx.fill();
        bctx.stroke();
        bctx.restore();

        // Circular "ROAD CLOSED" Sign on left fence
        bctx.save();
        bctx.translate(256, fenceTopY + 28);
        bctx.rotate(-0.08);
        bctx.fillStyle = "#7a141c";
        bctx.strokeStyle = "#cbd5e1";
        bctx.lineWidth = 1.8;
        bctx.beginPath();
        bctx.arc(0, 0, 14, 0, Math.PI * 2);
        bctx.fill();
        bctx.stroke();
        bctx.fillStyle = "#f1f5f9";
        bctx.fillRect(-9, -4, 18, 2.5);
        bctx.fillRect(-7, 1.5, 14, 2.5);
        bctx.restore();

        // Biohazard Caution Poster on right fence
        bctx.save();
        bctx.translate(706, fenceTopY + 30);
        bctx.rotate(0.09);
        bctx.fillStyle = "#c8ced6";
        bctx.strokeStyle = "#18202a";
        bctx.lineWidth = 1;
        bctx.fillRect(-8, -11, 16, 22);
        bctx.strokeRect(-8, -11, 16, 22);
        bctx.fillStyle = "#b91c1c";
        bctx.beginPath();
        bctx.arc(0, -3, 4.2, 0, Math.PI * 2);
        bctx.fill();
        bctx.fillStyle = "#1e293b";
        bctx.fillRect(-5, 4, 10, 2);
        bctx.restore();

        // Rusted red highway guardrail
        bctx.fillStyle = "#6e2920";
        bctx.fillRect(110, fenceBotY - 10, breachL - 105, 8);
        bctx.fillRect(breachR - 5, fenceBotY - 10, w - breachR + 10, 8);
        bctx.fillStyle = "rgba(255, 140, 80, 0.25)";
        bctx.fillRect(110, fenceBotY - 10, breachL - 105, 2);
        bctx.fillRect(breachR - 5, fenceBotY - 10, w - breachR + 10, 2);

        // 3D Extruded Concrete Jersey Barrier + Cast Ground Shadow (x = 595..665)
        bctx.save();
        bctx.fillStyle = "rgba(0, 0, 0, 0.45)";
        bctx.beginPath();
        bctx.ellipse(633, groundY + 4, 42, 6, 0, 0, Math.PI * 2);
        bctx.fill();

        // Right 3D perspective end face of concrete barrier
        bctx.fillStyle = "#242934";
        bctx.beginPath();
        bctx.moveTo(656, groundY - 26);
        bctx.lineTo(667, groundY - 22);
        bctx.lineTo(672, groundY + 2);
        bctx.lineTo(662, groundY);
        bctx.closePath();
        bctx.fill();
        bctx.strokeStyle = "#0b0e14";
        bctx.lineWidth = 1.2;
        bctx.stroke();

        // Front Jersey barrier face with 3D vertical bevel gradient
        const barGrad = bctx.createLinearGradient(0, groundY - 26, 0, groundY);
        barGrad.addColorStop(0, "#64748b");
        barGrad.addColorStop(0.22, "#475569");
        barGrad.addColorStop(1, "#2a303c");
        bctx.fillStyle = barGrad;
        bctx.beginPath();
        bctx.moveTo(598, groundY);
        bctx.lineTo(604, groundY - 26);
        bctx.lineTo(656, groundY - 26);
        bctx.lineTo(662, groundY);
        bctx.closePath();
        bctx.fill();
        bctx.stroke();

        // Hazard warning stripe band
        bctx.save();
        bctx.beginPath();
        bctx.rect(603, groundY - 22, 54, 8);
        bctx.clip();
        bctx.fillStyle = "#22262e";
        bctx.fillRect(603, groundY - 22, 54, 8);
        bctx.strokeStyle = "#ca8a04";
        bctx.lineWidth = 5;
        for (let sx = 598; sx < 666; sx += 14) {
            bctx.beginPath();
            bctx.moveTo(sx, groundY - 12);
            bctx.lineTo(sx + 8, groundY - 24);
            bctx.stroke();
        }
        bctx.restore();

        // 3D Abandoned Rubber Tire with extruded sidewall
        bctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        bctx.beginPath();
        bctx.ellipse(682, groundY + 3, 14, 4.5, 0, 0, Math.PI * 2);
        bctx.fill();
        bctx.fillStyle = "#0d1016";
        bctx.beginPath();
        bctx.ellipse(684, groundY - 10, 11, 14, -0.15, 0, Math.PI * 2);
        bctx.fill();
        bctx.fillStyle = "#1e232c";
        bctx.strokeStyle = "#06080c";
        bctx.lineWidth = 1.5;
        bctx.beginPath();
        bctx.ellipse(679, groundY - 11, 11, 14, -0.15, 0, Math.PI * 2);
        bctx.fill();
        bctx.stroke();
        bctx.fillStyle = "#3b4252";
        bctx.beginPath();
        bctx.ellipse(679, groundY - 11, 5, 7, -0.15, 0, Math.PI * 2);
        bctx.fill();
        bctx.restore();

        // Two Gothic Bent 3D Iron Streetlamp Posts
        for (const lx of [215, 565]) {
            // Base flange pedestal
            bctx.fillStyle = "#131922";
            bctx.fillRect(lx - 4, groundY - 10, 8, 8);

            bctx.strokeStyle = "#0a0e14";
            bctx.lineWidth = 4.5;
            bctx.beginPath();
            bctx.moveTo(lx, groundY - 4);
            bctx.lineTo(lx, 192);
            bctx.quadraticCurveTo(lx, 174, lx + 20, 178);
            bctx.stroke();

            // Cylindrical rim shine down pole
            bctx.strokeStyle = "rgba(180, 215, 235, 0.2)";
            bctx.lineWidth = 1.1;
            bctx.beginPath();
            bctx.moveTo(lx + 1.4, groundY - 10);
            bctx.lineTo(lx + 1.4, 192);
            bctx.stroke();

            bctx.fillStyle = "#161f2b";
            bctx.beginPath();
            bctx.moveTo(lx + 11, 182);
            bctx.lineTo(lx + 29, 182);
            bctx.lineTo(lx + 24, 175);
            bctx.lineTo(lx + 16, 175);
            bctx.closePath();
            bctx.fill();
        }

        // 10. 2.5D PERSPECTIVE CRACKED WET ASPHALT COMBAT ROAD (groundY = 312 to 480)
        const roadGrad = bctx.createLinearGradient(0, groundY, 0, h);
        roadGrad.addColorStop(0, theme.roadTop);
        roadGrad.addColorStop(0.45, theme.roadMid);
        roadGrad.addColorStop(1, theme.roadBottom);
        bctx.fillStyle = roadGrad;
        bctx.fillRect(0, groundY, w, h - groundY);

        // Soft moon/sunset sheen band reflected down the wet asphalt lane
        const laneSheen = bctx.createRadialGradient(w * 0.62, groundY + 62, 10, w * 0.62, groundY + 62, w * 0.48);
        laneSheen.addColorStop(0, theme.horizonSheen);
        laneSheen.addColorStop(1, "rgba(0, 0, 0, 0)");
        bctx.fillStyle = laneSheen;
        bctx.fillRect(0, groundY, w, h - groundY);

        // 3D Concrete Sidewalk Curb Lip along groundY (Lit top face + vertical shadow drop)
        bctx.fillStyle = "#2d3748";
        bctx.fillRect(0, groundY - 2, w, 4.5);
        bctx.fillStyle = "rgba(220, 238, 255, 0.22)";
        bctx.fillRect(0, groundY - 2, w, 1.5);
        bctx.fillStyle = "rgba(0, 0, 0, 0.65)";
        bctx.fillRect(0, groundY + 2.5, w, 4);

        // Diagonal Chain-Link Fence Shadow falling onto road shoulder
        bctx.save();
        bctx.beginPath();
        bctx.rect(120, groundY + 3, w - 120, 36);
        bctx.clip();
        bctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
        bctx.lineWidth = 1.2;
        for (let sx = 90; sx < w + 40; sx += 14) {
            if (sx > breachL - 25 && sx < breachR - 10) continue;
            bctx.beginPath();
            bctx.moveTo(sx, groundY + 3); bctx.lineTo(sx + 38, groundY + 36);
            bctx.moveTo(sx + 48, groundY + 3); bctx.lineTo(sx + 10, groundY + 36);
            bctx.stroke();
        }
        bctx.restore();

        // Faded White Highway Shoulder Line (far curb) + Perspective Center Dashed Stripes (nearer foreground)
        bctx.fillStyle = "rgba(195, 200, 210, 0.14)";
        bctx.fillRect(115, groundY + 24, w - 115, 2.5);

        // 2.5D Trapezoidal Broken Highway Divider Stripes (angled slightly forward toward right-foreground!)
        bctx.fillStyle = "rgba(210, 215, 225, 0.26)";
        for (let dx = 148; dx < w - 20; dx += 90) {
            bctx.beginPath();
            bctx.moveTo(dx + 3, groundY + 84);
            bctx.lineTo(dx + 55, groundY + 84);
            bctx.lineTo(dx + 59, groundY + 91);
            bctx.lineTo(dx, groundY + 91);
            bctx.closePath();
            bctx.fill();
            // Weathered asphalt chip
            bctx.fillStyle = theme.roadMid;
            bctx.fillRect(dx + 19, groundY + 84, 5, 7.5);
            bctx.fillStyle = "rgba(210, 215, 225, 0.26)";
        }

        // Branching asphalt cracks across combat lane
        bctx.strokeStyle = "rgba(2, 4, 8, 0.68)";
        bctx.lineWidth = 1.5;
        const cracks = [
            [[210, groundY + 25], [242, groundY + 46], [268, groundY + 42], [295, groundY + 68]],
            [[360, groundY + 8], [385, groundY + 38], [372, groundY + 64]],
            [[485, groundY + 18], [462, groundY + 55], [492, groundY + 88], [520, groundY + 115]],
            [[630, groundY + 34], [668, groundY + 52], [652, groundY + 82]],
            [[745, groundY + 16], [718, groundY + 54], [755, groundY + 95]]
        ];
        for (const cr of cracks) {
            bctx.beginPath();
            bctx.moveTo(cr[0][0], cr[0][1]);
            for (let i = 1; i < cr.length; i++) bctx.lineTo(cr[i][0], cr[i][1]);
            bctx.stroke();
        }

        // Glossy Reflective Rain Puddles (with faint inner sky/moon reflection & rim specular)
        const puddles = [
            { x: 315, y: groundY + 62, rx: 46, ry: 11 },
            { x: 545, y: groundY + 48, rx: 58, ry: 12 },
            { x: 710, y: groundY + 92, rx: 42, ry: 10 }
        ];
        for (const p of puddles) {
            const pGrad = bctx.createRadialGradient(p.x - 10, p.y - 2, 4, p.x, p.y, p.rx);
            pGrad.addColorStop(0, "rgba(12, 24, 38, 0.85)");
            pGrad.addColorStop(0.65, "rgba(4, 10, 18, 0.8)");
            pGrad.addColorStop(1, "rgba(2, 5, 10, 0.72)");
            bctx.fillStyle = pGrad;
            bctx.beginPath();
            bctx.ellipse(p.x, p.y, p.rx, p.ry, 0.04, 0, Math.PI * 2);
            bctx.fill();
            bctx.strokeStyle = "rgba(165, 215, 240, 0.22)";
            bctx.lineWidth = 1.1;
            bctx.stroke();
        }

        // Scattered 3D-shaded pebbles/rubble & dry dead grass tufts
        for (let r = 0; r < 42; r++) {
            const rx = 140 + ((r * 137) % (w - 150));
            const ry = groundY + 8 + ((r * 59) % (h - groundY - 20));
            const rw = 3 + (r % 5);
            bctx.fillStyle = r % 3 === 0 ? "#383e48" : "#12151c";
            bctx.beginPath();
            bctx.ellipse(rx, ry, rw, rw * 0.55, r * 0.4, 0, Math.PI * 2);
            bctx.fill();
        }

        bctx.strokeStyle = theme.key === "toxic_woods" ? "#263d1e" : "#3a3122";
        bctx.lineWidth = 1.4;
        for (let t = 0; t < 26; t++) {
            const gx = 120 + ((t * 73) % (w - 130));
            const gy = t % 2 === 0 ? groundY + 4 : h - 6;
            bctx.beginPath();
            bctx.moveTo(gx, gy); bctx.lineTo(gx - 4, gy - 10);
            bctx.moveTo(gx, gy); bctx.lineTo(gx + 1, gy - 13);
            bctx.moveTo(gx, gy); bctx.lineTo(gx + 5, gy - 9);
            bctx.stroke();
        }

        this.bgCacheCanvas = cvs;
        this.bgCacheKey = cacheKey;
    }

    drawHorrorAtmosphereOverlay(ctx, w, h, time, theme) {
        const groundY = Math.round(h * 0.65);

        // 0. Subtle Diagonal Anime Volumetric Moonlight Shafts from upper right
        ctx.save();
        for (let ray = 0; ray < 2; ray++) {
            const rx = w * (0.64 + ray * 0.16) + Math.sin(time * 0.35 + ray) * 14;
            const rayGrad = ctx.createLinearGradient(rx, 0, rx - 180, groundY + 40);
            rayGrad.addColorStop(0, `rgba(${theme.mistRgb}, 0.065)`);
            rayGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
            ctx.fillStyle = rayGrad;
            ctx.beginPath();
            ctx.moveTo(rx - 18, 0);
            ctx.lineTo(rx + 28, 0);
            ctx.lineTo(rx - 150, groundY + 45);
            ctx.lineTo(rx - 220, groundY + 45);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();

        // 1. Silhouetted Flapping Bats drifting past the giant Moon
        ctx.save();
        ctx.fillStyle = theme.woodColor;
        for (let b = 0; b < 4; b++) {
            const bx = ((w + 80) - ((time * (18 + b * 6) + b * 195) % (w + 160)));
            const by = 62 + b * 24 + Math.sin(time * 2.2 + b) * 8;
            const flap = Math.sin(time * 10 + b * 2.1) * 5;
            const bSize = 6 + (b % 2) * 2;
            ctx.beginPath();
            ctx.moveTo(bx, by);
            ctx.quadraticCurveTo(bx - bSize * 0.7, by - 4 - flap, bx - bSize * 1.4, by + flap * 0.4);
            ctx.quadraticCurveTo(bx - bSize * 0.5, by + 2, bx, by + 2);
            ctx.quadraticCurveTo(bx + bSize * 0.5, by + 2, bx + bSize * 1.4, by + flap * 0.4);
            ctx.quadraticCurveTo(bx + bSize * 0.7, by - 4 - flap, bx, by);
            ctx.fill();
        }
        ctx.restore();

        // 2. Blinking Glowing Crimson Monster Eyes in dark forest shadows
        const eyeSpots = [
            { x: 146, y: groundY - 68, phase: 0.2 },
            { x: 508, y: groundY - 82, phase: 2.4 },
            { x: 786, y: groundY - 72, phase: 4.1 }
        ];
        for (const es of eyeSpots) {
            const pulse = Math.sin(time * 1.4 + es.phase);
            if (pulse > 0.2) {
                const alpha = Math.min(0.85, (pulse - 0.2) * 1.1);
                ctx.fillStyle = `rgba(255, 38, 68, ${alpha})`;
                ctx.fillRect(es.x - 3, es.y, 2, 2);
                ctx.fillRect(es.x + 2, es.y, 2, 2);
            }
        }

        // 3. Creeping Graveyard Ground Mist drifting left toward Barricade
        for (let m = 0; m < 4; m++) {
            const mx = ((w + 240) - ((time * (11 + m * 4) + m * 230) % (w + 320)));
            const my = groundY - 8 + (m % 2) * 18;
            const mistR = 135 + m * 22;
            const mGrad = ctx.createRadialGradient(mx, my, 8, mx, my, mistR);
            mGrad.addColorStop(0, `rgba(${theme.mistRgb}, 0.17)`);
            mGrad.addColorStop(0.55, `rgba(${theme.mistRgb}, 0.065)`);
            mGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
            ctx.fillStyle = mGrad;
            ctx.beginPath();
            ctx.ellipse(mx, my, mistR, 28 + m * 4, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // 4. Flickering Warm Amber Streetlamp Light Cones, Floating Dust Motes & Pool Glare
        const lamps = [
            { x: 235, y: 182, seed: 1.1 },
            { x: 585, y: 182, seed: 3.7 }
        ];
        for (const lp of lamps) {
            const buzz = Math.sin(time * 28 + lp.seed) * Math.sin(time * 4.3 + lp.seed);
            const flicker = buzz > 0.78 ? 0.42 : (0.86 + 0.12 * Math.sin(time * 3.1 + lp.seed));

            // Glowing bulb head + outer bloom
            ctx.fillStyle = `rgba(${theme.lampRgb}, ${0.9 * flicker})`;
            ctx.beginPath();
            ctx.arc(lp.x, lp.y + 1, 4.4, 0, Math.PI * 2);
            ctx.fill();

            // Volumetric triangular streetlamp cone lighting the zombies below
            const coneTopY = lp.y + 3;
            const coneBotY = groundY + 62;
            const coneGrad = ctx.createLinearGradient(lp.x, coneTopY, lp.x, coneBotY);
            coneGrad.addColorStop(0, `rgba(${theme.lampRgb}, ${0.28 * flicker})`);
            coneGrad.addColorStop(0.62, `rgba(${theme.lampRgb}, ${0.10 * flicker})`);
            coneGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
            ctx.fillStyle = coneGrad;
            ctx.beginPath();
            ctx.moveTo(lp.x - 5, coneTopY);
            ctx.lineTo(lp.x + 5, coneTopY);
            ctx.lineTo(lp.x + 70, coneBotY);
            ctx.lineTo(lp.x - 70, coneBotY);
            ctx.closePath();
            ctx.fill();

            // Illuminated golden dust motes floating inside streetlamp cone
            for (let dm = 0; dm < 5; dm++) {
                const frac = ((time * 0.22 + dm * 0.2 + lp.seed) % 1);
                const dy = coneTopY + frac * (coneBotY - coneTopY - 20);
                const dx = lp.x + Math.sin(time * 1.9 + dm * 2.1 + lp.seed) * (10 + frac * 34);
                ctx.fillStyle = `rgba(255, 240, 185, ${(1 - frac) * 0.48 * flicker})`;
                ctx.fillRect(dx, dy, 1.8, 1.8);
            }

            // Soft road puddle halo beneath lamp cone
            const poolGrad = ctx.createRadialGradient(lp.x, coneBotY - 12, 6, lp.x, coneBotY - 12, 64);
            poolGrad.addColorStop(0, `rgba(${theme.lampRgb}, ${0.16 * flicker})`);
            poolGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
            ctx.fillStyle = poolGrad;
            ctx.beginPath();
            ctx.ellipse(lp.x, coneBotY - 12, 64, 16, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // 5. Wet Puddle Moonlight Shimmer Glints
        ctx.strokeStyle = `rgba(${theme.mistRgb}, 0.28)`;
        ctx.lineWidth = 1.3;
        const glints = [315, 545, 710];
        glints.forEach((gx, idx) => {
            const gy = groundY + (idx === 1 ? 48 : idx === 2 ? 92 : 62);
            const shift = Math.sin(time * 2.5 + idx) * 6;
            ctx.beginPath();
            ctx.moveTo(gx - 14 + shift, gy);
            ctx.lineTo(gx + 10 + shift, gy);
            ctx.stroke();
        });

        // 6. Floating Haunted Ash / Bokeh Ember Specks
        for (let e = 0; e < 18; e++) {
            const ex = (e * 61 + time * 14 + Math.sin(time + e) * 12) % w;
            const ey = groundY + 120 - ((e * 47 + time * 32) % (h * 0.72));
            const esize = 1.4 + (e % 2.5);
            const ealpha = 0.2 + 0.48 * Math.abs(Math.sin(time * 2 + e));
            const eG = ctx.createRadialGradient(ex, ey, 0, ex, ey, esize * 2.2);
            eG.addColorStop(0, `rgba(255, 255, 255, ${ealpha})`);
            eG.addColorStop(0.45, `rgba(${theme.emberRgb}, ${ealpha})`);
            eG.addColorStop(1, "rgba(0, 0, 0, 0)");
            ctx.fillStyle = eG;
            ctx.beginPath();
            ctx.arc(ex, ey, esize * 2.2, 0, Math.PI * 2);
            ctx.fill();
        }

        // 7. Anime Slow-Mo Time Dilation Speed Lines & High-Streak Energy Border
        if (this.powerups && this.powerups.slowmo && this.powerups.slowmo.active) {
            ctx.save();
            ctx.fillStyle = "rgba(0, 210, 255, 0.07)";
            ctx.fillRect(0, 0, w, h);
            ctx.strokeStyle = "rgba(0, 229, 255, 0.28)";
            ctx.lineWidth = 1.4;
            for (let sl = 0; sl < 22; sl++) {
                const ang = (sl / 22) * Math.PI * 2 + Math.sin(time * 6 + sl) * 0.04;
                const rInner = Math.min(w, h) * (0.42 + 0.05 * Math.sin(time * 18 + sl));
                const rOuter = Math.max(w, h) * 0.78;
                ctx.beginPath();
                ctx.moveTo(w * 0.5 + Math.cos(ang) * rInner, h * 0.5 + Math.sin(ang) * rInner * 0.65);
                ctx.lineTo(w * 0.5 + Math.cos(ang) * rOuter, h * 0.5 + Math.sin(ang) * rOuter * 0.65);
                ctx.stroke();
            }
            ctx.restore();
        } else if (this.streak >= 5) {
            ctx.save();
            const feverG = ctx.createRadialGradient(w * 0.5, h * 0.5, w * 0.35, w * 0.5, h * 0.5, w * 0.65);
            feverG.addColorStop(0, "rgba(0, 0, 0, 0)");
            feverG.addColorStop(1, "rgba(255, 200, 0, 0.08)");
            ctx.fillStyle = feverG;
            ctx.fillRect(0, 0, w, h);
            ctx.restore();
        }

        // 8. Moody Horror Edge Vignette
        const vig = ctx.createRadialGradient(w * 0.52, h * 0.52, w * 0.25, w * 0.52, h * 0.52, w * 0.68);
        vig.addColorStop(0, "rgba(0, 0, 0, 0)");
        vig.addColorStop(1, "rgba(2, 4, 8, 0.52)");
        ctx.fillStyle = vig;
        ctx.fillRect(0, 0, w, h);
    }

    drawBarricade(ctx, h) {
        const barX = 120;
        const barY = h * 0.45;
        const barH = h * 0.35;
        const tNow = Date.now() * 0.001;

        // Bunker Cast Contact Shadow on wet asphalt
        ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
        ctx.beginPath();
        ctx.ellipse(barX - 10, barY + barH + 2, 48, 9, 0, 0, Math.PI * 2);
        ctx.fill();

        // 1. 3D Volumetric Weathered Sandbags stacked firmly around turret base
        const bags = [
            { x: barX - 38, y: barY + barH - 12, w: 28, h: 11 },
            { x: barX - 14, y: barY + barH - 12, w: 30, h: 11 },
            { x: barX - 33, y: barY + barH - 22, w: 26, h: 11 },
            { x: barX - 10, y: barY + barH - 22, w: 24, h: 11 }
        ];
        for (const bag of bags) {
            const bx = bag.x + bag.w * 0.5;
            const by = bag.y + bag.h * 0.5;
            const rx = bag.w * 0.52;
            const ry = bag.h * 0.52;
            const bagGrad = ctx.createRadialGradient(bx - rx * 0.25, by - ry * 0.35, 1, bx, by, rx);
            bagGrad.addColorStop(0, "#756854");
            bagGrad.addColorStop(0.55, "#4d4335");
            bagGrad.addColorStop(1, "#262018");
            ctx.fillStyle = bagGrad;
            ctx.strokeStyle = "#080b10";
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.ellipse(bx, by, rx, ry, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Sandbag top highlight & tie seam crease
            ctx.strokeStyle = "rgba(255, 240, 210, 0.16)";
            ctx.lineWidth = 0.9;
            ctx.beginPath();
            ctx.arc(bx, by, rx * 0.72, -Math.PI * 0.85, -Math.PI * 0.15);
            ctx.stroke();
        }

        // 2. 3D Beveled Armored Steel Bunker Bulkhead (Slanted Top Glacis + Shadowed Side Flank)
        // Right 3D angled side armor bevel (faces enemy horde)
        const flankGrad = ctx.createLinearGradient(barX + 2, barY, barX + 12, barY + barH);
        flankGrad.addColorStop(0, "#1c2838");
        flankGrad.addColorStop(1, "#090f18");
        ctx.fillStyle = flankGrad;
        ctx.beginPath();
        ctx.moveTo(barX + 4, barY - 6);
        ctx.lineTo(barX + 12, barY + 2);
        ctx.lineTo(barX + 12, barY + barH - 4);
        ctx.lineTo(barX + 4, barY + barH - 8);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "rgba(0, 229, 255, 0.38)";
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Top slanted armor cap bevel
        ctx.fillStyle = "#2b3b52";
        ctx.beginPath();
        ctx.moveTo(barX - 28, barY);
        ctx.lineTo(barX - 20, barY - 6);
        ctx.lineTo(barX + 4, barY - 6);
        ctx.lineTo(barX + 4, barY);
        ctx.closePath();
        ctx.fill();

        // Front Armored Steel Plate with 3D metallic vertical sheen
        const bunkGrad = ctx.createLinearGradient(barX - 28, barY, barX + 4, barY + barH);
        bunkGrad.addColorStop(0, "#1d293b");
        bunkGrad.addColorStop(0.45, "#111824");
        bunkGrad.addColorStop(1, "#090e16");
        ctx.fillStyle = bunkGrad;
        ctx.fillRect(barX - 28, barY, 32, barH - 8);

        // Hazard Warning Stripes on defense wall
        ctx.save();
        ctx.beginPath();
        ctx.rect(barX - 28, barY, 32, barH - 8);
        ctx.clip();
        ctx.strokeStyle = "rgba(255, 214, 0, 0.28)";
        ctx.lineWidth = 6;
        for (let sy = barY - 30; sy < barY + barH + 30; sy += 18) {
            ctx.beginPath();
            ctx.moveTo(barX - 35, sy);
            ctx.lineTo(barX + 15, sy - 20);
            ctx.stroke();
        }
        ctx.restore();

        // Neon Armored Frame + 3D Domed Steel Rivets
        ctx.strokeStyle = "#00e5ff";
        ctx.lineWidth = 1.8;
        ctx.strokeRect(barX - 28, barY, 32, barH - 8);

        for (let ry = barY + 10; ry < barY + barH - 16; ry += 28) {
            for (const rx of [barX - 23, barX - 1]) {
                ctx.fillStyle = "#334155";
                ctx.beginPath();
                ctx.arc(rx, ry, 2.0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#cbd5e1";
                ctx.beginPath();
                ctx.arc(rx - 0.5, ry - 0.5, 0.8, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Glowing Plasma Coolant Conduit Line
        ctx.strokeStyle = "rgba(0, 229, 255, 0.8)";
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(barX - 12, barY);
        ctx.lineTo(barX - 12, barY + barH - 12);
        ctx.stroke();

        // Turret Mounting Base & Ammo Box
        const turretY = barY + barH * 0.35;
        const primaryTarget = this.getPrimaryTarget();
        const geo = this.getGunGeometry(h, primaryTarget);
        const evalGun = primaryTarget
            ? StressMechanics.evaluateAttack(primaryTarget, this.hud.dialAngle)
            : { isDeflected: true, optimalAngle: 0 };
        const isGunArmed = !!primaryTarget && !evalGun.isDeflected;
        const lockJitterX = this.lockShakeTimer > 0 ? Math.sin(this.lockShakeTimer * 2.5) * 2.2 : 0;
        const lockJitterY = this.lockShakeTimer > 0 ? Math.cos(this.lockShakeTimer * 3.1) * 1.4 : 0;

        // 3D Machined Pintle Support Pedestal
        const pedGrad = ctx.createLinearGradient(barX - 10, turretY, barX + 10, turretY);
        pedGrad.addColorStop(0, "#0f172a");
        pedGrad.addColorStop(0.55, "#334155");
        pedGrad.addColorStop(1, "#1e293b");
        ctx.fillStyle = pedGrad;
        ctx.strokeStyle = "#64748b";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(barX - 10, turretY + 22);
        ctx.lineTo(barX - 4, turretY);
        ctx.lineTo(barX + 6, turretY);
        ctx.lineTo(barX + 10, turretY + 22);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 3D Olive-Drab Ammo Crate + Brass Cartridge Feed Belt
        ctx.fillStyle = "#2b3820";
        ctx.fillRect(barX - 6, turretY + 11, 5, 20); // 3D side return
        ctx.fillStyle = "#3f522d";
        ctx.strokeStyle = "#0b1116";
        ctx.lineWidth = 1.5;
        ctx.fillRect(barX - 28, turretY + 13, 22, 18);
        ctx.strokeRect(barX - 28, turretY + 13, 22, 18);
        ctx.fillStyle = "#627d46";
        ctx.fillRect(barX - 28, turretY + 13, 22, 4);
        ctx.fillStyle = "#fde047";
        ctx.font = "bold 7px 'Consolas', monospace";
        ctx.textAlign = "center";
        ctx.fillText("7.62", barX - 17, turretY + 27);

        // Hanging gleaming brass ammo belt curving into receiver
        const beltShake = this.gunRecoil * 0.25;
        ctx.beginPath();
        ctx.moveTo(barX - 10, turretY + 16);
        ctx.quadraticCurveTo(barX + 1, turretY + 18 + beltShake, barX + 3, turretY + 5);
        ctx.strokeStyle = "#1e293b";
        ctx.lineWidth = 4.4;
        ctx.stroke();
        ctx.setLineDash([2.5, 2.5]);
        ctx.strokeStyle = "#facc15";
        ctx.lineWidth = 2.6;
        ctx.stroke();
        ctx.setLineDash([]);

        // 3. 3D Sculpted Heavy Machine Gun Barrel & Receiver (tracks zombie, recoils smoothly)
        ctx.save();
        ctx.translate(barX, turretY);
        ctx.rotate(geo.aimRad);
        ctx.translate(-this.gunRecoil, 0);

        // 3D Cylindrical Receiver Housing
        const recGrad = ctx.createLinearGradient(0, -9, 0, 9);
        recGrad.addColorStop(0, "#475569");
        recGrad.addColorStop(0.28, "#263344");
        recGrad.addColorStop(0.75, "#151d29");
        recGrad.addColorStop(1, "#0b1017");
        ctx.fillStyle = recGrad;
        ctx.strokeStyle = "#06090f";
        ctx.lineWidth = 1.6;
        ctx.fillRect(-15, -8, 31, 16);
        ctx.strokeRect(-15, -8, 31, 16);

        // Specular machined steel top Picatinny rail + ejection port
        ctx.fillStyle = "#94a3b8";
        ctx.fillRect(-12, -10, 24, 2.5);
        ctx.fillStyle = "#080b10";
        ctx.fillRect(1, -6.5, 9, 4);

        // Glowing Armed/Locked LED jewel
        ctx.fillStyle = isGunArmed ? "#00e676" : "#ff1744";
        ctx.shadowColor = isGunArmed ? "#00e676" : "#ff1744";
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(10, 1, 2.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // 3D Shaded Cylindrical Perforated Cooling Shroud
        const shrGrad = ctx.createLinearGradient(0, -6, 0, 6);
        shrGrad.addColorStop(0, "#64748b");
        shrGrad.addColorStop(0.32, "#334155");
        shrGrad.addColorStop(1, "#0f172a");
        ctx.fillStyle = shrGrad;
        ctx.strokeStyle = "#090e18";
        ctx.lineWidth = 1.4;
        ctx.fillRect(16, -5.5, 32, 11);
        ctx.strokeRect(16, -5.5, 32, 11);

        // Cooling vent slots (glow faintly amber hot during active firing flash)
        const ventHeat = this.muzzleFlash > 0.15;
        ctx.fillStyle = ventHeat ? `rgba(255, 115, 25, ${Math.min(0.9, this.muzzleFlash)})` : "#070a0f";
        for (let vx = 19; vx <= 42; vx += 6) {
            ctx.fillRect(vx, -2.5, 3.2, 5);
        }

        // Cylindrical 3D Exposed Rifled Barrel + Slotted Muzzle Brake
        const brlGrad = ctx.createLinearGradient(0, -2.5, 0, 2.5);
        brlGrad.addColorStop(0, "#cbd5e1");
        brlGrad.addColorStop(0.5, "#64748b");
        brlGrad.addColorStop(1, "#1e293b");
        ctx.fillStyle = brlGrad;
        ctx.fillRect(48, -2.4, 13, 4.8);
        ctx.fillStyle = "#1e293b";
        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 1;
        ctx.fillRect(59, -4, 8, 8);
        ctx.strokeRect(59, -4, 8, 8);
        ctx.restore();

        // 4. 3D MACHINED TITANIUM BREECH CRANK WHEEL (synced to dialAngle & Mohr's Circle)
        const handleX = barX - 8 + lockJitterX;
        const handleY = turretY + 1 + lockJitterY;
        const handleR = 17;
        const handleRad = StressMechanics.degToRad(this.hud.dialAngle);
        const statusColor = !primaryTarget ? "#64748b" : (isGunArmed ? "#00e676" : "#ff1744");

        ctx.save();
        // Metallic outer beveled housing ring
        const wheelGrad = ctx.createRadialGradient(handleX - 4, handleY - 4, 2, handleX, handleY, handleR);
        wheelGrad.addColorStop(0, "#1c2738");
        wheelGrad.addColorStop(0.78, "#0b111a");
        wheelGrad.addColorStop(1, "#334155");
        ctx.beginPath();
        ctx.arc(handleX, handleY, handleR, 0, Math.PI * 2);
        ctx.fillStyle = wheelGrad;
        ctx.fill();
        ctx.strokeStyle = statusColor;
        ctx.lineWidth = 2.4;
        if (isGunArmed) {
            ctx.shadowColor = "#00e676";
            ctx.shadowBlur = 12;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Draw optimal Mohr target zone directly on gun handle bezel whenever zombie is visible
        if (primaryTarget) {
            const optRad = StressMechanics.degToRad(evalGun.optimalAngle);
            ctx.beginPath();
            ctx.moveTo(handleX - handleR * Math.cos(optRad), handleY + handleR * Math.sin(optRad));
            ctx.lineTo(handleX + handleR * Math.cos(optRad), handleY - handleR * Math.sin(optRad));
            ctx.strokeStyle = "rgba(0, 230, 118, 0.7)";
            ctx.lineWidth = 2;
            ctx.setLineDash([3, 3]);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Physical rotating 3D titanium handling crank bar + spherical glossy trigger knob
        ctx.translate(handleX, handleY);
        ctx.rotate(-handleRad);
        const crankGrad = ctx.createLinearGradient(0, -3.5, 0, 3.5);
        crankGrad.addColorStop(0, "#64748b");
        crankGrad.addColorStop(0.5, "#334155");
        crankGrad.addColorStop(1, "#0f172a");
        ctx.fillStyle = crankGrad;
        ctx.strokeStyle = statusColor;
        ctx.lineWidth = 1.5;
        ctx.fillRect(-handleR + 3, -3, handleR * 2 - 4, 6);
        ctx.strokeRect(-handleR + 3, -3, handleR * 2 - 4, 6);

        ctx.fillStyle = statusColor;
        ctx.beginPath();
        ctx.moveTo(handleR + 5.5, 0);
        ctx.lineTo(handleR - 3, -5);
        ctx.lineTo(handleR - 3, 5);
        ctx.closePath();
        ctx.fill();

        // Spherical shaded grip knob with white specular glint
        const knobGrad = ctx.createRadialGradient(handleR - 3.5, -1.5, 0.5, handleR - 2, 0, 5.2);
        knobGrad.addColorStop(0, "#ffffff");
        knobGrad.addColorStop(0.35, isGunArmed ? "#00e676" : "#fbbf24");
        knobGrad.addColorStop(1, isGunArmed ? "#045b2f" : "#92400e");
        ctx.beginPath();
        ctx.arc(handleR - 2, 0, 5.0, 0, Math.PI * 2);
        ctx.fillStyle = knobGrad;
        ctx.fill();
        ctx.strokeStyle = "#090d14";
        ctx.lineWidth = 1.3;
        ctx.stroke();
        ctx.restore();

        // 5. Chamfered Gun Safety Lock Status Badge right above turret
        ctx.save();
        ctx.font = "bold 9px 'Consolas', 'Courier New', monospace";
        ctx.textAlign = "center";
        traceChamferBox(ctx, barX - 31, turretY - 35, 62, 15, 3);
        if (primaryTarget) {
            ctx.fillStyle = isGunArmed ? "rgba(0, 42, 24, 0.94)" : "rgba(44, 10, 14, 0.94)";
            ctx.fill();
            ctx.strokeStyle = isGunArmed ? "#00e676" : "#ff1744";
            ctx.lineWidth = 1.2;
            ctx.stroke();
            ctx.fillStyle = isGunArmed ? "#00e676" : "#ff6b6b";
            ctx.fillText(isGunArmed ? "ARMED" : "LOCKED", barX, turretY - 24.5);
        } else {
            ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
            ctx.fill();
            ctx.strokeStyle = "#64748b";
            ctx.lineWidth = 1.1;
            ctx.stroke();
            ctx.fillStyle = "#94a3b8";
            ctx.fillText("WAIT", barX, turretY - 24.5);
        }
        ctx.restore();

        // 6. 3D Cylindrical Glass SHIELD Integrity Reactor Column (x = 18)
        const hpRatio = Math.max(0, this.baseHealth / this.maxBaseHealth);
        const tubeX = 18;
        const tubeW = 14;
        ctx.fillStyle = "rgba(3, 8, 16, 0.9)";
        ctx.fillRect(tubeX, barY, tubeW, barH);

        if (hpRatio > 0) {
            const fillH = barH * hpRatio;
            const fillY = barY + barH - fillH;
            const fluidGrad = ctx.createLinearGradient(tubeX, fillY, tubeX + tubeW, fillY);
            if (hpRatio > 0.4) {
                fluidGrad.addColorStop(0, "#059669");
                fluidGrad.addColorStop(0.45, "#00e676");
                fluidGrad.addColorStop(1, "#047857");
            } else {
                fluidGrad.addColorStop(0, "#991b1b");
                fluidGrad.addColorStop(0.45, "#ff1744");
                fluidGrad.addColorStop(1, "#7f1d1d");
            }
            ctx.fillStyle = fluidGrad;
            ctx.fillRect(tubeX + 1, fillY, tubeW - 2, fillH);

            // Rising reactor plasma micro-bubbles
            ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
            for (let b = 0; b < 3; b++) {
                const bFrac = ((tNow * 0.45 + b * 0.33) % 1);
                const by = fillY + fillH * (1 - bFrac);
                const bx = tubeX + 4 + Math.sin(tNow * 4 + b * 2) * 3;
                if (by > fillY + 2 && by < barY + barH - 2) {
                    ctx.beginPath();
                    ctx.arc(bx, by, 1.3, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        // Glass specular vertical shine + titanium top/bottom caps
        ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
        ctx.fillRect(tubeX + 2.5, barY + 2, 2.5, barH - 4);
        ctx.strokeStyle = "rgba(0, 229, 255, 0.7)";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(tubeX, barY, tubeW, barH);
        ctx.fillStyle = "#334155";
        ctx.fillRect(tubeX - 2, barY - 3, tubeW + 4, 4);
        ctx.fillRect(tubeX - 2, barY + barH - 1, tubeW + 4, 4);

        ctx.font = "bold 9px 'Consolas', 'Courier New', monospace";
        ctx.fillStyle = "#00e5ff";
        ctx.fillText("SHIELD", 10, barY - 8);
    }

    /**
     * Live 3D Anime Targeting Reticle & Mohr's Circle Lock Guide (No Laser Beam!)
     */
    drawAimGuideReticle(ctx, target, w, h) {
        ctx.save();
        const tNow = Date.now() * 0.001;
        const currAngle = this.hud.dialAngle;
        const evalRes = StressMechanics.evaluateAttack(target, currAngle);
        const optimalAngle = evalRes.optimalAngle;
        let angleDiff = optimalAngle - currAngle;
        if (angleDiff > 90) angleDiff -= 180;
        if (angleDiff < -90) angleDiff += 180;
        const isAligned = !evalRes.isDeflected;
        const handleRad = StressMechanics.degToRad(currAngle);

        const zX = target.x;
        const zY = target.y - target.height * 0.12;
        const reticleR = isAligned ? 32 : 35;

        // Translucent target hologram fill glow when ARMED
        if (isAligned) {
            const lockFill = ctx.createRadialGradient(zX, zY, 4, zX, zY, reticleR);
            lockFill.addColorStop(0, "rgba(0, 230, 118, 0.16)");
            lockFill.addColorStop(1, "rgba(0, 230, 118, 0.02)");
            ctx.fillStyle = lockFill;
            ctx.beginPath();
            ctx.arc(zX, zY, reticleR, 0, Math.PI * 2);
            ctx.fill();
        }

        // Green dashed target Mohr failure plane line
        const optRad = StressMechanics.degToRad(optimalAngle);
        ctx.beginPath();
        ctx.moveTo(zX - reticleR * Math.cos(optRad), zY + reticleR * Math.sin(optRad));
        ctx.lineTo(zX + reticleR * Math.cos(optRad), zY - reticleR * Math.sin(optRad));
        ctx.strokeStyle = "#00e676";
        ctx.lineWidth = 2.4;
        ctx.setLineDash([4, 3]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Active gun handle angle line inside reticle (red = locked, green = armed!)
        ctx.beginPath();
        ctx.moveTo(zX - reticleR * Math.cos(handleRad), zY + reticleR * Math.sin(handleRad));
        ctx.lineTo(zX + reticleR * Math.cos(handleRad), zY - reticleR * Math.sin(handleRad));
        ctx.strokeStyle = isAligned ? "#00e676" : "#ff1744";
        ctx.lineWidth = isAligned ? 3.2 : 2.1;
        if (isAligned) {
            ctx.shadowColor = "#00e676";
            ctx.shadowBlur = 12;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Inner reticle ring
        ctx.beginPath();
        ctx.arc(zX, zY, reticleR, 0, Math.PI * 2);
        ctx.strokeStyle = isAligned ? "rgba(0, 230, 118, 0.85)" : "rgba(255, 255, 255, 0.28)";
        ctx.lineWidth = isAligned ? 1.8 : 1.1;
        ctx.stroke();

        // Spinning 4-quadrant anime lock brackets around reticle
        const rotSpin = tNow * (isAligned ? 2.6 : 0.7);
        const brR = reticleR + (isAligned ? 5 : 8);
        ctx.strokeStyle = isAligned ? "#00ff88" : "rgba(0, 229, 255, 0.55)";
        ctx.lineWidth = isAligned ? 2.4 : 1.5;
        for (let q = 0; q < 4; q++) {
            const aStart = rotSpin + q * (Math.PI * 0.5) - 0.28;
            ctx.beginPath();
            ctx.arc(zX, zY, brR, aStart, aStart + 0.56);
            ctx.stroke();
        }

        // Sleek Chamfered Top Status Banner
        ctx.font = "bold 11px 'Courier New', monospace";
        ctx.textAlign = "center";

        const boxW = 356;
        const boxH = 25;
        const boxX = w / 2 - boxW / 2;
        const boxY = 8;
        traceChamferBox(ctx, boxX, boxY, boxW, boxH, 6);
        ctx.fillStyle = isAligned ? "rgba(5, 22, 16, 0.92)" : "rgba(7, 13, 22, 0.92)";
        ctx.fill();
        ctx.strokeStyle = isAligned ? "#00e676" : "rgba(255, 82, 82, 0.65)";
        ctx.lineWidth = 1.4;
        ctx.stroke();

        if (isAligned) {
            ctx.fillStyle = "#00e676";
            ctx.fillText(`✔ ARMED (${currAngle.toFixed(1)}°) — HOLD [SPACE]`, w / 2, boxY + 16.5);
        } else {
            const turnKey = angleDiff > 0 ? "[D] ➔" : "⬅ [A]";
            ctx.fillStyle = "#ffea00";
            ctx.fillText(`🔒 AIM ${turnKey} ${optimalAngle.toFixed(1)}° (${Math.abs(angleDiff).toFixed(1)}° OFF)`, w / 2, boxY + 16.5);
        }

        ctx.restore();
    }

    /**
     * Spectacular 3D Anime Hydrostatic Water Jet Cannon Torrent with Helical Vortex
     */
    drawWaterJet(ctx, w, h) {
        ctx.save();
        const startX = 130;
        const startY = h * 0.58;
        const tNow = Date.now() * 0.018;

        // Outer mist pressure cone
        const jetGrad = ctx.createLinearGradient(startX, startY, w, startY);
        jetGrad.addColorStop(0, "rgba(255, 255, 255, 0.96)");
        jetGrad.addColorStop(0.25, "rgba(0, 238, 255, 0.88)");
        jetGrad.addColorStop(0.75, "rgba(0, 140, 255, 0.7)");
        jetGrad.addColorStop(1, "rgba(0, 229, 255, 0)");

        ctx.fillStyle = jetGrad;
        ctx.beginPath();
        ctx.moveTo(startX, startY - 14);
        ctx.lineTo(w, startY - 46);
        ctx.lineTo(w, startY + 46);
        ctx.lineTo(startX, startY + 14);
        ctx.closePath();
        ctx.fill();

        // High-pressure white core lance
        const coreGrad = ctx.createLinearGradient(startX, startY, w * 0.88, startY);
        coreGrad.addColorStop(0, "rgba(255, 255, 255, 0.98)");
        coreGrad.addColorStop(0.55, "rgba(180, 250, 255, 0.72)");
        coreGrad.addColorStop(1, "rgba(0, 229, 255, 0)");
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.moveTo(startX, startY - 5);
        ctx.lineTo(w * 0.92, startY - 12);
        ctx.lineTo(w * 0.92, startY + 12);
        ctx.lineTo(startX, startY + 5);
        ctx.closePath();
        ctx.fill();

        // Dual spiraling 3D helical water vortex ribbons around jet core
        for (let rib = 0; rib < 2; rib++) {
            ctx.beginPath();
            for (let sx = startX; sx <= w; sx += 16) {
                const frac = (sx - startX) / (w - startX);
                const amp = 10 + frac * 28;
                const phase = sx * 0.04 - tNow + rib * Math.PI;
                const sy = startY + Math.sin(phase) * amp;
                if (sx === startX) ctx.moveTo(sx, sy);
                else ctx.lineTo(sx, sy);
            }
            ctx.strokeStyle = rib === 0 ? "rgba(255, 255, 255, 0.75)" : "rgba(0, 240, 255, 0.75)";
            ctx.lineWidth = rib === 0 ? 3.2 : 2.6;
            ctx.stroke();
        }

        // Spray droplets
        for (let i = 0; i < 8; i++) {
            this.particles.emit(
                startX + Math.random() * (w - startX),
                startY + (Math.random() - 0.5) * 44,
                "#00e5ff",
                2,
                4,
                "water"
            );
        }

        ctx.restore();
    }

    drawBulletsAndMuzzle(ctx) {
        // 1. Ejected 3D specular brass shell casings
        for (const c of this.casings) {
            ctx.save();
            ctx.globalAlpha = Math.min(1, c.life / 18);
            ctx.translate(c.x, c.y);
            ctx.rotate(c.rot);
            const cGrad = ctx.createLinearGradient(0, -1.4, 0, 1.4);
            cGrad.addColorStop(0, "#fef9c3");
            cGrad.addColorStop(0.5, "#facc15");
            cGrad.addColorStop(1, "#a16207");
            ctx.fillStyle = cGrad;
            ctx.fillRect(-3.2, -1.3, 6.4, 2.6);
            ctx.strokeStyle = "#78350f";
            ctx.lineWidth = 0.6;
            ctx.strokeRect(-3.2, -1.3, 6.4, 2.6);
            ctx.restore();
        }

        // 2. Anime Starburst Machine Gun Muzzle Flash + Expanding Concussion Shock-Ring
        if (this.muzzleFlash > 0) {
            const target = this.getPrimaryTarget();
            const geo = this.getGunGeometry(this.height, target);
            ctx.save();
            ctx.translate(geo.muzzleX, geo.muzzleY);
            ctx.rotate(geo.aimRad);
            ctx.globalAlpha = Math.min(1, this.muzzleFlash);

            const sc = 0.8 + this.muzzleFlash * 0.58;
            // Expanding shockwave oval ring in front of muzzle brake
            ctx.strokeStyle = "rgba(255, 224, 130, 0.72)";
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.ellipse((1.15 - this.muzzleFlash * 0.6) * 20, 0, 4.5, 11 * sc, 0, 0, Math.PI * 2);
            ctx.stroke();

            // Outer fiery amber-crimson anime starburst
            ctx.shadowColor = "#ff6d00";
            ctx.shadowBlur = 14;
            ctx.fillStyle = "#ff6d00";
            ctx.beginPath();
            ctx.moveTo(0, -5.5 * sc);
            ctx.lineTo(14 * sc, -13 * sc);
            ctx.lineTo(9 * sc, -3.5 * sc);
            ctx.lineTo(30 * sc, 0);
            ctx.lineTo(9 * sc, 3.5 * sc);
            ctx.lineTo(14 * sc, 13 * sc);
            ctx.lineTo(0, 5.5 * sc);
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;

            // Golden inner petals
            ctx.fillStyle = "#ffea00";
            ctx.beginPath();
            ctx.moveTo(0, -3.2 * sc);
            ctx.lineTo(10 * sc, -7.5 * sc);
            ctx.lineTo(7 * sc, -2 * sc);
            ctx.lineTo(22 * sc, 0);
            ctx.lineTo(7 * sc, 2 * sc);
            ctx.lineTo(10 * sc, 7.5 * sc);
            ctx.lineTo(0, 3.2 * sc);
            ctx.closePath();
            ctx.fill();

            // White-hot ignition core
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.ellipse(8 * sc, 0, 9.5 * sc, 3.2 * sc, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // 3. High-velocity 3D Glowing Golden-White Tracer Bullets
        for (const b of this.bullets) {
            const speed = Math.max(1, Math.hypot(b.vx, b.vy));
            const tailLen = Math.min(34, b.age * 17 + 12);
            const ux = b.vx / speed;
            const uy = b.vy / speed;
            const tailX = b.x - ux * tailLen;
            const tailY = b.y - uy * tailLen;

            ctx.save();
            // Outer energy wake
            ctx.strokeStyle = b.isCrit ? "rgba(255, 230, 0, 0.88)" : "rgba(255, 145, 0, 0.8)";
            ctx.shadowColor = b.isCrit ? "#ffe600" : "#ff9100";
            ctx.shadowBlur = b.isCrit ? 10 : 6;
            ctx.lineWidth = b.isCrit ? 4.8 : 3.6;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(tailX, tailY);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
            ctx.shadowBlur = 0;

            // White-hot supersonic core
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = b.isCrit ? 2.2 : 1.5;
            ctx.beginPath();
            ctx.moveTo(b.x - ux * (tailLen * 0.58), b.y - uy * (tailLen * 0.58));
            ctx.lineTo(b.x, b.y);
            ctx.stroke();

            // Glowing tracer tip
            ctx.fillStyle = "#fff8d6";
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.isCrit ? 2.8 : 2.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    drawInvariantShield(ctx, h) {
        ctx.save();
        const tNow = Date.now() * 0.002;
        const shieldX = 144;
        const topY = h * 0.34;
        const botY = h * 0.85;

        // Curved 3D Hexagonal Geodesic Dome Shield
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(shieldX, topY);
        ctx.bezierCurveTo(shieldX + 46, h * 0.52, shieldX + 46, h * 0.72, shieldX, botY);
        ctx.bezierCurveTo(shieldX + 12, h * 0.70, shieldX + 12, h * 0.54, shieldX, topY);
        ctx.closePath();

        const shGrad = ctx.createLinearGradient(shieldX, topY, shieldX + 44, topY);
        shGrad.addColorStop(0, "rgba(0, 229, 255, 0.06)");
        shGrad.addColorStop(0.65, "rgba(0, 229, 255, 0.22)");
        shGrad.addColorStop(1, "rgba(180, 252, 255, 0.34)");
        ctx.fillStyle = shGrad;
        ctx.fill();
        ctx.clip();

        // Hexagonal honeycomb lattice inside clipped energy dome
        ctx.strokeStyle = "rgba(150, 248, 255, 0.34)";
        ctx.lineWidth = 1;
        const hexR = 9;
        for (let row = 0; row < 20; row++) {
            const cy = topY + row * hexR * 1.45;
            const offset = (row % 2) * hexR * 0.85;
            for (let col = 0; col < 5; col++) {
                const cx = shieldX + col * hexR * 1.7 + offset;
                ctx.beginPath();
                for (let k = 0; k < 6; k++) {
                    const ang = (Math.PI / 3) * k;
                    const px = cx + Math.cos(ang) * (hexR * 0.8);
                    const py = cy + Math.sin(ang) * (hexR * 0.8);
                    if (k === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.stroke();
            }
        }

        // Animated vertical laser energy shimmer wave scrolling down barrier
        const scanY = topY + ((tNow * 90) % (botY - topY));
        ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
        ctx.fillRect(shieldX - 5, scanY - 4, 55, 8);
        ctx.restore();

        // Glowing leading plasma arc rib
        ctx.strokeStyle = "#00e5ff";
        ctx.lineWidth = 3.8;
        ctx.shadowColor = "#00e5ff";
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.moveTo(shieldX, topY);
        ctx.bezierCurveTo(shieldX + 46, h * 0.52, shieldX + 46, h * 0.72, shieldX, botY);
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.font = "bold 10px 'Courier New', monospace";
        ctx.fillStyle = "#00e5ff";
        ctx.fillText("🛡️ SHIELD ON", 118, h * 0.295);
        ctx.restore();
    }

    drawComboBanner(ctx, w) {
        ctx.save();
        ctx.font = "bold 12px 'Courier New', monospace";
        ctx.textAlign = "center";
        let title = "MOHR STREAK!";
        if (this.streak >= 5) title = "MASTER AIM!";
        if (this.streak >= 10) title = "MOHR LEGEND!";
        const text = `🔥 ${this.streak}x ${title}`;

        traceChamferBox(ctx, w / 2 - 110, 36, 220, 20, 5);
        ctx.fillStyle = "rgba(18, 12, 4, 0.84)";
        ctx.fill();
        ctx.strokeStyle = this.streak >= 5 ? "#ffe600" : "rgba(255, 214, 0, 0.55)";
        ctx.lineWidth = 1.1;
        ctx.stroke();

        ctx.fillStyle = "#ffe600";
        ctx.shadowColor = "rgba(255, 230, 0, 0.6)";
        ctx.shadowBlur = 6;
        ctx.fillText(text, w / 2, 50);
        ctx.restore();
    }

    spawnFloatingText(text, x, y, color) {
        const div = document.createElement("div");
        div.className = "floating-damage";
        div.textContent = text;
        div.style.left = `${x}px`;
        div.style.top = `${y}px`;
        div.style.color = color;
        const container = document.getElementById("canvasOverlay");
        if (container) {
            container.appendChild(div);
            setTimeout(() => div.remove(), 900);
        }
    }

    showToast(msg, type = "info") {
        const toast = document.getElementById("gameToast");
        if (!toast) return;
        toast.textContent = msg;
        toast.className = `game-toast show ${type}`;
        clearTimeout(this.toastTimeout);
        this.toastTimeout = setTimeout(() => {
            toast.className = "game-toast";
        }, 3200);
    }

    updateHUDStats() {
        const scoreEl = document.getElementById("hudScore");
        if (scoreEl) scoreEl.textContent = this.score;

        const levelEl = document.getElementById("hudLevel");
        if (levelEl) levelEl.textContent = this.isTutorial ? "TUTORIAL" : this.level;

        const streakEl = document.getElementById("hudStreak");
        if (streakEl) streakEl.textContent = `${this.streak}x`;

        const healthEl = document.getElementById("hudHealth");
        if (healthEl) healthEl.textContent = `${this.baseHealth}%`;
    }
}

window.GameEngine = GameEngine;
