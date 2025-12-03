import React from 'react';
import { X, Quote } from 'lucide-react';
import { GeminiInterpretation } from '../types';

interface InsightModalProps {
  data: GeminiInterpretation | null;
  isOpen: boolean;
  onClose: () => void;
}

const InsightModal: React.FC<InsightModalProps> = ({ data, isOpen, onClose }) => {
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#344E41]/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Content */}
      <div className="relative bg-[#f2f0e4] w-full max-w-lg rounded-xl shadow-2xl border border-[#A3B18A] overflow-hidden transform transition-all scale-100 opacity-100">
        
        {/* Decorative Header */}
        <div className="bg-[#344E41] h-3 w-full"></div>
        
        <button 
          onClick={onClose}
          className="absolute top-5 right-4 p-2 hover:bg-[#A3B18A]/20 rounded-full transition-colors text-[#588157]"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 font-serif">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-[#344E41] mb-3 tracking-wide">{data.title}</h2>
            <div className="w-16 h-1 bg-[#A3B18A] mx-auto rounded-full"></div>
          </div>

          <div className="mb-8 relative px-4">
            <Quote className="absolute -top-4 -left-0 w-8 h-8 text-[#A3B18A] opacity-30 rotate-180" />
            <p className="text-xl text-center italic text-[#557C55] leading-relaxed">
              {data.poem}
            </p>
            <Quote className="absolute -bottom-4 -right-0 w-8 h-8 text-[#A3B18A] opacity-30" />
          </div>

          <div className="bg-[#e6e2d3]/50 p-6 rounded-lg border border-[#A3B18A]/30">
            <h3 className="text-xs font-bold text-[#588157] uppercase tracking-widest mb-3 text-center">Weaving Philosophy</h3>
            <p className="text-[#344E41] text-sm leading-7 text-justify">
              {data.philosophy}
            </p>
          </div>
        </div>

        <div className="bg-[#DAD7CD] p-3 text-center text-xs text-[#588157]">
          Generated based on your unique movement pattern
        </div>
      </div>
    </div>
  );
};

export default InsightModal;