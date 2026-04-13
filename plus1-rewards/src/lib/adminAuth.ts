// plus1-rewards/src/lib/adminAuth.ts
// Server-side admin authentication via Supabase Edge Function

const ADMIN_SESSION_KEY = 'plus1_admin_session_v2';
const EDGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-auth`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const GRID_SIZE = 4;

interface AdminSession {
  sessionToken: string;
  phone: string;
  expiresAt: string;
}

export const adminAuth = {
  async loginWithPattern(
    phone: string,
    pattern: number[],
    rememberMe = false
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const res  = await fetch(`${EDGE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: ANON_KEY },
        body: JSON.stringify({ phone, pattern, gridSize: GRID_SIZE }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) return { success: false, error: data.error || 'Authentication failed' };

      const session: AdminSession = { sessionToken: data.sessionToken, phone: data.phone, expiresAt: data.expiresAt };
      (rememberMe ? localStorage : sessionStorage).setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
      return { success: true };
    } catch {
      // Fallback: client-side verification if edge function unreachable
      return this._clientFallback(phone, pattern, rememberMe);
    }
  },

  // Client-side fallback using env vars (used if edge function is down)
  async _clientFallback(phone: string, pattern: number[], rememberMe: boolean): Promise<{ success: boolean; error?: string }> {
    const expectedPhone = import.meta.env.VITE_ADMIN_PHONE;
    const expectedHash  = import.meta.env.VITE_ADMIN_PATTERN_HASH;
    const salt          = import.meta.env.VITE_ADMIN_PATTERN_SALT;
    if (phone !== expectedPhone) return { success: false, error: 'Invalid credentials' };
    const canonical = `g${GRID_SIZE}:${pattern.join('-')}`;
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', enc.encode(canonical), 'PBKDF2', false, ['deriveBits']);
    const buf = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(salt), iterations: 100000, hash: 'SHA-256' }, key, 256);
    const hash = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    if (hash !== expectedHash) return { success: false, error: 'Invalid pattern' };
    const session: AdminSession = { sessionToken: `local_${Date.now()}`, phone, expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() };
    (rememberMe ? localStorage : sessionStorage).setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
    return { success: true };
  },

  async loginWithDatabase(phone: string, pattern: number[], rememberMe: boolean, _fp: string) {
    return this.loginWithPattern(phone, pattern, rememberMe);
  },

  async isAuthenticated(): Promise<boolean> {
    const session = this.getStoredSession();
    if (!session) return false;
    if (new Date(session.expiresAt) < new Date()) { await this.logout(); return false; }
    // Verify with server if it's a real session token
    if (!session.sessionToken.startsWith('local_')) {
      try {
        const res = await fetch(`${EDGE_URL}/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: ANON_KEY },
          body: JSON.stringify({ sessionToken: session.sessionToken }),
        });
        const data = await res.json();
        if (!res.ok || !data.valid) { await this.logout(); return false; }
        session.expiresAt = data.expiresAt;
        const storage = localStorage.getItem(ADMIN_SESSION_KEY) ? localStorage : sessionStorage;
        storage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
      } catch {
        // Network error — trust local session
      }
    }
    return true;
  },

  isAuthenticatedSync(): boolean {
    const s = this.getStoredSession();
    return !!s && new Date(s.expiresAt) > new Date();
  },

  getStoredSession(): AdminSession | null {
    try {
      const str = localStorage.getItem(ADMIN_SESSION_KEY) || sessionStorage.getItem(ADMIN_SESSION_KEY);
      return str ? JSON.parse(str) : null;
    } catch { return null; }
  },

  async logout(): Promise<void> {
    const session = this.getStoredSession();
    if (session?.sessionToken && !session.sessionToken.startsWith('local_')) {
      try {
        await fetch(`${EDGE_URL}/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: ANON_KEY },
          body: JSON.stringify({ sessionToken: session.sessionToken }),
        });
      } catch {}
    }
    localStorage.removeItem(ADMIN_SESSION_KEY);
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  },

  getTimeUntilExpiry(): number {
    const s = this.getStoredSession();
    return s ? Math.max(0, new Date(s.expiresAt).getTime() - Date.now()) : 0;
  },
};

export function setupAdminActivityMonitor() {}
