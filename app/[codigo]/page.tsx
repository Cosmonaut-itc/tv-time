import EntradaSala from "../entrada-sala";

export default async function EntradaPorCodigo({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;
  return <EntradaSala codigoCompartido={codigo} />;
}
