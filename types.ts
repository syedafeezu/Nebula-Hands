export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface HandInfo {
  x: number; // Normalized 0-1
  y: number; // Normalized 0-1
  pinch: number; // 0 (open) to 1 (closed/pinched)
  detected: boolean;
}

export interface HandData {
  left: HandInfo | null;
  right: HandInfo | null;
}

export type TemplateType = 'heart' | 'flower' | 'saturn' | 'fireworks' | 'sphere' | 'spiral' | 'custom';

export interface ParticleTemplate {
  id: string;
  name: string;
  type: TemplateType;
  // A function that returns a position for particle i out of total count
  generator: (i: number, total: number) => Point3D;
}

export interface GeminiMathResponse {
  x: string;
  y: string;
  z: string;
  description?: string;
}
