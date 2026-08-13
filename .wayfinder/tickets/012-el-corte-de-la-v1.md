# El corte de la v1

- **Tipo**: `wayfinder:task` (HITL para aprobar el corte, AFK para construir cada rebanada)
- **Estado**: cerrado
- **Asignado**: sesión de Claude (el corte de la v1)
- **Bloqueado por**: —
- **Mapa**: [La sala de cine](../map.md)

## Question

Ya no queda pantalla sin decidir. La taquilla, la butaca, el giro en dos actos,
la cartelera corta, el alta de títulos y —desde
[El catálogo de 38 títulos](011-el-catalogo-de-38-titulos.md)— el catálogo
tienen forma, y [La forma de los datos](006-la-forma-de-los-datos.md) ya está
empujada a Convex. La sala responde en https://cine.felixddhs.dev, vacía.

**Este ticket no construye la v1: decide cómo se corta.** Una sesión no cabe en
la app entera, así que la salida es una lista de rebanadas, cada una del tamaño
de una sesión, en un orden que deje la sala usable lo antes posible.

- **Qué es la primera rebanada.** ¿La taquilla y la butaca —entrar a una sala
  vacía—, o el catálogo con los 38 títulos cargados, que es lo que hace que
  valga la pena entrar? Una sala en la que se puede entrar y no hay nada, y un
  catálogo al que no se llega, son dos formas distintas de nada.
- **Dónde caen los 38 títulos reales.** Se cargan a mano por el alta, o entran
  por una siembra desde Convex. Si es siembra, es trabajo de una rebanada; si es
  a mano, el alta tiene que existir antes que el giro.
- **Qué se construye una sola vez.** La **hoja inferior** la comparten el
  catálogo, el alta y el resultado del giro; la **marquesina apagada** la
  comparten el catálogo agotado y la sala recién nacida. Decidir en qué rebanada
  nacen, para que no se escriban tres veces.
- **Dónde entra TMDB.** Los pósters y la disponibilidad son de
  [Pósters y streaming en México](002-posters-y-streaming-en-mexico.md), con su
  caché de 6 meses y sus atribuciones. ¿La primera versión dibuja pósters de
  mentira como el prototipo, o TMDB entra desde la primera rebanada?
- **Qué queda fuera de la v1** aunque esté decidido, para que el corte no crezca
  solo.

Las piezas ya recorridas viven en los prototipos que enlaza el mapa: no se
rediseñan aquí, se traducen. Al cerrar, este ticket deja las rebanadas creadas
como tickets hijos del mapa, encadenadas.

**No espera a [La sala instalada](010-la-sala-instalada.md)**: la PWA es
infraestructura y puede cortarse en paralelo.

## Resolución

**Ocho rebanadas, cortadas por pantalla y en el orden del ritual.** Nada de lo
decidido en once tickets se queda fuera: se decidió explícitamente **no
recortar**, así que la v1 es todo, y lo que cambia es el orden en que llega.

| # | Rebanada | Al cerrar, la sala… |
|---|---|---|
| 1 | [Entrar a la sala](013-entrar-a-la-sala.md) | se abre con un código y ya tiene los 38 títulos dentro |
| 2 | [La sala y su cartelera](014-la-sala-y-su-cartelera.md) | se ve entera y dice qué va a girar |
| 3 | [El giro, de verdad](015-el-giro-de-verdad.md) | gira, se acorta cuando debe, y se puede vetar |
| 4 | [El ganador y la función](016-el-ganador-y-la-funcion.md) | **decide una función real** — el destino del mapa |
| 5 | [El muro de pósters](017-el-muro-de-posters.md) | enseña todo lo que existe y devuelve lo visto |
| 6 | [El cajón del alta](018-el-cajon-del-alta.md) | deja de depender de la siembra |
| 7 | [La cabina y el historial](019-la-cabina-y-el-historial.md) | se afina, se enseña su código y recuerda |
| 8 | [La sala a oscuras](020-la-sala-a-oscuras.md) | sabe qué decir cuando no hay red |

Se descartó **la noche completa en crudo primero** —que decidiría una película
en la sesión uno— porque obliga a escribir cada pieza dos veces y deja la
traducción del prototipo para el final, cuando lo afinado en dos sesiones de
prototipo es justo lo que no conviene rehacer. Se descartó **Convex primero**:
un backend entero pensado de un jalón contra pantallas que aún no existen es la
forma más cara de equivocarse.

