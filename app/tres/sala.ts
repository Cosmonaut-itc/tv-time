import * as THREE from "three";
import type { OpcionesDeSala3D, Sala3D, FaseDeLaSala3D } from "./tipos.ts";
import type { TituloDeSala } from "../cartelera.ts";
import { ALTO_VISTA, ANCHO_MINIMO, FOV, SEPARACION, ESCALA_TAMBOR, RADIO, GANADOR_Z, TECHO_GANADOR } from "./medidas.ts";
import { fuera, saturar, cuadrosPorSegundo, tira3D, fraccionAMundo } from "./logica.ts";
import { crearTelon } from "./telon.ts";
import { crearMarquesina } from "./marquesina.ts";
import { crearTambores } from "./tambores.ts";
import { crearConteo } from "./conteo.ts";
import { vaciarImagenes } from "./texturas.ts";
import { crearGanador } from "./ganador.ts";

/** Conserva sólo la capa y la ficha del ganador actual. */
export function crearObservacionFicha(observador: Pick<ResizeObserver, "observe" | "unobserve">) {
  let capaActual: Element | null = null;
  let fichaActual: Element | null = null;
  return (capa: Element | null, ficha: Element | null) => {
    if (capa !== capaActual) {
      if (capaActual) observador.unobserve(capaActual);
      if (capa) observador.observe(capa);
      capaActual = capa;
    }
    if (ficha !== fichaActual) {
      if (fichaActual) observador.unobserve(fichaActual);
      if (ficha) observador.observe(ficha);
      fichaActual = ficha;
    }
  };
}

