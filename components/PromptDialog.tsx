
import React, { useState } from 'react';

interface PromptDialogProps {
  initialPrompt: string;
  onSave: (prompt: string) => void;
  onClose: () => void;
}

export const PromptDialog: React.FC<PromptDialogProps> = ({ initialPrompt, onSave, onClose }) => {
  const [val, setVal] = useState(initialPrompt);

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md transition-all duration-300">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative w-full sm:max-w-lg bg-[#1a1a1a] rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl ring-1 ring-white/10 animate-in slide-in-from-bottom duration-300 ease-out pb-12 sm:pb-8">
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6 sm:hidden" />
        
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-white tracking-tight">Modify Prompt</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white/50">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
             </svg>
          </button>
        </div>

        <p className="text-white/40 text-sm mb-4 font-medium uppercase tracking-wider">Describe your artistic vision</p>
        
        <textarea
          autoFocus
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder="e.g., A futuristic cyberpunk warrior in Tokyo rain..."
          className="w-full h-40 bg-neutral-800/50 text-white rounded-3xl p-5 border border-white/5 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none transition-all text-lg leading-relaxed shadow-inner"
        />
        
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <button
            onClick={onClose}
            className="flex-1 py-4 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold transition-all active:scale-[0.98]"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(val)}
            className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98]"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
};
