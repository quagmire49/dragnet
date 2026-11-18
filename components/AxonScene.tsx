'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { getSoftSphereMatcapUri } from '@/lib/matcap';

// Ping-pong sim vertex shader
const SIM_VS = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

// Ping-pong simulation fragment shader per Section 7
const SIM_FS = `
  uniform sampler2D tPositions;
  uniform sampler2D tOrigins;
  uniform float uTime;
  uniform float uHZ;
  uniform vec2 uMousePos;
  uniform vec2 uMouseVel;
  varying vec2 vUv;

  float sdfShape(vec3 p) {
    // Mirror depth axis
    p.z = sqrt(p.z * p.z + 0.0215) - sqrt(0.012);

    // Rotate by quaternion (0.5, 0.5, 0.5, 0.5)
    vec3 qv = vec3(0.5, 0.5, 0.5);
    p = p + 2.0 * cross(qv, cross(qv, p) + 0.5 * p);

    float r = length(p);
    if (r > 0.8) return r - 0.7;

    // Sculpted organic ring form
    float R = 0.44;
    float tube = 0.17 + 0.04 * sin(atan(p.y, p.x) * 3.0 + p.z * 3.5);
    float dXY = length(p.xy) - R;
    return length(vec2(dXY, p.z)) - tube;
  }

  vec3 sdfNormal(vec3 p) {
    float eps = 0.001;
    float d = sdfShape(p);
    return normalize(vec3(
      sdfShape(p + vec3(eps, 0.0, 0.0)) - d,
      sdfShape(p + vec3(0.0, eps, 0.0)) - d,
      sdfShape(p + vec3(0.0, 0.0, eps)) - d
    ));
  }

  vec3 curlNoise(vec3 p) {
    float s1 = sin(p.y * 3.14 + p.z * 1.5);
    float c1 = cos(p.x * 2.71 + p.z * 3.14);
    float s2 = sin(p.x * 1.61 - p.y * 2.3);
    float c2 = cos(p.y * 3.0 + p.x * 1.2);
    float s3 = sin(p.z * 2.0 + p.x * 2.5);
    float c3 = cos(p.z * 1.8 - p.y * 1.4);
    return normalize(vec3(c1 - s2, c2 - s3, c3 - s1));
  }

  void main() {
    vec4 posData = texture2D(tPositions, vUv);
    vec4 origData = texture2D(tOrigins, vUv);
    vec3 pos = posData.xyz;
    vec3 origin = origData.xyz;

    if (length(pos) > 0.75) pos /= 1.8;

    // Curl noise
    pos += curlNoise(pos * 0.1 + uTime * 0.05) * 1.0 * 0.0002 * uHZ;

    // SDF pull & swirl
    vec3 gradient = sdfNormal(pos);
    float sdf = sdfShape(pos);
    pos += cross(normalize(pos + 0.0001), normalize(gradient + 0.0001)) * 0.0005;
    pos += -gradient * sdf * 0.45;

    // Spring back to origin
    pos += (origin - pos) * 0.0002 * uHZ;

    // Mouse fluid interaction
    vec2 toMouse = pos.xy - uMousePos;
    float dMouse = length(toMouse);
    if (dMouse < 0.65 && length(uMouseVel) > 0.001) {
      float force = (1.0 - dMouse / 0.65) * 0.015;
      pos += vec3(uMouseVel * force, 0.0);
    }

    // Wrap / bounds check
    if (isnan(pos.x) || length(pos) > 2.5) {
      pos = origin;
    }

    gl_FragColor = vec4(pos, posData.w);
  }
`;

// Point rendering vertex shader per Section 7
const POINT_VS = `
  attribute vec4 aRandom;
  uniform sampler2D tPositions;
  uniform float uDPR;
  uniform float uTime;
  varying vec4 vRandom;
  varying float vScale;

  void main() {
    vRandom = aRandom;
    vec4 posData = texture2D(tPositions, position.xy);
    vec3 pos = posData.xyz;

    pos *= mix(1.0, 1.5, pow(aRandom.y, 150.0));

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    float distToCamera = -mvPosition.z;
    vScale = smoothstep(2.0, 14.0, distToCamera) * mix(0.5, 1.0, aRandom.z);

    gl_PointSize = 0.045 * uDPR * 2.0 * vScale * (1000.0 / distToCamera);
    gl_PointSize = clamp(gl_PointSize, 1.0, 32.0);

    gl_Position = projectionMatrix * mvPosition;
  }
`;

