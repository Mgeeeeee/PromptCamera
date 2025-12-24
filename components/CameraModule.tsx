
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
      {/* Full Screen Viewfinder */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Floating UI: Top Close Button */}
      <div className="absolute top-12 left-6">
        <button 
          onClick={onClose}
          className="w-12 h-12 rounded-2xl flex items-center justify-center bg-black/40 border border-white/10 backdrop-blur-xl text-white active:scale-90 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Guide Overlays */}
      <div className="absolute inset-10 border border-white/5 pointer-events-none rounded-[2rem]">
         <div className="absolute top-1/2 left-0 w-8 h-[1px] bg-white/10"></div>
         <div className="absolute top-1/2 right-0 w-8 h-[1px] bg-white/10"></div>
         <div className="absolute top-0 left-1/2 w-[1px] h-8 bg-white/10"></div>
         <div className="absolute bottom-0 left-1/2 w-[1px] h-8 bg-white/10"></div>
      </div>

      {/* Floating UI: Bottom Shutter Button */}
      <div className="absolute bottom-12 left-0 right-0 flex justify-center">
        <button 
          onClick={handleCapture}
          className="w-20 h-20 rounded-full bg-white flex items-center justify-center active:scale-90 transition-all shadow-[0_0_50px_rgba(255,255,255,0.3)] ring-4 ring-white/20"
        >
          <div className="w-16 h-16 rounded-full border-2 border-black/5 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-white shadow-inner"></div>
          </div>
        </button>
      </div>
    </div>
  );
};
