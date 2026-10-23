import { workflow, node, trigger, ifElse, switchCase, languageModel, memory, tool, expr } from '@n8n/workflow-sdk';

// Ajustes del workflow que el SDK no fija (se aplican con update_workflow → setWorkflowSettings):
// timezone America/Bogota, executionTimeout 90 s (Gemini saturado no deja la ejecución colgada)
// y saveDataSuccessExecution "none" (Evolution manda su apikey en el cuerpo del webhook).

const EVOLUTION = 'http://evolution:8080';
const evolution = { httpHeaderAuth: { id: 'kSbBkQdGat4M77BE', name: 'evolution' } };
const gemini = { googlePalmApi: { id: 'yJlJHUjyklBA42Ha', name: 'Gemini' } };
const MODELO = 'models/gemini-flash-latest';
const C_FECHA = { id: 'fecha', displayName: 'fecha', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'string' };
const C_SERVICIO = { id: 'servicio', displayName: 'servicio', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'string' };
const C_BARBERO = { id: 'barbero', displayName: 'barbero', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'string' };
const C_TELEFONO = { id: 'telefono', displayName: 'telefono', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'string' };
const C_CLIENTENOMBRE = { id: 'clienteNombre', displayName: 'clienteNombre', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'string' };
const C_HORA = { id: 'hora', displayName: 'hora', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'string' };
const C_CITAID = { id: 'citaId', displayName: 'citaId', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'string' };
const C_NUMERO = { id: 'numero', displayName: 'numero', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'string' };
const C_TEXTO = { id: 'texto', displayName: 'texto', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'string' };
const WF_CONSULTAR = { __rl: true, mode: 'id', value: 'xSSYOcWjlEE46jGg', cachedResultName: 'BarberFlow – Consultar disponibilidad' };
const WF_CREAR = { __rl: true, mode: 'id', value: 'KwsrRqQVA2sMwB5u', cachedResultName: 'BarberFlow – Crear cita' };
const WF_CANCELAR = { __rl: true, mode: 'id', value: 'jJ39b81XFOYdVyVk', cachedResultName: 'BarberFlow – Cancelar cita' };
const WF_ENVIAR = { __rl: true, mode: 'id', value: 'rb3g0zW5WUW0e65C', cachedResultName: 'BarberFlow – Enviar WhatsApp' };
const TELEFONO = "={{ $('Mensaje para el agente').first().json.telefono }}";

const webhook = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.2,
  config: {
    name: 'Mensaje de Evolution',
    parameters: { httpMethod: 'POST', path: 'barberflow/whatsapp', responseMode: 'onReceived', options: {} },
    position: [0, 300]
  },
  output: [{ body: { event: 'messages.upsert', instance: 'asistente', data: { key: { remoteJid: '573000000000@s.whatsapp.net', fromMe: false, id: 'ABC' }, pushName: 'Ana', messageType: 'conversation', message: { conversation: 'Hola' } } } }]
});

const normalizar = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Normalizar mensaje',
    parameters: {
      mode: 'runOnceForEachItem',
      jsCode: `// Evento MESSAGES_UPSERT de Evolution API v2.
const p = $json.body ?? $json;
const d = p.data ?? {};
const key = d.key ?? {};
const jid = String(key.remoteJid ?? '');
// Con direcciones @lid, el número real viene en remoteJidAlt / senderPn.
const jidTelefono = [jid, key.remoteJidAlt, key.senderPn].map((x) => String(x ?? '')).find((x) => x.endsWith('@s.whatsapp.net')) ?? '';
const telefono = jidTelefono.split('@')[0].split(':')[0].replace(/\\D/g, '');
const m = d.message ?? {};
const tipo = String(d.messageType ?? Object.keys(m)[0] ?? '');

let motivo = '';
if (String(p.event ?? 'messages.upsert').toLowerCase().replace('_', '.') !== 'messages.upsert') motivo = 'evento ' + p.event;
else if (p.instance && p.instance !== 'asistente') motivo = 'otra instancia';
else if (key.fromMe === true) motivo = 'mensaje propio (fromMe)';
else if (jid.endsWith('@g.us') || jid.endsWith('@broadcast') || jid.endsWith('@newsletter')) motivo = 'grupo o difusión';
else if (!/^\\d{8,15}$/.test(telefono)) motivo = 'sin número de teléfono';

return {
  json: {
    procesar: !motivo,
    motivo,
    telefono,
    nombre: String(d.pushName ?? '').trim(),
    tipo,
    texto: String(m.conversation ?? m.extendedTextMessage?.text ?? '').trim(),
    audioSegundos: Number(m.audioMessage?.seconds ?? 0),
    messageId: String(key.id ?? ''),
  },
};`
    },
    position: [220, 300]
  },
  output: [{ procesar: true, motivo: '', telefono: '573000000000', nombre: 'Ana', tipo: 'conversation', texto: 'Hola', audioSegundos: 0, messageId: 'ABC' }]
});