// Point rendering fragment shader per Section 7
const POINT_FS = `
  uniform float uTime;
  uniform sampler2D tMatcap;
  varying vec4 vRandom;
  varying float vScale;

  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5 || vScale < 0.08) discard;

    // Base colour mix(0.0, 0.2, random.x) grey, mixed to lavender (0.6, 0.45, 1.0) by pow(random.z, 100)
    vec3 grey = vec3(mix(0.12, 0.28, vRandom.x));
    vec3 lavender = vec3(0.66, 0.53, 1.0);
    vec3 baseColor = mix(grey, lavender, pow(vRandom.z, 65.0));

    // Sparkle 0.5 + (0.4 + sin(time*4 + random.y*20)) * pow(random.z, 10) * 2.5
    float sparkle = 0.5 + (0.4 + sin(uTime * 4.0 + vRandom.y * 20.0)) * pow(vRandom.z, 10.0) * 2.5;

    // Matcap sample with rotation
    float rotAngle = sin(uTime + vRandom.z * 20.0) * 0.5 + 1.0;
    vec2 rotCoord = vec2(
      coord.x * cos(rotAngle) - coord.y * sin(rotAngle),
      coord.x * sin(rotAngle) + coord.y * cos(rotAngle)
    ) + vec2(0.5);
    vec4 matcap = texture2D(tMatcap, rotCoord);

    vec3 finalColor = baseColor * sparkle + matcap.rgb * 0.35;
    float circleAlpha = smoothstep(0.5, 0.15, dist);

    gl_FragColor = vec4(finalColor, circleAlpha * 0.95);
  }
`;

