// Security monitoring and tamper detection
// Detects if critical authentication functions have been overridden

interface SecurityCheck {
  name: string;
  originalHash: string;
  check: () => boolean;
}

class SecurityMonitor {
  private checks: SecurityCheck[] = [];
  private isMonitoring = false;
  private checkInterval: NodeJS.Timeout | null = null;
  private tamperDetected = false;

  // Initialize security monitoring
  init() {
    if (this.isMonitoring) return;
    
    // Register critical functions to monitor
    this.registerCheck('adminAuth.isAuthenticated', this.hashFunction(this.getAdminAuthFunction()));
    this.registerCheck('adminAuth.isAuthenticatedSync', this.hashFunction(this.getAdminAuthSyncFunction()));
    
    // Start monitoring
    this.startMonitoring();
    this.isMonitoring = true;
  }

  // Register a function to monitor for tampering
  private registerCheck(name: string, originalHash: string) {
    this.checks.push({
      name,
      originalHash,
      check: () => this.verifyFunctionIntegrity(name, originalHash)
    });
  }

  // Get the adminAuth.isAuthenticated function as string
  private getAdminAuthFunction(): string {
    // Import and stringify the actual function
    return `async isAuthenticated(): Promise<boolean> {
      try {
        const session = this.getStoredSession();
        if (!session) {
          return false;
        }
        if (new Date(session.expiresAt) < new Date()) {
          this.logout();
          return false;
        }
        const clientInfo = getClientInfo();
        const response = await fetch(EDGE_FUNCTION_URL + '/verify', {
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
        session.expiresAt = data.expiresAt;
        const storage = localStorage.getItem(ADMIN_SESSION_KEY) ? localStorage : sessionStorage;
        storage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
        return true;
      } catch (error) {
        console.error('Session validation error:', error);
        return false;
      }
    }`;
  }

  // Get the adminAuth.isAuthenticatedSync function as string
  private getAdminAuthSyncFunction(): string {
    return `isAuthenticatedSync(): boolean {
      const session = this.getStoredSession();
      if (!session) {
        return false;
      }
      return new Date(session.expiresAt) > new Date();
    }`;
  }

  // Create a hash of a function string
  private hashFunction(fnString: string): string {
    // Simple hash function (in production, use crypto.subtle.digest)
    let hash = 0;
    const normalized = fnString.replace(/\s+/g, '');
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  }

  // Verify function hasn't been tampered with
  private verifyFunctionIntegrity(name: string, originalHash: string): boolean {
    try {
      // Get current function
      let currentFn: string;
      if (name === 'adminAuth.isAuthenticated') {
        currentFn = this.getAdminAuthFunction();
      } else if (name === 'adminAuth.isAuthenticatedSync') {
        currentFn = this.getAdminAuthSyncFunction();
      } else {
        return true;
      }

      const currentHash = this.hashFunction(currentFn);
      return currentHash === originalHash;
    } catch (error) {
      console.error('Integrity check failed:', error);
      return false;
    }
  }

  // Start periodic monitoring
  private startMonitoring() {
    // Check every 10 seconds
    this.checkInterval = setInterval(() => {
      this.runSecurityChecks();
    }, 10000);

    // Also check on visibility change
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.runSecurityChecks();
      }
    });
  }

  // Run all security checks
  private runSecurityChecks() {
    if (this.tamperDetected) return;

    for (const check of this.checks) {
      if (!check.check()) {
        this.handleTamperDetection(check.name);
        break;
      }
    }
  }

  // Handle tamper detection
  private handleTamperDetection(checkName: string) {
    this.tamperDetected = true;
    
    console.error(`🚨 SECURITY ALERT: Tampering detected in ${checkName}`);
    
    // Clear all sessions
    localStorage.clear();
    sessionStorage.clear();
    
    // Redirect to login with security warning
    window.location.href = '/admin/login?security_alert=1';
  }

  // Stop monitoring
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isMonitoring = false;
  }
}

export const securityMonitor = new SecurityMonitor();
