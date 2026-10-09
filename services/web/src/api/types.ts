export type NodeStatus = 'Active' | 'Critical' | 'Degraded' | 'Offline';
export type Reachability = 'Healthy' | 'Degraded' | 'Blocked';
export type RiskLevel = 'Low' | 'Medium' | 'High';

export interface NetworkNode {
  id: string;
  status: NodeStatus;
  reachability: Reachability;
  risk: RiskLevel;
  x?: number;
  y?: number;
}

export interface NetworkLink {
  source: string;
  target: string;
}

export interface ImpactPart {
  label: string;
  servers: string[];
}

export interface NetworkOverview {
  nodes: NetworkNode[];
  links: NetworkLink[];
  criticalServers: string[];
  summary: string;
}

export interface ImpactSummary {
  server: string;
  parts: ImpactPart[];
  summary: string;
}

export interface ApiClient {
  getHealth(): Promise<{ status: string; services: string[] }>;
  getNetworkOverview(): Promise<NetworkOverview>;
  getImpact(serverName: string): Promise<ImpactSummary>;
}
