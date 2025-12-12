import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { ParticleTemplate, HandData } from '../types';
import { PARTICLE_COUNT } from '../constants';

interface VisualizerProps {
  template: ParticleTemplate;
  color: string;
  handData: HandData;
}

const Visualizer: React.FC<VisualizerProps> = ({ template, color, handData }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const pointsRef = useRef<THREE.Points | null>(null);
  
  // Store target positions for interpolation
  const targetsRef = useRef<Float32Array>(new Float32Array(PARTICLE_COUNT * 3));
  // Store original positions for "breathing" or return-to-base
  const originalTargetsRef = useRef<Float32Array>(new Float32Array(PARTICLE_COUNT * 3));
  
  // Initialize Three.js
  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.02);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Particles
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    
    // Initial random positions
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 50;
      
      colors[i * 3] = 1;
      colors[i * 3 + 1] = 1;
      colors[i * 3 + 2] = 1;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.2,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      opacity: 0.8
    });

    const points = new THREE.Points(geometry, material);
    pointsRef.current = points;
    scene.add(points);

    // Animation Loop
    let animationId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      if (pointsRef.current && targetsRef.current) {
        const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
        const targets = targetsRef.current;
        
        // Hand Interaction Logic
        // We map hand coordinates (0-1) to world coordinates (-20 to 20 roughly)
        const leftHand = handData.left;
        const rightHand = handData.right;
        
        // Calculate interaction forces
        // Pinching (1.0) = strong attraction (black hole)
        // Open (0.0) = repulsion/expansion
        
        // Hand world positions
        const lx = leftHand?.detected ? (leftHand.x - 0.5) * 40 : -1000;
        const ly = leftHand?.detected ? -(leftHand.y - 0.5) * 30 : -1000;
        const rx = rightHand?.detected ? (rightHand.x - 0.5) * 40 : -1000;
        const ry = rightHand?.detected ? -(rightHand.y - 0.5) * 30 : -1000;

        const leftPinch = leftHand?.pinch || 0;
        const rightPinch = rightHand?.pinch || 0;

        // Base rotation
        pointsRef.current.rotation.y += 0.05 * delta;
        
        // If hands are detected and close to each other, create a bridge/connection effect
        // or scale the whole system
        let systemScale = 1.0;
        if (leftHand?.detected && rightHand?.detected) {
           const dx = lx - rx;
           const dy = ly - ry;
           const dist = Math.sqrt(dx*dx + dy*dy);
           // Map distance 5-20 to scale 0.5-2
           systemScale = Math.max(0.5, Math.min(2.5, dist / 10));
        }

        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const ix = i * 3;
          const iy = i * 3 + 1;
          const iz = i * 3 + 2;

          let tx = targets[ix] * systemScale;
          let ty = targets[iy] * systemScale;
          let tz = targets[iz] * systemScale;
          
          const px = positions[ix];
          const py = positions[iy];
          const pz = positions[iz];

          // Apply forces from Left Hand
          if (leftHand?.detected) {
             const dx = lx - px;
             const dy = ly - py;
             const dz = 0 - pz; // Assume hand is at z=0
             const distSq = dx*dx + dy*dy + dz*dz;
             const dist = Math.sqrt(distSq);
             
             if (dist < 15) {
                // If pinched (1), attract strongly. If open (0), repel slightly or swirl.
                // Force magnitude
                const force = (15 - dist) / 15; // 0 to 1
                
                if (leftPinch > 0.5) {
                   // Attraction
                   tx += dx * force * leftPinch * 2;
                   ty += dy * force * leftPinch * 2;
                   tz += dz * force * leftPinch * 2;
                } else {
                   // Repulsion / Turbulence
                   tx -= dx * force * 0.5;
                   ty -= dy * force * 0.5;
                   // Add some noise
                   tx += (Math.random() - 0.5) * force * 2;
                   ty += (Math.random() - 0.5) * force * 2;
                }
             }
          }

          // Apply forces from Right Hand (symmetric logic)
          if (rightHand?.detected) {
             const dx = rx - px;
             const dy = ry - py;
             const dz = 0 - pz;
             const distSq = dx*dx + dy*dy + dz*dz;
             const dist = Math.sqrt(distSq);
             
             if (dist < 15) {
                const force = (15 - dist) / 15;
                if (rightPinch > 0.5) {
                   tx += dx * force * rightPinch * 2;
                   ty += dy * force * rightPinch * 2;
                   tz += dz * force * rightPinch * 2;
                } else {
                   tx -= dx * force * 0.5;
                   ty -= dy * force * 0.5;
                   tx += (Math.random() - 0.5) * force * 2;
                   ty += (Math.random() - 0.5) * force * 2;
                }
             }
          }

          // Lerp to target
          // Using a faster lerp factor creates "snappier" response, lower is "floaty"
          const lerpFactor = 3.0 * delta;
          positions[ix] += (tx - px) * lerpFactor;
          positions[iy] += (ty - py) * lerpFactor;
          positions[iz] += (tz - pz) * lerpFactor;
        }

        pointsRef.current.geometry.attributes.position.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Handle Resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      if (containerRef.current && rendererRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      geometry.dispose();
      material.dispose();
    };
  }, []); // Run once on mount

  // Handle Template Changes
  useEffect(() => {
    if (!targetsRef.current) return;
    
    // Generate new target positions
    const targets = targetsRef.current;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const point = template.generator(i, PARTICLE_COUNT);
      targets[i * 3] = point.x;
      targets[i * 3 + 1] = point.y;
      targets[i * 3 + 2] = point.z;
    }
  }, [template]);

  // Handle Color Changes
  useEffect(() => {
    if (!pointsRef.current) return;
    const material = pointsRef.current.material as THREE.PointsMaterial;
    material.color.set(color);
  }, [color]);

  return <div ref={containerRef} className="w-full h-full" />;
};

export default Visualizer;