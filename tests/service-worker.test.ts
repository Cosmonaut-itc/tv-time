import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";

const ORIGEN = "https://cine.test";

type PeticionFalsa = {
  url: string;
  method: string;
  mode: string;
};

type RespuestaServiceWorker = {
  nombre?: string;
  ok: boolean;
  status: number;
  headers: { get: (nombre: string) => string | null };
  clone: () => RespuestaServiceWorker;
  text: () => Promise<string>;
};

type RespuestaFalsa = RespuestaServiceWorker & { nombre: string };

type EventoServiceWorkerFalso = {
  request?: PeticionFalsa;
  respondWith?: (respuesta: Promise<RespuestaServiceWorker>) => void;
  waitUntil?: (trabajo: Promise<unknown>) => void;
};

type FetchFalso = (
  peticion: string | PeticionFalsa,
) => Promise<RespuestaServiceWorker>;

type FetchDePagina = (
  entrada: string,
  opciones?: { cache?: string; method?: string; signal?: AbortSignal },
) => Promise<{ ok: boolean }>;

function respuesta(
  nombre: string,
  { ok = true, cuerpo = "" } = {},
): RespuestaFalsa {
  return {
    nombre,
    ok,
    status: ok ? 200 : 404,
    headers: { get: () => null },
    clone: () => respuesta(nombre, { ok, cuerpo }),
    async text() {
      return cuerpo;
    },
  };
}

function peticion(
  ruta: string,
  { method = "GET", mode = "cors" } = {},
): PeticionFalsa {
  return {
    url: new URL(ruta, ORIGEN).href,
    method,
    mode,
  };
}

async function asentarMicrotareas() {
  for (let vuelta = 0; vuelta < 32; vuelta += 1) {
    await Promise.resolve();
  }
}

function scriptEnLinea(html: string) {
  const inicio = html.lastIndexOf("<script>");
  const final = html.indexOf("</script>", inicio);
  assert.notEqual(inicio, -1);
  assert.notEqual(final, -1);
  return html.slice(inicio + "<script>".length, final);
}

function ejecutarTelon(html: string, fetchDePagina: FetchDePagina) {
  const manejadores = new Map<string, () => void>();
  const temporizadores = new Map<
    number,
    { demora: number; ejecutar: () => void }
  >();
  const solicitudes: Array<{
    entrada: string;
    opciones?: { cache?: string; method?: string };
  }> = [];
  let siguienteTemporizador = 1;
  let recargas = 0;

  runInNewContext(scriptEnLinea(html), {
    AbortController,
    addEventListener(tipo: string, manejador: () => void) {
      manejadores.set(tipo, manejador);
    },
    clearTimeout(identificador: number) {
      temporizadores.delete(identificador);
    },
    fetch(
      entrada: string,
      opciones?: { cache?: string; method?: string; signal?: AbortSignal },
    ) {
      solicitudes.push({
        entrada,
        opciones: opciones
          ? { cache: opciones.cache, method: opciones.method }
          : undefined,
      });
      return fetchDePagina(entrada, opciones);
    },
    location: {
      href: `${ORIGEN}/CWZ2AM`,
      reload() {
        recargas += 1;
      },
    },
    setTimeout(ejecutar: () => void, demora: number) {
      const identificador = siguienteTemporizador;
      siguienteTemporizador += 1;
      temporizadores.set(identificador, { demora, ejecutar });
      return identificador;
    },
  });

  return {
    despachar(tipo: string) {
      manejadores.get(tipo)?.();
    },
    ejecutarSiguienteTemporizador() {
      const siguiente = [...temporizadores.entries()].sort(
        ([, primero], [, segundo]) => primero.demora - segundo.demora,
      )[0];
      assert.ok(siguiente, "se esperaba un reintento programado");
      temporizadores.delete(siguiente[0]);
      siguiente[1].ejecutar();
    },
    estado() {
      return {
        demoras: [...temporizadores.values()].map(({ demora }) => demora),
        recargas,
        solicitudes,
      };
    },
  };
}

