/* Curvas del prototipo, resueltas por Newton con las mismas seis iteraciones. */
function curvaBezier(x1: number, y1: number, x2: number, y2: number) {
  const A = (a: number, b: number) => 1 - 3 * b + 3 * a;
  const B = (a: number, b: number) => 3 * b - 6 * a;
  const C = (a: number) => 3 * a;
  const calc = (t: number, a: number, b: number) => ((A(a, b) * t + B(a, b)) * t + C(a)) * t;
  const pend = (t: number, a: number, b: number) => 3 * A(a, b) * t * t + 2 * B(a, b) * t + C(a);
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 6; i += 1) {
      const d = pend(t, x1, x2);
      if (Math.abs(d) < 1e-6) break;
      t -= (calc(t, x1, x2) - x) / d;
    }
    return calc(t, y1, y2);
  };
}

export const CURVA_CARRETE = curvaBezier(0.12, 0.72, 0.16, 1);   // freno de los carretes
export const CURVA_TELON = curvaBezier(0.66, 0, 0.2, 1);          // la curva de la casa
export const CURVA_SELLO = curvaBezier(0.2, 1.6, 0.4, 1);         // el golpe del sello
