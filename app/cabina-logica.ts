const ADVERTENCIA_CODIGO_NO_GUARDADO =
  "Este navegador no pudo guardar el código nuevo. Anótenlo antes de cerrar.";

export function advertenciaTrasGuardarCodigo(guardado: boolean): string | null {
  return guardado ? null : ADVERTENCIA_CODIGO_NO_GUARDADO;
}
