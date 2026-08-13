# 🎬 La sala de cine — mapa

<!-- wayfinder:map -->

## Destination

`cine.felixddhs.dev` en vivo: entras con un código de 6 caracteres, eliges tu butaca, el catálogo compartido de películas y series muestra póster oficial y dónde verla en México, y la tragamonedas art déco elige de verdad la película de la noche. El mapa termina cuando esa app decidió una función real.

## Notes

**Dominio.** Una pareja que no logra decidir qué ver. El producto no es un catálogo: es el *ritual* de decidir. La ceremonia importa más que la funcionalidad.

**Override de "plan, don't do".** Este mapa lleva la ejecución dentro: el destino es la app desplegada, no un spec. Los tickets siguen siendo decisiones, pero el mapa no termina hasta que está en producción.

**Stack fijado.** Next.js (App Router) en Vercel · Convex de backend · TMDB para pósters y disponibilidad · subdominio `cine.felixddhs.dev` (ya registrado en Vercel).

**Preferencias permanentes de este esfuerzo:**
- Todo prototipo se entrega como **Artifact interactivo**, nunca como descripción.
- UI y datos en **español de México**; título original como apoyo secundario.
- **Móvil primero**; escritorio decente pero secundario.
- Skills a consultar cada sesión: `/prototype`, `/frontend-design`, `/grilling`, `/domain-modeling`, `convex:design` y el subagente `convex:convex-expert` para todo lo que viva en `convex/`, `vercel:nextjs` y `vercel:deployments-cicd` para el despliegue.

**Decidido en el charting** (no son tickets; son el terreno sobre el que se dibujó el mapa):
- **Mecánica**: tragamonedas en dos actos — gira y reduce a **3 finalistas**, giro final decide. **2 vetos por noche, compartidos y sin dueño** (corrige el "1 por persona" del charting); si vetan, vuelve a girar.
- **Acceso**: sin login. La raíz es una **taquilla**: escribes un **código único de 6 caracteres** que identifica la sala. El navegador lo recuerda.
- **Butacas**: **Félix** y **Sofía**. Tras entrar eliges quién eres; el dispositivo lo recuerda. No poseen vetos, pero cada título recuerda quién lo agregó — existen para darle dos voces a la sala.
- **Catálogo**: uno solo, películas y series mezcladas, con filtro antes de girar (*peli / serie / lo que sea*). Buscador contra TMDB desde la v1. Las **sagas** entran película por película con candado; las **series** compiten enteras, sin episodios.
- **Disponibilidad**: entra todo a la ruleta; el ganador muestra insignia de dónde verlo. Suscripciones que tienen: **Netflix, Prime Video, Disney+/Star+, HBO Max, Apple TV**.
- **Después de ver**: botón *"ya la vimos"* → sale de la ruleta y entra al **historial de funciones** con su fecha; se puede regresar.
- **Sincronía**: un solo celular compartido. El giro vive en el navegador; el backend guarda catálogo e historial.
- **Multi-sala** en el modelo de datos, sin pantalla de "crear sala" en la v1.
- **Estética**: art déco años 30 — marquesina de focos, terciopelo vino, dorado latón, crema; cortinas que se abren, focos que titilan.

## Decisions so far

<!-- una línea por ticket cerrado -->

