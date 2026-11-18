'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useScan } from '@/context/ScanContext';
import { getSoftSphereMatcapUri } from '@/lib/matcap';
import { SEVERITY_COLORS } from '@/lib/types';

// Ping-pong sim vertex shader
const SIM_VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

// Ping-pong GPGPU sim fragment shader: Curl noise + SDF ring + fluid splat
const SIM_FRAGMENT_SHADER = `
  uniform sampler2D tPositions;
  uniform float uTime;
  uniform float uDelta;
  uniform float uSpeed;
  uniform float uCurlStrength;
  uniform float uRingRadius;
  uniform float uRingTube;
  uniform vec3 uMouse;
  uniform vec2 uMouseVel;
  uniform float uRingFlash;
  uniform float uEnableFluid;
  varying vec2 vUv;

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
               i.z + vec4(0.0, i1.z, i2.z, 1.0))
             + i.y + vec4(0.0, i1.y, i2.y, 1.0))
             + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  vec3 curlNoise(vec3 p) {
    const float e = 0.08;
    float n1 = snoise(vec3(p.x, p.y + e, p.z));
    float n2 = snoise(vec3(p.x, p.y - e, p.z));
    float n3 = snoise(vec3(p.x, p.y, p.z + e));
    float n4 = snoise(vec3(p.x, p.y, p.z - e));
    float n5 = snoise(vec3(p.x + e, p.y, p.z));
    float n6 = snoise(vec3(p.x - e, p.y, p.z));
    float x = (n1 - n2) - (n3 - n4);
    float y = (n3 - n4) - (n5 - n6);
    float z = (n5 - n6) - (n1 - n2);
    return normalize(vec3(x, y, z));
  }

  void main() {
    vec4 data = texture2D(tPositions, vUv);
    vec3 pos = data.xyz;
    float phase = data.w;

    // SDF Ring calculation (major radius R, tube radius r)
    float R = uRingRadius;
    float r = uRingTube;
    float lenXY = length(pos.xy);
    vec2 dirXY = (lenXY > 0.0001) ? normalize(pos.xy) : vec2(1.0, 0.0);
    vec3 ringCenter = vec3(dirXY * R, 0.0);
    vec3 toRing = ringCenter - pos;
    float distToTube = length(toRing) - r;

    // Gentle restorative spring force pulling toward ring surface
    vec3 pull = normalize(toRing) * (distToTube * 1.6);

    // Tangential orbital movement around ring
    vec3 tangent = vec3(-dirXY.y, dirXY.x, 0.0) * (0.55 * uSpeed);

    // Curl noise turbulence
    vec3 curl = curlNoise(pos * 0.42 + vec3(uTime * 0.12)) * uCurlStrength;

    // Cursor fluid splat disturbance
    vec3 mouseForce = vec3(0.0);
    if (uEnableFluid > 0.5) {
      vec3 toMouse = pos - uMouse;
      float d = length(toMouse.xy);
      float mouseRadius = 1.6;
      if (d < mouseRadius && length(uMouseVel) > 0.0001) {
        float factor = 1.0 - (d / mouseRadius);
        mouseForce = vec3(uMouseVel * 4.2, 0.0) * factor + normalize(toMouse) * (factor * 1.8);
      }
    }

    // Ring flash impulse (lavender-white burst)
    vec3 flashBurst = vec3(0.0);
    if (uRingFlash > 0.01) {
      flashBurst = normalize(pos) * (uRingFlash * 1.2);
    }

    // Integrate position
    pos += (tangent + pull + curl + mouseForce + flashBurst) * uDelta;

    // Boundary respawn if particle drifts too far
    if (length(pos) > 5.5 || isnan(pos.x)) {
      float angle = fract(sin(dot(vUv, vec2(12.9898, 78.233))) * 43758.5453) * 6.28318;
      pos = vec3(cos(angle) * R, sin(angle) * R, (fract(vUv.x * 171.3) - 0.5) * r);
    }

    gl_FragColor = vec4(pos, phase);
  }
`;

