/**
 * STRESS ZOMBIE APOCALYPSE - Study Mode & Solid Mechanics Codex
 * Interactive laboratory for exploring stress transformations, strain tensors (Hooke's Law),
 * Mohr's circle, angle doubling (2θ), invariants, and failure theories (APL104).
 */

class StudyLab {
    constructor() {
        this.sx = 80;
        this.sy = 20;
        this.txy = 30;
        this.theta = 22.5;

        this.canvas = document.getElementById("studyMohrCanvas");
        this.ctx = this.canvas ? this.canvas.getContext("2d") : null;
        this.elemCanvas = document.getElementById("studyElementCanvas");
        this.elemCtx = this.elemCanvas ? this.elemCanvas.getContext("2d") : null;

        this.initControls();
        this.update();
    }

    initControls() {
        const bindSlider = (id, prop, isAngle = false) => {
            const input = document.getElementById(id);
            const valDisp = document.getElementById(id + "Val");
            if (input) {
                input.addEventListener("input", (e) => {
                    this[prop] = parseFloat(e.target.value);
                    if (valDisp) {
                        valDisp.textContent = isAngle ? `${this[prop].toFixed(1)}°` : `${this[prop]} MPa`;
                    }
                    this.update();
                });
            }
        };

        bindSlider("studySx", "sx");
        bindSlider("studySy", "sy");
        bindSlider("studyTxy", "txy");
        bindSlider("studyTheta", "theta", true);

        // Preset worked examples
        const presetBtn1 = document.getElementById("presetExample1");
        const presetBtn2 = document.getElementById("presetPureShear");
        const presetBtn3 = document.getElementById("presetUniaxial");
        const presetBtn4 = document.getElementById("presetBiaxial");

        if (presetBtn1) {
            presetBtn1.addEventListener("click", () => this.loadPreset(80, 20, 30, 22.5));
        }
        if (presetBtn2) {
            presetBtn2.addEventListener("click", () => this.loadPreset(0, 0, 50, 45));
        }
        if (presetBtn3) {
            presetBtn3.addEventListener("click", () => this.loadPreset(100, 0, 0, 45));
        }
        if (presetBtn4) {
            presetBtn4.addEventListener("click", () => this.loadPreset(70, 70, 0, 0));
        }
    }

    loadPreset(sx, sy, txy, theta) {
        this.sx = sx;
        this.sy = sy;
        this.txy = txy;
        this.theta = theta;

        const updateInput = (id, val, isAngle = false) => {
            const input = document.getElementById(id);
            const valDisp = document.getElementById(id + "Val");
            if (input) input.value = val;
            if (valDisp) valDisp.textContent = isAngle ? `${val.toFixed(1)}°` : `${val} MPa`;
        };

        updateInput("studySx", sx);
        updateInput("studySy", sy);
        updateInput("studyTxy", txy);
        updateInput("studyTheta", theta, true);

        this.update();
    }

    /**
     * Populates a quick preset strip in Study Lab for zombies defeated in the most recent level
     */
    populateSlainPresets(autopsies = []) {
        const container = document.getElementById("studyLastLevelZombies");
        const wrap = document.getElementById("studyLastLevelWrap");
        if (!container || !wrap) return;

        if (!autopsies || autopsies.length === 0) {
            wrap.style.display = "none";
            return;
        }

        wrap.style.display = "block";
        container.innerHTML = autopsies.map((a, idx) => `
            <button class="btn-preset" style="border-color: #00e676; color: #00e676;"
                onclick="if(window.studyLab) window.studyLab.loadPreset(${a.stress.sx.toFixed(0)}, ${a.stress.sy.toFixed(0)}, ${a.stress.txy.toFixed(0)}, ${a.cutAngle.toFixed(1)})"
                title="Load ${a.zombieName} stress & strain tensor">
                💀 #${idx + 1} ${a.zombieName} (${a.cutAngle.toFixed(1)}°)
            </button>
        `).join("");
    }

