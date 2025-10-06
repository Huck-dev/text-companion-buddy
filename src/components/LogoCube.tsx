import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Mesh } from 'three';

function Cube({ isHovered }: { isHovered: boolean }) {
  const meshRef = useRef<Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.8;
      meshRef.current.rotation.y += delta * 0.8;
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1.2, 1.2, 1.2]} />
      <meshStandardMaterial 
        color="#FFD700"
        metalness={1}
        roughness={0.1}
        emissive="#FFD700"
        emissiveIntensity={isHovered ? 0.3 : 0}
      />
    </mesh>
  );
}

export function LogoCube() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`w-14 h-14 rounded-lg overflow-hidden cursor-pointer transition-all duration-300 ${
        isHovered ? 'shadow-[0_0_30px_rgba(255,215,0,0.6)]' : 'shadow-md'
      }`}
      style={{ background: 'rgba(255, 255, 255, 0.1)' }}
    >
      <Canvas camera={{ position: [0, 0, 3.5], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1.5} />
        <pointLight 
          position={[0, 0, -5]} 
          intensity={isHovered ? 2 : 0} 
          color="#FFD700"
          distance={10}
        />
        <Cube isHovered={isHovered} />
      </Canvas>
    </div>
  );
}
