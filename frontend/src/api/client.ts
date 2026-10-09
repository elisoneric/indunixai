const API_BASE = ''; // Uses Vite proxy to FastAPI backend

export interface User {
  id: string;
  email: string;
  full_name: string;
  company_name?: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface Wallet {
  balance_ngn: number;
  bonus_credits_ngn: number;
  total_available_ngn: number;
  currency: string;
  is_frozen: boolean;
}

export interface ApiKeyItem {
  id: string;
  name: string;
  key_prefix: string;
  is_active: boolean;
  monthly_spend_limit_ngn?: number;
  current_month_spend_ngn: number;
  last_used_at?: string;
  created_at: string;
}

export interface CreatedApiKeyResponse {
  api_key: ApiKeyItem;
  secret_key: string;
  warning: string;
}

export interface TransactionItem {
  id: string;
  reference: string;
  amount_ngn: number;
  channel: string;
  status: string;
  created_at: string;
  metadata_json?: any;
}

export interface UsageSummary {
  total_requests: number;
  total_prompt_tokens: number;
  total_completion_tokens: number;
  total_tokens: number;
  total_spend_ngn: number;
  avg_latency_ms: number;
  model_breakdown: Record<string, { requests: number; tokens: number; spend_ngn: number }>;
  daily_usage: Array<{ date: string; tokens: number; spend_ngn: number; requests: number }>;
}

export interface UsageLogItem {
  id: string;
  model_requested: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost_deducted_ngn: number;
  latency_ms: number;
  is_stream: boolean;
  created_at: string;
}

export interface ModelDescriptor {
  id: string;
  root: string;
  description: string;
  pricing_ngn_per_m: number;
  context_window: number;
}

export interface EnterpriseContract {
  id: string;
  organization_name: string;
  contact_email: string;
  fixed_monthly_retainer_ngn: number;
  billing_cycle: string;
  contract_status: string;
  monthly_included_tokens: number;
  license_key: string;
  active_until: string;
  last_heartbeat_at?: string;
  created_at: string;
}

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('indunix_token') || localStorage.getItem('axion_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  // Auth
  async register(data: { email: string; password: string; full_name: string; company_name?: string }) {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Registration failed');
    }
    const result = await res.json();
    localStorage.setItem('indunix_token', result.access_token);
    localStorage.setItem('indunix_user', JSON.stringify(result.user));
    return result;
  },

