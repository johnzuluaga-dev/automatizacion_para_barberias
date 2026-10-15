import { lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { LazyMotion, MotionConfig } from 'motion/react';
import { PageFallback } from '@/components/layout/PageFallback';
import { RouteErrorBoundary } from '@/components/layout/RouteErrorBoundary';
import { ToastProvider } from '@/components/ui/toast/ToastProvider';
import { isAuthenticated } from '@/lib/auth';

const BookingPage = lazy(() => import('./pages/BookingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const CancelPage = lazy(() => import('./pages/CancelPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const loadMotionFeatures = () => import('@/lib/motion-features').then((mod) => mod.default);

function ProtectedRoute({ children }: { children: ReactNode }) {
  return isAuthenticated() ? <>{children}</> : <Navigate to="/login" replace />;
}

export function AppRoutes() {
  return (
    <RouteErrorBoundary>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<BookingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/cancel" element={<CancelPage />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </RouteErrorBoundary>
  );
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={loadMotionFeatures} strict>
        <ToastProvider>{children}</ToastProvider>
      </LazyMotion>
    </MotionConfig>
  );
}

export default function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProviders>
  );
}
