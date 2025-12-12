import { ParticleTemplate } from './types';

export const PARTICLE_COUNT = 8000;
export const CAMERA_FOV = 75;
export const CAMERA_Z = 30;

// Helper math
const random = (min: number, max: number) => Math.random() * (max - min) + min;

export const DEFAULT_TEMPLATES: ParticleTemplate[] = [
  {
    id: 'heart',
    name: 'Neon Heart',
    type: 'heart',
    generator: (i, total) => {
      const t = (i / total) * Math.PI * 2;
      const x = 16 * Math.pow(Math.sin(t), 3);
      const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      const z = random(-2, 2);
      // Add randomness to volume
      const scale = 0.5;
      return { 
        x: x * scale + random(-0.5, 0.5), 
        y: y * scale + random(-0.5, 0.5), 
        z: z 
      };
    }
  },
  {
    id: 'saturn',
    name: 'Saturn Rings',
    type: 'saturn',
    generator: (i, total) => {
      // 70% rings, 30% planet
      const isRing = i > total * 0.3;
      if (isRing) {
        const angle = (i / total) * Math.PI * 20; // Multiple loops
        const radius = random(8, 14);
        return {
          x: Math.cos(angle) * radius,
          y: random(-0.2, 0.2),
          z: Math.sin(angle) * radius
        };
      } else {
        // Sphere
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        const r = 5;
        return {
          x: r * Math.sin(phi) * Math.cos(theta),
          y: r * Math.sin(phi) * Math.sin(theta),
          z: r * Math.cos(phi)
        };
      }
    }
  },
  {
    id: 'flowers',
    name: 'Cosmic Rose',
    type: 'flower',
    generator: (i, total) => {
      const k = 4; // Rose petals
      const theta = (i / total) * Math.PI * 12; // rotations
      const r = 10 * Math.cos(k * theta);
      // Lift it into 3D
      const z = (i / total) * 10 - 5;
      return {
        x: r * Math.cos(theta) + random(-0.5, 0.5),
        y: r * Math.sin(theta) + random(-0.5, 0.5),
        z: z
      };
    }
  },
  {
    id: 'fireworks',
    name: 'Big Bang',
    type: 'fireworks',
    generator: (i, total) => {
      // Just a random sphere cloud initially, velocity handles the look in logic
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const r = Math.pow(Math.random(), 1/3) * 15; // Uniform distribution inside sphere
      return {
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.sin(phi) * Math.sin(theta),
        z: r * Math.cos(phi)
      };
    }
  }
];