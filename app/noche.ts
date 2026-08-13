const HORA_DE_MEXICO = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Mexico_City",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  hourCycle: "h23",
});

/**
 * Identidad de la noche que contiene un instante. Una noche comienza a las
 * 5:00 a.m. en Ciudad de México y termina justo antes de las 5:00 siguiente.
 */
export function nocheDe(instante: Date | number): string {
  const partes = Object.fromEntries(
    HORA_DE_MEXICO.formatToParts(instante).map(({ type, value }) => [type, value]),
  );
  const anio = Number(partes.year);
  const mes = Number(partes.month);
  const dia = Number(partes.day);

  if (Number(partes.hour) >= 5) {
    return `${partes.year}-${partes.month}-${partes.day}`;
  }

  const anterior = new Date(Date.UTC(anio, mes - 1, dia - 1));
  return anterior.toISOString().slice(0, 10);
}
