/**
 * Aviso opcional a n8n de cada reserva (mismo payload que la versión original).
 * Solo se usa si VITE_N8N_ENABLED=true; la cita ya queda guardada en Firestore.
 */

const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL;

/** Respuesta del webhook; n8n puede devolver cualquier JSON o un cuerpo vacío. */
export type N8nResponse = Record<string, unknown>;

/** Avisa que hay una cita nueva; n8n la lee de Firestore por su ID. */
export async function sendBookingToN8n(citaId: string): Promise<N8nResponse> {
  if (!N8N_WEBHOOK_URL) throw new Error('n8n no está configurado');

  try {
    const payload = {
      tipo_evento: 'nueva_cita',
      citaId,
      timestamp: new Date().toISOString(),
      source: 'BarberFlow Web',
    };

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    if (!responseText) {
      return { success: true, message: 'Cita enviada' };
    }

    return JSON.parse(responseText) as N8nResponse;
  } catch (error) {
    console.error('Error al enviar cita a n8n:', error);
    throw error;
  }
}
