import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Mesh } from 'three';

function Cube() {
  const meshRef = useRef<Mesh>(null);
  const [hue, setHue] = useState(0);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 2;
      meshRef.current.rotation.y += delta * 2;
      meshRef.current.rotation.z += delta * 1;
      
      // Change color over time
      setHue((prev) => (prev + delta * 50) % 360);
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial 
        color={`hsl(${hue}, 100%, 50%)`}
        metalness={0.8}
        roughness={0.2}
      />
    </mesh>
  );
}

export function SpinningCube({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-primary/40 hover:border-primary hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-primary/50"
      aria-label="Toggle sidebar"
    >
      <Canvas camera={{ position: [0, 0, 2.5] }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ff00ff" />
        <Cube />
      </Canvas>
    </button>
  );
}
