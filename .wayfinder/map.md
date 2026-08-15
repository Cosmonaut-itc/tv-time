# 🎬 La sala de cine — mapa

<!-- wayfinder:map -->

## Destination

`cine.felixddhs.dev` en vivo: entras con un código de 6 caracteres, eliges tu butaca, el catálogo compartido de películas y series muestra póster oficial y dónde verla en México, y la tragamonedas art déco elige de verdad la película de la noche. El mapa termina cuando esa app decidió una función real.

**Dónde va, al cerrar las ocho rebanadas:** la app está construida, desplegada en `cine.felixddhs.dev` y en uso. El dueño ya dio de alta una saga entera desde el teléfono —Indiana Jones, y con eso el catálogo son **43 títulos**— y ya rotó el código de la sala. **El destino sigue sin alcanzarse**: la sala todavía no ha decidido una función real —**0 vistos**— y eso no lo hace una sesión de trabajo. Falta una noche, no una rebanada.

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
- **Multi-sala** en el modelo de datos, sin pantalla de "crear sala" en la v1. La v1 cumplió las dos mitades; la mitad que faltaba —la puerta por donde nace una sala— la construyó [Otra sala](tickets/021-otra-sala.md), **cerrado**.
- **Estética**: art déco años 30 — marquesina de focos, terciopelo vino, dorado latón, crema; cortinas que se abren, focos que titilan.

## Decisions so far

<!-- una línea por ticket cerrado -->

