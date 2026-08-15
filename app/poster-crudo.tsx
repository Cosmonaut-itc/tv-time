import type { TituloDeSala } from "./cartelera";
import { renglonesDeTitulo } from "./poster-crudo-logica";

const PRIMER_RENGLON = 358;
const ALTO_DE_RENGLON = 23;

export default function PosterCrudo({ titulo }: { titulo: TituloDeSala }) {
  const renglones = renglonesDeTitulo(titulo.nombre);
  const anio = PRIMER_RENGLON + renglones.length * ALTO_DE_RENGLON + 7;
  return (
    <svg viewBox="0 0 300 450" aria-hidden="true" focusable="false">
      <rect width="300" height="450" fill="#1E1014" />
      <circle cx="150" cy="175" r="82" fill="none" stroke="#C9A227" strokeWidth="2" />
      <path d="M52 330 H248" stroke="#8A6F1C" strokeWidth="3" />
      {renglones.map((renglon, indice) => (
        <text
          key={`${indice}-${renglon}`}
          x="150"
          y={PRIMER_RENGLON + indice * ALTO_DE_RENGLON}
          textAnchor="middle"
          fill="#F2E5C6"
          fontSize="18"
        >
          {renglon}
        </text>
      ))}
      {titulo.anio && (
        <text x="150" y={anio} textAnchor="middle" fill="#9A8E75" fontSize="14">
          {titulo.anio}
        </text>
      )}
    </svg>
  );
}
