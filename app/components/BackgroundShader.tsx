"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const fragmentShader = `
uniform float uTime;
uniform vec2 uResolution;
varying vec2 vUv;

float hash(vec2 p) {
  p = fract(p * vec2(127.1, 311.7));
  p += dot(p, p + 43.21);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  ) * 2.0 - 1.0;
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(0.8775, 0.4794, -0.4794, 0.8775); // rotate ~28deg
  for (int i = 0; i < 5; i++) {
    v += a * vnoise(p);
    p = rot * p * 2.1 + vec2(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = vUv - 0.5;
  uv.x *= uResolution.x / uResolution.y;

  // Blob center drifts slowly around screen center
  vec2 center = vec2(
    0.18 * sin(uTime * 0.19 + 1.0) + 0.06 * cos(uTime * 0.43),
    0.14 * cos(uTime * 0.15) + 0.07 * sin(uTime * 0.31)
  );

  vec2 p = uv - center;
  float dist = length(p);
  float angle = atan(p.y, p.x);

  // Sample FBM around the perimeter to morph the blob outline
  vec2 noiseCoord = vec2(cos(angle), sin(angle)) * 1.8 + uTime * 0.1;
  float n = fbm(noiseCoord);

  float radius = 0.22 + n * 0.07;
  float blob = smoothstep(radius + 0.05, radius - 0.02, dist);

  // Soft ambient glow that follows the blob
  float glow = exp(-dist * 5.5) * 0.055;

  float lum = blob * 0.19 + glow;
  gl_FragColor = vec4(vec3(lum), 1.0);
}
`;

export default function BackgroundShader() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2() },
      },
    });

    scene.add(new THREE.Mesh(geometry, material));

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      material.uniforms.uResolution.value.set(w, h);
    };

    resize();
    window.addEventListener("resize", resize);

    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      material.uniforms.uTime.value = clock.getElapsedTime();
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
