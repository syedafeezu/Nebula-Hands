import { GoogleGenAI, Type } from "@google/genai";
import { ParticleTemplate } from '../types';

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateParticleShape = async (prompt: string): Promise<ParticleTemplate | null> => {
  if (!apiKey) {
    console.error("API Key missing");
    return null;
  }

  try {
    const model = 'gemini-2.5-flash';
    const systemInstruction = `
      You are a 3D Graphics Mathematics Expert. 
      Your goal is to provide mathematical formulas to generate a 3D particle cloud shape based on a user description.
      
      You must return a JSON object containing three strings: 'x', 'y', and 'z'.
      These strings must be valid JavaScript mathematical expressions that calculate the coordinate.
      
      Available variables in your expressions:
      - 'i': The index of the current particle (0 to total-1)
      - 'total': The total number of particles
      - 'u': A normalized value (0 to 1) calculated as i/total
      - 'v': A random value (0 to 1) specific to this particle
      - 'Math': The standard JavaScript Math object is available.
      
      Example for a sphere:
      {
        "x": "10 * Math.sin(Math.acos(2*v - 1)) * Math.cos(2 * Math.PI * u)",
        "y": "10 * Math.sin(Math.acos(2*v - 1)) * Math.sin(2 * Math.PI * u)",
        "z": "10 * Math.cos(Math.acos(2*v - 1))"
      }
    `;

    const response = await ai.models.generateContent({
      model,
      contents: `Create a particle shape that looks like: ${prompt}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            x: { type: Type.STRING },
            y: { type: Type.STRING },
            z: { type: Type.STRING },
            name: { type: Type.STRING, description: "A creative short name for this shape" }
          },
          required: ["x", "y", "z", "name"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;

    const data = JSON.parse(text);

    return {
      id: `custom-${Date.now()}`,
      name: data.name || 'AI Shape',
      type: 'custom',
      generator: (i, total) => {
        const u = i / total;
        // Deterministic pseudo-random for v based on i so it's stable per particle index
        const v = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1; 
        
        // Safety wrapper
        try {
          // We create functions from the strings. 
          // Note: In a real prod env, avoid new Function if possible, but for this creative tool it's acceptable.
          // To optimize, we pre-compile these functions once outside the loop ideally, 
          // but for simplicity in this generated code we'll eval the expressions or create a function once.
          
          // Better performance: Create the function body once
          // This is a simplified implementation. 
          // In the update loop of Visualizer, we will re-generate coordinates only when template changes.
          
          // Let's execute the expressions.
          // We'll replace the variables in the string with their values or use a Function constructor.
          const xFn = new Function('i', 'total', 'u', 'v', 'Math', `return ${data.x};`);
          const yFn = new Function('i', 'total', 'u', 'v', 'Math', `return ${data.y};`);
          const zFn = new Function('i', 'total', 'u', 'v', 'Math', `return ${data.z};`);
          
          return {
            x: xFn(i, total, u, v, Math),
            y: yFn(i, total, u, v, Math),
            z: zFn(i, total, u, v, Math)
          };
        } catch (e) {
          console.error("Error evaluating AI formula", e);
          return { x: 0, y: 0, z: 0 };
        }
      }
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};