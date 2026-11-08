import * as THREE from "three";
import { destruirGrupo } from "./recursos.ts";
import { CELDAS, LARGO_CINTA, RODILLO, POSTER_ANCHO, POSTER_ALTO, SEPARACION, ESCALA_TAMBOR, FRENTE_Z, ALTURA_CINTA, LATON } from "./medidas.ts";
import { TEX_HALO, texturaDe, lienzoTira } from "./texturas.ts";
import { CURVA_CARRETE } from "./curvas.ts";
import { desfaseDeCinta, brilloDeCinta, type tiras3D } from "./logica.ts";

/* La cinta en el plano YZ, por longitud de arco desde el centro del frente:
   sube por el frente, da la vuelta al rodillo de arriba, baja por detrás y
   vuelve por el de abajo. `u` crece hacia arriba en el frente, como el
   ángulo del tambor, así que la tira se lee igual que en el cilindro. */
function geometriaCinta() {
  const L = LARGO_CINTA, r = RODILLO, total = POSTER_ALTO * CELDAS;
  const punto = (s: number): [number, number, number, number] => {
    if (s <= L / 2) return [s, 0, 0, 1];
    s -= L / 2;
    if (s <= Math.PI * r) { const a = s / r; return [L / 2 + r * Math.sin(a), -r + r * Math.cos(a), Math.sin(a), Math.cos(a)]; }
    s -= Math.PI * r;
    if (s <= L) return [L / 2 - s, -2 * r, 0, -1];
    s -= L;
    if (s <= Math.PI * r) { const a = Math.PI + s / r; return [-L / 2 + r * Math.sin(a), -r + r * Math.cos(a), Math.sin(a), Math.cos(a)]; }
    s -= Math.PI * r;
    return [-L / 2 + s, 0, 0, 1];
  };
  const pasos = 320;
  const brillos: number[] = [];
  const posiciones: number[] = [], normales: number[] = [], uvs: number[] = [], indices: number[] = [];
  for (let i = 0; i <= pasos; i += 1) {
    const [y, z, ny, nz] = punto((i / pasos) * total);
    for (const lado of [-1, 1]) {
      posiciones.push(lado * POSTER_ANCHO / 2, y, z);
      normales.push(0, ny, nz);
      uvs.push(i / pasos, lado < 0 ? 1 : 0);
      brillos.push(brilloDeCinta(i / pasos));
    }
    if (i < pasos) {
      const a = i * 2;
      indices.push(a, a + 1, a + 3, a, a + 3, a + 2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(posiciones, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(normales, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setAttribute('brillo', new THREE.Float32BufferAttribute(brillos, 1));
  g.setIndex(indices);
  return g;
}

export function crearTambores(grupo: THREE.Group) {
    const haloTextura = TEX_HALO();
    const vertice = `
      attribute float brillo;
      varying float vBrillo;
      varying vec2 vUv;
      varying vec3 vN;
      void main() {
        vUv = uv;
        vBrillo = brillo;
        vN = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`;

    const fragmento = `
      varying float vBrillo;
      uniform sampler2D uMapa;
      uniform float uCeldas;
      uniform float uElegido;
      uniform float uApagado;
      uniform float uDesfase;
      uniform vec3 uLaton;
      varying vec2 vUv;
      varying vec3 vN;
      void main() {
        float s = fract(vUv.x + uDesfase);
        vec3 c = texture2D(uMapa, vec2(s, vUv.y)).rgb;
        float u = fract(s * uCeldas);
        float bu = (1.0 - smoothstep(0.0, 0.010, min(u, 1.0 - u)));
        float bv = (1.0 - smoothstep(0.0, 0.016, min(vUv.y, 1.0 - vUv.y)));
        float marco = max(bu, bv);
        c = mix(c, uLaton, marco * (0.26 + 0.6 * uElegido));
        float cara = clamp(vN.z, 0.0, 1.0);
        c *= mix(0.035, 1.0, pow(cara, 0.8));
        /* El frente es plano y no se curva a la sombra: las celdas vecinas se
           apagan a mano para que la de enfrente siga siendo la que cuenta. */
        c *= vBrillo;
        c *= 1.0 + 0.4 * uElegido * pow(cara, 2.0);
        float lum = dot(c, vec3(0.299, 0.587, 0.114));
        c = mix(c, vec3(lum), 0.7 * uApagado);
        c *= mix(1.0, 0.28, uApagado);
        gl_FragColor = vec4(c, 1.0);
      }`;

    const geoCinta = geometriaCinta();
    const geoLuz = new THREE.PlaneGeometry(POSTER_ANCHO * 2.1, POSTER_ALTO * 1.5);

    const tambores = [0, 1, 2].map((indice) => {
      const raiz = new THREE.Group();
      raiz.position.set((indice - 1) * SEPARACION, ALTURA_CINTA, FRENTE_Z);
      raiz.scale.setScalar(ESCALA_TAMBOR);
      const material = new THREE.ShaderMaterial({
        uniforms: {
          uMapa: { value: null },
          uCeldas: { value: CELDAS },
          uElegido: { value: 0 },
          uApagado: { value: 0 },
          uDesfase: { value: 0 },
          uLaton: { value: LATON },
        },
        vertexShader: vertice,
        fragmentShader: fragmento,
      });
      raiz.add(new THREE.Mesh(geoCinta, material));

      /* La luz del proyector que se posa en el tambor: un plano aditivo
         delante, no una luz real —no hay postproceso y no hace falta. */
      const luz = new THREE.Mesh(geoLuz, new THREE.MeshBasicMaterial({
        map: haloTextura, blending: THREE.AdditiveBlending,
        transparent: true, depthWrite: false, opacity: 0,
      }));
      luz.position.set(0, 0, 0.3);
      raiz.add(luz);

      grupo.add(raiz);
      return {
        raiz, material, luz,
        p: 0, destino: 0, desde: 0, hasta: 0, inicio: 0, duracion: 0,
        objetivoLuz: 0, objetivoApagado: 0,
      };
    });

    grupo.visible = false;

    return {
      grupo,
      destruir() { destruirGrupo(grupo); },
      montar(tirasPorTambor: Readonly<ReturnType<typeof tiras3D>>) {
        grupo.visible = true;
        tambores.forEach((tb, i) => {
          const tira = tirasPorTambor[i];
          tb.raiz.visible = !!tira;
          if (!tira) return;
          tb.material.uniforms.uMapa.value?.dispose();
          tb.material.uniforms.uMapa.value = texturaDe(lienzoTira(tira.celdas), true);
          tb.p = 0;
          tb.destino = tira.destino;
          tb.desde = 0; tb.hasta = 0; tb.duracion = 0;
          tb.material.uniforms.uElegido.value = 0;
          tb.material.uniforms.uApagado.value = 0;
          tb.objetivoLuz = 0; tb.objetivoApagado = 0;
          tb.material.uniforms.uDesfase.value = desfaseDeCinta(0);
        });
        /* Con dos finalistas o uno, los tambores sobrantes se van y los que
           quedan se centran, como se centran los carretes del CSS. */
        const vivos = tambores.filter((tb) => tb.raiz.visible);
        vivos.forEach((tb, i) => {
          tb.raiz.position.x = (i - (vivos.length - 1) / 2) * SEPARACION;
        });
      },
      girar(t0: number, base: number, paroJuntos: boolean, corto: boolean) {
        tambores.filter((tb) => tb.raiz.visible).forEach((tb, indice) => {
          const vueltas = 4 + indice;
          tb.desde = tb.p;
          tb.hasta = vueltas * CELDAS + tb.destino;
          tb.inicio = t0;
          tb.duracion = (corto ? 30 : base + (paroJuntos ? 0 : indice * base * 0.45)) / 1000;
        });
      },
      setElegido(indice: number | null) {
        const vivos = tambores.filter((tb) => tb.raiz.visible);
        vivos.forEach((tb, i) => {
          tb.objetivoLuz = i === indice ? 1 : 0;
          tb.objetivoApagado = indice !== null && i !== indice ? 1 : 0;
        });
      },
      esconder() { grupo.visible = false; },

      update(t: number, dt: number) {
        const k = Math.min(1, dt * 9);
        tambores.forEach((tb) => {
          if (tb.duracion > 0) {
            const avance = Math.min(1, (t - tb.inicio) / tb.duracion);
            tb.p = tb.desde + (tb.hasta - tb.desde) * CURVA_CARRETE(avance);
            if (avance >= 1) { tb.duracion = 0; tb.p = tb.hasta; }
          }
          tb.material.uniforms.uDesfase.value = desfaseDeCinta(tb.p);
          const u = tb.material.uniforms;
          u.uElegido.value += (tb.objetivoLuz - u.uElegido.value) * k;
          u.uApagado.value += (tb.objetivoApagado - u.uApagado.value) * k;
          tb.luz.material.opacity = u.uElegido.value * 0.55;
        });
      },
    };
  }
