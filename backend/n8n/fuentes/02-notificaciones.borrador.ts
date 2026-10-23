import { workflow, node, trigger, sticky, ifElse, splitInBatches, nextBatch, expr } from '@n8n/workflow-sdk';

const ERROR_TEXTO = '(() => { const e = $json.error; if (!e) return "Error desconocido al enviar el WhatsApp"; if (typeof e === "string") return [e, $json.description].filter(Boolean).join(" | "); return [e.message, e.description].filter(Boolean).join(" | ") || JSON.stringify(e); })()';

const enviarWhatsappInputs = {
  mappingMode: 'defineBelow',
  value: { numero: '={{ $json.numero }}', texto: '={{ $json.texto }}' },
  matchingColumns: [],
  schema: [
    { id: 'numero', displayName: 'numero', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'string' },
    { id: 'texto', displayName: 'texto', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'string' }
  ],
  attemptToConvertTypes: false,
  convertFieldsToString: true
};
const subWorkflowId = { __rl: true, mode: 'id', value: 'rb3g0zW5WUW0e65C', cachedResultName: 'BarberFlow – Enviar WhatsApp' };

/* ───────────── Ramas 1 y 2: webhooks ───────────── */

const webhookCreada = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.2,
  config: {
    name: 'Webhook cita creada',
    parameters: { httpMethod: 'POST', path: 'barberflow/cita-creada', authentication: 'headerAuth', responseMode: 'responseNode', options: {} },
    credentials: { httpHeaderAuth: { id: 'cDF1WOxB1fsqUOVD', name: 'BarberFlow Webhook Secret' } },
    position: [0, 0]
  },
  output: [{ body: { clienteNombre: 'Ana', clienteTelefono: '573000000000', fecha: '2026-10-24', hora: '15:00', barberoNombre: 'Andrés Estilo', servicioNombre: 'Corte Clásico' } }]
});

const webhookCancelada = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.2,
  config: {
    name: 'Webhook cita cancelada',
    parameters: { httpMethod: 'POST', path: 'barberflow/cita-cancelada', authentication: 'headerAuth', responseMode: 'responseNode', options: {} },
    credentials: { httpHeaderAuth: { id: 'cDF1WOxB1fsqUOVD', name: 'BarberFlow Webhook Secret' } },
    position: [0, 260]
  },
  output: [{ body: { clienteNombre: 'Ana', clienteTelefono: '573000000000', fecha: '2026-10-24', hora: '15:00', barberoNombre: 'Andrés Estilo', canceladaPor: 'admin' } }]
});

const validarCreada = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Validar y armar confirmación',
    parameters: {
      mode: 'runOnceForEachItem',
      jsCode: `const b = $json.body ?? $json;
const faltan = ['clienteNombre', 'clienteTelefono', 'fecha', 'hora'].filter((k) => !String(b[k] ?? '').trim());
const numero = String(b.clienteTelefono ?? '').replace(/[\\s+\\-()]/g, '');
let error = '';
if (faltan.length) error = 'Faltan campos: ' + faltan.join(', ');
else if (!/^57\\d{10}$/.test(numero)) error = 'clienteTelefono inválido: debe empezar por 57 y tener 12 dígitos';

const texto = [
  'Hola ' + b.clienteNombre + ', tu cita en BarberFlow quedó confirmada ✅',
  '📅 ' + b.fecha,
  '🕒 ' + b.hora,
  '💈 Barbero: ' + (b.barberoNombre ?? ''),
  '✂️ Servicio: ' + (b.servicioNombre ?? ''),
].join('\\n');

return { json: { valido: !error, error, numero, texto } };`
    },
    position: [240, 0]
  },
  output: [{ valido: true, error: '', numero: '573000000000', texto: 'Hola' }]
});

