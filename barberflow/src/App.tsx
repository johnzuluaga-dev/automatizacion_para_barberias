import { lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { domAnimation, LazyMotion, MotionConfig } from 'motion/react';
import { ToastProvider } from '@/components/ui/toast/ToastProvider';
import { isAuthenticated } from '@/lib/auth';

const BookingForm = lazy(() => import('./BookingForm'));
const Login = lazy(() => import('./components/Login'));
const CancelAppointment = lazy(() => import('./components/CancelAppointment'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));

function ProtectedRoute({ children }: { children: ReactNode }) {
  return isAuthenticated() ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domAnimation}>
        <ToastProvider>
          <BrowserRouter>
            <Suspense fallback={null}>
              <Routes>
                <Route path="/" element={<BookingForm />} />
                <Route path="/login" element={<Login />} />
                <Route path="/cancel" element={<CancelAppointment />} />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ToastProvider>
      </LazyMotion>
    </MotionConfig>
  );
}
