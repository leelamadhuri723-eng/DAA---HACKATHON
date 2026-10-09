import type { ApiClient, ImpactSummary, NetworkOverview } from './types';

const API_BASE = '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const liveClient: ApiClient = {
  async getHealth() {
    return request<{ status: string; services: string[] }>('/health');
  },

  async getNetworkOverview() {
    return request<NetworkOverview>('/network-overview');
  },

  async getImpact(serverName: string): Promise<ImpactSummary> {
    return request<ImpactSummary>(`/impact?serverName=${encodeURIComponent(serverName)}`);
  },
};