const validarCancelada = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Validar y armar cancelación',
    parameters: {
      mode: 'runOnceForEachItem',
      jsCode: `const b = $json.body ?? $json;
const faltan = ['clienteNombre', 'clienteTelefono', 'fecha', 'hora'].filter((k) => !String(b[k] ?? '').trim());
const numero = String(b.clienteTelefono ?? '').replace(/[\\s+\\-()]/g, '');
let error = '';
if (faltan.length) error = 'Faltan campos: ' + faltan.join(', ');
else if (!/^57\\d{10}$/.test(numero)) error = 'clienteTelefono inválido: debe empezar por 57 y tener 12 dígitos';

let texto = 'Hola ' + b.clienteNombre + ', tu cita del ' + b.fecha + ' a las ' + b.hora + ' con ' + (b.barberoNombre ?? '') + ' fue cancelada ❌';
if (String(b.canceladaPor ?? '').trim().toLowerCase() === 'admin') {
  texto += '\\nLa barbería canceló la cita; puedes agendar otra desde la app.';
}

return { json: { valido: !error, error, numero, texto } };`
    },
    position: [240, 260]
  },
  output: [{ valido: true, error: '', numero: '573000000000', texto: 'Hola' }]
});

const payloadValido = ifElse({
  version: 2.2,
  config: {
    name: '¿Payload válido?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
        conditions: [{ leftValue: expr('{{ $json.valido }}'), operator: { type: 'boolean', operation: 'true', singleValue: true } }],
        combinator: 'and'
      }
    },
    position: [480, 130]
  }
});

const enviarAviso = node({
  type: 'n8n-nodes-base.executeWorkflow',
  version: 1.4,
  config: {
    name: 'Enviar WhatsApp (aviso)',
    onError: 'continueErrorOutput',
    parameters: { source: 'database', workflowId: subWorkflowId, mode: 'each', workflowInputs: enviarWhatsappInputs, options: { waitForSubWorkflow: true } },
    position: [720, 40]
  },
  output: [{ ok: true }]
});

const responderEnvio = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Responder 200',
    parameters: {
      respondWith: 'json',
      responseBody: expr('{{ $json.ok === true ? { ok: true, whatsappEnviado: true } : { ok: true, whatsappEnviado: false, error: ' + ERROR_TEXTO + ' } }}'),
      options: { responseCode: 200 }
    },
    position: [980, 40]
  }
});

const responder400 = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Responder 400',
    parameters: {
      respondWith: 'json',
      responseBody: expr('{{ { ok: false, error: $json.error } }}'),
      options: { responseCode: 400 }
    },
    position: [720, 240]
  }
});

/* ───────────── Rama 3: recordatorios ───────────── */

const cada15 = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.3,
  config: {
    name: 'Cada 15 minutos',
    parameters: { rule: { interval: [{ field: 'minutes', minutesInterval: 15 }] } },
    position: [0, 600]
  },
  output: [{ timestamp: '2026-10-24T09:00:00.000-05:00' }]
});

const leerConfig = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Leer configuración',
    parameters: {
      method: 'GET',
      url: 'https://firestore.googleapis.com/v1/projects/barber-flow-42bcc/databases/(default)/documents/configuracion/negocio',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'googleApi',
      options: {}
    },
    credentials: { googleApi: { id: 'vivTIyFJ1BJ0SsKn', name: 'firebase' } },
    position: [240, 600]
  },
  output: [{ name: 'projects/barber-flow-42bcc/databases/(default)/documents/configuracion/negocio', fields: { modo: { stringValue: 'horas_antes' }, horasAntes: { integerValue: '3' }, horaMismoDia: { stringValue: '08:00' } } }]
});

const buscarCitas = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Buscar citas confirmadas',
    executeOnce: true,
    parameters: {
      method: 'POST',
      url: 'https://firestore.googleapis.com/v1/projects/barber-flow-42bcc/databases/(default)/documents:runQuery',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'googleApi',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: '{"structuredQuery":{"from":[{"collectionId":"citas"}],"where":{"fieldFilter":{"field":{"fieldPath":"estado"},"op":"EQUAL","value":{"stringValue":"confirmada"}}}}}',
      options: {}
    },
    credentials: { googleApi: { id: 'vivTIyFJ1BJ0SsKn', name: 'firebase' } },
    position: [480, 600]
  },
  output: [{ document: { name: 'projects/barber-flow-42bcc/databases/(default)/documents/citas/abc', fields: {} }, readTime: '2026-10-24T14:00:00Z' }]
});

const filtrarCitas = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Filtrar citas para recordar',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: `const ZONA = 'America/Bogota';
const val = (v) => (v == null ? undefined : v.stringValue ?? v.integerValue ?? v.doubleValue ?? v.booleanValue ?? v.timestampValue);

