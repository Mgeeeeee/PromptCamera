
import React, { useState, useRef, useEffect } from 'react';

interface ImageEditorProps {
  image: string;
  onSave: (editedBase64: string) => void;
  onCancel: () => void;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({ image, onSave, onCancel }) => {
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX - position.x, y: clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setPosition({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleApply = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    const viewport = viewportRef.current;
    if (!canvas || !img || !viewport) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use a high-res square output (e.g., 1024x1024)
    const outputSize = 1024;
    canvas.width = outputSize;
    canvas.height = outputSize;

    const rect = viewport.getBoundingClientRect();
    const scale = outputSize / rect.width;

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, outputSize, outputSize);

    ctx.save();
    ctx.translate(outputSize / 2, outputSize / 2);
    ctx.translate(position.x * scale, position.y * scale);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom * scale, zoom * scale);

    // Draw image centered in its transformed space
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    ctx.restore();

    onSave(canvas.toDataURL('image/jpeg', 0.9));
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black flex flex-col p-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-black uppercase tracking-widest text-white/80">Crop & Transform</h2>
        <button onClick={onCancel} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 active:scale-90 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-white/40">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Editor Viewport */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {/* Viewport Frame */}
        <div 
          ref={viewportRef}
          className="relative aspect-square w-full max-w-[min(100%,70vh)] overflow-hidden border-2 border-white/20 rounded-[2rem] bg-neutral-900 shadow-2xl touch-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
        >
          {/* Guide Grid */}
          <div className="absolute inset-0 z-10 pointer-events-none opacity-20">
            <div className="absolute inset-x-0 top-1/3 h-px bg-white" />
            <div className="absolute inset-x-0 top-2/3 h-px bg-white" />
            <div className="absolute inset-y-0 left-1/3 w-px bg-white" />
            <div className="absolute inset-y-0 left-2/3 w-px bg-white" />
          </div>

          <img
            ref={imgRef}
            src={image}
            alt="To edit"
            draggable={false}
            style={{ 
              transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${zoom})`,
              transition: isDragging ? 'none' : 'transform 0.1s ease-out'
            }}
            className="max-w-none w-auto h-auto object-contain cursor-move"
          />
        </div>
      </div>

      <div className="mt-8 space-y-8">
        {/* Zoom Control */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between px-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Zoom</span>
            <span className="text-[10px] font-black text-blue-400">{Math.round(zoom * 100)}%</span>
          </div>
          <input 
            type="range" 
            min="0.5" 
            max="3" 
            step="0.01" 
            value={zoom} 
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-white/10 rounded-full appearance-none accent-blue-500 cursor-pointer"
          />
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleRotate}
            className="flex-1 py-4 bg-white/5 border border-white/10 rounded-[1.5rem] flex flex-col items-center gap-1 active:scale-95 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-white/80">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Rotate 90°</span>
          </button>

          <button
            onClick={handleApply}
            className="flex-[2.5] h-16 bg-white text-black rounded-[1.5rem] font-black uppercase tracking-[0.15em] text-sm active:scale-95 transition-all shadow-[0_4px_30px_rgba(255,255,255,0.2)]"
          >
            Confirm Edit
          </button>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
