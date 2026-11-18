# AXON — Real-Time GPU Particle Dynamics & Fluid Simulation Engine

A high-performance WebGL graphics application demonstrating real-time GPGPU compute, mathematical signed distance fields (SDF), divergence-free curl noise advection, and Eulerian fluid dynamics running concurrently at 60 FPS in the browser.

---

## 1. Executive Summary

AXON is an experimental visual computing platform exploring the intersection of real-time particle physics, fluid dynamics, and implicit geometry. The engine simulates and renders **262,144 particles** entirely on the GPU using floating-point ping-pong render targets, driven by user interaction through an interactive cursor-coupled fluid velocity field.

All physics integration, velocity advection, distance field evaluations, and sprite shading are executed in parallel via custom GLSL shaders, ensuring zero CPU overhead during runtime animation loops.

---

## 2. Mathematical & Algorithmic Architecture

### 2.1 GPGPU Ping-Pong Simulation Pipeline
Traditional particle systems bound by CPU iteration become bottlenecked beyond thousands of points. AXON offloads the entire simulation state to floating-point texture buffers:
* **Position Textures (`512 × 512` RGBA Float32):** Channels $(R, G, B)$ store the 3D world coordinates $(x, y, z)$; channel $A$ preserves lifecycle/phase attributes.
* **Dual Render Targets:** Two `THREE.WebGLRenderTarget` instances (`rtPosA` and `rtPosB`) execute ping-pong computation every frame. The simulation shader reads from Target A and writes updated positions to Target B, followed by an immediate buffer swap.

$$\mathbf{P}_{t+\Delta t} = \mathbf{P}_t + \mathbf{V}_{\text{total}} \cdot \Delta t$$

### 2.2 Implicit Surface Geometry (Signed Distance Fields)
The particle cloud is shaped by an organic, sculpted 3D toroidal geometry defined analytically through a Signed Distance Function $f(\mathbf{p}) \le 0$:
1. **Depth Mirroring:**
   $$p_z' = \sqrt{p_z^2 + 0.0215} - \sqrt{0.012}$$
2. **Quaternion Rotation:** Coordinates are rotated into an asymmetric orientation via spatial quaternion transformation $q = (0.5, 0.5, 0.5, 0.5)$.
3. **Restorative Normal Gradient:** The surface normal gradient $\nabla f(\mathbf{p})$ is calculated using central differences with step $\epsilon = 0.001$:
   $$\nabla f(\mathbf{p}) \approx \frac{1}{2\epsilon} \begin{bmatrix} f(\mathbf{p} + \epsilon\hat{i}) - f(\mathbf{p} - \epsilon\hat{i}) \\ f(\mathbf{p} + \epsilon\hat{j}) - f(\mathbf{p} - \epsilon\hat{j}) \\ f(\mathbf{p} + \epsilon\hat{k}) - f(\mathbf{p} - \epsilon\hat{k}) \end{bmatrix}$$
4. **Surface Attraction & Tangential Swirl:** Particles are pulled toward the implicit boundary while orbiting along the surface tangent:
   $$\mathbf{V}_{\text{surface}} = -\nabla f(\mathbf{p}) \cdot f(\mathbf{p}) \cdot k_{\text{pull}} + (\hat{\mathbf{p}} \times \hat{\nabla f(\mathbf{p})}) \cdot k_{\text{swirl}}$$

### 2.3 Divergence-Free Curl Noise Advection
To achieve organic, turbulent motion without volume loss, the velocity field employs analytical curl noise derived from three overlapping sinusoidal potential fields $\mathbf{\Psi}(\mathbf{p})$:
$$\mathbf{V}_{\text{curl}} = \nabla \times \mathbf{\Psi} = \begin{bmatrix} \frac{\partial \Psi_z}{\partial y} - \frac{\partial \Psi_y}{\partial z} \\ \frac{\partial \Psi_x}{\partial z} - \frac{\partial \Psi_z}{\partial x} \\ \frac{\partial \Psi_y}{\partial x} - \frac{\partial \Psi_x}{\partial y} \end{bmatrix}$$
Because the divergence of a curl field is mathematically zero ($\nabla \cdot (\nabla \times \mathbf{\Psi}) \equiv 0$), particles disperse with fluid-like incompressibility.