async function crearEntornoServiceWorker() {
  const manejadores = new Map<
    string,
    (evento: EventoServiceWorkerFalso) => void
  >();
  const almacenes = new Map<string, Map<string, RespuestaFalsa>>();
  let saltosDeEspera = 0;
  let reclamosDeClientes = 0;
  let fetchActual: FetchFalso = async () => respuesta("red");
  let errorDeApertura: Error | undefined;
  let errorDeLectura: Error | undefined;
  let ahora = 0;
  let siguienteTemporizador = 1;
  const temporizadores = new Map<
    number,
    { ejecutar: () => void; venceEn: number }
  >();

  const clave = (entrada: string | PeticionFalsa) =>
    typeof entrada === "string"
      ? new URL(entrada, ORIGEN).href
      : entrada.url;

  const caches = {
    async open(nombre: string) {
      assert.ok(nombre, "caches.open requiere un nombre de caché");
      if (errorDeApertura) {
        const error = errorDeApertura;
        errorDeApertura = undefined;
        throw error;
      }
      let almacen = almacenes.get(nombre);
      if (!almacen) {
        almacen = new Map();
        almacenes.set(nombre, almacen);
      }
      return {
        async match(entrada: string | PeticionFalsa) {
          if (errorDeLectura) {
            const error = errorDeLectura;
            errorDeLectura = undefined;
            throw error;
          }
          return almacen.get(clave(entrada));
        },
        async put(entrada: string | PeticionFalsa, valor: RespuestaFalsa) {
          almacen.set(clave(entrada), valor);
        },
      };
    },
    async keys() {
      return [...almacenes.keys()];
    },
    async delete(nombre: string) {
      return almacenes.delete(nombre);
    },
  };

  const self = {
    location: { origin: ORIGEN },
    clients: {
      async claim() {
        reclamosDeClientes += 1;
      },
    },
    async skipWaiting() {
      saltosDeEspera += 1;
    },
    addEventListener(
      tipo: string,
      manejador: (evento: EventoServiceWorkerFalso) => void,
    ) {
      manejadores.set(tipo, manejador);
    },
  };

  const fuente = await readFile("public/sw.js", "utf8");
  runInNewContext(fuente, {
    Response,
    URL,
    caches,
    fetch: (entrada: string | PeticionFalsa) => fetchActual(entrada),
    clearTimeout(identificador: number) {
      temporizadores.delete(identificador);
    },
    setTimeout(ejecutar: () => void, demora: number) {
      const identificador = siguienteTemporizador;
      siguienteTemporizador += 1;
      temporizadores.set(identificador, {
        ejecutar,
        venceEn: ahora + demora,
      });
      return identificador;
    },
    self,
  });

  function despacharFetchSinEsperar(request: PeticionFalsa) {
    let promesaRespuesta: Promise<RespuestaServiceWorker> | undefined;
    const trabajosEnSegundoPlano: Promise<unknown>[] = [];
    manejadores.get("fetch")?.({
      request,
      respondWith(respuestaPendiente: Promise<RespuestaServiceWorker>) {
        promesaRespuesta = Promise.resolve(respuestaPendiente);
      },
      waitUntil(trabajo: Promise<unknown>) {
        trabajosEnSegundoPlano.push(Promise.resolve(trabajo));
      },
    });
    return {
      interceptada: Boolean(promesaRespuesta),
      respuesta: promesaRespuesta,
      trabajoEnSegundoPlano: Promise.all(trabajosEnSegundoPlano),
    };
  }

  async function despacharFetch(request: PeticionFalsa) {
    const resultado = despacharFetchSinEsperar(request);
    return {
      ...resultado,
      respuesta: resultado.respuesta ? await resultado.respuesta : undefined,
    };
  }

  async function despacharCiclo(tipo: "install" | "activate") {
    let promesa: Promise<unknown> | undefined;
    manejadores.get(tipo)?.({
      waitUntil(trabajo: Promise<unknown>) {
        promesa = Promise.resolve(trabajo);
      },
    });
    await promesa;
  }

  return {
    caches,
    contenidoCacheStorage() {
      return [...almacenes.entries()].flatMap(([nombre, almacen]) =>
        [...almacen.entries()].map(([entrada, valor]) => ({
          entrada,
          nombre,
          valor,
        })),
      );
    },
    avanzarTiempo(milisegundos: number) {
      ahora += milisegundos;
      const vencidos = [...temporizadores.entries()]
        .filter(([, temporizador]) => temporizador.venceEn <= ahora)
        .sort(([, primero], [, segundo]) => primero.venceEn - segundo.venceEn);
      for (const [identificador, temporizador] of vencidos) {
        temporizadores.delete(identificador);
        temporizador.ejecutar();
      }
    },
    despacharCiclo,
    despacharFetch,
    despacharFetchSinEsperar,
    estado() {
      return { reclamosDeClientes, saltosDeEspera };
    },
    usarFetch(nuevoFetch: FetchFalso) {
      fetchActual = nuevoFetch;
    },
    fallarProximaApertura() {
      errorDeApertura = new Error("CacheStorage no disponible");
    },
    fallarProximaLectura() {
      errorDeLectura = new Error("lectura de caché no disponible");
    },
  };
}

