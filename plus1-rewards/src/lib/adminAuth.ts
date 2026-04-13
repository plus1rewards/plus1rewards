// plus1-rewards/src/lib/adminAuth.ts
// Client-side admin authentication using env vars + browser crypto.subtle

const ADMIN_SESSION_KEY = 'plus1_admin_session_v2';
const GRID_SIZE = 4;

interface AdminSession {
  phone: string;
  expiresAt: string;
}

async function hashPattern(canonical: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(canonical), 'PBKDF2', false, ['deriveBits']
  );
  const hashBuffer = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: encoder.encode(salt), iterations: 100000, hash: 'SHA-256' },
    keyMaterial, 256
  );
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0')).join('');
}

export const adminAuth = {
  async loginWithPattern(
    phone: string,
    pattern: number[],
    rememberMe: boolean = false
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const expectedPhone = import.meta.env.VITE_ADMIN_PHONE;
      const expectedHash  = import.meta.env.VITE_ADMIN_PATTERN_HASH;
      const salt          = import.meta.env.VITE_ADMIN_PATTERN_SALT;

      if (phone !== expectedPhone) {
        return { success: false, error: 'Invalid credentials' };
      }

      const canonical   = `g${GRID_SIZE}:${pattern.join('-')}`;
      const computedHash = await hashPattern(canonical, salt);

      if (computedHash !== expectedHash) {
        return { success: false, error: 'Invalid pattern' };
      }

      const session: AdminSession = {
        phone,
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      };

      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));

      return { success: true };
    } catch (err) {
      console.error('Admin login error:', err);
      return { success: false, error: 'Authentication error. Please try again.' };
    }
  },

  // Keep these for compatibility with existing code
  async loginWithDatabase(
    phone: string, pattern: number[], rememberMe: boolean, _fingerprint: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.loginWithPattern(phone, pattern, rememberMe);
  },

  async isAuthenticated(): Promise<boolean> {
    return this.isAuthenticatedSync();
  },

  isAuthenticatedSync(): boolean {
    const session = this.getStoredSession();
    if (!session) return false;
    return new Date(session.expiresAt) > new Date();
  },

  getStoredSession(): AdminSession | null {
    try {
      const str = localStorage.getItem(ADMIN_SESSION_KEY)
               || sessionStorage.getItem(ADMIN_SESSION_KEY);
      if (!str) return null;
      return JSON.parse(str);
    } catch {
      return null;
    }
  },

  async logout(): Promise<void> {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  },

  getTimeUntilExpiry(): number {
    const session = this.getStoredSession();
    if (!session) return 0;
    return Math.max(0, new Date(session.expiresAt).getTime() - Date.now());
  },
};

export function setupAdminActivityMonitor() {
  // No-op — session is managed client-side
}