  async login(data: { email: string; password: string }) {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Login failed');
    }
    const result = await res.json();
    localStorage.setItem('indunix_token', result.access_token);
    localStorage.setItem('indunix_user', JSON.stringify(result.user));
    return result;
  },

  async googleAuth(data: { credential?: string; email?: string; full_name?: string; google_id?: string }) {
    const res = await fetch(`${API_BASE}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Google authentication failed');
    }
    const result = await res.json();
    localStorage.setItem('indunix_token', result.access_token);
    localStorage.setItem('indunix_user', JSON.stringify(result.user));
    return result;
  },

  async getAuthConfig(): Promise<{ google_client_id: string }> {
    try {
      const res = await fetch(`${API_BASE}/api/auth/config`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // fallback
    }
    return { google_client_id: '' };
  },

  async getMe(): Promise<User> {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to fetch user');
    return res.json();
  },

  logout() {
    localStorage.removeItem('indunix_token');
    localStorage.removeItem('indunix_user');
    localStorage.removeItem('axion_token');
    localStorage.removeItem('axion_user');
  },

  getUser(): User | null {
    const u = localStorage.getItem('indunix_user') || localStorage.getItem('axion_user');
    return u ? JSON.parse(u) : null;
  },

  // Wallet & Billing
  async getWallet(): Promise<Wallet> {
    const res = await fetch(`${API_BASE}/api/billing/wallet`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to fetch wallet');
    return res.json();
  },

  async initializeDeposit(amount_ngn: number, channel = 'CARD'): Promise<{ authorization_url: string; reference: string; amount_ngn: number }> {
    const res = await fetch(`${API_BASE}/api/billing/deposit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ amount_ngn, channel }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to initialize deposit');
    }
    return res.json();
  },

  async verifyDemoDeposit(reference: string): Promise<any> {
    const res = await fetch(`${API_BASE}/api/billing/verify-demo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ reference }),
    });
    if (!res.ok) throw new Error('Demo verification failed');
    return res.json();
  },

  async getTransactions(): Promise<TransactionItem[]> {
    const res = await fetch(`${API_BASE}/api/billing/transactions`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to load transactions');
    return res.json();
  },

  // API Keys
  async getKeys(): Promise<ApiKeyItem[]> {
    const res = await fetch(`${API_BASE}/api/keys`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to load API keys');
    return res.json();
  },

  async createKey(name: string, monthly_spend_limit_ngn?: number): Promise<CreatedApiKeyResponse> {
    const res = await fetch(`${API_BASE}/api/keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ name, monthly_spend_limit_ngn }),
    });
    if (!res.ok) throw new Error('Failed to generate key');
    return res.json();
  },

  async toggleKey(id: string): Promise<ApiKeyItem> {
    const res = await fetch(`${API_BASE}/api/keys/${id}/toggle`, {
      method: 'PATCH',
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to toggle key');
    return res.json();
  },

  async deleteKey(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/keys/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to delete key');
  },

  // Analytics & Logs
  async getSummary(days = 30): Promise<UsageSummary> {
    const res = await fetch(`${API_BASE}/api/analytics/summary?days=${days}`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to load analytics');
    return res.json();
  },

  async getLogs(limit = 50, model?: string): Promise<UsageLogItem[]> {
    const url = model
      ? `${API_BASE}/api/analytics/logs?limit=${limit}&model=${encodeURIComponent(model)}`
      : `${API_BASE}/api/analytics/logs?limit=${limit}`;
    const res = await fetch(url, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to load logs');
    return res.json();
  },

  // Gateway Models
  async getModels(): Promise<ModelDescriptor[]> {
    const res = await fetch(`${API_BASE}/v1/models`);
    if (!res.ok) throw new Error('Failed to load models');
    const data = await res.json();
    return data.data;
  },

  async getContracts(): Promise<EnterpriseContract[]> {
    const res = await fetch(`${API_BASE}/api/enterprise/contracts`);
    if (!res.ok) throw new Error('Failed to load enterprise contracts');
    return res.json();
  },

  async submitEnterpriseInquiry(data: {
    full_name: string;
    company_name: string;
    email: string;
    phone: string;
    deployment_type: string;
    estimated_volume?: string;
    notes?: string;
  }): Promise<{ status: string; message: string; inquiry_id: string }> {
    const res = await fetch(`${API_BASE}/api/enterprise/inquire`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to submit inquiry');
    }
    return res.json();
  },

  async enterpriseHeartbeat(license_key: string, machine_fingerprint: string, uptime_hours: number) {
    const res = await fetch(`${API_BASE}/v1/enterprise/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ license_key, machine_fingerprint, uptime_hours }),
    });
    return res.json();
  },

  // Streaming Playground Gateway
  async streamPlayground(
    model: string,
    prompt: string,
    onChunk: (text: string) => void,
    onDone: () => void,
    onError: (err: string) => void
  ) {
    const token = localStorage.getItem('indunix_token') || localStorage.getItem('axion_token');
    // If user has not logged in yet, prompt them or register instant guest demo token
    let authHeaderValue = token ? `Bearer ${token}` : '';

    if (!token) {
      // Auto register or login guest demo user so the landing page playground works instantly!
      try {
        const guestEmail = `guest.${Date.now()}@indunixai.com`;
        const guestRes = await fetch(`${API_BASE}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: guestEmail,
            password: 'GuestPassword123!',
            full_name: 'Interactive Visitor',
            company_name: 'Visitor Demo'
          })
        });
        if (guestRes.ok) {
          const guestData = await guestRes.json();
          localStorage.setItem('indunix_token', guestData.access_token);
          localStorage.setItem('indunix_user', JSON.stringify(guestData.user));
          authHeaderValue = `Bearer ${guestData.access_token}`;
        }
      } catch (e) {
        console.warn('Guest account creation failed:', e);
      }
    }

    try {
      const response = await fetch(`${API_BASE}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeaderValue,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          stream: true,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errObj = await response.json().catch(() => ({}));
        const msg = errObj?.error?.message || `Request failed with status ${response.status}`;
        onError(msg);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        onError('Streaming not supported in browser environment');
        return;
      }

      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const dataStr = trimmed.replace('data: ', '').trim();
          if (dataStr === '[DONE]') {
            onDone();
            return;
          }
          try {
            const parsed = JSON.parse(dataStr);
            const content = parsed.choices?.[0]?.delta?.content || '';
            if (content) onChunk(content);
          } catch {
            // ignore non-json lines
          }
        }
      }
      onDone();
    } catch (e: any) {
      onError(e.message || 'Stream connection interrupted');
    }
  },

  // Admin Platform Management
  async getAdminConfig() {
    const res = await fetch(`${API_BASE}/api/admin/config`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to load admin config');
    return res.json();
  },

  async updateAdminConfig(payload: {
    paystack_secret_key?: string;
    paystack_public_key?: string;
    deepseek_api_key?: string;
    groq_api_key?: string;
    together_api_key?: string;
    live_production_mode?: boolean;
  }) {
    const res = await fetch(`${API_BASE}/api/admin/config`, {
      method: 'POST',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update admin settings');
    return res.json();
  },

  async getAdminMetrics() {
    const res = await fetch(`${API_BASE}/api/admin/metrics`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to load admin metrics');
    return res.json();
  },

  async verifyTransaction(reference: string) {
    const res = await fetch(`${API_BASE}/api/billing/verify/${reference}`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to verify transaction');
    return res.json();
  },
};