test("una navegación sin red y caché vacía sirve el telón de respaldo", async () => {
  const entorno = await crearEntornoServiceWorker();
  const documento = peticion("/CWZ2AM", { mode: "navigate" });
  entorno.usarFetch(async () => {
    throw new Error("sin red");
  });

  const resultado = await entorno.despacharFetch(documento);

  assert.equal(resultado.respuesta?.status, 200);
  assert.equal(
    resultado.respuesta?.headers.get("Content-Type"),
    "text/html; charset=utf-8",
  );
  assert.equal(
    resultado.respuesta?.headers.get("Cache-Control"),
    "no-store",
  );
  const html = await resultado.respuesta?.text();
  assert.ok(html?.includes('<html lang="es-MX">'));
  assert.ok(html?.includes('name="viewport"'));
  assert.ok(html?.includes('name="theme-color" content="#12080C"'));
  assert.ok(html?.includes('class="telon-de-entrada__cenefa" aria-hidden="true"'));
  assert.ok(
    html?.includes('class="telon-de-entrada__cartel" role="status"'),
  );
  assert.ok(html?.includes("La sala está a oscuras"));
  assert.ok(
    html?.includes("No hay red. El telón se abrirá solo cuando vuelva."),
  );
  assert.equal(html?.includes("/_next/static/"), false);
  assert.equal(html?.includes("//"), false);

  for (const { valor } of entorno.contenidoCacheStorage()) {
    assert.notEqual(await valor.text(), html);
  }
});

test("el arnés reproduce CacheStorage caído sin fabricar una caché", async () => {
  const entorno = await crearEntornoServiceWorker();
  entorno.fallarProximaApertura();
  entorno.usarFetch(async () => {
    throw new Error("sin red");
  });

  const resultado = await entorno.despacharFetch(
    peticion("/CWZ2AM", { mode: "navigate" }),
  );

  assert.equal(resultado.respuesta?.status, 200);
  assert.deepEqual(entorno.contenidoCacheStorage(), []);
});

test("el telón comprueba el origen y sólo recarga cuando responde", async () => {
  const entorno = await crearEntornoServiceWorker();
  entorno.usarFetch(async () => {
    throw new Error("sin red");
  });
  const resultado = await entorno.despacharFetch(
    peticion("/CWZ2AM", { mode: "navigate" }),
  );
  const html = await resultado.respuesta?.text();
  assert.ok(html);

  let origenDisponible = false;
  const telon = ejecutarTelon(html, async () => ({ ok: origenDisponible }));
  await asentarMicrotareas();

  assert.deepEqual(telon.estado(), {
    demoras: [5_000],
    recargas: 0,
    solicitudes: [
      {
        entrada: `${ORIGEN}/CWZ2AM`,
        opciones: { cache: "no-store", method: "HEAD" },
      },
    ],
  });

  telon.ejecutarSiguienteTemporizador();
  await asentarMicrotareas();
  assert.equal(telon.estado().recargas, 0);
  assert.deepEqual(telon.estado().demoras, [10_000]);

  origenDisponible = true;
  telon.ejecutarSiguienteTemporizador();
  await asentarMicrotareas();
  assert.equal(telon.estado().recargas, 1);
  assert.deepEqual(telon.estado().demoras, []);

  let origenDelAtajoDisponible = false;
  const telonConAtajo = ejecutarTelon(html, async () => ({
    ok: origenDelAtajoDisponible,
  }));
  await asentarMicrotareas();
  assert.equal(telonConAtajo.estado().recargas, 0);

  telonConAtajo.despachar("online");
  await asentarMicrotareas();
  assert.equal(telonConAtajo.estado().recargas, 0);

  origenDelAtajoDisponible = true;
  telonConAtajo.despachar("online");
  await asentarMicrotareas();
  assert.equal(telonConAtajo.estado().recargas, 1);
});

