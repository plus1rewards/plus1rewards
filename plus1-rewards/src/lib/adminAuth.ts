// plus1-rewards/src/lib/adminAuth.ts
// Secure admin authentication without Supabase

interface AdminSession {
  phone: string;
  authenticated: boolean;
  timestamp: number;
  expiresAt: number;
}

// Hardcoded admin credentials (in production, use environment variables)
const ADMIN_PHONE = '0714329190';
const ADMIN_PASSWORD = 'Plus1Admin@2026!Secure';

// Session duration: 2 hours
const SESSION_DURATION = 2 * 60 * 60 * 1000;

// Storage keys
const ADMIN_SESSION_KEY = 'plus1_admin_session';
const ADMIN_SESSION_ENCRYPTED = 'plus1_admin_auth';

// Simple encryption for session storage (basic obfuscation)
function encryptSession(data: string): string {
  return btoa(encodeURIComponent(data));
}

function decryptSession(encrypted: string): string | null {
  try {
    return decodeURIComponent(atob(encrypted));
  } catch {
    return null;
  }
}

// Hash password (simple hash for client-side, in production use proper backend auth)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'plus1_salt_key');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const adminAuth = {
  // Authenticate admin user
  async login(phone: string, password: string, rememberMe: boolean = false): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate credentials
      if (phone !== ADMIN_PHONE) {
        return { success: false, error: 'Invalid credentials' };
      }

      if (password !== ADMIN_PASSWORD) {
        return { success: false, error: 'Invalid credentials' };
      }

      // Create session
      const session: AdminSession = {
        phone,
        authenticated: true,
        timestamp: Date.now(),
        expiresAt: Date.now() + SESSION_DURATION
      };

      // Store session
      const sessionData = JSON.stringify(session);
      const encrypted = encryptSession(sessionData);
      
      if (rememberMe) {
        localStorage.setItem(ADMIN_SESSION_KEY, encrypted);
        localStorage.setItem(ADMIN_SESSION_ENCRYPTED, await hashPassword(phone + password));
      } else {
        sessionStorage.setItem(ADMIN_SESSION_KEY, encrypted);
        sessionStorage.setItem(ADMIN_SESSION_ENCRYPTED, await hashPassword(phone + password));
      }

      return { success: true };
    } catch (error) {
      console.error('Admin login error:', error);
      return { success: false, error: 'Authentication failed' };
    }
  },

  // Check if admin is authenticated
  isAuthenticated(): boolean {
    try {
      const encrypted = localStorage.getItem(ADMIN_SESSION_KEY) || sessionStorage.getItem(ADMIN_SESSION_KEY);
      
      if (!encrypted) {
        return false;
      }

      const decrypted = decryptSession(encrypted);
      if (!decrypted) {
        return false;
      }

      const session: AdminSession = JSON.parse(decrypted);

      // Check if session is expired
      if (Date.now() > session.expiresAt) {
        this.logout();
        return false;
      }

      // Check if session is valid
      if (!session.authenticated || session.phone !== ADMIN_PHONE) {
        this.logout();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Session validation error:', error);
      this.logout();
      return false;
    }
  },

  // Get current admin session
  getSession(): AdminSession | null {
    try {
      const encrypted = localStorage.getItem(ADMIN_SESSION_KEY) || sessionStorage.getItem(ADMIN_SESSION_KEY);
      
      if (!encrypted) {
        return null;
      }

      const decrypted = decryptSession(encrypted);
      if (!decrypted) {
        return null;
      }

      const session: AdminSession = JSON.parse(decrypted);

      // Validate session
      if (Date.now() > session.expiresAt || !session.authenticated) {
        this.logout();
        return null;
      }

      return session;
    } catch (error) {
      console.error('Get session error:', error);
      return null;
    }
  },

  // Logout admin
  logout(): void {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    localStorage.removeItem(ADMIN_SESSION_ENCRYPTED);
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    sessionStorage.removeItem(ADMIN_SESSION_ENCRYPTED);
  },

  // Extend session (refresh expiration)
  extendSession(): boolean {
    try {
      const session = this.getSession();
      if (!session) {
        return false;
      }

      // Extend expiration
      session.expiresAt = Date.now() + SESSION_DURATION;

      const sessionData = JSON.stringify(session);
      const encrypted = encryptSession(sessionData);

      // Update storage (check which storage was used)
      if (localStorage.getItem(ADMIN_SESSION_KEY)) {
        localStorage.setItem(ADMIN_SESSION_KEY, encrypted);
      } else {
        sessionStorage.setItem(ADMIN_SESSION_KEY, encrypted);
      }

      return true;
    } catch (error) {
      console.error('Extend session error:', error);
      return false;
    }
  },

  // Get time until session expires (in milliseconds)
  getTimeUntilExpiry(): number {
    const session = this.getSession();
    if (!session) {
      return 0;
    }
    return Math.max(0, session.expiresAt - Date.now());
  }
};

// Auto-extend session on activity
let activityTimer: NodeJS.Timeout | null = null;

export function setupAdminActivityMonitor() {
  const extendOnActivity = () => {
    if (adminAuth.isAuthenticated()) {
      adminAuth.extendSession();
    }
  };

  // Clear existing timer
  if (activityTimer) {
    clearTimeout(activityTimer);
  }

  // Extend session on user activity
  const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
  
  const throttledExtend = () => {
    if (activityTimer) return;
    
    activityTimer = setTimeout(() => {
      extendOnActivity();
      activityTimer = null;
    }, 60000); // Extend every minute of activity
  };

  events.forEach(event => {
    window.addEventListener(event, throttledExtend, { passive: true });
  });
}
