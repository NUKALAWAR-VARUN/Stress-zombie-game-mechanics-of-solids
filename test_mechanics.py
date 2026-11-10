#!/usr/bin/env python3
"""
STRESS ZOMBIE APOCALYPSE - Mechanics Verification & Unit Test Suite
Based on APL104 Solid Mechanics (Lectures 4, 7-10, 31-32 - IIT Delhi)

Verifies the mathematical implementation of stress transformations,
Mohr's circle geometry, angle doubling (2θ), stress invariants, and
failure criteria against Worked Example #1 (Zombie #1 from GDD Page 3).
"""

import math
import unittest

def deg_to_rad(deg):
    return (deg * math.pi) / 180.0

def rad_to_deg(rad):
    return (rad * 180.0) / math.pi

def transform_stress(sx, sy, txy, theta_deg):
    """
    Stress transformation formulas on an inclined plane theta (CCW from x-axis):
      sigma_theta = (sx + sy)/2 + ((sx - sy)/2)*cos(2*theta) + txy*sin(2*theta)
      tau_theta   = -((sx - sy)/2)*sin(2*theta) + txy*cos(2*theta)
    """
    two_theta = 2.0 * deg_to_rad(theta_deg)
    avg = (sx + sy) / 2.0
    diff_half = (sx - sy) / 2.0

    sigma_theta = avg + diff_half * math.cos(two_theta) + txy * math.sin(two_theta)
    tau_theta = -diff_half * math.sin(two_theta) + txy * math.cos(two_theta)

    # Stress on perpendicular plane (theta + 90 deg)
    sigma_perp = sx + sy - sigma_theta
    tau_perp = -tau_theta

    return {
        "theta": theta_deg,
        "two_theta_deg": theta_deg * 2.0,
        "sigma_theta": sigma_theta,
        "tau_theta": tau_theta,
        "sigma_perp": sigma_perp,
        "tau_perp": tau_perp,
        "I1": sigma_theta + sigma_perp
    }

def get_mohr_circle(sx, sy, txy):
    """Computes Mohr's circle center, radius, principal stresses, and angles."""
    C = (sx + sy) / 2.0
    diff_half = (sx - sy) / 2.0
    R = math.sqrt(diff_half * diff_half + txy * txy)

    sigma1 = C + R
    sigma2 = C - R
    tau_max = R

    # tan(2*theta_p) = 2*txy / (sx - sy)
    two_theta_p_rad = math.atan2(2.0 * txy, sx - sy)
    theta_p1_deg = rad_to_deg(two_theta_p_rad) / 2.0
    if theta_p1_deg < 0:
        theta_p1_deg += 180.0

    # Ensure theta_p_max corresponds to maximum tensile stress sigma1
    test_res = transform_stress(sx, sy, txy, theta_p1_deg)
    if abs(test_res["sigma_theta"] - sigma1) < 1e-4:
        theta_p_max = theta_p1_deg
    else:
        theta_p_max = (theta_p1_deg + 90.0) % 180.0

    # Maximum shear occurs at theta_p ± 45 deg
    theta_s1 = (theta_p_max + 45.0) % 180.0
    theta_s2 = (theta_p_max - 45.0 + 180.0) % 180.0

    # Invariants
    I1 = sx + sy
    I2 = sx * sy - txy * txy
    von_mises = math.sqrt(sx * sx - sx * sy + sy * sy + 3.0 * txy * txy)

    return {
        "center": C,
        "radius": R,
        "sigma1": sigma1,
        "sigma2": sigma2,
        "tau_max": tau_max,
        "theta_p_max": theta_p_max,
        "theta_s1": theta_s1,
        "theta_s2": theta_s2,
        "I1": I1,
        "I2": I2,
        "von_mises": von_mises
    }


def compute_strains(sx, sy, txy, E=200000.0, nu=0.30):
    """
    Computes full 3D/2D strain tensor components via Generalized Hooke's Law:
      eps_x = (sx - nu*sy) / E
      eps_y = (sy - nu*sx) / E
      eps_z = -nu*(sx + sy) / E
      gamma_xy = txy / G, where G = E / (2*(1+nu))
    Returns strains in microstrain (ue) and microradians (urad).
    """
    G = E / (2.0 * (1.0 + nu))
    K = E / (3.0 * (1.0 - 2.0 * nu))

    eps_x_raw = (sx - nu * sy) / E
    eps_y_raw = (sy - nu * sx) / E
    eps_z_raw = (-nu * (sx + sy)) / E

    eps_x = eps_x_raw * 1e6
    eps_y = eps_y_raw * 1e6
    eps_z = eps_z_raw * 1e6

    gamma_xy_raw = txy / G
    gamma_xy = gamma_xy_raw * 1e6

    eps_avg = (eps_x + eps_y) / 2.0
    eps_diff_half = (eps_x - eps_y) / 2.0
    strain_r = math.sqrt(eps_diff_half * eps_diff_half + (gamma_xy / 2.0) ** 2)

    eps1 = eps_avg + strain_r
    eps2 = eps_avg - strain_r
    gamma_max = 2.0 * strain_r

    dilatation = eps_x + eps_y + eps_z

    u_total = 0.5 * (sx * eps_x_raw + sy * eps_y_raw + txy * gamma_xy_raw) * 1000.0
    u_volumetric = ((1.0 - 2.0 * nu) / (6.0 * E)) * ((sx + sy) ** 2) * 1000.0
    von_mises = math.sqrt(sx * sx - sx * sy + sy * sy + 3.0 * txy * txy)
    u_distortion = ((1.0 + nu) / (3.0 * E)) * (von_mises ** 2) * 1000.0

    return {
        "E": E,
        "nu": nu,
        "G": G,
        "K": K,
        "eps_x": eps_x,
        "eps_y": eps_y,
        "eps_z": eps_z,
        "gamma_xy": gamma_xy,
        "eps1": eps1,
        "eps2": eps2,
        "gamma_max": gamma_max,
        "dilatation": dilatation,
        "u_total": u_total,
        "u_volumetric": u_volumetric,
        "u_distortion": u_distortion
    }


