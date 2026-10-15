// test/BookingForm.test.tsx
import { vi, test, describe, expect } from 'vitest';
vi.mock('../src/lib/n8n', () => ({
  sendBookingToN8n: vi.fn().mockResolvedValue({ success: true }),
}));

import { render, screen, fireEvent, act } from "@testing-library/react";
import BookingForm from "../src/BookingForm";

describe("BookingForm", () => {

  test("renderiza el formulario correctamente", () => {
    render(<BookingForm />);
    expect(screen.getByText(/barberflow/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/nombre completo/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/teléfono/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /agendar cita/i })).toBeInTheDocument();
  });

  test("permite escribir en los inputs", () => {
    render(<BookingForm />);
    const nombre = screen.getByPlaceholderText(/nombre completo/i);
    const telefono = screen.getByPlaceholderText(/teléfono/i);
    fireEvent.change(nombre, { target: { value: "Juan Pérez" } });
    fireEvent.change(telefono, { target: { value: "123456789" } });
    expect(nombre).toHaveValue("Juan Pérez");
    expect(telefono).toHaveValue("123456789");
  });

  test("envía el formulario y muestra confirmación", async () => {
    render(<BookingForm />);

    fireEvent.change(screen.getByPlaceholderText(/nombre completo/i), {
      target: { value: "Juan Pérez" },
    });
    fireEvent.change(screen.getByPlaceholderText(/teléfono/i), {
      target: { value: "123456789" },
    });

    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[0] as HTMLElement, { target: { value: "Corte Clásico" } });
    fireEvent.change(selects[1] as HTMLElement, { target: { value: "Carlos The Blade" } });

    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    const timeInput = document.querySelector('input[type="time"]') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: "2099-05-20" } });
    fireEvent.change(timeInput, { target: { value: "10:00" } });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /agendar cita/i }));
    });

    expect(screen.getByText(/cita confirmada/i)).toBeInTheDocument();
  });

});