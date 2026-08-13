type EstadoConexionSala = {
  isWebSocketConnected: boolean;
  hasEverConnected: boolean;
};

type EstadoRecargaSala = {
  navegadorEnLinea: boolean;
  recargaYaSolicitada: boolean;
  salaYaLlego: boolean;
};

export function decidirLlegadaSala(
  yaLlego: boolean,
  conexion: EstadoConexionSala,
): boolean {
  return (
    yaLlego || conexion.isWebSocketConnected || conexion.hasEverConnected
  );
}

export function decidirRecargaSala(estado: EstadoRecargaSala): boolean {
  return (
    estado.navegadorEnLinea &&
    !estado.recargaYaSolicitada &&
    !estado.salaYaLlego
  );
}
