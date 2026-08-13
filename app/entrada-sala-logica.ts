export function debeOlvidarCodigo(estado: "abierta" | "cerrada" | "trabada"): boolean {
  return estado === "cerrada";
}
