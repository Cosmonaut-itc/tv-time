export type FichaMapeada = { sinopsis?: string; calificacion?: number };

export type FichaCruda = {
  overview?: unknown;
  vote_average?: unknown;
  vote_count?: unknown;
};

export function mapearFicha(respuesta: unknown): FichaMapeada {
  if (typeof respuesta !== "object" || respuesta === null || Array.isArray(respuesta)) {
    throw new Error("Respuesta inválida de TMDB.");
  }
  const { overview, vote_average, vote_count } = respuesta as FichaCruda;
  const sinopsis = typeof overview === "string" ? overview.trim() : "";
  const conVotos = typeof vote_count === "number" && vote_count > 0;
  return {
    ...(sinopsis ? { sinopsis } : {}),
    ...(conVotos && typeof vote_average === "number" && Number.isFinite(vote_average)
      ? { calificacion: Math.round(vote_average * 10) / 10 }
      : {}),
  };
}
