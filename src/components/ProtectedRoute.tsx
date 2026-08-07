import { Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useLocation } from 'react-router-dom';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { state } = useApp();
  const location = useLocation();

  if (!state.isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}