const soloClientes = node({
  type: 'n8n-nodes-base.filter',
  version: 2.2,
  config: {
    name: 'Solo mensajes de clientes',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
        conditions: [{ leftValue: expr('{{ $json.procesar }}'), operator: { type: 'boolean', operation: 'true', singleValue: true } }],
        combinator: 'and'
      },
      options: {}
    },
    position: [440, 300]
  },
  output: [{ procesar: true, telefono: '573000000000', tipo: 'conversation', texto: 'Hola' }]
});

const tipoMensaje = switchCase({
  version: 3.2,
  config: {
    name: 'Tipo de mensaje',
    parameters: {
      rules: {
        values: [
          {
            outputKey: 'texto',
            conditions: {
              options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
              conditions: [
                { leftValue: expr('{{ $json.tipo }}'), rightValue: 'conversation', operator: { type: 'string', operation: 'equals' } },
                { leftValue: expr('{{ $json.tipo }}'), rightValue: 'extendedTextMessage', operator: { type: 'string', operation: 'equals' } }
              ],
              combinator: 'or'
            },
            renameOutput: true
          },
          {
            outputKey: 'audio',
            conditions: {
              options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
              conditions: [{ leftValue: expr('{{ $json.tipo }}'), rightValue: 'audioMessage', operator: { type: 'string', operation: 'equals' } }],
              combinator: 'and'
            },
            renameOutput: true
          }
        ]
      },
      options: { fallbackOutput: 'extra', renameFallbackOutput: 'otro' }
    },
    position: [660, 300]
  }
});

const audioCorto = ifElse({
  version: 2.2,
  config: {
    name: '¿Audio de 60 s o menos?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' },
        conditions: [{ leftValue: expr('{{ $json.audioSegundos }}'), rightValue: 60, operator: { type: 'number', operation: 'lte' } }],
        combinator: 'and'
      },
      looseTypeValidation: true
    },
    position: [880, 400]
  }
});

const descargarAudio = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Descargar audio de Evolution',
    onError: 'continueErrorOutput',
    parameters: {
      method: 'POST',
      url: EVOLUTION + '/chat/getBase64FromMediaMessage/asistente',
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify({ message: { key: { id: $json.messageId } }, convertToMp4: false }) }}'),
      options: { timeout: 30000 }
    },
    credentials: evolution,
    position: [1100, 340]
  },
  output: [{ mediaType: 'audioMessage', mimetype: 'audio/ogg; codecs=opus', base64: 'T2dnUw==' }]
});

const audioArchivo = node({
  type: 'n8n-nodes-base.convertToFile',
  version: 1.1,
  config: {
    name: 'Audio a archivo',
    onError: 'continueErrorOutput',
    parameters: {
      operation: 'toBinary',
      sourceProperty: 'base64',
      options: { fileName: 'audio.ogg', mimeType: expr('{{ String($json.mimetype ?? "audio/ogg").split(";")[0].trim() }}') }
    },
    position: [1320, 340]
  },
  output: [{ mimetype: 'audio/ogg' }]
});