test("un HEAD pendiente conserva los reintentos y abre al volver el origen", async () => {
  const entorno = await crearEntornoServiceWorker();
  entorno.usarFetch(async () => {
    throw new Error("sin red");
  });
  const resultado = await entorno.despacharFetch(
    peticion("/CWZ2AM", { mode: "navigate" }),
  );
  const html = await resultado.respuesta?.text();
  assert.ok(html);

  let origenDisponible = false;
  let señalDelSondeoPendiente: AbortSignal | undefined;
  const telon = ejecutarTelon(html, (_entrada, opciones) => {
    if (origenDisponible) return Promise.resolve({ ok: true });
    señalDelSondeoPendiente = opciones?.signal;
    return new Promise(() => {});
  });
  await asentarMicrotareas();

  telon.despachar("online");
  telon.ejecutarSiguienteTemporizador();
  await asentarMicrotareas();

  assert.equal(señalDelSondeoPendiente?.aborted, true);
  assert.deepEqual(telon.estado().demoras, [5_000]);
  assert.equal(telon.estado().recargas, 0);

  origenDisponible = true;
  telon.ejecutarSiguienteTemporizador();
  await asentarMicrotareas();

  assert.equal(telon.estado().solicitudes.length, 2);
  assert.equal(telon.estado().recargas, 1);
  assert.deepEqual(telon.estado().demoras, []);
});

test("las navegaciones usan red primero y conservan cada documento", async () => {
  const entorno = await crearEntornoServiceWorker();
  const documento = peticion("/CWZ2AM", { mode: "navigate" });
  entorno.usarFetch(async () => respuesta("documento de red"));

  const desdeRed = await entorno.despacharFetch(documento);
  assert.equal(desdeRed.interceptada, true);
  assert.equal(desdeRed.respuesta?.nombre, "documento de red");
  await desdeRed.trabajoEnSegundoPlano;

  entorno.usarFetch(async () => {
    throw new Error("sin red");
  });
  const desdeCache = await entorno.despacharFetch(documento);
  assert.equal(desdeCache.respuesta?.nombre, "documento de red");
});