- [Otra sala](tickets/021-otra-sala.md) — **una sala nace desde la cabina, detrás del código**, nunca desde la taquilla: `crearSala` comprueba pertenencia antes de escribir y el código lo genera el servidor. Nace vacía, con sus dos butacas escritas al nacer, y **no le roba el aparato a la anterior**: se enseña el código y el aparato elige. El **llavero** guarda hasta ocho salas en el navegador y se identifican por sus butacas —*Félix y Sofía*, *Ana y Bruno*—, sin inventar un campo `nombre`. El freno de la taquilla sigue siendo una sola fila y ahora es **destino compartido**, asumido a sabiendas porque defiende la puerta y no la sala. El navegador destapó lo que la review no vio: la **sala recién nacida no tenía cornisa**, porque los controles vivían dentro de la rama con títulos. **Creada de verdad desde el iPhone**, con su título dentro y la vuelta por el llavero sin teclear.
- [La sala a oscuras](tickets/020-la-sala-a-oscuras.md) — **el telón dejó de abrir por reloj**: abre porque Convex conectó, y cuando no puede se queda cerrado explicándose por CSS. Un service worker a mano guarda el cascarón y **nunca el catálogo**. El iPhone real la reprobó dos veces —la PWA instalada arranca con su `CacheStorage` vacío, así que hizo falta un telón **incrustado en el propio worker**— y el arreglo trajo escalera de recuperación de tres peldaños, límite de 30 s a la navegación y sondeo `HEAD` del origen en vez de fiarse de `online`. Abierta en modo avión desde el icono instalado. **Con ella se cierra el mapa de la v1.**
- [La cabina y el historial](tickets/019-la-cabina-y-el-historial.md) — los tres ajustes del giro viven en `salas.ajustes` y viajan por Convex, así que la laptop y el celular se sienten la misma sala. El código se enseña en grande y **se puede rotar**: lo genera el servidor y `codigoActual` prueba pertenencia, con lo que **conocer el `salaId` no basta para quedarse con la sala** — tercera y última defensa de la taquilla, **rotada de verdad desde el iPhone** y con el aparato quedándose dentro. El historial se ve como dos mitades y vaciar las funciones de un título **no lo devuelve a la cartelera**. El historial existe y su forma de *recuerdo* **no se vio**: la mancha sigue borrosa.
- [El cajón del alta](tickets/018-el-cajon-del-alta.md) — la sala dejó de depender de la siembra. Las tres formas del alta construidas, con el buscador montado una sola vez y las sagas armadas **uniendo** colecciones; reconoce una saga ya catalogada y continúa su `orden` **sin renumerar**, para no romper el candado. Lo no estrenado se compara contra el día de México, y sin fecha dice *«sin fecha»*. Tercer y último uso de la hoja inferior: calzó. **Ejercitada desde el iPhone**: Indiana Jones entró completa y el catálogo son 43 títulos — pero por colección, no uniendo dos, y la saga se quedó con el nombre que le puso TMDB.
- [El muro de pósters](tickets/017-el-muro-de-posters.md) — 16 celdas para los 38, pilas que se abren en su sitio y vistas apagadas sin gaveta. Aquí nació la marquesina apagada. El iPhone real destapó el defecto de la v1: `.marco` se compartía entre el ganador y el muro, que salía en **tarjetas doradas en vez de pósters**; se partió en `.marco-laton` y `.filete-muro`. Marcar una vista toca su celda y no las otras 15, **medido en el DOM**.
- [El ganador y la función](tickets/016-el-ganador-y-la-funcion.md) — marco de latón sin ornamento encima, póster fuera del optimizador de Next, chips de disponibilidad sin logos y *JustWatch* sólo cuando hay chip que atribuir. `disponibilidad:deTitulo` **nunca acepta un `tmdbId` del cliente**, para que el token de TMDB no sea un proxy abierto. La maquinaria del destino está desplegada; **la primera función real sigue sin decidirse**.
- [El giro, de verdad](tickets/015-el-giro-de-verdad.md) — los dos actos, los dos vetos y la vuelta en vacío que señala el filtro. **El corte de las 5 a.m. se mudó al servidor** ([`convex/noche.ts`](../convex/noche.ts)): con el reloj en el cliente, mover la hora fabricaba noches y con ellas vetos infinitos. La derivación de la cartelera bajó a Convex para que el servidor no se deje vaciar. Giro dramático ~13 s. Después de la primera noche en el iPhone, los pósters **volvieron al carrete** —dibujo abajo, foto encima cuando cargó, cartelera calentada en el ocio— y el número del conteo se centró por su tinta y no por su caja de línea. Recortar la caja con `text-box-trim` **no bastó** —`cap` recorta a la altura de mayúscula declarada y las cifras de Copperplate no llegan a ella—, así que el corrimiento se mide sobre el glifo pintado. Pero la mitad del desfase **no era tipográfica**: el conteo colgaba de una `.pantalla` sin alto propio y medía 32 px, así que el velo no tapaba el escenario y el número se desbordaba; ahora cuelga del escenario y el giro no se toca.
- [La sala y su cartelera](tickets/014-la-sala-y-su-cartelera.md) — la sala se ve entera y **la cartelera es derivación pura, sin tabla**. `titulos:deSala` recibe `Id<"salas">` y **nunca un código**, porque una query no puede escribir y sería una puerta sin freno. Medidos los **16 candidatos** que predijo la lista, y los chips cuentan inventario mientras la bitácora cuenta candidatos — dos cuentas distintas a propósito. Después del despliegue, los botones sueltos de arriba se volvieron **cornisa continua**.
- [Entrar a la sala](tickets/013-entrar-a-la-sala.md) — la taquilla con su alfabeto de 32 y el freno contado en Convex, la butaca una vez por noche, el enlace que se limpia solo y la siembra interna e idempotente. La review encontró **tres puertas abiertas**, entre ellas que `siembra:sembrar` era pública y un `curl` anónimo devolvía el código de la sala: de ahí nació [`tests/superficie-convex.test.ts`](../tests/superficie-convex.test.ts). `agregadoPor` pasó a opcional antes que fabricar autores que nadie escribió.
- [El corte de la v1](tickets/012-el-corte-de-la-v1.md) — **ocho rebanadas cortadas por pantalla**, en el orden del ritual, y **nada se recorta**: todo lo decidido en once tickets entra a la v1. Los 38 títulos entran por **siembra** —que también crea la sala— para que el giro no espere al alta; TMDB llega en **tres momentos distintos**, cada uno con la rebanada que lo usa. La sala decide su primera función real en la cuarta. Del prototipo se copia el CSS literal y se rehace la lógica, y **cada rebanada se despliega a producción**, para que el iPhone real pruebe desde el primer día.
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
- [Otra sala — prototipo jugable](https://claude.ai/code/artifact/45d9b1c3-e3da-49c7-a72b-f80d2a0bca1d) · fuente en [`prototypes/otra-sala.html`](../prototypes/otra-sala.html) · el nacimiento de una sala nueva y el llavero, para [Otra sala](tickets/021-otra-sala.md)
- **La sala, en vivo y con sus 38 títulos dentro**: https://cine.felixddhs.dev · terreno en [Infraestructura viva](tickets/003-infraestructura-viva.md), construida en las ocho rebanadas de [El corte de la v1](tickets/012-el-corte-de-la-v1.md)

## Not yet specified

- **Cuando salga una película que completa una saga.** *Dune: Parte Tres* estrena en diciembre y *Beyond the Spider-Verse* en 2027. Se agregarán a mano — pero si la sala pudiera avisar, sería un momento bonito. No sé aún si es una notificación, una marquesina, o nada.
- **El historial como recuerdo.** Calificaciones, rachas, "hace un año vieron…". Era la única mancha con fecha: se iba a poder ver al cerrar [La cabina y el historial](tickets/019-la-cabina-y-el-historial.md). El historial ya existe y **la forma no se vio**, así que la mancha sigue borrosa — y quizá lo que faltaba no era la pantalla sino noches que recordar.
- **Cómo se dice que no hay sala del otro lado.** El telón de [La sala a oscuras](tickets/020-la-sala-a-oscuras.md) dice «No hay red», y es falso cuando la red existe pero el origen no contesta. Decirlo con precisión puede ser peor producto que una frase corta que acierta casi siempre. **Congelado esperando decisión del dueño.**
- **Cómo se corrige el nombre de una saga ya dada de alta.** El primer alta real lo destapó: la saga entró como *«Indiana Jones - Colección»* porque el campo se precarga con el nombre de TMDB, y hoy no hay forma de renombrarla — hay que quitar las partes y volverlas a meter. Falta decidir si es un renombrar en la ficha, una precarga más lista, o las dos.
- **Qué hace la sala cuando los 38 están vistos.** [El muro de pósters](tickets/017-el-muro-de-posters.md) trajo la marquesina apagada y [El giro, de verdad](tickets/015-el-giro-de-verdad.md) la vuelta en vacío. Son dos piezas peleando por el mismo estado y ninguna es obviamente la correcta.
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
