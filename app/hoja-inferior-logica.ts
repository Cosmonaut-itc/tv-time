export function debeCerrarHoja(distancia: number, alto: number, velocidad: number): boolean {
  return distancia > Math.min(150, alto / 3) || (velocidad > 0.5 && distancia > 10);
}

export function resistirArrastre(distancia: number): number {
  return distancia < 0 ? -22 * (1 - Math.exp(distancia / 70)) : distancia;
}