const transcribir = node({
  type: '@n8n/n8n-nodes-langchain.googleGemini',
  version: 1.2,
  config: {
    name: 'Transcribir audio',
    onError: 'continueRegularOutput',
    retryOnFail: true,
    maxTries: 2,
    waitBetweenTries: 3000,
    parameters: {
      resource: 'audio',
      operation: 'analyze',
      modelId: { __rl: true, mode: 'id', value: MODELO },
      text: 'Transcribe este audio en español, solo el texto',
      inputType: 'binary',
      binaryPropertyName: 'data',
      simplify: true,
      options: { maxOutputTokens: 1000 }
    },
    credentials: gemini,
    position: [1540, 340]
  },
  output: [{ content: { parts: [{ text: 'Quiero un corte mañana a las 3' }] } }]
});

const leerTranscripcion = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Leer transcripción',
    parameters: {
      mode: 'runOnceForEachItem',
      jsCode: `// La respuesta de Gemini cambia de forma según la versión: se busca el primer texto.
const j = $json;
const partes = j.content?.parts ?? j.candidates?.[0]?.content?.parts ?? [];
const texto = String(partes.map((p) => p.text ?? '').join(' ') || j.text || j.output || '').trim();
const fallo = Boolean(j.error) || !texto;
return { json: { transcrito: !fallo, texto: fallo ? '' : texto, error: j.error ? String(j.error.message ?? j.error) : '' } };`
    },
    position: [1760, 340]
  },
  output: [{ transcrito: true, texto: 'Quiero un corte mañana a las 3' }]
});

const transcripcionOk = ifElse({
  version: 2.2,
  config: {
    name: '¿Transcripción válida?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
        conditions: [{ leftValue: expr('{{ $json.transcrito }}'), operator: { type: 'boolean', operation: 'true', singleValue: true } }],
        combinator: 'and'
      }
    },
    position: [1980, 340]
  }
});

const pedirTexto = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Pedir que escriba',
    parameters: {
      mode: 'manual',
      includeOtherFields: false,
      assignments: { assignments: [{ id: 't', name: 'texto', value: 'No pude entender tu audio 🙏 ¿Me escribes tu mensaje, por favor? (Los audios deben durar máximo 60 segundos).', type: 'string' }] }
    },
    position: [2200, 560]
  },
  output: [{ texto: 'No pude entender tu audio' }]
});

const noSoportado = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Tipo no soportado',
    parameters: {
      mode: 'manual',
      includeOtherFields: false,
      assignments: { assignments: [{ id: 't', name: 'texto', value: 'Por ahora solo entiendo mensajes de texto y audios 🙏 Escríbeme o envíame una nota de voz y te ayudo con tu cita 💈', type: 'string' }] }
    },
    position: [880, 640]
  },
  output: [{ texto: 'Solo entiendo texto y audios' }]
});

const paraAgente = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Mensaje para el agente',
    parameters: {
      mode: 'manual',
      includeOtherFields: false,
      assignments: {
        assignments: [
          { id: 'texto', name: 'texto', value: expr('{{ $json.texto }}'), type: 'string' },
          { id: 'tel', name: 'telefono', value: expr("{{ $('Normalizar mensaje').first().json.telefono }}"), type: 'string' },
          { id: 'nom', name: 'nombre', value: expr("{{ $('Normalizar mensaje').first().json.nombre }}"), type: 'string' },
          { id: 'via', name: 'via', value: expr("{{ $('Normalizar mensaje').first().json.tipo === 'audioMessage' ? 'audio' : 'texto' }}"), type: 'string' }
        ]
      }
    },
    position: [2200, 200]
  },
  output: [{ texto: 'Hola', telefono: '573000000000', nombre: 'Ana', via: 'texto' }]
});

const modelo = languageModel({
  type: '@n8n/n8n-nodes-langchain.lmChatGoogleGemini',
  version: 1.2,
  config: {
    name: 'Gemini Flash',
    parameters: { modelName: MODELO, options: { temperature: 0.3, maxOutputTokens: 1024 } },
    credentials: gemini,
    position: [2300, 480]
  }
});

