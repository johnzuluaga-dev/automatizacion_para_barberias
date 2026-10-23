import { workflow, node, trigger, sticky, expr } from '@n8n/workflow-sdk';

const entrada = trigger({
  type: 'n8n-nodes-base.executeWorkflowTrigger',
  version: 1.3,
  config: {
    name: 'Entrada: numero y texto',
    parameters: {
      inputSource: 'workflowInputs',
      workflowInputs: { values: [{ name: 'numero', type: 'string' }, { name: 'texto', type: 'string' }] }
    },
    position: [0, 0]
  },
  output: [{ numero: '573000000000', texto: 'Hola' }]
});

const enviar = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'POST Evolution sendText',
    onError: 'continueErrorOutput',
    parameters: {
      method: 'POST',
      url: 'http://evolution:8080/message/sendText/asistente',
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      // numero puede ser un teléfono (se dejan solo los dígitos) o un JID completo como "123@lid" (se envía tal cual).
      jsonBody: expr('{{ JSON.stringify({ number: ((n) => n.includes("@") ? n.trim() : n.replace(/\\D/g, ""))(String($json.numero ?? "")), text: String($json.texto ?? "") }) }}'),
      options: { timeout: 20000 }
    },
    credentials: { httpHeaderAuth: { id: 'kSbBkQdGat4M77BE', name: 'evolution' } },
    position: [260, 0]
  },
  output: [{ key: { id: 'ABC' }, status: 'PENDING' }]
});

const correcto = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Envío correcto',
    parameters: {
      mode: 'manual',
      includeOtherFields: false,
      assignments: { assignments: [{ id: 'ok-true', name: 'ok', value: true, type: 'boolean' }] }
    },
    position: [540, -100]
  },
  output: [{ ok: true }]
});

const fallido = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Envío fallido',
    parameters: {
      mode: 'manual',
      includeOtherFields: false,
      assignments: {
        assignments: [
          { id: 'ok-false', name: 'ok', value: false, type: 'boolean' },
          { id: 'err', name: 'error', value: expr('{{ (() => { const e = $json.error; if (!e) return "Error desconocido al enviar el WhatsApp"; if (typeof e === "string") return [e, $json.description].filter(Boolean).join(" | "); return [e.message, e.description].filter(Boolean).join(" | ") || JSON.stringify(e); })() }}'), type: 'string' }
        ]
      }
    },
    position: [540, 100]
  },
  output: [{ ok: false, error: 'Bad request' }]
});

const nota = sticky('## Enviar WhatsApp\nSub-workflow reutilizable. Entrada: `numero`, `texto`.\nDevuelve siempre `{ ok: true }` o `{ ok: false, error }`; nunca lanza excepción.\nLo usan las ramas de notificaciones y, después, el chatbot.', [entrada, enviar, correcto, fallido], { color: 4 });

export default workflow('barberflow-enviar-whatsapp', 'BarberFlow – Enviar WhatsApp')
  .add(entrada)
  .to(enviar.onError(fallido))
  .add(enviar)
  .to(correcto)
  .add(nota);