// Configuración: configuracion/negocio.{modo, horasAntes, horaMismoDia}
const cfg = $('Leer configuración').first().json.fields || {};
const modo = val(cfg.modo);
const horasAntes = Number(val(cfg.horasAntes));
const horaMismoDia = String(val(cfg.horaMismoDia) ?? '');
if (modo !== 'horas_antes' && modo !== 'mismo_dia') {
  throw new Error('configuracion/negocio.modo debe ser "horas_antes" o "mismo_dia" (valor actual: ' + modo + ')');
}
if (modo === 'horas_antes' && !(horasAntes > 0)) throw new Error('configuracion/negocio.horasAntes debe ser un número mayor que 0');
if (modo === 'mismo_dia' && !/^\\d{2}:\\d{2}$/.test(horaMismoDia)) throw new Error('configuracion/negocio.horaMismoDia debe tener formato HH:mm');

// "Ahora" es la hora del disparo del Schedule Trigger (en producción coincide con el momento actual).
const disparo = $('Cada 15 minutos').first().json.timestamp;
const ahora = (disparo ? DateTime.fromISO(disparo) : DateTime.now()).setZone(ZONA);
const hoy = ahora.startOf('day');
const manana = hoy.plus({ days: 1 });

const salida = [];
for (const item of $input.all()) {
  const doc = item.json.document;
  if (!doc) continue; // runQuery sin resultados devuelve solo { readTime }
  const c = doc.fields || {};
  if (val(c.estado) !== 'confirmada') continue;
  if (val(c.recordatorioEnviado) === true) continue; // si el campo no existe, cuenta como no enviado

  const inicioIso = val(c.inicio);
  if (!inicioIso) continue;
  const inicio = DateTime.fromISO(inicioIso).setZone(ZONA);
  if (inicio < hoy || inicio <= ahora) continue; // fecha >= hoy y aún no pasó

  const creada = val(c.createdAt);
  if (creada && ahora.diff(DateTime.fromISO(creada), 'minutes').minutes < 30) continue; // ya recibió la confirmación

  if (modo === 'horas_antes') {
    if (inicio > ahora.plus({ hours: horasAntes })) continue;
  } else {
    const [h, m] = horaMismoDia.split(':').map(Number);
    if (ahora < hoy.set({ hour: h, minute: m })) continue;
    if (!inicio.hasSame(ahora, 'day')) continue;
  }

  const cuando = inicio.hasSame(ahora, 'day') ? 'hoy' : inicio.hasSame(manana, 'day') ? 'mañana' : 'el ' + inicio.toFormat('dd/MM/yyyy');
  const hora = val(c.horaInicio) || inicio.toFormat('HH:mm');
  salida.push({
    json: {
      citaId: doc.name.split('/').pop(),
      docName: doc.name,
      numero: String(val(c.clienteTelefono) ?? '').replace(/\\D/g, ''),
      texto: 'Hola ' + val(c.clienteNombre) + ', te recordamos tu cita ' + cuando + ' a las ' + hora + ' con ' + val(c.barberoNombre) + ' 💈',
      inicio: inicio.toISO(),
    },
  });
}
return salida;`
    },
    position: [720, 600]
  },
  output: [{ citaId: 'abc', docName: 'projects/barber-flow-42bcc/databases/(default)/documents/citas/abc', numero: '573000000000', texto: 'Hola', inicio: '2026-10-24T11:00:00.000-05:00' }]
});

const recorrer = splitInBatches({
  version: 3,
  config: { name: 'Recorrer citas', parameters: { batchSize: 1, options: {} }, position: [960, 600] }
});

const enviarRecordatorio = node({
  type: 'n8n-nodes-base.executeWorkflow',
  version: 1.4,
  config: {
    name: 'Enviar WhatsApp (recordatorio)',
    onError: 'continueErrorOutput',
    parameters: { source: 'database', workflowId: subWorkflowId, mode: 'each', workflowInputs: enviarWhatsappInputs, options: { waitForSubWorkflow: true } },
    position: [1200, 700]
  },
  output: [{ ok: true }]
});

const fueEnviado = ifElse({
  version: 2.2,
  config: {
    name: '¿WhatsApp enviado?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' },
        conditions: [{ leftValue: expr('{{ $json.ok }}'), operator: { type: 'boolean', operation: 'true', singleValue: true } }],
        combinator: 'and'
      }
    },
    position: [1440, 640]
  }
});

const marcarEnviado = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Marcar recordatorioEnviado',
    onError: 'continueErrorOutput',
    parameters: {
      method: 'PATCH',
      url: expr('https://firestore.googleapis.com/v1/{{ $("Recorrer citas").first().json.docName }}?updateMask.fieldPaths=recordatorioEnviado&currentDocument.exists=true'),
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'googleApi',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: '{"fields":{"recordatorioEnviado":{"booleanValue":true}}}',
      options: {}
    },
    credentials: { googleApi: { id: 'vivTIyFJ1BJ0SsKn', name: 'firebase' } },
    position: [1680, 560]
  },
  output: [{ name: 'projects/barber-flow-42bcc/databases/(default)/documents/citas/abc' }]
});

const registrarEnviado = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Recordatorio enviado',
    parameters: {
      mode: 'manual',
      includeOtherFields: false,
      assignments: {
        assignments: [
          { id: 'cita', name: 'citaId', value: expr('{{ $("Recorrer citas").first().json.citaId }}'), type: 'string' },
          { id: 'env', name: 'enviado', value: true, type: 'boolean' }
        ]
      }
    },
    position: [1920, 540]
  },
  output: [{ citaId: 'abc', enviado: true }]
});

const registrarFallo = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Recordatorio fallido',
    parameters: {
      mode: 'manual',
      includeOtherFields: false,
      assignments: {
        assignments: [
          { id: 'cita', name: 'citaId', value: expr('{{ $("Recorrer citas").first().json.citaId }}'), type: 'string' },
          { id: 'env', name: 'enviado', value: false, type: 'boolean' },
          { id: 'err', name: 'error', value: expr('{{ ' + ERROR_TEXTO + ' }}'), type: 'string' }
        ]
      }
    },
    position: [1920, 760]
  },
  output: [{ citaId: 'abc', enviado: false, error: 'x' }]
});

const resumen = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Resumen de recordatorios',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: `const filas = $input.all().map((i) => i.json);
const fallidos = filas.filter((f) => f.enviado === false).map((f) => ({ citaId: f.citaId, error: f.error }));
return [{ json: { procesadas: filas.length, enviados: filas.length - fallidos.length, huboFallos: fallidos.length > 0, fallidos } }];`
    },
    position: [1200, 440]
  },
  output: [{ procesadas: 1, enviados: 1, huboFallos: false, fallidos: [] }]
});

const notaAvisos = sticky('## Ramas 1 y 2: confirmación y cancelación\nWebhooks con header `x-barberflow-secret`. Valida el payload (400 si falta un dato o el teléfono no es 57 + 10 dígitos; el "+" se quita), envía con el sub-workflow y responde 200 con `whatsappEnviado`.', [webhookCreada, webhookCancelada, validarCreada, validarCancelada, payloadValido, enviarAviso, responderEnvio, responder400], { color: 4 });
const notaRecordatorios = sticky('## Rama 3: recordatorios\nCada 15 min (America/Bogota). Lee `configuracion/negocio` (`modo`, `horasAntes`, `horaMismoDia`) y las citas con `estado == confirmada`; el resto de filtros (fecha, `inicio`, `createdAt` < 30 min, `recordatorioEnviado`) se aplica en n8n, sin índice compuesto.', [cada15, leerConfig, buscarCitas, filtrarCitas, recorrer, enviarRecordatorio, fueEnviado, marcarEnviado, registrarEnviado, registrarFallo, resumen], { color: 5 });

export default workflow('barberflow-notificaciones', 'BarberFlow – Notificaciones WhatsApp')
  .add(webhookCreada)
  .to(validarCreada)
  .to(payloadValido.onTrue(enviarAviso.onError(responderEnvio)).onFalse(responder400))
  .add(enviarAviso)
  .to(responderEnvio)
  .add(webhookCancelada)
  .to(validarCancelada)
  .to(payloadValido)
  .add(cada15)
  .to(leerConfig)
  .to(buscarCitas)
  .to(filtrarCitas)
  .to(recorrer
    .onDone(resumen)
    .onEachBatch(enviarRecordatorio.onError(registrarFallo.to(nextBatch(recorrer)))))
  .add(enviarRecordatorio)
  .to(fueEnviado
    .onTrue(marcarEnviado.onError(registrarFallo))
    .onFalse(registrarFallo))
  .add(marcarEnviado)
  .to(registrarEnviado.to(nextBatch(recorrer)))
  .add(notaAvisos)
  .add(notaRecordatorios);
