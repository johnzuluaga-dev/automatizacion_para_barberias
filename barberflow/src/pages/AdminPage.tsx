import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { AnimatePresence, m } from 'motion/react';
import { FileText, LayoutDashboard, LogOut, RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { AppointmentList } from '@/features/admin/AppointmentList';
import { generateReport, MOCK_REPORTS, type Report } from '@/features/admin/reports';
import { ReportsPanel } from '@/features/admin/ReportsPanel';
import { computeStats } from '@/features/admin/status';
import { StatsGrid } from '@/features/admin/StatsGrid';
import { useAppointments } from '@/features/admin/useAppointments';
import { logout } from '@/lib/auth';
import { cn } from '@/lib/utils';

type Tab = 'agenda' | 'reports';

const TABS: { value: Tab; label: string; Icon: typeof FileText }[] = [
  { value: 'agenda', label: 'Dashboard', Icon: LayoutDashboard },
  { value: 'reports', label: 'Reportes IA', Icon: FileText },
];

export default function AdminPage() {
  const navigate = useNavigate();
  const { appointments, loading, error, updatingId, refresh, updateStatus } = useAppointments();
  const [activeTab, setActiveTab] = useState<Tab>('agenda');
  const [reports, setReports] = useState<Report[]>(MOCK_REPORTS);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const stats = computeStats(appointments);

  async function handleGenerateReport() {
    setIsGeneratingReport(true);
    setActiveTab('reports');
    const report = await generateReport(stats);
    setReports((prev) => [report, ...prev]);
    setIsGeneratingReport(false);
  }

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  const tabButton = (tab: (typeof TABS)[number], layout: 'side' | 'top') => {
    const active = activeTab === tab.value;
    return (
      <button
        key={tab.value}
        type="button"
        onClick={() => setActiveTab(tab.value)}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'flex items-center gap-3 rounded-md text-sm font-medium transition-colors duration-150',
          layout === 'side' ? 'h-10 w-full px-3' : 'h-9 flex-1 justify-center px-3',
          active ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:bg-surface-2 hover:text-ink',
        )}
      >
        <tab.Icon aria-hidden className={cn('size-4.5', active && 'text-accent')} />
        {tab.label}
      </button>
    );
  };

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15rem_1fr]">
      {/* Barra lateral (escritorio) */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-surface-2/40 p-4 lg:flex">
        <Link to="/" aria-label="BarberFlow, ir a reservas" className="rounded-md px-2 py-2">
          <Logo />
        </Link>
        <nav aria-label="Secciones del panel" className="mt-8 flex flex-col gap-1">
          {TABS.map((t) => tabButton(t, 'side'))}
        </nav>
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-4">
          <Button variant="ghost" size="sm" icon={<LogOut aria-hidden className="size-4" />} onClick={handleLogout}>
            Salir
          </Button>
          <ThemeToggle />
        </div>
      </aside>

      <div className="min-w-0">
        {/* Barra superior (móvil) */}
        <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur-sm lg:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <Logo />
            <div className="flex items-center">
              <ThemeToggle />
              <Button variant="ghost" size="sm" icon={<LogOut aria-hidden className="size-4" />} onClick={handleLogout}>
                Salir
              </Button>
            </div>
          </div>
          <nav aria-label="Secciones del panel" className="flex gap-1 px-4 pb-3">
            <div className="flex w-full gap-1 rounded-lg bg-surface-2 p-1">{TABS.map((t) => tabButton(t, 'top'))}</div>
          </nav>
        </header>

        <main id="contenido" className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm text-muted">Panel Administrativo</p>
              <h1 className="mt-1 text-3xl font-bold sm:text-4xl">
                {activeTab === 'agenda' ? 'Gestión de Citas' : 'Análisis de Negocio'}
              </h1>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={refresh}
                disabled={loading}
                icon={<RefreshCw aria-hidden className={cn('size-4', loading && 'animate-spin')} />}
              >
                Actualizar
              </Button>
              <Button
                onClick={handleGenerateReport}
                loading={isGeneratingReport}
                loadingText="Analizando..."
                icon={<Sparkles aria-hidden className="size-4" />}
              >
                Generar Reporte IA
              </Button>
            </div>
          </div>

          <StatsGrid
            stats={stats}
            loading={loading && appointments.length === 0}
            unavailable={Boolean(error) && appointments.length === 0}
          />

          <AnimatePresence mode="wait" initial={false}>
            <m.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
            >
              {activeTab === 'agenda' ? (
                <AppointmentList
                  appointments={appointments}
                  loading={loading}
                  error={error}
                  updatingId={updatingId}
                  onRetry={refresh}
                  onUpdateStatus={updateStatus}
                />
              ) : (
                <ReportsPanel reports={reports} generating={isGeneratingReport} />
              )}
            </m.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
