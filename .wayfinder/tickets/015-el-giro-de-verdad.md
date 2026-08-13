# El giro, de verdad

- **Tipo**: `wayfinder:task` (AFK, con aceptación HITL en el iPhone)
- **Estado**: abierto
- **Asignado**: —
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
