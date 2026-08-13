export type TituloDelHistorial = {
  _id: string;
  tipo: "pelicula" | "serie";
  nombre: string;
  anio?: number;
  saga?: string;
  orden?: number;
};

export type FuncionDelHistorial = {
  _id: string;
  fecha: number;
  titulo: TituloDelHistorial;
};

export function mismaFichaDelHistorial(
  anterior: TituloDelHistorial,
  siguiente: TituloDelHistorial,
): boolean {
  return (
    anterior._id === siguiente._id &&
    anterior.tipo === siguiente.tipo &&
    anterior.nombre === siguiente.nombre &&
    anterior.anio === siguiente.anio &&
    anterior.saga === siguiente.saga &&
    anterior.orden === siguiente.orden
  );
}

export function mismaFilaDeFuncion(
  anterior: FuncionDelHistorial,
  siguiente: FuncionDelHistorial,
): boolean {
  return (
    anterior._id === siguiente._id &&
    anterior.fecha === siguiente.fecha &&
    mismaFichaDelHistorial(anterior.titulo, siguiente.titulo)
  );
}

export function formatearFechaDeFuncion(fecha: number): string {
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(fecha));
}
