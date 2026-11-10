/**
 * STRESS ZOMBIE APOCALYPSE - Stylized Comic Horror Zombie Entities (v3.8)
 * Inspired by classic 2D cartoon zombies & gritty survival-horror comic art:
 * bold dark ink outlines, hunched shambling gait, bugging/glowing eyes,
 * ragged street coats & neckties, clawed reaching hands, exposed shin bones,
 * hydrostatic quenching, and physical θ-plane cleavage slicing!
 */

class Zombie {
    constructor(config) {
        this.id = Math.random().toString(36).substr(2, 9);
        this.type = config.type || "brittle"; // brittle, ductile, shapeshifter, twin, boss
        this.name = config.name || "Brittle Biter";
        this.x = config.x || 900;
        this.y = config.y || 320;
        this.speed = config.speed || 0.6;
        this.baseSpeed = this.speed;

        // Stress state in MPa
        this.sx = config.sx !== undefined ? config.sx : 80;
        this.sy = config.sy !== undefined ? config.sy : 20;
        this.txy = config.txy !== undefined ? config.txy : 30;

        // Health
        this.maxHealth = config.maxHealth || 100;
        this.health = this.maxHealth;

        // Visual properties
        this.width = config.width || 56;
        this.height = config.height || 92;
        this.color = config.color || "#00e5ff";
        this.animTimer = Math.random() * 10;
        this.hitFlash = 0;
        this.isDying = false;
        this.deathProgress = 0;
        this.slicedAngle = 0; // Exact angle theta along which the zombie was cleaved

        // Hydrostatic Water Quench State
        this.isSoaked = false;
        this.soakedTimer = 0;

        // Shapeshifter / phase props
        this.currentPhase = config.initialPhase || "normal";
        this.phaseTimer = 0;
        this.phaseInterval = config.phaseInterval || 240;

        // Twin pair reference
        this.isTwin = config.isTwin || false;
        this.twinPartner = null;

        // Boss properties
        this.isBoss = config.type === "boss";
        this.phase = 1;
        this.maxPhase = 3;
    }

    /**
     * Applies Hydrostatic Water Jet Quenching:
     * High fluid pressure zeroes out shear stresses (τxy = 0) and freezes into Brittle state!
     */
    applyHydroQuench() {
        this.isSoaked = true;
        this.soakedTimer = 360; // 6 seconds
        this.txy = 0;
        this.prevType = this.type;
        this.type = "brittle";
        this.hitFlash = 1.0;
    }

    update(timeSlowFactor = 1.0) {
        if (this.isDying) {
            this.deathProgress += 0.04;
            return;
        }

        if (this.isSoaked) {
            this.soakedTimer -= 1 * timeSlowFactor;
            if (this.soakedTimer <= 0) {
                this.isSoaked = false;
                if (this.prevType) this.type = this.prevType;
            }
        }

        const effectiveSpeed = (this.isSoaked ? this.speed * 0.5 : this.speed) * timeSlowFactor;
        this.animTimer += 0.055 * timeSlowFactor;
        if (this.hitFlash > 0) this.hitFlash = Math.max(0, this.hitFlash - 0.08);

        // Shamble left toward player barricade
        this.x -= effectiveSpeed;

        // Shapeshifter dynamic stress mutation
        if (this.type === "shapeshifter" && !this.isSoaked) {
            this.phaseTimer += 1 * timeSlowFactor;
            if (this.phaseTimer >= this.phaseInterval) {
                this.phaseTimer = 0;
                this.currentPhase = this.currentPhase === "normal" ? "shear" : "normal";
                this.sx = Math.round(40 + Math.random() * 60);
                this.sy = Math.round(10 + Math.random() * 40);
                this.txy = Math.round((Math.random() - 0.5) * 80);
                this.hitFlash = 0.8;
            }
        }

        // Boss phase updates
        if (this.isBoss) {
            if (this.health <= this.maxHealth * 0.33 && this.phase < 3) {
                this.phase = 3;
                this.speed = this.baseSpeed * 1.35;
                this.sx = 110;
                this.sy = 45;
                this.txy = 55;
                this.hitFlash = 1.0;
            } else if (this.health <= this.maxHealth * 0.66 && this.phase < 2) {
                this.phase = 2;
                this.speed = this.baseSpeed * 1.15;
                this.sx = 90;
                this.sy = 30;
                this.txy = -45;
                this.hitFlash = 1.0;
            }
        }
    }

    takeDamage(amount, cutAngleDeg = 0) {
        this.health = Math.max(0, this.health - amount);
        this.hitFlash = 1.0;
        this.slicedAngle = cutAngleDeg;
        if (this.health <= 0) {
            this.isDying = true;
        }
    }

