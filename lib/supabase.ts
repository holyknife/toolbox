/**
 * Supabase client and API wrapper using native fetch.
 * Designed for Next.js and Cloudflare Workers with zero bundle overhead.
 */

export interface SupabaseUser {
  id: string;
  email?: string;
  created_at?: string;
  user_metadata?: Record<string, any>;
}

export interface SupabaseSession {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  user: SupabaseUser;
}

export interface ToolUsageRow {
  tool_slug: string;
  last_used_at: string;
  use_count: number;
}

const SESSION_KEY = 'toolbox_supabase_session';
export const AUTH_CHANGE_EVENT = 'toolbox_auth_state_change';

const DEFAULT_SUPABASE_URL = 'https://fpcpdjmmpdcqbcyummnu.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_p1O5_uxLTmnQxyFtWZc1Yw_jf7mTp5Z';

export function getSupabaseConfig() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL).trim().replace(/\/$/, '');
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_KEY).trim();
  return {
    url,
    anonKey,
    isConfigured: Boolean(url && anonKey),
  };
}

export const supabaseAuth = {
  /** Check if a valid session exists in localStorage */
  getSession(): SupabaseSession | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw) as SupabaseSession;
      if (session.expires_at && Date.now() / 1000 > session.expires_at) {
        // Expired
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
      return session;
    } catch {
      return null;
    }
  },

  getUser(): SupabaseUser | null {
    const session = this.getSession();
    return session?.user ?? null;
  },

  /** Send 6-digit OTP to user email */
  async signInWithOtp(email: string): Promise<{ error: string | null }> {
    const { url, anonKey, isConfigured } = getSupabaseConfig();
    if (!isConfigured) {
      return { error: 'Supabase is not configured yet. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.' };
    }

    try {
      const res = await fetch(`${url}/auth/v1/otp`, {
        method: 'POST',
        headers: {
          apikey: anonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          create_user: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { error: data.msg || data.error_description || data.message || `Failed to send code (${res.status})` };
      }

      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Network error while sending login code.' };
    }
  },

  /** Verify 6-digit OTP token */
  async verifyOtp(email: string, token: string): Promise<{ session: SupabaseSession | null; error: string | null }> {
    const { url, anonKey, isConfigured } = getSupabaseConfig();
    if (!isConfigured) {
      return { session: null, error: 'Supabase is not configured yet.' };
    }

    try {
      const res = await fetch(`${url}/auth/v1/verify`, {
        method: 'POST',
        headers: {
          apikey: anonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'email',
          email: email.trim().toLowerCase(),
          token: token.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        return { session: null, error: data.msg || data.error_description || data.message || 'Invalid or expired code.' };
      }

      const expires_at = Math.floor(Date.now() / 1000) + (data.expires_in || 3600);
      const session: SupabaseSession = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at,
        user: data.user,
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT, { detail: session }));
      }

      return { session, error: null };
    } catch (err: any) {
      return { session: null, error: err.message || 'Network error while verifying code.' };
    }
  },

  /** Sign in with email and password */
  async signInWithPassword(email: string, password: string): Promise<{ session: SupabaseSession | null; error: string | null }> {
    const { url, anonKey } = getSupabaseConfig();
    try {
      const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          apikey: anonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const rawErr = (data.error_description || data.msg || data.message || '').toLowerCase();
        if (rawErr.includes('invalid login credentials') || rawErr.includes('invalid credentials')) {
          return { session: null, error: 'Incorrect email or password. If you do not have an account yet, click "Sign up" above.' };
        }
        if (rawErr.includes('email not confirmed')) {
          return { session: null, error: 'Your email has not been verified yet. Please enter the OTP code sent to your email.' };
        }
        return { session: null, error: data.error_description || data.msg || data.message || 'Invalid email or password.' };
      }

      const expires_at = Math.floor(Date.now() / 1000) + (data.expires_in || 3600);
      const session: SupabaseSession = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at,
        user: data.user,
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT, { detail: session }));
      }

      return { session, error: null };
    } catch (err: any) {
      return { session: null, error: err.message || 'Network error while signing in.' };
    }
  },

  /** Sign up with name, email, and password. Supabase sends confirmation OTP code. */
  async signUpWithPassword(email: string, password: string, name?: string): Promise<{ session: SupabaseSession | null; needsOtp: boolean; error: string | null }> {
    const { url, anonKey } = getSupabaseConfig();
    try {
      const res = await fetch(`${url}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          apikey: anonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          data: name ? { name: name.trim(), full_name: name.trim() } : undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.error_description || data.msg || data.message || '';
        if (msg.toLowerCase().includes('already registered')) {
          return { session: null, needsOtp: false, error: 'An account with this email already exists. Please log in instead.' };
        }
        return { session: null, needsOtp: false, error: msg || 'Failed to create account.' };
      }

      // Check if user already existed (Supabase empty identities array when email confirmation is active)
      if (data.identities && Array.isArray(data.identities) && data.identities.length === 0) {
        return { session: null, needsOtp: false, error: 'An account with this email already exists. Please log in instead.' };
      }

      if (data.access_token) {
        const expires_at = Math.floor(Date.now() / 1000) + (data.expires_in || 3600);
        const session: SupabaseSession = {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_at,
          user: data.user,
        };

        if (typeof window !== 'undefined') {
          localStorage.setItem(SESSION_KEY, JSON.stringify(session));
          window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT, { detail: session }));
        }

        return { session, needsOtp: false, error: null };
      }

      // Email confirmation OTP required
      return { session: null, needsOtp: true, error: null };
    } catch (err: any) {
      return { session: null, needsOtp: false, error: err.message || 'Network error while creating account.' };
    }
  },

  /** Verify OTP code for email signup confirmation */
  async verifySignupOtp(email: string, token: string): Promise<{ session: SupabaseSession | null; error: string | null }> {
    const { url, anonKey } = getSupabaseConfig();
    try {
      // First try signup verification
      let res = await fetch(`${url}/auth/v1/verify`, {
        method: 'POST',
        headers: {
          apikey: anonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'signup',
          email: email.trim().toLowerCase(),
          token: token.trim(),
        }),
      });

      let data = await res.json().catch(() => ({}));

      // If type signup failed, try type email (magiclink/otp fallback)
      if (!res.ok) {
        res = await fetch(`${url}/auth/v1/verify`, {
          method: 'POST',
          headers: {
            apikey: anonKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'email',
            email: email.trim().toLowerCase(),
            token: token.trim(),
          }),
        });
        data = await res.json().catch(() => ({}));
      }

      if (!res.ok) {
        return { session: null, error: data.msg || data.error_description || data.message || 'Invalid or expired 6-digit code.' };
      }

      const expires_at = Math.floor(Date.now() / 1000) + (data.expires_in || 3600);
      const session: SupabaseSession = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at,
        user: data.user,
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT, { detail: session }));
      }

      return { session, error: null };
    } catch (err: any) {
      return { session: null, error: err.message || 'Network error while verifying code.' };
    }
  },

  /** Sign out and clear stored session */
  async signOut(): Promise<void> {
    const session = this.getSession();
    const { url, anonKey, isConfigured } = getSupabaseConfig();

    if (isConfigured && session?.access_token) {
      try {
        await fetch(`${url}/auth/v1/logout`, {
          method: 'POST',
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${session.access_token}`,
          },
        }).catch(() => {});
      } catch {
        // Ignore network errors on logout
      }
    }

    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_KEY);
      window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT, { detail: null }));
    }
  },
};

