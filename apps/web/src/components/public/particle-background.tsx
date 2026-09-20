'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from './motion-preference';

gsap.registerPlugin(ScrollTrigger);
const MAX_PARTICLES = 12000;
const vertexShader = `
precision highp float;
attribute vec3 aSpread;
attribute vec3 aWave;
attribute vec3 aClusters;
attribute vec3 aOrbit;
attribute vec3 aDisperse;
attribute float aSeed;
uniform float uTime, uProgress, uDpr, uReduced, uStrength, uVelocity;
uniform vec2 uMouse, uViewport;
varying float vOpacity;
// Smooth trilinear value noise, evaluated on the GPU rather than in a CPU particle loop.
float hash(vec3 p){p=fract(p*.3183099+vec3(.1,.2,.3));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
void main(){
 float progress=clamp(uProgress,0.,5.);
 float stage=floor(progress);
 float f=fract(progress);
 // Seeded variation has identical endpoints, so section boundaries never jump.
 f=clamp(f+sin(f*3.14159265)*(aSeed-.5)*.12,0.,1.);
 f=f*f*(3.-2.*f);
 float heroWeight=1.-smoothstep(0.,1.,progress);
 float mobile=1.-smoothstep(740.,760.,uViewport.x);
 vec3 hero=position;
 hero.x=mix(hero.x,(hero.x-.48)*1.7,mobile);
 hero.y=mix(hero.y,hero.y*.58-.68,mobile);
 vec3 from=hero,to=aSpread;
 if(stage>=1.){from=aSpread;to=aWave;}
 if(stage>=2.){from=aWave;to=aClusters;}
 if(stage>=3.){from=aClusters;to=aOrbit;}
 if(stage>=4.){from=aOrbit;to=aDisperse;}
 vec3 p=progress>=5.?aDisperse:mix(from,to,f);
 float time=uTime*.13;
 float n=noise(p*2.8+vec3(time,aSeed*13.,time*.7));
 p+=vec3(sin(n*6.28+aSeed*30.),cos(n*5.8+aSeed*20.),sin(n*4.))*.035*(1.-uReduced);
 float angle=sin(time*.36+progress*.25)*.025*(1.-uReduced);
 p.xy=mat2(cos(angle),-sin(angle),sin(angle),cos(angle))*p.xy;
 float depth=1.+p.z*.12;
 p.xy*=depth;
 vec2 offset=p.xy-uMouse;
 vec2 pixels=offset*uViewport*.5;
 float distanceToMouse=length(pixels);
 float falloff=1.-smoothstep(15.,155.,distanceToMouse);
 vec2 direction=pixels/max(distanceToMouse,1.);
 p.xy+=direction/uViewport*2.*falloff*uStrength*(9.+uVelocity*16.)*depth;
 p.xy+=uMouse*.007*(1.-uReduced);
 gl_Position=vec4(p.xy,clamp(p.z*.1,-.9,.9),1.);
 gl_PointSize=(1.65+aSeed*1.85)*uDpr*clamp(depth,.8,1.2)*mix(1.,.85,heroWeight);
 vOpacity=(.38+aSeed*.40)*(1.-smoothstep(.85,1.35,length(p.xy))*.5);
 float heroDensity=smoothstep(.52,.60,aSeed)*.65;
 float edgeFade=1.-smoothstep(.72,.94,p.y);
 vOpacity*=mix(1.,heroDensity*edgeFade*mix(smoothstep(-.05,.16,p.x),1.,mobile),heroWeight);
}
`;
const fragmentShader = `
precision highp float;
varying float vOpacity;
void main(){float d=length(gl_PointCoord-.5);float alpha=(1.-smoothstep(.12,.5,d))*vOpacity;if(alpha<.008)discard;gl_FragColor=vec4(.55,.88,1.0,alpha);}
`;

