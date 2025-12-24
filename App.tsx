
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { CameraModule } from './components/CameraModule';
import { PromptDialog } from './components/PromptDialog';
import { SettingsDialog } from './components/SettingsDialog';
import { generateAIImage } from './services/geminiService';
import { ModelType, ApiSettings } from './types';

const App: React.FC = () => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [apiSettings, setApiSettings] = useState<ApiSettings>(() => {
    const saved = localStorage.getItem('ai_vision_settings');
    return saved ? JSON.parse(saved) : {
      apiKey: '',
      baseUrl: 'https://api.tu-zi.com/v1/',
      selectedModel: ModelType.FLASH,
      useCustomProvider: false
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
      setResultImage(result);
    } catch (err: any) {
      setError(err.message || 'Generation service unavailable');
    } finally {
      setIsGenerating(false);
    }
  }, [capturedImage, prompt, apiSettings]);

  const handleCapture = (base64: string) => {
    setIsCameraOpen(false);
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
    <div className="fixed inset-0 bg-black overflow-hidden select-none text-white flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept="image/*" 
        className="hidden" 
      />

      {/* Cross-fading ambient background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {capturedImage && (
          <>
            <img 
              src={capturedImage} 
              alt="bg-orig" 
              className={`absolute inset-0 w-full h-full object-cover blur-[100px] scale-125 transition-opacity duration-1000 ${showOriginal || !resultImage ? 'opacity-30' : 'opacity-0'}`}
            />
            {resultImage && (
              <img 
                src={resultImage} 
                alt="bg-ai" 
                className={`absolute inset-0 w-full h-full object-cover blur-[100px] scale-125 transition-opacity duration-1000 ${!showOriginal ? 'opacity-30' : 'opacity-0'}`}
              />
            )}
          </>
        )}
      </div>

      {/* Main Adaptive Stage */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-4 pt-4 pb-48">
        {capturedImage ? (
          <div className={`relative w-full h-full flex items-center justify-center transition-all duration-1000 ${isGenerating ? 'blur-3xl opacity-10 scale-95' : 'blur-0 opacity-100 scale-100'}`}>
             <img 
              src={capturedImage} 
              alt="Original" 
              className={`absolute max-w-full max-h-full object-contain rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.8)] border border-white/5 transition-opacity duration-500 ${showOriginal || !resultImage ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            />
            {resultImage && (
              <img 
                src={resultImage} 
                alt="AI Result" 
                className={`absolute max-w-full max-h-full object-contain rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.8)] border border-white/5 transition-opacity duration-500 ${!showOriginal ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              />
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center animate-in fade-in duration-1000 text-center">
            <h1 className="font-black tracking-[0.2em] mr-[-0.2em] uppercase text-white/5 text-8xl md:text-9xl leading-none">
              IMAGE
            </h1>
            <p className="mt-4 text-white/15 text-[10px] font-black uppercase tracking-[0.4em] mr-[-0.4em] bg-white/5 px-4 py-2 rounded-full border border-white/5">
              MGEEEEEE LAB
            </p>
          </div>
        )}
      </div>

      {/* Generating Overlay */}
      {isGenerating && (
        <div className="absolute inset-0 flex items-center justify-center z-[60] pointer-events-none">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[8px]" />
          <div className="relative flex flex-col items-center justify-center gap-4 w-full px-12 text-center">
            <h1 className="text-6xl md:text-8xl font-black tracking-[0.5em] mr-[-0.5em] uppercase animate-breath-blue drop-shadow-[0_0_20px_rgba(59,130,246,0.6)] leading-none">
              IMAGE
            </h1>
            <p className="text-white/40 text-[10px] md:text-xs font-bold uppercase tracking-[0.1em] animate-pulse">
              美好值得等待
            </p>
          </div>
        </div>
      )}

      {/* Main Tab Bar */}
      <div className="absolute bottom-6 left-6 right-6 z-50 pointer-events-none">
        <div className="pointer-events-auto flex items-center justify-between gap-1.5 h-20 px-4 bg-black/80 border border-white/10 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom-10 duration-700">
          
          {!resultImage ? (
            /* INITIAL/EDITING STATE */
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

              <button onClick={() => setIsCameraOpen(true)} disabled={isGenerating} className={commonBtnClass} title="Camera">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 text-white/50">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                </svg>
              </button>

              <button onClick={() => fileInputRef.current?.click()} disabled={isGenerating} className={commonBtnClass} title="Upload">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 text-white/50">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6.75a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6.75v12.75a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
              </button>

              <button onClick={runAI} disabled={!capturedImage || isGenerating} className={commonBtnClass} title="Generate">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 text-white/50">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
              </button>
            </>
          ) : (
            /* RESULT/VIEWING STATE */
            <>
              <button onClick={handleExit} disabled={isGenerating} className={dangerBtnClass} title="Exit">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-red-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <button onClick={toggleComparison} className={commonBtnClass} title="Flip Comparison">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-5 h-5 transition-transform duration-300 ${showOriginal ? 'text-white' : 'text-white/50'}`}>
                  {/* Horizontal Flip icon */}
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                </svg>
              </button>

              <button onClick={handleDownload} className={commonBtnClass} title="Download">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-white/50">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
              </button>

              <button onClick={runAI} disabled={isGenerating} className={commonBtnClass} title="Regenerate">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-white/50">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
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
          <p className="text-xs font-bold tracking-wider">{error}</p>
        </div>
      )}
    </div>
  );
};

export default App;
