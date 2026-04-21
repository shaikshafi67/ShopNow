import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RequireAuth({ children, role }) {
  const { isAuthenticated, isAdmin, user } = useAuth();
  const location = useLocation();

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
