'use client';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, AdaptiveDpr } from '@react-three/drei';
import { Component, useRef, useState, useEffect } from 'react';
import type { Group } from 'three';
import { useReducedMotion } from './motion-preference';
function Sculpture({ portrait }: { portrait: boolean }) {
  const ref = useRef<Group>(null);
  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.12;
    ref.current.rotation.x = state.pointer.y * 0.12 + Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    ref.current.rotation.z = state.pointer.x * 0.1 + Math.min(window.scrollY / 1800, 0.6);
  });
  return (
    <Float speed={1.1} rotationIntensity={0.12} floatIntensity={0.4}>
      <group ref={ref} rotation={[0.3, 0, -0.35]}>
        {!portrait && (
          <mesh>
            <icosahedronGeometry args={[1.55, 2]} />
            <meshPhysicalMaterial color="#2368fb" metalness={0.75} roughness={0.2} wireframe />
          </mesh>
        )}
        {!portrait && (
          <mesh>
            <sphereGeometry args={[1.26, 32, 24]} />
            <meshPhysicalMaterial color="#06112a" metalness={0.95} roughness={0.18} />
          </mesh>
        )}
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation={[Math.PI / 2 + i * 0.55, i * 0.9, 0.3]}>
            <torusGeometry args={[1.95 + i * 0.16, 0.013, 8, 100]} />
            <meshStandardMaterial
              color={i === 1 ? '#88dfff' : '#2563ff'}
              emissive="#2666ff"
              emissiveIntensity={1.5}
            />
          </mesh>
        ))}
        <mesh position={[1.9, 0.3, 0.1]}>
          <sphereGeometry args={[0.065, 12, 12]} />
          <meshBasicMaterial color="#c5edff" />
        </mesh>
      </group>
    </Float>
  );
}
class SceneBoundary extends Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <Fallback /> : this.props.children;
  }
}
function Fallback() {
  return (
    <div className="orb-fallback" aria-hidden="true">
      <div />
      <span>GR.</span>
    </div>
  );
}
export default function Orb({ portrait = false }: { portrait?: boolean }) {
  const reduced = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(true);
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2');
    setEnabled(!!context && !matchMedia('(prefers-reduced-motion:reduce)').matches);
    context?.getExtension('WEBGL_lose_context')?.loseContext();
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    if (container.current) observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={container} className="orb-scene" aria-label="Interactive orbital sculpture">
      {enabled && !reduced ? (
        <SceneBoundary>
          <Canvas
            frameloop={visible ? 'always' : 'never'}
            dpr={[1, 1.5]}
            camera={{ position: [0, 0, 6.7], fov: 42 }}
            gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
          >
            <ambientLight intensity={0.7} />
            <pointLight position={[3, 3, 4]} intensity={35} color="#67cfff" />
            <pointLight position={[-4, -2, 1]} intensity={15} color="#315bff" />
            <Sculpture portrait={portrait} />
            <AdaptiveDpr pixelated />
          </Canvas>
        </SceneBoundary>
      ) : (
        <Fallback />
      )}
    </div>
  );
}