- [La sala instalada](tickets/010-la-sala-instalada.md) — PWA instalable con arco de marquesina, terciopelo desde manifest y un telón **renderizado en el HTML inicial** como fallback controlable. En iOS 26.6 el PNG nativo no es una promesa: tras la transición del sistema, cortinas y cenefa salen completamente del viewport. Validado en Simulator y confirmado por el usuario en un iPhone 17 Pro Max real.
- [El catálogo de 38 títulos](tickets/011-el-catalogo-de-38-titulos.md) — un **muro de pósters** que se abre como cajón sobre la sala, donde **cada saga es una pila** que se despliega en su sitio: 38 títulos caben en 16 celdas. Sagas primero por antigüedad, lo suelto por lo último agregado. Las vistas **se quedan en su celda, apagadas**, sin gaveta ni estante. Filtro propio —*todo / sin ver / vistas*— porque la cartelera pregunta qué va a girar y el catálogo qué falta por ver, y el detalle vive en una **hoja que sube desde abajo**.
- [Cuando la cartelera se queda corta](tickets/009-cuando-la-cartelera-se-queda-corta.md) — la cartelera corta no es un error, es una función más rara: el primer acto **se salta** con tres o menos, con dos es un **duelo** y con uno se gira igual, anunciado antes de jalar la palanca. **El veto se apaga con un solo título**, así que la cartelera ya no puede vaciarse a media noche. El filtro trae su cuenta en vivo, y el único cartel es **la marquesina apagada** — el catálogo agotado y la sala recién nacida.
- [El alta de títulos](tickets/008-el-alta-de-titulos.md) — un **cajón que sube del foso** y se queda abierto: se agrega de tres en tres. La saga se arma **uniendo** colecciones y películas sueltas, siempre reordenada por estreno, y el punto de partida es una **línea de latón** que se toca. Las vistas se quedan en el catálogo, apagadas; quitar borra de verdad. Ninguna interacción repinta una lista entera.
- [La taquilla](tickets/007-la-taquilla.md) — código de 6 caracteres sobre un alfabeto de 32 sin ambigüedades, link que se limpia solo de la barra, y las tres defensas (freno, confirmar lo que borra, poder rotarlo). La butaca se pregunta **una vez por noche**, con el mismo corte de 5 a.m. que los vetos.
- [La forma de los datos](tickets/006-la-forma-de-los-datos.md) — cinco tablas ya empujadas a Convex en [`convex/schema.ts`](../convex/schema.ts). Sin tabla `cartelera` ni `giros`: la cartelera se recorta en el cliente y un giro no deja rastro. Lo visto es un booleano más una tabla de funciones — de ahí salen las dos mitades del historial sin duplicar nada.
- [La lista de series](tickets/005-la-lista-de-series.md) — el catálogo real: **38 títulos**, nada visto todavía. Tres reglas sin excepciones — alcance amplio (Star Wars son doce, la Tierra Media incluye El Hobbit), **todo por orden de estreno**, y sólo lo ya estrenado.
- [Infraestructura viva](tickets/003-infraestructura-viva.md) — https://cine.felixddhs.dev responde con certificado, Convex enlazado en dev y prod, y `noindex` con doble candado sin condicionar a producción. Ninguna credencial en el repo: el deploy key en Vercel, el `TMDB_READ_TOKEN` sólo en Convex.
- [El idioma de la sala](tickets/004-el-idioma-de-la-sala.md) — glosario cerrado en [`CONTEXT.md`](../CONTEXT.md). Catálogo ≠ Cartelera, un solo Título con tipo, la Función nace del botón y no del giro, el veto tira la terna y deja fuera lo vetado toda la noche, y la **Noche** corta a las 5 a.m.
- [El ritual del giro](tickets/001-el-ritual-del-giro.md) — el ritmo no se fija: los tres ajustes de la cabina quedan personalizables, arrancando en dramático. Vetos compartidos, butacas Félix y Sofía, y las sagas entran película por película con candado hasta ver la anterior.
- [Pósters y streaming en México](tickets/002-posters-y-streaming-en-mexico.md) — TMDB alcanza sola: región MX con `flatrate`/`rent`/`buy`, pósters y búsqueda en español. Sin precio en MXN ni deep link nativo, y hereda tres restricciones: caché ≤ 6 meses, atribución de TMDB, y atribución de JustWatch **en cada ficha** con proveedores.

## Assets

- [El ritual del giro — prototipo jugable](https://claude.ai/code/artifact/60bbb8d9-0e17-4024-b8bd-99579b2a7101) · fuente en [`prototypes/ritual-del-giro.html`](../prototypes/ritual-del-giro.html)
- [El alta de títulos — prototipo jugable](https://claude.ai/code/artifact/12bd87c8-73b7-4c30-a355-c94d1dae52ff) · fuente en [`prototypes/alta-de-titulos.html`](../prototypes/alta-de-titulos.html)
- [El catálogo — tres formas sobre los 38 títulos reales](https://claude.ai/code/artifact/d26464fd-d94f-4751-b784-19a84bb24d02) · fuente en [`prototypes/catalogo.html`](../prototypes/catalogo.html) · las tres variantes siguen dentro, y la ganadora es *Un muro*
- [Research de TMDB para México](../docs/research/tmdb-mexico.md)
- **La sala, en vivo y vacía**: https://cine.felixddhs.dev · detalle del terreno en [Infraestructura viva](tickets/003-infraestructura-viva.md)

## Not yet specified

- **Cuando salga una película que completa una saga.** *Dune: Parte Tres* estrena en diciembre y *Beyond the Spider-Verse* en 2027. Se agregarán a mano — pero si la sala pudiera avisar, sería un momento bonito. No sé aún si es una notificación, una marquesina, o nada.
- **El historial como recuerdo.** Calificaciones, rachas, "hace un año vieron…". Hay algo bonito ahí, pero no sé su forma hasta que el historial exista.
- **Modo duelo por pares** como alternativa al azar, para noches en las que sí quieren opinar.
- **Sincronía de dos celulares** con vetos en vivo — descartado para la v1, no para siempre.
- **Filtros más finos** antes de girar: duración, género, ánimo.
- **Cómo se comportan los vetos** cuando sólo uno de los dos está presente.

## Out of scope

<!-- cerrado, nunca gradúa -->

- **Cuentas de usuario, contraseñas y OAuth** — el acceso por código lo sustituye por decisión explícita; volver a login sería redibujar el destino.
- **Reproducir contenido dentro del sitio** — la sala decide qué ver y enlaza al servicio; no es un reproductor.
- **App nativa** — la web en el celular es el producto.
- **Recomendaciones automáticas o con IA** — el chiste es el azar y el veto, no que un algoritmo opine.
