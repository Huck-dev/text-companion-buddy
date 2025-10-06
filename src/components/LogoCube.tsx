import { useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Mesh, Vector2 } from 'three';
import { useTexture } from '@react-three/drei';

function Cube({ mousePosition }: { mousePosition: Vector2 }) {
  const meshRef = useRef<Mesh>(null);
  const texture = useTexture('/src/assets/logo-cube.png');

  useFrame(() => {
    if (meshRef.current) {
      // Smoothly interpolate rotation based on mouse position
      meshRef.current.rotation.y += (mousePosition.x * Math.PI - meshRef.current.rotation.y) * 0.1;
      meshRef.current.rotation.x += (mousePosition.y * Math.PI - meshRef.current.rotation.x) * 0.1;
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1.5, 1.5, 1.5]} />
      <meshStandardMaterial 
        map={texture}
        metalness={0.3}
        roughness={0.4}
      />
    </mesh>
  );
}

export function LogoCube() {
  const [mousePosition, setMousePosition] = useState(new Vector2(0, 0));

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    setMousePosition(new Vector2(x, y));
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className="w-14 h-14 rounded-lg overflow-hidden bg-white shadow-md cursor-pointer"
    >
      <Canvas camera={{ position: [0, 0, 4], fov: 45 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} />
        <pointLight position={[-5, -5, -5]} intensity={0.8} />
        <Cube mousePosition={mousePosition} />
      </Canvas>
    </div>
  );
}