    /**
     * Draw 3D cel-shaded anime horror zombie entity on battlefield
     */
    draw(ctx, isSelected = false) {
        ctx.save();
        ctx.translate(this.x, this.y);

        const pal = this.getStylePalette();

        // 1. 3D Perspective Cast Shadow + Colored Ground Bounce Light
        ctx.save();
        const shadowW = this.width * 0.68;
        const shadowGrad = ctx.createRadialGradient(2, this.height * 0.48, 2, 2, this.height * 0.48, shadowW);
        shadowGrad.addColorStop(0, "rgba(0, 0, 0, 0.72)");
        shadowGrad.addColorStop(0.65, "rgba(2, 6, 14, 0.38)");
        shadowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = shadowGrad;
        ctx.beginPath();
        ctx.ellipse(2, this.height * 0.48, shadowW, 11, 0, 0, Math.PI * 2);
        ctx.fill();

        // Colored ambient bounce glow on wet asphalt directly under zombie
        const bounceGrad = ctx.createRadialGradient(-2, this.height * 0.46, 2, -2, this.height * 0.46, this.width * 0.62);
        bounceGrad.addColorStop(0, this.isSoaked ? "rgba(0, 229, 255, 0.34)" : (isSelected ? "rgba(255, 230, 0, 0.32)" : "rgba(0, 0, 0, 0)"));
        bounceGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = bounceGrad;
        ctx.beginPath();
        ctx.ellipse(-2, this.height * 0.46, this.width * 0.62, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 2. Selected Target 3D Spinning Perspective Ground Ring
        if (isSelected && !this.isDying) {
            ctx.save();
            const spinPhase = this.animTimer * 1.8;
            ctx.beginPath();
            ctx.ellipse(-2, this.height * 0.47, this.width * 0.76, 11, 0, 0, Math.PI * 2);
            ctx.strokeStyle = "#ffe600";
            ctx.lineWidth = 2.4;
            ctx.shadowColor = "#ffe600";
            ctx.shadowBlur = 16;
            ctx.stroke();

            // Inner dashed rotating arc ring for 3D depth look
            ctx.beginPath();
            ctx.ellipse(-2, this.height * 0.47, this.width * 0.56, 7.5, 0, spinPhase, spinPhase + Math.PI * 1.25);
            ctx.strokeStyle = pal.accentColor;
            ctx.lineWidth = 1.6;
            ctx.shadowColor = pal.accentColor;
            ctx.stroke();
            ctx.restore();
        }

        const bob = Math.abs(Math.sin(this.animTimer * 3.0)) * -4.5;
        const stride = Math.sin(this.animTimer * 3.0);
        const reach = Math.cos(this.animTimer * 2.6);

        // Cleaved death animation along angle theta
        if (this.isDying) {
            this.drawCleavedZombie(ctx, bob);
            ctx.restore();
            return;
        }

        // Hydrostatic soaked 3D energy aura shell
        if (this.isSoaked) {
            ctx.save();
            const auraGrad = ctx.createRadialGradient(-2, -this.height * 0.04, 4, -2, -this.height * 0.04, this.width * 0.9);
            auraGrad.addColorStop(0, "rgba(0, 229, 255, 0.28)");
            auraGrad.addColorStop(0.7, "rgba(0, 176, 255, 0.14)");
            auraGrad.addColorStop(1, "rgba(0, 229, 255, 0)");
            ctx.fillStyle = auraGrad;
            ctx.beginPath();
            ctx.ellipse(-2, -this.height * 0.04, this.width * 0.85, this.height * 0.58, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Shapeshifter 3D Tilted Orbital Hologram Rings
        if (this.type === "shapeshifter" && !this.isSoaked) {
            const isShear = this.currentPhase === "shear";
            const ringColor = isShear ? "#ff4081" : "#7c4dff";
            ctx.save();
            ctx.strokeStyle = ringColor;
            ctx.shadowColor = ringColor;
            ctx.shadowBlur = 10;
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.ellipse(-2, 4, this.width * 0.72, 11, 0.18, 0, Math.PI * 2);
            ctx.stroke();
            ctx.lineWidth = 1.4;
            ctx.setLineDash([6, 4]);
            ctx.beginPath();
            ctx.ellipse(-2, -16, this.width * 0.62, 9, -0.22, this.animTimer * 2, this.animTimer * 2 + Math.PI * 1.4);
            ctx.stroke();
            ctx.restore();
        }

        // Boss 3D Distortion Energy Ground Pulse & Aura
        if (this.isBoss) {
            ctx.save();
            const pulse = 0.5 + 0.5 * Math.sin(this.animTimer * 4);
            ctx.beginPath();
            ctx.ellipse(-2, this.height * 0.47, this.width * (0.82 + pulse * 0.12), 14 + pulse * 3, 0, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 23, 68, ${0.4 + pulse * 0.4})`;
            ctx.lineWidth = 2.2;
            ctx.shadowColor = "#ff1744";
            ctx.shadowBlur = 16;
            ctx.stroke();
            ctx.restore();
        }

        // Draw 3D cel-shaded anime horror zombie anatomy
        this.drawZombieBody(ctx, bob, stride, reach);

        // Health bar & live 3D isometric stress prism above head
        this.drawHealthBar(ctx);
        this.drawFloatingStressElement(ctx, bob, isSelected);

        ctx.restore();
    }

    /**
     * Physical Plane Cleavage:
     * Upper torso slides away along cutting plane angle θ with anime slash blade flare!
     */
    drawCleavedZombie(ctx, bob) {
        const rad = StressMechanics.degToRad(this.slicedAngle);
        const slideDist = this.deathProgress * 52;
        const slideX = Math.cos(rad) * slideDist;
        const slideY = -Math.sin(rad) * slideDist;
        const alpha = Math.max(0, 1 - this.deathProgress);

        ctx.globalAlpha = alpha;

        // 1. Lower half stationary with hot severed edge tint
        ctx.save();
        ctx.beginPath();
        ctx.rect(-this.width * 1.5, 0, this.width * 3.0, this.height * 1.2);
        ctx.clip();
        this.drawZombieBody(ctx, bob, 0, 0);
        ctx.restore();

        // 2. Upper half slides along cut angle theta with slight dynamic tilt
        ctx.save();
        ctx.translate(slideX, slideY);
        ctx.rotate(this.deathProgress * 0.16);
        ctx.beginPath();
        ctx.rect(-this.width * 1.5, -this.height * 1.15, this.width * 3.0, this.height * 1.15);
        ctx.clip();
        this.drawZombieBody(ctx, bob, 0, 0);
        ctx.restore();

        // 3. Ballistic shear-plane fracture seam & anime katana slash arc (along cut angle theta)
        ctx.save();
        const seamHalf = Math.max(44, this.width * 0.78);
        const slashReach = seamHalf * (1.2 + Math.sin(Math.min(1, this.deathProgress * 2.5) * Math.PI) * 0.9);

        // Outer anime glowing cyan/amber slash tapered blade flare
        ctx.shadowColor = "#ffe600";
        ctx.shadowBlur = 14;
        ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
        ctx.beginPath();
        const nx = Math.sin(rad) * Math.max(1.5, (1 - this.deathProgress) * 5.5);
        const ny = Math.cos(rad) * Math.max(1.5, (1 - this.deathProgress) * 5.5);
        ctx.moveTo(-slashReach * Math.cos(rad), slashReach * Math.sin(rad));
        ctx.quadraticCurveTo(-nx * 0.6, -ny * 0.6, slashReach * Math.cos(rad), -slashReach * Math.sin(rad));
        ctx.quadraticCurveTo(nx * 0.6, ny * 0.6, -slashReach * Math.cos(rad), slashReach * Math.sin(rad));
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.beginPath();
        ctx.moveTo(-seamHalf * Math.cos(rad), seamHalf * Math.sin(rad));
        ctx.lineTo(seamHalf * Math.cos(rad), -seamHalf * Math.sin(rad));
        ctx.strokeStyle = "#ffb300";
        ctx.lineWidth = 2.4;
        ctx.setLineDash([5, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Scattered bullet rupture sparks along the cleaved plane
        for (let sIdx = -3; sIdx <= 3; sIdx++) {
            const dist = sIdx * 12 + (sIdx % 2 === 0 ? 4 : -4);
            const sx = Math.cos(rad) * dist;
            const sy = -Math.sin(rad) * dist;
            ctx.fillStyle = sIdx === 0 ? "#ffffff" : "#ff6d00";
            ctx.beginPath();
            ctx.arc(sx, sy, sIdx === 0 ? 3.5 : 2.1, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    /**
     * Visual palette tuned cleanly per failure theory & uploaded reference aesthetic
     */
    getStylePalette() {
        const flash = this.hitFlash > 0.25;

        if (this.isSoaked) {
            return {
                ink: "#04202b",
                skin: flash ? "#ffffff" : "#88ecf9",
                skinHi: "#c2f7ff",
                skinShade: "#3f9eb8",
                coat: flash ? "#ffffff" : "#0c5673",
                coatHi: "#1d85a8",
                coatTrim: "#073447",
                shirt: "#cffafe",
                tieColor: "#00e5ff",
                pants: "#0a2e3f",
                pantsHi: "#144f6b",
                boot: "#0d2633",
                eyeMode: "cyanGlow",
                eyeGlow: "#e0fcff",
                hairType: "wisps",
                hasTie: true,
                hasExposedBone: true,
                accentColor: "#00ffff",
                rimLight: "rgba(180, 248, 255, 0.55)"
            };
        }

        if (this.type === "brittle") {
            return {
                ink: "#070b12",
                skin: flash ? "#ffffff" : "#93b28c",
                skinHi: "#c0dbba",
                skinShade: "#597353",
                coat: flash ? "#ffffff" : "#663f22",
                coatHi: "#8c5932",
                coatTrim: "#452812",
                shirt: "#dce3ec",
                tieColor: "#c81828",
                pants: "#273b63",
                pantsHi: "#3f5d96",
                boot: "#4f2d16",
                eyeMode: "bugging",
                eyeGlow: "#f7f9dc",
                hairType: "wisps",
                hasTie: true,
                hasExposedBone: true,
                accentColor: "#00e5ff",
                rimLight: "rgba(145, 238, 255, 0.45)"
            };
        }

        if (this.type === "ductile") {
            return {
                ink: "#070b12",
                skin: flash ? "#ffffff" : "#a39a6d",
                skinHi: "#cfc697",
                skinShade: "#635c38",
                coat: flash ? "#ffffff" : "#8c3c0e",
                coatHi: "#bd581c",
                coatTrim: "#572206",
                shirt: "#2b2f3a",
                tieColor: "#ff9100",
                pants: "#323644",
                pantsHi: "#4c5368",
                boot: "#261b14",
                eyeMode: "amberGlow",
                eyeGlow: "#ffea00",
                hairType: "tufts",
                hasTie: false,
                hasExposedBone: false,
                accentColor: "#ff9100",
                rimLight: "rgba(255, 200, 120, 0.45)"
            };
        }

        if (this.type === "shapeshifter") {
            const isShear = this.currentPhase === "shear";
            return {
                ink: "#070b12",
                skin: flash ? "#ffffff" : "#a3abb8",
                skinHi: "#d4dce8",
                skinShade: "#565e6b",
                coat: flash ? "#ffffff" : (isShear ? "#7d1f54" : "#1e6e68"),
                coatHi: isShear ? "#b8357d" : "#2fa39b",
                coatTrim: isShear ? "#4d1032" : "#104541",
                shirt: "#1f2430",
                tieColor: isShear ? "#ff4081" : "#7c4dff",
                pants: "#1d2233",
                pantsHi: "#323b57",
                boot: "#191c26",
                eyeMode: "crimsonHollow",
                eyeGlow: isShear ? "#ff4081" : "#ff1744",
                hairType: "shaggy",
                hasTie: false,
                hasExposedBone: true,
                accentColor: isShear ? "#ff4081" : "#b388ff",
                rimLight: isShear ? "rgba(255, 130, 195, 0.52)" : "rgba(185, 150, 255, 0.52)"
            };
        }

        if (this.type === "twin") {
            return {
                ink: "#070b12",
                skin: flash ? "#ffffff" : "#519ca1",
                skinHi: "#84cdd1",
                skinShade: "#2c6166",
                coat: flash ? "#ffffff" : "#918c80",
                coatHi: "#bab4a6",
                coatTrim: "#5c584f",
                shirt: "#474a4f",
                tieColor: "#00e676",
                pants: "#223c69",
                pantsHi: "#375ea1",
                boot: "#2a201b",
                eyeMode: "bigYellowBulb",
                eyeGlow: "#ffe600",
                hairType: "wisps",
                hasTie: false,
                hasExposedBone: false,
                accentColor: "#00e676",
                rimLight: "rgba(130, 255, 190, 0.45)"
            };
        }

        // Boss (von Mises Titan Colossus)
        return {
            ink: "#05070b",
            skin: flash ? "#ffffff" : "#969cad",
            skinHi: "#c7cde0",
            skinShade: "#4b5161",
            coat: flash ? "#ffffff" : "#3a192e",
            coatHi: "#66284f",
            coatTrim: "#210c19",
            shirt: "#18101c",
            tieColor: "#ff1744",
            pants: "#1b1d2b",
            pantsHi: "#2e324a",
            boot: "#1c1317",
            eyeMode: "crimsonHollow",
            eyeGlow: "#ff1744",
            hairType: "shaggy",
            hasTie: false,
            hasExposedBone: false,
            accentColor: "#ff1744",
            rimLight: "rgba(255, 100, 120, 0.55)"
        };
    }

    /**
     * Draw full 3D anime cel-shaded horror zombie facing LEFT toward player turret
     */
    drawZombieBody(ctx, bob, stride, reach) {
        const h = this.height;
        const scale = h / 92; // Normalized scale factor (1.0 standard, ~1.58 boss)
        const pal = this.getStylePalette();

        ctx.save();
        ctx.translate(0, bob);
        ctx.lineJoin = "round";
        ctx.lineCap = "round";

        const inkW = Math.max(2.0, 2.3 * scale);
        const lean = -0.14; // Hunched forward shamble posture facing left

        const hipX = 0;
        const hipY = h * 0.14;

        // ---------------- 1. BACK ARM (Behind torso, slightly darkened for 3D depth) ----------------
        ctx.save();
        ctx.translate(-6 * scale, -12.5 * scale);
        const backArmAngle = 0.24 + reach * 0.14;
        ctx.rotate(backArmAngle);
        this.drawZombieArm(ctx, pal, scale, inkW, true);
        ctx.restore();

        // ---------------- 2. BACK LEG (Depth-receded) ----------------
        ctx.save();
        ctx.translate(hipX + 4 * scale, hipY);
        this.drawZombieLeg(ctx, pal, scale, inkW, -stride * 0.32, false, true);
        ctx.restore();

        // ---------------- 3. FRONT LEG (Foreground cel-shaded with exposed 3D bone shin) ----------------
        ctx.save();
        ctx.translate(hipX - 4 * scale, hipY);
        this.drawZombieLeg(ctx, pal, scale, inkW, stride * 0.35, true, false);
        ctx.restore();

        // ---------------- 4. 3D CEL-SHADED JACKET & TORSO ----------------
        ctx.save();
        ctx.translate(0, hipY - 2 * scale);
        ctx.rotate(lean);
        this.drawZombieTorso(ctx, pal, scale, inkW);

        // Sculpted 3D Neck Bridge with shaded tendons
        const neckGrad = ctx.createLinearGradient(-9 * scale, -37 * scale, 5 * scale, -26 * scale);
        neckGrad.addColorStop(0, pal.skinShade);
        neckGrad.addColorStop(0.6, pal.skin);
        neckGrad.addColorStop(1, pal.skinShade);
        ctx.fillStyle = neckGrad;
        ctx.strokeStyle = pal.ink;
        ctx.lineWidth = inkW * 0.85;
        ctx.beginPath();
        ctx.moveTo(-6 * scale, -26 * scale);
        ctx.lineTo(5 * scale, -27 * scale);
        ctx.lineTo(2 * scale, -37 * scale);
        ctx.lineTo(-9 * scale, -35 * scale);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // ---------------- 5. 3D SCULPTED ANIME CRANIUM HEAD (facing left) ----------------
        ctx.save();
        ctx.translate(-5 * scale, -35 * scale);
        const headNod = Math.sin(this.animTimer * 2.0) * 0.05;
        ctx.rotate(headNod + 0.08);
        this.drawZombieHead(ctx, pal, scale, inkW);
        ctx.restore();

        ctx.restore(); // end leaned torso space

        // ---------------- 6. FRONT REACHING 3D ARM & CLAWED HAND ----------------
        ctx.save();
        ctx.translate(1.5 * scale, -11.5 * scale);
        const frontArmAngle = 0.06 - reach * 0.16;
        ctx.rotate(frontArmAngle);
        this.drawZombieArm(ctx, pal, scale, inkW, false);
        ctx.restore();

        ctx.restore();
    }

    drawZombieLeg(ctx, pal, s, inkW, swingAngle, showExposedBone, isBack = false) {
        ctx.save();
        ctx.rotate(swingAngle);

        const kneeX = -3 * s;
        const kneeY = 14 * s;
        const ankleX = 2 * s;
        const ankleY = 27 * s;

        const pantsGrad = ctx.createLinearGradient(-7 * s, 0, 7 * s, 0);
        pantsGrad.addColorStop(0, isBack ? pal.ink : pal.pantsHi);
        pantsGrad.addColorStop(0.5, pal.pants);
        pantsGrad.addColorStop(1, "#0b111c");

        if (showExposedBone && pal.hasExposedBone) {
            ctx.beginPath();
            ctx.moveTo(-6 * s, -2 * s);
            ctx.lineTo(6 * s, -2 * s);
            ctx.lineTo(7 * s, 11 * s);
            ctx.lineTo(3 * s, 8 * s);
            ctx.lineTo(0, 12 * s);
            ctx.lineTo(-4 * s, 9 * s);
            ctx.lineTo(-7 * s, 12 * s);
            ctx.closePath();
            ctx.fillStyle = pantsGrad;
            ctx.fill();
            ctx.strokeStyle = pal.ink;
            ctx.lineWidth = inkW;
            ctx.stroke();

            // 3D cylindrical exposed shin bone with highlight ridge + joint knobs
            ctx.strokeStyle = pal.ink;
            ctx.lineWidth = 6.8 * s;
            ctx.beginPath();
            ctx.moveTo(0, 10 * s);
            ctx.lineTo(kneeX, kneeY);
            ctx.lineTo(ankleX, ankleY);
            ctx.stroke();

            ctx.strokeStyle = pal.skinShade;
            ctx.lineWidth = 4.0 * s;
            ctx.stroke();

            ctx.strokeStyle = "#f2f4d8";
            ctx.lineWidth = 1.8 * s;
            ctx.beginPath();
            ctx.moveTo(-0.8 * s, 10 * s);
            ctx.lineTo(kneeX - 0.8 * s, kneeY);
            ctx.lineTo(ankleX - 0.8 * s, ankleY);
            ctx.stroke();

            // Bunched torn trouser cuff above boot
            ctx.fillStyle = pantsGrad;
            ctx.strokeStyle = pal.ink;
            ctx.lineWidth = inkW * 0.85;
            const cx = -4 * s, cy = 21 * s, cw = 11 * s, ch = 5 * s, cr = 2 * s;
            ctx.beginPath();
            ctx.moveTo(cx + cr, cy);
            ctx.lineTo(cx + cw - cr, cy);
            ctx.quadraticCurveTo(cx + cw, cy, cx + cw, cy + cr);
            ctx.lineTo(cx + cw, cy + ch - cr);
            ctx.quadraticCurveTo(cx + cw, cy + ch, cx + cw - cr, cy + ch);
            ctx.lineTo(cx + cr, cy + ch);
            ctx.quadraticCurveTo(cx, cy + ch, cx, cy + ch - cr);
            ctx.lineTo(cx, cy + cr);
            ctx.quadraticCurveTo(cx, cy, cx + cr, cy);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.moveTo(-6 * s, -2 * s);
            ctx.lineTo(6 * s, -2 * s);
            ctx.lineTo(6 * s, 26 * s);
            ctx.lineTo(2 * s, 24 * s);
            ctx.lineTo(-1 * s, 27 * s);
            ctx.lineTo(-5 * s, 24 * s);
            ctx.closePath();
            ctx.fillStyle = pantsGrad;
            ctx.fill();
            ctx.strokeStyle = pal.ink;
            ctx.lineWidth = inkW;
            ctx.stroke();
        }

        // 3D Sculpted Combat Boot with specular toe cap highlight & rubber sole depth
        ctx.save();
        ctx.translate(ankleX - 2 * s, ankleY - 1 * s);
        const bootGrad = ctx.createLinearGradient(0, -4 * s, 0, 6 * s);
        bootGrad.addColorStop(0, isBack ? pal.boot : "#6b3f22");
        bootGrad.addColorStop(0.65, pal.boot);
        bootGrad.addColorStop(1, "#140b06");

        ctx.beginPath();
        ctx.moveTo(6 * s, -2 * s);
        ctx.lineTo(6 * s, 5 * s);
        ctx.lineTo(-13 * s, 5 * s);
        ctx.quadraticCurveTo(-15 * s, -1 * s, -6 * s, -3 * s);
        ctx.closePath();
        ctx.fillStyle = bootGrad;
        ctx.fill();
        ctx.strokeStyle = pal.ink;
        ctx.lineWidth = inkW * 0.9;
        ctx.stroke();

        // Crisp toe-cap anime shine
        if (!isBack) {
            ctx.strokeStyle = "rgba(255, 255, 255, 0.34)";
            ctx.lineWidth = 1.4 * s;
            ctx.beginPath();
            ctx.moveTo(-11 * s, -0.5 * s);
            ctx.quadraticCurveTo(-8 * s, -2.1 * s, -4 * s, -1.6 * s);
            ctx.stroke();
        }

        // Thick treaded sole band
        ctx.strokeStyle = "rgba(255,255,255,0.18)";
        ctx.lineWidth = 1.3 * s;
        ctx.beginPath();
        ctx.moveTo(-11 * s, 3.4 * s);
        ctx.lineTo(4.5 * s, 3.4 * s);
        ctx.stroke();
        ctx.restore();

        ctx.restore();
    }

    drawZombieTorso(ctx, pal, s, inkW) {
        // 3D Cylindrical Jacket Volume Gradient + Moonlight Shoulder Rim
        const coatGrad = ctx.createLinearGradient(-15 * s, -30 * s, 16 * s, 2 * s);
        coatGrad.addColorStop(0, pal.coatHi);
        coatGrad.addColorStop(0.5, pal.coat);
        coatGrad.addColorStop(1, pal.coatTrim);

        ctx.beginPath();
        ctx.moveTo(-12 * s, -28 * s);
        ctx.lineTo(13 * s, -29 * s);
        ctx.quadraticCurveTo(17 * s, -15 * s, 14 * s, 0);
        ctx.lineTo(8 * s, -3 * s);
        ctx.lineTo(4 * s, 2 * s);
        ctx.lineTo(-1 * s, -3 * s);
        ctx.lineTo(-6 * s, 2 * s);
        ctx.lineTo(-11 * s, -3 * s);
        ctx.lineTo(-14 * s, 1 * s);
        ctx.quadraticCurveTo(-14 * s, -15 * s, -12 * s, -28 * s);
        ctx.closePath();

        ctx.fillStyle = coatGrad;
        ctx.fill();

        // Anime cel-shaded torso underside shadow wedge (gives chest depth)
        ctx.save();
        ctx.clip();
        ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
        ctx.beginPath();
        ctx.moveTo(4 * s, -29 * s);
        ctx.lineTo(18 * s, -29 * s);
        ctx.lineTo(16 * s, 4 * s);
        ctx.lineTo(1 * s, 4 * s);
        ctx.quadraticCurveTo(9 * s, -10 * s, 4 * s, -29 * s);
        ctx.fill();

        // Subtle anime rim light along back/shoulder contour
        ctx.strokeStyle = pal.rimLight;
        ctx.lineWidth = 2.0 * s;
        ctx.beginPath();
        ctx.moveTo(-11 * s, -27 * s);
        ctx.lineTo(12 * s, -28 * s);
        ctx.quadraticCurveTo(15 * s, -18 * s, 14 * s, -6 * s);
        ctx.stroke();
        ctx.restore();

        // Crisp dark anime ink silhouette
        ctx.strokeStyle = pal.ink;
        ctx.lineWidth = inkW;
        ctx.stroke();

        // Recessed Shirt V-chest opening with inner shadow
        const shirtGrad = ctx.createLinearGradient(-9 * s, -28 * s, -2 * s, -12 * s);
        shirtGrad.addColorStop(0, pal.shirt);
        shirtGrad.addColorStop(1, "rgba(0,0,0,0.45)");
        ctx.beginPath();
        ctx.moveTo(-9 * s, -28 * s);
        ctx.lineTo(-1 * s, -28 * s);
        ctx.lineTo(-6 * s, -10 * s);
        ctx.closePath();
        ctx.fillStyle = pal.shirt;
        ctx.fill();
        ctx.strokeStyle = pal.ink;
        ctx.lineWidth = inkW * 0.75;
        ctx.stroke();

        // Sculpted Folded Jacket Lapel
        ctx.beginPath();
        ctx.moveTo(0, -28 * s);
        ctx.lineTo(5 * s, -21 * s);
        ctx.lineTo(-4 * s, -11 * s);
        ctx.lineTo(-1 * s, -28 * s);
        ctx.closePath();
        ctx.fillStyle = pal.coatHi;
        ctx.fill();
        ctx.stroke();

        // 3D Beveled Red Striped Tie (Brittle / Soaked)
        if (pal.hasTie) {
            const tieSway = Math.sin(this.animTimer * 3.0) * 1.8 * s;
            ctx.save();
            const tieGrad = ctx.createLinearGradient(-10 * s, -26 * s, -4 * s, -4 * s);
            tieGrad.addColorStop(0, "#ff4d5a");
            tieGrad.addColorStop(0.5, pal.tieColor);
            tieGrad.addColorStop(1, "#6e0a14");
            ctx.beginPath();
            ctx.moveTo(-7 * s, -26 * s);
            ctx.lineTo(-4 * s, -26 * s);
            ctx.lineTo(-5 * s + tieSway, -6 * s);
            ctx.lineTo(-8.5 * s + tieSway, -3 * s);
            ctx.lineTo(-11 * s + tieSway, -6.5 * s);
            ctx.closePath();
            ctx.fillStyle = tieGrad;
            ctx.fill();
            ctx.strokeStyle = pal.ink;
            ctx.lineWidth = 1.4 * s;
            ctx.stroke();

            ctx.strokeStyle = "rgba(255,255,255,0.88)";
            ctx.lineWidth = 1.3 * s;
            for (let ty = -21; ty <= -9; ty += 5.5) {
                ctx.beginPath();
                ctx.moveTo(-9 * s + tieSway * 0.5, ty * s);
                ctx.lineTo(-5 * s + tieSway * 0.5, (ty - 2) * s);
                ctx.stroke();
            }
            ctx.restore();
        }

        // Material Mechanics Armor Clues (3D Shaded!)
        if (this.type === "brittle") {
            ctx.save();
            ctx.shadowColor = pal.accentColor;
            ctx.shadowBlur = 6 * s;
            ctx.strokeStyle = pal.accentColor;
            ctx.lineWidth = 1.6 * s;
            ctx.beginPath();
            ctx.moveTo(4 * s, -19 * s);
            ctx.lineTo(10 * s, -12 * s);
            ctx.lineTo(5 * s, -6 * s);
            ctx.lineTo(11 * s, -2 * s);
            ctx.stroke();
            ctx.restore();
        } else if (this.type === "ductile") {
            // 3D beveled riveted steel shoulder plate + 45° glowing molten slip bands
            ctx.save();
            ctx.fillStyle = "#57260b";
            ctx.strokeStyle = pal.ink;
            ctx.lineWidth = 1.3 * s;
            ctx.beginPath();
            ctx.moveTo(-1 * s, -26 * s);
            ctx.lineTo(13 * s, -25 * s);
            ctx.lineTo(12 * s, -10 * s);
            ctx.lineTo(0, -14 * s);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.shadowColor = "#ffb300";
            ctx.shadowBlur = 7 * s;
            ctx.strokeStyle = "#ffd149";
            ctx.lineWidth = 2.0 * s;
            ctx.beginPath();
            ctx.moveTo(-1 * s, -19 * s);
            ctx.lineTo(9 * s, -8 * s);
            ctx.moveTo(2 * s, -24 * s);
            ctx.lineTo(12 * s, -13 * s);
            ctx.stroke();
            ctx.restore();
        } else if (this.isBoss) {
            // 3D Spiked Armored Pauldron & Pulsing Distortion-Energy Turbine Core!
            ctx.save();
            const pauldronGrad = ctx.createLinearGradient(0, -34 * s, 16 * s, -18 * s);
            pauldronGrad.addColorStop(0, "#64748b");
            pauldronGrad.addColorStop(0.5, "#1e293b");
            pauldronGrad.addColorStop(1, "#090d14");
            ctx.fillStyle = pauldronGrad;
            ctx.strokeStyle = pal.ink;
            ctx.lineWidth = 1.6 * s;
            ctx.beginPath();
            ctx.moveTo(0, -29 * s);
            ctx.quadraticCurveTo(10 * s, -36 * s, 16 * s, -23 * s);
            ctx.lineTo(14 * s, -16 * s);
            ctx.lineTo(2 * s, -21 * s);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            const pulseR = (10.5 + Math.sin(this.animTimer * 6) * 2.2) * s;
            const grad = ctx.createRadialGradient(-2 * s, -14 * s, 1, -2 * s, -14 * s, pulseR);
            grad.addColorStop(0, "#ffffff");
            grad.addColorStop(0.35, "#ff5263");
            grad.addColorStop(0.75, "rgba(255, 23, 68, 0.7)");
            grad.addColorStop(1, "rgba(255, 23, 68, 0)");
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(-2 * s, -14 * s, pulseR, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = "#d4dae3";
            ctx.lineWidth = 1.5 * s;
            for (let ry = -20; ry <= -10; ry += 5) {
                ctx.beginPath();
                ctx.moveTo(-9 * s, ry * s);
                ctx.lineTo(-4 * s, (ry + 1.5) * s);
                ctx.stroke();
            }
            ctx.restore();
        }
    }

    drawZombieArm(ctx, pal, s, inkW, isBack) {
        const elbowX = -15 * s;
        const elbowY = 4 * s;
        const wristX = -26 * s;
        const wristY = -1 * s;

        // Tattered jacket sleeve with highlight upper rim
        ctx.strokeStyle = pal.ink;
        ctx.lineWidth = (isBack ? 7.6 : 8.8) * s;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(elbowX, elbowY);
        ctx.lineTo(elbowX - 6 * s, elbowY - 2 * s);
        ctx.stroke();

        ctx.strokeStyle = isBack ? pal.coatTrim : pal.coat;
        ctx.lineWidth = (isBack ? 4.8 : 5.8) * s;
        ctx.stroke();

        if (!isBack) {
            ctx.strokeStyle = pal.coatHi;
            ctx.lineWidth = 1.8 * s;
            ctx.beginPath();
            ctx.moveTo(-1 * s, -1.6 * s);
            ctx.lineTo(elbowX, elbowY - 1.6 * s);
            ctx.stroke();
        }

        // Bare 3D shaded zombie forearm
        ctx.strokeStyle = pal.ink;
        ctx.lineWidth = 5.6 * s;
        ctx.beginPath();
        ctx.moveTo(elbowX - 5 * s, elbowY - 1.5 * s);
        ctx.lineTo(wristX, wristY);
        ctx.stroke();

        ctx.strokeStyle = isBack ? pal.skinShade : pal.skin;
        ctx.lineWidth = 3.3 * s;
        ctx.stroke();

        if (!isBack) {
            ctx.strokeStyle = pal.skinHi;
            ctx.lineWidth = 1.1 * s;
            ctx.beginPath();
            ctx.moveTo(elbowX - 5 * s, elbowY - 2.3 * s);
            ctx.lineTo(wristX, wristY - 0.8 * s);
            ctx.stroke();
        }

        // Grabbing curled zombie hand & clawed fingers reaching left
        ctx.save();
        ctx.translate(wristX, wristY);

        const palmGrad = ctx.createRadialGradient(-1 * s, -1 * s, 0.5, 0, 0, 4 * s);
        palmGrad.addColorStop(0, pal.skinHi);
        palmGrad.addColorStop(0.7, pal.skin);
        palmGrad.addColorStop(1, pal.skinShade);
        ctx.fillStyle = palmGrad;
        ctx.strokeStyle = pal.ink;
        ctx.lineWidth = inkW * 0.72;
        ctx.beginPath();
        ctx.arc(0, 0, 3.8 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        const claws = [
            { ax: -3 * s, ay: -2.5 * s, bx: -7.8 * s, by: -1 * s },
            { ax: -3.5 * s, ay: 0.5 * s, bx: -8.8 * s, by: 3 * s },
            { ax: -2.5 * s, ay: 3 * s, bx: -6.8 * s, by: 6.4 * s }
        ];
        for (const c of claws) {
            ctx.strokeStyle = pal.ink;
            ctx.lineWidth = 3.2 * s;
            ctx.beginPath();
            ctx.moveTo(c.ax, c.ay);
            ctx.lineTo(c.bx, c.by);
            ctx.stroke();

            ctx.strokeStyle = isBack ? pal.skinShade : pal.skin;
            ctx.lineWidth = 1.6 * s;
            ctx.stroke();

            ctx.fillStyle = "#f2f5d8";
            ctx.beginPath();
            ctx.arc(c.bx, c.by, 1.05 * s, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    drawZombieHead(ctx, pal, s, inkW) {
        const rx = (this.type === "twin" ? 17 : 18.5) * s;
        const ry = (this.type === "twin" ? 16 : 17.5) * s;

        // 1. Hair tufts behind/top of skull
        ctx.strokeStyle = pal.ink;
        if (pal.hairType === "wisps") {
            ctx.lineWidth = 1.7 * s;
            ctx.beginPath();
            ctx.moveTo(-6 * s, -ry + 1 * s);
            ctx.quadraticCurveTo(-9 * s, -ry - 7 * s, -12 * s, -ry - 4 * s);
            ctx.moveTo(0, -ry);
            ctx.quadraticCurveTo(2 * s, -ry - 8 * s, 6 * s, -ry - 6 * s);
            ctx.moveTo(7 * s, -ry + 2 * s);
            ctx.quadraticCurveTo(13 * s, -ry - 5 * s, 16 * s, -ry - 1 * s);
            ctx.moveTo(12 * s, -ry + 7 * s);
            ctx.quadraticCurveTo(19 * s, -ry + 3 * s, 21 * s, -ry + 7 * s);
            ctx.stroke();
        } else if (pal.hairType === "shaggy") {
            const hairGrad = ctx.createLinearGradient(-10 * s, -ry - 8 * s, 15 * s, -4 * s);
            hairGrad.addColorStop(0, "#313747");
            hairGrad.addColorStop(1, "#12151c");
            ctx.fillStyle = hairGrad;
            ctx.lineWidth = inkW * 0.85;
            ctx.beginPath();
            ctx.moveTo(-14 * s, -8 * s);
            ctx.lineTo(-10 * s, -ry - 5 * s);
            ctx.lineTo(-4 * s, -ry - 1 * s);
            ctx.lineTo(2 * s, -ry - 7 * s);
            ctx.lineTo(8 * s, -ry - 2 * s);
            ctx.lineTo(15 * s, -ry - 4 * s);
            ctx.lineTo(rx - 1 * s, -5 * s);
            ctx.lineTo(10 * s, -10 * s);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else {
            ctx.fillStyle = "#2b241d";
            ctx.lineWidth = inkW * 0.8;
            ctx.beginPath();
            ctx.ellipse(2 * s, -ry + 3 * s, 11 * s, 5 * s, 0.1, Math.PI, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }

        // 2. Sculpted 3D Anime Cranium (volumetric gradient + cel shadow + moonlit crown rim)
        ctx.beginPath();
        ctx.moveTo(-rx * 0.92, -3 * s);
        ctx.bezierCurveTo(-rx * 0.98, -ry * 1.15, rx * 0.95, -ry * 1.18, rx * 0.96, -2 * s);
        ctx.quadraticCurveTo(rx * 0.98, 9 * s, rx * 0.36, 13.5 * s);
        ctx.quadraticCurveTo(-rx * 0.45, 18.2 * s, -rx * 0.88, 13.5 * s);
        ctx.quadraticCurveTo(-rx * 1.04, 7 * s, -rx * 0.84, 3.2 * s);
        ctx.quadraticCurveTo(-rx * 1.02, 0.5 * s, -rx * 0.92, -3 * s);
        ctx.closePath();

        const headGrad = ctx.createRadialGradient(-4 * s, -11 * s, 2 * s, 2 * s, 0, rx * 1.45);
        headGrad.addColorStop(0, pal.skinHi);
        headGrad.addColorStop(0.55, pal.skin);
        headGrad.addColorStop(1, pal.skinShade);
        ctx.fillStyle = headGrad;
        ctx.fill();

        // Clip inside head for crisp cel-shaded back/jaw shadow crescent & rim highlight
        ctx.save();
        ctx.clip();
        ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
        ctx.beginPath();
        ctx.arc(rx * 0.65, 6 * s, rx * 0.95, 0, Math.PI * 2);
        ctx.fill();

        // Anime moonlit top/rear skull rim shine
        ctx.strokeStyle = pal.rimLight;
        ctx.lineWidth = 2.4 * s;
        ctx.beginPath();
        ctx.arc(0, -1 * s, rx * 0.92, -Math.PI * 0.78, -Math.PI * 0.12);
        ctx.stroke();
        ctx.restore();

        ctx.strokeStyle = pal.ink;
        ctx.lineWidth = inkW;
        ctx.stroke();

        // Hollowed sunken cheekbone crease
        ctx.beginPath();
        ctx.moveTo(rx * 0.55, -1 * s);
        ctx.quadraticCurveTo(rx * 0.52, 8.5 * s, 1 * s, 10.5 * s);
        ctx.strokeStyle = pal.skinShade;
        ctx.lineWidth = 2.5 * s;
        ctx.stroke();

        // 3D Shaded Ear on back-right side of skull
        ctx.fillStyle = pal.skin;
        ctx.strokeStyle = pal.ink;
        ctx.lineWidth = inkW * 0.75;
        ctx.beginPath();
        ctx.ellipse(rx - 2 * s, 1 * s, 4.2 * s, 5.6 * s, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(rx - 2 * s, 1.2 * s, 1.8 * s, 0.4, Math.PI * 1.5);
        ctx.strokeStyle = pal.skinShade;
        ctx.lineWidth = 1.2 * s;
        ctx.stroke();

        // Forehead wrinkles
        ctx.strokeStyle = pal.ink;
        ctx.lineWidth = 1.1 * s;
        ctx.beginPath();
        ctx.moveTo(-8 * s, -11.5 * s);
        ctx.quadraticCurveTo(-2 * s, -13.5 * s, 4 * s, -11.5 * s);
        ctx.moveTo(-6 * s, -14 * s);
        ctx.quadraticCurveTo(0, -15.5 * s, 5 * s, -13.5 * s);
        ctx.stroke();

        // 3. 3D CAVITY GAPING MOUTH + JAGGED TEETH
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(-rx * 0.88, 5.5 * s);
        ctx.quadraticCurveTo(-rx * 0.25, 2.5 * s, 2.5 * s, 7.5 * s);
        ctx.quadraticCurveTo(0, 15.2 * s, -rx * 0.48, 14.8 * s);
        ctx.quadraticCurveTo(-rx * 0.92, 13.5 * s, -rx * 0.88, 5.5 * s);
        ctx.closePath();
        const mouthGrad = ctx.createLinearGradient(-rx * 0.8, 4 * s, 0, 15 * s);
        mouthGrad.addColorStop(0, "#1c0308");
        mouthGrad.addColorStop(1, "#520e1c");
        ctx.fillStyle = mouthGrad;
        ctx.fill();
        ctx.strokeStyle = pal.ink;
        ctx.lineWidth = inkW * 0.78;
        ctx.stroke();

        ctx.fillStyle = "#a33c4d";
        ctx.beginPath();
        ctx.ellipse(-6 * s, 12.2 * s, 4.5 * s, 2.1 * s, -0.1, 0, Math.PI * 2);
        ctx.fill();

        const teeth = [
            { x: -13.5 * s, y: 5.2 * s, w: 3.1 * s, h: 3.0 * s },
            { x: -8.0 * s, y: 4.5 * s, w: 3.3 * s, h: 3.2 * s },
            { x: -3.2 * s, y: 5.8 * s, w: 2.6 * s, h: 2.6 * s },
            { x: -11.0 * s, y: 11.4 * s, w: 2.9 * s, h: 2.8 * s },
            { x: -5.0 * s, y: 11.6 * s, w: 3.0 * s, h: 2.7 * s }
        ];
        for (const t of teeth) {
            ctx.fillStyle = "#f7f4dc";
            ctx.strokeStyle = pal.ink;
            ctx.lineWidth = 0.9 * s;
            ctx.fillRect(t.x, t.y, t.w, t.h);
            ctx.fillStyle = "#cfc6a1";
            ctx.fillRect(t.x, t.y + t.h * 0.6, t.w, t.h * 0.4);
            ctx.strokeRect(t.x, t.y, t.w, t.h);
        }

        if (pal.eyeMode === "crimsonHollow") {
            ctx.strokeStyle = "rgba(220, 245, 255, 0.78)";
            ctx.lineWidth = 1.2 * s;
            ctx.beginPath();
            ctx.moveTo(-11 * s, 13.5 * s);
            ctx.lineTo(-11.5 * s, 19.5 * s);
            ctx.moveTo(-6 * s, 13.5 * s);
            ctx.lineTo(-6 * s, 17.5 * s);
            ctx.stroke();
        }
        ctx.restore();

        // Nostrils
        ctx.fillStyle = pal.ink;
        ctx.beginPath();
        ctx.arc(-11.5 * s, 1.8 * s, 1.3 * s, 0, Math.PI * 2);
        ctx.arc(-8.5 * s, 2.0 * s, 1.1 * s, 0, Math.PI * 2);
        ctx.fill();

        // 4. SPHERICAL 3D ANIME/HORROR EYES
        const eyeLeftX = -12.6 * s;
        const eyeLeftY = -4.8 * s;
        const eyeLeftR = pal.eyeMode === "bigYellowBulb" ? 5.6 * s : 4.6 * s;

        const eyeRightX = 0.2 * s;
        const eyeRightY = -3.8 * s;
        const eyeRightR = pal.eyeMode === "bigYellowBulb" ? 6.4 * s : 6.2 * s;

        const renderEye = (ex, ey, er, pupilOffset) => {
            ctx.save();
            if (pal.eyeMode === "crimsonHollow") {
                ctx.fillStyle = "#12070c";
                ctx.beginPath();
                ctx.ellipse(ex, ey, er * 1.18, er * 1.05, 0, 0, Math.PI * 2);
                ctx.fill();

                ctx.shadowColor = pal.eyeGlow;
                ctx.shadowBlur = 14 * s;
                ctx.fillStyle = pal.eyeGlow;
                ctx.beginPath();
                ctx.arc(ex - 0.8 * s, ey, er * 0.64, 0, Math.PI * 2);
                ctx.fill();

                ctx.shadowBlur = 0;
                ctx.fillStyle = "#ffffff";
                ctx.beginPath();
                ctx.arc(ex - 1.2 * s, ey, er * 0.28, 0, Math.PI * 2);
                ctx.fill();
            } else if (pal.eyeMode === "amberGlow" || pal.eyeMode === "bigYellowBulb" || pal.eyeMode === "cyanGlow") {
                ctx.fillStyle = pal.ink;
                ctx.beginPath();
                ctx.arc(ex, ey, er + 1.4 * s, 0, Math.PI * 2);
                ctx.fill();

                ctx.shadowColor = pal.eyeGlow;
                ctx.shadowBlur = 12 * s;
                const eg = ctx.createRadialGradient(ex - 1.2 * s, ey - 1.2 * s, 0.8, ex, ey, er);
                eg.addColorStop(0, "#ffffff");
                eg.addColorStop(0.45, pal.eyeGlow);
                eg.addColorStop(1, pal.eyeMode === "cyanGlow" ? "#0097a7" : "#d97706");
                ctx.fillStyle = eg;
                ctx.beginPath();
                ctx.arc(ex, ey, er, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;

                ctx.strokeStyle = pal.ink;
                ctx.lineWidth = inkW * 0.7;
                ctx.stroke();

                ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
                ctx.beginPath();
                ctx.arc(ex - er * 0.3, ey - er * 0.3, Math.max(1.3, er * 0.26), 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Spherical 3D sclera radial gradient + staring pinpoint pupil + crisp anime gleam
                const eyeGrad = ctx.createRadialGradient(ex - er * 0.25, ey - er * 0.25, 0.5, ex, ey, er);
                eyeGrad.addColorStop(0, "#ffffff");
                eyeGrad.addColorStop(0.7, pal.eyeGlow);
                eyeGrad.addColorStop(1, "#aab89e");
                ctx.fillStyle = eyeGrad;
                ctx.beginPath();
                ctx.arc(ex, ey, er, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = pal.ink;
                ctx.lineWidth = inkW * 0.82;
                ctx.stroke();

                ctx.fillStyle = "#080b10";
                ctx.beginPath();
                ctx.arc(ex + pupilOffset * s, ey + 0.4 * s, Math.max(1.3, 1.55 * s), 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = "#ffffff";
                ctx.beginPath();
                ctx.arc(ex + (pupilOffset - 0.8) * s, ey - 1.2 * s, 1.0 * s, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        };

        renderEye(eyeLeftX, eyeLeftY, eyeLeftR, -1.6);
        renderEye(eyeRightX, eyeRightY, eyeRightR, -2.0);

        // Furrowed angry brow ridges
        ctx.strokeStyle = pal.ink;
        ctx.lineWidth = 1.9 * s;
        ctx.beginPath();
        ctx.moveTo(eyeLeftX - 4 * s, eyeLeftY - eyeLeftR - 1 * s);
        ctx.lineTo(eyeLeftX + 4 * s, eyeLeftY - eyeLeftR + 1.5 * s);
        ctx.moveTo(eyeRightX + 4 * s, eyeRightY - eyeRightR - 1 * s);
        ctx.lineTo(eyeRightX - 5 * s, eyeRightY - eyeRightR + 1.5 * s);
        ctx.stroke();
    }

    /**
     * Renders ONLY glowing horror eyes aligned precisely to head pose (used on locked silhouette previews)
     */
    drawHorrorEyesOnly(ctx, bob, eyeGlow = "#ff1744") {
        const h = this.height;
        const s = h / 92;
        const lean = -0.14;
        const hipY = h * 0.14;
        const headNod = Math.sin(this.animTimer * 2.0) * 0.05;

        ctx.save();
        ctx.translate(0, bob);
        ctx.translate(0, hipY - 2 * s);
        ctx.rotate(lean);
        ctx.translate(-5 * s, -35 * s);
        ctx.rotate(headNod + 0.08);

        const eyes = [
            { x: -12.6 * s, y: -4.8 * s, r: 2.9 * s },
            { x: 0.2 * s, y: -3.8 * s, r: 3.4 * s }
        ];
        for (const e of eyes) {
            ctx.shadowColor = eyeGlow;
            ctx.shadowBlur = 12 * s;
            ctx.fillStyle = eyeGlow;
            ctx.beginPath();
            ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(e.x - 0.5 * s, e.y - 0.3 * s, e.r * 0.42, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    drawHealthBar(ctx) {
        const barW = Math.max(56, this.width * 1.14);
        const barH = 7;
        const barY = -this.height * 0.68;

        ctx.fillStyle = "rgba(3, 6, 12, 0.9)";
        ctx.fillRect(-barW / 2, barY, barW, barH);

        const ratio = Math.max(0, this.health / this.maxHealth);
        let barColor = "#00e676";
        let barHi = "#69f0ae";
        if (ratio < 0.35) {
            barColor = "#ff1744";
            barHi = "#ff6e80";
        } else if (ratio < 0.7) {
            barColor = "#ffea00";
            barHi = "#ffff8d";
        }

        const fillW = barW * ratio;
        if (fillW > 0) {
            const hpGrad = ctx.createLinearGradient(0, barY, 0, barY + barH);
            hpGrad.addColorStop(0, barHi);
            hpGrad.addColorStop(0.55, barColor);
            hpGrad.addColorStop(1, "rgba(0,0,0,0.45)");
            ctx.fillStyle = hpGrad;
            ctx.fillRect(-barW / 2, barY, fillW, barH);
        }

        ctx.strokeStyle = "rgba(255, 255, 255, 0.56)";
        ctx.lineWidth = 1.1;
        ctx.strokeRect(-barW / 2, barY, barW, barH);
    }

    /**
     * 3D Extruded Isometric Floating Stress Cube Prism above Zombie Head
     */
    drawFloatingStressElement(ctx, bob, isSelected) {
        ctx.save();
        const elemY = -this.height * 1.06 + bob * 0.5;
        ctx.translate(0, elemY);

        const side = 24;
        const half = side / 2;
        const dx3d = 6.5;
        const dy3d = -5.5;

        const mag = Math.sqrt(this.sx * this.sx + this.sy * this.sy + 2 * this.txy * this.txy);
        const glowFactor = Math.min(1.0, mag / 120);
        const rimCol = isSelected ? "#ffe600" : "#00e5ff";

        // Soft holographic halo behind 3D cube
        if (isSelected) {
            ctx.shadowColor = "#ffe600";
            ctx.shadowBlur = 12;
        }

        // Top 3D extruded face
        ctx.beginPath();
        ctx.moveTo(-half, -half);
        ctx.lineTo(-half + dx3d, -half + dy3d);
        ctx.lineTo(half + dx3d, -half + dy3d);
        ctx.lineTo(half, -half);
        ctx.closePath();
        ctx.fillStyle = `rgba(${Math.round(135 + glowFactor * 120)}, 52, 52, 0.92)`;
        ctx.fill();
        ctx.strokeStyle = rimCol;
        ctx.lineWidth = 1.1;
        ctx.stroke();

        // Right 3D extruded side face (darker shadow depth)
        ctx.beginPath();
        ctx.moveTo(half, -half);
        ctx.lineTo(half + dx3d, -half + dy3d);
        ctx.lineTo(half + dx3d, half + dy3d);
        ctx.lineTo(half, half);
        ctx.closePath();
        ctx.fillStyle = `rgba(${Math.round(52 + glowFactor * 95)}, 12, 18, 0.94)`;
        ctx.fill();
        ctx.strokeStyle = rimCol;
        ctx.lineWidth = 1.1;
        ctx.stroke();

        // Front 3D square face with diagonal glass sheen
        const frontGrad = ctx.createLinearGradient(-half, -half, half, half);
        frontGrad.addColorStop(0, `rgba(${Math.round(115 + glowFactor * 140)}, 32, 36, 0.94)`);
        frontGrad.addColorStop(1, `rgba(${Math.round(68 + glowFactor * 115)}, 14, 18, 0.94)`);
        ctx.fillStyle = frontGrad;
        ctx.fillRect(-half, -half, side, side);
        ctx.strokeStyle = isSelected ? "#ffe600" : "#ffffff";
        ctx.lineWidth = isSelected ? 1.8 : 1.2;
        ctx.strokeRect(-half, -half, side, side);
        ctx.shadowBlur = 0;

        // Subtle glass reflection slash on front face
        ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-half + 3, -half + 8);
        ctx.lineTo(-half + 9, -half + 3);
        ctx.stroke();

        // Tensile/Compressive Arrows for sigma_x (Glowing Red-Orange arrows)
        ctx.strokeStyle = "#ff4d1a";
        ctx.fillStyle = "#ff4d1a";
        ctx.lineWidth = 1.9;
        const arrowLenX = Math.min(18, Math.max(6, Math.abs(this.sx) * 0.16));
        const dirX = this.sx >= 0 ? 1 : -1;

        this.drawArrow(ctx, half + 2, 0, half + 2 + arrowLenX * dirX, 0);
        this.drawArrow(ctx, -half, 0, -half - arrowLenX * dirX, 0);

        // Tensile/Compressive Arrows for sigma_y (Neon Green arrows)
        ctx.strokeStyle = "#00e676";
        ctx.fillStyle = "#00e676";
        const arrowLenY = Math.min(17, Math.max(6, Math.abs(this.sy) * 0.16));
        const dirY = this.sy >= 0 ? 1 : -1;

        this.drawArrow(ctx, 1, -half + dy3d * 0.4, 1, -half + dy3d * 0.4 - arrowLenY * dirY);
        this.drawArrow(ctx, 0, half, 0, half + arrowLenY * dirY);

        // Shear Stress Arrows tau_xy (Amber-Orange arrows)
        if (Math.abs(this.txy) > 1) {
            ctx.strokeStyle = "#ff9100";
            ctx.fillStyle = "#ff9100";
            ctx.lineWidth = 1.5;
            const shearSign = this.txy >= 0 ? 1 : -1;

            this.drawArrow(ctx, half + 3, half * 0.55 * shearSign, half + 3, -half * 0.55 * shearSign);
            this.drawArrow(ctx, -half * 0.55 * shearSign, -half - 3, half * 0.55 * shearSign, -half - 3);
        }

        // Crisp dark HUD readout pill above 3D cube so tensor text is ultra-legible
        const label = `σx:${Math.round(this.sx)} σy:${Math.round(this.sy)} τ:${Math.round(this.txy)}`;
        ctx.font = "bold 9px 'Consolas', 'Courier New', monospace";
        const pillW = Math.max(114, ctx.measureText(label).width + 10);
        const pillY = -half - arrowLenY - 19;
        ctx.fillStyle = "rgba(4, 10, 18, 0.85)";
        ctx.fillRect(-pillW / 2, pillY, pillW, 13);
        ctx.strokeStyle = isSelected ? "rgba(255, 230, 0, 0.72)" : "rgba(0, 229, 255, 0.35)";
        ctx.lineWidth = 0.9;
        ctx.strokeRect(-pillW / 2, pillY, pillW, 13);

        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.fillText(label, 0, pillY + 9.5);

        ctx.restore();
    }

    drawArrow(ctx, fromX, fromY, toX, toY) {
        const headlen = 4;
        const angle = Math.atan2(toY - fromY, toX - fromX);
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
    }
}

window.Zombie = Zombie;
