import { workflow, node, trigger, sticky, ifElse, splitInBatches, nextBatch, expr } from '@n8n/workflow-sdk';

// Versión final de "BarberFlow – Notificaciones WhatsApp": snapshot de 19 nodos + cambios posteriores.
// Ajustes del workflow que el SDK no fija: timezone America/Bogota (se aplica con update_workflow).

const ERROR_TEXTO = '(() => { const e = $json.error; if (!e) return "Error desconocido al enviar el WhatsApp"; if (typeof e === "string") return [e, $json.description].filter(Boolean).join(" | "); return [e.message, e.description].filter(Boolean).join(" | ") || JSON.stringify(e); })()';
const FIRESTORE = 'https://firestore.googleapis.com/v1/projects/barber-flow-42bcc/databases/(default)/documents';
const firebase = { googleApi: { id: 'vivTIyFJ1BJ0SsKn', name: 'firebase' } };

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

const citaIdError = "={{ (() => { const id = String($json.body?.citaId ?? '').trim(); if (!id) return 'Falta citaId'; return /^[A-Za-z0-9_-]{1,128}$/.test(id) ? '' : 'citaId inválido'; })() }}";
// El SDK no admite funciones: un objeto de parámetros por evento.
const citaIdAsignacion = { id: 'citaId', name: 'citaId', value: "={{ String($json.body?.citaId ?? '').trim() }}", type: 'string' };
const errorAsignacion = { id: 'error', name: 'error', value: citaIdError, type: 'string' };
const parametrosCreada = {
  mode: 'manual',
  includeOtherFields: false,
  assignments: { assignments: [{ id: 'evento', name: 'evento', value: 'creada', type: 'string' }, citaIdAsignacion, errorAsignacion] },
  options: {}
};
const parametrosCancelada = {
  mode: 'manual',
  includeOtherFields: false,
  assignments: { assignments: [{ id: 'evento', name: 'evento', value: 'cancelada', type: 'string' }, citaIdAsignacion, errorAsignacion] },
  options: {}
};

/* ───────────── Ramas 1 y 2: webhooks (reciben solo citaId) ───────────── */

const webhookCreada = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.2,
  config: {
    name: 'Webhook cita creada',
    parameters: { httpMethod: 'POST', path: 'barberflow/cita-creada', authentication: 'none', responseMode: 'responseNode', options: {} },
    position: [0, 0]
  },
  output: [{ body: { citaId: 'abc123', tipoEvento: 'nueva_cita' } }]
});

const webhookCancelada = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.2,
  config: {
    name: 'Webhook cita cancelada',
    parameters: { httpMethod: 'POST', path: 'barberflow/cita-cancelada', authentication: 'none', responseMode: 'responseNode', options: {} },
    position: [0, 272]
  },
  output: [{ body: { citaId: 'abc123', tipoEvento: 'cita_cancelada' } }]
});

const eventoCreada = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: { name: 'Evento: creada', parameters: parametrosCreada, position: [220, 0] },
  output: [{ evento: 'creada', citaId: 'abc123', error: '' }]
});

const eventoCancelada = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: { name: 'Evento: cancelada', parameters: parametrosCancelada, position: [220, 272] },
  output: [{ evento: 'cancelada', citaId: 'abc123', error: '' }]
});

const citaIdValido = ifElse({
  version: 2.2,
  config: {
    name: '¿citaId válido?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
        conditions: [{ id: 'sin-error', leftValue: expr('{{ $json.error }}'), rightValue: '', operator: { type: 'string', operation: 'empty', singleValue: true } }],
        combinator: 'and'
      },
      options: {}
    },
    position: [440, 136]
  }
});

const leerCita = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Leer cita',
    onError: 'continueRegularOutput',
    parameters: {
      method: 'GET',
      url: expr(FIRESTORE + '/citas/{{ $json.citaId }}'),
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'googleApi',
      options: { response: { response: { neverError: true, fullResponse: true } } }
    },
    credentials: firebase,
    position: [660, 40]
  },
  output: [{ statusCode: 200, body: { name: 'projects/barber-flow-42bcc/databases/(default)/documents/citas/abc123', fields: {} } }]
});

