import { PublicLayout } from '@/components/layout/PublicLayout';
import { CancelAppointmentCard } from '@/features/cancel/CancelAppointmentCard';

export default function CancelPage() {
  return (
    <PublicLayout>
      <div className="mx-auto w-full max-w-md px-4 py-12 sm:py-20">
        <CancelAppointmentCard />
      </div>
    </PublicLayout>
  );
}
