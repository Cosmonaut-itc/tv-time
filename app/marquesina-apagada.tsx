export default function MarquesinaApagada({
  rotulo,
  linea,
  onAgregar,
}: {
  rotulo: string;
  linea: string;
  onAgregar?: () => void;
}) {
  return (
    <section className="marquesina-apagada" aria-label="Sala sin títulos">
      <div className="telon izq" aria-hidden="true" />
      <div className="telon der" aria-hidden="true" />
      <div className="marquesina-apagada__interior">
        <p className="etiqueta-entrada">{rotulo}</p>
        <p>{linea}</p>
        {/* 018 conecta este botón con el cajón del alta. */}
        <button className="btn-palanca" type="button" disabled={!onAgregar} onClick={onAgregar}>
          Agregar títulos
        </button>
      </div>
    </section>
  );
}
