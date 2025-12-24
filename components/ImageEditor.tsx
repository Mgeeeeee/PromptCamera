
import React, { useState, useRef, useEffect } from 'react';

interface ImageEditorProps {
  image: string;
  onSave: (editedBase64: string) => void;
  onCancel: () => void;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({ image, onSave, onCancel }) => {
  const [rotation, setRotation] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleApply = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate dimensions based on rotation
    const isVertical = rotation === 90 || rotation === 270;
    const width = isVertical ? img.naturalHeight : img.naturalWidth;
    const height = isVertical ? img.naturalWidth : img.naturalHeight;

    canvas.width = width;
    canvas.height = height;

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    ctx.restore();

    onSave(canvas.toDataURL('image/jpeg', 0.9));
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-3xl flex flex-col p-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold tracking-tight">Edit Photo</h2>
        <button onClick={onCancel} className="text-white/40 font-bold uppercase text-[10px] tracking-widest">Cancel</button>
      </div>

      <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-neutral-900/50 rounded-3xl border border-white/5">
        <img
          ref={imgRef}
          src={image}
          alt="To edit"
          style={{ transform: `rotate(${rotation}deg)` }}
          className="max-w-full max-h-full object-contain transition-transform duration-300 shadow-2xl"
        />
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="mt-8 flex gap-4">
        <button
          onClick={handleRotate}
          className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center gap-1 active:scale-95 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">Rotate</span>
        </button>

        <button
          onClick={handleApply}
          className="flex-[2] py-4 bg-white text-black rounded-2xl font-bold text-sm tracking-wide active:scale-95 transition-all shadow-xl shadow-white/5"
        >
          Confirm & Process
        </button>
      </div>
    </div>
  );
};
