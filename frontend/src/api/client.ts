const API_BASE = ''; // Uses Vite proxy to FastAPI backend

export interface User {
  id: string;
  username?: string;
  email: string;
  full_name: string;
  company_name?: string;
  role: string;
  is_active: boolean;
  must_change_password?: boolean;
  created_at: string;
}

export interface AdminUserItem {
  id: string;
  username?: string;
  email: string;
  full_name: string;
  company_name?: string;
  role: string;
  is_active: boolean;
  must_change_password: boolean;
  created_at: string;
  balance_ngn: number;
  bonus_credits_ngn: number;
  total_available_ngn: number;
  is_frozen: boolean;
  dedicated_account_number?: string;
  dedicated_account_bank?: string;
  total_api_keys: number;
  total_tokens: number;
  total_requests: number;
}

export interface AdminPromoCampaigns {
  signup_bonus_ngn: number;
  sale_active: boolean;
  sale_title: string;
  sale_discount_percent: number;
  sale_ends_at?: string;
  banner_active: boolean;
  banner_text: string;
}

export interface AdminModelPricingItem {
  name?: string;
  prompt_per_million: number;
  completion_per_million: number;
  context_window?: number;
  description?: string;
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
  api_key_id?: string | null;
  api_key_name?: string | null;
  api_key_prefix?: string | null;
}

export interface GroupedUsageLogItem {
  group_key: string;
  group_name: string;
  api_key_prefix?: string;
  total_requests: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  total_cost_ngn: number;
  avg_latency_ms: number;
  logs: UsageLogItem[];
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

export interface ModelUnitEconomics {
  model_id: string;
  model_name: string;
  requests: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  retail_revenue_ngn: number;
  upstream_cost_usd: number;
  upstream_cost_ngn: number;
  gross_profit_ngn: number;
  margin_percent: number;
}

export interface DeepSeekLiveBalance {
  status: 'connected' | 'unconfigured' | 'error' | 'mock' | 'network_error';
  is_available: boolean;
  currency: string;
  total_balance: number;
  granted_balance: number;
  topped_up_balance: number;
  balance_ngn: number;
  message: string;
}

export interface DepositFeeSettings {
  fee_strategy: 'absorb' | 'pass_through';
  fee_percent: number;
  flat_fee_ngn: number;
  flat_fee_threshold_ngn: number;
  fee_cap_ngn: number;
  fx_rate_usd_ngn: number;
}

export interface AdminSmtpSettings {
  host?: string;
  port: number;
  user?: string;
  password?: string;
  from_email: string;
  from_name: string;
  use_ssl: boolean;
  use_tls: boolean;
  is_configured: boolean;
}

export interface AdminFinancialReport {
  gross_inflow_ngn: number;
  gateway_fees_ngn: number;
  net_inflow_credited_ngn: number;
  deposit_count: number;
  avg_deposit_amount_ngn: number;
  recognized_revenue_ngn: number;
  total_tokens_consumed: number;
  total_requests: number;
  upstream_cogs_usd: number;
  upstream_cogs_ngn: number;
  fx_rate_usd_ngn: number;
  gross_profit_ngn: number;
  gross_margin_percent: number;
  net_profit_ngn: number;
  net_margin_percent: number;
  deepseek_balance: DeepSeekLiveBalance;
  user_liabilities_ngn: number;
  solvency_coverage_ratio: number;
  deposit_fee_settings: DepositFeeSettings;
  model_economics: ModelUnitEconomics[];
}

export interface GuestSession {
  guest_token: string;
  session_id: string;
  messages_sent: number;
  max_messages: number;
  remaining_messages: number;
  eligible_models: string[];
  expires_at: string;
}

export interface ChatLimits {
  tier: 'guest' | 'free' | 'pro';
  messages_used: number;
  messages_limit: number;
  remaining_messages: number;
  credits_balance_ngn: number;
  bonus_credits_ngn: number;
  total_available_ngn: number;
  allowed_models: string[];
  can_use_reasoning: boolean;
  reset_interval: string;
}

export interface ChatMessageItem {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  reasoning_content?: string | null;
  model?: string | null;
  prompt_tokens?: number;
  completion_tokens?: number;
  created_at: string;
}

export interface ConversationItem {
  id: string;
  title: string;
  model: string;
  is_pinned: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  message_count: number;
  messages?: ChatMessageItem[];
}

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('indunix_token') || localStorage.getItem('axion_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function getChatAuthHeader(): Record<string, string> {
  const userToken = localStorage.getItem('indunix_token') || localStorage.getItem('axion_token');
  if (userToken) {
    return { Authorization: `Bearer ${userToken}` };
  }
  const guestToken = localStorage.getItem('indunix_guest_token');
  if (guestToken) {
    return { Authorization: `Bearer ${guestToken}`, 'X-Guest-Token': guestToken };
  }
  return {};
}

function getAdminAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('indunix_admin_token') || localStorage.getItem('indunix_token') || localStorage.getItem('axion_token');
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

