import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Mesh } from 'three';

function Cube() {
  const meshRef = useRef<Mesh>(null);
  const [hue, setHue] = useState(155);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 1.5;
      meshRef.current.rotation.y += delta * 1.5;
      meshRef.current.rotation.z += delta * 0.5;
      
      // Smooth color transition
      setHue((prev) => (prev + delta * 30) % 360);
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1.2, 1.2, 1.2]} />
      <meshStandardMaterial 
        color={`hsl(${hue}, 85%, 55%)`}
        metalness={0.9}
        roughness={0.1}
        emissive={`hsl(${hue}, 85%, 35%)`}
        emissiveIntensity={0.5}
      />
    </mesh>
  );
}

export function SpinningCube({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-16 h-16 rounded-xl overflow-hidden border-2 border-primary/60 hover:border-primary hover:scale-110 transition-all duration-300 shadow-2xl hover:shadow-primary/50 bg-background/90 backdrop-blur-sm"
      aria-label="Toggle chat"
    >
      <Canvas camera={{ position: [0, 0, 3] }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} intensity={1.5} />
        <pointLight position={[-5, -5, -5]} intensity={1} color="#4ADE80" />
        <Cube />
      </Canvas>
    </button>
  );
}