test("una navegación actualiza su cascarón sin retrasar la respuesta", async () => {
  const entorno = await crearEntornoServiceWorker();
  const cuerpo = `<!doctype html>
    <link rel="stylesheet" href="/_next/static/css/nueva.css">
    <link rel="preload" href="${ORIGEN}/_next/static/media/nueva.woff2">
    <script src="https://fuera.test/_next/static/chunks/fuera.js"></script>
    <link rel="preload" href="/api/catalogo">`;
  const solicitadas: string[] = [];
  let liberarEstilos!: (response: RespuestaFalsa) => void;
  const estilosPendientes = new Promise<RespuestaFalsa>((resolve) => {
    liberarEstilos = resolve;
  });

  entorno.usarFetch(async (entrada) => {
    const url = new URL(
      typeof entrada === "string" ? entrada : entrada.url,
      ORIGEN,
    );
    solicitadas.push(url.href);
    if (url.pathname === "/CWZ2AM") {
      return respuesta("documento nuevo", { cuerpo });
    }
    if (url.pathname.endsWith("/nueva.css")) return estilosPendientes;
    return respuesta("fuente nueva");
  });

  const resultado = await Promise.race([
    entorno.despacharFetch(peticion("/CWZ2AM", { mode: "navigate" })),
    new Promise<"respuesta bloqueada">((resolve) => {
      setTimeout(() => resolve("respuesta bloqueada"), 50);
    }),
  ]);

  assert.notEqual(resultado, "respuesta bloqueada");
  if (resultado === "respuesta bloqueada") return;
  assert.equal(resultado.respuesta?.nombre, "documento nuevo");
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.deepEqual(solicitadas, [
    `${ORIGEN}/CWZ2AM`,
    `${ORIGEN}/_next/static/css/nueva.css`,
    `${ORIGEN}/_next/static/media/nueva.woff2`,
  ]);

  liberarEstilos(respuesta("estilos nuevos"));
  await resultado.trabajoEnSegundoPlano;

  entorno.usarFetch(async () => {
    throw new Error("sin red después de actualizar el cascarón");
  });
  const documento = await entorno.despacharFetch(
    peticion("/CWZ2AM", { mode: "navigate" }),
  );
  const estilos = await entorno.despacharFetch(
    peticion("/_next/static/css/nueva.css"),
  );
  const fuente = await entorno.despacharFetch(
    peticion("/_next/static/media/nueva.woff2"),
  );

  assert.equal(documento.respuesta?.nombre, "documento nuevo");
  assert.equal(estilos.respuesta?.nombre, "estilos nuevos");
  assert.equal(fuente.respuesta?.nombre, "fuente nueva");
});

test("una sola instalación deja el documento y sus estáticos listos sin red", async () => {
  const entorno = await crearEntornoServiceWorker();
  const cuerpo = `<!doctype html>
    <link rel="stylesheet" href="/_next/static/css/app.css">
    <link rel="preload" href="${ORIGEN}/_next/static/media/sala.woff2">
    <script src="/_next/static/chunks/app.js"></script>
    <script src="https://fuera.test/_next/static/chunks/fuera.js"></script>
    <link rel="preload" href="/api/catalogo">
    <link rel="icon" href="/icono/cine-192.png">`;
  const solicitadas: string[] = [];

  entorno.usarFetch(async (entrada) => {
    const url = new URL(
      typeof entrada === "string" ? entrada : entrada.url,
      ORIGEN,
    );
    solicitadas.push(url.href);
    if (url.pathname === "/") {
      return respuesta("documento instalado", { cuerpo });
    }
    return respuesta(`estático ${url.pathname}`);
  });

  await entorno.despacharCiclo("install");
  await entorno.despacharCiclo("activate");

  assert.deepEqual(solicitadas, [
    `${ORIGEN}/`,
    `${ORIGEN}/_next/static/css/app.css`,
    `${ORIGEN}/_next/static/media/sala.woff2`,
    `${ORIGEN}/_next/static/chunks/app.js`,
  ]);
  assert.deepEqual(entorno.estado(), {
    reclamosDeClientes: 1,
    saltosDeEspera: 1,
  });

  entorno.usarFetch(async () => {
    throw new Error("sin red");
  });

  const documento = await entorno.despacharFetch(
    peticion("/", { mode: "navigate" }),
  );
  const estilos = await entorno.despacharFetch(
    peticion("/_next/static/css/app.css"),
  );
  const fuente = await entorno.despacharFetch(
    peticion("/_next/static/media/sala.woff2"),
  );
  const chunk = await entorno.despacharFetch(
    peticion("/_next/static/chunks/app.js"),
  );

  assert.equal(documento.respuesta?.nombre, "documento instalado");
  assert.equal(
    estilos.respuesta?.nombre,
    "estático /_next/static/css/app.css",
  );
  assert.equal(
    fuente.respuesta?.nombre,
    "estático /_next/static/media/sala.woff2",
  );
  assert.equal(
    chunk.respuesta?.nombre,
    "estático /_next/static/chunks/app.js",
  );
});

