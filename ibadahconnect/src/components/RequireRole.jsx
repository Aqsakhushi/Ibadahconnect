import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { clearAuth, getCurrentUser, getToken, isTokenExpired } from '../utils/auth';

const roleHome = (role) => {
  const normalized = String(role || '').toLowerCase();
  if (normalized === 'admin') return '/admin';
  if (normalized === 'performer') return '/performer-dashboard';
  return '/dashboard';
};

export function AuthSessionGuard() {
  const location = useLocation();

  useEffect(() => {
    const token = getToken();
    if (!token || !isTokenExpired(token)) return;

    if (location.pathname !== '/login' && location.pathname !== '/register') {
      sessionStorage.setItem(
        'postLoginRedirect',
        `${location.pathname}${location.search}${location.hash}`
      );
      sessionStorage.setItem('authExpiredMessage', 'true');
    }
    clearAuth();
  }, [location.hash, location.pathname, location.search]);

  return null;
}

export default function RequireRole({ roles, children }) {
  const location = useLocation();
  const token = getToken();
  const user = getCurrentUser();

  if (!token || isTokenExpired(token) || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles?.length && !roles.some((role) => role.toLowerCase() === String(user.role || '').toLowerCase())) {
    return <Navigate to={roleHome(user.role)} replace />;
  }

  return children;
}
