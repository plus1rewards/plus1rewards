// plus1-rewards/src/components/ProtectedAdminRoute.tsx
import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { adminAuth } from '../lib/adminAuth';
import { securityMonitor } from '../lib/securityMonitor';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

export default function ProtectedAdminRoute({ children }: ProtectedAdminRouteProps) {
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Initialize security monitoring
    securityMonitor.init();

    const checkAuth = async () => {
      // Quick sync check first
      if (!adminAuth.isAuthenticatedSync()) {
        setIsAuthenticated(false);
        setIsChecking(false);
        return;
      }

      // Verify with server
      const authenticated = await adminAuth.isAuthenticated();
      setIsAuthenticated(authenticated);
      setIsChecking(false);
    };

    checkAuth();

    // Set up periodic verification
    const interval = setInterval(async () => {
      if (adminAuth.isAuthenticatedSync()) {
        const authenticated = await adminAuth.isAuthenticated();
        if (!authenticated && isAuthenticated) {
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
    }, 60000); // Check every minute

    return () => {
      clearInterval(interval);
      securityMonitor.stop();
    };
  }, [isAuthenticated]);

  // Show loading state while checking
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a568b] mx-auto mb-4"></div>
          <p className="text-[#1a568b] font-medium">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Render protected content
  return <>{children}</>;
}