test("el precache degrada sin romper la instalación ni descartar lo disponible", async () => {
  const sinRed = await crearEntornoServiceWorker();
  sinRed.usarFetch(async () => {
    throw new Error("sin red durante install");
  });

  await sinRed.despacharCiclo("install");
  assert.deepEqual(sinRed.estado(), {
    reclamosDeClientes: 0,
    saltosDeEspera: 1,
  });

  const documentoAusente = await crearEntornoServiceWorker();
  documentoAusente.usarFetch(async () =>
    respuesta("no encontrado", { ok: false }),
  );

  await documentoAusente.despacharCiclo("install");
  assert.deepEqual(await documentoAusente.caches.keys(), []);
  assert.deepEqual(documentoAusente.estado(), {
    reclamosDeClientes: 0,
    saltosDeEspera: 1,
  });

  const conFalloParcial = await crearEntornoServiceWorker();
  const cuerpo = `<!doctype html>
    <link rel="stylesheet" href="/_next/static/css/disponible.css">
    <script src="/_next/static/chunks/ausente.js"></script>`;
  conFalloParcial.usarFetch(async (entrada) => {
    const url = new URL(
      typeof entrada === "string" ? entrada : entrada.url,
      ORIGEN,
    );
    if (url.pathname === "/") {
      return respuesta("documento parcial", { cuerpo });
    }
    if (url.pathname.endsWith("/ausente.js")) {
      return respuesta("no encontrado", { ok: false });
    }
    return respuesta("estilos disponibles");
  });

  await conFalloParcial.despacharCiclo("install");
  conFalloParcial.usarFetch(async () => {
    throw new Error("sin red después de install");
  });

  const documento = await conFalloParcial.despacharFetch(
    peticion("/", { mode: "navigate" }),
  );
  const estilos = await conFalloParcial.despacharFetch(
    peticion("/_next/static/css/disponible.css"),
  );

  assert.equal(documento.respuesta?.nombre, "documento parcial");
  assert.equal(estilos.respuesta?.nombre, "estilos disponibles");
  assert.deepEqual(conFalloParcial.estado(), {
    reclamosDeClientes: 0,
    saltosDeEspera: 1,
  });
});

test("una navegación sin copia propia cae al cascarón de la raíz", async () => {
  const entorno = await crearEntornoServiceWorker();
  entorno.usarFetch(async () => respuesta("cascarón raíz"));
  const raiz = await entorno.despacharFetch(
    peticion("/", { mode: "navigate" }),
  );
  await raiz.trabajoEnSegundoPlano;

  entorno.usarFetch(async () => {
    throw new Error("sin red");
  });
  const resultado = await entorno.despacharFetch(
    peticion("/OTRA1", { mode: "navigate" }),
  );
  assert.equal(resultado.respuesta?.nombre, "cascarón raíz");
});

test("una lectura puntual fallida todavía prueba el cascarón de la raíz", async () => {
  const entorno = await crearEntornoServiceWorker();
  entorno.usarFetch(async () => respuesta("cascarón raíz"));
  const raiz = await entorno.despacharFetch(
    peticion("/", { mode: "navigate" }),
  );
  await raiz.trabajoEnSegundoPlano;

  entorno.fallarProximaLectura();
  entorno.usarFetch(async () => {
    throw new Error("sin red");
  });
  const resultado = await entorno.despacharFetch(
    peticion("/CWZ2AM", { mode: "navigate" }),
  );

  assert.equal(resultado.respuesta?.nombre, "cascarón raíz");
});

test("una navegación pendiente cae al respaldo al vencer su límite", async () => {
  const entorno = await crearEntornoServiceWorker();
  let rechazarRed!: (error: Error) => void;
  entorno.usarFetch(
    () =>
      new Promise((_, reject) => {
        rechazarRed = reject;
      }),
  );

  const resultado = entorno.despacharFetchSinEsperar(
    peticion("/CWZ2AM", { mode: "navigate" }),
  );
  let respuestaAlVencer: RespuestaServiceWorker | undefined;
  void resultado.respuesta?.then((response) => {
    respuestaAlVencer = response;
  });

  entorno.avanzarTiempo(30_000);
  await asentarMicrotareas();
  const respuestaDentroDelLimite = respuestaAlVencer;

  rechazarRed(new Error("la red tardía también falló"));
  await resultado.respuesta;
  await assert.doesNotReject(resultado.trabajoEnSegundoPlano);
  assert.equal(respuestaDentroDelLimite?.status, 200);
});

