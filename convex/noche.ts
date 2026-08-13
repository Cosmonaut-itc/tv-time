const HORA_DE_MEXICO = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Mexico_City",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

type FechaCivil = {
  anio: number;
  mes: number;
  dia: number;
  hora: number;
  minuto: number;
  segundo: number;
};

function fechaCivilDe(instante: Date | number): FechaCivil {
  const partes = Object.fromEntries(
    HORA_DE_MEXICO.formatToParts(instante).map(({ type, value }) => [type, value]),
  );
  return {
    anio: Number(partes.year),
    mes: Number(partes.month),
    dia: Number(partes.day),
    hora: Number(partes.hour),
    minuto: Number(partes.minute),
    segundo: Number(partes.second),
  };
}

function instanteDeCorte({
  anio,
  mes,
  dia,
}: Pick<FechaCivil, "anio" | "mes" | "dia">): number {
  const objetivoCivil = Date.UTC(anio, mes - 1, dia, 5);
  let estimado = objetivoCivil;

  // Intl conoce el historial de la zona. Iterar convierte las 05:00 civiles
  // al instante UTC incluso en fechas donde México todavía cambiaba horario.
  for (let intento = 0; intento < 3; intento += 1) {
    const civil = fechaCivilDe(estimado);
    const civilComoUtc = Date.UTC(
      civil.anio,
      civil.mes - 1,
      civil.dia,
      civil.hora,
      civil.minuto,
      civil.segundo,
    );
    const diferencia = objetivoCivil - civilComoUtc;
    if (diferencia === 0) return estimado;
    estimado += diferencia;
  }
  return estimado;
}

/**
 * Identidad de la noche que contiene un instante. Una noche comienza a las
 * 5:00 a.m. en Ciudad de México y termina justo antes de las 5:00 siguiente.
 */
export function nocheDe(instante: Date | number): number {
  const civil = fechaCivilDe(instante);
  if (civil.hora >= 5) return instanteDeCorte(civil);

  const anterior = new Date(Date.UTC(civil.anio, civil.mes - 1, civil.dia - 1));
  return instanteDeCorte({
    anio: anterior.getUTCFullYear(),
    mes: anterior.getUTCMonth() + 1,
    dia: anterior.getUTCDate(),
  });
}

/** Primer corte de las 05:00 de México estrictamente posterior al instante. */
export function proximoCorte(instante: Date | number): number {
  const civil = fechaCivilDe(instante);
  if (civil.hora < 5) return instanteDeCorte(civil);

  const siguiente = new Date(Date.UTC(civil.anio, civil.mes - 1, civil.dia + 1));
  return instanteDeCorte({
    anio: siguiente.getUTCFullYear(),
    mes: siguiente.getUTCMonth() + 1,
    dia: siguiente.getUTCDate(),
  });
}
