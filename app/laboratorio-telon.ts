export function demoraTelon(
  valor = process.env.TELON_DEMORA_MS
): number {
  if (valor === undefined || valor === "") return 0;
  const ms = Number(valor);
  if (!Number.isInteger(ms) || ms < 0 || ms > 5000) {
    throw new Error(`TELON_DEMORA_MS inválida: ${valor}`);
  }
  return ms;
}
