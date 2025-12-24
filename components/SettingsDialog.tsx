
import React, { useState } from 'react';
import { ApiSettings, ModelType } from '../types';

interface SettingsDialogProps {
  settings: ApiSettings;
  onSave: (settings: ApiSettings) => void;
  onClose: () => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({ settings, onSave, onClose }) => {
  const [localSettings, setLocalSettings] = useState<ApiSettings>(settings);

  const modelMap = [
    { id: ModelType.FLASH, label: '🍌', sub: 'Flash' },
    { id: ModelType.PRO, label: '🍌 Pro', sub: 'High Quality' }
  ];

  const handleOpenKeySelector = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 backdrop-blur-xl p-6 animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-[#121212] rounded-[2.5rem] border border-white/10 p-8 shadow-2xl overflow-hidden relative">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-black uppercase tracking-[0.2em] text-white">Lab Config</h2>
          <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center active:scale-90 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-white/50">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-8">
          {/* Intelligence Core Selection */}
          <div>
            <label className="block text-[9px] font-black uppercase tracking-widest text-white/20 mb-3 ml-2">Intelligence Core</label>
            <div className="grid grid-cols-2 gap-3">
              {modelMap.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setLocalSettings(prev => ({ ...prev, selectedModel: m.id }))}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 ${
                    localSettings.selectedModel === m.id 
                      ? 'bg-white/10 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.15)]' 
                      : 'bg-white/5 border-white/5 grayscale opacity-40'
                  }`}
                >
                  <span className="text-2xl mb-1">{m.label}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/60">{m.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Key Selection for Pro model - REQUIRED per guidelines */}
          {localSettings.selectedModel === ModelType.PRO && (
            <div className="p-5 bg-blue-500/5 border border-blue-500/10 rounded-2xl space-y-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Pro Activation Required</span>
                <span className="text-[8px] uppercase tracking-wider text-white/30">
                  Select a paid API key from your GCP project.
                  <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-400 underline underline-offset-2">Billing Info</a>
                </span>
              </div>
              <button 
                onClick={handleOpenKeySelector}
                className="w-full h-12 bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all"
              >
                Select API Key
              </button>
            </div>
          )}
        </div>

        <button 
          onClick={() => onSave(localSettings)}
          className="w-full mt-12 h-16 bg-white text-black rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-sm active:scale-95 transition-all shadow-[0_8px_40px_rgba(255,255,255,0.1)]"
        >
          Confirm Settings
        </button>
      </div>
    </div>
  );
};
