"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

const VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const FRAG = `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform float uProjectionIntensity;
uniform float uReflectionGain;
uniform float uHighlightBoost;
uniform float uLumaVisibilityThreshold;
uniform float uInvertColor;
uniform float uHalftone;
uniform float uToneCut;

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

float snoise(vec2 v) {
  const vec4 C = vec4(
    0.211324865405187,
    0.366025403784439,
    -0.577350269189626,
    0.024390243902439
  );
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * snoise(p);
    p = p * 2.0 + vec2(17.0, 31.0);
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = vUv;
  vec2 p = uv * 2.0 - 1.0;
  float t = uTime;

  vec2 flow = vec2(t * 0.19, t * 0.13);
  vec2 q = vec2(
    fbm(p * 1.05 + flow),
    fbm(p * 1.05 + vec2(-flow.y * 1.1, flow.x * 0.9))
  );
  vec2 w = p + q * 0.62;

  float nA = 0.5 + 0.5 * fbm(w * 2.15 + flow * 0.8);
  float nB = 0.5 + 0.5 * fbm(w * 4.8 + vec2(-flow.x * 0.5, flow.y * 0.35));
  float ridge = 1.0 - abs(2.0 * nB - 1.0);
  float mask = clamp(0.18 + 1.12 * (0.58 * nA + 0.42 * ridge), 0.0, 1.0);
  float edgeFade = 1.0 - clamp(length(p) * 0.7, 0.0, 1.0);
  float intensity = pow(clamp(mask * (0.72 + edgeFade * 0.45), 0.0, 1.0), 1.05);

  float base = nA * 0.82 + ridge * 0.18;
  vec3 col = vec3(
    0.18 + 0.86 * (0.5 + 0.5 * cos(6.28318 * (base + 0.02 + t * 0.07))),
    0.14 + 0.9  * (0.5 + 0.5 * cos(6.28318 * (base + 0.37 + t * 0.06))),
    0.2  + 0.9  * (0.5 + 0.5 * cos(6.28318 * (base + 0.72 + t * 0.065)))
  );
  col *= intensity;

  float highlight = pow(clamp((nA * 1.1 + ridge * 0.75) - 1.1, 0.0, 1.0), 2.2);
  col = mix(col, vec3(1.0, 0.96, 0.92), highlight * vec3(0.22, 0.16, 0.1));
  vec3 tex = clamp(col, 0.0, 1.0);

  if (uInvertColor > 0.5) {
    tex = vec3(1.0) - tex;
  }

  if (uToneCut > 0.5) {
    float toneLevels = 5.0;
    tex = floor(tex * (toneLevels - 1.0) + 0.5) / (toneLevels - 1.0);
  }

  float lum = dot(tex, vec3(0.2126, 0.7152, 0.0722));
  float lumaStart = clamp(uLumaVisibilityThreshold, 0.0, 1.0);
  float lumaEnd = min(1.0, lumaStart + 0.1);
  float darkMask = 1.0;
  if (lumaStart > 1e-4) {
    darkMask = smoothstep(lumaStart, lumaEnd, lum);
  }

  if (uHalftone > 0.5) {
    vec2 hUv = vUv * vec2(180.0, 120.0);
    vec2 hCell = fract(hUv) - 0.5;
    float dotRadius = mix(0.02, 0.45, clamp(lum, 0.0, 1.0));
    float dotMask = 1.0 - smoothstep(dotRadius, dotRadius + 0.035, length(hCell));
    tex *= dotMask * darkMask;
  }

  float hi = smoothstep(0.5, 1.0, lum);
  tex *= darkMask;
  tex *= mix(1.0, uHighlightBoost, hi);
  tex *= max(0.0, uProjectionIntensity) * max(0.0, uReflectionGain);

  gl_FragColor = vec4(tex, 1.0);
}
`;

type ProjectionEffects = {
  projectionIntensity: number;
  reflectionGain: number;
  highlightBoost: number;
  lumaVisibilityThreshold: number;
  invertColor: boolean;
  halftone: boolean;
  toneCut: boolean;
};