export const supabaseDb = {
  /** Fetch recent tool usage for user */
  async fetchUsage(userId: string, accessToken: string): Promise<ToolUsageRow[]> {
    const { url, anonKey, isConfigured } = getSupabaseConfig();
    if (!isConfigured) return [];

    try {
      const res = await fetch(
        `${url}/rest/v1/user_tool_usage?user_id=eq.${encodeURIComponent(userId)}&select=tool_slug,last_used_at,use_count&order=last_used_at.desc&limit=20`,
        {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      if (!res.ok) return [];
      return (await res.json()) as ToolUsageRow[];
    } catch {
      return [];
    }
  },

  /** Record or increment tool usage */
  async recordUsage(userId: string, accessToken: string, slug: string): Promise<void> {
    const { url, anonKey, isConfigured } = getSupabaseConfig();
    if (!isConfigured) return;

    try {
      // First check existing count
      const checkRes = await fetch(
        `${url}/rest/v1/user_tool_usage?user_id=eq.${encodeURIComponent(userId)}&tool_slug=eq.${encodeURIComponent(slug)}&select=use_count`,
        {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      let currentCount = 0;
      if (checkRes.ok) {
        const rows = await checkRes.json();
        if (Array.isArray(rows) && rows.length > 0) {
          currentCount = rows[0].use_count || 0;
        }
      }

      await fetch(`${url}/rest/v1/user_tool_usage`, {
        method: 'POST',
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify({
          user_id: userId,
          tool_slug: slug,
          last_used_at: new Date().toISOString(),
          use_count: currentCount + 1,
        }),
      });
    } catch {
      // Ignore background sync errors
    }
  },

  /** Fetch favorites for user */
  async fetchFavorites(userId: string, accessToken: string): Promise<string[]> {
    const { url, anonKey, isConfigured } = getSupabaseConfig();
    if (!isConfigured) return [];

    try {
      const res = await fetch(
        `${url}/rest/v1/user_favorites?user_id=eq.${encodeURIComponent(userId)}&select=tool_slug`,
        {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      if (!res.ok) return [];
      const rows = (await res.json()) as { tool_slug: string }[];
      return rows.map(r => r.tool_slug);
    } catch {
      return [];
    }
  },

  /** Toggle favorite in database */
  async setFavorite(userId: string, accessToken: string, slug: string, isFav: boolean): Promise<void> {
    const { url, anonKey, isConfigured } = getSupabaseConfig();
    if (!isConfigured) return;

    try {
      if (isFav) {
        await fetch(`${url}/rest/v1/user_favorites`, {
          method: 'POST',
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates',
          },
          body: JSON.stringify({
            user_id: userId,
            tool_slug: slug,
          }),
        });
      } else {
        await fetch(
          `${url}/rest/v1/user_favorites?user_id=eq.${encodeURIComponent(userId)}&tool_slug=eq.${encodeURIComponent(slug)}`,
          {
            method: 'DELETE',
            headers: {
              apikey: anonKey,
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
      }
    } catch {
      // Ignore
    }
  },
};
