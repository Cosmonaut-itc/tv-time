# El giro, de verdad

- **Tipo**: `wayfinder:task` (AFK, con aceptación HITL en el iPhone)
- **Estado**: cerrado
- **Asignado**: sesión de Claude (orquestación) · `gpt-5.6-sol` (implementación y review)
- **Bloqueado por**: [La sala y su cartelera](014-la-sala-y-su-cartelera.md)
- **Mapa**: [La sala de cine](../map.md)

## Question

La palanca despierta. Esta rebanada traduce el ritual entero de
[El ritual del giro](001-el-ritual-del-giro.md) sobre la cartelera real de la
rebanada anterior. Al cerrar, la sala gira y saca un ganador — todavía no lo
sabe celebrar ni recordar.

**Los dos actos.** El primero reduce la cartelera a **hasta tres finalistas**;
el segundo decide. El ritmo arranca en **dramático** —el ajuste ya vive en
`salas.ajustes` y se lee desde ahí, aunque el cajón que lo cambia llegue en
[La cabina y el historial](019-la-cabina-y-el-historial.md)— con los carretes
parando uno por uno y el conteo del proyector encendido.

**El primer acto se salta cuando no hay nada que reducir**, según
[Cuando la cartelera se queda corta](009-cuando-la-cartelera-se-queda-corta.md):
con tres o menos candidatos se va directo al giro que decide. Con dos es un
**duelo**; con uno **se gira igual** y la marquesina lo admite con gracia. La
sala ya lo anunció antes de jalar la palanca — aquí sólo se obedece.

**Los vetos.** Dos por noche, **compartidos y sin dueño**, dibujados en el foso
como dos fichas de latón que se apagan. Vetar tira la terna y deja lo vetado
fuera toda la noche. Es lo primero que escribe en `noches`, que se crea
perezosamente: sin vetos no hay noche que guardar, y su identidad es el
timestamp de las 5:00 de México que la abre — el mismo corte que reparte la
butaca.

**El veto se apaga con un solo título en la cartelera**, con la razón escrita al
lado. Es la regla que hace que la cartelera no pueda llegar a cero a media
noche, y por eso el cero deja de ser un accidente y pasa a ser un estado del
catálogo.

**La vuelta en vacío.** Si el filtro está agotado —vieron las 3 series pero hay
35 películas— la palanca **gira igual y termina señalando el filtro**:
*«ya vieron las 3 series — hay 35 películas»*, con el selector resaltado. La
sala no está agotada, está mal apuntada, y la salida es un toque.

**Un bug que ya costó encontrarse una vez** y que no conviene repetir: un `<svg>`
inline arrastra el descender de su línea de texto, así que cada celda del
carrete queda unos píxeles más alta de lo que pide su `aspect-ratio` — sobre 14
celdas eso desplaza el carrete casi un cuadro entero. Se arregla con
`line-height: 0` en la celda, el SVG en `display: block`, y midiendo la celda
real con `getBoundingClientRect()` en vez de asumir la altura.

**Un giro no deja rastro.** No hay tabla `giros` y no la va a haber: girar no es
decidir.

**Fuera**: el ganador en marquesina con su póster y su disponibilidad, y el
botón *«Esta vemos»* — son de [El ganador y la función](016-el-ganador-y-la-funcion.md).
Aquí el ganador puede salir crudo.

Al cerrar: desplegada, y el ritmo dramático juzgado en el iPhone real — cuánto
dura antes de aburrir es lo único que no se puede medir en una Mac.

## Resolución

**La palanca gira.** Implementó `gpt-5.6-sol`·`high`, review adversarial del
mismo modelo, veto del orquestador y medición en navegador a 390×844.

### Lo que quedó construido

Los dos actos, con el primero saltándose solo cuando hay tres o menos
candidatos: duelo con dos, y con uno se gira igual. Los dos vetos por noche,
compartidos y sin dueño, en fichas de latón que se apagan; `noches` se crea
perezosamente y su identidad es el timestamp del corte. El veto se apaga con un
solo título en la cartelera, con la razón al lado. Y **la vuelta en vacío**: si
el filtro está agotado la palanca gira igual y termina señalando el filtro.

**El corte de las 5 a.m. vive en [`convex/noche.ts`](../../convex/noche.ts), del
lado del servidor.** Calcularlo en el cliente habría dejado que un reloj movido
fabricara noches nuevas y con ellas vetos ilimitados. El cliente sólo tiene
`momento` como **clave de caché**, nunca como fuente de verdad — por eso la
noche rueda a las 05:00 aunque la app lleve horas abierta.

**El bug del `<svg>` que el ticket avisaba** salió, y se arregló como estaba
escrito: `line-height: 0` en la celda, el SVG en `display: block`, y la altura
real medida con `getBoundingClientRect()` en vez de asumida.

### Lo que la review encontró — seis, todas aceptadas

- **El servidor dejaba vaciar la cartelera.** El veto se validaba en el cliente,
  así que un `fetch` anónimo podía vetar hasta dejarla en cero. La derivación se
  mudó a [`convex/cartelera.ts`](../../convex/cartelera.ts) y el servidor la
  recalcula antes de aceptar cada veto. **Es la regla del ticket —la cartelera no
  puede llegar a cero a media noche— hecha imposible, no sólo evitada.**
- **La noche no rodaba a las 05:00 con la app abierta**; el cliente se quedaba
  con la noche vieja hasta recargar.
- **Un título vetado por la otra butaca podía ganar** — dos giros simultáneos se
  pisaban. El giro quedó versionado.
- La vuelta en vacío **mentía sobre los vetos**, descontándolos cuando no había
  nada que vetar.
- Los carretes **giraban sin esperar las imágenes**, y en una red lenta paraban
  sobre huecos. Se quitaron los pósters del carrete: el giro es tipografía.
- El veto **perdía el foco** al tirar la terna.

Una anotación **se rechazó**: que
[`tests/superficie-convex.test.ts`](../../tests/superficie-convex.test.ts) es una
prueba de regex sobre el fuente. Es un candado deliberado sobre la superficie
pública de Convex, no una prueba de comportamiento disfrazada.

### Verificado

Medido en navegador: el giro dramático dura **~13 s**, hace **0 peticiones a
`image.tmdb.org`** durante el ritual, y el carrete monta **45 celdas con 0
`<img>`**. `prefers-reduced-motion` alcanza el mismo resultado sin animación.

### Lo que no se cumplió del criterio de cierre

**El ritmo dramático no tiene veredicto del iPhone.** El dueño aceptó la sala
desplegada, pero nunca reportó si el giro se hace largo en el teléfono, y
producción sigue con **cero funciones**. Los ~13 s están medidos, no juzgados.
Queda para la primera noche de verdad, y si estorba se ajusta desde el cajón de
[La cabina y el historial](019-la-cabina-y-el-historial.md), que es justo donde
vive el control del ritmo.
