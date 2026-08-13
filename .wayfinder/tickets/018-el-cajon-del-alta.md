# El cajón del alta

- **Tipo**: `wayfinder:task` (AFK, con aceptación HITL en el iPhone)
- **Estado**: cerrado
- **Asignado**: sesión de Claude (orquestación) · `gpt-5.6-sol` (implementación y review)
- **Bloqueado por**: [El muro de pósters](017-el-muro-de-posters.md)
- **Mapa**: [La sala de cine](../map.md)

## Question

La sala deja de depender de la siembra. Se traduce
[El alta de títulos](008-el-alta-de-titulos.md) y
[`prototypes/alta-de-titulos.html`](../../prototypes/alta-de-titulos.html), donde
las tres formas del alta ya se recorrieron en un navegador de verdad.

**El envase: un cajón que sube del foso**, con velo detrás y el catálogo al
fondo. Agregar es un paréntesis, no un viaje: la sala nunca se pierde de vista.
**Al agregar un título suelto el cajón se queda abierto** — la fila se sella en
dorado, cambia a ✓ y la búsqueda sigue viva. Se agrega de tres en tres; cierra
quien terminó. La autoría se muestra **una sola vez**, en el chip de la cabecera
—*Agrega FÉLIX ⇄*—, que además cambia de butaca de un toque.

**El segundo momento de TMDB: la búsqueda en vivo.** Se busca mientras se
escribe, esperando **220 ms** a que la mano pare. El campo se monta una sola vez
y sólo se repinta la lista de resultados, para poder teclear de corrido sin que
el foco salte ni el cursor se pierda a media palabra. Los resultados viejos se
quedan **atenuados** en lugar de desaparecer: la pantalla no parpadea entre
búsqueda y búsqueda. Mientras TMDB tarda corren tres focos de la marquesina y se
pintan cintas vacías del tamaño de los resultados — nada de ruedas giratorias,
el hueco tiene la forma de lo que va a llegar.

**La saga se arma uniendo, no importando.** Una colección de TMDB no alcanza y
eso es el caso normal, no la excepción — lo demostró
[La lista de series](005-la-lista-de-series.md): *Star Wars* son tres
colecciones más *Rogue One*, la Tierra Media son dos, los dragones son una más
un live action que en TMDB no pertenece a ninguna.

1. En los resultados, la primera película de cada colección lleva un **listón de
   latón**, una sola vez por colección y no bajo cada parte.
2. Dentro, **⛓ Añadir a esta saga** abre un selector con las demás colecciones
   **y las películas sueltas**.
3. La saga **siempre se reordena por fecha de estreno** y su nombre lo escribe
   la sala: «Star Wars», no «Star Wars: trilogía original». Cada parte sale con
   la ✕.
4. Lo que **aún no se estrena aparece en gris** y no se puede agregar — es la
   tercera regla de la lista, aplicada por la interfaz y no por la memoria. Es
   lo que va a dejar entrar *Dune: Parte Tres* el día que estrene.

**El punto de partida es una línea, no un formulario.** Entre película y
película hay una **línea de latón** que se toca: arriba queda lo ya visto,
apagado; abajo, lo que entra a la cartelera. El botón final lo dice en voz alta
— *Agregar 7 títulos · 3 en cartelera*. Ese corte es exactamente `visto: true`
sin ninguna función: la mitad sin fecha del historial.

**Los tres casos raros, todos decididos.** La saga puede entrar **como una sola
entrada** —*compite una vez, sin candado ni orden*—, y es un título normal sin
`saga` ni `orden`, con el `tmdbId` y el póster de la primera. Lo que TMDB no
encuentra **entra a mano**, con el nombre ya escrito en el formulario, marco
punteado y la nota *sin póster oficial*, y puede unirse a una saga existente.
Quitar de en medio de una saga **deja huecos en `orden`** (1, 2, 4…) y no hace
falta renumerar: el candado compara `orden <`, no cuenta.

**Reusa la hoja inferior** de [El ganador y la función](016-el-ganador-y-la-funcion.md)
al revés — el alta baja un cajón para meter títulos, el catálogo sube una hoja
para tocar uno. Es la tercera y última vez que esa pieza se usa: si aquí no
calza, calzaba mal desde el principio.

