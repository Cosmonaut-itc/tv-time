# La sala y su cartelera

- **Tipo**: `wayfinder:task` (AFK, con aceptación HITL en el iPhone)
- **Estado**: cerrado
- **Asignado**: sesión de Claude (orquestación) · `gpt-5.6-sol` (implementación y review)
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

## Resolución

**La sala se ve y anuncia lo que va a girar.** Implementó `gpt-5.6-sol`·`high`,
review adversarial del mismo modelo, veto del orquestador y aceptación en
navegador a 390×844.

### Lo que quedó construido

El envase entero traducido del prototipo —marquesina de focos, terciopelo
`#12080C`, foso `#0B0507`, latón `#C9A227`— con la palanca dormida en su forma
final. La cartelera nació como **derivación pura**, sin tabla: catálogo menos lo
visto, menos lo bloqueado por el candado de saga, menos lo vetado hoy, pasado
por el filtro. Vivió primero en `app/cartelera.ts` y en
[El giro, de verdad](015-el-giro-de-verdad.md) se mudó a
[`convex/cartelera.ts`](../../convex/cartelera.ts), que es donde el servidor la
necesita para no dejarse vaciar.

**`titulos:deSala` recibe `Id<"salas">` y nunca un código.** Es la decisión de
diseño de la rebanada: una query de Convex no puede escribir, así que una query
que aceptara código sería una puerta sin freno —adivinar códigos gratis y sin
límite—. El código sólo entra por `taquilla:entrar`, que es una mutación y sí
puede contar los fallos.

### Lo que la review encontró

- **El candado de saga se rompía con datos malformados** — una saga sin `orden`
  contiguo dejaba fuera a toda la saga en vez de dejar pasar a su cabeza.
- Una prueba comprobaba el recorte con un **regex sobre el fuente**. Se
  reescribió como prueba de comportamiento; ese antipatrón ya se había rechazado
  antes en este repo.
- **«Cargando» y «vacío» se veían igual**, así que un backend lento parecía una
  sala sin nada.
- Foco huérfano al cambiar de filtro y un `aria-live` duplicado que hacía que el
  lector leyera la cuenta dos veces.
- `saltaPrimerActo` salía `true` con **cero** candidatos, cuando ahí no hay nada
  que saltar.

Una anotación **se rechazó**: la review pedía tratar el `salaId` como capacidad
no revocable. El código de seis caracteres tampoco es revocable en la v1, y
rotarlo es de [La cabina y el historial](019-la-cabina-y-el-historial.md).

### Las dos cuentas que no coinciden, a propósito

Los chips cuentan **inventario** —35 películas · 3 series · 38— y la bitácora
cuenta **candidatos** —13 con el filtro en películas—. No es un error: el
candado de saga es una regla del ritual, no de la biblioteca. Se le planteó al
dueño y no pidió cambiarlo.

### Verificado

Medido en navegador contra el deployment de desarrollo: **16 candidatos** con el
filtro en «lo que sea» —7 sueltas + 3 series + 6 cabezas de saga, exactamente la
cuenta que predijo [La lista de series](005-la-lista-de-series.md)—, chips
35/3/38, y al cambiar de filtro las 13 filas que sobreviven **conservan su nodo
del DOM**. El dueño aceptó la sala desplegada desde su iPhone.

### Después del despliegue

Los cuatro botones sueltos de la parte de arriba se veían flotando sobre la
marquesina en el teléfono real. El dueño eligió **cornisa continua**: quedaron
integrados como una franja del mezzanine en vez de piezas sueltas.
