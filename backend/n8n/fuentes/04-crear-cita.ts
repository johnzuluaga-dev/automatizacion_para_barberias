import { workflow, node, trigger, ifElse, expr } from '@n8n/workflow-sdk';

const FS = 'https://firestore.googleapis.com/v1/projects/barber-flow-42bcc/databases/(default)/documents';
const firebase = { googleApi: { id: 'vivTIyFJ1BJ0SsKn', name: 'firebase' } };

const entrada = trigger({
  type: 'n8n-nodes-base.executeWorkflowTrigger',
  version: 1.3,
  config: {
    name: 'Entrada: datos de la reserva',
    parameters: {
      inputSource: 'workflowInputs',
      workflowInputs: {
        values: [
          { name: 'telefono', type: 'string' },
          { name: 'clienteNombre', type: 'string' },
          { name: 'servicio', type: 'string' },
          { name: 'barbero', type: 'string' },
          { name: 'fecha', type: 'string' },
          { name: 'hora', type: 'string' }
        ]
      }
    },
    position: [0, 0]
  },
  output: [{ telefono: '573000000000', clienteNombre: 'Ana', servicio: 'corte-clasico', barbero: 'carlos-the-blade', fecha: '2026-10-24', hora: '15:00' }]
});

const consultar = node({
  type: 'n8n-nodes-base.executeWorkflow',
  version: 1.4,
  config: {
    name: 'Consultar disponibilidad',
    parameters: {
      source: 'database',
      workflowId: { __rl: true, mode: 'id', value: 'xSSYOcWjlEE46jGg', cachedResultName: 'BarberFlow – Consultar disponibilidad' },
      mode: 'each',
      workflowInputs: {
        mappingMode: 'defineBelow',
        value: { fecha: '={{ $json.fecha }}', servicio: '={{ $json.servicio }}', barbero: '={{ $json.barbero }}' },
        matchingColumns: [],
        schema: [
          { id: 'fecha', displayName: 'fecha', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'string' },
          { id: 'servicio', displayName: 'servicio', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'string' },
          { id: 'barbero', displayName: 'barbero', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'string' }
        ],
        attemptToConvertTypes: false,
        convertFieldsToString: true
      },
      options: { waitForSubWorkflow: true }
    },
    position: [220, 0]
  },
  output: [{ ok: true, fecha: '2026-10-24', disponibilidad: [] }]
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
      jsonBody: expr('{{ JSON.stringify({ structuredQuery: { from: [{ collectionId: "citas" }], where: { fieldFilter: { field: { fieldPath: "clienteTelefono" }, op: "EQUAL", value: { stringValue: "+" + String($("Entrada: datos de la reserva").first().json.telefono ?? "").replace(/\\D/g, "") } } } } }) }}'),
      options: {}
    },
    credentials: firebase,
    position: [440, 0]
  },
  output: [{ readTime: '2026-10-23T00:00:00Z' }]
});

const validar = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Validar y preparar reserva',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: `// Reglas fijas: el modelo solo propone datos; aquí se comprueba todo contra Firestore.
const ZONA = 'America/Bogota';
const MAX_CITAS_PROXIMAS = 2;
const DOCS = 'projects/barber-flow-42bcc/databases/(default)/documents';

const entrada = $('Entrada: datos de la reserva').first().json;
const disp = $('Consultar disponibilidad').first().json;
const no = (error) => [{ json: { valido: false, ok: false, error } }];

const digitos = String(entrada.telefono ?? '').replace(/\\D/g, '');
if (!/^57\\d{10}$/.test(digitos)) return no('El teléfono del cliente no es un celular colombiano válido.');
const nombre = String(entrada.clienteNombre ?? '').trim();
if (nombre.length < 2) return no('Falta el nombre del cliente.');
if (!String(entrada.barbero ?? '').trim()) return no('Falta elegir el barbero.');
if (!disp.ok) return no(disp.error);

const m = String(entrada.hora ?? '').trim().match(/^(\\d{1,2}):(\\d{2})$/);
const hora = m ? m[1].padStart(2, '0') + ':' + m[2] : String(entrada.hora ?? '');
const opcion = (disp.disponibilidad || [])[0];
if (!opcion || !opcion.horas.includes(hora)) {
  const libres = opcion && opcion.horas.length ? opcion.horas.join(', ') : 'ninguna';
  return no('Las ' + hora + ' no están libres con ' + (opcion ? opcion.barberoNombre : 'ese barbero') + ' el ' + disp.fechaTexto + '. Horas libres: ' + libres + '.');
}

const ahora = DateTime.now();
const proximas = $('Citas del cliente').all()
  .map((i) => i.json.document)
  .filter(Boolean)
  .filter((d) => ['pendiente', 'confirmada'].includes(d.fields?.estado?.stringValue) && DateTime.fromISO(d.fields?.inicio?.timestampValue ?? '') > ahora);
if (proximas.length >= MAX_CITAS_PROXIMAS) {
  return no('Este número ya tiene ' + proximas.length + ' citas próximas. Para agendar otra, primero cancela una.');
}