### 2.4 Cursor Fluid Coupling & Dissipation
User interaction directly couples with the particle cloud:
* The cursor trajectory is unprojected from viewport screen space onto the 3D interaction plane.
* Velocity impulses $\mathbf{v}_{\text{cursor}}$ are injected into a localized radius around the pointer.
* When stirred, particles undergo immediate momentum transfer, dispersing outward before decaying smoothly via an exponential damping function:
  $$\mathbf{v}(t) = \mathbf{v}_0 \cdot e^{-\lambda t}$$
  The restorative SDF spring pulls the particles back to the equilibrium surface within $1.5\text{–}2.0\text{ seconds}$.

### 2.5 Additive Matcap Point Shading
* Points are drawn using additive alpha blending (`THREE.AdditiveBlending`) with depth testing enabled and depth writing disabled to prevent occlusion artifacts.
* Each sprite calculates view-dependent spherical falloff modulated by an embedded 64×64 soft matcap lighting map.
* Point sizes scale dynamically with distance to camera:
  $$\text{size} = k \cdot \text{DPR} \cdot \left(\frac{1000}{d_{\text{camera}}}\right)$$

---

## 3. System Architecture & Tech Stack

```
axon/
├── app/
│   ├── layout.tsx         # Root document & application shell
│   ├── page.tsx           # Main workspace & media viewport
│   └── globals.css        # Base styling & viewport constraints
├── components/
│   └── AxonScene.tsx      # GPGPU ping-pong loop, WebGL shaders & gaze tracking
├── lib/
│   ├── matcap.ts          # Embedded 64x64 soft spherical matcap generator
│   └── types.ts           # Core simulation & data interfaces
└── public/                # Static assets & optimized build output
```

| Layer | Technology | Role |
| :--- | :--- | :--- |
| **Framework** | Next.js 14 (App Router) | Client application container & SSR pre-rendering |
| **Graphics API** | WebGL 2 / WebGL (`three@0.150.1`) | Low-level GPU pipeline & render target management |
| **Shader Language** | GLSL (OpenGL Shading Language) | SIMD parallel computation of particle physics & shading |
| **Language** | TypeScript | Strict type safety for coordinates, vectors & math utilities |
| **Styling** | Tailwind CSS | Viewport layout & responsive positioning |

---

## 4. Performance & Hardware Optimization

* **Deterministic 60 FPS Execution:** All particle displacement operations run inside GPU fragment shaders across 262,144 parallel threads per simulation pass.
* **Dynamic Resolution Scaling:** Automatically caps device pixel ratio at $\min(\text{DPR}, 2.0)$ to prevent overfill penalties on ultra-high-density mobile displays.
* **Mobile Adaptation:** Devices with viewport widths $\le 760\text{ px}$ automatically downscale particle count to $16,384$ ($128 \times 128$ texture) to ensure thermal efficiency and steady 60 FPS on low-power mobile GPUs.
* **Resource Cleanup:** Full memory disposal of WebGL render targets, textures, geometries, and shader materials on component unmount.

---

## 5. Getting Started

### Prerequisites
* **Node.js:** v18.0.0 or higher
* **npm:** v9.0.0 or higher (or pnpm / yarn)
* A modern browser with WebGL 2 or WebGL with `OES_texture_float` support (Chrome, Edge, Safari, Firefox).

### Installation & Local Execution

1. **Clone the repository:**
   ```bash
   git clone https://github.com/quagmire49/dragnet.git
   cd dragnet
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run in development mode (with hot reloading):**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Production Build:**
   ```bash
   npm run build
   npm start
   ```

---

## 6. License & Attribution

Designed and engineered for real-time graphics research and high-performance interactive computing.
All code and GLSL shaders are released under the MIT License.
