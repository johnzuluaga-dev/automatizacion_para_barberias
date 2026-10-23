/**
 * Avisos opcionales a n8n cuando se crea o se cancela una cita.
 * Solo se usan si VITE_N8N_ENABLED=true; la cita ya queda guardada en Firestore.
 * Se envía solo el `citaId`: n8n lee la cita en Firestore y no confía en el payload,
 * por eso estos webhooks no llevan secreto (quedaría visible en el navegador).
 */

const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL;
const N8N_CANCELLED_WEBHOOK_URL = import.meta.env.VITE_N8N_CANCELLED_WEBHOOK_URL;

/** Respuesta del webhook; n8n puede devolver cualquier JSON o un cuerpo vacío. */
export type N8nResponse = Record<string, unknown>;

async function postCitaEvent(url: string | undefined, tipoEvento: string, citaId: string): Promise<N8nResponse> {
  if (!url) throw new Error('n8n no está configurado');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo_evento: tipoEvento,
        citaId,
        timestamp: new Date().toISOString(),
        source: 'BarberFlow Web',
      }),
    });

    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    if (!responseText) {
      return { success: true, message: 'Aviso enviado' };
    }

    return JSON.parse(responseText) as N8nResponse;
  } catch (error) {
    console.error(`Error al avisar a n8n (${tipoEvento}):`, error);
    throw error;
  }
}

/** Avisa que hay una cita nueva; n8n la lee de Firestore por su ID. */
export function sendBookingToN8n(citaId: string): Promise<N8nResponse> {
  return postCitaEvent(N8N_WEBHOOK_URL, 'nueva_cita', citaId);
}

/** Avisa que una cita se canceló; n8n la lee de Firestore (incluye `canceladaPor`). */
export function sendCancellationToN8n(citaId: string): Promise<N8nResponse> {
  return postCitaEvent(N8N_CANCELLED_WEBHOOK_URL, 'cita_cancelada', citaId);
}
