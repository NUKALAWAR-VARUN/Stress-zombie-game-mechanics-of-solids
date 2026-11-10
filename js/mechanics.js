/**
 * STRESS ZOMBIE APOCALYPSE - Solid Mechanics Core Engine
 * Based on APL104 Solid Mechanics (Lectures 4, 7-10, 31-32)
 * Course: Solid Mechanics for Undergraduates (IIT Delhi)
 */

class StressMechanics {
    static degToRad(deg) {
        return (deg * Math.PI) / 180;
    }

    static radToDeg(rad) {
        let deg = (rad * 180) / Math.PI;
        deg = deg % 360;
        if (deg < 0) deg += 360;
        return deg;
    }

    static normalize180(deg) {
        let d = deg % 180;
        if (d < 0) d += 180;
        return d;
    }

    /**
     * Calculate 2D stress state on a cutting plane inclined at angle theta (in degrees)
     * Positive theta is counter-clockwise from the positive x-axis.
     */
    static transform(sx, sy, txy, thetaDeg) {
        const thetaRad = this.degToRad(thetaDeg);
        const twoTheta = 2 * thetaRad;

        const avg = (sx + sy) / 2;
        const diffHalf = (sx - sy) / 2;

        const sigmaTheta = avg + diffHalf * Math.cos(twoTheta) + txy * Math.sin(twoTheta);
        const tauTheta = -diffHalf * Math.sin(twoTheta) + txy * Math.cos(twoTheta);

        const sigma90 = sx + sy - sigmaTheta;
        const tau90 = -tauTheta;

        return {
            theta: this.normalize180(thetaDeg),
            twoThetaRad: twoTheta,
            sigmaTheta: sigmaTheta,
            tauTheta: tauTheta,
            sigma90: sigma90,
            tau90: tau90,
            I1: sx + sy
        };
    }

    /**
     * Computes Mohr's circle geometry and principal stresses
     */
    static getMohrCircle(sx, sy, txy) {
        const C = (sx + sy) / 2;
        const diffHalf = (sx - sy) / 2;
        const R = Math.sqrt(diffHalf * diffHalf + txy * txy);

        const sigma1 = C + R; // Maximum principal stress
        const sigma2 = C - R; // Minimum principal stress
        const tauMax = R;     // Maximum in-plane shear stress

        let twoThetaP_rad = Math.atan2(2 * txy, sx - sy);
        let thetaP1_deg = (twoThetaP_rad * 180) / (2 * Math.PI);
        thetaP1_deg = this.normalize180(thetaP1_deg);

        const test1 = this.transform(sx, sy, txy, thetaP1_deg);
        let thetaP_max = thetaP1_deg;
        let thetaP_min = this.normalize180(thetaP1_deg + 90);

        if (Math.abs(test1.sigmaTheta - sigma1) > 0.01) {
            const temp = thetaP_max;
            thetaP_max = thetaP_min;
            thetaP_min = temp;
        }

        const thetaS1_deg = this.normalize180(thetaP_max + 45);
        const thetaS2_deg = this.normalize180(thetaP_max - 45 + 180);

        const I1 = sx + sy;
        const I2 = sx * sy - txy * txy;
        const vonMises = Math.sqrt(sx * sx - sx * sy + sy * sy + 3 * txy * txy);
        const hydrostatic = (sx + sy) / 2;

        return {
            sx,
            sy,
            txy,
            center: C,
            radius: R,
            sigma1,
            sigma2,
            tauMax,
            thetaP_max,
            thetaP_min,
            thetaS1: thetaS1_deg,
            thetaS2: thetaS2_deg,
            I1,
            I2,
            vonMises,
            hydrostatic,
            pointX: { sigma: sx, tau: txy },
            pointY: { sigma: sy, tau: -txy }
        };
    }

    static angleDiff180(a, b) {
        const normA = this.normalize180(a);
        const normB = this.normalize180(b);
        let diff = Math.abs(normA - normB);
        if (diff > 90) diff = 180 - diff;
        return diff;
    }

