import React, { useState } from 'react';
import { ParticleTemplate } from '../types';
import { Activity, Flower, Heart, Rocket, Loader2, Sparkles, Wand2 } from 'lucide-react';
import { generateParticleShape } from '../services/geminiService';

interface UIOverlayProps {
  templates: ParticleTemplate[];
  activeTemplate: ParticleTemplate;
  onSelectTemplate: (t: ParticleTemplate) => void;
  color: string;
  onChangeColor: (c: string) => void;
  isAiLoading: boolean;
  setIsAiLoading: (l: boolean) => void;
  setCustomTemplate: (t: ParticleTemplate) => void;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ 
  templates, activeTemplate, onSelectTemplate, color, onChangeColor, 
  isAiLoading, setIsAiLoading, setCustomTemplate
}) => {
  const [aiPrompt, setAiPrompt] = useState("");
  const [isPromptOpen, setIsPromptOpen] = useState(false);

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setIsAiLoading(true);
    // Enable click-through while loading? Maybe just show spinner.
    const newTemplate = await generateParticleShape(aiPrompt);
    setIsAiLoading(false);
    
    if (newTemplate) {
      setCustomTemplate(newTemplate);
      setIsPromptOpen(false);
      setAiPrompt("");
    }
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'heart': return <Heart size={20} />;
      case 'flower': return <Flower size={20} />;
      case 'saturn': return <Activity size={20} />; // Abstract rep
      case 'fireworks': return <Rocket size={20} />;
      default: return <Sparkles size={20} />;
    }
  };

  const colors = [
    '#60a5fa', // Blue
    '#f472b6', // Pink
    '#a78bfa', // Purple
    '#34d399', // Green
    '#fbbf24', // Amber
    '#f87171', // Red
    '#ffffff'  // White
  ];

  return (
    <div className="w-full h-full flex flex-col justify-between p-6 pointer-events-none">
      
      {/* Header */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div className="bg-black/40 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-2xl">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Nebula Hands
          </h1>
          <p className="text-xs text-gray-400 mt-1 max-w-[200px]">
            Show hands to camera. <br/>
            Pinch to attract particles. <br/>
            Move apart to scale.
          </p>
        </div>
      </div>

      {/* Main Controls Bottom */}
      <div className="flex flex-col items-center gap-4 mb-4 pointer-events-auto w-full max-w-3xl mx-auto">
        
        {/* Color Picker */}
        <div className="flex gap-2 bg-black/40 backdrop-blur-md p-3 rounded-full border border-white/10">
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => onChangeColor(c)}
              className={`w-6 h-6 rounded-full transition-transform hover:scale-125 ${color === c ? 'ring-2 ring-white scale-110' : ''}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        {/* Template Selector */}
        <div className="flex gap-3 bg-black/40 backdrop-blur-md p-3 rounded-2xl border border-white/10 overflow-x-auto max-w-full">
          {templates.map((t) => (
            <button
              key={t.id}
              onClick={() => onSelectTemplate(t)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap
                ${activeTemplate.id === t.id 
                  ? 'bg-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.3)]' 
                  : 'hover:bg-white/10 text-gray-400 hover:text-white'
                }`}
            >
              {getIcon(t.type)}
              <span className="text-sm font-medium">{t.name}</span>
            </button>
          ))}
          
          {/* AI Generator Button */}
          <div className="w-px h-8 bg-white/20 mx-1"></div>
          
          <button
            onClick={() => setIsPromptOpen(!isPromptOpen)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap bg-gradient-to-r from-indigo-500 to-purple-600 hover:brightness-110`}
          >
            <Wand2 size={18} />
            <span className="text-sm font-medium">Magic AI</span>
          </button>
        </div>

        {/* AI Prompt Input */}
        {isPromptOpen && (
          <form onSubmit={handleAiSubmit} className="w-full max-w-md bg-black/80 backdrop-blur-xl p-4 rounded-xl border border-white/20 animate-in slide-in-from-bottom-5">
            <div className="flex gap-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Describe a shape (e.g., 'a spiral galaxy', 'a double helix')"
                className="flex-1 bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                autoFocus
              />
              <button 
                type="submit" 
                disabled={isAiLoading}
                className="bg-white text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 disabled:opacity-50"
              >
                {isAiLoading ? <Loader2 className="animate-spin" size={18}/> : "Generate"}
              </button>
            </div>
          </form>
        )}
      </div>

    </div>
  );
};

export default UIOverlay;