function createProjectedFloor(width: number, depth: number, material: THREE.Material, segments = 64) {
  const geometry = new THREE.PlaneGeometry(width, depth, segments, segments);
  geometry.rotateX(-Math.PI / 2);
  return new THREE.Mesh(geometry, material);
}

function createKeyboard(material: THREE.Material) {
  const group = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.045, 0.42), material);
  base.position.y = 0.0225;
  group.add(base);

  const cols = 10;
  const rows = 3;
  const keyW = 0.09;
  const keyH = 0.072;
  const keyD = 0.07;
  const gapX = 0.012;
  const gapZ = 0.01;
  const startX = -((cols - 1) * (keyW + gapX)) / 2;
  const startZ = -((rows - 1) * (keyD + gapZ)) / 2;
  const keyGeo = new THREE.BoxGeometry(keyW, keyH, keyD);

  for (let rz = 0; rz < rows; rz += 1) {
    for (let cx = 0; cx < cols; cx += 1) {
      const key = new THREE.Mesh(keyGeo, material);
      key.position.set(
        startX + cx * (keyW + gapX),
        0.045 + keyH * 0.5 + 0.002,
        startZ + rz * (keyD + gapZ),
      );
      group.add(key);
    }
  }

  group.position.set(0, 0, 1.28);
  return group;
}

function createGradientRenderSource(width = 1024, height = 576) {
  const sourceScene = new THREE.Scene();
  const sourceCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const sourceMaterial = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: {
      uTime: { value: 0 },
      uProjectionIntensity: { value: 0.5 },
      uReflectionGain: { value: 1.0 },
      uHighlightBoost: { value: 1.65 },
      uLumaVisibilityThreshold: { value: 0.3 },
      uInvertColor: { value: 0 },
      uHalftone: { value: 0 },
      uToneCut: { value: 0 },
    },
    depthTest: false,
    depthWrite: false,
  });
  const sourceQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), sourceMaterial);
  sourceScene.add(sourceQuad);

  const target = new THREE.WebGLRenderTarget(width, height, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    type: THREE.UnsignedByteType,
    colorSpace: THREE.SRGBColorSpace,
    depthBuffer: false,
    stencilBuffer: false,
  });

  return {
    texture: target.texture,
    render(renderer: THREE.WebGLRenderer, timeSec: number) {
      const prevTarget = renderer.getRenderTarget();
      const prevXr = renderer.xr.enabled;
      renderer.xr.enabled = false;
      sourceMaterial.uniforms.uTime.value = timeSec;
      renderer.setRenderTarget(target);
      renderer.clear();
      renderer.render(sourceScene, sourceCamera);
      renderer.setRenderTarget(prevTarget);
      renderer.xr.enabled = prevXr;
    },
    setEffects(effects: ProjectionEffects) {
      sourceMaterial.uniforms.uProjectionIntensity.value = effects.projectionIntensity;
      sourceMaterial.uniforms.uReflectionGain.value = effects.reflectionGain;
      sourceMaterial.uniforms.uHighlightBoost.value = effects.highlightBoost;
      sourceMaterial.uniforms.uLumaVisibilityThreshold.value = effects.lumaVisibilityThreshold;
      sourceMaterial.uniforms.uInvertColor.value = effects.invertColor ? 1 : 0;
      sourceMaterial.uniforms.uHalftone.value = effects.halftone ? 1 : 0;
      sourceMaterial.uniforms.uToneCut.value = effects.toneCut ? 1 : 0;
    },
    dispose() {
      sourceQuad.geometry.dispose();
      sourceMaterial.dispose();
      target.dispose();
    },
  };
}

function createScreen(texture: THREE.Texture) {
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    toneMapped: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 1.3), material);
  mesh.position.set(0, 1.0, 0.5);
  return mesh;
}

