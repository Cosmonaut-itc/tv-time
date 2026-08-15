/* El cangrejito de Claude Code, dibujado como pixel art: diez rectángulos sobre
   una rejilla de 16×12, con `crispEdges` para que los píxeles no se laven al
   escalar. El naranja es el de la marca y por eso no usa `currentColor` — la
   firma se apaga con el resto del pie, la mascota no. La pata del extremo
   derecho queda separada para poder bordar un saludo breve sin mover el dibujo.
   Es decorativa: el nombre ya está escrito al lado, así que el lector de pantalla
   no debe leerla dos veces. */
export default function MascotaClaude() {
  return (
    <svg
      className="mascota-claude"
      viewBox="0 0 16 12"
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
    >
      <g fill="#D97757">
        <rect x="1" y="0" width="14" height="2" />
        <rect x="1" y="2" width="2" height="3" />
        <rect x="4" y="2" width="8" height="3" />
        <rect x="13" y="2" width="2" height="3" />
        <rect x="0" y="5" width="16" height="3" />
        <rect x="1" y="8" width="14" height="1" />
        <rect x="2" y="9" width="1" height="3" />
        <rect x="4" y="9" width="1" height="3" />
        <rect x="11" y="9" width="1" height="3" />
        <rect className="pata-saluda" x="13" y="9" width="1" height="3" />
      </g>
    </svg>
  );
}
