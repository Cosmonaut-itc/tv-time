import { setTimeout as esperar } from "node:timers/promises";
import Diagnostico from "./diagnostico-telon";
import { demoraTelon } from "./laboratorio-telon";

export const dynamic = "force-dynamic";

export default async function Page() {
  const demora = demoraTelon();
  if (demora > 0) await esperar(demora);
  return <Diagnostico />;
}
