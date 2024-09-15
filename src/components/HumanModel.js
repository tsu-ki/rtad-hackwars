import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { gsap } from 'gsap';

function HumanModel({ handSign }) {
  const mountRef = useRef(null);
  const [model, setModel] = useState(null);

  const updateModelPose = useCallback((sign) => {
    if (!model) return;

    console.log('Updating pose for sign:', sign);

    // Reset all animations
    gsap.to(model.position, { x: 0, y: 0, z: 0, duration: 0.5 });
    gsap.to(model.rotation, { x: 0, y: 0, z: 0, duration: 0.5 });

    switch (sign) {
      case 'thumbs_up':
        const rightArm = model.getObjectByName('RightArm');
        if (rightArm) {
          gsap.to(rightArm.rotation, { x: -Math.PI / 2, y: 0, z: 0, duration: 0.5 });
        }
        break;
      case 'peace_sign':
        const rightHand = model.getObjectByName('RightHand');
        if (rightHand) {
          gsap.to(rightHand.rotation, { x: 0, y: 0, z: Math.PI / 4, duration: 0.5 });
          const indexFinger = rightHand.getObjectByName('IndexFinger');
          const middleFinger = rightHand.getObjectByName('MiddleFinger');
          if (indexFinger && middleFinger) {
            gsap.to(indexFinger.rotation, { x: 0, y: 0, z: -Math.PI / 4, duration: 0.5 });
            gsap.to(middleFinger.rotation, { x: 0, y: 0, z: -Math.PI / 4, duration: 0.5 });
          }
        }
        break;
      case 'deaf':
        // Implement pose for 'deaf'
        break;
      // Add cases for other signs: 'girl', 'hard of hearing', 'hearing', 'help', 'how', 'know', 'me', 'meet'
      default:
        // Reset to default pose
        break;
    }
  }, [model]);

  useEffect(() => {
    if (!mountRef.current) return;

    const currentMount = mountRef.current;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xcccccc);
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / 2 / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });

    renderer.setSize(window.innerWidth / 2, window.innerHeight / 2);
    currentMount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 1, 1).normalize();
    scene.add(light);

    const loader = new GLTFLoader();
    console.log('Loading 3D model');
    loader.load('/model/human_model.glb', 
      (gltf) => {
        console.log('3D model loaded successfully');
        scene.add(gltf.scene);
        setModel(gltf.scene);

        // Center the model
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const center = box.getCenter(new THREE.Vector3());
        gltf.scene.position.sub(center);

        // Adjust camera position
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        camera.position.set(0, maxDim / 2, maxDim * 2);
        camera.lookAt(0, 0, 0);

        controls.update();
      },
      (progress) => {
        console.log('Loading progress:', (progress.loaded / progress.total) * 100 + '%');
      },
      (error) => {
        console.error('Error loading 3D model:', error);
      }
    );

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (currentMount) {
        currentMount.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    if (handSign) {
      console.log('HumanModel received hand sign:', handSign);
      updateModelPose(handSign);
    }
  }, [handSign, updateModelPose]);

  return <div ref={mountRef} style={{ width: '100%', height: '400px' }} />;
}

export default HumanModel;