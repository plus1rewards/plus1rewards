// plus1-rewards/src/lib/adminAuth.ts
// Secure server-side admin authentication with pattern lock

import { supabase } from './supabase';

interface AdminSession {
  sessionToken: string;
  phone: string;
  expiresAt: string;
}

// Storage key
const ADMIN_SESSION_KEY = 'plus1_admin_session_v2';
const ADMIN_GRID_SIZE = 4;

// Get Edge Function URL
const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-auth`;

// Get client IP and user agent
function getClientInfo() {
  return {
    userAgent: navigator.userAgent,
    // IP will be detected server-side from request headers
  };
}

export const adminAuth = {
  // Authenticate admin user with pattern - calls Edge Function
  async loginWithPattern(phone: string, pattern: number[], rememberMe: boolean = false): Promise<{ success: boolean; error?: string }> {
    try {
      const clientInfo = getClientInfo();

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
          userAgent: clientInfo.userAgent
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return { success: false, error: data.error || 'Authentication failed' };
      }

      // Store session token securely
      const session: AdminSession = {
        sessionToken: data.sessionToken,
        phone: data.phone,
        expiresAt: data.expiresAt
      };

      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));

      return { success: true };
    } catch (error) {
      console.error('Admin login error:', error);
      return { success: false, error: 'Network error. Please try again.' };
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
        this.logout();
        return false;
      }

      // Verify with server
      const clientInfo = getClientInfo();
      const response = await fetch(`${EDGE_FUNCTION_URL}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          sessionToken: session.sessionToken,
          userAgent: clientInfo.userAgent
        })
      });

      const data = await response.json();

      if (!response.ok || !data.valid) {
        this.logout();
        return false;
      }

      // Update session expiry
      session.expiresAt = data.expiresAt;
      const storage = localStorage.getItem(ADMIN_SESSION_KEY) ? localStorage : sessionStorage;
      storage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));

      return true;
    } catch (error) {
      console.error('Session validation error:', error);
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