// Particle rendering vertex shader
const PARTICLE_VERTEX_SHADER = `
  uniform sampler2D tPositions;
  uniform sampler2D tTint;
  uniform float uPointSize;
  uniform float uDPR;
  uniform float uRingFlash;

  varying vec4 vTint;
  varying float vDepth;
  varying vec2 vUvCoord;

  void main() {
    vec4 posData = texture2D(tPositions, position.xy);
    vec4 tintData = texture2D(tTint, position.xy);

    vTint = tintData;
    vUvCoord = position.xy;

    vec3 worldPos = posData.xyz;
    vec4 mvPosition = modelViewMatrix * vec4(worldPos, 1.0);
    vDepth = -mvPosition.z;

    float flashMultiplier = 1.0 + (tintData.a * 1.6) + (uRingFlash * 2.0);
    gl_PointSize = uPointSize * (320.0 / vDepth) * flashMultiplier * uDPR;
    gl_PointSize = clamp(gl_PointSize, 1.2, 36.0);

    gl_Position = projectionMatrix * mvPosition;
  }
`;

// Particle rendering fragment shader with matcap sampling & additive blending
const PARTICLE_FRAGMENT_SHADER = `
  uniform sampler2D tMatcap;
  uniform float uRingFlash;
  varying vec4 vTint;
  varying float vDepth;

  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;

    vec4 matcap = texture2D(tMatcap, gl_PointCoord);
    float circleAlpha = smoothstep(0.5, 0.1, dist) * matcap.a;

    // AXON base lavender sparks: #aa88ff
    vec3 baseLavender = vec3(0.667, 0.533, 1.0);

    // Dynamic tint from finding severity
    vec3 tintColor = vTint.rgb;
    float tintWeight = clamp(vTint.a, 0.0, 1.0);

    vec3 finalColor = mix(baseLavender, tintColor, tintWeight);

    // Flash glow addition
    finalColor += vec3(0.85, 0.8, 1.0) * (vTint.a * 0.7 + uRingFlash * 1.4);

    gl_FragColor = vec4(finalColor, circleAlpha * 0.9);
  }
`;

