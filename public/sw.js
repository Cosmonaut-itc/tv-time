const CACHE_CASCARON = "tv-time-cascaron-v1";

// Si cambia la copia del telón de entrada, hay que actualizar también ésta.
const DOCUMENTO_TELON_RESPALDO = `<!doctype html>
<html lang="es-MX">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#12080C">
  <title>La sala está a oscuras</title>
  <style>
    :root {
      color-scheme: dark;
      background: #12080c;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html,
    body {
      width: 100%;
      min-height: 100%;
      overflow: hidden;
      background: #12080c;
    }

    .telon-de-entrada {
      position: fixed;
      inset: 0;
      overflow: hidden;
    }

    .telon-de-entrada__cortina {
      position: absolute;
      inset: 0 auto 0 0;
      width: 50.5%;
      background: repeating-linear-gradient(
        90deg,
        #3a0f1a 0,
        #6b1e2e 14px,
        #7c2536 20px,
        #6b1e2e 26px,
        #3a0f1a 40px
      );
      box-shadow: inset -18px 0 34px -10px rgba(0, 0, 0, 0.85);
    }

    .telon-de-entrada__cortina--derecha {
      inset: 0 0 0 auto;
      box-shadow: inset 18px 0 34px -10px rgba(0, 0, 0, 0.85);
    }

    .telon-de-entrada__cenefa {
      position: absolute;
      z-index: 2;
      top: 0;
      right: 0;
      left: 0;
      height: 9%;
      background: linear-gradient(180deg, #7c2536, #4a1420);
      box-shadow: 0 6px 16px -4px rgba(0, 0, 0, 0.8);
    }

    .telon-de-entrada__cartel {
      position: absolute;
      z-index: 3;
      top: 50%;
      left: 50%;
      width: min(82vw, 340px);
      padding: 24px 20px;
      border: 1px solid #8a6f1c;
      background: linear-gradient(
        180deg,
        rgba(18, 8, 12, 0.96),
        rgba(78, 17, 34, 0.96)
      );
      box-shadow:
        0 0 0 4px rgba(18, 8, 12, 0.72),
        0 12px 34px rgba(0, 0, 0, 0.72);
      transform: translate(-50%, -50%);
      text-align: center;
    }

    .telon-de-entrada__rotulo {
      color: #c9a227;
      font-family: "Copperplate", "Copperplate Gothic Light", "Futura",
        "Century Gothic", "Trebuchet MS", sans-serif;
      font-size: 20px;
      font-weight: 400;
      letter-spacing: 0.16em;
      line-height: 1.35;
      text-transform: uppercase;
    }

    .telon-de-entrada__mensaje {
      margin-top: 12px;
      color: #f2e5c6;
      font-family: "DIN Alternate", "Avenir Next Condensed", ui-monospace,
        monospace;
      font-size: 11px;
      letter-spacing: 0.08em;
      line-height: 1.65;
    }
  </style>
</head>
<body>
  <main class="telon-de-entrada">
    <div class="telon-de-entrada__cenefa" aria-hidden="true"></div>
    <div class="telon-de-entrada__cortina" aria-hidden="true"></div>
    <div class="telon-de-entrada__cortina telon-de-entrada__cortina--derecha" aria-hidden="true"></div>
    <div class="telon-de-entrada__cartel" role="status">
      <p class="telon-de-entrada__rotulo">La sala está a oscuras</p>
      <p class="telon-de-entrada__mensaje">No hay red. El telón se abrirá solo cuando vuelva.</p>
    </div>
  </main>
  <script>addEventListener("online", () => location.reload());</script>
</body>
</html>`;

function responderConTelonDeRespaldo() {
  return new Response(DOCUMENTO_TELON_RESPALDO, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function estaticosReferenciados(html) {
  const urls = new Set();
  const atributos = html.matchAll(
    /\b(?:href|src)\s*=\s*["']([^"']+)["']/gi,
  );

  for (const [, referencia] of atributos) {
    const url = new URL(referencia, self.location.origin);
    if (url.origin !== self.location.origin) continue;
    if (!url.pathname.startsWith("/_next/static/")) continue;
    urls.add(url.href);
  }

  return [...urls];
}

async function precachearDocumento(entrada, documento) {
  if (!documento.ok) return;

  const html = await documento.clone().text();
  const cache = await caches.open(CACHE_CASCARON);
  await cache.put(entrada, documento);

  await Promise.all(
    estaticosReferenciados(html).map(async (url) => {
      try {
        const response = await fetch(url);
        if (response.ok) await cache.put(url, response);
      } catch {
        // El cascarón disponible se conserva aunque falle un recurso aislado.
      }
    }),
  );
}

async function precachearCascaron() {
  const documento = await fetch("/");
  await precachearDocumento("/", documento);
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      try {
        await precachearCascaron();
      } catch {
        // Instalar sin cascarón es preferible a impedir la carga con red.
      }
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const nombres = await caches.keys();
      await Promise.all(
        nombres
          .filter((nombre) => nombre !== CACHE_CASCARON)
          .map((nombre) => caches.delete(nombre)),
      );
      await self.clients.claim();
    })(),
  );
});

function navegarConRedPrimero(request) {
  const respuestaDeRed = fetch(request);

  const respuestaAlCliente = respuestaDeRed.catch(async () => {
    try {
      const cache = await caches.open(CACHE_CASCARON);
      const documento =
        (await cache.match(request)) ??
        (await cache.match("/", { ignoreVary: true }));
      if (documento) return documento;
    } catch {
      // El telón incrustado tampoco depende de que CacheStorage responda.
    }
    return responderConTelonDeRespaldo();
  });

  const actualizacion = respuestaDeRed
    .then(async (response) => {
      if (response.ok) {
        await precachearDocumento(request, response.clone());
      }
    })
    .catch(() => {
      // La navegación conserva su fallback aunque falle la actualización.
    });

  return { actualizacion, respuestaAlCliente };
}

async function estaticoConCachePrimero(request) {
  const cache = await caches.open(CACHE_CASCARON);
  const guardado = await cache.match(request);
  if (guardado) return guardado;

  const response = await fetch(request);
  if (response.ok) await cache.put(request, response.clone());
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    const navegacion = navegarConRedPrimero(request);
    event.respondWith(navegacion.respuestaAlCliente);
    event.waitUntil(navegacion.actualizacion);
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(estaticoConCachePrimero(request));
  }
});
