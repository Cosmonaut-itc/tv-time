# El cajón del alta

- **Tipo**: `wayfinder:task` (AFK, con aceptación HITL en el iPhone)
- **Estado**: abierto
- **Asignado**: —
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
