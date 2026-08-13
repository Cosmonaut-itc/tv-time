import type { TituloDeSala } from "./cartelera";

export default function PosterCrudo({ titulo }: { titulo: TituloDeSala }) {
  return (
    <svg viewBox="0 0 300 450" aria-hidden="true" focusable="false">
      <rect width="300" height="450" fill="#1E1014" />
      <circle cx="150" cy="175" r="82" fill="none" stroke="#C9A227" strokeWidth="2" />
      <path d="M52 330 H248" stroke="#8A6F1C" strokeWidth="3" />
      <text x="150" y="360" textAnchor="middle" fill="#F2E5C6" fontSize="18">
        {titulo.nombre.slice(0, 24).toUpperCase()}
      </text>
      {titulo.anio && (
        <text x="150" y="390" textAnchor="middle" fill="#9A8E75" fontSize="14">
          {titulo.anio}
        </text>
      )}
    </svg>
  );
}
