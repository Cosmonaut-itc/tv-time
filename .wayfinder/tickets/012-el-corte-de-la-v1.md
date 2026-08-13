# El corte de la v1

- **Tipo**: `wayfinder:task` (HITL para aprobar el corte, AFK para construir cada rebanada)
- **Estado**: abierto
- **Asignado**: —
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
