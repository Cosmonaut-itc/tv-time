# Entrar a la sala

- **Tipo**: `wayfinder:task` (AFK, con aceptación HITL en el iPhone)
- **Estado**: cerrado
- **Asignado**: sesión de Claude (orquestación) · `gpt-5.6-sol` (implementación y review)
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

## Resolución

**La sala abre con seis caracteres y nadie más entra.** Primera de las ocho
rebanadas del corte. Implementó `gpt-5.6-sol` en esfuerzo `high`, la revisó
adversarialmente el mismo modelo, y el orquestador vetó el diff y la aceptó en
pantalla. Llegó a producción en el corte de la v1.

### Lo que quedó construido

- **La taquilla** — [`convex/taquilla.ts`](../../convex/taquilla.ts) sobre el
  alfabeto de 32 de [La taquilla](007-la-taquilla.md), con `I`/`L` → `1` y
  `O` → `0` corregidos antes de buscar y sin distinguir mayúsculas. El freno de
  cinco fallos se cuenta **en Convex**, no en el navegador.
- **La butaca** — preguntada una vez por noche, con el corte de las 5 a.m. de
  México. Vive en el navegador como `{ butaca, noche }`; el esquema no se tocó.
- **El enlace autolimpiable** `/{codigo}`: guarda el código y deja la barra en `/`.
- **La siembra** — interna e idempotente. Resuelve los 38 títulos contra TMDB y
  crea la sala con sus dos butacas y los ajustes en *dramático*.
  *Sheep Detectives* entró **sin `tmdbId`** sin romper nada, que era su papel.
- **La estética** — paleta, tipografías y marquesina copiadas literales de
  [`prototypes/ritual-del-giro.html`](../../prototypes/ritual-del-giro.html).

### Las tres puertas que la review encontró abiertas

**`siembra:sembrar` era pública.** Convex publica toda función que no sea
`internal*`, y la URL del backend viaja en el bundle del cliente: un `curl`
anónimo devolvía el código de la sala, con lo que la taquilla entera era
decorativa. Pasó a interna. Aquí nació
[`tests/superficie-convex.test.ts`](../../tests/superficie-convex.test.ts), que
fija cuál es exactamente la superficie pública y acompañó a las siete rebanadas
siguientes.

**El freno dejaba fuera a la pareja legítima.** Consultaba el bloqueo *antes* de
buscar la sala, sobre una fila global: cinco códigos malos de cualquier
desconocido cerraban la sala cinco minutos, repetible sin límite. Ahora la sala
se busca primero, el código correcto entra siempre, y el freno sólo cuenta lo
que no abre nada.

**Y de paso olvidaba el código recordado** incluso ante un fallo de red. Ahora
sólo se olvida cuando el servidor dice que ese código no abre ninguna sala.

### Una decisión que no estaba en la pregunta

`agregadoPor` pasó a **opcional** y los 38 se siembran **sin autor**. La primera
entrega lo fabricaba alternando Félix y Sofía por índice, y
[El muro de pósters](017-el-muro-de-posters.md) enseña ese dato como «quién lo
agregó»: habría sido un registro inventado presentado como hecho. Nadie agregó
esos 38 desde la app. La ficha simplemente no pinta la línea gris cuando no hay
autor.

### Verificado

- Navegador a 390×844 contra el deployment de desarrollo: código en minúsculas
  normalizado, cinco fallos traban la taquilla **y el código correcto sigue
  entrando**, `/{codigo}` limpia la barra, y la butaca se guarda con el corte
  correcto de las 5:00 de México.
- `curl` anónimo: `siembra:*` responde «Could not find public function»;
  `taquilla:entrar` responde.
- Siembra comprobada por consulta independiente: 38 títulos, 7 sueltas, 3 series,
  sagas 12/6/4/2/2/2, 38 `agregado` distintos y crecientes, cero `agregadoPor`,
  y sólo *Sheep Detectives* sin póster.
- **En el iPhone real, contra `cine.felixddhs.dev`**: el dueño entró con el
  código de su sala. Es el criterio de cierre de esta rebanada, y está cumplido.

### Deuda anotada

El freno quedó partido en `convex/taquilla_logica.ts` con cinco dependencias
inyectadas para poder probarlo sin Convex. Es correcto y sus pruebas de
regresión valen, pero es más maquinaria de la necesaria en la pieza más crítica
del producto. Si estorba al leerla, se endereza en una limpieza posterior.
