import { Canvas } from "@react-three/fiber";

const TestSilk = () => {
  return (
    <div className="fixed inset-0 w-full h-screen bg-red-500 opacity-50 z-0">
      <Canvas>
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color="hotpink" />
        </mesh>
      </Canvas>
    </div>
  );
};

export default TestSilk;