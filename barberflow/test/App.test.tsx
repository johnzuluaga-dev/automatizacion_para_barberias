// test/App.test.tsx
import { vi, test } from 'vitest';
vi.mock('../src/lib/n8n', () => ({
  sendBookingToN8n: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('../src/lib/supabase', () => ({
  getAppointments: vi.fn().mockResolvedValue([]),
  updateAppointmentStatus: vi.fn().mockResolvedValue({}),
}));

vi.mock('../src/components/Login', () => ({
  __esModule: true,
  default: () => <div>Login Mock</div>,
}));

vi.mock('../src/components/AdminDashboard', () => ({
  __esModule: true,
  default: () => <div>Dashboard Mock</div>,
}));

vi.mock('../src/components/CancelAppointment', () => ({
  __esModule: true,
  default: () => <div>Cancel Mock</div>,
}));

import { render } from "@testing-library/react";
import App from "../src/App";

test("renderiza sin romper", () => {
  render(<App />);
});