    update() {
        const mohr = StressMechanics.getMohrCircle(this.sx, this.sy, this.txy);
        const transform = StressMechanics.transform(this.sx, this.sy, this.txy, this.theta);
        const strains = StressMechanics.computeStrains(this.sx, this.sy, this.txy);
        const strainCut = StressMechanics.transformStrain(strains.epsX, strains.epsY, strains.gammaXY, this.theta);

        // Update Stress readouts
        const setTxt = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };

        setTxt("studyCenter", `${mohr.center.toFixed(1)} MPa`);
        setTxt("studyRadius", `${mohr.radius.toFixed(1)} MPa`);
        setTxt("studySigma1", `${mohr.sigma1.toFixed(1)} MPa`);
        setTxt("studySigma2", `${mohr.sigma2.toFixed(1)} MPa`);
        setTxt("studyThetaP", `${mohr.thetaP_max.toFixed(1)}°`);
        setTxt("studyTauMax", `${mohr.tauMax.toFixed(1)} MPa`);
        setTxt("studyThetaS", `${mohr.thetaS1.toFixed(1)}°`);
        setTxt("studyI1", `${mohr.I1.toFixed(1)} MPa`);
        setTxt("studyI2", `${mohr.I2.toFixed(1)} MPa²`);
        setTxt("studyVM", `${mohr.vonMises.toFixed(1)} MPa`);

        // Update Strain readouts (Generalized Hooke's Law)
        setTxt("studyEpsX", `${strains.epsX.toFixed(1)} με`);
        setTxt("studyEpsY", `${strains.epsY.toFixed(1)} με`);
        setTxt("studyEpsZ", `${strains.epsZ.toFixed(1)} με`);
        setTxt("studyGammaXY", `${strains.gammaXY.toFixed(1)} μrad`);
        setTxt("studyEps1", `${strains.eps1.toFixed(1)} με`);
        setTxt("studyEps2", `${strains.eps2.toFixed(1)} με`);
        setTxt("studyGammaMax", `${strains.gammaMax.toFixed(1)} μrad`);
        setTxt("studyDilatation", `${strains.dilatation.toFixed(1)} με`);
        setTxt("studyEnergyTotal", `${strains.u_total.toFixed(2)} kJ/m³`);
        setTxt("studyEnergyDist", `${strains.u_distortion.toFixed(2)} kJ/m³`);

        // Update current plane values
        setTxt("studyCurrentSigma", `${transform.sigmaTheta.toFixed(1)} MPa`);
        setTxt("studyCurrentTau", `${transform.tauTheta.toFixed(1)} MPa`);
        setTxt("studyCurrentTwoTheta", `${(this.theta * 2).toFixed(1)}°`);

        // Populate killed zombies list if game exists
        if (window.game && window.game.levelAutopsies) {
            this.populateSlainPresets(window.game.levelAutopsies);
        }

        // Update step-by-step formula derivation box (stress + strain)
        StudyLab.renderDerivationsInto(
            document.getElementById("studyDerivationBox"),
            this.sx, this.sy, this.txy, this.theta,
            mohr, transform, strains, strainCut
        );

