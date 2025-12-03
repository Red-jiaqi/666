export interface Point {
  x: number;
  y: number;
}

export interface StripNode {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
}

export interface BambooStrip {
  id: number;
  type: 'horizontal' | 'vertical';
  nodes: StripNode[];
  color: string;
  highlightColor: string;
  shadowColor: string;
  width: number;
  jointIndices: number[]; // Indices of nodes that represent bamboo joints/knots
}

export interface GeminiInterpretation {
  title: string;
  poem: string;
  philosophy: string;
}
