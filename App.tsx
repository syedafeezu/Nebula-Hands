import React, { useState, useEffect } from 'react';
import Visualizer from './components/Visualizer';
import HandController from './components/HandController';
import UIOverlay from './components/UIOverlay';
import { ParticleTemplate, HandData } from './types';
import { DEFAULT_TEMPLATES } from './constants';

export default function App() {
  const [activeTemplate, setActiveTemplate] = useState<ParticleTemplate>(DEFAULT_TEMPLATES[0]);
  const [particleColor, setParticleColor] = useState<string>('#60a5fa'); // Tailwind blue-400
  const [handData, setHandData] = useState<HandData>({
    left: null,
    right: null
  });
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Handle hand data updates from the vision controller
  const handleHandUpdate = (data: HandData) => {
    setHandData(data);
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden text-white">
      {/* Background 3D Scene */}
      <div className="absolute inset-0 z-0">
        <Visualizer 
          template={activeTemplate} 
          color={particleColor} 
          handData={handData} 
        />
      </div>

      {/* Invisible Logic Layer for Computer Vision */}
      <HandController onHandUpdate={handleHandUpdate} />

      {/* UI Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <UIOverlay 
          templates={DEFAULT_TEMPLATES}
          activeTemplate={activeTemplate}
          onSelectTemplate={setActiveTemplate}
          color={particleColor}
          onChangeColor={setParticleColor}
          isAiLoading={isAiLoading}
          setIsAiLoading={setIsAiLoading}
          setCustomTemplate={setActiveTemplate}
        />
      </div>
    </div>
  );
}