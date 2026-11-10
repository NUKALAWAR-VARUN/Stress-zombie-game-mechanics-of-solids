# ⚡ STRESS ZOMBIE APOCALYPSE
### *Learn Stress Transformation & Mohr's Circle by Fighting Zombies*

> **Subject Reference:** Mechanics of Solids · 2D Stress Transformation & Failure Theories  
> **Project Scope:** Interactive Engineering Education Platform & Game Engine  
> **Platform:** Web Browser (HTML5 Canvas + JavaScript, Zero External Dependencies)  
> **Hosting:** Works out of the box locally or free on GitHub Pages!

---

## 🎮 The Story & Premise
A virus has mutated people into zombies held together by internal stress tensors ($\sigma_x$, $\sigma_y$, $\tau_{xy}$). Conventional weapons bounce off them; they only take damage when sliced along their **principal or maximum shear failure planes**.

You are the last surviving engineer armed with a **rotating plane-cutter weapon**. By rotating the dial to the correct angle $\theta$, you channel the internal stress state into critical failure planes (Rankine, Tresca, and von Mises criteria). **Mohr's circle becomes your tactical radar!**

---

## 🔬 The Science & Formulas Implemented

### 1. Stress Transformation Equations
For any 2D plane stress state $(\sigma_x, \sigma_y, \tau_{xy})$, cutting along a plane with normal inclined at angle $\theta$ yields:

$$\sigma_\theta = \frac{\sigma_x + \sigma_y}{2} + \frac{\sigma_x - \sigma_y}{2}\cos(2\theta) + \tau_{xy}\sin(2\theta)$$

$$\tau_\theta = -\frac{\sigma_x - \sigma_y}{2}\sin(2\theta) + \tau_{xy}\cos(2\theta)$$

### 2. Mohr's Circle Geometry & The $2\theta$ Angle Doubling
- **Center:** $C = \frac{\sigma_x + \sigma_y}{2}$
- **Radius:** $R = \sqrt{\left(\frac{\sigma_x - \sigma_y}{2}\right)^2 + \tau_{xy}^2}$
- **Principal Stresses:** $\sigma_1 = C + R$, $\sigma_2 = C - R$
- **Principal Plane Angle:** $\tan(2\theta_p) = \frac{2\tau_{xy}}{\sigma_x - \sigma_y}$
- **Maximum Shear Stress:** $\tau_{max} = R$ at planes inclined at $\theta_s = \theta_p \pm 45^\circ$
- **Angle Doubling:** When the physical cutting plane rotates by angle $\theta$, the radius vector on Mohr's circle rotates by **$2\theta$**! The tactical radar visualizes this angle doubling in real-time.

### 3. First Stress Invariant ($I_1$)
$$I_1 = \sigma_x + \sigma_y = \sigma_1 + \sigma_2 = \sigma_\theta + \sigma_{\theta + 90^\circ} = \text{constant}$$
The sum of normal stresses on any two perpendicular planes is invariant under rotation. In the game, this powers the **Invariant Shield**!

---

## 🧟 Zombie Types & Failure Theories (Lectures 31–32)

| Zombie Type | Failure Theory | Kill Condition | Optimal Angle |
| :--- | :--- | :--- | :--- |
| **Brittle Biter** | **Rankine Criterion** (Max Normal Stress) | Maximizes tensile normal stress $\sigma_1$ | $\theta = \theta_p$ (where $\tau = 0$) |
| **Ductile Dragger** | **Tresca Criterion** (Max Shear Stress) | Maximizes shear stress $\tau_{max} = R$ | $\theta = \theta_p + 45^\circ$ |
| **Shapeshifter** | **Dynamic Rankine / Tresca Shift** | Stress tensor mutates mid-walk! | Re-evaluate and adapt quickly |
| **Twin Zombies** | **Coupled Plane Cleave** | Two zombies marching side-by-side | Find angle that cleaves both |
| **Boss: von Mises Mutant** | **von Mises Criterion** (Distortion Energy) | $\sigma_{vm} = \sqrt{\sigma_\theta^2 + 3\tau_\theta^2} \ge \sigma_Y$ | Multi-phase tensor assault |

---

## 🕹️ Controls & Hotkeys

- **Plane-Cutter Rotary Dial:** Click & drag the dial or move the slider.
- **Keyboard Rotation:** `A` / `D` or `Left Arrow` / `Right Arrow` (hold `Shift` for faster rotation).
- **Fire Blade:** `Spacebar` or click **FIRE CUTTER**.
- **Exam Mode (Hard / Insane):** Enter the calculated $\theta_p$ directly in degrees and press `Enter`.
- **Tactical Power-Ups:**
  - `[1]` **Slow-Mo Mohr:** Dilates time to 20% speed for 5 seconds.
  - `[2]` **Angle Hint:** Illuminates the optimal cut plane directly on the dial.
  - `[3]` **Stress Scanner:** Unjams Mohr's radar and reveals full tensor decomposition.
  - `[4]` **Invariant Shield:** Channels $I_1 = \sigma_x + \sigma_y$ into an impenetrable barrier.
- **Audio:** Toggle sound synthesis on/off anytime.

---

## 🧪 Study Lab & Interactive Codex
Click **📖 STUDY LAB & CODEX** in the top navigation to access the sandbox:
- Live sliders for $\sigma_x$, $\sigma_y$, $\tau_{xy}$, and $\theta$.
- Instant interactive Mohr's circle and rotated infinitesimal stress element canvas.
- Step-by-step mathematical derivation box showing exact intermediate numbers.
- One-click presets including the **Zombie #1 Worked Example** from page 3 of the GDD ($\sigma_x = 80$, $\sigma_y = 20$, $\tau_{xy} = 30 \implies \sigma_1 = 92.4\text{ MPa at } 22.5^\circ$).

---

## 🚀 Running Locally or Deploying to GitHub Pages

### Running Locally
No server, installation, or Node.js required! Simply double-click `index.html` or open it in any modern browser (Chrome, Edge, Firefox, Safari).

### Deploying to GitHub Pages (Free Hosting)
1. Initialize git and commit:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Stress Zombie Apocalypse game"
   ```
2. Create a GitHub repository and push:
   ```bash
   git remote add origin https://github.com/<your-username>/stress-zombie-apocalypse.git
   git branch -M main
   git push -u origin main
   ```
3. Go to **Settings** > **Pages** in your GitHub repository and set the source branch to `main`. Your game is instantly live on the web!

