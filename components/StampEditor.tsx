import React, { useRef, useState, useEffect } from 'react';
import { StampConfig } from '../types';

interface StampEditorProps {
  pdfImage: string;
  stamp: StampConfig;
  onPositionChange: (x: number, y: number) => void;
}

const StampEditor: React.FC<StampEditorProps> = ({ pdfImage, stamp, onPositionChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault(); // Prevent text selection
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    
    // Calculate position relative to container
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    // Convert to percentage
    let xPercent = (x / rect.width) * 100;
    let yPercent = (y / rect.height) * 100;

    // Clamp values
    xPercent = Math.max(0, Math.min(100, xPercent));
    yPercent = Math.max(0, Math.min(100, yPercent));

    onPositionChange(xPercent, yPercent);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 p-4 rounded-lg border border-gray-200 overflow-auto">
      <div 
        ref={containerRef}
        className="relative shadow-lg select-none cursor-crosshair"
        style={{ maxWidth: '100%', maxHeight: '70vh' }}
        onMouseMove={handleMouseMove}
      >
        <img 
          src={pdfImage} 
          alt="PDF Preview" 
          className="max-w-full max-h-[70vh] w-auto h-auto block"
          draggable={false}
        />
        
        {/* The Stamp Overlay */}
        <div
          onMouseDown={handleMouseDown}
          className={`absolute cursor-move select-none whitespace-nowrap p-1 border-2 border-dashed ${isDragging ? 'border-indigo-500 bg-indigo-50/30' : 'border-transparent hover:border-indigo-300'}`}
          style={{
            left: `${stamp.x}%`,
            top: `${stamp.y}%`,
            fontSize: `${stamp.fontSize}px`,
            color: stamp.color,
            fontFamily: 'Helvetica, sans-serif',
            fontWeight: 'bold',
            transform: 'translate(-50%, -50%)', // Center the stamp on the mouse cursor/coordinates
            lineHeight: 1,
          }}
        >
          {stamp.text || "Preview Text"}
        </div>

        {/* Instructions Overlay (only if not dragging and text is empty) */}
        {!stamp.text && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-black/50 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm">
              Enter text in the sidebar to begin
            </div>
          </div>
        )}
      </div>
      <p className="mt-4 text-xs text-gray-500">
        Click and drag the text to position it. The text will be stamped exactly where seen above.
      </p>
    </div>
  );
};

export default StampEditor;
