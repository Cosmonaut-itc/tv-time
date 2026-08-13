export const ALFABETO_CODIGO = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export function generarCodigo(): string {
  return Array.from(
    { length: 6 },
    () => ALFABETO_CODIGO[Math.floor(Math.random() * ALFABETO_CODIGO.length)],
  ).join("");
}

export function normalizarCodigo(codigo: string): string {
  return codigo
    .toUpperCase()
    .replaceAll("I", "1")
    .replaceAll("L", "1")
    .replaceAll("O", "0")
    .replaceAll(" ", "");
}

export function codigoTieneFormatoValido(codigo: string): boolean {
  return codigo.length === 6 && [...codigo].every((caracter) => ALFABETO_CODIGO.includes(caracter));
}
