import * as THREE from "three";
import { destruirGrupo } from "./recursos.ts";
import { CREMA } from "./medidas.ts";
import { TEX_POLVO, texturaDe, PILA_DISPLAY } from "./texturas.ts";
import { ajusteOpticoDelNumero } from "../conteo-logica.ts";

export function crearConteo(grupo: THREE.Group) {
    /* El conteo vive DETRÁS del telón, como en la hoja de estilo de la casa
       (`.conteo` z-index 5, `.telon` z-index 6): el velo cubre los carretes,
       los paños pasan por delante del número mientras abren y la cenefa
       nunca se oscurece. Por eso el velo, el aro, las cruces y el número
       prueban profundidad —están en z 1.00–1.04, delante del fondo y de los
       tambores y detrás de los paños (z 1.60) y de la cenefa (z 1.90)—, y
       siguen sin escribirla para no taparse entre ellos. */
    const polvoTextura = TEX_POLVO();
    const velo = new THREE.Mesh(
      new THREE.PlaneGeometry(9, 9),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(0.02, 0.008, 0.016), transparent: true, opacity: 0.92,
        depthTest: true, depthWrite: false,
      }),
    );
    velo.position.z = 1.0;
    const aro = new THREE.Mesh(
      new THREE.TorusGeometry(0.745, 0.006, 6, 96),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(0.95, 0.9, 0.78), transparent: true, opacity: 0.35,
        depthTest: true, depthWrite: false,
      }),
    );
    aro.position.z = 1.02;
    const matCruz = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0.95, 0.9, 0.78), transparent: true, opacity: 0.22,
      depthTest: true, depthWrite: false,
    });
    const cruzH = new THREE.Mesh(new THREE.PlaneGeometry(8, 0.011), matCruz);
    const cruzV = new THREE.Mesh(new THREE.PlaneGeometry(0.011, 8), matCruz);
    cruzH.position.z = cruzV.position.z = 1.02;

    const numero = new THREE.Mesh(
      new THREE.PlaneGeometry(1.52, 1.52),
      new THREE.MeshBasicMaterial({
        transparent: true, depthWrite: false, depthTest: true, opacity: 0,
      }),
    );
    numero.position.z = 1.04;

    /* El orden de dibujo entre ellos se conserva (velo, aro, cruces, número)
       y sigue por encima del haz, que es aditivo y arranca en renderOrder 0:
       el haz cruza el telón como la luz de una cabina de verdad. */
    const caja = new THREE.Group();
    caja.add(velo, aro, cruzH, cruzV, numero);
    caja.renderOrder = 20;
    [velo, aro, cruzH, cruzV, numero].forEach((m, i) => { m.renderOrder = 20 + i; });
    caja.visible = false;
    grupo.add(caja);

    /* Haz del proyector: cono abierto y aditivo, así que atraviesa el telón
       mientras abre, igual que la luz de una cabina de verdad. */
    const haz = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 2.0, 8.2, 28, 1, true),
      new THREE.ShaderMaterial({
        uniforms: { uColor: { value: CREMA }, uIntensidad: { value: 0 } },
        vertexShader: `
          varying vec2 vUv;
          void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `
          uniform vec3 uColor;
          uniform float uIntensidad;
          varying vec2 vUv;
          void main() {
            float largo = smoothstep(0.0, 0.35, vUv.y) * (1.0 - smoothstep(0.55, 1.0, vUv.y));
            float borde = 0.35 + 0.65 * pow(abs(sin(vUv.x * 3.14159)), 0.5);
            gl_FragColor = vec4(uColor * uIntensidad * largo * borde * 0.22, 1.0);
          }`,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        side: THREE.DoubleSide,
      }),
    );
    haz.rotation.x = Math.PI / 2;
    haz.position.z = 2.4;
    haz.visible = false;
    grupo.add(haz);

    /* Polvo en suspensión dentro del haz. */
    const CUANTOS = 340;
    const pos = new Float32Array(CUANTOS * 3);
    const semillas = new Float32Array(CUANTOS);
    for (let i = 0; i < CUANTOS; i += 1) {
      const z = -1.4 + Math.random() * 7.6;
      const r = (0.09 + (6.2 - z) * 0.24) * Math.sqrt(Math.random());
      const a = Math.random() * Math.PI * 2;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = Math.sin(a) * r;
      pos[i * 3 + 2] = z;
      semillas[i] = Math.random() * 6.28;
    }
    const geoPolvo = new THREE.BufferGeometry();
    geoPolvo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const polvo = new THREE.Points(geoPolvo, new THREE.PointsMaterial({
      map: polvoTextura, size: 0.055, sizeAttenuation: true,
      transparent: true, opacity: 0, depthWrite: false, depthTest: false,
      blending: THREE.AdditiveBlending,
    }));
    polvo.visible = false;
    grupo.add(polvo);

    /* El número se centra por su tinta, no por su caja: `ajusteOpticoDelNumero`
       corrige lo que la métrica declarada de Copperplate miente. */
    const cachéNumero = new Map<number, THREE.CanvasTexture>();
    function texturaNumero(n: number): THREE.CanvasTexture {
      const guardada = cachéNumero.get(n);
      if (guardada) return guardada;
      const lado = 256, tam = 150;
      const c = document.createElement('canvas');
      c.width = c.height = lado;
      const x = c.getContext('2d')!;
      x.font = `400 ${tam}px ${PILA_DISPLAY}`;
      x.textAlign = 'center';
      x.textBaseline = 'alphabetic';
      const m = x.measureText(String(n));
      const subeCaja = m.fontBoundingBoxAscent || tam * 0.8;
      const bajaCaja = m.fontBoundingBoxDescent || tam * 0.2;
      const lineaBase = (lado + subeCaja - bajaCaja) / 2;
      const ajuste = ajusteOpticoDelNumero({
        alto: lado,
        lineaBase,
        tintaArriba: m.actualBoundingBoxAscent,
        tintaAbajo: m.actualBoundingBoxDescent,
      });
      x.fillStyle = '#f2e5c6';
      x.fillText(String(n), lado / 2, lineaBase + ajuste);
      const t = texturaDe(c);
      cachéNumero.set(n, t);
      return t;
    }

    let entrada = 0, intensidad = 0;
    let mostrando: number | null = null;
    return {
      grupo,
      destruir() { destruirGrupo(grupo, [...cachéNumero.values()]); cachéNumero.clear(); },
      setNumero(n: number | null) {
        if (n === null) { mostrando = null; caja.visible = false; return; }
        mostrando = n;
        caja.visible = true;
        numero.material.map = texturaNumero(n);
        numero.material.needsUpdate = true;
        entrada = 0;
      },
      setHaz(encendido: boolean) { intensidad = encendido ? 1 : 0; },
      update(t: number, dt: number) {
        const u = haz.material.uniforms;
        u.uIntensidad.value += (intensidad - u.uIntensidad.value) * Math.min(1, dt * 3.2);
        const viva = u.uIntensidad.value > 0.01;
        haz.visible = polvo.visible = viva;
        polvo.material.opacity = u.uIntensidad.value * 0.55;
        if (viva) {
          const p = geoPolvo.attributes.position;
          for (let i = 0; i < CUANTOS; i += 1) {
            p.array[i * 3 + 1] -= dt * 0.045;
            p.array[i * 3] += Math.sin(t * 0.5 + semillas[i]) * dt * 0.02;
            if (p.array[i * 3 + 1] < -1.6) p.array[i * 3 + 1] = 1.6;
          }
          p.needsUpdate = true;
        }
        if (mostrando !== null) {
          entrada = Math.min(1, entrada + dt / 0.55);
          const e = 1 - Math.pow(1 - entrada, 3);
          numero.scale.setScalar(1.6 - 0.6 * e);   // el pulso 1.6 → 1
          numero.material.opacity = e;
        }
      },
    };
  }