export function AxonScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const isMobile = window.innerWidth <= 760;
    const simDim = isMobile ? 128 : 512;
    const totalPoints = simDim * simDim;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: false,
        alpha: false,
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 1.0);

    const isWebGL2 = renderer.capabilities.isWebGL2;
    const textureType = isWebGL2 ? THREE.FloatType : THREE.HalfFloatType;

    // Scene & Camera setup per Section 7
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 1000);
    const baseCamPos = new THREE.Vector3(-1.17, 0, 6);
    camera.position.copy(baseCamPos);
    camera.lookAt(0, 0, 0);

    // Group holding points at (0.343, 0.16, -1), rotation (-28.4, 390, 4.92), scale (5, 5, 6)
    const pointsGroup = new THREE.Group();
    pointsGroup.position.set(0.343, 0.16, -1);
    pointsGroup.rotation.set(
      (-28.4 * Math.PI) / 180,
      (390 * Math.PI) / 180,
      (4.92 * Math.PI) / 180
    );
    pointsGroup.scale.set(5, 5, 6);
    scene.add(pointsGroup);

    // Initial random positions
    const posData = new Float32Array(totalPoints * 4);
    const origData = new Float32Array(totalPoints * 4);
    for (let i = 0; i < totalPoints; i++) {
      const idx = i * 4;
      // uniform in [-0.5, 0.5]^3
      const x = (Math.random() - 0.5) * 0.9;
      const y = (Math.random() - 0.5) * 0.9;
      const z = (Math.random() - 0.5) * 0.9;
      posData[idx + 0] = x;
      posData[idx + 1] = y;
      posData[idx + 2] = z;
      posData[idx + 3] = 1.0;

      origData[idx + 0] = x;
      origData[idx + 1] = y;
      origData[idx + 2] = z;
      origData[idx + 3] = 1.0;
    }

    const posTexture = new THREE.DataTexture(posData, simDim, simDim, THREE.RGBAFormat, THREE.FloatType);
    posTexture.needsUpdate = true;

    const origTexture = new THREE.DataTexture(origData, simDim, simDim, THREE.RGBAFormat, THREE.FloatType);
    origTexture.needsUpdate = true;

    const rtOptions: THREE.WebGLRenderTargetOptions = {
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: textureType,
      depthBuffer: false,
      stencilBuffer: false,
    };

    let rtPosA = new THREE.WebGLRenderTarget(simDim, simDim, rtOptions);
    let rtPosB = new THREE.WebGLRenderTarget(simDim, simDim, rtOptions);

    // Seed rtPosA
    const seedScene = new THREE.Scene();
    const seedCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const seedMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial({ map: posTexture }));
    seedScene.add(seedMesh);
    renderer.setRenderTarget(rtPosA);
    renderer.render(seedScene, seedCam);
    renderer.setRenderTarget(null);

    // Simulation pass
    const simScene = new THREE.Scene();
    const simCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const simUniforms = {
      tPositions: { value: rtPosA.texture },
      tOrigins: { value: origTexture },
      uTime: { value: 0 },
      uHZ: { value: 1.0 },
      uMousePos: { value: new THREE.Vector2(999, 999) },
      uMouseVel: { value: new THREE.Vector2(0, 0) },
    };
    const simMaterial = new THREE.ShaderMaterial({
      vertexShader: SIM_VS,
      fragmentShader: SIM_FS,
      uniforms: simUniforms,
      depthWrite: false,
    });
    simScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), simMaterial));

    // Particle geometry
    const particleGeo = new THREE.BufferGeometry();
    const uvs = new Float32Array(totalPoints * 3);
    const randoms = new Float32Array(totalPoints * 4);

    for (let i = 0; i < totalPoints; i++) {
      const u = (i % simDim) / simDim;
      const v = Math.floor(i / simDim) / simDim;
      uvs[i * 3 + 0] = u;
      uvs[i * 3 + 1] = v;
      uvs[i * 3 + 2] = 0;

      randoms[i * 4 + 0] = Math.random();
      randoms[i * 4 + 1] = Math.random();
      randoms[i * 4 + 2] = Math.random();
      randoms[i * 4 + 3] = Math.random();
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(uvs, 3));
    particleGeo.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 4));

    // Matcap
    const matcapUri = getSoftSphereMatcapUri();
    const matcapTexture = new THREE.TextureLoader().load(matcapUri);

    const particleUniforms = {
      tPositions: { value: rtPosA.texture },
      tMatcap: { value: matcapTexture },
      uDPR: { value: dpr },
      uTime: { value: 0 },
    };

    const particleMat = new THREE.ShaderMaterial({
      vertexShader: POINT_VS,
      fragmentShader: POINT_FS,
      uniforms: particleUniforms,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthTest: true,
      depthWrite: false,
    });

    const points = new THREE.Points(particleGeo, particleMat);
    pointsGroup.add(points);

    // Mouse Gaze & Fluid tracking per Section 7 & 8
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let prevMouseX = mouseX;
    let prevMouseY = mouseY;
    let mouseVelX = 0;
    let mouseVelY = 0;
    const targetCamPos = baseCamPos.clone();

    const onPointerMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      const normX = (mouseX / window.innerWidth) * 2 - 1;
      const normY = (mouseY / window.innerHeight) * 2 - 1;

      // Gaze camera: target = base + (-normX) on x, (normY * 2) on y
      targetCamPos.x = baseCamPos.x + -normX * 1.0;
      targetCamPos.y = baseCamPos.y + normY * 1.5;

      mouseVelX = (mouseX - prevMouseX) * 0.02;
      mouseVelY = -(mouseY - prevMouseY) * 0.02;
      prevMouseX = mouseX;
      prevMouseY = mouseY;

      // Sim space mouse
      simUniforms.uMousePos.value.set(normX * 0.5, -normY * 0.5);
      simUniforms.uMouseVel.value.set(mouseVelX, mouseVelY);
    };

    window.addEventListener('pointermove', onPointerMove);

    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Animation loop
    let clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.getElapsedTime();

      // Camera lerp gaze at 0.05
      camera.position.lerp(targetCamPos, 0.05);
      camera.lookAt(0, 0, 0);

      // Mouse velocity damping
      mouseVelX *= 0.92;
      mouseVelY *= 0.92;
      simUniforms.uMouseVel.value.set(mouseVelX, mouseVelY);

      // Simulation pass
      simUniforms.uTime.value = elapsed;
      simUniforms.uHZ.value = delta * 60;
      simUniforms.tPositions.value = rtPosA.texture;

      renderer.setRenderTarget(rtPosB);
      renderer.render(simScene, simCam);

      // Ping-pong swap
      const temp = rtPosA;
      rtPosA = rtPosB;
      rtPosB = temp;

      // Render pass
      renderer.setRenderTarget(null);
      particleUniforms.tPositions.value = rtPosA.texture;
      particleUniforms.uTime.value = elapsed;

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      rtPosA.dispose();
      rtPosB.dispose();
      posTexture.dispose();
      origTexture.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      simMaterial.dispose();
    };
  }, []);

  return (
    <canvas
      id="bg"
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
    />
  );
}