    /**
     * STRICT CRITICAL ANGLE EVALUATION:
     * Attacks ONLY succeed if cut angle aligns with the failure plane (within ±8° window).
     * Off-angle cuts deflect with zero damage and explain why!
     */
    static evaluateAttack(zombie, playerAngleDeg) {
        const { sx, sy, txy, type } = zombie;
        const mohr = this.getMohrCircle(sx, sy, txy);
        const currentStress = this.transform(sx, sy, txy, playerAngleDeg);

        const ALIGN_TOLERANCE_DEG = 7.5; // Strict alignment threshold
        let optimalAngle = 0;
        let effectiveDamage = 0;
        let accuracyRatio = 0;
        let theoryName = "";
        let feedback = "";
        let isCrit = false;
        let isDeflected = false;
        let angDiff = 0;

        switch (type) {
            case "brittle": {
                // Brittle: Rankine Max Normal Stress Criterion (sigma1)
                theoryName = "Rankine Criterion (Max Tensile Normal Stress)";
                optimalAngle = mohr.thetaP_max;
                angDiff = this.angleDiff180(playerAngleDeg, optimalAngle);

                if (angDiff <= ALIGN_TOLERANCE_DEG) {
                    // SUCCESSFUL CLEAVE: Stress reaches critical tensile failure threshold
                    accuracyRatio = Math.max(0, 1 - angDiff / ALIGN_TOLERANCE_DEG);
                    effectiveDamage = 110 + (accuracyRatio * 30);
                    if (angDiff <= 2.5) {
                        isCrit = true;
                        effectiveDamage *= 1.5;
                    }
                    feedback = `CRITICAL FAILURE TRIGGERED! You cut at θ = ${playerAngleDeg.toFixed(1)}° (Mohr 2θ = ${(playerAngleDeg * 2).toFixed(1)}°). Tensile stress σθ = ${currentStress.sigmaTheta.toFixed(1)} MPa exceeded yield!`;
                } else {
                    // DEFLECTED: Stress on this plane is too low to cause fracture!
                    isDeflected = true;
                    effectiveDamage = 0;
                    feedback = `BLADE DEFLECTED! At θ = ${playerAngleDeg.toFixed(1)}°, normal stress is only ${currentStress.sigmaTheta.toFixed(1)} MPa. You need ${mohr.sigma1.toFixed(1)} MPa at principal plane θp = ${optimalAngle.toFixed(1)}°! Press A/D to rotate!`;
                }
                break;
            }

            case "ductile": {
                // Ductile: Tresca Max Shear Criterion (tau_max at theta_p + 45 deg)
                theoryName = "Tresca Criterion (Max In-Plane Shear Stress)";
                const diff1 = this.angleDiff180(playerAngleDeg, mohr.thetaS1);
                const diff2 = this.angleDiff180(playerAngleDeg, mohr.thetaS2);
                optimalAngle = diff1 < diff2 ? mohr.thetaS1 : mohr.thetaS2;
                angDiff = Math.min(diff1, diff2);

                if (angDiff <= ALIGN_TOLERANCE_DEG) {
                    accuracyRatio = Math.max(0, 1 - angDiff / ALIGN_TOLERANCE_DEG);
                    effectiveDamage = 110 + (accuracyRatio * 30);
                    if (angDiff <= 2.5) {
                        isCrit = true;
                        effectiveDamage *= 1.5;
                    }
                    feedback = `TRESCA SHEAR TEAR! You sheared along θ = ${playerAngleDeg.toFixed(1)}°. Shear stress |τθ| = ${Math.abs(currentStress.tauTheta).toFixed(1)} MPa tore the slip plane!`;
                } else {
                    isDeflected = true;
                    effectiveDamage = 0;
                    feedback = `SLIPPED OFF! At θ = ${playerAngleDeg.toFixed(1)}°, shear is only ${Math.abs(currentStress.tauTheta).toFixed(1)} MPa. Ductile targets yield ONLY to peak shear τmax = ${mohr.tauMax.toFixed(1)} MPa at θs = ${optimalAngle.toFixed(1)}°!`;
                }
                break;
            }

            case "shapeshifter": {
                const isNormalWeakness = zombie.currentPhase === "normal";
                if (isNormalWeakness) {
                    theoryName = "Rankine Shift (Tensile Phase)";
                    optimalAngle = mohr.thetaP_max;
                    angDiff = this.angleDiff180(playerAngleDeg, optimalAngle);
                    if (angDiff <= ALIGN_TOLERANCE_DEG) {
                        accuracyRatio = 1 - angDiff / ALIGN_TOLERANCE_DEG;
                        effectiveDamage = 120;
                        if (angDiff <= 2.5) isCrit = true;
                        feedback = `SHAPESHIFTER SHATTERED: Tensile cleavage at θ = ${playerAngleDeg.toFixed(1)}°!`;
                    } else {
                        isDeflected = true;
                        effectiveDamage = 0;
                        feedback = `DEFLECTED: Shapeshifter is currently BRITTLE! Rotate to principal plane θp = ${optimalAngle.toFixed(1)}°!`;
                    }
                } else {
                    theoryName = "Tresca Shift (Shear Phase)";
                    const d1 = this.angleDiff180(playerAngleDeg, mohr.thetaS1);
                    const d2 = this.angleDiff180(playerAngleDeg, mohr.thetaS2);
                    optimalAngle = d1 < d2 ? mohr.thetaS1 : mohr.thetaS2;
                    angDiff = Math.min(d1, d2);
                    if (angDiff <= ALIGN_TOLERANCE_DEG) {
                        accuracyRatio = 1 - angDiff / ALIGN_TOLERANCE_DEG;
                        effectiveDamage = 120;
                        if (angDiff <= 2.5) isCrit = true;
                        feedback = `SHAPESHIFTER SHEARED: Shear tear at θ = ${playerAngleDeg.toFixed(1)}°!`;
                    } else {
                        isDeflected = true;
                        effectiveDamage = 0;
                        feedback = `DEFLECTED: Shapeshifter is currently DUCTILE! Rotate to shear plane θs = ${optimalAngle.toFixed(1)}°!`;
                    }
                }
                break;
            }

            case "twin": {
                theoryName = "Coupled Tensor Cleave";
                optimalAngle = mohr.thetaP_max;
                angDiff = this.angleDiff180(playerAngleDeg, optimalAngle);
                if (angDiff <= ALIGN_TOLERANCE_DEG) {
                    effectiveDamage = 110;
                    if (angDiff <= 2.5) isCrit = true;
                    feedback = `TWIN CLEAVE LANDED: Aligned cut at θ = ${playerAngleDeg.toFixed(1)}°!`;
                } else {
                    isDeflected = true;
                    effectiveDamage = 0;
                    feedback = `DEFLECTED: Plane missed twin tensor alignment (θp = ${optimalAngle.toFixed(1)}°)!`;
                }
                break;
            }

            case "boss": {
                theoryName = "von Mises Distortion Energy";
                optimalAngle = mohr.thetaP_max;
                angDiff = this.angleDiff180(playerAngleDeg, optimalAngle);
                const localVM = Math.sqrt(
                    currentStress.sigmaTheta * currentStress.sigmaTheta + 3 * currentStress.tauTheta * currentStress.tauTheta
                );
                if (angDiff <= 8.5) {
                    effectiveDamage = 85;
                    if (angDiff <= 3.0) isCrit = true;
                    feedback = `VON MISES CORE PENETRATED: Local effective stress σ_eff = ${localVM.toFixed(1)} MPa pierced armor!`;
                } else {
                    isDeflected = true;
                    effectiveDamage = 5;
                    feedback = `BOSS ARMOR DEFLECTED HIT: Current stress combination is below yield threshold! Rotate to θ = ${optimalAngle.toFixed(1)}°!`;
                }
                break;
            }

            default: {
                optimalAngle = mohr.thetaP_max;
                effectiveDamage = 50;
            }
        }

        return {
            effectiveDamage: Math.round(effectiveDamage),
            accuracyRatio,
            optimalAngle,
            currentStress,
            mohr,
            theoryName,
            feedback,
            isCrit,
            isDeflected,
            angDiff
        };
    }

