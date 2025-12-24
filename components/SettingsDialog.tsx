
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
      // Try to extract IDs from common OpenAI/Gemini proxy formats
      const modelIds = (data.data || data.models || [])
        .map((m: any) => m.id || m.name)
        .filter((id: string) => id.includes('image') || id.includes('vision') || id.includes('gemini') || id.includes('dall-e'));
      
      setModels(modelIds.length > 0 ? modelIds : ['gemini-2.5-flash-image', 'dall-e-3']);
    } catch (err: any) {
      setFetchError(err.message);
    } finally {
      setIsLoadingModels(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-xl p-6 animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-[#121212] rounded-[2.5rem] border border-white/10 p-8 shadow-2xl overflow-hidden relative">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black uppercase tracking-widest text-white">Provider Settings</h2>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center active:scale-90 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-white/50">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
            <span className="text-sm font-bold text-white/60">Use Custom API</span>
            <button 
              onClick={() => setLocalSettings(prev => ({ ...prev, useCustomProvider: !prev.useCustomProvider }))}
              className={`w-12 h-6 rounded-full transition-all relative ${localSettings.useCustomProvider ? 'bg-blue-600' : 'bg-neutral-800'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${localSettings.useCustomProvider ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-2 ml-2">Base URL</label>
              <input 
                type="text" 
                value={localSettings.baseUrl}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, baseUrl: e.target.value }))}
                placeholder="https://api.tuzi-api.com/v1"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-blue-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-2 ml-2">API Key</label>
              <input 
                type="password" 
                value={localSettings.apiKey}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                placeholder="sk-..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-blue-500 outline-none transition-all"
              />
            </div>

            <div className="flex gap-3">
               <button 
                onClick={fetchModels}
                disabled={isLoadingModels || !localSettings.apiKey}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-20"
              >
                {isLoadingModels ? 'Fetching...' : 'Fetch Models'}
              </button>
            </div>

            {models.length > 0 && (
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-2 ml-2">Select Model</label>
                <select 
                  value={localSettings.selectedModel}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, selectedModel: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white appearance-none outline-none focus:border-blue-500 transition-all"
                >
                  {models.map(m => <option key={m} value={m} className="bg-neutral-900">{m}</option>)}
                </select>
              </div>
            )}
            
            {fetchError && (
              <p className="text-[10px] text-red-500 font-bold px-2">{fetchError}</p>
            )}
          </div>
        </div>

        <button 
          onClick={() => onSave(localSettings)}
          className="w-full mt-10 py-5 bg-white text-black rounded-3xl font-black uppercase tracking-[0.2em] active:scale-95 transition-all shadow-xl"
        >
          Save Configuration
        </button>
      </div>
    </div>
  );
};
