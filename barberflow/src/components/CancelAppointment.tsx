import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { motion } from 'motion/react';
import { XCircle, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function CancelAppointment() {
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get('id');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleCancel = async () => {
    if (!appointmentId) return;
    
    setStatus('loading');
    
    // Simulación de cancelación
    setTimeout(() => {
      setStatus('success');
      setMessage('Tu cita ha sido cancelada exitosamente (Simulación)');
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-dark text-bone">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-10 rounded-3xl text-center max-w-md w-full border-white/5 shadow-2xl"
      >
        {status === 'idle' && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h2 className="text-3xl font-serif mb-4 text-gold">Cancelar Cita</h2>
            <p className="text-bone/60 mb-8">
              ¿Estás seguro de que deseas cancelar tu cita en BarberFlow? Esta acción no se puede deshacer.
            </p>
            <div className="space-y-3">
              <button 
                onClick={handleCancel}
                className="w-full py-4 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
              >
                Confirmar Cancelación
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                className="w-full py-4 rounded-xl bg-white/5 text-bone/50 font-bold hover:bg-white/10 transition-colors"
              >
                Mantener Cita
              </button>
            </div>
          </>
        )}

        {status === 'loading' && (
          <div className="py-10">
            <Loader2 className="w-12 h-12 text-gold animate-spin mx-auto mb-4" />
            <p className="text-gold font-bold">Procesando cancelación...</p>
          </div>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-6" />
            <h2 className="text-3xl font-serif mb-4 text-gold">¡Cancelado!</h2>
            <p className="text-bone/60 mb-8">{message}</p>
            <button 
              onClick={() => window.location.href = '/'}
              className="w-full py-4 rounded-xl gold-gradient text-dark font-bold hover:opacity-90 transition-all"
            >
              Volver al Inicio
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h2 className="text-3xl font-serif mb-4 text-gold">Error</h2>
            <p className="text-bone/60 mb-8">{message}</p>
            <button 
              onClick={() => setStatus('idle')}
              className="w-full py-4 rounded-xl bg-white/5 text-bone/50 font-bold hover:bg-white/10 transition-colors"
            >
              Reintentar
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
