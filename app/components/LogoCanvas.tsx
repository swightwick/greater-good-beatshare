"use client";

import { Suspense, useRef, useEffect, useMemo, memo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, Environment } from "@react-three/drei";
import * as THREE from "three";

function SpinningLogo() {
  const gltf = useGLTF("/gg/gg.glb");
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.6;
    }
  });

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "white",
        metalness: 0.9,
        roughness: 0.1,
        envMapIntensity: 2,
      }),
    []
  );

  useEffect(() => {
    gltf.scene.scale.set(10, 10, 10);
    gltf.scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).material = material;
      }
    });
  }, [gltf.scene, material]);

  useEffect(() => {
    gltf.scene.updateWorldMatrix(true, true);

    const box = new THREE.Box3().setFromObject(gltf.scene);
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);

    gltf.scene.position.x -= center.x;
    gltf.scene.position.y -= center.y;
    gltf.scene.position.z -= center.z;

    const fovRad = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180);
    const distance =
      size.y / 2 / (0.8 * Math.tan(fovRad / 2)) + size.z / 2;
    camera.position.set(0, 0, distance);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, []);

  return (
    <group ref={groupRef}>
      <primitive object={gltf.scene} />
    </group>
  );
}

useGLTF.preload("/gg/gg.glb");

const LogoCanvas = memo(function LogoCanvas({
  height = 350,
  className,
}: {
  height?: number;
  className?: string;
}) {
  return (
    <div
      style={className ? {} : { width: "100%", height }}
      className={className ?? "w-full"}
    >
      <Canvas
        gl={{ alpha: true }}
        camera={{ fov: 20, near: 0.1, far: 400, position: [0, 0, 8] }}
      >
        <directionalLight position={[1, 2, 3]} intensity={6} />
        <directionalLight position={[-2, 1, -2]} intensity={4} />
        <ambientLight intensity={4} />
        <Environment preset="studio" background={false} />
        <Suspense fallback={null}>
          <SpinningLogo />
        </Suspense>
      </Canvas>
    </div>
  );
});

export default LogoCanvas;