        // Draw Mohr Circle & Transformed Stress/Strain Element
        StudyLab.drawMohrCanvas(this.canvas, this.sx, this.sy, this.txy, this.theta);
        StudyLab.drawElementCanvas(this.elemCanvas, transform, this.theta, strainCut);
    }

    /**
     * Reusable Step-by-Step Stress & Strain Derivation Renderer
     */
    static renderDerivationsInto(box, sx, sy, txy, theta, mohr, transform, strains, strainCut, extraVerdictHtml = "") {
        if (!box) return;

        const diffHalf = (sx - sy) / 2;
        const twoTheta = 2 * theta;

        box.innerHTML = `
            ${extraVerdictHtml}
            <div class="derivation-step">
                <span class="step-badge">1. Mohr Center C</span>
                <code>C = (σx + σy)/2 = <strong>${mohr.center.toFixed(1)} MPa</strong></code>
            </div>
            <div class="derivation-step">
                <span class="step-badge">2. Radius R = τmax</span>
                <code>R = √[((σx - σy)/2)² + τxy²] = <strong>${mohr.radius.toFixed(1)} MPa</strong></code>
            </div>
            <div class="derivation-step">
                <span class="step-badge">3. Principal Stresses &amp; Angles</span>
                <code>σ1 = <strong>${mohr.sigma1.toFixed(1)}</strong>, σ2 = <strong>${mohr.sigma2.toFixed(1)} MPa</strong> | θp = <strong>${mohr.thetaP_max.toFixed(1)}°</strong>, θs = <strong>${mohr.thetaS1.toFixed(1)}°</strong></code>
            </div>
            <div class="derivation-step" style="border-left-color: #00e676;">
                <span class="step-badge" style="color: #00e676;">4. Hooke Strains (E=200 GPa, ν=0.30)</span>
                <code>εx = <strong>${strains.epsX.toFixed(1)}</strong>, εy = <strong>${strains.epsY.toFixed(1)}</strong>, εz = <strong>${strains.epsZ.toFixed(1)} με</strong> | γxy = <strong>${strains.gammaXY.toFixed(1)} μrad</strong></code><br>
                <code>ε1 = <strong>${strains.eps1.toFixed(1)} με</strong>, ε2 = <strong>${strains.eps2.toFixed(1)} με</strong>, γmax = <strong>${strains.gammaMax.toFixed(1)} μrad</strong></code>
            </div>
            <div class="derivation-step" style="border-left-color: #b388ff;">
                <span class="step-badge" style="color: #b388ff;">5. Strain Energy Density</span>
                <code>e = <strong>${strains.dilatation.toFixed(1)} με</strong> | u = <strong>${strains.u_total.toFixed(2)} kJ/m³</strong> (uv = <strong>${strains.u_volumetric.toFixed(2)}</strong>, ud = <strong>${strains.u_distortion.toFixed(2)}</strong>)</code>
            </div>
            <div class="derivation-step" style="border-left-color: #ffe600;">
                <span class="step-badge" style="color: #ffe600;">6. Cut θ = ${theta.toFixed(1)}° (Mohr 2θ = ${twoTheta.toFixed(1)}°)</span>
                <code>σθ = <strong>${transform.sigmaTheta.toFixed(1)} MPa</strong>, τθ = <strong>${transform.tauTheta.toFixed(1)} MPa</strong> | εθ = <strong>${strainCut.epsTheta.toFixed(1)} με</strong>, γθ = <strong>${strainCut.gammaTheta.toFixed(1)} μrad</strong></code><br>
                <code>Invariant I1 = <strong>${mohr.I1.toFixed(1)} MPa</strong></code>
            </div>
        `;
    }

    /**
     * Reusable Canvas Renderer for Mohr's Circle & 2θ Pointers
     */
    static drawMohrCanvas(canvas, sx, sy, txy, theta, optAngle = null) {
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const mohr = StressMechanics.getMohrCircle(sx, sy, txy);
        const transform = StressMechanics.transform(sx, sy, txy, theta);

        const w = canvas.width;
        const h = canvas.height;

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = "#090d14";
        ctx.fillRect(0, 0, w, h);

        // Adaptive scaling so circle fits nicely in frame
        const maxExtent = Math.max(Math.abs(mohr.sigma1), Math.abs(mohr.sigma2), mohr.radius * 1.4, 30);
        const minSpan = Math.max(80, mohr.radius * 2.8);
        const halfW = w * 0.36;
        const halfH = h * 0.38;
        const scale = Math.min(halfW / (mohr.radius || 40), halfH / (mohr.radius || 40)) * 0.85;

        const originX = w / 2 - mohr.center * scale;
        const originY = h / 2;

        const toX = (s) => originX + s * scale;
        const toY = (t) => originY - t * scale;

        // Clamp originX if circle is shifted far from zero axis so axes remain visible
        let safeOriginX = originX;
        const cPixel = w / 2;
        const deltaShift = cPixel - (mohr.center * scale);
        const toXSafe = (s) => cPixel + (s - mohr.center) * scale;

        // Grid
        ctx.strokeStyle = "rgba(0, 229, 255, 0.08)";
        ctx.lineWidth = 1;
        for (let x = 0; x < w; x += 25) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }
        for (let y = 0; y < h; y += 25) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }

        // Axes
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(10, originY); ctx.lineTo(w - 10, originY); ctx.stroke();

        const zeroX = toXSafe(0);
        if (zeroX > 15 && zeroX < w - 15) {
            ctx.beginPath(); ctx.moveTo(zeroX, 10); ctx.lineTo(zeroX, h - 10); ctx.stroke();
            ctx.fillStyle = "rgba(255,255,255,0.6)";
            ctx.font = "10px 'Courier New', monospace";
            ctx.fillText("τ", zeroX + 5, 18);
        }

        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.font = "10px 'Courier New', monospace";
        ctx.fillText("σ", w - 18, originY - 6);

        // Circle
        const cX = toXSafe(mohr.center);
        const rPx = Math.max(8, mohr.radius * scale);

        ctx.beginPath();
        ctx.arc(cX, originY, rPx, 0, Math.PI * 2);
        ctx.strokeStyle = "#00e676";
        ctx.lineWidth = 2.2;
        ctx.stroke();
        ctx.fillStyle = "rgba(0, 230, 118, 0.05)";
        ctx.fill();

        // Center C
        ctx.beginPath(); ctx.arc(cX, originY, 3.5, 0, Math.PI * 2); ctx.fillStyle = "#ffffff"; ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.fillText(`C(${mohr.center.toFixed(0)})`, cX - 18, originY + 14);

        // Principal Stresses
        const s1X = toXSafe(mohr.sigma1);
        const s2X = toXSafe(mohr.sigma2);
        ctx.fillStyle = "#00e5ff";
        ctx.beginPath(); ctx.arc(s1X, originY, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillText(`σ1:${mohr.sigma1.toFixed(1)}`, Math.min(w - 58, s1X + 4), originY - 8);

        ctx.beginPath(); ctx.arc(s2X, originY, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillText(`σ2:${mohr.sigma2.toFixed(1)}`, Math.max(4, s2X - 48), originY - 8);

        // Optimal target marker if supplied (Post-Level Autopsy comparison!)
        if (optAngle !== null) {
            const optStress = StressMechanics.transform(sx, sy, txy, optAngle);
            const optX = toXSafe(optStress.sigmaTheta);
            const optY = toY(optStress.tauTheta);
            ctx.beginPath();
            ctx.setLineDash([4, 3]);
            ctx.moveTo(cX, originY);
            ctx.lineTo(optX, optY);
            ctx.strokeStyle = "#00e676";
            ctx.lineWidth = 1.8;
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.beginPath(); ctx.arc(optX, optY, 5, 0, Math.PI * 2);
            ctx.strokeStyle = "#00e676";
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Original Points X and Y
        const pX = { x: toXSafe(sx), y: toY(txy) };
        const pY = { x: toXSafe(sy), y: toY(-txy) };

        ctx.beginPath();
        ctx.moveTo(pX.x, pX.y);
        ctx.lineTo(pY.x, pY.y);
        ctx.strokeStyle = "rgba(233, 30, 99, 0.5)";
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.fillStyle = "#e91e63";
        ctx.beginPath(); ctx.arc(pX.x, pX.y, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(pY.x, pY.y, 3.5, 0, Math.PI * 2); ctx.fill();

        // Transformed Point P(sigmaTheta, tauTheta)
        const curX = toXSafe(transform.sigmaTheta);
        const curY = toY(transform.tauTheta);

        ctx.beginPath();
        ctx.moveTo(cX, originY);
        ctx.lineTo(curX, curY);
        ctx.strokeStyle = "#ff1744";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.beginPath(); ctx.arc(curX, curY, 5.5, 0, Math.PI * 2);
        ctx.fillStyle = "#ff1744";
        ctx.shadowColor = "#ff1744";
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = "#ffe600";
        ctx.font = "bold 10px 'Courier New', monospace";
        ctx.fillText(`Cut P(${transform.sigmaTheta.toFixed(1)}, ${transform.tauTheta.toFixed(1)})`, 8, h - 10);
    }

    /**
     * Reusable Canvas Renderer for Rotated 2D Stress & Strain Element
     */
    static drawElementCanvas(canvas, transform, theta, strainCut = null) {
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const w = canvas.width;
        const h = canvas.height;
        const cx = w / 2;
        const cy = h / 2;

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = "#0c111c";
        ctx.fillRect(0, 0, w, h);

        ctx.save();
        ctx.translate(cx, cy);

        // Physical element rotation by theta
        const rad = StressMechanics.degToRad(theta);
        ctx.rotate(-rad);

        const s = 54; // Half side of undeformed element

        // Draw subtle deformed strain shape overlay (exaggerated for educational clarity)
        if (strainCut) {
            const stretchX = Math.max(-12, Math.min(18, strainCut.epsTheta * 0.025));
            const stretchY = Math.max(-12, Math.min(18, strainCut.eps90 * 0.025));
            const shearSkew = Math.max(-14, Math.min(14, strainCut.gammaTheta * 0.015));

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(-s - stretchX + shearSkew, -s - stretchY);
            ctx.lineTo(s + stretchX + shearSkew, -s - stretchY);
            ctx.lineTo(s + stretchX - shearSkew, s + stretchY);
            ctx.lineTo(-s - stretchX - shearSkew, s + stretchY);
            ctx.closePath();
            ctx.fillStyle = "rgba(0, 230, 118, 0.14)";
            ctx.fill();
            ctx.strokeStyle = "#00e676";
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 3]);
            ctx.stroke();
            ctx.restore();
        }

        // Draw undeformed reference square rotated by theta
        ctx.fillStyle = "rgba(0, 229, 255, 0.12)";
        ctx.fillRect(-s, -s, s * 2, s * 2);
        ctx.strokeStyle = "#00e5ff";
        ctx.lineWidth = 2;
        ctx.strokeRect(-s, -s, s * 2, s * 2);

        // Draw Normal Stress arrows on right/left faces (sigmaTheta)
        ctx.strokeStyle = "#ff3d00";
        ctx.fillStyle = "#ff3d00";
        const len1 = Math.max(8, Math.min(40, Math.abs(transform.sigmaTheta) * 0.35));
        const dir1 = transform.sigmaTheta >= 0 ? 1 : -1;
        this.drawArrow(ctx, s, 0, s + len1 * dir1, 0);
        this.drawArrow(ctx, -s, 0, -s - len1 * dir1, 0);

        // Normal stress on perpendicular face (sigma90)
        ctx.strokeStyle = "#00e676";
        ctx.fillStyle = "#00e676";
        const len2 = Math.max(8, Math.min(40, Math.abs(transform.sigma90) * 0.35));
        const dir2 = transform.sigma90 >= 0 ? 1 : -1;
        this.drawArrow(ctx, 0, -s, 0, -s - len2 * dir2);
        this.drawArrow(ctx, 0, s, 0, s + len2 * dir2);

        // Shear arrows (tauTheta)
        if (Math.abs(transform.tauTheta) > 1) {
            ctx.strokeStyle = "#ff9100";
            ctx.fillStyle = "#ff9100";
            const dirS = transform.tauTheta >= 0 ? 1 : -1;
            this.drawArrow(ctx, s + 5, s * 0.55 * dirS, s + 5, -s * 0.55 * dirS);
            this.drawArrow(ctx, -s * 0.55 * dirS, -s - 5, s * 0.55 * dirS, -s - 5);
        }

        ctx.restore();

        // Legend & Angle labels
        ctx.fillStyle = "#ffffff";
        ctx.font = "10px 'Courier New', monospace";
        ctx.fillText(`Rotated by θ = ${theta.toFixed(1)}°`, 8, h - 10);
        if (strainCut) {
            ctx.fillStyle = "#00e676";
            ctx.fillText(`--- Deformed Strain State`, 8, 16);
        }
    }

    static drawArrow(ctx, fromX, fromY, toX, toY) {
        const headlen = 5;
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

window.StudyLab = StudyLab;