const servicio = disp.servicio;
const inicio = DateTime.fromISO(disp.fecha + 'T' + hora, { zone: ZONA });
const fin = inicio.plus({ minutes: servicio.duracionMin });
const celdas = Array.from({ length: Math.ceil(servicio.duracionMin / 30) }, (_, i) => inicio.plus({ minutes: 30 * i }).toFormat('HH:mm'));
const slotIds = celdas.map((c) => opcion.barberoId + '_' + disp.fecha + '_' + c.replace(':', ''));

const aleatorio = (n) => Array.from({ length: n }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 62)]).join('');
const uuid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => { const r = (Math.random() * 16) | 0; return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16); });
const citaId = aleatorio(20);

const s = (v) => ({ stringValue: String(v) });
const num = (v) => (Number.isInteger(Number(v)) ? { integerValue: String(Number(v)) } : { doubleValue: Number(v) });
const ts = (d) => ({ timestampValue: d.toUTC().toISO() });
const arr = (a) => ({ arrayValue: { values: a } });
const map = (o) => ({ mapValue: { fields: o } });

// Mismo documento que crea la web (lib/citas.ts), con origen "whatsapp" y sin clienteId.
const fields = {
  clienteId: { nullValue: null },
  clienteNombre: s(nombre),
  clienteTelefono: s('+' + digitos),
  barberoId: s(opcion.barberoId),
  barberoNombre: s(opcion.barberoNombre),
  sedeId: s('sede-principal'),
  fecha: s(disp.fecha),
  horaInicio: s(hora),
  inicio: ts(inicio),
  fin: ts(fin),
  estado: s('confirmada'),
  notas: s(''),
  servicios: arr([map({ servicioId: s(servicio.id), nombre: s(servicio.nombre), precio: num(servicio.precio ?? 0), duracionMin: num(servicio.duracionMin) })]),
  precioTotal: num(servicio.precio ?? 0),
  origen: s('whatsapp'),
  cancelToken: s(uuid()),
  slotIds: arr(slotIds.map(s)),
};
const ahoraServidor = [
  { fieldPath: 'createdAt', setToServerValue: 'REQUEST_TIME' },
  { fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' },
];
// La cita y sus cupos se escriben juntos; si un cupo ya existe, falla todo (sin doble reserva).
const writes = [
  { update: { name: DOCS + '/citas/' + citaId, fields }, currentDocument: { exists: false }, updateTransforms: ahoraServidor },
  ...slotIds.map((id, i) => ({
    update: { name: DOCS + '/citas_slots/' + id, fields: { barberoId: s(opcion.barberoId), fecha: s(disp.fecha), hora: s(celdas[i]), citaId: s(citaId) } },
    currentDocument: { exists: false },
  })),
];

return [{
  json: {
    valido: true,
    commit: { writes },
    resumen: { citaId, clienteNombre: nombre, servicio: servicio.nombre, precio: servicio.precio, barbero: opcion.barberoNombre, fecha: disp.fecha, fechaTexto: disp.fechaTexto, hora },
  },
}];`
    },
    position: [660, 0]
  },
  output: [{ valido: true, commit: { writes: [] }, resumen: { citaId: 'abc' } }]
});

const sePuede = ifElse({
  version: 2.2,
  config: {
    name: '¿Se puede reservar?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
        conditions: [{ leftValue: expr('{{ $json.valido }}'), operator: { type: 'boolean', operation: 'true', singleValue: true } }],
        combinator: 'and'
      }
    },
    position: [880, 0]
  }
});

const guardar = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Guardar cita y cupos',
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
    position: [1100, -100]
  },
  output: [{ statusCode: 200, body: { writeResults: [] } }]
});

const resultado = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Resultado de la reserva',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: `const r = $input.first().json;
const resumen = $('Validar y preparar reserva').first().json.resumen;
if (r.statusCode === 200) return [{ json: { ok: true, mensaje: 'Cita creada y confirmada.', ...resumen } }];
const estado = r.body?.error?.status ?? '';
if (r.statusCode === 409 || ['ALREADY_EXISTS', 'FAILED_PRECONDITION', 'ABORTED'].includes(estado)) {
  return [{ json: { ok: false, error: 'Esa hora acaba de ocuparse. Consulta de nuevo la disponibilidad.' } }];
}
return [{ json: { ok: false, error: 'No se pudo guardar la cita (Firestore ' + (r.statusCode ?? 'sin respuesta') + ').' } }];`
    },
    position: [1320, -100]
  },
  output: [{ ok: true, citaId: 'abc' }]
});

const rechazada = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Reserva rechazada',
    parameters: {
      mode: 'manual',
      includeOtherFields: false,
      assignments: {
        assignments: [
          { id: 'ok', name: 'ok', value: false, type: 'boolean' },
          { id: 'error', name: 'error', value: expr('{{ $json.error }}'), type: 'string' }
        ]
      }
    },
    position: [1100, 100]
  },
  output: [{ ok: false, error: 'x' }]
});

export default workflow('barberflow-crear-cita', 'BarberFlow – Crear cita')
  .add(entrada)
  .to(consultar)
  .to(citasCliente)
  .to(validar)
  .to(sePuede.onTrue(guardar.to(resultado)).onFalse(rechazada));
