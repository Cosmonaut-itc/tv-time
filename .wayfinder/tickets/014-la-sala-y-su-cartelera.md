# La sala y su cartelera

- **Tipo**: `wayfinder:task` (AFK, con aceptación HITL en el iPhone)
- **Estado**: abierto
- **Asignado**: —
- **Bloqueado por**: [Entrar a la sala](013-entrar-a-la-sala.md)
- **Mapa**: [La sala de cine](../map.md)

## Question

Ya se entra a la sala, pero la sala no se ve. Esta rebanada la dibuja entera —
marquesina, cortinas, ruleta dormida, foso — y le pone su cartelera. Al cerrar,
ves qué va a girar y cuánto hay de cada cosa; todavía no gira.

**El marco de la sala.** Una sola columna vertical de celular, traducida de
[`prototypes/ritual-del-giro.html`](../../prototypes/ritual-del-giro.html): la
marquesina de focos arriba, el terciopelo `#12080C`, el foso `#0B0507`, el latón
`#C9A227`. Es el envase de todo lo que viene después, así que las medidas y los
nombres de las piezas se fijan aquí.

**La cartelera es un recorte, no una tabla.** Sale en el cliente sobre los
títulos de la sala: catálogo **menos lo visto, menos lo bloqueado por candado,
menos lo vetado hoy**, pasado por el filtro. Es la ausencia deliberada que
documenta [`convex/schema.ts`](../../convex/schema.ts) y que
[La forma de los datos](006-la-forma-de-los-datos.md) defendió: una tabla
`cartelera` sería un caché que hay que invalidar cada vez que alguien marca algo
visto.

**El candado de saga.** De una saga compite **una sola película a la vez**: la
primera cuyo `orden` no tenga ninguna anterior sin ver. Con el catálogo sembrado
eso da **16 candidatos** — 7 sueltas + 3 series + 6 cabezas de saga — que es
exactamente la cuenta que predijo [La lista de series](005-la-lista-de-series.md)
y sirve de prueba de que el recorte está bien hecho.

**El filtro con su cuenta en vivo.** *peli 35 · serie 3 · lo que sea 38*, con la
cuenta que fijó [Cuando la cartelera se queda corta](009-cuando-la-cartelera-se-queda-corta.md).
Nada se bloquea nunca por estar en cero, y la cuenta baja al vetar — aunque los
vetos no existan todavía, el número tiene que salir de la cartelera de verdad y
no de una constante.

**Lo que la sala anuncia antes de jalar la palanca.** Con tres o menos
candidatos el primer acto se va a saltar, y eso se dice **antes**: *«esta noche,
duelo»* con dos, *«no había de otra»* con una. Se calcula aquí porque es un dato
de la cartelera; el giro que lo obedece llega en la siguiente rebanada.

**La palanca queda dormida**, con su forma final. Que se vea que ahí va el
ritual es la mitad del punto: la sala se entiende antes de que pida trabajo.

**Fuera**: girar, vetar, la marquesina apagada — el catálogo sembrado nunca está
vacío, así que ese cartel espera a [El muro de pósters](017-el-muro-de-posters.md).

Al cerrar: desplegada, y la cuenta de 16 candidatos verificada contra el
catálogo real desde el iPhone.
