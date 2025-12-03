import React, { useState, useCallback } from 'react';
import BambooCanvas from './components/BambooCanvas';
import ControlPanel from './components/ControlPanel';
import InsightModal from './components/InsightModal';
import { interpretPattern } from './services/geminiService';
import { GeminiInterpretation } from './types';

function App() {
  const [canvasRef, setCanvasRef] = useState<HTMLCanvasElement | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [insight, setInsight] = useState<GeminiInterpretation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Capture the canvas as an image and send to Gemini
  const handleInterpret = useCallback(async () => {
    if (!canvasRef) return;

    setIsProcessing(true);
    try {
      // Create a temporary canvas to scale down image (save bandwidth/tokens)
      // and ensure we capture the current state with white background instead of transparent
      const tempCanvas = document.createElement('canvas');
      const w = 512;
      const h = 512;
      tempCanvas.width = w;
      tempCanvas.height = h;
      const ctx = tempCanvas.getContext('2d');
      
      if (ctx) {
        ctx.fillStyle = '#f2f0e4'; // Match background
        ctx.fillRect(0, 0, w, h);
        // Draw the full canvas scaled down
        ctx.drawImage(canvasRef, 0, 0, w, h);
        
        const base64 = tempCanvas.toDataURL('image/jpeg', 0.8);
        
        const result = await interpretPattern(base64);
        setInsight(result);
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error("Failed to interpret pattern:", error);
      alert("The spirits are quiet (API Error). Check your console or API Key.");
    } finally {
      setIsProcessing(false);
    }
  }, [canvasRef]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#f2f0e4]">
      {/* Background/Canvas Layer */}
      <BambooCanvas 
        onCanvasRef={setCanvasRef} 
        isCapturing={!isModalOpen} // Pause physics interaction when modal is open
      />
      
      {/* UI Layer */}
      <ControlPanel 
        onInterpret={handleInterpret} 
        isLoading={isProcessing} 
      />

      <InsightModal 
        isOpen={isModalOpen} 
        data={insight} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}

export default App;