const validarCita = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Validar cita y armar mensaje',
    parameters: {
      mode: 'runOnceForEachItem',
      jsCode: `const ZONA = 'America/Bogota';
const ctx = $('¿citaId válido?').item.json; // { evento: 'creada' | 'cancelada', citaId }
const r = $json;
const val = (v) => (v == null ? undefined : v.stringValue ?? v.integerValue ?? v.doubleValue ?? v.booleanValue ?? v.timestampValue);
const fallo = (error, httpStatus = 400) => ({ json: { valido: false, error, httpStatus, citaId: ctx.citaId, evento: ctx.evento } });

// Lectura de citas/{citaId} (la respuesta completa trae statusCode)
if (r.statusCode === undefined) return fallo('No se pudo leer la cita en Firestore: ' + (r.error?.message ?? r.error ?? 'sin respuesta'), 502);
if (r.statusCode === 404) return fallo('La cita ' + ctx.citaId + ' no existe');
if (r.statusCode !== 200) return fallo('Firestore respondió ' + r.statusCode + ' al leer la cita', 502);

// El estado debe coincidir con el evento: así nadie dispara avisos falsos con un citaId cualquiera
const f = r.body?.fields ?? {};
const esperado = ctx.evento === 'creada' ? 'confirmada' : 'cancelada';
const estado = val(f.estado);
if (estado !== esperado) return fallo('La cita está "' + estado + '"; para este aviso debe estar "' + esperado + '"');

const c = {
  clienteNombre: val(f.clienteNombre),
  clienteTelefono: val(f.clienteTelefono),
  fecha: val(f.fecha),
  hora: val(f.horaInicio),
  barberoNombre: val(f.barberoNombre) ?? '',
  servicioNombre: (f.servicios?.arrayValue?.values ?? []).map((s) => val(s.mapValue?.fields?.nombre)).filter(Boolean).join(', '),
  canceladaPor: val(f.canceladaPor) ?? '',
};
const faltan = ['clienteNombre', 'clienteTelefono', 'fecha', 'hora'].filter((k) => !String(c[k] ?? '').trim());
if (faltan.length) return fallo('A la cita le faltan campos: ' + faltan.join(', '));
const numero = String(c.clienteTelefono).replace(/[\\s+\\-()]/g, '');
if (!/^57\\d{10}$/.test(numero)) return fallo('clienteTelefono inválido: debe empezar por 57 y tener 12 dígitos');

// "2026-10-24" -> "sábado 24 de octubre"
const dia = DateTime.fromISO(c.fecha, { zone: ZONA });
const fecha = dia.isValid ? dia.setLocale('es').toFormat("cccc d 'de' LLLL") : c.fecha;

let texto;
if (ctx.evento === 'creada') {
  texto = [
    'Hola ' + c.clienteNombre + ', tu cita en BarberFlow quedó confirmada ✅',
    '📅 ' + fecha,
    '🕒 ' + c.hora,
    '💈 Barbero: ' + c.barberoNombre,
    '✂️ Servicio: ' + c.servicioNombre,
  ].join('\\n');
} else {
  texto = 'Hola ' + c.clienteNombre + ', tu cita del ' + fecha + ' a las ' + c.hora + ' con ' + c.barberoNombre + ' fue cancelada ❌';
  if (c.canceladaPor === 'admin') texto += '\\nLa barbería canceló la cita; puedes agendar otra desde la app.';
}

return { json: { valido: true, error: '', numero, texto, citaId: ctx.citaId, evento: ctx.evento } };`
    },
    position: [880, 40]
  },
  output: [{ valido: true, error: '', numero: '573000000000', texto: 'Hola', citaId: 'abc123', evento: 'creada' }]
});

const payloadValido = ifElse({
  version: 2.2,
  config: {
    name: '¿Payload válido?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
        conditions: [{ id: 'valido', leftValue: expr('{{ $json.valido }}'), rightValue: '', operator: { type: 'boolean', operation: 'true', singleValue: true } }],
        combinator: 'and'
      },
      options: {}
    },
    position: [1100, 40]
  }
});

const enviarAviso = node({
  type: 'n8n-nodes-base.executeWorkflow',
  version: 1.4,
  config: {
    name: 'Enviar WhatsApp (aviso)',
    onError: 'continueErrorOutput',
    parameters: { source: 'database', workflowId: subWorkflowId, mode: 'each', workflowInputs: enviarWhatsappInputs, options: { waitForSubWorkflow: true } },
    position: [1320, -40]
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
    position: [1560, -40]
  }
});

