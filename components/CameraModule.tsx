
import React, { useRef, useEffect, useState } from 'react';

interface CameraModuleProps {
  onCapture: (base64: string) => void;
  onClose: () => void;
}

export const CameraModule: React.FC<CameraModuleProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment', 
            width: { ideal: 1920 }, 
            height: { ideal: 1080 } 
          },
          audio: false
        });
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      } catch (err) {
        console.error("Camera access denied:", err);
        alert("Please grant camera access to use this app.");
        onClose();
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      onCapture(dataUrl);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black animate-in fade-in duration-500 overflow-hidden">
      {/* Viewfinder - Truly Full Screen */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Close Button - Respecting Safe Area */}
      <div className="absolute top-[env(safe-area-inset-top)] left-0 p-6">
        <button 
          onClick={onClose}
          className="w-12 h-12 rounded-2xl flex items-center justify-center bg-black/40 border border-white/10 backdrop-blur-xl text-white active:scale-90 transition-all shadow-xl"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Viewfinder Guide Overlay */}
      <div className="absolute inset-x-8 inset-y-[calc(env(safe-area-inset-top)+80px)] border border-white/10 pointer-events-none rounded-[2rem]">
         <div className="absolute top-1/2 left-0 w-8 h-[1px] bg-white/20"></div>
         <div className="absolute top-1/2 right-0 w-8 h-[1px] bg-white/20"></div>
         <div className="absolute top-0 left-1/2 w-[1px] h-8 bg-white/20"></div>
         <div className="absolute bottom-0 left-1/2 w-[1px] h-8 bg-white/20"></div>
      </div>

      {/* Shutter Button - Respecting Safe Area */}
      <div className="absolute bottom-[env(safe-area-inset-bottom)] left-0 right-0 p-12 flex justify-center">
        <button 
          onClick={handleCapture}
          className="w-20 h-20 rounded-full bg-white flex items-center justify-center active:scale-90 transition-all shadow-[0_0_50px_rgba(255,255,255,0.4)] ring-4 ring-white/20"
        >
          <div className="w-16 h-16 rounded-full border-2 border-black/5 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-white shadow-inner"></div>
          </div>
        </button>
      </div>
    </div>
  );
};