  async updateProfile(data: { full_name?: string; company_name?: string }): Promise<User> {
    const res = await fetch(`${API_BASE}/api/auth/profile`, {
      method: 'PUT',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to update profile');
    }
    const updatedUser = await res.json();
    localStorage.setItem('indunix_user', JSON.stringify(updatedUser));
    return updatedUser;
  },

  async changePassword(data: { current_password?: string; new_password: string }) {
    const res = await fetch(`${API_BASE}/api/auth/password`, {
      method: 'PUT',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to change password');
    }
    return res.json();
  },

  async getPreferences() {
    const res = await fetch(`${API_BASE}/api/auth/preferences`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) return { login_alerts: true, deposit_receipts: true, low_balance_alerts: true, usage_reports: true, theme: 'dark', clean_numbers: true };
    return res.json();
  },

  async updatePreferences(data: any) {
    const res = await fetch(`${API_BASE}/api/auth/preferences`, {
      method: 'PUT',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to save preferences');
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

  async initializeDeposit(amount_ngn: number, channel = 'CARD'): Promise<{ authorization_url: string; access_code: string; reference: string; amount_ngn: number; public_key?: string }> {
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

  async verifyTransaction(reference: string): Promise<{ status: string; message?: string; reference: string; amount_ngn?: number; error?: string }> {
    const res = await fetch(`${API_BASE}/api/billing/verify/${reference}`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Payment verification check failed');
    }
    return res.json();
  },

  async getVirtualAccount(): Promise<{
    bank_name?: string;
    account_number?: string;
    account_name?: string;
    currency?: string;
    is_assigned?: boolean;
    requires_kyc?: boolean;
    error?: string;
  }> {
    const res = await fetch(`${API_BASE}/api/billing/virtual-account`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to load dedicated virtual account');
    return res.json();
  },

  async provisionVirtualAccount(data: { phone?: string; nin_or_bvn?: string }): Promise<{
    bank_name?: string;
    account_number?: string;
    account_name?: string;
    currency?: string;
    is_assigned?: boolean;
    requires_kyc?: boolean;
    error?: string;
  }> {
    const res = await fetch(`${API_BASE}/api/billing/virtual-account/provision`, {
      method: 'POST',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to provision dedicated virtual account');
    }
    return res.json();
  },

  async syncBankTransfers(reference?: string): Promise<{
    status: string;
    message: string;
    credited_count: number;
    total_credited_ngn: number;
    new_balance_ngn?: number;
  }> {
    const res = await fetch(`${API_BASE}/api/billing/sync-bank-transfers`, {
      method: 'POST',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(reference ? { reference: reference.trim() } : {}),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.message || 'Failed to sync bank transfers');
    }
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

  async getLogs(
    params?: number | {
      limit?: number;
      model?: string;
      apiKeyId?: string;
      timeRange?: string;
      startDate?: string;
      endDate?: string;
    },
    modelArg?: string,
    apiKeyIdArg?: string
  ): Promise<UsageLogItem[]> {
    const searchParams = new URLSearchParams();
    if (typeof params === 'object' && params !== null) {
      if (params.limit) searchParams.set('limit', params.limit.toString());
      if (params.model) searchParams.set('model', params.model);
      if (params.apiKeyId) searchParams.set('api_key_id', params.apiKeyId);
      if (params.timeRange) searchParams.set('time_range', params.timeRange);
      if (params.startDate) searchParams.set('start_date', params.startDate);
      if (params.endDate) searchParams.set('end_date', params.endDate);
    } else {
      const limit = typeof params === 'number' ? params : 50;
      searchParams.set('limit', limit.toString());
      if (modelArg) searchParams.set('model', modelArg);
      if (apiKeyIdArg) searchParams.set('api_key_id', apiKeyIdArg);
    }
    const res = await fetch(`${API_BASE}/api/analytics/logs?${searchParams.toString()}`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to load logs');
    return res.json();
  },

  async getGroupedLogs(params: {
    groupBy: 'api_key' | 'model' | 'date';
    timeRange?: string;
    model?: string;
    apiKeyId?: string;
  }): Promise<GroupedUsageLogItem[]> {
    const searchParams = new URLSearchParams({ group_by: params.groupBy });
    if (params.timeRange) searchParams.set('time_range', params.timeRange);
    if (params.model) searchParams.set('model', params.model);
    if (params.apiKeyId) searchParams.set('api_key_id', params.apiKeyId);
    const res = await fetch(`${API_BASE}/api/analytics/logs/grouped?${searchParams.toString()}`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to load grouped logs');
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

    // Unauthenticated visitors: simulate real-time streaming directly in-memory without creating accounts or touching localStorage
    if (!token) {
      const demoResponse = `### Executive Operational Assessment

**Model:** ${model}
**Inference Latency:** 14ms (Lagos Edge Node)
**Settlement Currency:** Nigerian Naira (NGN Native)

1. **Analysis & Metrics:**
   System diagnostic report confirms 100% throughput availability across sovereign inference endpoints. Zero foreign exchange markup applied.

2. **Action Directive:**
   - Integrate standard OpenAI client SDK pointing to the official gateway.
   - Enforce programmatic token budget limits across workspace API keys.
   - Access real-time billing logs in your Developer Console.

*Sign in or create a developer account to execute live production queries.*`;

      const words = demoResponse.split(' ');
      for (let i = 0; i < words.length; i++) {
        await new Promise((r) => setTimeout(r, 20));
        onChunk((i === 0 ? '' : ' ') + words[i]);
      }
      onDone();
      return;
    }

    const authHeaderValue = `Bearer ${token}`;

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
  async adminLogin(payload: { identifier: string; password: string }): Promise<{
    access_token: string;
    token_type: string;
    must_change_password: boolean;
    message: string;
    user: User;
  }> {
    const res = await fetch(`${API_BASE}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Administrator login failed');
    }
    const data = await res.json();
    localStorage.setItem('indunix_admin_token', data.access_token);
    localStorage.setItem('indunix_admin_user', JSON.stringify(data.user));
    return data;
  },

  async adminChangeInitialPassword(payload: { new_password: string }): Promise<{
    status: string;
    message: string;
    access_token: string;
    user: User;
  }> {
    const res = await fetch(`${API_BASE}/api/admin/change-initial-password`, {
      method: 'POST',
      headers: { ...getAdminAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Password update failed');
    }
    const data = await res.json();
    localStorage.setItem('indunix_admin_token', data.access_token);
    localStorage.setItem('indunix_admin_user', JSON.stringify(data.user));
    return data;
  },

  adminLogout() {
    localStorage.removeItem('indunix_admin_token');
    localStorage.removeItem('indunix_admin_user');
  },

  getAdminUser(): User | null {
    const raw = localStorage.getItem('indunix_admin_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  async getAdminConfig() {
    const res = await fetch(`${API_BASE}/api/admin/config`, {
      headers: getAdminAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to load admin config');
    return res.json();
  },

  async updateAdminConfig(payload: {
    paystack_secret_key?: string;
    paystack_public_key?: string;
    deepseek_api_key?: string;
    deepseek_secondary_api_key?: string;
    deepseek_api_keys?: string;
    groq_api_key?: string;
    groq_secondary_api_key?: string;
    groq_api_keys?: string;
    together_api_key?: string;
    live_production_mode?: boolean;
  }) {
    const res = await fetch(`${API_BASE}/api/admin/config`, {
      method: 'POST',
      headers: { ...getAdminAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update admin settings');
    return res.json();
  },

  async getAdminMetrics() {
    const res = await fetch(`${API_BASE}/api/admin/metrics`, {
      headers: getAdminAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to load admin metrics');
    return res.json();
  },

  async getAdminUsers(search?: string, limit = 50, offset = 0): Promise<{ total: number; users: AdminUserItem[] }> {
    const params = new URLSearchParams();
    if (search && search.trim()) params.append('search', search.trim());
    params.append('limit', String(limit));
    params.append('offset', String(offset));

    const res = await fetch(`${API_BASE}/api/admin/users?${params.toString()}`, {
      headers: getAdminAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to load users');
    return res.json();
  },

  async adminAdjustCredits(userId: string, payload: {
    amount_ngn: number;
    credit_type: 'bonus' | 'cash';
    reason: string;
    notify_user?: boolean;
  }) {
    const res = await fetch(`${API_BASE}/api/admin/users/${userId}/adjust-credits`, {
      method: 'POST',
      headers: { ...getAdminAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to adjust user credits');
    }
    return res.json();
  },

  async adminUpdateUserStatus(userId: string, payload: {
    is_active?: boolean;
    is_frozen?: boolean;
    role?: string;
  }) {
    const res = await fetch(`${API_BASE}/api/admin/users/${userId}/status`, {
      method: 'PUT',
      headers: { ...getAdminAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update user status');
    return res.json();
  },

  async getAdminPricing(): Promise<{ pricing: Record<string, AdminModelPricingItem> }> {
    const res = await fetch(`${API_BASE}/api/admin/pricing`, {
      headers: getAdminAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to load model pricing');
    return res.json();
  },

  async updateAdminPricing(models: Record<string, AdminModelPricingItem>) {
    const res = await fetch(`${API_BASE}/api/admin/pricing`, {
      method: 'PUT',
      headers: { ...getAdminAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ models }),
    });
    if (!res.ok) throw new Error('Failed to update model pricing');
    return res.json();
  },

  async getAdminPromos(): Promise<AdminPromoCampaigns> {
    const res = await fetch(`${API_BASE}/api/admin/promos`, {
      headers: getAdminAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to load promotions');
    return res.json();
  },

  async updateAdminPromos(payload: Partial<AdminPromoCampaigns>): Promise<AdminPromoCampaigns> {
    const res = await fetch(`${API_BASE}/api/admin/promos`, {
      method: 'PUT',
      headers: { ...getAdminAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update promotions');
    return res.json();
  },

  async getPublicPromotions(): Promise<AdminPromoCampaigns> {
    const res = await fetch(`${API_BASE}/api/auth/promotions`);
    if (!res.ok) return {
      signup_bonus_ngn: 1000.0,
      sale_active: false,
      sale_title: 'Developer Promo',
      sale_discount_percent: 0,
      banner_active: false,
      banner_text: '',
    };
    return res.json();
  },

  async getPublicPricing(): Promise<Record<string, { prompt_per_million: number; completion_per_million: number; name?: string; description?: string; context_window?: number }>> {
    try {
      const res = await fetch(`${API_BASE}/api/auth/pricing`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback to standard rate card
    }
    return {
      'indunix-1-spark': { prompt_per_million: 950, completion_per_million: 1200, name: 'Indunix 1 Spark', context_window: 128000 },
      'indunix-1-core': { prompt_per_million: 1500, completion_per_million: 1800, name: 'Indunix 1 Core', context_window: 64000 },
      'indunix-1-reason': { prompt_per_million: 2800, completion_per_million: 3200, name: 'Indunix 1 Reason', context_window: 64000 },
    };
  },

  async getAdminFinancials(): Promise<AdminFinancialReport> {
    const res = await fetch(`${API_BASE}/api/admin/financials`, {
      headers: getAdminAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to load financial report');
    return res.json();
  },

  async updateDepositFeeSettings(payload: Partial<DepositFeeSettings>): Promise<DepositFeeSettings> {
    const res = await fetch(`${API_BASE}/api/admin/financials/deposit-fee-settings`, {
      method: 'PUT',
      headers: { ...getAdminAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update deposit fee policy');
    return res.json();
  },

  async updateFxRate(fx_rate_usd_ngn: number): Promise<{ status: string; message: string; fx_rate_usd_ngn: number }> {
    const res = await fetch(`${API_BASE}/api/admin/financials/fx-rate`, {
      method: 'POST',
      headers: { ...getAdminAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ fx_rate_usd_ngn }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to update FX rate');
    }
    return res.json();
  },

  async refreshDeepSeekBalance(): Promise<DeepSeekLiveBalance> {
    const res = await fetch(`${API_BASE}/api/admin/financials/refresh-deepseek-balance`, {
      method: 'POST',
      headers: getAdminAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to refresh DeepSeek balance');
    return res.json();
  },

  async getAdminSmtp(): Promise<AdminSmtpSettings> {
    const res = await fetch(`${API_BASE}/api/admin/smtp`, {
      headers: getAdminAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to load SMTP settings');
    return res.json();
  },

  async updateAdminSmtp(payload: Partial<AdminSmtpSettings>): Promise<AdminSmtpSettings> {
    const res = await fetch(`${API_BASE}/api/admin/smtp`, {
      method: 'POST',
      headers: { ...getAdminAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to update SMTP settings');
    }
    return res.json();
  },

  async testAdminSmtp(recipientEmail?: string): Promise<{ success: boolean; message: string; recipient: string }> {
    const res = await fetch(`${API_BASE}/api/admin/smtp/test`, {
      method: 'POST',
      headers: { ...getAdminAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(recipientEmail ? { recipient_email: recipientEmail.trim() } : {}),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'SMTP test execution failed');
    }
    return res.json();
  },

  async resendAdminReceipt(reference: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/api/admin/smtp/resend-receipt/${encodeURIComponent(reference)}`, {
      method: 'POST',
      headers: getAdminAuthHeader(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to re-dispatch receipt');
    }
    return res.json();
  },

  async resendUserReceipt(reference: string): Promise<{ status: string; message: string }> {
    const res = await fetch(`${API_BASE}/api/billing/resend-receipt/${encodeURIComponent(reference)}`, {
      method: 'POST',
      headers: getAuthHeader(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to dispatch receipt to email');
    }
    return res.json();
  },

  // Indunix AI Chat Platform
  async getOrCreateGuestSession(): Promise<GuestSession> {
    const existingGuestToken = localStorage.getItem('indunix_guest_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (existingGuestToken) {
      headers['X-Guest-Token'] = existingGuestToken;
    }
    const res = await fetch(`${API_BASE}/api/chat/guest/session`, {
      method: 'POST',
      headers,
    });
    if (!res.ok) throw new Error('Failed to create guest chat session');
    const data: GuestSession = await res.json();
    if (data.guest_token) {
      localStorage.setItem('indunix_guest_token', data.guest_token);
    }
    return data;
  },

  async getChatLimits(): Promise<ChatLimits> {
    const res = await fetch(`${API_BASE}/api/chat/limits`, {
      headers: getChatAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to load chat limits');
    return res.json();
  },

  async getChatConversations(q?: string): Promise<ConversationItem[]> {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    const res = await fetch(`${API_BASE}/api/chat/conversations?${params.toString()}`, {
      headers: getChatAuthHeader(),
    });
    if (!res.ok) return [];
    return res.json();
  },

  async createChatConversation(title?: string, model?: string): Promise<ConversationItem> {
    const res = await fetch(`${API_BASE}/api/chat/conversations`, {
      method: 'POST',
      headers: { ...getChatAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title || 'New Chat', model: model || 'indunix-1-core' }),
    });
    if (!res.ok) throw new Error('Failed to create conversation');
    return res.json();
  },

  async getChatConversation(id: string): Promise<ConversationItem> {
    const res = await fetch(`${API_BASE}/api/chat/conversations/${id}`, {
      headers: getChatAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to load conversation');
    return res.json();
  },

  async updateChatConversation(
    id: string,
    data: { title?: string; is_pinned?: boolean; is_archived?: boolean; model?: string }
  ): Promise<ConversationItem> {
    const res = await fetch(`${API_BASE}/api/chat/conversations/${id}`, {
      method: 'PATCH',
      headers: { ...getChatAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update conversation');
    return res.json();
  },

  async deleteChatConversation(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/chat/conversations/${id}`, {
      method: 'DELETE',
      headers: getChatAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to delete conversation');
  },

  async migrateGuestConversations(): Promise<{ status: string; migrated_count: number }> {
    const guestToken = localStorage.getItem('indunix_guest_token');
    if (!guestToken) return { status: 'none', migrated_count: 0 };
    try {
      const res = await fetch(`${API_BASE}/api/chat/conversations/migrate`, {
        method: 'POST',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ guest_token: guestToken }),
      });
      if (res.ok) {
        localStorage.removeItem('indunix_guest_token');
        return res.json();
      }
    } catch {
      // non-fatal
    }
    return { status: 'error', migrated_count: 0 };
  },

  async exportChatConversation(id: string, format: 'markdown' | 'json' = 'markdown'): Promise<string | any> {
    const res = await fetch(`${API_BASE}/api/chat/export/${id}?format=${format}`, {
      headers: getChatAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to export conversation');
    if (format === 'json') return res.json();
    return res.text();
  },

  async streamChat(
    payload: {
      conversation_id?: string;
      model: string;
      messages: Array<{ role: string; content: string }>;
      temperature?: number;
    },
    onMeta: (data: { conversation_id: string; message_id: string }) => void,
    onChunk: (text: string) => void,
    onDone: () => void,
    onError: (err: string) => void,
    signal?: AbortSignal
  ) {
    try {
      // Ensure we have a guest token if unauthenticated
      const token = localStorage.getItem('indunix_token') || localStorage.getItem('axion_token');
      let guestToken = localStorage.getItem('indunix_guest_token');
      if (!token && !guestToken) {
        try {
          const g = await api.getOrCreateGuestSession();
          guestToken = g.guest_token;
        } catch {
          // ignore
        }
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else if (guestToken) {
        headers['Authorization'] = `Bearer ${guestToken}`;
        headers['X-Guest-Token'] = guestToken;
      }

      const response = await fetch(`${API_BASE}/api/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...payload,
          stream: true,
        }),
        signal,
      });

      if (!response.ok) {
        const errObj = await response.json().catch(() => ({}));
        const msg = errObj?.detail || errObj?.message || `Error ${response.status}: Failed to generate reply`;
        onError(msg);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        onError('Streaming is not supported by your browser.');
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
          const dataStr = trimmed.slice(6);
          if (dataStr === '[DONE]') {
            onDone();
            return;
          }

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.conversation_id && parsed.message_id) {
              onMeta({ conversation_id: parsed.conversation_id, message_id: parsed.message_id });
            }
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              onChunk(delta);
            }
          } catch {
            // ignore non-json SSE lines
          }
        }
      }

      onDone();
    } catch (e: any) {
      if (e.name === 'AbortError') {
        onDone();
        return;
      }
      onError(e.message || 'Network stream error');
    }
  },
};
