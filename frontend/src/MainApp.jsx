import { Loader } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Experience } from "./components/Experience";
import { UI } from "./components/UI";

function MainApp() {
  return (
    <>
      <Loader />
      <UI />
      <Canvas shadows camera={{ position: [0, 0, 0], fov: 12 }}>
        <Experience />
      </Canvas>
    </>
  );
}

export default MainApp;
