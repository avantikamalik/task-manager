import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/auth-context';
import { PageLoader } from '@/components/ui/spinner';
import { AppShell } from '@/components/layout/app-shell';

import { LoginPage, SignupPage } from '@/pages/auth-pages';
import { DashboardPage } from '@/pages/dashboard-page';
import { ProjectsPage } from '@/pages/projects-page';
import { ProjectDetailPage } from '@/pages/project-detail-page';
import { NotFoundPage } from '@/pages/not-found-page';

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return <AppShell>{children}</AppShell>;
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (user) return <Navigate to="/" replace />;
  return children;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
      <Route path="/signup" element={<PublicOnly><SignupPage /></PublicOnly>} />

      <Route path="/" element={<RequireAuth><DashboardPage /></RequireAuth>} />
      <Route path="/projects" element={<RequireAuth><ProjectsPage /></RequireAuth>} />
      <Route path="/projects/:id" element={<RequireAuth><ProjectDetailPage /></RequireAuth>} />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
