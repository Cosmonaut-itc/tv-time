# Otra sala

- **Tipo**: `wayfinder:task` (AFK, con aceptación HITL en el iPhone)
- **Estado**: abierto (construido; falta la aceptación en el iPhone)
- **Asignado**: sesión de Claude (orquestación) · `gpt-5.6-terra`·`medium` (implementación) · `gpt-5.6-sol`·`high` (review)
- **Bloqueado por**: [La cabina y el historial](019-la-cabina-y-el-historial.md)
- **Mapa**: [La sala de cine](../map.md)
- **Prototipo**: [`prototypes/otra-sala.html`](../../prototypes/otra-sala.html) (enlace jugable en los *Assets* del mapa)

## Question

El charting lo dejó dicho en una línea —**«multi-sala en el modelo de datos, sin
pantalla de "crear sala" en la v1»**— y la v1 cumplió las dos mitades: el
esquema es multi-sala de verdad y la única sala que existe nació de la siembra.
Esta rebanada construye la mitad que faltaba: **la superficie por donde nace una
sala nueva**.

**El modelo no se toca.** [`convex/schema.ts`](../../convex/schema.ts) ya lleva
`salaId` en `titulos`, `funciones` y `noches`; `salas.butacas` es un arreglo de
nombres y su comentario ya anticipaba esto: *«otra sala tendrá otros dos
nombres»*. Lo único que no existe es la puerta.

### Las cuatro decisiones del dueño

**Nace desde la cabina, no desde la taquilla.** La taquilla sigue siendo una
sola puerta con una sola pregunta. Crear una sala queda **detrás del código**,
que es la única credencial que este producto tiene — una puerta pública de
creación sería una fábrica de salas para cualquiera que llegue al dominio, y
[La taquilla](007-la-taquilla.md) construyó tres defensas justamente para que la
sala no dependa de la buena voluntad de internet.

**Nace vacía.** Sin títulos: **marquesina apagada** y el cajón del alta
esperando. Ese estado ya está construido y nombrado en
[Cuando la cartelera se queda corta](009-cuando-la-cartelera-se-queda-corta.md)
—*el catálogo agotado y la sala recién nacida*—, así que la sala nueva no
estrena pantalla: llega a una que ya la estaba esperando. Sembrarla con los 38
se descartó porque **esa lista es de esta sala**, no de todas; copiar el catálogo
de la sala actual se descartó porque duplica títulos que luego divergen sin que
nadie sepa cuál es cuál.

**Sus butacas se nombran al crearla.** Dos nombres escritos al nacer, que es lo
que el esquema previó. Heredar *Félix* y *Sofía* convertiría una sala para otras
personas en algo que miente sobre quién está adentro, y la butaca es exactamente
la pieza que le da voz a quien agrega un título.

**El aparato recuerda varias salas.** Un **llavero**: los códigos de las salas
visitadas se guardan en el navegador y se cambia entre ellas desde la cabina, de
un toque, sin volver a teclear. Hoy entrar a otra sala reemplaza la recordada;
con dos salas vivas eso sería perder una para ver la otra.

**Una sala se reconoce por sus dos butacas.** El prototipo lo destapó: `salas` no
tiene campo `nombre`, así que dos salas se dibujaban idénticas en el llavero. El
dueño lo resolvió sin inventar un campo —*«está bien que se identifique por
nombre de las butacas»*—, y es la respuesta correcta por lo que ya dice este
mismo ticket: las butacas se escriben al nacer justamente para no mentir sobre
quién está adentro. *Félix y Sofía* dice más de una sala que cualquier nombre que
alguien teclee una vez y no vuelva a leer.

### Lo que hay que decidir al construir

**El código nuevo lo genera Convex, nunca el navegador.** Ya está resuelto para
la rotación en [La cabina y el historial](019-la-cabina-y-el-historial.md) y la
creación usa el mismo camino: alfabeto de 32 sin ambigüedades, 6 caracteres, y la
unicidad **la defiende la mutación**, porque Convex no tiene índices únicos.

**El freno de la taquilla es una sola fila y ahora será un destino
compartido.** [`convex/schema.ts`](../../convex/schema.ts) lo dice sin rodeos:
*«la v1 tiene una sola taquilla y por eso una sola fila»*. Con dos salas vivas,
quien falle tres códigos traba la puerta **de todas**. Hay que verlo de frente al
construir: o el freno se cuenta por aparato además de global, o se asume el
destino compartido y se dice por qué.

