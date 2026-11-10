/**
 * STRESS ZOMBIE APOCALYPSE - Tactical HUD & Mohr's Circle Radar
 * Renders the live Mohr's Circle, angle-doubling (2θ) dynamics, and stress dials.
 */

class TacticalHUD {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.width = this.canvas ? this.canvas.width : 280;
        this.height = this.canvas ? this.canvas.height : 280;

        this.dialAngle = 0; // Current cut angle theta in degrees [0, 180)
        this.isDraggingDial = false;
        this.targetZombie = null;
        
        // Setup internal interactions
        this.setupEventListeners();
    }

    setupEventListeners() {
        const dialCanvas = document.getElementById("dialCanvas");
        if (!dialCanvas) return;

        const updateFromPointer = (e) => {
            const rect = dialCanvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;

            const dx = clientX - cx;
            const dy = clientY - cy;

            // Compute angle counter-clockwise from positive x-axis (right)
            let angleRad = Math.atan2(-dy, dx);
            let angleDeg = (angleRad * 180) / Math.PI;
            if (angleDeg < 0) angleDeg += 360;
            // Physical plane normal in [0, 180)
            let planeAngle = angleDeg % 180;
            this.setAngle(planeAngle);
        };

        const onDown = (e) => {
            this.isDraggingDial = true;
            updateFromPointer(e);
        };

        const onMove = (e) => {
            if (this.isDraggingDial) {
                updateFromPointer(e);
            }
        };

        const onUp = () => {
            this.isDraggingDial = false;
        };

        dialCanvas.addEventListener("mousedown", onDown);
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);

        dialCanvas.addEventListener("touchstart", onDown, { passive: false });
        window.addEventListener("touchmove", onMove, { passive: false });
        window.addEventListener("touchend", onUp);

        // Interactive Mohr's circle click & drag aiming
        if (this.canvas) {
            let isDraggingMohr = false;
            const aimFromMohrPointer = (e) => {
                if (!this.targetZombie) return;
                const rect = this.canvas.getBoundingClientRect();
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                const clickX = (clientX - rect.left) * (this.width / rect.width);
                const clickY = (clientY - rect.top) * (this.height / rect.height);

                const mohr = StressMechanics.getMohrCircle(this.targetZombie.sx, this.targetZombie.sy, this.targetZombie.txy);
                const scale = (this.width * 0.36) / Math.max(45, mohr.radius * 1.4);
                const centerCanvasX = this.width / 2 - (mohr.center - 50) * scale * 0.15;
                const centerCanvasY = this.height / 2;

                const dx = clickX - centerCanvasX;
                const dy = -(clickY - centerCanvasY); // Mathematical +tau is upward

                const phiX = Math.atan2(this.targetZombie.txy, (this.targetZombie.sx - this.targetZombie.sy) / 2);
                const phiP = Math.atan2(dy, dx);
                const theta = StressMechanics.normalize180(((phiX - phiP) * 180) / (2 * Math.PI));
                this.setAngle(theta);
            };

            this.canvas.addEventListener("mousedown", (e) => {
                isDraggingMohr = true;
                aimFromMohrPointer(e);
            });
            window.addEventListener("mousemove", (e) => {
                if (isDraggingMohr) aimFromMohrPointer(e);
            });
            window.addEventListener("mouseup", () => {
                isDraggingMohr = false;
            });
        }
    }

    setAngle(angleDeg) {
        this.dialAngle = StressMechanics.normalize180(angleDeg);
        
        // Update slider input if exists
        const slider = document.getElementById("angleSlider");
        if (slider && Math.abs(slider.value - this.dialAngle) > 0.5) {
            slider.value = this.dialAngle.toFixed(1);
        }

        // Play subtle sound tick based on proximity
        if (window.soundController && this.targetZombie) {
            const prox = StressMechanics.getProximityScore(this.targetZombie, this.dialAngle);
            if (Math.random() < 0.25) {
                window.soundController.playDialTick(prox);
            }
        }

        this.renderDial();
        this.renderMohrRadar();
        this.renderStressCurve();
    }

    setTargetZombie(zombie) {
        this.targetZombie = zombie;
        this.renderDial();
        this.renderMohrRadar();
        this.renderStressCurve();
    }

    /**
     * Render Rotary Plane-Cutter Dial Canvas
     */
    renderDial() {
        const dialCanvas = document.getElementById("dialCanvas");
        if (!dialCanvas) return;
        const dCtx = dialCanvas.getContext("2d");
        const w = dialCanvas.width;
        const h = dialCanvas.height;
        const cx = w / 2;
        const cy = h / 2;
        const r = Math.min(w, h) * 0.44;

        dCtx.clearRect(0, 0, w, h);

        const prox = this.targetZombie ? StressMechanics.getProximityScore(this.targetZombie, this.dialAngle) : 0;

        // Dial outer rim glowing based on proximity (Cold blue -> Warm amber -> Fiery neon green/gold)
        let glowColor = "rgba(0, 229, 255, 0.45)";
        let strokeColor = "#00e5ff";
        if (prox > 0.85) {
            glowColor = "rgba(0, 255, 128, 0.85)";
            strokeColor = "#00e676";
        } else if (prox > 0.45) {
            glowColor = "rgba(255, 234, 0, 0.65)";
            strokeColor = "#ffea00";
        }

        dCtx.save();

        // Outer 3D Machined Titanium Bezel Rim (top-left bright rim -> bottom-right recessed dark)
        const bezelGrad = dCtx.createLinearGradient(cx - r - 6, cy - r - 6, cx + r + 6, cy + r + 6);
        bezelGrad.addColorStop(0, "#475569");
        bezelGrad.addColorStop(0.45, "#1e293b");
        bezelGrad.addColorStop(1, "#070b12");
        dCtx.beginPath();
        dCtx.arc(cx, cy, r + 5.5, 0, Math.PI * 2);
        dCtx.fillStyle = bezelGrad;
        dCtx.fill();

        // Brushed Dark Steel Recessed Dial Housing
        dCtx.shadowColor = glowColor;
        dCtx.shadowBlur = 14;
        const faceGrad = dCtx.createRadialGradient(cx - r * 0.25, cy - r * 0.25, 8, cx, cy, r);
        faceGrad.addColorStop(0, "#151f2e");
        faceGrad.addColorStop(0.65, "#0b111c");
        faceGrad.addColorStop(1, "#05080f");
        dCtx.beginPath();
        dCtx.arc(cx, cy, r, 0, Math.PI * 2);
        dCtx.fillStyle = faceGrad;
        dCtx.fill();
        dCtx.strokeStyle = strokeColor;
        dCtx.lineWidth = 2.4;
        dCtx.stroke();
        dCtx.shadowBlur = 0;

        // Subtle recessed inner track groove
        dCtx.beginPath();
        dCtx.arc(cx, cy, r - 9, 0, Math.PI * 2);
        dCtx.strokeStyle = "rgba(148, 163, 184, 0.14)";
        dCtx.lineWidth = 1;
        dCtx.stroke();

        // Degree ticks (every 15 and 45 degrees)
        for (let a = 0; a < 360; a += 15) {
            const rad = StressMechanics.degToRad(a);
            const isMajor = a % 45 === 0;
            const tickLen = isMajor ? 10 : 5;
            const x1 = cx + (r - tickLen) * Math.cos(rad);
            const y1 = cy - (r - tickLen) * Math.sin(rad);
            const x2 = cx + r * Math.cos(rad);
            const y2 = cy - r * Math.sin(rad);

            dCtx.beginPath();
            dCtx.moveTo(x1, y1);
            dCtx.lineTo(x2, y2);
            dCtx.strokeStyle = isMajor ? "#f1f5f9" : "rgba(180, 210, 235, 0.28)";
            dCtx.lineWidth = isMajor ? 2 : 1;
            dCtx.stroke();
        }

        // Compute target Mohr alignment for handle lock indicator using StressMechanics as single source of truth
        let targetAngle = 0;
        let angleDiff = 0;
        let isAligned = false;
        let isWarm = false;
        if (this.targetZombie) {
            const evalCur = StressMechanics.evaluateAttack(this.targetZombie, this.dialAngle);
            targetAngle = evalCur.optimalAngle;
            angleDiff = targetAngle - this.dialAngle;
            if (angleDiff > 90) angleDiff -= 180;
            if (angleDiff < -90) angleDiff += 180;
            isAligned = !evalCur.isDeflected;
            isWarm = !isAligned && Math.abs(angleDiff) <= 22;
        }

        // Optimal gun-handle lock zone
        const showZoneHint = !!this.targetZombie;
        if (showZoneHint) {
            const optRad = StressMechanics.degToRad(targetAngle);
            const tolRad = StressMechanics.degToRad(7.5);
            dCtx.save();
            dCtx.beginPath();
            dCtx.arc(cx, cy, r - 4, -optRad - tolRad, -optRad + tolRad, false);
            dCtx.strokeStyle = "rgba(0, 230, 118, 0.9)";
            dCtx.lineWidth = 5;
            dCtx.stroke();

            dCtx.beginPath();
            dCtx.moveTo(cx - r * Math.cos(optRad), cy + r * Math.sin(optRad));
            dCtx.lineTo(cx + r * Math.cos(optRad), cy - r * Math.sin(optRad));
            dCtx.strokeStyle = "rgba(0, 230, 118, 0.55)";
            dCtx.lineWidth = 2;
            dCtx.setLineDash([5, 4]);
            dCtx.stroke();
            dCtx.setLineDash([]);
            dCtx.restore();
        }

        // Mechanical 3D Sculpted Machine-Gun Handling Lever Arm & Glossy Grip Knob
        const planeRad = StressMechanics.degToRad(this.dialAngle);
        const handleColor = isAligned ? "#00e676" : (isWarm ? "#ff9100" : "#ff1744");

        dCtx.save();
        dCtx.translate(cx, cy);
        dCtx.rotate(-planeRad);

        // Counter-balance 3D tail lug
        const lugGrad = dCtx.createLinearGradient(0, -4, 0, 4);
        lugGrad.addColorStop(0, "#475569");
        lugGrad.addColorStop(1, "#0f172a");
        dCtx.fillStyle = lugGrad;
        dCtx.strokeStyle = "#64748b";
        dCtx.lineWidth = 1.4;
        dCtx.fillRect(-r + 4, -4, r - 6, 8);
        dCtx.strokeRect(-r + 4, -4, r - 6, 8);

        // Forward machined gun-handle 3D crank bar
        const armGrad = dCtx.createLinearGradient(0, -5, 0, 5);
        armGrad.addColorStop(0, "#475569");
        armGrad.addColorStop(0.45, "#263344");
        armGrad.addColorStop(1, "#0f172a");
        dCtx.fillStyle = armGrad;
        dCtx.strokeStyle = handleColor;
        dCtx.lineWidth = 2;
        dCtx.shadowColor = handleColor;
        dCtx.shadowBlur = isAligned ? 14 : 7;
        dCtx.fillRect(0, -5, r - 6, 10);
        dCtx.strokeRect(0, -5, r - 6, 10);
        dCtx.shadowBlur = 0;

        // Directional barrel pointer tip
        dCtx.beginPath();
        dCtx.moveTo(r + 2.5, 0);
        dCtx.lineTo(r - 9, -6);
        dCtx.lineTo(r - 9, 6);
        dCtx.closePath();
        dCtx.fillStyle = handleColor;
        dCtx.fill();

        // 3D Spherical Knurled Trigger-Handle Grip Knob with Specular Shine
        const gripGrad = dCtx.createRadialGradient(r - 6, -2.5, 1, r - 4, 0, 8);
        gripGrad.addColorStop(0, "#ffffff");
        gripGrad.addColorStop(0.35, isAligned ? "#00e676" : "#ffe600");
        gripGrad.addColorStop(1, isAligned ? "#045b2f" : "#92400e");
        dCtx.beginPath();
        dCtx.arc(r - 4, 0, 7.6, 0, Math.PI * 2);
        dCtx.fillStyle = gripGrad;
        dCtx.fill();
        dCtx.strokeStyle = "#090d14";
        dCtx.lineWidth = 2;
        dCtx.stroke();
        dCtx.restore();

        // 3D Machined Center Hub + Glass Lens Reflection Sheen
        const hubGrad = dCtx.createRadialGradient(cx - 8, cy - 8, 2, cx, cy, 32);
        hubGrad.addColorStop(0, isAligned ? "#0d3826" : "#1f2a3d");
        hubGrad.addColorStop(1, isAligned ? "#06140e" : "#0b1018");
        dCtx.beginPath();
        dCtx.arc(cx, cy, 31.5, 0, Math.PI * 2);
        dCtx.fillStyle = hubGrad;
        dCtx.fill();
        dCtx.strokeStyle = strokeColor;
        dCtx.lineWidth = 2;
        dCtx.stroke();

        // Subtle curved glass lens highlight over dial top
        dCtx.beginPath();
        dCtx.arc(cx, cy, r - 3, Math.PI * 1.15, Math.PI * 1.85);
        dCtx.strokeStyle = "rgba(255, 255, 255, 0.16)";
        dCtx.lineWidth = 2.2;
        dCtx.stroke();

        dCtx.fillStyle = "#ffffff";
        dCtx.font = "bold 12px 'Courier New', monospace";
        dCtx.textAlign = "center";
        dCtx.textBaseline = "middle";
        dCtx.fillText(`θ: ${this.dialAngle.toFixed(0)}°`, cx, cy - 10);

        dCtx.fillStyle = "#00e5ff";
        dCtx.font = "10px 'Courier New', monospace";
        dCtx.fillText(`2θ: ${(this.dialAngle * 2).toFixed(0)}°`, cx, cy + 2);

        dCtx.fillStyle = isAligned ? "#00e676" : "#ff5252";
        dCtx.font = "bold 9px 'Courier New', monospace";
        dCtx.fillText(this.targetZombie ? (isAligned ? "ARMED" : "LOCKED") : "IDLE", cx, cy + 14);

        dCtx.restore();

        // Update textual readouts in HUD
        const thetaDisp = document.getElementById("readoutTheta");
        if (thetaDisp) thetaDisp.textContent = `${this.dialAngle.toFixed(1)}°`;
        const twoThetaDisp = document.getElementById("readoutTwoTheta");
        if (twoThetaDisp) twoThetaDisp.textContent = `${(this.dialAngle * 2).toFixed(1)}°`;

        const proximityBadge = document.getElementById("proximityBadge");
        const fireBtn = document.getElementById("fireBtn");

        if (this.targetZombie) {
            if (proximityBadge) {
                if (isAligned) {
                    proximityBadge.textContent = "🟢 ARMED [SPACE]";
                    proximityBadge.className = "prox-badge lock";
                    if (fireBtn) {
                        fireBtn.textContent = "🔥 FIRE GUN [SPACE]";
                        fireBtn.style.background = "linear-gradient(135deg, #00e676 0%, #00703c 100%)";
                        fireBtn.style.borderColor = "#00ff88";
                        fireBtn.style.boxShadow = "0 0 20px rgba(0, 230, 118, 0.7)";
                    }
                } else if (isWarm) {
                    const dirStr = angleDiff > 0 ? "TURN [D] ➔" : "⬅ TURN [A]";
                    proximityBadge.textContent = `🟡 ${dirStr} (${Math.abs(angleDiff).toFixed(1)}°)`;
                    proximityBadge.className = "prox-badge warm";
                    if (fireBtn) {
                        fireBtn.textContent = `🔒 LOCKED — ${dirStr}`;
                        fireBtn.style.background = "linear-gradient(135deg, #ff9100 0%, #995200 100%)";
                        fireBtn.style.borderColor = "#ff9100";
                        fireBtn.style.boxShadow = "0 0 10px rgba(255, 145, 0, 0.4)";
                    }
                } else {
                    const dirStr = angleDiff > 0 ? "TURN [D] ➔" : "⬅ TURN [A]";
                    proximityBadge.textContent = `🔴 ${dirStr} → ${targetAngle.toFixed(1)}°`;
                    proximityBadge.className = "prox-badge cold";
                    if (fireBtn) {
                        fireBtn.textContent = `🔒 GUN LOCKED — ${dirStr}`;
                        fireBtn.style.background = "linear-gradient(135deg, #37474f 0%, #1c1f24 100%)";
                        fireBtn.style.borderColor = "#ff1744";
                        fireBtn.style.boxShadow = "none";
                    }
                }
            }
        } else {
            if (proximityBadge) {
                proximityBadge.textContent = "⏳ WAIT FOR ZOMBIE";
                proximityBadge.className = "prox-badge cold";
            }
            if (fireBtn) {
                fireBtn.textContent = "⏳ WAIT FOR ZOMBIE ON SCREEN";
                fireBtn.style.background = "linear-gradient(135deg, #263238 0%, #141a21 100%)";
                fireBtn.style.borderColor = "#455a64";
                fireBtn.style.boxShadow = "none";
            }
        }
    }

    /**
     * Render the Live Mohr's Circle Radar HUD
     */
    renderMohrRadar() {
        if (!this.ctx) return;
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;

        ctx.clearRect(0, 0, w, h);

        // Background 3D holographic radar depth + vignette
        const radBg = ctx.createRadialGradient(w * 0.5, h * 0.5, 16, w * 0.5, h * 0.5, w * 0.65);
        radBg.addColorStop(0, "#0b1422");
        radBg.addColorStop(1, "#040810");
        ctx.fillStyle = radBg;
        ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = "rgba(0, 229, 255, 0.08)";
        ctx.lineWidth = 1;
        const step = 20;
        for (let x = 0; x < w; x += step) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        for (let y = 0; y < h; y += step) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }
        // Subtle radar range rings centered around viewport
        ctx.strokeStyle = "rgba(0, 229, 255, 0.05)";
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, w * 0.24, 0, Math.PI * 2);
        ctx.arc(w / 2, h / 2, w * 0.42, 0, Math.PI * 2);
        ctx.stroke();

        if (!this.targetZombie) {
            ctx.fillStyle = "#546e7a";
            ctx.font = "12px 'Courier New', monospace";
            ctx.textAlign = "center";
            ctx.fillText("WAIT FOR ZOMBIE", w / 2, h / 2);
            return;
        }

        const { sx, sy, txy } = this.targetZombie;
        const mohr = StressMechanics.getMohrCircle(sx, sy, txy);
        const transform = StressMechanics.transform(sx, sy, txy, this.dialAngle);

        // Coordinate scaling to fit radar canvas (strictly synced with aimFromMohrPointer)
        const scale = (w * 0.36) / Math.max(45, mohr.radius * 1.4);

        // Center coordinates on canvas
        const originX = w / 2 - (mohr.center - 50) * scale * 0.15;
        const originY = h / 2;

        const toCanvasX = (sigma) => originX + (sigma - mohr.center) * scale;
        const toCanvasY = (tau) => originY - tau * scale; // Standard clockwise positive or mathematical convention

        // Draw Axes (sigma horizontal, tau vertical)
        ctx.strokeStyle = "rgba(255, 255, 255, 0.32)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(10, originY);
        ctx.lineTo(w - 10, originY);
        ctx.stroke();

        const zeroX = toCanvasX(0);
        if (zeroX >= 10 && zeroX <= w - 10) {
            ctx.beginPath();
            ctx.moveTo(zeroX, 10);
            ctx.lineTo(zeroX, h - 10);
            ctx.stroke();
        }

        // Axis labels
        ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
        ctx.font = "10px 'Courier New', monospace";
        ctx.textAlign = "right";
        ctx.fillText("σ (Normal)", w - 8, originY - 6);
        ctx.textAlign = "center";
        ctx.fillText("τ (Shear)", zeroX > 25 && zeroX < w - 25 ? zeroX : 35, 15);

        // Draw Mohr's Circle with 3D holographic inner sphere depth
        const circleCenterX = toCanvasX(mohr.center);
        const circleRadiusPx = mohr.radius * scale;

        ctx.save();
        const sphereTint = ctx.createRadialGradient(
            circleCenterX - circleRadiusPx * 0.25, originY - circleRadiusPx * 0.25, 4,
            circleCenterX, originY, Math.max(8, circleRadiusPx)
        );
        sphereTint.addColorStop(0, "rgba(0, 230, 118, 0.14)");
        sphereTint.addColorStop(0.65, "rgba(0, 229, 255, 0.05)");
        sphereTint.addColorStop(1, "rgba(0, 230, 118, 0.11)");
        ctx.beginPath();
        ctx.arc(circleCenterX, originY, circleRadiusPx, 0, Math.PI * 2);
        ctx.fillStyle = sphereTint;
        ctx.fill();
        ctx.strokeStyle = "#00e676";
        ctx.lineWidth = 2.4;
        ctx.shadowColor = "#00e676";
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();

        // Draw Center Point C
        ctx.beginPath();
        ctx.arc(circleCenterX, originY, 3.8, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.fillStyle = "#b0bec5";
        ctx.font = "9px 'Courier New', monospace";
        ctx.fillText(`C:${mohr.center.toFixed(0)}`, circleCenterX, originY + 12);

        // Draw Principal Stresses sigma1 and sigma2 on horizontal axis
        const s1X = toCanvasX(mohr.sigma1);
        const s2X = toCanvasX(mohr.sigma2);

        // 3D Sphere Node helper
        const drawSphereNode = (nx, ny, radius, hiCol, baseCol) => {
            const g = ctx.createRadialGradient(nx - radius * 0.35, ny - radius * 0.35, 0.5, nx, ny, radius);
            g.addColorStop(0, "#ffffff");
            g.addColorStop(0.45, hiCol);
            g.addColorStop(1, baseCol);
            ctx.beginPath();
            ctx.arc(nx, ny, radius, 0, Math.PI * 2);
            ctx.fillStyle = g;
            ctx.fill();
        };

        drawSphereNode(s1X, originY, 4.5, "#00e5ff", "#006980");
        ctx.fillStyle = "#00e5ff";
        ctx.fillText(`σ1:${mohr.sigma1.toFixed(0)}`, s1X + 4, originY - 6);

        drawSphereNode(s2X, originY, 4.5, "#00e5ff", "#006980");
        ctx.fillStyle = "#00e5ff";
        ctx.fillText(`σ2:${mohr.sigma2.toFixed(0)}`, s2X - 4, originY - 6);

        // Draw Max Shear tauMax at peak
        const tauMaxY = toCanvasY(mohr.tauMax);
        drawSphereNode(circleCenterX, tauMaxY, 4.5, "#ff9100", "#7c2d12");
        ctx.fillStyle = "#ff9100";
        ctx.fillText(`τ_max:${mohr.tauMax.toFixed(0)}`, circleCenterX, tauMaxY - 6);

        // Original stress reference line: Connect Point X(sx, txy) and Y(sy, -txy)
        const ptX = { x: toCanvasX(sx), y: toCanvasY(txy) };
        const ptY = { x: toCanvasX(sy), y: toCanvasY(-txy) };

        ctx.beginPath();
        ctx.moveTo(ptX.x, ptX.y);
        ctx.lineTo(ptY.x, ptY.y);
        ctx.strokeStyle = "rgba(233, 30, 99, 0.72)";
        ctx.lineWidth = 1.6;
        ctx.stroke();

        drawSphereNode(ptX.x, ptX.y, 4.0, "#f43f5e", "#881337");
        ctx.fillStyle = "#fb7185";
        ctx.fillText(`X(${sx},${txy})`, ptX.x + 8, ptX.y + 4);

        drawSphereNode(ptY.x, ptY.y, 4.0, "#f43f5e", "#881337");
        ctx.fillStyle = "#fb7185";
        ctx.fillText(`Y(${sy},${-txy})`, ptY.x - 8, ptY.y + 4);

        // Transformed Stress Point P(sigma_theta, tau_theta) corresponding to gun handle dialAngle
        const ptP = {
            x: toCanvasX(transform.sigmaTheta),
            y: toCanvasY(transform.tauTheta)
        };

        const evalRes = StressMechanics.evaluateAttack(this.targetZombie, this.dialAngle);
        const handleAligned = !evalRes.isDeflected;

        // Highlight exact required target zone(s) on Mohr's circle (AIM HANDLE HERE)
        const highlightTargetNode = (tx, ty) => {
            ctx.save();
            ctx.beginPath();
            ctx.arc(tx, ty, 9.5, 0, Math.PI * 2);
            ctx.strokeStyle = handleAligned ? "#00e676" : "#00e5ff";
            ctx.lineWidth = 2.2;
            ctx.setLineDash([3, 2]);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
        };

        const isShearTarget = !this.targetZombie.isSoaked && (
            this.targetZombie.type === "ductile" ||
            (this.targetZombie.type === "shapeshifter" && this.targetZombie.currentPhase === "shear")
        );
        if (isShearTarget) {
            highlightTargetNode(circleCenterX, toCanvasY(mohr.tauMax));
            highlightTargetNode(circleCenterX, toCanvasY(-mohr.tauMax));
        } else {
            highlightTargetNode(s1X, originY);
        }

        // Radial arm from Center C to current handle point P
        ctx.beginPath();
        ctx.moveTo(circleCenterX, originY);
        ctx.lineTo(ptP.x, ptP.y);
        ctx.strokeStyle = handleAligned ? "#00e676" : "#ff1744";
        ctx.lineWidth = 2.6;
        ctx.stroke();

        // Arc showing 2*theta sweep from original face X to current point P
        const cAngleX = Math.atan2(ptX.y - originY, ptX.x - circleCenterX);
        const cAngleP = Math.atan2(ptP.y - originY, ptP.x - circleCenterX);

        ctx.beginPath();
        ctx.arc(circleCenterX, originY, Math.min(24, circleRadiusPx * 0.4), cAngleX, cAngleP, false);
        ctx.strokeStyle = "#ffe600";
        ctx.lineWidth = 2;
        ctx.stroke();

        // 3D Spherical Point P marker with glowing bloom
        ctx.save();
        ctx.shadowColor = handleAligned ? "#00e676" : "#ff1744";
        ctx.shadowBlur = 12;
        drawSphereNode(
            ptP.x, ptP.y, 6.2,
            handleAligned ? "#00e676" : "#ff1744",
            handleAligned ? "#045b2f" : "#7f1d1d"
        );
        ctx.shadowBlur = 0;
        ctx.restore();

        // Current stress readouts at top of radar
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 10px 'Courier New', monospace";
        ctx.textAlign = "left";
        ctx.fillText(`σθ: ${transform.sigmaTheta.toFixed(1)} MPa`, 8, 14);
        ctx.fillStyle = "#ff9100";
        ctx.fillText(`τθ: ${transform.tauTheta.toFixed(1)} MPa`, 8, 28);
        ctx.fillStyle = "#00e5ff";
        ctx.fillText(`2θ = ${(this.dialAngle * 2).toFixed(1)}°`, 8, 42);

        // Gun handle lock state footer inside Mohr radar
        ctx.fillStyle = handleAligned ? "#00e676" : "#ff5252";
        ctx.font = "bold 10px 'Courier New', monospace";
        ctx.fillText(handleAligned ? "✓ ARMED — FIRE [SPACE]" : "✗ AIM P ONTO TARGET RING", 8, h - 10);

        // Target goal hint
        ctx.textAlign = "right";
        if (isShearTarget) {
            ctx.fillStyle = "#ff9100";
            ctx.fillText("AIM: τmax (Shear)", w - 8, 14);
        } else if (this.targetZombie.type === "boss") {
            ctx.fillStyle = "#ff1744";
            ctx.fillText("AIM: von Mises", w - 8, 14);
        } else {
            ctx.fillStyle = "#00e5ff";
            ctx.fillText("AIM: σ1 (Tension)", w - 8, 14);
        }
    }

    /**
     * Render the Stress Transformation Curves vs Angle (Figure 2 in GDD)
     */
    renderStressCurve() {
        const curveCanvas = document.getElementById("curveCanvas");
        if (!curveCanvas) return;
        const cCtx = curveCanvas.getContext("2d");
        const w = curveCanvas.width;
        const h = curveCanvas.height;

        cCtx.clearRect(0, 0, w, h);
        const curveBg = cCtx.createLinearGradient(0, 0, 0, h);
        curveBg.addColorStop(0, "#0b1322");
        curveBg.addColorStop(1, "#040810");
        cCtx.fillStyle = curveBg;
        cCtx.fillRect(0, 0, w, h);

        if (!this.targetZombie) {
            cCtx.fillStyle = "#546e7a";
            cCtx.font = "10px 'Courier New', monospace";
            cCtx.textAlign = "center";
            cCtx.fillText("WAITING FOR ZOMBIE ON SCREEN...", w / 2, h / 2 + 3);
            return;
        }

        const { sx, sy, txy } = this.targetZombie;
        const mohr = StressMechanics.getMohrCircle(sx, sy, txy);

        const maxStress = Math.max(10, mohr.sigma1, mohr.tauMax) * 1.15;
        const minStress = Math.min(0, mohr.sigma2) * 1.15;
        const stressRange = Math.max(20, maxStress - minStress);

        const mapX = (deg) => 30 + (deg / 180) * (w - 45);
        const mapY = (val) => h - 22 - ((val - minStress) / stressRange) * (h - 38);

        // Zero line
        const zeroY = mapY(0);
        cCtx.strokeStyle = "rgba(255, 255, 255, 0.22)";
        cCtx.lineWidth = 1;
        cCtx.beginPath();
        cCtx.moveTo(25, zeroY);
        cCtx.lineTo(w - 10, zeroY);
        cCtx.stroke();

        // Translucent area shading under Normal Stress sigma(theta)
        cCtx.beginPath();
        cCtx.moveTo(mapX(0), zeroY);
        for (let deg = 0; deg <= 180; deg += 2) {
            const res = StressMechanics.transform(sx, sy, txy, deg);
            cCtx.lineTo(mapX(deg), mapY(res.sigmaTheta));
        }
        cCtx.lineTo(mapX(180), zeroY);
        cCtx.closePath();
        cCtx.fillStyle = "rgba(0, 229, 255, 0.08)";
        cCtx.fill();

        // Plot Normal Stress Curve sigma(theta) (Cyan curve)
        cCtx.beginPath();
        for (let deg = 0; deg <= 180; deg += 2) {
            const res = StressMechanics.transform(sx, sy, txy, deg);
            const x = mapX(deg);
            const y = mapY(res.sigmaTheta);
            if (deg === 0) cCtx.moveTo(x, y);
            else cCtx.lineTo(x, y);
        }
        cCtx.strokeStyle = "#00e5ff";
        cCtx.lineWidth = 2.2;
        cCtx.stroke();

        // Translucent area shading under |tau(theta)|
        cCtx.beginPath();
        cCtx.moveTo(mapX(0), zeroY);
        for (let deg = 0; deg <= 180; deg += 2) {
            const res = StressMechanics.transform(sx, sy, txy, deg);
            cCtx.lineTo(mapX(deg), mapY(Math.abs(res.tauTheta)));
        }
        cCtx.lineTo(mapX(180), zeroY);
        cCtx.closePath();
        cCtx.fillStyle = "rgba(255, 145, 0, 0.08)";
        cCtx.fill();

        // Plot Shear Stress Curve |tau(theta)| (Orange curve)
        cCtx.beginPath();
        for (let deg = 0; deg <= 180; deg += 2) {
            const res = StressMechanics.transform(sx, sy, txy, deg);
            const x = mapX(deg);
            const y = mapY(Math.abs(res.tauTheta));
            if (deg === 0) cCtx.moveTo(x, y);
            else cCtx.lineTo(x, y);
        }
        cCtx.strokeStyle = "#ff9100";
        cCtx.lineWidth = 2.2;
        cCtx.stroke();

        // Current dial angle indicator vertical scan bar
        const curX = mapX(this.dialAngle);
        cCtx.beginPath();
        cCtx.moveTo(curX, 10);
        cCtx.lineTo(curX, h - 20);
        cCtx.strokeStyle = "#ff1744";
        cCtx.lineWidth = 1.9;
        cCtx.setLineDash([4, 3]);
        cCtx.stroke();
        cCtx.setLineDash([]);

        // Legend
        cCtx.font = "9px 'Courier New', monospace";
        cCtx.fillStyle = "#00e5ff";
        cCtx.fillText("— σθ (Normal)", 32, 14);
        cCtx.fillStyle = "#ff9100";
        cCtx.fillText("— |τθ| (Shear)", 125, 14);

        // X-axis degree ticks
        cCtx.fillStyle = "rgba(255, 255, 255, 0.55)";
        cCtx.fillText("0°", mapX(0) - 4, h - 6);
        cCtx.fillText("45°", mapX(45) - 6, h - 6);
        cCtx.fillText("90°", mapX(90) - 6, h - 6);
        cCtx.fillText("135°", mapX(135) - 8, h - 6);
        cCtx.fillText("180°", mapX(180) - 10, h - 6);
    }
}

window.TacticalHUD = TacticalHUD;

