
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { CameraModule } from './components/CameraModule';
import { PromptDialog } from './components/PromptDialog';
import { SettingsDialog } from './components/SettingsDialog';
import { generateAIImage } from './services/geminiService';
import { ModelType, ApiSettings } from './types';

// Fix: Simplified declaration to avoid "identical modifiers" error when merging with existing Window interface
declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

const App: React.FC = () => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState(''); // Removed pre-set prompt text
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isResultLoading, setIsResultLoading] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<number | null>(null);

  const [apiSettings, setApiSettings] = useState<ApiSettings>(() => {
    const saved = localStorage.getItem('ai_vision_settings');
    return saved ? JSON.parse(saved) : {
      selectedModel: ModelType.FLASH
    };
  });

  useEffect(() => {
    localStorage.setItem('ai_vision_settings', JSON.stringify(apiSettings));
  }, [apiSettings]);

  // Fix: Added handleImageLoad to handle loading state transitions when the new AI image is fully loaded in the DOM
  const handleImageLoad = () => {
    setIsResultLoading(false);
    setIsGenerating(false);
  };

  // Fix: Added handleDownload to allow saving the transformed result image to the device
  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `vision-lab-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const runAI = useCallback(async () => {
    if (!capturedImage) return;

    // Check for API key if using Pro model
    if (apiSettings.selectedModel === ModelType.PRO) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
      }
    }

    setIsGenerating(true);
    setError(null);
    setShowOriginal(false);
    try {
      const result = await generateAIImage(capturedImage, prompt, apiSettings);
      setIsResultLoading(true);
      setResultImage(result);
    } catch (err: any) {
      if (err.message === "API_KEY_REQUIRED" || err.message?.includes("Requested entity was not found.")) {
        await window.aistudio.openSelectKey();
        setError("Please select a paid API key to continue.");
      } else {
        setError(err.message || 'Transformation failed');
      }
      setIsGenerating(false);
    }
  }, [capturedImage, prompt, apiSettings]);

  const handleCapture = (base64: string) => {
    setIsCameraOpen(false);
    setCapturedImage(base64);
    setResultImage(null);
    setError(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => handleCapture(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleUploadPointerDown = () => {
    longPressTimer.current = window.setTimeout(() => {
      setIsCameraOpen(true);
      longPressTimer.current = null;
    }, 500);
  };

  const handleUploadPointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      fileInputRef.current?.click();
      longPressTimer.current = null;
    }
  };

  const commonBtnClass = "w-12 h-12 rounded-[1.2rem] bg-white/5 border border-white/5 flex items-center justify-center active:scale-90 transition-all shrink-0 disabled:opacity-40";
  const dangerBtnClass = "w-12 h-12 rounded-[1.2rem] bg-red-500/10 border border-red-500/20 flex items-center justify-center active:scale-90 transition-all shrink-0";

  return (
    <div className="fixed inset-0 bg-black overflow-hidden select-none text-white flex flex-col">
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-6 pt-16 pb-32">
        {capturedImage ? (
          <div className={`relative w-full h-full flex items-center justify-center transition-all duration-700 ${(isGenerating || isResultLoading) ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-[85%] h-[85%] flex items-center justify-center">
                  <img src={showOriginal || !resultImage ? capturedImage : resultImage!} alt="Artwork" className="max-w-full max-h-full object-contain rounded-[2.5rem] shadow-2xl border border-white/10" onLoad={handleImageLoad} />
                </div>
             </div>
          </div>
        ) : (
          <div className="flex flex-col items-center animate-in fade-in duration-1000">
            <h1 className="font-black tracking-[0.2em] uppercase text-white/5 text-7xl md:text-9xl">VISION</h1>
            <p className="mt-4 text-white/10 text-[10px] font-black uppercase tracking-[0.4em] bg-white/5 px-6 py-2 rounded-full border border-white/5">MGEEEEEE LAB</p>
          </div>
        )}
      </div>

      {/* Loading Screen */}
      {(isGenerating || isResultLoading) && (
        <div className="absolute inset-0 z-[60] bg-black flex flex-col items-center justify-center gap-4">
          <h1 className="text-6xl md:text-8xl font-black tracking-[0.5em] uppercase animate-breath-blue leading-none">IMAGE</h1>
          <p className="text-white/40 text-[10px] uppercase tracking-[0.3em] animate-pulse">Beautiful things take time</p>
        </div>
      )}

      {/* Bottom Tab Bar Container - Fixed at screen bottom, responsive safe area */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none flex justify-center px-6"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
      >
        <div className="pointer-events-auto flex items-center justify-between gap-2 h-20 px-4 w-full max-w-md bg-black/80 border border-white/10 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl">
          {!resultImage ? (
            <>
              <button onClick={() => setIsSettingsOpen(true)} className={commonBtnClass}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-white/50"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0m-6.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0m-9.75 0h9.75" /></svg>
              </button>
              <button onClick={() => setIsPromptOpen(true)} className={commonBtnClass}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-white/50"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
              </button>
              <button onPointerDown={handleUploadPointerDown} onPointerUp={handleUploadPointerUp} className={commonBtnClass}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-white/50"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75V6.75a2.25 2.25 0 0 1 2.25-2.25h15a2.25 2.25 0 0 1 2.25 2.25v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25z M11.25 9a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0z M21 14.25l-4.5-4.5L12 14.25l-3-3-4.5 4.5v3h16.5v-3z" /></svg>
              </button>
              <button onClick={runAI} disabled={!capturedImage || isGenerating} className={commonBtnClass}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-white/50"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
              </button>
            </>
          ) : (
            <>
              <button onClick={() => {setResultImage(null); setCapturedImage(null);}} className={dangerBtnClass}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-red-400"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <button onClick={() => setShowOriginal(!showOriginal)} className={commonBtnClass}>
                <span className="text-[10px] font-black">{showOriginal ? 'AI' : 'ORG'}</span>
              </button>
              <button onClick={handleDownload} className={commonBtnClass}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-white/50"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
              </button>
              <button onClick={runAI} disabled={isGenerating} className={commonBtnClass}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-white/50"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7" /></svg>
              </button>
            </>
          )}
        </div>
      </div>

      {isCameraOpen && <CameraModule onCapture={handleCapture} onClose={() => setIsCameraOpen(false)} />}
      {isPromptOpen && <PromptDialog initialPrompt={prompt} onSave={(p) => { setPrompt(p); setIsPromptOpen(false); }} onClose={() => setIsPromptOpen(false)} />}
      {isSettingsOpen && <SettingsDialog settings={apiSettings} onSave={(s) => { setApiSettings(s); setIsSettingsOpen(false); }} onClose={() => setIsSettingsOpen(false)} />}
      
      {error && (
        <div className="absolute top-[calc(env(safe-area-inset-top)+20px)] left-6 right-6 bg-red-500/20 border border-red-500/30 text-red-200 px-6 py-4 rounded-3xl text-center backdrop-blur-3xl z-[120]">
          <p className="text-xs font-bold">{error}</p>
        </div>
      )}
    </div>
  );
};

export default App;
