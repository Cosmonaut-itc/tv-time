export { nocheDe, proximoCorte } from "../convex/noche.ts";

type NocheComparable = { corte: number; vetosGastados: number };

export function nocheLocalEsMasReciente(
  remota: NocheComparable | undefined,
  local: NocheComparable | null,
): boolean {
  return Boolean(
    remota &&
      local &&
      local.corte === remota.corte &&
      local.vetosGastados > remota.vetosGastados,
  );
}