const memoria = memory({
  type: '@n8n/n8n-nodes-langchain.memoryBufferWindow',
  version: 1.4,
  config: {
    name: 'Memoria por teléfono',
    parameters: { sessionIdType: 'customKey', sessionKey: TELEFONO, contextWindowLength: 12 },
    position: [2440, 480]
  }
});

const consultarTool = tool({
  type: '@n8n/n8n-nodes-langchain.toolWorkflow',
  version: 2.2,
  config: {
    name: 'consultar_disponibilidad',
    parameters: {
      description: 'Consulta el catálogo y las horas libres. Devuelve servicios (id, nombre, duración, precio), barberos y, si das servicio y fecha, las horas libres de cada barbero ese día. Llámala con servicio vacío para conocer el catálogo.',
      source: 'database',
      workflowId: WF_CONSULTAR,
      workflowInputs: {
        mappingMode: 'defineBelow',
        value: {
          fecha: "={{ $fromAI('fecha', 'Día a consultar en formato yyyy-MM-dd (calcúlalo desde la fecha actual del mensaje)', 'string') }}",
          servicio: "={{ $fromAI('servicio', 'id o nombre del servicio; vacío para ver el catálogo', 'string') }}",
          barbero: "={{ $fromAI('barbero', 'id o nombre del barbero; vacío para ver todos los barberos', 'string') }}"
        },
        matchingColumns: [],
        schema: [C_FECHA, C_SERVICIO, C_BARBERO],
        attemptToConvertTypes: false,
        convertFieldsToString: true
      }
    },
    position: [2580, 480]
  }
});

const crearTool = tool({
  type: '@n8n/n8n-nodes-langchain.toolWorkflow',
  version: 2.2,
  config: {
    name: 'crear_cita',
    parameters: {
      description: 'Crea y confirma la cita. Úsala solo después de que el cliente confirme el resumen. El teléfono se toma solo del WhatsApp. Devuelve ok y el resumen, o ok:false con el motivo.',
      source: 'database',
      workflowId: WF_CREAR,
      workflowInputs: {
        mappingMode: 'defineBelow',
        value: {
          telefono: TELEFONO,
          clienteNombre: "={{ $fromAI('clienteNombre', 'Nombre del cliente para la cita', 'string') }}",
          servicio: "={{ $fromAI('servicio', 'id del servicio (de consultar_disponibilidad)', 'string') }}",
          barbero: "={{ $fromAI('barbero', 'id del barbero (de consultar_disponibilidad)', 'string') }}",
          fecha: "={{ $fromAI('fecha', 'Fecha en formato yyyy-MM-dd', 'string') }}",
          hora: "={{ $fromAI('hora', 'Hora de inicio en formato HH:mm (24 h)', 'string') }}"
        },
        matchingColumns: [],
        schema: [C_TELEFONO, C_CLIENTENOMBRE, C_SERVICIO, C_BARBERO, C_FECHA, C_HORA],
        attemptToConvertTypes: false,
        convertFieldsToString: true
      }
    },
    position: [2720, 480]
  }
});

const cancelarTool = tool({
  type: '@n8n/n8n-nodes-langchain.toolWorkflow',
  version: 2.2,
  config: {
    name: 'cancelar_cita',
    parameters: {
      description: 'Sin citaId: lista las citas próximas de este cliente. Con citaId: cancela esa cita (solo después de que el cliente confirme). Solo funciona con citas del número que escribe.',
      source: 'database',
      workflowId: WF_CANCELAR,
      workflowInputs: {
        mappingMode: 'defineBelow',
        value: {
          telefono: TELEFONO,
          citaId: "={{ $fromAI('citaId', 'id de la cita a cancelar; vacío para listar las citas próximas', 'string') }}"
        },
        matchingColumns: [],
        schema: [C_TELEFONO, C_CITAID],
        attemptToConvertTypes: false,
        convertFieldsToString: true
      }
    },
    position: [2860, 480]
  }
});