    /**
     * Compute full 3D/2D strain tensor from plane stress state via Generalized Hooke's Law
     * E: Young's Modulus in MPa (default: 200,000 MPa = 200 GPa, structural steel/alloy)
     * nu: Poisson's ratio (default: 0.30)
     */
    static computeStrains(sx, sy, txy, E = 200000, nu = 0.30) {
        const G = E / (2 * (1 + nu)); // Shear modulus (~76,923.08 MPa)
        const K = E / (3 * (1 - 2 * nu)); // Bulk modulus (~166,666.67 MPa)

        // Normal strains in microstrain (ue = 10^-6)
        // eps_x = (sigma_x - nu * sigma_y) / E
        // eps_y = (sigma_y - nu * sigma_x) / E
        // eps_z = -nu * (sigma_x + sigma_y) / E (out-of-plane Poisson contraction)
        const epsX_raw = (sx - nu * sy) / E;
        const epsY_raw = (sy - nu * sx) / E;
        const epsZ_raw = (-nu * (sx + sy)) / E;

        const epsX = epsX_raw * 1e6; // microstrain (ue)
        const epsY = epsY_raw * 1e6;
        const epsZ = epsZ_raw * 1e6;

        // Engineering shear strain in microradians (urad = 10^-6 rad)
        // gamma_xy = tau_xy / G
        const gammaXY_raw = txy / G;
        const gammaXY = gammaXY_raw * 1e6; // urad
        const epsXY = gammaXY / 2; // tensorial shear strain

        // Mohr's circle for strain
        const epsAvg = (epsX + epsY) / 2;
        const epsDiffHalf = (epsX - epsY) / 2;
        const strainR = Math.sqrt(epsDiffHalf * epsDiffHalf + Math.pow(gammaXY / 2, 2));

        const eps1 = epsAvg + strainR; // Maximum principal normal strain (ue)
        const eps2 = epsAvg - strainR; // Minimum principal normal strain (ue)
        const eps3 = epsZ;            // Out-of-plane principal strain (ue)
        const gammaMax = 2 * strainR; // Maximum in-plane engineering shear strain (urad) = eps1 - eps2

        // Volumetric dilatation e = eps_x + eps_y + eps_z (ue)
        const dilatation = epsX + epsY + epsZ;

        // Strain energy densities (in kJ/m^3 = kPa = 10^3 N/m^2)
        // Total strain energy density u = 0.5 * (sx*epsX_raw + sy*epsY_raw + txy*gammaXY_raw) * 1000
        const u_total = 0.5 * (sx * epsX_raw + sy * epsY_raw + txy * gammaXY_raw) * 1000;
        
        // Hydrostatic / Volumetric strain energy density
        const u_volumetric = ((1 - 2 * nu) / (6 * E)) * Math.pow(sx + sy, 2) * 1000;
        
        // Distortion / Shear strain energy density (von Mises shape-change energy)
        const vonMises = Math.sqrt(sx * sx - sx * sy + sy * sy + 3 * txy * txy);
        const u_distortion = ((1 + nu) / (3 * E)) * Math.pow(vonMises, 2) * 1000;

        return {
            E,
            nu,
            G,
            K,
            epsX,
            epsY,
            epsZ,
            gammaXY,
            epsXY,
            eps1,
            eps2,
            eps3,
            gammaMax,
            dilatation,
            u_total,
            u_volumetric,
            u_distortion
        };
    }

