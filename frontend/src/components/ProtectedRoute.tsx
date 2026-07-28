import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, loadProfile, accessToken } = useAuthStore();

  useEffect(() => {
    // If we have an access token but no user, try to load profile
    if (accessToken && !isAuthenticated) {
      loadProfile();
    }
  }, [accessToken, isAuthenticated, loadProfile]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#09090b] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
          <p className="text-zinc-500 text-sm font-semibold tracking-wider animate-pulse">
            AUTHENTICATING SESSION...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !accessToken) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