### Los 38 entran por siembra

Una mutación que corre una vez y escribe, desde una lista versionada en el repo,
los 38 títulos de [La lista de series](005-la-lista-de-series.md). **También crea
la sala** —las dos butacas, los ajustes en *dramático*— y escupe el código; no
hay pantalla de crear sala en la v1 y no la va a haber.

Se descartó cargarlos a mano por el alta. Armar *Star Wars* de doce uniendo tres
colecciones de TMDB es el trabajo más caro de la app entera, y ponerlo delante
del giro invierte el orden del valor: la sala tardaría seis sesiones en decidir
algo. La lista ya está escrita y verificada — es un dato del repo, no una
captura de pantalla.

El precio, y está anotado: **la siembra nunca ejercita el camino del alta**. Por
eso [El cajón del alta](018-el-cajon-del-alta.md) cierra con una saga nueva
armada de verdad desde el iPhone, uniendo al menos dos colecciones.

### TMDB no es una pieza, son tres

Cada una llega con la rebanada que la usa, y no antes:

- **Resolver los 38** (`tmdbId` + `posterPath`) → la siembra, en la rebanada 1.
  *Sheep Detectives* entra **sin `tmdbId`** desde el primer día: el caso de un
  título sin póster oficial deja de ser hipotético.
- **La búsqueda en vivo** → sólo la necesita el alta, en la rebanada 6.
- **La disponibilidad** (`watch/providers`, caché ≤ 6 meses, atribución de
  JustWatch en cada ficha con proveedores) → sólo aparece en el ganador y en la
  hoja de detalle, en la rebanada 4.

Se descartó traer TMDB completo en la primera rebanada, que la habría inflado
sin que nada lo usara, y se descartaron los pósters dibujados del prototipo: el
muro y el carrete se juzgan con pósters reales o no se juzgan, y dibujarlos
primero obliga a traducir dos veces.

### Las piezas compartidas nacen donde se necesitan

- **La hoja inferior** nace en [El ganador y la función](016-el-ganador-y-la-funcion.md)
  y la reusan el muro y el alta. Su tercer uso es su prueba: si en el alta no
  calza, calzaba mal desde el principio.
- **La marquesina apagada** nace en [El muro de pósters](017-el-muro-de-posters.md)
  y sirve a sus dos casos —catálogo agotado y sala recién nacida— con distinta
  línea.

Se descartó una rebanada de cimientos que las construyera antes que cualquier
pantalla: diseñar una pieza para tres usos que todavía no existen es acertar en
uno y fallar en dos.

### Cómo se traducen los prototipos

**El CSS se copia literal; la lógica se reescribe.** Paleta, medidas, tipografía
y animaciones ya están afinadas y no se vuelven a pagar — incluido el arreglo
del descender del `<svg>` que costó encontrar en
[El ritual del giro](001-el-ritual-del-giro.md). La lógica sí se rehace: la
regla **«ninguna interacción repinta una lista entera»** se consiguió allá con
DOM a mano y aquí se consigue con keys estables y memo. Es otra técnica para el
mismo fin, y se comprueba en navegador igual que se comprobó allá.

### Cada rebanada llega a producción

A `cine.felixddhs.dev`, no a una preview. La sala es privada —`noindex` con
doble candado y un código de mil millones de combinaciones— y hoy está viva y
vacía: no hay a quién romperle nada. A cambio, el iPhone real es el aparato de
prueba desde la rebanada uno, que es exactamente la lección que dejó
[La sala instalada](010-la-sala-instalada.md) después de tres vueltas creyendo
que algo funcionaba sin volver a instalarlo.

### Las cadenas

`013 → 014 → 015 → 016`, y de ahí se abre en tres: `017 → 018`, `019`, y `020`.
Las tres ramas de después del ganador **no se estorban** y pueden correrse en
paralelo — el muro, la cabina y la sala sin red no se tocan entre sí.

### Lo que destapó

**Nada nuevo en la niebla, y nada gradúa.** Las seis manchas del mapa siguen
igual de borrosas, y una de ellas —*el historial como recuerdo*— tiene ahora
fecha: se podrá pinchar cuando cierre
[La cabina y el historial](019-la-cabina-y-el-historial.md), porque hasta
entonces el historial no existe y su forma no se puede ver.

**Al cerrar la rebanada 8 el mapa se cierra**: no queda nada decidido sin
construir.
