import { PublicLayout } from '@/components/layout/PublicLayout';
import { LinkAppointmentCard } from '@/features/link/LinkAppointmentCard';

export default function LinkAppointmentPage() {
  return (
    <PublicLayout>
      <div className="mx-auto w-full max-w-md px-4 py-12 sm:py-20">
        <LinkAppointmentCard />
      </div>
    </PublicLayout>
  );
}
