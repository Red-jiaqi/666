import React from 'react';
import { Camera, Sparkles, Loader2 } from 'lucide-react';

interface ControlPanelProps {
  onInterpret: () => void;
  isLoading: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ onInterpret, isLoading }) => {
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-4 w-full max-w-md px-4">
      
      <div className="bg-[#f2f0e4]/90 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-[#A3B18A] w-full text-center">
        <h1 className="text-2xl font-bold text-[#344E41] mb-2 font-serif tracking-widest">竹编 (Zhubian)</h1>
        <p className="text-[#588157] text-sm mb-6 font-serif italic">
          Flow like water, weave like wind.
        </p>
        
        <button
          onClick={onInterpret}
          disabled={isLoading}
          className="group relative w-full overflow-hidden rounded-xl bg-[#344E41] px-8 py-3 text-[#DAD7CD] transition-all hover:bg-[#588157] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
        >
          <div className="relative flex items-center justify-center gap-2">
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Consulting the Sage...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                <span>Interpret My Weave</span>
              </>
            )}
          </div>
        </button>
      </div>

      <div className="text-xs text-[#557C55]/60 bg-[#f2f0e4]/50 px-3 py-1 rounded-full backdrop-blur-sm border border-[#A3B18A]/30">
        Powered by Gemini 2.5 & Motion Capture
      </div>
    </div>
  );
};

export default ControlPanel;