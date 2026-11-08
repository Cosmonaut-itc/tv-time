import * as THREE from "three";
import { GANADOR_ANCHO, GANADOR_ALTO } from "./medidas.ts";
import { destruirGrupo } from "./recursos.ts";

// ColorManagement de la sala está desactivado; el prototipo usa colores lineales.
function colorLineal(hex: string) {
  return new THREE.Color().setHex(Number.parseInt(hex.slice(1), 16), THREE.LinearSRGBColorSpace).convertSRGBToLinear();
}

/** Moldura del cartel, independiente de su lámina y del escenario que lo aloja. */
export function crearMarco(renderizador: THREE.WebGLRenderer) {
  const ANCHO = GANADOR_ANCHO, ALTO = GANADOR_ALTO;
  function entorno() {
    const W = 1024, H = 512;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d')!;
    const g = x.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#6e5236'); g.addColorStop(0.45, '#3a2618'); g.addColorStop(0.6, '#24120f'); g.addColorStop(1, '#521828');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    const elipse = (u: number, v: number, rx: number, ry: number, color: string, a = 1) => {
      x.save(); x.translate(u * W, (1 - v) * H); x.scale(1, ry / rx);
      const rg = x.createRadialGradient(0, 0, 0, 0, 0, rx);
      rg.addColorStop(0, color); rg.addColorStop(0.55, color); rg.addColorStop(1, 'rgba(0,0,0,0)');
      x.globalAlpha = a; x.fillStyle = rg; x.fillRect(-rx, -rx, rx * 2, rx * 2); x.restore();
    };
    // +Z (hacia el público) cae en u = 0.75.
    elipse(0.75, 0.56, 250, 150, '#f0cf8e');            // la luz de la cabina, ancha
    elipse(0.75, 0.60, 90, 60, '#fff3da');              // su núcleo
    [0, 0.5, 1].forEach(u => elipse(u, 0.55, 140, 120, '#b0702c', 0.6)); // reflejos laterales
    elipse(0.75, 0.12, 260, 90, '#7a1a30', 0.9);        // el terciopelo del suelo
    x.fillStyle = '#24120c';                             // dos sombras que dan contraste al barrer
    x.fillRect(0.75 * W - 8, (1 - 0.75) * H, 16, 150);
    x.fillRect(0.75 * W - 150, (1 - 0.47) * H, 300, 10);
    x.fillStyle = '#fff6e2';                             // tiras crema: los filos nítidos
    x.fillRect(0.75 * W - 150, (1 - 0.80) * H, 300, 9);
    x.fillRect(0.75 * W - 200, (1 - 0.72) * H, 8, 120);
    x.fillRect(0.75 * W + 190, (1 - 0.74) * H, 8, 130);
    const t = new THREE.CanvasTexture(c);
    t.mapping = THREE.EquirectangularReflectionMapping;
    t.colorSpace = THREE.SRGBColorSpace;
    const pm = new THREE.PMREMGenerator(renderizador);
    try {
      return pm.fromEquirectangular(t);
    } finally {
      t.dispose(); pm.dispose();
    }
  }
  const destino = entorno();
  const env = destino.texture;

  /* ── El marco NUEVO: una moldura barrida por un perfil ───────────────
     El perfil va de adentro hacia afuera, en unidades del cartel (el póster
     mide 1.86 × 2.79). Total: 0.13 de ancho y 0.053 de alto, contra 0.15 ×
     0.11 del octágono extruido. De adentro hacia afuera:
       laca negra · contrafilo · junquillo · media caña · filete bajo ·
       escalón · banda · junquillo · repisa · canto.
     Cada tramo es una arista viva con el siguiente; dentro de las curvas la
     normal se suaviza. Las esquinas son ingletes, como un marco de madera
     de verdad: la normal cambia en la diagonal y el brillo lo dibuja. */
  const S = 1.2;
  const arco = (cx: number, cz: number, rad: number, a0: number, a1: number, n: number) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return [cx + rad * Math.cos(a), cz + rad * Math.sin(a)]; });
  const PERFIL = [
    { m: 1, p: [[-0.020, 0.003], [0, 0.003]] },
    { m: 0, p: [[0, 0.003], [0, 0.010]] },
    { m: 0, p: arco(0.007, 0.010, 0.007, Math.PI, 0, 10) },
    { m: 0, p: [[0.014, 0.010], [0.017, 0.006]] },
    { m: 0, p: [[0.017, 0.006], [0.020, 0.010]] },
    { m: 0, p: arco(0.020, 0.030, 0.020, -Math.PI / 2, 0, 12) },
    { m: 0, p: [[0.040, 0.030], [0.052, 0.030]] },
    { m: 0, p: [[0.052, 0.030], [0.052, 0.036]] },
    { m: 0, p: [[0.052, 0.036], [0.084, 0.036]] },
    { m: 0, p: arco(0.091, 0.036, 0.007, Math.PI, 0, 10) },
    { m: 0, p: [[0.098, 0.036], [0.098, 0.026]] },
    { m: 0, p: [[0.098, 0.026], [0.106, 0.026]] },
    { m: 0, p: [[0.106, 0.026], [0.106, 0.0]] },
  ].map(c => ({ m: c.m, p: c.p.map(([px, pz]) => [px * S, pz * S]) }));

  function chaflan(w: number, h: number, cc: number) {
    const a = w / 2, b = h / 2;
    return [[-a + cc, -b], [a - cc, -b], [a, -b + cc], [a, b - cc], [a - cc, b], [-a + cc, b], [-a, b - cc], [-a, -b + cc]];
  }
  function barrer(camino: number[][], perfil: { m: number; p: number[][] }[]) {
    const N = camino.length;
    const ns = camino.map((p, i) => {
      const q = camino[(i + 1) % N]; const ex = q[0] - p[0], ey = q[1] - p[1]; const l = Math.hypot(ex, ey);
      return [ey / l, -ex / l];
    });
    const ms = camino.map((_, i) => {
      const a = ns[(i - 1 + N) % N], b = ns[i]; const d = 1 + a[0] * b[0] + a[1] * b[1];
      return [(a[0] + b[0]) / d, (a[1] + b[1]) / d];
    });
    const largo = [0]; for (let i = 0; i < N; i++) { const p = camino[i], q = camino[(i + 1) % N]; largo.push(largo[i] + Math.hypot(q[0] - p[0], q[1] - p[1])); }
    const pos: number[] = [], nor: number[] = [], uv: number[] = [], porMaterial: number[][] = [[], []];
    let v0 = 0;
    for (const corrida of perfil) {
      const pts = corrida.p;
      const segN = pts.slice(0, -1).map((p, j) => { const q = pts[j + 1]; const tx = q[0] - p[0], tz = q[1] - p[1]; const l = Math.hypot(tx, tz); return [-tz / l, tx / l]; });
      const n2 = pts.map((_, j) => { const a = segN[Math.max(0, j - 1)], b = segN[Math.min(segN.length - 1, j)]; const nx = a[0] + b[0], nz = a[1] + b[1]; const l = Math.hypot(nx, nz); return [nx / l, nz / l]; });
      const vs = [v0]; for (let j = 1; j < pts.length; j++) vs.push(vs[j - 1] + Math.hypot(pts[j][0] - pts[j - 1][0], pts[j][1] - pts[j - 1][1]));
      for (let i = 0; i < N; i++) {
        const P = camino[i], Q = camino[(i + 1) % N], mP = ms[i], mQ = ms[(i + 1) % N], n = ns[i];
        const base = pos.length / 3;
        pts.forEach(([px, pz], j) => {
          const nn = n2[j];
          pos.push(P[0] + mP[0] * px, P[1] + mP[1] * px, pz, Q[0] + mQ[0] * px, Q[1] + mQ[1] * px, pz);
          const nx = n[0] * nn[0], ny = n[1] * nn[0], nz = nn[1];
          nor.push(nx, ny, nz, nx, ny, nz);
          uv.push(largo[i] * 4, vs[j] * 4, largo[i + 1] * 4, vs[j] * 4);
        });
        for (let j = 0; j < pts.length - 1; j++) {
          const a = base + j * 2, b = a + 1, c = a + 2, d = a + 3;
          porMaterial[corrida.m].push(a, d, b, a, c, d);
        }
      }
      v0 = vs[vs.length - 1];
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex([...porMaterial[0], ...porMaterial[1]]);
    geo.addGroup(0, porMaterial[0].length, 0);
    geo.addGroup(porMaterial[0].length, porMaterial[1].length, 1);
    return geo;
  }

  /* Latón de verdad: metal puro que sólo vive de lo que refleja, cepillado a
     lo largo de cada tramo de moldura (la anisotropía sigue la u del barrido)
     y con la rugosidad justa para que el brillo sea una banda y no un espejo. */
  const laton = new THREE.MeshPhysicalMaterial({
    color: colorLineal('#dcb35a'), metalness: 1, roughness: 0.28,
    anisotropy: 0.5, envMap: env, envMapIntensity: 1.15,
  });
  const laca = new THREE.MeshPhysicalMaterial({
    color: colorLineal('#0b0507'), metalness: 0, roughness: 0.5,
    clearcoat: 1, clearcoatRoughness: 0.06, envMap: env, envMapIntensity: 0.9,
  });
  /* Sólo estos materiales salen en sRGB. El resto de la sala conserva su
     salida lineal histórica, incluidos los shaders de lámina y telón. */
  for (const material of [laton, laca]) {
    material.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <colorspace_fragment>',
        'gl_FragColor = sRGBTransferOETF(gl_FragColor);',
      );
    };
    material.customProgramCacheKey = () => 'marco-moldura-srgb-v1';
  }
  const CHAFLAN = 0.07;
  const camino = chaflan(ANCHO, ALTO, CHAFLAN);
  const marcoNuevo = new THREE.Group();
  marcoNuevo.add(new THREE.Mesh(barrer(camino, PERFIL), [laton, laca]));
  /* Un rombo de latón en cada inglete: el único adorno, sobre la banda. */
  const latonFacetado = laton.clone(); latonFacetado.flatShading = true; latonFacetado.anisotropy = 0;
  latonFacetado.onBeforeCompile = laton.onBeforeCompile;
  latonFacetado.customProgramCacheKey = laton.customProgramCacheKey;
  const rombo = new THREE.ConeGeometry(0.02 * S, 0.006 * S, 4, 1);
  rombo.rotateX(Math.PI / 2);
  [1, 3, 5, 7].forEach((i) => {
    const p = camino[i], q = camino[(i + 1) % camino.length];
    const ex = q[0] - p[0], ey = q[1] - p[1], l = Math.hypot(ex, ey);
    const nx = ey / l, ny = -ex / l, d = 0.068 * S;
    const m = new THREE.Mesh(rombo, latonFacetado);
    m.position.set((p[0] + q[0]) / 2 + nx * d, (p[1] + q[1]) / 2 + ny * d, 0.036 * S + 0.003 * S);
    m.rotation.z = Math.atan2(ey, ex);
    marcoNuevo.add(m);
  });

  let destruido = false;
  return {
    grupo: marcoNuevo,
    destruir() {
      if (destruido) return;
      destruido = true;
      // El render target es dueño del mapa PMREM; se libera junto con él.
      for (const material of [laton, laca, latonFacetado]) material.envMap = null;
      destruirGrupo(marcoNuevo);
      destino.dispose();
    },
  };
}
