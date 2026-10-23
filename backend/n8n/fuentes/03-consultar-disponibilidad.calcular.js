// Mismas reglas que la web (schedule.ts): turnos de 30 min, el servicio debe terminar dentro del tramo,
// sin cupos ocupados (citas_slots), sin bloqueos del barbero y sin horas que ya pasaron.
const ZONA = 'America/Bogota';
const TURNO = 30;
const MAX_DIAS = 30;

const val = (v) => {
  if (v == null) return undefined;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(val);
  if ('mapValue' in v) return Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k, x]) => [k, val(x)]));
  if ('integerValue' in v) return Number(v.integerValue);
  if ('nullValue' in v) return null;
  return v.stringValue ?? v.doubleValue ?? v.booleanValue ?? v.timestampValue;
};
const docs = (nodo) =>
  ($(nodo).first().json.documents || []).map((d) => ({
    id: d.name.split('/').pop(),
    ...Object.fromEntries(Object.entries(d.fields || {}).map(([k, v]) => [k, val(v)])),
  }));
const norm = (s) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const VACIAS = ['y', 'con', 'de', 'del', 'el', 'la', 'los', 'las', 'un', 'una', 'mas'];
const palabras = (s) => norm(s).replace(/[^a-z0-9]+/g, ' ').split(' ').filter((p) => p && !VACIAS.includes(p));
const porOrden = (a, b) => (a.orden ?? 99) - (b.orden ?? 99);
// Busca por id, por nombre exacto o porque todas las palabras pedidas están en el nombre/id ("corte y barba" -> "Corte + Barba").
const buscar = (lista, q) => {
  const n = norm(q);
  const pedidas = palabras(q);
  if (!n || !pedidas.length) return null;
  return (
    lista.find((x) => norm(x.id) === n) ||
    lista.find((x) => norm(x.nombre) === n) ||
    lista.find((x) => { const p = [...palabras(x.nombre), ...palabras(x.id)]; return pedidas.every((w) => p.includes(w)); }) ||
    lista.find((x) => norm(x.nombre).includes(n)) ||
    null
  );
};

const entrada = $('Entrada: fecha, servicio y barbero').first().json;
const ahora = DateTime.now().setZone(ZONA);
const servicios = docs('Leer servicios').filter((s) => s.activo !== false).sort(porOrden);
const barberos = docs('Leer barberos').filter((b) => b.activo !== false).sort(porOrden);
const catalogo = {
  servicios: servicios.map((s) => ({ id: s.id, nombre: s.nombre, duracionMin: s.duracionMin, precio: s.precio })),
  barberos: barberos.map((b) => ({ id: b.id, nombre: b.nombre, servicioIds: b.servicioIds || [] })),
};
const fallo = (error) => [{ json: { ok: false, error, ...catalogo } }];

const servicio = buscar(servicios, entrada.servicio);
if (!servicio) {
  return fallo(entrada.servicio ? 'No encontré el servicio "' + entrada.servicio + '". Elige uno del catálogo.' : 'Falta el servicio. Elige uno del catálogo.');
}
let candidatos = barberos.filter((b) => (b.servicioIds || []).includes(servicio.id));
if (String(entrada.barbero ?? '').trim()) {
  const b = buscar(candidatos, entrada.barbero);
  if (!b) return fallo('El barbero "' + entrada.barbero + '" no existe o no hace ' + servicio.nombre + '.');
  candidatos = [b];
}

const fecha = String(entrada.fecha ?? '').trim();
if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return fallo('La fecha debe tener formato yyyy-MM-dd.');
const dia = DateTime.fromISO(fecha, { zone: ZONA });
if (!dia.isValid) return fallo('La fecha ' + fecha + ' no es válida.');
if (dia < ahora.startOf('day')) return fallo('Esa fecha ya pasó.');
if (dia > ahora.startOf('day').plus({ days: MAX_DIAS })) return fallo('Solo se agenda hasta ' + MAX_DIAS + ' días adelante.');

const ocupados = new Set(
  $('Leer cupos del día').all().map((i) => i.json.document).filter(Boolean).map((d) => d.name.split('/').pop()),
);
const bloqueos = docs('Leer bloqueos').map((b) => ({ barberoId: b.barberoId, inicio: DateTime.fromISO(b.inicio), fin: DateTime.fromISO(b.fin) }));
const aMin = (t) => { const [h, m] = String(t).split(':').map(Number); return h * 60 + m; };
const aHora = (m) => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
const claveDia = String(dia.weekday % 7); // horarioSemanal usa 0 = domingo … 6 = sábado
const dur = Number(servicio.duracionMin) || TURNO;

const disponibilidad = candidatos.map((b) => {
  const horas = [];
  for (const { desde, hasta } of (b.horarioSemanal || {})[claveDia] || []) {
    for (let t = aMin(desde); t + dur <= aMin(hasta); t += TURNO) {
      const inicio = dia.set({ hour: Math.floor(t / 60), minute: t % 60 });
      if (inicio <= ahora) continue;
      const celdas = Array.from({ length: Math.ceil(dur / TURNO) }, (_, i) => b.id + '_' + fecha + '_' + aHora(t + i * TURNO).replace(':', ''));
      if (celdas.some((c) => ocupados.has(c))) continue;
      const fin = inicio.plus({ minutes: dur });
      if (bloqueos.some((x) => x.barberoId === b.id && x.inicio < fin && x.fin > inicio)) continue;
      horas.push(aHora(t));
    }
  }
  return { barberoId: b.id, barberoNombre: b.nombre, horas };
});

return [{
  json: {
    ok: true,
    fecha,
    fechaTexto: dia.setLocale('es').toFormat("cccc d 'de' LLLL"),
    hayCupos: disponibilidad.some((d) => d.horas.length > 0),
    servicio: { id: servicio.id, nombre: servicio.nombre, duracionMin: dur, precio: servicio.precio },
    disponibilidad,
    ...catalogo,
  },
}];