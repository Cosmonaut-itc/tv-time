# TMDB para México: ¿alcanza sola para la app de pareja?

## Veredicto

**Sí, TMDB alcanza sola para el caso de uso principal** de esta app: elegir al azar entre un póster, título en español de México, y en cuáles de sus 5 suscripciones (Netflix, Prime Video, Disney+/Star+, HBO Max, Apple TV) está disponible un título — todo con una sola API key gratuita, sin registro comercial. El hueco real y confirmado es que TMDB **no entrega precio en MXN** para renta/compra ni **deep link nativo** a la app del servicio (solo un link genérico a la propia página de TMDB, que a su vez no da el salto directo a Netflix/Prime/etc.). Ese hueco solo importa si la app quiere ofrecer "rentar/comprar" con precio visible — para el flujo de "ya tenemos las 5 suscripciones, dinos en cuál está" no hace falta precio ni deep link nativo, así que no bloquea el MVP.

---

## 1. `watch/providers` para película y TV: ¿región MX con flatrate/rent/buy? ¿cubre los 5 servicios?

Los endpoints `/movie/{movie_id}/watch/providers` y `/tv/{series_id}/watch/providers` están documentados con la misma forma de respuesta: un objeto `results` indexado por código de país ISO 3166-1, y cada país trae `link`, y arrays separados `flatrate`, `rent`, `buy` (más `ads` y, según el título, `free`) con objetos de proveedor (`logo_path`, `provider_id`, `provider_name`, `display_priority`). Fuente: [Watch Providers (movie)](https://developer.themoviedb.org/reference/movie-watch-providers), [TV Series Watch Providers](https://developer.themoviedb.org/reference/tv-series-watch-providers).

TMDB confirma explícitamente que **México (`MX`) es una región soportada** para datos de watch providers: el endpoint de regiones disponibles devuelve `{"iso_3166_1":"MX","english_name":"Mexico","native_name":"Mexico"}` en su ejemplo documentado. Fuente: [Available Regions](https://developer.themoviedb.org/reference/watch-providers-available-regions).

El catálogo global de proveedores de TMDB (sin filtrar por título) sí lista los 5 servicios como proveedores conocidos, con sus `provider_id`: Netflix (8), Amazon Prime Video (9/119), Disney Plus (337/390), Apple TV (2) / Apple TV Plus (350), HBO Max (384) / HBO (118). Fuente: [Movie Providers (list)](https://developer.themoviedb.org/reference/watch-providers-movie-list).

**Todos los endpoints de TMDB requieren autenticación** (API key v3 o Bearer token v4) — lo verificamos con una llamada real sin credenciales:

```
$ curl -s https://api.themoviedb.org/3/movie/550/watch/providers
{"status_code":7,"status_message":"Invalid API key: You must be granted a valid key.","success":false}
```

(HTTP 401, comando ejecutado directamente contra `api.themoviedb.org` el 12 de agosto de 2026.) No existe forma de hacer una llamada de prueba pública sin key.

**No verificado / incierto:** qué proveedores concretos aparecen HOY para un título específico en `MX` (p. ej. si una película reciente de Netflix efectivamente trae `provider_id: 8` bajo `flatrate.MX`) no se pudo confirmar con una llamada real porque requiere API key. La estructura del contrato y el soporte de la región MX sí están confirmados por documentación oficial; la cobertura efectiva día a día depende de los datos que JustWatch entrega a TMDB y no se puede verificar sin credenciales.

## 2. ¿Precio en MXN o solo nombre + link?

La forma de respuesta documentada de `watch/providers` **no incluye ningún campo de precio ni moneda** — solo `logo_path`, `provider_id`, `provider_name`, `display_priority` por proveedor, más un `link` genérico por país. Esto se confirmó de forma consistente en tres lecturas independientes de la documentación del endpoint. Fuente: [Watch Providers (movie)](https://developer.themoviedb.org/reference/movie-watch-providers), [TV Series Watch Providers](https://developer.themoviedb.org/reference/tv-series-watch-providers).

**Alternativa razonable:** para mostrar precio real de renta/compra en MXN, la única fuente confirmada que sí lo estructura es la API directa (de pago, con contrato) de JustWatch, cuya documentación pública indica que sus "offers" incluyen `retail price` y `currency` por oferta. Fuente: [JustWatch Streaming API](https://www.justwatch.com/us/JustWatch-Streaming-API). Para el caso de uso de esta app (títulos que ya están en una de las 5 suscripciones pagadas = flatrate, sin precio de por medio) esto no es necesario; solo sería relevante si además quieren ofrecer "rentar/comprar" con precio visible.

## 3. ¿Deep link directo al título dentro del servicio, o solo link genérico?

TMDB **no devuelve deep links nativos** al título dentro de cada app de streaming. Travis Bell (fundador/staff de TMDB) lo confirma explícitamente en el foro oficial de TMDB: *"we do not return full deep links on the API"* — el campo `link` de cada país en `watch/providers` apunta a la propia página `/watch` de TMDB (`themoviedb.org/movie/{id}/watch?locale=MX`), no a JustWatch ni a Netflix/Prime directamente. Fuente: [Getting link to the movie's watch provider — TMDB Talk](https://www.themoviedb.org/talk/6126a7c09a358d0091aa73ea).

Como consecuencia, **no hay forma de saber, vía la API de TMDB, si ese link abre la app nativa en un celular** — porque el link ni siquiera es a JustWatch, sino a la propia página de TMDB. La documentación pública de TMDB no dice qué hace esa página con el usuario (si redirige a JustWatch o no); eso queda fuera del alcance de la API/docs y no se puede verificar sin cargar esa página como usuario final, algo fuera del alcance de "solo lectura de documentación pública" que pide este research.

**Alternativa:** si se necesita un deep link nativo real (`ios_url`/`android_url` por servicio), Watchmode lo ofrece explícitamente en sus tiers pagos — ver sección 8.

## 4. Términos de uso: atribución, rate limits, caché, aprobación, condiciones de JustWatch

**Atribución exigida por TMDB (texto exacto):**
> "This [website, program, service, application, product] uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved by TMDB."

y el logo de TMDB usado debe ser "less prominent than the logos or marks that primarily describe or identify Your Application". Fuente: [API Terms of Use](https://www.themoviedb.org/api-terms-of-use).

Los logos oficiales (SVG, varias variantes de color/orientación) están disponibles para descarga en la página de marca. Fuente: [Logos & Attribution](https://www.themoviedb.org/about/logos-attribution).

**Rate limits:** el límite histórico estricto de 40 solicitudes/10 segundos fue **eliminado el 16 de diciembre de 2019**. Hoy no hay un tope duro documentado públicamente; TMDB solo pide un uso razonable y responder a códigos `429` si aparecen. Fuente: [Rate Limiting](https://developer.themoviedb.org/docs/rate-limiting).

**Caché:** los términos prohíben expresamente *"Cache, for longer than 6 months, any information obtained through or from TMDB or the TMDB APIs"* — es decir, el máximo permitido documentado es **6 meses**. Fuente: [API Terms of Use](https://www.themoviedb.org/api-terms-of-use).

**Uso no comercial:** no requiere aprobación previa especial más allá de crear una cuenta, aceptar los términos y solicitar la key. Los términos aclaran que el uso comercial sí requiere *"a separate written agreement between You and TMDB"*; el uso personal/no comercial de esta app queda cubierto por la licencia base. Fuente: [API Terms of Use](https://www.themoviedb.org/api-terms-of-use).

**Condiciones específicas de JustWatch (que TMDB traslada):** tanto el endpoint de película como el de TV repiten la misma advertencia: *"In order to use this data you must attribute the source of the data as JustWatch. If we find any usage not complying with these terms we will revoke access to the API."* Fuentes: [Watch Providers (movie)](https://developer.themoviedb.org/reference/movie-watch-providers), [TV Series Watch Providers](https://developer.themoviedb.org/reference/tv-series-watch-providers). Un staff de TMDB precisó en el foro oficial que la atribución de JustWatch debe verse *"a reference or logo on each media item, just like we do here on TMDb"* — es decir, no basta con un aviso único en una pantalla de "Acerca de", sino algo visible en cada ficha de título donde se muestren proveedores. Fuente: [Attributing JustWatch for using watch/providers — TMDB Talk](https://www.themoviedb.org/talk/60355e30a284eb003da676f2). Nota: esta última precisión proviene del foro oficial de TMDB (comunicación de staff), no del documento formal de Términos de Uso, que no menciona a JustWatch en absoluto.

## 5. Credenciales: API key v3 vs Read Access Token v4, proceso de registro

TMDB emite dos credenciales con el mismo nivel de acceso:
- **API Key (v3):** se envía como query param `api_key`.
- **API Read Access Token (v4):** se envía como header `Authorization: Bearer <token>`.

*"[Both] provide the same level of access, and which one you choose is completely up to you."* Fuente: [Authentication — Application](https://developer.themoviedb.org/docs/authentication-application).

**Proceso de registro (documentado):** crear una cuenta en TMDB, ir a la sección de API dentro de la configuración de la cuenta, y *"you will have to agree to our terms of use"* antes de que se emita la key. Fuente: [Getting Started](https://developer.themoviedb.org/docs/getting-started).

Un hilo del foro oficial confirma que **no hace falta ninguna aprobación ni acceso especial** para usar específicamente los endpoints de watch/providers — cualquier API key estándar ya los habilita: *"If you already have a TMDb API Key then you can now make an API request to get watch/providers data."* Fuente: [TMDB Talk](https://www.themoviedb.org/talk/67debb010416875adc69b698?language=en-US).

**No verificado / incierto:** el formulario real de solicitud de API key (qué campos exactos pide — p. ej. si exige declarar nombre de la app, URL y resumen de uso) vive detrás de login en la cuenta de TMDB y no es accesible como documentación pública; no pudimos confirmarlo contra una fuente primaria pública. La documentación pública solo confirma que hay que aceptar los términos, no el detalle del formulario.

## 6. `search/multi` con `language=es-MX`: ¿mezcla películas y series? ¿cómo se distingue? ¿traduce bien?

`search/multi` devuelve resultados de **películas, series de TV y personas en una sola lista combinada**, distinguibles por el campo `media_type` (`"movie"`, `"tv"` o `"person"`). Fuente: [Search Multi](https://developer.themoviedb.org/reference/search-multi).

Los campos de nombre difieren según el tipo: para película son `title` (localizado) y `original_title`; para TV son `name` (localizado) y `original_name`. Fuente: [Search Multi](https://developer.themoviedb.org/reference/search-multi).

El parámetro `language` documentado en `search/multi` es sólo `language` (formato `ISO-639-1-ISO-3166-1`, p. ej. `es-MX`), con default `en-US`; a diferencia de `search/movie`, **`search/multi` no tiene un parámetro `region` separado** (comprobado explícitamente: `search/movie` sí documenta `region` como parámetro independiente de `language`, `search/multi` no). Fuentes: [Search Multi](https://developer.themoviedb.org/reference/search-multi), [Search Movie](https://developer.themoviedb.org/reference/search-movie).

Sobre calidad de traducción: la documentación general de idiomas de TMDB dice que *"most of our metadata endpoints support translated data"*, pero no todo tiene traducción garantizada — por ejemplo explícitamente señala que nombres de personas y personajes no tienen soporte de traducción completo. No hay documentación de un comportamiento de fallback explícito cuando `es-MX` no tiene traducción para un título dado (si cae a `original_title`/`original_name` o a inglés). Fuente: [Languages](https://developer.themoviedb.org/docs/languages). **No verificado / incierto:** el comportamiento exacto de fallback cuando no hay traducción a `es-MX` para un título puntual no está documentado y habría que probarlo empíricamente con una key real.

## 7. Imágenes: tamaños de póster, construcción de URL, restricciones de proxy/optimización

El endpoint `/configuration` documenta `images.secure_base_url` (`https://image.tmdb.org/t/p/`) y, para pósters, `poster_sizes: ["w92","w154","w185","w342","w500","w780","original"]`. Fuente: [Configuration Details](https://developer.themoviedb.org/reference/configuration-details).

Para construir la URL completa de una imagen hacen falta 3 piezas — `base_url` (o `secure_base_url`), el `size` elegido y el `file_path` del título — concatenadas como `https://image.tmdb.org/t/p/{size}/{file_path}`. La guía de imágenes de TMDB dice literalmente que estas dos primeras piezas *"can be retrieved by calling the /configuration API"*, es decir, **documentan el flujo dinámico** (llamar `/configuration` primero) en vez de garantizar oficialmente una URL fija hardcodeable. En la práctica, `https://image.tmdb.org/t/p/` es la misma base desde hace años, pero la documentación no la presenta como un contrato inmutable, solo como el valor que hoy devuelve `/configuration`. Fuente: [Image Basics](https://developer.themoviedb.org/docs/image-basics).

**Restricciones sobre servir esas imágenes vía un optimizador de terceros (p. ej. Next.js/Vercel Image Optimization):** no encontramos ninguna cláusula específica en los Términos de Uso que mencione explícitamente optimizadores de imágenes, CDNs o reprocesamiento técnico (resize/recompresión). Lo más cercano son dos cláusulas generales: (1) prohibición de *"Make derivatives of the TMDB APIs or TMDB Content"*, y (2) prohibición de usar la API *"in a manner that is confusing or misleading as to the source or origin of Your Application"*. Ninguna de las dos menciona explícitamente el caso de un optimizador de imágenes que reescala/recomprime para servir más rápido. Fuente: [API Terms of Use](https://www.themoviedb.org/api-terms-of-use). **No verificado / incierto:** si TMDB consideraría el cacheo/reprocesamiento que hace el Image Optimization de Next.js/Vercel como "derivative work" en el sentido de la cláusula (1) no está aclarado en ninguna fuente primaria pública; no hay FAQ ni caso documentado sobre esto específicamente.

## 8. Alternativas para los huecos detectados (precio MXN y deep link nativo)

Dado que el hueco real de TMDB está en **precio** (pregunta 2) y **deep link nativo** (pregunta 3), estas son las alternativas verificadas:

**JustWatch Partner API** (`apis.justwatch.com`): documentación pública confirma que sus "offers" sí incluyen precio de venta/alquiler y moneda, y cobertura de "over 250,000 movies and 60,000 tv-shows... in over 100 countries". Fuente: [JustWatch Streaming API](https://www.justwatch.com/us/JustWatch-Streaming-API), [JustWatch API docs](https://apis.justwatch.com/docs/api/). **No es self-serve**: la documentación indica que el acceso requiere un contrato — *"Once the contract is concluded, each partner is handed a unique partner token"* — y **no hay tabla de precios pública**; hay que contactar directamente (`data-partner@justwatch.com`). Costo real: **no verificable** en fuente pública; requiere cotización directa con JustWatch.

**Watchmode** (`api.watchmode.com`): tiene un plan gratuito documentado con tabla de precios pública:
- Developer (gratis): 2,500 requests/mes
- Startup: $349/mes, 40,000 requests/mes
- Business: $599/mes, 100,000 requests/mes
- Enterprise: precio a medida, requests ilimitados

Fuente: [Watchmode API](https://api.watchmode.com/). Su página de marketing afirma que ofrece *"iOS and Android deeplinks to launch the content in the native app of each streaming service"*, pero **esa función queda excluida del plan gratuito** (solo Startup en adelante). México figura explícitamente entre los 54 países soportados. Fuente: [Watchmode API](https://api.watchmode.com/). **No verificado / incierto:** no pudimos confirmar en su documentación técnica pública (la referencia interactiva de endpoints en `api.watchmode.com/docs` no es accesible como HTML estático) si el endpoint de "sources" trae un campo de precio explícito por título; solo se verificó la existencia de los tiers de precio y la promesa de deep links nativos desde la página de marketing.

**OMDb API** (`omdbapi.com`): es una fuente de metadata/ratings tipo IMDb (título, sinopsis, calificación), **no tiene ningún dato de disponibilidad de streaming ("where to watch")** — por lo tanto no sirve para cubrir el hueco de proveedores/precio/deep link que pide esta app. Su modelo de precios está basado en Patreon; la página pública no muestra montos ni límites de tasa exactos por tier. Fuente: [OMDb API](https://www.omdbapi.com/). **No verificado / incierto:** los montos exactos de cada tier de Patreon no están publicados de forma clara en la página oficial.

**Conclusión de esta sección:** para el MVP de la app (elegir entre las 5 suscripciones ya pagadas), TMDB solo, con `flatrate`, cubre el caso sin necesidad de precio ni deep link nativo. Si más adelante quieren agregar "rentar/comprar con precio real y deep link nativo", **Watchmode** es la opción con precio público y proceso self-serve verificable (aunque con la incertidumbre señalada sobre el campo de precio exacto); **JustWatch Partner API** sería la fuente más completa pero sin costo ni proceso público verificable.

---

## Ejemplos de la forma (estructura) de la respuesta JSON de `watch/providers` para MX

**Estructura documentada por TMDB** (campos confirmados repetidamente en la documentación oficial de ambos endpoints, movie y TV): un objeto raíz con `id` y `results`, donde `results` es un diccionario indexado por código de país ISO 3166-1, y cada país trae `link` más los arrays `flatrate`/`rent`/`buy`/`ads`/`free` (según disponibilidad), cada uno con objetos de proveedor (`logo_path`, `provider_id`, `provider_name`, `display_priority`). Fuentes: [Watch Providers (movie)](https://developer.themoviedb.org/reference/movie-watch-providers), [TV Series Watch Providers](https://developer.themoviedb.org/reference/tv-series-watch-providers).

El ejemplo siguiente es **ilustrativo de la estructura, no datos reales verificados** (los nombres de proveedores, IDs de proveedor exactos por título y `display_priority` mostrados abajo son inventados para ilustrar la forma; no confirmamos con una llamada autenticada real qué aparece hoy para un título específico en MX):

```json
{
  "id": 12345,
  "results": {
    "MX": {
      "link": "https://www.themoviedb.org/movie/12345-titulo-de-ejemplo/watch?locale=MX",
      "flatrate": [
        {
          "logo_path": "/exampleNetflixLogo.jpg",
          "provider_id": 8,
          "provider_name": "Netflix",
          "display_priority": 0
        },
        {
          "logo_path": "/exampleHboMaxLogo.jpg",
          "provider_id": 1899,
          "provider_name": "Max",
          "display_priority": 1
        }
      ],
      "rent": [
        {
          "logo_path": "/exampleAppleTvLogo.jpg",
          "provider_id": 2,
          "provider_name": "Apple TV",
          "display_priority": 0
        }
      ],
      "buy": [
        {
          "logo_path": "/exampleAppleTvLogo.jpg",
          "provider_id": 2,
          "provider_name": "Apple TV",
          "display_priority": 0
        }
      ]
    }
  }
}
```

Nótese que ningún objeto de proveedor documentado por TMDB trae campo de precio ni moneda (ver pregunta 2).

---

## Riesgos y datos no verificados

- **Cobertura real de proveedores para MX hoy** (pregunta 1): la forma de la respuesta y el soporte de la región `MX` están confirmados por documentación oficial, pero qué proveedores concretos aparecen para un título específico hoy **no se pudo verificar con una llamada real**, porque todos los endpoints de TMDB exigen API key/token (confirmado con un `curl` real que devolvió HTTP 401 sin credenciales) y esta investigación no debía registrarse para obtener una.
- **Comportamiento de fallback de idioma** (pregunta 6): qué devuelve `search/multi` con `language=es-MX` cuando un título no tiene traducción a español mexicano (¿cae a `original_title`? ¿a inglés?) no está documentado explícitamente y requeriría prueba empírica con key real.
- **Campos exactos del formulario de solicitud de API key** (pregunta 5): vive detrás de login en la cuenta de TMDB; no es documentación pública verificable sin crear una cuenta, algo fuera del alcance de este research (regla: "sólo lectura de documentación pública", "no te registres en ningún servicio").
- **Si el link genérico de TMDB (`/watch`) redirige o no a JustWatch/proveedor** (pregunta 3): está fuera del alcance de la documentación de la API; requeriría cargar esa página web como usuario final, lo cual excede "documentación pública de la API".
- **Si TMDB consideraría el reprocesamiento de imágenes de un optimizador tipo Next.js/Vercel Image Optimization como "derivative work" prohibido** (pregunta 7): no hay cláusula específica ni FAQ que lo aclare; es una zona gris de interpretación de los Términos de Uso.
- **Campo de precio exacto en la API de Watchmode** (pregunta 8): la documentación técnica interactiva de Watchmode (`api.watchmode.com/docs`) es una SPA que no se pudo inspeccionar como HTML estático; solo se verificaron sus tiers de precio y las afirmaciones de marketing sobre deep links nativos, no el schema exacto de campos de su endpoint de "sources".
- **Costo real de JustWatch Partner API** (pregunta 8): no hay tabla de precios pública; requiere contacto directo y cotización, así que el costo queda como "no verificable en fuente pública" por diseño del propio proveedor.
- **Montos exactos de los tiers de Patreon de OMDb** (pregunta 8): la página pública no publica montos claros por tier, solo referencia el link de Patreon.