const enviarTool = tool({
  type: '@n8n/n8n-nodes-langchain.toolWorkflow',
  version: 2.2,
  config: {
    name: 'enviar_whatsapp',
    parameters: {
      description: 'Envía tu respuesta al cliente por WhatsApp. Úsala una sola vez por mensaje del cliente, con la respuesta completa. Solo puede escribirle a este cliente.',
      source: 'database',
      workflowId: WF_ENVIAR,
      workflowInputs: {
        mappingMode: 'defineBelow',
        value: {
          numero: TELEFONO,
          texto: "={{ $fromAI('texto', 'Mensaje completo para el cliente', 'string') }}"
        },
        matchingColumns: [],
        schema: [C_NUMERO, C_TEXTO],
        attemptToConvertTypes: false,
        convertFieldsToString: true
      }
    },
    position: [3000, 480]
  }
});

const SISTEMA = `Eres el asistente de reservas por WhatsApp de BarberFlow, una barbería en Medellín (Colombia).

Cómo hablas
- Español de Colombia, cálido y breve: máximo 4 líneas por mensaje. Emojis con moderación (💈 ✂️ 📅 🕒).
- Para resaltar usa *asteriscos* (formato de WhatsApp), nunca Markdown con ## ni listas largas.
- Si el mensaje llegó por audio, responde normal: ya viene transcrito.

Qué puedes hacer
- Informar servicios, precios y barberos, consultar horas libres, agendar y cancelar citas. Nada más: si preguntan otra cosa, dilo amablemente y ofrece ayuda con su cita.

Herramientas (las únicas fuentes de verdad; nunca inventes servicios, precios, barberos ni horas)
- consultar_disponibilidad: catálogo y horas libres. Úsala antes de proponer horas y siempre que el cliente pregunte por servicios o precios.
- crear_cita: crea la cita. Pásale los id de servicio y barbero que te dio consultar_disponibilidad.
- cancelar_cita: sin citaId lista las citas próximas del cliente; con citaId la cancela.
- enviar_whatsapp: así le respondes al cliente.

Reglas para agendar
1. Necesitas: servicio, barbero (o "el que esté libre"), fecha, hora y el nombre del cliente. Pregunta solo lo que falte; si el nombre de WhatsApp parece real, ofrece usarlo.
2. Convierte fechas relativas ("mañana", "el sábado") usando la fecha actual que viene en cada mensaje. Los domingos no se atiende.
3. Consulta disponibilidad y ofrece máximo 6 horas libres. Si el cliente acepta cualquier barbero, elige uno que tenga esa hora libre.
4. Antes de crear la cita, envía un resumen (servicio, barbero, día, hora, precio) y pide confirmación. Solo con un "sí" claro llama a crear_cita.
5. Si una herramienta responde ok:false, explica el motivo en palabras sencillas y ofrece alternativas.
6. Nunca pidas el número de teléfono: se toma del WhatsApp. No muestres ids internos al cliente.

Reglas para cancelar
- Llama a cancelar_cita sin citaId para ver sus citas, pregunta cuál (si hay varias), pide confirmación y entonces cancela con el citaId.

Cómo terminas cada turno
- Responde al cliente SIEMPRE con la herramienta enviar_whatsapp, una sola vez y con el mensaje completo.
- Después de enviarlo, tu respuesta final debe ser solo la palabra LISTO.`;

const agente = node({
  type: '@n8n/n8n-nodes-langchain.agent',
  version: 3.1,
  config: {
    name: 'Asistente BarberFlow',
    onError: 'continueErrorOutput',
    retryOnFail: true,
    maxTries: 2,
    waitBetweenTries: 3000,
    parameters: {
      promptType: 'define',
      text: expr('Fecha y hora actual en Bogotá: {{ $now.setZone("America/Bogota").setLocale("es").toFormat("cccc d \'de\' LLLL yyyy, HH:mm") }} (hoy = {{ $now.setZone("America/Bogota").toFormat("yyyy-MM-dd") }}).\nNombre de WhatsApp del cliente: {{ $json.nombre || "desconocido" }}.\nEl mensaje llegó por {{ $json.via }}.\n\nMensaje del cliente:\n{{ $json.texto }}'),
      options: { systemMessage: SISTEMA, maxIterations: 8, returnIntermediateSteps: true }
    },
    subnodes: { model: modelo, memory: memoria, tools: [consultarTool, crearTool, cancelarTool, enviarTool] },
    position: [2440, 200]
  },
  output: [{ output: 'LISTO', intermediateSteps: [] }]
});

