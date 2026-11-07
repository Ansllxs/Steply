// Utilidades de fechas "de calendario".
//
// Internamente todas las fechas de día se manejan como texto 'YYYY-MM-DD'.
// Así se evitan los errores típicos de zona horaria con objetos Date. Prisma
// devuelve las columnas DATE como Date a medianoche UTC; aTexto() y aDate()
// convierten entre ambos formatos.

const MS_DIA = 86_400_000;
const PATRON = /^\d{4}-\d{2}-\d{2}$/;

/** Date (medianoche UTC) o 'YYYY-MM-DD' → 'YYYY-MM-DD'. */
export function aTexto(fecha) {
  if (fecha == null) return null;
  if (typeof fecha === 'string') {
    if (!esFechaValida(fecha)) throw new TypeError(`Fecha inválida: ${fecha}`);
    return fecha;
  }
  if (fecha instanceof Date && !Number.isNaN(fecha.getTime())) {
    return fecha.toISOString().slice(0, 10);
  }
  throw new TypeError(`Fecha inválida: ${fecha}`);
}

/** 'YYYY-MM-DD' (o Date) → Date a medianoche UTC, para guardar en columnas DATE. */
export function aDate(fecha) {
  if (fecha == null) return null;
  return new Date(`${aTexto(fecha)}T00:00:00.000Z`);
}

export function esFechaValida(texto) {
  if (typeof texto !== 'string' || !PATRON.test(texto)) return false;
  const d = new Date(`${texto}T00:00:00.000Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === texto;
}

/** Día de hoy en la zona horaria IANA indicada. */
export function hoyEn(zonaHoraria = 'America/Costa_Rica', ahora = new Date()) {
  // en-CA formatea como YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: zonaHoraria,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(ahora);
}

export function sumarDias(fecha, dias) {
  return new Date(aDate(fecha).getTime() + dias * MS_DIA).toISOString().slice(0, 10);
}

/** Días de diferencia b - a. */
export function diferenciaDias(a, b) {
  return Math.round((aDate(b).getTime() - aDate(a).getTime()) / MS_DIA);
}

/** Día ISO de la semana: 1 = lunes ... 7 = domingo. */
export function diaSemanaIso(fecha) {
  const d = aDate(fecha).getUTCDay(); // 0 = domingo
  return d === 0 ? 7 : d;
}

/** Lunes de la semana a la que pertenece la fecha. */
export function inicioSemana(fecha) {
  return sumarDias(fecha, 1 - diaSemanaIso(fecha));
}

export function maxFecha(...fechas) {
  return fechas.filter(Boolean).map(aTexto).sort().at(-1) ?? null;
}

export function minFecha(...fechas) {
  return fechas.filter(Boolean).map(aTexto).sort()[0] ?? null;
}

/** Itera día por día de desde a hasta (ambos inclusive). */
export function* rangoDias(desde, hasta) {
  if (!desde || !hasta) return;
  for (let d = aTexto(desde); d <= aTexto(hasta); d = sumarDias(d, 1)) yield d;
}

/** Primer y último día de un mes (mes 1-12). */
export function limitesMes(anio, mes) {
  const inicio = `${anio}-${String(mes).padStart(2, '0')}-01`;
  const fin = sumarDias(
    `${mes === 12 ? anio + 1 : anio}-${String(mes === 12 ? 1 : mes + 1).padStart(2, '0')}-01`,
    -1,
  );
  return { inicio, fin };
}
