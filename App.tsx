
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { CameraModule } from './components/CameraModule';
import { PromptDialog } from './components/PromptDialog';
import { SettingsDialog } from './components/SettingsDialog';
import { ImageEditor } from './components/ImageEditor';
import { generateAIImage } from './services/geminiService';
import { ModelType, ApiSettings } from './types';

const App: React.FC = () => {
  const [preEditImage, setPreEditImage] = useState<string | null>(null);
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

  const runAI = useCallback(async (base64: string, p: string) => {
    setIsGenerating(true);
    setError(null);
    setShowOriginal(false);
    try {
      const result = await generateAIImage(base64, p, apiSettings);
      setResultImage(result);
    } catch (err: any) {
      setError(err.message || 'Generation service unavailable');
    } finally {
      setIsGenerating(false);
    }
  }, [apiSettings]);

  const handleCapture = (base64: string) => {
    setPreEditImage(base64);
    setIsCameraOpen(false);
  };

  const handleEditComplete = (editedBase64: string) => {
    setPreEditImage(null);
    setCapturedImage(editedBase64);
    setResultImage(null);
    runAI(editedBase64, prompt);
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

  const handleRegenerate = () => {
    if (capturedImage) {
      runAI(capturedImage, prompt);
    }
  };

  const handleDownload = async () => {
    if (!resultImage) return;

    try {
      if (navigator.share) {
        const response = await fetch(resultImage);
        const blob = await response.blob();
        const file = new File([blob], `ai-vision-${Date.now()}.png`, { type: 'image/png' });
        
        await navigator.share({
          files: [file],
          title: 'AI Vision Art',
          text: 'Check out this AI-generated image!',
        });
      } else {
        const link = document.createElement('a');
        link.href = resultImage;
        link.download = `ai_vision_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const toggleComparison = () => {
    if (resultImage && !isGenerating) {
      setShowOriginal(!showOriginal);
    }
  };

  return (
    <div className="relative h-screen w-screen bg-black overflow-hidden select-none text-white">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept="image/*" 
        className="hidden" 
      />

      {/* Adaptive Image Stage */}
      <div className="absolute inset-0 flex items-center justify-center bg-black overflow-hidden">
        {capturedImage ? (
          <>
            <img 
              src={showOriginal ? capturedImage : (resultImage || capturedImage)} 
              alt="bg" 
              className="absolute inset-0 w-full h-full object-cover blur-[100px] opacity-30 scale-125 transition-opacity duration-1000"
            />
            <div className={`relative z-10 w-full h-full max-w-[95%] max-h-[85%] flex items-center justify-center p-4 transition-all duration-1000 ${isGenerating ? 'blur-3xl opacity-10 scale-90' : 'blur-0 opacity-100 scale-100'}`}>
              <img 
                src={showOriginal ? capturedImage : (resultImage || capturedImage)} 
                alt="Display" 
                className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border border-white/5"
              />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center animate-in fade-in duration-1000">
            <h1 className="font-black tracking-[0.2em] uppercase text-white/5 text-8xl md:text-9xl">
              Image
            </h1>
            <p className="mt-4 text-white/10 text-[10px] font-black uppercase tracking-[0.4em]">Visual Lab</p>
          </div>
        )}
      </div>

      {/* Generation Overlay - Fixed for purely text-based ethereal look */}
      {isGenerating && (
        <div className="absolute inset-0 flex items-center justify-center z-[60] bg-black/40 backdrop-blur-sm pointer-events-none">
          <h1 className="text-6xl font-black tracking-[0.4em] uppercase animate-breath-blue drop-shadow-[0_0_20px_rgba(59,130,246,0.5)] text-center px-6">
            IMAGE
          </h1>
        </div>
      )}

      {/* Control Elements */}
      <div className="absolute top-12 left-6 z-50">
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="w-12 h-12 flex items-center justify-center rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl active:scale-90 transition-all shadow-2xl"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-white/80">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774a1.125 1.125 0 01.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.894.15c.542.09.94.56.94 1.11v1.094c0 .55-.398 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.164.398-.142.854.108 1.204l.527.738a1.125 1.125 0 01-.12 1.45l-.774.773a1.125 1.125 0 01-1.45.12l-.737-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527a1.125 1.125 0 01-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.11v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      <div className="absolute top-12 right-6 z-50 flex gap-4">
        {resultImage && !isGenerating && (
          <button 
            onClick={handleDownload}
            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white text-black active:scale-90 transition-all shadow-2xl"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
          </button>
        )}
      </div>

      {resultImage && !isGenerating && (
        <div className="absolute bottom-36 left-0 right-0 flex justify-center z-30 pointer-events-none">
          <button 
            onClick={toggleComparison}
            className={`pointer-events-auto w-12 h-12 rounded-2xl backdrop-blur-3xl border flex items-center justify-center shadow-2xl active:scale-90 transition-all ${showOriginal ? 'bg-blue-600 border-blue-400 text-white' : 'bg-white/5 border-white/10 text-white/60'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-5 h-5 transition-transform duration-500 ${showOriginal ? 'rotate-180' : 'rotate-0'}`}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>
        </div>
      )}

      {/* Control Bar */}
      <div className="absolute bottom-10 left-6 right-6 z-50 flex items-center justify-between gap-3 h-20 px-4 bg-black/60 border border-white/10 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl animate-in slide-in-from-bottom-10 duration-700">
        <button 
          onClick={() => setIsPromptOpen(true)}
          className="w-12 h-12 rounded-[1.2rem] bg-white/5 border border-white/5 flex items-center justify-center active:scale-90 transition-all shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-white/50">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
        </button>

        <div className="flex-1 flex gap-2">
          <button 
            onClick={() => setIsCameraOpen(true)}
            disabled={isGenerating}
            className="flex-1 h-14 bg-white rounded-2xl flex items-center justify-center active:scale-95 disabled:opacity-20 transition-all shadow-[0_4px_30px_rgba(255,255,255,0.2)]"
          >
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-black">
              <path d="M12 9a3.75 3.75 0 100 7.5A3.75 3.75 0 0012 9z" />
              <path fillRule="evenodd" d="M9.344 3.071a49.52 49.52 0 015.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.11.71.386.054.77.113 1.152.177 1.432.239 2.429 1.493 2.429 2.909V18a3 3 0 01-3 3h-15a3 3 0 01-3-3V9.574c0-1.416.997-2.67 2.429-2.909.382-.064.766-.123 1.151-.178a1.56 1.56 0 001.11-.71l.822-1.315a2.742 2.742 0 012.332-1.39zM9 12.75a3 3 0 116 0 3 3 0 01-6 0z" clipRule="evenodd" />
            </svg>
          </button>
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isGenerating}
            className="flex-1 h-14 bg-white/10 border border-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center active:scale-95 disabled:opacity-20 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 text-white/80">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6.75a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6.75v12.75a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </button>
        </div>

        <button 
          onClick={handleRegenerate}
          disabled={!capturedImage || isGenerating}
          className="w-12 h-12 rounded-[1.2rem] bg-white/5 border border-white/5 flex items-center justify-center active:scale-90 transition-all disabled:opacity-5 shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-white/50">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
        </button>
      </div>

      {preEditImage && (
        <ImageEditor 
          image={preEditImage} 
          onSave={handleEditComplete} 
          onCancel={() => setPreEditImage(null)} 
        />
      )}
      {isCameraOpen && <CameraModule onCapture={handleCapture} onClose={() => setIsCameraOpen(false)} />}
      {isPromptOpen && <PromptDialog initialPrompt={prompt} onSave={(p) => { setPrompt(p); setIsPromptOpen(false); }} onClose={() => setIsPromptOpen(false)} />}
      {isSettingsOpen && <SettingsDialog settings={apiSettings} onSave={(s) => { setApiSettings(s); setIsSettingsOpen(false); }} onClose={() => setIsSettingsOpen(false)} />}
      
      {error && (
        <div className="absolute top-24 left-6 right-6 bg-red-500/20 border border-red-500/30 text-red-200 px-6 py-4 rounded-3xl text-center backdrop-blur-3xl z-[120]">
          <p className="text-xs font-bold tracking-wider">{error}</p>
        </div>
      )}
    </div>
  );
};

export default App;