const yaRespondio = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: '¿El agente ya respondió?',
    parameters: {
      mode: 'runOnceForEachItem',
      jsCode: `// Si el agente no usó enviar_whatsapp (o falló), se envía su texto final para que el cliente no quede sin respuesta.
const pasos = $json.intermediateSteps ?? [];
const respondio = pasos.some((p) => (p.action?.tool ?? '') === 'enviar_whatsapp' && !String(JSON.stringify(p.observation ?? '')).includes('"ok":false'));
const salida = String($json.output ?? '').trim();
const texto = salida && !/^listo[.!]?$/i.test(salida) ? salida : 'Disculpa, no te entendí bien 🙏 ¿Me lo repites?';
return { json: { enviar: !respondio, texto } };`
    },
    position: [2700, 120]
  },
  output: [{ enviar: false, texto: '' }]
});

const faltaRespuesta = ifElse({
  version: 2.2,
  config: {
    name: '¿Falta responder?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
        conditions: [{ leftValue: expr('{{ $json.enviar }}'), operator: { type: 'boolean', operation: 'true', singleValue: true } }],
        combinator: 'and'
      }
    },
    position: [2920, 120]
  }
});

const errorAgente = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Error del asistente',
    parameters: {
      mode: 'manual',
      includeOtherFields: false,
      assignments: { assignments: [{ id: 't', name: 'texto', value: 'Tuve un problema para responderte 😕 Inténtalo de nuevo en un momento, por favor.', type: 'string' }] }
    },
    position: [2700, 300]
  },
  output: [{ texto: 'Tuve un problema' }]
});

const enviarRespuesta = node({
  type: 'n8n-nodes-base.executeWorkflow',
  version: 1.4,
  config: {
    name: 'Enviar respuesta',
    parameters: {
      source: 'database',
      workflowId: WF_ENVIAR,
      mode: 'each',
      workflowInputs: {
        mappingMode: 'defineBelow',
        value: { numero: "={{ $('Normalizar mensaje').first().json.telefono }}", texto: '={{ $json.texto }}' },
        matchingColumns: [],
        schema: [C_NUMERO, C_TEXTO],
        attemptToConvertTypes: false,
        convertFieldsToString: true
      },
      options: { waitForSubWorkflow: true }
    },
    position: [3160, 300]
  },
  output: [{ ok: true }]
});

export default workflow('barberflow-chatbot', 'BarberFlow – Chatbot WhatsApp')
  .add(webhook)
  .to(normalizar)
  .to(soloClientes)
  .to(tipoMensaje
    .onCase(0, paraAgente)
    .onCase(1, audioCorto
      .onTrue(descargarAudio.onError(pedirTexto))
      .onFalse(pedirTexto))
    .onCase(2, noSoportado))
  .add(descargarAudio)
  .to(audioArchivo.onError(pedirTexto))
  .add(audioArchivo)
  .to(transcribir)
  .to(leerTranscripcion)
  .to(transcripcionOk.onTrue(paraAgente).onFalse(pedirTexto))
  .add(paraAgente)
  .to(agente.onError(errorAgente))
  .add(agente)
  .to(yaRespondio)
  .to(faltaRespuesta.onTrue(enviarRespuesta))
  .add(errorAgente)
  .to(enviarRespuesta)
  .add(pedirTexto)
  .to(enviarRespuesta)
  .add(noSoportado)
  .to(enviarRespuesta)
  .group('Recibir y filtrar', [normalizar, soloClientes], { description: 'Lee el evento de Evolution e ignora fromMe, grupos, difusiones y otras instancias.' });