Al cerrar: desplegada, y **una saga nueva armada de verdad desde el iPhone**
uniendo al menos dos colecciones — es el único camino que la siembra nunca
ejercitó.

## Resolución

**La sala dejó de depender de la siembra.** Implementó `gpt-5.6-sol`·`high`,
review adversarial del mismo modelo, veto del orquestador y aceptación en
navegador a 390×844. PR 7 de la rama acumuladora.

### Las tres formas del alta, construidas

- **Suelto** — el cajón se queda abierto, sólo la fila agregada pasa a dorado y
  la búsqueda sigue viva. Agregar un título **no repinta la lista de
  resultados**, que era la mitad del punto.
- **Saga** — se arma **uniendo** colecciones y películas sueltas, se reordena
  siempre por fecha de estreno y el nombre lo escribe la sala. Reconoce una saga
  **ya catalogada por `tmdbId`** y continúa su `orden` sin renumerar, para no
  romper el candado de los títulos que ya estaban dentro.
- **Manual** — conserva el nombre que se buscó, entra con marco punteado y *sin
  póster oficial*, y puede unirse a una saga existente.

La línea de latón corta lo ya visto de lo que entra a la cartelera, y el botón
final lo dice en voz alta. Ese corte es exactamente `visto: true` sin ninguna
función — la mitad sin fecha del historial de
[La cabina y el historial](019-la-cabina-y-el-historial.md).

**El buscador se monta una sola vez** y sólo se repinta la lista: teclear de
corrido no pierde el cursor ni salta el foco. Los resultados viejos se quedan
atenuados en vez de desaparecer.

**Lo no estrenado sale en gris**, comparado contra **el día de México** y no
contra el reloj del aparato. Un título sin fecha en TMDB dice *«sin fecha»* en
vez de afirmar un estreno futuro que TMDB nunca dio.

### El servidor

Convex sumó `tmdb:buscar`, `tmdb:coleccion` y `titulos:altaEnLote`. **El lote
valida sala, butaca, catálogo y lugares de saga antes de escribir nada**, porque
todo lo que no es `internal*` lo alcanza un `fetch` anónimo. El
`TMDB_READ_TOKEN` se lee sólo de `process.env` dentro de la action; ninguna
credencial toca el repo.

### La hoja inferior, tercer uso

`app/hoja-inferior.tsx` se usó al revés —el alta baja un cajón, el catálogo sube
una hoja— y calzó con 14 líneas de cambio. Era la prueba que
[El ganador y la función](016-el-ganador-y-la-funcion.md) se había puesto a sí
misma: si aquí no calzaba, calzaba mal desde el principio.

### El alta, ejercitada de verdad

**El dueño armó Indiana Jones desde su iPhone y entró completa.** Producción
pasó de 38 a **43 títulos**: cinco películas en orden de estreno del 1 al 5, las
cinco con `agregadoPor: Félix` —el primer dato de autoría real del catálogo, que
la siembra deliberadamente no fabricó—, y ningún título existente tocado.

**El renglón del ticket queda a medias, y conviene decirlo:** pedía una saga
armada **uniendo al menos dos colecciones**, y las cinco de Indiana Jones son
una sola colección de TMDB. El camino recorrido es el del alta por colección; el
de **⛓ Añadir a esta saga** —unir una segunda colección o una película suelta,
que es lo que costó armar *Star Wars* de doce— **sigue sin ejercitarse en el
aparato**.

### Lo que destapó el primer alta real

La saga quedó nombrada **«Indiana Jones - Colección»**, que es el nombre que
TMDB le da a la colección y no el que escribiría la sala. No es un defecto: el
campo es editable y `abrirColeccion` sólo lo **precarga** con
`sagaExistente ?? respuesta.nombre`. Pero la precarga empuja hacia el nombre de
TMDB, y el ticket pedía lo contrario —«Star Wars», no «Star Wars: trilogía
original»—, así que el valor por omisión está tirando en contra de la regla.

Y no hay forma de arreglarlo desde dentro: la superficie de `convex/titulos.ts`
es `deSala`, `altaEnLote`, `marcarVisto` y `quitar`. **No existe renombrar una
saga**, así que corregir el nombre hoy obliga a quitar las cinco y volverlas a
dar de alta. Queda anotado; ninguna de las dos cosas se cambió sin decisión del
dueño.
