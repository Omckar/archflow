export interface NodeDetails {
  description: string;
  scaling: string;
  technology: string;
  operationExplanation: string;
  bottleneckRisk: 'low' | 'medium' | 'high';
}

export interface SystemNode {
  id: string;
  label: string;
  type: string;
  x: number;
  y: number;
  details: NodeDetails;
}

export interface SystemEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface SystemDesign {
  nodes: SystemNode[];
  edges: SystemEdge[];
}
