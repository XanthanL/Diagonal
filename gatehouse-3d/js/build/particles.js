// 粒子层:灵火(萤火般的漂浮光点) + 灵光门流光(绕门盘旋吸入的粒子)
import * as THREE from 'three';
import { C, ENV, GATE, PORTAL, TERRACE } from '../spec.js';
import { dotTexture } from './util.js';

// ---------- 灵火:全场景漂浮的暖金/玉色光点,各自明灭 ----------
export function buildFireflies() {
  const n = ENV.fireflies.count;
  const pos = new Float32Array(n * 3);
  const phase = new Float32Array(n);
  const tint = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 6 + Math.random() * 34;
    pos[i * 3] = Math.cos(a) * r;
    pos[i * 3 + 1] = 1 + Math.random() * 13;
    pos[i * 3 + 2] = Math.sin(a) * r * 0.8 - 4;
    phase[i] = Math.random() * Math.PI * 2;
    tint[i] = Math.random(); // 0=暖金 1=玉
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
  geo.setAttribute('aTint', new THREE.BufferAttribute(tint, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      time: { value: 0 },
      map: { value: dotTexture() },
      cGold: { value: new THREE.Color(C.spirit) },
      cJade: { value: new THREE.Color(C.portal) },
    },
    vertexShader: `
      attribute float aPhase; attribute float aTint;
      varying float vA; varying float vT;
      uniform float time;
      void main() {
        vT = aTint;
        vec3 p = position;
        p.y += sin(time * 0.35 + aPhase) * 0.9;                 // 缓慢沉浮
        p.x += sin(time * 0.22 + aPhase * 2.1) * 0.7;
        float tw = 0.35 + 0.65 * pow(0.5 + 0.5 * sin(time * 1.4 + aPhase * 3.0), 2.0);
        vA = tw;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = (52.0 + 26.0 * tw) / -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying float vA; varying float vT;
      uniform sampler2D map; uniform vec3 cGold; uniform vec3 cJade;
      void main() {
        vec4 d = texture2D(map, gl_PointCoord);
        vec3 col = mix(cGold, cJade, vT);
        gl_FragColor = vec4(col, d.a * vA * 0.9);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const pts = new THREE.Points(geo, mat);
  pts.name = 'fireflies';
  pts.userData.tick = (t) => { mat.uniforms.time.value = t; };
  return pts;
}

// ---------- 灵光门流光:粒子绕门盘旋、被吸入门心 ----------
export function buildPortalStream() {
  const n = 60;
  const seed = new Float32Array(n * 4); // r0, a0, speed, tilt
  for (let i = 0; i < n; i++) {
    seed[i * 4] = 0.4 + Math.random() * 2.6;
    seed[i * 4 + 1] = Math.random() * Math.PI * 2;
    seed[i * 4 + 2] = 0.25 + Math.random() * 0.5;
    seed[i * 4 + 3] = (Math.random() - 0.5) * 1.2;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      time: { value: 0 },
      map: { value: dotTexture() },
      cJade: { value: new THREE.Color(C.portal) },
      cGold: { value: new THREE.Color(C.portalGold) },
      origin: {
        value: new THREE.Vector3(
          0,
          TERRACE.L1.h + TERRACE.L2.h + TERRACE.L3.h + (PORTAL.straight + PORTAL.halfW) * 0.5,
          PORTAL.z
        ),
      },
    },
    vertexShader: `
      attribute vec4 aSeed;
      uniform float time; uniform vec3 origin;
      varying float vFade; varying float vK;
      void main() {
        vK = fract(aSeed.z * time * 0.22 + aSeed.y / 6.2831853);   // 生命周期 0→1
        float r = mix(aSeed.x, 0.08, vK);                          // 被吸向门心
        float a = aSeed.y + time * (0.5 + aSeed.z) + vK * 4.0;
        vec3 p = origin;
        p.x += cos(a) * r;
        p.y += sin(a) * r * (0.85 + 0.3 * sin(aSeed.w * 3.0)) + aSeed.w * (1.0 - vK) * 0.4;
        p.z += sin(a * 2.0) * 0.25;
        vFade = sin(vK * 3.14159265);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = (34.0 + 30.0 * (1.0 - vK)) / -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying float vFade; varying float vK;
      uniform sampler2D map; uniform vec3 cJade; uniform vec3 cGold;
      void main() {
        vec4 d = texture2D(map, gl_PointCoord);
        vec3 col = mix(cJade, cGold, smoothstep(0.3, 1.0, vK));
        gl_FragColor = vec4(col, d.a * vFade * 0.85);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const pts = new THREE.Points(geo, mat);
  pts.name = 'portal-stream';
  pts.renderOrder = 3;
  pts.userData.tick = (t) => { mat.uniforms.time.value = t; };
  return pts;
}
