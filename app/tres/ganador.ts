import { crearMarco } from "./marco.ts";
import * as THREE from "three";
import { destruirGrupo } from "./recursos.ts";
import { CREMA, GANADOR_ANCHO, GANADOR_ALTO, ALTO_MARCO_GANADOR, GANADOR_Z } from "./medidas.ts";
import { TEX_HALO, texturaDe, lienzoPoster, PILA_DISPLAY, textoEspaciado } from "./texturas.ts";
import { escalaDeVuelo, poseDelGanador } from "./logica.ts";
import { CURVA_SELLO } from "./curvas.ts";
import type { TituloDeSala } from "../cartelera.ts";

export function crearGanador(grupo: THREE.Group, renderizador: THREE.WebGLRenderer, alLlegarFoto: () => void = () => {}) {
    const haloTextura = TEX_HALO();
    const ANCHO = GANADOR_ANCHO, ALTO = GANADOR_ALTO;

    const moldura = crearMarco(renderizador);
    const marco = moldura.grupo;

    /* La lámina: el póster más un barniz. Tres capas, todas view-dependent,
       que en reposo casi no se notan y al ladear el cartel se encienden:
       un especular Blinn-Phong de exponente alto con tinte crema, una
       veladura Fresnel suave en el filo y una banda diagonal ancha que se
       desplaza con la inclinación, como el cristal de una vitrina. La leve
       comba del papel (`uComba`) se aplica sobre las tangentes en espacio de
       vista, así que el destello barre el cartel en vez de encenderse de
       golpe. `transparent` se conserva para no alterar el orden de dibujo:
       el halo del proyector va detrás y se pinta antes. */
    const lamina = new THREE.Mesh(
      new THREE.PlaneGeometry(ANCHO, ALTO),
      new THREE.ShaderMaterial({
        uniforms: {
          uMapa: { value: null },
          uCrema: { value: CREMA },
          uLadeo: { value: new THREE.Vector2(0, 0) },   // (rotación X, rotación Y) en radianes
          uFuerza: { value: 0 },                        // 0 en reposo, 1 en el tope
          uOpacidad: { value: 1 },
          uComba: { value: 0.11 },
        },
        vertexShader: `
          varying vec2 vUv; varying vec3 vN; varying vec3 vP;
          varying vec3 vT; varying vec3 vB;
          void main() {
            vUv = uv;
            vN = normalize(normalMatrix * normal);
            vT = normalize(normalMatrix * vec3(1.0, 0.0, 0.0));
            vB = normalize(normalMatrix * vec3(0.0, 1.0, 0.0));
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vP = mv.xyz;
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: `
          uniform sampler2D uMapa;
          uniform vec3 uCrema;
          uniform vec2 uLadeo;
          uniform float uFuerza;
          uniform float uOpacidad;
          uniform float uComba;
          varying vec2 vUv; varying vec3 vN; varying vec3 vP;
          varying vec3 vT; varying vec3 vB;
          void main() {
            vec4 tinta = texture2D(uMapa, vUv);
            vec3 c = tinta.rgb;

            vec3 n = normalize(vN
              + vT * (vUv.x - 0.5) * uComba
              + vB * (vUv.y - 0.5) * uComba);
            vec3 v = normalize(-vP);
            vec3 luz = normalize(vec3(-0.22, 0.34, 1.0));
            vec3 h = normalize(luz + v);

            float esp = pow(clamp(dot(n, h), 0.0, 1.0), 110.0);
            float fres = pow(1.0 - clamp(dot(n, v), 0.0, 1.0), 1.8);

            /* La banda del cristal: ancha, diagonal y corrida por el ladeo. */
            float diag = 0.55 * vUv.x + 0.45 * (1.0 - vUv.y);
            float centro = 0.46 + uLadeo.y * 1.45 + uLadeo.x * 0.95;
            float d = (diag - centro) * 3.2;
            float banda = exp(-(d * d));

            c += uCrema * esp * (0.30 + 1.30 * uFuerza);
            c += uCrema * fres * (0.10 + 0.34 * uFuerza);
            c += uCrema * banda * (0.030 + 0.150 * uFuerza);

            gl_FragColor = vec4(c, tinta.a * uOpacidad);
          }`,
        transparent: true,
      }),
    );
    // La laca del perfil queda delante del papel, como en el prototipo.
    lamina.position.z = 0;

    /* La luz del proyector detrás del póster: halo aditivo más ancho que
       el marco, que es lo que hace que el ganador se sienta iluminado. */
    const luz = new THREE.Mesh(
      new THREE.PlaneGeometry(ANCHO * 3.4, ALTO * 2.4),
      new THREE.MeshBasicMaterial({
        map: haloTextura, blending: THREE.AdditiveBlending,
        transparent: true, depthWrite: false, depthTest: false, opacity: 0,
      }),
    );
    luz.position.z = -0.6;

    const sello = new THREE.Mesh(
      new THREE.PlaneGeometry(1.72, 0.86),
      new THREE.MeshBasicMaterial({
        map: (() => {
          const c = document.createElement('canvas');
          c.width = 512; c.height = 256;
          const x = c.getContext('2d')!;
          x.fillStyle = 'rgba(14, 6, 9, 0.58)';
          x.fillRect(14, 14, 484, 228);
          x.shadowColor = 'rgba(0,0,0,0.85)'; x.shadowBlur = 8;
          x.shadowOffsetX = 0; x.shadowOffsetY = 0;
          x.strokeStyle = '#c9566c'; x.lineWidth = 9;
          x.strokeRect(14, 14, 484, 228);
          x.strokeRect(30, 30, 452, 196);
          x.fillStyle = '#c9566c';
          x.font = `400 82px ${PILA_DISPLAY}`;
          x.textAlign = 'center'; x.textBaseline = 'middle';
          textoEspaciado(x, 'VETADA', 256, 132, 12);
          return texturaDe(c);
        })(),
        transparent: true, depthWrite: false, depthTest: false,
        // La mezcla normal conserva la tinta sobre pósters claros; la aditiva la lava.
        blending: THREE.NormalBlending, opacity: 0,
      }),
    );
    sello.position.z = 0.2;
    sello.rotation.z = -14 * Math.PI / 180;
    sello.visible = false;

    /* El cartel —marco, lámina y sello— es lo único que se ladea: el halo del
       proyector es luz de cabina y se queda quieto colgando de `caja`, que es
       quien lleva el vuelo (posición y escala). El sello va dentro porque
       está impreso sobre el cartel, no flotando delante. */
    const cartel = new THREE.Group();
    cartel.add(marco, lamina, sello);

    const caja = new THREE.Group();
    caja.add(luz, cartel);
    caja.visible = false;
    grupo.add(caja);

    let vuelo: { t0: number; desdeX: number; desdeY: number; escala: number; z: number; dur: number } | null = null;
    let tSello = -1;
    let meta = { y: 0.62, escala: 0.80 };

    let metaSuave = { ...meta };

    /* Topes del ladeo: ±26° en Y (el eje del gesto largo) y ±16° en X. Los
       publica el módulo porque son del cartel; quien escucha el puntero los
       lee para saturar el arrastre contra ellos. */
    const TOPE_X = (16 * Math.PI) / 180;
    const TOPE_Y = (26 * Math.PI) / 180;

    /* Retorno: muelle amortiguado analítico (ω 14 rad/s, ζ 0.62). Da un
       sobrepaso del 8 % a los 0.29 s y se apaga a los 0.6 s sin llegar a
       oscilar. Analítico y no integrado para que no dependa del cuadro. */
    const RETORNO = 0.6, OMEGA = 14, ZETA = 0.62;
    const OMEGA_D = OMEGA * Math.sqrt(1 - ZETA * ZETA);
    const muelleFactor = (a: number) => (a >= 1 ? 0 : Math.exp(-ZETA * OMEGA * a * RETORNO)
      * (Math.cos(OMEGA_D * a * RETORNO)
        + (ZETA * OMEGA / OMEGA_D) * Math.sin(OMEGA_D * a * RETORNO)));

    let ladeoX = 0, ladeoY = 0, metaLadeoX = 0, metaLadeoY = 0;
    let inclinando = false, ultimoT = 0;
    let muelle: { t0: number; x: number; y: number } | null = null;

    function aplomar() {
      ladeoX = ladeoY = metaLadeoX = metaLadeoY = 0;
      inclinando = false;
      muelle = null;
      cartel.rotation.set(0, 0, 0);
      lamina.material.uniforms.uLadeo.value.set(0, 0);
      lamina.material.uniforms.uFuerza.value = 0;
    }

    let poster: ReturnType<typeof lienzoPoster> | null = null;
    let quitarAviso: (() => void) | undefined;
    function ponerLamina(titulo: TituloDeSala) {
      quitarAviso?.();
      lamina.material.uniforms.uMapa.value?.dispose();
      poster = lienzoPoster(titulo);
      lamina.material.uniforms.uMapa.value = texturaDe(poster);
      quitarAviso = poster.alLlegar(alLlegarFoto);
    }

    return {
      grupo,
      destruir() { quitarAviso?.(); moldura.destruir(); destruirGrupo(grupo); },
      laminaLista() { return poster?.lista() ?? false; },
      mostrarEnFicha(titulo: TituloDeSala) {
        ponerLamina(titulo);
        aplomar();
        vuelo = null; tSello = -1;
        meta = { y: 0, escala: 1 };
        metaSuave = { ...meta };
        caja.visible = marco.visible = true;
        caja.position.set(0, 0, 0);
        caja.scale.setScalar(1);
        luz.visible = sello.visible = false;
        lamina.material.uniforms.uOpacidad.value = 1;
      },
      topes: { x: TOPE_X, y: TOPE_Y },
      enEscena() { return caja.visible; },
      orientacion() { return { x: ladeoX, y: ladeoY }; },
      encuadrar(techo: number, suelo: number, margen = 0) {
        meta = poseDelGanador({ techo, suelo, margen, altoMarco: ALTO_MARCO_GANADOR });
      },
      poseMeta() { return { ...meta }; },
      mostrar(t0: number, titulo: TituloDeSala, desdeX: number, desde: { escala: number; z: number; y?: number } = { escala: 1, z: 0 }) {
        caja.visible = true;
        ponerLamina(titulo);
        luz.visible = true;
        aplomar();
        sello.visible = false;
        sello.material.opacity = 0;
        tSello = -1;
        metaSuave = { ...meta };
        vuelo = { t0, desdeX, desdeY: desde.y ?? 0, escala: escalaDeVuelo(desde.escala), z: desde.z, dur: 0.78 };
        caja.position.set(desdeX, vuelo.desdeY, vuelo.z);
        caja.scale.setScalar(vuelo.escala);
      },
      sellar(t0: number, visible: boolean) {
        sello.visible = visible;
        tSello = visible ? t0 : -1;
        if (!visible) sello.material.opacity = 0;
      },
      /* Radianes objetivo, ya saturados por quien escucha el puntero; aquí se
         recortan contra el tope por si acaso. Inclinar mata el muelle. */
      inclinar(x: number, y: number) {
        metaLadeoX = Math.max(-TOPE_X, Math.min(TOPE_X, x));
        metaLadeoY = Math.max(-TOPE_Y, Math.min(TOPE_Y, y));
        inclinando = true;
        muelle = null;
      },
      soltar() {
        if (!inclinando) return;
        inclinando = false;
        metaLadeoX = metaLadeoY = 0;
        muelle = { t0: ultimoT, x: ladeoX, y: ladeoY };
      },
      /* Prueba de impacto: sólo la lámina y el marco. El halo del proyector es
         mucho más ancho que el cartel y queda fuera a propósito. */
      impacta(raycaster: THREE.Raycaster) {
        if (!caja.visible) return false;
        return raycaster.intersectObjects([lamina, marco], true).length > 0;
      },
      esconder() { caja.visible = false; vuelo = null; tSello = -1; aplomar(); },
      update(t: number, dt: number) {
        if (!caja.visible) return;
        ultimoT = t;
        if (vuelo) {
          const k = Math.min(1, dt * 8);
          metaSuave.y += (meta.y - metaSuave.y) * k;
          metaSuave.escala += (meta.escala - metaSuave.escala) * k;
          const a = Math.min(1, (t - vuelo.t0) / vuelo.dur);
          const e = 1 - Math.pow(1 - a, 3);
          caja.position.set(vuelo.desdeX * (1 - e), vuelo.desdeY * (1 - e) + metaSuave.y * e, vuelo.z + (GANADOR_Z - vuelo.z) * e);
          const s = vuelo.escala + (metaSuave.escala - vuelo.escala) * e;
          caja.scale.setScalar(s);
          marco.visible = a > 0.45;
          lamina.material.uniforms.uOpacidad.value = 1;
          luz.material.opacity = 0.5 * e;
          if (a >= 1) vuelo = null;
        } else {
          const k = Math.min(1, dt * 8);
          caja.position.y += (meta.y - caja.position.y) * k;
          caja.scale.setScalar(caja.scale.x + (meta.escala - caja.scale.x) * k);
        }
        if (inclinando) {
          const k = Math.min(1, dt * 30);
          ladeoX += (metaLadeoX - ladeoX) * k;
          ladeoY += (metaLadeoY - ladeoY) * k;
        } else if (muelle) {
          const a = (t - muelle.t0) / RETORNO;
          const f = muelleFactor(a);
          ladeoX = muelle.x * f;
          ladeoY = muelle.y * f;
          if (a >= 1) { ladeoX = 0; ladeoY = 0; muelle = null; }
        }
        cartel.rotation.x = ladeoX;
        cartel.rotation.y = ladeoY;
        const u = lamina.material.uniforms;
        u.uLadeo.value.set(ladeoX, ladeoY);
        u.uFuerza.value = Math.min(1, Math.hypot(ladeoX / TOPE_X, ladeoY / TOPE_Y));
        if (tSello >= 0) {
          const a = Math.min(1, (t - tSello) / 0.42);
          sello.scale.setScalar(2.4 - 1.4 * CURVA_SELLO(a));
          sello.material.opacity = Math.min(0.94, a * 2.4);
        }
      },
    };
  }
