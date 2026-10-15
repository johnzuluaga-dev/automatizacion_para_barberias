import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import {
  LayoutDashboard,
  Calendar as CalendarIcon,
  Scissors,
  TrendingUp,
  CheckCircle,
  XCircle,
  FileText,
  LogOut,
  Sparkles,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { getAppointments, updateAppointmentStatus, type Appointment } from '../lib/supabase';

const MOCK_REPORTS = [
  { id: '1', week: new Date().toISOString().split('T')[0], summary: 'Análisis de negocio: El flujo de citas muestra una tendencia positiva. La mayoría de los clientes prefieren el horario de la mañana. Se sugiere reforzar el inventario de productos para barba.' },
];

export default function AdminDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [reports, setReports] = useState(MOCK_REPORTS);
  const [activeTab, setActiveTab] = useState<'agenda' | 'reports'>('agenda');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAppointments();
      setAppointments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar citas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- legado, se reemplaza en la fase 4
    fetchAppointments();
  }, []);

  const stats = {
    total: appointments.length,
    revenue: appointments
      .filter(a => a.status === 'completed' || a.status === 'confirmed')
      .length * 20,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
    completed: appointments.filter(a => a.status === 'completed').length,
  };

  const handleUpdateStatus = async (id: string, newStatus: Appointment['status']) => {
    setUpdatingId(id);
    try {
      await updateAppointmentStatus(id, newStatus);
      setAppointments(prev =>
        prev.map(a => a.id === id ? { ...a, status: newStatus } : a)
      );
    } catch {
      alert('Error al actualizar el estado. Intenta de nuevo.');
    } finally {
      setUpdatingId(null);
    }
  };

  const simulateGenerateReport = () => {
    setIsGeneratingReport(true);
    setTimeout(() => {
      const confirmed = appointments.filter(a => a.status === 'confirmed').length;
      const cancelled = appointments.filter(a => a.status === 'cancelled').length;
      const completed = appointments.filter(a => a.status === 'completed').length;
      const newReport = {
        id: Date.now().toString(),
        week: new Date().toISOString().split('T')[0],
        summary: `Reporte generado automáticamente:\n\n✅ Citas confirmadas: ${confirmed}\n✔️ Completadas: ${completed}\n❌ Canceladas: ${cancelled}\n💰 Ingresos estimados: $${stats.revenue}\n\nEl negocio mantiene una operación estable. Se recomienda hacer seguimiento a los clientes con citas pendientes.`
      };
      setReports([newReport, ...reports]);
      setIsGeneratingReport(false);
      setActiveTab('reports');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-dark flex text-bone">
      {/* Sidebar */}
      <aside className="w-72 border-r border-white/5 p-8 hidden lg:flex flex-col">
        <div className="flex items-center gap-4 mb-12">
          <div className="w-12 h-12 rounded-2xl gold-gradient flex items-center justify-center shadow-lg shadow-gold/20">
            <Scissors className="text-dark w-7 h-6" />
          </div>
          <h2 className="text-3xl font-serif text-gold tracking-tighter">BarberFlow</h2>
        </div>

        <nav className="space-y-3 flex-1">
          <button
            onClick={() => setActiveTab('agenda')}
            className={cn(
              "w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300",
              activeTab === 'agenda' ? "bg-gold text-dark font-bold shadow-xl shadow-gold/10" : "text-bone/40 hover:bg-white/5 hover:text-white"
            )}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={cn(
              "w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300",
              activeTab === 'reports' ? "bg-gold text-dark font-bold shadow-xl shadow-gold/10" : "text-bone/40 hover:bg-white/5 hover:text-white"
            )}
          >
            <FileText className="w-5 h-5" />
            <span>Reportes IA</span>
          </button>
        </nav>

        <button
  onClick={() => {
    sessionStorage.removeItem('barberflow_auth');
    window.location.href = '/login';
  }}
  className="flex items-center gap-4 px-5 py-4 text-bone/30 hover:text-red-400 transition-colors mt-auto"
>
  <LogOut className="w-5 h-5" />
  <span>Salir</span>
</button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-12 overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-5xl font-serif text-gold mb-2">
              {activeTab === 'agenda' ? 'Gestión de Citas' : 'Análisis de Negocio'}
            </h1>
            <p className="text-bone/40 tracking-widest uppercase text-xs">Panel Administrativo</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchAppointments}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-bone/50 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              <span className="font-bold text-sm">Actualizar</span>
            </button>
            <button
              onClick={simulateGenerateReport}
              disabled={isGeneratingReport}
              className="group relative flex items-center gap-3 px-8 py-4 rounded-2xl bg-gold/5 border border-gold/20 text-gold hover:bg-gold/10 transition-all disabled:opacity-50 overflow-hidden"
            >
              <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              <span className="font-bold">{isGeneratingReport ? 'Analizando...' : 'Generar Reporte IA'}</span>
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
          <StatCard icon={<CalendarIcon className="text-blue-400" />} label="Citas Totales" value={stats.total} />
          <StatCard icon={<TrendingUp className="text-green-400" />} label="Ingresos Est." value={`$${stats.revenue}`} />
          <StatCard icon={<XCircle className="text-red-400" />} label="Canceladas" value={stats.cancelled} />
          <StatCard icon={<CheckCircle className="text-gold" />} label="Completadas" value={stats.completed} />
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'agenda' ? (
            <motion.div
              key="agenda"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="glass-card rounded-3xl overflow-hidden border-white/5 shadow-2xl"
            >
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
                <h3 className="text-2xl font-serif text-gold">Agenda en Tiempo Real</h3>
                {loading && <Loader2 className="w-5 h-5 text-gold animate-spin" />}
              </div>

              {error && (
                <div className="p-8 text-red-400 text-sm flex items-center gap-3">
                  <XCircle className="w-5 h-5" />
                  {error}
                </div>
              )}

              {!loading && appointments.length === 0 && !error && (
                <div className="p-16 text-center text-bone/30">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>No hay citas registradas todavía.</p>
                </div>
              )}

              {appointments.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-bone/30 text-xs uppercase tracking-[0.2em] border-b border-white/5">
                        <th className="px-8 py-6 font-medium">Cliente</th>
                        <th className="px-8 py-6 font-medium">Servicio</th>
                        <th className="px-8 py-6 font-medium">Barbero</th>
                        <th className="px-8 py-6 font-medium">Fecha / Hora</th>
                        <th className="px-8 py-6 font-medium">Estado</th>
                        <th className="px-8 py-6 font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {appointments.map((apt) => (
                        <tr key={apt.id} className="group hover:bg-white/5 transition-colors">
                          <td className="px-8 py-6">
                            <div className="font-bold text-bone group-hover:text-gold transition-colors">{apt.client_name}</div>
                            <div className="text-xs text-bone/30">{apt.client_phone}</div>
                          </td>
                          <td className="px-8 py-6 text-bone/60">{apt.service}</td>
                          <td className="px-8 py-6 text-bone/60">{apt.barber}</td>
                          <td className="px-8 py-6 text-bone/60">
                            <div className="font-medium">
                              {format(new Date(apt.appointment_date + 'T00:00:00'), "d 'de' MMM", { locale: es })}
                            </div>
                            <div className="text-xs text-gold/50">{apt.appointment_time}</div>
                          </td>
                          <td className="px-8 py-6">
                            <StatusBadge status={apt.status} />
                          </td>
                          <td className="px-8 py-6">
                            {updatingId === apt.id ? (
                              <Loader2 className="w-5 h-5 text-gold animate-spin" />
                            ) : (
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {apt.status === 'pending' && (
                                  <button
                                    onClick={() => handleUpdateStatus(apt.id, 'confirmed')}
                                    className="p-2 rounded-xl bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
                                    title="Confirmar"
                                  >
                                    <CheckCircle className="w-5 h-5" />
                                  </button>
                                )}
                                {apt.status !== 'completed' && apt.status !== 'cancelled' && (
                                  <button
                                    onClick={() => handleUpdateStatus(apt.id, 'completed')}
                                    className="p-2 rounded-xl bg-gold/10 text-gold hover:bg-gold/20"
                                    title="Completar"
                                  >
                                    <CheckCircle className="w-5 h-5" />
                                  </button>
                                )}
                                {apt.status !== 'cancelled' && (
                                  <button
                                    onClick={() => handleUpdateStatus(apt.id, 'cancelled')}
                                    className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20"
                                    title="Cancelar"
                                  >
                                    <XCircle className="w-5 h-5" />
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="reports"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {reports.map((report) => (
                <div key={report.id} className="glass-card p-8 rounded-3xl border-gold/10 bg-gold/5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Sparkles className="w-24 h-24 text-gold" />
                  </div>
                  <div className="flex items-center gap-3 mb-6 text-gold">
                    <FileText className="w-6 h-6" />
                    <h3 className="text-2xl font-serif">
                      Reporte — {format(new Date(report.week + 'T00:00:00'), "d 'de' MMMM yyyy", { locale: es })}
                    </h3>
                  </div>
                  <div className="prose prose-invert max-w-none text-bone/80 leading-relaxed whitespace-pre-line">
                    {report.summary}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="glass-card p-8 rounded-3xl border-white/5 hover:border-gold/20 transition-all group">
      <div className="flex items-center gap-6">
        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <div>
          <p className="text-bone/30 text-xs uppercase tracking-widest mb-1">{label}</p>
          <h4 className="text-3xl font-bold text-bone">{value}</h4>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending:   "bg-yellow-500/5 text-yellow-500 border-yellow-500/10",
    confirmed: "bg-blue-500/5 text-blue-500 border-blue-500/10",
    completed: "bg-green-500/5 text-green-500 border-green-500/10",
    cancelled: "bg-red-500/5 text-red-500 border-red-500/10",
  };
  const labels: Record<string, string> = {
    pending:   "Pendiente",
    confirmed: "Confirmada",
    completed: "Completada",
    cancelled: "Cancelada",
  };
  return (
    <span className={cn("px-4 py-1.5 rounded-full text-[10px] uppercase font-bold tracking-widest border", styles[status])}>
      {labels[status] ?? status}
    </span>
  );
}
