import React, { useState } from 'react';
import { Calendar, Clock, User, Scissors, Phone, CheckCircle2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { sendBookingToN8n } from './lib/n8n';

const BARBEROS = ['Carlos The Blade', 'Andrés Estilo', 'Juan Classic'];
const SERVICIOS = [
  { name: 'Corte Clásico', price: 15 },
  { name: 'Corte + Barba', price: 25 },
  { name: 'Perfilado de Barba', price: 10 },
  { name: 'Tratamiento Facial', price: 30 }
];

export default function BookingForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    client_name: '',
    client_phone: '',
    service: '',
    barber: '',
    appointment_date: '',
    appointment_time: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const selectedService = SERVICIOS.find(s => s.name === formData.service);
      const price = selectedService?.price || 0;
      await sendBookingToN8n({ ...formData, price });
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error 
          ? err.message 
          : 'Error al agendar la cita. Intenta nuevamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-dark">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-8 rounded-2xl text-center max-w-md w-full border-gold/30"
        >
          <CheckCircle2 className="w-16 h-16 text-gold mx-auto mb-4" />
          <h2 className="text-3xl font-serif mb-2 text-gold">¡Cita Confirmada!</h2>
          <p className="text-bone/70 mb-6">
            Tu cita ha sido registrada. Recibirás un mensaje de WhatsApp con los detalles en breve.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-3 rounded-xl gold-gradient text-dark font-bold hover:opacity-90 transition-opacity"
          >
            Agendar otra cita
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[url('https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center">
      <div className="absolute inset-0 bg-dark/85 backdrop-blur-sm"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-lg"
      >
        <div className="text-center mb-8">
          <h1 className="text-6xl font-serif text-gold mb-2 tracking-tighter">BarberFlow</h1>
          <p className="text-bone/60 italic tracking-widest uppercase text-xs">Estilo & Automatización</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-8 rounded-3xl space-y-6 border-white/5 shadow-2xl">
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl flex items-center gap-3 text-sm"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gold/50" />
              <input
                required
                type="text"
                placeholder="Nombre completo"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-gold transition-colors text-bone placeholder:text-bone/30"
                value={formData.client_name}
                onChange={e => setFormData({...formData, client_name: e.target.value})}
              />
            </div>

            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gold/50" />
              <input
                required
                type="tel"
                placeholder="Teléfono (WhatsApp)"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-gold transition-colors text-bone placeholder:text-bone/30"
                value={formData.client_phone}
                onChange={e => setFormData({...formData, client_phone: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative">
                <Scissors className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gold/50" />
                <select
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-gold transition-colors appearance-none text-bone"
                  value={formData.service}
                  onChange={e => setFormData({...formData, service: e.target.value})}
                >
                  <option value="" disabled className="bg-dark">Servicio</option>
                  {SERVICIOS.map(s => (
                    <option key={s.name} value={s.name} className="bg-dark">{s.name} - ${s.price}</option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gold/50" />
                <select
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-gold transition-colors appearance-none text-bone"
                  value={formData.barber}
                  onChange={e => setFormData({...formData, barber: e.target.value})}
                >
                  <option value="" disabled className="bg-dark">Barbero</option>
                  {BARBEROS.map(b => (
                    <option key={b} value={b} className="bg-dark">{b}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gold/50" />
                <input
                  required
                  type="date"
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-gold transition-colors text-bone"
                  value={formData.appointment_date}
                  onChange={e => setFormData({...formData, appointment_date: e.target.value})}
                />
              </div>

              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gold/50" />
                <input
                  required
                  type="time"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-gold transition-colors text-bone"
                  value={formData.appointment_time}
                  onChange={e => setFormData({...formData, appointment_time: e.target.value})}
                />
              </div>
            </div>
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full py-4 rounded-xl gold-gradient text-dark font-bold text-lg hover:opacity-90 transition-all transform active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-gold/20"
          >
            {loading ? 'Verificando disponibilidad...' : 'Agendar Cita'}
          </button>
          
          <p className="text-center text-bone/30 text-xs">
            * No se agendan citas los domingos.
          </p>
        </form>
      </motion.div>

      {/* Enlace admin discreto */}
      <a
        href="/login"
        className="fixed bottom-6 right-6 text-bone/20 hover:text-bone/50 transition-colors text-xs uppercase tracking-widest z-20"
      >
        Admin
      </a>

    </div>
  );
}