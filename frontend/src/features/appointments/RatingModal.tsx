import { useState } from 'react';
import { Star } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { inputStyles } from '@/components/ui/TextField';
import { cn } from '@/lib/utils';
import type { Appointment } from '@/lib/citas';

interface RatingModalProps {
  appointment: Appointment | null;
  onClose: () => void;
  onSubmit: (appointment: Appointment, rating: number, comment: string) => Promise<void>;
}

export function RatingModal({ appointment, onClose, onSubmit }: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!appointment) return;
    if (rating < 1) {
      setError('Elige de 1 a 5 estrellas.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit(appointment, rating, comment);
      setRating(0);
      setComment('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos guardar tu calificación.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={appointment !== null}
      onClose={onClose}
      title="Califica tu cita"
      description={appointment ? `${appointment.service} con ${appointment.barber}` : undefined}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Ahora no
          </Button>
          <Button onClick={() => void submit()} loading={saving} loadingText="Guardando...">
            Enviar calificación
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {error && <Alert tone="danger">{error}</Alert>}
        <div role="radiogroup" aria-label="Calificación" className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} ${n === 1 ? 'estrella' : 'estrellas'}`}
              onClick={() => setRating(n)}
              className="grid size-10 place-items-center rounded-md transition-colors duration-150 hover:bg-surface-2"
            >
              <Star aria-hidden className={cn('size-6', n <= rating ? 'fill-accent text-accent' : 'text-line-strong')} />
            </button>
          ))}
        </div>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Comentario (opcional)
          <textarea
            rows={3}
            maxLength={500}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className={cn(inputStyles, 'h-auto py-2 font-normal')}
          />
        </label>
      </div>
    </Modal>
  );
}