    /**
     * Compute transformed strains on plane inclined at theta (in degrees)
     */
    static transformStrain(epsX, epsY, gammaXY, thetaDeg) {
        const thetaRad = this.degToRad(thetaDeg);
        const twoTheta = 2 * thetaRad;

        const avg = (epsX + epsY) / 2;
        const diffHalf = (epsX - epsY) / 2;

        const epsTheta = avg + diffHalf * Math.cos(twoTheta) + (gammaXY / 2) * Math.sin(twoTheta);
        const gammaTheta = -2 * diffHalf * Math.sin(twoTheta) + gammaXY * Math.cos(twoTheta);
        const eps90 = epsX + epsY - epsTheta;
        const gamma90 = -gammaTheta;

        return {
            theta: this.normalize180(thetaDeg),
            epsTheta,
            gammaTheta,
            eps90,
            gamma90
        };
    }

    /**
     * Compute full post-mortem forensic autopsy of a defeated zombie
     * Bundles complete Stress Tensor, Strain Tensor, Transformation State, and Failure Mechanics
     */
    static computeFullAutopsy(zombie, playerAngleDeg, attackResult) {
        const sx = zombie.sx;
        const sy = zombie.sy;
        const txy = zombie.txy;

        const mohr = this.getMohrCircle(sx, sy, txy);
        const stressCut = this.transform(sx, sy, txy, playerAngleDeg);
        const strains = this.computeStrains(sx, sy, txy);
        const strainCut = this.transformStrain(strains.epsX, strains.epsY, strains.gammaXY, playerAngleDeg);

        // Forensic fracture diagnosis
        let failureTitle = "";
        let failureMechanism = "";
        let formulaUsed = "";

        switch (zombie.type) {
            case "brittle":
                failureTitle = "Rankine Tensile Cleavage (σ1)";
                failureMechanism = `Peak tension σθ = ${stressCut.sigmaTheta.toFixed(1)} MPa at θ = ${playerAngleDeg.toFixed(1)}° (Opt θp = ${mohr.thetaP_max.toFixed(1)}°, εθ = ${strainCut.epsTheta.toFixed(1)} με).`;
                formulaUsed = `σθ = (σx+σy)/2 + ((σx-σy)/2)cos(2θ) + τxy·sin(2θ) ≥ σ1`;
                break;
            case "ductile":
                failureTitle = "Tresca Max Shear Slip (τmax)";
                failureMechanism = `Max shear |τθ| = ${Math.abs(stressCut.tauTheta).toFixed(1)} MPa at θ = ${playerAngleDeg.toFixed(1)}° (Opt θs = ${attackResult.optimalAngle.toFixed(1)}°, γθ = ${Math.abs(strainCut.gammaTheta).toFixed(1)} μrad).`;
                formulaUsed = `|τθ| = |-((σx-σy)/2)sin(2θ) + τxy·cos(2θ)| ≥ τmax`;
                break;
            case "shapeshifter":
                failureTitle = zombie.currentPhase === "normal"
                    ? "Phase-Locked Rankine (σ1)"
                    : "Phase-Locked Tresca (τmax)";
                failureMechanism = `Locked in ${zombie.currentPhase.toUpperCase()} phase: cut θ = ${playerAngleDeg.toFixed(1)}° (Opt ${attackResult.optimalAngle.toFixed(1)}°).`;
                formulaUsed = zombie.currentPhase === "normal" ? `σθ ≥ σ1 (Tensile)` : `|τθ| ≥ τmax (Shear)`;
                break;
            case "twin":
                failureTitle = "Harmonic Twin Cleave (I1)";
                failureMechanism = `Severed coupled plane θ = ${playerAngleDeg.toFixed(1)}° (θp = ${mohr.thetaP_max.toFixed(1)}°, σθ = ${stressCut.sigmaTheta.toFixed(1)} MPa, I1 = ${mohr.I1.toFixed(1)} MPa).`;
                formulaUsed = `θ = θp = ${mohr.thetaP_max.toFixed(1)}°`;
                break;
            case "boss":
                failureTitle = "von Mises Distortion Yield (σvm)";
                failureMechanism = `Effective σ_vm = ${Math.sqrt(stressCut.sigmaTheta * stressCut.sigmaTheta + 3 * stressCut.tauTheta * stressCut.tauTheta).toFixed(1)} MPa at θ = ${playerAngleDeg.toFixed(1)}° (ud = ${strains.u_distortion.toFixed(2)} kJ/m³).`;
                formulaUsed = `σvm = √(σθ² + 3τθ²) | ud = ((1+ν)/(3E))·σvm²`;
                break;
            default:
                failureTitle = "Critical Plane Cleave";
                failureMechanism = `Cut at θ = ${playerAngleDeg.toFixed(1)}° reached failure stress.`;
                formulaUsed = `Plane Stress Transformation`;
        }

        return {
            timestamp: new Date().toLocaleTimeString(),
            zombieId: zombie.id || Math.floor(Math.random() * 10000),
            zombieName: zombie.name || "Target",
            zombieType: zombie.type,
            zombiePhase: zombie.currentPhase || null,
            level: zombie.level || 1,
            cutAngle: playerAngleDeg,
            cutAngleMohr: (playerAngleDeg * 2) % 360,
            optimalAngle: attackResult.optimalAngle,
            angleDeviation: attackResult.angDiff,
            isCrit: attackResult.isCrit,
            effectiveDamage: attackResult.effectiveDamage,
            theoryName: attackResult.theoryName,
            failureTitle,
            failureMechanism,
            formulaUsed,
            // Full Stress Tensor State
            stress: {
                sx: sx,
                sy: sy,
                txy: txy,
                center: mohr.center,
                radius: mohr.radius,
                sigma1: mohr.sigma1,
                sigma2: mohr.sigma2,
                tauMax: mohr.tauMax,
                hydrostatic: mohr.hydrostatic,
                vonMises: mohr.vonMises,
                I1: mohr.I1,
                I2: mohr.I2,
                thetaP_max: mohr.thetaP_max,
                thetaP_min: mohr.thetaP_min,
                thetaS1: mohr.thetaS1,
                thetaS2: mohr.thetaS2,
                sigmaTheta: stressCut.sigmaTheta,
                tauTheta: stressCut.tauTheta,
                sigmaPerp: stressCut.sigma90,
                tauPerp: stressCut.tau90
            },
            // Full Strain Tensor State (via Hooke's Law)
            strain: {
                E: strains.E,
                nu: strains.nu,
                G: strains.G,
                K: strains.K,
                epsX: strains.epsX,
                epsY: strains.epsY,
                epsZ: strains.epsZ,
                gammaXY: strains.gammaXY,
                epsXY: strains.epsXY,
                eps1: strains.eps1,
                eps2: strains.eps2,
                eps3: strains.eps3,
                gammaMax: strains.gammaMax,
                dilatation: strains.dilatation,
                u_total: strains.u_total,
                u_volumetric: strains.u_volumetric,
                u_distortion: strains.u_distortion,
                epsTheta: strainCut.epsTheta,
                gammaTheta: strainCut.gammaTheta,
                epsPerp: strainCut.eps90,
                gammaPerp: strainCut.gamma90
            }
        };
    }

    static getProximityScore(zombie, playerAngleDeg) {
        const mohr = this.getMohrCircle(zombie.sx, zombie.sy, zombie.txy);
        let targetAngle = mohr.thetaP_max;

        if (zombie.type === "ductile" || (zombie.type === "shapeshifter" && zombie.currentPhase === "shear")) {
            const d1 = this.angleDiff180(playerAngleDeg, mohr.thetaS1);
            const d2 = this.angleDiff180(playerAngleDeg, mohr.thetaS2);
            targetAngle = d1 < d2 ? mohr.thetaS1 : mohr.thetaS2;
        }

        const diff = this.angleDiff180(playerAngleDeg, targetAngle);
        return Math.max(0, 1 - diff / 40);
    }
}

window.StressMechanics = StressMechanics;
