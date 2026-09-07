import * as THREE from "three";
import { destruirGrupo } from "./recursos.ts";
import { LATON, LATON_TENUE, CREMA, GANADOR_ALTO, GANADOR_CANTO, ALTO_MARCO_GANADOR, GANADOR_Z } from "./medidas.ts";
import { TEX_HALO, texturaDe, lienzoPoster, PILA_DISPLAY, textoEspaciado } from "./texturas.ts";
import { escalaDeVuelo, poseDelGanador } from "./logica.ts";
import { CURVA_SELLO } from "./curvas.ts";
import type { TituloDeSala } from "../cartelera.ts";

export function crearGanador(grupo: THREE.Group) {
    const haloTextura = TEX_HALO();
    const ANCHO = 1.86, ALTO = GANADOR_ALTO, CANTO = GANADOR_CANTO;

    function octagono(w: number, h: number, corte: number) {
      const s = new THREE.Shape();
      s.moveTo(-w / 2 + corte, -h / 2);
      s.lineTo(w / 2 - corte, -h / 2);
      s.lineTo(w / 2, -h / 2 + corte);
      s.lineTo(w / 2, h / 2 - corte);
      s.lineTo(w / 2 - corte, h / 2);
      s.lineTo(-w / 2 + corte, h / 2);
      s.lineTo(-w / 2, h / 2 - corte);
      s.lineTo(-w / 2, -h / 2 + corte);
      s.closePath();
      return s;
    }

    const forma = octagono(ANCHO + CANTO * 2, ALTO + CANTO * 2, 0.30);
    const hueco = octagono(ANCHO - 0.02, ALTO - 0.02, 0.26);
    forma.holes.push(new THREE.Path(hueco.getPoints(64).reverse()));
    const geoMarco = new THREE.ExtrudeGeometry(forma, {
      depth: 0.09, bevelEnabled: true, bevelThickness: 0.022,
      bevelSize: 0.022, bevelSegments: 2, curveSegments: 2,
    });
    geoMarco.computeVertexNormals();

    /* Latón sin luces en la escena: anisotropía falsa por la altura, un
       especular de banda y un filo que recoge la luz del proyector. La luz
       vive en espacio de vista (fija respecto a la cámara), así que al ladear
       el marco el brillo corre por el bisel y por el filo: es lo que hace
       legible el gesto. Dos lóbulos —uno estrecho y fuerte para el destello
       que viaja, otro ancho y tenue para que el metal no se apague. */
    const marco = new THREE.Mesh(geoMarco, new THREE.ShaderMaterial({
      uniforms: { uLaton: { value: LATON }, uTenue: { value: LATON_TENUE }, uCrema: { value: CREMA } },
      vertexShader: `
        varying vec3 vN; varying vec3 vP; varying vec3 vLocal;
        void main() {
          vN = normalize(normalMatrix * normal);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vP = mv.xyz; vLocal = position;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform vec3 uLaton; uniform vec3 uTenue; uniform vec3 uCrema;
        varying vec3 vN; varying vec3 vP; varying vec3 vLocal;
        void main() {
          vec3 n = normalize(vN);
          vec3 v = normalize(-vP);
          float banda = 0.5 + 0.5 * sin(vLocal.y * 26.0);
          vec3 base = mix(uTenue, uLaton, 0.35 + 0.65 * banda);
          vec3 luz = normalize(vec3(-0.25, 0.55, 0.85));
          float dif = clamp(dot(n, luz), 0.0, 1.0);
          float ref = clamp(dot(reflect(-luz, n), v), 0.0, 1.0);
          float esp = pow(ref, 52.0);
          float halo = pow(ref, 8.0);
          float filo = pow(1.0 - clamp(dot(n, v), 0.0, 1.0), 2.4);
          vec3 c = base * (0.34 + 0.72 * dif)
                 + uCrema * esp * 1.05
                 + uLaton * halo * 0.22
                 + uLaton * filo * 0.4;
          gl_FragColor = vec4(c, 1.0);
        }`,
    }));

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
    lamina.position.z = 0.03;

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

    let vuelo: { t0: number; desdeX: number; escala: number; z: number; dur: number } | null = null;
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

    return {
      grupo,
      destruir() { destruirGrupo(grupo); },
      topes: { x: TOPE_X, y: TOPE_Y },
      enEscena() { return caja.visible; },
      orientacion() { return { x: ladeoX, y: ladeoY }; },
      encuadrar(techo: number, suelo: number, margen = 0) {
        meta = poseDelGanador({ techo, suelo, margen, altoMarco: ALTO_MARCO_GANADOR });
      },
      poseMeta() { return { ...meta }; },
      mostrar(t0: number, titulo: TituloDeSala, desdeX: number, desde = { escala: 1, z: 0 }) {
        caja.visible = true;
        const u = lamina.material.uniforms;
        u.uMapa.value?.dispose();
        u.uMapa.value = texturaDe(lienzoPoster(titulo));
        aplomar();
        sello.visible = false;
        sello.material.opacity = 0;
        tSello = -1;
        metaSuave = { ...meta };
        vuelo = { t0, desdeX, escala: escalaDeVuelo(desde.escala), z: desde.z, dur: 0.78 };
        caja.position.set(desdeX, 0, vuelo.z);
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
        return raycaster.intersectObjects([lamina, marco], false).length > 0;
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
          caja.position.set(vuelo.desdeX * (1 - e), metaSuave.y * e, vuelo.z + (GANADOR_Z - vuelo.z) * e);
          const s = vuelo.escala + (metaSuave.escala - vuelo.escala) * e;
          caja.scale.setScalar(s);
          marco.material.visible = a > 0.45;
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
