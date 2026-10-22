import { lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';
import { LazyMotion, MotionConfig } from 'motion/react';
import { PageFallback } from '@/components/layout/PageFallback';
import { RouteErrorBoundary } from '@/components/layout/RouteErrorBoundary';
import { ToastProvider } from '@/components/ui/toast/ToastProvider';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { RequireAuth } from '@/features/auth/RequireAuth';

const BookingPage = lazy(() => import('./pages/BookingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const VerifyPage = lazy(() => import('./pages/VerifyPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const MyAppointmentsPage = lazy(() => import('./pages/MyAppointmentsPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const CancelPage = lazy(() => import('./pages/CancelPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const loadMotionFeatures = () => import('@/lib/motion-features').then((mod) => mod.default);

export function AppRoutes() {
  return (
    <RouteErrorBoundary>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<BookingPage />} />
          <Route path="/ingresar" element={<LoginPage />} />
          {/* Ruta anterior del login, se conserva para enlaces existentes. */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegisterPage />} />
          <Route path="/verificar" element={<VerifyPage />} />
          <Route path="/olvide-contrasena" element={<ForgotPasswordPage />} />
          <Route path="/terminos" element={<TermsPage />} />
          <Route path="/cancel" element={<CancelPage />} />
          <Route
            path="/mis-citas"
            element={
              <RequireAuth>
                <MyAppointmentsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireAuth role="admin">
                <AdminPage />
              </RequireAuth>
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
        <ToastProvider>
          <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
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
