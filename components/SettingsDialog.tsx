
import React, { useState, useEffect } from 'react';
import { ApiSettings } from '../types';

interface SettingsDialogProps {
  settings: ApiSettings;
  onSave: (settings: ApiSettings) => void;
  onClose: () => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({ settings, onSave, onClose }) => {
  const [localSettings, setLocalSettings] = useState<ApiSettings>(settings);
  const [models, setModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchModels = async () => {
    if (!localSettings.apiKey || !localSettings.baseUrl) return;
    
    setIsLoadingModels(true);
    setFetchError(null);
    try {
      const baseUrl = localSettings.baseUrl.endsWith('/') 
        ? localSettings.baseUrl.slice(0, -1) 
        : localSettings.baseUrl;
      
      const response = await fetch(`${baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${localSettings.apiKey}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch models');
      
      const data = await response.json();
      const modelIds = (data.data || data.models || [])
        .map((m: any) => m.id || m.name)
        .filter((id: string) => 
          id.includes('image') || 
          id.includes('vision') || 
          id.includes('gemini') || 
          id.includes('dall-e') ||
          id.includes('flux')
        );
      
      setModels(modelIds.length > 0 ? modelIds : ['gemini-2.5-flash-image', 'dall-e-3']);
    } catch (err: any) {
      setFetchError(err.message);
    } finally {
      setIsLoadingModels(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 backdrop-blur-xl p-6 animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-[#121212] rounded-[2.5rem] border border-white/10 p-8 shadow-2xl overflow-hidden relative">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-black uppercase tracking-[0.2em] text-white">Station Config</h2>
          <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center active:scale-90 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-white/50">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Custom Endpoint</span>
            <button 
              onClick={() => setLocalSettings(prev => ({ ...prev, useCustomProvider: !prev.useCustomProvider }))}
              className={`w-12 h-6 rounded-full transition-all relative ${localSettings.useCustomProvider ? 'bg-blue-600' : 'bg-neutral-800'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${localSettings.useCustomProvider ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[9px] font-black uppercase tracking-widest text-white/20 mb-2 ml-2">Base URL</label>
              <input 
                type="text" 
                value={localSettings.baseUrl}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, baseUrl: e.target.value }))}
                placeholder="https://api.tu-zi.com/v1/"
                className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-white focus:border-blue-500/50 outline-none transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-[9px] font-black uppercase tracking-widest text-white/20 mb-2 ml-2">Secret Key</label>
              <input 
                type="password" 
                value={localSettings.apiKey}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                placeholder="sk-..."
                className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-white focus:border-blue-500/50 outline-none transition-all text-sm"
              />
            </div>

            <div className="flex gap-3">
               <button 
                onClick={fetchModels}
                disabled={isLoadingModels || !localSettings.apiKey}
                className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all disabled:opacity-20 border border-white/5"
              >
                {isLoadingModels ? 'Synching...' : 'Fetch Catalog'}
              </button>
            </div>

            {models.length > 0 && (
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-white/20 mb-2 ml-2">Active Model</label>
                <div className="relative">
                  <select 
                    value={localSettings.selectedModel}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, selectedModel: e.target.value }))}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-white appearance-none outline-none focus:border-blue-500/50 transition-all text-sm"
                  >
                    {models.map(m => <option key={m} value={m} className="bg-[#121212]">{m}</option>)}
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-30">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
            
            {fetchError && (
              <p className="text-[10px] text-red-500/70 font-bold px-4 text-center">{fetchError}</p>
            )}
          </div>
        </div>

        <button 
          onClick={() => onSave(localSettings)}
          className="w-full mt-10 h-16 bg-white text-black rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-sm active:scale-95 transition-all shadow-[0_4px_30px_rgba(255,255,255,0.1)]"
        >
          Save & Exit
        </button>
      </div>
    </div>
  );
};