function createGeometry() {
  let state = 49173;
  const random = () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const arrays = Array.from({ length: 6 }, () => new Float32Array(MAX_PARTICLES * 3));
  const seeds = new Float32Array(MAX_PARTICLES);
  for (let i = 0; i < MAX_PARTICLES; i++) {
    const t = random() * Math.PI * 2;
    const r = Math.sqrt(random());
    const z = random() * 2 - 1;
    const jitter = random() - 0.5;
    const lane = Math.floor(random() * 3);
    seeds[i] = random();
    const put = (scene: number, x: number, y: number, depth: number) =>
      arrays[scene].set([x, y, depth], i * 3);
    // Three fine, asymmetric ribbons leave negative space around the portrait.
    const arc = t * 0.83 + lane * 0.28;
    const band = 0.82 + lane * 0.12 + jitter * 0.09;
    put(
      0,
      0.48 + Math.cos(arc) * band * 0.48,
      -0.02 + Math.sin(arc) * band * 0.62 + Math.cos(arc * 2) * 0.055,
      z * 0.3,
    );
    put(1, Math.cos(t) * r * 1.28, Math.sin(t) * r * 0.22 + Math.sin(t * 2) * 0.12, z * 0.5);
    const x = (t / Math.PI - 1) * 1.2;
    put(2, x, Math.sin(x * 3.2 + lane * 0.7) * 0.28 + (lane - 1) * 0.18 + jitter * 0.1, z * 0.45);
    put(
      3,
      [-0.7, 0.38, 0.72][lane] + Math.cos(t) * r * 0.25,
      [0.35, -0.4, 0.5][lane] + Math.sin(t) * r * 0.3,
      z * 0.7,
    );
    const radius = 0.52 + jitter * 0.15;
    put(
      4,
      Math.cos(t) * radius + 0.25,
      Math.sin(t) * radius * 0.72 + z * 0.17,
      Math.sin(t) * 0.6 + z * 0.15,
    );
    put(5, Math.cos(t) * (0.4 + r * 0.9), Math.sin(t) * (0.3 + r * 0.8), z);
  }
  const geometry = new THREE.BufferGeometry();
  ['position', 'aSpread', 'aWave', 'aClusters', 'aOrbit', 'aDisperse'].forEach((name, i) =>
    geometry.setAttribute(name, new THREE.BufferAttribute(arrays[i], 3)),
  );
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  return geometry;
}