def transform_strain(eps_x, eps_y, gamma_xy, theta_deg):
    """Strain transformation on inclined plane theta."""
    two_theta = 2.0 * deg_to_rad(theta_deg)
    avg = (eps_x + eps_y) / 2.0
    diff_half = (eps_x - eps_y) / 2.0

    eps_theta = avg + diff_half * math.cos(two_theta) + (gamma_xy / 2.0) * math.sin(two_theta)
    gamma_theta = -2.0 * diff_half * math.sin(two_theta) + gamma_xy * math.cos(two_theta)
    return {
        "eps_theta": eps_theta,
        "gamma_theta": gamma_theta
    }


class TestStressMechanics(unittest.TestCase):
    """Unit test suite verifying solid mechanics core calculations against the GDD."""

    def setUp(self):
        # Worked Example from Page 3 (Zombie #1)
        self.sx = 80.0
        self.sy = 20.0
        self.txy = 30.0

    def test_mohr_circle_center_and_radius(self):
        """Verifies Center C = 50 MPa and Radius R = 42.4 MPa."""
        mohr = get_mohr_circle(self.sx, self.sy, self.txy)
        self.assertAlmostEqual(mohr["center"], 50.0, places=1)
        self.assertAlmostEqual(mohr["radius"], 42.426, places=2)
        print(f"[PASS] Mohr Circle Geometry: C = {mohr['center']:.1f} MPa, R = {mohr['radius']:.1f} MPa")

    def test_principal_stresses(self):
        """Verifies Principal Stresses σ1 = 92.4 MPa and σ2 = 7.6 MPa."""
        mohr = get_mohr_circle(self.sx, self.sy, self.txy)
        self.assertAlmostEqual(mohr["sigma1"], 92.4, places=1)
        self.assertAlmostEqual(mohr["sigma2"], 7.6, places=1)
        print(f"[PASS] Principal Stresses: σ1 = {mohr['sigma1']:.1f} MPa, σ2 = {mohr['sigma2']:.1f} MPa")

    def test_principal_and_max_shear_angles(self):
        """Verifies Principal Angle θp = 22.5° and Max Shear Angle θs = 67.5°."""
        mohr = get_mohr_circle(self.sx, self.sy, self.txy)
        self.assertAlmostEqual(mohr["theta_p_max"], 22.5, places=1)
        self.assertAlmostEqual(mohr["theta_s1"], 67.5, places=1)
        print(f"[PASS] Orientation: θp = {mohr['theta_p_max']:.1f}°, θs = {mohr['theta_s1']:.1f}°")

    def test_optimal_cut_transformation(self):
        """Verifies that cutting at θ = 22.5° yields maximum normal stress 92.4 MPa and zero shear."""
        res_opt = transform_stress(self.sx, self.sy, self.txy, 22.5)
        self.assertAlmostEqual(res_opt["sigma_theta"], 92.4, places=1)
        self.assertAlmostEqual(res_opt["tau_theta"], 0.0, places=3)
        print(f"[PASS] Optimal Hit (θ = 22.5°): σθ = {res_opt['sigma_theta']:.1f} MPa (Max), τθ = {res_opt['tau_theta']:.1f} MPa (Zero)")

    def test_suboptimal_cut_transformation(self):
        """Verifies that cutting at θ = 90° yields only 20 MPa normal stress."""
        res_90 = transform_stress(self.sx, self.sy, self.txy, 90.0)
        self.assertAlmostEqual(res_90["sigma_theta"], 20.0, places=1)
        self.assertAlmostEqual(res_90["tau_theta"], -30.0, places=1)
        print(f"[PASS] Suboptimal Hit (θ = 90.0°): σθ = {res_90['sigma_theta']:.1f} MPa, τθ = {res_90['tau_theta']:.1f} MPa")

    def test_max_shear_cut(self):
        """Verifies that cutting at θ = 67.5° yields maximum shear stress τ = 42.4 MPa (Tresca condition)."""
        res_shear = transform_stress(self.sx, self.sy, self.txy, 67.5)
        self.assertAlmostEqual(abs(res_shear["tau_theta"]), 42.4, places=1)
        print(f"[PASS] Shear Attack (θ = 67.5°): |τθ| = {abs(res_shear['tau_theta']):.1f} MPa (Tresca τ_max)")

    def test_first_stress_invariant_conservation(self):
        """Verifies that I1 = σx + σy = σθ + σ(θ+90°) = 100 MPa is constant across all angles (Invariant Shield)."""
        expected_I1 = self.sx + self.sy
        for angle in range(0, 180, 15):
            res = transform_stress(self.sx, self.sy, self.txy, float(angle))
            self.assertAlmostEqual(res["I1"], expected_I1, places=3)
        print(f"[PASS] First Stress Invariant: I1 = σx + σy = {expected_I1:.1f} MPa conserved for all angles θ")

    def test_von_mises_equivalent_stress(self):
        """Verifies von Mises effective stress calculation for Level 5 Boss."""
        mohr = get_mohr_circle(self.sx, self.sy, self.txy)
        # sigma_vm = sqrt(s1^2 - s1*s2 + s2^2)
        s1, s2 = mohr["sigma1"], mohr["sigma2"]
        vm_from_principal = math.sqrt(s1 * s1 - s1 * s2 + s2 * s2)
        self.assertAlmostEqual(mohr["von_mises"], vm_from_principal, places=2)
        print(f"[PASS] von Mises Stress: σ_vm = {mohr['von_mises']:.1f} MPa matches principal formula")

    def test_generalized_hookes_law_strains(self):
        """Verifies full strain tensor: εx = 370 με, εy = -20 με, εz = -150 με, γxy = 390 μrad."""
        strains = compute_strains(self.sx, self.sy, self.txy, E=200000.0, nu=0.30)
        self.assertAlmostEqual(strains["eps_x"], 370.0, places=1)
        self.assertAlmostEqual(strains["eps_y"], -20.0, places=1)
        self.assertAlmostEqual(strains["eps_z"], -150.0, places=1)
        self.assertAlmostEqual(strains["gamma_xy"], 390.0, places=1)
        print(f"[PASS] Hooke's Law: εx = {strains['eps_x']:.1f} με, εy = {strains['eps_y']:.1f} με, εz = {strains['eps_z']:.1f} με, γxy = {strains['gamma_xy']:.1f} μrad")

    def test_volumetric_dilatation_and_strain_energy(self):
        """Verifies volumetric dilatation e = 200 με and strain energy density u = 20.45 kJ/m³."""
        strains = compute_strains(self.sx, self.sy, self.txy, E=200000.0, nu=0.30)
        self.assertAlmostEqual(strains["dilatation"], 200.0, places=1)
        self.assertAlmostEqual(strains["u_total"], 20.45, places=2)
        self.assertAlmostEqual(strains["u_volumetric"], 3.333, places=2)
        self.assertAlmostEqual(strains["u_distortion"], 17.117, places=2)
        print(f"[PASS] Energy Density: e = {strains['dilatation']:.1f} με, u = {strains['u_total']:.2f} kJ/m³, ud = {strains['u_distortion']:.2f} kJ/m³")

    def test_strain_transformation_at_principal_angle(self):
        """Verifies that at θp = 22.5°, principal strain ε1 = 450.8 με and shear strain γθ = 0 μrad."""
        strains = compute_strains(self.sx, self.sy, self.txy, E=200000.0, nu=0.30)
        str_trans = transform_strain(strains["eps_x"], strains["eps_y"], strains["gamma_xy"], 22.5)
        self.assertAlmostEqual(str_trans["eps_theta"], strains["eps1"], places=1)
        self.assertAlmostEqual(str_trans["gamma_theta"], 0.0, places=1)
        print(f"[PASS] Strain Transformation (θ = 22.5°): εθ = {str_trans['eps_theta']:.1f} με (Max), γθ = {str_trans['gamma_theta']:.1f} μrad (Zero)")


def run_suite():
    print("\n" + "=" * 65)
    print("  🔬 RUNNING SOLID MECHANICS VERIFICATION SUITE 🔬")
    print("=" * 65 + "\n")
    suite = unittest.TestLoader().loadTestsFromTestCase(TestStressMechanics)
    runner = unittest.TextTestRunner(verbosity=0)
    result = runner.run(suite)
    print("\n" + "=" * 65)
    if result.wasSuccessful():
        print("  🎉 ALL 11 MECHANICS & STRAIN TESTS PASSED WITH 100% MATHEMATICAL ACCURACY!")
    else:
        print("  ❌ SOME TESTS FAILED")
    print("=" * 65 + "\n")
    return 0 if result.wasSuccessful() else 1

if __name__ == "__main__":
    import sys
    sys.exit(run_suite())