const responderError = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Responder error',
    parameters: {
      respondWith: 'json',
      responseBody: expr('{{ { ok: false, error: $json.error } }}'),
      options: { responseCode: expr('{{ $json.httpStatus ?? 400 }}') }
    },
    position: [1320, 220]
  }
});

/* ───────────── Rama 3: recordatorios ───────────── */

const cada15 = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.2,
  config: {
    name: 'Cada 15 minutos',
    parameters: { rule: { interval: [{ field: 'minutes', minutesInterval: 15 }] } },
    position: [0, 624]
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
      url: FIRESTORE + '/configuracion/negocio',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'googleApi',
      options: {}
    },
    credentials: firebase,
    position: [224, 864]
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
      url: FIRESTORE + ':runQuery',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'googleApi',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: '{"structuredQuery":{"from":[{"collectionId":"citas"}],"where":{"fieldFilter":{"field":{"fieldPath":"estado"},"op":"EQUAL","value":{"stringValue":"confirmada"}}}}}',
      options: {}
    },
    credentials: firebase,
    position: [464, 864]
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
    position: [704, 864]
  },
  output: [{ citaId: 'abc', docName: 'projects/barber-flow-42bcc/databases/(default)/documents/citas/abc', numero: '573000000000', texto: 'Hola', inicio: '2026-10-24T11:00:00.000-05:00' }]
});

const recorrer = splitInBatches({
  version: 3,
  config: { name: 'Recorrer citas', parameters: { batchSize: 1, options: {} }, position: [960, 832] }
});

const enviarRecordatorio = node({
  type: 'n8n-nodes-base.executeWorkflow',
  version: 1.4,
  config: {
    name: 'Enviar WhatsApp (recordatorio)',
    onError: 'continueErrorOutput',
    parameters: { source: 'database', workflowId: subWorkflowId, mode: 'each', workflowInputs: enviarWhatsappInputs, options: { waitForSubWorkflow: true } },
    position: [1200, 928]
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
        conditions: [{ id: 'ok', leftValue: expr('{{ $json.ok }}'), rightValue: '', operator: { type: 'boolean', operation: 'true', singleValue: true } }],
        combinator: 'and'
      },
      looseTypeValidation: true,
      options: {}
    },
    position: [1440, 880]
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
    credentials: firebase,
    position: [1680, 800]
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
    position: [1920, 768]
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
    position: [1920, 1008]
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
    position: [1200, 688]
  },
  output: [{ procesadas: 1, enviados: 1, huboFallos: false, fallidos: [] }]
});

const notaAvisos = sticky('## Ramas 1 y 2: confirmación y cancelación\nLa app manda solo `citaId`. n8n lee la cita en Firestore, exige que el estado coincida con el evento (confirmada / cancelada), envía con el sub-workflow y responde 200 con `whatsappEnviado`, o 400/502 con el motivo.', [webhookCreada, webhookCancelada, eventoCreada, eventoCancelada, citaIdValido, leerCita, validarCita, payloadValido, enviarAviso, responderEnvio, responderError], { color: 4 });
const notaRecordatorios = sticky('## Rama 3: recordatorios\nCada 15 min (America/Bogota). Lee `configuracion/negocio` (`modo`, `horasAntes`, `horaMismoDia`) y las citas con `estado == confirmada`; el resto de filtros (`inicio`, `createdAt` < 30 min, `recordatorioEnviado`) se aplica en n8n, sin índice compuesto.', [cada15, leerConfig, buscarCitas, filtrarCitas, recorrer, enviarRecordatorio, fueEnviado, marcarEnviado, registrarEnviado, registrarFallo, resumen], { color: 5 });

export default workflow('barberflow-notificaciones', 'BarberFlow – Notificaciones WhatsApp')
  .add(webhookCreada)
  .to(eventoCreada)
  .to(citaIdValido.onTrue(leerCita.to(validarCita).to(payloadValido.onTrue(enviarAviso.onError(responderEnvio)).onFalse(responderError))).onFalse(responderError))
  .add(enviarAviso)
  .to(responderEnvio)
  .add(webhookCancelada)
  .to(eventoCancelada)
  .to(citaIdValido)
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
