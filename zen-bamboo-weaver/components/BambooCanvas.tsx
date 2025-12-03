import React, { useRef, useEffect, useState, useCallback } from 'react';
import { BambooStrip, StripNode } from '../types';

interface BambooCanvasProps {
  onCanvasRef: (canvas: HTMLCanvasElement | null) => void;
  isCapturing: boolean;
}

// Configuration for "Silky" feel
const STRIP_COUNT = 18; // Balanced density
const NODE_COUNT = 30; // Higher resolution for smoother curves
const SPRING_STRENGTH = 0.025; // Softer springs for fluid motion
const DAMPING = 0.94; // Preserves momentum for "silky" glide
const MOTION_THRESHOLD = 15; // More sensitive
const MOTION_FORCE = 0.12; // Gentle push

// Natural Bamboo Palette
const BAMBOO_PALETTES = [
  { base: '#557C55', highlight: '#7FA865', shadow: '#344E41' }, // Deep Forest
  { base: '#A3B18A', highlight: '#DAD7CD', shadow: '#588157' }, // Sage/Dried
  { base: '#609966', highlight: '#9DC08B', shadow: '#40513B' }, // Fresh Green
  { base: '#E9E3B4', highlight: '#F5F5DC', shadow: '#B0A695' }, // Aged Yellow
];