/** La cabina recibe el DOM y obedece las fases de la app. */
export function arrancarSala3D(opciones: OpcionesDeSala3D): Sala3D {
  THREE.ColorManagement.enabled = false;
  let destruida = false;
  const escuchas = new AbortController();
  type Eventos = HTMLElementEventMap & WindowEventMap & DocumentEventMap & { webglcontextlost: WebGLContextEvent };
  function escuchar<K extends keyof Eventos>(objetivo: EventTarget, nombre: K, manejar: (evento: Eventos[K]) => void): void {
    objetivo.addEventListener(nombre, (evento) => manejar(evento as Eventos[K]), { signal: escuchas.signal });
  }
  const { lienzo, tablero, escenario: escenarioCaja } = opciones;
  const estilosPrevios = {
    altura: lienzo.style.height, cursor: escenarioCaja.style.cursor,
    tacto: escenarioCaja.style.touchAction, seleccion: tablero.style.userSelect,
    seleccionWebkit: tablero.style.webkitUserSelect,
  };
  const renderizador = new THREE.WebGLRenderer({
    canvas: lienzo, antialias: true, alpha: true, powerPreference: 'low-power',
  });
  try {
  renderizador.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderizador.autoClear = false;
  renderizador.outputColorSpace = THREE.LinearSRGBColorSpace;

  const escenaEsc = new THREE.Scene();
  const camaraEsc = new THREE.PerspectiveCamera(FOV, 1, 0.1, 60);
  const escenaMar = new THREE.Scene();
  const camaraMar = new THREE.OrthographicCamera(0, 1, 0, -1, -100, 100);

  const grupoTelon = new THREE.Group();
  const grupoTambores = new THREE.Group();
  const grupoConteo = new THREE.Group();
  const grupoGanador = new THREE.Group();
  const grupoMarquesina = new THREE.Group();
  escenaEsc.add(grupoTambores, grupoTelon, grupoConteo, grupoGanador);
  escenaMar.add(grupoMarquesina);

  const telon = crearTelon(grupoTelon);
  const marquesina = crearMarquesina(grupoMarquesina);
  const tambores = crearTambores(grupoTambores);
  const conteo = crearConteo(grupoConteo);
  const ganador = crearGanador(grupoGanador);

  /* Un fondo propio para la caja del escenario: el terciopelo de la casa,
     para que el 3D y el CSS arranquen del mismo negro vinoso. */
  const fondo = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0.055, 0.02, 0.038) }),
  );
  fondo.position.z = -7;
  escenaEsc.add(fondo);

  let ANCHO_L = 1, ALTO_L = 1;
  let banda = { x: 0, y: 0, w: 1, h: 1 };
  let bandaMar = { x: 0, y: 0, w: 1, h: 1 };
  let distancia = 9.8;

  function observarFicha() {
    const capa = fase === 'ganador' ? tablero.querySelector('.capa-3d') : null;
    const ficha = capa?.querySelector('.ficha');
    actualizarFicha(capa, ficha ?? null);
    return ficha ?? capa;
  }

  function medir() {
    if (destruida) return;
    const caja = tablero.getBoundingClientRect();
    const esc = escenarioCaja.getBoundingClientRect();
    if (caja.width < 2 || esc.bottom - caja.top < 2) return;
    ANCHO_L = Math.round(caja.width);
    ALTO_L = Math.round(esc.bottom - caja.top);
    lienzo.style.height = ALTO_L + "px";
    renderizador.setSize(ANCHO_L, ALTO_L, false);

    const x = Math.round(esc.left - caja.left);
    const arriba = Math.round(esc.top - caja.top);
    const w = Math.max(1, Math.round(esc.width));
    const h = Math.max(1, Math.round(esc.height));
    banda = { x, y: Math.max(0, ALTO_L - arriba - h), w, h };
    bandaMar = { x: 0, y: Math.max(1, ALTO_L - arriba), w: ANCHO_L, h: Math.max(1, arriba) };

    const proporcion = w / h;
    camaraEsc.aspect = proporcion;
    /* Si la caja se angosta, la cámara se retira para que los tres tambores
       sigan cabiendo: el encuadre vertical manda, el ancho es el mínimo. */
    const alto = Math.max(ALTO_VISTA, ANCHO_MINIMO / proporcion);
    distancia = (alto / 2) / Math.tan((FOV * Math.PI) / 360);
    camaraEsc.updateProjectionMatrix();
    /* La cámara del escenario no se mueve NUNCA: se queda en el eje, a la
       distancia que pide la caja, mirando al origen. Lo que se ladea es la
       tarjeta (el giroscopio y el ratón alimentan `ganador.inclinar`), que
       es lo que pidió el dueño. La marquesina ya tenía cámara fija. */
    camaraEsc.position.set(0, 0, distancia);
    camaraEsc.lookAt(0, 0, 0);

    /* El paño recogido está escrito en fracciones del ancho del escenario y
       su borde exterior tiene que pegar al canto: el telón necesita saber
       cuánto escenario se ve en su plano (z 1.6), que cambia con la caja. */
    const medioAlto = (alto / 2) * (distancia - 1.6) / distancia;
    telon.encuadrar(medioAlto * proporcion, medioAlto);

    const ficha = observarFicha();
    const proyectar = (fraccion: number) => fraccionAMundo({ fraccion, alto, distancia, z: GANADOR_Z });
    const suelo = ficha ? proyectar((ficha.getBoundingClientRect().top - esc.top) / h) : -Infinity;
    ganador.encuadrar(TECHO_GANADOR, suelo, proyectar(0) * 0.04);
    despertar(); // La ficha asíncrona puede mover una pose que ya aterrizó.

    camaraMar.right = ANCHO_L;
    camaraMar.bottom = -ALTO_L;
    camaraMar.updateProjectionMatrix();

    const puntos = opciones.focos().map((luz) => {
      const r = luz.getBoundingClientRect();
      return { x: r.left - caja.left + r.width / 2, y: -(r.top - caja.top + r.height / 2) };
    });
    marquesina.colocar(puntos);
  }

  /* ── Giroscopio y ratón: ladean la TARJETA, no la escena ──────────
     La cámara del escenario está clavada en el eje (`medir`). El aparato y
     el puntero alimentan el mismo destino que el arrastre, con los topes del
     cartel; el arrastre manda sobre los dos y el muelle del módulo devuelve
     el cartel al aplomo en cuanto la fuente ambiente se apaga.

     El sentido es el mismo que tenía la cámara que orbitaba hasta la rev. 3
     —ladear el aparato a la derecha enseña el costado derecho del cartel—,
     que es «asomarse», no «empujar»: por eso el signo es contrario al del
     arrastre, donde la mano agarra el cartel y lo gira. */
  let metaCartelX = 0, metaCartelY = 0;   // radianes, ya con los topes del cartel
  let suaveX = 0, suaveY = 0;             // filtrados: lo que ve el cartel
  let ambienteVivo = false, ladeando = false;
  let giroscopioPedido = false;

  const FRACCION_RATON = 0.40;            // el hover ladea el 40 % de los topes

  /* Zona muerta suave: ni tiembla en el centro ni salta al salir de ella. */

  function ambiente(x: number, y: number) {
    const movio = Math.abs(x - metaCartelX) + Math.abs(y - metaCartelY) > 0.002;
    metaCartelX = x;
    metaCartelY = y;
    ambienteVivo = true;
    if (movio) despertar();               // 60 fps mientras la tarjeta se mueve
  }

  function alGirarElAparato(evento: DeviceOrientationEvent) {
    if (arrastre) return;                 // el gesto manda: el giro no pelea
    if (evento.gamma === null && evento.beta === null) return;
    if (!ganador.enEscena()) { ambienteVivo = false; return; }
    ambiente(
      fuera((evento.beta ?? 45) - 45, 26) * ganador.topes.x,
      -fuera(evento.gamma ?? 0, 22) * ganador.topes.y,
    );
  }

  async function pedirGiroscopio() {
    if (destruida || giroscopioPedido) return;
    giroscopioPedido = true;
    const Ev = window.DeviceOrientationEvent as typeof DeviceOrientationEvent & {
      requestPermission?: () => Promise<"granted" | "denied">;
    };
    if (!Ev) return;
    try {
      if (typeof Ev.requestPermission === 'function') {
        const respuesta = await Ev.requestPermission();
        if (respuesta !== 'granted') return;   // sin permiso, cámara fija
      }
      if (!destruida) escuchar(window, 'deviceorientation', alGirarElAparato);
    } catch (error) {
      console.warn('El cine · sin giroscopio:', error);
    }
  }

  const conRaton = window.matchMedia('(hover: hover)').matches;

  /* ── El gesto: ladear el cartel ganador ──────────────────────────────
     Los listeners viven aquí, no dentro de `crearGanador`: el módulo sólo
     sabe inclinar, soltar y decir si el rayo le da. Así el puerto a
     react-three-fiber cambia esta parte por `onPointerDown` del `<mesh>` sin
     tocar el cartel. */
  const rayo = new THREE.Raycaster();
  const punto = new THREE.Vector2();
  let arrastre: { id: number; x: number; y: number; base: { x: number; y: number } } | null = null;


  function hayCartel() {
    return activo && (fase === 'ganador' || fase === 'vetando') && ganador.enEscena();
  }

  /* NDC dentro de la banda del escenario, que es justo el viewport con el que
     se dibuja `camaraEsc`; el tablero incluye además la marquesina. */
  function apuntar(ev: PointerEvent) {
    const r = escenarioCaja.getBoundingClientRect();
    punto.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
    punto.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
    rayo.setFromCamera(punto, camaraEsc);
  }

  function pintarCursor(ev: PointerEvent) {
    if (!conRaton) return;
    if (arrastre) { escenarioCaja.style.cursor = 'grabbing'; return; }
    if (!hayCartel()) { escenarioCaja.style.cursor = ''; return; }
    apuntar(ev);
    escenarioCaja.style.cursor = ganador.impacta(rayo) ? 'grab' : '';
  }

  /* La banda permite scroll vertical; el gesto horizontal ladea el cartel. */
  function ajustarGesto() {
    const vivo = hayCartel();
    escenarioCaja.style.touchAction = vivo ? 'pan-y' : estilosPrevios.tacto;
    tablero.style.userSelect = vivo ? 'none' : '';
    tablero.style.webkitUserSelect = vivo ? 'none' : '';
    if (!vivo) {
      if (arrastre) soltarCartel(null);
      escenarioCaja.style.cursor = '';
    }
  }

  function soltarCartel(ev: PointerEvent | null) {
    if (!arrastre) return;
    if (ev && ev.pointerId !== arrastre.id) return;
    const id = arrastre.id;
    arrastre = null; // lostpointercapture puede reentrar al liberar la captura
    try { escenarioCaja.releasePointerCapture(id); } catch { /* ya se fue */ }
    /* Tras el arrastre manda el muelle: la fuente ambiente vuelve a hablar
       con el siguiente movimiento del puntero o del aparato, no antes. */
    ambienteVivo = false; ladeando = false;
    metaCartelX = 0; metaCartelY = 0; suaveX = 0; suaveY = 0;
    ganador.soltar();
    if (conRaton) escenarioCaja.style.cursor = '';
    despertar();
  }

  escuchar(escenarioCaja, 'pointerdown', (ev) => {
    if (!hayCartel() || arrastre) return;
    /* La ficha y los botones del ganador son DOM encima del lienzo: si el
       toque nace ahí, no es el cartel. */
    if (ev.target instanceof Element && ev.target.closest('.capa-3d')) return;
    if (ev.pointerType === 'mouse' && ev.button !== 0) return;
    apuntar(ev);
    if (!ganador.impacta(rayo)) return;
    const base = ganador.orientacion();
    arrastre = { id: ev.pointerId, x: ev.clientX, y: ev.clientY, base };
    ganador.inclinar(base.x, base.y); // sujetar cancela el muelle sin cambiar el ángulo
    try { escenarioCaja.setPointerCapture(ev.pointerId); }
    catch { soltarCartel(null); return; }
    window.getSelection?.()?.removeAllRanges?.();
    if (conRaton) escenarioCaja.style.cursor = 'grabbing';
    ev.preventDefault();
    despertar();
  });

  escuchar(escenarioCaja, 'pointermove', (ev) => {
    if (!arrastre || ev.pointerId !== arrastre.id) return;
    ganador.inclinar(
      saturar(ev.clientY - arrastre.y, ganador.topes.x, arrastre.base.x),
      saturar(ev.clientX - arrastre.x, ganador.topes.y, arrastre.base.y),
    );
    ev.preventDefault();
  });

  (['pointerup', 'pointercancel', 'lostpointercapture'] as const).forEach((nombre) => {
    escuchar(escenarioCaja, nombre, soltarCartel);
  });

  function dejarAmbiente() {
      escenarioCaja.style.cursor = '';
      if (arrastre) return;
      metaCartelX = 0; metaCartelY = 0;
      ambienteVivo = false;            // el muelle devuelve el cartel al aplomo
      despertar();
  }

  if (conRaton) {
    escuchar(tablero, 'pointermove', (e) => {
      const caja = tablero.getBoundingClientRect();
      const esc = escenarioCaja.getBoundingClientRect();
      if (e.clientX < caja.left || e.clientX > caja.right || e.clientY < caja.top || e.clientY > esc.bottom) {
        dejarAmbiente();
        return;
      }
      pintarCursor(e);
      if (arrastre) return;            // congelado mientras se arrastra el cartel
      if (!ganador.enEscena()) { ambienteVivo = false; return; }
      /* El puntero se mide contra la banda del escenario, que es donde vive
         el cartel; el tablero incluye además la marquesina. */
      const r = escenarioCaja.getBoundingClientRect();
      const nx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2));
      const ny = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - 0.5) * 2));
      ambiente(
        -ny * FRACCION_RATON * ganador.topes.x,
        -nx * FRACCION_RATON * ganador.topes.y,
      );
    });
    escuchar(tablero, 'pointerleave', dejarAmbiente);
  }


  /* ── El reloj: 20 cuadros en reposo, 60 cuando algo se mueve, 0 si la
     pestaña se esconde o si la cabina manda la versión CSS ─────────── */
  let activo = false, pintando = 0, ultimo = 0, siguiente = 0;
  let reloj = 0, altoHasta = 0;
  let fase: FaseDeLaSala3D = 'reposo';

  const despertar = () => { altoHasta = reloj + 2.2; };
  /* Arrastrando se pinta a 60 aunque el despertar se haya agotado: un gesto
     continuo puede durar más de 2.2 s y no debe caer a 20. */

  function pintar(ahora: number) {
    if (destruida || !activo || document.hidden) { pintando = 0; return; }
    pintando = requestAnimationFrame(pintar);
    const t = ahora / 1000;
    if (t < siguiente) return;
    siguiente = t + 1 / cuadrosPorSegundo({ arrastrando: arrastre !== null, reloj, altoHasta, fase }) - 0.002;
    const dt = Math.min(0.05, Math.max(0.001, t - ultimo));
    ultimo = t;
    reloj += dt;

    /* La cámara ya está puesta por `medir` y no se toca. Lo único que se
       persigue aquí es el ladeo ambiente del cartel: el destino del
       giroscopio o del ratón, filtrado para que no tiemble, servido al
       módulo por la misma puerta que el arrastre. */
    if (arrastre) {
      ladeando = false;
    } else if (ambienteVivo && ganador.enEscena()) {
      if (Math.abs(metaCartelX - suaveX) + Math.abs(metaCartelY - suaveY) > 0.0015) despertar();
      const k = Math.min(1, dt * 6);
      suaveX += (metaCartelX - suaveX) * k;
      suaveY += (metaCartelY - suaveY) * k;
      ganador.inclinar(suaveX, suaveY);
      ladeando = true;
    } else if (ladeando || ambienteVivo) {
      ambienteVivo = false; ladeando = false;
      metaCartelX = 0; metaCartelY = 0;
      suaveX = 0; suaveY = 0;
      if (ganador.enEscena()) ganador.soltar();
    }

    telon.update(reloj, dt);
    marquesina.update(reloj, dt);
    tambores.update(reloj, dt);
    conteo.update(reloj, dt);
    ganador.update(reloj, dt);

    renderizador.setScissorTest(false);
    renderizador.setClearColor(0x000000, 0);
    renderizador.setViewport(0, 0, ANCHO_L, ALTO_L);
    renderizador.clear();

    renderizador.setScissorTest(true);
    renderizador.setViewport(banda.x, banda.y, banda.w, banda.h);
    renderizador.setScissor(banda.x, banda.y, banda.w, banda.h);
    renderizador.setClearColor(0x12080c, 1);
    renderizador.clear();
    renderizador.render(escenaEsc, camaraEsc);

    renderizador.setViewport(0, 0, ANCHO_L, ALTO_L);
    renderizador.setScissor(bandaMar.x, bandaMar.y, bandaMar.w, bandaMar.h);
    renderizador.render(escenaMar, camaraMar);
    renderizador.setScissorTest(false);
  }

  function correr(v: boolean) {
    if (destruida || v === activo) return;
    activo = v;
    if (v) {
      medir();
      ultimo = performance.now() / 1000;
      siguiente = 0;
      despertar();
      if (!document.hidden) pintando = requestAnimationFrame(pintar);
    } else if (pintando) {
      cancelAnimationFrame(pintando);
      pintando = 0;
    }
  }

  escuchar(document, 'visibilitychange', () => {
    if (document.hidden) { if (pintando) { cancelAnimationFrame(pintando); pintando = 0; } }
    else if (activo && !pintando) { ultimo = performance.now() / 1000; siguiente = 0; pintando = requestAnimationFrame(pintar); }
  });

  const observador = new ResizeObserver(() => { if (activo) medir(); });
  const actualizarFicha = crearObservacionFicha(observador);
  observador.observe(tablero);
  observador.observe(escenarioCaja);
  escuchar(window, 'resize', () => { if (activo) medir(); });

  escuchar(lienzo, 'webglcontextlost', (e) => {
    e.preventDefault();
    correr(false);
    opciones.alPerderContexto();
  });

  /* La tira de un tambor: siete pósters de la casa y el finalista en una
     celda al azar, que es la que el giro tiene que dejar de frente. */
  let finalistasEnEscena: readonly TituloDeSala[] = [];

  return {
    /* El telón recibe el reloj, como los tambores y el ganador: la curva es
       temporizada y necesita saber cuándo arranca el tramo. */
    telon(abierto) { telon.abrir(reloj, abierto); despertar(); },
    reposo() {
      soltarCartel(null);
      tambores.esconder(); ganador.esconder();
      actualizarFicha(null, null);
      conteo.setNumero(null); conteo.setHaz(false);
      ajustarGesto();
      despertar();
    },
    conteo(numero) {
      conteo.setNumero(numero);
      conteo.setHaz(numero !== null);
      despertar();
    },
    montarTambores(finalistas, candidatos, quietos = false) {
      finalistasEnEscena = finalistas;
      soltarCartel(null);
      ganador.esconder();
      actualizarFicha(null, null);
      conteo.setNumero(null); conteo.setHaz(false);
      tambores.montar(finalistas.map((f) => tira3D(f, candidatos, quietos)));
      ajustarGesto();
      despertar();
    },
    girarTambores(base, paroJuntos, corto) {
      tambores.girar(reloj, base, paroJuntos, corto);
      despertar();
    },
    elegido(indice) { tambores.setElegido(indice); despertar(); },
    ganador(titulo) {
      const i = Math.max(0, finalistasEnEscena.findIndex((t) => t._id === titulo._id));
      const n = Math.max(1, finalistasEnEscena.length);
      soltarCartel(null);
      ganador.mostrar(reloj, titulo, (i - (n - 1) / 2) * SEPARACION, {
        escala: ESCALA_TAMBOR, z: -RADIO + RADIO * ESCALA_TAMBOR,
      });
      /* La ficha y los chips pueden nacer después: medir vuelve a engancharlos
         cuando el observador o React pidan otra medición. observe es idempotente. */
      observarFicha();
      medir();
      /* En cuanto el póster sale del tambor, los tres se van a la sombra:
         si no, el ganador se ve dos veces, en el marco y en su tambor. */
      tambores.setElegido(-1);
      ajustarGesto();
      despertar();
    },
    sello(visible) { ganador.sellar(reloj, visible); despertar(); },
    limpiar() {
      soltarCartel(null);
      tambores.esconder(); ganador.esconder();
      actualizarFicha(null, null);
      conteo.setNumero(null); conteo.setHaz(false);
      ajustarGesto();
      despertar();
    },
    focos(paso, modo) { marquesina.setPatron(paso, modo); },
    setFase(f) {
      fase = f;
      if (f !== 'ganador') actualizarFicha(null, null);
      ajustarGesto(); despertar();
    },
    encender(v) { correr(v); ajustarGesto(); },
    pedirGiroscopio,
    medir,
    destruir() {
      if (destruida) return;
      correr(false);
      destruida = true;
      // Se retiran las escuchas antes de soltar el contexto voluntariamente.
      escuchas.abort();
      observador.disconnect();
      vaciarImagenes();
      soltarCartel(null);
      telon.destruir(); marquesina.destruir(); tambores.destruir();
      conteo.destruir(); ganador.destruir();
      fondo.geometry.dispose(); fondo.material.dispose();
      escenaEsc.clear(); escenaMar.clear();
      renderizador.dispose();
      renderizador.forceContextLoss();
      lienzo.style.height = estilosPrevios.altura;
      escenarioCaja.style.cursor = estilosPrevios.cursor;
      escenarioCaja.style.touchAction = estilosPrevios.tacto;
      tablero.style.userSelect = estilosPrevios.seleccion;
      tablero.style.webkitUserSelect = estilosPrevios.seleccionWebkit;
    },
  };

  } catch (error) {
    // El llamador aún no recibió la instancia y no puede destruirla.
    escuchas.abort();
    try {
      renderizador.dispose();
    } finally {
      renderizador.forceContextLoss?.();
    }
    throw error;
  }
}