export function ParticleField() {
  const { status, findings, healthScore, isDryingDolly, ringFlashKey } = useScan();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [webglSupported, setWebglSupported] = useState(true);

  // References for sim state
  const stateRef = useRef({
    status,
    findingsCount: findings.length,
    healthScore,
    isDryingDolly,
    ringFlash: 0,
  });

  useEffect(() => {
    stateRef.current.status = status;
    stateRef.current.findingsCount = findings.length;
    stateRef.current.healthScore = healthScore;
    stateRef.current.isDryingDolly = isDryingDolly;
  }, [status, findings.length, healthScore, isDryingDolly]);

  // Trigger ring flash on ringFlashKey changes
  useEffect(() => {
    if (ringFlashKey > 0) {
      stateRef.current.ringFlash = 1.0;
    }
  }, [ringFlashKey]);

  // Main Three.js loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check prefers-reduced-motion
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Dimensions for GPGPU grid: 512x512 = 262,144 points desktop, 128x128 = 16,384 mobile/reduced
    const isMobile = window.innerWidth <= 768;
    const simDim = reducedMotion || isMobile ? 128 : 512;
    const totalPoints = simDim * simDim;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: false,
        powerPreference: 'high-performance',
        alpha: false,
      });
    } catch {
      setWebglSupported(false);
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 1.0);

    // Check float texture support
    const gl = renderer.getContext();
    const isWebGL2 = renderer.capabilities.isWebGL2;
    const floatExtension =
      isWebGL2 ||
      renderer.extensions.has('OES_texture_float') ||
      renderer.extensions.has('OES_texture_half_float');

    if (!floatExtension) {
      setWebglSupported(false);
      return;
    }

    const textureType = isWebGL2
      ? THREE.FloatType
      : (renderer.extensions.get('OES_texture_float') ? THREE.FloatType : THREE.HalfFloatType);

    // Initial position texture
    const posData = new Float32Array(totalPoints * 4);
    const R = 2.1;
    const r = 0.55;
    for (let i = 0; i < totalPoints; i++) {
      const idx = i * 4;
      const angle = Math.random() * Math.PI * 2;
      const tubeAngle = Math.random() * Math.PI * 2;
      const tubeRadius = Math.random() * r;
      posData[idx + 0] = Math.cos(angle) * (R + tubeRadius * Math.cos(tubeAngle));
      posData[idx + 1] = Math.sin(angle) * (R + tubeRadius * Math.cos(tubeAngle));
      posData[idx + 2] = tubeRadius * Math.sin(tubeAngle);
      posData[idx + 3] = Math.random(); // phase
    }

    const initPosTex = new THREE.DataTexture(
      posData,
      simDim,
      simDim,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    initPosTex.needsUpdate = true;

    // Ping-pong render targets
    const renderTargetOptions: THREE.WebGLRenderTargetOptions = {
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: textureType,
      depthBuffer: false,
      stencilBuffer: false,
    };

    let rtPosA = new THREE.WebGLRenderTarget(simDim, simDim, renderTargetOptions);
    let rtPosB = new THREE.WebGLRenderTarget(simDim, simDim, renderTargetOptions);

    // Seed rtPosA with initial positions
    const seedScene = new THREE.Scene();
    const seedCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const seedMat = new THREE.MeshBasicMaterial({ map: initPosTex });
    const seedMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), seedMat);
    seedScene.add(seedMesh);
    renderer.setRenderTarget(rtPosA);
    renderer.render(seedScene, seedCamera);
    renderer.setRenderTarget(null);

    // Sim Scene & Material
    const simScene = new THREE.Scene();
    const simCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const simUniforms = {
      tPositions: { value: rtPosA.texture },
      uTime: { value: 0 },
      uDelta: { value: 0.016 },
      uSpeed: { value: 1.0 },
      uCurlStrength: { value: 0.4 },
      uRingRadius: { value: R },
      uRingTube: { value: r },
      uMouse: { value: new THREE.Vector3(999, 999, 0) },
      uMouseVel: { value: new THREE.Vector2(0, 0) },
      uRingFlash: { value: 0.0 },
      uEnableFluid: { value: reducedMotion ? 0.0 : 1.0 },
    };

    const simMaterial = new THREE.ShaderMaterial({
      vertexShader: SIM_VERTEX_SHADER,
      fragmentShader: SIM_FRAGMENT_SHADER,
      uniforms: simUniforms,
      depthWrite: false,
    });
    const simMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), simMaterial);
    simScene.add(simMesh);

    // Matcap sprite texture
    const matcapUri = getSoftSphereMatcapUri();
    const matcapLoader = new THREE.TextureLoader();
    const matcapTexture = matcapLoader.load(matcapUri);

    // Dynamic CPU Tint Texture (simDim x simDim)
    const tintArray = new Uint8Array(totalPoints * 4);
    // Base: dark lavender inactive
    for (let i = 0; i < totalPoints; i++) {
      const idx = i * 4;
      tintArray[idx + 0] = 170; // #aa88ff R
      tintArray[idx + 1] = 136; // G
      tintArray[idx + 2] = 255; // B
      tintArray[idx + 3] = 0; // alpha / flash intensity
    }
    const tintTexture = new THREE.DataTexture(
      tintArray,
      simDim,
      simDim,
      THREE.RGBAFormat,
      THREE.UnsignedByteType
    );
    tintTexture.needsUpdate = true;

    // Track permanent tinted particles (critical & high findings)
    const permanentTints: Map<number, { r: number; g: number; b: number; floor: number }> =
      new Map();

    // Particle render Scene
    const renderScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 5.2);

    // Particle Geometry
    const particleGeo = new THREE.BufferGeometry();
    const uvs = new Float32Array(totalPoints * 3);
    for (let i = 0; i < totalPoints; i++) {
      const x = (i % simDim) / simDim;
      const y = Math.floor(i / simDim) / simDim;
      uvs[i * 3 + 0] = x;
      uvs[i * 3 + 1] = y;
      uvs[i * 3 + 2] = 0;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(uvs, 3));

    const particleUniforms = {
      tPositions: { value: rtPosA.texture },
      tTint: { value: tintTexture },
      tMatcap: { value: matcapTexture },
      uPointSize: { value: 2.4 },
      uDPR: { value: dpr },
      uRingFlash: { value: 0.0 },
    };

    const particleMaterial = new THREE.ShaderMaterial({
      vertexShader: PARTICLE_VERTEX_SHADER,
      fragmentShader: PARTICLE_FRAGMENT_SHADER,
      uniforms: particleUniforms,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particlePoints = new THREE.Points(particleGeo, particleMaterial);
    renderScene.add(particlePoints);

    // Mouse stirring tracker (Section 8 fluid sim)
    let prevMouseX = 0;
    let prevMouseY = 0;
    let mouseVelX = 0;
    let mouseVelY = 0;
    let mouseWorld = new THREE.Vector3(999, 999, 0);

    const onPointerMove = (e: MouseEvent) => {
      if (reducedMotion) return;
      const ndcX = (e.clientX / window.innerWidth) * 2 - 1;
      const ndcY = -(e.clientY / window.innerHeight) * 2 + 1;

      // Unproject to z=0 plane
      const vec = new THREE.Vector3(ndcX, ndcY, 0.5);
      vec.unproject(camera);
      vec.sub(camera.position).normalize();
      const distance = -camera.position.z / vec.z;
      const posAtZ0 = camera.position.clone().add(vec.multiplyScalar(distance));
      mouseWorld.copy(posAtZ0);

      mouseVelX = (posAtZ0.x - prevMouseX) * 0.45;
      mouseVelY = (posAtZ0.y - prevMouseY) * 0.45;
      prevMouseX = posAtZ0.x;
      prevMouseY = posAtZ0.y;
    };

    window.addEventListener('pointermove', onPointerMove);

    // Handle tab visibility to pause simulation
    let isHidden = false;
    const onVisibilityChange = () => {
      isHidden = document.hidden;
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    // Handle window resize
    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Helper: flash random particles for a new finding
    let lastSeenFindingsCount = 0;
    const applyFindingTint = (findingIndex: number) => {
      const finding = findings[findingIndex];
      const colorHex = (finding ? SEVERITY_COLORS[finding.severity] : '#FF3B5C') as THREE.ColorRepresentation;
      const c = new THREE.Color(colorHex);
      const isCriticalOrHigh =
        finding?.severity === 'critical' || finding?.severity === 'high';

      // Pick 350 random particles to tint
      const batchSize = Math.min(350, Math.floor(totalPoints / 20));
      for (let k = 0; k < batchSize; k++) {
        const pIndex = Math.floor(Math.random() * totalPoints);
        const pIdx = pIndex * 4;
        tintArray[pIdx + 0] = Math.floor(c.r * 255);
        tintArray[pIdx + 1] = Math.floor(c.g * 255);
        tintArray[pIdx + 2] = Math.floor(c.b * 255);
        tintArray[pIdx + 3] = 255; // full flash

        if (isCriticalOrHigh) {
          permanentTints.set(pIndex, {
            r: tintArray[pIdx + 0],
            g: tintArray[pIdx + 1],
            b: tintArray[pIdx + 2],
            floor: 180, // stay permanently tinted
          });
        }
      }
      tintTexture.needsUpdate = true;
    };

    // Animation loop
    let clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (isHidden) return;

      const delta = Math.min(clock.getDelta(), 0.05);
      const elapsedTime = clock.getElapsedTime();
      const {
        status: currentStatus,
        findingsCount,
        isDryingDolly: isDolly,
        ringFlash: flashVal,
      } = stateRef.current;

      // Check for incoming findings
      if (findingsCount > lastSeenFindingsCount) {
        for (let fi = lastSeenFindingsCount; fi < findingsCount; fi++) {
          applyFindingTint(fi);
        }
        lastSeenFindingsCount = findingsCount;
      }

      // Decay particle tints towards base or floor
      let tintNeedsUpdate = false;
      const decayRate = 180 * delta; // decays over ~1.5s
      for (let i = 0; i < totalPoints; i++) {
        const idx = i * 4;
        const currentAlpha = tintArray[idx + 3];
        const perm = permanentTints.get(i);
        const targetFloor = perm ? perm.floor : 0;

        if (currentAlpha > targetFloor) {
          tintArray[idx + 3] = Math.max(targetFloor, Math.round(currentAlpha - decayRate));
          tintNeedsUpdate = true;
        }
      }
      if (tintNeedsUpdate) {
        tintTexture.needsUpdate = true;
      }

      // Decay ring flash
      if (stateRef.current.ringFlash > 0.001) {
        stateRef.current.ringFlash = Math.max(0, stateRef.current.ringFlash - delta * 1.5);
      }

      // Camera dolly-in transition (700ms lerp from 5.2 to 3.4)
      const targetCameraZ = isDolly || currentStatus === 'scanning' ? 3.4 : 5.2;
      camera.position.z += (targetCameraZ - camera.position.z) * (delta * 4.5);

      // Decay mouse velocity (fluid sim stir heals within ~2.0s)
      mouseVelX *= Math.pow(0.85, delta * 60);
      mouseVelY *= Math.pow(0.85, delta * 60);

      // State-driven simulation tuning
      let speed = 1.0;
      let curl = 0.42;

      if (currentStatus === 'scanning') {
        speed = 2.4; // Ring rotates faster
        curl = 0.85; // Curl noise ramps up
      } else if (currentStatus === 'done') {
        speed = 0.75; // Settle
        curl = 0.35;
      }

      // Update simulation uniforms
      simUniforms.uTime.value = elapsedTime;
      simUniforms.uDelta.value = delta;
      simUniforms.uSpeed.value = speed;
      simUniforms.uCurlStrength.value = curl;
      simUniforms.uMouse.value.copy(mouseWorld);
      simUniforms.uMouseVel.value.set(mouseVelX, mouseVelY);
      simUniforms.uRingFlash.value = stateRef.current.ringFlash;
      simUniforms.tPositions.value = rtPosA.texture;

      // 1. Sim Pass: render to rtPosB
      renderer.setRenderTarget(rtPosB);
      renderer.render(simScene, simCamera);

      // Ping-pong swap
      const temp = rtPosA;
      rtPosA = rtPosB;
      rtPosB = temp;

      // 2. Render Pass: render particles to screen
      renderer.setRenderTarget(null);
      particleUniforms.tPositions.value = rtPosA.texture;
      particleUniforms.uRingFlash.value = stateRef.current.ringFlash;

      // Subtle scene rotation
      particlePoints.rotation.z += delta * 0.08 * speed;
      particlePoints.rotation.x = Math.sin(elapsedTime * 0.2) * 0.12;

      renderer.render(renderScene, camera);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      renderer.dispose();
      rtPosA.dispose();
      rtPosB.dispose();
      initPosTex.dispose();
      tintTexture.dispose();
      particleGeo.dispose();
      particleMaterial.dispose();
      simMaterial.dispose();
    };
  }, [findings]);

  return (
    <>
      <canvas
        id="bg"
        ref={canvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none z-0"
        style={{ display: webglSupported ? 'block' : 'none' }}
      />
      {!webglSupported && (
        <div
          className="fixed inset-0 w-full h-full pointer-events-none z-0 bg-[#000]"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, rgba(170, 136, 255, 0.18) 0%, rgba(0, 0, 0, 0.98) 72%), radial-gradient(#2a2a2a 1px, transparent 1px)`,
            backgroundSize: '100% 100%, 28px 28px',
          }}
        />
      )}
    </>
  );
}
