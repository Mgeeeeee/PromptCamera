
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { PromptDialog } from './components/PromptDialog';
import { SettingsDialog } from './components/SettingsDialog';
import { generateAIImage } from './services/geminiService';
import { ModelType, ApiSettings } from './types';

const App: React.FC = () => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isResultLoading, setIsResultLoading] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [apiSettings, setApiSettings] = useState<ApiSettings>(() => {
    const saved = localStorage.getItem('ai_vision_settings');
    return saved ? JSON.parse(saved) : {
      apiKey: '',
      baseUrl: 'https://api.tu-zi.com/v1/',
      selectedModel: ModelType.FLASH,
      useCustomProvider: true
    };
  });

  useEffect(() => {
    localStorage.setItem('ai_vision_settings', JSON.stringify(apiSettings));
  }, [apiSettings]);

  const runAI = useCallback(async () => {
    if (!capturedImage) return;
    setIsGenerating(true);
    setError(null);
    setShowOriginal(false);
    try {
      const result = await generateAIImage(capturedImage, prompt, apiSettings);
      setIsResultLoading(true);
      setResultImage(result);
    } catch (err: any) {
      setError(err.message || 'Generation service unavailable');
      setIsGenerating(false);
    }
  }, [capturedImage, prompt, apiSettings]);

  const handleImageLoad = () => {
    setIsGenerating(false);
    setIsResultLoading(false);
  };

  const handleCapture = (base64: string) => {
    setCapturedImage(base64);
    setResultImage(null);
    setError(null);
    setShowOriginal(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleCapture(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExit = () => {
    setCapturedImage(null);
    setResultImage(null);
    setError(null);
    setShowOriginal(false);
  };

  const handleDownload = async () => {
    const imageToDownload = showOriginal ? capturedImage : (resultImage || capturedImage);
    if (!imageToDownload) return;

    try {
      const filename = `mgeeeeee-art-${showOriginal ? 'orig' : 'ai'}-${Date.now()}.png`;
      if (navigator.share) {
        const response = await fetch(imageToDownload);
        const blob = await response.blob();
        const file = new File([blob], filename, { type: 'image/png' });
        
        await navigator.share({
          files: [file],
          title: 'MGEEEEEE LAB Art',
          text: showOriginal ? 'Original Photo' : 'AI Generated Art',
        });
      } else {
        const link = document.createElement('a');
        link.href = imageToDownload;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const toggleComparison = () => {
    if (!isGenerating && resultImage) {
      setShowOriginal(!showOriginal);
    }
  };

  const commonBtnClass = "w-12 h-12 rounded-[1.2rem] bg-white/5 border border-white/5 flex items-center justify-center active:scale-90 transition-all shrink-0 disabled:opacity-40";
  const dangerBtnClass = "w-12 h-12 rounded-[1.2rem] bg-red-500/10 border border-red-500/20 flex items-center justify-center active:scale-90 transition-all shrink-0";

  return (
    <div className="fixed top-0 left-0 w-full h-[100dvh] bg-black overflow-hidden select-none text-white flex flex-col">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept="image/*" 
        className="hidden" 
      />

      {/* Main Stage */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-6 pt-32 pb-44">
        {capturedImage ? (
          <div className={`relative w-full h-full flex items-center justify-center transition-all duration-700 ${(isGenerating || isResultLoading) ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
             
             {/* Radiating Edge Glow / Aura */}
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-[85%] h-[85%] flex items-center justify-center">
                   <img 
                    src={capturedImage} 
                    alt="aura-1" 
                    className={`absolute w-full h-full object-contain blur-[40px] transition-opacity duration-1000 ${showOriginal || !resultImage ? 'opacity-80 scale-105' : 'opacity-0'}`}
                  />
                  <img 
                    src={capturedImage} 
                    alt="aura-2" 
                    className={`absolute w-full h-full object-contain blur-[120px] transition-opacity duration-1000 ${showOriginal || !resultImage ? 'opacity-40 scale-125' : 'opacity-0'}`}
                  />
                  
                  {resultImage && (
                    <>
                      <img 
                        src={resultImage} 
                        alt="aura-ai-1" 
                        className={`absolute w-full h-full object-contain blur-[40px] transition-opacity duration-1000 ${!showOriginal ? 'opacity-80 scale-105' : 'opacity-0'}`}
                      />
                      <img 
                        src={resultImage} 
                        alt="aura-ai-2" 
                        className={`absolute w-full h-full object-contain blur-[120px] transition-opacity duration-1000 ${!showOriginal ? 'opacity-40 scale-125' : 'opacity-0'}`}
                      />
                    </>
                  )}
                </div>
             </div>

             {/* Main focused images */}
             <img 
              src={capturedImage} 
              alt="Original" 
              className={`absolute max-w-full max-h-full object-contain rounded-[2.5rem] shadow-[0_0_150px_rgba(0,0,0,1)] border border-white/10 transition-opacity duration-500 ${showOriginal || !resultImage ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            />
            {resultImage && (
              <img 
                src={resultImage} 
                alt="AI Result" 
                onLoad={handleImageLoad}
                className={`absolute max-w-full max-h-full object-contain rounded-[2.5rem] shadow-[0_0_150px_rgba(0,0,0,1)] border border-white/10 transition-opacity duration-500 ${!showOriginal ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              />
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center animate-in fade-in duration-1000 text-center">
            <h1 className="font-black tracking-[0.2em] mr-[-0.2em] uppercase text-white/20 text-7xl md:text-9xl leading-none">
              IMAGE
            </h1>
            <p className="mt-6 text-white/15 text-[10px] font-black uppercase tracking-[0.4em] mr-[-0.4em] bg-white/5 px-6 py-2.5 rounded-full border border-white/5">
              MGEEEEEE LAB
            </p>
          </div>
        )}
      </div>

      {/* Generating Overlay */}
      {(isGenerating || isResultLoading) && (
        <div className="absolute inset-0 flex items-center justify-center z-[60] bg-black animate-in fade-in duration-300">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(60)].map((_, i) => (
              <div 
                key={i} 
                className="absolute bg-white rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  width: `${1 + Math.random() * 1.5}px`,
                  height: `${1 + Math.random() * 1.5}px`,
                  boxShadow: '0 0 4px rgba(255,255,255,0.6)',
                  animation: `star-twinkle ${2 + Math.random() * 3}s ease-in-out infinite, star-drift ${25 + Math.random() * 25}s linear infinite alternate`,
                  animationDelay: `${Math.random() * 5}s`
                }}
              />
            ))}
          </div>

          <div className="relative flex flex-col items-center justify-center gap-4 w-full px-12 text-center z-10">
            <h1 className="text-6xl md:text-8xl font-black tracking-[0.5em] mr-[-0.5em] uppercase animate-breath-blue drop-shadow-[0_0_20px_rgba(59,130,246,0.6)] leading-none">
              IMAGE
            </h1>
            <p className="text-white/40 text-[11px] md:text-xs font-bold uppercase tracking-[0.3em] mr-[-0.3em] animate-pulse">
              美好值得等待
            </p>
          </div>
        </div>
      )}

      {/* Main Tab Bar - Optimized for Web with max-width and centering */}
      <div className="fixed bottom-4 left-0 right-0 z-50 pointer-events-none flex justify-center px-6">
        <div className="pointer-events-auto flex items-center justify-between gap-1.5 h-20 px-4 w-full max-w-md bg-black/80 border border-white/10 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_20px_80px_rgba(0,0,0,0.9)] animate-in slide-in-from-bottom-10 duration-700">
          
          {!resultImage ? (
            <>
              <button onClick={() => setIsSettingsOpen(true)} className={commonBtnClass} title="Settings">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 text-white/50">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774a1.125 1.125 0 01.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.894.15c.542.09.94.56.94 1.11v1.094c0 .55-.398 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.164.398-.142.854.108 1.204l.527.738a1.125 1.125 0 01-.12 1.45l-.774.773a1.125 1.125 0 01-1.45.12l-.737-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527a1.125 1.125 0 01-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.11v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              <button onClick={() => setIsPromptOpen(true)} className={commonBtnClass} title="Prompt">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 text-white/50">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
              </button>

              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isGenerating} 
                className={commonBtnClass} 
                title="Upload"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 text-white/50">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75V6.75a2.25 2.25 0 0 1 2.25-2.25h15a2.25 2.25 0 0 1 2.25 2.25v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25z M11.25 9a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0z M21 14.25l-4.5-4.5L12 14.25l-3-3-4.5 4.5v3h16.5v-3z" />
                </svg>
              </button>

              <button onClick={runAI} disabled={!capturedImage || isGenerating} className={commonBtnClass} title="Generate">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 text-white/50">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
              </button>
            </>
          ) : (
            <>
              <button onClick={handleExit} disabled={isGenerating || isResultLoading} className={dangerBtnClass} title="Exit">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-red-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <button onClick={toggleComparison} className={commonBtnClass} title="Flip Comparison">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-5 h-5 transition-transform duration-300 ${showOriginal ? 'text-white' : 'text-white/50'}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                </svg>
              </button>

              <button onClick={handleDownload} className={commonBtnClass} title="Download">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-white/50">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
              </button>

              <button onClick={runAI} disabled={isGenerating || isResultLoading} className={commonBtnClass} title="Regenerate">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-white/50">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      {isPromptOpen && <PromptDialog initialPrompt={prompt} onSave={(p) => { setPrompt(p); setIsPromptOpen(false); }} onClose={() => setIsPromptOpen(false)} />}
      {isSettingsOpen && <SettingsDialog settings={apiSettings} onSave={(s) => { setApiSettings(s); setIsSettingsOpen(false); }} onClose={() => setIsSettingsOpen(false)} />}
      
      {error && (
        <div className="absolute top-[calc(env(safe-area-inset-top)+20px)] left-6 right-6 bg-red-500/20 border border-red-500/30 text-red-200 px-6 py-4 rounded-3xl text-center backdrop-blur-3xl z-[120]">
          <p className="text-xs font-bold tracking-wider">{error}</p>
        </div>
      )}
    </div>
  );
};

export default App;
