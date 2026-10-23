import { workflow, node, trigger, ifElse, expr } from '@n8n/workflow-sdk';

const FS = 'https://firestore.googleapis.com/v1/projects/barber-flow-42bcc/databases/(default)/documents';
const firebase = { googleApi: { id: 'vivTIyFJ1BJ0SsKn', name: 'firebase' } };

const entrada = trigger({
  type: 'n8n-nodes-base.executeWorkflowTrigger',
  version: 1.3,
  config: {
    name: 'Entrada: teléfono y cita',
    parameters: {
      inputSource: 'workflowInputs',
      workflowInputs: { values: [{ name: 'telefono', type: 'string' }, { name: 'citaId', type: 'string' }] }
    },
    position: [0, 0]
  },
  output: [{ telefono: '573000000000', citaId: '' }]
});

const citasCliente = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Citas del cliente',
    executeOnce: true,
    parameters: {
      method: 'POST',
      url: FS + ':runQuery',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'googleApi',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify({ structuredQuery: { from: [{ collectionId: "citas" }], where: { fieldFilter: { field: { fieldPath: "clienteTelefono" }, op: "EQUAL", value: { stringValue: "+" + String($("Entrada: teléfono y cita").first().json.telefono ?? "").replace(/\\D/g, "") } } } } }) }}'),
      options: {}
    },
    credentials: firebase,
    position: [220, 0]
  },
  output: [{ readTime: '2026-10-23T00:00:00Z' }]
});

const elegir = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Elegir cita a cancelar',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: `// Solo se cancelan citas próximas (pendiente/confirmada) del mismo número que escribe por WhatsApp.
const ZONA = 'America/Bogota';
const DOCS = 'projects/barber-flow-42bcc/databases/(default)/documents';
const entrada = $('Entrada: teléfono y cita').first().json;
const digitos = String(entrada.telefono ?? '').replace(/\\D/g, '');
if (!/^57\\d{10}$/.test(digitos)) return [{ json: { accion: 'error', ok: false, error: 'El teléfono del cliente no es válido.' } }];

const val = (v) => (v == null ? undefined : 'arrayValue' in v ? (v.arrayValue.values || []).map(val) : 'mapValue' in v ? Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k, x]) => [k, val(x)])) : v.stringValue ?? v.integerValue ?? v.doubleValue ?? v.booleanValue ?? v.timestampValue);
const ahora = DateTime.now();
const proximas = $input.all()
  .map((i) => i.json.document)
  .filter(Boolean)
  .map((d) => ({ docName: d.name, citaId: d.name.split('/').pop(), ...Object.fromEntries(Object.entries(d.fields || {}).map(([k, v]) => [k, val(v)])) }))
  .filter((c) => ['pendiente', 'confirmada'].includes(c.estado) && DateTime.fromISO(c.inicio ?? '') > ahora)
  .sort((a, b) => String(a.inicio).localeCompare(String(b.inicio)));
const resumen = (c) => ({
  citaId: c.citaId,
  fecha: c.fecha,
  fechaTexto: DateTime.fromISO(c.fecha, { zone: ZONA }).setLocale('es').toFormat("cccc d 'de' LLLL"),
  hora: c.horaInicio,
  barbero: c.barberoNombre,
  servicio: (c.servicios || []).map((s) => s.nombre).join(', '),
});
const citas = proximas.map(resumen);

const id = String(entrada.citaId ?? '').trim();
if (!id) {
  return [{ json: { accion: 'listar', ok: true, citas, mensaje: citas.length ? 'Pregunta al cliente cuál quiere cancelar.' : 'El cliente no tiene citas próximas.' } }];
}
const cita = proximas.find((c) => c.citaId === id);
if (!cita) {
  return [{ json: { accion: 'error', ok: false, error: 'Esa cita no existe, no es de este número o ya no se puede cancelar.', citas } }];
}

// Cancela y libera los cupos en una sola escritura, como la web (cancelMyAppointment).
const writes = [
  {
    update: { name: cita.docName, fields: { estado: { stringValue: 'cancelada' }, canceladaPor: { stringValue: 'cliente' }, motivoCancelacion: { stringValue: 'Cancelada por WhatsApp' } } },
    updateMask: { fieldPaths: ['estado', 'canceladaPor', 'motivoCancelacion'] },
    currentDocument: { exists: true },
    updateTransforms: [
      { fieldPath: 'canceladaEn', setToServerValue: 'REQUEST_TIME' },
      { fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' },
    ],
  },
  ...(cita.slotIds || []).map((slotId) => ({ delete: DOCS + '/citas_slots/' + slotId })),
];
return [{ json: { accion: 'cancelar', cita: resumen(cita), commit: { writes } } }];`
    },
    position: [440, 0]
  },
  output: [{ accion: 'listar', ok: true, citas: [] }]
});

const hayQueCancelar = ifElse({
  version: 2.2,
  config: {
    name: '¿Hay que cancelar?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
        conditions: [{ leftValue: expr('{{ $json.accion }}'), rightValue: 'cancelar', operator: { type: 'string', operation: 'equals' } }],
        combinator: 'and'
      }
    },
    position: [660, 0]
  }
});

const cancelar = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Cancelar y liberar cupos',
    onError: 'continueRegularOutput',
    parameters: {
      method: 'POST',
      url: FS + ':commit',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'googleApi',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify($json.commit) }}'),
      options: { response: { response: { neverError: true, fullResponse: true } } }
    },
    credentials: firebase,
    position: [880, -100]
  },
  output: [{ statusCode: 200, body: {} }]
});

const resultado = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Resultado de la cancelación',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: `const r = $input.first().json;
const cita = $('Elegir cita a cancelar').first().json.cita;
if (r.statusCode === 200) return [{ json: { ok: true, mensaje: 'Cita cancelada.', cita } }];
return [{ json: { ok: false, error: 'No se pudo cancelar la cita (Firestore ' + (r.statusCode ?? 'sin respuesta') + ').' } }];`
    },
    position: [1100, -100]
  },
  output: [{ ok: true }]
});

const devolver = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Devolver citas o error',
    parameters: { mode: 'manual', includeOtherFields: true, assignments: { assignments: [] } },
    position: [880, 100]
  },
  output: [{ accion: 'listar', ok: true, citas: [] }]
});

export default workflow('barberflow-cancelar-cita', 'BarberFlow – Cancelar cita')
  .add(entrada)
  .to(citasCliente)
  .to(elegir)
  .to(hayQueCancelar.onTrue(cancelar.to(resultado)).onFalse(devolver));
