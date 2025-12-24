
import React, { useState } from 'react';

interface PromptDialogProps {
  initialPrompt: string;
  onSave: (prompt: string) => void;
  onClose: () => void;
}

export const PromptDialog: React.FC<PromptDialogProps> = ({ initialPrompt, onSave, onClose }) => {
  const [val, setVal] = useState(initialPrompt);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 backdrop-blur-xl p-6 animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-[#121212] rounded-[2.5rem] border border-white/10 p-8 shadow-2xl overflow-hidden relative">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-black uppercase tracking-[0.2em] text-white">Vision Lab</h2>
          <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center active:scale-90 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-white/50">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-[9px] font-black uppercase tracking-widest text-white/20 mb-3 ml-2">Transformation Core</label>
            <textarea
              autoFocus
              value={val}
              onChange={(e) => setVal(e.target.value)}
              placeholder="Describe your vision (e.g., cyberpunk oil painting)..."
              className="w-full h-48 bg-white/5 border border-white/5 rounded-3xl px-5 py-4 text-white focus:border-blue-500/50 outline-none transition-all text-sm leading-relaxed resize-none shadow-inner scrollbar-hide"
            />
          </div>
        </div>

        <button 
          onClick={() => onSave(val)}
          className="w-full mt-12 h-16 bg-white text-black rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-sm active:scale-95 transition-all shadow-[0_8px_40px_rgba(255,255,255,0.1)]"
        >
          Confirm Vision
        </button>
      </div>
    </div>
  );
};
