import { PublicLayout } from '@/components/layout/PublicLayout';
import { BookingForm } from '@/features/booking/BookingForm';

export default function BookingPage() {
  return (
    <PublicLayout>
      <BookingForm />
    </PublicLayout>
  );
}
