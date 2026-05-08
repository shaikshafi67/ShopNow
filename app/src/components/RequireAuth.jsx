import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RequireAuth({ children, role }) {
  const { isAuthenticated, isAdmin, user, loading } = useAuth();
  const location = useLocation();

  // Wait for Firebase to restore session before deciding to redirect
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'var(--bg-primary)',
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          border: '3px solid var(--border-glass)',
          borderTopColor: 'var(--accent)',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  if (role === 'admin' && !isAdmin) {
    return <Navigate to="/" replace />;
  }
  if (role && role !== 'admin' && user?.role !== role) {
    return <Navigate to="/" replace />;
  }
  return children;
}
