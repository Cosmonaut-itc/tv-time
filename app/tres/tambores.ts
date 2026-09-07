import * as THREE from "three";
import { destruirGrupo } from "./recursos.ts";
import { CELDAS, RADIO, POSTER_ANCHO, POSTER_ALTO, SEPARACION, ESCALA_TAMBOR, LATON } from "./medidas.ts";
import { TEX_HALO, texturaDe, lienzoTira } from "./texturas.ts";
import { CURVA_CARRETE } from "./curvas.ts";
import type { tira3D } from "./logica.ts";

export function crearTambores(grupo: THREE.Group) {
    const haloTextura = TEX_HALO();
    const vertice = `
      varying vec2 vUv;
      varying vec3 vN;
      void main() {
        vUv = uv;
        vN = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`;

    const fragmento = `
      uniform sampler2D uMapa;
      uniform float uCeldas;
      uniform float uElegido;
      uniform float uApagado;
      uniform vec3 uLaton;
      varying vec2 vUv;
      varying vec3 vN;
      void main() {
        vec3 c = texture2D(uMapa, vUv).rgb;
        float u = fract(vUv.x * uCeldas);
        float bu = (1.0 - smoothstep(0.0, 0.010, min(u, 1.0 - u)));
        float bv = (1.0 - smoothstep(0.0, 0.016, min(vUv.y, 1.0 - vUv.y)));
        float marco = max(bu, bv);
        c = mix(c, uLaton, marco * (0.26 + 0.6 * uElegido));
        float cara = clamp(vN.z, 0.0, 1.0);
        c *= mix(0.035, 1.0, pow(cara, 0.8));
        c *= 1.0 + 0.4 * uElegido * pow(cara, 2.0);
        float lum = dot(c, vec3(0.299, 0.587, 0.114));
        c = mix(c, vec3(lum), 0.7 * uApagado);
        c *= mix(1.0, 0.28, uApagado);
        gl_FragColor = vec4(c, 1.0);
      }`;

    const geoTambor = new THREE.CylinderGeometry(RADIO, RADIO, POSTER_ANCHO, 72, 1, true);
    const geoTapa = new THREE.CircleGeometry(RADIO, 48);
    const geoLuz = new THREE.PlaneGeometry(POSTER_ANCHO * 2.1, POSTER_ALTO * 1.5);

    const tambores = [0, 1, 2].map((indice) => {
      const raiz = new THREE.Group();
      raiz.position.set((indice - 1) * SEPARACION, 0, -RADIO);
      raiz.scale.setScalar(ESCALA_TAMBOR);
      const material = new THREE.ShaderMaterial({
        uniforms: {
          uMapa: { value: null },
          uCeldas: { value: CELDAS },
          uElegido: { value: 0 },
          uApagado: { value: 0 },
          uLaton: { value: LATON },
        },
        vertexShader: vertice,
        fragmentShader: fragmento,
      });
      const eje = new THREE.Group();
      eje.rotation.z = Math.PI / 2;
      const cilindro = new THREE.Mesh(geoTambor, material);
      eje.add(cilindro);
      [-1, 1].forEach((lado) => {
        const tapa = new THREE.Mesh(geoTapa, new THREE.MeshBasicMaterial({
          color: new THREE.Color(0.05, 0.03, 0.04), side: THREE.DoubleSide,
        }));
        tapa.rotation.x = Math.PI / 2;
        tapa.position.y = lado * POSTER_ANCHO / 2;
        eje.add(tapa);
      });
      raiz.add(eje);

      /* La luz del proyector que se posa en el tambor: un plano aditivo
         delante, no una luz real —no hay postproceso y no hace falta. */
      const luz = new THREE.Mesh(geoLuz, new THREE.MeshBasicMaterial({
        map: haloTextura, blending: THREE.AdditiveBlending,
        transparent: true, depthWrite: false, opacity: 0,
      }));
      luz.position.set(0, 0, RADIO + 0.3);
      raiz.add(luz);

      grupo.add(raiz);
      return {
        raiz, cilindro, material, luz,
        p: 0, destino: 0, desde: 0, hasta: 0, inicio: 0, duracion: 0,
        objetivoLuz: 0, objetivoApagado: 0,
      };
    });

    /* El ángulo que deja la celda `k` de frente: la textura empieza en +Z y
       avanza con theta, así que la vuelta va en contra. */
    const anguloDe = (p: number) => -((p + 0.5) / CELDAS) * Math.PI * 2;

    grupo.visible = false;

    return {
      grupo,
      destruir() { destruirGrupo(grupo); },
      montar(tirasPorTambor: readonly ReturnType<typeof tira3D>[]) {
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
          tb.cilindro.rotation.y = anguloDe(0);
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
          tb.cilindro.rotation.y = anguloDe(tb.p);
          const u = tb.material.uniforms;
          u.uElegido.value += (tb.objetivoLuz - u.uElegido.value) * k;
          u.uApagado.value += (tb.objetivoApagado - u.uApagado.value) * k;
          tb.luz.material.opacity = u.uElegido.value * 0.55;
        });
      },
    };
  }