const BambooCanvas: React.FC<BambooCanvasProps> = ({ onCanvasRef, isCapturing }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const motionCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [strips, setStrips] = useState<BambooStrip[]>([]);
  const animationFrameId = useRef<number>();
  const prevFrameData = useRef<Uint8ClampedArray | null>(null);

  // Initialize Bamboo Grid with artistic details
  useEffect(() => {
    const initStrips = () => {
      const newStrips: BambooStrip[] = [];
      const width = window.innerWidth;
      const height = window.innerHeight;
      const xStep = width / STRIP_COUNT;
      const yStep = height / STRIP_COUNT;

      // Helper to generate bamboo joints
      const getJoints = (count: number) => {
        const joints = [];
        // Bamboo joints appear at somewhat regular intervals
        let i = Math.floor(Math.random() * 4) + 2;
        while (i < count - 2) {
          joints.push(i);
          i += Math.floor(Math.random() * 5) + 4; // Interval of 4-9 nodes
        }
        return joints;
      };

      // Create Strip Helper
      const createStrip = (
        id: number, 
        type: 'horizontal' | 'vertical', 
        nodes: StripNode[], 
        baseWidth: number
      ): BambooStrip => {
        // Pick a random palette
        const palette = BAMBOO_PALETTES[Math.floor(Math.random() * BAMBOO_PALETTES.length)];
        
        return { 
          id, 
          type, 
          nodes, 
          color: palette.base,
          highlightColor: palette.highlight,
          shadowColor: palette.shadow,
          width: baseWidth * (0.8 + Math.random() * 0.4), // Variance in thickness
          jointIndices: getJoints(NODE_COUNT)
        };
      };

      // Vertical Strips
      for (let i = 0; i <= STRIP_COUNT; i++) {
        const nodes: StripNode[] = [];
        for (let j = 0; j <= NODE_COUNT; j++) {
          const x = i * xStep;
          const y = (j / NODE_COUNT) * height;
          nodes.push({ x, y, baseX: x, baseY: y, vx: 0, vy: 0 });
        }
        newStrips.push(createStrip(i, 'vertical', nodes, xStep * 0.65));
      }

      // Horizontal Strips
      for (let j = 0; j <= STRIP_COUNT; j++) {
        const nodes: StripNode[] = [];
        for (let i = 0; i <= NODE_COUNT; i++) {
          const x = (i / NODE_COUNT) * width;
          const y = j * yStep;
          nodes.push({ x, y, baseX: x, baseY: y, vx: 0, vy: 0 });
        }
        newStrips.push(createStrip(j + 100, 'horizontal', nodes, yStep * 0.65));
      }
      setStrips(newStrips);
    };

    initStrips();
    
    // Setup Camera
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 160, height: 120, frameRate: { ideal: 30 } } // Lower res is fine for motion, smooth framerate
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    };
    
    startCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (canvasRef.current) {
      onCanvasRef(canvasRef.current);
    }
  }, [onCanvasRef]);

  const drawBamboo = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);
    
    // Background: Warm, textured paper feel
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, '#f2f0e4');
    bgGradient.addColorStop(1, '#e6e2d3');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    ctx.lineCap = 'butt'; // Bamboo ends are cut flat usually
    ctx.lineJoin = 'round';

    // Sort: Verticals then Horizontals usually for weaving, 
    // but simply alternating or drawing one set then the other is standard for 2D sim.
    // To make it look "woven", ideally we split segments, but for fluid art, layering 
    // vertical (under) then horizontal (over) is clean.
    // Let's mix them or sort by ID to interleave? 
    // Drawing all verticals then all horizontals creates a "mat" look. 
    // Let's stick to the list order which is V then H.
    
    strips.forEach(strip => {
      if (strip.nodes.length < 2) return;

      // 1. Draw Shadow/Outline (for depth)
      ctx.beginPath();
      ctx.moveTo(strip.nodes[0].x + 4, strip.nodes[0].y + 4);
      for (let i = 0; i < strip.nodes.length - 1; i++) {
        const p0 = strip.nodes[i];
        const p1 = strip.nodes[i + 1];
        const midX = (p0.x + p1.x) / 2;
        const midY = (p0.y + p1.y) / 2;
        ctx.quadraticCurveTo(p0.x + 4, p0.y + 4, midX + 4, midY + 4);
      }
      ctx.lineTo(strip.nodes[strip.nodes.length-1].x + 4, strip.nodes[strip.nodes.length-1].y + 4);
      ctx.strokeStyle = 'rgba(0,0,0,0.1)';
      ctx.lineWidth = strip.width;
      ctx.stroke();

      // 2. Draw Main Body
      ctx.beginPath();
      ctx.moveTo(strip.nodes[0].x, strip.nodes[0].y);
      for (let i = 0; i < strip.nodes.length - 1; i++) {
        const p0 = strip.nodes[i];
        const p1 = strip.nodes[i + 1];
        const midX = (p0.x + p1.x) / 2;
        const midY = (p0.y + p1.y) / 2;
        ctx.quadraticCurveTo(p0.x, p0.y, midX, midY);
      }
      ctx.lineTo(strip.nodes[strip.nodes.length-1].x, strip.nodes[strip.nodes.length-1].y);
      
      ctx.strokeStyle = strip.color;
      ctx.lineWidth = strip.width;
      ctx.stroke();

      // 3. Draw Highlight (Cylindrical effect)
      ctx.strokeStyle = strip.highlightColor;
      ctx.lineWidth = strip.width * 0.4;
      ctx.globalAlpha = 0.4;
      ctx.stroke();
      ctx.globalAlpha = 1.0;

      // 4. Draw Joints (Knots)
      // We iterate the joints and draw a small detail at that node's position
      ctx.fillStyle = strip.shadowColor;
      strip.jointIndices.forEach(idx => {
        if (idx < strip.nodes.length) {
          const node = strip.nodes[idx];
          // Calculate tangent approx to rotate the joint line
          const prev = strip.nodes[idx - 1] || node;
          const next = strip.nodes[idx + 1] || node;
          const dx = next.x - prev.x;
          const dy = next.y - prev.y;
          const angle = Math.atan2(dy, dx);

          ctx.save();
          ctx.translate(node.x, node.y);
          ctx.rotate(angle);
          // Draw a slightly wider, darker rect to simulate the knot
          ctx.fillRect(-2, -strip.width/2 - 2, 4, strip.width + 4);
          ctx.restore();
        }
      });
    });

  }, [strips]);

  const processMotion = useCallback(() => {
    if (!videoRef.current || !motionCanvasRef.current || videoRef.current.readyState !== 4) return;
    
    const mCanvas = motionCanvasRef.current;
    const mCtx = mCanvas.getContext('2d', { willReadFrequently: true });
    if (!mCtx) return;

    // Use lower res for processing to keep FPS high
    const w = 64; 
    const h = 48;
    
    mCtx.drawImage(videoRef.current, 0, 0, w, h);
    const frame = mCtx.getImageData(0, 0, w, h);
    const data = frame.data;

    if (prevFrameData.current) {
      const prev = prevFrameData.current;
      const width = window.innerWidth;
      const height = window.innerHeight;
      const scaleX = width / w;
      const scaleY = height / h;

      // Loop optimization: skip pixels to increase performance
      // Check every 2nd pixel
      for (let y = 0; y < h; y += 2) {
        for (let x = 0; x < w; x += 2) {
          const index = (y * w + x) * 4;
          // Simple brightness diff
          const currLuma = (data[index] + data[index+1] + data[index+2]) / 3;
          const prevLuma = (prev[index] + prev[index+1] + prev[index+2]) / 3;
          const diff = Math.abs(currLuma - prevLuma);
          
          if (diff > MOTION_THRESHOLD) {
            const canvasX = (w - x - 1) * scaleX; // Mirror
            const canvasY = y * scaleY;

            // Apply "Soft" Force
            // Instead of checking every node, we check grid regions?
            // For silky smoothness, we just iterate all. Modern JS engines can handle 20 strips * 30 nodes = 600 checks fine.
            
            const radius = 150; // Larger influence radius for fluid feel
            const radiusSq = radius * radius;

            for (const strip of strips) {
              // Optimization: Check if strip is roughly in range using node[0] or center? 
              // Bounding box check would be better, but direct loop is simple.
              for (const node of strip.nodes) {
                 const dx = node.x - canvasX;
                 const dy = node.y - canvasY;
                 // Quick distance check (squared)
                 const distSq = dx*dx + dy*dy;
                 
                 if (distSq < radiusSq) {
                   // Calculate smooth falloff
                   const dist = Math.sqrt(distSq);
                   const influence = (1 - dist / radius); // 0 to 1
                   
                   // Push vector
                   const angle = Math.atan2(dy, dx);
                   
                   // Accumulate velocity rather than setting position
                   // This creates momentum ("silky" physics)
                   node.vx += Math.cos(angle) * MOTION_FORCE * influence;
                   node.vy += Math.sin(angle) * MOTION_FORCE * influence;
                 }
              }
            }
          }
        }
      }
    }
    
    prevFrameData.current = new Uint8ClampedArray(data);

  }, [strips]);

  const updatePhysics = useCallback(() => {
    strips.forEach(strip => {
      strip.nodes.forEach(node => {
        // 1. Hooke's Law (Spring back to origin)
        const dx = node.baseX - node.x;
        const dy = node.baseY - node.y;
        
        const ax = dx * SPRING_STRENGTH;
        const ay = dy * SPRING_STRENGTH;

        node.vx += ax;
        node.vy += ay;

        // 2. Damping (Fluid friction)
        node.vx *= DAMPING;
        node.vy *= DAMPING;

        // 3. Update Position
        node.x += node.vx;
        node.y += node.vy;
      });
    });
  }, [strips]);

  const loop = useCallback(() => {
    if (!canvasRef.current) return;
    
    if (isCapturing) {
        processMotion();
    }
    
    updatePhysics();

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Resize handling
      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
      drawBamboo(ctx, canvas.width, canvas.height);
    }

    animationFrameId.current = requestAnimationFrame(loop);
  }, [isCapturing, processMotion, updatePhysics, drawBamboo]);

  useEffect(() => {
    animationFrameId.current = requestAnimationFrame(loop);
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [loop]);

  return (
    <>
      <canvas 
        ref={canvasRef} 
        className="fixed inset-0 w-full h-full cursor-none touch-none"
      />
      {/* Hidden processing elements */}
      <video ref={videoRef} className="hidden" muted playsInline />
      <canvas ref={motionCanvasRef} width={64} height={48} className="hidden" />
      
      {isCapturing && (
        <div className="fixed top-4 right-4 flex items-center gap-2 bg-[#f2f0e4]/80 backdrop-blur-md px-4 py-2 rounded-full text-xs text-[#344E41] border border-[#557C55]/30 shadow-sm font-serif">
            <div className="w-2 h-2 bg-[#BC4749] rounded-full animate-pulse"></div>
            捕捉中 (Motion Active)
        </div>
      )}
    </>
  );
};

export default BambooCanvas;