export function IntroWorkstation() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.64;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    root.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 1.2, 5.5);
    camera.lookAt(0, 0.8, 0);

    const screenGradientSource = createGradientRenderSource();
    const projectionGradientSource = createGradientRenderSource();
    screenGradientSource.setEffects({
      projectionIntensity: 1,
      reflectionGain: 1,
      highlightBoost: 1,
      lumaVisibilityThreshold: 0,
      invertColor: false,
      halftone: false,
      toneCut: false,
    });

    const floorKeyboardMat = new THREE.MeshStandardMaterial({
      color: 0x07080d,
      roughness: 0.9,
      metalness: 0.08,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
    });

    const screen = createScreen(screenGradientSource.texture);
    const floorMesh = createProjectedFloor(100, 100, floorKeyboardMat);
    floorMesh.receiveShadow = true;

    const keyboard = createKeyboard(floorKeyboardMat);
    keyboard.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.receiveShadow = true;
        obj.castShadow = true;
      }
    });

    scene.add(screen, floorMesh, keyboard);

    const spot = new THREE.SpotLight(0xffffff, 132);
    spot.decay = 6;
    spot.distance = 35;
    spot.angle = Math.PI / 3.1;
    spot.penumbra = 0.58;
    spot.map = projectionGradientSource.texture;
    spot.castShadow = true;
    spot.shadow.mapSize.set(2048, 2048);
    spot.shadow.bias = -0.0002;
    spot.shadow.normalBias = 0.02;
    spot.position.set(0, 1.0, 0.52);
    spot.target.position.set(0, 0.02, 1.15);
    scene.add(spot, spot.target);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x060608, 0.04);
    hemiLight.position.set(0, 10, 0);
    scene.add(hemiLight);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.1, 0.18, 0.82);
    composer.addPass(bloomPass);
    composer.addPass(new OutputPass());

    const tune = {
      projectionIntensity: 1.08,
      reflectionGain: 0.58,
      blurRadiusPx: 24,
      highlightBoost: 1.32,
      lumaVisibilityThreshold: 0.22,
      invertColor: false,
      halftone: true,
      toneCut: false,
    };

    const syncProjectionFxFromTune = () => {
      const blend = Math.max(0, tune.projectionIntensity) * Math.max(0, tune.reflectionGain);
      spot.intensity = 132 * blend;
      floorKeyboardMat.envMapIntensity = 0.14 * Math.max(0.1, tune.reflectionGain);
      bloomPass.radius = THREE.MathUtils.clamp(tune.blurRadiusPx / 180, 0, 1);
      bloomPass.strength = 0.1 * Math.max(0.2, tune.highlightBoost);
      bloomPass.threshold = THREE.MathUtils.clamp(tune.lumaVisibilityThreshold, 0, 1);

      projectionGradientSource.setEffects({
        projectionIntensity: tune.projectionIntensity,
        reflectionGain: tune.reflectionGain,
        highlightBoost: tune.highlightBoost,
        lumaVisibilityThreshold: tune.lumaVisibilityThreshold,
        invertColor: tune.invertColor,
        halftone: tune.halftone,
        toneCut: tune.toneCut,
      });
    };

    let rafId = 0;

    const resize = () => {
      const rect = root.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height, false);
      composer.setSize(width, height);
      bloomPass.resolution.set(width, height);
    };

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const t = performance.now() * 0.001;
      screenGradientSource.render(renderer, t);
      projectionGradientSource.render(renderer, t);
      syncProjectionFxFromTune();
      composer.render();
    };

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      cancelAnimationFrame(rafId);
    };

    renderer.domElement.addEventListener("webglcontextlost", handleContextLost);
    syncProjectionFxFromTune();
    resize();
    animate();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      renderer.domElement.removeEventListener("webglcontextlost", handleContextLost);
      cancelAnimationFrame(rafId);
      screenGradientSource.dispose();
      projectionGradientSource.dispose();
      composer.dispose();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      floorKeyboardMat.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      if (renderer.domElement.parentNode === root) {
        root.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={rootRef} className="intro-workstation" aria-label="电脑与桌面反光视觉场景" />;
}
