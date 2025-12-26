const API_URL = '/api';

let authToken: string | null = null;

export function setToken(token: string) {
  authToken = token;
  localStorage.setItem('token', token);
}

export function getToken(): string | null {
  if (!authToken) {
    authToken = localStorage.getItem('token');
  }
  return authToken;
}

export function clearToken() {
  authToken = null;
  localStorage.removeItem('token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  
  return res.json();
}

export const api = {
  auth: {
    getChallenge: (btcAddress: string) => 
      request<{ challenge: string }>(`/auth/challenge?btcAddress=${btcAddress}`),
    verify: (btcAddress: string, signature: string) =>
      request<{ token: string; user: any; activatedInvites: number }>('/auth/verify', {
        method: 'POST',
        body: JSON.stringify({ btcAddress, signature }),
      }),
  },
  
  escrow: {
    create: (data: any) =>
      request<{ escrow: any; sellerRegistered: boolean; inviteLink: string | null }>('/escrow/create', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    list: (params?: { role?: string; status?: string }) => {
      const query = params ? `?${new URLSearchParams(params)}` : '';
      return request<any[]>(`/escrow${query}`);
    },
    get: (id: string) => request<any>(`/escrow/${id}`),
    getPublic: (id: string) => request<any>(`/escrow/invite/${id}`),
    accept: (id: string) => request<any>(`/escrow/${id}/accept`, { method: 'POST' }),
    reject: (id: string) => request<any>(`/escrow/${id}/reject`, { method: 'POST' }),
    lock: (id: string, data: any) =>
      request<any>(`/escrow/${id}/lock`, { method: 'POST', body: JSON.stringify(data) }),
    submitProof: (id: string, txHash: string) =>
      request<any>(`/escrow/${id}/submit-proof`, { method: 'POST', body: JSON.stringify({ txHash }) }),
    release: (id: string, data: any) =>
      request<any>(`/escrow/${id}/release`, { method: 'POST', body: JSON.stringify(data) }),
    refund: (id: string, data: any) =>
      request<any>(`/escrow/${id}/refund`, { method: 'POST', body: JSON.stringify(data) }),
    pendingInvites: () => request<any[]>('/escrow/pending-invites'),
  },
};