test("una navegación sin red prefiere su copia antes que la raíz", async () => {
  const entorno = await crearEntornoServiceWorker();
  entorno.usarFetch(async (entrada) => {
    const url = new URL(
      typeof entrada === "string" ? entrada : entrada.url,
      ORIGEN,
    );
    return respuesta(url.pathname === "/" ? "cascarón raíz" : "copia propia");
  });

  const raiz = await entorno.despacharFetch(
    peticion("/", { mode: "navigate" }),
  );
  await raiz.trabajoEnSegundoPlano;
  const propia = await entorno.despacharFetch(
    peticion("/CWZ2AM", { mode: "navigate" }),
  );
  await propia.trabajoEnSegundoPlano;

  entorno.usarFetch(async () => {
    throw new Error("sin red");
  });
  const resultado = await entorno.despacharFetch(
    peticion("/CWZ2AM", { mode: "navigate" }),
  );

  assert.equal(resultado.respuesta?.nombre, "copia propia");
});

test("un estático caído no rechaza la navegación ni su actualización", async () => {
  const entorno = await crearEntornoServiceWorker();
  entorno.usarFetch(async (entrada) => {
    const url = new URL(
      typeof entrada === "string" ? entrada : entrada.url,
      ORIGEN,
    );
    if (url.pathname.startsWith("/_next/static/")) {
      throw new Error("estático sin red");
    }
    return respuesta("documento de red", {
      cuerpo: '<script src="/_next/static/chunks/sala.js"></script>',
    });
  });

  const resultado = await entorno.despacharFetch(
    peticion("/CWZ2AM", { mode: "navigate" }),
  );

  assert.equal(resultado.respuesta?.nombre, "documento de red");
  await assert.doesNotReject(resultado.trabajoEnSegundoPlano);
});

test("los estáticos inmutables usan caché primero y guardan el fallo de caché", async () => {
  const entorno = await crearEntornoServiceWorker();
  const estatico = peticion("/_next/static/chunks/app-abc123.js");
  let peticionesDeRed = 0;
  entorno.usarFetch(async () => {
    peticionesDeRed += 1;
    return respuesta("estático de red");
  });

  const primera = await entorno.despacharFetch(estatico);
  const segunda = await entorno.despacharFetch(estatico);

  assert.equal(primera.respuesta?.nombre, "estático de red");
  assert.equal(segunda.respuesta?.nombre, "estático de red");
  assert.equal(peticionesDeRed, 1);
});

test("no intercepta otros orígenes, métodos ni rutas de datos", async () => {
  const entorno = await crearEntornoServiceWorker();
  const fueraDePolitica = [
    peticion("https://api.convex.cloud/api/query", { mode: "navigate" }),
    peticion("/", { method: "POST", mode: "navigate" }),
    peticion("/_next/data/catalogo.json"),
  ];

  for (const request of fueraDePolitica) {
    const resultado = await entorno.despacharFetch(request);
    assert.equal(resultado.interceptada, false);
  }
});

test("instala sin esperar y al activar conserva sólo su caché vigente", async () => {
  const entorno = await crearEntornoServiceWorker();
  entorno.usarFetch(async () => respuesta("cascarón"));
  const navegacion = await entorno.despacharFetch(
    peticion("/", { mode: "navigate" }),
  );
  await navegacion.trabajoEnSegundoPlano;
  const [cacheVigente] = await entorno.caches.keys();
  await entorno.caches.open("cache-vieja");

  await entorno.despacharCiclo("install");
  await entorno.despacharCiclo("activate");

  assert.deepEqual(await entorno.caches.keys(), [cacheVigente]);
  assert.deepEqual(entorno.estado(), {
    reclamosDeClientes: 1,
    saltosDeEspera: 1,
  });
});