/** One persistent, decorative WebGL field. Existing hero WebGL and page effects stay independent. */
export function ParticleBackground() {
  const host = useRef<HTMLDivElement>(null);
  const runtime = useRef<{ bind: () => void; motion: (value: boolean) => void } | null>(null);
  const reduced = useReducedMotion();
  const path = usePathname();
  useEffect(() => {
    const container = host.current;
    if (!container) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: false,
        powerPreference: 'low-power',
      });
    } catch {
      return;
    } // Existing patterned background remains when WebGL is unavailable.
    renderer.setClearColor(0x000000, 0);
    const canvas = renderer.domElement;
    canvas.setAttribute('aria-hidden', 'true');
    container.appendChild(canvas);
    const geometry = createGeometry();
    const uniforms = {
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uDpr: { value: 1 },
      uReduced: { value: 0 },
      uMouse: { value: new THREE.Vector2(3, 3) },
      uViewport: { value: new THREE.Vector2(1, 1) },
      uStrength: { value: 0 },
      uVelocity: { value: 0 },
    };
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });
    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    const scene = new THREE.Scene();
    scene.add(points);
    const camera = new THREE.Camera();
    const scroll = { value: 0 };
    let timeline: gsap.core.Timeline | undefined;
    let frame = 0,
      previous = 0,
      elapsed = 0,
      resizeTimer: ReturnType<typeof setTimeout> | undefined;
    let reducedMotion =
      matchMedia('(prefers-reduced-motion:reduce)').matches ||
      document.documentElement.dataset.motion === 'reduce';
    let contextLost = false,
      disposed = false,
      count = MAX_PARTICLES,
      budget = MAX_PARTICLES;
    let sampleTime = 0,
      sampleFrames = 0,
      slowSamples = 0;
    let mouseX = 3,
      mouseY = 3,
      lastX = 0,
      lastY = 0,
      lastMove = 0,
      velocity = 0,
      strength = 0;
    const finePointer = matchMedia('(pointer:fine)');
    const bind = () => {
      timeline?.scrollTrigger?.kill();
      timeline?.kill();
      const sections = ['#home', '#about', '#work', '#services', '#experience', '#contact']
        .map((selector) => document.querySelector<HTMLElement>(selector))
        .filter((el): el is HTMLElement => !!el);
      if (sections.length < 2) {
        scroll.value = 0;
        return;
      }
      const offsets = sections.map((el) =>
        Math.max(0, el.getBoundingClientRect().top + window.scrollY - innerHeight * 0.2),
      );
      offsets[0] = 0;
      const end = Math.max(
        1,
        Math.min(offsets.at(-1)!, document.documentElement.scrollHeight - innerHeight),
      );
      timeline = gsap.timeline({
        scrollTrigger: {
          id: 'portfolio-particle-field',
          start: 0,
          end: () => end,
          scrub: true,
          invalidateOnRefresh: true,
        },
      });
      for (let i = 1; i < sections.length; i++) {
        const start = Math.min(offsets[i - 1], end),
          finish = Math.min(offsets[i], end);
        timeline.fromTo(
          scroll,
          { value: i - 1 },
          {
            value: i,
            duration: Math.max(0.001, finish - start),
            ease: 'none',
            immediateRender: false,
          },
          start,
        );
      }
      timeline.scrollTrigger?.refresh();
      timeline.scrollTrigger?.update();
    };
    const resize = () => {
      const width = innerWidth,
        height = innerHeight;
      budget = width < 640 ? 3000 : width < 1024 ? 6000 : MAX_PARTICLES;
      count = Math.min(count, budget);
      if (!slowSamples) count = budget;
      geometry.setDrawRange(0, count);
      const dpr = Math.min(devicePixelRatio, width < 640 ? 1 : 1.5);
      renderer.setPixelRatio(dpr);
      renderer.setSize(width, height);
      uniforms.uDpr.value = dpr;
      uniforms.uViewport.value.set(width, height);
      container.dataset.particleCount = String(count);
      if (reducedMotion) renderer.render(scene, camera);
    };
    const tick = (now: number) => {
      frame = 0;
      if (disposed || contextLost || document.hidden) return;
      const dt = previous ? Math.min((now - previous) / 1000, 0.05) : 1 / 60;
      previous = now;
      elapsed += dt;
      uniforms.uTime.value = elapsed;
      const blend = 1 - Math.exp(-dt * 8);
      uniforms.uProgress.value += (scroll.value - uniforms.uProgress.value) * blend;
      uniforms.uMouse.value.x += (mouseX - uniforms.uMouse.value.x) * blend;
      uniforms.uMouse.value.y += (mouseY - uniforms.uMouse.value.y) * blend;
      strength *= Math.exp(-dt * 2.7);
      velocity *= Math.exp(-dt * 3.5);
      uniforms.uStrength.value += (strength - uniforms.uStrength.value) * (1 - Math.exp(-dt * 10));
      uniforms.uVelocity.value = velocity;
      renderer.render(scene, camera);
      sampleTime += dt;
      sampleFrames++;
      if (sampleTime > 3) {
        container.dataset.frameRate = String(Math.round(sampleFrames / sampleTime));
        container.dataset.sceneProgress = uniforms.uProgress.value.toFixed(3);
        if (sampleFrames / sampleTime < 42 && count > 2000) {
          slowSamples++;
          count = Math.max(2000, Math.floor(count * 0.75));
          geometry.setDrawRange(0, count);
          container.dataset.particleCount = String(count);
        }
        sampleTime = 0;
        sampleFrames = 0;
      }
      frame = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!frame && !reducedMotion && !document.hidden && !contextLost && !disposed) {
        previous = 0;
        frame = requestAnimationFrame(tick);
      }
    };
    const motion = (value: boolean) => {
      reducedMotion = value;
      container.dataset.motion = value ? 'static' : 'animated';
      uniforms.uReduced.value = value ? 1 : 0;
      if (value) {
        cancelAnimationFrame(frame);
        frame = 0;
        uniforms.uProgress.value = 0;
        uniforms.uStrength.value = 0;
        uniforms.uMouse.value.set(3, 3);
        renderer.render(scene, camera);
      } else start();
    };
    const move = (event: PointerEvent) => {
      if (reducedMotion || !finePointer.matches || event.pointerType === 'touch') return;
      const now = performance.now(),
        dt = Math.max(16, now - lastMove);
      velocity = Math.min(1, Math.hypot(event.clientX - lastX, event.clientY - lastY) / dt / 2);
      lastX = event.clientX;
      lastY = event.clientY;
      lastMove = now;
      mouseX = (event.clientX / innerWidth) * 2 - 1;
      mouseY = 1 - (event.clientY / innerHeight) * 2;
      strength = 1;
    };
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resize();
        bind();
      }, 120);
    };
    const visibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
        previous = 0;
      } else start();
    };
    const lost = (event: Event) => {
      event.preventDefault();
      contextLost = true;
      cancelAnimationFrame(frame);
      frame = 0;
      canvas.style.opacity = '0';
    };
    const restored = () => {
      contextLost = false;
      canvas.style.opacity = '1';
      resize();
      motion(reducedMotion);
    };
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    document.addEventListener('visibilitychange', visibility);
    canvas.addEventListener('webglcontextlost', lost);
    canvas.addEventListener('webglcontextrestored', restored);
    runtime.current = { bind, motion };
    resize();
    bind();
    motion(reducedMotion);
    // Font/image layout changes update scene boundaries without regenerating particles.
    let oldHeight = 0;
    const observer = new ResizeObserver((entries) => {
      const height = entries[0]?.contentRect.height || 0;
      if (Math.abs(height - oldHeight) > 1) {
        oldHeight = height;
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          resize();
          bind();
        }, 120);
      }
    });
    observer.observe(document.body);
    return () => {
      disposed = true;
      runtime.current = null;
      cancelAnimationFrame(frame);
      clearTimeout(resizeTimer);
      observer.disconnect();
      timeline?.scrollTrigger?.kill();
      timeline?.kill();
      window.removeEventListener('pointermove', move);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', visibility);
      canvas.removeEventListener('webglcontextlost', lost);
      canvas.removeEventListener('webglcontextrestored', restored);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    };
  }, []);
  useEffect(() => {
    runtime.current?.motion(reduced);
  }, [reduced]);
  useEffect(() => {
    const timer = setTimeout(() => runtime.current?.bind(), 150);
    return () => clearTimeout(timer);
  }, [path]);
  return <div ref={host} className="particle-background" aria-hidden="true" />;
}