**La sala nueva no puede robarle el aparato a la anterior.** Crear una sala no
debe expulsar de la que estás: se crea, se enseña el código —en grande y con qué
mandarlo, como ya hace la cabina— y **el aparato decide si se cambia o se
queda**. Es la misma lección de la rotación: el que hizo la maniobra se queda
dentro.

**Ninguna función pública puede aceptar ni devolver un código de sala.** Lo
vigila [`tests/superficie-convex.test.ts`](../../tests/superficie-convex.test.ts)
y esta rebanada añade una mutación que **crea** una — que es justo la forma de
romperlo sin querer.

**Fuera**: borrar una sala, invitar a alguien, y cualquier idea de dueño o
permisos. Las salas no tienen dueño porque el producto no tiene cuentas
—[el mapa lo cerró para siempre](../map.md)—; lo único que separa una sala de
otra es su código.

Al cerrar: desplegada, y **una sala nueva creada de verdad desde el iPhone**,
con sus dos butacas escritas, un título dado de alta dentro, y el llavero
volviendo a la sala original sin teclear el código.

## Lo construido

Implementó `gpt-5.6-terra`·`medium` —un escalón abajo del habitual, para gastar
menos en Codex—, con la exploración del repo hecha desde la sesión de Claude y
entregada como encargo cerrado; review adversarial de `gpt-5.6-sol`·`high`, veto
del orquestador sobre el diff entero y prueba en navegador a 390×844.

**La puerta está detrás del código.** `taquilla.crearSala` recibe `salaId` y
`codigoActual` y **comprueba la pertenencia antes de escribir nada**: es la misma
prueba que la rotación, por la misma razón —todo lo que no sea `internal*` en
Convex lo puede llamar cualquiera—. El código nuevo lo genera el servidor con
`elegirCodigoNuevo`, y `tests/superficie-convex.test.ts` sigue clavando la
superficie pública, con la mutación que crea salas anotada en la lista.

**La sala nueva nace vacía y no roba el aparato.** Se enseña su código en grande
con qué copiarlo, y el aparato elige entre entrar o quedarse. Quien se queda no
pierde nada: la sala ya está en el llavero.

**El llavero identifica por butacas** —*Félix y Sofía*, *Ana y Bruno*—, tal como
lo decidió el dueño, sin inventar un campo `nombre` en el esquema.

**El freno de la taquilla sigue siendo una sola fila y ahora es un destino
compartido**: cinco códigos fallados traban la puerta de todas las salas. Se
asume a sabiendas, porque el freno defiende la puerta —no la sala— y contarlo por
aparato lo volvería inútil justo contra quien tiene muchos aparatos. Con dos o
tres salas de la misma casa, trabarse a sí mismos cinco minutos es el costo.

### Lo que corrigió el review

- La sala **recién nacida no tenía cornisa**: los controles vivían dentro de la
  rama con títulos, así que la única sala sin títulos —la que este ticket crea—
  se quedaba sin cabina, sin llavero y sin manera de leer su propio código. Lo
  encontró el orquestador probando en el navegador, no el review.
- El llavero **dice si de verdad se guardó**: si el navegador niega el
  almacenamiento, la sala nueva ya no promete un llavero que no existe, y avisa
  que el código hay que copiarlo ahora. Misma lección que la rotación en
  [La cabina y el historial](019-la-cabina-y-el-historial.md).
- **La poda nunca desaloja la sala puesta**, y `leerLlavero` exige el contrato
  entero de cada llave —código, dos butacas con nombre, cuenta no negativa— y
  descarta repetidas.
- El servidor **limpia el formato invisible y normaliza a NFC** antes de comparar
  las butacas: dos nombres que la pantalla dibuja idénticos ya no entran juntos.
- El paso del código **recibe el foco** al aparecer y las butacas de la sala
  nueva son texto, no botones sin acción.

**Un límite aceptado**: el llavero guarda ocho salas y la novena desaloja a la
más vieja sin avisar. Se deja así porque el código de cada sala se enseña en
grande al nacer, con la advertencia de que es la única llave; y porque ocho salas
en un producto para dos personas es un escenario que no existe.

**Falta la aceptación**: desplegar y crear una sala de verdad desde el iPhone,
con sus dos butacas, un título dado de alta dentro, y volver a la sala original
desde el llavero sin teclear el código.
