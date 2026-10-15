import type { AppointmentStats } from './status';

export interface Report {
  id: string;
  week: string;
  summary: string;
  /** Métricas del momento en que se generó (los reportes de ejemplo no las tienen). */
  stats?: Pick<AppointmentStats, 'confirmed' | 'completed' | 'cancelled' | 'revenue'>;
}

const today = () => new Date().toISOString().split('T')[0] ?? '';

export const MOCK_REPORTS: Report[] = [
  {
    id: '1',
    week: today(),
    summary:
      'Análisis de negocio: El flujo de citas muestra una tendencia positiva. La mayoría de los clientes prefieren el horario de la mañana. Se sugiere reforzar el inventario de productos para barba.',
  },
];

/** Reporte simulado (igual que la versión anterior: 2 s de "análisis"). */
export function generateReport(stats: AppointmentStats): Promise<Report> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: Date.now().toString(),
        week: today(),
        stats: {
          confirmed: stats.confirmed,
          completed: stats.completed,
          cancelled: stats.cancelled,
          revenue: stats.revenue,
        },
        summary:
          'El negocio mantiene una operación estable. Se recomienda hacer seguimiento a los clientes con citas pendientes.',
      });
    }, 2000);
  });
}
