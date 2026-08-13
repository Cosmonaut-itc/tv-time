const CACHE_CASCARON = "tv-time-cascaron-v1";

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

  const respuestaAlCliente = respuestaDeRed.catch(async (error) => {
    const cache = await caches.open(CACHE_CASCARON);
    const documento =
      (await cache.match(request)) ?? (await cache.match("/"));
    if (documento) return documento;
    throw error;
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
