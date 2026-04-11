// plus1-rewards/src/lib/adminAuth.ts
// Secure server-side admin authentication with pattern lock

import { supabase } from './supabase';
import { requestSigner } from './requestSigner';

interface AdminSession {
  sessionToken: string;
  phone: string;
  expiresAt: string;
  fingerprint: string; // Browser fingerprint
}

// Storage key
const ADMIN_SESSION_KEY = 'plus1_admin_session_v2';
const ADMIN_GRID_SIZE = 4;

// Get Edge Function URL
const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-auth`;

// Generate browser fingerprint
async function generateFingerprint(): Promise<string> {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.colorDepth,
    screen.width,
    screen.height,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 0,
    navigator.platform
  ];
  
  const fingerprintString = components.join('|');
  const encoder = new TextEncoder();
  const data = encoder.encode(fingerprintString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Get client IP and user agent
async function getClientInfo() {
  return {
    userAgent: navigator.userAgent,
    fingerprint: await generateFingerprint()
    // IP will be detected server-side from request headers
  };
}

export const adminAuth = {
  // Authenticate admin user with pattern - calls Edge Function
  async loginWithPattern(phone: string, pattern: number[], rememberMe: boolean = false): Promise<{ success: boolean; error?: string }> {
    try {
      const clientInfo = await getClientInfo();

      // TEMPORARY: Try Edge Function first, fall back to database
      try {
        const response = await fetch(`${EDGE_FUNCTION_URL}/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
          },
          body: JSON.stringify({
            phone,
            pattern,
            gridSize: ADMIN_GRID_SIZE,
            userAgent: clientInfo.userAgent,
            fingerprint: clientInfo.fingerprint
          })
        });

        // If Edge Function doesn't exist, use database fallback
        if (response.status === 404) {
          console.warn('⚠️ Edge Function not deployed. Using database fallback.');
          return await this.loginWithDatabase(phone, pattern, rememberMe, clientInfo.fingerprint);
        }

        const data = await response.json();

        if (!response.ok || !data.success) {
          return { success: false, error: data.error || 'Authentication failed' };
        }

        // Store session token securely
        const session: AdminSession = {
          sessionToken: data.sessionToken,
          phone: data.phone,
          expiresAt: data.expiresAt,
          fingerprint: clientInfo.fingerprint
        };

        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));

        return { success: true };
      } catch (fetchError) {
        console.warn('⚠️ Edge Function error. Using database fallback.', fetchError);
        return await this.loginWithDatabase(phone, pattern, rememberMe, clientInfo.fingerprint);
      }
    } catch (error) {
      console.error('Admin login error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  },

  // Fallback: Login directly with database (less secure but functional)
  async loginWithDatabase(phone: string, pattern: number[], rememberMe: boolean, fingerprint: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Query admin from members table
      const { data: admin, error } = await supabase
        .from('members')
        .select('id, cell_phone, first_name, last_name, pattern_lock, role, status')
        .eq('cell_phone', phone)
        .eq('role', 'admin')
        .single();

      if (error || !admin) {
        return { success: false, error: 'Invalid credentials' };
      }

      if (admin.status !== 'active') {
        return { success: false, error: 'Account is not active' };
      }

      // Verify pattern
      if (!admin.pattern_lock) {
        return { success: false, error: 'Pattern not set for this account' };
      }

      const storedPattern = JSON.parse(admin.pattern_lock);
      if (JSON.stringify(pattern) !== JSON.stringify(storedPattern)) {
        return { success: false, error: 'Invalid pattern' };
      }

      // Generate session token (simple version - in production use crypto)
      const sessionToken = `admin_${admin.id}_${Date.now()}_${Math.random().toString(36)}`;
      const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2 hours

      // Store session
      const session: AdminSession = {
        sessionToken,
        phone: admin.cell_phone,
        expiresAt,
        fingerprint
      };

      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));

      return { success: true };
    } catch (error) {
      console.error('Database login error:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  },

  // Check if admin is authenticated - verifies with server
  async isAuthenticated(): Promise<boolean> {
    try {
      const session = this.getStoredSession();
      if (!session) {
        return false;
      }

      // Check if session expired locally first
      if (new Date(session.expiresAt) < new Date()) {
        await this.logout();
        return false;
      }

      // Verify fingerprint matches
      const currentFingerprint = await generateFingerprint();
      if (session.fingerprint !== currentFingerprint) {
        console.error('🚨 SECURITY: Browser fingerprint mismatch');
        await this.logout();
        return false;
      }

      // TEMPORARY: Check if Edge Function exists
      // TODO: Remove this fallback once Edge Function is deployed
      try {
        // Sign the request
        const signedRequest = await requestSigner.signRequest(session.sessionToken);

        // Verify with server
        const clientInfo = await getClientInfo();
        const response = await fetch(`${EDGE_FUNCTION_URL}/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
          },
          body: JSON.stringify({
            sessionToken: session.sessionToken,
            userAgent: clientInfo.userAgent,
            fingerprint: clientInfo.fingerprint,
            signature: signedRequest.signature,
            timestamp: signedRequest.timestamp,
            nonce: signedRequest.nonce
          })
        });

        // If Edge Function doesn't exist (404), fall back to database check
        if (response.status === 404) {
          console.warn('⚠️ Edge Function not deployed. Using database fallback.');
          return await this.verifyWithDatabase(session);
        }

        const data = await response.json();

        if (!response.ok || !data.valid) {
          await this.logout();
          return false;
        }

        // Update session expiry
        session.expiresAt = data.expiresAt;
        const storage = localStorage.getItem(ADMIN_SESSION_KEY) ? localStorage : sessionStorage;
        storage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));

        return true;
      } catch (fetchError) {
        console.warn('⚠️ Edge Function error. Using database fallback.', fetchError);
        return await this.verifyWithDatabase(session);
      }
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  },

  // Fallback: Verify session directly with database (less secure but functional)
  async verifyWithDatabase(session: AdminSession): Promise<boolean> {
    try {
      // Query members table for admin with matching phone
      const { data: admin, error } = await supabase
        .from('members')
        .select('id, cell_phone, role, status')
        .eq('cell_phone', session.phone)
        .eq('role', 'admin')
        .eq('status', 'active')
        .single();

      if (error || !admin) {
        console.error('Admin not found or inactive');
        await this.logout();
        return false;
      }

      // Session is valid
      return true;
    } catch (error) {
      console.error('Database verification error:', error);
      return false;
    }
  },

  // Synchronous check for local session (use for initial render)
  isAuthenticatedSync(): boolean {
    const session = this.getStoredSession();
    if (!session) {
      return false;
    }
    return new Date(session.expiresAt) > new Date();
  },

  // Get stored session
  getStoredSession(): AdminSession | null {
    try {
      const sessionStr = localStorage.getItem(ADMIN_SESSION_KEY) || sessionStorage.getItem(ADMIN_SESSION_KEY);
      if (!sessionStr) {
        return null;
      }
      return JSON.parse(sessionStr);
    } catch (error) {
      console.error('Get session error:', error);
      return null;
    }
  },

  // Logout admin - calls Edge Function to invalidate server session
  async logout(): Promise<void> {
    try {
      const session = this.getStoredSession();
      if (session) {
        await fetch(`${EDGE_FUNCTION_URL}/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
          },
          body: JSON.stringify({
            sessionToken: session.sessionToken
          })
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem(ADMIN_SESSION_KEY);
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
    }
  },

  // Get time until session expires (in milliseconds)
  getTimeUntilExpiry(): number {
    const session = this.getStoredSession();
    if (!session) {
      return 0;
    }
    return Math.max(0, new Date(session.expiresAt).getTime() - Date.now());
  }
};

// Auto-verify session periodically
let verificationInterval: NodeJS.Timeout | null = null;

export function setupAdminActivityMonitor() {
  // Clear existing interval
  if (verificationInterval) {
    clearInterval(verificationInterval);
  }

  // Verify session every 5 minutes
  verificationInterval = setInterval(async () => {
    if (adminAuth.isAuthenticatedSync()) {
      await adminAuth.isAuthenticated();
    }
  }, 5 * 60 * 1000);

  // Verify on visibility change
  document.addEventListener('visibilitychange', async () => {
    if (!document.hidden && adminAuth.isAuthenticatedSync()) {
      await adminAuth.isAuthenticated();
    }
  });
}
