# Entrar a la sala

- **Tipo**: `wayfinder:task` (AFK, con aceptación HITL en el iPhone)
- **Estado**: abierto
- **Asignado**: —
- **Bloqueado por**: —
- **Mapa**: [La sala de cine](../map.md)

## Question

La primera rebanada de [El corte de la v1](012-el-corte-de-la-v1.md). Al cerrar,
se escribe un código de 6 caracteres en `cine.felixddhs.dev`, se elige butaca y
se entra a una sala que ya tiene los 38 títulos dentro — aunque todavía no
dibuje nada más.

**Convex, lo que la taquilla necesita.** El esquema ya está empujado
([`convex/schema.ts`](../../convex/schema.ts)); falta la primera función de la
app. Entrar por código con el **freno del servidor** que exigió
[La taquilla](007-la-taquilla.md) — tras varios fallos seguidos la taquilla se
traba unos minutos, contado en Convex y no en el navegador. La corrección de lo
obvio antes de buscar (`I`/`L` → `1`, `O` → `0`, sin distinguir mayúsculas) y el
mensaje claro con código equivocado.

**La siembra.** Una mutación que corre una vez y escribe, desde una lista
versionada en el repo, los **38 títulos** de
[La lista de series](005-la-lista-de-series.md) — 7 sueltas, 3 series y 6 sagas
con sus 28 películas encadenadas por `orden`, todo por estreno, nada visto.
La siembra **también crea la sala**: sus dos butacas (Félix y Sofía), sus
ajustes arrancando en *dramático*, y escupe el código para que quede guardado.
No hay pantalla de crear sala en la v1 y no la va a haber.

Con los 38 llega el **primer momento de TMDB**: la siembra resuelve `tmdbId` y
`posterPath` de cada título contra la API y los guarda. *Sheep Detectives* entra
**sin `tmdbId`** — es el caso de prueba de un título sin póster oficial que
[La forma de los datos](006-la-forma-de-los-datos.md) admite a propósito, y
tiene que sobrevivir a la siembra sin romperla. El `TMDB_READ_TOKEN` vive sólo
en Convex; ninguna credencial toca el repo.

**La entrada.** El link que se limpia solo — `cine.felixddhs.dev/T4K9RM` guarda
el código y reemplaza la dirección por la raíz, para que no quede en la barra ni
en el historial ni en una captura. También se escribe a mano. Se recuerda para
siempre, con lo que iOS opina de «para siempre» ya documentado en la taquilla.

**La butaca.** Puerta de un toque, dos butacas grandes, obligatoria, preguntada
**una vez por noche** con el corte de las 5 a.m. Vive en el navegador junto al
código como `{ butaca, noche }` — no toca el esquema.

**La estética empieza aquí.** Se traduce del prototipo
[El ritual del giro](001-el-ritual-del-giro.md) tal cual: paleta, tipografía y
medidas se copian de [`prototypes/ritual-del-giro.html`](../../prototypes/ritual-del-giro.html);
la lógica se reescribe en React. El telón de entrada ya construido por
[La sala instalada](010-la-sala-instalada.md) sigue abriendo delante de todo.

**Fuera de esta rebanada**: rotar el código y el cajón de ajustes, que son de
[La cabina y el historial](019-la-cabina-y-el-historial.md), aunque el código se
guarde desde aquí.

Al cerrar: desplegada en `cine.felixddhs.dev` y comprobada entrando desde el
iPhone real, no sólo en local.
